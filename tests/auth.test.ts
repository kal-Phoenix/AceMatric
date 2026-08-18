import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

const REAL_HASH = '$2b$12$uxYIdmAkmTeRZoaORlKK9.0mjDb.Lok/bwxjnJSytDKSqMar0hoTO'; // bcrypt('Password1')

function seedUser(email: string) {
  mockSupabaseData.users_auth.push({
    email,
    password: REAL_HASH,
    created_at: new Date().toISOString(),
  });
}

describe('Auth Routes', () => {
  describe('POST /api/auth/signup', () => {
    it('should require email, password, and name', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: '', password: '', name: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid email');
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'not-an-email', password: 'Password1', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid email');
    });

    it('should reject short passwords', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'short', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 8');
    });

    it('should reject passwords without uppercase', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'lowercase1', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('uppercase');
    });

    it('should reject passwords without numbers', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'NoNumberHere', name: 'Test' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('number');
    });

    it('should reject names over 100 characters', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'test@example.com', password: 'Password1', name: 'A'.repeat(101) });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Name too long');
    });

    it('should return 409 for existing email (non-revealing)', async () => {
      seedUser('existing@test.com');
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'existing@test.com', password: 'Password1', name: 'Test' });
      expect(res.status).toBe(409);
      expect(res.body.error).not.toContain('already exists');
    });

    it('should trim password before hashing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'trim@test.com', password: '  Password1  ', name: 'Trim Test' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.profile).toBeDefined();
    });
  });

  describe('POST /api/auth/signin', () => {
    it('should require email and password', async () => {
      const res = await request(app)
        .post('/api/auth/signin')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should reject invalid credentials', async () => {
      seedUser('signin@test.com');
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'signin@test.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid');
    });

    it('should return token on valid login', async () => {
      seedUser('valid@test.com');
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'valid@test.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.profile).toBeDefined();
    });

    it('should include role in response', async () => {
      seedUser('roleuser@test.com');
      const res = await request(app)
        .post('/api/auth/signin')
        .send({ email: 'roleuser@test.com', password: 'Password1' });
      expect(res.status).toBe(200);
      expect(res.body.profile.role).toBe('student');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should always return 200 (prevent email enumeration)', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' });
      expect(res.status).toBe(200);
    });

    it('should require email', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'not-email' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should require all fields', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({});
      expect(res.status).toBe(400);
    });

    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'bad', code: '123456', newPassword: 'Password1' });
      expect(res.status).toBe(400);
    });

    it('should validate password strength', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ email: 'test@test.com', code: '123456', newPassword: 'weak' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/verify-token', () => {
    it('should reject missing token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-token');
      expect(res.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', 'Bearer invalidtoken');
      expect(res.status).toBe(401);
    });

    it('should accept valid token', async () => {
      // First sign up to get a valid token
      const signupRes = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'verify@test.com', password: 'Password1', name: 'Verify Test' });
      const token = signupRes.body.token;

      const res = await request(app)
        .post('/api/auth/verify-token')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('verify@test.com');
    });
  });
});
