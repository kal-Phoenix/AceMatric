import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { supabaseAdmin as supabase, formatSupabaseError, snakeToCamel, camelToSnake } from '../db';
import { generateToken, generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry, authLimiter, getAdminEmails } from '../middleware';
import { sendEmail, renderWelcomeEmail } from '../email';
import { createDefaultProfile } from '../../shared/profileDefaults';

const router = Router();

const SALT_ROUNDS = 12;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function setRefreshTokenCookie(res: any, token: string, req?: any): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction && Boolean(req?.secure || req?.headers?.['x-forwarded-proto'] === 'https');
  res.cookie('acematric_refresh_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

async function storeRefreshToken(userEmail: string, token: string): Promise<string | null> {
  const tokenHash = hashRefreshToken(token);
  const expiresAt = getRefreshTokenExpiry().toISOString();
  const { error } = await supabase
    .from('refresh_tokens')
    .insert([{ user_email: userEmail, token_hash: tokenHash, expires_at: expiresAt }]);
  if (error) {
    console.error('[auth-apple] Failed to store refresh token:', error.message);
    return null;
  }
  return token;
}

async function verifyAppleIdToken(idToken: string): Promise<{ email: string; name: string; appleId: string } | null> {
  try {
    // Dynamically import apple-signin-auth to handle module resolution
    const appleAuth = await import('apple-signin-auth');

    const appleResponse = await appleAuth.default.verifyIdToken(idToken, {
      audience: process.env.APPLE_CLIENT_ID,
      ignoreExpiration: false,
    });

    const email = appleResponse.email || undefined;
    const appleId = appleResponse.sub;

    if (!appleId) return null;

    // Apple may not provide email if user chose to hide it
    // In that case, use the Apple ID as a fallback identifier
    const resolvedEmail = email || `${appleId}@privaterelay.appleid.com`;

    return {
      email: resolvedEmail,
      name: email ? email.split('@')[0] : 'Apple User',
      appleId,
    };
  } catch (err: any) {
    console.error('[auth-apple] Token verification failed:', err.message);
    return null;
  }
}

// POST /api/auth/apple — sign in with Apple ID token
router.post('/', authLimiter, async (req, res) => {
  try {
    const { idToken, fullName } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Apple ID token is required' });
    }

    const appleUser = await verifyAppleIdToken(idToken);
    if (!appleUser) {
      return res.status(401).json({ error: 'Invalid Apple ID token' });
    }

    const email = normalizeEmail(appleUser.email);
    const name = fullName || appleUser.name;
    const appleId = appleUser.appleId;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users_auth')
      .select('email,provider,provider_id')
      .eq('email', email)
      .maybeSingle();

    let isNewUser = false;

    if (existingUser) {
      // Link Apple account if not already linked
      if (!existingUser.provider || existingUser.provider === 'email') {
        await supabase
          .from('users_auth')
          .update({ provider: 'apple', provider_id: appleId })
          .eq('email', email);
      }
    } else {
      // Create new user
      isNewUser = true;
      const { error: insertError } = await supabase
        .from('users_auth')
        .insert([{
          email,
          provider: 'apple',
          provider_id: appleId,
          email_verified: true, // Apple already verified ownership of this address
          created_at: new Date().toISOString(),
        }]);

      if (insertError) {
        console.error('[auth-apple] Failed to create user:', insertError);
        return res.status(500).json({ error: formatSupabaseError(insertError) });
      }

      // Create profile
      const userRole = getAdminEmails().includes(email) ? 'admin' : 'student';
      const defaultProfile = createDefaultProfile({ email, name, role: userRole });
      const { error: profileError } = await supabase
        .from('student_profiles')
        .upsert([camelToSnake(defaultProfile)]);

      if (profileError) {
        console.error('[auth-apple] Failed to create profile:', profileError);
        await supabase.from('users_auth').delete().eq('email', email);
        return res.status(500).json({ error: `Failed to create profile: ${formatSupabaseError(profileError)}` });
      }

      // Send welcome email (best effort)
      try {
        const appName = process.env.APP_NAME || 'AceMatric';
        await sendEmail({
          to: email,
          subject: `Welcome to ${appName}! 🎉`,
          html: renderWelcomeEmail(name, appName),
        });
      } catch (emailErr) {
        console.error('[auth-apple] Failed to send welcome email:', emailErr);
      }
    }

    // Fetch profile
    const { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    const userRole = (profile as any)?.role || 'student';
    const userName = (profile as any)?.name || name;

    // Issue tokens
    const token = generateToken({ email, name: userName, role: userRole });
    const refreshToken = generateRefreshToken();
    const stored = await storeRefreshToken(email, refreshToken);
    if (!stored) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    setRefreshTokenCookie(res, refreshToken, req);

    const profileData = profile ? snakeToCamel(profile) : createDefaultProfile({ email, name: userName, role: userRole });

    res.json({
      success: true,
      token,
      isNewUser,
      profile: { ...profileData, role: userRole },
    });
  } catch (err: any) {
    console.error('[auth-apple] Error:', err);
    res.status(500).json({ error: formatSupabaseError(err) });
  }
});

export default router;
