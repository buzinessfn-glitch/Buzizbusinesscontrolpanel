import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Calendar, Plus, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface TimeOffBalance {
  employeeId: string;
  vacationDays: number;
  sickDays: number;
  personalDays: number;
  accrualRate: number; // days per month
  lastAccrual: string;
}

interface TimeOffBalanceProps {
  appState: AppState;
}

export function TimeOffBalance({ appState }: TimeOffBalanceProps) {
  const [balances, setBalances] = useState<TimeOffBalance[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [vacationDays, setVacationDays] = useState(0);
  const [sickDays, setSickDays] = useState(0);
  const [personalDays, setPersonalDays] = useState(0);
  const [accrualRate, setAccrualRate] = useState(1.25);

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager ||
                     appState.roles.find(r => r.name === appState.currentEmployee?.role)?.permissions.includes('all');

  useEffect(() => {
    loadBalances();
  }, [appState.office]);

  const loadBalances = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'time-off-balances');
      let balances = data.data || [];
      
      // Auto-accrue for all employees
      balances = balances.map(balance => accrueTimeOff(balance));
      
      setBalances(balances);
      await updateData(appState.office.id, 'time-off-balances', balances);
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const accrueTimeOff = (balance: TimeOffBalance): TimeOffBalance => {
    const lastAccrual = new Date(balance.lastAccrual);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - lastAccrual.getFullYear()) * 12 + 
                       (now.getMonth() - lastAccrual.getMonth());

    if (monthsDiff > 0) {
      const accrued = monthsDiff * balance.accrualRate;
      return {
        ...balance,
        vacationDays: balance.vacationDays + accrued,
        lastAccrual: now.toISOString()
      };
    }

    return balance;
  };

  const handleSetBalance = async () => {
    if (!appState.office || !appState.currentEmployee || !selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const existingBalance = balances.find(b => b.employeeId === selectedEmployee);
      const newBalance: TimeOffBalance = {
        employeeId: selectedEmployee,
        vacationDays,
        sickDays,
        personalDays,
        accrualRate,
        lastAccrual: new Date().toISOString()
      };

      const updated = existingBalance
        ? balances.map(b => b.employeeId === selectedEmployee ? newBalance : b)
        : [...balances, newBalance];

      await updateData(appState.office.id, 'time-off-balances', updated);

      const employee = appState.employees.find(e => e.id === selectedEmployee);
      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Time Off Balance Set',
        `Set balance for ${employee?.name}`,
        'admin'
      );

      toast.success('Balance updated');
      setDialogOpen(false);
      loadBalances();
    } catch (error) {
      console.error('Error setting balance:', error);
      toast.error('Failed to update balance');
    }
  };

  const myBalance = balances.find(b => b.employeeId === appState.currentEmployee?.id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Time Off Balance
          </h1>
          <p className="text-gray-600">Track accrued vacation and leave days</p>
        </div>
        {canManage && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Set Balance
          </Button>
        )}
      </div>

      {/* My Balance */}
      {myBalance && (
        <Card className="p-6 border-2 border-green-500 bg-green-50">
          <h3 className="text-black mb-4">Your Available Time Off</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl text-white">{myBalance.vacationDays.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-700">Vacation Days</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl text-white">{myBalance.sickDays.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-700">Sick Days</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl text-white">{myBalance.personalDays.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-700">Personal Days</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span>Accruing {myBalance.accrualRate} vacation days/month</span>
          </div>
        </Card>
      )}

      {/* All Employee Balances (Managers) */}
      {canManage && (
        <div>
          <h2 className="text-black mb-3">Team Balances</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {balances.map(balance => {
              const employee = appState.employees.find(e => e.id === balance.employeeId);
              if (!employee) return null;

              return (
                <Card key={balance.employeeId} className="p-4 border-2 border-black">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-black">{employee.name}</h4>
                      <Badge variant="outline">{employee.role}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEmployee(employee.id);
                        setVacationDays(balance.vacationDays);
                        setSickDays(balance.sickDays);
                        setPersonalDays(balance.personalDays);
                        setAccrualRate(balance.accrualRate);
                        setDialogOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <p className="text-2xl text-blue-600">{balance.vacationDays.toFixed(1)}</p>
                      <p className="text-gray-600">Vacation</p>
                    </div>
                    <div>
                      <p className="text-2xl text-red-600">{balance.sickDays.toFixed(1)}</p>
                      <p className="text-gray-600">Sick</p>
                    </div>
                    <div>
                      <p className="text-2xl text-purple-600">{balance.personalDays.toFixed(1)}</p>
                      <p className="text-gray-600">Personal</p>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-500 text-center">
                    Accrual: {balance.accrualRate}/mo
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {balances.length === 0 && (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No Balances Set</h3>
          <p className="text-gray-600">Set time off balances to start tracking</p>
        </Card>
      )}

      {/* Set Balance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Time Off Balance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Employee</Label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full mt-1.5 p-2 border border-gray-300 rounded-md"
              >
                <option value="">Choose employee...</option>
                {appState.employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} - {emp.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Vacation Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={vacationDays}
                  onChange={(e) => setVacationDays(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Sick Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={sickDays}
                  onChange={(e) => setSickDays(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Personal Days</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={personalDays}
                  onChange={(e) => setPersonalDays(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Accrual Rate (days/month)</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={accrualRate}
                  onChange={(e) => setAccrualRate(parseFloat(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSetBalance} className="flex-1 bg-black text-white">
                Save Balance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
