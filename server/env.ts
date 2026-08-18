const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
];

const RECOMMENDED_VARS = [
  'ADMIN_EMAILS',
  'RESEND_API_KEY',
  'GEMINI_API_KEY',
  'REDIS_URL',
];

const SECRET_PLACEHOLDERS = [
  'your-supabase-url',
  'your-api-key',
  'change-in-production',
  'MY_GEMINI_API_KEY',
  'your-resend-api-key',
];

export function validateEnv(): void {
  console.log('[env] Validating environment variables...');

  const missing: string[] = [];
  const weak: string[] = [];

  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value) {
      missing.push(varName);
    } else if (SECRET_PLACEHOLDERS.some(p => value.includes(p))) {
      weak.push(varName);
    }
  }

  for (const varName of RECOMMENDED_VARS) {
    const value = process.env[varName];
    if (!value) {
      console.warn(`[env] Optional var ${varName} not set — some features may be unavailable`);
    } else if (SECRET_PLACEHOLDERS.some(p => value.includes(p))) {
      weak.push(varName);
    }
  }

  if (missing.length > 0) {
    console.error(`[env] FATAL: Missing required env vars: ${missing.join(', ')}`);
    console.error('[env] Set these in your .env file. See .env.example for reference.');
    process.exit(1);
  }

  if (weak.length > 0) {
    console.warn(`[env] WARNING: These vars contain placeholder values: ${weak.join(', ')}`);
    console.warn('[env] Replace them with real values before deploying to production.');
  }

  // Validate JWT_SECRET strength
  const jwtSecret = process.env.JWT_SECRET || '';
  if (jwtSecret.length < 32) {
    console.warn('[env] WARNING: JWT_SECRET is shorter than 32 characters. Use a stronger secret for production.');
  }

  // Validate ALLOWED_ORIGINS in production
  if (process.env.NODE_ENV === 'production') {
    const origins = process.env.ALLOWED_ORIGINS;
    if (!origins) {
      console.warn('[env] WARNING: ALLOWED_ORIGINS not set in production. CORS will use default origins.');
    } else if (origins.includes('localhost')) {
      console.warn('[env] WARNING: ALLOWED_ORIGINS contains localhost in production.');
    }
  }

  console.log('[env] Environment validation passed');
}
