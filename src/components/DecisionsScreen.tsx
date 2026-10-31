import React, { useState } from 'react';
import { 
  Scale, 
  Search, 
  Filter, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  History,
  GitCommit,
  Tag,
  Calendar,
  User
} from 'lucide-react';
import { DecisionRecord } from '../types/index.js';

interface DecisionsScreenProps {
  decisions: DecisionRecord[];
}

export const DecisionsScreen: React.FC<DecisionsScreenProps> = ({ decisions }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'superseded' | 'proposed' | 'rejected'>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');

  const projects = Array.from(new Set(decisions.map(d => d.project)));

  const filtered = decisions.filter(d => {
    const matchesSearch = 
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.statement.toLowerCase().includes(search.toLowerCase()) ||
      d.speaker.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesProject = projectFilter === 'all' || d.project === projectFilter;
    return matchesSearch && matchesStatus && matchesProject;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-blue-600 tracking-wider">
              Immutable Project Memory
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              {decisions.length} Historical Decisions Recorded
            </span>
          </div>
          <h2 className="text-xl font-bold text-[#1B2A4A] mt-0.5">
            Decision Log &amp; Precedence Registry
          </h2>
          <p className="text-xs text-slate-500">
            Never delete history. Every active policy links directly to its origin meeting and superseded precedents.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search decisions..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="superseded">Superseded Only</option>
            <option value="proposed">Proposed Only</option>
            <option value="rejected">Rejected Only</option>
          </select>

          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-slate-50 border border-[#E2E8F0] rounded-lg text-slate-700"
          >
            <option value="all">All Projects</option>
            {projects.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-8 text-center text-slate-400 text-xs">
            No decisions match the selected filters.
          </div>
        ) : (
          filtered.map(dec => {
            const isActive = dec.status === 'active';
            const isSuperseded = dec.status === 'superseded';
            const isProposed = dec.status === 'proposed';
            const isRejected = dec.status === 'rejected';

            return (
              <div
                key={dec.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-bold text-[#1B2A4A]">
                        {dec.title}
                      </span>
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
                          Proposed (Discussed-Only)
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          Rejected (Sarcasm/Dismissed)
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      &quot;{dec.statement}&quot;
                    </p>
                  </div>

                  {/* Epistemic Certainty Score Meter */}
                  <div className="shrink-0 text-right space-y-1 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200/60">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Epistemic Certainty
                    </div>
                    <div className="text-sm font-bold text-[#1B2A4A]">
                      {Math.round(dec.epistemicCertainty * 100)}%
                    </div>
                    <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          dec.epistemicCertainty >= 0.85
                            ? 'bg-emerald-500'
                            : dec.epistemicCertainty >= 0.5
                            ? 'bg-amber-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(dec.epistemicCertainty * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Evidence Context */}
                <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <span className="font-semibold text-slate-700">Source Quote:</span> {dec.exactQuote}
                </div>

                {/* Metadata Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-3">
                    <span>Meeting: {dec.meetingTitle}</span>
                    <span>·</span>
                    <span>Date: {dec.date}</span>
                    <span>·</span>
                    <span>Champion: {dec.owner}</span>
                  </div>

                  {/* Precedence Link */}
                  {dec.supersededBy && (
                    <div className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 border border-amber-200">
                      <span>Superseded by PostgreSQL 16 Migration</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                  {dec.supersedesId && (
                    <div className="text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 border border-blue-200">
                      <span>Supersedes MySQL 8.0 Baseline</span>
                      <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
