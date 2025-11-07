import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Avatar } from '../ui/avatar';
import { 
  User, Users, Edit, AlertTriangle, FileText, UserX, 
  MessageSquare, Shield, Upload, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState } from '../../App';

interface EmployeeProfile {
  employeeId: string;
  displayName?: string; // Custom name for this office
  bio?: string;
  profilePicture?: string; // URL or stock image identifier
  warnings: { id: string; reason: string; message: string; date: string; issuedBy: string }[];
  complaints: { id: string; against: string; reason: string; details: string; date: string; status: 'pending' | 'reviewed' }[];
}

interface EmployeeProfilesProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const STOCK_AVATARS = [
  '👤', '👨', '👩', '👨‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🔧', '👩‍🔧', '👨‍🍳', '👩‍🍳', '🧑‍⚕️'
];

export function EmployeeProfiles({ appState, setAppState }: EmployeeProfilesProps) {
  const [profiles, setProfiles] = useState<EmployeeProfile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [complaintDialogOpen, setComplaintDialogOpen] = useState(false);
  const [kickDialogOpen, setKickDialogOpen] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [complaintAgainst, setComplaintAgainst] = useState('');
  const [complaintReason, setComplaintReason] = useState('');
  const [complaintDetails, setComplaintDetails] = useState('');

  const canManage = appState.currentEmployee?.isCreator || 
                     appState.currentEmployee?.isHeadManager;

  useEffect(() => {
    loadProfiles();
  }, [appState.office]);

  const loadProfiles = async () => {
    if (!appState.office) return;
    
    try {
      const data = await getData(appState.office.id, 'employee-profiles');
      setProfiles(data.data || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const getProfile = (employeeId: string): EmployeeProfile => {
    return profiles.find(p => p.employeeId === employeeId) || {
      employeeId,
      warnings: [],
      complaints: []
    };
  };

  const handleSaveProfile = async () => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const profile = getProfile(appState.currentEmployee.id);
      profile.displayName = displayName || undefined;
      profile.bio = bio || undefined;
      profile.profilePicture = selectedAvatar || undefined;

      const updated = profiles.filter(p => p.employeeId !== appState.currentEmployee!.id);
      updated.push(profile);

      await updateData(appState.office.id, 'employee-profiles', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Profile Updated',
        'Updated profile information',
        'employee'
      );

      toast.success('Profile updated');
      setEditProfileOpen(false);
      loadProfiles();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleIssueWarning = async () => {
    if (!appState.office || !appState.currentEmployee || !selectedEmployee || !warnReason || !warnMessage) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const profile = getProfile(selectedEmployee);
      const warning = {
        id: crypto.randomUUID(),
        reason: warnReason,
        message: warnMessage,
        date: new Date().toISOString(),
        issuedBy: appState.currentEmployee.name
      };

      profile.warnings.push(warning);

      const updated = profiles.filter(p => p.employeeId !== selectedEmployee);
      updated.push(profile);

      await updateData(appState.office.id, 'employee-profiles', updated);

      const employee = appState.employees.find(e => e.id === selectedEmployee);
      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Warning Issued',
        `Warning issued to ${employee?.name}: ${warnReason}`,
        'admin'
      );

      toast.success('Warning issued');
      setWarnDialogOpen(false);
      setWarnReason('');
      setWarnMessage('');
      loadProfiles();
    } catch (error) {
      console.error('Error issuing warning:', error);
      toast.error('Failed to issue warning');
    }
  };

  const handleFileComplaint = async () => {
    if (!appState.office || !appState.currentEmployee || !complaintAgainst || !complaintReason || !complaintDetails) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const profile = getProfile(appState.currentEmployee.id);
      const complaint = {
        id: crypto.randomUUID(),
        against: complaintAgainst,
        reason: complaintReason,
        details: complaintDetails,
        date: new Date().toISOString(),
        status: 'pending' as const
      };

      profile.complaints.push(complaint);

      const updated = profiles.filter(p => p.employeeId !== appState.currentEmployee!.id);
      updated.push(profile);

      await updateData(appState.office.id, 'employee-profiles', updated);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Formal Complaint Filed',
        `Complaint against ${complaintAgainst}: ${complaintReason}`,
        'employee'
      );

      toast.success('Complaint filed successfully');
      setComplaintDialogOpen(false);
      setComplaintAgainst('');
      setComplaintReason('');
      setComplaintDetails('');
      loadProfiles();
    } catch (error) {
      console.error('Error filing complaint:', error);
      toast.error('Failed to file complaint');
    }
  };

  const handleKickEmployee = async () => {
    if (!appState.office || !appState.currentEmployee || !selectedEmployee) return;

    try {
      const employee = appState.employees.find(e => e.id === selectedEmployee);
      if (!employee) return;

      // Remove from employees
      const updatedEmployees = appState.employees.filter(e => e.id !== selectedEmployee);
      
      // Update state
      const newState = {
        ...appState,
        employees: updatedEmployees
      };
      setAppState(newState);

      // Save to backend
      const officeData = await getData(appState.office.id, 'employees');
      const allEmployees = officeData.data || [];
      const filtered = allEmployees.filter((e: any) => e.id !== selectedEmployee);
      await updateData(appState.office.id, 'employees', filtered);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Employee Removed',
        `${employee.name} was removed from the office`,
        'admin'
      );

      toast.success(`${employee.name} has been removed`);
      setKickDialogOpen(false);
      setSelectedEmployee(null);
      setSidebarOpen(false);
    } catch (error) {
      console.error('Error kicking employee:', error);
      toast.error('Failed to remove employee');
    }
  };

  const openEmployeeProfile = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSidebarOpen(true);
  };

  const getRoleColor = (roleName: string) => {
    const role = appState.roles.find(r => r.name === roleName);
    return role?.color || '#000';
  };

  const selectedEmployeeData = selectedEmployee 
    ? appState.employees.find(e => e.id === selectedEmployee)
    : null;
  const selectedProfile = selectedEmployee ? getProfile(selectedEmployee) : null;

  const myProfile = getProfile(appState.currentEmployee?.id || '');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Employee Profiles</h1>
          <p className="text-gray-600">View and manage employee information</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setComplaintDialogOpen(true)}
            variant="outline"
            className="border-2 border-red-500 text-red-500"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            File Complaint
          </Button>
          <Button
            onClick={() => {
              const profile = getProfile(appState.currentEmployee?.id || '');
              setDisplayName(profile.displayName || appState.currentEmployee?.name || '');
              setBio(profile.bio || '');
              setSelectedAvatar(profile.profilePicture || '');
              setEditProfileOpen(true);
            }}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit My Profile
          </Button>
        </div>
      </div>

      {/* My Profile Card */}
      <Card className="p-6 border-2 border-yellow-400 bg-yellow-50">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
            {myProfile.profilePicture ? (
              myProfile.profilePicture.startsWith('data:') ? (
                <img src={myProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{myProfile.profilePicture}</span>
              )
            ) : (
              <span>👤</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-black mb-1">
              {myProfile.displayName || appState.currentEmployee?.name}
            </h3>
            <Badge
              variant="outline"
              style={{
                borderColor: getRoleColor(appState.currentEmployee?.role || ''),
                color: getRoleColor(appState.currentEmployee?.role || '')
              }}
              className="mb-2"
            >
              {appState.currentEmployee?.role}
            </Badge>
            {myProfile.bio && (
              <p className="text-gray-700 text-sm">{myProfile.bio}</p>
            )}
          </div>
        </div>
      </Card>

      {/* All Employees */}
      <div>
        <h2 className="text-black mb-3">Team Directory</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {appState.employees
            .filter(e => e.id !== appState.currentEmployee?.id)
            .map(employee => {
              const profile = getProfile(employee.id);
              return (
                <Card
                  key={employee.id}
                  onClick={() => openEmployeeProfile(employee.id)}
                  className="p-4 cursor-pointer border-2 border-black hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                      {profile.profilePicture ? (
                        profile.profilePicture.startsWith('data:') ? (
                          <img src={profile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <span>{profile.profilePicture}</span>
                        )
                      ) : (
                        <span>👤</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-black truncate">
                        {profile.displayName || employee.name}
                      </h4>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: getRoleColor(employee.role),
                          color: getRoleColor(employee.role)
                        }}
                        className="text-xs"
                      >
                        {employee.role}
                      </Badge>
                      {profile.bio && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
        </div>
      </div>

      {/* Employee Details Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent className="overflow-y-auto">
          {selectedEmployeeData && selectedProfile && (
            <>
              <SheetHeader>
                <SheetTitle>Employee Profile</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Profile Header */}
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center text-4xl mx-auto mb-3 overflow-hidden">
                    {selectedProfile.profilePicture ? (
                      selectedProfile.profilePicture.startsWith('data:') ? (
                        <img src={selectedProfile.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{selectedProfile.profilePicture}</span>
                      )
                    ) : (
                      <span>👤</span>
                    )}
                  </div>
                  <h3 className="text-black mb-1">
                    {selectedProfile.displayName || selectedEmployeeData.name}
                  </h3>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: getRoleColor(selectedEmployeeData.role),
                      color: getRoleColor(selectedEmployeeData.role)
                    }}
                  >
                    {selectedEmployeeData.role}
                  </Badge>
                  {selectedProfile.bio && (
                    <p className="text-gray-700 text-sm mt-3">{selectedProfile.bio}</p>
                  )}
                </div>

                {/* Employee Info */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee #:</span>
                    <span className="text-black">{selectedEmployeeData.employeeNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pay Rate:</span>
                    <span className="text-black">${selectedEmployeeData.payRate}/hr</span>
                  </div>
                  {selectedEmployeeData.isHeadManager && (
                    <Badge className="w-full bg-blue-500 text-white">Head Manager</Badge>
                  )}
                  {selectedEmployeeData.isCreator && (
                    <Badge className="w-full bg-purple-500 text-white">Creator</Badge>
                  )}
                </div>

                {/* Warnings (if manager) */}
                {canManage && selectedProfile.warnings.length > 0 && (
                  <div>
                    <h4 className="text-black mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      Warnings ({selectedProfile.warnings.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedProfile.warnings.map(warning => (
                        <Card key={warning.id} className="p-3 border-red-500">
                          <p className="text-sm text-black mb-1">{warning.reason}</p>
                          <p className="text-xs text-gray-600 mb-2">{warning.message}</p>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>By: {warning.issuedBy}</span>
                            <span>{new Date(warning.date).toLocaleDateString()}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {canManage && (
                    <>
                      <Button
                        onClick={() => setWarnDialogOpen(true)}
                        variant="outline"
                        className="w-full border-red-500 text-red-500"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issue Warning
                      </Button>
                      <Button
                        onClick={() => setKickDialogOpen(true)}
                        variant="outline"
                        className="w-full border-red-600 text-red-600"
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Remove from Office
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name in this office"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your team about yourself..."
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Profile Picture</Label>
              <div className="space-y-3 mt-1.5">
                {/* Upload Custom Image */}
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-6 h-6 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-600">Upload Custom Photo</span>
                    <span className="text-xs text-gray-500">PNG, JPG (max 2MB)</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          toast.error('File too large. Max 2MB');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          setSelectedAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Current Selection Preview */}
                {selectedAvatar && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center overflow-hidden">
                      {selectedAvatar.startsWith('data:') ? (
                        <img src={selectedAvatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{selectedAvatar}</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 flex-1">Current selection</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedAvatar('')}
                    >
                      Clear
                    </Button>
                  </div>
                )}

                {/* Stock Avatars */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Or choose a stock avatar:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {STOCK_AVATARS.map(avatar => (
                      <button
                        key={avatar}
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`text-2xl p-2 rounded border-2 ${
                          selectedAvatar === avatar ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300'
                        }`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditProfileOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} className="flex-1 bg-black text-white">
                Save Profile
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warn Dialog */}
      <Dialog open={warnDialogOpen} onOpenChange={setWarnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Warning</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Input
                value={warnReason}
                onChange={(e) => setWarnReason(e.target.value)}
                placeholder="e.g., Late arrival, policy violation"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="Detailed warning message..."
                rows={3}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setWarnDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleIssueWarning} className="flex-1 bg-red-600 text-white">
                Issue Warning
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Complaint Dialog */}
      <Dialog open={complaintDialogOpen} onOpenChange={setComplaintDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File Formal Complaint</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Against</Label>
              <Input
                value={complaintAgainst}
                onChange={(e) => setComplaintAgainst(e.target.value)}
                placeholder="Employee name or role"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={complaintReason}
                onChange={(e) => setComplaintReason(e.target.value)}
                placeholder="Brief reason"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Details</Label>
              <Textarea
                value={complaintDetails}
                onChange={(e) => setComplaintDetails(e.target.value)}
                placeholder="Provide detailed information..."
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setComplaintDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleFileComplaint} className="flex-1 bg-black text-white">
                File Complaint
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kick Confirmation */}
      <Dialog open={kickDialogOpen} onOpenChange={setKickDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove {selectedEmployeeData?.name} from this office? 
              This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setKickDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleKickEmployee} className="flex-1 bg-red-600 text-white">
                Remove Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
