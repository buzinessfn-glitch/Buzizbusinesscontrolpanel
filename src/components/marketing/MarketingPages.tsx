import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Briefcase, Clock, Users, Calendar, CheckSquare, Package, TrendingUp,
  Shield, Zap, Globe, ArrowLeft, Target, Heart, FileText, BarChart3,
  Download, Palette, Bell, Lock, Megaphone, Truck, Check, Star, Crown,
  DollarSign
} from 'lucide-react';

type MarketingView = 'landing' | 'pricing' | 'about' | 'features';

interface MarketingPagesProps {
  currentView: MarketingView;
  onNavigate: (view: MarketingView) => void;
  onGetStarted: () => void;
  onLogin: () => void;
  onSelectPlan: (plan: 'starter' | 'professional' | 'enterprise') => void;
}

export function MarketingPages({ currentView, onNavigate, onGetStarted, onLogin, onSelectPlan }: MarketingPagesProps) {
  const renderNavigation = (showBack: boolean = false) => (
    <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {showBack ? (
            <Button
              variant="ghost"
              onClick={() => onNavigate('landing')}
              className="text-white hover:text-yellow-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-yellow-400" />
              <h1 className="text-white text-2xl">Buziz</h1>
            </div>
          )}
          <div className="hidden md:flex items-center gap-6">
            <button onClick={() => onNavigate('features')} className="text-gray-300 hover:text-yellow-400 transition-colors">
              Features
            </button>
            <button onClick={() => onNavigate('pricing')} className="text-gray-300 hover:text-yellow-400 transition-colors">
              Pricing
            </button>
            <button onClick={() => onNavigate('about')} className="text-gray-300 hover:text-yellow-400 transition-colors">
              About
            </button>
            <Button onClick={onLogin} variant="ghost" className="text-gray-300 hover:text-white">
              Log In
            </Button>
            <Button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-black text-white">
        {renderNavigation()}
        
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-block mb-6 px-4 py-2 bg-yellow-400/20 rounded-full border border-yellow-400/30">
                <span className="text-yellow-400 text-sm">Business Control Made Simple</span>
              </div>
              <h1 className="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Run Your Business Like a <span className="text-yellow-400">Pro</span>
              </h1>
              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                Buziz is the all-in-one platform for small businesses, esports teams, and organizations. 
                Manage shifts, tasks, inventory, and team members from one beautiful dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 text-lg px-8">
                  Start Free Trial
                </Button>
                <Button onClick={() => onNavigate('pricing')} size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-black text-lg px-8">
                  View Pricing
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl text-white mb-4">
                Everything You Need, <span className="text-yellow-400">Nothing You Don't</span>
              </h2>
              <p className="text-xl text-gray-400">Powerful features designed for modern teams</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: 'Time Tracking', description: 'Clock in/out with automatic wage calculations. Track hours worked and earnings in real-time.' },
                { icon: Calendar, title: 'Shift Scheduling', description: 'Create and manage shifts for individuals or entire roles. Auto-schedule recurring shifts.' },
                { icon: CheckSquare, title: 'Task Management', description: 'Assign tasks with priority levels and status tracking. Keep everyone on the same page.' },
                { icon: Package, title: 'Inventory Control', description: 'Track stock levels with low stock alerts. Manage your inventory effortlessly.' },
                { icon: Users, title: 'Team Management', description: 'Role-based permissions and employee directory. Discord-like role system with colors.' },
                { icon: Shield, title: 'Secure & Private', description: 'Cloud storage with automatic local fallback. Your data is always safe and accessible.' }
              ].map((feature, i) => (
                <Card key={i} className="p-6 bg-white/5 border-2 border-white/10 hover:border-yellow-400/50 transition-all backdrop-blur-sm">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-white text-xl mb-2">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div><div className="text-5xl text-yellow-400 mb-2">10,000+</div><div className="text-gray-400">Active Users</div></div>
              <div><div className="text-5xl text-yellow-400 mb-2">50,000+</div><div className="text-gray-400">Shifts Scheduled</div></div>
              <div><div className="text-5xl text-yellow-400 mb-2">99.9%</div><div className="text-gray-400">Uptime</div></div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl text-black mb-6">Ready to Transform Your Business?</h2>
            <p className="text-xl text-black/80 mb-8">Join thousands of teams already using Buziz</p>
            <Button onClick={onGetStarted} size="lg" className="bg-black text-white hover:bg-gray-900 text-lg px-8">
              Start Your Free Trial
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (currentView === 'pricing') {
    const plans = [
      {
        id: 'starter', name: 'Starter', price: '$9', period: '/month', icon: Zap, color: 'from-gray-600 to-gray-700',
        description: 'Perfect for small teams', popular: false,
        features: [
          '1 office',
          'Up to 10 team members',
          'Basic time tracking & clock in/out',
          'Automatic wage calculations',
          'Shift scheduling & calendar',
          'Task management with priorities',
          'Team chat with polls & files',
          'Direct private messaging',
          'Employee profiles & bios',
          'Custom profile pictures',
          'Notifications & employee paging',
          'Real-time team status',
          'Announcements board',
          'Staff directory',
          'Remember me login',
          '2 custom roles',
          'Email support',
          '5GB storage'
        ]
      },
      {
        id: 'professional', name: 'Professional', price: '$29', period: '/month', icon: Star, color: 'from-yellow-400 to-yellow-500',
        description: 'Best for growing businesses', popular: true,
        features: [
          'Everything in Starter',
          'Up to 5 offices',
          'Up to 50 team members',
          'Advanced wage & overtime system',
          'Paid/unpaid overtime tracking',
          'Bonuses & travel pay',
          'Weekend & holiday multipliers',
          'Max hours warnings',
          'Time off balance tracking',
          'Auto-accruing PTO',
          'Parking spot management',
          'Parking requests & approval',
          'Shift swap board',
          'Public shift marketplace',
          'Leave requests & approvals',
          'Meeting scheduling with conflicts',
          'Meeting request workflows',
          'Auto-recurring shifts',
          'Break time logging',
          'Inventory management',
          'Low stock alerts',
          'Supplier contact database',
          'Issue employee warnings',
          'Formal complaint system',
          'Remove/kick employees',
          'Unlimited custom roles',
          'Discord-like role permissions',
          'Comprehensive activity logs',
          'CSV & JSON export',
          'File attachment preview',
          'Priority support',
          '50GB storage'
        ]
      },
      {
        id: 'enterprise', name: 'Enterprise', price: '$99', period: '/month', icon: Crown, color: 'from-purple-600 to-purple-700',
        description: 'For large organizations', popular: false,
        features: [
          'Everything in Professional',
          'Unlimited offices',
          'Unlimited team members',
          'AI-Powered Smart Insights',
          'Overtime detection & alerts',
          'Labor cost analytics',
          'Absence pattern recognition',
          'Task performance tracking',
          'Shift coverage forecasting',
          'Meeting conflict detection',
          'Security camera monitoring',
          'Multi-camera feed viewer',
          'Wireless/wired/Bluetooth cameras',
          'Fullscreen camera view',
          'Office customization suite',
          'Custom primary/secondary/tertiary colors',
          'Upload office logo',
          'Upload office banner',
          'Live theme preview',
          'Boss/supervisor assignment',
          'Supervisor employee oversight',
          'Custom display names per office',
          'Upload profile pictures (JPG/PNG)',
          'Stock avatar library',
          'Multi-office profile management',
          'Office backup & restore',
          'Secret key security',
          'Advanced permissions',
          'API access',
          'Dedicated account manager',
          '24/7 phone support',
          'Unlimited storage',
          '99.9% SLA guarantee'
        ]
      }
    ];

    return (
      <div className="min-h-screen bg-black text-white">
        {renderNavigation(true)}
        <section className="py-16 text-center">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl text-white mb-6">Simple, <span className="text-yellow-400">Transparent</span> Pricing</h1>
            <p className="text-xl text-gray-400 mb-8">Choose the perfect plan for your business. 14-day free trial on Starter plan.</p>
          </div>
        </section>
        <section className="pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => {
                const Icon = plan.icon;
                return (
                  <Card key={plan.id} className={`relative p-8 bg-white/5 backdrop-blur-sm ${plan.popular ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 md:scale-105' : 'border-2 border-white/10'}`}>
                    {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2"><Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-1">Most Popular</Badge></div>}
                    <div className="text-center mb-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-5xl text-white">{plan.price}</span>
                        <span className="text-gray-400">{plan.period}</span>
                      </div>
                    </div>
                    <Button onClick={() => onSelectPlan(plan.id as any)} className={`w-full mb-6 ${plan.popular ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600' : 'bg-white text-black hover:bg-gray-200'}`}>
                      {plan.id === 'starter' ? 'Start Free Trial' : 'Get Started'}
                    </Button>
                    <div className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (currentView === 'about') {
    return (
      <div className="min-h-screen bg-black text-white">
        {renderNavigation(true)}
        <section className="py-20 bg-gradient-to-b from-black to-gray-900">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-6xl text-white mb-6">We're on a <span className="text-yellow-400">Mission</span></h1>
            <p className="text-xl text-gray-400 leading-relaxed">To make business management accessible, simple, and powerful for every team.</p>
          </div>
        </section>
        <section className="py-20 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl text-white mb-8 text-center">Our Story</h2>
            <div className="space-y-6 text-gray-300">
              <p>Buziz was born from a simple frustration: managing a small business shouldn't require juggling multiple expensive tools.</p>
              <p>We built Buziz to be different. A single platform that handles everything from shifts to inventory.</p>
              <p>Today, thousands of teams trust Buziz to run their operations.</p>
            </div>
          </div>
        </section>
        <section className="py-20 bg-black">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl text-white mb-12 text-center">Our Values</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Target, title: 'Simplicity First', description: 'Complex problems deserve simple solutions.' },
                { icon: Users, title: 'Team Focused', description: 'Built for teams, by people who understand.' },
                { icon: Zap, title: 'Move Fast', description: 'Your business moves fast. So should your tools.' },
                { icon: Heart, title: 'Customer Love', description: 'Your success is our success.' }
              ].map((value, i) => (
                <Card key={i} className="p-6 bg-white/5 border-2 border-white/10 hover:border-yellow-400/50 transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-white text-xl mb-2">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Features view
  return (
    <div className="min-h-screen bg-black text-white">
      {renderNavigation(true)}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl text-white mb-6">Powerful Features for <span className="text-yellow-400">Every Business</span></h1>
          <p className="text-xl text-gray-400 mb-8">Everything you need to manage your team and grow.</p>
          <Button onClick={onGetStarted} size="lg" className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600">
            Try All Features Free
          </Button>
        </div>
      </section>
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'Time Tracking', desc: 'Clock in/out with automatic wage calculations', badge: 'All Plans' },
              { name: 'Shift Scheduling', desc: 'Create shifts for individuals or roles', badge: 'All Plans' },
              { name: 'Recurring Shifts', desc: 'Auto-schedule shifts weekly', badge: 'Pro+' },
              { name: 'Leave Requests', desc: 'Vacation, sick leave, and time off management', badge: 'Pro+' },
              { name: 'Meeting Management', desc: 'Schedule and manage team meetings', badge: 'Pro+' },
              { name: 'Break Logging', desc: 'Track employee breaks (optional or mandatory)', badge: 'Pro+' },
              { name: 'Task Management', desc: 'Assign and track tasks with priorities', badge: 'All Plans' },
              { name: 'Inventory Control', desc: 'Manage stock with low-level alerts', badge: 'Pro+' },
              { name: 'Role Management', desc: 'Discord-like roles with colors & permissions', badge: 'Pro+' },
              { name: 'Activity Logs', desc: 'Download comprehensive activity reports', badge: 'Pro+' },
              { name: 'Employee Status', desc: 'See who\'s online, on break, or DND', badge: 'Pro+' },
              { name: 'Advanced Analytics', desc: 'Insights on performance and costs', badge: 'Enterprise' }
            ].map((f, i) => (
              <Card key={i} className="p-6 bg-white/5 border-2 border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-white text-lg">{f.name}</h3>
                  <Badge variant="outline" className="text-yellow-400 border-yellow-400/50">{f.badge}</Badge>
                </div>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
