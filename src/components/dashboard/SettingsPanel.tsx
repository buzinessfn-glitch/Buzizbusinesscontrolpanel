import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState, Role } from '../../App';

interface SettingsPanelProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function SettingsPanel({ appState, setAppState }: SettingsPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roleName, setRoleName] = useState('');

  const handleAddRole = () => {
    if (!roleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    const newRole: Role = {
      id: crypto.randomUUID(),
      name: roleName,
      permissions: ['view_shifts', 'view_tasks']
    };

    setAppState({
      ...appState,
      roles: [...appState.roles, newRole]
    });

    toast.success('Role created successfully');
    setDialogOpen(false);
    setRoleName('');
  };

  const handleDeleteRole = (roleId: string) => {
    // Don't allow deleting Owner role
    const role = appState.roles.find(r => r.id === roleId);
    if (role?.name === 'Owner') {
      toast.error('Cannot delete Owner role');
      return;
    }

    // Check if any employees have this role
    const employeesWithRole = appState.employees.filter(e => e.role === role?.name);
    if (employeesWithRole.length > 0) {
      toast.error(`Cannot delete role. ${employeesWithRole.length} employee(s) have this role.`);
      return;
    }

    setAppState({
      ...appState,
      roles: appState.roles.filter(r => r.id !== roleId)
    });

    toast.success('Role deleted');
  };

  const isCreatorOrHead = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  if (!isCreatorOrHead) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only creators and head managers can access settings</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-black mb-1">Settings</h1>
        <p className="text-gray-600">Manage roles and office configuration</p>
      </div>

      {/* Office Information */}
      <Card className="p-6 border-2 border-black">
        <h3 className="text-black mb-4">Office Information</h3>
        <div className="space-y-3">
          <div>
            <Label>Office Name</Label>
            <p className="text-black mt-1">{appState.office?.name}</p>
          </div>
          <div>
            <Label>Office Code</Label>
            <p className="text-black mt-1">{appState.office?.code}</p>
          </div>
          <div>
            <Label>Total Employees</Label>
            <p className="text-black mt-1">{appState.employees.length}</p>
          </div>
        </div>
      </Card>

      {/* Role Management */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-black">Role Management</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create New Role</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input
                    id="roleName"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., Supervisor"
                    className="mt-1.5"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleAddRole} className="flex-1 bg-black text-white hover:bg-gray-800">
                    Create Role
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-3">
          {appState.roles.map(role => (
            <Card key={role.id} className="p-4 border-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-black mb-1">{role.name}</h4>
                  <p className="text-gray-600 text-sm">
                    {appState.employees.filter(e => e.role === role.name).length} employee(s)
                  </p>
                </div>
                {role.name !== 'Owner' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <Card className="p-6 border-2 border-black">
        <h3 className="text-black mb-4">Data Management</h3>
        <div className="space-y-3">
          <div>
            <Label>Storage</Label>
            <p className="text-gray-600 text-sm mt-1">All data is stored locally in your browser</p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm('Are you sure? This will clear all data and you will be logged out.')) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="border-black hover:bg-gray-100"
          >
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card className="p-6 border-2 border-black bg-gray-50">
        <h3 className="text-black mb-2">About Buziz</h3>
        <p className="text-gray-600 text-sm">
          Buziz is a lightweight business control panel for managing shifts, tasks, inventory, 
          and team collaboration. This is a frontend demo using localStorage for data persistence.
        </p>
      </Card>
    </div>
  );
}
