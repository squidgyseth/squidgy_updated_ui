# COMPREHENSIVE BACKEND ENDPOINT ANALYSIS

## **1. FACEBOOK INTEGRATION ENDPOINTS**

**`GET /api/facebook/check-integration-status`**
- **Purpose**: Checks current Facebook integration connection status and validates existing tokens
- **Usage**: Used in FacebookConnect.tsx:84 and FacebookSetup.tsx:88,374 to verify if Facebook is properly connected

**`POST /api/facebook/extract-oauth-params`** 
- **Purpose**: Extracts OAuth parameters from Facebook authorization callback to complete connection setup
- **Usage**: Called in FacebookConnect.tsx:117 and FacebookSetup.tsx:136,403 after user authorizes Facebook app

**`GET /api/facebook/get-pages-from-integration`**
- **Purpose**: Retrieves list of Facebook pages associated with the connected Facebook account
- **Usage**: Used in FacebookConnect.tsx:183 and FacebookSetup.tsx:233 to display available pages for selection

**`POST /api/facebook/connect-selected-pages`**
- **Purpose**: Connects and saves selected Facebook pages to user's account for lead management
- **Usage**: Called in FacebookConnect.tsx:244 when user confirms page selection

**`POST /api/facebook/save-selected-pages`**
- **Purpose**: Saves user's selected Facebook pages to database for future lead capture
- **Usage**: Used in FacebookSetup.tsx:280 to persist page selection

**`POST /api/facebook/retry-token-capture`**
- **Purpose**: Retries Facebook token capture process when initial connection fails
- **Usage**: Called in FacebookConnect.tsx:297 as fallback mechanism for failed connections

**`POST /api/facebook/connect`** 
- **Purpose**: Initiates Facebook connection process with user credentials and page data
- **Usage**: Used in api.ts:682 as part of facebookApi service layer

**`GET /api/facebook/connection/{userId}/{agentId}`**
- **Purpose**: Retrieves specific Facebook connection details for user and agent combination
- **Usage**: Used in api.ts:686 for checking connection status per agent

**`GET /api/facebook/get-connection-status`**
- **Purpose**: Gets current Facebook connection status using firm_user_id parameter
- **Usage**: Called in api.ts:691 to verify connection state

## **2. GHL (GOHIGHLEVEL) INTEGRATION ENDPOINTS**

**`GET /api/ghl/get-location-id`**
- **Purpose**: Retrieves GHL location ID for the current user to enable CRM integration
- **Usage**: Called in FacebookConnect.tsx:97 and FacebookSetup.tsx:385 during Facebook setup process

**`POST /api/ghl/create-subaccount-and-user-registration`**
- **Purpose**: Creates GHL subaccount and registers user in GoHighLevel CRM system
- **Usage**: Used in auth-service.ts:178 during user registration flow

**`POST /api/ghl/create-subaccount-and-user`**
- **Purpose**: Server-side endpoint for creating GHL subaccount and user (server/index.ts)
- **Usage**: Internal server endpoint for GHL account creation

## **3. WEBSITE ANALYSIS ENDPOINTS**

**`POST /api/website/full-analysis`**
- **Purpose**: Performs comprehensive website analysis including SEO, performance, and content evaluation
- **Usage**: Called in api.ts:130 and ChatInterface.tsx:92 for complete website audit

**`POST /api/website/screenshot`**
- **Purpose**: Captures screenshot of provided website URL for visual analysis
- **Usage**: Used in api.ts:148 to generate website previews

**`POST /api/website/favicon`**
- **Purpose**: Extracts and processes website favicon for brand identification
- **Usage**: Called in api.ts:152 for website branding analysis

## **4. BUSINESS DETAILS ENDPOINTS**

**`POST /api/business/details`**
- **Purpose**: Saves business information including name, email, and operational details
- **Usage**: Used in api.ts:196 during business profile setup

**`GET /api/business/details/{userId}/{agentId}`**
- **Purpose**: Retrieves stored business details for specific user and agent
- **Usage**: Called in api.ts:200 to populate business information forms

## **5. SOLAR SETUP ENDPOINTS**

**`POST /api/solar/setup`**
- **Purpose**: Configures solar-specific settings including incentives and pricing parameters
- **Usage**: Used in api.ts:211 for solar industry agent configuration

**`GET /api/solar/setup/{userId}/{agentId}`**
- **Purpose**: Retrieves solar configuration settings for specific agent instance
- **Usage**: Called in api.ts:215 to load existing solar setup data

## **6. CALENDAR INTEGRATION ENDPOINTS**

**`POST /api/calendar/setup`**
- **Purpose**: Configures calendar integration with business hours and availability settings
- **Usage**: Used in api.ts:226 for appointment scheduling setup

**`GET /api/calendar/setup/{userId}/{agentId}`**
- **Purpose**: Retrieves calendar configuration and business hours for specific agent
- **Usage**: Called in api.ts:230 to load calendar settings

## **7. NOTIFICATION PREFERENCES ENDPOINTS**

**`POST /api/notifications/preferences`**
- **Purpose**: Saves user notification preferences including email and GHL integration settings
- **Usage**: Used in api.ts:241 for notification configuration

**`GET /api/notifications/preferences/{userId}/{agentId}`**
- **Purpose**: Retrieves notification preferences for specific user and agent combination
- **Usage**: Called in api.ts:245 to load notification settings

## **8. UTILITY/SYSTEM ENDPOINTS**

**`GET /api/ping`**
- **Purpose**: Health check endpoint to verify backend service availability
- **Usage**: Server endpoint (index.ts:17) for monitoring and status checks

**`GET /api/demo`**
- **Purpose**: Demo endpoint for testing API connectivity and response handling
- **Usage**: Server endpoint (index.ts:22) for development and testing

## **SUMMARY**

**Total Endpoints Found: 21**

**Categories:**
- **Facebook Integration**: 9 endpoints
- **GHL Integration**: 3 endpoints  
- **Website Analysis**: 3 endpoints
- **Business Details**: 2 endpoints
- **Solar Setup**: 2 endpoints
- **Calendar Integration**: 2 endpoints
- **Notification Preferences**: 2 endpoints
- **Utility/System**: 2 endpoints

**Key Files Analyzed:**
- `client/lib/api.ts` - Main API service layer
- `client/pages/FacebookConnect.tsx` - Facebook integration
- `client/components/FacebookSetup.tsx` - Facebook setup flow
- `client/lib/auth-service.ts` - Authentication services
- `server/index.ts` - Server-side routes
- `client/components/ChatInterface.tsx` - Website analysis endpoint
- `client/lib/n8nService.ts` - N8N webhook calls
- `client/components/AddressAutocomplete.tsx` - External API calls

## **EXTERNAL API ENDPOINTS**

**N8N Webhook Integration**
- **`POST https://n8n.theaiteam.uk/webhook/{webhookId}`** - N8N workflow automation
- **Usage**: Used in n8nService.ts:112 for workflow triggers

**OpenStreetMap Nominatim API**
- **`GET https://nominatim.openstreetmap.org/search`** - Address geocoding
- **`GET https://nominatim.openstreetmap.org/reverse`** - Reverse geocoding
- **Usage**: Used in AddressAutocomplete.tsx:105,157 for location services

**Builder.io CDN**
- **Various image asset URLs** - Static image hosting
- **Usage**: Used across multiple components for UI assets

All endpoints are properly documented with their specific purpose and usage context within the frontend application.