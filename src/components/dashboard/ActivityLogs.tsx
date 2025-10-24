import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Download, 
  Search, 
  FileText, 
  Clock,
  User,
  Calendar,
  Filter,
  Shield
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { AppState } from '../../App';

interface ActivityLogsProps {
  appState: AppState;
}

interface LogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  category: 'auth' | 'employee' | 'shift' | 'task' | 'inventory' | 'role' | 'clock' | 'system';
}

export function ActivityLogs({ appState }: ActivityLogsProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadLogs();
  }, [appState.office]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedCategory]);

  const loadLogs = () => {
    const storedLogs = localStorage.getItem(`office:${appState.office?.id}:activity-logs`);
    if (storedLogs) {
      const parsed = JSON.parse(storedLogs);
      setLogs(parsed.sort((a: LogEntry, b: LogEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ));
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  };

  const downloadLogs = (format: 'csv' | 'json') => {
    try {
      if (format === 'csv') {
        const headers = ['Timestamp', 'User', 'Action', 'Details', 'Category'];
        const rows = filteredLogs.map(log => [
          new Date(log.timestamp).toLocaleString(),
          log.userName,
          log.action,
          log.details,
          log.category
        ]);

        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buziz-activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const json = JSON.stringify(filteredLogs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `buziz-activity-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast.success(`Logs downloaded as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error downloading logs:', error);
      toast.error('Failed to download logs');
    }
  };

  const categories = [
    { id: 'all', label: 'All Activities', color: 'bg-gray-500' },
    { id: 'auth', label: 'Authentication', color: 'bg-blue-500' },
    { id: 'employee', label: 'Employee', color: 'bg-green-500' },
    { id: 'shift', label: 'Shifts', color: 'bg-purple-500' },
    { id: 'task', label: 'Tasks', color: 'bg-yellow-500' },
    { id: 'inventory', label: 'Inventory', color: 'bg-orange-500' },
    { id: 'role', label: 'Roles', color: 'bg-pink-500' },
    { id: 'clock', label: 'Time Clock', color: 'bg-cyan-500' },
    { id: 'system', label: 'System', color: 'bg-red-500' }
  ];

  const getCategoryColor = (category: string) => {
    return categories.find(c => c.id === category)?.color || 'bg-gray-500';
  };

  if (!appState.currentEmployee?.isCreator && !appState.currentEmployee?.isHeadManager) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center border-2 border-black">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-black mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only creators and head managers can view activity logs</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1">Activity Logs</h1>
          <p className="text-gray-600">Monitor all activities in your office</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => downloadLogs('csv')}
            variant="outline"
            className="border-2 border-black"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          <Button
            onClick={() => downloadLogs('json')}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Total Logs</p>
          <p className="text-black text-2xl">{logs.length}</p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Today</p>
          <p className="text-black text-2xl">
            {logs.filter(log => 
              new Date(log.timestamp).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">This Week</p>
          <p className="text-black text-2xl">
            {logs.filter(log => {
              const logDate = new Date(log.timestamp);
              const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
              return logDate >= weekAgo;
            }).length}
          </p>
        </Card>
        <Card className="p-4 border-2 border-black text-center">
          <p className="text-gray-600 text-sm mb-1">Filtered</p>
          <p className="text-black text-2xl">{filteredLogs.length}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-2 border-black">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <Badge
                key={cat.id}
                className={`cursor-pointer ${
                  selectedCategory === cat.id
                    ? `${getCategoryColor(cat.id)} text-white`
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>
      </Card>

      {/* Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-black mb-2">No logs found</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your filters'
                : 'Activity logs will appear here as actions are performed'}
            </p>
          </Card>
        ) : (
          filteredLogs.map(log => (
            <Card key={log.id} className="p-4 border-2 border-black hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${getCategoryColor(log.category)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {log.category === 'clock' && <Clock className="w-5 h-5 text-white" />}
                  {log.category === 'employee' && <User className="w-5 h-5 text-white" />}
                  {log.category === 'shift' && <Calendar className="w-5 h-5 text-white" />}
                  {log.category === 'role' && <Shield className="w-5 h-5 text-white" />}
                  {!['clock', 'employee', 'shift', 'role'].includes(log.category) && (
                    <FileText className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-black truncate">{log.action}</h4>
                    <Badge variant="outline" className="text-xs">
                      {log.category}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{log.details}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.userName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Helper function to log activities (can be called from anywhere)
export const logActivity = (
  officeId: string,
  userId: string,
  userName: string,
  action: string,
  details: string,
  category: LogEntry['category']
) => {
  const logs = JSON.parse(
    localStorage.getItem(`office:${officeId}:activity-logs`) || '[]'
  );

  const newLog: LogEntry = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    details,
    category
  };

  logs.push(newLog);
  localStorage.setItem(`office:${officeId}:activity-logs`, JSON.stringify(logs));
};
