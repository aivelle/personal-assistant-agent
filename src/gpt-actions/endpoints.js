// src/gpt-actions/endpoints.js
// GPT Actions endpoints for ChatGPT integration

import { SessionManager } from '../utils/session.js';
import { GoogleClient } from '../integrations/google.js';

export async function handleGPTAction(request, env, pathname) {
  // Extract user authentication from request
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({
      error: 'Authentication required',
      message: 'Please provide a valid session token'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sessionId = authHeader.substring(7);
  const sessionManager = new SessionManager(env.USERS_KV);
  const session = await sessionManager.getSession(sessionId);

  if (!session) {
    return new Response(JSON.stringify({
      error: 'Invalid session',
      message: 'Session expired or invalid'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Route to specific GPT action
    if (pathname === '/gpt/calendar/events') {
      return await getCalendarEvents(request, session);
    }
    
    if (pathname === '/gpt/calendar/free-time') {
      return await findFreeTime(request, session);
    }
    
    if (pathname === '/gpt/calendar/schedule') {
      return await scheduleEvent(request, session);
    }
    
    if (pathname === '/gpt/schedule/analyze') {
      return await analyzeSchedule(request, session);
    }

    return new Response(JSON.stringify({
      error: 'Endpoint not found',
      available_endpoints: [
        '/gpt/calendar/events',
        '/gpt/calendar/free-time', 
        '/gpt/calendar/schedule',
        '/gpt/schedule/analyze'
      ]
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('GPT Action error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Get calendar events
async function getCalendarEvents(request, session) {
  if (session.provider !== 'google' || !session.tokens?.access_token) {
    return new Response(JSON.stringify({
      error: 'Google Calendar not connected',
      message: 'Please connect your Google account first'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const days = parseInt(url.searchParams.get('days') || '7');

  const googleClient = new GoogleClient(session.tokens.access_token);
  const scheduleData = await googleClient.getScheduleSummary(days);

  const response = {
    user: session.name,
    timeframe: `Next ${days} days`,
    summary: scheduleData.summary,
    events: scheduleData.events.map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      calendar: event.calendarName
    }))
  };

  return new Response(JSON.stringify(response), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Find free time slots
async function findFreeTime(request, session) {
  if (session.provider !== 'google' || !session.tokens?.access_token) {
    return new Response(JSON.stringify({
      error: 'Google Calendar not connected'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const url = new URL(request.url);
  const duration = parseInt(url.searchParams.get('duration') || '60'); // minutes
  const days = parseInt(url.searchParams.get('days') || '7');

  const googleClient = new GoogleClient(session.tokens.access_token);
  const freeSlots = await googleClient.findFreeTimeSlots(duration, days);

  return new Response(JSON.stringify({
    user: session.name,
    requested_duration: `${duration} minutes`,
    timeframe: `Next ${days} days`,
    free_slots: freeSlots.map(slot => ({
      date: slot.date,
      start: slot.start.toISOString(),
      end: slot.end.toISOString(),
      duration_minutes: slot.duration
    }))
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Schedule a new event
async function scheduleEvent(request, session) {
  if (session.provider !== 'google' || !session.tokens?.access_token) {
    return new Response(JSON.stringify({
      error: 'Google Calendar not connected'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const eventData = await request.json();
  const googleClient = new GoogleClient(session.tokens.access_token);

  // Create event object
  const event = {
    summary: eventData.title || eventData.summary,
    description: eventData.description,
    start: {
      dateTime: eventData.start,
      timeZone: eventData.timeZone || 'America/New_York'
    },
    end: {
      dateTime: eventData.end,
      timeZone: eventData.timeZone || 'America/New_York'
    }
  };

  if (eventData.attendees) {
    event.attendees = eventData.attendees.map(email => ({ email }));
  }

  const createdEvent = await googleClient.createEvent('primary', event);

  return new Response(JSON.stringify({
    success: true,
    event: {
      id: createdEvent.id,
      title: createdEvent.summary,
      start: createdEvent.start.dateTime,
      end: createdEvent.end.dateTime,
      calendar_link: createdEvent.htmlLink
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Analyze schedule patterns
async function analyzeSchedule(request, session) {
  if (session.provider !== 'google' || !session.tokens?.access_token) {
    return new Response(JSON.stringify({
      error: 'Google Calendar not connected'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const googleClient = new GoogleClient(session.tokens.access_token);
  const scheduleData = await googleClient.getScheduleSummary(14); // 2 weeks

  // Analyze patterns
  const analysis = {
    total_events: scheduleData.events.length,
    daily_average: Math.round(scheduleData.events.length / 14 * 10) / 10,
    busiest_days: [],
    suggestions: []
  };

  // Group events by day
  const eventsByDay = {};
  scheduleData.events.forEach(event => {
    const date = new Date(event.start?.dateTime || event.start?.date).toDateString();
    if (!eventsByDay[date]) eventsByDay[date] = [];
    eventsByDay[date].push(event);
  });

  // Find busiest days
  analysis.busiest_days = Object.entries(eventsByDay)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3)
    .map(([date, events]) => ({
      date,
      event_count: events.length
    }));

  // Generate suggestions
  if (analysis.daily_average > 5) {
    analysis.suggestions.push("Consider blocking focus time - you have many meetings");
  }
  
  if (analysis.busiest_days[0]?.event_count > 6) {
    analysis.suggestions.push("Try to spread meetings more evenly across the week");
  }

  return new Response(JSON.stringify({
    user: session.name,
    analysis_period: '14 days',
    analysis
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 