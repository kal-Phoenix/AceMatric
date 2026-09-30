import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { restoreTokenFromCookie } from '../lib/authToken';

const OAUTH_NEW_USER_KEY = 'acematric_oauth_new_user';

export function markOAuthNewUser() {
  try {
    sessionStorage.setItem(OAUTH_NEW_USER_KEY, '1');
  } catch {
    // sessionStorage unavailable — onboarding will be skipped
  }
}

export function consumeOAuthNewUserFlag(): boolean {
  try {
    const value = sessionStorage.getItem(OAUTH_NEW_USER_KEY);
    if (value) sessionStorage.removeItem(OAUTH_NEW_USER_KEY);
    return value === '1';
  } catch {
    return false;
  }
}

function readOAuthUserDataCookie(): { isNewUser?: boolean } | null {
  try {
    const raw = document.cookie
      .split('; ')
      .find((row) => row.startsWith('google_user_data='))
      ?.split('=')[1];
    if (!raw) return null;
    const parsed = JSON.parse(decodeURIComponent(raw));
    // One-shot flag — remove it so it can't be replayed on a later visit
    document.cookie = 'google_user_data=; path=/; max-age=0';
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    // New-user flag arrives in a cookie — never put tokens or user data in the URL
    const oauthUserData = readOAuthUserDataCookie();
    if (oauthUserData?.isNewUser || searchParams.get('isNewUser') === 'true') {
      markOAuthNewUser();
    }

    // Exchange the httpOnly refresh cookie for an in-memory access token
    restoreTokenFromCookie().finally(() => {
      window.dispatchEvent(new Event('acematric_auth_change'));
      navigate('/', { replace: true });
    });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#090D14] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-400">Completing sign-in...</p>
      </div>
    </div>
  );
}
