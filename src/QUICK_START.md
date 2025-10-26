# 🚀 Buziz Quick Start Guide

## 📋 What Has Been Implemented

### ✅ Completed Features

1. **Authentication System**
   - Login/Signup with email + password
   - Session persistence
   - Auto-redirect to office selector after login

2. **Subscription Management**
   - 3 pricing tiers (Starter, Professional, Enterprise)
   - PayPal payment integration
   - Plan-based office creation limits
   - Feature restrictions by plan
   - Free trial ONLY for Starter (14 days)

3. **Office Management**
   - Create offices with unique codes
   - Join offices via code
   - Multiple office support
   - Office switching capability

4. **Dashboard Features**
   - **Time Tracking**: Clock in/out with wage calculations
   - **Shifts**: Create and assign shifts
   - **Tasks**: Task management with priorities
   - **Leave Management**: Vacation/sick leave requests ✨ NEW
   - **Inventory**: Stock management (Pro+)
   - **Suppliers**: Supplier directory (Pro+)
   - **Staff**: Employee management
   - **Roles**: Discord-like roles with colors (Pro+)
   - **Activity Logs**: Download reports (Pro+) ✨ NEW
   - **Announcements**: Team communication

5. **Marketing Site**
   - Professional landing page
   - Pricing page
   - About page
   - Features showcase
   - All consolidated into one component

6. **Mobile Responsive**
   - Fully responsive design
   - Mobile-optimized navigation
   - Touch-friendly interface

### 🔄 Features In Progress (Need Implementation)

1. **Recurring Shifts** - Auto-schedule weekly/monthly shifts
2. **Break Logging** - Track employee breaks
3. **Employee Status** - Available, DND, On Break indicators
4. **Meeting Management** - Schedule team meetings
5. **Shift Trading** - Employee shift swap requests
6. **Push Notifications** - Real-time alerts
7. **Advanced Analytics** - Performance dashboards (Enterprise)

## 🎯 How to Use (Step by Step)

### For First-Time Setup

1. **Start Development Server**
   ```bash
   npm install
   npm run dev
   ```
   Opens at `http://localhost:5173`

2. **Landing Page**
   - Click "Get Started" or "Log In" in navigation
   - Or click "View Pricing" to see plans

3. **Sign Up**
   - Enter email, password, and name
   - Click "Create Account"
   - Automatically logged in

4. **Choose Plan** (redirected to pricing if creating office)
   - Click "Start Free Trial" for Starter ($9/mo, 14-day trial)
   - Click "Get Started" for Pro ($29/mo) or Enterprise ($99/mo)

5. **Complete Payment**
   - PayPal checkout appears
   - Use sandbox credentials for testing
   - After payment, redirected to office selector

6. **Create or Join Office**
   - **Create**: Enter office name → Get 6-digit code
   - **Join**: Enter code from manager

7. **Access Dashboard**
   - Navigate using sidebar menu
   - Features available based on your plan

### For Testing Different Plans

To test plan restrictions:

1. **Starter Plan**
   - Can create 1 office only
   - Access to: Overview, Time Clock, Shifts, Tasks, Staff, Announcements, Settings
   - Cannot access: Inventory, Suppliers, Roles, Activity Logs, Leave Management

2. **Professional Plan**
   - Can create up to 5 offices
   - Access to all features except Enterprise-only

3. **Enterprise Plan**
   - Unlimited offices
   - All features unlocked

### Testing PayPal (Sandbox Mode)

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Navigate to "Sandbox → Accounts"
3. Use test account credentials
4. Test credit card: `4111 1111 1111 1111`, Exp: `12/25`, CVV: `123`

## 🐛 Current Known Bugs

### Critical (Fix These First)
1. **Clock-in persistence**: Active clock doesn't persist across page refreshes
2. **Real-time sync**: Multiple users don't see each other's changes live
3. **Subscription expiry**: No automatic check for expired subscriptions

### Minor
4. **Date formatting**: Inconsistent across components
5. **Toast notifications**: Some don't auto-dismiss

## 🔧 How to Fix Common Issues

### "Cannot read properties of undefined (reading 'VITE_PAYPAL_CLIENT_ID')"
**Fixed!** The app now safely accesses environment variables with proper fallbacks.
- PayPal Client ID has a hardcoded fallback for development
- No environment variables required for local testing
- See `/ENVIRONMENT_SETUP.md` for production configuration

### "Supabase connection failed"
- App automatically falls back to localStorage
- Yellow banner shows "Using offline mode"
- Data stored locally on device

### "Payment not processing"
- Check PayPal Client ID in environment variables
- Verify PayPal SDK loading (check browser console)
- Use sandbox mode for testing

### "Can't create office"
- Check if you have an active subscription
- Verify plan limits (Starter = 1 office)
- Try refreshing the page

### "Features not showing"
- Check your subscription plan
- Verify plan features in Dashboard.tsx
- Some features require Professional or Enterprise

## 📝 Plan Validation Logic

