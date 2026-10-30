import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { ApiService } from '../services/api';
import { OmniRAGLogo } from '../components/OmniRAGLogo';

interface SignUpPageProps {
  onNavigate: (page: 'login' | 'dashboard') => void;
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const features = [
  { icon: '⚡', label: 'Multimodal RAG Intelligence', desc: 'PDF, DOCX, images, code, tables — all modalities' },
  { icon: '🔍', label: 'Hybrid Search + BM25 + RRF', desc: 'Dense + sparse retrieval with reciprocal rank fusion' },
  { icon: '🤖', label: 'Bounded Agentic Retrieval', desc: 'Multi-hop reasoning with citation grounding' },
  { icon: '🛡️', label: 'Zero-Trust Enterprise Security', desc: 'Argon2id + HttpOnly Cookies + Rate Protected' },
];

export const SignUpPage: React.FC<SignUpPageProps> = ({ onNavigate }) => {
  const { theme, toggleTheme } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [role, setRole] = useState('engineer');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pwError, setPwError] = useState('');

  const dark = theme === 'dark';

  const handleGoogleSignIn = async () => {
    setPwError('');
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
      setPwError(
        err.message ||
        'Google OAuth 2.0 is not configured on the server. Please verify GOOGLE_CLIENT_ID in your .env file.'
      );
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = email.split('@')[1]?.toLowerCase().trim();
    const disallowedPersonal = [
      'gmail.com', 'googlemail.com', 'outlook.com', 'hotmail.com', 'live.com',
      'yahoo.com', 'ymail.com', 'icloud.com', 'email.com', 'mail.com', 'proton.me',
      'protonmail.com', 'aol.com', 'zoho.com', 'gmx.com', 'yandex.com',
    ];
    if (domain && (disallowedPersonal.includes(domain) || disallowedPersonal.some(d => domain.endsWith(`.${d}`)))) {
      setPwError(`Registration is restricted to corporate work emails. Personal email addresses (@${domain}) are not permitted. Please sign up with your company email.`);
      return;
    }

    if (password !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setPwError('Password must be at least 8 characters long');
      return;
    }
    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|`~]/.test(password)) {
      setPwError('Password must contain at least one number or special symbol');
      return;
    }
    setPwError('');
    setLoading(true);

    try {
      await ApiService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        tenant_name: `${fullName.trim()}'s Workspace`,
      });
      // Store user identity for the session
      localStorage.setItem(
        'omnirag_user',
        JSON.stringify({ full_name: fullName.trim(), email: email.trim(), roles: ['User'] })
      );
      // Passwords never persisted locally
      setPassword('');
      setConfirmPw('');
      onNavigate('dashboard');
    } catch (err: any) {
      setPwError(err.message || 'Registration failed');
      setPassword('');
      setConfirmPw('');
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

      {/* Two-column card */}
      <div className="bento-card w-full max-w-4xl rounded-3xl overflow-hidden animate-fade-in flex flex-col md:flex-row shadow-2xl">

        {/* ---- LEFT PANEL: Feature showcase ---- */}
        <div
          className="relative hidden md:flex flex-col justify-between p-10 md:w-[42%] shrink-0 overflow-hidden"
          style={{
            background: dark
              ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)'
              : 'linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #3730a3 100%)',
          }}
        >
          {/* Decorative circle */}
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-indigo-300/10 blur-xl" />

          {/* Innovative OmniRAG Logo */}
          <div className="relative z-10">
            <div className="mb-6">
              <OmniRAGLogo
                size="md"
                showText={true}
                subtitle="Enterprise AI"
                badge="Enterprise"
                interactive={false}
                className="[&_.t-primary]:!text-white [&_.t-muted]:!text-indigo-200"
              />
            </div>

            <h2 className="text-2xl font-extrabold text-white leading-tight mb-3">
              Enterprise Knowledge<br />
              <span className="text-indigo-200">Intelligence Platform</span>
            </h2>
            <p className="text-sm text-indigo-100/90 leading-relaxed mb-8">
              Transform your organization's knowledge into instant, evidence-grounded AI intelligence.
            </p>

            {/* Feature bullets */}
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-lg shrink-0">
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{f.label}</div>
                    <div className="text-[11px] text-indigo-100/80 mt-0.5">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10 mt-8 flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-3">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <p className="text-[11px] text-indigo-100">
              <span className="font-bold text-white">SOC 2 Type II</span> certified · GDPR compliant · SSO ready
            </p>
          </div>
        </div>

        {/* ---- RIGHT PANEL: Sign-up form ---- */}
        <div className="flex-1 p-8 sm:p-10">
          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-2xl font-extrabold t-primary tracking-tight">Create your account</h1>
            <p className="text-sm t-secondary mt-1">Start your 14-day free enterprise trial. No credit card required.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold t-secondary mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm t-primary focus:outline-none placeholder:t-muted"
              />
            </div>

            {/* Work Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold t-secondary">Corporate Work Email</label>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">Business emails only</span>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm t-primary focus:outline-none placeholder:t-muted"
              />
              <p className="text-[10px] t-muted mt-1">Personal accounts (@gmail, @outlook, @email.com, etc.) are restricted.</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold t-secondary mb-1.5">Your Role</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="glass-input w-full px-4 py-2.5 rounded-xl text-sm t-primary focus:outline-none border"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <option value="engineer">Engineer</option>
                <option value="manager">Manager</option>
                <option value="analyst">Analyst</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold t-secondary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPwError(''); }}
                    placeholder="Min 8 chars"
                    className="glass-input w-full pl-4 pr-10 py-2.5 rounded-xl text-sm t-primary focus:outline-none placeholder:t-muted"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-secondary transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold t-secondary mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showCpw ? 'text' : 'password'}
                    required
                    value={confirmPw}
                    onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
                    placeholder="Repeat password"
                    className="glass-input w-full pl-4 pr-10 py-2.5 rounded-xl text-sm t-primary focus:outline-none placeholder:t-muted"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowCpw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 t-muted hover:t-secondary transition-colors"
                  >
                    {showCpw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password error */}
            {pwError && (
              <p className="text-xs text-red-500 font-semibold bg-red-500/10 p-2.5 rounded-xl border border-red-500/30">
                {pwError}
              </p>
            )}

            {/* Terms checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border border-[var(--border)] peer-checked:bg-indigo-600 peer-checked:border-indigo-600 transition-colors flex items-center justify-center">
                  {agreed && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs t-secondary leading-relaxed">
                I agree to the{' '}
                <a href="#" className="t-accent hover:underline font-bold">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="t-accent hover:underline font-bold">Privacy Policy</a>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[11px] t-muted font-semibold uppercase tracking-wider">or sign up with</span>
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
          </form>

          {/* Sign in link */}
          <p className="text-center text-xs t-muted mt-6">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="t-accent font-bold hover:underline transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
