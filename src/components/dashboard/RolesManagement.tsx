import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Shield, Plus, Trash2, Edit, Palette } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import type { AppState, Role } from '../../App';

interface RolesManagementProps {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'all', label: 'All Permissions', description: 'Full access to everything' },
  { id: 'manage_roles', label: 'Manage Roles', description: 'Create and edit roles' },
  { id: 'manage_staff', label: 'Manage Staff', description: 'Edit employee details' },
  { id: 'manage_shifts', label: 'Manage Shifts', description: 'Create and edit shifts' },
  { id: 'view_shifts', label: 'View Shifts', description: 'View shift schedules' },
  { id: 'manage_tasks', label: 'Manage Tasks', description: 'Create and edit tasks' },
  { id: 'view_tasks', label: 'View Tasks', description: 'View assigned tasks' },
  { id: 'manage_inventory', label: 'Manage Inventory', description: 'Edit inventory items' },
  { id: 'view_inventory', label: 'View Inventory', description: 'View inventory levels' },
  { id: 'manage_suppliers', label: 'Manage Suppliers', description: 'Add and edit suppliers' },
  { id: 'manage_meetings', label: 'Manage Meetings', description: 'Schedule and approve meetings' },
  { id: 'view_reports', label: 'View Reports', description: 'Access analytics and reports' },
  { id: 'manage_announcements', label: 'Manage Announcements', description: 'Post announcements' },
  { id: 'clock_in_out', label: 'Clock In/Out', description: 'Track work hours' },
];

const PRESET_COLORS = [
  '#FFD700', '#FFA500', '#FF4500', '#DC143C', '#9370DB',
  '#4169E1', '#32CD32', '#20B2AA', '#FF69B4', '#A9A9A9',
  '#000000', '#FFEB3B', '#8B4513', '#2E8B57', '#FF1493'
];

export function RolesManagement({ appState, setAppState }: RolesManagementProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#4169E1',
    permissions: [] as string[]
  });

  useEffect(() => {
    setRoles(appState.roles);
  }, [appState.roles]);

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditMode(true);
      setSelectedRole(role);
      setFormData({
        name: role.name,
        description: role.description || '',
        color: role.color || '#4169E1',
        permissions: role.permissions
      });
    } else {
      setEditMode(false);
      setSelectedRole(null);
      setFormData({
        name: '',
        description: '',
        color: '#4169E1',
        permissions: []
      });
    }
    setDialogOpen(true);
  };

  const togglePermission = (permissionId: string) => {
    if (formData.permissions.includes('all')) {
      // If "all" is selected, deselect it and start fresh
      setFormData({
        ...formData,
        permissions: [permissionId]
      });
    } else if (permissionId === 'all') {
      // If selecting "all", clear others
      setFormData({
        ...formData,
        permissions: ['all']
      });
    } else {
      const newPermissions = formData.permissions.includes(permissionId)
        ? formData.permissions.filter(p => p !== permissionId)
        : [...formData.permissions, permissionId];
      
      setFormData({
        ...formData,
        permissions: newPermissions
      });
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    if (formData.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      let updatedRoles: Role[];

      if (editMode && selectedRole) {
        updatedRoles = roles.map(r =>
          r.id === selectedRole.id
            ? { ...r, ...formData }
            : r
        );
      } else {
        const newRole: Role = {
          id: crypto.randomUUID(),
          ...formData
        };
        updatedRoles = [...roles, newRole];
      }

      await updateData(appState.office!.id, 'roles', updatedRoles);
      
      setAppState({
        ...appState,
        roles: updatedRoles
      });

      toast.success(editMode ? 'Role updated' : 'Role created');
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving role:', error);
      toast.error(error.message || 'Failed to save role');
    }
  };

  const handleDelete = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    
    if (role?.name === 'Owner') {
      toast.error('Cannot delete Owner role');
      return;
    }

    const employeesWithRole = appState.employees.filter(e => e.role === role?.name);
    if (employeesWithRole.length > 0) {
      toast.error(`Cannot delete role. ${employeesWithRole.length} employee(s) have this role.`);
      return;
    }

    try {
      const updatedRoles = roles.filter(r => r.id !== roleId);
      await updateData(appState.office!.id, 'roles', updatedRoles);
      
      setAppState({
        ...appState,
        roles: updatedRoles
      });

      toast.success('Role deleted');
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(error.message || 'Failed to delete role');
    }
  };

  const isCreatorOrHead = appState.currentEmployee?.isCreator || appState.currentEmployee?.isHeadManager;

  if (!isCreatorOrHead) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only creators and head managers can manage roles</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Role Management</h1>
          <p className="text-gray-600">Create and configure roles with permissions</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {roles.map(role => (
          <Card key={role.id} className="p-6 border-2 border-black hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: role.color || '#4169E1' }}
                >
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-black mb-1">{role.name}</h3>
                  {role.description && (
                    <p className="text-sm text-gray-600">{role.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {appState.employees.filter(e => e.role === role.name).length} member(s)
                  </p>
                </div>
              </div>
              {role.name !== 'Owner' && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenDialog(role)}
                    className="text-gray-400 hover:text-yellow-500"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(role.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.includes('all') ? (
                  <Badge className="bg-yellow-400 text-black">All Permissions</Badge>
                ) : (
                  role.permissions.slice(0, 4).map(perm => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {AVAILABLE_PERMISSIONS.find(p => p.id === perm)?.label || perm}
                    </Badge>
                  ))
                )}
                {role.permissions.length > 4 && !role.permissions.includes('all') && (
                  <Badge variant="outline" className="text-xs">
                    +{role.permissions.length - 4} more
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Supervisor"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="roleDescription">Description (Optional)</Label>
              <Textarea
                id="roleDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this role..."
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Role Color
              </Label>
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border-2 border-black"
                  style={{ backgroundColor: formData.color }}
                />
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded border-2 ${
                        formData.color === color ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-3">Permissions</Label>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {AVAILABLE_PERMISSIONS.map(permission => (
                  <div
                    key={permission.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id) || formData.permissions.includes('all')}
                      onCheckedChange={() => togglePermission(permission.id)}
                      disabled={permission.id !== 'all' && formData.permissions.includes('all')}
                    />
                    <div className="flex-1">
                      <Label htmlFor={permission.id} className="cursor-pointer">
                        {permission.label}
                      </Label>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
              >
                {editMode ? 'Update Role' : 'Create Role'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
