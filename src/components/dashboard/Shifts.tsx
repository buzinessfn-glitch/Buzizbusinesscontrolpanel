import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Calendar, Plus, Trash2, Clock, Repeat, ArrowRightLeft } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: string;
  assignmentType: 'employee' | 'role';
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
}

interface RecurringPattern {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  assignedTo: string;
  assignmentType: 'employee' | 'role';
  pattern: 'weekly' | 'biweekly' | 'monthly';
  daysOfWeek: number[];
  startDate: string;
  endDate?: string;
  notes?: string;
}

interface ShiftTradeRequest {
  id: string;
  shiftId: string;
  fromEmployeeId: string;
  fromEmployeeName: string;
  toEmployeeId: string;
  toEmployeeName: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
}

interface ShiftsProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Shifts({ appState, setAppState }: ShiftsProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [recurringPatterns, setRecurringPatterns] = useState<RecurringPattern[]>([]);
  const [tradeRequests, setTradeRequests] = useState<ShiftTradeRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    assignedTo: '',
    assignmentType: 'employee' as 'employee' | 'role',
    notes: ''
  });
  const [recurringForm, setRecurringForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    assignedTo: '',
    assignmentType: 'employee' as 'employee' | 'role',
    pattern: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    daysOfWeek: [] as number[],
    startDate: '',
    endDate: '',
    notes: ''
  });
  const [tradeForm, setTradeForm] = useState({
    toEmployeeId: '',
    reason: ''
  });

  useEffect(() => {
    loadShifts();
    loadRecurringPatterns();
    loadTradeRequests();
  }, [appState.office]);

  useEffect(() => {
    // Generate shifts from recurring patterns
    if (recurringPatterns.length > 0) {
      generateRecurringShifts();
    }
  }, [recurringPatterns]);

  const loadShifts = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'shifts');
      setShifts(data.data || []);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const loadRecurringPatterns = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'recurring-patterns');
      setRecurringPatterns(data.data || []);
    } catch (error) {
      console.error('Error loading recurring patterns:', error);
    }
  };

  const loadTradeRequests = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'shift-trades');
      setTradeRequests(data.data || []);
    } catch (error) {
      console.error('Error loading trade requests:', error);
    }
  };

  const generateRecurringShifts = async () => {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90); // Generate 90 days ahead

    const generatedShifts: Shift[] = [];

    recurringPatterns.forEach(pattern => {
      const startDate = new Date(pattern.startDate);
      const endDate = pattern.endDate ? new Date(pattern.endDate) : futureDate;

      let currentDate = new Date(startDate);

      while (currentDate <= endDate && currentDate <= futureDate) {
        const dayOfWeek = currentDate.getDay();

        if (pattern.daysOfWeek.includes(dayOfWeek)) {
          const dateStr = currentDate.toISOString().split('T')[0];
          
          // Check if shift already exists for this date and pattern
          const exists = shifts.some(s => 
            s.date === dateStr && s.recurringId === pattern.id
          );

          if (!exists && currentDate >= today) {
            generatedShifts.push({
              id: crypto.randomUUID(),
              title: pattern.title,
              date: dateStr,
              startTime: pattern.startTime,
              endTime: pattern.endTime,
              assignedTo: pattern.assignedTo,
              assignmentType: pattern.assignmentType,
              notes: pattern.notes,
              isRecurring: true,
              recurringId: pattern.id
            });
          }
        }

        // Advance to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    if (generatedShifts.length > 0) {
      const updated = [...shifts, ...generatedShifts];
      await updateData(appState.office!.id, 'shifts', updated);
      setShifts(updated);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime || !formData.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newShift: Shift = {
      id: crypto.randomUUID(),
      ...formData
    };

    const updated = [...shifts, newShift];
    await updateData(appState.office!.id, 'shifts', updated);
    setShifts(updated);

    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      'Shift Created',
      `Created shift: ${formData.title} on ${formData.date}`,
      'admin'
    );

    toast.success('Shift created successfully');
    setDialogOpen(false);
    setFormData({ title: '', date: '', startTime: '', endTime: '', assignedTo: '', assignmentType: 'employee', notes: '' });
  };

  const handleRecurringSubmit = async () => {
    if (!recurringForm.title || !recurringForm.startTime || !recurringForm.endTime || !recurringForm.assignedTo || !recurringForm.startDate || recurringForm.daysOfWeek.length === 0) {
      toast.error('Please fill in all required fields and select at least one day');
      return;
    }

    const newPattern: RecurringPattern = {
      id: crypto.randomUUID(),
      ...recurringForm
    };

    const updated = [...recurringPatterns, newPattern];
    await updateData(appState.office!.id, 'recurring-patterns', updated);
    setRecurringPatterns(updated);

    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      'Recurring Shift Created',
      `Created recurring shift pattern: ${recurringForm.title}`,
      'admin'
    );

    toast.success('Recurring shift pattern created');
    setRecurringDialogOpen(false);
    setRecurringForm({ title: '', startTime: '', endTime: '', assignedTo: '', assignmentType: 'employee', pattern: 'weekly', daysOfWeek: [], startDate: '', endDate: '', notes: '' });
  };

  const handleDelete = async (id: string) => {
    const updated = shifts.filter(s => s.id !== id);
    await updateData(appState.office!.id, 'shifts', updated);
    setShifts(updated);
    toast.success('Shift deleted');
  };

  const handleTradeRequest = async () => {
    if (!selectedShift || !tradeForm.toEmployeeId || !tradeForm.reason) {
      toast.error('Please select an employee and provide a reason');
      return;
    }

    const toEmployee = appState.employees.find(e => e.id === tradeForm.toEmployeeId);
    if (!toEmployee) return;

    const newRequest: ShiftTradeRequest = {
      id: crypto.randomUUID(),
      shiftId: selectedShift.id,
      fromEmployeeId: appState.currentEmployee!.id,
      fromEmployeeName: appState.currentEmployee!.name,
      toEmployeeId: tradeForm.toEmployeeId,
      toEmployeeName: toEmployee.name,
      reason: tradeForm.reason,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    const updated = [...tradeRequests, newRequest];
    await updateData(appState.office!.id, 'shift-trades', updated);
    setTradeRequests(updated);

    toast.success('Trade request sent');
    setTradeDialogOpen(false);
    setSelectedShift(null);
    setTradeForm({ toEmployeeId: '', reason: '' });
  };

  const handleTradeApproval = async (requestId: string, approved: boolean) => {
    const request = tradeRequests.find(r => r.id === requestId);
    if (!request) return;

    if (approved) {
      // Swap shift assignment
      const updatedShifts = shifts.map(s =>
        s.id === request.shiftId
          ? { ...s, assignedTo: request.toEmployeeId, assignmentType: 'employee' as const }
          : s
      );
      await updateData(appState.office!.id, 'shifts', updatedShifts);
      setShifts(updatedShifts);
    }

    const updatedRequests = tradeRequests.map(r =>
      r.id === requestId ? { ...r, status: (approved ? 'approved' : 'denied') as const } : r
    );
    await updateData(appState.office!.id, 'shift-trades', updatedRequests);
    setTradeRequests(updatedRequests);

    toast.success(`Trade request ${approved ? 'approved' : 'denied'}`);
  };

  const getAssignmentDisplay = (shift: Shift) => {
    if (shift.assignmentType === 'employee') {
      const employee = appState.employees.find(e => e.id === shift.assignedTo);
      return employee ? `${employee.name} (#${employee.employeeNumber})` : 'Unknown';
    } else {
      const role = appState.roles.find(r => r.id === shift.assignedTo);
      return role ? `All ${role.name}s` : 'Unknown Role';
    }
  };

  const toggleDay = (day: number) => {
    setRecurringForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort()
    }));
  };

  const myShifts = shifts.filter(s => s.assignedTo === appState.currentEmployee?.id && s.assignmentType === 'employee');
  const pendingTrades = tradeRequests.filter(r => 
    r.status === 'pending' && (r.toEmployeeId === appState.currentEmployee?.id || r.fromEmployeeId === appState.currentEmployee?.id)
  );

  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = [];
    }
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(groupedShifts).sort();

  const canManageShifts = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Shift Management</h1>
          <p className="text-gray-600">Schedule and manage team shifts</p>
        </div>
        <div className="flex gap-2">
          {canManageShifts && (
            <>
              <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-2 border-black">
                    <Repeat className="w-4 h-4 mr-2" />
                    Recurring
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Recurring Shift</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Shift Title</Label>
                      <Input
                        value={recurringForm.title}
                        onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
                        placeholder="e.g., Morning Shift"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={recurringForm.startTime}
                          onChange={(e) => setRecurringForm({ ...recurringForm, startTime: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={recurringForm.endTime}
                          onChange={(e) => setRecurringForm({ ...recurringForm, endTime: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Days of Week</Label>
                      <div className="mt-2 grid grid-cols-7 gap-2">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleDay(index)}
                            className={`p-2 text-sm rounded-lg border-2 transition-colors ${
                              recurringForm.daysOfWeek.includes(index)
                                ? 'bg-yellow-400 border-yellow-400 text-black'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Assign To</Label>
                      <Select
                        value={recurringForm.assignmentType}
                        onValueChange={(value: 'employee' | 'role') => setRecurringForm({ ...recurringForm, assignmentType: value, assignedTo: '' })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Specific Employee</SelectItem>
                          <SelectItem value="role">Entire Role</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{recurringForm.assignmentType === 'employee' ? 'Select Employee' : 'Select Role'}</Label>
                      <Select
                        value={recurringForm.assignedTo}
                        onValueChange={(value) => setRecurringForm({ ...recurringForm, assignedTo: value })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder={`Choose ${recurringForm.assignmentType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {recurringForm.assignmentType === 'employee' ? (
                            appState.employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name} (#{emp.employeeNumber})
                              </SelectItem>
                            ))
                          ) : (
                            appState.roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={recurringForm.startDate}
                          onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={recurringForm.endDate}
                          onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Input
                        value={recurringForm.notes}
                        onChange={(e) => setRecurringForm({ ...recurringForm, notes: e.target.value })}
                        placeholder="Any additional information"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setRecurringDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleRecurringSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                        Create Pattern
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600">
                    <Plus className="w-4 h-4 mr-2" />
                    New Shift
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Shift</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Shift Title</Label>
                      <Input
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Morning Shift"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="mt-1.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Assign To</Label>
                      <Select
                        value={formData.assignmentType}
                        onValueChange={(value: 'employee' | 'role') => setFormData({ ...formData, assignmentType: value, assignedTo: '' })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Specific Employee</SelectItem>
                          <SelectItem value="role">Entire Role</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{formData.assignmentType === 'employee' ? 'Select Employee' : 'Select Role'}</Label>
                      <Select
                        value={formData.assignedTo}
                        onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder={`Choose ${formData.assignmentType}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.assignmentType === 'employee' ? (
                            appState.employees.map(emp => (
                              <SelectItem key={emp.id} value={emp.id}>
                                {emp.name} (#{emp.employeeNumber})
                              </SelectItem>
                            ))
                          ) : (
                            appState.roles.map(role => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes (Optional)</Label>
                      <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional information"
                        className="mt-1.5"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                        Create Shift
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      {/* Pending Trade Requests */}
      {pendingTrades.length > 0 && (
        <Card className="p-4 border-2 border-yellow-400 bg-yellow-50">
          <h3 className="text-black mb-3 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5" />
            Pending Shift Trades ({pendingTrades.length})
          </h3>
          <div className="space-y-2">
            {pendingTrades.map(req => {
              const shift = shifts.find(s => s.id === req.shiftId);
              return (
                <div key={req.id} className="bg-white p-3 rounded-lg border border-gray-300">
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>{req.fromEmployeeName}</strong> wants to trade with <strong>{req.toEmployeeName}</strong>
                    {shift && ` - ${shift.title} on ${new Date(shift.date).toLocaleDateString()}`}
                  </p>
                  <p className="text-sm text-gray-600 mb-2 italic">{req.reason}</p>
                  {req.toEmployeeId === appState.currentEmployee?.id && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleTradeApproval(req.id, true)} className="bg-green-500 hover:bg-green-600 text-white">
                        Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleTradeApproval(req.id, false)}>
                        Decline
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {shifts.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No shifts scheduled</h3>
          <p className="text-gray-600 mb-4">Create your first shift to get started</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => (
            <div key={date}>
              <h3 className="text-black mb-3">
                {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="grid gap-3">
                {groupedShifts[date].map(shift => {
                  const isMyShift = shift.assignedTo === appState.currentEmployee?.id && shift.assignmentType === 'employee';
                  return (
                    <Card key={shift.id} className={`p-4 border-2 ${isMyShift ? 'border-yellow-400 bg-yellow-50' : 'border-black'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-black">{shift.title}</h4>
                            {shift.isRecurring && (
                              <Repeat className="w-4 h-4 text-blue-500" title="Recurring shift" />
                            )}
                          </div>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{shift.startTime} - {shift.endTime}</span>
                            </div>
                            <p>Assigned to: {getAssignmentDisplay(shift)}</p>
                            {shift.notes && <p className="italic">Note: {shift.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {isMyShift && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedShift(shift);
                                setTradeDialogOpen(true);
                              }}
                              className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </Button>
                          )}
                          {(appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(shift.id)}
                              className="text-gray-400 hover:text-black"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shift Trade Dialog */}
      <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Shift Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedShift && (
              <div className="p-3 bg-gray-100 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>{selectedShift.title}</strong><br />
                  {new Date(selectedShift.date).toLocaleDateString()} • {selectedShift.startTime} - {selectedShift.endTime}
                </p>
              </div>
            )}
            <div>
              <Label>Trade with</Label>
              <Select value={tradeForm.toEmployeeId} onValueChange={(value) => setTradeForm({ ...tradeForm, toEmployeeId: value })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {appState.employees
                    .filter(e => e.id !== appState.currentEmployee?.id)
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} (#{emp.employeeNumber})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={tradeForm.reason}
                onChange={(e) => setTradeForm({ ...tradeForm, reason: e.target.value })}
                placeholder="Why do you need to trade?"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setTradeDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleTradeRequest} className="flex-1 bg-black text-white hover:bg-gray-800">
                Send Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
