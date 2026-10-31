import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  GitCompare, 
  Clock, 
  ShieldAlert, 
  Users, 
  Layers,
  Check,
  X
} from 'lucide-react';
import { DecisionConflict, ConflictType, ConflictSeverity } from '../types/index.js';

interface ConflictsScreenProps {
  conflicts: DecisionConflict[];
  onResolveConflict: (conflictId: string, action: 'accept' | 'keep_old' | 'dismiss') => void;
}

export const ConflictsScreen: React.FC<ConflictsScreenProps> = ({
  conflicts,
  onResolveConflict
}) => {
  const [activeTab, setActiveTab] = useState<'all' | ConflictType>('all');

  const filtered = conflicts.filter(c => 
    activeTab === 'all' || c.conflictType === activeTab
  );

  const getSeverityBadge = (severity: ConflictSeverity) => {
    if (severity === 'CRITICAL_BLOCKING') {
      return (
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
          CRITICAL BLOCKING
        </span>
      );
    }
    return (
      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
        SOFT WARNING
      </span>
    );
  };

  const getTypeLabel = (type: ConflictType) => {
    switch (type) {
      case 'logical_contradiction': return 'Direct Logical Contradiction';
      case 'capacity_clash': return 'Resource Capacity Clash';
      case 'timeline_inversion': return 'Timeline & Dependency Inversion';
      case 'policy_overwrite': return 'Policy & Compliance Overwrite';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-bold text-red-600 tracking-wider">
            Core Differentiator
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 font-medium">
            4-Dimensional Conflict Arbiter
          </span>
        </div>
        <h2 className="text-xl font-bold text-[#1B2A4A]">
          Cross-Meeting Conflict Arbiter
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          Automated semantic evaluation comparing newly spoken statements against active memory. Detects logical contradictions, developer capacity overload, timeline dependency inversions, and regulatory policy breaches.
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Conflicts ({conflicts.length})
          </button>
          <button
            onClick={() => setActiveTab('logical_contradiction')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'logical_contradiction'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            1. Logical Contradictions
          </button>
          <button
            onClick={() => setActiveTab('capacity_clash')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'capacity_clash'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            2. Capacity Clashes
          </button>
          <button
            onClick={() => setActiveTab('timeline_inversion')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'timeline_inversion'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            3. Timeline Inversions
          </button>
          <button
            onClick={() => setActiveTab('policy_overwrite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'policy_overwrite'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            4. Policy Overwrites
          </button>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="space-y-4">
        {filtered.map(c => (
          <div
            key={c.id}
            className={`bg-white border-2 rounded-xl p-5 shadow-xs space-y-4 ${
              c.severity === 'CRITICAL_BLOCKING'
                ? 'border-red-200'
                : 'border-amber-200'
            }`}
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {getSeverityBadge(c.severity)}
                <span className="text-xs font-bold text-[#1B2A4A]">
                  {getTypeLabel(c.conflictType)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-700">
                  Confidence: {Math.round(c.confidence * 100)}%
                </span>
                <span className="text-slate-300">·</span>
                <span
                  className={`font-semibold capitalize ${
                    c.status === 'accepted'
                      ? 'text-emerald-700'
                      : c.status === 'kept_old'
                      ? 'text-blue-700'
                      : c.status === 'dismissed'
                      ? 'text-slate-500'
                      : 'text-amber-800'
                  }`}
                >
                  Status: {c.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Side-by-Side Contextual Diff */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Baseline (Earlier Decision / Rule)
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Meeting: {c.earlierDecision.meetingTitle} ({c.earlierDecision.meetingDate})
                </div>
                <div className="text-xs font-semibold text-[#1B2A4A]">
                  &quot;{c.earlierDecision.statement}&quot;
                </div>
                {c.contextualDiff?.earlierAspect && (
                  <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                    <span className="font-semibold">Contextual Aspect:</span> {c.contextualDiff.earlierAspect}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-red-50/40 border border-red-200 rounded-lg space-y-1.5">
                <div className="text-[11px] font-bold uppercase text-red-700 tracking-wider">
                  Newly Spoken Proposal / Task
                </div>
                <div className="text-xs text-red-600 font-medium">
                  Speaker: {c.newStatement.speaker} · {c.newStatement.meetingTitle}
                </div>
                <div className="text-xs font-semibold text-[#1B2A4A]">
                  &quot;{c.newStatement.statement}&quot;
                </div>
                {c.contextualDiff?.newAspect && (
                  <div className="text-[11px] text-red-700 pt-1 border-t border-red-200">
                    <span className="font-semibold">Contextual Aspect:</span> {c.contextualDiff.newAspect}
                  </div>
                )}
              </div>
            </div>

            {/* Rationale & Recommended Action */}
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <div>
                <strong className="text-slate-800">Arbiter Rationale:</strong> {c.rationale}
              </div>
              <div>
                <strong className="text-slate-800">Recommended Resolution:</strong> {c.recommendedAction}
              </div>
            </div>

            {/* Resolution Actions */}
            {c.status === 'pending' && (
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => onResolveConflict(c.id, 'dismiss')}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg"
                >
                  Dismiss Advisory
                </button>
                <button
                  onClick={() => onResolveConflict(c.id, 'keep_old')}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-900 hover:bg-amber-50 text-xs font-semibold rounded-lg"
                >
                  Keep Original Decision
                </button>
                <button
                  onClick={() => onResolveConflict(c.id, 'accept')}
                  className="px-4 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  Accept Change (Supersede)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
