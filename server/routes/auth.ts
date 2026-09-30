import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabaseAdmin as supabase, formatSupabaseError, snakeToCamel, camelToSnake } from '../db';
import {
  generateToken, generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry,
  REFRESH_TOKEN_EXPIRY_DAYS,
  requireAuth, authLimiter, getAdminEmails
} from '../middleware';
import { validateBody, signupSchema, signinSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../validation';
import { sendEmail, renderRecoveryEmail, renderWelcomeEmail } from '../email';
import { createDefaultProfile } from '../../shared/profileDefaults';

const router = Router();
const SALT_ROUNDS = 12;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

function setRefreshTokenCookie(res: any, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('acematric_refresh_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

function clearRefreshTokenCookie(res: any): void {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('acematric_refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });
  res.clearCookie('acematric_refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/auth',
  });
}

async function storeRefreshToken(userEmail: string, token: string): Promise<string | null> {
  const tokenHash = hashRefreshToken(token);
  const expiresAt = getRefreshTokenExpiry().toISOString();

  const { error } = await supabase
    .from('refresh_tokens')
    .insert([{
      user_email: userEmail,
      token_hash: tokenHash,
      expires_at: expiresAt,
    }]);

  if (error) {
    console.error('[auth] Failed to store refresh token:', error.message);
    return null;
  }
  return token;
}

async function issueRefreshToken(res: any, userEmail: string): Promise<string> {
  const refreshToken = generateRefreshToken();
  const stored = await storeRefreshToken(userEmail, refreshToken);
  if (!stored) {
    res.status(500).json({ error: 'Failed to create session' });
    return '';
  }
  setRefreshTokenCookie(res, refreshToken);
  return refreshToken;
}

async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token_hash', tokenHash);
}

async function revokeAllUserRefreshTokens(userEmail: string): Promise<void> {
  await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_email', userEmail)
    .is('revoked_at', null);
}

router.post('/signup', authLimiter, validateBody(signupSchema), async (req, res) => {
  try {
    const { email, password, name, stream } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userRole = getAdminEmails().includes(normalizedEmail) ? 'admin' : 'student';

    const { data: existingUser } = await supabase
      .from('users_auth')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists. Try logging in instead.' });
    }

    const { error: insertError } = await supabase
      .from('users_auth')
      .insert([{ email: normalizedEmail, password: hashedPassword, created_at: new Date().toISOString() }]);

    if (insertError) {
      return res.status(500).json({ error: 'An error occurred. Please try again.' });
    }

    const defaultProfile = createDefaultProfile({ email: normalizedEmail, name, stream, role: userRole });
    const { error: profileError } = await supabase
      .from('student_profiles')
      .upsert([camelToSnake(defaultProfile)]);

    if (profileError) {
      await supabase.from('users_auth').delete().eq('email', normalizedEmail);
      return res.status(500).json({ error: 'Failed to create profile. Please try again.' });
    }

    const token = generateToken({ email: normalizedEmail, name, role: userRole });
    const refreshToken = await issueRefreshToken(res, normalizedEmail);
    if (!refreshToken) return;

    // Send verification email
    const verificationCode = await issueVerificationCode(normalizedEmail);

    // Send welcome email (best effort)
    try {
      const appName = process.env.APP_NAME || 'AceMatric';
      await sendEmail({
        to: normalizedEmail,
        subject: `Welcome to ${appName}!`,
        html: renderWelcomeEmail(name, appName),
      });
    } catch (emailErr) {
      console.error('[auth] Failed to send welcome email:', emailErr);
    }

    res.json({
      success: true,
      profile: { ...defaultProfile, role: userRole },
      token,
      emailVerified: false,
      // never present in production
      ...(verificationCode ? { devCode: verificationCode } : {}),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.post('/signin', authLimiter, validateBody(signinSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const { data: matchedUser, error: authError } = await supabase
      .from('users_auth')
      .select('email,password,created_at,failed_attempts,locked_until,email_verified')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (authError) return res.status(500).json({ error: 'Something went wrong on our end. Try again in a bit.' });
    if (!matchedUser) return res.status(401).json({ error: 'Wrong email or password.' });

    // OAuth-only accounts have no password — never let bcrypt see a null hash
    if (!matchedUser.password) {
      return res.status(401).json({ error: 'Wrong email or password.' });
    }

    // Check account lockout
    if (matchedUser.locked_until && new Date(matchedUser.locked_until) > new Date()) {
      const remainingMin = Math.ceil((new Date(matchedUser.locked_until).getTime() - Date.now()) / 60000);
      return res.status(423).json({ error: `Account locked due to too many failed attempts. Try again in ${remainingMin} min.` });
    }

    const passwordValid = await bcrypt.compare(password, matchedUser.password);
    if (!passwordValid) {
      const attempts = (matchedUser.failed_attempts || 0) + 1;
      const maxAttempts = 10;
      const lockDuration = 15 * 60 * 1000; // 15 minutes

      const updateData: Record<string, any> = { failed_attempts: attempts };
      if (attempts >= maxAttempts) {
        updateData.locked_until = new Date(Date.now() + lockDuration).toISOString();
      }

      await supabase
        .from('users_auth')
        .update(updateData)
        .eq('email', normalizedEmail);

      return res.status(401).json({ error: 'Wrong email or password.' });
    }

    // Reset failed attempts on successful password check
    await supabase
      .from('users_auth')
      .update({ failed_attempts: 0, locked_until: null })
      .eq('email', normalizedEmail);

    const isEmailVerified = matchedUser.email_verified === true;
    let devCode: string | null = null;
    if (!isEmailVerified) {
      // Never auto-verify — issue a fresh code and make the user prove ownership
      devCode = await issueVerificationCode(normalizedEmail);
    }

    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) return res.status(500).json({ error: 'An error occurred. Please try again.' });

    if (!profile) {
    const userRole = getAdminEmails().includes(normalizedEmail) ? 'admin' : 'student';
      const defaultProfile = createDefaultProfile({ email: normalizedEmail, name: normalizedEmail.split('@')[0], role: userRole });
      const { error: recreateError } = await supabase
        .from('student_profiles')
        .upsert([camelToSnake(defaultProfile)]);
      if (recreateError) {
        return res.status(500).json({ error: 'Failed to create profile. Please try again.' });
      }
      const token = generateToken({ email: normalizedEmail, name: defaultProfile.name, role: userRole });
      const refreshToken = await issueRefreshToken(res, normalizedEmail);
      if (!refreshToken) return;
      return res.json({ success: true, profile: { ...defaultProfile, role: userRole }, token, emailVerified: isEmailVerified, ...(devCode ? { devCode } : {}) });
    }

    const userRole = (profile as any).role || 'student';
    const token = generateToken({ email: normalizedEmail, name: profile.name, role: userRole });
    const refreshToken = await issueRefreshToken(res, normalizedEmail);
    if (!refreshToken) return;
    res.json({ success: true, profile: { ...snakeToCamel(profile), role: userRole }, token, emailVerified: isEmailVerified, ...(devCode ? { devCode } : {}) });
  } catch (err: any) {
    res.status(500).json({ error: 'An error occurred. Please try again.' });
  }
});

router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const code = String(crypto.randomInt(100000, 999999));
    const codeHash = await bcrypt.hash(code, SALT_ROUNDS);
    const expiry = Date.now() + 10 * 60 * 1000;

    const { data: user, error: userError } = await supabase
      .from('users_auth')
      .select('email,password,created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) return res.status(500).json({ error: 'Failed to process request' });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a recovery code has been generated.' });
    }

    const { error: saveError } = await supabase
      .from('users_auth')
      .upsert([{
        email: normalizedEmail,
        password: user.password,
        created_at: user.created_at,
        recovery_code: codeHash,
        recovery_expiry: expiry
      }]);

    if (saveError) return res.status(500).json({ error: 'Failed to process request' });

    // Send recovery code via email
    const emailHtml = renderRecoveryEmail(code);
    await sendEmail({
      to: normalizedEmail,
      subject: `${process.env.APP_NAME || 'AceMatric'} — Password Recovery Code`,
      html: emailHtml,
    });

    // Always return 200 to prevent email enumeration
    res.json({ success: true, message: 'If an account exists, a recovery code has been sent to your email.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const { data: user, error: userError } = await supabase
      .from('users_auth')
      .select('email,password,created_at,recovery_code,recovery_expiry')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) return res.status(500).json({ error: 'Failed to process request' });
    if (!user) return res.status(400).json({ error: 'Invalid recovery code' });
    if (!user.recovery_code) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }

    // Verify recovery code with bcrypt
    const codeValid = await bcrypt.compare(code.trim(), user.recovery_code);
    if (!codeValid) {
      return res.status(400).json({ error: 'Invalid recovery code' });
    }

    if (user.recovery_expiry && Date.now() > Number(user.recovery_expiry)) {
      return res.status(400).json({ error: 'Recovery code expired' });
    }

    const { error: updateError } = await supabase
      .from('users_auth')
      .update({ password: hashedPassword, recovery_code: null, recovery_expiry: null })
      .eq('email', normalizedEmail);

    if (updateError) return res.status(500).json({ error: 'Failed to reset password' });
    await revokeAllUserRefreshTokens(normalizedEmail);
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/verify-token', requireAuth, async (req, res) => {
  try {
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('role')
      .eq('email', req.user!.email)
      .maybeSingle();

    const currentRole = (profile as any)?.role || 'student';
    res.json({ success: true, user: { ...req.user, role: currentRole } });
  } catch {
    res.json({ success: true, user: { ...req.user, role: 'student' } });
  }
});

