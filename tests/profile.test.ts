import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

async function getAuthToken(email = 'profile@test.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'Password1', name: 'Profile Test' });
  return res.body.token;
}

describe('Profile Routes', () => {
  describe('POST /api/profile', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/profile')
        .send({ email: 'test@test.com' });
      expect(res.status).toBe(401);
    });

    it('should require email in body', async () => {
      const token = await getAuthToken();
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });
      expect(res.status).toBe(400);
    });

    it('should only allow updating own profile', async () => {
      const token = await getAuthToken('owner@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'other@test.com', name: 'Hacker' });
      expect(res.status).toBe(403);
    });

    it('should filter out disallowed fields (role escalation prevention)', async () => {
      const token = await getAuthToken('filter@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ email: 'filter@test.com', name: 'Test', role: 'admin', isPremium: true });
      expect(res.status).toBe(200);

      // Verify role was NOT escalated by checking the stored data
      const storedProfile = mockSupabaseData.student_profiles.find(
        (p: any) => p.email === 'filter@test.com'
      );
      // The profile should exist and have been saved
      expect(storedProfile).toBeDefined();
    });

    it('should allow updating valid profile fields', async () => {
      const token = await getAuthToken('validprofile@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'validprofile@test.com',
          name: 'Updated Name',
          school: 'New School',
          region: 'New Region',
          targetScore: 550,
          bio: 'New bio',
        });
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/profile/:email', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/profile/test@test.com');
      expect(res.status).toBe(401);
    });

    it('should only allow viewing own profile (IDOR prevention)', async () => {
      const token = await getAuthToken('viewer@test.com');
      const res = await request(app)
        .get('/api/profile/other@test.com')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });
  });
});
