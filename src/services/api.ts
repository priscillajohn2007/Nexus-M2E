import { 
  MeetingRecord, 
  DecisionRecord, 
  MeetingTask, 
  DecisionConflict, 
  ConstraintRule, 
  AuditLogItem, 
  TeamMember, 
  TrackerConfig, 
  DashboardMetrics,
  RedactionItem,
  UserProfile,
  UserRole,
  AuthSession
} from '../types/index.js';

export interface DatabaseState {
  meetings: MeetingRecord[];
  decisions: DecisionRecord[];
  tasks: MeetingTask[];
  conflicts: DecisionConflict[];
  constraints: ConstraintRule[];
  auditLogs: AuditLogItem[];
  teamMembers: TeamMember[];
  trackerConfig: TrackerConfig;
  metrics: DashboardMetrics;
}

const TOKEN_KEY = 'nexus_auth_token';

let currentAuthToken: string | null = null;
try {
  if (typeof window !== 'undefined') {
    currentAuthToken = localStorage.getItem(TOKEN_KEY);
  }
} catch {
  // localStorage may be disabled or restricted in certain sandbox frames
}

function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...extraHeaders };
  const token = currentAuthToken || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  setAuthToken(token: string | null) {
    currentAuthToken = token;
    try {
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    } catch {
      // ignore storage errors
    }
  },

  getAuthToken(): string | null {
    if (currentAuthToken) return currentAuthToken;
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
      }
    } catch {
      return null;
    }
    return null;
  },

  // Auth Endpoints
  async register(fullName: string, email: string, password: string): Promise<{
    success: boolean;
    userId: string;
    email: string;
    isVerified: boolean;
    verificationLink: string;
    message: string;
  }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password })
    });
    const data = await res.json().catch(() => ({ error: 'Registration failed' }));
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  },

  async verifyEmail(token: string): Promise<{
    success: boolean;
    session: AuthSession;
    message: string;
  }> {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json().catch(() => ({ error: 'Email verification failed' }));
    if (!res.ok) throw new Error(data.error || 'Email verification failed');
    const sessionToken = data.sessionToken || data.token || data.session?.token;
    const user = data.user || data.session?.user;
    if (sessionToken) {
      this.setAuthToken(sessionToken);
    }
    return {
      success: true,
      session: { token: sessionToken, user },
      message: data.message || 'Email verified successfully.'
    };
  },

  async resendVerification(email: string): Promise<{
    success: boolean;
    verificationLink: string;
    message: string;
    cooldownSeconds?: number;
  }> {
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({ error: 'Resend failed' }));
    if (!res.ok) throw new Error(data.error || 'Resend failed');
    return data;
  },

  async login(email: string, password: string): Promise<{
    success: boolean;
    session: AuthSession;
    message: string;
  }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json().catch(() => ({ error: 'Login failed' }));
    if (!res.ok) throw new Error(data.error || 'Login failed');
    if (data.requiresVerification) {
      throw new Error('Please verify your email before logging in. We have sent a verification link to your inbox.');
    }
    const sessionToken = data.token || data.sessionToken || data.session?.token;
    const user = data.user || data.session?.user;
    if (sessionToken) {
      this.setAuthToken(sessionToken);
    }
    return {
      success: true,
      session: { token: sessionToken, user },
      message: data.message || 'Login successful'
    };
  },

  async getMe(): Promise<{
    success: boolean;
    user: UserProfile;
  }> {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Authentication required' }));
      throw new Error(err.error || 'Authentication required');
    }
    return res.json();
  },

  async chooseRole(role: UserRole): Promise<{
    success: boolean;
    user: UserProfile;
    roleRecord: any;
  }> {
    const res = await fetch('/api/auth/choose-role', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to assign role' }));
    if (!res.ok) throw new Error(data.error || 'Failed to assign role');
    return data;
  },

  async forgotPassword(email: string): Promise<{
    success: boolean;
    email: string;
    resetLink: string;
    message: string;
  }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to request password reset' }));
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset');
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });
    const data = await res.json().catch(() => ({ error: 'Failed to reset password' }));
    if (!res.ok) throw new Error(data.error || 'Failed to reset password');
    return data;
  },

  // App Data Endpoints with Bearer Headers
  async getState(): Promise<DatabaseState> {
    const res = await fetch('/api/db/state', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch database state');
    return res.json();
  },

  async redactText(rawTranscript: string): Promise<{
    cleanedText: string;
    redactedText: string;
    items: RedactionItem[];
    offTheRecordSegmentsCount: number;
  }> {
    const res = await fetch('/api/redact', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ rawTranscript })
    });
    if (!res.ok) throw new Error('Failed to run privacy scan');
    return res.json();
  },

  async analyzeMeeting(payload: {
    title: string;
    date: string;
    project: string;
    redactedTranscript: string;
    attendees?: { name: string; email: string; role?: string }[];
    isConfidential?: boolean;
    hasOffTheRecordSections?: boolean;
    redactionItems?: RedactionItem[];
  }): Promise<{
    success: boolean;
    meeting: MeetingRecord;
    analysis: any;
    metrics: DashboardMetrics;
  }> {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || 'Failed to analyze meeting');
    }
    return res.json();
  },

  async resolveConflict(conflictId: string, action: 'accept' | 'keep_old' | 'dismiss', actor = 'Organizer'): Promise<{
    success: boolean;
    conflict: DecisionConflict;
    metrics: DashboardMetrics;
  }> {
    const res = await fetch('/api/conflicts/resolve', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ conflictId, action, actor })
    });
    if (!res.ok) throw new Error('Failed to resolve conflict');
    return res.json();
  },

  async dispatchAllTasks(taskIds?: string[], actor = 'Organizer'): Promise<{
    success: boolean;
    dispatchedCount: number;
    results: any[];
    metrics: DashboardMetrics;
  }> {
    const res = await fetch('/api/tasks/dispatch-all', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ taskIds, actor })
    });
    if (!res.ok) throw new Error('Failed to dispatch tasks');
    return res.json();
  },

  async updateTask(taskId: string, updates: Partial<MeetingTask>, actor = 'User'): Promise<{
    success: boolean;
    task: MeetingTask;
    metrics: DashboardMetrics;
  }> {
    const res = await fetch('/api/tasks/update', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ taskId, updates, actor })
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async reassignFromMyWork(taskId: string, currentOwnerName: string): Promise<{
    success: boolean;
    task: MeetingTask;
    metrics: DashboardMetrics;
  }> {
    const res = await fetch('/api/tasks/reassign-from-my-work', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ taskId, currentOwnerName })
    });
    if (!res.ok) throw new Error('Failed to return task to pool');
    return res.json();
  },

  async askMeetings(query: string): Promise<{
    answer: string;
    citedDecisions: DecisionRecord[];
    citedMeetings: string[];
  }> {
    const res = await fetch('/api/ask-meetings', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query })
    });
    if (!res.ok) throw new Error('Failed to search meetings');
    return res.json();
  },

  async seedDemoStory(): Promise<{
    success: boolean;
    message: string;
    state: DatabaseState;
  }> {
    const res = await fetch('/api/demo/seed', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to seed demo story');
    return res.json();
  },

  async loadDemoCase(caseId: string): Promise<{
    success: boolean;
    message: string;
    state: DatabaseState;
  }> {
    const res = await fetch('/api/demo/load-case', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ caseId })
    });
    if (!res.ok) throw new Error(`Failed to load demo case ${caseId}`);
    return res.json();
  },

  async clearDatabase(): Promise<{
    success: boolean;
    message: string;
    state: DatabaseState;
  }> {
    const res = await fetch('/api/demo/clear', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to clear database');
    return res.json();
  },

  async updateTrackerConfig(config: Partial<TrackerConfig>): Promise<{
    success: boolean;
    trackerConfig: TrackerConfig;
  }> {
    const res = await fetch('/api/settings/tracker', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config)
    });
    if (!res.ok) throw new Error('Failed to update tracker config');
    return res.json();
  },

  async addConstraint(title: string, rule: string, category = 'compliance'): Promise<{
    success: boolean;
    constraint: ConstraintRule;
    constraints: ConstraintRule[];
  }> {
    const res = await fetch('/api/settings/constraints', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ title, rule, category })
    });
    if (!res.ok) throw new Error('Failed to add constraint');
    return res.json();
  }
};
