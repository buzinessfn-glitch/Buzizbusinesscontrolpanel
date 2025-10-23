import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, LogIn, LogOut, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { clockIn, clockOut, getClockStatus, getClockHistory } from '../../utils/api';
import type { AppState } from '../../App';

interface TimeTrackingProps {
  appState: AppState;
}

interface ClockEntry {
  id: string;
  employeeId: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number;
  wagesEarned: number;
}

export function TimeTracking({ appState }: TimeTrackingProps) {
  const [activeClock, setActiveClock] = useState<ClockEntry | null>(null);
  const [clockHistory, setClockHistory] = useState<ClockEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClockStatus();
    loadClockHistory();
  }, []);

  useEffect(() => {
    if (activeClock) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeClock.clockIn);
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeClock]);

  const loadClockStatus = async () => {
    try {
      const data = await getClockStatus(appState.currentEmployee!.id);
      setActiveClock(data.activeClock);
    } catch (error) {
      console.error('Error loading clock status:', error);
    }
  };

  const loadClockHistory = async () => {
    try {
      const data = await getClockHistory(appState.office!.id);
      setClockHistory(data.clockHistory || []);
    } catch (error) {
      console.error('Error loading clock history:', error);
    }
  };

  const handleClockIn = async () => {
    setLoading(true);
    try {
      const data = await clockIn(appState.currentEmployee!.id, appState.office!.id);
      setActiveClock(data.clockEntry);
      toast.success('Clocked in successfully!');
    } catch (error: any) {
      console.error('Clock in error:', error);
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    setLoading(true);
    try {
      const data = await clockOut(appState.currentEmployee!.id, appState.office!.id);
      setActiveClock(null);
      setElapsedTime('00:00:00');
      await loadClockHistory();
      toast.success(`Clocked out! You worked ${data.clockEntry.hoursWorked} hours and earned $${data.clockEntry.wagesEarned.toFixed(2)}`);
    } catch (error: any) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const myHistory = clockHistory
    .filter(entry => entry.employeeId === appState.currentEmployee!.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  const totalHours = myHistory.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalWages = myHistory.reduce((sum, entry) => sum + entry.wagesEarned, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-black mb-1">Time Tracking</h1>
        <p className="text-gray-600">Clock in and out, track your hours and wages</p>
      </div>

      {/* Clock Status Card */}
      <Card className="p-6 border-2 border-black">
        <div className="flex flex-col items-center text-center space-y-4">
          {activeClock ? (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <Badge className="bg-green-500 text-white mb-2">Currently Clocked In</Badge>
                <h2 className="text-black mb-1">{elapsedTime}</h2>
                <p className="text-gray-600 text-sm">
                  Started at {new Date(activeClock.clockIn).toLocaleTimeString()}
                </p>
              </div>
              <Button
                onClick={handleClockOut}
                disabled={loading}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Clock Out
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-black mb-1">Not Clocked In</h2>
                <p className="text-gray-600 text-sm">
                  Click below to start tracking your time
                </p>
              </div>
              <Button
                onClick={handleClockIn}
                disabled={loading}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Clock In
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Hours Worked</p>
              <p className="text-black">{totalHours.toFixed(2)} hrs</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-2 border-black">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-1">Total Wages Earned</p>
              <p className="text-black">${totalWages.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Clock History */}
      <div>
        <h3 className="text-black mb-4">Your Time History</h3>
        {myHistory.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-black mb-2">No time entries yet</h3>
            <p className="text-gray-600">Clock in to start tracking your hours</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {myHistory.slice(0, 10).map(entry => (
              <Card key={entry.id} className="p-4 border-2 border-black">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-black">
                        {new Date(entry.clockIn).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span>{new Date(entry.clockIn).toLocaleTimeString()}</span>
                      <span className="mx-2">→</span>
                      <span>
                        {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'In progress'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-black">{entry.hoursWorked.toFixed(2)} hrs</p>
                    <p className="text-sm text-gray-600">${entry.wagesEarned.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pay Rate Info */}
      <Card className="p-4 border-2 border-black bg-gray-50">
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="w-4 h-4" />
          <span className="text-gray-600">
            Your current pay rate: 
            <span className="text-black ml-1">
              ${appState.currentEmployee?.payRate?.toFixed(2) || '0.00'}/hour
            </span>
          </span>
        </div>
      </Card>
    </div>
  );
}
