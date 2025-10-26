import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Calendar, Plus, Users, Clock, Trash2, Video, MapPin } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface Meeting {
  id: string;
  title: string;
  description: string;
  datetime: string;
  duration: number;
  location?: string;
  attendees: string[];
  createdBy: string;
  creatorName: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: string;
}

export function Meetings({ appState }: { appState: AppState }) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    datetime: '',
    duration: 60,
    location: '',
    attendees: [] as string[]
  });

  useEffect(() => {
    loadMeetings();
  }, [appState.office]);

  const loadMeetings = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'meetings');
      setMeetings(data.data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
    }
  };

  const canCreateMeeting = () => {
    if (!appState.currentEmployee) return false;
    const role = appState.roles.find(r => r.name === appState.currentEmployee?.role);
    return appState.currentEmployee.isCreator || 
           appState.currentEmployee.isHeadManager || 
           role?.permissions.includes('manage_meetings');
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.datetime) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!canCreateMeeting()) {
      toast.error('You do not have permission to create meetings');
      return;
    }

    const newMeeting: Meeting = {
      id: crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      datetime: formData.datetime,
      duration: formData.duration,
      location: formData.location,
      attendees: formData.attendees,
      createdBy: appState.currentEmployee!.id,
      creatorName: appState.currentEmployee!.name,
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };

    const updated = [...meetings, newMeeting];
    await updateData(appState.office!.id, 'meetings', updated);
    setMeetings(updated);

    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      'Meeting Created',
      `Created meeting: ${formData.title} on ${new Date(formData.datetime).toLocaleString()}`,
      'admin'
    );

    toast.success('Meeting created successfully');
    setDialogOpen(false);
    setFormData({ title: '', description: '', datetime: '', duration: 60, location: '', attendees: [] });
  };

  const handleDelete = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    if (meeting.createdBy !== appState.currentEmployee?.id && !appState.currentEmployee?.isCreator) {
      toast.error('You can only delete your own meetings');
      return;
    }

    const updated = meetings.filter(m => m.id !== meetingId);
    await updateData(appState.office!.id, 'meetings', updated);
    setMeetings(updated);

    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      'Meeting Cancelled',
      `Cancelled meeting: ${meeting.title}`,
      'admin'
    );

    toast.success('Meeting cancelled');
  };

  const handleStatusChange = async (meetingId: string, newStatus: Meeting['status']) => {
    const updated = meetings.map(m =>
      m.id === meetingId ? { ...m, status: newStatus } : m
    );
    await updateData(appState.office!.id, 'meetings', updated);
    setMeetings(updated);
    toast.success(`Meeting marked as ${newStatus}`);
  };

  const toggleAttendee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.includes(employeeId)
        ? prev.attendees.filter(id => id !== employeeId)
        : [...prev.attendees, employeeId]
    }));
  };

  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && new Date(m.datetime) > new Date()
  );

  const pastMeetings = meetings.filter(m => 
    m.status === 'completed' || (m.status === 'scheduled' && new Date(m.datetime) < new Date())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-black mb-1">Meetings</h1>
          <p className="text-gray-600">Schedule and manage team meetings</p>
        </div>
        {canCreateMeeting() && (
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Meetings */}
        <div>
          <h2 className="text-black mb-4">Upcoming Meetings</h2>
          <div className="space-y-3">
            {upcomingMeetings.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No upcoming meetings</p>
              </Card>
            ) : (
              upcomingMeetings.map(meeting => (
                <Card key={meeting.id} className="p-4 border-2 border-black">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-black mb-1">{meeting.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Calendar className="w-4 h-4" />
                          {new Date(meeting.datetime).toLocaleDateString()} at {new Date(meeting.datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4" />
                          {meeting.duration} minutes
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="w-4 h-4" />
                            {meeting.location}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users className="w-4 h-4" />
                          {meeting.attendees.length} attendees
                        </div>
                      </div>
                    </div>
                    {(meeting.createdBy === appState.currentEmployee?.id || appState.currentEmployee?.isCreator) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(meeting.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(meeting.id, 'in-progress')}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                    >
                      Start
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(meeting.id, 'completed')}
                      className="flex-1"
                    >
                      Mark Complete
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Past Meetings */}
        <div>
          <h2 className="text-black mb-4">Past Meetings</h2>
          <div className="space-y-3">
            {pastMeetings.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No past meetings</p>
              </Card>
            ) : (
              pastMeetings.slice(0, 10).map(meeting => (
                <Card key={meeting.id} className="p-4 border border-gray-300 opacity-75">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-black mb-1">{meeting.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(meeting.datetime).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge className={
                      meeting.status === 'completed' ? 'bg-green-500' :
                      meeting.status === 'cancelled' ? 'bg-red-500' :
                      'bg-gray-500'
                    }>
                      {meeting.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Create Meeting Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Team standup, Planning session..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What will be discussed..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={formData.datetime}
                  onChange={(e) => setFormData({ ...formData, datetime: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  min={15}
                  step={15}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Location (optional)</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Conference room, Zoom link..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Attendees</Label>
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
                {appState.employees.map(emp => (
                  <div key={emp.id} className="flex items-center gap-2 py-1.5">
                    <input
                      type="checkbox"
                      checked={formData.attendees.includes(emp.id)}
                      onChange={() => toggleAttendee(emp.id)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{emp.name}</span>
                    <Badge variant="outline" className="text-xs">{emp.role}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
              >
                Create Meeting
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
