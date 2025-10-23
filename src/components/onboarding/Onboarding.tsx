import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Briefcase, Users } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface OnboardingProps {
  onComplete: (state: AppState) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [name, setName] = useState('');
  const [officeCode, setOfficeCode] = useState('');

  const generateOfficeCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateOffice = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const officeId = crypto.randomUUID();
    const employeeId = crypto.randomUUID();
    const code = generateOfficeCode();

    const newState: AppState = {
      office: {
        id: officeId,
        code: code,
        creatorId: employeeId,
        name: `${name}'s Office`
      },
      currentEmployee: {
        id: employeeId,
        name: name,
        employeeNumber: '00001',
        role: 'Owner',
        isCreator: true,
        isHeadManager: true
      },
      employees: [{
        id: employeeId,
        name: name,
        employeeNumber: '00001',
        role: 'Owner',
        isCreator: true,
        isHeadManager: true
      }],
      roles: [
        { id: '1', name: 'Owner', permissions: ['all'] },
        { id: '2', name: 'Manager', permissions: ['manage_shifts', 'manage_tasks', 'view_inventory'] },
        { id: '3', name: 'Cashier', permissions: ['view_shifts', 'view_tasks'] },
        { id: '4', name: 'Technician', permissions: ['view_shifts', 'manage_tasks'] }
      ]
    };

    toast.success(`Office created! Your code is: ${code}`);
    onComplete(newState);
  };

  const handleJoinOffice = () => {
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!officeCode.trim()) {
      toast.error('Please enter an office code');
      return;
    }

    // In a real app, this would validate the code against a backend
    // For demo purposes, we'll simulate joining
    toast.error('Office code not found. Create your own office to get started!');
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-white mb-2">Buziz</h1>
            <p className="text-gray-400">Business Control Panel</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('create')}>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-black">Create an Office</h2>
                <p className="text-gray-600">
                  Start your own organization and invite team members to join
                </p>
              </div>
            </Card>

            <Card className="p-8 bg-white border-2 border-black hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setMode('join')}>
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
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setMode('select')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateOffice}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Create Office
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
            <Label htmlFor="join-name">Your Name</Label>
            <Input
              id="join-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="code">Office Code</Label>
            <Input
              id="code"
              value={officeCode}
              onChange={(e) => setOfficeCode(e.target.value.toUpperCase())}
              placeholder="Enter office code"
              className="mt-1.5"
              maxLength={6}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleJoinOffice}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              Join Office
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
