import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { RefreshCw, Calendar, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface SwapListing {
  id: string;
  shiftId: string;
  shiftDate: string;
  shiftTime: string;
  shiftLocation: string;
  originalEmployee: string;
  originalEmployeeId: string;
  reason: string;
  status: 'available' | 'claimed' | 'completed';
  claimedBy?: string;
  claimedById?: string;
  claimedAt?: string;
  postedAt: string;
}

interface ShiftSwapBoardProps {
  appState: AppState;
}

export function ShiftSwapBoard({ appState }: ShiftSwapBoardProps) {
  const [listings, setListings] = useState<SwapListing[]>([]);
  const [selectedListing, setSelectedListing] = useState<SwapListing | null>(null);

  useEffect(() => {
    loadListings();
    const interval = setInterval(loadListings, 5000);
    return () => clearInterval(interval);
  }, [appState.office]);

  const loadListings = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'shift-swap-board');
      setListings(data.data || []);
    } catch (error) {
      console.error('Error loading swap listings:', error);
    }
  };

  const handleClaimShift = async (listing: SwapListing) => {
    if (!appState.office || !appState.currentEmployee) return;

    if (listing.originalEmployeeId === appState.currentEmployee.id) {
      toast.error('You cannot claim your own shift');
      return;
    }

    try {
      listing.status = 'claimed';
      listing.claimedBy = appState.currentEmployee.name;
      listing.claimedById = appState.currentEmployee.id;
      listing.claimedAt = new Date().toISOString();

      const updated = listings.map(l => l.id === listing.id ? listing : l);
      await updateData(appState.office.id, 'shift-swap-board', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Shift Claimed from Swap Board',
        `Claimed shift from ${listing.originalEmployee} on ${listing.shiftDate}`,
        'employee'
      );

      toast.success('Shift claimed! Manager approval pending');
      setSelectedListing(null);
      loadListings();
    } catch (error) {
      console.error('Error claiming shift:', error);
      toast.error('Failed to claim shift');
    }
  };

  const handleApproveSwap = async (listing: SwapListing) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      listing.status = 'completed';
      const updated = listings.map(l => l.id === listing.id ? listing : l);
      await updateData(appState.office.id, 'shift-swap-board', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Shift Swap Approved',
        `${listing.claimedBy} took over shift from ${listing.originalEmployee}`,
        'admin'
      );

      toast.success('Shift swap approved');
      loadListings();
    } catch (error) {
      console.error('Error approving swap:', error);
    }
  };

  const handleRejectSwap = async (listing: SwapListing) => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      listing.status = 'available';
      listing.claimedBy = undefined;
      listing.claimedById = undefined;
      listing.claimedAt = undefined;

      const updated = listings.map(l => l.id === listing.id ? listing : l);
      await updateData(appState.office.id, 'shift-swap-board', updated);

      toast.success('Swap rejected - shift back on board');
      loadListings();
    } catch (error) {
      console.error('Error rejecting swap:', error);
    }
  };

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager ||
                     appState.roles.find(r => r.name === appState.currentEmployee?.role)?.permissions.includes('all');

  const availableListings = listings.filter(l => l.status === 'available');
  const claimedListings = listings.filter(l => l.status === 'claimed');
  const myListings = listings.filter(l => l.originalEmployeeId === appState.currentEmployee?.id);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <RefreshCw className="w-6 h-6" />
            Shift Swap Board
          </h1>
          <p className="text-gray-600">Find someone to cover your shift or pick up extra hours</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-6 border-2 border-blue-500">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{availableListings.length}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-orange-500">
          <div className="text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{claimedListings.length}</p>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>
        </Card>
        <Card className="p-6 border-2 border-green-500">
          <div className="text-center">
            <User className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{myListings.length}</p>
            <p className="text-sm text-gray-600">My Listings</p>
          </div>
        </Card>
      </div>

      {/* Available Shifts */}
      <div>
        <h2 className="text-black mb-3">Available Shifts</h2>
        {availableListings.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No shifts available for swap</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {availableListings.map(listing => (
              <Card key={listing.id} className="p-4 border-2 border-blue-500 bg-blue-50">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-black">{new Date(listing.shiftDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700">{listing.shiftTime}</span>
                      </div>
                      {listing.shiftLocation && (
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">{listing.shiftLocation}</span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Available
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="text-black">From:</span> {listing.originalEmployee}
                  </p>
                  <p className="text-sm text-gray-700 mb-3">
                    <span className="text-black">Reason:</span> {listing.reason}
                  </p>
                  <Button
                    onClick={() => setSelectedListing(listing)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Claim This Shift
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pending Approval (Managers) */}
      {canManage && claimedListings.length > 0 && (
        <div>
          <h2 className="text-black mb-3">Pending Approval</h2>
          <div className="space-y-3">
            {claimedListings.map(listing => (
              <Card key={listing.id} className="p-4 border-2 border-orange-500 bg-orange-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-orange-500 text-white">Pending</Badge>
                      <span className="text-sm text-gray-600">
                        {new Date(listing.shiftDate).toLocaleDateString()} • {listing.shiftTime}
                      </span>
                    </div>
                    <p className="text-sm mb-1">
                      <span className="text-black">Original:</span> {listing.originalEmployee}
                    </p>
                    <p className="text-sm mb-1">
                      <span className="text-black">Claimed by:</span> {listing.claimedBy}
                    </p>
                    <p className="text-xs text-gray-600">
                      Claimed {new Date(listing.claimedAt!).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleApproveSwap(listing)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRejectSwap(listing)}
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

      {/* Claim Confirmation Dialog */}
      <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Shift</DialogTitle>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <span className="text-black">{new Date(selectedListing.shiftDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-700">{selectedListing.shiftTime}</span>
                </div>
                {selectedListing.shiftLocation && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-700">{selectedListing.shiftLocation}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700">
                You'll be taking over this shift from <span className="text-black">{selectedListing.originalEmployee}</span>.
                A manager will need to approve this swap.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedListing(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleClaimShift(selectedListing)}
                  className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                >
                  Confirm Claim
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
