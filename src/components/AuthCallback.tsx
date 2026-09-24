import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setAccessToken } from '../lib/authToken';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      navigate(`/?error=${error}`, { replace: true });
      return;
    }

    // Read auth token from cookie set by the server during OAuth callback
    const token = document.cookie
      .split('; ')
      .find((c) => c.startsWith('auth_token='))
      ?.split('=')[1];

    if (token) {
      setAccessToken(token);
      // Clear the cookie now that we have the token in memory
      document.cookie = 'auth_token=; path=/; max-age=0';
      navigate('/', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
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
