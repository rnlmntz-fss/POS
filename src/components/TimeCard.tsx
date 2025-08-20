import React, { useState, useEffect } from 'react';
import { Clock, Play, Square, Calendar, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { TimeEntry } from '../types';
import { LocalStorage } from '../lib/storage';

export const TimeCard: React.FC = () => {
  const { user } = useAuth();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadTimeEntries();
  }, [user]);

  const loadTimeEntries = async () => {
    if (!user) return;
    
    try {
      const data = LocalStorage.load<TimeEntry>('pos_time_entries');
      // Filter by employee and sort by created_at descending
      const filteredData = data
        .filter(entry => entry.employee_id === user.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setTimeEntries(filteredData);
      const activeEntry = filteredData.find(entry => !entry.punch_out);
      setCurrentEntry(activeEntry || null);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentEntry) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentEntry]);

  const handlePunchIn = async () => {
    if (!user) return;
    
    try {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        employee_id: user.id,
        employee_name: user.name,
        punch_in: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      LocalStorage.save('pos_time_entries', newEntry);

      loadTimeEntries();
    } catch (error) {
      console.error('Error punching in:', error);
    }
  };

  const handlePunchOut = async () => {
    if (!currentEntry || !user) return;
    
    try {
      const punchOutTime = new Date().toISOString();
      const punchInTime = new Date(currentEntry.punch_in);
      const punchOutTimeObj = new Date(punchOutTime);
      const totalHours = (punchOutTimeObj.getTime() - punchInTime.getTime()) / (1000 * 60 * 60);
      
      LocalStorage.update<TimeEntry>(
        'pos_time_entries',
        currentEntry.id,
        {
          punch_out: punchOutTime,
          total_hours: Math.round(totalHours * 100) / 100
        }
      );

      loadTimeEntries();
    } catch (error) {
      console.error('Error punching out:', error);
    }
  };

  const formatDuration = (start: string, end?: string) => {
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : currentTime;
    const diff = endTime.getTime() - startTime.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          Please log in to track your time.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Clock className="h-6 w-6 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Time Clock</h2>
        </div>
        <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">{user.name}</span>
        </div>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 sm:p-6 bg-gray-50 rounded-lg">
        {currentEntry ? (
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Currently Clocked In</div>
            <div className="text-2xl sm:text-3xl font-mono font-bold text-green-600 mb-2">
              {formatDuration(currentEntry.punch_in)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">
              Started at {formatTime(currentEntry.punch_in)}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-xs sm:text-sm text-gray-600 mb-2">Not Clocked In</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-gray-400">
              00:00:00
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
        {!currentEntry ? (
          <button
            onClick={handlePunchIn}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
          >
            <Play className="h-5 w-5" />
            <span>Punch In</span>
          </button>
        ) : (
          <button
            onClick={handlePunchOut}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors text-base"
          >
            <Square className="h-5 w-5" />
            <span>Punch Out</span>
          </button>
        )}
      </div>

      {/* Recent Entries */}
      <div>
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Recent Entries
        </h3>
        
        {timeEntries.length === 0 ? (
          <div className="text-center text-gray-500 py-6 sm:py-8">
            No time entries yet. Punch in to get started!
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {timeEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xs sm:text-sm">
                    <div className="font-medium text-gray-900">
                      {formatDate(entry.date)}
                    </div>
                    <div className="text-gray-600">
                      {formatTime(entry.punch_in)} - {entry.punch_out ? formatTime(entry.punch_out) : 'Active'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-medium text-gray-900 text-sm sm:text-base">
                    {entry.punch_out 
                      ? `${entry.total_hours?.toFixed(2)}h`
                      : formatDuration(entry.punch_in)
                    }
                  </div>
                  {!entry.punch_out && (
                    <div className="text-xs text-green-600 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Active</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};