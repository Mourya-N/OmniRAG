import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { OmniRAGLogo } from '../components/OmniRAGLogo';

interface LoginPageProps {
  onNavigate: (page: 'signup' | 'dashboard' | 'landing') => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const dark = theme === 'dark';

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setGoogleLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/google/callback`;
      const res = await ApiService.getGoogleAuthUrl(redirectUri);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error('Google authorization URL was not generated.');
      }
    } catch (err: any) {
      setErrorMsg(
        err.message ||
        'Google OAuth 2.0 is not configured on the server. Please verify GOOGLE_CLIENT_ID in your .env file.'
      );
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      // Authenticate with zero-trust backend and issue HttpOnly cookie
      await ApiService.login({ email: email.trim(), password });
      // Fetch authenticated user profile to update navbar state
      try {
        const me = await ApiService.getMe();
        localStorage.setItem('omnirag_user', JSON.stringify(me));
      } catch {
        const fallbackName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        localStorage.setItem('omnirag_user', JSON.stringify({ full_name: fallbackName, email: email.trim(), roles: ['User'] }));
      }
      // Clear password state immediately from memory
      setPassword('');
      onNavigate('dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Nebula blobs */}
      <div className="nebula-blob-1 fixed -bottom-40 -left-40 w-[700px] h-[700px] rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="nebula-blob-2 fixed -top-32 left-1/3 w-[800px] h-[800px] rounded-full blur-[180px] pointer-events-none -z-10" />
      <div className="nebula-blob-3 fixed top-1/3 -right-24 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="nebula-blob-4 fixed -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bento-card flex items-center justify-center t-secondary hover:t-primary transition-colors"
        title="Toggle theme"
      >
        {dark ? (
          <svg className="w-5 h-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M18.364 17.657l-.707-.707M6.343 6.343l-.707-.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      {/* Card */}
      <div className="bento-card w-full max-w-md rounded-3xl p-8 sm:p-10 animate-fade-in shadow-2xl">
        {/* Innovative OmniRAG Logo & heading */}
        <div className="flex flex-col items-center mb-8">
          <div
            onClick={() => onNavigate('landing')}
            className="mb-4 cursor-pointer hover:scale-105 transition-transform"
            title="Return to OmniRAG Home"
          >
            <OmniRAGLogo
              size="lg"
              showText={false}
              interactive={true}
            />
          </div>
          <div className="flex items-center gap-1.5 mb-1">
            <h1 className="text-2xl font-extrabold t-primary tracking-tight">Welcome back to</h1>
            <span className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">OmniRAG</span>
          </div>
          <p className="text-sm t-secondary">Sign in to your enterprise knowledge workspace</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold t-secondary mb-1.5">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="glass-input w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold t-secondary">Password</label>
              <button type="button" className="text-xs t-accent hover:underline font-semibold">Forgot password?</button>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="glass-input w-full rounded-xl px-4 py-3 text-sm pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-secondary transition-colors"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setRemember(v => !v)}
              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${remember ? 'bg-indigo-600 border-indigo-600' : 'border-[var(--border)]'}`}
              style={{ background: remember ? undefined : 'transparent' }}
            >
              {remember && <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
            <span className="text-xs t-secondary">Remember me for 30 days</span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          <span className="text-[11px] t-muted font-semibold uppercase tracking-wider">or continue with</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        </div>

        {/* Google OAuth2 Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-2.5 rounded-xl bento-chip flex items-center justify-center gap-3 font-semibold text-sm t-primary hover:opacity-90 disabled:opacity-50 transition-all border"
          style={{ borderColor: 'var(--border)' }}
        >
          {googleLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full animate-spin" />
              Connecting to Google…
            </span>
          ) : (
            <>
              <GoogleIcon />
              Continue with Google
            </>
          )}
        </button>

        {/* Signup link */}
        <p className="text-center text-sm t-secondary mt-6">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="t-accent font-bold hover:underline">
            Sign up free
          </button>
        </p>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] t-muted">
          <ShieldCheck className="w-3.5 h-3.5 icon-emerald" />
          <span>SOC 2 Type II · Zero-Knowledge Cookies · Rate Protected</span>
        </div>
      </div>

      <p className="mt-6 text-xs t-muted flex items-center gap-1">
        <Sparkles className="w-3 h-3 icon-indigo" />
        OmniRAG Enterprise Knowledge Intelligence
      </p>
    </div>
  );
};

export default LoginPage;
