import cron from 'node-cron';
import webpush from 'web-push';
import { supabase } from './db';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@acematric.edu.et';

let pushConfigured = false;

function configureVapid() {
  if (pushConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  pushConfigured = true;
  return true;
}

async function sendPushToUser(userEmail: string, title: string, body: string, url = '/'): Promise<number> {
  if (!configureVapid()) return 0;

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_email', userEmail);

  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  const payload = JSON.stringify({ title, body, url, tag: 'study-reminder' });

  for (const sub of subs) {
    try {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      await webpush.sendNotification(pushSubscription, payload, {
        TTL: 86400,
      });
      sent++;
    } catch (err: any) {
      // Remove expired or invalid subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      }
    }
  }

  return sent;
}

export function startPushScheduler() {
  // Daily study reminder at 7:00 PM
  cron.schedule('0 19 * * *', async () => {
    console.log('[push] Running daily study reminder...');

    try {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('user_email')
        .limit(1000);

      if (!subs || subs.length === 0) return;

      const uniqueEmails = [...new Set(subs.map(s => s.user_email))];
      let totalSent = 0;

      for (const email of uniqueEmails) {
        const sent = await sendPushToUser(email, 'Time to study! 📚', 'Your daily practice session is waiting. Keep your streak going!', '/dashboard');
        totalSent += sent;
      }

      console.log(`[push] Daily reminder sent to ${totalSent} subscriptions`);

      await supabase.from('push_schedules').insert([{
        title: 'Time to study! 📚',
        body: 'Daily study reminder',
        scheduled_at: new Date().toISOString(),
        sent_at: new Date().toISOString(),
        target_all: true,
      }]);
    } catch (err: any) {
      console.error('[push] Scheduler error:', err.message);
    }
  });

  // Streak reset check at midnight daily
  cron.schedule('0 0 * * *', async () => {
    console.log('[streak] Checking for inactive users...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Reset streaks for users who didn't study yesterday
      const { data: profiles, error } = await supabase
        .from('student_profiles')
        .select('email, streak_days, last_study_date')
        .gt('streak_days', 0);

      if (error || !profiles) return;

      let resetCount = 0;
      for (const p of profiles) {
        const lastStudy = (p as any).last_study_date;
        if (lastStudy && lastStudy !== yesterdayStr) {
          await supabase
            .from('student_profiles')
            .update({ streak_days: 0 })
            .eq('email', p.email);
          resetCount++;
        }
      }

      console.log(`[streak] Reset ${resetCount} user streaks`);
    } catch (err: any) {
      console.error('[streak] Error:', err.message);
    }
  });

  console.log('[push] Scheduler started (daily reminders at 7PM, streak check at midnight)');
}

export { sendPushToUser };
