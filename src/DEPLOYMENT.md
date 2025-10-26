# Buziz - Deployment & Setup Guide

## 🚀 Vercel Deployment

### Prerequisites
1. GitHub/GitLab account
2. Vercel account (free tier works)
3. Supabase project

### Steps to Deploy

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to vercel.com
   - Click "Import Project"
   - Connect your GitHub/GitLab repository
   - Select the Buziz repository
   - Configure:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. **Environment Variables in Vercel**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Your app will be live at `your-project.vercel.app`

## 🗄️ Supabase Setup

### Database Tables

You DON'T need to create additional tables. The app uses:
- **Built-in `kv_store_a9845035` table** (already exists)
- **localStorage fallback** (automatic)

### Storage Buckets

**NOT REQUIRED** for current functionality. All data is stored in:
1. Supabase KV store (via `/supabase/functions/server/kv_store.tsx`)
2. localStorage (automatic fallback)

If you want to add file uploads later:
```sql
-- Create bucket (run in Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public) VALUES ('buziz-files', 'buziz-files', false);
```

### Authentication Setup

Already configured! Uses Supabase Auth with email/password.

#### Optional: Social Login (Google, GitHub, etc.)

To enable Google OAuth:
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google
3. Add OAuth credentials from Google Cloud Console
4. Follow: https://supabase.com/docs/guides/auth/social-login/auth-google

## 💳 PayPal Recurring Payments Setup

### Current Implementation
- **One-time payments only** (implemented)
- Payment stored in localStorage
- Manual subscription tracking

### To Enable Recurring Payments

You need PayPal **Subscription/Billing Plans**:

#### 1. Create Subscription Plans in PayPal Dashboard

1. Go to: https://developer.paypal.com/dashboard/
2. Navigate to: **Products & Services** → **Subscriptions**
3. Create 3 plans:
   - **Starter Plan**: $9/month
   - **Professional Plan**: $29/month  
   - **Enterprise Plan**: $99/month

4. Copy each Plan ID (e.g., `P-XXXX123456789`)

#### 2. Update PaymentCheckout.tsx

Replace the current implementation with subscription buttons:

```typescript
// In PaymentCheckout.tsx
const PLAN_IDS = {
  starter: 'P-STARTER-PLAN-ID',
  professional: 'P-PRO-PLAN-ID',
  enterprise: 'P-ENTERPRISE-PLAN-ID'
};

window.paypal.Buttons({
  createSubscription: (data, actions) => {
    return actions.subscription.create({
      plan_id: PLAN_IDS[plan]
    });
  },
  onApprove: async (data, actions) => {
    const subscriptionData = {
      subscriptionId: data.subscriptionID,
      plan: plan,
      status: 'active',
      startDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Save to database via API
    await api.updateSubscription(subscriptionData);
    onSuccess(subscriptionData);
  }
});
```

#### 3. Webhook for Payment Verification

Create webhook endpoint to verify payments:

```typescript
// In /supabase/functions/server/index.tsx
app.post('/make-server-a9845035/webhooks/paypal', async (c) => {
  const event = await c.req.json();
  
  // Verify webhook signature
  // Update subscription status based on event type
  if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
    // Mark subscription as expired
  }
  
  return c.json({ success: true });
});
```

#### 4. Required Environment Variables

Add to Vercel + Supabase Functions:
```
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_SECRET=your_secret_key
PAYPAL_WEBHOOK_ID=your_webhook_id
```

### Payment Verification Flow

```
1. User subscribes via PayPal
2. PayPal sends webhook to /webhooks/paypal
3. Webhook verifies payment and updates database
4. App checks subscription status on login
5. If payment failed, show "Payment Required" modal
6. Restrict features based on subscription status
```

## 🔐 API Keys & Secrets

### Already Configured
- ✅ Supabase URL
- ✅ Supabase Anon Key
- ✅ PayPal Client ID (in code - should move to env)

### To Add (for production)
```env
# .env.local (for local development)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_PAYPAL_CLIENT_ID=your-client-id

# Supabase Edge Function secrets (set in Supabase dashboard)
PAYPAL_SECRET=your-paypal-secret
PAYPAL_WEBHOOK_ID=your-webhook-id
```

### Moving PayPal Credentials to Environment

1. Remove hardcoded credentials from `PaymentCheckout.tsx`
2. Update to use environment variables:

```typescript
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
```

3. Add to Vercel environment variables

## 🐛 Known Issues & Fixes

### Issue: Multiple offices not working
**Status**: Fixed - plan-based office limits implemented

### Issue: Subscription not checking payment status
**Status**: Requires PayPal webhook setup (see above)

### Issue: Free trial for all plans
**Status**: Fixed - only Starter has 14-day trial

### Issue: Features not restricted by plan
**Status**: Fixed - plan validation added

## 📱 Testing Locally

```bash
npm install
npm run dev
```

Visit: http://localhost:5173

## 🔄 Continuous Deployment

Vercel automatically deploys on:
- Push to `main` branch
- Pull request (preview deployment)

## 📊 Monitoring

Monitor via Vercel Dashboard:
- Build logs
- Runtime logs  
- Analytics
- Performance metrics

## ⚡ Performance Tips

1. **Images**: Use CDN or Supabase Storage
2. **Code Splitting**: Already optimized by Vite
3. **Caching**: Enable in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## 🆘 Troubleshooting

### Build Fails on Vercel
- Check Node version (should be 18+)
- Verify all dependencies in package.json
- Check build logs for errors

### Auth Not Working
- Verify Supabase URL/Key in environment variables
- Check Supabase dashboard for auth errors
- Ensure email confirmation is disabled in Supabase Auth settings

### PayPal Not Loading
- Check browser console for errors
- Verify PayPal Client ID
- Ensure script loads (check network tab)

## 📞 Support

For issues with:
- **Vercel**: https://vercel.com/docs
- **Supabase**: https://supabase.com/docs
- **PayPal**: https://developer.paypal.com/docs
