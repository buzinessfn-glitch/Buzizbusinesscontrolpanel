import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Users, Plus, Crown, Shield, Copy, Check, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { updateEmployee } from '../../utils/api';
import type { AppState, Employee } from '../../App';

interface StaffProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Staff({ appState, setAppState }: StaffProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payRateDialogOpen, setPayRateDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPayRate, setNewPayRate] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appState.office?.code || '');
    setCopied(true);
    toast.success('Office code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePromoteToHeadManager = async (employee: Employee) => {
    try {
      const updates = { isHeadManager: !employee.isHeadManager };
      const data = await updateEmployee(employee.id, updates);
      
      setAppState({
        ...appState,
        employees: data.employees,
        currentEmployee: data.employees.find((e: Employee) => e.id === appState.currentEmployee?.id) || appState.currentEmployee
      });

      toast.success(employee.isHeadManager 
        ? `${employee.name} removed from Head Manager role`
        : `${employee.name} promoted to Head Manager`
      );
    } catch (error: any) {
      console.error('Error updating employee:', error);
      toast.error(error.message || 'Failed to update employee');
    }
  };

  const handleChangeRole = async () => {
    if (!selectedEmployee || !newRole) {
      toast.error('Please select a role');
      return;
    }

    try {
      const data = await updateEmployee(selectedEmployee.id, { role: newRole });
      
      setAppState({
        ...appState,
        employees: data.employees,
        currentEmployee: data.employees.find((e: Employee) => e.id === appState.currentEmployee?.id) || appState.currentEmployee
      });

      toast.success('Role updated successfully');
      setDialogOpen(false);
      setSelectedEmployee(null);
      setNewRole('');
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error(error.message || 'Failed to update role');
    }
  };

  const handleUpdatePayRate = async () => {
    if (!selectedEmployee || !newPayRate) {
      toast.error('Please enter a pay rate');
      return;
    }

    const payRate = parseFloat(newPayRate);
    if (isNaN(payRate) || payRate < 0) {
      toast.error('Please enter a valid pay rate');
      return;
    }

    try {
      const data = await updateEmployee(selectedEmployee.id, { payRate });
      
      setAppState({
        ...appState,
        employees: data.employees,
        currentEmployee: data.employees.find((e: Employee) => e.id === appState.currentEmployee?.id) || appState.currentEmployee
      });

      toast.success('Pay rate updated successfully');
      setPayRateDialogOpen(false);
      setSelectedEmployee(null);
      setNewPayRate('');
    } catch (error: any) {
      console.error('Error updating pay rate:', error);
      toast.error(error.message || 'Failed to update pay rate');
    }
  };

  const openRoleDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewRole(employee.role);
    setDialogOpen(true);
  };

  const openPayRateDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    setNewPayRate(String(employee.payRate || 0));
    setPayRateDialogOpen(true);
  };

  const isCurrentUserCreatorOrHead = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Staff Directory</h1>
          <p className="text-gray-600">View and manage team members</p>
        </div>
      </div>

      {/* Office Code Card */}
      <Card className="p-6 border-2 border-black bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-black mb-1">Office Code</h3>
            <p className="text-gray-600 text-sm mb-3">Share this code for others to join your office</p>
            <div className="flex items-center gap-3">
              <code className="text-2xl tracking-wider bg-white px-4 py-2 rounded border-2 border-black">
                {appState.office?.code}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                className="border-2 border-black"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Total Staff</p>
          <p className="text-black">{appState.employees.length}</p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Head Managers</p>
          <p className="text-black">{appState.employees.filter(e => e.isHeadManager).length}</p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Roles</p>
          <p className="text-black">{appState.roles.length}</p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Active</p>
          <p className="text-black">{appState.employees.length}</p>
        </Card>
      </div>

      {/* Employee List */}
      <div>
        <h3 className="text-black mb-4">Team Members</h3>
        <div className="grid gap-3">
          {appState.employees.map(employee => (
            <Card key={employee.id} className="p-4 border-2 border-black">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-black">{employee.name}</h4>
                      {employee.isCreator && (
                        <Badge className="bg-black text-white">
                          <Crown className="w-3 h-3 mr-1" />
                          Creator
                        </Badge>
                      )}
                      {employee.isHeadManager && !employee.isCreator && (
                        <Badge className="bg-gray-800 text-white">
                          <Shield className="w-3 h-3 mr-1" />
                          Head Manager
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>#{employee.employeeNumber}</span>
                      <span>•</span>
                      <span>{employee.role}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {employee.payRate?.toFixed(2) || '0.00'}/hr
                      </span>
                    </div>
                  </div>
                </div>

                {isCurrentUserCreatorOrHead && !employee.isCreator && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRoleDialog(employee)}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPayRateDialog(employee)}
                    >
                      Set Pay Rate
                    </Button>
                    {appState.currentEmployee?.isCreator && (
                      <Button
                        variant={employee.isHeadManager ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePromoteToHeadManager(employee)}
                        className={employee.isHeadManager ? 'bg-black text-white' : ''}
                      >
                        {employee.isHeadManager ? 'Remove Head' : 'Make Head'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Employee Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <p className="text-black mt-1.5">{selectedEmployee?.name}</p>
            </div>
            <div>
              <Label htmlFor="newRole">New Role</Label>
              <Input
                id="newRole"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="Enter role name"
                className="mt-1.5"
                list="roles-list"
              />
              <datalist id="roles-list">
                {appState.roles.map(role => (
                  <option key={role.id} value={role.name} />
                ))}
              </datalist>
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedEmployee(null);
                  setNewRole('');
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleChangeRole} 
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Set Pay Rate Dialog */}
      <Dialog open={payRateDialogOpen} onOpenChange={setPayRateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Set Pay Rate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <p className="text-black mt-1.5">{selectedEmployee?.name}</p>
            </div>
            <div>
              <Label htmlFor="payRate">Hourly Pay Rate ($)</Label>
              <Input
                id="payRate"
                type="number"
                step="0.01"
                min="0"
                value={newPayRate}
                onChange={(e) => setNewPayRate(e.target.value)}
                placeholder="15.00"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPayRateDialogOpen(false);
                  setSelectedEmployee(null);
                  setNewPayRate('');
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdatePayRate} 
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Update Pay Rate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}