import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, XCircle, Clock, Coffee, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import type { AppState } from '../../App';

interface EmployeeStatus {
  employeeId: string;
  status: 'available' | 'dnd' | 'on-break' | 'offline' | 'clocked-in';
  clockedIn: boolean;
  onBreak: boolean;
  lastActive: string;
  customMessage?: string;
}

interface StatusManagementProps {
  appState: AppState;
}

export function StatusManagement({ appState }: StatusManagementProps) {
  const [statuses, setStatuses] = useState<Record<string, EmployeeStatus>>({});
  const [myStatus, setMyStatus] = useState<'available' | 'dnd'>('available');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatuses();
    const interval = setInterval(loadStatuses, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [appState.office, appState.currentEmployee]);

  const loadStatuses = async () => {
    if (!appState.office) return;

    try {
      // Load employee statuses
      const statusData = await getData(appState.office.id, 'employee-statuses');
      const savedStatuses = statusData.data || {};

      // Load clock history to determine clocked-in status
      const clockData = await getData(appState.office.id, 'clock-history');
      const clockHistory = clockData.data || [];

      const updatedStatuses: Record<string, EmployeeStatus> = {};

      appState.employees.forEach(emp => {
        const savedStatus = savedStatuses[emp.id];
        const activeClock = clockHistory.find((c: any) => c.employeeId === emp.id && !c.clockOut);
        const onBreak = activeClock?.breaks?.some((b: any) => !b.endTime) || false;

        // Priority: on-break > clocked-in > saved manual status (available/dnd) > offline
        let finalStatus: 'available' | 'dnd' | 'on-break' | 'offline' | 'clocked-in';
        if (onBreak) {
          finalStatus = 'on-break';
        } else if (activeClock) {
          finalStatus = 'clocked-in';
        } else if (savedStatus?.status === 'available' || savedStatus?.status === 'dnd') {
          finalStatus = savedStatus.status;
        } else {
          finalStatus = 'offline';
        }

        updatedStatuses[emp.id] = {
          employeeId: emp.id,
          status: finalStatus,
          clockedIn: !!activeClock,
          onBreak: onBreak,
          lastActive: savedStatus?.lastActive || new Date().toISOString(),
          customMessage: savedStatus?.customMessage
        };
      });

      setStatuses(updatedStatuses);

      // Update my status display
      if (appState.currentEmployee && savedStatuses[appState.currentEmployee.id]) {
        const mySavedStatus = savedStatuses[appState.currentEmployee.id].status;
        if (mySavedStatus === 'available' || mySavedStatus === 'dnd') {
          setMyStatus(mySavedStatus);
        }
      }
    } catch (error) {
      console.error('Error loading statuses:', error);
    }
  };

  const updateMyStatus = async (newStatus: 'available' | 'dnd') => {
    if (!appState.currentEmployee || !appState.office) return;

    setLoading(true);
    try {
      const statusData = await getData(appState.office.id, 'employee-statuses');
      const allStatuses = statusData.data || {};

      // Update status while preserving clock state
      allStatuses[appState.currentEmployee.id] = {
        ...allStatuses[appState.currentEmployee.id],
        employeeId: appState.currentEmployee.id,
        status: newStatus,
        lastActive: new Date().toISOString()
      };

      await updateData(appState.office.id, 'employee-statuses', allStatuses);
      setMyStatus(newStatus);
      toast.success(`Status changed to ${newStatus === 'dnd' ? 'Do Not Disturb' : 'Available'}`);
      
      // Reload to update display
      await loadStatuses();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: EmployeeStatus['status']) => {
    const config = {
      'clocked-in': { label: 'Clocked In', color: 'bg-green-500', icon: Clock },
      'on-break': { label: 'On Break', color: 'bg-orange-500', icon: Coffee },
      'available': { label: 'Available', color: 'bg-blue-500', icon: Activity },
      'dnd': { label: 'Do Not Disturb', color: 'bg-red-500', icon: XCircle },
      'offline': { label: 'Offline', color: 'bg-gray-400', icon: XCircle }
    };

    const statusConfig = config[status];
    const Icon = statusConfig.icon;

    return (
      <Badge className={`${statusConfig.color} text-white flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {statusConfig.label}
      </Badge>
    );
  };

  // Group employees by status
  const employeesByStatus = {
    'clocked-in': appState.employees.filter(e => 
      statuses[e.id]?.status === 'clocked-in'
    ),
    'on-break': appState.employees.filter(e => 
      statuses[e.id]?.status === 'on-break'
    ),
    'available': appState.employees.filter(e => 
      statuses[e.id]?.status === 'available'
    ),
    'dnd': appState.employees.filter(e => 
      statuses[e.id]?.status === 'dnd'
    ),
    'offline': appState.employees.filter(e => 
      statuses[e.id]?.status === 'offline'
    )
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Team Status</h1>
          <p className="text-gray-600">Real-time availability of all team members</p>
        </div>
        <Button
          onClick={() => loadStatuses()}
          variant="outline"
          className="border-2 border-black"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* My Status Card */}
      <Card className="p-6 border-2 border-yellow-400 bg-yellow-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Your Current Status</p>
            <div className="flex items-center gap-2 mb-3">
              {appState.currentEmployee && getStatusBadge(statuses[appState.currentEmployee.id]?.status || 'offline')}
            </div>
            <p className="text-xs text-gray-500">
              Set your status to let your team know your availability
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => updateMyStatus('available')}
              disabled={loading || statuses[appState.currentEmployee?.id || '']?.clockedIn}
              variant={myStatus === 'available' ? 'default' : 'outline'}
              className={myStatus === 'available' ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
            >
              <Activity className="w-4 h-4 mr-2" />
              Available
            </Button>
            <Button
              onClick={() => updateMyStatus('dnd')}
              disabled={loading || statuses[appState.currentEmployee?.id || '']?.clockedIn}
              variant={myStatus === 'dnd' ? 'default' : 'outline'}
              className={myStatus === 'dnd' ? 'bg-red-500 text-white hover:bg-red-600' : ''}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Do Not Disturb
            </Button>
          </div>
        </div>
        {statuses[appState.currentEmployee?.id || '']?.clockedIn && (
          <p className="text-xs text-gray-500 mt-3">
            Note: Your status is automatically set based on clock-in state. Clock out to change it manually.
          </p>
        )}
      </Card>

      {/* Status Overview */}
      <div className="grid md:grid-cols-5 gap-3">
        <Card className="p-4 border-2 border-green-500">
          <div className="text-center">
            <Clock className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{employeesByStatus['clocked-in'].length}</p>
            <p className="text-sm text-gray-600">Clocked In</p>
          </div>
        </Card>
        <Card className="p-4 border-2 border-orange-500">
          <div className="text-center">
            <Coffee className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{employeesByStatus['on-break'].length}</p>
            <p className="text-sm text-gray-600">On Break</p>
          </div>
        </Card>
        <Card className="p-4 border-2 border-blue-500">
          <div className="text-center">
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{employeesByStatus['available'].length}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </Card>
        <Card className="p-4 border-2 border-red-500">
          <div className="text-center">
            <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl text-black">{employeesByStatus['dnd'].length}</p>
            <p className="text-sm text-gray-600">DND</p>
          </div>
        </Card>
        <Card className="p-4 border-2 border-gray-400">
          <div className="text-center">
            <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-2xl text-black">{employeesByStatus['offline'].length}</p>
            <p className="text-sm text-gray-600">Offline</p>
          </div>
        </Card>
      </div>

      {/* Employees by Status */}
      <div className="space-y-6">
        {/* Clocked In */}
        {employeesByStatus['clocked-in'].length > 0 && (
          <div>
            <h2 className="text-black mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              Clocked In ({employeesByStatus['clocked-in'].length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeesByStatus['clocked-in'].map(emp => {
                const role = appState.roles.find(r => r.name === emp.role);
                return (
                  <Card key={emp.id} className="p-4 border-2 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black">{emp.name}</p>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: role?.color || '#000',
                            color: role?.color || '#000'
                          }}
                          className="text-xs mt-1"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                      {getStatusBadge('clocked-in')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* On Break */}
        {employeesByStatus['on-break'].length > 0 && (
          <div>
            <h2 className="text-black mb-3 flex items-center gap-2">
              <Coffee className="w-5 h-5 text-orange-500" />
              On Break ({employeesByStatus['on-break'].length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeesByStatus['on-break'].map(emp => {
                const role = appState.roles.find(r => r.name === emp.role);
                return (
                  <Card key={emp.id} className="p-4 border-2 border-orange-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black">{emp.name}</p>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: role?.color || '#000',
                            color: role?.color || '#000'
                          }}
                          className="text-xs mt-1"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                      {getStatusBadge('on-break')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Available */}
        {employeesByStatus['available'].length > 0 && (
          <div>
            <h2 className="text-black mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Available ({employeesByStatus['available'].length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeesByStatus['available'].map(emp => {
                const role = appState.roles.find(r => r.name === emp.role);
                return (
                  <Card key={emp.id} className="p-4 border-2 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black">{emp.name}</p>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: role?.color || '#000',
                            color: role?.color || '#000'
                          }}
                          className="text-xs mt-1"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                      {getStatusBadge('available')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Do Not Disturb */}
        {employeesByStatus['dnd'].length > 0 && (
          <div>
            <h2 className="text-black mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Do Not Disturb ({employeesByStatus['dnd'].length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeesByStatus['dnd'].map(emp => {
                const role = appState.roles.find(r => r.name === emp.role);
                return (
                  <Card key={emp.id} className="p-4 border-2 border-red-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-black">{emp.name}</p>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: role?.color || '#000',
                            color: role?.color || '#000'
                          }}
                          className="text-xs mt-1"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                      {getStatusBadge('dnd')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Offline */}
        {employeesByStatus['offline'].length > 0 && (
          <div>
            <h2 className="text-black mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              Offline ({employeesByStatus['offline'].length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employeesByStatus['offline'].map(emp => {
                const role = appState.roles.find(r => r.name === emp.role);
                return (
                  <Card key={emp.id} className="p-4 border border-gray-300 opacity-60">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-700">{emp.name}</p>
                        <Badge 
                          variant="outline"
                          className="text-xs mt-1"
                        >
                          {emp.role}
                        </Badge>
                      </div>
                      {getStatusBadge('offline')}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
