import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { supabase, formatSupabaseError, snakeToCamel, camelToSnake } from '../db';
import {
  generateToken, generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry,
  REFRESH_TOKEN_EXPIRY_DAYS,
  requireAuth, authLimiter, getAdminEmails
} from '../middleware';
import { validateBody, signupSchema, signinSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from '../validation';
import { sendEmail, renderRecoveryEmail } from '../email';

const router = Router();
const SALT_ROUNDS = 12;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

// ── Refresh Token Helpers ────────────────────────────────────────────────────

function setRefreshTokenCookie(res: any, token: string): void {
  res.cookie('acematric_refresh_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  });
}

function clearRefreshTokenCookie(res: any): void {
  res.clearCookie('acematric_refresh_token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
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

function createDefaultProfile(email: string, name: string, stream?: string, role?: string) {
  return {
    email,
    name,
    stream: stream || 'Natural Science',
    isPremium: false,
    streakDays: 0,
    dailyQuestionsUsed: 0,
    dailyQuestionsCap: 10,
    examReadinessScore: 0,
    subjectsPerformance: {},
    savedQuestionIds: [],
    completedMockIds: [],
    telegramConnected: false,
    studyStyle: 'Practice / Quiz',
    dailyHours: 3,
    avatar: '🎓',
    bio: 'Consistency over intensity. Aiming for Top 1% national rank.',
    school: 'Ethiopian School',
    region: 'Addis Ababa',
    customRoadmap: '',
    weakSubjects: ['Physics', 'Mathematics'],
    targetScore: 520,
    role: role || 'student',
    dailyProgressDate: '',
    studiedChapters: [],
    proStudyAudit: '',
    activeGrade: 12,
  };
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────

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
      return res.status(409).json({ error: 'If an account exists, it has already been registered. Please try logging in or resetting your password.' });
    }

    const { error: insertError } = await supabase
      .from('users_auth')
      .insert([{ email: normalizedEmail, password: hashedPassword, created_at: new Date().toISOString() }]);

    if (insertError) {
      return res.status(500).json({ error: formatSupabaseError(insertError) });
    }

    const defaultProfile = createDefaultProfile(normalizedEmail, name, stream, userRole);
    const { error: profileError } = await supabase
      .from('student_profiles')
      .upsert([camelToSnake(defaultProfile)]);

    if (profileError) {
      await supabase.from('users_auth').delete().eq('email', normalizedEmail);
      return res.status(500).json({ error: `Failed to create profile: ${formatSupabaseError(profileError)}` });
    }

    const token = generateToken({ email: normalizedEmail, name, role: userRole });
    const refreshToken = await issueRefreshToken(res, normalizedEmail);
    if (!refreshToken) return;
    res.json({ success: true, profile: { ...defaultProfile, role: userRole }, token });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── POST /api/auth/signin ────────────────────────────────────────────────────

router.post('/signin', authLimiter, validateBody(signinSchema), async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const { data: matchedUser, error: authError } = await supabase
      .from('users_auth')
      .select('email,password,created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (authError) return res.status(500).json({ error: formatSupabaseError(authError) });
    if (!matchedUser) return res.status(401).json({ error: 'Invalid email or password' });

    const passwordValid = await bcrypt.compare(password, matchedUser.password);
    if (!passwordValid) return res.status(401).json({ error: 'Invalid email or password' });

    const { data: profile, error: profileError } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (profileError) return res.status(500).json({ error: formatSupabaseError(profileError) });

    if (!profile) {
    const userRole = getAdminEmails().includes(normalizedEmail) ? 'admin' : 'student';
      const defaultProfile = createDefaultProfile(normalizedEmail, normalizedEmail.split('@')[0], undefined, userRole);
      const { error: recreateError } = await supabase
        .from('student_profiles')
        .upsert([camelToSnake(defaultProfile)]);
      if (recreateError) {
        return res.status(500).json({ error: `Profile recreation failed: ${formatSupabaseError(recreateError)}` });
      }
      const token = generateToken({ email: normalizedEmail, name: defaultProfile.name, role: userRole });
      const refreshToken = await issueRefreshToken(res, normalizedEmail);
      if (!refreshToken) return;
      return res.json({ success: true, profile: { ...defaultProfile, role: userRole }, token });
    }

    const userRole = (profile as any).role || 'student';
    const token = generateToken({ email: normalizedEmail, name: profile.name, role: userRole });
    const refreshToken = await issueRefreshToken(res, normalizedEmail);
    if (!refreshToken) return;
    res.json({ success: true, profile: { ...snakeToCamel(profile), role: userRole }, token });
  } catch (err: any) {
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────

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

// ── POST /api/auth/reset-password ────────────────────────────────────────────

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

// ── POST /api/auth/verify-token ──────────────────────────────────────────────

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

// ── POST /api/auth/change-password ───────────────────────────────────────────

router.post('/change-password', requireAuth, validateBody(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    const normalizedEmail = normalizeEmail(req.user!.email);

    const { data: user, error: userError } = await supabase
      .from('users_auth')
      .select('email,password,created_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userError) return res.status(500).json({ error: 'Failed to process request' });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordValid = await bcrypt.compare(currentPassword, user.password);
    if (!passwordValid) return res.status(401).json({ error: 'Current password is incorrect' });

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

// ── POST /api/auth/refresh ───────────────────────────────────────────────────
// Rotate the refresh token: validate current cookie token, issue new access + refresh token pair

router.post('/refresh', async (req, res) => {
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

// ── POST /api/auth/logout ────────────────────────────────────────────────────

router.post('/logout', async (req, res) => {
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

export default router;
