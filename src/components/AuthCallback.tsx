import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken, restoreTokenFromCookie } from '../lib/authToken';

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

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      navigate(`/?error=${encodeURIComponent(error)}`, { replace: true });
      return;
    }

    if (searchParams.get('isNewUser') === 'true') {
      markOAuthNewUser();
    }

    const token = searchParams.get('token');
    if (token) {
      setAccessToken(token);
      // Dispatch custom event so AuthProvider immediately re-verifies session
      window.dispatchEvent(new Event('acematric_auth_change'));
      navigate('/', { replace: true });
      return;
    }

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
