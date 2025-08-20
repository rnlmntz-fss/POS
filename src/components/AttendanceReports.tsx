import React, { useState, useEffect } from 'react';
import { Download, Calendar, Clock, Users, TrendingUp, Filter, Lock, X } from 'lucide-react';
import { TimeEntry } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { LocalStorage } from '../lib/storage';
import * as XLSX from 'xlsx';

export const AttendanceReports: React.FC = () => {
  const { settings } = useSettings();
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [dateRange, setDateRange] = useState('week');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');

  useEffect(() => {
    loadTimeEntries();
  }, []);

  const loadTimeEntries = async () => {
    try {
      const data = LocalStorage.load<TimeEntry>('pos_time_entries');
      // Sort by created_at descending
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTimeEntries(data);
    } catch (error) {
      console.error('Error loading time entries:', error);
    }
  };

  const getFilteredEntries = () => {
    let filtered = timeEntries;

    // Filter by employee
    if (selectedEmployee !== 'all') {
      filtered = filtered.filter(entry => entry.employee_id === selectedEmployee);
    }

    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (dateRange) {
      case 'today':
        filtered = filtered.filter(entry => entry.date === today.toISOString().split('T')[0]);
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        filtered = filtered.filter(entry => new Date(entry.date) >= weekStart);
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        filtered = filtered.filter(entry => new Date(entry.date) >= monthStart);
        break;
    }

    return filtered;
  };

  const filteredEntries = getFilteredEntries();
  const totalHours = filteredEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
  const totalSessions = filteredEntries.length;
  const avgHoursPerDay = totalSessions > 0 ? totalHours / new Set(filteredEntries.map(e => e.date)).size : 0;

  const uniqueEmployees = Array.from(new Set(timeEntries.map(entry => ({
    id: entry.employee_id,
    name: entry.employee_name
  })).map(emp => JSON.stringify(emp)))).map(emp => JSON.parse(emp));

  const handleExportClick = () => {
    setShowPasswordModal(true);
  };

  const downloadExcelReport = () => {
    if (!exportPassword.trim()) {
      alert('Please enter a password for the Excel file');
      return;
    }

    const report = {
      date_range: dateRange,
      employee_filter: selectedEmployee,
      total_hours: totalHours,
      total_sessions: totalSessions,
      average_hours_per_day: avgHoursPerDay,
      generated_at: new Date().toISOString()
    };

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Attendance Report Summary'],
      [''],
      ['Date Range:', dateRange],
      ['Employee Filter:', selectedEmployee === 'all' ? 'All Employees' : uniqueEmployees.find(e => e.id === selectedEmployee)?.name || selectedEmployee],
      ['Total Hours:', `${totalHours.toFixed(1)}h`],
      ['Total Sessions:', totalSessions],
      ['Average Hours/Day:', `${avgHoursPerDay.toFixed(1)}h`],
      ['Generated At:', new Date().toLocaleString()],
      [''],
      ['Password Protected by:', 'Admin User']
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Employee performance sheet
    const performanceData = [
      ['Employee', 'Total Hours', 'Sessions', 'Avg Hours/Session', 'Status']
    ];
    
    employeeStats.forEach(employee => {
      performanceData.push([
        employee.name,
        `${employee.totalHours.toFixed(1)}h`,
        employee.sessions,
        `${employee.avgHoursPerSession.toFixed(1)}h`,
        employee.activeSessions > 0 ? 'Active' : 'Offline'
      ]);
    });
    
    const performanceWs = XLSX.utils.aoa_to_sheet(performanceData);
    XLSX.utils.book_append_sheet(wb, performanceWs, 'Employee Performance');

    // Detailed entries sheet
    const entriesData = [
      ['Employee', 'Date', 'Punch In', 'Punch Out', 'Duration (Hours)']
    ];
    
    filteredEntries.forEach(entry => {
      entriesData.push([
        entry.employee_name,
        new Date(entry.date).toLocaleDateString(),
        new Date(entry.punch_in).toLocaleTimeString(),
        entry.punch_out ? new Date(entry.punch_out).toLocaleTimeString() : 'Active',
        entry.total_hours ? `${entry.total_hours.toFixed(1)}h` : 'In Progress'
      ]);
    });
    
    const entriesWs = XLSX.utils.aoa_to_sheet(entriesData);
    XLSX.utils.book_append_sheet(wb, entriesWs, 'Time Entries');

    // Write file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Store password info
    localStorage.setItem(`export_password_${Date.now()}`, exportPassword);
    
    setShowPasswordModal(false);
    setExportPassword('');
    alert(`Excel file downloaded successfully!\nPassword: ${exportPassword}\n\nNote: Remember this password to open the file.`);
  };

  const getEmployeeStats = () => {
    const stats = uniqueEmployees.map(employee => {
      const employeeEntries = filteredEntries.filter(entry => entry.employee_id === employee.id);
      const totalHours = employeeEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0);
      const activeSessions = employeeEntries.filter(entry => !entry.punch_out).length;
      
      return {
        ...employee,
        totalHours,
        sessions: employeeEntries.length,
        activeSessions,
        avgHoursPerSession: employeeEntries.length > 0 ? totalHours / employeeEntries.length : 0
      };
    });

    return stats.sort((a, b) => b.totalHours - a.totalHours);
  };

  const employeeStats = getEmployeeStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance Reports</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="all">All Employees</option>
            {uniqueEmployees.map(employee => (
              <option key={employee.id} value={employee.id}>{employee.name}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={handleExportClick}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Hours</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalSessions}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Hours/Day</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{avgHoursPerDay.toFixed(1)}h</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Employee Performance Cards */}
      <div className="block lg:hidden space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Employee Performance</h2>
        {employeeStats.map(employee => (
          <div key={employee.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{employee.name}</h3>
              {employee.activeSessions > 0 ? (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Active</span>
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  Offline
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{employee.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">Total Hours</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{employee.sessions}</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{employee.avgHoursPerSession.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">Avg/Session</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Performance */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Employee Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employeeStats.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.totalHours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.sessions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.avgHoursPerSession.toFixed(1)}h
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.activeSessions > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        Offline
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Time Entries Cards */}
      <div className="block lg:hidden space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Recent Time Entries</h2>
        {filteredEntries.slice(-10).reverse().map(entry => (
          <div key={entry.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-gray-900">{entry.employee_name}</h3>
                <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                {entry.total_hours ? (
                  <span className="text-lg font-bold text-gray-900">{entry.total_hours.toFixed(1)}h</span>
                ) : (
                  <span className="text-green-600 font-medium flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Active</span>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>In: {new Date(entry.punch_in).toLocaleTimeString()}</span>
              <span>
                {entry.punch_out ? (
                  `Out: ${new Date(entry.punch_out).toLocaleTimeString()}`
                ) : (
                  'Still working'
                )}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Protect Excel Export</h3>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setExportPassword('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); downloadExcelReport(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Set Password for Excel File
                  </label>
                  <input
                    type="password"
                    value={exportPassword}
                    onChange={(e) => setExportPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    placeholder="Enter a secure password"
                    required
                    minLength={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This password will be required to open the Excel file
                  </p>
                </div>

      {/* Desktop Detailed Time Entries */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Detailed Time Entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Punch Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.slice(-20).reverse().map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.employee_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(entry.punch_in).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.punch_out ? new Date(entry.punch_out).toLocaleTimeString() : (
                      <span className="text-green-600 font-medium flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Active</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.total_hours ? (
                      <span className="font-medium">{entry.total_hours.toFixed(1)}h</span>
                    ) : (
                      <span className="text-blue-600">In Progress</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setExportPassword('');
                    }}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-base"
                  >
                    Export Excel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};