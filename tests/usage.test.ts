import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

async function getAuthToken(email = 'usage@test.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'Password1', name: 'Usage Test' });
  return res.body.token;
}

function getProfile(email: string) {
  return mockSupabaseData.student_profiles.find((p: any) => p.email === email);
}

describe('Usage Routes', () => {
  describe('POST /api/usage/questions', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/usage/questions')
        .send({ count: 1 });
      expect(res.status).toBe(401);
    });

    it('should increment the server-side daily counter', async () => {
      const token = await getAuthToken('consume@test.com');
      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 3 });

      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
      expect(res.body.used).toBe(3);

      const profile = getProfile('consume@test.com');
      expect(profile.daily_questions_used).toBe(3);
      expect(profile.daily_progress_date).toBe(new Date().toDateString());
    });

    it('should not cap usage — payments disabled, everything free', async () => {
      const token = await getAuthToken('capped@test.com');
      const profile = getProfile('capped@test.com');
      profile.daily_questions_used = 9;
      profile.daily_progress_date = new Date().toDateString();

      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 5 });

      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
      expect(res.body.used).toBe(14);
      expect(res.body.isPremium).toBe(true);
      expect(profile.daily_questions_used).toBe(14);
    });

    it('should allow premium users past the cap', async () => {
      const token = await getAuthToken('premium@test.com');
      const profile = getProfile('premium@test.com');
      profile.is_premium = true;
      profile.premium_expires_at = new Date(Date.now() + 86400000).toISOString();
      profile.daily_questions_used = 10;
      profile.daily_progress_date = new Date().toDateString();

      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 5 });

      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
      expect(res.body.used).toBe(15);
      expect(res.body.isPremium).toBe(true);
    });

    it('should treat expired premium as free tier', async () => {
      const token = await getAuthToken('expired@test.com');
      const profile = getProfile('expired@test.com');
      profile.is_premium = true;
      profile.premium_expires_at = new Date(Date.now() - 86400000).toISOString();
      profile.daily_questions_used = 9;
      profile.daily_progress_date = new Date().toDateString();

      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 5 });

      expect(res.status).toBe(200);
      // Payments disabled — expiry is ignored, everyone stays unlimited
      expect(res.body.allowed).toBe(true);
      expect(res.body.isPremium).toBe(true);
    });

    it('should reset the counter on a new day', async () => {
      const token = await getAuthToken('newday@test.com');
      const profile = getProfile('newday@test.com');
      profile.daily_questions_used = 10;
      profile.daily_progress_date = 'Jan 01 2000';

      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 1 });

      expect(res.status).toBe(200);
      expect(res.body.allowed).toBe(true);
      expect(res.body.used).toBe(1);
    });

    it('should clamp out-of-range counts', async () => {
      const token = await getAuthToken('clamp@test.com');
      const profile = getProfile('clamp@test.com');
      profile.is_premium = true;

      const res = await request(app)
        .post('/api/usage/questions')
        .set('Authorization', `Bearer ${token}`)
        .send({ count: 9999 });

      expect(res.status).toBe(200);
      // Clamped to MAX_CONSUME_PER_CALL (25) instead of trusting client input
      expect(res.body.allowed).toBe(true);
      expect(res.body.used).toBe(25);
    });
  });
});
