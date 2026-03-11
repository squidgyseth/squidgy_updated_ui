# Squidgy Frontend-Backend Endpoint Mapping

## Overview
This document provides a clear mapping between the new React frontend design and existing backend APIs. The frontend is a setup wizard for solar sales agents, and the backend provides comprehensive APIs for business setup and integrations.

**Backend Compatibility: Full** (28 available endpoints, 1 missing endpoint with workaround)

> **📖 Related**: See [Agent Creation Guide](agents/README.md) for creating new AI agents with Python script

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
| **FacebookConnect.tsx** | Facebook integration | Page selection, automation | ✅ Ready - simplified flow |
| **SetupComplete.tsx** | Dashboard/Completion | None (display only) | ✅ Ready |

---

## Backend Endpoint Availability

### ✅ Available Endpoints (28 total)

| Category | Endpoint | Method | Backend Line | Purpose |
|----------|----------|---------|--------------|---------|
| **Website Analysis** | `/api/website/analyze` | POST | 2759 | Analyze website with AI |
| | `/api/website/screenshot` | POST | 2848 | Capture website screenshot |
| | `/api/website/favicon` | POST | 2902 | Extract website favicon |
| | `/api/website/full-analysis` | POST | 3107 | Complete website analysis |
| | `/api/website/full-analysis-async` | POST | 2944 | Async website analysis |
| **Agent Setup** | `/api/agents/setup` | POST | 4473 | Create/update agent setup |
| | `/api/agents/setup/{user_id}` | GET | 4377 | Get user's agent setups |
| | `/api/agents/setup/{user_id}/{agent_id}` | GET | 4419 | Get specific agent setup |
| | `/api/agents/setup/{user_id}/{agent_id}` | DELETE | 4539 | Delete agent setup |
| | `/api/agents/setup/{user_id}/{agent_id}/progress` | GET | 4571 | Get setup progress |
| **Solar Tools** | `/api/solar/insights` | GET | 4274 | Get solar insights |
| | `/api/solar/data-layers` | GET | 4284 | Get solar data layers |
| | `/api/solar/report` | GET | 4294 | Generate solar reports |
| **GoHighLevel** | `/api/ghl/create-subaccount` | POST | 4681 | Create GHL subaccount |
| | `/api/ghl/create-user` | POST | 4878 | Create GHL user |
| | `/api/ghl/create-subaccount-and-user` | POST | 5124 | Create both subaccount & user |
| | `/api/ghl/contact` | POST | 4324 | Create GHL contact |
| | `/api/ghl/contact/{contact_id}` | GET | 4348 | Get GHL contact |
| **Facebook** | `/api/facebook/get-pages-simple` | POST | 6008 | Get Facebook pages |
| | `/api/facebook/connect-pages-simple` | POST | 6320 | Connect Facebook pages |
| **Business** | `/api/business/setup` | POST | 7297 | Complete business setup |
| **Authentication** | `/api/auth/reset-password` | POST | 3918 | Send password reset |
| | `/api/auth/update-password` | POST | 3970 | Update user password |
| | `/api/auth/confirm-email` | POST | 4060 | Confirm email address |
| | `/api/auth/confirm-email` | GET | 4163 | Email confirmation page |
| | `/api/auth/confirm-signup` | POST | 4032 | Confirm user signup |
| **Communication** | `/api/send-invitation-email` | POST | 3778 | Send invitation emails |
| **User Management** | `/api/user/email-status/{user_id}` | GET | 1349 | Check email confirmation |

### ❌ Missing Backend Endpoints (1 total)

**Important:** This endpoint is needed by both frontend designs but is missing from the backend.

| Endpoint | Used By | New Design Should Use? | Status | Impact |
|----------|---------|----------------------|--------|---------|
| `POST /api/agents/status` | Both frontends | ✅ Yes | ❌ Missing | **WORKAROUND** available with `POST /api/agents/setup` |

### **Functional Impact Analysis:**

#### **⚠️ Available Workaround**
- `POST /api/agents/status` → Use `POST /api/agents/setup` instead

**Result:** New frontend design has **full functionality** with available backend endpoints using workarounds.

---

## Page-to-Endpoint Mapping

### 1. WebsiteDetails.tsx
```javascript
// Primary endpoint - recommended
POST /api/website/full-analysis
{
  "url": "example.com",
  "user_id": "user123",
  "session_id": "session456"
}
```

### 2. BusinessDetails.tsx
```javascript
// Save business information
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* business data */ },
  "setup_type": "BusinessSetup"
}
```

### 3. SolarSetup.tsx
```javascript
// Save solar configuration
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* solar data */ },
  "setup_type": "SolarSetup"
}

// Get solar insights
GET /api/solar/insights?address=123+Main+St
```

