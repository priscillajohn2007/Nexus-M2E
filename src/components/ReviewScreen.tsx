import React, { useState } from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  User, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink, 
  Sparkles, 
  Check, 
  X, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Send,
  Eye,
  Trash2,
  Edit2
} from 'lucide-react';
import { 
  DecisionConflict, 
  MeetingTask, 
  DecisionRecord, 
  TeamMember,
  MeetingRecord 
} from '../types/index.js';
import { api } from '../services/api.js';

interface ReviewScreenProps {
  currentMeeting?: MeetingRecord;
  conflicts: DecisionConflict[];
  tasks: MeetingTask[];
  decisions: DecisionRecord[];
  teamMembers: TeamMember[];
  onConflictResolved: (conflictId: string, action: 'accept' | 'keep_old' | 'dismiss') => void;
  onTasksDispatched: () => void;
  onTaskUpdated: (task: MeetingTask) => void;
}

export const ReviewScreen: React.FC<ReviewScreenProps> = ({
  currentMeeting,
  conflicts,
  tasks,
  decisions,
  teamMembers,
  onConflictResolved,
  onTasksDispatched,
  onTaskUpdated
}) => {
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchStatusMsg, setDispatchStatusMsg] = useState('');
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Toggle "Show context" evidence accordion
  const toggleContext = (id: string) => {
    setExpandedContexts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // "Confirm and dispatch all" handler
  const handleConfirmAndDispatchAll = async () => {
    try {
      setIsDispatching(true);
      setDispatchStatusMsg('');

      const result = await api.dispatchAllTasks();
      if (result.success) {
        setDispatchStatusMsg(`Successfully dispatched ${result.dispatchedCount} tasks with idempotent keys.`);
        onTasksDispatched();
        setTimeout(() => setDispatchStatusMsg(''), 4500);
      }
    } catch (err: any) {
      setDispatchStatusMsg(`Dispatch warning: ${err.message}`);
    } finally {
      setIsDispatching(false);
    }
  };

  // Quick owner assignment for unassigned tasks
  const handleAssignOwner = async (taskId: string, memberId: string) => {
    try {
      const res = await api.updateTask(taskId, { ownerId: memberId });
      if (res.success && res.task) {
        onTaskUpdated(res.task);
      }
    } catch (err) {
      console.error('Failed to assign owner:', err);
    }
  };

  // Conflict action handler
  const handleConflictAction = async (conflictId: string, action: 'accept' | 'keep_old' | 'dismiss') => {
    await onConflictResolved(conflictId, action);
  };

  // Active / pending conflicts
  const activeConflicts = conflicts.filter(c => c.status === 'pending');
  // Pending tasks
  const unapprovedTasks = tasks.filter(t => !t.isDispatched);
  const displayTasks = unapprovedTasks.length > 0 ? unapprovedTasks : tasks.slice(0, 6);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Review Header with "Confirm and dispatch all" */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
              Sub-45s Rapid Review
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {currentMeeting ? currentMeeting.title : 'Active Session Review'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A] mt-0.5">
            Meeting Review &amp; Execution Gate
          </h2>
          <p className="text-xs text-slate-500">
            Audit conflicts, confirm accountable owners, and dispatch action items to execution trackers.
          </p>
        </div>

        {/* Primary Header Action */}
        <div className="flex items-center gap-3">
          {dispatchStatusMsg && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              {dispatchStatusMsg}
            </span>
          )}
          <button
            onClick={handleConfirmAndDispatchAll}
            disabled={isDispatching}
            className="px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-sm shadow-sm flex items-center gap-2 transition-all shrink-0"
          >
            {isDispatching ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Confirm and dispatch all</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: RED CONFLICT CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">
              Decision Conflicts ({activeConflicts.length} Unresolved)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Cross-meeting memory arbiter comparison
          </span>
        </div>

        {activeConflicts.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 text-center text-slate-500 text-sm">
            <CheckCircle className="w-7 h-7 text-emerald-500 mx-auto mb-2" />
            <div className="font-semibold text-slate-700">No Blocking Conflicts Detected</div>
            <div className="text-xs text-slate-400 mt-0.5">
              All proposed decisions and tasks are aligned with stored project memory.
            </div>
          </div>
        ) : (
          activeConflicts.map(conflict => (
            <div
              key={conflict.id}
              className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-xs space-y-4"
            >
              {/* Conflict Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                    CRITICAL CONFLICT
                  </span>
                  <span className="text-xs font-semibold text-slate-600 capitalize">
                    {conflict.conflictType.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-red-700">
                    {Math.round(conflict.confidence * 100)}% Confidence
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-slate-500">Blocks Dispatch</span>
                </div>
              </div>

              {/* Earlier Decision vs New Statement Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Earlier Decision (Past Memory) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-slate-600">
                      Earlier Decision
                    </span>
                    <span>{conflict.earlierDecision.meetingDate}</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Meeting: {conflict.earlierDecision.meetingTitle} ({conflict.earlierDecision.owner})
                  </div>
                  <div className="text-sm font-semibold text-[#1B2A4A] leading-relaxed">
                    &quot;{conflict.earlierDecision.statement}&quot;
                  </div>
                </div>

                {/* New Statement (Current Meeting) */}
                <div className="p-3.5 bg-red-50/50 border border-red-200 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-xs text-red-700">
                    <span className="font-semibold uppercase tracking-wider">
                      New Statement / Proposal
                    </span>
                    <span>{conflict.newStatement.meetingDate}</span>
                  </div>
                  <div className="text-xs text-red-600 font-medium">
                    Speaker: {conflict.newStatement.speaker} · {conflict.newStatement.meetingTitle}
                  </div>
                  <div className="text-sm font-semibold text-[#1B2A4A] leading-relaxed">
                    &quot;{conflict.newStatement.statement}&quot;
                  </div>
                </div>
              </div>

              {/* Plain-Language Rationale & Recommended Action */}
              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-800">Rationale:</strong> {conflict.rationale}
                </div>
                <div>
                  <strong className="text-slate-800">Recommended Action:</strong> {conflict.recommendedAction}
                </div>
              </div>

              {/* Action Buttons: Accept change / Keep old decision / Dismiss */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleConflictAction(conflict.id, 'dismiss')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleConflictAction(conflict.id, 'keep_old')}
                  className="px-3.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 text-xs font-semibold rounded-lg transition-colors"
                >
                  Keep old decision
                </button>
                <button
                  onClick={() => handleConflictAction(conflict.id, 'accept')}
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                >
                  Accept change (Supersede)
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECTION 2: PROPOSED TASKS LIST */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#1B2A4A] uppercase tracking-wider">
              Proposed Tasks ({displayTasks.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Click &quot;Show context&quot; to review transcript quotes
          </span>
        </div>

        <div className="space-y-3">
          {displayTasks.map(task => {
            const isUnassigned = !task.ownerId || task.ownerConfidence < 0.65;
            const isContextOpen = Boolean(expandedContexts[task.id]);

            return (
              <div
                key={task.id}
                className="bg-white border border-[#E2E8F0] hover:border-slate-300 rounded-xl p-4 shadow-xs space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#1B2A4A]">
                        {task.title}
                      </span>
                      {/* AMBER UNASSIGNED BADGE WHEN OWNER UNKNOWN */}
                      {isUnassigned ? (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                          [UNASSIGNED - ACTION REQUIRED]
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Confidence: {Math.round(task.ownerConfidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {task.description}
                    </p>
                  </div>

                  {/* Owner Selector Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      {task.ownerAvatar ? (
                        <img
                          src={task.ownerAvatar}
                          alt={task.ownerName}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px]">
                          ?
                        </div>
                      )}
                      <select
                        value={task.ownerId || ''}
                        onChange={(e) => handleAssignOwner(task.id, e.target.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#2563EB] font-medium ${
                          isUnassigned
                            ? 'bg-amber-50/70 border-amber-300 text-amber-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-[#1B2A4A]'
                        }`}
                      >
                        <option value="">-- Choose Owner --</option>
                        {teamMembers.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.role.split('&')[0]})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Due Date Indicator */}
                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.dueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Evidence Context Accordion */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleContext(task.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-blue-700 transition-colors"
                  >
                    <span>{isContextOpen ? 'Hide context' : 'Show context'}</span>
                    {isContextOpen ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="text-[11px] text-slate-400">
                    Source: {task.meetingTitle} · Speaker: {task.speaker}
                  </div>
                </div>

                {isContextOpen && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                      Ground-Truth Transcript Evidence:
                    </div>
                    <blockquote className="italic border-l-2 border-[#2563EB] pl-2.5 py-0.5 text-slate-700">
                      &quot;{task.evidenceContext}&quot;
                    </blockquote>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
