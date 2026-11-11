import React, { useState } from 'react';
import { X, Lock, Phone, Key, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { rushApi } from '../../utils/rushApi';
import { UserProfile } from '../../types/rushpay';

interface RushAuthModalProps {
  mode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  onSwitchMode?: (mode: 'login' | 'register') => void;
}

export const RushAuthModal: React.FC<RushAuthModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanMob = mobile.replace(/\D/g, '');
    if (!cleanMob || cleanMob.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!password || password.length < 4) {
      setError('Please enter a password (at least 4 characters).');
      return;
    }

    setIsLoading(true);
    try {
      // Check for any pending referral code from invite links
      let pendingRef: string | undefined = undefined;
      try {
        const stored = localStorage.getItem('rush_pending_ref');
        if (stored) pendingRef = stored.trim().toUpperCase();
      } catch {
        // ignore
      }

      // Unified Sign In: if account exists, verifies password and logs in;
      // if account is new, automatically registers with hashed credentials and logs in immediately
      const res = await rushApi.login(cleanMob, password, pendingRef);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-300">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-blue-600/20 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 rounded-full bg-indigo-600/20 blur-[100px] pointer-events-none" />

      {/* Floating Glass Screen Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-slate-900/80 backdrop-blur-3xl border border-white/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(59,130,246,0.15)] text-slate-100 overflow-hidden flex flex-col">
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
                SIGN IN
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Fast & Secure NPCI UPI Rail Access
              </p>
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

        {/* Form Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 backdrop-blur-md text-rose-200 text-xs flex items-center gap-2.5 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block tracking-wide">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center gap-1.5 pointer-events-none">
                  <Phone className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-slate-400 border-r border-white/15 pr-2">
                    +91
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  className="w-full pl-20 pr-4 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-blue-400 text-white placeholder-slate-500 focus:outline-none transition-all font-mono text-sm tracking-wider backdrop-blur-md shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block tracking-wide">
                Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 pointer-events-none">
                  <Key className="w-4 h-4 text-blue-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/15 focus:border-blue-400 text-white placeholder-slate-500 focus:outline-none transition-all backdrop-blur-md shadow-inner text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || !mobile || !password}
              className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider shadow-xl shadow-blue-600/30 border border-white/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-blue-200" />
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-Bit Encrypted & Protected NPCI Settlement Protocol</span>
          </div>
        </div>
      </div>
    </div>
  );
};
