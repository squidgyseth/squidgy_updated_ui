# Frontend Environment Configuration Migration

**Date:** 2026-03-10
**Status:** 🟡 IN PROGRESS

---

## 📋 Overview

Created a centralized environment configuration module (`client/lib/envConfig.ts`) that mirrors the Backend's `env_config.py` pattern. This ensures the Frontend dynamically selects the correct environment-specific variables based on the current environment (DEV/STAGING/PROD).

---

## ✅ What Was Created

### **1. New File: `client/lib/envConfig.ts`**

A centralized configuration module with the following functions:

#### **`getEnvironment()`: Environment Detection**
```typescript
Returns: 'production' | 'staging' | 'dev'

Detection logic:
1. Check VITE_APP_ENV environment variable
2. Check window.location.hostname
   - app.squidgy.ai → production
   - staging.squidgy.ai → staging
   - dev.squidgy.ai → dev
3. Default to 'dev' for localhost
```

#### **`getSupabaseConfig()`: Supabase Configuration**
```typescript
Returns: {
  url: string,
  anonKey: string,
  schema: string
}

// Environment-specific URLs:
// DEV: VITE_DEV_SUPABASE_URL
// STAGING: VITE_STAGING_SUPABASE_URL
// PROD: VITE_SUPABASE_URL
```

#### **`getBackendUrl()`: Backend API URL**
```typescript
Returns: string

// Environment-specific URLs:
// DEV: https://dev-squidgy-backend.onrender.com
// STAGING: https://staging-squidgy-backend.onrender.com
// PROD: https://prod-squidgy-backend.onrender.com
```

#### **`getFrontendUrl()`: Frontend URL**
```typescript
Returns: string

// Environment-specific URLs:
// DEV: https://dev.squidgy.ai
// STAGING: https://staging.squidgy.ai
// PROD: https://app.squidgy.ai
```

#### **`getAutomationServiceUrl()`: Automation Service URL**
```typescript
Returns: string

// Environment-specific URLs:
// DEV: AUTOMATION_DEV_SERVICE_URL
// STAGING: AUTOMATION_STAGING_SERVICE_URL
// PROD: AUTOMATION_PROD_SERVICE_URL
```

#### **`getNeonConfig()`: Neon Database Configuration**
```typescript
Returns: {
  apiUrl: string,
  apiKey: string,
  host: string,
  port: string,
  user: string,
  password: string,
  database: string,
  schema: string  // 'dev_public' | 'staging_public' | 'public'
}
```

#### **`printEnvironmentInfo()`: Debug Helper**
```typescript
// Use in browser console for debugging
console.log(printEnvironmentInfo());
```

---

## ✅ Files Updated (Completed)

### **Core Library Files**
- [x] **`client/lib/supabase.ts`**
  - Changed: `import.meta.env.VITE_SUPABASE_URL` → `getSupabaseConfig().url`
  - Changed: `import.meta.env.VITE_SUPABASE_ANON_KEY` → `getSupabaseConfig().anonKey`

- [x] **`client/lib/api.ts`**
  - Changed: `const BACKEND_URL = import.meta.env.VITE_BACKEND_URL` → `const BACKEND_URL = getBackendUrl()`

- [x] **`client/lib/auth-service.ts`**
  - Replaced all direct environment variable accesses:
    - `import.meta.env.VITE_SUPABASE_URL` → `getSupabaseConfig().url`
    - `import.meta.env.VITE_SUPABASE_ANON_KEY` → `getSupabaseConfig().anonKey`
    - `import.meta.env.VITE_BACKEND_URL` → `getBackendUrl()`
    - `import.meta.env.VITE_FRONTEND_URL` → `getFrontendUrl()`

- [x] **`client/lib/templates-api.ts`**
  - Changed: `const BACKEND_URL = import.meta.env.VITE_BACKEND_URL` → `const BACKEND_URL = getBackendUrl()`

- [x] **`client/lib/notifications-api.ts`**
  - Changed: `const BACKEND_URL = import.meta.env.VITE_BACKEND_URL` → `const BACKEND_URL = getBackendUrl()`

### **Page Files**
- [x] **`client/pages/Login.tsx`**
  - Changed: `emailRedirectTo: \`${import.meta.env.VITE_FRONTEND_URL}/login\`` → `emailRedirectTo: \`${getFrontendUrl()}/login\``

---

## 🟡 Files Remaining to Update

### **Component Files**
- [ ] `components/FacebookSetup.tsx`
- [ ] `components/ProtectedRoute.tsx`
- [ ] `components/chat/N8nChatInterface.tsx`

