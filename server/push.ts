// Push notification subscription management
import { supabase, formatSupabaseError } from './db';

export async function savePushSubscription(
  userEmail: string,
  endpoint: string,
  p256dh: string,
  auth: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert([{
        user_email: userEmail,
        endpoint,
        p256dh,
        auth,
      }], { onConflict: 'user_email,endpoint' });

    if (error) {
      console.error('[push] Failed to save subscription:', formatSupabaseError(error));
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[push] Failed to save subscription:', err.message);
    return false;
  }
}

export async function removePushSubscription(endpoint: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('[push] Failed to remove subscription:', formatSupabaseError(error));
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[push] Failed to remove subscription:', err.message);
    return false;
  }
}

export async function getPushSubscriptions(userEmail: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_email', userEmail);

    if (error) {
      console.error('[push] Failed to get subscriptions:', formatSupabaseError(error));
      return [];
    }
    return data || [];
  } catch {
    return [];
  }
}
