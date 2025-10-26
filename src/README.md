# 🚀 Buziz - Business Control Panel

> A comprehensive business management platform for small businesses, esports teams, and organizations.

![Version](https://img.shields.io/badge/version-1.0.0-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Features (All Plans)
- ⏰ **Time Tracking** - Clock in/out with automatic wage calculations
- 📅 **Shift Scheduling** - Create and manage shifts for individuals or roles
- ✅ **Task Management** - Assign tasks with priority levels and status tracking
- 👥 **Team Management** - Employee directory with role-based permissions
- 📢 **Announcements** - Post updates visible to all team members
- 🔐 **Secure Authentication** - Email/password with optional social login

### Professional Features
- 📊 **Activity Logs** - Download comprehensive activity reports (CSV/JSON)
- 🎨 **Discord-Like Roles** - Custom roles with colors and granular permissions
- 📦 **Inventory Management** - Track stock levels with low-stock alerts
- 🏖️ **Leave Management** - Vacation, sick leave, and time-off requests
- 🤝 **Supplier Management** - Store supplier contact information
- ☕ **Break Logging** - Optional or mandatory break tracking
- 🔄 **Recurring Shifts** - Auto-schedule shifts weekly/monthly

### Enterprise Features
- 📈 **Advanced Analytics** - Performance metrics and cost analysis
- 🏢 **Multi-Office Management** - Manage unlimited offices
- 🔌 **API Access** - Integrate with your existing tools
- 👨‍💼 **Dedicated Support** - 24/7 phone support
- 🎯 **Custom Branding** - White-label options

## 💰 Pricing

| Plan | Price | Offices | Members | Trial |
|------|-------|---------|---------|-------|
| **Starter** | $9/mo | 1 | 10 | 14 days |
| **Professional** | $29/mo | 5 | 50 | No |
| **Enterprise** | $99/mo | Unlimited | Unlimited | No |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- PayPal account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd buziz
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub/GitLab
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Detailed deployment instructions:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (Auth + Database)
- **Edge Functions**: Supabase Edge Functions (Deno)
- **Payments**: PayPal
- **Build Tool**: Vite
- **Hosting**: Vercel

## 📁 Project Structure

```
buziz/
├── components/
│   ├── auth/              # Authentication components
│   ├── dashboard/         # Main dashboard views
│   ├── marketing/         # Landing, pricing, about pages
│   ├── payment/           # PayPal checkout
│   ├── onboarding/        # Office creation/join
│   └── ui/                # Reusable UI components
├── utils/
│   ├── api.tsx            # API client
│   ├── storage.tsx        # Storage abstraction (Supabase + localStorage)
│   └── supabase/          # Supabase client config
├── supabase/
│   └── functions/server/  # Edge functions
├── styles/
│   └── globals.css        # Global styles + Tailwind config
└── App.tsx                # Main app component
```

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_PAYPAL_CLIENT_ID` | PayPal Client ID for payments | Yes |

**Supabase Edge Function Secrets** (set in Supabase dashboard):
- `PAYPAL_SECRET` - PayPal secret key (for webhooks)
- `PAYPAL_WEBHOOK_ID` - PayPal webhook ID (for verification)

## 🧪 Testing

### Test User Flow

1. **Landing Page** → Sign Up
2. **Choose Plan** → Complete Payment (use PayPal Sandbox)
3. **Create Office** → Get office code
4. **Invite Team** → Share office code
5. **Test Features** → Clock in, create shifts, assign tasks

### PayPal Sandbox Testing

Use PayPal sandbox credentials for testing:
- Sandbox account: https://developer.paypal.com/dashboard/
- Test credit cards: https://developer.paypal.com/tools/sandbox/card-testing/

## 🐛 Known Issues

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for full list of known issues and planned features.

### Critical
- [ ] Real-time collaboration needs Supabase Realtime
- [ ] Recurring payments need PayPal subscription plans
- [ ] Clock persistence across sessions

### Minor
- [ ] Date formatting inconsistency
- [ ] Some toast notifications don't auto-dismiss

## 🛣️ Roadmap

- [x] Phase 1: Core Features (Time tracking, shifts, tasks)
- [x] Phase 2: Plan-based restrictions
- [x] Phase 3: Leave management
- [ ] Phase 4: Recurring shifts
- [ ] Phase 5: Break logging
- [ ] Phase 6: Meeting management
- [ ] Phase 7: Advanced analytics
- [ ] Phase 8: Mobile apps (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

- 📧 Email: support@buziz.app
- 💬 Discord: [Join our community](https://discord.gg/buziz)
- 📖 Docs: [documentation.buziz.app](https://documentation.buziz.app)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/buziz/issues)

## 🙏 Acknowledgments

- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Lucide](https://lucide.dev/) for icons
- [PayPal](https://developer.paypal.com/) for payment processing

## 📸 Screenshots

### Landing Page
*Beautiful, modern landing page with clear value proposition*

### Dashboard
*Clean, intuitive dashboard with all features at your fingertips*

### Time Tracking
*Easy clock in/out with automatic wage calculations*

### Pricing
*Transparent pricing with three tiers to fit any business*

---

**Built with ❤️ by the Buziz Team**

*Transform your business management today!* 🚀
