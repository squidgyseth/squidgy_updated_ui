# Google Calendar Integration Setup

This document explains how to set up Google Calendar integration for the Squidgy application.

## Overview

The Google Calendar integration allows the SOL Bot to:
- Automatically create calendar appointments for solar consultations
- Check real-time availability for scheduling
- Generate Google Meet links for virtual meetings
- Sync appointments with users' existing Google Calendar
- Provide callback request management as an alternative

## Prerequisites

1. A Google Cloud Platform account
2. A Google Calendar account (Gmail account)
3. Access to Google Cloud Console

## Setup Steps

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Google Calendar API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

### 3. Configure OAuth2 Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: "Squidgy Solar CRM"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Add test users (your email and any others who need access during development)

### 4. Create OAuth2 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the name: "Squidgy Calendar Integration"
5. Add authorized JavaScript origins:
   - `http://localhost:8080` (development)
   - `https://yourdomain.com` (production)
6. Add authorized redirect URIs:
   - `http://localhost:8080/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)
7. Click "Create"
8. Download the credentials JSON file

### 5. Configure Environment Variables

1. Copy the Client ID and Client Secret from your OAuth2 credentials
2. Add these to your `.env` file:

```bash
# Google Calendar Integration
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
VITE_GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
```

### 6. Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to the Calendar Setup page (Step 4 in the setup flow)
3. Click "Connect to Google Calendar"
4. Complete the OAuth flow
5. Verify the connection shows as successful

## Features

### For Solar Businesses

1. **Direct Calendar Booking**
   - Customers can book appointments directly through the chat interface
   - Real-time availability checking
   - Automatic calendar event creation
   - Google Meet link generation for virtual consultations

2. **Callback Request Management**
   - Alternative to direct booking for businesses that prefer manual scheduling
   - AI collects customer details and preferences
   - Configurable response time commitments
   - Clear messaging about manual follow-up requirements

3. **Business Hours Configuration**
   - Set availability by day of the week
   - Customize start and end times
   - Automatic conflict detection

### For SOL Bot Chat Interface

The SOL Bot can now handle scheduling-related requests:
- "Schedule a site assessment appointment"
- "Request a callback for this lead"
- "What times are available this week?"
- "Book a consultation for tomorrow"

### API Endpoints

The following endpoints are available for calendar operations:

- `POST /api/google/calendar/auth` - Exchange OAuth code for tokens
- `POST /api/google/calendar/refresh` - Refresh access token
- `GET /api/google/calendar/calendars` - List user's calendars
- `POST /api/google/calendar/events` - Create calendar event
- `PATCH /api/google/calendar/events/:eventId` - Update calendar event
- `DELETE /api/google/calendar/events/:eventId` - Delete calendar event
- `GET /api/google/calendar/availability` - Check available time slots

## Usage in Components

### Calendar Setup Page

The calendar setup page includes the Google Calendar integration component:

```tsx
import { GoogleCalendarIntegration } from '../components/GoogleCalendarIntegration';

// In your component
<GoogleCalendarIntegration 
  onIntegrationChange={setGoogleCalendarConnected}
/>
```

### Using the Hook

For programmatic calendar operations:

```tsx
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

const {
  isConnected,
  isLoading,
  createEvent,
  getAvailableSlots
} = useGoogleCalendar();

// Create an event
const result = await createEvent({
  title: 'Solar Consultation',
  description: 'Initial consultation for solar installation',
  startTime: '2024-01-15T14:00:00Z',
  endTime: '2024-01-15T15:00:00Z',
  attendeeEmail: 'customer@example.com',
  attendeeName: 'John Doe',
  includeVideoCall: true
});
```

## Security Considerations

1. **Token Storage**: Access tokens are stored in localStorage for development. For production, consider more secure storage options.

2. **Scope Limitations**: The integration only requests calendar read/write permissions, not access to other Google services.

3. **User Consent**: Users must explicitly consent to calendar access through the OAuth flow.

4. **Token Refresh**: The system automatically refreshes expired access tokens using refresh tokens.

## Troubleshooting

### Common Issues

1. **"OAuth Error: redirect_uri_mismatch"**
   - Ensure the redirect URI in your OAuth2 credentials matches exactly with your environment variables
   - Check for trailing slashes or http vs https mismatches

2. **"Calendar API has not been enabled"**
   - Make sure you've enabled the Google Calendar API in Google Cloud Console
   - Wait a few minutes after enabling for the API to become available

3. **"Access blocked: This app's request is invalid"**
   - Configure the OAuth consent screen properly
   - Add your email as a test user during development

4. **"Failed to refresh access token"**
   - The refresh token may have expired (happens after 7 days for unverified apps)
   - Re-authenticate through the OAuth flow

### Development Tips

1. Use ngrok or similar tools to test OAuth flows with HTTPS in development
2. Check browser console and network tab for detailed error messages
3. Verify environment variables are loaded correctly
4. Test with different Google accounts to ensure proper multi-user support

## Production Deployment

1. Update OAuth2 credentials with production domains
2. Configure proper CORS settings
3. Set up monitoring for OAuth token refresh failures
4. Consider implementing rate limiting for calendar operations
5. Set up proper error logging and alerting

## Future Enhancements

Potential improvements for the calendar integration:

1. **Multiple Calendar Support**: Allow users to choose which calendar to use
2. **Recurring Appointments**: Support for recurring consultation schedules
3. **Time Zone Detection**: Automatic time zone detection based on customer location
4. **Calendar Sync**: Two-way sync to handle external calendar changes
5. **Advanced Availability**: Buffer times, lunch breaks, custom availability rules
6. **Integration Analytics**: Track booking rates, popular time slots, etc.