router.post('/change-password', requireAuth, validateBody(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password has to be different from your current one.' });
    }

    const normalizedEmail = normalizeEmail(req.user!.email);

    const { data: user, error: userError } = await supabase
      .from('users_auth')
      .select('email,password,created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) return res.status(500).json({ error: 'Failed to process request' });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.password) {
      return res.status(400).json({ error: 'This account signs in with Google or Apple and has no password. Use password recovery to set one.' });
    }

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) return res.status(401).json({ error: 'That is not your current password.' });

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const { error: updateError } = await supabase
      .from('users_auth')
      .update({ password: hashedPassword })
      .eq('email', normalizedEmail);

    if (updateError) return res.status(500).json({ error: 'Failed to update password' });
    await revokeAllUserRefreshTokens(normalizedEmail);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const refreshToken = req.cookies?.acematric_refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token. Please log in.', code: 'NO_REFRESH_TOKEN' });
    }

    const tokenHash = hashRefreshToken(refreshToken);

    // Find the token record
    const { data: tokenRecord, error: lookupError } = await supabase
      .from('refresh_tokens')
      .select('id, user_email, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .single();

    if (lookupError || !tokenRecord) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Invalid refresh token. Please log in again.', code: 'INVALID_REFRESH_TOKEN' });
    }

    // Check if revoked
    if (tokenRecord.revoked_at) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Refresh token revoked. Please log in again.', code: 'REVOKED_REFRESH_TOKEN' });
    }

    // Check if expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'Refresh token expired. Please log in again.', code: 'EXPIRED_REFRESH_TOKEN' });
    }

    // Revoke old token (rotation)
    await revokeRefreshToken(tokenHash);

    // Look up the user's profile for the access token
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('name, role')
      .eq('email', tokenRecord.user_email)
      .maybeSingle();

    const userRole = (profile as any)?.role || 'student';
    const userName = (profile as any)?.name || tokenRecord.user_email.split('@')[0];

    // Issue new access token
    const newAccessToken = generateToken({
      email: tokenRecord.user_email,
      name: userName,
      role: userRole,
    });

    // Issue new refresh token (rotation)
    const newRefreshToken = generateRefreshToken();
    await storeRefreshToken(tokenRecord.user_email, newRefreshToken);
    setRefreshTokenCookie(res, newRefreshToken);

    res.json({ success: true, token: newAccessToken });
  } catch (err: any) {
    console.error('[auth] Refresh error:', err);
    res.status(500).json({ error: 'Failed to refresh session' });
  }
});

