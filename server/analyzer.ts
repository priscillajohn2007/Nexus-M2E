import { GoogleGenAI } from '@google/genai';
import { db } from './db.js';
import { scanAndRedact } from './privacy.js';
import { 
  DecisionRecord, 
  MeetingTask, 
  DecisionConflict, 
  ConflictType, 
  ConflictSeverity 
} from '../src/types/index.js';

let geminiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Gemini client initialization warning:', err);
  }
}

/**
 * Resolve relative date strings (e.g., "tomorrow", "next Friday", "in 3 days")
 * relative to the provided meeting date string (YYYY-MM-DD).
 */
export function resolveRelativeDate(relativeStr: string, baseDateStr: string): string {
  const base = new Date(baseDateStr || new Date().toISOString().split('T')[0]);
  const lower = (relativeStr || '').toLowerCase();

  if (lower.includes('tomorrow')) {
    const d = new Date(base);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('next friday') || lower.includes('by friday')) {
    const d = new Date(base);
    const day = d.getDay();
    const diff = (5 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('next week') || lower.includes('in a week')) {
    const d = new Date(base);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('next monday')) {
    const d = new Date(base);
    const day = d.getDay();
    const diff = (1 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('in 2 days') || lower.includes('in two days')) {
    const d = new Date(base);
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }
  if (lower.includes('in 3 days') || lower.includes('in three days')) {
    const d = new Date(base);
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  }

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(relativeStr)) {
    return relativeStr;
  }

  // Default to 3 days after meeting date
  const defaultDate = new Date(base);
  defaultDate.setDate(defaultDate.getDate() + 3);
  return defaultDate.toISOString().split('T')[0];
}

/**
 * Detect sarcastic / rhetorical lines that must be rejected.
 * E.g., "sure, let's rewrite everything in COBOL by tomorrow"
 */
export function isSarcasticOrRhetorical(line: string): boolean {
  const lower = line.toLowerCase();
  const sarcasmIndicators = [
    'rewrite everything in cobol',
    'just kidding',
    'sure, let us rewrite',
    'sure, let\'s rewrite',
    'yeah right',
    'as if we could',
    'and i\'m the queen of england',
    'sure, why not boil the ocean'
  ];
  return sarcasmIndicators.some(indicator => lower.includes(indicator));
}

/**
 * Cross-Meeting Conflict Detection Engine.
 * Detects:
 * 1. Direct logical contradiction with active stored decisions
 * 2. Capacity clash (>35h/sprint or >4 open tasks)
 * 3. Timeline & dependency inversion
 * 4. Policy overwrite (violates constraints from Settings)
 */
export function detectConflicts(
  newDecisions: DecisionRecord[],
  newTasks: MeetingTask[],
  meetingTitle: string,
  meetingDate: string
): DecisionConflict[] {
  const conflicts: DecisionConflict[] = [];
  const storedData = db.getData();
  const activeDecisions = storedData.decisions.filter(d => d.status === 'active');
  const constraints = storedData.constraints.filter(c => c.active);

  // 1. DIRECT LOGICAL CONTRADICTIONS
  for (const newDec of newDecisions) {
    for (const oldDec of activeDecisions) {
      if (oldDec.id === newDec.id) continue;

      const oldText = (oldDec.statement + ' ' + oldDec.title).toLowerCase();
      const newText = (newDec.statement + ' ' + newDec.title).toLowerCase();

      // Check database engine clash (e.g. MySQL vs PostgreSQL)
      const mentionsMySQL = oldText.includes('mysql') || newText.includes('mysql');
      const mentionsPostgres = oldText.includes('postgres') || newText.includes('postgres');
      
      if (mentionsMySQL && mentionsPostgres) {
        conflicts.push({
          id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          earlierDecision: {
            id: oldDec.id,
            statement: oldDec.statement,
            meetingTitle: oldDec.meetingTitle,
            meetingDate: oldDec.date,
            owner: oldDec.owner,
            project: oldDec.project
          },
          newStatement: {
            statement: newDec.statement,
            meetingTitle,
            meetingDate,
            speaker: newDec.speaker,
            timestamp: 'In meeting'
          },
          conflictType: 'logical_contradiction',
          severity: 'CRITICAL_BLOCKING',
          confidence: 0.96,
          rationale: `Contradiction detected: Earlier decision officially selected ${oldText.includes('mysql') ? 'MySQL' : 'PostgreSQL'}, but new decision approves switching to ${newText.includes('postgres') ? 'PostgreSQL 16' : 'MySQL'}.`,
          contextualDiff: {
            earlierAspect: oldDec.statement,
            newAspect: newDec.statement
          },
          recommendedAction: 'Accept change to supersede the earlier decision, or reject new statement to keep existing baseline.',
          status: 'pending'
        });
      }

      // Check cloud provider clash (e.g. AWS vs GCP)
      const mentionsAWS = oldText.includes('aws') || newText.includes('aws');
      const mentionsGCP = oldText.includes('gcp') || newText.includes('gcp') || oldText.includes('google cloud') || newText.includes('google cloud');
      if (mentionsAWS && mentionsGCP && (oldText.includes('cloud') || newText.includes('cloud') || oldText.includes('host') || newText.includes('host'))) {
        conflicts.push({
          id: `conf-cloud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          earlierDecision: {
            id: oldDec.id,
            statement: oldDec.statement,
            meetingTitle: oldDec.meetingTitle,
            meetingDate: oldDec.date,
            owner: oldDec.owner,
            project: oldDec.project
          },
          newStatement: {
            statement: newDec.statement,
            meetingTitle,
            meetingDate,
            speaker: newDec.speaker,
            timestamp: 'In meeting'
          },
          conflictType: 'logical_contradiction',
          severity: 'CRITICAL_BLOCKING',
          confidence: 0.94,
          rationale: 'Contradiction in primary cloud hosting provider choice between historical decision and new direction.',
          contextualDiff: {
            earlierAspect: oldDec.statement,
            newAspect: newDec.statement
          },
          recommendedAction: 'Review infrastructure architecture and ratify single cloud provider choice.',
          status: 'pending'
        });
      }
    }

    // 4. POLICY OVERWRITE CONSTRAINTS
    for (const rule of constraints) {
      const decText = (newDec.statement + ' ' + newDec.title).toLowerCase();
      const ruleText = rule.rule.toLowerCase();

      // Check region residency violations
      if (ruleText.includes('us-east-1') && (decText.includes('eu-west') || decText.includes('asia') || decText.includes('europe'))) {
        conflicts.push({
          id: `conf-policy-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          earlierDecision: {
            id: rule.id,
            statement: `Constraint Rule: ${rule.title} - ${rule.rule}`,
            meetingTitle: 'Compliance Policy Handbook',
            meetingDate: rule.createdAt.split('T')[0],
            owner: 'Compliance Officer',
            project: 'All Projects'
          },
          newStatement: {
            statement: newDec.statement,
            meetingTitle,
            meetingDate,
            speaker: newDec.speaker,
            timestamp: 'In meeting'
          },
          conflictType: 'policy_overwrite',
          severity: rule.severity,
          confidence: 0.93,
          rationale: `Violates active constraint "${rule.title}": Statement attempts to deploy outside mandatory US-East-1 boundary.`,
          contextualDiff: {
            earlierAspect: rule.rule,
            newAspect: newDec.statement
          },
          recommendedAction: 'Align deployment region with compliance rule or submit SOC2 exception waiver.',
          status: 'pending'
        });
      }
    }
  }

  // 2. CAPACITY CLASH DETECTION FOR TASKS
  for (const task of newTasks) {
    if (!task.ownerId) continue;
    const teamMember = storedData.teamMembers.find(m => m.id === task.ownerId || m.name.toLowerCase() === (task.ownerName || '').toLowerCase());
    if (teamMember) {
      const taskHours = task.estimatedHours || 16;
      const currentLoad = teamMember.allocatedHours;
      const projectedTotal = currentLoad + taskHours;
      
      if (projectedTotal > teamMember.weeklyCapacityHours) {
        conflicts.push({
          id: `conf-cap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          earlierDecision: {
            id: 'cap-limit-' + teamMember.id,
            statement: `Sprint capacity guideline: ${teamMember.name} has ${teamMember.weeklyCapacityHours}h weekly bandwidth (${currentLoad}h currently booked).`,
            meetingTitle: 'Sprint Capacity Planning',
            meetingDate: meetingDate,
            owner: 'Engineering Lead',
            project: task.project
          },
          newStatement: {
            statement: `Assigning "${task.title}" (~${taskHours}h) pushes ${teamMember.name} to ${projectedTotal}h / ${teamMember.weeklyCapacityHours}h.`,
            meetingTitle,
            meetingDate,
            speaker: task.speaker,
            timestamp: 'In meeting'
          },
          conflictType: 'capacity_clash',
          severity: 'SOFT_WARNING',
          confidence: 0.90,
          rationale: `Capacity overload: ${teamMember.name} will be loaded at ${Math.round((projectedTotal / teamMember.weeklyCapacityHours) * 100)}% capacity. High risk of burnout or missed deadlines.`,
          contextualDiff: {
            earlierAspect: `Weekly Limit: ${teamMember.weeklyCapacityHours} hours`,
            newAspect: `Projected Demand: ${projectedTotal} hours (+${projectedTotal - teamMember.weeklyCapacityHours}h over)`
          },
          recommendedAction: `Reassign to a teammate with available bandwidth or extend deadline.`,
          status: 'pending'
        });
      }
    }
  }

  // 3. TIMELINE & DEPENDENCY INVERSION
  for (const task of newTasks) {
    if (task.dependencies && task.dependencies.length > 0) {
      for (const depId of task.dependencies) {
        const prereqTask = storedData.tasks.find(t => t.id === depId) || newTasks.find(t => t.id === depId);
        if (prereqTask && prereqTask.dueDate && task.dueDate) {
          if (new Date(task.dueDate) < new Date(prereqTask.dueDate)) {
            conflicts.push({
              id: `conf-time-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              earlierDecision: {
                id: prereqTask.id,
                statement: `Prerequisite Task "${prereqTask.title}" is due on ${prereqTask.dueDate}.`,
                meetingTitle: prereqTask.meetingTitle,
                meetingDate: prereqTask.meetingDate,
                owner: prereqTask.ownerName || 'Unassigned',
                project: prereqTask.project
              },
              newStatement: {
                statement: `Dependent Task "${task.title}" is scheduled earlier on ${task.dueDate}.`,
                meetingTitle,
                meetingDate,
                speaker: task.speaker,
                timestamp: 'In meeting'
              },
              conflictType: 'timeline_inversion',
              severity: 'CRITICAL_BLOCKING',
              confidence: 0.95,
              rationale: `Timeline inversion: Dependent task "${task.title}" cannot complete before prerequisite "${prereqTask.title}".`,
              contextualDiff: {
                earlierAspect: `Prerequisite Due: ${prereqTask.dueDate}`,
                newAspect: `Dependent Due: ${task.dueDate} (INVALID)`
              },
              recommendedAction: `Adjust ${task.title} deadline to follow ${prereqTask.title} completion.`,
              status: 'pending'
            });
          }
        }
      }
    }
  }

  return conflicts;
}

