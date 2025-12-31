# API Documentation

## Overview

Complete API endpoint documentation for the Squidgy frontend-backend integration.

**Backend Compatibility:** Full (28+ endpoints available)

---

## Frontend Pages Overview

| Page | Purpose | Form Fields | Backend Status |
|------|---------|-------------|----------------|
| **Index.tsx** | Welcome/Landing | None (static) | ✅ Ready |
| **WebsiteDetails.tsx** | Website analysis | URL, business tags | ✅ Ready |
| **BusinessDetails.tsx** | Business info collection | Name, email, phone, address | ✅ Ready |
| **SolarSetup.tsx** | Solar configuration | Services, pricing, areas | ✅ Ready |
| **CalendarSetup.tsx** | Calendar integration | Preferences, booking settings | ✅ Ready |
| **NotificationsPreferences.tsx** | Notification settings | Email, SMS, alerts | ✅ Ready |
| **FacebookConnect.tsx** | Facebook integration | Page selection, automation | ✅ Ready |
| **SetupComplete.tsx** | Dashboard/Completion | None (display only) | ✅ Ready |

---

## Endpoint Categories

### 1. Facebook Integration (9 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/facebook/check-integration-status` | GET | Check Facebook connection status | FacebookConnect.tsx, FacebookSetup.tsx |
| `/api/facebook/extract-oauth-params` | POST | Extract OAuth params from callback | After user authorizes Facebook |
| `/api/facebook/get-pages-from-integration` | GET | Get Facebook pages list | Display pages for selection |
| `/api/facebook/connect-selected-pages` | POST | Connect selected pages | When user confirms selection |
| `/api/facebook/save-selected-pages` | POST | Save pages to database | Persist page selection |
| `/api/facebook/retry-token-capture` | POST | Retry failed token capture | Fallback for failed connections |
| `/api/facebook/connect` | POST | Initiate connection | api.ts facebookApi service |
| `/api/facebook/connection/{userId}/{agentId}` | GET | Get connection details | Check status per agent |
| `/api/facebook/get-connection-status` | GET | Get connection status | Verify connection state |

### 2. GoHighLevel Integration (3 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/ghl/get-location-id` | GET | Get GHL location ID | Facebook setup process |
| `/api/ghl/create-subaccount-and-user-registration` | POST | Create GHL subaccount + user | User registration flow |
| `/api/ghl/create-subaccount-and-user` | POST | Server-side GHL creation | Internal server endpoint |

### 3. Website Analysis (5 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/website/analyze` | POST | Analyze website with AI | Initial analysis |
| `/api/website/screenshot` | POST | Capture website screenshot | Visual preview |
| `/api/website/favicon` | POST | Extract website favicon | Brand identification |
| `/api/website/full-analysis` | POST | Complete website analysis | Comprehensive audit |
| `/api/website/full-analysis-async` | POST | Async website analysis | Background processing |

### 4. Business Details (2 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/business/details` | POST | Save business information | Business profile setup |
| `/api/business/details/{userId}/{agentId}` | GET | Get business details | Populate forms |

### 5. Solar Setup (4 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/solar/setup` | POST | Save solar configuration | Solar agent config |
| `/api/solar/setup/{userId}/{agentId}` | GET | Get solar settings | Load existing data |
| `/api/solar/insights` | GET | Get solar insights | Solar data analysis |
| `/api/solar/data-layers` | GET | Get solar data layers | Map visualization |

### 6. Calendar Integration (2 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/calendar/setup` | POST | Save calendar settings | Appointment scheduling |
| `/api/calendar/setup/{userId}/{agentId}` | GET | Get calendar config | Load settings |

### 7. Notification Preferences (2 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/notifications/preferences` | POST | Save notification settings | Notification config |
| `/api/notifications/preferences/{userId}/{agentId}` | GET | Get notification prefs | Load settings |

### 8. Agent Setup (5 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/agents/setup` | POST | Create/update agent setup | All setup pages |
| `/api/agents/setup/{user_id}` | GET | Get user's agent setups | List all setups |
| `/api/agents/setup/{user_id}/{agent_id}` | GET | Get specific setup | Load agent config |
| `/api/agents/setup/{user_id}/{agent_id}` | DELETE | Delete agent setup | Remove config |
| `/api/agents/setup/{user_id}/{agent_id}/progress` | GET | Get setup progress | Progress tracking |

### 9. Authentication (5 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/auth/reset-password` | POST | Send password reset | Password recovery |
| `/api/auth/update-password` | POST | Update user password | Password change |
| `/api/auth/confirm-email` | POST | Confirm email address | Email verification |
| `/api/auth/confirm-email` | GET | Email confirmation page | Verification UI |
| `/api/auth/confirm-signup` | POST | Confirm user signup | Registration completion |

### 10. Utility/System (2 endpoints)

| Endpoint | Method | Purpose | Usage |
|----------|--------|---------|-------|
| `/api/ping` | GET | Health check | Monitoring |
| `/api/demo` | GET | Demo endpoint | Testing |

---

## Page-to-Endpoint Mapping

### WebsiteDetails.tsx
```javascript
POST /api/website/full-analysis
{
  "url": "example.com",
  "user_id": "user123",
  "session_id": "session456"
}
```

### BusinessDetails.tsx
```javascript
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* business data */ },
  "setup_type": "BusinessSetup"
}
```

### SolarSetup.tsx
```javascript
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* solar data */ },
  "setup_type": "SolarSetup"
}
```

### CalendarSetup.tsx
```javascript
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* calendar data */ },
  "setup_type": "CalendarSetup"
}
```

### NotificationsPreferences.tsx
```javascript
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* notification data */ },
  "setup_type": "NotificationSetup"
}
```

### FacebookConnect.tsx
```javascript
POST /api/facebook/get-pages-simple
{ "firm_user_id": "user123" }

POST /api/facebook/connect-pages-simple
{ "firm_user_id": "user123", "selected_pages": [/* page IDs */] }
```

---

## External API Endpoints

### N8N Webhook Integration
- `POST https://n8n.theaiteam.uk/webhook/{webhookId}` - Workflow automation

### OpenStreetMap Nominatim API
- `GET https://nominatim.openstreetmap.org/search` - Address geocoding
- `GET https://nominatim.openstreetmap.org/reverse` - Reverse geocoding

---

## Key Files

| File | Purpose |
|------|---------|
| `client/lib/api.ts` | Main API service layer |
| `client/lib/n8nService.ts` | N8N webhook communication |
| `client/pages/FacebookConnect.tsx` | Facebook integration |
| `client/components/FacebookSetup.tsx` | Facebook setup flow |
| `client/components/chat/N8nChatInterface.tsx` | Chat interface with file upload |
| `client/lib/auth-service.ts` | Authentication services |
| `server/index.ts` | Server-side routes |

---

## Environment Configuration

```env
VITE_API_BASE_URL=https://your-backend-url.herokuapp.com
VITE_WS_URL=wss://your-backend-url.herokuapp.com
```