### 4. CalendarSetup.tsx
```javascript
// Save calendar settings
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* calendar data */ },
  "setup_type": "CalendarSetup"
}
```

### 5. NotificationsPreferences.tsx
```javascript
// Save notification settings
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent",
  "setup_data": { /* notification data */ },
  "setup_type": "NotificationSetup"
}
```

### 6. FacebookConnect.tsx
```javascript
// Get Facebook pages (simplified)
POST /api/facebook/get-pages-simple
{
  "firm_user_id": "user123"
}

// Connect Facebook pages
POST /api/facebook/connect-pages-simple
{
  "firm_user_id": "user123",
  "selected_pages": [/* page IDs */]
}
```

### 7. SetupComplete.tsx
```javascript
// Get setup progress
GET /api/agents/setup/user123/SOLAgent/progress

// Get all user setups
GET /api/agents/setup/user123
```

---

## Implementation Strategy

### Backend Compatibility: **78% Ready**
- ✅ **28 endpoints available** - Core functionality ready
- ❌ **8 endpoints missing** - Mostly Facebook OAuth (has workarounds)
- ✅ **All critical paths supported** - Website analysis, business setup, solar tools

### Recommended Implementation Order

| Phase | Pages | Endpoints | Status |
|-------|-------|-----------|---------|
| **Phase 1** | WebsiteDetails → BusinessDetails | `POST /api/website/full-analysis`<br>`POST /api/agents/setup` | ✅ Ready |
| **Phase 2** | SolarSetup → CalendarSetup | `POST /api/agents/setup` (different setup_type)<br>`GET /api/solar/insights` | ✅ Ready |
| **Phase 3** | NotificationsPreferences → FacebookConnect | `POST /api/agents/setup`<br>`POST /api/facebook/get-pages-simple` | ⚠️ Simplified |
| **Phase 4** | SetupComplete | `GET /api/agents/setup/{user_id}/{agent_id}/progress` | ✅ Ready |

### Key Integration Patterns

#### Progressive Setup System
All setup pages use the same endpoint with different `setup_type`:
```javascript
POST /api/agents/setup
{
  "user_id": "user123",
  "agent_id": "SOLAgent", 
  "setup_type": "BusinessSetup" | "SolarSetup" | "CalendarSetup" | "NotificationSetup",
  "setup_data": { /* page-specific data */ }
}
```

#### Error Handling
```javascript
const handleApiCall = async (endpoint, data) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API Error');
    }
    
    return response.json();
  } catch (error) {
    toast.error(error.message);
    throw error;
  }
};
```

#### User Context
```javascript
// Required for all API calls
const useUser = () => {
  const [userId, setUserId] = useState(localStorage.getItem('user_id'));
  const [sessionId, setSessionId] = useState(localStorage.getItem('session_id') || generateSessionId());
  return { userId, sessionId, setUserId };
};
```

---

## Environment Configuration

```env
# Required environment variables
VITE_API_BASE_URL=https://your-backend-url.herokuapp.com
VITE_WS_URL=wss://your-backend-url.herokuapp.com
```

---

## Next Steps

1. **Create API client** (`lib/api.js`) with error handling
2. **Implement user context** for managing user_id and session_id  
3. **Add progressive data persistence** - save form data as user progresses
4. **Test each page** with backend endpoints individually
5. **Implement WebSocket** for real-time updates (optional)

---

---

## BoilerPlateV1 Endpoints Never Implemented in Backend

**Note:** The following endpoints were used by BoilerPlateV1 frontend but were never actually implemented in the backend. They are mentioned here for completeness but should not be considered for the new frontend design:

| Endpoint | Purpose | Status |
|----------|---------|---------|
| `POST /api/facebook/extract-oauth-params` | Extract OAuth parameters from GHL | Never implemented |
| `GET /api/facebook/oauth-url` | Generate Facebook OAuth URL | Never implemented |
| `GET /api/facebook/connection/{locationId}` | Check Facebook connection status | Never implemented |
| `GET /api/facebook/pages/{locationId}` | List Facebook pages for location | Never implemented |
| `POST /api/facebook/attach-pages` | Attach selected Facebook pages to GHL | Never implemented |
| `GET /api/oauth-responses` | Get OAuth response data | Never implemented |
| `GET /api/oauth-response/{id}` | Get specific OAuth response | Never implemented |

These endpoints represent **BoilerPlateV1 frontend expectations that were never fulfilled by the backend**. The new frontend design uses the available simplified Facebook endpoints instead.

---

**Note**: This mapping provides a complete integration guide. The backend supports full functionality for the new frontend design with simple workarounds where needed.
