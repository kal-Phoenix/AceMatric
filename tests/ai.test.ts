import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../server/app';
import { mockSupabaseData } from './setup';

async function getAuthToken(email = 'aiquota@test.com') {
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, password: 'Password1', name: 'AI Quota Test' });
  return res.body.token;
}

function getProfile(email: string) {
  return mockSupabaseData.student_profiles.find((p: any) => p.email === email);
}

describe('AI daily quota', () => {
  const originalLimit = process.env.AI_DAILY_LIMIT;
  const originalKey = process.env.GEMINI_API_KEY;

  beforeAll(() => {
    process.env.AI_DAILY_LIMIT = '2';
    // Force the offline curriculum fallback — tests must never call Gemini.
    process.env.GEMINI_API_KEY = '';
  });

  afterAll(() => {
    if (originalLimit === undefined) delete process.env.AI_DAILY_LIMIT;
    else process.env.AI_DAILY_LIMIT = originalLimit;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  });

  const ask = (token: string, body: Record<string, unknown> = { prompt: 'Explain gravity', subject: 'Physics' }) =>
    request(app)
      .post('/api/ai/concept-explainer')
      .set('Authorization', `Bearer ${token}`)
      .send(body);

  it('should require authentication', async () => {
    const res = await request(app)
      .post('/api/ai/concept-explainer')
      .send({ prompt: 'hi', subject: 'Physics' });
    expect(res.status).toBe(401);
  });

  it('should never hit the daily limit — payments disabled, everything free', async () => {
    const email = 'freelimit@test.com';
    const token = await getAuthToken(email);

    expect((await ask(token)).status).toBe(200);
    expect((await ask(token)).status).toBe(200);

    const stillOk = await ask(token);
    expect(stillOk.status).toBe(200);
    expect(stillOk.body.code).not.toBe('AI_DAILY_LIMIT');

    const profile = getProfile(email);
    // Everyone has Pro entitlements, so no quota charge is made
    expect(profile.ai_daily_used || 0).toBe(0);
  });

  it('should not charge the daily counter anymore', async () => {
    const email = 'aiday@test.com';
    const token = await getAuthToken(email);
    const profile = getProfile(email);
    profile.ai_daily_used = 2;
    profile.ai_daily_date = 'Jan 01 2000';

    expect((await ask(token)).status).toBe(200);
    expect(profile.ai_daily_used).toBe(2);
  });

  it('should let premium users bypass the quota', async () => {
    const email = 'aipremium@test.com';
    const token = await getAuthToken(email);
    const profile = getProfile(email);
    profile.is_premium = true;
    profile.premium_expires_at = new Date(Date.now() + 86400000).toISOString();
    profile.ai_daily_used = 99;
    profile.ai_daily_date = new Date().toDateString();

    expect((await ask(token)).status).toBe(200);
    expect((await ask(token)).status).toBe(200);
    expect(profile.ai_daily_used).toBe(99);
  });

  it('should charge failed validation requests only after validation passes', async () => {
    const email = 'aivalidation@test.com';
    const token = await getAuthToken(email);

    const bad = await request(app)
      .post('/api/ai/concept-explainer')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: '' });
    expect(bad.status).toBe(400);

    const profile = getProfile(email);
    expect(profile.ai_daily_used ?? 0).toBe(0);
  });
});
