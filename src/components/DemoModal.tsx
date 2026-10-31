import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Database, 
  ArrowRight,
  GitBranch,
  Play,
  FileText,
  RotateCcw,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  ShieldCheck,
  Zap,
  Flame,
  Layers,
  Calendar,
  Lock,
  Tag
} from 'lucide-react';

export interface MockupDecision {
  title: string;
  statement: string;
  certainty: number;
  status: 'active' | 'superseded' | 'proposed';
  speaker: string;
  supersedes?: string;
  tags?: string[];
}

export interface MockupTask {
  title: string;
  ownerName?: string;
  ownerRole?: string;
  dueDate: string;
  urgency: 'overdue' | 'due_tomorrow' | 'upcoming';
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  evidenceQuote: string;
  isUnassigned?: boolean;
  blockerNote?: string;
  hours?: number;
}

export interface MockupConflict {
  type: string;
  earlier: string;
  newStatement: string;
  rationale: string;
  severity: 'CRITICAL_BLOCKING' | 'SOFT_WARNING' | 'PASS';
  confidence: number;
  recommendedAction: string;
}

export interface MockupRedaction {
  itemType: string;
  category: 'security' | 'financial' | 'pii' | 'confidential';
  maskedPlaceholder: string;
  originalValue: string;
  detectedBy: string;
}

export interface DemoCaseData {
  id: string;
  number: number;
  title: string;
  project: string;
  duration: string;
  attendees: string[];
  badge: string;
  badgeColor: 'emerald' | 'blue' | 'red' | 'amber';
  category: 'architecture' | 'privacy' | 'incident' | 'sync';
  description: string;
  transcript: string;
  keyTakeaway: string;
  mockupData: {
    decisions: MockupDecision[];
    tasks: MockupTask[];
    conflicts: MockupConflict[];
    redactions: MockupRedaction[];
  };
}

