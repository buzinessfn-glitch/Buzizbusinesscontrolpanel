import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Bell, BellRing, User, CheckCircle, X, Send } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
import type { AppState, Employee } from '../../App';

interface Notification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  type: 'page' | 'system' | 'alert';
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsProps {
  appState: AppState;
}

export function Notifications({ appState }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pageDialogOpen, setPageDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [appState.office, appState.currentEmployee]);

  const loadNotifications = async () => {
    if (!appState.office || !appState.currentEmployee) return;
    
    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];
      
      // Filter notifications for current employee
      const myNotifications = allNotifications.filter(
        n => n.recipientId === appState.currentEmployee?.id
      );
      
      setNotifications(myNotifications.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
      const unread = myNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      // Show toast for new unread notifications
      const recentUnread = myNotifications.filter(n => 
        !n.read && 
        new Date(n.createdAt).getTime() > Date.now() - 15000 // Last 15 seconds
      );
      
      recentUnread.forEach(notification => {
        if (notification.type === 'page') {
          toast(notification.message, {
            icon: <BellRing className="w-4 h-4 text-yellow-500" />,
            duration: 5000
          });
        }
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handlePageEmployee = async () => {
    if (!selectedEmployee || !appState.currentEmployee || !appState.office) {
      toast.error('Please select an employee');
      return;
    }

    const employee = appState.employees.find(e => e.id === selectedEmployee);
    if (!employee) return;

    // Check if employee is available
    const statusData = await getData(appState.office.id, 'employee-statuses');
    const statuses = statusData.data || {};
    const employeeStatus = statuses[selectedEmployee];

    if (employeeStatus?.status === 'dnd') {
      toast.error(`${employee.name} is set to Do Not Disturb`);
      return;
    }

    if (employeeStatus?.status === 'offline') {
      toast.warning(`${employee.name} is currently offline`);
    }

    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];

      const newNotification: Notification = {
        id: crypto.randomUUID(),
        recipientId: selectedEmployee,
        senderId: appState.currentEmployee.id,
        senderName: appState.currentEmployee.name,
        senderRole: appState.currentEmployee.role,
        type: 'page',
        message: `${appState.currentEmployee.name} (${appState.currentEmployee.role}) wants to speak with you`,
        read: false,
        createdAt: new Date().toISOString()
      };

      allNotifications.push(newNotification);
      await updateData(appState.office.id, 'notifications', allNotifications);

      logActivity(
        appState.office.id,
        appState.currentEmployee.id,
        appState.currentEmployee.name,
        'Employee Paged',
        `Paged ${employee.name}`,
        'communication'
      );

      toast.success(`${employee.name} has been paged`);
      setPageDialogOpen(false);
      setSelectedEmployee('');
    } catch (error) {
      console.error('Error paging employee:', error);
      toast.error('Failed to page employee');
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!appState.office) return;

    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];
      
      const updatedNotifications = allNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      
      await updateData(appState.office.id, 'notifications', updatedNotifications);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];
      
      const updatedNotifications = allNotifications.map(n =>
        n.recipientId === appState.currentEmployee?.id ? { ...n, read: true } : n
      );
      
      await updateData(appState.office.id, 'notifications', updatedNotifications);
      loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!appState.office) return;

    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];
      
      const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
      
      await updateData(appState.office.id, 'notifications', updatedNotifications);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!appState.office || !appState.currentEmployee) return;

    try {
      const data = await getData(appState.office.id, 'notifications');
      const allNotifications: Notification[] = data.data || [];
      
      // Keep notifications for other employees
      const updatedNotifications = allNotifications.filter(
        n => n.recipientId !== appState.currentEmployee?.id
      );
      
      await updateData(appState.office.id, 'notifications', updatedNotifications);
      loadNotifications();
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Get available employees (not offline or DND)
  const getAvailableEmployees = () => {
    return appState.employees.filter(e => e.id !== appState.currentEmployee?.id);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'page':
        return <BellRing className="w-5 h-5 text-yellow-500" />;
      case 'alert':
        return <Bell className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-black mb-1 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">
                {unreadCount}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600">Messages and alerts from your team</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPageDialogOpen(true)}
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
          >
            <Send className="w-4 h-4 mr-2" />
            Page Employee
          </Button>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              className="border-2 border-black"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Unread Notifications */}
      {notifications.filter(n => !n.read).length > 0 && (
        <div>
          <h2 className="text-black mb-4">Unread ({unreadCount})</h2>
          <div className="space-y-3">
            {notifications.filter(n => !n.read).map(notification => (
              <Card
                key={notification.id}
                className="p-4 border-2 border-yellow-400 bg-yellow-50"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {notification.type}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-black">{notification.message}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          From: {notification.senderName} • {notification.senderRole}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => markAsRead(notification.id)}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Mark as Read
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Read Notifications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-black">
            Previous ({notifications.filter(n => n.read).length})
          </h2>
          {notifications.length > 0 && (
            <Button
              onClick={clearAllNotifications}
              variant="outline"
              size="sm"
              className="text-red-500 border-red-500 hover:bg-red-50"
            >
              Clear All
            </Button>
          )}
        </div>
        {notifications.filter(n => n.read).length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-gray-300">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No previous notifications</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.filter(n => n.read).slice(0, 10).map(notification => (
              <Card
                key={notification.id}
                className="p-4 border border-gray-300 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        From: {notification.senderName} • {notification.senderRole}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Page Employee Dialog */}
      <Dialog open={pageDialogOpen} onOpenChange={setPageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Page an Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Send a notification to request someone's attention. They'll receive an instant alert if they're available.
            </p>
            <div>
              <Label>Select Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableEmployees().map(emp => {
                    const role = appState.roles.find(r => r.name === emp.role);
                    return (
                      <SelectItem key={emp.id} value={emp.id}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{emp.name}</span>
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: role?.color || '#000',
                              color: role?.color || '#000'
                            }}
                            className="text-xs"
                          >
                            {emp.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setPageDialogOpen(false);
                  setSelectedEmployee('');
                }} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePageEmployee}
                className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-500 hover:to-yellow-600"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Page
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
