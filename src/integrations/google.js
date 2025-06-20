// src/integrations/google.js
// Google Calendar integration for AIVELLE

export class GoogleClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://www.googleapis.com/calendar/v3';
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getCalendars() {
    return this.makeRequest('/users/me/calendarList');
  }

  async getEvents(calendarId = 'primary', maxResults = 50) {
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    
    return this.makeRequest(`/calendars/${encodeURIComponent(calendarId)}/events?` + 
      `timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`);
  }

  async createEvent(calendarId = 'primary', eventData) {
    return this.makeRequest(`/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  async getScheduleSummary(days = 7) {
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    
    const events = await this.makeRequest(`/calendars/primary/events?` + 
      `timeMin=${timeMin.toISOString()}&timeMax=${timeMax.toISOString()}&singleEvents=true&orderBy=startTime`);

    const today = new Date().toDateString();
    const todayEvents = events.items.filter(event => {
      const eventDate = new Date(event.start?.dateTime || event.start?.date).toDateString();
      return eventDate === today;
    });

    return {
      summary: {
        totalEvents: events.items.length,
        upcomingEvents: events.items.length,
        todayEvents: todayEvents.length
      },
      events: events.items
    };
  }

  async findFreeTimeSlots(durationMinutes = 60, days = 7) {
    const events = await this.getEvents('primary', 100);
    const freeSlots = [];
    
    // Working hours: 9 AM to 6 PM
    const workStart = 9;
    const workEnd = 18;
    
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      date.setHours(workStart, 0, 0, 0);
      
      const dayEnd = new Date(date);
      dayEnd.setHours(workEnd, 0, 0, 0);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Get events for this day
      const dayEvents = events.items.filter(event => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        return eventStart.toDateString() === date.toDateString();
      }).sort((a, b) => new Date(a.start?.dateTime || a.start?.date) - new Date(b.start?.dateTime || b.start?.date));
      
      let currentTime = new Date(date);
      
      for (const event of dayEvents) {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        const eventEnd = new Date(event.end?.dateTime || event.end?.date);
        
        // Check if there's a gap before this event
        const gapMinutes = (eventStart - currentTime) / (1000 * 60);
        if (gapMinutes >= durationMinutes) {
          freeSlots.push({
            date: currentTime.toDateString(),
            start: new Date(currentTime),
            end: new Date(eventStart),
            duration: gapMinutes
          });
        }
        
        currentTime = new Date(Math.max(currentTime, eventEnd));
      }
      
      // Check for time after last event
      const remainingMinutes = (dayEnd - currentTime) / (1000 * 60);
      if (remainingMinutes >= durationMinutes) {
        freeSlots.push({
          date: currentTime.toDateString(),
          start: new Date(currentTime),
          end: new Date(dayEnd),
          duration: remainingMinutes
        });
      }
    }
    
    return freeSlots.slice(0, 10); // Return top 10 slots
  }
} 