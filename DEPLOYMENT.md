# Environment Variables Configuration

## Overview

This application requires specific environment variables to function correctly. **No fallback URLs are used** - all variables must be explicitly set.

## Local Development Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`:

### Required Variables for Local Development:
- `VITE_BACKEND_URL=http://localhost:8000`
- `VITE_SUPABASE_URL=your-actual-supabase-url`
- `VITE_SUPABASE_ANON_KEY=your-actual-supabase-anon-key`
- `VITE_FRONTEND_URL=http://localhost:5173`

### Optional Variables:
- `VITE_N8N_WEBHOOK_URL=your-n8n-webhook-url`

## Vercel Deployment Configuration

### Required Environment Variables for Vercel:

Set these in your Vercel project dashboard (Settings → Environment Variables):

| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_BACKEND_URL` | `https://squidgy-backend-00f664bf1f3d.herokuapp.com` | Backend API endpoint |
| `VITE_SUPABASE_URL` | `your-production-supabase-url` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `your-production-supabase-anon-key` | Supabase anonymous key |
| `VITE_FRONTEND_URL` | `https://your-vercel-app.vercel.app` | Your Vercel app URL |

### Optional Environment Variables:
| Variable | Value | Description |
|----------|-------|-------------|
| `VITE_N8N_WEBHOOK_URL` | `your-n8n-webhook-url` | N8N workflow webhook |

### How to Set Environment Variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with its corresponding value
4. Select the appropriate environments (Production, Preview, Development, Test)
5. Deploy your project

### Build Configuration for Vercel:

Vercel should automatically detect this is a Vite project. If needed, configure:

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `./client` (if your project structure requires it)

## Important Notes

- **No fallback URLs**: The application will fail if required environment variables are not set
- All `VITE_` prefixed variables are exposed to the client-side code
- Make sure to use HTTPS URLs for production environments
- Double-check that your Supabase keys match your production database

## Troubleshooting

### Common Issues:

1. **"Environment variable not found"**: Ensure all required variables are set in both Vercel and your local .env
2. **CORS errors**: Verify `VITE_BACKEND_URL` points to the correct Heroku backend
3. **Supabase connection issues**: Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
4. **Redirect issues**: Ensure `VITE_FRONTEND_URL` matches your actual deployment URL

### Verification Steps:

1. Check Vercel deployment logs for missing environment variables
2. Test API connectivity from browser console
3. Verify Supabase connection in browser network tab
4. Confirm all URLs are accessible and use HTTPS in production