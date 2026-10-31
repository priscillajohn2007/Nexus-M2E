import React, { useState } from 'react';
import { 
  Mic, 
  FileCheck, 
  AlertTriangle, 
  Clock, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  UserX, 
  HelpCircle, 
  Sparkles,
  GitBranch,
  Quote,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { 
  DashboardMetrics, 
  DecisionRecord, 
  DecisionConflict, 
  MeetingTask, 
  MeetingRecord,
  NavScreen 
} from '../types/index.js';
import { api } from '../services/api.js';

interface OverviewScreenProps {
  metrics: DashboardMetrics;
  decisions: DecisionRecord[];
  conflicts: DecisionConflict[];
  tasks: MeetingTask[];
  meetings: MeetingRecord[];
  onNavigate: (screen: NavScreen) => void;
  onOpenDemoModal: () => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  metrics,
  decisions,
  conflicts,
  tasks,
  meetings,
  onNavigate,
  onOpenDemoModal
}) => {
  // "Ask your meetings" QA state
  const [queryInput, setQueryInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<{
    answer: string;
    citedDecisions: DecisionRecord[];
    citedMeetings: string[];
  } | null>(null);

  const handleAskMeetings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryInput.trim()) return;

    try {
      setIsAsking(true);
      const res = await api.askMeetings(queryInput.trim());
      setQaAnswer(res);
    } catch (err: any) {
      console.error('Ask meetings error:', err);
    } finally {
      setIsAsking(false);
    }
  };

  const sampleQuestions = [
    'What did we decide about the database engine and why?',
    'What is our compliance policy regarding data residency?',
    'Why was the MySQL decision superseded?'
  ];

  // Attention items
  const pendingConflicts = conflicts.filter(c => c.status === 'pending');
  const unassignedTasks = tasks.filter(t => !t.ownerId || t.ownerConfidence < 0.65);
  const overdueTasks = tasks.filter(t => t.urgency === 'overdue' && t.status !== 'done');

  // Sorted decisions for timeline
  const sortedDecisions = [...decisions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome with Demo Quick Action */}
      <div className="bg-gradient-to-r from-blue-600 to-[#1B2A4A] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2 py-0.5 rounded text-blue-100">
              Cross-Meeting Intelligence
            </span>
            <span className="text-xs text-blue-200">Zero-Unredacted Privacy</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Nexus-M2E Decision Governance &amp; Memory Center
          </h2>
          <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
            Continuously reconciling meeting transcripts against past commitments. Detects contradictions, capacity limits, and timeline inversions before tasks are dispatched.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('speak')}
            className="px-4 py-2.5 bg-white text-[#2563EB] hover:bg-blue-50 font-semibold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-colors"
          >
            <Mic className="w-4 h-4" />
            <span>Speak Meeting</span>
          </button>
          <button
            onClick={onOpenDemoModal}
            className="px-4 py-2.5 bg-blue-700/60 hover:bg-blue-700 border border-white/20 text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demo</span>
          </button>
        </div>
      </div>

      {/* METRIC CARDS WITH LINE ICONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Meetings Processed */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Meetings Processed
            </div>
            <div className="text-2xl font-bold text-[#1B2A4A]">
              {metrics.meetingsProcessed}
            </div>
            <div className="text-[11px] text-slate-400">
              {meetings.length} sessions logged
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-[#2563EB]">
            <Mic className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Approvals
            </div>
            <div className="text-2xl font-bold text-[#1B2A4A]">
              {metrics.pendingApprovals}
            </div>
            <div className="text-[11px] text-amber-600 font-medium">
              Awaiting dispatch gate
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Unresolved Conflicts */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Unresolved Conflicts
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics.unresolvedConflicts}
            </div>
            <div className="text-[11px] text-red-600 font-medium">
              {pendingConflicts.length > 0 ? 'Requires human resolution' : 'Clean baseline'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Overdue Tasks
            </div>
            <div className="text-2xl font-bold text-[#1B2A4A]">
              {metrics.overdueTasks}
            </div>
            <div className="text-[11px] text-slate-400">
              Avg approval: {metrics.avgTimeToApprovalMinutes}m
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* "ASK YOUR MEETINGS" BOX */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                Ask Your Meetings
              </h3>
              <p className="text-[11px] text-slate-500">
                Natural-language Q&amp;A answered strictly from stored historical decisions with exact cited quotes.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
            Ground-Truth RAG
          </span>
        </div>

        <form onSubmit={handleAskMeetings} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. What did we decide about MySQL vs PostgreSQL?"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#1B2A4A]"
            />
          </div>
          <button
            type="submit"
            disabled={isAsking}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition-all shadow-xs flex items-center gap-2 shrink-0"
          >
            {isAsking ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <span>Ask</span>
            )}
          </button>
        </form>

        {/* Quick Sample Prompts */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-600">Try asking:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryInput(q);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* QA Result Presentation */}
        {qaAnswer && (
          <div className="mt-4 p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Synthesized Ground-Truth Answer:</span>
            </div>
            <p className="text-sm text-[#1B2A4A] leading-relaxed">
              {qaAnswer.answer}
            </p>

            {/* Citations */}
            {qaAnswer.citedDecisions.length > 0 && (
              <div className="pt-2 border-t border-blue-200/60 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Cited Decisions &amp; Records:
                </span>
                <div className="space-y-1.5">
                  {qaAnswer.citedDecisions.map(d => (
                    <div
                      key={d.id}
                      className="p-2 bg-white rounded border border-blue-100 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            d.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {d.status}
                        </span>
                        <span className="font-semibold text-[#1B2A4A]">{d.title}</span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {d.meetingTitle} ({d.date}) · {d.speaker}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TWO COLUMN GRID: "Needs attention" & "Decision timeline" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Needs Attention List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Needs Attention
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                {pendingConflicts.length + unassignedTasks.length + overdueTasks.length} action items
              </span>
            </div>

            <div className="space-y-3">
              {/* Conflicts Attention */}
              {pendingConflicts.map(conf => (
                <div
                  key={conf.id}
                  className="p-3 bg-red-50/70 border border-red-200 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-bold text-red-700 bg-red-100/70 px-1.5 py-0.5 rounded">
                      Critical Conflict
                    </span>
                    <button
                      onClick={() => onNavigate('review')}
                      className="text-xs font-bold text-red-700 hover:text-red-900 flex items-center gap-1"
                    >
                      <span>Resolve</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-[#1B2A4A]">
                    {conf.rationale}
                  </div>
                </div>
              ))}

              {/* Unassigned Tasks Missing Owner Nudge */}
              {unassignedTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      [UNASSIGNED - ACTION REQUIRED]
                    </span>
                    <button
                      onClick={() => onNavigate('review')}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1"
                    >
                      <span>Assign</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="text-xs font-semibold text-[#1B2A4A]">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Source: {task.meetingTitle} (Due: {task.dueDate})
                  </div>
                </div>
              ))}

              {/* Overdue Tasks */}
              {overdueTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                      Overdue Task
                    </span>
                    <span className="text-[11px] text-red-600 font-semibold">
                      Due: {task.dueDate}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-[#1B2A4A]">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Owner: {task.ownerName || 'Unassigned'}
                  </div>
                </div>
              ))}

              {pendingConflicts.length === 0 && unassignedTasks.length === 0 && overdueTasks.length === 0 && (
                <div className="py-6 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-slate-600">All attention items clear!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Decision Timeline with Active / Superseded Badges (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#1B2A4A]">
                  Decision Timeline &amp; Evolution
                </h3>
              </div>
              <button
                onClick={() => onNavigate('decisions')}
                className="text-xs font-semibold text-[#2563EB] hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Full Log</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {sortedDecisions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-2">
                <GitBranch className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-600">No decisions recorded yet</p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  Dictate or upload your first meeting in &quot;Speak your meeting&quot;, or click &quot;Demo&quot; to test decision evolution.
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {sortedDecisions.slice(0, 5).map(dec => {
                const isActive = dec.status === 'active';
                const isSuperseded = dec.status === 'superseded';
                const isProposed = dec.status === 'proposed';

                return (
                  <div key={dec.id} className="relative space-y-1.5">
                    {/* Timeline Node Icon */}
                    <div
                      className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isActive
                          ? 'bg-emerald-500 ring-4 ring-emerald-50'
                          : isSuperseded
                          ? 'bg-slate-400'
                          : 'bg-amber-400'
                      }`}
                    />

                    {/* Metadata & Status Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        {dec.date}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {dec.meetingTitle}
                      </span>
                      <span className="text-slate-300">·</span>
                      {/* PALE TINT STATUS BADGE */}
                      {isActive && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active (Confirmed)
                        </span>
                      )}
                      {isSuperseded && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          Superseded
                        </span>
                      )}
                      {isProposed && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Proposed (Discussed)
                        </span>
                      )}
                    </div>

                    {/* Decision Content */}
                    <div className="text-sm font-bold text-[#1B2A4A]">
                      {dec.title}
                    </div>
                    <div className="text-xs text-slate-600 leading-relaxed">
                      &quot;{dec.statement}&quot;
                    </div>

                    {/* Superseded Link Indicator */}
                    {isSuperseded && (
                      <div className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200 flex items-center gap-1.5 font-medium">
                        <ArrowRight className="w-3 h-3 text-amber-700" />
                        <span>Superseded by PostgreSQL 16 decision in follow-up sync</span>
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
