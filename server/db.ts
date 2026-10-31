import fs from 'fs';
import path from 'path';
import { 
  MeetingRecord, 
  DecisionRecord, 
  MeetingTask, 
  DecisionConflict, 
  ConstraintRule, 
  AuditLogItem, 
  TeamMember, 
  TrackerConfig,
  DashboardMetrics 
} from '../src/types/index.js';

interface DatabaseSchema {
  meetings: MeetingRecord[];
  decisions: DecisionRecord[];
  tasks: MeetingTask[];
  conflicts: DecisionConflict[];
  constraints: ConstraintRule[];
  auditLogs: AuditLogItem[];
  teamMembers: TeamMember[];
  trackerConfig: TrackerConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'nexus_db.json');

// Default initial team roster
export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'user-organizer',
    name: 'You (Meeting Organizer)',
    role: 'Product & Engineering Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    email: 'organizer@nexus-m2e.internal',
    weeklyCapacityHours: 40,
    allocatedHours: 0
  },
  {
    id: 'user-alex',
    name: 'Alex Rivera',
    role: 'Staff Architect & Backend Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    email: 'alex.rivera@nexus-corp.internal',
    weeklyCapacityHours: 35,
    allocatedHours: 0
  },
  {
    id: 'user-priya',
    name: 'Priya Sharma',
    role: 'Principal DevOps Engineer',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
    email: 'priya.sharma@nexus-corp.internal',
    weeklyCapacityHours: 40,
    allocatedHours: 0
  },
  {
    id: 'user-marcus',
    name: 'Marcus Vance',
    role: 'Security & Compliance Officer',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
    email: 'marcus.vance@nexus-corp.internal',
    weeklyCapacityHours: 30,
    allocatedHours: 0
  },
  {
    id: 'user-elena',
    name: 'Elena Rostova',
    role: 'Lead Frontend Engineer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80',
    email: 'elena.rostova@nexus-corp.internal',
    weeklyCapacityHours: 40,
    allocatedHours: 0
  }
];

export const DEFAULT_CONSTRAINTS: ConstraintRule[] = [
  {
    id: 'const-1',
    title: 'Data Residency Mandate',
    rule: 'All customer data and primary relational databases must be deployed in US-East-1 region for SOC2 compliance.',
    category: 'compliance',
    severity: 'CRITICAL_BLOCKING',
    active: true,
    createdAt: '2026-10-15T10:00:00Z'
  },
  {
    id: 'const-2',
    title: 'Database Migration Architectural Review',
    rule: 'Any core database schema change or engine switch requires sign-off from Alex Rivera before production cutover.',
    category: 'architecture',
    severity: 'CRITICAL_BLOCKING',
    active: true,
    createdAt: '2026-10-18T14:30:00Z'
  },
  {
    id: 'const-3',
    title: 'Zero Unredacted Storage',
    rule: 'No raw secrets, auth keys, or unredacted financial account tokens may be logged or passed to 3P services.',
    category: 'compliance',
    severity: 'CRITICAL_BLOCKING',
    active: true,
    createdAt: '2026-10-20T09:00:00Z'
  }
];

export const DEFAULT_TRACKER_CONFIG: TrackerConfig = {
  provider: 'github',
  enabled: false,
  apiKey: '',
  targetRepositoryOrBoard: 'nexus-corp/core-platform-v2',
  syncState: 'not_configured',
  errorMessage: 'External tracker is not configured. Configure GitHub token in Settings or items remain stored internally.'
};

class PersistentDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk(): DatabaseSchema {
    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, initializing defaults:', err);
      }
    }

    const initialData: DatabaseSchema = {
      meetings: [],
      decisions: [],
      tasks: [],
      conflicts: [],
      constraints: DEFAULT_CONSTRAINTS,
      auditLogs: [],
      teamMembers: DEFAULT_TEAM,
      trackerConfig: DEFAULT_TRACKER_CONFIG
    };

    this.saveToDisk(initialData);
    return initialData;
  }

  private saveToDisk(data: DatabaseSchema) {
    try {
      this.ensureDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing database to disk:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.data;
  }

  public commit() {
    this.saveToDisk(this.data);
  }

  public logAudit(actor: string, action: AuditLogItem['action'], details: string, entityType: AuditLogItem['entityType'], entityId: string) {
    const item: AuditLogItem = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details,
      entityType,
      entityId
    };
    this.data.auditLogs.unshift(item);
    // Keep max 200 audit entries
    if (this.data.auditLogs.length > 200) {
      this.data.auditLogs.pop();
    }
    this.commit();
  }

  public getMetrics(): DashboardMetrics {
    const totalMeetings = this.data.meetings.length;
    const openTasks = this.data.tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length;
    const pendingApprovals = this.data.tasks.filter(t => !t.isDispatched).length;
    const unresolvedConflicts = this.data.conflicts.filter(c => c.status === 'pending').length;
    const overdueTasks = this.data.tasks.filter(t => t.urgency === 'overdue' && t.status !== 'done').length;
    const upcomingDeadlines = this.data.tasks.filter(t => (t.urgency === 'due_tomorrow' || t.urgency === 'upcoming') && t.status !== 'done').length;
    const tasksNeedingOwner = this.data.tasks.filter(t => !t.ownerId || t.ownerConfidence < 0.65).length;

    return {
      meetingsProcessed: totalMeetings,
      openTasks,
      pendingApprovals,
      unresolvedConflicts,
      upcomingDeadlines,
      overdueTasks,
      tasksNeedingOwner,
      avgTimeToApprovalMinutes: totalMeetings > 0 ? 4.2 : 0
    };
  }

  public clearData(): DatabaseSchema {
    this.data.meetings = [];
    this.data.decisions = [];
    this.data.tasks = [];
    this.data.conflicts = [];
    this.data.auditLogs = [];
    this.commit();
    return this.data;
  }

  /**
   * Helper to build dynamic dates for demo cases
   */
  private getDemoDates() {
    const now = new Date();
    return {
      now,
      todayStr: now.toISOString().split('T')[0],
      yesterday: new Date(now.getTime() - 24 * 3600 * 1000).toISOString().split('T')[0],
      twoDaysAgo: new Date(now.getTime() - 48 * 3600 * 1000).toISOString().split('T')[0],
      threeDaysAgo: new Date(now.getTime() - 72 * 3600 * 1000).toISOString().split('T')[0],
      tomorrow: new Date(now.getTime() + 24 * 3600 * 1000).toISOString().split('T')[0],
      dayAfterTomorrow: new Date(now.getTime() + 48 * 3600 * 1000).toISOString().split('T')[0],
      inFourDays: new Date(now.getTime() + 4 * 24 * 3600 * 1000).toISOString().split('T')[0],
      nextWeek: new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
    };
  }

  private buildDemoMeeting1(dates: ReturnType<typeof this.getDemoDates>, isSuperseded = false) {
    const meeting1Id = 'meet-demo-1';
    const decision1Id = 'dec-mysql-prod';

    const decision1: DecisionRecord = {
      id: decision1Id,
      title: 'Primary Relational Database Engine',
      statement: 'We officially select MySQL 8.0 with InnoDB as the primary relational database for Project Nexus.',
      project: 'Core Platform v2',
      date: dates.threeDaysAgo,
      meetingId: meeting1Id,
      meetingTitle: 'Architecture Strategy & DB Baseline',
      speaker: 'Alex Rivera',
      exactQuote: 'Alex Rivera: "Let us lock in MySQL 8.0 with InnoDB as our primary relational database so we can meet our Q4 release deadline."',
      epistemicCertainty: 0.95,
      status: isSuperseded ? 'superseded' : 'active',
      supersededBy: isSuperseded ? 'dec-postgres-prod' : undefined,
      owner: 'Alex Rivera',
      tags: ['database', 'infrastructure', 'architecture']
    };

    const task1: MeetingTask = {
      id: 'task-mysql-setup',
      title: 'Provision MySQL Aurora cluster in staging',
      description: 'Set up MySQL Aurora 8.0 multi-AZ cluster with SSL enabled and connect to VPC.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.twoDaysAgo,
      ownerConfidence: 0.95,
      dueDateConfidence: 0.9,
      urgency: 'overdue',
      status: 'done',
      evidenceContext: 'Priya: "I can provision the Aurora cluster on AWS by Thursday."',
      speaker: 'Priya Sharma',
      meetingId: meeting1Id,
      meetingTitle: 'Architecture Strategy & DB Baseline',
      meetingDate: dates.threeDaysAgo,
      project: 'Core Platform v2',
      isDispatched: true,
      dispatchKey: `${meeting1Id}-task-1`
    };

    const meeting1: MeetingRecord = {
      id: meeting1Id,
      title: 'Architecture Strategy & DB Baseline',
      date: dates.threeDaysAgo,
      project: 'Core Platform v2',
      duration: '42 min',
      attendees: [
        { name: 'Alex Rivera', email: DEFAULT_TEAM[1].email, role: DEFAULT_TEAM[1].role },
        { name: 'Priya Sharma', email: DEFAULT_TEAM[2].email, role: DEFAULT_TEAM[2].role },
        { name: 'Marcus Vance', email: DEFAULT_TEAM[3].email, role: DEFAULT_TEAM[3].role }
      ],
      rawTranscriptLength: 1240,
      cleanedTranscript: 'Alex Rivera: Good morning everyone. We need to finalize our data layer stack today. Priya: What about MySQL versus others? Alex: Let us lock in MySQL 8.0 with InnoDB as our primary relational database so we can meet our Q4 release deadline. Marcus: Agreed, MySQL meets all current data retention compliance requirements.',
      isConfidential: false,
      hasOffTheRecordSections: false,
      redactionsCount: 0,
      redactionItems: [],
      decisions: [decision1],
      tasks: [task1],
      conflicts: [],
      status: 'dispatched',
      createdAt: dates.threeDaysAgo + 'T10:00:00Z'
    };

    return { meeting1, decision1, task1 };
  }

  private buildDemoMeeting2(dates: ReturnType<typeof this.getDemoDates>) {
    const meeting2Id = 'meet-demo-2';
    const decision2Proposed: DecisionRecord = {
      id: 'dec-postgres-proposed',
      title: 'Potential Postgres Evaluation for JSONB & Vector Search',
      statement: 'Team discussed evaluating PostgreSQL for JSONB querying and vector extensions, but made no final decision.',
      project: 'Core Platform v2',
      date: dates.twoDaysAgo,
      meetingId: meeting2Id,
      meetingTitle: 'Query Performance & Extensibility Sync',
      speaker: 'Priya Sharma',
      exactQuote: 'Priya Sharma: "We could try Kafka or Postgres if JSON query latency exceeds 200ms, but let us benchmark first before changing our stack."',
      epistemicCertainty: 0.55,
      status: 'proposed',
      owner: 'Priya Sharma',
      tags: ['evaluation', 'database', 'latency']
    };

    const meeting2: MeetingRecord = {
      id: meeting2Id,
      title: 'Query Performance & Extensibility Sync',
      date: dates.twoDaysAgo,
      project: 'Core Platform v2',
      duration: '35 min',
      attendees: [
        { name: 'Alex Rivera', email: DEFAULT_TEAM[1].email },
        { name: 'Priya Sharma', email: DEFAULT_TEAM[2].email }
      ],
      rawTranscriptLength: 1850,
      cleanedTranscript: 'Priya Sharma: We are noticing some complex JSON queries. We could try Kafka or Postgres if JSON query latency exceeds 200ms, but let us benchmark first before changing our stack. Alex Rivera: Good idea, keep testing MySQL performance first; no change to our baseline today.',
      isConfidential: false,
      hasOffTheRecordSections: false,
      redactionsCount: 0,
      redactionItems: [],
      decisions: [decision2Proposed],
      tasks: [],
      conflicts: [],
      status: 'dispatched',
      createdAt: dates.twoDaysAgo + 'T14:00:00Z'
    };

    return { meeting2, decision2Proposed };
  }

  private buildDemoMeeting3(dates: ReturnType<typeof this.getDemoDates>) {
    const meeting3Id = 'meet-demo-3';
    const decision1Id = 'dec-mysql-prod';

    const decision3Approved: DecisionRecord = {
      id: 'dec-postgres-prod',
      title: 'Migrate Primary Database to PostgreSQL 16',
      statement: 'We officially approve migrating the primary database from MySQL to PostgreSQL 16 for native vector support and ACID JSONB.',
      project: 'Core Platform v2',
      date: dates.yesterday,
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      speaker: 'Alex Rivera',
      exactQuote: 'Alex Rivera: "After reviewing the vector indexing requirements, we officially approve switching our primary database from MySQL to PostgreSQL 16. Priya, please update the database configuration by tomorrow."',
      epistemicCertainty: 0.96,
      status: 'active',
      supersedesId: decision1Id,
      owner: 'Alex Rivera',
      tags: ['database', 'migration', 'postgresql', 'vector']
    };

    const conflict1: DecisionConflict = {
      id: 'conf-mysql-vs-postgres',
      earlierDecision: {
        id: decision1Id,
        statement: 'We officially select MySQL 8.0 with InnoDB as the primary relational database for Project Nexus.',
        meetingTitle: 'Architecture Strategy & DB Baseline',
        meetingDate: dates.threeDaysAgo,
        owner: 'Alex Rivera',
        project: 'Core Platform v2'
      },
      newStatement: {
        statement: 'We officially approve switching our primary database from MySQL to PostgreSQL 16.',
        meetingTitle: 'Database Stack Pivot & Vector Migration',
        meetingDate: dates.yesterday,
        speaker: 'Alex Rivera',
        timestamp: '14:22'
      },
      conflictType: 'logical_contradiction',
      severity: 'CRITICAL_BLOCKING',
      confidence: 0.97,
      rationale: 'Direct contradiction: Active decision from 3 days ago mandated MySQL 8.0, while the new statement switches the primary engine to PostgreSQL 16.',
      contextualDiff: {
        earlierAspect: 'Engine: MySQL 8.0 with InnoDB (locked in for Q4)',
        newAspect: 'Engine: PostgreSQL 16 with pgvector & JSONB'
      },
      recommendedAction: 'Accept change to supersede MySQL with PostgreSQL and notify downstream engineers.',
      status: 'accepted'
    };

    const task2: MeetingTask = {
      id: 'task-pg-config',
      title: 'Update database configuration to PostgreSQL 16',
      description: 'Rewrite Drizzle ORM schemas, migration scripts, and Docker compose files for PostgreSQL 16.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.tomorrow,
      ownerConfidence: 0.94,
      dueDateConfidence: 0.92,
      urgency: 'due_tomorrow',
      status: 'in_progress',
      evidenceContext: 'Alex Rivera: "Priya, please update the database configuration by tomorrow."',
      speaker: 'Alex Rivera',
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      meetingDate: dates.yesterday,
      project: 'Core Platform v2',
      isDispatched: true,
      dispatchKey: `${meeting3Id}-task-2`,
      decisionAlert: {
        decisionId: 'dec-postgres-prod',
        title: 'Database Engine Shift',
        message: 'Prior decision regarding MySQL 8.0 was superseded by PostgreSQL 16 in yesterday\'s sync. Verify your task scope aligns with Postgres pgvector.',
        supersededDate: dates.yesterday
      }
    };

    const taskOverload1: MeetingTask = {
      id: 'task-alex-overload',
      title: 'Author zero-downtime data replication bridge',
      description: 'Design CDC stream between legacy MySQL and new PostgreSQL 16 instance.',
      ownerId: 'user-alex',
      ownerName: 'Alex Rivera',
      ownerAvatar: DEFAULT_TEAM[1].avatar,
      ownerEmail: DEFAULT_TEAM[1].email,
      dueDate: dates.nextWeek,
      ownerConfidence: 0.90,
      dueDateConfidence: 0.85,
      urgency: 'upcoming',
      status: 'todo',
      evidenceContext: 'Alex Rivera: "I will take on the replication bridge architecture."',
      speaker: 'Alex Rivera',
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      meetingDate: dates.yesterday,
      project: 'Core Platform v2',
      isDispatched: true,
      estimatedHours: 24
    };

    const conflict2Capacity: DecisionConflict = {
      id: 'conf-alex-capacity-clash',
      earlierDecision: {
        id: 'dec-workload-limit',
        statement: 'Engineering workload constraint: Max 35 allocated sprint hours per engineer per cycle.',
        meetingTitle: 'Sprint 24 Planning & Capacity Allocation',
        meetingDate: dates.threeDaysAgo,
        owner: 'Engineering Management',
        project: 'Core Platform v2'
      },
      newStatement: {
        statement: 'Assigning replication bridge (24h) to Alex Rivera who already has 18h allocated, reaching 42h/35h.',
        meetingTitle: 'Database Stack Pivot & Vector Migration',
        meetingDate: dates.yesterday,
        speaker: 'System Arbiter'
      },
      conflictType: 'capacity_clash',
      severity: 'SOFT_WARNING',
      confidence: 0.91,
      rationale: 'Capacity clash: Alex Rivera is allocated 42 hours this week (exceeding 35h limit by +7 hours). High risk of sprint delay.',
      contextualDiff: {
        earlierAspect: 'Alex capacity: 35 hours weekly threshold',
        newAspect: 'Current allocation: 42 hours (120% load)'
      },
      recommendedAction: 'Reassign replication bridge to Priya Sharma or extend deadline to next sprint.',
      status: 'pending'
    };

    const taskInvertedPrereq: MeetingTask = {
      id: 'task-staging-schema-val',
      title: 'Run staging schema migration & stress test',
      description: 'Prerequisite validation test for PostgreSQL 16 schema integrity.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.inFourDays,
      ownerConfidence: 0.88,
      dueDateConfidence: 0.85,
      urgency: 'upcoming',
      status: 'todo',
      evidenceContext: 'Priya: "We will run schema validation tests next Tuesday."',
      speaker: 'Priya Sharma',
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      meetingDate: dates.yesterday,
      project: 'Core Platform v2',
      isDispatched: true
    };

    const taskInvertedDownstream: MeetingTask = {
      id: 'task-prod-cutover',
      title: 'Execute production DNS and DB cutover',
      description: 'Switch live application endpoints to new PostgreSQL cluster. Blocked by staging validation.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.tomorrow,
      ownerConfidence: 0.85,
      dueDateConfidence: 0.82,
      urgency: 'due_tomorrow',
      status: 'blocked',
      blockerNote: 'Blocked: Staging schema validation is scheduled 3 days AFTER production cutover date.',
      dependencies: ['task-staging-schema-val'],
      evidenceContext: 'Alex: "Let us schedule cutover for tomorrow evening."',
      speaker: 'Alex Rivera',
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      meetingDate: dates.yesterday,
      project: 'Core Platform v2',
      isDispatched: true
    };

    const conflict3Timeline: DecisionConflict = {
      id: 'conf-timeline-inversion',
      earlierDecision: {
        id: 'dec-staging-gate',
        statement: 'Gate rule: Production database cutover cannot proceed without completed staging schema validation.',
        meetingTitle: 'Sprint 24 Planning & Capacity Allocation',
        meetingDate: dates.threeDaysAgo,
        owner: 'Marcus Vance',
        project: 'Core Platform v2'
      },
      newStatement: {
        statement: 'Production cutover task scheduled for tomorrow, while prerequisite staging test is due in 4 days.',
        meetingTitle: 'Database Stack Pivot & Vector Migration',
        meetingDate: dates.yesterday,
        speaker: 'Alex Rivera'
      },
      conflictType: 'timeline_inversion',
      severity: 'CRITICAL_BLOCKING',
      confidence: 0.95,
      rationale: 'Timeline inversion: Prerequisite task "Run staging schema migration" is due on Day +4, but dependent task "Execute production cutover" is scheduled for tomorrow (Day +1).',
      contextualDiff: {
        earlierAspect: 'Prerequisite (staging test): Due in 4 days',
        newAspect: 'Dependent task (prod cutover): Due tomorrow'
      },
      recommendedAction: 'Postpone production cutover to Day +5 following successful staging verification.',
      status: 'pending'
    };

    const taskUnassigned: MeetingTask = {
      id: 'task-audit-unassigned',
      title: 'Update data classification matrix in SOC2 portal',
      description: 'Review fields affected by Postgres JSONB storage and update compliance registry.',
      ownerId: undefined,
      ownerName: undefined,
      ownerConfidence: 0.42,
      dueDateConfidence: 0.80,
      dueDate: dates.dayAfterTomorrow,
      urgency: 'upcoming',
      status: 'todo',
      evidenceContext: 'Marcus: "Someone needs to update the SOC2 portal for the Postgres tables by Friday."',
      speaker: 'Marcus Vance',
      meetingId: meeting3Id,
      meetingTitle: 'Database Stack Pivot & Vector Migration',
      meetingDate: dates.yesterday,
      project: 'Core Platform v2',
      isDispatched: false
    };

    const meeting3: MeetingRecord = {
      id: meeting3Id,
      title: 'Database Stack Pivot & Vector Migration',
      date: dates.yesterday,
      project: 'Core Platform v2',
      duration: '48 min',
      attendees: [
        { name: 'Alex Rivera', email: DEFAULT_TEAM[1].email },
        { name: 'Priya Sharma', email: DEFAULT_TEAM[2].email },
        { name: 'Marcus Vance', email: DEFAULT_TEAM[3].email }
      ],
      rawTranscriptLength: 2680,
      cleanedTranscript: 'Alex Rivera: Welcome everyone. After reviewing the vector indexing requirements, we officially approve switching our primary database from MySQL to PostgreSQL 16. Priya, please update the database configuration by tomorrow. Priya: Sure, let us rewrite everything in COBOL by tomorrow morning! Just kidding. I will update the Postgres configuration right away. Alex: I will take on the replication bridge architecture. Marcus: Someone needs to update the SOC2 portal for the Postgres tables by Friday.',
      isConfidential: false,
      hasOffTheRecordSections: false,
      redactionsCount: 0,
      redactionItems: [],
      decisions: [decision3Approved],
      tasks: [task2, taskOverload1, taskInvertedPrereq, taskInvertedDownstream, taskUnassigned],
      conflicts: [conflict1, conflict2Capacity, conflict3Timeline],
      status: 'dispatched',
      createdAt: dates.yesterday + 'T16:00:00Z'
    };

    return {
      meeting3,
      decision3Approved,
      tasks: [task2, taskOverload1, taskInvertedPrereq, taskInvertedDownstream, taskUnassigned],
      conflicts: [conflict1, conflict2Capacity, conflict3Timeline]
    };
  }

  private buildDemoMeeting4(dates: ReturnType<typeof this.getDemoDates>) {
    const meeting4Id = 'meet-demo-4';
    const fakePassword = 'SuperSecret2026!Prod';
    const fakeAccountNum = '4092-8819-3301-9482';
    const fakePhone = '415-555-0199';
    const fakeSalary = '$195,000 annual base';

    const redactedTranscript = `Elena Rostova: Reviewing the enterprise vendor billing credentials. The vendor admin password was set to [PASSWORD REMOVED]. For the direct ACH wire, their corporate bank account is [ACCOUNT NUMBER REMOVED ENDING IN 9482] with routing 021000021. Also, contractor billing liaison personal mobile is [PHONE NUMBER REMOVED]. Marcus Vance: Note that new senior contractor salary is [COMPENSATION DETAILS REMOVED] which remains confidential under our NDA. Elena: Understood. Let's make sure Priya provisions their scoped access.`;

    const redactions = [
      {
        id: 'redact-demo-1',
        itemType: 'Password / Auth Secret',
        category: 'security' as const,
        maskedPlaceholder: '[PASSWORD REMOVED]',
        originalValue: fakePassword,
        startIndex: 78,
        endIndex: 97,
        restored: false,
        detectedBy: 'regex_pattern' as const
      },
      {
        id: 'redact-demo-2',
        itemType: 'Bank Account Number',
        category: 'financial' as const,
        maskedPlaceholder: '[ACCOUNT NUMBER REMOVED ENDING IN 9482]',
        originalValue: fakeAccountNum,
        startIndex: 140,
        endIndex: 159,
        restored: false,
        detectedBy: 'regex_pattern' as const
      },
      {
        id: 'redact-demo-3',
        itemType: 'Personal Phone Number',
        category: 'pii' as const,
        maskedPlaceholder: '[PHONE NUMBER REMOVED]',
        originalValue: fakePhone,
        startIndex: 245,
        endIndex: 257,
        restored: false,
        detectedBy: 'regex_pattern' as const
      },
      {
        id: 'redact-demo-4',
        itemType: 'Employee Salary / Compensation',
        category: 'confidential' as const,
        maskedPlaceholder: '[COMPENSATION DETAILS REMOVED]',
        originalValue: fakeSalary,
        startIndex: 320,
        endIndex: 341,
        restored: false,
        detectedBy: 'llm_semantic' as const
      }
    ];

    const decision4 = {
      id: 'dec-vendor-nda',
      title: 'Mandatory Vendor Least-Privilege IAM Scope',
      statement: 'All external contractors must be provisioned with ephemeral role-based IAM keys expiring every 7 days.',
      project: 'Infrastructure Security',
      date: dates.todayStr,
      meetingId: meeting4Id,
      meetingTitle: 'Vendor Billing & Credentials Onboarding',
      speaker: 'Marcus Vance',
      exactQuote: 'Marcus Vance: "All external contractors must be provisioned with ephemeral role-based IAM keys expiring every 7 days."',
      epistemicCertainty: 0.92,
      status: 'active' as const,
      owner: 'Marcus Vance',
      tags: ['security', 'compliance', 'iam']
    };

    const task4 = {
      id: 'task-vendor-access',
      title: 'Provision ephemeral 7-day IAM role for vendor billing audit',
      description: 'Create AWS IAM role with restricted CloudWatch and Billing read-only permissions.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.tomorrow,
      ownerConfidence: 0.91,
      dueDateConfidence: 0.88,
      urgency: 'due_tomorrow' as const,
      status: 'todo' as const,
      evidenceContext: 'Elena: "Let\'s make sure Priya provisions their scoped access."',
      speaker: 'Elena Rostova',
      meetingId: meeting4Id,
      meetingTitle: 'Vendor Billing & Credentials Onboarding',
      meetingDate: dates.todayStr,
      project: 'Infrastructure Security',
      isDispatched: false
    };

    const meeting4: MeetingRecord = {
      id: meeting4Id,
      title: 'Vendor Billing & Credentials Onboarding',
      date: dates.todayStr,
      project: 'Infrastructure Security',
      duration: '22 min',
      attendees: [
        { name: 'Elena Rostova', email: DEFAULT_TEAM[4].email },
        { name: 'Marcus Vance', email: DEFAULT_TEAM[3].email }
      ],
      rawTranscriptLength: 1420,
      cleanedTranscript: redactedTranscript,
      isConfidential: true,
      hasOffTheRecordSections: true,
      redactionsCount: 4,
      redactionItems: redactions,
      decisions: [decision4],
      tasks: [task4],
      conflicts: [],
      status: 'analyzed',
      createdAt: dates.todayStr + 'T11:00:00Z'
    };

    return { meeting4, decision4, task4, redactions };
  }

  private buildDemoMeeting5(dates: ReturnType<typeof this.getDemoDates>) {
    const meeting5Id = 'meet-demo-5';
    
    const decision5a: DecisionRecord = {
      id: 'dec-sev1-pgbouncer',
      title: 'Mandatory PgBouncer Pooling for All Backend Services',
      statement: 'Migrate all production backend worker pods to PgBouncer transaction-level connection pooling with a hard ceiling of 30 connections per pod to eliminate pool exhaustion.',
      project: 'Core Platform v2',
      date: dates.todayStr,
      meetingId: meeting5Id,
      meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
      speaker: 'Alex Rivera',
      exactQuote: 'Alex Rivera: "We officially approve migrating all backend services to PgBouncer connection pooling with a hard limit of 30 connections per worker."',
      epistemicCertainty: 0.98,
      status: 'active',
      owner: 'Alex Rivera',
      tags: ['incident', 'database', 'pgbouncer', 'postmortem']
    };

    const decision5b: DecisionRecord = {
      id: 'dec-sev1-no-prod-ddl',
      title: 'Prohibition of Unreviewed Direct Production DDL Execution',
      statement: 'Direct manual DDL migrations or indexing commands in production databases are strictly prohibited without two principal engineer peer reviews.',
      project: 'Core Platform v2',
      date: dates.todayStr,
      meetingId: meeting5Id,
      meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
      speaker: 'Marcus Vance',
      exactQuote: 'Marcus Vance: "Direct production database queries via DDL are strictly banned without peer review."',
      epistemicCertainty: 0.96,
      status: 'active',
      owner: 'Marcus Vance',
      tags: ['policy', 'compliance', 'security']
    };

    const task5a: MeetingTask = {
      id: 'task-sev1-pgbouncer-deploy',
      title: 'Deploy PgBouncer cluster with transaction pooling to staging',
      description: 'Configure Helm chart for PgBouncer with TLS mutual authentication and test connection limits.',
      ownerId: 'user-priya',
      ownerName: 'Priya Sharma',
      ownerAvatar: DEFAULT_TEAM[2].avatar,
      ownerEmail: DEFAULT_TEAM[2].email,
      dueDate: dates.tomorrow,
      ownerConfidence: 0.95,
      dueDateConfidence: 0.92,
      urgency: 'due_tomorrow',
      status: 'in_progress',
      evidenceContext: 'Priya Sharma: "I will deploy the PgBouncer cluster with transaction pooling to staging by tomorrow 2 PM."',
      speaker: 'Priya Sharma',
      meetingId: meeting5Id,
      meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
      meetingDate: dates.todayStr,
      project: 'Core Platform v2',
      isDispatched: true
    };

    const task5b: MeetingTask = {
      id: 'task-sev1-statuspage',
      title: 'Publish customer-facing SEV-1 root cause summary',
      description: 'Draft RCA postmortem notes and publish timeline update to the public Statuspage portal.',
      ownerId: 'user-elena',
      ownerName: 'Elena Rostova',
      ownerAvatar: DEFAULT_TEAM[4].avatar,
      ownerEmail: DEFAULT_TEAM[4].email,
      dueDate: dates.todayStr,
      ownerConfidence: 0.93,
      dueDateConfidence: 0.90,
      urgency: 'due_tomorrow',
      status: 'todo',
      evidenceContext: 'Elena Rostova: "I will update the customer status page incident report by 5 PM today."',
      speaker: 'Elena Rostova',
      meetingId: meeting5Id,
      meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
      meetingDate: dates.todayStr,
      project: 'Core Platform v2',
      isDispatched: true
    };

    const task5cUnassigned: MeetingTask = {
      id: 'task-sev1-audit-tokens',
      title: 'Audit and revoke temporary incident triage database credentials',
      description: 'Emergency credentials generated during SEV-1 triage must be audited, rotated, and revoked.',
      ownerId: undefined, // UNASSIGNED!
      ownerName: undefined,
      ownerConfidence: 0.35,
      dueDateConfidence: 0.85,
      dueDate: dates.yesterday,
      urgency: 'overdue',
      status: 'todo',
      evidenceContext: 'Marcus Vance: "Someone urgently needs to audit and revoke all unmonitored direct database access tokens left over from the incident."',
      speaker: 'Marcus Vance',
      meetingId: meeting5Id,
      meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
      meetingDate: dates.todayStr,
      project: 'Core Platform v2',
      isDispatched: false
    };

    const conflict5Sla: DecisionConflict = {
      id: 'conf-sev1-sla-breach',
      earlierDecision: {
        id: 'const-1',
        statement: 'Core Service SLA Mandate: 99.99% monthly availability with maximum 5-minute automated recovery window.',
        meetingTitle: 'System Reliability Policy',
        meetingDate: dates.threeDaysAgo,
        owner: 'Engineering Leadership',
        project: 'Core Platform v2'
      },
      newStatement: {
        statement: 'SEV-1 incident caused 42 minutes of API downtime due to manual failover delay.',
        meetingTitle: 'SEV-1 Database Outage Postmortem & SLA Review',
        meetingDate: dates.todayStr,
        speaker: 'Alex Rivera'
      },
      conflictType: 'policy_overwrite',
      severity: 'CRITICAL_BLOCKING',
      confidence: 0.94,
      rationale: 'SLA policy breach: Monthly downtime budget exceeded (42 min actual vs 4.3 min allowable for 99.99%). Automatic failover failed to engage.',
      contextualDiff: {
        earlierAspect: 'Policy Target: Maximum 5 min MTTR and 99.99% monthly uptime',
        newAspect: 'Actual Result: 42 min MTTR and 99.71% current monthly uptime'
      },
      recommendedAction: 'Mandate automated read-replica promotion scripts in the PgBouncer deployment.',
      status: 'pending'
    };

    const meeting5: MeetingRecord = {
      id: meeting5Id,
      title: 'SEV-1 Database Outage Postmortem & SLA Review',
      date: dates.todayStr,
      project: 'Core Platform v2',
      duration: '55 min',
      attendees: [
        { name: 'Alex Rivera', email: DEFAULT_TEAM[1].email },
        { name: 'Priya Sharma', email: DEFAULT_TEAM[2].email },
        { name: 'Marcus Vance', email: DEFAULT_TEAM[3].email },
        { name: 'Elena Rostova', email: DEFAULT_TEAM[4].email }
      ],
      rawTranscriptLength: 2150,
      cleanedTranscript: 'Alex Rivera: Beginning the SEV-1 incident postmortem for yesterday\'s 42-minute API outage. Root cause: connection pool exhaustion during the batch indexing job. We officially approve migrating all backend services to PgBouncer connection pooling with a hard limit of 30 connections per worker. Priya Sharma: I will deploy the PgBouncer cluster with transaction pooling to staging by tomorrow 2 PM. Marcus Vance: Direct production database queries via DDL are strictly banned without peer review. Also, someone urgently needs to audit and revoke all unmonitored direct database access tokens left over from the incident. Elena Rostova: I will update the customer status page incident report by 5 PM today.',
      isConfidential: false,
      hasOffTheRecordSections: false,
      redactionsCount: 0,
      redactionItems: [],
      decisions: [decision5a, decision5b],
      tasks: [task5a, task5b, task5cUnassigned],
      conflicts: [conflict5Sla],
      status: 'analyzed',
      createdAt: dates.todayStr + 'T15:30:00Z'
    };

    return {
      meeting5,
      decisions: [decision5a, decision5b],
      tasks: [task5a, task5b, task5cUnassigned],
      conflicts: [conflict5Sla]
    };
  }

  /**
   * Seed a specific demo case into the workspace
   */
  public seedDemoCase(caseId: string): DatabaseSchema {
    const dates = this.getDemoDates();
    this.clearData();

    if (caseId === 'case-1') {
      const { meeting1, decision1, task1 } = this.buildDemoMeeting1(dates, false);
      this.data.meetings = [meeting1];
      this.data.decisions = [decision1];
      this.data.tasks = [task1];
      this.data.conflicts = [];
      this.logAudit('Alex Rivera', 'analyzed', 'Processed Demo Case 1: Architecture Strategy & DB Baseline (Confirmed MySQL)', 'meeting', meeting1.id);
    } else if (caseId === 'case-2') {
      const { meeting1, decision1, task1 } = this.buildDemoMeeting1(dates, false);
      const { meeting2, decision2Proposed } = this.buildDemoMeeting2(dates);
      this.data.meetings = [meeting2, meeting1];
      this.data.decisions = [decision1, decision2Proposed];
      this.data.tasks = [task1];
      this.data.conflicts = [];
      this.logAudit('Priya Sharma', 'analyzed', 'Processed Demo Case 2: Query Performance & Extensibility Sync (Proposed Postgres, no change)', 'meeting', meeting2.id);
    } else if (caseId === 'case-3') {
      const { meeting1, decision1, task1 } = this.buildDemoMeeting1(dates, true);
      const { meeting2, decision2Proposed } = this.buildDemoMeeting2(dates);
      const { meeting3, decision3Approved, tasks, conflicts } = this.buildDemoMeeting3(dates);
      this.data.meetings = [meeting3, meeting2, meeting1];
      this.data.decisions = [decision3Approved, decision1, decision2Proposed];
      this.data.tasks = [...tasks, task1];
      this.data.conflicts = conflicts;
      this.logAudit('Alex Rivera', 'conflict_resolved', 'Detected & accepted logical contradiction: MySQL superseded by PostgreSQL 16', 'conflict', conflicts[0].id);
      this.logAudit('Alex Rivera', 'decision_superseded', 'Decision dec-mysql-prod superseded by dec-postgres-prod', 'decision', decision3Approved.id);
      this.logAudit('Marcus Vance', 'task_dispatched', 'Flagged unassigned compliance task & capacity clash for Alex Rivera', 'task', meeting3.id);
    } else if (caseId === 'case-4') {
      const { meeting4, decision4, task4, redactions } = this.buildDemoMeeting4(dates);
      this.data.meetings = [meeting4];
      this.data.decisions = [decision4];
      this.data.tasks = [task4];
      this.data.conflicts = [];
      this.logAudit('Privacy Scanner', 'redaction_applied', `Pre-storage masked ${redactions.length} secrets: password, bank account, phone number, salary`, 'redaction', meeting4.id);
    } else if (caseId === 'case-5') {
      const { meeting5, decisions, tasks, conflicts } = this.buildDemoMeeting5(dates);
      this.data.meetings = [meeting5];
      this.data.decisions = decisions;
      this.data.tasks = tasks;
      this.data.conflicts = conflicts;
      this.logAudit('Alex Rivera', 'analyzed', 'Processed Demo Case 5: SEV-1 Outage Incident Postmortem (PgBouncer mandate & unassigned audit task)', 'meeting', meeting5.id);
    } else {
      // Default to full story
      return this.seedDemoStory();
    }

    this.commit();
    return this.data;
  }

  /**
   * Reset and seed the full multi-meeting narrative suite
   */
  public seedDemoStory(): DatabaseSchema {
    const dates = this.getDemoDates();
    this.clearData();

    const { meeting1, decision1, task1 } = this.buildDemoMeeting1(dates, true);
    const { meeting2, decision2Proposed } = this.buildDemoMeeting2(dates);
    const { meeting3, decision3Approved, tasks: tasks3, conflicts: conflicts3 } = this.buildDemoMeeting3(dates);
    const { meeting4, decision4, task4, redactions: redactions4 } = this.buildDemoMeeting4(dates);
    const { meeting5, decisions: decisions5, tasks: tasks5, conflicts: conflicts5 } = this.buildDemoMeeting5(dates);

    this.data.meetings = [meeting5, meeting4, meeting3, meeting2, meeting1];
    this.data.decisions = [
      decision3Approved,
      ...decisions5,
      decision4,
      decision1,
      decision2Proposed
    ];
    this.data.tasks = [
      ...tasks5,
      ...tasks3,
      task4,
      task1
    ];
    this.data.conflicts = [
      ...conflicts3,
      ...conflicts5
    ];

    // Audit logs
    this.logAudit('System', 'redaction_applied', `Pre-storage redacted ${redactions4.length} sensitive items in Meeting 4`, 'redaction', meeting4.id);
    this.logAudit('Alex Rivera', 'conflict_resolved', 'Accepted migration from MySQL to PostgreSQL 16 (Conflict conf-mysql-vs-postgres)', 'conflict', conflicts3[0].id);
    this.logAudit('Alex Rivera', 'decision_superseded', 'Decision dec-mysql-prod superseded by dec-postgres-prod', 'decision', decision3Approved.id);
    this.logAudit('Marcus Vance', 'task_dispatched', 'Dispatched confirmed sprint tasks to project boards', 'task', meeting3.id);
    this.logAudit('Alex Rivera', 'analyzed', 'Conducted SEV-1 Postmortem and registered PgBouncer connection pooling mandate', 'meeting', meeting5.id);

    this.commit();
    return this.data;
  }
}

export const db = new PersistentDatabase();
