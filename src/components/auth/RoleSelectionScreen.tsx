import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { ShieldCheck, UserCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../../types/index.js';

interface RoleSelectionScreenProps {
  onRoleChosen: (role: UserRole) => void;
}

export const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onRoleChosen }) => {
  const { user, chooseRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('organizer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmRole = async () => {
    setLoading(true);
    setError(null);
    try {
      await chooseRole(selectedRole);
      onRoleChosen(selectedRole);
    } catch (err: any) {
      setError(err.message || 'Failed to assign role. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FD] flex flex-col justify-center items-center p-4">
      {/* Background soft decoration */}
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Step 2 of 2: Workspace Onboarding
          </div>
          <h1 className="text-3xl font-extrabold text-[#1B2A4A] tracking-tight">
            Welcome, {user?.fullName || 'there'}! Choose Your Role
          </h1>
          <p className="text-slate-600 mt-2 max-w-lg mx-auto text-sm leading-relaxed">
            Nexus-M2E customizes your workflow and permissions based on your primary responsibility. 
            Once confirmed, this role is locked to your account.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* 2 Large Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Card 1: Meeting Organizer */}
          <div
            onClick={() => setSelectedRole('organizer')}
            className={`cursor-pointer rounded-2xl p-6 transition-all border-2 text-left bg-white shadow-sm hover:shadow-md relative flex flex-col justify-between ${
              selectedRole === 'organizer'
                ? 'border-[#2563EB] ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {selectedRole === 'organizer' && (
              <div className="absolute top-4 right-4 text-[#2563EB]">
                <CheckCircle2 className="w-6 h-6 fill-blue-50" />
              </div>
            )}
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#1B2A4A]">Meeting Organizer</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Full Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Leads executive alignments, project strategy, and team accountability.
              </p>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Dictates and processes meetings via Wispr Flow & voice mic</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Reviews and approves extracted decisions & action items</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Resolves cross-meeting memory conflicts & architectural rules</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <span>Full Executive Dashboard with team dispatch & audit trail</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Redirects to:</span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Executive Dashboard
              </span>
            </div>
          </div>

          {/* Card 2: Participant */}
          <div
            onClick={() => setSelectedRole('participant')}
            className={`cursor-pointer rounded-2xl p-6 transition-all border-2 text-left bg-white shadow-sm hover:shadow-md relative flex flex-col justify-between ${
              selectedRole === 'participant'
                ? 'border-[#2563EB] ring-2 ring-blue-100'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {selectedRole === 'participant' && (
              <div className="absolute top-4 right-4 text-[#2563EB]">
                <CheckCircle2 className="w-6 h-6 fill-blue-50" />
              </div>
            )}
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-[#1B2A4A]">Participant</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Focused View
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Engineering, product, or design team member executing deliverables.
              </p>

              <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Mobile-first <strong>My Work</strong> view with one-tap status updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Automatic task linking by registered attendee email</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Personalized meeting digest and relevant decision alerts</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span>Snooze, signal blockers, or flag "This task isn't mine"</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Redirects to:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                My Work Portal
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center">
          <button
            onClick={handleConfirmRole}
            disabled={loading}
            className="w-full max-w-md py-3.5 px-6 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Assigning Role & Securing Workspace...
              </span>
            ) : (
              <>
                <span>Confirm & Enter Workspace as {selectedRole === 'organizer' ? 'Meeting Organizer' : 'Participant'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Role stored securely in dedicated <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600">user_roles</code> policy table.
          </p>
        </div>
      </div>
    </div>
  );
};
