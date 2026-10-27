import React, { useState } from 'react';
import {
  Smartphone,
  ChevronDown,
  ChevronRight,
  Shield,
  Lock,
  LogOut,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ExternalLink,
  Send,
  Zap
} from 'lucide-react';
import { USER_NAV_GROUPS, ADMIN_NAV_GROUPS, NavItem } from '../config/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

interface SidebarNavigationProps {
  activeSection: string;
  onNavigate: (item: NavItem) => void;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  onOpenRushPay?: () => void;
  phoneCount?: number;
  navGroups?: typeof USER_NAV_GROUPS;
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  activeSection,
  onNavigate,
  isAdminLoggedIn,
  onAdminLogout,
  onOpenRushPay,
  phoneCount = 6,
  navGroups = USER_NAV_GROUPS
}) => {
  // Sidebar collapsed (Hide text) state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Manage expandable groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'main-nav': true,
    'rental-payments': true,
    'info-support': true,
    'admin-portal': true
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200/90 h-screen sticky top-0 select-none overflow-y-auto text-left shadow-xs z-30 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* Brand & Store Header */}
      <div className={`p-4 border-b border-slate-100 flex items-center ${isCollapsed ? 'justify-center flex-col gap-2' : 'justify-between'}`}>
        {!isCollapsed ? (
          <>
            <button
              type="button"
              onClick={() =>
                onNavigate({
                  id: 'home',
                  label: 'Home',
                  hash: '#home',
                  icon: Smartphone,
                  type: 'section'
                })
              }
              className="flex items-center gap-3 cursor-pointer group text-left min-w-0"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-900 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform shrink-0">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-black tracking-tight text-slate-900 truncate">
                    RAZY PAY
                  </span>
                  <span className="px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                    Pay System
                  </span>
                </div>
                <p className="text-[10px] font-semibold text-slate-400 truncate">
                  Financial Operating System
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              title="Hide Sidebar Menu Text (Collapse)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-indigo-900 hover:bg-indigo-50 transition-colors cursor-pointer"
            title="Expand Sidebar Menu (Show Text)"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Refurbished Trust Banner (only when expanded) */}
      {!isCollapsed && (
        <div className="px-4 pt-3 pb-1 space-y-2">
          {onOpenRushPay && (
            <button
              type="button"
              onClick={onOpenRushPay}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-blue-950/20 cursor-pointer active:scale-95 transition-all text-left"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/30 flex items-center justify-center text-blue-300">
                  <Zap className="w-3.5 h-3.5 fill-blue-300" />
                </div>
                <div>
                  <span className="block font-black text-white text-[11px] leading-tight">RAZY PAY</span>
                  <span className="text-[9px] text-blue-300 font-normal">Fintech Settlement Hub</span>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-300" />
            </button>
          )}

          <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold block">Certified Refurbished Store</span>
              <span className="text-[10px] text-emerald-700">No Extra Charge • Fast Delivery</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Groups List */}
      <nav className={`flex-1 py-3 space-y-4 overflow-y-auto text-xs ${isCollapsed ? 'px-2' : 'px-3'}`}>
        {/* User Navigation Groups */}
        {navGroups.map((group) => {
          const isExpanded = expandedGroups[group.id] !== false;
          return (
            <div key={group.id} className="space-y-1">
              {/* Group Title Toggle */}
              {!isCollapsed ? (
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
              ) : (
                <div className="h-px bg-slate-200 my-2 mx-1" />
              )}

              {/* Group Items */}
              {(isExpanded || isCollapsed) && (
                <div className={`space-y-0.5 ${isCollapsed ? '' : 'pl-1'}`}>
                  {group.items.map((item) => {
                    const IconComponent = item.icon;
                    const isActive = activeSection === item.id;
                    const badgeText = item.id === 'explore' ? `${phoneCount}` : item.badge;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onNavigate(item)}
                        className={`w-full flex items-center rounded-xl transition-all cursor-pointer group ${
                          isCollapsed
                            ? 'justify-center p-2.5'
                            : 'justify-between px-3 py-2 text-left'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-800 text-white font-bold shadow-xs shadow-indigo-950/15'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-medium'
                        }`}
                        title={item.label + (item.description ? ` - ${item.description}` : '')}
                      >
                        <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                          <IconComponent
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive ? 'text-purple-200' : 'text-slate-400 group-hover:text-indigo-600'
                            }`}
                          />
                          {!isCollapsed && (
                            <span className="truncate text-xs">{item.label}</span>
                          )}
                        </div>

                        {!isCollapsed && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ml-1.5 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : item.badgeColor || 'bg-purple-100 text-purple-800'
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

        {/* Separator to Admin Navigation */}
        <div className="pt-2 border-t border-slate-200/90">
          {ADMIN_NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups[group.id] !== false;
            return (
              <div key={group.id} className="space-y-1">
                {/* Admin Group Title with Lock/Status */}
                {!isCollapsed ? (
                  <>
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-purple-50/70 border border-purple-100">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-purple-950 hover:text-purple-800 cursor-pointer flex-1 text-left"
                      >
                        <Shield className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                        <span className="truncate">Admin Dashboard</span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-purple-400 ml-auto" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-purple-400 ml-auto" />
                        )}
                      </button>
                    </div>

                    {/* Admin Auth Status Strip */}
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
                          className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Lock</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="h-px bg-purple-200 my-2 mx-1" />
                )}

                {/* Admin Items */}
                {(isExpanded || isCollapsed) && (
                  <div className={`space-y-0.5 ${isCollapsed ? '' : 'pl-1'}`}>
                    {group.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = activeSection === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => onNavigate(item)}
                          className={`w-full flex items-center rounded-xl transition-all cursor-pointer group ${
                            isCollapsed
                              ? 'justify-center p-2.5'
                              : 'justify-between px-3 py-2 text-left'
                          } ${
                            isActive
                              ? 'bg-purple-900 text-white font-bold shadow-xs'
                              : 'text-slate-600 hover:text-purple-950 hover:bg-purple-50/80 font-medium'
                          }`}
                          title={item.label + (item.description ? ` - ${item.description}` : '')}
                        >
                          <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : 'gap-2.5'}`}>
                            <IconComponent
                              className={`w-4 h-4 shrink-0 ${
                                isActive ? 'text-purple-200' : 'text-purple-500 group-hover:text-purple-700'
                              }`}
                            />
                            {!isCollapsed && <span className="truncate text-xs">{item.label}</span>}
                          </div>

                          {!isCollapsed && item.badge && (
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
      </nav>

      {/* Sidebar Footer Info */}
      <div className={`p-3 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 ${isCollapsed ? 'flex justify-center' : 'space-y-1.5'}`}>
        <a
          href="https://t.me/Chandanstoresupport"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 font-bold text-sky-700 hover:text-sky-800 transition-colors"
          title="Telegram Support: @Chandanstoresupport"
        >
          <Send className="w-4 h-4 text-sky-600 shrink-0" />
          {!isCollapsed && <span>Telegram Support</span>}
        </a>
        {!isCollapsed && (
          <p className="text-[10px] text-slate-400">
            Gandhi Nagar, Dukan No. 12, Patna
          </p>
        )}
      </div>
    </aside>
  );
};
