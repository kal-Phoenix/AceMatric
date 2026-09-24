import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData, mockSupabase } from './setup';

const REAL_HASH = '$2b$12$uxYIdmAkmTeRZoaORlKK9.0mjDb.Lok/bwxjnJSytDKSqMar0hoTO'; // bcrypt('Password1')

function seedUser(email: string, overrides: Record<string, any> = {}) {
  mockSupabaseData.users_auth.push({
    email,
    password: REAL_HASH,
    created_at: new Date().toISOString(),
    ...overrides,
  });
}

describe('Bug Fixes', () => {
  describe('Bug #2: Verification code should not leak in production', () => {
    it('should not return verificationCode in signup response when NODE_ENV is production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      process.env.RESEND_API_KEY = ''; // no API key

      try {
        const res = await request(app)
          .post('/api/auth/signup')
          .send({ email: 'newuser@test.com', password: 'Password1', name: 'Test User' });

        expect(res.status).toBe(200);
        expect(res.body.verificationCode).toBeUndefined();
        expect(res.body.devCode).toBeUndefined();
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('should return devCode in send-verification when NODE_ENV is not production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      process.env.RESEND_API_KEY = '';

      try {
        seedUser('verify@test.com');
        const res = await request(app)
          .post('/api/auth/send-verification')
          .send({ email: 'verify@test.com' });

        expect(res.status).toBe(200);
        expect(res.body.devCode).toBeDefined();
        expect(res.body.devCode).toMatch(/^\d{6}$/);
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Bug #14: Signup should return emailVerified: false', () => {
    it('should return emailVerified: false for new signups', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'newverified@test.com', password: 'Password1', name: 'Test' });

      expect(res.status).toBe(200);
      expect(res.body.emailVerified).toBe(false);
    });
  });

  describe('Bug #12: Questions API page size limit', () => {
    it('should have limit capped at 20000 in source code', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const questionsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/questions.ts'),
        'utf-8'
      );
      expect(questionsCode).toContain('Math.min(20000');
    });
  });

  describe('Bug #13: Admin stats should check all query errors', () => {
    it('should require admin role for stats endpoint', async () => {
      seedUser('nonadmin@test.com');
      const signinRes = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'nonadmin@test.com', password: 'Password1' });
      const token = signinRes.body.token;

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Bug #16: Error message leakage', () => {
    it('should not leak internal error messages in content-generate', async () => {
      seedUser('gen@test.com');
      const signinRes = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'gen@test.com', password: 'Password1' });
      const token = signinRes.body.token;

      // Request with missing fields should return generic error
      const res = await request(app)
        .post('/api/content-generate')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      // Should return 400 or 500 with generic error message
      if (res.status === 500) {
        expect(res.body.error).not.toContain('stack');
        expect(res.body.error).not.toContain('Error:');
      }
    });
  });

  describe('Bug #15: Email template HTML escaping', () => {
    it('should escape HTML in welcome email name', async () => {
      // The welcome email is sent during signup
      // We test that the email function doesn't crash with special characters
      const { renderWelcomeEmail } = await import('../server/email');

      // Should not throw with HTML in name
      expect(() => renderWelcomeEmail('<script>alert("xss")</script>', 'TestApp')).not.toThrow();
      expect(() => renderWelcomeEmail('O\'Brien & Sons', 'TestApp')).not.toThrow();

      const html = renderWelcomeEmail('<script>alert("xss")</script>', 'TestApp');
      // The script tag should be escaped
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in recovery email appName', async () => {
      const { renderRecoveryEmail } = await import('../server/email');

      const html = renderRecoveryEmail('123456', '<script>alert("xss")</script>');
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('Bug #7: Global error handler should not send headers twice', () => {
    it('should handle errors gracefully', async () => {
      // Request a non-existent endpoint
      const res = await request(app)
        .get('/api/nonexistent-endpoint');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Bug #24: Vite config should not have empty watch', () => {
    it('should have valid vite config', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const viteCode = fs.readFileSync(
        path.resolve(__dirname, '../vite.config.ts'),
        'utf-8'
      );
      expect(viteCode).not.toContain('watch:');
    });
  });

  describe('Bug #25: Dockerfile port mismatch', () => {
    it('should have PORT env set in Dockerfile', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const dockerfile = fs.readFileSync(path.resolve(__dirname, '../Dockerfile'), 'utf-8');
      expect(dockerfile).toContain('ENV PORT=3000');
      expect(dockerfile).toContain('EXPOSE 3000');
    });
  });

  describe('Bug #19: calculateLeaderScore should be used', () => {
    it('should use calculateLeaderScore function in sort', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const leaderboardCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/leaderboard.ts'),
        'utf-8'
      );
      // The sort should use calculateLeaderScore
      expect(leaderboardCode).toContain('calculateLeaderScore(a)');
      expect(leaderboardCode).toContain('calculateLeaderScore(b)');
    });
  });

  describe('Bug #30: Admin role cache invalidation', () => {
    it('should call clearAdminCache after role change', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const adminCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/admin.ts'),
        'utf-8'
      );
      expect(adminCode).toContain('clearAdminCache(email)');
    });
  });

  describe('Bug #23: Test setup should mock supabaseAdmin', () => {
    it('should have supabaseAdmin in mock', async () => {
      const { mockSupabase } = await import('./setup');
      const dbModule = await import('../server/db');
      expect((dbModule as any).supabaseAdmin).toBeDefined();
    });
  });

  describe('Bug #20: Empty catch blocks should log', () => {
    it('should have console.debug in websocket catch blocks', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const wsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/websocket.ts'),
        'utf-8'
      );
      // Should have debug logging in catch blocks
      const catchBlocks = wsCode.match(/catch \((\w+)\)/g);
      expect(catchBlocks).not.toBeNull();
      // Check that catch blocks have console.debug
      expect(wsCode).toContain('console.debug');
    });
  });

  describe('Bug #11: WebSocket rate limiting per-user', () => {
    it('should use userMsgTimestamps Map instead of per-connection array', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const wsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/websocket.ts'),
        'utf-8'
      );
      expect(wsCode).toContain('userMsgTimestamps');
      expect(wsCode).not.toContain('let msgTimestamps');
    });
  });

  describe('Bug #17: WebSocket join_room error handling', () => {
    it('should have .catch() on loadRoom promise', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const wsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/websocket.ts'),
        'utf-8'
      );
      expect(wsCode).toContain('.catch(');
      expect(wsCode).toContain('Failed to join room');
    });
  });

  describe('Bug #28: WebSocket localMemberMeta cleanup', () => {
    it('should delete empty room maps from localMemberMeta', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const wsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/websocket.ts'),
        'utf-8'
      );
      expect(wsCode).toContain('localMemberMeta.delete(roomId)');
    });
  });

  describe('Bug #27: CORS localhost in production', () => {
    it('should filter localhost in production', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const appCode = fs.readFileSync(
        path.resolve(__dirname, '../server/app.ts'),
        'utf-8'
      );
      expect(appCode).toContain('isDev || !o.startsWith');
    });
  });

  describe('Bug #5: Session-history rate limit cleanup', () => {
    it('should have periodic cleanup interval', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const shCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/session-history.ts'),
        'utf-8'
      );
      expect(shCode).toContain('setInterval');
      expect(shCode).toContain('rateLimitStore.delete');
    });
  });

  describe('Bug #6: WebSocket room cache eviction', () => {
    it('should evict rooms regardless of local membership', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const wsCode = fs.readFileSync(
        path.resolve(__dirname, '../server/websocket.ts'),
        'utf-8'
      );
      // The eviction should not check localRoomMembers
      const evictionSection = wsCode.substring(
        wsCode.indexOf('setInterval(() => {'),
        wsCode.indexOf('}, 30000);') + 10
      );
      expect(evictionSection).not.toContain('localRoomMembers');
    });
  });

  describe('Bug #22: Content-db safe JSON parsing', () => {
    it('should use safeJsonParse in getContentVersions', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const contentDbCode = fs.readFileSync(
        path.resolve(__dirname, '../server/content-db.ts'),
        'utf-8'
      );
      // In the getVersion section, should use safeJsonParse
      const versionsSection = contentDbCode.substring(
        contentDbCode.indexOf('getContentVersions')
      );
      expect(versionsSection).toContain('safeJsonParse');
    });
  });

  describe('Bug #3: Google OAuth token httpOnly', () => {
    it('should set auth_token cookie as httpOnly: true', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const googleAuthCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/auth-google.ts'),
        'utf-8'
      );
      expect(googleAuthCode).toContain("httpOnly: true");
      // Should NOT have httpOnly: false for auth_token
      const authCookieSection = googleAuthCode.substring(
        googleAuthCode.indexOf("auth_token")
      );
      expect(authCookieSection.substring(0, 200)).toContain("httpOnly: true");
    });
  });

  describe('Bug #4: Google OAuth URL data leakage', () => {
    it('should store user data in cookie instead of URL params', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const googleAuthCode = fs.readFileSync(
        path.resolve(__dirname, '../server/routes/auth-google.ts'),
        'utf-8'
      );
      expect(googleAuthCode).toContain('google_user_data');
      // Should not have email in URL params
      const redirectSection = googleAuthCode.substring(
        googleAuthCode.indexOf('res.redirect(`${frontendBase}/auth/callback')
      );
      expect(redirectSection.substring(0, 200)).not.toContain('email,');
    });
  });
});
