import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, Plus, Crown, Shield, Copy, Check, DollarSign, Clock, Coffee, Activity, XCircle, UserCog } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { updateEmployee } from '../../utils/api';
import { getData, updateData } from '../../utils/storage';
import type { AppState, Employee } from '../../App';

interface StaffProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

interface EmployeeStatus {
  employeeId: string;
  status: 'available' | 'dnd' | 'on-break' | 'offline' | 'clocked-in';
  clockedIn: boolean;
  onBreak: boolean;
  lastActive: string;
}

export function Staff({ appState, setAppState }: StaffProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [payRateDialogOpen, setPayRateDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newPayRate, setNewPayRate] = useState('');
  const [employeeStatuses, setEmployeeStatuses] = useState<Record<string, EmployeeStatus>>({});
  const [myStatus, setMyStatus] = useState<'available' | 'dnd'>('available');

  useEffect(() => {
    loadEmployeeStatuses();
    const interval = setInterval(loadEmployeeStatuses, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [appState.office]);

  const loadEmployeeStatuses = async () => {
    if (!appState.office) return;
    
    try {
      // Load all employee statuses
      const statusData = await getData(appState.office.id, 'employee-statuses');
      const statuses = statusData.data || {};
      
      // Load clock statuses
      const clockData = await getData(appState.office.id, 'clock-history');
      const clockHistory = clockData.data || [];
      
      // Update statuses with clock information
      const updatedStatuses: Record<string, EmployeeStatus> = {};
      
      appState.employees.forEach(emp => {
        const savedStatus = statuses[emp.id];
        const activeClock = clockHistory.find((c: any) => c.employeeId === emp.id && !c.clockOut);
        const onBreak = activeClock?.breaks?.some((b: any) => !b.endTime) || false;
        
        updatedStatuses[emp.id] = {
          employeeId: emp.id,
          status: onBreak ? 'on-break' : (activeClock ? 'clocked-in' : (savedStatus?.status || 'offline')),
          clockedIn: !!activeClock,
          onBreak: onBreak,
          lastActive: savedStatus?.lastActive || new Date().toISOString()
        };
      });
      
      setEmployeeStatuses(updatedStatuses);
      
      // Set my current status
      if (appState.currentEmployee && updatedStatuses[appState.currentEmployee.id]) {
        const myCurrentStatus = updatedStatuses[appState.currentEmployee.id].status;
        if (myCurrentStatus === 'available' || myCurrentStatus === 'dnd') {
          setMyStatus(myCurrentStatus);
        }
      }
    } catch (error) {
      console.error('Error loading employee statuses:', error);
    }
  };

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
      const updates = { role: newRole };
      const data = await updateEmployee(selectedEmployee.id, updates);
      
      setAppState({
        ...appState,
        employees: data.employees,
        currentEmployee: data.employees.find((e: Employee) => e.id === appState.currentEmployee?.id) || appState.currentEmployee
      });

      toast.success(`${selectedEmployee.name}'s role updated to ${newRole}`);
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

    try {
      const payRate = parseFloat(newPayRate);
      if (isNaN(payRate) || payRate < 0) {
        toast.error('Please enter a valid pay rate');
        return;
      }

      const updates = { payRate };
      const data = await updateEmployee(selectedEmployee.id, updates);
      
      setAppState({
        ...appState,
        employees: data.employees,
        currentEmployee: data.employees.find((e: Employee) => e.id === appState.currentEmployee?.id) || appState.currentEmployee
      });

      toast.success(`${selectedEmployee.name}'s pay rate updated to $${payRate}/hr`);
      setPayRateDialogOpen(false);
      setSelectedEmployee(null);
      setNewPayRate('');
    } catch (error: any) {
      console.error('Error updating pay rate:', error);
      toast.error(error.message || 'Failed to update pay rate');
    }
  };

  const handleStatusChange = async (newStatus: 'available' | 'dnd') => {
    if (!appState.currentEmployee || !appState.office) return;
    
    try {
      const statusData = await getData(appState.office.id, 'employee-statuses');
      const statuses = statusData.data || {};
      
      statuses[appState.currentEmployee.id] = {
        employeeId: appState.currentEmployee.id,
        status: newStatus,
        clockedIn: employeeStatuses[appState.currentEmployee.id]?.clockedIn || false,
        onBreak: employeeStatuses[appState.currentEmployee.id]?.onBreak || false,
        lastActive: new Date().toISOString()
      };
      
      await updateData(appState.office.id, 'employee-statuses', statuses);
      setMyStatus(newStatus);
      setStatusDialogOpen(false);
      
      toast.success(`Status set to ${newStatus === 'dnd' ? 'Do Not Disturb' : 'Available'}`);
      loadEmployeeStatuses();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (employeeId: string) => {
    const status = employeeStatuses[employeeId];
    if (!status) return null;

    const statusConfig = {
      'clocked-in': { label: 'Clocked In', color: 'bg-green-500', icon: Clock },
      'on-break': { label: 'On Break', color: 'bg-orange-500', icon: Coffee },
      'available': { label: 'Available', color: 'bg-blue-500', icon: Activity },
      'dnd': { label: 'Do Not Disturb', color: 'bg-red-500', icon: XCircle },
      'offline': { label: 'Offline', color: 'bg-gray-400', icon: XCircle }
    };

    const config = statusConfig[status.status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const canManageStaff = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  // Group employees by status
  const clockedInEmployees = appState.employees.filter(e => employeeStatuses[e.id]?.clockedIn && !employeeStatuses[e.id]?.onBreak);
  const onBreakEmployees = appState.employees.filter(e => employeeStatuses[e.id]?.onBreak);
  const offlineEmployees = appState.employees.filter(e => !employeeStatuses[e.id]?.clockedIn);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Staff Directory</h1>
          <p className="text-gray-600">Manage your team members</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setStatusDialogOpen(true)}
            variant="outline"
            className="border-2 border-black"
          >
            <UserCog className="w-4 h-4 mr-2" />
            Set Status
          </Button>
          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="border-2 border-black"
          >
            {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : `Code: ${appState.office?.code}`}
          </Button>
        </div>
      </div>

      {/* My Status */}
      <Card className="p-4 border-2 border-yellow-400 bg-yellow-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Your Status</p>
            <div className="flex items-center gap-2">
              {getStatusBadge(appState.currentEmployee?.id || '')}
            </div>
          </div>
          <Button onClick={() => setStatusDialogOpen(true)} size="sm" variant="outline">
            Change
          </Button>
        </div>
      </Card>

      {/* Status Overview - Only for managers */}
      {canManageStaff && (
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-6 border-2 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Clocked In</p>
                <p className="text-black text-2xl">{clockedInEmployees.length}</p>
              </div>
              <Clock className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          <Card className="p-6 border-2 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">On Break</p>
                <p className="text-black text-2xl">{onBreakEmployees.length}</p>
              </div>
              <Coffee className="w-8 h-8 text-orange-500" />
            </div>
          </Card>
          <Card className="p-6 border-2 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">Offline</p>
                <p className="text-black text-2xl">{offlineEmployees.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Employee List */}
      <div>
        <h3 className="text-black mb-4">All Team Members ({appState.employees.length})</h3>
        <div className="grid gap-3">
          {appState.employees.map(employee => {
            const role = appState.roles.find(r => r.name === employee.role);
            return (
              <Card key={employee.id} className="p-4 border-2 border-black">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-black">{employee.name}</h4>
                      {employee.isCreator && (
                        <Crown className="w-4 h-4 text-yellow-500" title="Creator" />
                      )}
                      {employee.isHeadManager && (
                        <Shield className="w-4 h-4 text-blue-500" title="Head Manager" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: role?.color || '#000',
                            color: role?.color || '#000'
                          }}
                        >
                          {employee.role}
                        </Badge>
                        <Badge variant="outline">#{employee.employeeNumber}</Badge>
                        {getStatusBadge(employee.id)}
                      </div>
                      {employee.payRate !== undefined && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${employee.payRate}/hr
                        </p>
                      )}
                    </div>
                  </div>
                  {canManageStaff && !employee.isCreator && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setNewRole(employee.role);
                          setDialogOpen(true);
                        }}
                        className="text-xs"
                      >
                        Change Role
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setNewPayRate(employee.payRate?.toString() || '');
                          setPayRateDialogOpen(true);
                        }}
                        className="text-xs"
                      >
                        Pay Rate
                      </Button>
                      {appState.currentEmployee?.isCreator && (
                        <Button
                          size="sm"
                          variant={employee.isHeadManager ? "default" : "outline"}
                          onClick={() => handlePromoteToHeadManager(employee)}
                          className="text-xs"
                        >
                          <Shield className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Change Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Role for {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {appState.roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleChangeRole} className="flex-1 bg-black text-white hover:bg-gray-800">
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay Rate Dialog */}
      <Dialog open={payRateDialogOpen} onOpenChange={setPayRateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Pay Rate for {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Hourly Pay Rate</Label>
              <div className="relative mt-1.5">
                <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  value={newPayRate}
                  onChange={(e) => setNewPayRate(e.target.value)}
                  placeholder="15.00"
                  step="0.01"
                  min="0"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setPayRateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdatePayRate} className="flex-1 bg-black text-white hover:bg-gray-800">
                Update Pay Rate
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Your Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Let your team know your availability</p>
            <div className="space-y-2">
              <Button
                onClick={() => handleStatusChange('available')}
                variant={myStatus === 'available' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <Activity className="w-4 h-4 mr-2" />
                Available
              </Button>
              <Button
                onClick={() => handleStatusChange('dnd')}
                variant={myStatus === 'dnd' ? 'default' : 'outline'}
                className="w-full justify-start"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Do Not Disturb
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Your status automatically changes to "Clocked In" when you clock in and "On Break" when taking a break.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}