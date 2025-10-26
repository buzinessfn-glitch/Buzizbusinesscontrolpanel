import { useState, useEffect } from 'react';
import { Auth } from './components/auth/Auth';
import { OfficeSelector } from './components/onboarding/OfficeSelector';
import { Dashboard } from './components/dashboard/Dashboard';
import { MarketingPages } from './components/marketing/MarketingPages';
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
  status?: 'available' | 'dnd' | 'on-break' | 'offline' | 'clocked-in';
  lastActive?: string;
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

export interface Subscription {
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'expired';
  trialEndsAt?: string;
  nextBillingDate?: string;
  officeCount?: number;
}

export interface AppState {
  office: Office | null;
  currentEmployee: Employee | null;
  employees: Employee[];
  roles: Role[];
}

type MarketingView = 'landing' | 'pricing' | 'about' | 'features';
type AppView = 'marketing' | 'auth' | 'checkout' | 'office-select' | 'dashboard';

const PLAN_LIMITS = {
  starter: { offices: 1, members: 10, features: ['basic'] },
  professional: { offices: 5, members: 50, features: ['basic', 'advanced'] },
  enterprise: { offices: 999, members: 999, features: ['basic', 'advanced', 'enterprise'] }
};

export function getPlanFeatures(plan: string): string[] {
  return PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]?.features || ['basic'];
}

export function canCreateOffice(subscription: Subscription | null, currentOfficeCount: number): boolean {
  if (!subscription || subscription.status === 'expired') return false;
  const limit = PLAN_LIMITS[subscription.plan]?.offices || 0;
  return currentOfficeCount < limit;
}

export default function App() {
  const [view, setView] = useState<AppView>('marketing');
  const [marketingView, setMarketingView] = useState<MarketingView>('landing');
  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'professional' | 'enterprise' | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [appState, setAppState] = useState<AppState>({
    office: null,
    currentEmployee: null,
    employees: [],
    roles: []
  });

  useEffect(() => {
    const supabase = createClient();
    
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

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAuthToken(session.access_token);
        setUserName(session.user.user_metadata?.name || session.user.email || 'User');
        checkSubscription();
      } else {
        setAuthToken(null);
        setUserName(null);
        setView('marketing');
        setMarketingView('landing');
      }
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const checkSubscription = () => {
    const stored = localStorage.getItem('buziz:subscription');
    if (stored) {
      const sub = JSON.parse(stored);
      // Check if trial or subscription expired
      if (sub.trialEndsAt && new Date(sub.trialEndsAt) < new Date()) {
        sub.status = 'expired';
      }
      setSubscription(sub);
    }
  };

  const handleAuthSuccess = (newSession: any) => {
    setSession(newSession);
    setAuthToken(newSession.access_token);
    setUserName(newSession.user.user_metadata?.name || newSession.user.email || 'User');
    checkSubscription();
    setView('office-select');
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
    setAppState({ office: null, currentEmployee: null, employees: [], roles: [] });
    setView('marketing');
    setMarketingView('landing');
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

  if (view === 'marketing') {
    return (
      <>
        <MarketingPages
          currentView={marketingView}
          onNavigate={setMarketingView}
          onGetStarted={() => setView('auth')}
          onLogin={() => setView('auth')}
          onSelectPlan={handleSelectPlan}
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
          onCancel={() => setView('marketing')}
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
        <OfficeSelector
          userName={userName!}
          subscription={subscription}
          onComplete={handleOfficeSelected}
          onNeedSubscription={() => {
            setMarketingView('pricing');
            setView('marketing');
          }}
        />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <Dashboard
        appState={appState}
        setAppState={setAppState}
        subscription={subscription}
        onLogout={handleLogout}
        onBackToOfficeSelect={() => setView('office-select')}
      />
      <Toaster />
    </>
  );
}