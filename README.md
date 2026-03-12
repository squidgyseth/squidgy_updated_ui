# Squidgy Solar Sales Agent Setup Wizard

A React-based setup wizard for solar sales agents, built on a production-ready full-stack template with integrated Express server, featuring React Router 6 SPA mode, TypeScript, Vitest, and modern tooling.

This application guides solar sales agents through a comprehensive setup process including website analysis, business details, solar configuration, calendar integration, notifications, and Facebook integration.

## Tech Stack

- **PNPM**: Prefer pnpm
- **Frontend**: React 18 + React Router 6 (spa) + TypeScript + Vite + TailwindCSS 3
- **Backend**: Express server integrated with Vite dev server
- **Testing**: Vitest
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons

## Project Structure

```
agents/                   # AI Agent configurations (see agents/README.md)
├── shared/               # Shared resources for all agents
│   ├── base_system_prompt.md  # Base prompt for all agents
│   └── agent_template.yaml    # Template for new agents
├── personal_assistant/   # Individual agent folders
│   ├── config.yaml       # Agent configuration
│   └── system_prompt.md  # Agent-specific instructions
└── [other_agents]/       # Each agent has its own folder

client/                   # React SPA frontend
├── pages/                # Setup wizard pages
│   ├── Index.tsx         # Welcome/Landing page
│   ├── WebsiteDetails.tsx # Website analysis step
│   ├── BusinessDetails.tsx # Business information collection
│   ├── SolarSetup.tsx    # Solar configuration
│   ├── CalendarSetup.tsx # Calendar integration
│   ├── NotificationsPreferences.tsx # Notification settings
│   ├── FacebookConnect.tsx # Facebook integration
│   └── SetupComplete.tsx # Completion dashboard
├── components/ui/        # Pre-built UI component library
├── data/agents.ts        # Compiled agent configs (auto-generated)
├── App.tsx              # App entry point with setup wizard routing
└── global.css           # TailwindCSS 3 theming and global styles

server/                   # Express API backend (connects to Squidgy backend)
├── index.ts              # Main server setup (express config + routes)
└── routes/               # API handlers for backend integration

shared/                   # Types used by both client & server
└── api.ts                # Shared interfaces for setup wizard

scripts/                  # Build and utility scripts
├── create-agent-from-template.py  # Agent creation and management script
└── build-agents.js       # Compile agents and sync to database

docs/                     # Project documentation
├── README.md             # Documentation index
├── AGENT_ARCHITECTURE_PLAN.md # Agent system architecture
└── n8n-agent-setup.md    # N8N workflow setup guide
```

## Key Features

### Solar Sales Agent Setup Wizard
- **Progressive Setup Flow**: 8-step wizard guiding agents through complete business setup
- **Website Analysis**: AI-powered website analysis using backend integration
- **Business Configuration**: Contact details, services, and location setup
- **Solar Tools Integration**: Solar insights, data layers, and reporting
- **Calendar Integration**: Booking and scheduling configuration
- **Notification Management**: Email, SMS, and alert preferences
- **Facebook Integration**: Simplified Facebook pages connection
- **Progress Tracking**: Real-time setup progress monitoring

### SPA Routing System

The setup wizard uses React Router 6 with a linear flow:

```typescript
import { BrowserRouter, Routes, Route } from "react-router-dom";

<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/website-details" element={<WebsiteDetails />} />
  <Route path="/business-details" element={<BusinessDetails />} />
  <Route path="/solar-setup" element={<SolarSetup />} />
  <Route path="/calendar-setup" element={<CalendarSetup />} />
  <Route path="/notifications-preferences" element={<NotificationsPreferences />} />
  <Route path="/facebook-connect" element={<FacebookConnect />} />
  <Route path="/setup-complete" element={<SetupComplete />} />
  <Route path="*" element={<NotFound />} />
</Routes>;
```

### Styling System

- **Primary**: TailwindCSS 3 utility classes
- **Theme and design tokens**: Configure in `client/global.css` 
- **UI components**: Pre-built library in `client/components/ui/`
- **Utility**: `cn()` function combines `clsx` + `tailwind-merge` for conditional classes

