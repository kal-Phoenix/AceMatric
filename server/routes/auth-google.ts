import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { supabaseAdmin as supabase, snakeToCamel, camelToSnake } from '../db';
import { generateToken, generateRefreshToken, hashRefreshToken, getRefreshTokenExpiry, getAdminEmails } from '../middleware';
import { sendEmail, renderWelcomeEmail } from '../email';
import { createDefaultProfile } from '../../shared/profileDefaults';

const router = Router();

function getGoogleClient(redirectUri?: string): OAuth2Client {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || process.env.GOOGLE_REDIRECT_URI || `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/google/callback`
  );
}

function isSafeRedirectPath(path: string): boolean {
  if (!path || typeof path !== 'string') return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  if (/^https?:\/\//i.test(path)) return false;
  return true;
}

function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function getRedirectUri(req: any): string {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.get('host');
  return `${protocol}://${host}/api/auth/google/callback`;
}

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
    console.error('[auth-google] Failed to store refresh token:', error.message);
    return null;
  }
  return token;
}

// GET /api/auth/google — redirect to Google OAuth consent screen
router.get('/', (req, res) => {
  try {
    if (!isGoogleConfigured()) {
      console.error('[auth-google] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set');
      return res.redirect('/?error=google_auth_config');
    }

    const redirectUri = getRedirectUri(req);
    const client = getGoogleClient(redirectUri);

    const url = client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['openid', 'email', 'profile'],
      redirect_uri: redirectUri,
      state: isSafeRedirectPath(req.query.returnTo as string) ? (req.query.returnTo as string) : '/',
    });

    res.redirect(url);
  } catch (err: any) {
    console.error('[auth-google] Error generating auth URL:', err);
    res.redirect('/?error=google_auth_config');
  }
});

// GET /api/auth/google/callback — handle OAuth callback
router.get('/callback', async (req, res) => {
  const returnTo = (req.query.state as string) || '/';

  try {
    const { code, error: googleError } = req.query;
    if (googleError || !code) {
      return res.redirect(`${returnTo}?error=google_cancelled`);
    }

    const redirectUri = getRedirectUri(req);
    const client = getGoogleClient(redirectUri);

    const { tokens } = await client.getToken({
      code: code as string,
      redirect_uri: redirectUri,
    });

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.redirect(`${returnTo}?error=google_no_email`);
    }

    const email = normalizeEmail(payload.email);
    const name = payload.name || email.split('@')[0];
    const avatarUrl = payload.picture || undefined;
    const googleId = payload.sub;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users_auth')
      .select('email,provider,provider_id')
      .eq('email', email)
      .maybeSingle();

    let isNewUser = false;

    if (existingUser) {
      // Link Google account if not already linked
      if (!existingUser.provider || existingUser.provider === 'email') {
        await supabase
          .from('users_auth')
          .update({ provider: 'google', provider_id: googleId, avatar_url: avatarUrl })
          .eq('email', email);
      }
    } else {
      // Create new user
      isNewUser = true;
      const { error: insertError } = await supabase
        .from('users_auth')
        .insert([{
          email,
          provider: 'google',
          provider_id: googleId,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString(),
        }]);

      if (insertError) {
        console.error('[auth-google] Failed to create user:', insertError);
        return res.redirect(`${returnTo}?error=google_signup_failed`);
      }

      // Create profile
      const userRole = getAdminEmails().includes(email) ? 'admin' : 'student';
      const defaultProfile = createDefaultProfile({ email, name, role: userRole, avatarUrl });
      const { error: profileError } = await supabase
        .from('student_profiles')
        .upsert([camelToSnake(defaultProfile)]);

      if (profileError) {
        console.error('[auth-google] Failed to create profile:', profileError);
        await supabase.from('users_auth').delete().eq('email', email);
        return res.redirect(`${returnTo}?error=google_profile_failed`);
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
        console.error('[auth-google] Failed to send welcome email:', emailErr);
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
      return res.redirect(`${returnTo}?error=google_session_failed`);
    }
    setRefreshTokenCookie(res, refreshToken, req);

    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction && Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https');

    res.cookie('auth_token', token, {
      httpOnly: false, // allow frontend to read if needed
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 300000, // 5 minutes
      path: '/',
    });

    const params = new URLSearchParams({
      token,
      isNewUser: String(isNewUser),
    });

    res.redirect(`/auth/callback?${params.toString()}`);
  } catch (err: any) {
    console.error('[auth-google] Callback error:', err);
    res.redirect(`${returnTo}?error=google_auth_failed`);
  }
});

export default router;
