import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  FolderGit2, 
  Lock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw,
  ExternalLink,
  Layers,
  Key
} from 'lucide-react';
import { TrackerConfig, ConstraintRule, AuditLogItem } from '../types/index.js';
import { api } from '../services/api.js';

interface SettingsScreenProps {
  trackerConfig: TrackerConfig;
  constraints: ConstraintRule[];
  auditLogs: AuditLogItem[];
  onTrackerConfigUpdated: (config: TrackerConfig) => void;
  onConstraintAdded: (constraint: ConstraintRule) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  trackerConfig,
  constraints,
  auditLogs,
  onTrackerConfigUpdated,
  onConstraintAdded
}) => {
  // Tracker State
  const [provider, setProvider] = useState<'github' | 'notion' | 'trello'>(trackerConfig.provider || 'github');
  const [apiKey, setApiKey] = useState(trackerConfig.apiKey || '');
  const [repoOrBoard, setRepoOrBoard] = useState(trackerConfig.targetRepositoryOrBoard || 'nexus-corp/core-platform-v2');
  const [isTrackerEnabled, setIsTrackerEnabled] = useState(trackerConfig.enabled || false);
  const [trackerStatusMsg, setTrackerStatusMsg] = useState('');
  const [isSavingTracker, setIsSavingTracker] = useState(false);

  // Constraint Rule State
  const [constraintTitle, setConstraintTitle] = useState('');
  const [constraintRule, setConstraintRule] = useState('');
  const [constraintCategory, setConstraintCategory] = useState<'compliance' | 'architecture' | 'legal'>('compliance');

  // Save Tracker Configuration
  const handleSaveTracker = async () => {
    try {
      setIsSavingTracker(true);
      const res = await api.updateTrackerConfig({
        provider,
        apiKey,
        targetRepositoryOrBoard: repoOrBoard,
        enabled: isTrackerEnabled
      });

      if (res.success && res.trackerConfig) {
        onTrackerConfigUpdated(res.trackerConfig);
        setTrackerStatusMsg(
          res.trackerConfig.syncState === 'connected'
            ? 'Tracker integration successfully connected and verified.'
            : 'Tracker credentials saved. (Kept in internal board mode until valid token configured).'
        );
        setTimeout(() => setTrackerStatusMsg(''), 4500);
      }
    } catch (err: any) {
      setTrackerStatusMsg(`Error: ${err.message}`);
    } finally {
      setIsSavingTracker(false);
    }
  };

  // Add Policy Constraint Rule
  const handleAddConstraint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!constraintTitle.trim() || !constraintRule.trim()) return;

    try {
      const res = await api.addConstraint(constraintTitle.trim(), constraintRule.trim(), constraintCategory);
      if (res.success && res.constraint) {
        onConstraintAdded(res.constraint);
        setConstraintTitle('');
        setConstraintRule('');
      }
    } catch (err) {
      console.error('Failed to add constraint:', err);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* SECTION 1: EXTERNAL TRACKER INTEGRATION (GitHub / Notion / Trello) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <FolderGit2 className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                External Tracker Integration (GitHub / Notion / Trello)
              </h3>
              <p className="text-xs text-slate-500">
                Idempotent task dispatch. If unconfigured or token is invalid, tasks are safely kept internal.
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              trackerConfig.syncState === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            {trackerConfig.syncState === 'connected' ? 'Connected' : 'Internal Board Mode'}
          </span>
        </div>

        {trackerStatusMsg && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs font-medium">
            {trackerStatusMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Tracker Provider
            </label>
            <select
              value={provider}
              onChange={(e: any) => setProvider(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            >
              <option value="github">GitHub Issues (Server-side API)</option>
              <option value="notion">Notion Database</option>
              <option value="trello">Trello Cards</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Repository or Board ID
            </label>
            <input
              type="text"
              value={repoOrBoard}
              onChange={(e) => setRepoOrBoard(e.target.value)}
              placeholder="e.g. nexus-corp/core-platform-v2"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              API Token / Personal Access Token
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Stored securely on server only)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#1B2A4A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              When empty, Nexus-M2E executes idempotently on the internal task board and will never pretend an external sync succeeded.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isTrackerEnabled}
              onChange={(e) => setIsTrackerEnabled(e.target.checked)}
              className="rounded text-[#2563EB] focus:ring-0"
            />
            <span>Enable External Sync on &quot;Confirm and dispatch all&quot;</span>
          </label>

          <button
            onClick={handleSaveTracker}
            disabled={isSavingTracker}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: POLICY CONSTRAINTS LIST (For Policy Overwrite Conflict Detection) */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                Architectural &amp; Compliance Constraints
              </h3>
              <p className="text-xs text-slate-500">
                Ground-truth rules used by the conflict arbiter to block policy overwrites and unauthorized verbal agreements.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {constraints.length} Active Rules
          </span>
        </div>

        {/* List of active constraints */}
        <div className="space-y-2.5">
          {constraints.map(c => (
            <div
              key={c.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1B2A4A]">{c.title}</span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-50 text-red-700 border border-red-200">
                    {c.severity}
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed">{c.rule}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Add new constraint form */}
        <form onSubmit={handleAddConstraint} className="pt-3 border-t border-slate-100 space-y-3">
          <div className="text-xs font-bold text-[#1B2A4A] uppercase tracking-wider">
            Add New Project Constraint Rule
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <input
                type="text"
                value={constraintTitle}
                onChange={(e) => setConstraintTitle(e.target.value)}
                placeholder="Rule title (e.g. EU GDPR Lock)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1B2A4A]"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                value={constraintRule}
                onChange={(e) => setConstraintRule(e.target.value)}
                placeholder="Mandatory rule statement (e.g. Customer telemetry must never leave Frankfurt datacenter)"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-[#1B2A4A]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Constraint</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 3: PRIVACY & AUDIT LOG */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#2563EB]" />
            <div>
              <h3 className="text-sm font-bold text-[#1B2A4A]">
                Immutable Audit Trail &amp; Redaction History
              </h3>
              <p className="text-xs text-slate-500">
                Logged records of redactions (item types only, never values), task dispatches, and decision overrides.
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400">SOC2 Type II Compliant</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {auditLogs.slice(0, 10).map(log => (
            <div
              key={log.id}
              className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-700"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#1B2A4A]">{log.actor}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{log.details}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
