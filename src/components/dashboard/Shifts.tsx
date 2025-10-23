import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Plus, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface Shift {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  assignedTo: string; // employee ID or role ID
  assignmentType: 'employee' | 'role';
  notes?: string;
}

interface ShiftsProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Shifts({ appState, setAppState }: ShiftsProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    assignedTo: '',
    assignmentType: 'employee' as 'employee' | 'role',
    notes: ''
  });

  useEffect(() => {
    const savedShifts = localStorage.getItem('buziz-shifts');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }
  }, []);

  const saveShifts = (newShifts: Shift[]) => {
    setShifts(newShifts);
    localStorage.setItem('buziz-shifts', JSON.stringify(newShifts));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.startTime || !formData.endTime || !formData.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newShift: Shift = {
      id: crypto.randomUUID(),
      ...formData
    };

    saveShifts([...shifts, newShift]);
    toast.success('Shift created successfully');
    setDialogOpen(false);
    setFormData({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      assignedTo: '',
      assignmentType: 'employee',
      notes: ''
    });
  };

  const handleDelete = (id: string) => {
    saveShifts(shifts.filter(s => s.id !== id));
    toast.success('Shift deleted');
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

  const groupedShifts = shifts.reduce((acc, shift) => {
    if (!acc[shift.date]) {
      acc[shift.date] = [];
    }
    acc[shift.date].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  const sortedDates = Object.keys(groupedShifts).sort();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-black mb-1">Shift Management</h1>
          <p className="text-gray-600">Schedule and manage team shifts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
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
                <Label htmlFor="title">Shift Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Morning Shift"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="assignmentType">Assign To</Label>
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
                <Label htmlFor="assignedTo">
                  {formData.assignmentType === 'employee' ? 'Select Employee' : 'Select Role'}
                </Label>
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
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
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
      </div>

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
                {groupedShifts[date].map(shift => (
                  <Card key={shift.id} className="p-4 border-2 border-black">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-black mb-2">{shift.title}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{shift.startTime} - {shift.endTime}</span>
                          </div>
                          <p>Assigned to: {getAssignmentDisplay(shift)}</p>
                          {shift.notes && <p className="italic">Note: {shift.notes}</p>}
                        </div>
                      </div>
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
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
