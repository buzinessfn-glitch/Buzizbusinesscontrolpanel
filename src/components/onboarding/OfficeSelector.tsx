import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Briefcase, Users, Plus, Building, AlertCircle, Crown } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { createOffice, joinOffice, getUserOffices, isUsingLocalStorage } from '../../utils/storage';
import { canCreateOffice, type Subscription } from '../../App';
import type { AppState } from '../../App';

interface OfficeSelectorProps {
  userName: string;
  subscription: Subscription | null;
  onComplete: (state: AppState) => void;
  onNeedSubscription: () => void;
}

export function OfficeSelector({ userName, subscription, onComplete, onNeedSubscription }: OfficeSelectorProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'loading'>('loading');
  const [offices, setOffices] = useState<any[]>([]);
  const [officeName, setOfficeName] = useState('');
  const [officeCode, setOfficeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    try {
      const data = await getUserOffices();
      setOffices(data.offices || []);
      setUsingLocalStorage(isUsingLocalStorage());
      setMode('select');
    } catch (error) {
      console.error('Error loading offices:', error);
      setMode('select');
    }
  };

  const handleCreateOffice = async () => {
    // Check subscription before creating office
    if (!subscription) {
      toast.error('You need a subscription to create an office');
      onNeedSubscription();
      return;
    }

    if (subscription.status === 'expired') {
      toast.error('Your subscription has expired. Please renew to create offices.');
      onNeedSubscription();
      return;
    }

    if (!canCreateOffice(subscription, offices.length)) {
      toast.error(`Your ${subscription.plan} plan allows only ${subscription.plan === 'starter' ? '1 office' : subscription.plan === 'professional' ? '5 offices' : 'unlimited offices'}. Upgrade to create more.`);
      onNeedSubscription();
      return;
    }

    if (!officeName.trim()) {
      toast.error('Please enter an office name');
      return;
    }

    setLoading(true);
    try {
      const data = await createOffice(userName, officeName);
      
      const newState: AppState = {
        office: data.office,
        currentEmployee: { ...data.employee, payRate: 0, status: 'available' },
        employees: [{ ...data.employee, payRate: 0, status: 'offline' }],
        roles: data.roles
      };

      toast.success(`Office created! Code: ${data.office.code}`);
      onComplete(newState);
    } catch (error: any) {
      console.error('Create office error:', error);
      toast.error(error.message || 'Failed to create office');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOffice = async () => {
    if (!officeCode.trim()) {
      toast.error('Please enter an office code');
      return;
    }

    setLoading(true);
    try {
      const data = await joinOffice(officeCode, userName);
      
      const newState: AppState = {
        office: data.office,
        currentEmployee: { ...data.employee, payRate: data.employee.payRate || 0 },
        employees: data.employees.map((e: any) => ({ ...e, payRate: e.payRate || 0 })),
        roles: data.roles
      };

      toast.success('Successfully joined office!');
      onComplete(newState);
    } catch (error: any) {
      console.error('Join office error:', error);
      toast.error(error.message || 'Failed to join office');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOffice = (officeData: any) => {
    const newState: AppState = {
      office: officeData.office,
      currentEmployee: { ...officeData.employee, payRate: officeData.employee.payRate || 0 },
      employees: officeData.employees.map((e: any) => ({ ...e, payRate: e.payRate || 0 })),
      roles: officeData.roles
    };
    onComplete(newState);
  };

  if (mode === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Loading offices...</p>
      </div>
    );
  }

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-white mb-2">Welcome, {userName}!</h1>
            <p className="text-yellow-400">Select an office or create a new one</p>
          </div>

          {usingLocalStorage && (
            <Card className="p-4 mb-6 bg-yellow-50 border-2 border-yellow-400">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-900">
                  Using offline mode. Data is stored locally on this device.
                </p>
              </div>
            </Card>
          )}

          {offices.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white mb-4">Your Offices</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {offices.map((officeData) => (
                  <Card
                    key={officeData.office.id}
                    className="p-6 bg-white border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/50 transition-all cursor-pointer"
                    onClick={() => handleSelectOffice(officeData)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-black" />
                      </div>
                      <h3 className="text-black">{officeData.office.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {officeData.employee.role} • #{officeData.employee.employeeNumber}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card
              className="p-8 bg-white border-2 border-yellow-400 hover:shadow-lg hover:shadow-yellow-400/50 transition-all cursor-pointer"
              onClick={() => setMode('create')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-black">Create an Office</h2>
                <p className="text-gray-600">
                  Start your own organization and invite team members
                </p>
              </div>
            </Card>

            <Card
              className="p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setMode('join')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-black">Join an Office</h2>
                <p className="text-gray-600">
                  Enter an office code to join an existing organization
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Card className="w-full max-w-md p-8 bg-white border-2 border-yellow-400">
          <div className="mb-6">
            <h2 className="text-black mb-2">Create Your Office</h2>
            <p className="text-gray-600">You'll be assigned Employee #00001</p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="officeName">Office Name</Label>
              <Input
                id="officeName"
                value={officeName}
                onChange={(e) => setOfficeName(e.target.value)}
                placeholder="My Business"
                className="mt-1.5"
                disabled={loading}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateOffice}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Office'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md p-8 bg-white border-2 border-black">
        <div className="mb-6">
          <h2 className="text-black mb-2">Join an Office</h2>
          <p className="text-gray-600">Enter the office code provided by your manager</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Office Code</Label>
            <Input
              id="code"
              value={officeCode}
              onChange={(e) => setOfficeCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              className="mt-1.5"
              maxLength={6}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              className="flex-1"
              disabled={loading}
            >
              Back
            </Button>
            <Button
              onClick={handleJoinOffice}
              className="flex-1 bg-black text-white hover:bg-gray-800"
              disabled={loading}
            >
              {loading ? 'Joining...' : 'Join Office'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}