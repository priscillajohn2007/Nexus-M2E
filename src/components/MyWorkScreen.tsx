import React, { useState } from 'react';
import { 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HelpCircle, 
  Calendar, 
  ArrowRight, 
  UserMinus, 
  Download, 
  Smartphone, 
  Monitor, 
  ShieldAlert,
  ChevronDown,
  Bell,
  Check,
  RotateCw
} from 'lucide-react';
import { MeetingTask, TeamMember } from '../types/index.js';
import { api } from '../services/api.js';

interface MyWorkScreenProps {
  tasks: MeetingTask[];
  activeUser: TeamMember;
  onTaskUpdated: (task: MeetingTask) => void;
  onTaskReturnedToPool: (taskId: string) => void;
}

export const MyWorkScreen: React.FC<MyWorkScreenProps> = ({
  tasks,
  activeUser,
  onTaskUpdated,
  onTaskReturnedToPool
}) => {
  const [mobileSimulator, setMobileSimulator] = useState(false);
  const [blockerModalTaskId, setBlockerModalTaskId] = useState<string | null>(null);
  const [blockerNoteInput, setBlockerNoteInput] = useState('');
  const [snoozeOpenTaskId, setSnoozeOpenTaskId] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] = useState('');

  // Filter tasks assigned to current activeUser (or fallback to Priya if testing)
  const myTasks = tasks.filter(t => 
    t.ownerId === activeUser.id || 
    (t.ownerName && t.ownerName.toLowerCase().includes(activeUser.name.toLowerCase().split(' ')[0]))
  );

  // Group by urgency: Overdue, Due Tomorrow, Upcoming
  const overdueTasks = myTasks.filter(t => t.urgency === 'overdue' && t.status !== 'done');
  const dueTomorrowTasks = myTasks.filter(t => t.urgency === 'due_tomorrow' && t.status !== 'done');
  const upcomingTasks = myTasks.filter(t => t.urgency === 'upcoming' && t.status !== 'done');
  const completedTasks = myTasks.filter(t => t.status === 'done');

  // One-tap status updates
  const handleUpdateStatus = async (task: MeetingTask, newStatus: MeetingTask['status'], blockerNote?: string) => {
    try {
      const updates: Partial<MeetingTask> = { status: newStatus };
      if (blockerNote !== undefined) updates.blockerNote = blockerNote;

      const res = await api.updateTask(task.id, updates, activeUser.name);
      if (res.success && res.task) {
        onTaskUpdated(res.task);
        setStatusNotification(`Task status updated to ${newStatus.toUpperCase()}`);
        setTimeout(() => setStatusNotification(''), 3000);
      }
    } catch (err: any) {
      console.error('Failed to update status:', err);
    }
  };

  // Snooze task handler
  const handleSnooze = async (task: MeetingTask, days: number) => {
    const d = new Date(task.dueDate);
    d.setDate(d.getDate() + days);
    const newDueDate = d.toISOString().split('T')[0];

    try {
      const res = await api.updateTask(task.id, { 
        dueDate: newDueDate,
        snoozedUntil: newDueDate,
        urgency: days === 1 ? 'due_tomorrow' : 'upcoming'
      }, activeUser.name);

      if (res.success && res.task) {
        onTaskUpdated(res.task);
        setSnoozeOpenTaskId(null);
        setStatusNotification(`Snoozed task to ${newDueDate}`);
        setTimeout(() => setStatusNotification(''), 3000);
      }
    } catch (err) {
      console.error('Snooze failed:', err);
    }
  };

  // "Need help" flag handler
  const handleNeedHelp = async (task: MeetingTask) => {
    const nextVal = !task.needHelpFlag;
    try {
      const res = await api.updateTask(task.id, { needHelpFlag: nextVal }, activeUser.name);
      if (res.success && res.task) {
        onTaskUpdated(res.task);
        setStatusNotification(nextVal ? 'Flagged for manager assistance' : 'Help flag cleared');
        setTimeout(() => setStatusNotification(''), 3000);
      }
    } catch (err) {
      console.error('Help flag failed:', err);
    }
  };

  // "This task isn't mine" Handler
  const handleNotMyTask = async (task: MeetingTask) => {
    if (!window.confirm(`Return "${task.title}" to the unassigned pool? The organizer will be prompted to reassign it.`)) {
      return;
    }

    try {
      const res = await api.reassignFromMyWork(task.id, activeUser.name);
      if (res.success && res.task) {
        onTaskReturnedToPool(task.id);
        setStatusNotification(`Returned "${task.title}" to pool with [UNASSIGNED] tag.`);
        setTimeout(() => setStatusNotification(''), 4000);
      }
    } catch (err: any) {
      console.error('Reassign failed:', err);
    }
  };

  // Download .ics file
  const handleDownloadICS = (taskId: string) => {
    window.open(`/api/tasks/${taskId}/ics`, '_blank');
  };

  // Task card component
  const renderTaskCard = (task: MeetingTask) => {
    const isBlocked = task.status === 'blocked';
    const isInProgress = task.status === 'in_progress';
    const isDone = task.status === 'done';

    return (
      <div
        key={task.id}
        className={`bg-white border rounded-xl p-4 shadow-xs space-y-3 transition-all ${
          isBlocked
            ? 'border-red-300 bg-red-50/20'
            : isDone
            ? 'border-emerald-200 bg-emerald-50/10 opacity-75'
            : task.urgency === 'overdue'
            ? 'border-amber-300'
            : 'border-[#E2E8F0]'
        }`}
      >
        {/* DECISION-CHANGE ALERT BANNER */}
        {task.decisionAlert && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
            <Bell className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-amber-950">
                Decision Change Alert: {task.decisionAlert.title}
              </div>
              <div className="text-amber-800 leading-relaxed">
                {task.decisionAlert.message}
              </div>
            </div>
          </div>
        )}

        {/* Task Title & Status Badges */}
        <div className="space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-bold text-[#1B2A4A] leading-snug">
              {task.title}
            </span>
            <div className="flex items-center gap-1.5">
              {task.urgency === 'overdue' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Overdue
                </span>
              )}
              {task.urgency === 'due_tomorrow' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Due Tomorrow
                </span>
              )}
              {task.status === 'in_progress' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  In Progress
                </span>
              )}
              {task.status === 'blocked' && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  Blocked
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {task.description}
          </p>
        </div>

        {/* Source Quote Evidence Snippet */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
          <span className="font-semibold text-slate-700">Source:</span> {task.meetingTitle} ({task.meetingDate})
          <div className="italic text-slate-600 mt-0.5">
            &quot;{task.evidenceContext}&quot;
          </div>
        </div>

        {/* Blocker reason if blocked */}
        {task.blockerNote && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
            <strong>Blocker:</strong> {task.blockerNote}
          </div>
        )}

        {/* ONE-TAP STATUS ACTIONS: Start / Blocked / Done */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {/* Start Button */}
            <button
              onClick={() => handleUpdateStatus(task, 'in_progress')}
              disabled={isInProgress || isDone}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isInProgress
                  ? 'bg-blue-100 text-[#2563EB] cursor-default'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Play className="w-3 h-3 text-[#2563EB]" />
              <span>{isInProgress ? 'Started' : 'Start'}</span>
            </button>

            {/* Blocked Button */}
            <button
              onClick={() => {
                setBlockerModalTaskId(task.id);
                setBlockerNoteInput(task.blockerNote || '');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isBlocked
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertCircle className="w-3 h-3 text-red-600" />
              <span>Blocked</span>
            </button>

            {/* Done Button */}
            <button
              onClick={() => handleUpdateStatus(task, 'done')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDone
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Check className="w-3 h-3" />
              <span>{isDone ? 'Completed' : 'Done'}</span>
            </button>
          </div>

          {/* Quick Dropdown: Snooze, Need Help, .ics, Not Mine */}
          <div className="flex items-center gap-1.5">
            {/* Snooze Button */}
            <div className="relative">
              <button
                onClick={() => setSnoozeOpenTaskId(snoozeOpenTaskId === task.id ? null : task.id)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-medium flex items-center gap-1"
                title="Snooze deadline"
              >
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Snooze</span>
              </button>
              {snoozeOpenTaskId === task.id && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 text-xs">
                  <button
                    onClick={() => handleSnooze(task, 1)}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                  >
                    +1 Day (Tomorrow)
                  </button>
                  <button
                    onClick={() => handleSnooze(task, 3)}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                  >
                    +3 Days
                  </button>
                  <button
                    onClick={() => handleSnooze(task, 7)}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-50 text-slate-700"
                  >
                    +1 Week
                  </button>
                </div>
              )}
            </div>

            {/* Need Help Button */}
            <button
              onClick={() => handleNeedHelp(task)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 border transition-colors ${
                task.needHelpFlag
                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Flag for manager or team help"
            >
              <HelpCircle className="w-3 h-3 text-amber-600" />
              <span>Need help</span>
            </button>

            {/* Calendar .ics download */}
            <button
              onClick={() => handleDownloadICS(task.id)}
              className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs"
              title="Download RFC 5545 .ics Calendar event"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {/* "THIS TASK ISN'T MINE" BUTTON */}
            <button
              onClick={() => handleNotMyTask(task)}
              className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="Return to unassigned pool"
            >
              <UserMinus className="w-3 h-3 text-amber-700" />
              <span>Not mine</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header with Persona & Mobile Preview Switcher */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img
            src={activeUser.avatar}
            alt={activeUser.name}
            className="w-12 h-12 rounded-xl object-cover border-2 border-blue-500 shadow-xs"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#1B2A4A]">
                {activeUser.name}&apos;s Action Inbox
              </h2>
              {/* BADGE COUNT */}
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {myTasks.filter(t => t.status !== 'done').length} assigned to you
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Role: {activeUser.role} · Sprint capacity: {activeUser.allocatedHours}/{activeUser.weeklyCapacityHours}h
            </p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileSimulator(!mobileSimulator)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              mobileSimulator
                ? 'bg-blue-50 text-[#2563EB] border-blue-200'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile-First Preview</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusNotification}</span>
        </div>
      )}

      {/* COMPACT MOBILE-FIRST CONTAINER */}
      <div className={mobileSimulator ? 'max-w-md mx-auto p-4 bg-slate-100 rounded-3xl border-8 border-slate-800 shadow-2xl space-y-4' : 'space-y-6'}>
        {/* SECTION: OVERDUE */}
        {overdueTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-red-700 tracking-wider">
              <span>Overdue Tasks ({overdueTasks.length})</span>
            </div>
            {overdueTasks.map(renderTaskCard)}
          </div>
        )}

        {/* SECTION: DUE TOMORROW */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-800 tracking-wider">
            <span>Due Tomorrow ({dueTomorrowTasks.length})</span>
          </div>
          {dueTomorrowTasks.length === 0 ? (
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl text-center text-xs text-slate-400">
              No tasks due tomorrow.
            </div>
          ) : (
            dueTomorrowTasks.map(renderTaskCard)
          )}
        </div>

        {/* SECTION: UPCOMING */}
        {upcomingTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-600 tracking-wider">
              <span>Upcoming ({upcomingTasks.length})</span>
            </div>
            {upcomingTasks.map(renderTaskCard)}
          </div>
        )}

        {/* COMPLETED SECTION */}
        {completedTasks.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase text-emerald-700 tracking-wider">
              <span>Completed ({completedTasks.length})</span>
            </div>
            {completedTasks.slice(0, 3).map(renderTaskCard)}
          </div>
        )}
      </div>

      {/* BLOCKER NOTE MODAL */}
      {blockerModalTaskId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-bold text-base">
              <AlertCircle className="w-5 h-5" />
              <span>Flag Task as Blocked</span>
            </div>
            <p className="text-xs text-slate-600">
              Specify what is blocking progress so the organizer and team can resolve it.
            </p>
            <textarea
              value={blockerNoteInput}
              onChange={(e) => setBlockerNoteInput(e.target.value)}
              placeholder="e.g. Blocked: Staging schema migration is scheduled 3 days after cutover date..."
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#1B2A4A] focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setBlockerModalTaskId(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const target = tasks.find(t => t.id === blockerModalTaskId);
                  if (target) {
                    handleUpdateStatus(target, 'blocked', blockerNoteInput);
                  }
                  setBlockerModalTaskId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
              >
                Confirm Blocker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
