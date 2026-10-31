import { MeetingTask } from '../src/types/index.js';

/**
 * Format date to iCalendar UTC date string (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(dateStr: string, isAllDay = true): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  
  if (isAllDay) {
    return `${year}${month}${day}`;
  }
  return `${year}${month}${day}T170000Z`; // 5:00 PM UTC default deadline time
}

/**
 * Generate standard RFC 5545 iCalendar content for a task
 */
export function generateTaskICS(task: MeetingTask, appUrl = 'https://nexus-m2e.internal'): string {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const dtStart = formatICSDate(task.dueDate, false);
  const dtEnd = formatICSDate(task.dueDate, false);
  const summary = `[Nexus Task] ${task.title}`;
  const description = `Deadline: ${task.dueDate}\\nOwner: ${task.ownerName || 'Unassigned'}\\nMeeting: ${task.meetingTitle}\\n\\nEvidence Quote:\\n${task.evidenceContext.replace(/\n/g, '\\n')}\\n\\nNexus Link: ${appUrl}/task/${task.id}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Nexus-M2E//Meeting to Execution Agent//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:nexus-task-${task.id}@nexus-m2e.internal`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `STATUS:CONFIRMED`,
    `URL:${appUrl}/task/${task.id}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Task Deadline Tomorrow',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Task Due Today',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Generate a Google Calendar add-event link
 */
export function generateGoogleCalendarUrl(task: MeetingTask): string {
  const title = encodeURIComponent(`[Nexus Task] ${task.title}`);
  const details = encodeURIComponent(
    `Project: ${task.project}\nMeeting: ${task.meetingTitle}\nEvidence Context: "${task.evidenceContext}"\nOwner: ${task.ownerName || 'Unassigned'}`
  );
  const dateFormatted = task.dueDate.replace(/-/g, '');
  const dates = `${dateFormatted}T090000/${dateFormatted}T100000`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${dates}`;
}
