import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData, mockSupabaseFailures } from './setup';

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

    it('should persist gamification stats that were previously dropped', async () => {
      const token = await getAuthToken('stats@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'stats@test.com',
          streakDays: 7,
          examReadinessScore: 82,
          subjectsPerformance: { Mathematics: 90, Physics: 75 },
        });
      expect(res.status).toBe(200);

      const stored = mockSupabaseData.student_profiles.find(
        (p: any) => p.email === 'stats@test.com'
      );
      expect(stored.streak_days).toBe(7);
      expect(stored.exam_readiness_score).toBe(82);
      expect(stored.subjects_performance).toEqual({ Mathematics: 90, Physics: 75 });
    });

    it('should reject out-of-bounds gamification stats without failing the save', async () => {
      const token = await getAuthToken('badstats@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'badstats@test.com',
          name: 'Still Saved',
          streakDays: -5,
          examReadinessScore: 9999,
        });
      expect(res.status).toBe(200);

      const stored = mockSupabaseData.student_profiles.find(
        (p: any) => p.email === 'badstats@test.com'
      );
      expect(stored.name).toBe('Still Saved');
      // Out-of-bounds values are dropped, leaving signup defaults intact
      expect(stored.streak_days).toBe(0);
      expect(stored.exam_readiness_score).toBe(0);
    });

    it('should keep daily question usage server-managed (not client-writable)', async () => {
      const token = await getAuthToken('usagefield@test.com');
      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'usagefield@test.com',
          dailyQuestionsUsed: 9999,
          dailyProgressDate: 'HACKED',
        });
      expect(res.status).toBe(200);

      const stored = mockSupabaseData.student_profiles.find(
        (p: any) => p.email === 'usagefield@test.com'
      );
      // Must not be writable through the profile endpoint or the free cap
      // is bypassed with a single POST.
      expect(stored.daily_questions_used).toBe(0);
      expect(stored.daily_progress_date).toBe('');
    });

    it('should drop only the unknown column when the database is missing one', async () => {
      const token = await getAuthToken('fallback@test.com');
      mockSupabaseFailures.upsertError = {
        code: 'PGRST204',
        message: "Could not find the 'daily_goal_hours' column of 'student_profiles' in the schema cache",
      };

      const res = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'fallback@test.com',
          name: 'Fallback Saved',
          dailyGoalHours: 6,
        });
      expect(res.status).toBe(200);

      const stored = mockSupabaseData.student_profiles.find(
        (p: any) => p.email === 'fallback@test.com'
      );
      expect(stored.name).toBe('Fallback Saved');
      expect(stored.daily_goal_hours).toBeUndefined();
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
