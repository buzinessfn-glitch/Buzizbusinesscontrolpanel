import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Users, Calendar, CheckSquare, Package, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import { getData, getClockHistory } from '../../utils/api';
import type { AppState } from '../../App';

interface OverviewProps {
  appState: AppState;
}

export function Overview({ appState }: OverviewProps) {
  const [shifts, setShifts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [clockHistory, setClockHistory] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [appState.office]);

  const loadData = async () => {
    if (!appState.office) return;

    try {
      const [shiftsData, tasksData, inventoryData, clockData] = await Promise.all([
        getData(appState.office.id, 'shifts').catch(() => ({ data: [] })),
        getData(appState.office.id, 'tasks').catch(() => ({ data: [] })),
        getData(appState.office.id, 'inventory').catch(() => ({ data: [] })),
        getClockHistory(appState.office.id).catch(() => ({ clockHistory: [] }))
      ]);

      setShifts(shiftsData.data || []);
      setTasks(tasksData.data || []);
      setInventory(inventoryData.data || []);
      setClockHistory(clockData.clockHistory || []);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };
  
  const activeTasks = tasks.filter((t: any) => t.status !== 'done').length;
  const lowStockItems = inventory.filter((i: any) => i.quantity <= i.lowStockThreshold).length;
  const todayShifts = shifts.filter((s: any) => {
    const shiftDate = new Date(s.date).toDateString();
    const today = new Date().toDateString();
    return shiftDate === today;
  }).length;

  // Calculate today's hours and wages for current employee
  const today = new Date().toDateString();
  const todayEntries = clockHistory.filter((entry: any) => 
    entry.employeeId === appState.currentEmployee?.id &&
    new Date(entry.clockIn).toDateString() === today
  );
  const todayHours = todayEntries.reduce((sum: number, entry: any) => sum + (entry.hoursWorked || 0), 0);
  const todayWages = todayEntries.reduce((sum: number, entry: any) => sum + (entry.wagesEarned || 0), 0);

  const stats = [
    {
      label: 'Total Staff',
      value: appState.employees.length,
      icon: Users,
      color: 'bg-black'
    },
    {
      label: "Today's Shifts",
      value: todayShifts,
      icon: Calendar,
      color: 'bg-gray-800'
    },
    {
      label: 'Active Tasks',
      value: activeTasks,
      icon: CheckSquare,
      color: 'bg-gray-600'
    },
    {
      label: 'Inventory Items',
      value: inventory.length,
      icon: Package,
      color: 'bg-gray-400'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-black mb-1">Welcome back, {appState.currentEmployee?.name}</h1>
        <p className="text-gray-600">Here's what's happening in your office today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="p-6 border-2 border-black">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-black">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Today's Time Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Hours Worked Today</p>
              <p className="text-black">{todayHours.toFixed(2)} hrs</p>
            </div>
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Wages Earned Today</p>
              <p className="text-black">${todayWages.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {lowStockItems > 0 && (
        <Card className="p-6 border-2 border-black bg-gray-50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-black mb-1">Low Stock Alert</p>
              <p className="text-gray-600">
                {lowStockItems} item{lowStockItems > 1 ? 's are' : ' is'} running low on stock. Check inventory for details.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Info */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 border-2 border-black">
          <h3 className="text-black mb-4">Office Information</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Office Code</p>
              <p className="text-black">{appState.office?.code}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Your Role</p>
              <p className="text-black">{appState.currentEmployee?.role}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Employee Number</p>
              <p className="text-black">#{appState.currentEmployee?.employeeNumber}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black">
          <h3 className="text-black mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div>
              <p className="text-gray-600 text-sm">Total Roles</p>
              <p className="text-black">{appState.roles.length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Completed Tasks</p>
              <p className="text-black">{tasks.filter((t: any) => t.status === 'done').length}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Shifts</p>
              <p className="text-black">{shifts.length}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}