### **Library Files**
- [ ] `lib/supabase-api.ts`
- [ ] `lib/test-email-check.ts`

### **Page Files**
- [ ] `pages/AgentSettings.tsx`
- [ ] `pages/BusinessDetails.tsx`
- [ ] `pages/FacebookConnect.tsx`
- [ ] `pages/FacebookOAuthTest.tsx`
- [ ] `pages/IntegrationsSettings.tsx`
- [ ] `pages/admin/AdminAnalytics.tsx`
- [ ] `pages/admin/AdminUsers.tsx`

### **Service Files**
- [ ] `services/fileUploadService.ts`
- [ ] `services/scheduledPostsService.ts`
- [ ] `services/supabaseQueryService.ts`

---

## 🔧 How to Update Remaining Files

### **Step 1: Add Import**
```typescript
import { getSupabaseConfig, getBackendUrl, getFrontendUrl } from '@/lib/envConfig';
```

### **Step 2: Replace Direct Env Access**

**For Supabase URL:**
```typescript
// Before:
const url = import.meta.env.VITE_SUPABASE_URL;

// After:
const url = getSupabaseConfig().url;
```

**For Supabase Anon Key:**
```typescript
// Before:
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// After:
const key = getSupabaseConfig().anonKey;
```

**For Backend URL:**
```typescript
// Before:
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// After:
const backendUrl = getBackendUrl();
```

**For Frontend URL:**
```typescript
// Before:
const frontendUrl = import.meta.env.VITE_FRONTEND_URL;

// After:
const frontendUrl = getFrontendUrl();
```

---

## 🚀 Bulk Update Command

To update all remaining files at once, run:

```bash
cd /Users/somasekharaddakula/CascadeProjects/UI_SquidgyFrontend_Updated/client

# Add import to all files that need it
# Then replace all occurrences

# For VITE_BACKEND_URL:
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/import\.meta\.env\.VITE_BACKEND_URL/getBackendUrl()/g' {} +

# For VITE_SUPABASE_URL:
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/import\.meta\.env\.VITE_SUPABASE_URL/getSupabaseConfig().url/g' {} +

# For VITE_SUPABASE_ANON_KEY:
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/import\.meta\.env\.VITE_SUPABASE_ANON_KEY/getSupabaseConfig().anonKey/g' {} +

# For VITE_FRONTEND_URL:
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/import\.meta\.env\.VITE_FRONTEND_URL/getFrontendUrl()/g' {} +
```

**⚠️ Important:** After running bulk updates, manually add the import statement to each file:
```typescript
import { getSupabaseConfig, getBackendUrl, getFrontendUrl } from '@/lib/envConfig';
```

---

## 🧪 Testing the Configuration

### **1. Browser Console Test**
```typescript
import { printEnvironmentInfo } from '@/lib/envConfig';
console.log(printEnvironmentInfo());
```

### **2. Verify Environment Detection**
- **Local Development (localhost):** Should detect as `dev`
- **dev.squidgy.ai:** Should detect as `dev`
- **staging.squidgy.ai:** Should detect as `staging`
- **app.squidgy.ai:** Should detect as `production`

### **3. Check Supabase Connection**
The correct Supabase instance should be used automatically based on environment.

---

## 🎯 Benefits

1. **Centralized Configuration:** All environment logic in one place
2. **Type Safety:** TypeScript interfaces for all config objects
3. **Automatic Detection:** No manual switching required
4. **Mirrors Backend:** Same pattern as Backend `env_config.py`
5. **Easy Debugging:** `printEnvironmentInfo()` helper for troubleshooting
6. **Environment Isolation:** Complete separation between DEV/STAGING/PROD

---

## 📊 Migration Progress

**Total Files:** 23
**Updated:** 7 (30%)
**Remaining:** 16 (70%)

---

## 🔄 Next Steps

1. Update remaining 16 files to use `envConfig.ts` functions
2. Remove all direct `import.meta.env.VITE_*` accesses
3. Test in all three environments (DEV, STAGING, PROD)
4. Verify Supabase, Backend, and Frontend URLs are correct per environment
5. Update Vercel environment variables to match the new structure

---

## 📝 Notes

- Non-environment-specific variables (like `VITE_N8N_WEBHOOK_URL`) can remain as direct imports
- Only update variables that have environment-specific versions (DEV/STAGING/PROD)
- The `envConfig.ts` file is already complete and ready to use
- Pattern matches Backend's `env_config.py` for consistency

---

**Status:** Ready for bulk update or manual file-by-file migration
**Recommendation:** Use bulk command first, then manually add imports and verify
