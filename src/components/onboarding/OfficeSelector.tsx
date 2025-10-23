import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Briefcase, Users, Plus, Building } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { createOffice, joinOffice, getUserOffices } from '../../utils/api';
import type { AppState } from '../../App';

interface OfficeSelectorProps {
  userName: string;
  onComplete: (state: AppState) => void;
}

export function OfficeSelector({ userName, onComplete }: OfficeSelectorProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join' | 'loading'>('loading');
  const [offices, setOffices] = useState<any[]>([]);
  const [officeName, setOfficeName] = useState('');
  const [officeCode, setOfficeCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOffices();
  }, []);

  const loadOffices = async () => {
    try {
      const data = await getUserOffices();
      setOffices(data.offices || []);
      setMode('select');
    } catch (error) {
      console.error('Error loading offices:', error);
      setMode('select');
    }
  };

  const handleCreateOffice = async () => {
    if (!officeName.trim()) {
      toast.error('Please enter an office name');
      return;
    }

    setLoading(true);
    try {
      const data = await createOffice(userName, officeName);
      
      const newState: AppState = {
        office: data.office,
        currentEmployee: { ...data.employee, payRate: 0 },
        employees: [{ ...data.employee, payRate: 0 }],
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
            <p className="text-gray-400">Select an office or create a new one</p>
          </div>

          {offices.length > 0 && (
            <div className="mb-8">
              <h2 className="text-white mb-4">Your Offices</h2>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {offices.map((officeData) => (
                  <Card
                    key={officeData.office.id}
                    className="p-6 bg-white border-2 border-black hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleSelectOffice(officeData)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-6 h-6" />
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
              className="p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setMode('create')}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
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
        <Card className="w-full max-w-md p-8 bg-white border-2 border-black">
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
                className="flex-1 bg-black text-white hover:bg-gray-800"
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
