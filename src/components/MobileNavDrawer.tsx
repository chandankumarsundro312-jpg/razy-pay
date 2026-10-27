import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ChevronDown,
  ChevronRight,
  Shield,
  Lock,
  LogOut,
  PhoneCall,
  CheckCircle2,
  Send
} from 'lucide-react';
import { USER_NAV_GROUPS, ADMIN_NAV_GROUPS, NavItem } from '../config/navigation';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: string;
  onNavigate: (item: NavItem) => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  phoneCount?: number;
  navGroups?: typeof USER_NAV_GROUPS;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  isAdminLoggedIn,
  onAdminLogout,
  phoneCount = 6,
  navGroups = USER_NAV_GROUPS
}) => {
  // Expandable groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'main-nav': true,
    'rental-payments': true,
    'info-support': true,
    'admin-portal': true
  });

  if (!isOpen) return null;

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  const handleItemClick = (item: NavItem) => {
    onNavigate(item);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 text-left animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-900 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base font-black text-slate-900">
                  RAZY PAY
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200">
                  Pay System
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                Financial Operating System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certified Refurbished Badge */}
        <div className="px-3 pt-3 pb-1">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">Certified Refurbished • No Extra Charge</span>
          </div>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 text-xs">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.id] !== false;
            return (
              <div key={group.id} className="space-y-1">
                {/* Group Title */}
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 transition-colors cursor-pointer rounded-lg hover:bg-slate-50"
                >
                  <span>{group.title}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Items */}
                {isExpanded && (
                  <div className="space-y-0.5 pl-1">
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeSection === item.id;
                      const badgeText = item.id === 'explore' ? `${phoneCount} Phones` : item.badge;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleItemClick(item)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                            isActive
                              ? 'bg-gradient-to-r from-indigo-900 to-purple-800 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-purple-200' : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate text-xs">{item.label}</span>
                          </div>

                          {badgeText && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ml-1.5 ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeColor || 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {badgeText}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin Navigation Section */}
          <div className="pt-2 border-t border-slate-200">
            {ADMIN_NAV_GROUPS.map((group) => {
              const isExpanded = expandedGroups[group.id] !== false;
              return (
                <div key={group.id} className="space-y-1">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-950 cursor-pointer flex-1 text-left"
                    >
                      <Shield className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span>RAZY PAY Admin Dashboard</span>
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-purple-400 ml-auto" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-purple-400 ml-auto" />
                      )}
                    </button>
                  </div>

                  {/* Auth status */}
                  <div className="px-2 py-1 flex items-center justify-between text-[10px]">
                    <span className="flex items-center gap-1 font-semibold text-slate-500">
                      {isAdminLoggedIn ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-700">Authenticated</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span>Protected by PIN</span>
                        </>
                      )}
                    </span>
                    {isAdminLoggedIn && (
                      <button
                        type="button"
                        onClick={onAdminLogout}
                        className="text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>Lock</span>
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="space-y-0.5 pl-1">
                      {group.items.map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeSection === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer text-left ${
                              isActive
                                ? 'bg-purple-900 text-white font-bold'
                                : 'text-slate-600 hover:text-purple-950 hover:bg-purple-50 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComponent
                                className={`w-4 h-4 shrink-0 ${
                                  isActive ? 'text-purple-200' : 'text-purple-500'
                                }`}
                              />
                              <span className="truncate text-xs">{item.label}</span>
                            </div>

                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ml-1.5 ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : item.badgeColor || 'bg-purple-100 text-purple-800'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 space-y-1.5">
          <a
            href="https://t.me/Chandanstoresupport"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-800"
          >
            <Send className="w-3.5 h-3.5 text-sky-600" />
            <span>Telegram: t.me/Chandanstoresupport</span>
          </a>
        </div>
      </div>
    </div>
  );
};