```typescript
// cn utility usage
className={cn(
  "base-classes",
  { "conditional-class": condition },
  props.className  // User overrides
)}
```

### Backend Integration

- **Development**: Single port (8080) for both frontend/backend
- **Hot reload**: Both client and server code
- **API endpoints**: Prefixed with `/api/` and proxy to Squidgy backend
- **Full Compatibility**: 28 available backend endpoints with 1 workaround

#### Squidgy Backend Integration
- `POST /api/website/full-analysis` - AI-powered website analysis
- `POST /api/agents/setup` - Progressive agent setup storage
- `GET /api/agents/setup/{user_id}/{agent_id}/progress` - Setup progress tracking
- `POST /api/facebook/get-pages-simple` - Facebook pages integration
- `GET /api/solar/insights` - Solar insights and reporting
- **Full endpoint mapping**: See `FRONTEND_BACKEND_ENDPOINT_MAPPING.md`  

### Shared Types
Import consistent types in both client and server:
```typescript
import { DemoResponse } from '@shared/api';
```

Path aliases:
- `@shared/*` - Shared folder
- `@/*` - Client folder

## Development Commands

```bash
pnpm dev        # Start dev server (client + server)
pnpm build      # Production build
pnpm start      # Start production server
pnpm typecheck  # TypeScript validation
pnpm test          # Run Vitest tests
```

## Documentation

### [🤖 AI Agents Guide](agents/README.md)
Complete guide for creating and managing AI agents:
- **Python agent creation script** for automated agent management
- **Agent folder structure** and required files
- **Creating new agents** step-by-step with N8N workflow generation
- **System prompt compilation** (base + agent-specific)
- **Platform and user-level enablement** logic
- **Troubleshooting** common agent issues
- **Build and deployment** process

### [🔧 Agent Creation Scripts](scripts/README.md)
Python script for agent lifecycle management:
- **Interactive wizard** for creating and editing agents
- **N8N workflow generation** with automatic credential mapping
- **Environment setup** and API key configuration

### [📋 FRONTEND_BACKEND_ENDPOINT_MAPPING.md](FRONTEND_BACKEND_ENDPOINT_MAPPING.md)
Complete integration guide between the React frontend and Squidgy backend:
- **28 available endpoints** with backend line references
- **Page-to-endpoint mapping** for each setup wizard step
- **Implementation strategy** with phased approach
- **Code examples** for each frontend page
- **Backend compatibility analysis** (Full compatibility achieved)

### [📋 FRONTEND_CODING_STANDARDS.md](FRONTEND_CODING_STANDARDS.md)  
Development standards and best practices:
- **Component architecture** patterns and organization
- **State management** with Zustand and React patterns
- **TypeScript standards** for type safety
- **API integration** patterns and error handling
- **Testing strategies** with Vitest
- **Performance optimization** guidelines

## Setup Wizard Implementation

### Adding New Setup Steps
1. Create component in `client/pages/NewStep.tsx`
2. Add route in `client/App.tsx`:
```typescript
<Route path="/new-step" element={<NewStep />} />
```
3. Integrate with backend using patterns from `FRONTEND_BACKEND_ENDPOINT_MAPPING.md`

### Backend Integration Pattern
```typescript
// Example: Save setup data
const saveSetupData = async (setupData: any) => {
  const response = await fetch('/api/agents/setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: "user123",
      agent_id: "SOLAgent",
      setup_data: setupData,
      setup_type: "YourSetupType"
    })
  });
  return response.json();
};
```

## Production Deployment

- **Standard**: `pnpm build`
- **Binary**: Self-contained executables (Linux, macOS, Windows)
- **Cloud Deployment**: Use either Netlify or Vercel via their MCP integrations for easy deployment. Both providers work well with this starter template.

## Architecture Notes

- Single-port development with Vite + Express integration
- TypeScript throughout (client, server, shared)
- Full hot reload for rapid development
- Production-ready with multiple deployment options
- Comprehensive UI component library included
- Type-safe API communication via shared interfaces


