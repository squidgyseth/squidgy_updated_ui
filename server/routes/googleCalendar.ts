import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

// Google OAuth2 client configuration
const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/google/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

// Exchange authorization code for tokens
router.post('/auth', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return res.status(400).json({ error: 'Failed to obtain access token' });
    }

    // Return tokens to frontend (in production, store securely)
    res.json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : 3600,
      token_type: 'Bearer'
    });

  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ 
      error: 'Failed to exchange authorization code',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      return res.status(400).json({ error: 'Failed to refresh access token' });
    }

    res.json({
      access_token: credentials.access_token,
      expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
      token_type: 'Bearer'
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ 
      error: 'Failed to refresh access token',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's calendar list
router.get('/calendars', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.split(' ')[1];
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const response = await calendar.calendarList.list();

    const calendars = response.data.items?.map(cal => ({
      id: cal.id,
      summary: cal.summary,
      description: cal.description,
      timeZone: cal.timeZone,
      primary: cal.primary,
      accessRole: cal.accessRole
    })) || [];

    res.json({ calendars });

  } catch (error) {
    console.error('Calendar list error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch calendars',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create a calendar event
router.post('/events', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.split(' ')[1];
    const {
      calendarId = 'primary',
      summary,
      description,
      startTime,
      endTime,
      timeZone = 'America/New_York',
      attendees = [],
      includeVideoCall = false
    } = req.body;

    if (!summary || !startTime || !endTime) {
      return res.status(400).json({ error: 'Summary, start time, and end time are required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event: any = {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone
      },
      end: {
        dateTime: endTime,
        timeZone
      },
      attendees: attendees.map((attendee: any) => ({
        email: attendee.email,
        displayName: attendee.name
      }))
    };

    if (includeVideoCall) {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      };
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: includeVideoCall ? 1 : 0,
      sendUpdates: 'all'
    });

    res.json({
      success: true,
      eventId: response.data.id,
      htmlLink: response.data.htmlLink,
      meetingLink: response.data.conferenceData?.entryPoints?.[0]?.uri
    });

  } catch (error) {
    console.error('Event creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update a calendar event
router.patch('/events/:eventId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.split(' ')[1];
    const { eventId } = req.params;
    const {
      calendarId = 'primary',
      summary,
      description,
      startTime,
      endTime,
      timeZone = 'America/New_York'
    } = req.body;

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const updates: any = {};
    if (summary) updates.summary = summary;
    if (description) updates.description = description;
    if (startTime) {
      updates.start = {
        dateTime: startTime,
        timeZone
      };
    }
    if (endTime) {
      updates.end = {
        dateTime: endTime,
        timeZone
      };
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updates,
      sendUpdates: 'all'
    });

    res.json({
      success: true,
      eventId: response.data.id
    });

  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ 
      error: 'Failed to update calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete a calendar event
router.delete('/events/:eventId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.split(' ')[1];
    const { eventId } = req.params;
    const { calendarId = 'primary' } = req.query;

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: calendarId as string,
      eventId,
      sendUpdates: 'all'
    });

    res.json({ success: true });

  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ 
      error: 'Failed to delete calendar event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get available time slots
router.get('/availability', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const accessToken = authHeader.split(' ')[1];
    const { 
      calendarId = 'primary',
      date,
      duration = '60',
      timeZone = 'America/New_York'
    } = req.query;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events for the specified date
    const startOfDay = new Date(date as string);
    startOfDay.setHours(9, 0, 0, 0); // 9 AM
    const endOfDay = new Date(date as string);
    endOfDay.setHours(17, 0, 0, 0); // 5 PM

    const response = await calendar.events.list({
      calendarId: calendarId as string,
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items || [];
    const durationMinutes = parseInt(duration as string);

    // Generate available time slots
    const availableSlots: string[] = [];
    const currentTime = new Date(startOfDay);
    
    while (currentTime < endOfDay) {
      const slotEnd = new Date(currentTime.getTime() + (durationMinutes * 60 * 1000));
      
      // Check if this slot conflicts with any existing event
      const hasConflict = events.some((event: any) => {
        if (!event.start?.dateTime || !event.end?.dateTime) return false;
        
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);
        
        return (currentTime < eventEnd && slotEnd > eventStart);
      });

      if (!hasConflict && slotEnd <= endOfDay) {
        availableSlots.push(currentTime.toISOString());
      }

      currentTime.setMinutes(currentTime.getMinutes() + 30); // 30-minute intervals
    }

    res.json({ availableSlots });

  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ 
      error: 'Failed to check availability',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;