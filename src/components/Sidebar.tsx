import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  Scale, 
  AlertTriangle, 
  CheckSquare, 
  Briefcase, 
  FileText, 
  Settings, 
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';
import { NavScreen, UserRole, UserProfile } from '../types/index.js';

interface SidebarProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  unresolvedConflictsCount: number;
  myWorkCount: number;
  pendingApprovalsCount: number;
  userRole?: UserRole | null;
  user?: UserProfile | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  unresolvedConflictsCount,
  myWorkCount,
  pendingApprovalsCount,
  userRole,
  user,
  onLogout
}) => {
  // Organizer gets full navigation suite; Participant only gets My Work, Digest, Decisions, Settings
  const isParticipant = userRole === 'participant';

  const allNavItems: Array<{
    id: NavScreen;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: 'red' | 'amber' | 'blue';
    organizerOnly?: boolean;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, organizerOnly: true },
    { id: 'speak', label: 'Meetings', icon: Mic, badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined, badgeColor: 'blue', organizerOnly: true },
    { id: 'review', label: 'Review Hub', icon: ShieldCheck, organizerOnly: true },
    { id: 'decisions', label: isParticipant ? 'My Decisions' : 'Decisions', icon: Scale },
    { id: 'conflicts', label: 'Conflicts', icon: AlertTriangle, badge: unresolvedConflictsCount > 0 ? unresolvedConflictsCount : undefined, badgeColor: 'red', organizerOnly: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, organizerOnly: true },
    { id: 'my-work', label: 'My Work', icon: Briefcase, badge: myWorkCount > 0 ? myWorkCount : undefined, badgeColor: 'amber' },
    { id: 'digest', label: 'Digest', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const visibleNavItems = allNavItems.filter(item => !isParticipant || !item.organizerOnly);

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm font-bold text-lg">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#1B2A4A] tracking-tight text-base">Nexus-M2E</span>
                <span className={`text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded border ${
                  isParticipant 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isParticipant ? 'Member' : 'Agent'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Meeting-to-Execution</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase flex items-center justify-between">
            <span>{isParticipant ? 'Participant View' : 'Organizer Workspace'}</span>
            <span className="text-[10px] font-mono lowercase text-slate-400">{userRole || 'auth'}</span>
          </div>
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-[#2563EB] font-semibold'
                    : 'text-slate-600 hover:text-[#1B2A4A] hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      item.badgeColor === 'red'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : item.badgeColor === 'amber'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User profile & Working Logout */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC]">
        {user && (
          <div className="p-3.5 border-b border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-[#1B2A4A] truncate">{user.fullName}</div>
                <div className="text-[10px] text-slate-500 truncate">{user.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-[#1B2A4A]">Zero Unredacted Storage</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Pre-storage sanitization active. Raw secrets are stripped before AI calls or disk persistence.
          </p>
        </div>
      </div>
    </aside>
  );
};