```typescript
// In App.tsx
const PLAN_LIMITS = {
  starter: { 
    offices: 1, 
    members: 10, 
    features: ['basic'] 
  },
  professional: { 
    offices: 5, 
    members: 50, 
    features: ['basic', 'advanced'] 
  },
  enterprise: { 
    offices: 999, 
    members: 999, 
    features: ['basic', 'advanced', 'enterprise'] 
  }
};

// Features by tier:
// basic: Time tracking, shifts, tasks, staff, announcements
// advanced: + Inventory, suppliers, roles, activity logs, leave
// enterprise: + Advanced analytics, API access, multi-office
```

## 🎨 Customization Guide

### Change Brand Colors
Edit `/styles/globals.css`:
```css
:root {
  --color-yellow: 45 93% 47%; /* Change yellow accent */
  --color-black: 0 0% 0%;     /* Primary dark */
}
```

### Add New Menu Item
Edit `/components/dashboard/Dashboard.tsx`:
```typescript
const menuItems = [
  // Add new item
  { 
    id: 'your-feature', 
    label: 'Your Feature', 
    icon: YourIcon, 
    requiresFeature: 'advanced' // or null for all plans
  },
];
```

### Modify Plan Prices
Edit `/components/marketing/MarketingPages.tsx` and `/components/payment/PaymentCheckout.tsx`:
```typescript
const plans = [
  { id: 'starter', price: '$9', ... },
  { id: 'professional', price: '$29', ... }, // Change here
];
```

## 🚀 Deploy to Production

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Add environment variables:
     ```
     VITE_SUPABASE_URL=your_production_url
     VITE_SUPABASE_ANON_KEY=your_production_key
     VITE_PAYPAL_CLIENT_ID=your_paypal_id
     ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app is live!

### Post-Deployment Checklist

- [ ] Test login/signup flow
- [ ] Test payment flow (use sandbox first)
- [ ] Verify plan restrictions work
- [ ] Test office creation
- [ ] Check mobile responsiveness
- [ ] Set up custom domain (optional)
- [ ] Configure SSL (automatic in Vercel)
- [ ] Set up error monitoring (Sentry)
- [ ] Add analytics (PostHog, Mixpanel)

## 📊 Database Schema

Currently using Supabase KV store. Data structure:

```typescript
// Office data
`office:${officeId}` → Office object
`office:${officeId}:employees` → Employee[]
`office:${officeId}:roles` → Role[]
`office:${officeId}:shifts` → Shift[]
`office:${officeId}:tasks` → Task[]
`office:${officeId}:inventory` → InventoryItem[]
`office:${officeId}:leave-requests` → LeaveRequest[]
`office:${officeId}:activity-logs` → LogEntry[]
`office:${officeId}:clock-history` → ClockEntry[]

// User data
`user:${userId}:offices` → string[] (office IDs)
`employee:${employeeId}:active-clock` → ClockEntry | null

// Subscription
`buziz:subscription` → Subscription (localStorage)
```

## 🔐 Security Best Practices

### Already Implemented
- ✅ Supabase Row Level Security (RLS)
- ✅ Password hashing (Supabase Auth)
- ✅ API key protection (environment variables)
- ✅ HTTPS enforced (Vercel automatic)

### To Add
- [ ] Rate limiting on API endpoints
- [ ] CSRF protection tokens
- [ ] Input sanitization on all forms
- [ ] SQL injection prevention (use parameterized queries)

## 📱 Mobile App Support

Current status: **Mobile-responsive web app**

To convert to native apps:
1. Use React Native with Expo
2. Share component logic
3. Adapt UI for native components
4. Publish to App Store/Play Store

## 🆘 Getting Help

### Error: "Multiple GoTrueClient instances"
**Fixed!** Using singleton pattern in `/utils/supabase/client.tsx`

### Error: "Cannot create office"
Check subscription status and plan limits

### Error: "PayPal not loading"
Verify PAYPAL_CLIENT_ID in environment variables

### Still Stuck?
1. Check browser console for errors
2. Review `/IMPLEMENTATION_SUMMARY.md`
3. Check Supabase logs
4. Review code comments

## 🎯 Next Implementation Steps

### Priority 1: Fix Critical Bugs
1. Clock persistence
2. Real-time collaboration
3. Subscription expiry checks

### Priority 2: Complete Features
1. Recurring shifts
2. Break logging
3. Employee status
4. Meeting management

### Priority 3: Recurring Payments
1. Set up PayPal subscription plans
2. Create webhook endpoint
3. Implement payment verification
4. Add subscription renewal logic

### Priority 4: Polish
1. Improve error messages
2. Add loading states everywhere
3. Optimize performance
4. Add animations

## 🎉 Success Metrics

Track these to measure success:
- **User Sign-ups**: New accounts created
- **Paid Conversions**: Free trial → Paid
- **Office Creation**: Number of active offices
- **Daily Active Users**: Login frequency
- **Feature Usage**: Which features are most used
- **Churn Rate**: Subscription cancellations

---

**You're ready to go! Start the dev server and explore Buziz** 🚀

Questions? Check `/DEPLOYMENT.md` or `/IMPLEMENTATION_SUMMARY.md`