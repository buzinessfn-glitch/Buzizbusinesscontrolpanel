import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Car, Plus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface ParkingSpot {
  id: string;
  spotNumber: string;
  isReserved: boolean;
  assignedTo?: string;
  assignedName?: string;
  isPermanent: boolean;
}

interface ParkingRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  preferredSpot?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
  reviewedBy?: string;
  reviewNote?: string;
}

interface ParkingManagementProps {
  appState: AppState;
}

export function ParkingManagement({ appState }: ParkingManagementProps) {
  const [parkingSpots, setParkingSpots] = useState<ParkingSpot[]>([]);
  const [requests, setRequests] = useState<ParkingRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [spotNumber, setSpotNumber] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [preferredSpot, setPreferredSpot] = useState('');

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager ||
                     appState.roles.find(r => r.name === appState.currentEmployee?.role)?.permissions.includes('all');

  useEffect(() => {
    loadParkingData();
  }, [appState.office]);

  const loadParkingData = async () => {
    if (!appState.office) return;
    
    try {
      const spotsData = await getData(appState.office.id, 'parking-spots');
      const requestsData = await getData(appState.office.id, 'parking-requests');
      
      setParkingSpots(spotsData.data || []);
      setRequests(requestsData.data || []);
    } catch (error) {
      console.error('Error loading parking data:', error);
    }
  };

  const handleCreateSpot = async () => {
    if (!appState.office || !appState.currentEmployee || !spotNumber) {
      toast.error('Please enter a spot number');
      return;
    }

    try {
      const newSpot: ParkingSpot = {
        id: crypto.randomUUID(),
        spotNumber,
        isReserved: false,
        isPermanent: false
      };

      const updated = [...parkingSpots, newSpot];
      await updateData(appState.office.id, 'parking-spots', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Parking Spot Created',
        `Spot ${spotNumber} added`,
        'admin'
      );

      toast.success('Parking spot created');
      setDialogOpen(false);
      setSpotNumber('');
      loadParkingData();
    } catch (error) {
      console.error('Error creating spot:', error);
      toast.error('Failed to create spot');
    }
  };

  const handleRequestSpot = async () => {
    if (!appState.office || !appState.currentEmployee || !requestReason) {
      toast.error('Please provide a reason for your request');
      return;
    }

    try {
      const newRequest: ParkingRequest = {
        id: crypto.randomUUID(),
        employeeId: appState.currentEmployee.id,
        employeeName: appState.currentEmployee.name,
        preferredSpot: preferredSpot || undefined,
        reason: requestReason,
        status: 'pending',
        requestDate: new Date().toISOString()
      };

      const updated = [...requests, newRequest];
      await updateData(appState.office.id, 'parking-requests', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Parking Request Submitted',
        preferredSpot ? `Requested spot ${preferredSpot}` : 'Requested parking spot',
        'employee'
      );

      toast.success('Parking request submitted');
      setRequestDialogOpen(false);
      setRequestReason('');
      setPreferredSpot('');
      loadParkingData();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request');
    }
  };

  const handleApproveRequest = async (request: ParkingRequest) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      // Find available spot or use preferred
      let spotToAssign = parkingSpots.find(s => 
        !s.isReserved && (!request.preferredSpot || s.spotNumber === request.preferredSpot)
      );

      if (!spotToAssign && !request.preferredSpot) {
        spotToAssign = parkingSpots.find(s => !s.isReserved);
      }

      if (!spotToAssign) {
        toast.error('No available parking spots');
        return;
      }

      // Update spot
      spotToAssign.isReserved = true;
      spotToAssign.assignedTo = request.employeeId;
      spotToAssign.assignedName = request.employeeName;
      spotToAssign.isPermanent = false;

      await updateData(appState.office.id, 'parking-spots', parkingSpots);

      // Update request
      request.status = 'approved';
      request.reviewedBy = appState.currentEmployee.name;
      await updateData(appState.office.id, 'parking-requests', requests);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Parking Request Approved',
        `Spot ${spotToAssign.spotNumber} assigned to ${request.employeeName}`,
        'admin'
      );

      toast.success('Request approved');
      loadParkingData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    }
  };

  const handleRejectRequest = async (request: ParkingRequest) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      request.status = 'rejected';
      request.reviewedBy = appState.currentEmployee.name;
      await updateData(appState.office.id, 'parking-requests', requests);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Parking Request Rejected',
        `Request from ${request.employeeName}`,
        'admin'
      );

      toast.success('Request rejected');
      loadParkingData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleReleaseSpot = async (spot: ParkingSpot) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      spot.isReserved = false;
      spot.assignedTo = undefined;
      spot.assignedName = undefined;
      spot.isPermanent = false;

      await updateData(appState.office.id, 'parking-spots', parkingSpots);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Parking Spot Released',
        `Spot ${spot.spotNumber}`,
        'admin'
      );

      toast.success('Spot released');
      loadParkingData();
    } catch (error) {
      console.error('Error releasing spot:', error);
    }
  };

  const mySpot = parkingSpots.find(s => s.assignedTo === appState.currentEmployee?.id);
  const myRequests = requests.filter(r => r.employeeId === appState.currentEmployee?.id);
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const availableSpots = parkingSpots.filter(s => !s.isReserved);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Parking Management</h1>
          <p className="text-gray-600">Request and manage parking spots</p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Button
              onClick={() => setDialogOpen(true)}
              variant="outline"
              className="border-2 border-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Spot
            </Button>
          )}
          {!mySpot && (
            <Button
              onClick={() => setRequestDialogOpen(true)}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
            >
              <Car className="w-4 h-4 mr-2" />
              Request Spot
            </Button>
          )}
        </div>
      </div>

      {/* My Parking */}
      {mySpot && (
        <Card className="p-6 border-2 border-green-500 bg-green-50">
          <div className="flex items-center gap-4">
            <Car className="w-12 h-12 text-green-600" />
            <div>
              <h3 className="text-black mb-1">Your Parking Spot</h3>
              <p className="text-2xl text-green-600">Spot {mySpot.spotNumber}</p>
              {mySpot.isPermanent && (
                <Badge className="mt-2 bg-green-600 text-white">Permanent Assignment</Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Parking Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 border-2 border-blue-500">
          <div className="text-center">
            <Car className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{parkingSpots.length}</p>
            <p className="text-sm text-gray-600">Total Spots</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-green-500">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{availableSpots.length}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-orange-500">
          <div className="text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{pendingRequests.length}</p>
            <p className="text-sm text-gray-600">Pending Requests</p>
          </div>
        </Card>
      </div>

      {/* Pending Requests (Managers) */}
      {canManage && pendingRequests.length > 0 && (
        <div>
          <h2 className="text-black mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map(request => (
              <Card key={request.id} className="p-4 border-2 border-orange-400 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-black mb-1">{request.employeeName}</h4>
                    {request.preferredSpot && (
                      <p className="text-sm text-gray-600 mb-1">Preferred: Spot {request.preferredSpot}</p>
                    )}
                    <p className="text-sm text-gray-700 mb-2">{request.reason}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveRequest(request)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectRequest(request)}
                      className="border-red-500 text-red-500 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Parking Spots Grid */}
      <div>
        <h2 className="text-black mb-3">All Parking Spots</h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
          {parkingSpots.map(spot => (
            <Card
              key={spot.id}
              className={`p-4 ${
                spot.isReserved
                  ? 'border-2 border-red-500 opacity-60'
                  : 'border-2 border-green-500'
              }`}
            >
              <div className="text-center">
                <Car className={`w-8 h-8 mx-auto mb-2 ${
                  spot.isReserved ? 'text-red-500' : 'text-green-500'
                }`} />
                <p className="text-xl text-black mb-1">Spot {spot.spotNumber}</p>
                {spot.isReserved ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">{spot.assignedName}</p>
                    {canManage && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReleaseSpot(spot)}
                        className="w-full text-xs"
                      >
                        Release
                      </Button>
                    )}
                  </div>
                ) : (
                  <Badge className="bg-green-500 text-white">Available</Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* My Requests */}
      {myRequests.length > 0 && (
        <div>
          <h2 className="text-black mb-3">My Requests</h2>
          <div className="space-y-3">
            {myRequests.map(request => (
              <Card key={request.id} className="p-4 border border-gray-300">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        className={
                          request.status === 'approved'
                            ? 'bg-green-500 text-white'
                            : request.status === 'rejected'
                            ? 'bg-red-500 text-white'
                            : 'bg-orange-500 text-white'
                        }
                      >
                        {request.status}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(request.requestDate).toLocaleDateString()}
                      </span>
                    </div>
                    {request.preferredSpot && (
                      <p className="text-sm text-gray-600 mb-1">Spot {request.preferredSpot}</p>
                    )}
                    <p className="text-sm text-gray-700">{request.reason}</p>
                    {request.reviewedBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        Reviewed by {request.reviewedBy}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Add Spot Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Parking Spot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Spot Number</Label>
              <Input
                value={spotNumber}
                onChange={(e) => setSpotNumber(e.target.value)}
                placeholder="e.g., A1, B2, 101"
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateSpot} className="flex-1 bg-black text-white">
                Add Spot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Request Dialog */}
      <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Parking Spot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Preferred Spot (Optional)</Label>
              <Input
                value={preferredSpot}
                onChange={(e) => setPreferredSpot(e.target.value)}
                placeholder="e.g., A1, B2"
                className="mt-1.5"
              />
              <p className="text-xs text-gray-500 mt-1">Leave blank for any available spot</p>
            </div>
            <div>
              <Label>Reason for Request</Label>
              <Textarea
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Why do you need a parking spot?"
                className="mt-1.5"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setRequestDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button onClick={handleRequestSpot} className="flex-1 bg-black text-white">
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
