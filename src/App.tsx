import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AuthScreen } from './components/auth/AuthScreen.js';
import { RoleSelectionScreen } from './components/auth/RoleSelectionScreen.js';
import { Sidebar } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { SpeakMeetingScreen } from './components/SpeakMeetingScreen.js';
import { ReviewScreen } from './components/ReviewScreen.js';
import { OverviewScreen } from './components/OverviewScreen.js';
import { MyWorkScreen } from './components/MyWorkScreen.js';
import { DecisionsScreen } from './components/DecisionsScreen.js';
import { ConflictsScreen } from './components/ConflictsScreen.js';
import { TasksScreen } from './components/TasksScreen.js';
import { DigestScreen } from './components/DigestScreen.js';
import { SettingsScreen } from './components/SettingsScreen.js';
import { Footer } from './components/Footer.js';
import { DemoModal, DemoCaseData } from './components/DemoModal.js';
import { useVoiceRecognition } from './hooks/useVoiceRecognition.js';
import { 
  NavScreen, 
  TeamMember, 
  MeetingRecord, 
  UserRole 
} from './types/index.js';
import { api, DatabaseState } from './services/api.js';

function MainWorkspace() {
  const { user, logout } = useAuth();
  const userRole = user?.role as UserRole | undefined;

  const [currentScreen, setCurrentScreen] = useState<NavScreen>(() => {
    return userRole === 'participant' ? 'my-work' : 'overview';
  });

  const [dbState, setDbState] = useState<DatabaseState | null>(null);
  const [activeUser, setActiveUser] = useState<TeamMember | null>(null);
  const [currentMeeting, setCurrentMeeting] = useState<MeetingRecord | undefined>(undefined);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [voiceToast, setVoiceToast] = useState('');
  const [prefilledCase, setPrefilledCase] = useState<DemoCaseData | null>(null);

  // Sync default starting screen when role changes
  useEffect(() => {
    if (userRole === 'participant') {
      if (['overview', 'speak', 'review', 'conflicts', 'tasks'].includes(currentScreen)) {
        setCurrentScreen('my-work');
      }
    }
  }, [userRole, currentScreen]);

  // Fetch database state with authentication token
  const refreshState = useCallback(async () => {
    try {
      const state = await api.getState();
      setDbState(state);

      // Match or synthesize activeUser based on current authenticated profile
      if (user) {
        const userEmail = (user.email || '').toLowerCase();
        const matchedMember = state.teamMembers.find(
          m => m.email.toLowerCase() === userEmail || m.name.toLowerCase() === user.fullName.toLowerCase()
        );

        if (matchedMember) {
          setActiveUser(matchedMember);
        } else {
          // Synthesize persona for newly registered user
          setActiveUser({
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: userRole === 'organizer' ? 'Meeting Organizer' : 'Participant Member',
            avatar: user.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80`,
            weeklyCapacityHours: 40,
            allocatedHours: 0
          });
        }
      } else if (!activeUser && state.teamMembers.length > 0) {
        setActiveUser(state.teamMembers[0]);
      }
    } catch (err) {
      console.error('Failed to load database state:', err);
    }
  }, [user, userRole, activeUser]);

  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Voice Command Handler
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (userRole === 'participant') {
      if (command === 'show_my_tasks') {
        setCurrentScreen('my-work');
        setVoiceToast('Navigated to My Work');
      }
      return;
    }

    if (command === 'off_the_record') {
      setVoiceToast('Voice Command: Off the record mode toggled.');
    } else if (command === 'back_on_the_record') {
      setVoiceToast('Voice Command: Back on the record.');
    } else if (command === 'approve_all_tasks') {
      setVoiceToast('Voice Command: "Approve all tasks" -> Dispatching now...');
      try {
        await api.dispatchAllTasks();
        await refreshState();
        setVoiceToast('All tasks confirmed and dispatched via voice command!');
      } catch (err) {
        console.error(err);
      }
    } else if (command === 'show_my_tasks') {
      setVoiceToast('Voice Command: Opening My Work...');
      setCurrentScreen('my-work');
    } else if (command === 'mark_database_task_done') {
      setVoiceToast('Voice Command: Marking database task done...');
      if (dbState) {
        const target = dbState.tasks.find(
          t => t.title.toLowerCase().includes('database') || t.title.toLowerCase().includes('postgresql')
        );
        if (target) {
          await api.updateTask(target.id, { status: 'done' });
          await refreshState();
          setVoiceToast(`Task "${target.title}" marked DONE!`);
        }
      }
    }
    setTimeout(() => setVoiceToast(''), 4500);
  }, [userRole, dbState, refreshState]);

  const voice = useVoiceRecognition({
    onVoiceCommand: handleVoiceCommand
  });

  // Demo Handlers
  const handleSelectCase = (demoCase: DemoCaseData) => {
    if (userRole === 'participant') {
      setVoiceToast('Demo meetings can only be captured by Meeting Organizers.');
      setTimeout(() => setVoiceToast(''), 3000);
      return;
    }
    setPrefilledCase(demoCase);
    setCurrentScreen('speak');
    setVoiceToast(`Demo Case ${demoCase.number} loaded into "Speak your meeting".`);
    setTimeout(() => setVoiceToast(''), 4500);
  };

  const handleLoadCaseMockup = async (caseId: string) => {
    try {
      const res = await api.loadDemoCase(caseId);
      if (res.success) {
        setDbState(res.state);
        setPrefilledCase(null);
        setCurrentMeeting(undefined);
        setCurrentScreen(userRole === 'participant' ? 'my-work' : 'overview');
        setVoiceToast(`Demo Case mockup data loaded into workspace.`);
        setTimeout(() => setVoiceToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to load demo case:', err);
    }
  };

  const handleLoadFullStory = async () => {
    try {
      const res = await api.seedDemoStory();
      if (res.success) {
        setDbState(res.state);
        setCurrentScreen(userRole === 'participant' ? 'my-work' : 'overview');
        setVoiceToast('Demo scenario loaded. Attendee tasks are linked across team members.');
        setTimeout(() => setVoiceToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to seed demo:', err);
    }
  };

  const handleClearToIdle = async () => {
    try {
      const res = await api.clearDatabase();
      if (res.success) {
        setDbState(res.state);
        setPrefilledCase(null);
        setCurrentMeeting(undefined);
        setCurrentScreen(userRole === 'participant' ? 'my-work' : 'speak');
        setVoiceToast('Clean slate active: System is idle.');
        setTimeout(() => setVoiceToast(''), 4000);
      }
    } catch (err) {
      console.error('Failed to clear database:', err);
    }
  };

  const handleConflictResolved = async (conflictId: string, action: 'accept' | 'keep_old' | 'dismiss') => {
    try {
      await api.resolveConflict(conflictId, action, user?.fullName || 'Organizer');
      await refreshState();
    } catch (err) {
      console.error('Failed to resolve conflict:', err);
    }
  };

  const handleMeetingAnalyzed = (meeting: MeetingRecord) => {
    setCurrentMeeting(meeting);
    refreshState();
    setCurrentScreen('review');
  };

  const handleNavigate = (screen: NavScreen) => {
    if (userRole === 'participant' && ['overview', 'speak', 'review', 'conflicts', 'tasks'].includes(screen)) {
      return;
    }
    setCurrentScreen(screen);
  };

  if (!dbState || !activeUser) {
    return (
      <div className="min-h-screen bg-[#F4F7FD] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#1B2A4A]">Loading Workspace & Applying Access Rules...</div>
        </div>
      </div>
    );
  }

  // Calculate dynamic counts
  const unresolvedConflictsCount = dbState.conflicts.filter(c => c.status === 'pending').length;
  const userEmail = (user?.email || '').toLowerCase();
  const myWorkCount = dbState.tasks.filter(t => 
    (t.ownerId === user?.id || 
     (t.ownerEmail && t.ownerEmail.toLowerCase() === userEmail) ||
     (t.ownerName && t.ownerName.toLowerCase().includes((user?.fullName || '').toLowerCase().split(' ')[0]))) && 
    t.status !== 'done'
  ).length;
  const pendingApprovalsCount = dbState.tasks.filter(t => !t.isDispatched).length;

  return (
    <div className="flex min-h-screen bg-[#F4F7FD] text-[#1B2A4A] font-sans antialiased">
      {/* Left Sidebar with Role Filtering */}
      <Sidebar
        currentScreen={currentScreen}
        onNavigate={handleNavigate}
        unresolvedConflictsCount={unresolvedConflictsCount}
        myWorkCount={myWorkCount}
        pendingApprovalsCount={pendingApprovalsCount}
        userRole={userRole}
        user={user}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Global Header */}
        <Header
          currentScreen={currentScreen}
          teamMembers={dbState.teamMembers}
          activeUser={activeUser}
          onSelectUser={(u) => setActiveUser(u)}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          onQuickLoadDemo={handleLoadFullStory}
          isListening={voice.isListening}
          onToggleListening={voice.toggleListening}
          user={user}
          userRole={userRole}
          onLogout={logout}
        />

        {/* Voice Command / Status Toast */}
        {voiceToast && (
          <div className="fixed bottom-6 right-6 bg-[#1B2A4A] text-white px-4 py-3 rounded-xl shadow-xl z-50 flex items-center gap-3 border border-slate-700 animate-slide-up text-xs font-semibold">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{voiceToast}</span>
          </div>
        )}

        {/* Active Screen View */}
        <main className="flex-1 overflow-y-auto pb-12">
          {currentScreen === 'overview' && userRole !== 'participant' && (
            <OverviewScreen
              metrics={dbState.metrics}
              decisions={dbState.decisions}
              conflicts={dbState.conflicts}
              tasks={dbState.tasks}
              meetings={dbState.meetings}
              onNavigate={handleNavigate}
              onOpenDemoModal={() => setIsDemoModalOpen(true)}
            />
          )}

          {currentScreen === 'speak' && userRole !== 'participant' && (
            <SpeakMeetingScreen
              onMeetingAnalyzed={handleMeetingAnalyzed}
              isListening={voice.isListening}
              onToggleListening={voice.toggleListening}
              voiceTranscript={voice.transcript}
              isOffTheRecord={voice.isOffTheRecord}
              onToggleOffTheRecord={() => voice.setIsOffTheRecord(!voice.isOffTheRecord)}
              prefilledCase={prefilledCase}
              onClearPrefilledCase={() => setPrefilledCase(null)}
            />
          )}

          {currentScreen === 'review' && userRole !== 'participant' && (
            <ReviewScreen
              currentMeeting={currentMeeting}
              conflicts={dbState.conflicts}
              tasks={dbState.tasks}
              decisions={dbState.decisions}
              teamMembers={dbState.teamMembers}
              onConflictResolved={handleConflictResolved}
              onTasksDispatched={refreshState}
              onTaskUpdated={() => refreshState()}
            />
          )}

          {currentScreen === 'my-work' && (
            <MyWorkScreen
              tasks={dbState.tasks}
              activeUser={activeUser}
              onTaskUpdated={() => refreshState()}
              onTaskReturnedToPool={() => refreshState()}
            />
          )}

          {currentScreen === 'decisions' && (
            <DecisionsScreen decisions={dbState.decisions} />
          )}

          {currentScreen === 'conflicts' && userRole !== 'participant' && (
            <ConflictsScreen
              conflicts={dbState.conflicts}
              onResolveConflict={handleConflictResolved}
            />
          )}

          {currentScreen === 'tasks' && userRole !== 'participant' && (
            <TasksScreen
              tasks={dbState.tasks}
              teamMembers={dbState.teamMembers}
              onTaskUpdated={() => refreshState()}
            />
          )}

          {currentScreen === 'digest' && (
            <DigestScreen
              tasks={dbState.tasks}
              decisions={dbState.decisions}
              meetings={dbState.meetings}
              teamMembers={dbState.teamMembers}
              activeUser={activeUser}
              onSelectUser={setActiveUser}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen
              trackerConfig={dbState.trackerConfig}
              constraints={dbState.constraints}
              auditLogs={dbState.auditLogs}
              onTrackerConfigUpdated={(cfg) => {
                setDbState(prev => prev ? { ...prev, trackerConfig: cfg } : null);
              }}
              onConstraintAdded={(c) => {
                setDbState(prev => prev ? { ...prev, constraints: [c, ...prev.constraints] } : null);
              }}
            />
          )}
        </main>

        {/* Global Footer */}
        <Footer
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          activeUser={activeUser}
          onOpenDemoModal={() => setIsDemoModalOpen(true)}
          totalMeetingsCount={dbState.meetings.length}
          totalDecisionsCount={dbState.decisions.length}
        />
      </div>

      {/* Demo Scenarios Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onSelectCase={handleSelectCase}
        onLoadCaseMockup={handleLoadCaseMockup}
        onLoadFullStory={handleLoadFullStory}
        onClearToIdle={handleClearToIdle}
      />
    </div>
  );
}

function RootRouter() {
  const { user, loading } = useAuth();

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FD] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm font-bold text-[#1B2A4A]">Verifying Credentials...</div>
        </div>
      </div>
    );
  }

  // 2. Logged out -> Login / Register
  if (!user) {
    return <AuthScreen />;
  }

  // 3. Registered but unverified -> Check your inbox screen (Unverified users blocked from app pages)
  if (!user.isVerified) {
    return <AuthScreen />;
  }

  // 4. Verified but role not chosen -> Choose your role onboarding
  if (!user.role) {
    return (
      <RoleSelectionScreen
        onRoleChosen={() => {
          // Handled via state update in chooseRole()
        }}
      />
    );
  }

  // 5. Authenticated, verified, role chosen -> Main App Workspace
  return <MainWorkspace />;
}

export default function App() {
  return (
    <AuthProvider>
      <RootRouter />
    </AuthProvider>
  );
}
