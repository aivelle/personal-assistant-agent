import { jest } from '@jest/globals';
import { run as autoReply } from '../src/workflows/automation/auto_reply.js';
import { run as autoTagging } from '../src/workflows/automation/auto_tagging.js';
import attachImage from '../src/workflows/Create/attach_image_to_any_post.js';
import repurposeContent from '../src/workflows/Create/content_repurpose.js';
import rescheduleMeeting from '../src/workflows/Create/reschedule_meeting.js';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  );
});

describe('Workflow automation functions', () => {
  test('auto_reply returns confirmation', async () => {
    const result = await autoReply({
      prompt: 'Thank you',
      context: {
        gmailToken: 'token',
        replyTo: 'a@example.com',
        subject: 'Hello',
        threadId: '1',
      },
    });
    expect(result.message).toBe('Auto-reply sent');
  });

  test('auto_tagging returns confirmation', async () => {
    const result = await autoTagging({
      prompt: 'tag',
      context: { notionToken: 'token', pageId: 'page', tags: ['t1'] },
    });
    expect(result.message).toBe('Auto-tagging completed');
  });
});

describe('Create workflows', () => {
  test('attach_image_to_any_post returns success', async () => {
    const result = await attachImage({
      pageId: 'page',
      notionToken: 'token',
      imageUrl: 'http://example.com/img.png',
    });
    expect(result.status).toBe('success');
  });

  test('content_repurpose returns success', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ choices: [{ message: { content: 'done' } }] }),
    });
    const result = await repurposeContent({
      originalContent: 'text',
      targetFormat: 'LinkedIn',
      openaiApiKey: 'key',
    });
    expect(result.status).toBe('success');
    expect(result.message).toBe('done');
  });

  test('reschedule_meeting returns success', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ calendars: { cal: { busy: [] } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'event' }),
      });
    const result = await rescheduleMeeting({
      googleToken: 'token',
      calendarId: 'cal',
      eventId: 'event',
      newDate: '2024-01-01',
      newTime: '10:00:00Z',
      newEndTime: '11:00:00Z',
    });
    expect(result.status).toBe('success');
  });
});
