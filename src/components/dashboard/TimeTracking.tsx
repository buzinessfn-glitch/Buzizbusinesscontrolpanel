import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Clock, LogIn, LogOut, DollarSign, Calendar, Coffee } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { clockIn, clockOut, getClockStatus, getClockHistory } from '../../utils/api';
import { getData, updateData } from '../../utils/storage';
import { logActivity } from './ActivityLogs';
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
  breaks?: BreakEntry[];
}

interface BreakEntry {
  id: string;
  startTime: string;
  endTime: string | null;
  duration?: number;
}

interface OfficeSettings {
  breaksEnabled: 'disabled' | 'optional' | 'mandatory';
  mandatoryBreakAfterHours?: number;
  breakDuration?: number;
}

export function TimeTracking({ appState }: TimeTrackingProps) {
  const [activeClock, setActiveClock] = useState<ClockEntry | null>(null);
  const [clockHistory, setClockHistory] = useState<ClockEntry[]>([]);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [loading, setLoading] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [currentBreak, setCurrentBreak] = useState<BreakEntry | null>(null);
  const [breakTime, setBreakTime] = useState<string>('00:00:00');
  const [officeSettings, setOfficeSettings] = useState<OfficeSettings>({
    breaksEnabled: 'optional',
    mandatoryBreakAfterHours: 4,
    breakDuration: 30
  });

  useEffect(() => {
    loadOfficeSettings();
    loadClockStatus();
    loadClockHistory();
  }, []);

  useEffect(() => {
    if (activeClock) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(activeClock.clockIn);
        let diff = now.getTime() - start.getTime();
        
        // Subtract break time
        if (activeClock.breaks) {
          activeClock.breaks.forEach(b => {
            if (b.endTime) {
              const breakDuration = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
              diff -= breakDuration;
            }
          });
        }

        // Subtract current break time
        if (currentBreak && !currentBreak.endTime) {
          const breakDiff = now.getTime() - new Date(currentBreak.startTime).getTime();
          diff -= breakDiff;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );

        // Check mandatory break
        if (officeSettings.breaksEnabled === 'mandatory' && hours >= (officeSettings.mandatoryBreakAfterHours || 4) && !onBreak && (!activeClock.breaks || activeClock.breaks.length === 0)) {
          toast.warning('Time for a mandatory break!');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeClock, currentBreak, onBreak, officeSettings]);

  useEffect(() => {
    if (onBreak && currentBreak) {
      const interval = setInterval(() => {
        const now = new Date();
        const start = new Date(currentBreak.startTime);
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setBreakTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [onBreak, currentBreak]);

  const loadOfficeSettings = async () => {
    if (!appState.office) return;
    try {
      const data = await getData(appState.office.id, 'settings');
      if (data.data?.breaks) {
        setOfficeSettings(data.data.breaks);
      }
    } catch (error) {
      console.error('Error loading office settings:', error);
    }
  };

  const loadClockStatus = async () => {
    try {
      const data = await getClockStatus(appState.currentEmployee!.id);
      setActiveClock(data.activeClock);
      
      // Check if on break
      if (data.activeClock?.breaks) {
        const activeBreak = data.activeClock.breaks.find((b: BreakEntry) => !b.endTime);
        if (activeBreak) {
          setOnBreak(true);
          setCurrentBreak(activeBreak);
        }
      }
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
      
      logActivity(
        appState.office!.id,
        appState.currentEmployee!.id,
        appState.currentEmployee!.name,
        'Clocked In',
        `Clocked in at ${new Date().toLocaleTimeString()}`,
        'employee'
      );
      
      toast.success('Clocked in successfully!');
    } catch (error: any) {
      console.error('Clock in error:', error);
      toast.error(error.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (onBreak) {
      toast.error('Please end your break before clocking out');
      return;
    }

    setLoading(true);
    try {
      const data = await clockOut(appState.currentEmployee!.id, appState.office!.id);
      setActiveClock(null);
      setElapsedTime('00:00:00');
      await loadClockHistory();
      
      logActivity(
        appState.office!.id,
        appState.currentEmployee!.id,
        appState.currentEmployee!.name,
        'Clocked Out',
        `Clocked out after ${data.clockEntry.hoursWorked} hours, earned $${data.clockEntry.wagesEarned.toFixed(2)}`,
        'employee'
      );
      
      toast.success(`Clocked out! You worked ${data.clockEntry.hoursWorked} hours and earned $${data.clockEntry.wagesEarned.toFixed(2)}`);
    } catch (error: any) {
      console.error('Clock out error:', error);
      toast.error(error.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!activeClock) return;

    const newBreak: BreakEntry = {
      id: crypto.randomUUID(),
      startTime: new Date().toISOString(),
      endTime: null
    };

    const updatedClock = {
      ...activeClock,
      breaks: [...(activeClock.breaks || []), newBreak]
    };

    setActiveClock(updatedClock);
    setCurrentBreak(newBreak);
    setOnBreak(true);

    // Save to storage
    try {
      const data = await getClockStatus(appState.currentEmployee!.id);
      // Update the active clock with new break
      await updateData(`employee:${appState.currentEmployee!.id}`, 'active-clock', updatedClock);
      
      logActivity(
        appState.office!.id,
        appState.currentEmployee!.id,
        appState.currentEmployee!.name,
        'Break Started',
        'Started break',
        'employee'
      );
      
      toast.success('Break started');
    } catch (error) {
      console.error('Error starting break:', error);
      toast.error('Failed to start break');
    }
  };

  const handleEndBreak = async () => {
    if (!currentBreak || !activeClock) return;

    const now = new Date().toISOString();
    const duration = Math.floor((new Date(now).getTime() - new Date(currentBreak.startTime).getTime()) / 1000 / 60);

    const updatedBreak = {
      ...currentBreak,
      endTime: now,
      duration
    };

    const updatedClock = {
      ...activeClock,
      breaks: activeClock.breaks?.map(b => b.id === currentBreak.id ? updatedBreak : b) || []
    };

    setActiveClock(updatedClock);
    setCurrentBreak(null);
    setOnBreak(false);
    setBreakTime('00:00:00');

    // Save to storage
    try {
      await updateData(`employee:${appState.currentEmployee!.id}`, 'active-clock', updatedClock);
      
      logActivity(
        appState.office!.id,
        appState.currentEmployee!.id,
        appState.currentEmployee!.name,
        'Break Ended',
        `Break ended after ${duration} minutes`,
        'employee'
      );
      
      toast.success(`Break ended (${duration} minutes)`);
    } catch (error) {
      console.error('Error ending break:', error);
      toast.error('Failed to end break');
    }
  };

  const myHistory = clockHistory
    .filter(entry => entry.employeeId === appState.currentEmployee!.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  const totalHours = myHistory.reduce((sum, entry) => sum + entry.hoursWorked, 0);
  const totalWages = myHistory.reduce((sum, entry) => sum + entry.wagesEarned, 0);

  const canTakeBreak = officeSettings.breaksEnabled !== 'disabled' && activeClock && !onBreak;

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
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${onBreak ? 'bg-orange-500' : 'bg-green-500 animate-pulse'}`}>
                {onBreak ? <Coffee className="w-8 h-8 text-white" /> : <Clock className="w-8 h-8 text-white" />}
              </div>
              <div>
                <Badge className={`${onBreak ? 'bg-orange-500' : 'bg-green-500'} text-white mb-2`}>
                  {onBreak ? 'On Break' : 'Currently Clocked In'}
                </Badge>
                <h2 className="text-black mb-1">{onBreak ? breakTime : elapsedTime}</h2>
                <p className="text-gray-600 text-sm">
                  {onBreak 
                    ? `Break started at ${new Date(currentBreak!.startTime).toLocaleTimeString()}`
                    : `Clocked in at ${new Date(activeClock.clockIn).toLocaleTimeString()}`
                  }
                </p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center">
                {onBreak ? (
                  <Button
                    onClick={handleEndBreak}
                    className="bg-orange-600 text-white hover:bg-orange-700"
                  >
                    <Coffee className="w-4 h-4 mr-2" />
                    End Break
                  </Button>
                ) : (
                  <>
                    {canTakeBreak && (
                      <Button
                        onClick={handleStartBreak}
                        variant="outline"
                        className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                      >
                        <Coffee className="w-4 h-4 mr-2" />
                        Start Break
                      </Button>
                    )}
                    <Button
                      onClick={handleClockOut}
                      disabled={loading}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Clock Out
                    </Button>
                  </>
                )}
              </div>
              {activeClock.breaks && activeClock.breaks.length > 0 && (
                <div className="w-full mt-4 text-left">
                  <p className="text-sm text-gray-600 mb-2">Today's Breaks:</p>
                  <div className="space-y-1">
                    {activeClock.breaks.filter(b => b.endTime).map(b => (
                      <p key={b.id} className="text-xs text-gray-500">
                        {new Date(b.startTime).toLocaleTimeString()} - {b.endTime && new Date(b.endTime).toLocaleTimeString()} ({b.duration} min)
                      </p>
                    ))}
                  </div>
                </div>
              )}
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
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-black">
                        {new Date(entry.clockIn).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        {new Date(entry.clockIn).toLocaleTimeString()} - {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'In Progress'}
                      </p>
                      {entry.breaks && entry.breaks.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Breaks: {entry.breaks.filter(b => b.endTime).length} ({entry.breaks.reduce((sum, b) => sum + (b.duration || 0), 0)} min)
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-black mb-1">{entry.hoursWorked.toFixed(2)} hrs</p>
                    <p className="text-green-600">${entry.wagesEarned.toFixed(2)}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
