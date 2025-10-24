import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ArrowLeft, Target, Users, Zap, Heart } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
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
            <h2 className="text-white text-xl">About Us</h2>
            <div className="w-20" /> {/* Spacer */}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl text-white mb-6">
            We're on a <span className="text-yellow-400">Mission</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed">
            To make business management accessible, simple, and powerful for every team, 
            regardless of size or industry.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl text-white mb-8 text-center">Our Story</h2>
          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-gray-300 mb-6 leading-relaxed">
              Buziz was born from a simple frustration: managing a small business or team shouldn't 
              require juggling multiple expensive, complicated tools. We saw teams using spreadsheets, 
              sticky notes, and countless apps just to keep track of basic operations.
            </p>
            <p className="text-gray-300 mb-6 leading-relaxed">
              We built Buziz to be different. A single, beautiful platform that handles everything 
              from shift scheduling to inventory management. Whether you're running a café, managing 
              an esports team, or coordinating a retail store, Buziz adapts to your needs.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Today, thousands of teams trust Buziz to run their operations smoothly. And we're 
              just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl text-white mb-12 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Simplicity First',
                description: 'Complex problems deserve simple solutions. We strip away the noise.'
              },
              {
                icon: Users,
                title: 'Team Focused',
                description: 'Built for teams, by people who understand team dynamics.'
              },
              {
                icon: Zap,
                title: 'Move Fast',
                description: 'Your business moves fast. So should your tools.'
              },
              {
                icon: Heart,
                title: 'Customer Love',
                description: 'Your success is our success. We\'re here to help you win.'
              }
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

      {/* Team Stats */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl text-white mb-12 text-center">By the Numbers</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl text-yellow-400 mb-2">2024</div>
              <div className="text-gray-400">Founded</div>
            </div>
            <div>
              <div className="text-5xl text-yellow-400 mb-2">10K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-5xl text-yellow-400 mb-2">150+</div>
              <div className="text-gray-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-20 bg-gradient-to-r from-yellow-400 to-yellow-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl text-black mb-6">
            The Future is Bright
          </h2>
          <p className="text-xl text-black/80 mb-8">
            We're constantly innovating, listening to our users, and building the features 
            that help your business thrive. Join us on this journey.
          </p>
          <Button
            className="bg-black text-white hover:bg-gray-900"
            size="lg"
          >
            Get Started Today
          </Button>
        </div>
      </section>
    </div>
  );
}
