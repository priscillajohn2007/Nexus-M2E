import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Bell, 
  Send, 
  Mail, 
  User, 
  ShieldCheck,
  Download
} from 'lucide-react';
import { MeetingTask, DecisionRecord, TeamMember, MeetingRecord } from '../types/index.js';

interface DigestScreenProps {
  tasks: MeetingTask[];
  decisions: DecisionRecord[];
  meetings: MeetingRecord[];
  teamMembers: TeamMember[];
  activeUser: TeamMember;
  onSelectUser?: (user: TeamMember) => void;
}

export const DigestScreen: React.FC<DigestScreenProps> = ({
  tasks,
  decisions,
  meetings,
  teamMembers,
  activeUser,
  onSelectUser
}) => {
  const [selectedUser, setSelectedUser] = useState<TeamMember>(activeUser);
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');

  // Keep in sync whenever active profile is changed from Header or elsewhere
  useEffect(() => {
    if (activeUser) {
      setSelectedUser(activeUser);
    }
  }, [activeUser]);

  // Ground-truth extraction for selectedUser
  const userTasks = tasks.filter(t => {
    if (selectedUser.id === 'user-organizer') {
      return !t.ownerId || t.ownerId === 'user-organizer' || (t.ownerName && t.ownerName.toLowerCase().includes('organizer'));
    }
    const selFirstName = selectedUser.name.toLowerCase().split(' ')[0];
    const taskOwnerLower = (t.ownerName || '').toLowerCase();
    return t.ownerId === selectedUser.id || (taskOwnerLower && taskOwnerLower.includes(selFirstName));
  });

  const completed = userTasks.filter(t => t.status === 'done');
  const inProgress = userTasks.filter(t => t.status === 'in_progress' || t.status === 'todo');
  const blocked = userTasks.filter(t => t.status === 'blocked');
  const overdue = userTasks.filter(t => t.urgency === 'overdue' && t.status !== 'done');

  // Recent decisions in the project
  const recentDecisions = decisions.slice(0, 4);

  const handleSimulateEmail = () => {
    setSendSuccessMsg(`Digest dispatch simulated to ${selectedUser.email}. Email transport is running in internal log mode (Configure SMTP in settings for production relay).`);
    setTimeout(() => setSendSuccessMsg(''), 5000);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
              Monday Morning Sync
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Ground-Truth Generation
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A] mt-0.5">
            Personalized Executive Digest
          </h2>
          <p className="text-xs text-slate-500">
            Synthesized strictly from confirmed database records. Zero hallucinated progress.
          </p>
        </div>

        {/* Member Switcher */}
        <div className="flex items-center gap-2">
          <select
            value={selectedUser.id}
            onChange={(e) => {
              const u = teamMembers.find(m => m.id === e.target.value);
              if (u) {
                setSelectedUser(u);
                if (onSelectUser) onSelectUser(u);
              }
            }}
            className="text-xs px-3 py-2 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          >
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.role.split('&')[0]})</option>
            ))}
          </select>

          <button
            onClick={handleSimulateEmail}
            className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Send Email</span>
          </button>
        </div>
      </div>

      {sendSuccessMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
          <span>{sendSuccessMsg}</span>
        </div>
      )}

      {/* Printable Digest Preview Card */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm space-y-6">
        {/* Digest Header */}
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Weekly Execution Summary
            </div>
            <h3 className="text-lg font-bold text-[#1B2A4A]">
              Alignment Brief for {selectedUser.name}
            </h3>
            <div className="text-xs text-slate-500">
              Role: {selectedUser.role} · Email: {selectedUser.email}
            </div>
          </div>
          <div className="text-right text-xs text-slate-400">
            <div>Schedule: Monday 09:00 AM</div>
            <div className="font-semibold text-slate-600">Sprint Week 44</div>
          </div>
        </div>

        {/* Section 1: Completed Achievements */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-emerald-700 tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Completed This Sprint ({completed.length})</span>
          </div>
          {completed.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No tasks marked done in this sprint window yet.</p>
          ) : (
            <div className="space-y-2">
              {completed.map(t => (
                <div key={t.id} className="p-3 bg-emerald-50/40 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#1B2A4A]">{t.title}</span>
                    <div className="text-slate-500 text-[11px]">Meeting: {t.meetingTitle}</div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    COMPLETED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Active & Upcoming Deadlines */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#1B2A4A] tracking-wider">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span>Pending Work &amp; Deadlines ({inProgress.length})</span>
          </div>
          {inProgress.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No pending action items assigned.</p>
          ) : (
            <div className="space-y-2">
              {inProgress.map(t => (
                <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#1B2A4A]">{t.title}</span>
                    <div className="text-slate-500 text-[11px]">Meeting: {t.meetingTitle} · Deadline: {t.dueDate}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    t.urgency === 'due_tomorrow' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {t.urgency === 'due_tomorrow' ? 'DUE TOMORROW' : 'IN PROGRESS'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Blockers Requiring Attention */}
        {blocked.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-red-700 tracking-wider">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>Reported Blockers ({blocked.length})</span>
            </div>
            <div className="space-y-2">
              {blocked.map(t => (
                <div key={t.id} className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-1">
                  <div className="font-bold text-red-950">{t.title}</div>
                  <div className="text-red-800 text-[11px]">
                    <strong>Blocker Note:</strong> {t.blockerNote || 'Blocked pending prerequisite task'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Decisions Affecting You */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#1B2A4A] tracking-wider">
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Recent Decision Precedents</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDecisions.map(d => (
              <div key={d.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1B2A4A]">{d.title}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    d.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  &quot;{d.statement}&quot;
                </p>
                <div className="text-[10px] text-slate-400">
                  {d.meetingTitle} ({d.date})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
