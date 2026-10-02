// Shared Pro/entitlement helpers so every server feature reads subscription
// state the same way (payments write is_premium + premium_expires_at).

export interface PremiumRow {
  is_premium?: boolean | null;
  premium_expires_at?: string | null;
}

export function isPremiumRow(_row: PremiumRow | null | undefined): boolean {
  // PAYMENTS DISABLED — everything is free for now.
  // Every user has full Pro entitlements: no daily caps, no AI quota.
  // To re-enable payments, restore the original expiry logic below.
  return true;
  // if (!_row?.is_premium) return false;
  // if (_row.premium_expires_at) {
  //   const expires = new Date(_row.premium_expires_at);
  //   if (Number.isNaN(expires.getTime()) || expires < new Date()) return false;
  // }
  // return true;
}

/** Free-tier daily caps; override with env for tuning without a deploy. */
export function intFromEnv(name: string, fallback: number): number {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

export const DAILY_QUESTION_CAP_FALLBACK = 10;
export const AI_DAILY_LIMIT_FALLBACK = 25;

/** Date key used for daily counters (matches client `Date#toDateString()`). */
export function todayKey(): string {
  return new Date().toDateString();
}
