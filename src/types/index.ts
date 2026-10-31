export type NavScreen = 
  | 'overview' 
  | 'speak' 
  | 'review' 
  | 'my-work' 
  | 'decisions' 
  | 'conflicts' 
  | 'tasks' 
  | 'digest' 
  | 'settings';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  weeklyCapacityHours: number;
  allocatedHours: number;
}

export type RedactionCategory = 'security' | 'financial' | 'pii' | 'confidential';

export interface RedactionItem {
  id: string;
  itemType: string; // e.g. "Password / Secret", "Bank Account Number", "Personal Phone Number", "Employee Salary", "API Secret / Auth Key", "Unreleased Pricing"
  category: RedactionCategory;
  maskedPlaceholder: string; // e.g. "[PASSWORD REMOVED]" or "[ACCOUNT NUMBER REMOVED]"
  originalValue: string; // kept strictly server-side/in-memory for restore
  startIndex: number;
  endIndex: number;
  restored: boolean;
  detectedBy: 'regex_pattern' | 'llm_semantic' | 'manual';
}

export type ConflictSeverity = 'PASS' | 'SOFT_WARNING' | 'CRITICAL_BLOCKING';
export type ConflictType = 
  | 'logical_contradiction' 
  | 'capacity_clash' 
  | 'timeline_inversion' 
  | 'policy_overwrite';

export interface DecisionConflict {
  id: string;
  earlierDecision: {
    id: string;
    statement: string;
    meetingTitle: string;
    meetingDate: string;
    owner: string;
    project: string;
  };
  newStatement: {
    statement: string;
    meetingTitle: string;
    meetingDate: string;
    speaker: string;
    timestamp?: string;
  };
  conflictType: ConflictType;
  severity: ConflictSeverity;
  confidence: number; // 0.0 - 1.0 (e.g. 0.94)
  rationale: string;
  contextualDiff: {
    earlierAspect: string;
    newAspect: string;
  };
  recommendedAction: string;
  status: 'pending' | 'accepted' | 'kept_old' | 'dismissed';
}

export type DecisionStatus = 'active' | 'superseded' | 'proposed' | 'rejected' | 'discussed_only';

export interface DecisionRecord {
  id: string;
  title: string;
  statement: string;
  project: string;
  date: string;
  meetingId: string;
  meetingTitle: string;
  speaker: string;
  exactQuote: string;
  epistemicCertainty: number; // 0.0 to 1.0 (>= 0.85 is confirmed)
  status: DecisionStatus;
  owner: string;
  supersededBy?: string;
  supersedesId?: string;
  reopenedCount?: number; // drift alert
  tags: string[];
}

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type UrgencyLevel = 'overdue' | 'due_tomorrow' | 'upcoming';

export interface MeetingTask {
  id: string;
  title: string;
  description: string;
  ownerId?: string; // undefined means UNASSIGNED
  ownerName?: string;
  ownerAvatar?: string;
  ownerEmail?: string;
  collaborators?: string[];
  dueDate: string;
  ownerConfidence: number; // < 0.65 triggers UNASSIGNED - ACTION REQUIRED
  dueDateConfidence: number;
  urgency: UrgencyLevel;
  status: TaskStatus;
  dependencies?: string[]; // IDs of tasks or decisions that must precede
  blockerNote?: string;
  unresolvedQuestions?: string[];
  evidenceContext: string; // Exact quote from transcript
  speaker: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  project: string;
  isDispatched: boolean;
  dispatchKey?: string; // meeting id + task hash for idempotency
  externalRef?: {
    tracker: 'github' | 'notion' | 'trello';
    externalId: string;
    url: string;
    status: 'synced' | 'pending' | 'failed';
    error?: string;
  };
  snoozedUntil?: string;
  needHelpFlag?: boolean;
  decisionAlert?: {
    decisionId: string;
    title: string;
    message: string;
    supersededDate: string;
  };
  estimatedHours?: number;
}

export interface MeetingRecord {
  id: string;
  title: string;
  date: string;
  project: string;
  duration: string;
  attendees: { name: string; email: string; role?: string }[];
  rawTranscriptLength: number;
  cleanedTranscript: string;
  isConfidential: boolean;
  hasOffTheRecordSections: boolean;
  redactionsCount: number;
  redactionItems: RedactionItem[];
  decisions: DecisionRecord[];
  tasks: MeetingTask[];
  conflicts: DecisionConflict[];
  status: 'draft' | 'analyzed' | 'dispatched';
  createdAt: string;
}

export interface ConstraintRule {
  id: string;
  title: string;
  rule: string;
  category: 'compliance' | 'architecture' | 'legal' | 'budget';
  severity: ConflictSeverity;
  active: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: 'redaction_applied' | 'redaction_restored' | 'analyzed' | 'conflict_resolved' | 'task_dispatched' | 'task_status_changed' | 'decision_superseded';
  details: string;
  entityType: 'meeting' | 'task' | 'decision' | 'conflict' | 'redaction';
  entityId: string;
}

export interface TrackerConfig {
  provider: 'github' | 'notion' | 'trello';
  enabled: boolean;
  apiKey: string;
  targetRepositoryOrBoard: string;
  syncState: 'connected' | 'not_configured' | 'error';
  errorMessage?: string;
}

export interface DashboardMetrics {
  meetingsProcessed: number;
  openTasks: number;
  pendingApprovals: number;
  unresolvedConflicts: number;
  upcomingDeadlines: number;
  overdueTasks: number;
  tasksNeedingOwner: number;
  avgTimeToApprovalMinutes: number;
}

export type UserRole = 'organizer' | 'participant';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  role?: UserRole | null;
  isVerified: boolean;
  avatar?: string;
}

export interface UserRoleRecord {
  userId: string;
  role: UserRole;
  assignedAt: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}