router.post('/logout', authLimiter, async (req, res) => {
  try {
    const refreshToken = req.cookies?.acematric_refresh_token;
    if (refreshToken) {
      await revokeRefreshToken(hashRefreshToken(refreshToken));
    }
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    clearRefreshTokenCookie(res);
    res.json({ success: true, message: 'Logged out successfully' });
  }
});

// ─── EMAIL VERIFICATION ──────────────────────────────────────────

function generateVerificationCode(): string {
  return String(crypto.randomInt(100000, 999999));
}

// Generates, stores and emails a 6-digit verification code.
// Returns the plaintext code in development (for the dev-code UI), null in production.
async function issueVerificationCode(email: string): Promise<string | null> {
  try {
    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase
      .from('users_auth')
      .update({ verification_code: codeHash, verification_expires_at: expiresAt })
      .eq('email', email);

    const appName = process.env.APP_NAME || 'AceMatric';
    await sendEmail({
      to: email,
      subject: `${appName} — Verify your email`,
      html: renderVerificationEmail(code, appName),
    });

    const devCode = process.env.NODE_ENV !== 'production' ? code : null;
    if (devCode) console.log(`[auth] Dev mode — verification code for ${email}: ${code}`);
    return devCode;
  } catch (err: any) {
    console.error('[auth] Failed to issue verification code:', err?.message || err);
    return null;
  }
}

