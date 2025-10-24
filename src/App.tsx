import { useState, useEffect } from 'react';
import { Auth } from './components/auth/Auth';
import { OfficeSelector } from './components/onboarding/OfficeSelector';
import { Dashboard } from './components/dashboard/Dashboard';
import { LandingPage } from './components/marketing/LandingPage';
import { PricingPage } from './components/marketing/PricingPage';
import { AboutPage } from './components/marketing/AboutPage';
import { FeaturesPage } from './components/marketing/FeaturesPage';
import { PaymentCheckout } from './components/payment/PaymentCheckout';
import { Toaster } from './components/ui/sonner';
import { createClient } from './utils/supabase/client';
import { setAuthToken } from './utils/api';

export interface Employee {
  id: string;
  name: string;
  employeeNumber: string;
  role: string;
  isCreator: boolean;
  isHeadManager: boolean;
  payRate?: number;
}

export interface Office {
  id: string;
  code: string;
  creatorId: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  color?: string;
  description?: string;
}

export interface AppState {
  office: Office | null;
  currentEmployee: Employee | null;
  employees: Employee[];
  roles: Role[];
}

type AppView = 'landing' | 'auth' | 'pricing' | 'about' | 'features' | 'checkout' | 'office-select' | 'dashboard';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise' | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [appState, setAppState] = useState<AppState>({
    office: null,
    currentEmployee: null,
    employees: [],
    roles: []
  });

  useEffect(() => {
    const supabase = createClient();
    
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setAuthToken(session.access_token);
        setUserName(session.user.user_metadata?.name || session.user.email || 'User');
        checkSubscription();
        setView('office-select');
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAuthToken(session.access_token);
        setUserName(session.user.user_metadata?.name || session.user.email || 'User');
        checkSubscription();
      } else {
        setAuthToken(null);
        setUserName(null);
        setView('landing');
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const checkSubscription = () => {
    const stored = localStorage.getItem('buziz:subscription');
    if (stored) {
      setSubscription(JSON.parse(stored));
    }
  };

  const handleAuthSuccess = (newSession: any) => {
    setSession(newSession);
    setAuthToken(newSession.access_token);
    setUserName(newSession.user.user_metadata?.name || newSession.user.email || 'User');
    checkSubscription();
    
    // Check if they have a subscription
    const stored = localStorage.getItem('buziz:subscription');
    if (stored) {
      setView('office-select');
    } else {
      setView('pricing');
    }
  };

  const handleOfficeSelected = (state: AppState) => {
    setAppState(state);
    setView('dashboard');
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    setAuthToken(null);
    setUserName(null);
    setAppState({
      office: null,
      currentEmployee: null,
      employees: [],
      roles: []
    });
    setView('landing');
  };

  const handleBackToAuth = () => {
    setView('auth');
  };

  const handleSelectPlan = (plan: 'starter' | 'professional' | 'enterprise') => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handlePaymentSuccess = (subscriptionData: any) => {
    setSubscription(subscriptionData);
    setView('office-select');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <>
        <LandingPage
          onGetStarted={() => setView('auth')}
          onViewPricing={() => setView('pricing')}
          onViewAbout={() => setView('about')}
          onViewFeatures={() => setView('features')}
        />
        <Toaster />
      </>
    );
  }

  if (view === 'pricing') {
    return (
      <>
        <PricingPage
          onBack={() => setView(session ? 'office-select' : 'landing')}
          onSelectPlan={handleSelectPlan}
        />
        <Toaster />
      </>
    );
  }

  if (view === 'about') {
    return (
      <>
        <AboutPage onBack={() => setView('landing')} />
        <Toaster />
      </>
    );
  }

  if (view === 'features') {
    return (
      <>
        <FeaturesPage
          onBack={() => setView('landing')}
          onGetStarted={() => setView('auth')}
        />
        <Toaster />
      </>
    );
  }

  if (view === 'checkout' && selectedPlan) {
    return (
      <>
        <PaymentCheckout
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setView('pricing')}
        />
        <Toaster />
      </>
    );
  }

  if (view === 'auth' || !session) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster />
      </>
    );
  }

  if (view === 'office-select' || !appState.office || !appState.currentEmployee) {
    return (
      <>
        <OfficeSelector userName={userName!} onComplete={handleOfficeSelected} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Dashboard appState={appState} setAppState={setAppState} onLogout={handleLogout} onBackToAuth={handleBackToAuth} />
      <Toaster />
    </div>
  );
}