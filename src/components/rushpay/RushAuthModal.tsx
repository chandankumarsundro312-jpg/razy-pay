import React, { useState } from 'react';
import { X, Lock, Phone, User, Key, ArrowRight, ShieldCheck, AlertCircle, RefreshCw, CheckCircle2, Timer } from 'lucide-react';
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

  // Demo 4-Digit OTP System State
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Trigger registration submission
  const executeRegister = async (mobileVal: string, passwordVal: string, refVal: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await rushApi.register({
        mobile: mobileVal.trim(),
        fullName: fullName.trim() || undefined,
        email: email.trim() || undefined,
        password: passwordVal,
        referralCode: refVal.trim() || undefined
      });
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Send OTP & Auto-Verification (5-second timer)
  const handleSendOtp = () => {
    const cleanMob = mobile.replace(/\D/g, '');
    if (cleanMob.length < 10) {
      setError('Please enter a valid 10-digit mobile number first.');
      return;
    }
    if (!password) {
      setError('Please create a password before requesting OTP.');
      return;
    }

    setError(null);
    // Generate random 4-digit OTP
    const random4Digit = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(random4Digit);
    setIsOtpSent(true);
    setIsOtpVerified(false);
    setOtpCountdown(5);

    // 5-second countdown interval
    let timeLeft = 5;
    const intervalId = setInterval(() => {
      timeLeft -= 1;
      setOtpCountdown(timeLeft);

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        // Step 2 & 3: Auto-fill 4-digit OTP and trigger verification
        setOtp(random4Digit);
        setIsOtpVerifying(true);

        setTimeout(() => {
          setIsOtpVerifying(false);
          setIsOtpVerified(true);

          // Step 5: Auto Continue - Automatically advance registration
          setTimeout(() => {
            executeRegister(cleanMob, password, referralCode);
          }, 800);
        }, 600);
      }
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      const cleanMob = mobile.replace(/\D/g, '');
      if (cleanMob.length < 10) {
        setError('Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      if (!isOtpVerified) {
        if (!isOtpSent) {
          handleSendOtp();
          return;
        }
        if (otp.length === 4) {
          setIsOtpVerified(true);
          executeRegister(cleanMob, password, referralCode);
        } else {
          setError('Please wait for OTP auto-verification or click Send OTP.');
        }
        return;
      }
      executeRegister(cleanMob, password, referralCode);
    } else {
      setIsLoading(true);
      try {
        const res = await rushApi.login(mobile.trim(), password);
        onSuccess(res.user);
      } catch (err: any) {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
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

            {/* OTP Verification System (Registration Only) */}
            {mode === 'register' && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold block tracking-wide">
                    4-Digit OTP Verification
                  </label>
                  {isOtpVerified ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Verified
                    </span>
                  ) : isOtpSent ? (
                    <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full animate-pulse">
                      <Timer className="w-3 h-3 text-amber-400" />
                      Auto-verifying in {otpCountdown}s...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Required</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-blue-300/70" />
                    <input
                      type="text"
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder={isOtpSent ? (otpCountdown > 0 ? `Generating... (${otpCountdown}s)` : 'Auto-filling...') : '4-Digit OTP'}
                      disabled={isOtpVerified || isOtpVerifying}
                      className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border text-white placeholder-slate-500 focus:outline-none transition-all font-mono text-center tracking-widest text-base font-black backdrop-blur-md shadow-inner ${
                        isOtpVerified
                          ? 'border-emerald-400/50 bg-emerald-500/10 text-emerald-300'
                          : isOtpSent
                          ? 'border-blue-400/60 bg-blue-500/10'
                          : 'border-white/15 focus:border-blue-400'
                      }`}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isOtpSent && otpCountdown > 0 || isOtpVerified}
                    className={`px-4 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                      isOtpVerified
                        ? 'bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 cursor-default'
                        : isOtpSent && otpCountdown > 0
                        ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 border border-blue-400/30'
                    }`}
                  >
                    {isOtpVerified ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Done</span>
                      </>
                    ) : isOtpSent && otpCountdown > 0 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Wait {otpCountdown}s</span>
                      </>
                    ) : isOtpSent ? (
                      <span>Resend OTP</span>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </button>
                </div>

                {/* Status Notice */}
                {isOtpSent && (
                  <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-200 flex items-center justify-between">
                    <span className="font-medium">
                      {isOtpVerified
                        ? 'OTP verified! Continuing registration automatically...'
                        : isOtpVerifying
                        ? 'Validating 4-digit OTP...'
                        : `OTP will auto-fill & verify in ${otpCountdown}s (No SMS needed)`}
                    </span>
                    {generatedOtp && (
                      <span className="font-mono font-black text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-lg border border-blue-400/30 text-xs">
                        {isOtpVerified || otpCountdown === 0 ? generatedOtp : `****`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

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
