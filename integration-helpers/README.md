# 🔌 Integration Helper Library

This library contains reusable automation scripts and setup guides for integrating external platforms with Squidgy agents.

## 📂 Structure

```
integration-helpers/
├── README.md                          # This file
├── playwright/                        # Browser automation scripts
│   ├── ghl-setup.ts                  # GoHighLevel automation
│   ├── facebook-setup.ts             # Facebook Business setup
│   ├── instagram-setup.ts            # Instagram Business setup
│   └── linkedin-setup.ts             # LinkedIn automation
├── services/                          # Reusable API wrappers
│   ├── ghlService.ts                 # GHL API wrapper
│   ├── facebookService.ts            # Facebook Graph API
│   └── linkedinService.ts            # LinkedIn API
└── guides/                            # Step-by-step setup guides
    ├── ghl-integration.md
    ├── facebook-integration.md
    ├── instagram-integration.md
    └── linkedin-integration.md
```

## 🤖 Playwright Automation Scripts

### When to Use
- Platform doesn't have a public API
- OAuth flow is complex
- Manual configuration steps required
- You want to automate repetitive browser tasks

### How to Use

1. **Install Dependencies** (if not already installed):
   ```bash
   npm install @playwright/test
   ```

2. **Run an automation script**:
   ```bash
   npx tsx integration-helpers/playwright/ghl-setup.ts
   ```

3. **Provide credentials when prompted**
   - Scripts will ask for login credentials
   - Your credentials are NOT stored
   - Scripts run locally in your browser

### Available Scripts

#### GoHighLevel (GHL) Setup
```bash
npx tsx integration-helpers/playwright/ghl-setup.ts
```
- Creates subaccount
- Configures workflows
- Sets up API access

#### Facebook Business Setup
```bash
npx tsx integration-helpers/playwright/facebook-setup.ts
```
- Connects Facebook page
- Configures posting permissions
- Sets up media library

#### Instagram Business Setup
```bash
npx tsx integration-helpers/playwright/instagram-setup.ts
```
- Links Instagram account
- Configures business profile
- Sets up media permissions

## 📚 API Service Wrappers

Reusable TypeScript services for common platforms.

### Example Usage

```typescript
import { GHLService } from './integration-helpers/services/ghlService';

const ghl = new GHLService({
  locationId: 'your-location-id',
  apiKey: 'your-api-key'
});

// Upload media
await ghl.uploadMedia(file);

// Create contact
await ghl.createContact({
  name: 'John Doe',
  email: 'john@example.com'
});
```

## 📖 Setup Guides

Step-by-step markdown guides for manual integration setup.

- **GHL Integration**: `guides/ghl-integration.md`
- **Facebook Integration**: `guides/facebook-integration.md`
- **Instagram Integration**: `guides/instagram-integration.md`
- **LinkedIn Integration**: `guides/linkedin-integration.md`

## 🔒 Security Notes

- **Never commit credentials** to version control
- Store API keys in `.env` files
- Use environment variables for sensitive data
- Playwright scripts run locally and don't store credentials

## 🛠️ Adding New Integrations

To add a new platform integration:

1. Create Playwright script in `playwright/`
2. Create API service wrapper in `services/`
3. Write setup guide in `guides/`
4. Update this README

## 📝 License

Part of Squidgy Agent Builder system.
