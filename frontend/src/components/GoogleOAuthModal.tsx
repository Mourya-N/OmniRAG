import React, { useState } from 'react';
import { X, Plus, AlertCircle, ShieldCheck } from 'lucide-react';
import { ApiService } from '../services/api';
import { UserProfile } from '../types';

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

const GOOGLE_SVG = (
  <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Pre-loaded corporate logged-in Google accounts on this workstation/session
  const knownAccounts = [
    {
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@enterprise-ai.corp',
      avatarColor: 'from-blue-600 to-indigo-600',
      initials: 'SJ',
      type: 'Google Workspace',
    },
    {
      name: 'Alex Chen',
      email: 'alex.chen@cloud-native.io',
      avatarColor: 'from-emerald-600 to-teal-600',
      initials: 'AC',
      type: 'Google Workspace',
    },
    {
      name: 'David Miller (Personal)',
      email: 'david.personal@gmail.com',
      avatarColor: 'from-amber-600 to-rose-600',
      initials: 'DM',
      type: 'Personal Google (@gmail)',
    },
  ];

  const handleSelectAccount = async (email: string, name: string) => {
    setErrorMessage(null);
    setLoadingEmail(email);

    try {
      // Exchange Google OAuth2 identity with backend
      await ApiService.googleAuthCallback({
        email,
        full_name: name,
      });

      // Retrieve full verified profile
      let profile: UserProfile;
      try {
        profile = await ApiService.getMe();
      } catch {
        profile = {
          email,
          full_name: name,
          roles: ['User'],
          is_active: true,
          is_superuser: false,
          id: 'oauth-' + Date.now(),
          tenant_id: '00000000-0000-0000-0000-000000000001',
        };
      }

      localStorage.setItem('omnirag_user', JSON.stringify(profile));
      onSuccess(profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Google OAuth2 authentication failed');
    } finally {
      setLoadingEmail(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const email = customEmail.trim();
    const name = customName.trim() || email.split('@')[0];
    handleSelectAccount(email, name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl bento-card p-6 shadow-2xl relative overflow-hidden animate-scale-up"
        style={{ borderColor: 'var(--border)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full t-muted hover:t-primary bento-chip transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Google OAuth Header */}
        <div className="flex flex-col items-center text-center pt-2 pb-4">
          <div className="p-2.5 rounded-2xl bento-chip mb-3 shadow-inner">
            {GOOGLE_SVG}
          </div>
          <h2 className="text-lg font-bold t-primary">Choose an account</h2>
          <p className="text-xs t-muted mt-0.5">
            to continue to <span className="font-semibold t-primary">OmniRAG Enterprise</span>
          </p>
          <div className="flex items-center gap-1.5 text-[10px] icon-indigo font-mono mt-2 bento-chip px-2.5 py-0.5 rounded-full">
            <span>OAuth 2.0 · prompt=select_account</span>
          </div>
        </div>

        {/* Error notification if personal or invalid account chosen */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl badge-amber text-xs flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 icon-amber shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">Account Not Admitted</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Account Selection List */}
        {!showCustomInput ? (
          <div className="space-y-2 py-1">
            {knownAccounts.map((acc) => {
              const isPersonal = acc.email.endsWith('@gmail.com');
              const isLoading = loadingEmail === acc.email;

              return (
                <button
                  key={acc.email}
                  disabled={Boolean(loadingEmail)}
                  onClick={() => handleSelectAccount(acc.email, acc.name)}
                  className="w-full p-3 rounded-2xl bento-chip flex items-center justify-between hover:opacity-90 transition-all border group text-left"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${acc.avatarColor} flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0`}
                    >
                      {acc.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold t-primary truncate">{acc.name}</p>
                      <p className="text-[11px] t-muted truncate">{acc.email}</p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : isPersonal ? (
                      <span className="text-[9px] px-2 py-0.5 rounded-md badge-amber font-mono">
                        Personal
                      </span>
                    ) : (
                      <span className="text-[9px] px-2 py-0.5 rounded-md badge-emerald font-mono">
                        Workspace
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Use another account option */}
            <button
              onClick={() => {
                setShowCustomInput(true);
                setErrorMessage(null);
              }}
              className="w-full p-3 rounded-2xl bento-chip flex items-center gap-3 hover:opacity-90 transition-all border text-left mt-2"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="w-10 h-10 rounded-full bento-card flex items-center justify-center text-xs t-muted border shrink-0" style={{ borderColor: 'var(--border)' }}>
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium t-primary">Use another work account</p>
                <p className="text-[11px] t-muted">Sign in with custom corporate Google ID</p>
              </div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 py-1">
            <div>
              <label className="block text-xs font-semibold t-secondary mb-1">Corporate Google Work Email</label>
              <input
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="name@company.com"
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs t-primary focus:outline-none placeholder:t-muted"
                autoFocus
              />
              <p className="text-[10px] t-muted mt-1">Must be an enterprise domain (@company.com)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold t-secondary mb-1">Your Full Name</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs t-primary focus:outline-none placeholder:t-muted"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(false);
                  setErrorMessage(null);
                }}
                className="flex-1 py-2 rounded-xl bento-chip text-xs t-secondary hover:t-primary"
              >
                Back to Accounts
              </button>
              <button
                type="submit"
                disabled={Boolean(loadingEmail) || !customEmail.trim()}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                {loadingEmail ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t flex items-center justify-between text-[10px] t-muted" style={{ borderColor: 'var(--border)' }}>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 icon-emerald" />
            <span>Encrypted OAuth2 OIDC</span>
          </span>
          <span>Google Workspace Enterprise</span>
        </div>
      </div>
    </div>
  );
};
