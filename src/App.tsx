import { useState, useEffect } from 'react';
import { Auth } from './components/auth/Auth';
import { OfficeSelector } from './components/onboarding/OfficeSelector';
import { Dashboard } from './components/dashboard/Dashboard';
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
}

export interface AppState {
  office: Office | null;
  currentEmployee: Employee | null;
  employees: Employee[];
  roles: Role[];
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setAuthToken(session.access_token);
        setUserName(session.user.user_metadata?.name || session.user.email || 'User');
      } else {
        setAuthToken(null);
        setUserName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (newSession: any) => {
    setSession(newSession);
    setAuthToken(newSession.access_token);
    setUserName(newSession.user.user_metadata?.name || newSession.user.email || 'User');
  };

  const handleOfficeSelected = (state: AppState) => {
    setAppState(state);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {!session ? (
        <Auth onAuthSuccess={handleAuthSuccess} />
      ) : !appState.office || !appState.currentEmployee ? (
        <OfficeSelector userName={userName!} onComplete={handleOfficeSelected} />
      ) : (
        <Dashboard appState={appState} setAppState={setAppState} onLogout={handleLogout} />
      )}
      <Toaster />
    </div>
  );
}