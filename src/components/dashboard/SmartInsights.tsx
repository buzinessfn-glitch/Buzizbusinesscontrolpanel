import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  DollarSign, 
  Users, 
  CheckCircle2,
  XCircle,
  Zap,
  Brain,
  Target,
  Award
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData } from '../../utils/storage';
import type { AppState, Employee } from '../../App';

interface SmartInsightsProps {
  appState: AppState;
}

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'urgent';
  category: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: number;
}

interface OvertimeData {
  employeeId: string;
  employeeName: string;
  hoursThisWeek: number;
  projectedWeeklyHours: number;
}

interface AbsencePattern {
  employeeId: string;
  employeeName: string;
  absenceCount: number;
  lastAbsence: string;
}

export function SmartInsights({ appState }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [overtimeData, setOvertimeData] = useState<OvertimeData[]>([]);
  const [absencePatterns, setAbsencePatterns] = useState<AbsencePattern[]>([]);
  const [laborCost, setLaborCost] = useState({ weekly: 0, monthly: 0, projected: 0 });

  useEffect(() => {
    if (appState.office) {
      analyzeData();
    }
  }, [appState.office, appState.employees]);

  const analyzeData = async () => {
    if (!appState.office) return;

    const newInsights: Insight[] = [];

    // Get data
    const clockData = await getData(appState.office.id, 'clock-history');
    const clockHistory = clockData.data || [];
    
    const shiftsData = await getData(appState.office.id, 'shifts');
    const shifts = shiftsData.data || [];
    
    const tasksData = await getData(appState.office.id, 'tasks');
    const tasks = tasksData.data || [];
    
    const leaveData = await getData(appState.office.id, 'leave-requests');
    const leaveRequests = leaveData.data || [];

    const meetingsData = await getData(appState.office.id, 'meetings');
    const meetings = meetingsData.data || [];

    // 1. Analyze Overtime
    const overtimeAnalysis = analyzeOvertime(clockHistory, appState.employees);
    setOvertimeData(overtimeAnalysis);
    
    overtimeAnalysis.forEach(overtime => {
      if (overtime.projectedWeeklyHours > 40) {
        newInsights.push({
          id: `overtime-${overtime.employeeId}`,
          type: overtime.projectedWeeklyHours > 50 ? 'urgent' : 'warning',
          category: 'Overtime Alert',
          title: `${overtime.employeeName} approaching overtime`,
          description: `Projected ${overtime.projectedWeeklyHours.toFixed(1)} hours this week. Current: ${overtime.hoursThisWeek.toFixed(1)}hrs`,
          priority: overtime.projectedWeeklyHours > 50 ? 10 : 7
        });
      }
    });

    // 2. Analyze Absence Patterns
    const absenceAnalysis = analyzeAbsences(leaveRequests, appState.employees);
    setAbsencePatterns(absenceAnalysis);
    
    absenceAnalysis.forEach(pattern => {
      if (pattern.absenceCount >= 3) {
        newInsights.push({
          id: `absence-${pattern.employeeId}`,
          type: 'warning',
          category: 'Attendance Pattern',
          title: `${pattern.employeeName} has frequent absences`,
          description: `${pattern.absenceCount} absences in the last 30 days. Last: ${new Date(pattern.lastAbsence).toLocaleDateString()}`,
          priority: 6
        });
      }
    });

    // 3. Analyze Task Completion
    const taskCompletion = analyzeTaskCompletion(tasks, appState.employees);
    Object.entries(taskCompletion).forEach(([empId, data]: [string, any]) => {
      if (data.completionRate < 50 && data.totalTasks > 3) {
        const emp = appState.employees.find(e => e.id === empId);
        newInsights.push({
          id: `task-${empId}`,
          type: 'warning',
          category: 'Task Performance',
          title: `${emp?.name} has low task completion`,
          description: `Only ${data.completionRate.toFixed(0)}% of tasks completed (${data.completed}/${data.totalTasks})`,
          priority: 5
        });
      } else if (data.completionRate === 100 && data.totalTasks >= 5) {
        const emp = appState.employees.find(e => e.id === empId);
        newInsights.push({
          id: `task-success-${empId}`,
          type: 'success',
          category: 'Top Performer',
          title: `${emp?.name} completed all tasks`,
          description: `Perfect completion rate on ${data.totalTasks} tasks`,
          priority: 3
        });
      }
    });

    // 4. Analyze Labor Costs
    const costs = analyzeLaborCosts(clockHistory, appState.employees);
    setLaborCost(costs);
    
    if (costs.projected > costs.weekly * 1.3) {
      newInsights.push({
        id: 'labor-cost-spike',
        type: 'urgent',
        category: 'Budget Alert',
        title: 'Labor costs trending high',
        description: `Projected monthly cost: $${costs.projected.toFixed(2)} (30% above normal)`,
        priority: 9
      });
    }

    // 5. Analyze Shift Coverage
    const coverageGaps = analyzeShiftCoverage(shifts, appState.employees);
    coverageGaps.forEach(gap => {
      newInsights.push({
        id: `coverage-${gap.date}`,
        type: 'warning',
        category: 'Shift Coverage',
        title: 'Understaffed shift detected',
        description: `${gap.date} has only ${gap.assignedCount} employees (needs ${gap.requiredCount})`,
        priority: 8
      });
    });

    // 6. Analyze Meeting Conflicts
    const conflictCount = analyzeMeetingConflicts(meetings);
    if (conflictCount > 0) {
      newInsights.push({
        id: 'meeting-conflicts',
        type: 'warning',
        category: 'Scheduling',
        title: `${conflictCount} potential meeting conflicts`,
        description: 'Employees may be double-booked',
        priority: 4
      });
    }

    // 7. Pending Approvals
    const pendingLeave = leaveRequests.filter((r: any) => r.status === 'pending').length;
    const pendingMeetings = meetings.filter((m: any) => m.status === 'pending').length;
    
    if (pendingLeave > 0) {
      newInsights.push({
        id: 'pending-leave',
        type: 'info',
        category: 'Pending Actions',
        title: `${pendingLeave} leave request${pendingLeave > 1 ? 's' : ''} awaiting approval`,
        description: 'Review and approve pending leave requests',
        priority: 7
      });
    }
    
    if (pendingMeetings > 0) {
      newInsights.push({
        id: 'pending-meetings',
        type: 'info',
        category: 'Pending Actions',
        title: `${pendingMeetings} meeting request${pendingMeetings > 1 ? 's' : ''} awaiting approval`,
        description: 'Review and approve pending meeting requests',
        priority: 7
      });
    }

    // Sort by priority (higher first)
    newInsights.sort((a, b) => b.priority - a.priority);
    setInsights(newInsights.slice(0, 10)); // Show top 10
  };

  const analyzeOvertime = (clockHistory: any[], employees: Employee[]): OvertimeData[] => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return employees.map(emp => {
      const empClocks = clockHistory.filter((c: any) => 
        c.employeeId === emp.id && 
        new Date(c.clockIn) >= startOfWeek
      );

      let totalMinutes = 0;
      empClocks.forEach((c: any) => {
        if (c.clockOut) {
          const start = new Date(c.clockIn);
          const end = new Date(c.clockOut);
          totalMinutes += (end.getTime() - start.getTime()) / 60000;
        }
      });

      const hoursThisWeek = totalMinutes / 60;
      const daysPassed = Math.max(1, (now.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24));
      const projectedWeeklyHours = (hoursThisWeek / daysPassed) * 7;

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        hoursThisWeek,
        projectedWeeklyHours
      };
    }).filter(d => d.hoursThisWeek > 0);
  };

  const analyzeAbsences = (leaveRequests: any[], employees: Employee[]): AbsencePattern[] => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return employees.map(emp => {
      const absences = leaveRequests.filter((r: any) => 
        r.employeeId === emp.id &&
        r.status === 'approved' &&
        new Date(r.startDate) >= thirtyDaysAgo
      );

      if (absences.length === 0) return null;

      const lastAbsence = absences.sort((a: any, b: any) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      )[0];

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        absenceCount: absences.length,
        lastAbsence: lastAbsence.startDate
      };
    }).filter(Boolean) as AbsencePattern[];
  };

  const analyzeTaskCompletion = (tasks: any[], employees: Employee[]) => {
    const taskStats: Record<string, any> = {};

    employees.forEach(emp => {
      const empTasks = tasks.filter((t: any) => t.assignedTo === emp.id);
      const completed = empTasks.filter((t: any) => t.status === 'completed').length;
      
      if (empTasks.length > 0) {
        taskStats[emp.id] = {
          totalTasks: empTasks.length,
          completed,
          completionRate: (completed / empTasks.length) * 100
        };
      }
    });

    return taskStats;
  };

  const analyzeLaborCosts = (clockHistory: any[], employees: Employee[]) => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let weeklyHours = 0;
    let monthlyHours = 0;

    clockHistory.forEach((c: any) => {
      const emp = employees.find(e => e.id === c.employeeId);
      if (!emp || !emp.payRate || !c.clockOut) return;

      const start = new Date(c.clockIn);
      const end = new Date(c.clockOut);
      const hours = (end.getTime() - start.getTime()) / 3600000;

      if (start >= startOfWeek) {
        weeklyHours += hours * emp.payRate;
      }
      if (start >= startOfMonth) {
        monthlyHours += hours * emp.payRate;
      }
    });

    const daysPassed = Math.max(1, (now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
    const projected = (monthlyHours / daysPassed) * 30;

    return {
      weekly: weeklyHours,
      monthly: monthlyHours,
      projected
    };
  };

  const analyzeShiftCoverage = (shifts: any[], employees: Employee[]) => {
    const gaps: any[] = [];
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    shifts.forEach((shift: any) => {
      const shiftDate = new Date(shift.date);
      if (shiftDate > next7Days || shiftDate < new Date()) return;

      const requiredCount = shift.requiredEmployees || 2;
      const assignedCount = shift.assignedTo?.length || 0;

      if (assignedCount < requiredCount) {
        gaps.push({
          date: shiftDate.toLocaleDateString(),
          assignedCount,
          requiredCount,
          gap: requiredCount - assignedCount
        });
      }
    });

    return gaps.slice(0, 3); // Top 3 gaps
  };

  const analyzeMeetingConflicts = (meetings: any[]) => {
    let conflicts = 0;
    
    for (let i = 0; i < meetings.length; i++) {
      for (let j = i + 1; j < meetings.length; j++) {
        const m1 = meetings[i];
        const m2 = meetings[j];
        
        if (m1.status === 'cancelled' || m2.status === 'cancelled') continue;

        const start1 = new Date(m1.datetime);
        const end1 = new Date(start1.getTime() + m1.duration * 60000);
        const start2 = new Date(m2.datetime);
        const end2 = new Date(start2.getTime() + m2.duration * 60000);

        if (start1 < end2 && end1 > start2) {
          const overlap = m1.attendees.filter((a: string) => m2.attendees.includes(a));
          if (overlap.length > 0) conflicts++;
        }
      }
    }

    return conflicts;
  };

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <Zap className="w-5 h-5 text-blue-500" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'urgent':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-orange-400 bg-orange-50';
      case 'success':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-blue-400 bg-blue-50';
    }
  };

  const canViewInsights = () => {
    if (!appState.currentEmployee) return false;
    const role = appState.roles.find(r => r.name === appState.currentEmployee?.role);
    return appState.currentEmployee.isCreator || 
           appState.currentEmployee.isHeadManager ||
           role?.permissions.includes('view_reports') ||
           role?.permissions.includes('all');
  };

  if (!canViewInsights()) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only managers and authorized roles can view insights</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Smart Insights
          </h1>
          <p className="text-gray-600">AI-powered analytics and recommendations</p>
        </div>
        <Button
          onClick={analyzeData}
          variant="outline"
          className="border-2 border-black"
        >
          <Zap className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overtime Risk</p>
              <p className="text-2xl text-black">
                {overtimeData.filter(d => d.projectedWeeklyHours > 40).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Weekly Labor</p>
              <p className="text-2xl text-black">${laborCost.weekly.toFixed(0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Projected Monthly</p>
              <p className="text-2xl text-black">${laborCost.projected.toFixed(0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Insights</p>
              <p className="text-2xl text-black">{insights.length}</p>
            </div>
            <Target className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Insights List */}
      <div>
        <h2 className="text-black mb-4">Active Insights & Recommendations</h2>
        {insights.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <p className="text-gray-600">Everything looks good! No issues detected.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {insights.map(insight => (
              <Card key={insight.id} className={`p-4 border-2 ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs">
                          {insight.category}
                        </Badge>
                        <h3 className="text-black">{insight.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                    {insight.action && (
                      <Button
                        size="sm"
                        onClick={insight.action.onClick}
                        className="mt-3 bg-black text-white hover:bg-gray-800"
                      >
                        {insight.action.label}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Top Performers */}
      {overtimeData.length > 0 && (
        <div>
          <h2 className="text-black mb-4">Hours Tracking (This Week)</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {overtimeData.slice(0, 6).map(data => (
              <Card key={data.employeeId} className="p-4 border border-gray-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-black">{data.employeeName}</p>
                    <p className="text-sm text-gray-600">
                      {data.hoursThisWeek.toFixed(1)}hrs worked
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Projected</p>
                    <p className={`${data.projectedWeeklyHours > 40 ? 'text-red-500' : 'text-black'}`}>
                      {data.projectedWeeklyHours.toFixed(1)}hrs
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