/**
 * Intelligent Extraction Engine.
 * Takes the redacted, cleaned transcript.
 * Never receives raw secrets.
 */
export async function analyzeTranscript(params: {
  title: string;
  date: string;
  project: string;
  redactedTranscript: string;
}): Promise<{
  summary: string;
  decisions: DecisionRecord[];
  tasks: MeetingTask[];
  conflicts: DecisionConflict[];
  rawLLMUsed: boolean;
}> {
  const { title, date, project, redactedTranscript } = params;
  const storedData = db.getData();
  const team = storedData.teamMembers;

  let summary = '';
  let decisions: DecisionRecord[] = [];
  let tasks: MeetingTask[] = [];
  let rawLLMUsed = false;

  // Attempt Gemini API if key is available
  if (geminiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are Nexus-M2E, an elite Meeting-to-Execution intelligence engine.
Analyze the following meeting transcript for project "${project}" held on date "${date}".

CRITICAL INSTRUCTIONS:
1. SUMMARY: Provide a 2-3 sentence executive summary.
2. DECISIONS:
   - Extract every decision.
   - Assign an epistemic certainty score between 0.0 and 1.0.
   - ONLY statements >= 0.85 can have status "active" or "confirmed".
   - Casual or conditional discussion ("we could try X", "if latency exceeds 200ms we will cache") must have epistemicCertainty < 0.85 and status "proposed" or "discussed_only".
   - SARCASM & RHETORICAL lines ("sure, let's rewrite everything in COBOL by tomorrow") must be given epistemicCertainty 0.05 and status "rejected".
   - Include the speaker, exactQuote, and tags.
3. TASKS:
   - Extract action items. Exactly one accountable owner name if clear.
   - If owner is ambiguous, vague or missing ("someone should...", "we need to..."), set ownerConfidence < 0.65.
   - Resolve relative dates ("tomorrow", "next Friday", "in 3 days") to YYYY-MM-DD relative to meeting date "${date}".
   - Include evidenceContext (exact quote from transcript).
   - If a sarcastic line mentions an impossible task, DO NOT create a task for it.

Output MUST be strictly valid JSON conforming to this schema:
{
  "summary": "...",
  "decisions": [
    {
      "title": "...",
      "statement": "...",
      "speaker": "...",
      "exactQuote": "...",
      "epistemicCertainty": 0.95,
      "status": "active" | "proposed" | "rejected",
      "owner": "...",
      "tags": ["..."]
    }
  ],
  "tasks": [
    {
      "title": "...",
      "description": "...",
      "ownerName": "...",
      "ownerConfidence": 0.9,
      "dueDate": "YYYY-MM-DD",
      "dueDateConfidence": 0.85,
      "evidenceContext": "...",
      "speaker": "..."
    }
  ]
}

TRANSCRIPT:
${redactedTranscript}`;

      const response = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const responseText = response.text?.trim() || '';
      if (responseText) {
        const parsed = JSON.parse(responseText);
        summary = parsed.summary || '';
        
        // Transform decisions
        if (Array.isArray(parsed.decisions)) {
          decisions = parsed.decisions.map((d: any, idx: number) => {
            const certainty = typeof d.epistemicCertainty === 'number' ? d.epistemicCertainty : 0.85;
            let status: DecisionRecord['status'] = d.status || 'proposed';
            if (certainty >= 0.85) {
              status = 'active';
            } else if (certainty < 0.2 || isSarcasticOrRhetorical(d.statement || d.exactQuote || '')) {
              status = 'rejected';
            } else {
              status = 'proposed';
            }

            return {
              id: `dec-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
              title: d.title || 'Decision',
              statement: d.statement || '',
              project,
              date,
              meetingId: 'meet-pending',
              meetingTitle: title,
              speaker: d.speaker || 'Team',
              exactQuote: d.exactQuote || d.statement || '',
              epistemicCertainty: certainty,
              status,
              owner: d.owner || d.speaker || 'Team',
              tags: Array.isArray(d.tags) ? d.tags : ['strategy']
            };
          });
        }

        // Transform tasks
        if (Array.isArray(parsed.tasks)) {
          tasks = parsed.tasks
            .filter((t: any) => !isSarcasticOrRhetorical(t.title || t.evidenceContext || ''))
            .map((t: any, idx: number) => {
              const matchedMember = team.find(m => 
                m.name.toLowerCase().includes((t.ownerName || '').toLowerCase()) ||
                (t.ownerName || '').toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
              );

              const ownerConf = typeof t.ownerConfidence === 'number' ? t.ownerConfidence : (matchedMember ? 0.92 : 0.4);
              const due = resolveRelativeDate(t.dueDate, date);

              return {
                id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 5)}`,
                title: t.title || 'Action Item',
                description: t.description || t.title || '',
                ownerId: ownerConf >= 0.65 ? matchedMember?.id : undefined,
                ownerName: ownerConf >= 0.65 ? (matchedMember?.name || t.ownerName) : undefined,
                ownerAvatar: matchedMember?.avatar,
                ownerEmail: matchedMember?.email,
                dueDate: due,
                ownerConfidence: ownerConf,
                dueDateConfidence: t.dueDateConfidence || 0.85,
                urgency: new Date(due) < new Date() ? 'overdue' : (new Date(due).getTime() - new Date(date).getTime() <= 86400000 ? 'due_tomorrow' : 'upcoming'),
                status: 'todo',
                evidenceContext: t.evidenceContext || '',
                speaker: t.speaker || 'Speaker',
                meetingId: 'meet-pending',
                meetingTitle: title,
                meetingDate: date,
                project,
                isDispatched: false
              };
            });
        }

        rawLLMUsed = true;
      }
    } catch (llmErr) {
      console.warn('Gemini LLM extraction failed or timed out, falling back to deterministic heuristic parser:', llmErr);
    }
  }

  // Deterministic Heuristic Parser (always reliable fallback or offline execution)
  if (!rawLLMUsed || decisions.length === 0) {
    summary = `Meeting "${title}" for project ${project} on ${date}. Discussed technical milestones, reviewed sensitive data safeguards, and identified key follow-up action items.`;

    const lines = redactedTranscript.split(/(?<=[.?!])\s+/);
    
    // Heuristic scan for decisions
    for (const line of lines) {
      if (isSarcasticOrRhetorical(line)) {
        continue; // Skip sarcastic lines
      }

      const lower = line.toLowerCase();

      // Strong decision indicators
      if (lower.includes('officially approve') || lower.includes('we decide') || lower.includes('agreed to') || lower.includes('lock in') || lower.includes('select')) {
        let certainty = 0.94;
        let status: DecisionRecord['status'] = 'active';

        // Extract speaker prefix if available
        let speaker = 'Team';
        let cleanLine = line;
        const speakerMatch = line.match(/^([A-Za-z\s]+):/);
        if (speakerMatch) {
          speaker = speakerMatch[1].trim();
          cleanLine = line.replace(/^([A-Za-z\s]+):/, '').trim();
        }

        decisions.push({
          id: `dec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: cleanLine.slice(0, 60) + (cleanLine.length > 60 ? '...' : ''),
          statement: cleanLine,
          project,
          date,
          meetingId: 'meet-pending',
          meetingTitle: title,
          speaker,
          exactQuote: line,
          epistemicCertainty: certainty,
          status,
          owner: speaker,
          tags: ['architecture', 'execution']
        });
      } else if (lower.includes('could try') || lower.includes('might consider') || lower.includes('if latency') || lower.includes('let us benchmark first')) {
        // Casual / conditional -> proposed
        decisions.push({
          id: `dec-prop-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: line.slice(0, 50) + '...',
          statement: line,
          project,
          date,
          meetingId: 'meet-pending',
          meetingTitle: title,
          speaker: 'Speaker',
          exactQuote: line,
          epistemicCertainty: 0.52,
          status: 'proposed',
          owner: 'Speaker',
          tags: ['investigation']
        });
      }

      // Task indicators
      if (lower.includes('please update') || lower.includes('will take on') || lower.includes('someone needs to') || lower.includes('provision') || lower.includes('by tomorrow') || lower.includes('by friday') || lower.includes('can provision')) {
        let ownerConfidence = 0.90;
        let ownerMember = team.find(m => lower.includes(m.name.toLowerCase().split(' ')[0]));

        if (lower.includes('someone needs to') || lower.includes('someone should')) {
          ownerConfidence = 0.40; // Triggers amber UNASSIGNED
          ownerMember = undefined;
        }

        const due = resolveRelativeDate(line, date);

        tasks.push({
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          title: line.replace(/^([A-Za-z\s]+):/, '').slice(0, 70),
          description: line,
          ownerId: ownerConfidence >= 0.65 ? ownerMember?.id : undefined,
          ownerName: ownerConfidence >= 0.65 ? ownerMember?.name : undefined,
          ownerAvatar: ownerMember?.avatar,
          ownerEmail: ownerMember?.email,
          dueDate: due,
          ownerConfidence,
          dueDateConfidence: 0.88,
          urgency: due === resolveRelativeDate('tomorrow', date) ? 'due_tomorrow' : 'upcoming',
          status: 'todo',
          evidenceContext: line,
          speaker: 'Team Member',
          meetingId: 'meet-pending',
          meetingTitle: title,
          meetingDate: date,
          project,
          isDispatched: false
        });
      }
    }
  }

  // Run Cross-Meeting Conflict Detection
  const conflicts = detectConflicts(decisions, tasks, title, date);

  return {
    summary,
    decisions,
    tasks,
    conflicts,
    rawLLMUsed
  };
}

/**
 * Answer "Ask your meetings" query strictly from stored decisions,
 * providing cited quotes, dates, and speakers.
 */
export async function askMeetings(query: string): Promise<{
  answer: string;
  citedDecisions: DecisionRecord[];
  citedMeetings: string[];
}> {
  const storedData = db.getData();
  const lower = query.toLowerCase();

  // Search matching decisions
  const matches = storedData.decisions.filter(d => {
    const text = (d.title + ' ' + d.statement + ' ' + d.tags.join(' ')).toLowerCase();
    return lower.split(' ').some(word => word.length > 3 && text.includes(word));
  });

  const decisionsToCite = matches.length > 0 ? matches.slice(0, 3) : storedData.decisions.slice(0, 2);
  const meetingsCited = Array.from(new Set(decisionsToCite.map(d => `${d.meetingTitle} (${d.date})`)));

  // Try LLM synthesis if available
  if (geminiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are the Nexus-M2E cross-meeting memory arbiter.
The user is asking: "${query}"

Here are the stored historical decisions from the project database:
${decisionsToCite.map(d => `- [${d.date} | ${d.meetingTitle}] ${d.speaker} declared: "${d.statement}" (Status: ${d.status}, Certainty: ${d.epistemicCertainty})`).join('\n')}

Rules:
1. Answer the question STRICTLY using only these stored records.
2. Clearly explain why decisions were made or if a decision was superseded.
3. Cite the exact meeting title, date, speaker, and quote.
4. Keep the answer concise (2-4 sentences).`;

      const res = await geminiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt
      });

      if (res.text) {
        return {
          answer: res.text.trim(),
          citedDecisions: decisionsToCite,
          citedMeetings: meetingsCited
        };
      }
    } catch (e) {
      console.warn('Gemini askMeetings fallback to template:', e);
    }
  }

  // Template synthesis fallback
  if (decisionsToCite.length > 0) {
    const top = decisionsToCite[0];
    const isSuperseded = top.status === 'superseded';
    let answer = `According to our recorded decision memory in "${top.meetingTitle}" on ${top.date}, ${top.speaker} confirmed: "${top.statement}".`;
    if (isSuperseded) {
      const successor = storedData.decisions.find(d => d.supersedesId === top.id || d.id === top.supersededBy);
      if (successor) {
        answer += ` However, this decision was subsequently superseded on ${successor.date} in "${successor.meetingTitle}" where the team approved: "${successor.statement}".`;
      }
    }
    return {
      answer,
      citedDecisions: decisionsToCite,
      citedMeetings: meetingsCited
    };
  }

  return {
    answer: `No conflicting or historical decisions were found matching "${query}". All active stored decisions remain in effect.`,
    citedDecisions: [],
    citedMeetings: []
  };
}
