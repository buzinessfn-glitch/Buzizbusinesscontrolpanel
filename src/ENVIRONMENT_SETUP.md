# 🔧 Environment Setup Guide

## Overview

Buziz uses environment variables for configuration. This guide explains how to set them up for development and production.

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Client ID | `AVPznqSR...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_URL` | Your app URL (for redirects) | `http://localhost:5173` |

## Setup Instructions

### 1. Local Development

**Step 1: Copy the example file**
```bash
cp .env.example .env.local
```

**Step 2: Fill in your values**
```env
# .env.local
VITE_SUPABASE_URL=https://bgfksampyaqzqplpkiln.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_PAYPAL_CLIENT_ID=AVPznqSR4j_y8O-P6Bgvf302qw7Wob5mRUCT0lB2NTf_hStwDWdS-Dfr4N5kUcC5zGNtXQFG-P6shYxn
```

**Step 3: Restart dev server**
```bash
npm run dev
```

### 2. Vercel Deployment

**Option A: Via Vercel Dashboard**

1. Go to your project in Vercel
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Environment: Production, Preview, Development
4. Click **Save**
5. Redeploy your application

**Option B: Via Vercel CLI**

```bash
vercel env add VITE_SUPABASE_URL
# Enter value when prompted
# Select environments: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_PAYPAL_CLIENT_ID
```

**Option C: Via vercel.json**

Create a `vercel.json` file (⚠️ Don't commit sensitive values):

```json
{
  "env": {
    "VITE_SUPABASE_URL": "https://your-project.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "VITE_PAYPAL_CLIENT_ID": "@paypal-client-id"
  }
}
```

Then add secrets via CLI:
```bash
vercel secrets add supabase-anon-key "your-key"
vercel secrets add paypal-client-id "your-client-id"
```

## Current Setup

### Supabase Credentials

Your Supabase credentials are currently **hardcoded** in `/utils/supabase/info.tsx`:

```typescript
export const projectId = "bgfksampyaqzqplpkiln"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**This works fine for development!** The app will use these values if environment variables are not set.

### PayPal Credentials

PayPal Client ID has a **fallback** in `/components/payment/PaymentCheckout.tsx`:

```typescript
const PAYPAL_CLIENT_ID = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYPAL_CLIENT_ID) 
  || 'AVPznqSR4j_y8O-P6Bgvf302qw7Wob5mRUCT0lB2NTf_hStwDWdS-Dfr4N5kUcC5zGNtXQFG-P6shYxn';
```

**For production**, you should:
1. Set `VITE_PAYPAL_CLIENT_ID` in Vercel
2. Remove the hardcoded fallback (or keep it for development)

## Security Best Practices

### ✅ Safe to Commit (Public)
- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_ANON_KEY` - Public key (has RLS protection)
- `VITE_PAYPAL_CLIENT_ID` - Public client ID

### ❌ NEVER Commit (Private)
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access
- `PAYPAL_SECRET` - Payment processing secret
- Any API keys with write access

### Gitignore Configuration

Make sure your `.gitignore` includes:
```
# Environment variables
.env
.env.local
.env.production
.env.development

# Vercel
.vercel
```

## Accessing Environment Variables in Code

### In React Components (Client-Side)

```typescript
// ✅ Correct way
const apiUrl = import.meta.env.VITE_SUPABASE_URL;

// ✅ With fallback
const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'default-value';

// ✅ Safe access (prevents errors)
const value = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_VARIABLE) || 'fallback';
```

### In Supabase Edge Functions (Server-Side)

```typescript
// Edge functions use Deno.env
const secret = Deno.env.get('PAYPAL_SECRET');
const url = Deno.env.get('SUPABASE_URL');
```

## Troubleshooting

### Error: "Cannot read properties of undefined"

**Cause**: Environment variable access before Vite initialized

**Fix**: Use safe access pattern:
```typescript
const value = (typeof import.meta !== 'undefined' && import.meta.env?.VARIABLE) || 'fallback';
```

### Error: "Environment variable not found"

**Cause**: Variable not set or app not restarted

**Fix**:
1. Verify variable is in `.env.local`
2. Restart dev server: `npm run dev`
3. Check variable name has `VITE_` prefix

### PayPal Not Loading

**Cause**: Missing or invalid Client ID

**Fix**:
1. Check `VITE_PAYPAL_CLIENT_ID` is set
2. Verify Client ID is correct
3. Check browser console for errors

### Supabase Connection Failed

**Cause**: Invalid URL or key

**Fix**:
1. Verify URL format: `https://project.supabase.co`
2. Check key starts with `eyJhbGci...`
3. Ensure project is not paused in Supabase dashboard

## Environment-Specific Configuration

### Development
```env
VITE_SUPABASE_URL=https://localhost:54321
VITE_APP_URL=http://localhost:5173
```

### Staging
```env
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_APP_URL=https://staging.yourdomain.com
```

### Production
```env
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_APP_URL=https://yourdomain.com
VITE_PAYPAL_CLIENT_ID=your-production-client-id
```

## Migration Guide: Hardcoded to Environment Variables

If you want to move all credentials to environment variables:

### 1. Update `/utils/supabase/info.tsx`

**Before:**
```typescript
export const projectId = "bgfksampyaqzqplpkiln"
export const publicAnonKey = "eyJhbGci..."
```

**After:**
```typescript
export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID 
  || "bgfksampyaqzqplpkiln"
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY 
  || "eyJhbGci..."
```

### 2. Add to `.env.local`

```env
VITE_SUPABASE_PROJECT_ID=bgfksampyaqzqplpkiln
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Update Vercel environment variables

Add the new variables in Vercel dashboard.

## Verification

### Check Variables Are Loaded

Add this temporarily to `App.tsx`:

```typescript
console.log('Environment check:', {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
  paypalId: import.meta.env.VITE_PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing',
});
```

Check browser console after app loads.

## Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/cli/config)
- [PayPal Sandbox Testing](https://developer.paypal.com/tools/sandbox/)

## Support

If you encounter issues with environment variables:

1. Check this guide first
2. Verify `.env.local` exists and has correct format
3. Restart development server
4. Check browser console for errors
5. Review Vercel deployment logs (for production issues)

---

**Remember**: Environment variables starting with `VITE_` are exposed to the client-side code. Never store sensitive secrets in them!
