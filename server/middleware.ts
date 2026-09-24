import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from './redis';

// SECURITY: Admin role cache — stale entries can grant/deny access incorrectly.
// MUST be invalidated when a user's role changes (call clearAdminCache).
const adminRoleCache = new Map<string, { role: string; expiry: number }>();
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function clearAdminCache(email?: string) {
  if (email) {
    adminRoleCache.delete(email);
  } else {
    adminRoleCache.clear();
  }
}

// DB-backed admin check (cached 5 min). Never trusts the JWT `role` claim,
// which can be stale or minted with an outdated value.
export async function isAdminUser(email: string): Promise<boolean> {
  const cached = adminRoleCache.get(email);
  if (cached && cached.expiry > Date.now()) {
    return cached.role === 'admin';
  }
  try {
    const { supabaseAdmin } = await import('./db');
    const { data: profile } = await supabaseAdmin
      .from('student_profiles')
      .select('role')
      .eq('email', email)
      .maybeSingle();

    const dbRole = (profile as any)?.role || 'student';
    adminRoleCache.set(email, { role: dbRole, expiry: Date.now() + ADMIN_CACHE_TTL_MS });
    return dbRole === 'admin';
  } catch (err) {
    console.error('[middleware] isAdminUser: DB lookup failed, denying admin privileges');
    return false;
  }
}

function getRedisStore() {
  if (!redis) return undefined;
  return new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args) as Promise<any>,
  });
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[middleware] Set a strong JWT_SECRET in environment variables');
    process.exit(1);
  }
  return secret;
}

// Access token: 15 minutes (short-lived)
const ACCESS_TOKEN_EXPIRY = '15m';
// Refresh token: 30 days (long-lived, stored in httpOnly cookie)
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
const REFRESH_TOKEN_EXPIRY_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  email: string;
  name: string;
  role?: string;
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/** Generate a cryptographically secure opaque refresh token */
export function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

/** Hash a refresh token for storage (SHA-256) */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Get the expiry timestamp for refresh tokens */
export function getRefreshTokenExpiry(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as AuthPayload;
  } catch {
    return null;
  }
}

// Parse admin emails lazily — process.env is populated by dotenv after module evaluation
export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// Middleware: requires valid JWT in Authorization header
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please log in.', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.', code: 'TOKEN_EXPIRED' });
  }

  req.user = payload;
  next();
}

// Middleware: requires admin role — revalidates against DB (cached 5 min)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, async () => {
    if (res.headersSent) return;
    if (!req.user) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    const email = req.user.email;
    const cached = adminRoleCache.get(email);
    if (cached && cached.expiry > Date.now()) {
      if (cached.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
      }
      return next();
    }

    try {
      const { supabaseAdmin } = await import('./db');
      const { data: profile } = await supabaseAdmin
        .from('student_profiles')
        .select('role')
        .eq('email', email)
        .maybeSingle();

      const dbRole = (profile as any)?.role || 'student';
      adminRoleCache.set(email, { role: dbRole, expiry: Date.now() + ADMIN_CACHE_TTL_MS });

      if (dbRole !== 'admin') {
        return res.status(403).json({ error: 'Admin access required.' });
      }
      next();
    } catch (err) {
      console.error('[middleware] requireAdmin: DB lookup failed, denying access');
      return res.status(503).json({ error: 'Unable to verify admin status. Please try again later.' });
    }
  });
}

// Rate limiters — use Redis store when available (shared across instances)
function rateLimitOpts(opts: { windowMs: number; max: number; message: any }) {
  return {
    ...opts,
    standardHeaders: true,
    legacyHeaders: false,
    store: getRedisStore(),
  };
}

export const authLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 5 : 50,
  message: { error: 'Too many requests. Please try again later.' },
}));

export const aiLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many AI requests. Please try again later.' },
}));

export const globalLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
}));

export const contactLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: 'Too many contact form submissions. Please try again later.' },
}));

export const collaborationLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many room requests. Please try again later.' },
}));

export const paymentLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many payment requests. Please try again later.' },
}));

export const uploadLimiter = rateLimit(rateLimitOpts({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Too many uploads. Please try again later.' },
}));