function renderVerificationEmail(code: string, appName = 'AceMatric'): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;">
  <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;padding:32px;border:1px solid #334155;color:#f1f5f9;font-family:sans-serif;">
    <h1 style="font-size:20px;margin:0 0 12px;color:#2dd4bf;">Verify Your Email</h1>
    <p style="color:#94a3b8;font-size:14px;margin:0 0 20px;">Enter this 6-digit code to verify your email address:</p>
    <div style="text-align:center;margin:24px 0;">
      <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#f1f5f9;background:#334155;padding:16px 32px;border-radius:12px;display:inline-block;">${code}</span>
    </div>
    <p style="color:#64748b;font-size:12px;margin:0;">This code expires in 10 minutes. If you didn't create an account, ignore this email.</p>
    <p style="color:#475569;font-size:11px;margin:20px 0 0;">© ${new Date().getFullYear()} ${appName}</p>
  </div>
</body>
</html>`;
}

// POST /api/auth/send-verification — send or resend verification code
router.post('/send-verification', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const normalizedEmail = normalizeEmail(email);

    const { data: user, error: fetchError } = await supabase
      .from('users_auth')
      .select('email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) return res.status(500).json({ error: 'Something went wrong. Try again.' });

    // Always the same response whether or not the account exists (no enumeration)
    let devCode: string | null = null;
    if (user) {
      devCode = await issueVerificationCode(normalizedEmail);
    }

    res.json({
      success: true,
      message: 'If an account exists, a verification code has been sent.',
      ...(devCode ? { devCode } : {}),
    });
  } catch (err: any) {
    console.error('[auth] Send verification error:', err);
    res.status(500).json({ error: 'Failed to send verification code.' });
  }
});

// POST /api/auth/verify-email — verify the 6-digit code
router.post('/verify-email', authLimiter, async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required.' });
    if (String(code).length !== 6) return res.status(400).json({ error: 'Code must be 6 digits.' });

    const normalizedEmail = normalizeEmail(email);
    // Single failure message for every failure mode so responses can't be used
    // to discover which emails are registered.
    const invalidResponse = () =>
      res.status(400).json({ error: 'Invalid or expired code. Please request a new one.' });

    const { data: user, error: fetchError } = await supabase
      .from('users_auth')
      .select('email, verification_code, verification_expires_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (fetchError) return res.status(500).json({ error: 'Something went wrong. Try again.' });
    if (!user || !user.verification_code || !user.verification_expires_at) {
      return invalidResponse();
    }

    if (new Date(user.verification_expires_at) < new Date()) {
      return invalidResponse();
    }

    const codeValid = await bcrypt.compare(String(code).trim(), user.verification_code);
    if (!codeValid) {
      return invalidResponse();
    }

    await supabase
      .from('users_auth')
      .update({
        email_verified: true,
        verification_code: null,
        verification_expires_at: null,
      })
      .eq('email', normalizedEmail);

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (err: any) {
    console.error('[auth] Verify email error:', err);
    res.status(500).json({ error: 'Failed to verify email.' });
  }
});

// GET /api/auth/verification-status — check if email is verified
router.get('/verification-status', requireAuth, async (req, res) => {
  try {
    const email = (req as any).user?.email;
    if (!email) return res.status(401).json({ error: 'Not authenticated.' });

    const { data: user } = await supabase
      .from('users_auth')
      .select('email_verified')
      .eq('email', email)
      .maybeSingle();

    res.json({ success: true, verified: user?.email_verified || false });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to check verification status.' });
  }
});

export default router;
