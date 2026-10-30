import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { ApiService } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface GoogleCallbackPageProps {
  onSuccess: () => void;
  onNavigate: (page: 'login' | 'signup') => void;
}

export const GoogleCallbackPage: React.FC<GoogleCallbackPageProps> = ({ onSuccess, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);

  const dark = theme === 'dark';

  useEffect(() => {
    let isSubscribed = true;

    const exchangeCode = async () => {
      // 1. Parse code or error from URL search parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error) {
        if (!isSubscribed) return;
        setStatus('error');
        setErrorMessage(
          errorDescription ||
          (error === 'access_denied'
            ? 'Google sign-in was cancelled or access was denied.'
            : `Google OAuth error: ${error}`)
        );
        return;
      }

      if (!code) {
        if (!isSubscribed) return;
        setStatus('error');
        setErrorMessage('No authorization code was received from Google.');
        return;
      }

      try {
        // Exchange code with backend
        const redirectUri = `${window.location.origin}/auth/google/callback`;
        await ApiService.googleAuthCallback({
          code,
          redirect_uri: redirectUri,
        });

        // Fetch verified user profile
        try {
          const profile = await ApiService.getMe();
          localStorage.setItem('omnirag_user', JSON.stringify(profile));
        } catch {
          // Fallback user state
          localStorage.setItem(
            'omnirag_user',
            JSON.stringify({ full_name: 'Enterprise User', roles: ['User'] })
          );
        }

        if (!isSubscribed) return;
        setStatus('success');

        // Clean up URL search params and complete navigation after brief feedback
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.origin + '/#/');
          onSuccess();
        }, 1200);
      } catch (err: any) {
        if (!isSubscribed) return;
        setStatus('error');
        setErrorMessage(
          err.message || 'Failed to complete Google OAuth2 authentication. Please try again.'
        );
      }
    };

    exchangeCode();

    return () => {
      isSubscribed = false;
    };
  }, [onSuccess]);

  const handleRetryGoogle = async () => {
    setIsRetrying(true);
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const res = await ApiService.getGoogleAuthUrl(redirectUri);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to Google OAuth2 service');
      setIsRetrying(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Nebula background blobs */}
      <div className="nebula-blob-1 fixed -bottom-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="nebula-blob-2 fixed -top-32 left-1/3 w-[800px] h-[800px] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="nebula-blob-3 fixed top-1/3 -right-24 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bento-card flex items-center justify-center t-secondary hover:t-primary transition-colors"
        title="Toggle theme"
      >
        {dark ? (
          <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>

      {/* Main Bento Card */}
      <div className="bento-card w-full max-w-md rounded-3xl p-8 sm:p-10 animate-fade-in shadow-2xl text-center">
        {status === 'processing' && (
          <div className="flex flex-col items-center py-6">
            <div className="relative mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[2px] shadow-lg shadow-indigo-600/30 flex items-center justify-center animate-pulse">
                <div
                  className="w-full h-full rounded-[14px] flex items-center justify-center"
                  style={{ background: dark ? '#0d1024' : '#ffffff' }}
                >
                  <RefreshCw className="w-7 h-7 text-indigo-500 animate-spin" />
                </div>
              </div>
            </div>
            <h2 className="text-xl font-extrabold t-primary tracking-tight">Authenticating with Google</h2>
            <p className="text-xs t-secondary mt-2 max-w-xs leading-relaxed">
              Exchanging authorization credentials with Google APIs and verifying enterprise domain policies...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-500 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-extrabold t-primary tracking-tight">Authentication Successful</h2>
            <p className="text-xs t-secondary mt-2 leading-relaxed">
              Redirecting to your OmniRAG enterprise workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 text-red-500 shadow-lg shadow-red-500/20">
              <AlertCircle className="w-9 h-9" />
            </div>
            <h2 className="text-xl font-extrabold t-primary tracking-tight">Authentication Restricted</h2>
            
            <div className="my-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 text-left leading-relaxed">
              {errorMessage}
            </div>

            <div className="w-full space-y-3 mt-4">
              <button
                type="button"
                onClick={handleRetryGoogle}
                disabled={isRetrying}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
              >
                {isRetrying ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Choose another Google Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.history.replaceState({}, document.title, window.location.origin + '/#/login');
                  onNavigate('login');
                }}
                className="w-full py-2.5 rounded-xl bento-chip text-xs font-semibold t-secondary hover:t-primary transition-colors border"
                style={{ borderColor: 'var(--border)' }}
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-[var(--border)] text-[11px] t-muted">
          <ShieldCheck className="w-3.5 h-3.5 icon-emerald" />
          <span>Google OAuth 2.0 PKCE · HttpOnly Cookies · Workmail Enforced</span>
        </div>
      </div>

      <p className="mt-6 text-xs t-muted flex items-center gap-1">
        <Sparkles className="w-3 h-3 icon-indigo" />
        OmniRAG Enterprise Knowledge Intelligence
      </p>
    </div>
  );
};

export default GoogleCallbackPage;
