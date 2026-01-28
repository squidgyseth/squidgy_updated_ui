// Google Calendar API Integration
interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
}

interface CalendarIntegrationData {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  calendarId: string;
  timeZone: string;
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiryDate: number | null = null;
  private calendarId: string = 'primary';
  private timeZone: string = 'America/New_York';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('google_calendar_integration');
    if (stored) {
      try {
        const data: CalendarIntegrationData = JSON.parse(stored);
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.expiryDate = data.expiryDate;
        this.calendarId = data.calendarId;
        this.timeZone = data.timeZone;
      } catch (error) {
        console.error('Error loading Google Calendar data from storage:', error);
      }
    }
  }

  private saveToStorage() {
    if (this.accessToken && this.refreshToken && this.expiryDate) {
      const data: CalendarIntegrationData = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        expiryDate: this.expiryDate,
        calendarId: this.calendarId,
        timeZone: this.timeZone
      };
      localStorage.setItem('google_calendar_integration', JSON.stringify(data));
    }
  }

  public isAuthenticated(): boolean {
    return !!(this.accessToken && this.expiryDate && Date.now() < this.expiryDate);
  }

  public getAuthUrl(): string {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async handleAuthCallback(code: string): Promise<boolean> {
    try {
      const response = await fetch('/api/google/calendar/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for tokens');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.expiryDate = Date.now() + (data.expires_in * 1000);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error handling Google auth callback:', error);
      return false;
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch('/api/google/calendar/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.expiryDate = Date.now() + (data.expires_in * 1000);
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      return false;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (this.isAuthenticated()) {
      return true;
    }

    if (this.refreshToken) {
      return await this.refreshAccessToken();
    }

    return false;
  }

  public async createEvent(eventData: {
    title: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    attendeeEmail?: string;
    attendeeName?: string;
    includeVideoCall?: boolean;
  }): Promise<{ success: boolean; eventId?: string; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Not authenticated with Google Calendar' };
    }

    const event: GoogleCalendarEvent = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime,
        timeZone: this.timeZone
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: this.timeZone
      }
    };

    if (eventData.attendeeEmail) {
      event.attendees = [{
        email: eventData.attendeeEmail,
        displayName: eventData.attendeeName
      }];
    }

    if (eventData.includeVideoCall) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?conferenceDataVersion=1`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create calendar event');
      }

      const createdEvent = await response.json();
      return { success: true, eventId: createdEvent.id };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create calendar event' 
      };
    }
  }

  public async updateEvent(eventId: string, eventData: {
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Not authenticated with Google Calendar' };
    }

    const updates: Partial<GoogleCalendarEvent> = {};
    
    if (eventData.title) updates.summary = eventData.title;
    if (eventData.description) updates.description = eventData.description;
    if (eventData.startTime) {
      updates.start = {
        dateTime: eventData.startTime,
        timeZone: this.timeZone
      };
    }
    if (eventData.endTime) {
      updates.end = {
        dateTime: eventData.endTime,
        timeZone: this.timeZone
      };
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update calendar event');
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating calendar event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update calendar event' 
      };
    }
  }

  public async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    if (!(await this.ensureValidToken())) {
      return { success: false, error: 'Not authenticated with Google Calendar' };
    }

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete calendar event');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete calendar event' 
      };
    }
  }

  public async getAvailableTimeSlots(date: string, duration: number = 60): Promise<string[]> {
    if (!(await this.ensureValidToken())) {
      return [];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${this.calendarId}/events?` +
        `timeMin=${startOfDay.toISOString()}&timeMax=${endOfDay.toISOString()}&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch calendar events');
      }

      const data = await response.json();
      const events = data.items || [];

      // Generate available time slots (simplified logic)
      const availableSlots: string[] = [];
      const currentTime = new Date(startOfDay);
      
      while (currentTime < endOfDay) {
        const slotEnd = new Date(currentTime.getTime() + (duration * 60 * 1000));
        
        // Check if this slot conflicts with any existing event
        const hasConflict = events.some((event: any) => {
          if (!event.start?.dateTime || !event.end?.dateTime) return false;
          
          const eventStart = new Date(event.start.dateTime);
          const eventEnd = new Date(event.end.dateTime);
          
          return (currentTime < eventEnd && slotEnd > eventStart);
        });

        if (!hasConflict) {
          availableSlots.push(currentTime.toISOString());
        }

        currentTime.setMinutes(currentTime.getMinutes() + 30); // 30-minute intervals
      }

      return availableSlots;
    } catch (error) {
      console.error('Error fetching available time slots:', error);
      return [];
    }
  }

  public disconnect() {
    this.accessToken = null;
    this.refreshToken = null;
    this.expiryDate = null;
    localStorage.removeItem('google_calendar_integration');
  }

  public setCalendar(calendarId: string) {
    this.calendarId = calendarId;
    this.saveToStorage();
  }

  public setTimeZone(timeZone: string) {
    this.timeZone = timeZone;
    this.saveToStorage();
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { GoogleCalendarEvent, CalendarIntegrationData };
