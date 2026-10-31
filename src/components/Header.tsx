import React, { useState } from 'react';
import { 
  Sparkles, 
  Mic, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  ChevronDown, 
  CheckCircle2 
} from 'lucide-react';
import { TeamMember, NavScreen, UserProfile, UserRole } from '../types/index.js';

interface HeaderProps {
  currentScreen: NavScreen;
  teamMembers: TeamMember[];
  activeUser: TeamMember;
  onSelectUser: (user: TeamMember) => void;
  onOpenDemoModal: () => void;
  onQuickLoadDemo: () => void;
  isListening: boolean;
  onToggleListening: () => void;
  user?: UserProfile | null;
  userRole?: UserRole | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  teamMembers,
  activeUser,
  onSelectUser,
  onOpenDemoModal,
  isListening,
  onToggleListening,
  user,
  userRole,
  onLogout
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const screenTitles: Record<NavScreen, { title: string; subtitle: string }> = {
    overview: { 
      title: 'Executive Dashboard & Project Memory', 
      subtitle: 'Real database-backed metrics, conflict alerts, and cross-meeting decision timeline' 
    },
    speak: { 
      title: 'Speak Your Meeting', 
      subtitle: 'Voice-first capture with pre-storage PII redaction and Wispr Flow style dictated buffer' 
    },
    review: { 
      title: 'Meeting Review & Dispatch Hub', 
      subtitle: 'Sub-45s review card with conflict arbiters, epistemic certainty, and owner resolution' 
    },
    'my-work': { 
      title: 'My Work — Mobile-First Task Inbox', 
      subtitle: 'Personalized action items, decision-change alerts, and 1-tap progress synchronization' 
    },
    decisions: { 
      title: userRole === 'participant' ? 'Relevant Decisions & Context' : 'Decision Log & Precedence History', 
      subtitle: 'Searchable decision memory with epistemic certainty scores and superseded chains' 
    },
    conflicts: { 
      title: 'Conflict Detection & Resolution Center', 
      subtitle: 'Four-dimensional conflict arbiter: contradictions, capacity, timeline & policy rules' 
    },
    tasks: { 
      title: 'Cross-Team Action Items Board', 
      subtitle: 'Idempotent dispatch, evidence context, calendar .ics exports, and tracker sync' 
    },
    digest: { 
      title: 'Weekly Executive Digest', 
      subtitle: 'Ground-truth summary generated exclusively from confirmed decisions and tasks' 
    },
    settings: { 
      title: 'System Settings & Compliance Policy', 
      subtitle: 'Configure external trackers, privacy redaction patterns, and architectural constraints' 
    }
  };

  const currentMeta = screenTitles[currentScreen] || { title: 'Workspace', subtitle: '' };
  const isParticipant = userRole === 'participant';

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-base font-bold text-[#1B2A4A] leading-tight">
            {currentMeta.title}
          </h1>
          <p className="text-xs text-slate-500 hidden sm:block">
            {currentMeta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Voice Dictation Quick Toggle - only shown for organizers or in voice contexts */}
        {!isParticipant && (
          <button
            onClick={onToggleListening}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              isListening
                ? 'bg-red-50 text-red-700 border border-red-300 animate-pulse'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Voice command recognition (e.g. 'approve all tasks', 'off the record', 'show my tasks')"
          >
            <Mic className={`w-3.5 h-3.5 ${isListening ? 'text-red-600' : 'text-slate-500'}`} />
            <span>{isListening ? 'Listening (Mic Active)' : 'Voice Mic'}</span>
          </button>
        )}

        {/* Demo Option Button */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          title="Open Demo Cases & Test Scenarios"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Demo</span>
        </button>

        {/* User Account / Role dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:bg-slate-50 transition-colors text-left cursor-pointer"
          >
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {user?.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-[#1B2A4A] leading-tight">
                {user?.fullName || 'User'}
              </div>
              <div className="text-[10px] text-slate-500 leading-none capitalize">
                {userRole === 'organizer' ? 'Meeting Organizer' : 'Participant'}
              </div>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-[#1B2A4A]">{user?.fullName}</div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                    userRole === 'organizer' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {userRole === 'organizer' ? 'Meeting Organizer' : 'Participant'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Persona preview switcher for organizers testing attendee views */}
              {userRole === 'organizer' && (
                <div className="py-2 border-b border-slate-100">
                  <div className="px-4 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Simulate Attendee Persona (My Work)
                  </div>
                  {teamMembers.slice(0, 3).map(member => (
                    <button
                      key={member.id}
                      onClick={() => {
                        onSelectUser(member);
                        setProfileDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-4 py-1.5 text-left hover:bg-slate-50 text-xs ${
                        activeUser.id === member.id ? 'text-blue-600 font-semibold' : 'text-slate-600'
                      }`}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="truncate">{member.name} ({member.role.split('&')[0]})</span>
                      {activeUser.id === member.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Sign Out Button */}
              <div className="pt-1">
                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
