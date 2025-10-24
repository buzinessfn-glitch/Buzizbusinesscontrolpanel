import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  CheckSquare, 
  Package, 
  Users, 
  Shield,
  Megaphone,
  Truck,
  DollarSign,
  BarChart3,
  Download,
  Palette,
  Bell,
  Lock
} from 'lucide-react';

interface FeaturesPageProps {
  onBack: () => void;
  onGetStarted: () => void;
}

export function FeaturesPage({ onBack, onGetStarted }: FeaturesPageProps) {
  const features = [
    {
      category: 'Time & Attendance',
      icon: Clock,
      color: 'from-blue-500 to-blue-600',
      items: [
        {
          name: 'Clock In/Out System',
          description: 'Real-time time tracking with live timer and instant clock-in/out functionality.',
          badge: 'Core'
        },
        {
          name: 'Automatic Wage Calculation',
          description: 'Wages calculated automatically based on hours worked × hourly pay rate.',
          badge: 'Pro'
        },
        {
          name: 'Time History & Reports',
          description: 'Complete history of all clock entries with downloadable reports.',
          badge: 'Pro'
        },
        {
          name: 'Dashboard Stats',
          description: 'View today\'s hours worked and wages earned at a glance.',
          badge: 'Core'
        }
      ]
    },
    {
      category: 'Shift Management',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      items: [
        {
          name: 'Shift Scheduling',
          description: 'Create and assign shifts to individual employees or entire roles.',
          badge: 'Core'
        },
        {
          name: 'Recurring Shifts',
          description: 'Set up recurring shifts for regular schedules (coming soon).',
          badge: 'Pro'
        },
        {
          name: 'Shift Notifications',
          description: 'Automated reminders for upcoming shifts (coming soon).',
          badge: 'Pro'
        },
        {
          name: 'Shift Trading',
          description: 'Allow employees to trade shifts with manager approval (coming soon).',
          badge: 'Enterprise'
        }
      ]
    },
    {
      category: 'Task Management',
      icon: CheckSquare,
      color: 'from-purple-500 to-purple-600',
      items: [
        {
          name: 'Task Assignment',
          description: 'Assign tasks to team members with priority levels (Low, Medium, High).',
          badge: 'Core'
        },
        {
          name: 'Status Tracking',
          description: 'Track task progress: To Do, In Progress, Done.',
          badge: 'Core'
        },
        {
          name: 'Due Dates',
          description: 'Set deadlines and get notified about overdue tasks.',
          badge: 'Pro'
        },
        {
          name: 'Task Templates',
          description: 'Create reusable task templates for recurring work (coming soon).',
          badge: 'Pro'
        }
      ]
    },
    {
      category: 'Inventory Control',
      icon: Package,
      color: 'from-orange-500 to-orange-600',
      items: [
        {
          name: 'Stock Management',
          description: 'Track inventory items with quantities and categories.',
          badge: 'Pro'
        },
        {
          name: 'Low Stock Alerts',
          description: 'Automatic alerts when inventory falls below threshold levels.',
          badge: 'Pro'
        },
        {
          name: 'Stock History',
          description: 'Track inventory changes over time with audit logs (coming soon).',
          badge: 'Enterprise'
        },
        {
          name: 'Barcode Scanning',
          description: 'Scan barcodes for quick inventory updates (coming soon).',
          badge: 'Enterprise'
        }
      ]
    },
    {
      category: 'Team & Permissions',
      icon: Users,
      color: 'from-yellow-400 to-yellow-500',
      items: [
        {
          name: 'Employee Directory',
          description: 'Manage your team with employee numbers, roles, and contact info.',
          badge: 'Core'
        },
        {
          name: 'Discord-Like Roles',
          description: 'Create custom roles with colors, descriptions, and visual badges.',
          badge: 'Pro'
        },
        {
          name: 'Granular Permissions',
          description: '12+ permission types for fine-grained access control.',
          badge: 'Pro'
        },
        {
          name: 'Pay Rate Management',
          description: 'Set hourly pay rates for each employee for wage tracking.',
          badge: 'Pro'
        }
      ]
    },
    {
      category: 'Communication',
      icon: Megaphone,
      color: 'from-red-500 to-red-600',
      items: [
        {
          name: 'Announcements',
          description: 'Post announcements visible to all team members.',
          badge: 'Core'
        },
        {
          name: 'Role-Based Targeting',
          description: 'Send announcements to specific roles (coming soon).',
          badge: 'Pro'
        },
        {
          name: 'Push Notifications',
          description: 'Real-time notifications for important updates (coming soon).',
          badge: 'Pro'
        },
        {
          name: 'Internal Messaging',
          description: 'Direct messaging between team members (coming soon).',
          badge: 'Enterprise'
        }
      ]
    },
    {
      category: 'Analytics & Reporting',
      icon: BarChart3,
      color: 'from-indigo-500 to-indigo-600',
      items: [
        {
          name: 'Activity Logs',
          description: 'Comprehensive logs of all actions taken in the system.',
          badge: 'Pro'
        },
        {
          name: 'Downloadable Reports',
          description: 'Export logs and reports as CSV or PDF files.',
          badge: 'Pro'
        },
        {
          name: 'Advanced Analytics',
          description: 'Insights on employee performance, costs, and productivity.',
          badge: 'Enterprise'
        },
        {
          name: 'Custom Dashboards',
          description: 'Build custom analytics dashboards for your needs.',
          badge: 'Enterprise'
        }
      ]
    },
    {
      category: 'Additional Features',
      icon: Shield,
      color: 'from-pink-500 to-pink-600',
      items: [
        {
          name: 'Supplier Management',
          description: 'Store supplier contact information and details.',
          badge: 'Pro'
        },
        {
          name: 'Cloud Storage',
          description: 'Secure cloud storage with automatic local fallback.',
          badge: 'Core'
        },
        {
          name: 'Mobile Optimized',
          description: 'Fully responsive design works perfectly on all devices.',
          badge: 'Core'
        },
        {
          name: 'Multi-Office Support',
          description: 'Manage multiple offices from a single account.',
          badge: 'Enterprise'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={onBack}
              className="text-white hover:text-yellow-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h2 className="text-white text-xl">Features</h2>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl text-white mb-6">
            Powerful Features for <span className="text-yellow-400">Every Business</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Everything you need to manage your team, track time, and grow your business.
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            Try All Features Free
          </Button>
        </div>
      </section>

      {/* Features List */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          {features.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div key={idx}>
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-3xl text-white">{category.category}</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {category.items.map((item, i) => (
                    <Card
                      key={i}
                      className="p-6 bg-white/5 border-2 border-white/10 hover:border-yellow-400/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-white text-lg">{item.name}</h3>
                        <Badge
                          variant="outline"
                          className={`${
                            item.badge === 'Core'
                              ? 'border-green-400/50 text-green-400'
                              : item.badge === 'Pro'
                              ? 'border-yellow-400/50 text-yellow-400'
                              : 'border-purple-400/50 text-purple-400'
                          }`}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Legend */}
      <section className="py-16 bg-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-green-400/50 text-green-400">
                Core
              </Badge>
              <span className="text-gray-400 text-sm">Available in all plans</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-yellow-400/50 text-yellow-400">
                Pro
              </Badge>
              <span className="text-gray-400 text-sm">Professional & Enterprise</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-purple-400/50 text-purple-400">
                Enterprise
              </Badge>
              <span className="text-gray-400 text-sm">Enterprise only</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl text-black mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-black/80 mb-8">
            Try all features free for 14 days. No credit card required.
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-black text-white hover:bg-gray-900"
          >
            Start Your Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
