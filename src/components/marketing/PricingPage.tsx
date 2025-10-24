import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, ArrowLeft, Zap, Star, Crown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PricingPageProps {
  onBack: () => void;
  onSelectPlan: (plan: 'starter' | 'professional' | 'enterprise') => void;
}

export function PricingPage({ onBack, onSelectPlan }: PricingPageProps) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: '$9',
      period: '/month',
      description: 'Perfect for small teams and startups',
      icon: Zap,
      color: 'from-gray-600 to-gray-700',
      features: [
        'Up to 10 team members',
        'Basic time tracking',
        'Shift scheduling',
        'Task management',
        '2 custom roles',
        'Email support',
        '5GB storage',
        'Mobile app access'
      ],
      limitations: [
        'Limited to 10 employees',
        'Basic reporting only',
        'No advanced permissions'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      price: '$29',
      period: '/month',
      description: 'Best for growing businesses',
      icon: Star,
      color: 'from-yellow-400 to-yellow-500',
      popular: true,
      features: [
        'Up to 50 team members',
        'Advanced time tracking & wages',
        'Shift scheduling with notifications',
        'Advanced task management',
        'Inventory management',
        'Supplier management',
        'Unlimited custom roles',
        'Role-based permissions',
        'Activity logs & downloads',
        'Priority support',
        '50GB storage',
        'Advanced reporting',
        'Custom announcements'
      ],
      limitations: []
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      description: 'For large organizations',
      icon: Crown,
      color: 'from-purple-600 to-purple-700',
      features: [
        'Unlimited team members',
        'Everything in Professional',
        'Advanced analytics & insights',
        'Custom integrations',
        'API access',
        'Dedicated account manager',
        'Custom training',
        '24/7 phone support',
        'Unlimited storage',
        'Multi-office management',
        'Advanced security features',
        'Custom branding',
        'SLA guarantee',
        'Data export tools'
      ],
      limitations: []
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
            <h2 className="text-white text-xl">Pricing Plans</h2>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl text-white mb-6">
            Simple, <span className="text-yellow-400">Transparent</span> Pricing
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Choose the perfect plan for your business. All plans include a 14-day free trial.
          </p>
          <Badge className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 px-4 py-2">
            No credit card required for trial
          </Badge>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`relative p-8 bg-white/5 backdrop-blur-sm ${
                    plan.popular
                      ? 'border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 md:scale-105'
                      : 'border-2 border-white/10'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-4 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-5xl text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => onSelectPlan(plan.id as any)}
                    className={`w-full mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600'
                        : 'bg-white text-black hover:bg-gray-200'
                    }`}
                  >
                    Start Free Trial
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
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

      {/* FAQ */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl text-white text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'Can I change plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept all major credit cards and PayPal for your convenience.'
              },
              {
                q: 'Is there a setup fee?',
                a: 'No setup fees. No hidden charges. Just simple, transparent pricing.'
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. Cancel your subscription anytime with no penalties or questions asked.'
              }
            ].map((faq, i) => (
              <Card key={i} className="p-6 bg-white/5 border border-white/10">
                <h3 className="text-white mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl text-white mb-6">Still have questions?</h2>
          <p className="text-gray-400 mb-8">
            Our team is here to help you find the perfect plan for your business.
          </p>
          <Button
            variant="outline"
            className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black"
          >
            Contact Sales
          </Button>
        </div>
      </section>
    </div>
  );
}
