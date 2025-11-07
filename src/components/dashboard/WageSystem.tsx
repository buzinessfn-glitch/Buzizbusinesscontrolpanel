import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { DollarSign, Plus, Edit, Trash, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface WageSettings {
  id: string;
  employeeId: string;
  basePayRate: number;
  overtimePaid: boolean;
  overtimeRate: number; // multiplier (1.5 = time and a half)
  maxHoursPerDay?: number;
  maxHoursPerWeek?: number;
  autoClockOutWarning: boolean;
  weekendMultiplier: number; // 1.5 = 150% on weekends
  customDayMultipliers: { day: string; multiplier: number }[]; // specific dates
  bonuses: { id: string; amount: number; reason: string; date: string; paid: boolean }[];
  travelPayments: { id: string; amount: number; destination: string; date: string; paid: boolean }[];
}

interface WageSystemProps {
  appState: AppState;
}

export function WageSystem({ appState }: WageSystemProps) {
  const [wageSettings, setWageSettings] = useState<WageSettings[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [editingSettings, setEditingSettings] = useState<WageSettings | null>(null);
  const [bonusDialogOpen, setBonusDialogOpen] = useState(false);
  const [travelDialogOpen, setTravelDialogOpen] = useState(false);

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager ||
                     appState.roles.find(r => r.name === appState.currentEmployee?.role)?.permissions.includes('all');

  useEffect(() => {
    loadWageSettings();
  }, [appState.office]);

  const loadWageSettings = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'wage-settings');
      setWageSettings(data.data || []);
    } catch (error) {
      console.error('Error loading wage settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!appState.office || !appState.currentEmployee) return;
    
    if (!selectedEmployee && !editingSettings) {
      toast.error('Please select an employee');
      return;
    }

    try {
      const employee = appState.employees.find(e => e.id === selectedEmployee);
      const newSettings: WageSettings = editingSettings || {
        id: crypto.randomUUID(),
        employeeId: selectedEmployee,
        basePayRate: employee?.payRate || 0,
        overtimePaid: true,
        overtimeRate: 1.5,
        autoClockOutWarning: true,
        weekendMultiplier: 1.0,
        customDayMultipliers: [],
        bonuses: [],
        travelPayments: []
      };

      const updated = editingSettings 
        ? wageSettings.map(w => w.id === editingSettings.id ? newSettings : w)
        : [...wageSettings, newSettings];

      await updateData(appState.office.id, 'wage-settings', updated);
      
      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        editingSettings ? 'Wage Settings Updated' : 'Wage Settings Created',
        `Updated settings for ${employee?.name}`,
        'admin'
      );

      toast.success('Wage settings saved');
      setDialogOpen(false);
      setEditingSettings(null);
      setSelectedEmployee('');
      loadWageSettings();
    } catch (error) {
      console.error('Error saving wage settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleAddBonus = async (employeeId: string, amount: number, reason: string) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const settings = wageSettings.find(w => w.employeeId === employeeId);
      if (!settings) return;

      const newBonus = {
        id: crypto.randomUUID(),
        amount,
        reason,
        date: new Date().toISOString(),
        paid: false
      };

      settings.bonuses.push(newBonus);
      const updated = wageSettings.map(w => w.id === settings.id ? settings : w);
      await updateData(appState.office.id, 'wage-settings', updated);

      const employee = appState.employees.find(e => e.id === employeeId);
      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Bonus Added',
        `$${amount} bonus for ${employee?.name}: ${reason}`,
        'admin'
      );

      toast.success('Bonus added');
      setBonusDialogOpen(false);
      loadWageSettings();
    } catch (error) {
      console.error('Error adding bonus:', error);
      toast.error('Failed to add bonus');
    }
  };

  const handleMarkBonusPaid = async (employeeId: string, bonusId: string) => {
    if (!appState.office) return;

    try {
      const settings = wageSettings.find(w => w.employeeId === employeeId);
      if (!settings) return;

      settings.bonuses = settings.bonuses.map(b => 
        b.id === bonusId ? { ...b, paid: true } : b
      );

      const updated = wageSettings.map(w => w.id === settings.id ? settings : w);
      await updateData(appState.office.id, 'wage-settings', updated);

      toast.success('Bonus marked as paid');
      loadWageSettings();
    } catch (error) {
      console.error('Error marking bonus paid:', error);
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only managers can configure wage settings</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Advanced Wage System</h1>
          <p className="text-gray-600">Manage overtime, bonuses, and pay multipliers</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Configure Employee
        </Button>
      </div>

      {/* Employee Wage Settings */}
      <div className="grid md:grid-cols-2 gap-4">
        {wageSettings.map(settings => {
          const employee = appState.employees.find(e => e.id === settings.employeeId);
          if (!employee) return null;

          const unpaidBonuses = settings.bonuses.filter(b => !b.paid);
          const unpaidTravel = settings.travelPayments.filter(t => !t.paid);

          return (
            <Card key={settings.id} className="p-4 border-2 border-black">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-black mb-1">{employee.name}</h3>
                  <Badge variant="outline">{employee.role}</Badge>
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    setEditingSettings(settings);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Base Rate:</span>
                  <span className="text-black">${settings.basePayRate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Overtime:</span>
                  <span className="text-black">
                    {settings.overtimePaid ? `${settings.overtimeRate}x` : 'Unpaid'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Weekend Pay:</span>
                  <span className="text-black">{settings.weekendMultiplier}x</span>
                </div>
                {settings.maxHoursPerWeek && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Max Hours/Week:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-black">{settings.maxHoursPerWeek}h</span>
                      {settings.autoClockOutWarning && (
                        <AlertCircle className="w-3 h-3 text-yellow-500" />
                      )}
                    </div>
                  </div>
                )}
                {(unpaidBonuses.length > 0 || unpaidTravel.length > 0) && (
                  <div className="pt-2 border-t border-gray-200">
                    {unpaidBonuses.length > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Pending Bonuses:</span>
                        <span>${unpaidBonuses.reduce((sum, b) => sum + b.amount, 0)}</span>
                      </div>
                    )}
                    {unpaidTravel.length > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Travel Pay:</span>
                        <span>${unpaidTravel.reduce((sum, t) => sum + t.amount, 0)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedEmployee(employee.id);
                    setBonusDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Bonus
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedEmployee(employee.id);
                    setTravelDialogOpen(true);
                  }}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Travel
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {wageSettings.length === 0 && (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No Wage Settings</h3>
          <p className="text-gray-600">Configure employee wage settings to get started</p>
        </Card>
      )}

      {/* Configure Settings Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Wage Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {!editingSettings && (
              <div>
                <Label>Select Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {appState.employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Base Pay Rate ($/hr)</Label>
                <Input
                  type="number"
                  value={editingSettings?.basePayRate || 0}
                  onChange={(e) => editingSettings && setEditingSettings({
                    ...editingSettings,
                    basePayRate: parseFloat(e.target.value) || 0
                  })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Overtime Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={editingSettings?.overtimeRate || 1.5}
                  onChange={(e) => editingSettings && setEditingSettings({
                    ...editingSettings,
                    overtimeRate: parseFloat(e.target.value) || 1.5
                  })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Paid Overtime</Label>
              <Switch
                checked={editingSettings?.overtimePaid || false}
                onCheckedChange={(checked) => editingSettings && setEditingSettings({
                  ...editingSettings,
                  overtimePaid: checked
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Hours/Day (optional)</Label>
                <Input
                  type="number"
                  value={editingSettings?.maxHoursPerDay || ''}
                  onChange={(e) => editingSettings && setEditingSettings({
                    ...editingSettings,
                    maxHoursPerDay: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="No limit"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Max Hours/Week (optional)</Label>
                <Input
                  type="number"
                  value={editingSettings?.maxHoursPerWeek || ''}
                  onChange={(e) => editingSettings && setEditingSettings({
                    ...editingSettings,
                    maxHoursPerWeek: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="No limit"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Clock-Out Warning</Label>
                <p className="text-xs text-gray-500">Warn when approaching max hours</p>
              </div>
              <Switch
                checked={editingSettings?.autoClockOutWarning || false}
                onCheckedChange={(checked) => editingSettings && setEditingSettings({
                  ...editingSettings,
                  autoClockOutWarning: checked
                })}
              />
            </div>

            <div>
              <Label>Weekend Pay Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                value={editingSettings?.weekendMultiplier || 1.0}
                onChange={(e) => editingSettings && setEditingSettings({
                  ...editingSettings,
                  weekendMultiplier: parseFloat(e.target.value) || 1.0
                })}
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">1.0 = normal, 1.5 = 150% on weekends</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingSettings(null);
                  setSelectedEmployee('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSettings}
                className="flex-1 bg-black text-white hover:bg-gray-800"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
