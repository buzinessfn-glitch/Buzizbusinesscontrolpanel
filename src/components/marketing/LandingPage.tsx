import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { 
  Briefcase, 
  Clock, 
  Users, 
  Calendar, 
  CheckSquare, 
  Package, 
  TrendingUp,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onViewPricing: () => void;
  onViewAbout: () => void;
  onViewFeatures: () => void;
}

export function LandingPage({ onGetStarted, onViewPricing, onViewAbout, onViewFeatures }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Briefcase className="w-8 h-8 text-yellow-400" />
              <h1 className="text-white text-2xl">Buziz</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <button onClick={onViewFeatures} className="text-gray-300 hover:text-yellow-400 transition-colors">
                Features
              </button>
              <button onClick={onViewPricing} className="text-gray-300 hover:text-yellow-400 transition-colors">
                Pricing
              </button>
              <button onClick={onViewAbout} className="text-gray-300 hover:text-yellow-400 transition-colors">
                About
              </button>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6 px-4 py-2 bg-yellow-400/20 rounded-full border border-yellow-400/30">
              <span className="text-yellow-400 text-sm">Business Control Made Simple</span>
            </div>
            <h1 className="text-5xl md:text-7xl mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Run Your Business
              <br />
              Like a <span className="text-yellow-400">Pro</span>
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
              Buziz is the all-in-one platform for small businesses, esports teams, and organizations. 
              Manage shifts, tasks, inventory, and team members from one beautiful dashboard.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600 text-lg px-8"
              >
                Start Free Trial
              </Button>
              <Button
                onClick={onViewPricing}
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-black text-lg px-8"
              >
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
              {
                icon: Clock,
                title: 'Time Tracking',
                description: 'Clock in/out with automatic wage calculations. Track hours worked and earnings in real-time.'
              },
              {
                icon: Calendar,
                title: 'Shift Scheduling',
                description: 'Create and manage shifts for individuals or entire roles. Never miss a shift again.'
              },
              {
                icon: CheckSquare,
                title: 'Task Management',
                description: 'Assign tasks with priority levels and status tracking. Keep everyone on the same page.'
              },
              {
                icon: Package,
                title: 'Inventory Control',
                description: 'Track stock levels with low stock alerts. Manage your inventory effortlessly.'
              },
              {
                icon: Users,
                title: 'Team Management',
                description: 'Role-based permissions and employee directory. Discord-like role system with colors.'
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Cloud storage with automatic local fallback. Your data is always safe and accessible.'
              }
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

      {/* Stats Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl text-yellow-400 mb-2">10,000+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-5xl text-yellow-400 mb-2">50,000+</div>
              <div className="text-gray-400">Shifts Scheduled</div>
            </div>
            <div>
              <div className="text-5xl text-yellow-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl text-white mb-6">
                Built for <span className="text-yellow-400">Modern Teams</span>
              </h2>
              <p className="text-gray-400 mb-8 text-lg">
                Whether you're running a small business, managing an esports team, 
                or coordinating a large organization, Buziz adapts to your needs.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Zap, text: 'Lightning fast performance' },
                  { icon: Globe, text: 'Access from anywhere' },
                  { icon: TrendingUp, text: 'Scales with your business' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-white text-lg">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="p-8 bg-gradient-to-br from-yellow-400/10 to-transparent border-2 border-yellow-400/30">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white text-xl">Start in Minutes</h3>
                    <p className="text-gray-400">No credit card required</p>
                  </div>
                </div>
                <p className="text-gray-300">
                  Create your office, invite your team, and start managing your business in under 5 minutes. 
                  It's that simple.
                </p>
                <Button
                  onClick={onGetStarted}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
                >
                  Try Buziz Free
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl text-black mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-black/80 mb-8">
            Join thousands of teams already using Buziz to streamline their operations
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-black text-white hover:bg-gray-900 text-lg px-8"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-6 h-6 text-yellow-400" />
                <span className="text-white text-xl">Buziz</span>
              </div>
              <p className="text-gray-400 text-sm">
                Business control made simple for modern teams.
              </p>
            </div>
            <div>
              <h4 className="text-white mb-4">Product</h4>
              <div className="space-y-2">
                <button onClick={onViewFeatures} className="block text-gray-400 hover:text-yellow-400 text-sm">
                  Features
                </button>
                <button onClick={onViewPricing} className="block text-gray-400 hover:text-yellow-400 text-sm">
                  Pricing
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-4">Company</h4>
              <div className="space-y-2">
                <button onClick={onViewAbout} className="block text-gray-400 hover:text-yellow-400 text-sm">
                  About Us
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-white mb-4">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-yellow-400 text-sm">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-yellow-400 text-sm">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400 text-sm">
            © 2025 Buziz. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