export const DEMO_CASES: DemoCaseData[] = [
  {
    id: 'case-1',
    number: 1,
    title: 'Architecture Strategy & DB Baseline',
    project: 'Core Platform v2',
    duration: '42 min',
    attendees: ['Alex Rivera (Staff Architect)', 'Priya Sharma (Principal DevOps)', 'Marcus Vance (Compliance)'],
    badge: 'Confirmed Decision (MySQL)',
    badgeColor: 'emerald',
    category: 'architecture',
    description: 'Establishes the initial data tier baseline. Team evaluates database options and officially approves MySQL 8.0 with InnoDB.',
    keyTakeaway: 'Establishes initial ground truth with 95% epistemic certainty. Confirmed status prevents casual chatter from overturning it.',
    transcript: 'Alex Rivera: Good morning everyone. We need to finalize our data layer stack today. Priya: What about MySQL versus others? Alex: Let us lock in MySQL 8.0 with InnoDB as our primary relational database so we can meet our Q4 release deadline. Marcus: Agreed, MySQL meets all current data retention compliance requirements.',
    mockupData: {
      decisions: [
        {
          title: 'Primary Relational Database Engine',
          statement: 'We officially select MySQL 8.0 with InnoDB as the primary relational database for Project Nexus.',
          certainty: 0.95,
          status: 'active',
          speaker: 'Alex Rivera',
          tags: ['database', 'infrastructure', 'baseline']
        }
      ],
      tasks: [
        {
          title: 'Provision MySQL Aurora cluster in staging',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps Engineer',
          dueDate: '2 days ago',
          urgency: 'overdue',
          status: 'done',
          evidenceQuote: 'Priya: "I can provision the Aurora cluster on AWS by Thursday."'
        }
      ],
      conflicts: [],
      redactions: []
    }
  },
  {
    id: 'case-2',
    number: 2,
    title: 'Query Performance & Extensibility Sync',
    project: 'Core Platform v2',
    duration: '35 min',
    attendees: ['Alex Rivera (Staff Architect)', 'Priya Sharma (Principal DevOps)'],
    badge: 'Casual Discussion (Proposed Only)',
    badgeColor: 'blue',
    category: 'sync',
    description: 'Team brainstorms Postgres for JSONB query latency. The epistemic certainty engine categorizes this as proposed/exploratory, preserving the baseline.',
    keyTakeaway: 'Certainty score 0.55 prevents hallucinating a false policy shift or generating spurious conflict warnings.',
    transcript: 'Priya Sharma: We are noticing some complex JSON queries. We could try Kafka or Postgres if JSON query latency exceeds 200ms, but let us benchmark first before changing our stack. Alex Rivera: Good idea, keep testing MySQL performance first; no change to our baseline today.',
    mockupData: {
      decisions: [
        {
          title: 'Potential Postgres Evaluation for JSONB & Vector Search',
          statement: 'Team discussed evaluating PostgreSQL for JSONB querying and vector extensions, but made no final decision.',
          certainty: 0.55,
          status: 'proposed',
          speaker: 'Priya Sharma',
          tags: ['evaluation', 'database', 'latency']
        }
      ],
      tasks: [],
      conflicts: [],
      redactions: []
    }
  },
  {
    id: 'case-3',
    number: 3,
    title: 'Database Stack Pivot & Vector Migration',
    project: 'Core Platform v2',
    duration: '48 min',
    attendees: ['Alex Rivera (Staff Architect)', 'Priya Sharma (DevOps)', 'Marcus Vance (Compliance)'],
    badge: 'Logical Contradiction & Sarcasm Rejection',
    badgeColor: 'red',
    category: 'architecture',
    description: 'Alex approves switching to PostgreSQL 16. Nexus-M2E flags a direct logical contradiction with Meeting 1, catches Alex\'s 42h capacity clash, identifies an inverted cutover deadline, flags an unassigned SOC2 task, and rejects a sarcastic COBOL joke.',
    keyTakeaway: 'Showcases all 4 conflict dimensions: contradiction, capacity, timeline inversion, and unassigned owner nudges.',
    transcript: 'Alex Rivera: Welcome everyone. After reviewing the vector indexing requirements, we officially approve switching our primary database from MySQL to PostgreSQL 16. Priya, please update the database configuration by tomorrow. Priya: Sure, let us rewrite everything in COBOL by tomorrow morning! Just kidding. I will update the Postgres configuration right away. Alex: I will take on the replication bridge architecture. Marcus: Someone needs to update the SOC2 portal for the Postgres tables by Friday.',
    mockupData: {
      decisions: [
        {
          title: 'Migrate Primary Database to PostgreSQL 16',
          statement: 'We officially approve migrating the primary database from MySQL to PostgreSQL 16 for native vector support and ACID JSONB.',
          certainty: 0.96,
          status: 'active',
          speaker: 'Alex Rivera',
          supersedes: 'Primary Relational Database Engine (MySQL 8.0)',
          tags: ['database', 'migration', 'postgresql', 'vector']
        }
      ],
      tasks: [
        {
          title: 'Update database configuration to PostgreSQL 16',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps',
          dueDate: 'Tomorrow',
          urgency: 'due_tomorrow',
          status: 'in_progress',
          evidenceQuote: 'Alex Rivera: "Priya, please update the database configuration by tomorrow."'
        },
        {
          title: 'Author zero-downtime data replication bridge',
          ownerName: 'Alex Rivera',
          ownerRole: 'Staff Architect',
          dueDate: 'Next Week',
          urgency: 'upcoming',
          status: 'todo',
          hours: 24,
          evidenceQuote: 'Alex Rivera: "I will take on the replication bridge architecture."'
        },
        {
          title: 'Run staging schema migration & stress test',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps',
          dueDate: 'In 4 days',
          urgency: 'upcoming',
          status: 'todo',
          evidenceQuote: 'Priya: "We will run schema validation tests next Tuesday."'
        },
        {
          title: 'Execute production DNS and DB cutover',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps',
          dueDate: 'Tomorrow',
          urgency: 'due_tomorrow',
          status: 'blocked',
          blockerNote: 'Blocked: Staging schema validation is scheduled 3 days AFTER production cutover date.',
          evidenceQuote: 'Alex: "Let us schedule cutover for tomorrow evening."'
        },
        {
          title: 'Update data classification matrix in SOC2 portal',
          ownerName: undefined,
          dueDate: 'In 2 days',
          urgency: 'upcoming',
          status: 'todo',
          isUnassigned: true,
          evidenceQuote: 'Marcus: "Someone needs to update the SOC2 portal for the Postgres tables by Friday."'
        }
      ],
      conflicts: [
        {
          type: 'Logical Contradiction',
          earlier: 'MySQL 8.0 with InnoDB locked in as primary DB baseline',
          newStatement: 'Switch primary relational database to PostgreSQL 16',
          rationale: 'Direct contradiction with active decision established in Meeting 1.',
          severity: 'CRITICAL_BLOCKING',
          confidence: 0.97,
          recommendedAction: 'Accept change to supersede MySQL with PostgreSQL and notify downstream engineers.'
        },
        {
          type: 'Capacity Clash',
          earlier: 'Max 35 weekly sprint hours per engineer threshold',
          newStatement: 'Alex assigned 24h task on top of 18h existing tasks (42h / 120% load)',
          rationale: 'Alex Rivera is allocated 42 hours this week, exceeding capacity by 7 hours.',
          severity: 'SOFT_WARNING',
          confidence: 0.91,
          recommendedAction: 'Reassign replication bridge to Priya Sharma or extend delivery date.'
        },
        {
          type: 'Timeline Inversion',
          earlier: 'Gate: Production cutover requires passed staging schema validation',
          newStatement: 'Production cutover scheduled for tomorrow, but staging test is due in 4 days',
          rationale: 'Dependent cutover task is scheduled 3 days prior to prerequisite validation.',
          severity: 'CRITICAL_BLOCKING',
          confidence: 0.95,
          recommendedAction: 'Postpone production cutover to Day +5 following successful staging verification.'
        }
      ],
      redactions: []
    }
  },
  {
    id: 'case-4',
    number: 4,
    title: 'Vendor Billing & Credentials Onboarding',
    project: 'Infrastructure Security',
    duration: '22 min',
    attendees: ['Elena Rostova (Lead Frontend)', 'Marcus Vance (Compliance)'],
    badge: 'Pre-Storage Privacy & Secrets Redaction',
    badgeColor: 'amber',
    category: 'privacy',
    description: 'Demonstrates real-time privacy layer. Spoken passwords, bank routing numbers, personal phones, and executive salaries are redacted BEFORE disk persistence or AI transmission.',
    keyTakeaway: 'Zero confidential tokens escape to the model. Redacted placeholders are auditable with 1-click false-positive restoration.',
    transcript: 'Elena Rostova: Reviewing the enterprise vendor billing credentials. The vendor admin password was set to SuperSecret2026!Prod. For the direct ACH wire, their corporate bank account is 4092-8819-3301-9482 with routing 021000021. Also, contractor billing liaison personal mobile is 415-555-0199. Marcus Vance: Note that new senior contractor salary is $195,000 annual base which remains confidential under our NDA. Elena: Understood. Let\'s make sure Priya provisions their scoped access.',
    mockupData: {
      decisions: [
        {
          title: 'Mandatory Vendor Least-Privilege IAM Scope',
          statement: 'All external contractors must be provisioned with ephemeral role-based IAM keys expiring every 7 days.',
          certainty: 0.92,
          status: 'active',
          speaker: 'Marcus Vance',
          tags: ['security', 'compliance', 'iam']
        }
      ],
      tasks: [
        {
          title: 'Provision ephemeral 7-day IAM role for vendor billing audit',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps',
          dueDate: 'Tomorrow',
          urgency: 'due_tomorrow',
          status: 'todo',
          evidenceQuote: 'Elena: "Let\'s make sure Priya provisions their scoped access."'
        }
      ],
      conflicts: [],
      redactions: [
        {
          itemType: 'Password / Auth Secret',
          category: 'security',
          maskedPlaceholder: '[PASSWORD REMOVED]',
          originalValue: 'SuperSecret2026!Prod',
          detectedBy: 'regex_pattern'
        },
        {
          itemType: 'Bank Account Number',
          category: 'financial',
          maskedPlaceholder: '[ACCOUNT NUMBER REMOVED ENDING IN 9482]',
          originalValue: '4092-8819-3301-9482',
          detectedBy: 'regex_pattern'
        },
        {
          itemType: 'Personal Phone Number',
          category: 'pii',
          maskedPlaceholder: '[PHONE NUMBER REMOVED]',
          originalValue: '415-555-0199',
          detectedBy: 'regex_pattern'
        },
        {
          itemType: 'Employee Salary / Compensation',
          category: 'confidential',
          maskedPlaceholder: '[COMPENSATION DETAILS REMOVED]',
          originalValue: '$195,000 annual base',
          detectedBy: 'llm_semantic'
        }
      ]
    }
  },
  {
    id: 'case-5',
    number: 5,
    title: 'SEV-1 Outage Incident Postmortem & SLA Review',
    project: 'Core Platform v2',
    duration: '55 min',
    attendees: ['Alex Rivera (Staff Architect)', 'Priya Sharma (DevOps)', 'Marcus Vance (Compliance)', 'Elena Rostova (Frontend)'],
    badge: 'SEV-1 Postmortem & SLA Breach',
    badgeColor: 'red',
    category: 'incident',
    description: 'High-severity incident review. Analyzes a 42-minute API outage caused by connection pool exhaustion, establishes PgBouncer connection pooling mandate, and flags an SLA breach.',
    keyTakeaway: 'Captures incident root causes, critical unassigned triage credentials, and detects policy breaches against 99.99% uptime mandates.',
    transcript: 'Alex Rivera: Beginning the SEV-1 incident postmortem for yesterday\'s 42-minute API outage. Root cause: connection pool exhaustion during the batch indexing job. We officially approve migrating all backend services to PgBouncer connection pooling with a hard limit of 30 connections per worker. Priya Sharma: I will deploy the PgBouncer cluster with transaction pooling to staging by tomorrow 2 PM. Marcus Vance: Direct production database queries via DDL are strictly banned without peer review. Also, someone urgently needs to audit and revoke all unmonitored direct database access tokens left over from the incident. Elena Rostova: I will update the customer status page incident report by 5 PM today.',
    mockupData: {
      decisions: [
        {
          title: 'Mandatory PgBouncer Pooling for All Backend Services',
          statement: 'Migrate all production backend worker pods to PgBouncer transaction-level connection pooling with a hard ceiling of 30 connections per pod to eliminate pool exhaustion.',
          certainty: 0.98,
          status: 'active',
          speaker: 'Alex Rivera',
          tags: ['incident', 'database', 'pgbouncer', 'postmortem']
        },
        {
          title: 'Prohibition of Unreviewed Direct Production DDL Execution',
          statement: 'Direct manual DDL migrations or indexing commands in production databases are strictly prohibited without two principal engineer peer reviews.',
          certainty: 0.96,
          status: 'active',
          speaker: 'Marcus Vance',
          tags: ['policy', 'compliance', 'security']
        }
      ],
      tasks: [
        {
          title: 'Deploy PgBouncer cluster with transaction pooling to staging',
          ownerName: 'Priya Sharma',
          ownerRole: 'Principal DevOps',
          dueDate: 'Tomorrow',
          urgency: 'due_tomorrow',
          status: 'in_progress',
          evidenceQuote: 'Priya Sharma: "I will deploy the PgBouncer cluster with transaction pooling to staging by tomorrow 2 PM."'
        },
        {
          title: 'Publish customer-facing SEV-1 root cause summary',
          ownerName: 'Elena Rostova',
          ownerRole: 'Lead Frontend',
          dueDate: 'Today',
          urgency: 'due_tomorrow',
          status: 'todo',
          evidenceQuote: 'Elena Rostova: "I will update the customer status page incident report by 5 PM today."'
        },
        {
          title: 'Audit and revoke temporary incident triage database credentials',
          ownerName: undefined,
          dueDate: 'Yesterday',
          urgency: 'overdue',
          status: 'todo',
          isUnassigned: true,
          evidenceQuote: 'Marcus Vance: "Someone urgently needs to audit and revoke all unmonitored direct database access tokens left over from the incident."'
        }
      ],
      conflicts: [
        {
          type: 'Policy Breach (SLA Overwrite)',
          earlier: 'Target: 99.99% monthly availability with maximum 5 min MTTR',
          newStatement: 'Actual: 42 minutes unmitigated downtime due to manual failover',
          rationale: 'Monthly downtime allowance exceeded by 9x due to delayed connection draining.',
          severity: 'CRITICAL_BLOCKING',
          confidence: 0.94,
          recommendedAction: 'Mandate automated read-replica promotion scripts in the PgBouncer deployment.'
        }
      ],
      redactions: []
    }
  }
];

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (demoCase: DemoCaseData) => void;
  onLoadCaseMockup?: (caseId: string) => void;
  onLoadFullStory: () => void;
  onClearToIdle: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onSelectCase,
  onLoadCaseMockup,
  onLoadFullStory,
  onClearToIdle
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'decisions' | 'conflicts' | 'privacy' | 'transcript'>('tasks');

  if (!isOpen) return null;

  const filteredCases = activeCategory === 'all' 
    ? DEMO_CASES 
    : DEMO_CASES.filter(c => c.category === activeCategory);

  const toggleExpand = (caseId: string) => {
    if (expandedCaseId === caseId) {
      setExpandedCaseId(null);
    } else {
      setExpandedCaseId(caseId);
      setActiveSubTab('tasks');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] flex flex-col my-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1B2A4A]">
                  Demo Scenarios &amp; Mockup Datasets
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Interactive Demo
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Explore rich mockup data for each scenario (tasks, decisions, conflicts, redactions) or load them instantly into the live workspace.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'all', label: 'All 5 Scenarios' },
            { id: 'architecture', label: 'Architecture & Pivots' },
            { id: 'privacy', label: 'Privacy & Redaction' },
            { id: 'incident', label: 'Incident & Postmortem' },
            { id: 'sync', label: 'Casual Discussions' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveCategory(f.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                activeCategory === f.id
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Demo Cases Scroll Area */}
        <div className="space-y-3.5 overflow-y-auto pr-1 flex-1">
          {filteredCases.map(c => {
            const isExpanded = expandedCaseId === c.id;
            const tasksCount = c.mockupData.tasks.length;
            const decisionsCount = c.mockupData.decisions.length;
            const conflictsCount = c.mockupData.conflicts.length;
            const redactionsCount = c.mockupData.redactions.length;

            return (
              <div
                key={c.id}
                className={`border rounded-xl transition-all duration-200 ${
                  isExpanded
                    ? 'border-blue-400 bg-blue-50/20 shadow-md ring-1 ring-blue-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Main Card Header */}
                <div className="p-4 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                        #{c.number}
                      </span>
                      <h4 className="font-bold text-[#1B2A4A] text-sm">
                        {c.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-medium">
                        · {c.duration}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto border ${
                        c.badgeColor === 'red'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : c.badgeColor === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : c.badgeColor === 'amber'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {c.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {c.description}
                  </p>

                  {/* Mockup Data Count Summary Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                      <FileText className="w-3 h-3 text-slate-500" />
                      {tasksCount} {tasksCount === 1 ? 'Task' : 'Tasks'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-slate-500" />
                      {decisionsCount} {decisionsCount === 1 ? 'Decision' : 'Decisions'}
                    </span>
                    {conflictsCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                        {conflictsCount} {conflictsCount === 1 ? 'Conflict' : 'Conflicts'}
                      </span>
                    )}
                    {redactionsCount > 0 && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-600" />
                        {redactionsCount} Redacted Secrets
                      </span>
                    )}
                    <span className="text-slate-400 ml-auto">
                      Project: <span className="text-slate-600 font-semibold">{c.project}</span>
                    </span>
                  </div>

                  {/* Action Bar for this Case */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      onClick={() => toggleExpand(c.id)}
                      className="text-xs font-semibold text-[#2563EB] hover:text-blue-800 flex items-center gap-1 py-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          <span>Hide Mockup Data Preview</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          <span>Inspect Mockup Data ({tasksCount} Tasks, {decisionsCount} Dec, {conflictsCount} Conf)</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Pre-fill Speech Area */}
                      <button
                        onClick={() => {
                          onSelectCase(c);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                        title="Open in Speak Your Meeting to test live mic & AI scanner"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Pre-fill &quot;Speak Meeting&quot;</span>
                      </button>

                      {/* Instant Load Mockup Data */}
                      <button
                        onClick={() => {
                          if (onLoadCaseMockup) {
                            onLoadCaseMockup(c.id);
                          } else {
                            onLoadFullStory();
                          }
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                        title="Inject pre-computed mockup data directly into workspace"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Instant Load Mockup Data</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Mockup Data Inspection Drawer */}
                {isExpanded && (
                  <div className="border-t border-blue-200 bg-white p-4 rounded-b-xl space-y-3.5 animate-fade-in">
                    {/* Drawer Sub-tabs */}
                    <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
                      <button
                        onClick={() => setActiveSubTab('tasks')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                          activeSubTab === 'tasks'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Tasks ({tasksCount})
                      </button>
                      <button
                        onClick={() => setActiveSubTab('decisions')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                          activeSubTab === 'decisions'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Decisions ({decisionsCount})
                      </button>
                      {conflictsCount > 0 && (
                        <button
                          onClick={() => setActiveSubTab('conflicts')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            activeSubTab === 'conflicts'
                              ? 'bg-red-600 text-white'
                              : 'text-red-700 hover:bg-red-50'
                          }`}
                        >
                          Conflicts ({conflictsCount})
                        </button>
                      )}
                      {redactionsCount > 0 && (
                        <button
                          onClick={() => setActiveSubTab('privacy')}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                            activeSubTab === 'privacy'
                              ? 'bg-amber-600 text-white'
                              : 'text-amber-800 hover:bg-amber-50'
                          }`}
                        >
                          Privacy Redactions ({redactionsCount})
                        </button>
                      )}
                      <button
                        onClick={() => setActiveSubTab('transcript')}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                          activeSubTab === 'transcript'
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Diarized Transcript
                      </button>
                    </div>

                    {/* Sub-tab 1: Tasks */}
                    {activeSubTab === 'tasks' && (
                      <div className="space-y-2.5">
                        {c.mockupData.tasks.length === 0 ? (
                          <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-lg text-center">
                            No tasks created in this exploratory sync.
                          </div>
                        ) : (
                          c.mockupData.tasks.map((t, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-[#1B2A4A]">
                                    {t.title}
                                  </span>
                                  {t.isUnassigned ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                      [UNASSIGNED - ACTION REQUIRED]
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                      Owner: {t.ownerName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px]">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    t.urgency === 'overdue'
                                      ? 'bg-red-100 text-red-800'
                                      : t.urgency === 'due_tomorrow'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {t.dueDate}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                                    t.status === 'done'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : t.status === 'blocked'
                                      ? 'bg-red-100 text-red-800'
                                      : t.status === 'in_progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {t.status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>

                              {t.blockerNote && (
                                <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                                  <strong>Blocker:</strong> {t.blockerNote}
                                </div>
                              )}

                              <div className="text-[11px] text-slate-500 italic bg-white p-2 rounded border border-slate-100">
                                Evidence: {t.evidenceQuote}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* Sub-tab 2: Decisions */}
                    {activeSubTab === 'decisions' && (
                      <div className="space-y-2.5">
                        {c.mockupData.decisions.map((d, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-xs text-[#1B2A4A] flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>{d.title}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                  {Math.round(d.certainty * 100)}% Confirmed
                                </span>
                                <span className="text-slate-500">
                                  by {d.speaker}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-700 bg-white p-2 rounded border border-slate-100">
                              &ldquo;{d.statement}&rdquo;
                            </p>
                            {d.supersedes && (
                              <div className="text-[11px] text-red-600 font-medium">
                                Supersedes: {d.supersedes}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-tab 3: Conflicts */}
                    {activeSubTab === 'conflicts' && (
                      <div className="space-y-2.5">
                        {c.mockupData.conflicts.map((conf, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-red-50/50 border border-red-200 rounded-lg space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-xs text-red-800">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span>{conf.type}</span>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-300">
                                {conf.severity} ({Math.round(conf.confidence * 100)}% Conf)
                              </span>
                            </div>

                            <p className="text-xs text-red-900 font-medium">
                              {conf.rationale}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div className="p-2 bg-white rounded border border-red-100">
                                <span className="font-bold text-slate-500 block">Earlier Reference:</span>
                                <span className="text-slate-700">{conf.earlier}</span>
                              </div>
                              <div className="p-2 bg-white rounded border border-red-100">
                                <span className="font-bold text-slate-500 block">New Statement:</span>
                                <span className="text-slate-700">{conf.newStatement}</span>
                              </div>
                            </div>

                            <div className="text-[11px] text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                              <strong>Recommended Resolution:</strong> {conf.recommendedAction}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-tab 4: Privacy Redactions */}
                    {activeSubTab === 'privacy' && (
                      <div className="space-y-2">
                        {c.mockupData.redactions.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-bold text-[#1B2A4A] flex items-center gap-1.5">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                <span>{r.itemType}</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
                                  {r.category}
                                </span>
                              </div>
                              <div className="text-slate-500 text-[11px] mt-0.5">
                                Pre-storage Mask: <code className="bg-white px-1 py-0.5 rounded border border-slate-200 text-red-600 font-mono text-[10px]">{r.maskedPlaceholder}</code>
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                              Original Safe Token: <span className="text-slate-700 font-mono">{r.originalValue}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-tab 5: Diarized Transcript */}
                    {activeSubTab === 'transcript' && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto font-sans">
                        {c.transcript}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Global Demo Actions Footer */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Reset to Clean Slate */}
          <button
            onClick={() => {
              onClearToIdle();
              onClose();
            }}
            className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            title="Wipe database and return to clean idle slate"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset to Clean Slate (Empty)</span>
          </button>

          {/* Load Full Multi-Scenario Story */}
          <button
            onClick={() => {
              onLoadFullStory();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulate All 5 Scenarios in Workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
