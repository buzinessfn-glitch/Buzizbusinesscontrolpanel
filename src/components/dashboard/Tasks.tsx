import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { CheckSquare, Plus, Trash2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface Task {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  assignedTo: string; // employee ID or role ID
  assignmentType: 'employee' | 'role';
  createdAt: string;
}

interface TasksProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Tasks({ appState, setAppState }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'done'>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    assignedTo: '',
    assignmentType: 'employee' as 'employee' | 'role'
  });

  useEffect(() => {
    const savedTasks = localStorage.getItem('buziz-tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  const saveTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem('buziz-tasks', JSON.stringify(newTasks));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.deadline || !formData.assignedTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      ...formData,
      status: 'todo',
      createdAt: new Date().toISOString()
    };

    saveTasks([...tasks, newTask]);
    toast.success('Task created successfully');
    setDialogOpen(false);
    setFormData({
      title: '',
      description: '',
      deadline: '',
      priority: 'medium',
      assignedTo: '',
      assignmentType: 'employee'
    });
  };

  const handleStatusChange = (id: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    saveTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    toast.success('Task status updated');
  };

  const handleDelete = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const getAssignmentDisplay = (task: Task) => {
    if (task.assignmentType === 'employee') {
      const employee = appState.employees.find(e => e.id === task.assignedTo);
      return employee ? employee.name : 'Unknown';
    } else {
      const role = appState.roles.find(r => r.id === task.assignedTo);
      return role ? `All ${role.name}s` : 'Unknown Role';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-black text-white';
      case 'medium': return 'bg-gray-600 text-white';
      case 'low': return 'bg-gray-300 text-black';
      default: return 'bg-gray-200 text-black';
    }
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Task Management</h1>
          <p className="text-gray-600">Assign and track team tasks</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Review inventory report"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details..."
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
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
                          {emp.name}
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

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                  Create Task
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['all', 'todo', 'in-progress', 'done'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            className={`px-4 py-2 capitalize ${
              filter === status
                ? 'border-b-2 border-black text-black'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {status === 'in-progress' ? 'In Progress' : status}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No tasks found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all' ? 'Create your first task to get started' : `No ${filter} tasks`}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map(task => (
            <Card key={task.id} className="p-4 border-2 border-black">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-black">{task.title}</h4>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-2">{task.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(task.deadline).toLocaleDateString()}</span>
                    </div>
                    <span>Assigned to: {getAssignmentDisplay(task)}</span>
                  </div>
                </div>
                {(appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(task.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={task.status === 'todo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'todo')}
                  className={task.status === 'todo' ? 'bg-black text-white' : ''}
                >
                  To Do
                </Button>
                <Button
                  variant={task.status === 'in-progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'in-progress')}
                  className={task.status === 'in-progress' ? 'bg-black text-white' : ''}
                >
                  In Progress
                </Button>
                <Button
                  variant={task.status === 'done' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'done')}
                  className={task.status === 'done' ? 'bg-black text-white' : ''}
                >
                  Done
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
