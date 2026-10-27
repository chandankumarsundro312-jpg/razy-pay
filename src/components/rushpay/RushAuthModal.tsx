import React, { useState } from 'react';
import { X, Lock, Phone, User, Key, ArrowRight, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { rushApi } from '../../utils/rushApi';
import { UserProfile } from '../../types/rushpay';

interface RushAuthModalProps {
  mode: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export const RushAuthModal: React.FC<RushAuthModalProps> = ({
  mode,
  onClose,
  onSuccess,
  onSwitchMode
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRef = params.get('ref') || params.get('join') || params.get('r');
      if (urlRef) return urlRef.trim().toUpperCase();
      const stored = localStorage.getItem('rush_pending_ref');
      if (stored) return stored.trim().toUpperCase();
    } catch {
      // ignore
    }
    return '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'register') {
        const res = await rushApi.register({
          mobile: mobile.trim(),
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          password,
          referralCode: referralCode.trim() || undefined
        });
        onSuccess(res.user);
      } else {
        const res = await rushApi.login(mobile.trim(), password);
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />

      {/* Floating Glass Screen Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/60 backdrop-blur-3xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(59,130,246,0.15)] text-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Edge Reflection Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

        {/* Modal Top Glass Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/[0.03]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-500/25 to-indigo-500/25 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-wide">
                {mode === 'register' ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-400 hover:text-white transition-all cursor-pointer border border-white/10 active:scale-95"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Sign In / Register Glass Pills) */}
        <div className="px-6 pt-4 shrink-0">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10">
            <button
              type="button"
              onClick={() => onSwitchMode('login')}
              className={`py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => onSwitchMode('register')}
              className={`py-2 rounded-xl text-xs font-black tracking-wide transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30 border border-blue-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-md text-rose-200 text-xs flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block tracking-wide">Mobile Number (India +91)</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/70" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-blue-400 text-white placeholder-slate-400 focus:outline-none transition-all font-mono backdrop-blur-md shadow-inner tracking-wider"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block tracking-wide">Password</label>
              <div className="relative">
                <Key className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/70" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-blue-400 text-white placeholder-slate-400 focus:outline-none transition-all backdrop-blur-md shadow-inner"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block tracking-wide">Referral Invite Code</label>
                  <span className="text-[10px] text-blue-300/80">Optional Bonus</span>
                </div>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="RP-VIKRAM88"
                  className="w-full px-4 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-blue-400 text-purple-300 placeholder-slate-400 focus:outline-none transition-all font-mono uppercase backdrop-blur-md shadow-inner tracking-wider"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In Securely' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Switching Prompt */}
          <div className="pt-3 border-t border-white/10 text-center text-xs text-slate-400">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('register')}
                  className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-4 cursor-pointer ml-1"
                >
                  Register Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => onSwitchMode('login')}
                  className="text-blue-400 font-bold hover:text-blue-300 underline underline-offset-4 cursor-pointer ml-1"
                >
                  Sign In Here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
