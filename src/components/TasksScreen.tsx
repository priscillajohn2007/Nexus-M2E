import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  User, 
  Clock, 
  Download, 
  ExternalLink, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { MeetingTask, TeamMember } from '../types/index.js';
import { api } from '../services/api.js';

interface TasksScreenProps {
  tasks: MeetingTask[];
  teamMembers: TeamMember[];
  onTaskUpdated: (task: MeetingTask) => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({
  tasks,
  teamMembers,
  onTaskUpdated
}) => {
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedContexts, setExpandedContexts] = useState<Record<string, boolean>>({});

  const toggleContext = (id: string) => {
    setExpandedContexts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    const matchesOwner = ownerFilter === 'all' || 
      (ownerFilter === 'unassigned' ? (!t.ownerId || t.ownerConfidence < 0.65) : t.ownerId === ownerFilter);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesOwner && matchesStatus;
  });

  const handleDownloadICS = (taskId: string) => {
    window.open(`/api/tasks/${taskId}/ics`, '_blank');
  };

  const handleAssignOwner = async (taskId: string, memberId: string) => {
    try {
      const res = await api.updateTask(taskId, { ownerId: memberId });
      if (res.success && res.task) {
        onTaskUpdated(res.task);
      }
    } catch (err) {
      console.error('Assign error:', err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
              Execution Dispatch Board
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {tasks.length} Action Items Total
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A] mt-0.5">
            Cross-Team Task Board &amp; External Trackers
          </h2>
          <p className="text-xs text-slate-500">
            Accountable assignments with exact quote evidence, idempotent dispatch keys, and RFC 5545 calendar sync.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <select
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-700"
          >
            <option value="all">All Assignees</option>
            <option value="unassigned">[Unassigned Only]</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-slate-400 text-xs">
            No tasks match the active filters.
          </div>
        ) : (
          filteredTasks.map(t => {
            const isUnassigned = !t.ownerId || t.ownerConfidence < 0.65;
            const isContextOpen = Boolean(expandedContexts[t.id]);

            return (
              <div
                key={t.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-[#1B2A4A]">
                        {t.title}
                      </span>
                      {isUnassigned ? (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                          [UNASSIGNED - ACTION REQUIRED]
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {t.ownerName}
                        </span>
                      )}
                      {t.status === 'done' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Done
                        </span>
                      )}
                      {t.status === 'blocked' && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  {/* Actions & Due Date */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Owner Dropdown */}
                    <select
                      value={t.ownerId || ''}
                      onChange={(e) => handleAssignOwner(t.id, e.target.value)}
                      className="text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="">-- Assign Owner --</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{t.dueDate}</span>
                    </div>

                    <button
                      onClick={() => handleDownloadICS(t.id)}
                      className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600"
                      title="Download .ics Calendar File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Evidence Context Accordion */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <button
                    onClick={() => toggleContext(t.id)}
                    className="flex items-center gap-1 text-[#2563EB] hover:text-blue-700 font-semibold"
                  >
                    <span>{isContextOpen ? 'Hide evidence quote' : 'Show context'}</span>
                    {isContextOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {t.externalRef && (
                      <span className="text-[11px] text-slate-500">
                        Tracker: {t.externalRef.tracker} ({t.externalRef.status})
                      </span>
                    )}
                    <span>Source: {t.meetingTitle}</span>
                  </div>
                </div>

                {isContextOpen && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Transcript Ground-Truth Quote:
                    </div>
                    <blockquote className="italic border-l-2 border-[#2563EB] pl-2 text-slate-700">
                      &quot;{t.evidenceContext}&quot;
                    </blockquote>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
