import crypto from 'crypto';
import { db } from './db.js';
import { MeetingTask, TrackerConfig } from '../src/types/index.js';

interface DispatchResult {
  success: boolean;
  taskId: string;
  dispatchKey: string;
  externalStatus: 'synced' | 'kept_internal';
  externalUrl?: string;
  externalId?: string;
  message: string;
}

/**
 * Generate an idempotent dispatch hash key:
 * meetingId + hash of (title + owner + dueDate)
 */
export function generateDispatchKey(meetingId: string, task: Partial<MeetingTask>): string {
  const payload = `${task.title || ''}|${task.ownerId || ''}|${task.dueDate || ''}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex').substring(0, 10);
  return `${meetingId}-${hash}`;
}

/**
 * Dispatch a task to the configured external tracker (GitHub / Notion / Trello),
 * or keep it internal with an explicit status message if credentials are not configured.
 */
export async function dispatchTaskToTracker(task: MeetingTask, actorName = 'Organizer'): Promise<DispatchResult> {
  const storedData = db.getData();
  const trackerConfig: TrackerConfig = storedData.trackerConfig;
  const dispatchKey = task.dispatchKey || generateDispatchKey(task.meetingId, task);

  // Check for duplicate existing dispatch
  const existingDispatched = storedData.tasks.find(
    t => t.id !== task.id && t.dispatchKey === dispatchKey && t.isDispatched
  );

  if (existingDispatched) {
    return {
      success: true,
      taskId: task.id,
      dispatchKey,
      externalStatus: 'synced',
      externalUrl: existingDispatched.externalRef?.url,
      externalId: existingDispatched.externalRef?.externalId,
      message: `Idempotent dispatch: Task was already dispatched under key ${dispatchKey}. Duplicate creation prevented.`
    };
  }

  // Check if external integration is configured
  if (!trackerConfig.enabled || !trackerConfig.apiKey || trackerConfig.syncState !== 'connected') {
    const missing = !trackerConfig.apiKey 
      ? `Missing ${trackerConfig.provider.toUpperCase()} API key in Settings` 
      : 'Integration status is not connected';

    // Mark task as dispatched internally
    task.isDispatched = true;
    task.dispatchKey = dispatchKey;
    task.externalRef = {
      tracker: trackerConfig.provider,
      externalId: `internal-${task.id}`,
      url: '#',
      status: 'pending',
      error: `${missing}. Task is safely retained in Nexus internal board.`
    };

    db.logAudit(
      actorName,
      'task_dispatched',
      `Dispatched "${task.title}" internally (External sync inactive: ${missing})`,
      'task',
      task.id
    );

    return {
      success: true,
      taskId: task.id,
      dispatchKey,
      externalStatus: 'kept_internal',
      message: `Task approved and dispatched to internal board. External sync skipped (${missing}).`
    };
  }

  // If real API key is configured (e.g. GitHub personal access token)
  if (trackerConfig.provider === 'github') {
    try {
      const [owner, repo] = trackerConfig.targetRepositoryOrBoard.split('/');
      if (!owner || !repo) {
        throw new Error('Repository must be formatted as "owner/repo"');
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${trackerConfig.apiKey}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Nexus-M2E-Agent'
        },
        body: JSON.stringify({
          title: task.title,
          body: `**Assigned via Nexus-M2E Meeting-to-Execution Agent**\n\n**Owner:** ${task.ownerName || 'Unassigned'}\n**Deadline:** ${task.dueDate}\n**Source Meeting:** ${task.meetingTitle} (${task.meetingDate})\n\n> *Evidence Context:*\n> ${task.evidenceContext}\n\n*Idempotency Key: \`${dispatchKey}\`*`
        })
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub API HTTP ${res.status}: ${errorText.slice(0, 100)}`);
      }

      const ghData: any = await res.json();
      task.isDispatched = true;
      task.dispatchKey = dispatchKey;
      task.externalRef = {
        tracker: 'github',
        externalId: `#${ghData.number}`,
        url: ghData.html_url,
        status: 'synced'
      };

      db.logAudit(
        actorName,
        'task_dispatched',
        `Dispatched "${task.title}" to GitHub issue #${ghData.number} (${ghData.html_url})`,
        'task',
        task.id
      );

      return {
        success: true,
        taskId: task.id,
        dispatchKey,
        externalStatus: 'synced',
        externalUrl: ghData.html_url,
        externalId: `#${ghData.number}`,
        message: `Task successfully synced to GitHub Issues (#${ghData.number}).`
      };
    } catch (apiErr: any) {
      task.isDispatched = true;
      task.dispatchKey = dispatchKey;
      task.externalRef = {
        tracker: 'github',
        externalId: `internal-${task.id}`,
        url: '#',
        status: 'failed',
        error: apiErr.message || 'GitHub API connection failed'
      };

      return {
        success: true,
        taskId: task.id,
        dispatchKey,
        externalStatus: 'kept_internal',
        message: `GitHub sync failed: ${apiErr.message}. Kept internal.`
      };
    }
  }

  // Fallback for Notion / Trello
  task.isDispatched = true;
  task.dispatchKey = dispatchKey;
  return {
    success: true,
    taskId: task.id,
    dispatchKey,
    externalStatus: 'kept_internal',
    message: `Dispatched to internal board.`
  };
}
