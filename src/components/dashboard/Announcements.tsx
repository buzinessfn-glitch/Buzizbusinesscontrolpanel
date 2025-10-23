import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface Announcement {
  id: string;
  title: string;
  message: string;
  targetAudience: 'all' | 'role';
  targetRoleId?: string;
  author: string;
  createdAt: string;
}

interface AnnouncementsProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export function Announcements({ appState, setAppState }: AnnouncementsProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetAudience: 'all' as 'all' | 'role',
    targetRoleId: ''
  });

  useEffect(() => {
    const savedAnnouncements = localStorage.getItem('buziz-announcements');
    if (savedAnnouncements) {
      setAnnouncements(JSON.parse(savedAnnouncements));
    }
  }, []);

  const saveAnnouncements = (newAnnouncements: Announcement[]) => {
    setAnnouncements(newAnnouncements);
    localStorage.setItem('buziz-announcements', JSON.stringify(newAnnouncements));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.targetAudience === 'role' && !formData.targetRoleId) {
      toast.error('Please select a target role');
      return;
    }

    const newAnnouncement: Announcement = {
      id: crypto.randomUUID(),
      title: formData.title,
      message: formData.message,
      targetAudience: formData.targetAudience,
      targetRoleId: formData.targetRoleId || undefined,
      author: appState.currentEmployee?.name || 'Unknown',
      createdAt: new Date().toISOString()
    };

    saveAnnouncements([newAnnouncement, ...announcements]);
    toast.success('Announcement posted');
    setDialogOpen(false);
    setFormData({
      title: '',
      message: '',
      targetAudience: 'all',
      targetRoleId: ''
    });
  };

  const handleDelete = (id: string) => {
    saveAnnouncements(announcements.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  const getTargetDisplay = (announcement: Announcement) => {
    if (announcement.targetAudience === 'all') {
      return 'Everyone';
    } else {
      const role = appState.roles.find(r => r.id === announcement.targetRoleId);
      return role ? `${role.name}s only` : 'Specific Role';
    }
  };

  const isCurrentUserCreatorOrHead = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Announcements</h1>
          <p className="text-gray-600">Share updates with your team</p>
        </div>
        {isCurrentUserCreatorOrHead && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Announcement title"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your announcement..."
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(value: 'all' | 'role') => setFormData({ ...formData, targetAudience: value, targetRoleId: '' })}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone</SelectItem>
                      <SelectItem value="role">Specific Role</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.targetAudience === 'role' && (
                  <div>
                    <Label htmlFor="targetRoleId">Select Role</Label>
                    <Select
                      value={formData.targetRoleId}
                      onValueChange={(value) => setFormData({ ...formData, targetRoleId: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Choose role" />
                      </SelectTrigger>
                      <SelectContent>
                        {appState.roles.map(role => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="flex-1 bg-black text-white hover:bg-gray-800">
                    Post Announcement
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card className="p-12 text-center border-2 border-dashed border-gray-300">
          <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">No announcements yet</h3>
          <p className="text-gray-600 mb-4">
            {isCurrentUserCreatorOrHead 
              ? 'Create your first announcement to share updates with the team'
              : 'Check back later for team updates'
            }
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <Card key={announcement.id} className="p-6 border-2 border-black">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0">
                    <Megaphone className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-black">{announcement.title}</h4>
                      <Badge variant="outline" className="border-black">
                        {getTargetDisplay(announcement)}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{announcement.message}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Posted by {announcement.author}</span>
                      <span>•</span>
                      <span>
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                {isCurrentUserCreatorOrHead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(announcement.id)}
                    className="text-gray-400 hover:text-black"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
