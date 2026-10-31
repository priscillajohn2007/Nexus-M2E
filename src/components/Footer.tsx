import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mic, 
  CheckCircle2, 
  Scale, 
  GitBranch, 
  Calendar, 
  Sparkles, 
  RotateCcw,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { TeamMember, NavScreen } from '../types/index.js';

interface FooterProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  activeUser: TeamMember;
  onOpenDemoModal: () => void;
  totalMeetingsCount: number;
  totalDecisionsCount: number;
}

export const Footer: React.FC<FooterProps> = ({
  currentScreen,
  onNavigate,
  activeUser,
  onOpenDemoModal,
  totalMeetingsCount,
  totalDecisionsCount
}) => {
  return (
    <footer className="bg-white border-t border-[#E2E8F0] text-[#1B2A4A] mt-auto">
      {/* Upper Footer Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8">
          {/* Col 1: Brand & Architecture (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white font-bold text-sm shadow-xs">
                N
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1B2A4A] tracking-tight text-base">
                  Nexus-M2E
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Agent v1.0
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Voice-first, privacy-safe Meeting-to-Execution governance. Eliminates forgotten commitments through continuous cross-meeting memory, pre-storage PII redaction, and 4-dimensional conflict arbitration.
            </p>

            <div className="flex items-center gap-2 text-xs pt-1">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold text-[11px]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Zero Unredacted Storage Active</span>
              </div>
            </div>
          </div>

          {/* Col 2: Core Workspace Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Workspace Hubs
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
              <li>
                <button
                  onClick={() => onNavigate('overview')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>Overview &amp; Executive Metrics</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('speak')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>Speak Your Meeting (Mic &amp; Wispr Flow)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('review')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>Review Screen &amp; Idempotent Dispatch</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('my-work')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>My Work (Mobile-First Inbox)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('decisions')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>Decisions Log &amp; Precedence Chains</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('conflicts')}
                  className="hover:text-[#2563EB] transition-colors flex items-center gap-1.5"
                >
                  <span>Conflict Detection Center</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Privacy & Security Assurances (2 cols) */}
          <div className="lg:col-span-2 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Security &amp; Policy
            </div>
            <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
              <li className="flex items-center gap-1 text-slate-600">
                <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Pre-Storage Masking</span>
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>SOC2 US-East-1 Gate</span>
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Epistemic Threshold &ge; 0.85</span>
              </li>
              <li className="flex items-center gap-1 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>RFC 5545 iCalendar</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Active Profile & Test Suite (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Persona &amp; Demo
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeUser.avatar}
                  alt={activeUser.name}
                  className="w-8 h-8 rounded-full object-cover border border-slate-300"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[#1B2A4A] truncate">
                    {activeUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {activeUser.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Capacity:</span>
                <span className="font-semibold text-slate-700">
                  {activeUser.allocatedHours}h / {activeUser.weeklyCapacityHours}h
                </span>
              </div>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Demo Cases &amp; Test Suite</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sub-bar */}
      <div className="border-t border-[#E2E8F0] bg-[#F8FAFC] py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span>&copy; {new Date().getFullYear()} Nexus-M2E. All rights reserved.</span>
            <span>·</span>
            <span>State: {totalMeetingsCount} meetings, {totalDecisionsCount} decisions recorded</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-[#2563EB]" />
              <span>Full-Stack Express + React</span>
            </span>
            <span>·</span>
            <span>Browser Web Speech API</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
