import { useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  CheckSquare, 
  Package, 
  Users, 
  Megaphone, 
  Truck,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Shield,
  FileText
} from 'lucide-react';
import { Button } from '../ui/button';
import { Overview } from './Overview';
import { Shifts } from './Shifts';
import { Tasks } from './Tasks';
import { Inventory } from './Inventory';
import { Staff } from './Staff';
import { Announcements } from './Announcements';
import { Suppliers } from './Suppliers';
import { SettingsPanel } from './SettingsPanel';
import { TimeTracking } from './TimeTracking';
import { RolesManagement } from './RolesManagement';
import { ActivityLogs } from './ActivityLogs';
import type { AppState } from '../../App';

interface DashboardProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
  onLogout: () => void;
  onBackToAuth: () => void;
}

type View = 'overview' | 'time-tracking' | 'shifts' | 'tasks' | 'inventory' | 'staff' | 'announcements' | 'suppliers' | 'roles' | 'activity-logs' | 'settings';

export function Dashboard({ appState, setAppState, onLogout, onBackToAuth }: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'time-tracking', label: 'Time Clock', icon: Clock },
    { id: 'shifts', label: 'Shifts', icon: Calendar },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'suppliers', label: 'Suppliers', icon: Truck },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'roles', label: 'Roles', icon: Shield },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
    { id: 'activity-logs', label: 'Activity Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderView = () => {
    switch (currentView) {
      case 'overview':
        return <Overview appState={appState} />;
      case 'time-tracking':
        return <TimeTracking appState={appState} />;
      case 'shifts':
        return <Shifts appState={appState} setAppState={setAppState} />;
      case 'tasks':
        return <Tasks appState={appState} setAppState={setAppState} />;
      case 'inventory':
        return <Inventory appState={appState} setAppState={setAppState} />;
      case 'staff':
        return <Staff appState={appState} setAppState={setAppState} />;
      case 'announcements':
        return <Announcements appState={appState} setAppState={setAppState} />;
      case 'suppliers':
        return <Suppliers appState={appState} setAppState={setAppState} />;
      case 'roles':
        return <RolesManagement appState={appState} setAppState={setAppState} />;
      case 'activity-logs':
        return <ActivityLogs appState={appState} />;
      case 'settings':
        return <SettingsPanel appState={appState} setAppState={setAppState} />;
      default:
        return <Overview appState={appState} />;
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-black text-white border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-white mb-1">Buziz</h1>
          <p className="text-yellow-400 text-sm">{appState.office?.name}</p>
          <p className="text-gray-500 text-xs mt-1">
            {appState.currentEmployee?.name} • #{appState.currentEmployee?.employeeNumber}
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                    : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <Button
            variant="ghost"
            onClick={onBackToAuth}
            className="w-full justify-start text-gray-300 hover:bg-gray-900 hover:text-white"
          >
            <Users className="w-5 h-5 mr-3" />
            Switch Office
          </Button>
          <Button
            variant="ghost"
            onClick={onLogout}
            className="w-full justify-start text-gray-300 hover:bg-gray-900 hover:text-white"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black z-50 md:hidden overflow-y-auto">
          <div className="flex flex-col min-h-full">
            <div className="p-6 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <div>
                <h1 className="text-white mb-1">Buziz</h1>
                <p className="text-yellow-400 text-sm">{appState.office?.name}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === item.id
                        ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black'
                        : 'text-gray-300 hover:bg-gray-900 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-800 flex-shrink-0 space-y-2">
              <Button
                variant="ghost"
                onClick={onBackToAuth}
                className="w-full justify-start text-gray-300 hover:bg-gray-900 hover:text-white"
              >
                <Users className="w-5 h-5 mr-3" />
                Switch Office
              </Button>
              <Button
                variant="ghost"
                onClick={onLogout}
                className="w-full justify-start text-gray-300 hover:bg-gray-900 hover:text-white"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h2 className="text-black">Buziz</h2>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {renderView()}
        </div>
      </div>
    </div>
  );
}