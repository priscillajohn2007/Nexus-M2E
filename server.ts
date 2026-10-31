import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { scanAndRedact } from './server/privacy.js';
import { analyzeTranscript, askMeetings } from './server/analyzer.js';
import { dispatchTaskToTracker } from './server/tracker.js';
import { generateTaskICS } from './server/calendar.js';
import { 
  register, 
  verifyEmailToken, 
  resendVerification, 
  login, 
  requestPasswordReset, 
  resetPassword, 
  assignUserRole, 
  getSessionUser,
  hasRole 
} from './server/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to extract session user from Bearer header
function extractAuthUser(req: express.Request) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return getSessionUser(token);
  }
  return null;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Nexus-M2E', time: new Date().toISOString() });
});

// AUTHENTICATION & ONBOARDING ENDPOINTS

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required.' });
    }
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const result = await register(fullName, email, password, appUrl);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Verify email with token
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Verification token is required.' });
    }
    const result = await verifyEmailToken(token);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const result = await resendVerification(email, appUrl);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const result = await login(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});

// Get current session profile
app.get('/api/auth/me', (req, res) => {
  const user = extractAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ success: true, user });
});

// Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const appUrl = process.env.APP_URL || `${protocol}://${host}`;
    const result = await requestPasswordReset(email, appUrl);
    res.json({ success: true, message: 'Password reset link generated.', ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Set new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    await resetPassword(token, newPassword);
    res.json({ success: true, message: 'Password successfully reset. You may now log in.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Onboarding: Choose role
app.post('/api/auth/choose-role', async (req, res) => {
  try {
    const user = extractAuthUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Not authenticated. Please log in first.' });
    }
    const { role } = req.body;
    if (role !== 'organizer' && role !== 'participant') {
      return res.status(400).json({ error: 'Invalid role. Must be "organizer" or "participant".' });
    }
    const roleRecord = await assignUserRole(user.id, role);
    user.role = role;
    res.json({ success: true, roleRecord, user });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 2. Database state & metrics (with Row-Level Access Control for participants)
app.get('/api/db/state', (req, res) => {
  const user = extractAuthUser(req);
  const data = db.getData();

  // If user is authenticated as participant, enforce strict Row-Level Security
  if (user && user.role === 'participant') {
    const userEmail = (user.email || '').toLowerCase();
    const userFirstName = (user.fullName || '').toLowerCase().split(' ')[0];

    // Read only tasks assigned to them (linked by email, id, or name)
    const filteredTasks = data.tasks.filter(t => 
      t.ownerId === user.id ||
      (t.ownerEmail && t.ownerEmail.toLowerCase() === userEmail) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(userFirstName))
    );

    // Read only meetings where they are listed as attendee
    const filteredMeetings = data.meetings.filter(m => 
      m.attendees.some(a => (a.email || '').toLowerCase() === userEmail)
    );

    // Read only decisions from attended meetings or tasks affecting them
    const meetingIds = new Set(filteredMeetings.map(m => m.id));
    const filteredDecisions = data.decisions.filter(d => 
      meetingIds.has(d.meetingId) || filteredTasks.some(t => t.decisionAlert?.decisionId === d.id)
    );

    const filteredConflicts = data.conflicts.filter(c => 
      filteredTasks.some(t => t.title.toLowerCase().includes(c.newStatement.statement.slice(0, 20).toLowerCase()))
    );

    return res.json({
      meetings: filteredMeetings,
      decisions: filteredDecisions,
      tasks: filteredTasks,
      conflicts: filteredConflicts,
      constraints: data.constraints,
      auditLogs: data.auditLogs.filter(l => l.actor === user.fullName || l.entityId === user.id),
      teamMembers: data.teamMembers,
      trackerConfig: data.trackerConfig,
      metrics: {
        meetingsProcessed: filteredMeetings.length,
        openTasks: filteredTasks.filter(t => t.status !== 'done').length,
        pendingApprovals: 0,
        unresolvedConflicts: filteredConflicts.filter(c => c.status === 'pending').length,
        upcomingDeadlines: filteredTasks.filter(t => t.urgency === 'due_tomorrow' || t.urgency === 'upcoming').length,
        overdueTasks: filteredTasks.filter(t => t.urgency === 'overdue' && t.status !== 'done').length,
        tasksNeedingOwner: 0,
        avgTimeToApprovalMinutes: 0
      }
    });
  }

  // Organizers (or open demo mode) receive full state
  const metrics = db.getMetrics();
  res.json({ ...data, metrics });
});

// 3. Privacy Scan & Redaction (Runs BEFORE storage, BEFORE AI call, BEFORE distribution)
app.post('/api/redact', (req, res) => {
  const { rawTranscript } = req.body;
  if (typeof rawTranscript !== 'string') {
    return res.status(400).json({ error: 'rawTranscript string is required' });
  }

  const result = scanAndRedact(rawTranscript);
  res.json(result);
});

// 4. Analyze Meeting Transcript (Redacted transcript input only)
app.post('/api/analyze', async (req, res) => {
  try {
    const { 
      title = 'Untitled Meeting', 
      date = new Date().toISOString().split('T')[0], 
      project = 'Core Platform v2', 
      redactedTranscript = '',
      attendees = [],
      isConfidential = false,
      hasOffTheRecordSections = false,
      redactionItems = []
    } = req.body;

    if (!redactedTranscript.trim()) {
      return res.status(400).json({ error: 'Redacted transcript content is required' });
    }

    // Call extraction engine with evidence & epistemic scoring
    const analysis = await analyzeTranscript({
      title,
      date,
      project,
      redactedTranscript
    });

    const meetingId = `meet-${Date.now()}`;
    
    // Assign proper meetingId to generated items
    const decisions = analysis.decisions.map(d => ({
      ...d,
      meetingId,
      meetingTitle: title,
      date,
      project
    }));

    const tasks = analysis.tasks.map(t => ({
      ...t,
      meetingId,
      meetingTitle: title,
      meetingDate: date,
      project
    }));

    const newMeeting = {
      id: meetingId,
      title,
      date,
      project,
      duration: '45 min',
      attendees: attendees.length > 0 ? attendees : [
        { name: 'Alex Rivera', email: 'alex.rivera@nexus-corp.internal' },
        { name: 'Priya Sharma', email: 'priya.sharma@nexus-corp.internal' }
      ],
      rawTranscriptLength: redactedTranscript.length,
      cleanedTranscript: redactedTranscript,
      isConfidential: Boolean(isConfidential),
      hasOffTheRecordSections: Boolean(hasOffTheRecordSections),
      redactionsCount: redactionItems.length,
      redactionItems,
      decisions,
      tasks,
      conflicts: analysis.conflicts,
      status: 'analyzed' as const,
      createdAt: new Date().toISOString()
    };

    // Store in persistent database
    const currentData = db.getData();
    currentData.meetings.unshift(newMeeting);
    currentData.decisions.unshift(...decisions);
    currentData.tasks.unshift(...tasks);
    currentData.conflicts.unshift(...analysis.conflicts);

    db.logAudit(
      'Organizer',
      'analyzed',
      `Processed meeting "${title}" (${decisions.length} decisions, ${tasks.length} tasks, ${analysis.conflicts.length} conflicts)`,
      'meeting',
      meetingId
    );

    db.commit();

    res.json({
      success: true,
      meeting: newMeeting,
      analysis,
      metrics: db.getMetrics()
    });
  } catch (err: any) {
    console.error('Error analyzing transcript:', err);
    res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

// 5. Conflict Resolution
app.post('/api/conflicts/resolve', (req, res) => {
  const { conflictId, action, actor = 'Organizer' } = req.body;
  const currentData = db.getData();
  const conflict = currentData.conflicts.find(c => c.id === conflictId);

  if (!conflict) {
    return res.status(404).json({ error: 'Conflict record not found' });
  }

  if (action === 'accept') {
    // Supersede earlier decision
    const earlierDec = currentData.decisions.find(d => d.id === conflict.earlierDecision.id);
    if (earlierDec) {
      earlierDec.status = 'superseded';
    }

    // Activate the new decision if exists
    const matchingNew = currentData.decisions.find(d => 
      d.statement === conflict.newStatement.statement || 
      conflict.newStatement.statement.includes(d.title)
    );
    if (matchingNew) {
      matchingNew.status = 'active';
      if (earlierDec) {
        earlierDec.supersededBy = matchingNew.id;
        matchingNew.supersedesId = earlierDec.id;
      }
    }

    conflict.status = 'accepted';
    db.logAudit(actor, 'conflict_resolved', `Accepted change for conflict: ${conflict.rationale}`, 'conflict', conflictId);
  } else if (action === 'keep_old') {
    conflict.status = 'kept_old';
    // Reject new statement
    const matchingNew = currentData.decisions.find(d => d.statement === conflict.newStatement.statement);
    if (matchingNew) {
      matchingNew.status = 'rejected';
    }
    db.logAudit(actor, 'conflict_resolved', `Maintained original decision for conflict: ${conflict.rationale}`, 'conflict', conflictId);
  } else if (action === 'dismiss') {
    conflict.status = 'dismissed';
    db.logAudit(actor, 'conflict_resolved', `Dismissed conflict advisory: ${conflict.rationale}`, 'conflict', conflictId);
  }

  db.commit();
  res.json({ success: true, conflict, metrics: db.getMetrics() });
});

// 6. Confirm and Dispatch All Tasks Idempotently
app.post('/api/tasks/dispatch-all', async (req, res) => {
  const { taskIds, actor = 'Organizer' } = req.body;
  const currentData = db.getData();
  
  const tasksToDispatch = currentData.tasks.filter(t => {
    if (taskIds && Array.isArray(taskIds)) {
      return taskIds.includes(t.id);
    }
    return !t.isDispatched;
  });

  const results = [];
  for (const task of tasksToDispatch) {
    const result = await dispatchTaskToTracker(task, actor);
    results.push(result);
  }

  db.commit();
  res.json({
    success: true,
    dispatchedCount: results.length,
    results,
    metrics: db.getMetrics()
  });
});

// 7. Update Task (status, owner, due date, blocker note, snooze, needHelp)
app.post('/api/tasks/update', (req, res) => {
  const { taskId, updates, actor = 'User' } = req.body;
  const currentData = db.getData();
  const task = currentData.tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // If assigning owner
  if (updates.ownerId) {
    const member = currentData.teamMembers.find(m => m.id === updates.ownerId);
    if (member) {
      task.ownerId = member.id;
      task.ownerName = member.name;
      task.ownerAvatar = member.avatar;
      task.ownerEmail = member.email;
      task.ownerConfidence = 1.0;
    }
  }

  // Update properties
  if (updates.status) task.status = updates.status;
  if (updates.dueDate) task.dueDate = updates.dueDate;
  if (updates.blockerNote !== undefined) task.blockerNote = updates.blockerNote;
  if (updates.snoozedUntil !== undefined) task.snoozedUntil = updates.snoozedUntil;
  if (updates.needHelpFlag !== undefined) task.needHelpFlag = updates.needHelpFlag;

  db.logAudit(actor, 'task_status_changed', `Updated task "${task.title}" (Status: ${task.status})`, 'task', taskId);
  db.commit();

  res.json({ success: true, task, metrics: db.getMetrics() });
});

// 8. "This task isn't mine" Reassignment Action
app.post('/api/tasks/reassign-from-my-work', (req, res) => {
  const { taskId, currentOwnerName = 'Current User' } = req.body;
  const currentData = db.getData();
  const task = currentData.tasks.find(t => t.id === taskId);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Reset owner to trigger [UNASSIGNED - ACTION REQUIRED]
  task.ownerId = undefined;
  task.ownerName = undefined;
  task.ownerConfidence = 0.0;
  task.status = 'todo';

  db.logAudit(
    currentOwnerName,
    'task_status_changed',
    `Returned task "${task.title}" to pool ("This task isn't mine") - Flagged for organizer`,
    'task',
    taskId
  );
  db.commit();

  res.json({ success: true, task, metrics: db.getMetrics() });
});

// 9. Download .ics iCalendar file for task
app.get('/api/tasks/:id/ics', (req, res) => {
  const currentData = db.getData();
  const task = currentData.tasks.find(t => t.id === req.params.id);

  if (!task) {
    return res.status(404).send('Task not found');
  }

  const icsContent = generateTaskICS(task, req.headers.host ? `http://${req.headers.host}` : undefined);
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="nexus-task-${task.id}.ics"`);
  res.send(icsContent);
});

// 10. "Ask your meetings" Cross-Meeting RAG Query
app.post('/api/ask-meetings', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const answerData = await askMeetings(query);
    res.json(answerData);
  } catch (err: any) {
    console.error('Error answering question:', err);
    res.status(500).json({ error: err.message || 'Failed to answer query' });
  }
});

// 11. Seed Full Demo Story
app.post('/api/demo/seed', (req, res) => {
  const seeded = db.seedDemoStory();
  res.json({
    success: true,
    message: 'Full demo story successfully loaded into workspace.',
    state: {
      ...seeded,
      metrics: db.getMetrics()
    }
  });
});

// 11a. Load specific individual demo case
app.post('/api/demo/load-case', (req, res) => {
  const { caseId } = req.body;
  if (!caseId) {
    return res.status(400).json({ error: 'caseId is required' });
  }
  const seeded = db.seedDemoCase(caseId);
  res.json({
    success: true,
    message: `Demo case "${caseId}" mockup data successfully loaded into workspace.`,
    state: {
      ...seeded,
      metrics: db.getMetrics()
    }
  });
});

// 11b. Clear all demo data back to clean idle state
app.post('/api/demo/clear', (req, res) => {
  const cleared = db.clearData();
  res.json({
    success: true,
    message: 'Database cleared to idle clean slate.',
    state: {
      ...cleared,
      metrics: db.getMetrics()
    }
  });
});

// 12. Update Tracker Configuration
app.post('/api/settings/tracker', (req, res) => {
  const { provider, enabled, apiKey, targetRepositoryOrBoard } = req.body;
  const currentData = db.getData();

  currentData.trackerConfig = {
    provider: provider || 'github',
    enabled: Boolean(enabled),
    apiKey: apiKey || '',
    targetRepositoryOrBoard: targetRepositoryOrBoard || 'nexus-corp/core-platform-v2',
    syncState: (enabled && apiKey && apiKey.trim().length > 5) ? 'connected' : 'not_configured',
    errorMessage: (enabled && (!apiKey || apiKey.trim().length <= 5)) ? 'API Key is missing or invalid' : undefined
  };

  db.commit();
  res.json({ success: true, trackerConfig: currentData.trackerConfig });
});

// 13. Add / Update Policy Constraint Rule
app.post('/api/settings/constraints', (req, res) => {
  const { title, rule, category = 'compliance', severity = 'CRITICAL_BLOCKING' } = req.body;
  if (!title || !rule) {
    return res.status(400).json({ error: 'Title and rule are required' });
  }

  const currentData = db.getData();
  const newConstraint = {
    id: `const-${Date.now()}`,
    title,
    rule,
    category,
    severity,
    active: true,
    createdAt: new Date().toISOString()
  };

  currentData.constraints.unshift(newConstraint);
  db.commit();
  res.json({ success: true, constraint: newConstraint, constraints: currentData.constraints });
});

// Server-side Vite or Static handling
async function startServer() {
  // Database starts completely idle by default. Demo cases are only loaded when explicitly selected via Demo.
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const listenPort = Number(PORT) || 3000;
  app.listen(listenPort, '0.0.0.0', () => {
    console.log(`Nexus-M2E server listening on http://0.0.0.0:${listenPort}`);
  });
}

startServer();
