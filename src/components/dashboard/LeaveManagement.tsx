import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar, Plus, Check, X, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'vacation' | 'sick' | 'personal';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export function LeaveManagement({ appState }: { appState: AppState }) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'vacation' as LeaveRequest['type'],
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    loadRequests();
  }, [appState.office]);

  const loadRequests = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'leave-requests');
      setRequests(data.data || []);
    } catch (error) {
      console.error('Error loading leave requests:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const newRequest: LeaveRequest = {
      id: crypto.randomUUID(),
      employeeId: appState.currentEmployee!.id,
      employeeName: appState.currentEmployee!.name,
      type: formData.type,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    const updated = [...requests, newRequest];
    await updateData(appState.office!.id, 'leave-requests', updated);
    setRequests(updated);
    
    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      'Leave Request Submitted',
      `Requested ${formData.type} leave from ${formData.startDate} to ${formData.endDate}`,
      'employee'
    );

    toast.success('Leave request submitted');
    setDialogOpen(false);
    setFormData({ type: 'vacation', startDate: '', endDate: '', reason: '' });
  };

  const handleReview = async (requestId: string, approved: boolean) => {
    const updated = requests.map(r =>
      r.id === requestId
        ? {
            ...r,
            status: (approved ? 'approved' : 'denied') as LeaveRequest['status'],
            reviewedBy: appState.currentEmployee!.name,
            reviewedAt: new Date().toISOString()
          }
        : r
    );

    await updateData(appState.office!.id, 'leave-requests', updated);
    setRequests(updated);

    const request = requests.find(r => r.id === requestId);
    logActivity(
      appState.office!.id,
      appState.currentEmployee!.id,
      appState.currentEmployee!.name,
      `Leave Request ${approved ? 'Approved' : 'Denied'}`,
      `${approved ? 'Approved' : 'Denied'} ${request?.employeeName}'s ${request?.type} leave request`,
      'employee'
    );

    toast.success(`Request ${approved ? 'approved' : 'denied'}`);
  };

  const canReview = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;
  const myRequests = requests.filter(r => r.employeeId === appState.currentEmployee?.id);
  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-black mb-1">Leave Management</h1>
          <p className="text-gray-600">Request time off and manage leave</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Request
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* My Requests */}
        <div>
          <h2 className="text-black mb-4">My Requests</h2>
          <div className="space-y-3">
            {myRequests.length === 0 ? (
              <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No leave requests yet</p>
              </Card>
            ) : (
              myRequests.map(req => (
                <Card key={req.id} className="p-4 border-2 border-black">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-black capitalize">{req.type} Leave</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={
                      req.status === 'approved' ? 'bg-green-500' :
                      req.status === 'denied' ? 'bg-red-500' :
                      'bg-yellow-500'
                    }>
                      {req.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{req.reason}</p>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Pending Approvals */}
        {canReview && (
          <div>
            <h2 className="text-black mb-4">Pending Approvals</h2>
            <div className="space-y-3">
              {pendingRequests.length === 0 ? (
                <Card className="p-8 text-center border-2 border-dashed border-gray-300">
                  <Check className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No pending requests</p>
                </Card>
              ) : (
                pendingRequests.map(req => (
                  <Card key={req.id} className="p-4 border-2 border-black">
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-black">{req.employeeName}</h3>
                        <Badge variant="outline" className="capitalize">{req.type}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-700 mt-2">{req.reason}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleReview(req.id, true)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReview(req.id, false)}
                        variant="outline"
                        className="flex-1 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Deny
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Time Off</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as any })}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Brief explanation..."
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
