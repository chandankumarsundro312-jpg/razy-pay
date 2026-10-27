import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Lock,
  ArrowDownLeft,
  Users,
  CheckCircle2,
  RefreshCw,
  PhoneCall,
  Globe,
  Award,
  AlertCircle,
  Home,
  User,
  ArrowUpRight
} from 'lucide-react';
import { ExchangeRateConfig, RushPayPlatformConfig } from '../../types/rushpay';

interface RushLandingProps {
  rates: ExchangeRateConfig;
  config: RushPayPlatformConfig;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenDashboard: () => void;
  isLoggedIn: boolean;
}

export const RushLanding: React.FC<RushLandingProps> = ({
  rates,
  config,
  onOpenLogin,
  onOpenRegister,
  onOpenDashboard,
  isLoggedIn
}) => {
  const [calcInr, setCalcInr] = useState<number>(5000);

  const buyRate = rates?.buyRate || 1.0;
  const buyFeePercent = rates?.buyFeePercent || 0.5;
  const feeAmount = (calcInr * buyFeePercent) / 100;
  const netEstimatedUnits = Number(((calcInr - feeAmount) / buyRate).toFixed(2));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Main Header / Nav */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white flex items-center gap-1.5">
                RAZY PAY
              </span>
            </div>
          </div>

          {/* Action CTAs (Top header) */}
          {isLoggedIn && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenDashboard}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <div className="flex flex-col items-center justify-center gap-3 pt-2 max-w-sm mx-auto w-full">
              <button
                type="button"
                onClick={onOpenRegister}
                className="w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
              >
                <span>REGISTER</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer pt-1"
              >
                Already have an account? <span className="text-blue-400 font-bold hover:underline">Sign In</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation Bar (Navigation Niche) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 px-4 py-2 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          {/* 1. HOME */}
          <button
            type="button"
            onClick={isLoggedIn ? onOpenDashboard : () => {}}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-blue-400 bg-blue-500/10 font-black transition-all cursor-pointer"
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">HOME</span>
          </button>

          {/* 2. BUY RP */}
          <button
            type="button"
            onClick={isLoggedIn ? onOpenDashboard : onOpenLogin}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">BUY RP</span>
          </button>

          {/* 3. SELL RP */}
          <button
            type="button"
            onClick={isLoggedIn ? onOpenDashboard : onOpenLogin}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">SELL RP</span>
          </button>

          {/* 4. PROFILE */}
          <button
            type="button"
            onClick={isLoggedIn ? onOpenDashboard : onOpenLogin}
            className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-400 hover:text-slate-200 font-semibold transition-all cursor-pointer"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-wider uppercase">PROFILE</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
