import React, { useState } from 'react';
import { Upload, Palette, Save, DollarSign, Database, Lock, Eye, EyeOff, Download, FileUp, AlertTriangle, X, Bell, Calendar } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { LocalStorage } from '../lib/storage';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');
  const [brandName, setBrandName] = useState(settings.brand_name);
  const [primaryColor, setPrimaryColor] = useState(settings.primary_color);
  const [currency, setCurrency] = useState(settings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(settings.currency_symbol);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Data management states
  const [showDataSection, setShowDataSection] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importFileName, setImportFileName] = useState('');
  
  // Backup reminder states
  const [backupReminderEnabled, setBackupReminderEnabled] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState('weekly');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [showReminderNotification, setShowReminderNotification] = useState(false);

  // Update local state when settings change
  React.useEffect(() => {
    setLogoUrl(settings.logo_url || '');
    setBrandName(settings.brand_name);
    setPrimaryColor(settings.primary_color);
    setCurrency(settings.currency);
    setCurrencySymbol(settings.currency_symbol);
    
    // Load backup reminder settings
    const reminderSettings = localStorage.getItem('backup_reminder_settings');
    if (reminderSettings) {
      const parsed = JSON.parse(reminderSettings);
      setBackupReminderEnabled(parsed.enabled || false);
      setReminderFrequency(parsed.frequency || 'weekly');
      setReminderTime(parsed.time || '09:00');
    }
    
    const lastBackup = localStorage.getItem('last_backup_date');
    setLastBackupDate(lastBackup);
    
    // Check if reminder should be shown
    checkBackupReminder();
  }, [settings]);

  const checkBackupReminder = () => {
    const reminderSettings = localStorage.getItem('backup_reminder_settings');
    if (!reminderSettings) return;
    
    const settings = JSON.parse(reminderSettings);
    if (!settings.enabled) return;
    
    const lastBackup = localStorage.getItem('last_backup_date');
    if (!lastBackup) {
      setShowReminderNotification(true);
      return;
    }
    
    const lastBackupDate = new Date(lastBackup);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let shouldRemind = false;
    switch (settings.frequency) {
      case 'daily':
        shouldRemind = daysDiff >= 1;
        break;
      case 'weekly':
        shouldRemind = daysDiff >= 7;
        break;
      case 'monthly':
        shouldRemind = daysDiff >= 30;
        break;
    }
    
    if (shouldRemind) {
      setShowReminderNotification(true);
    }
  };

  const saveReminderSettings = () => {
    const settings = {
      enabled: backupReminderEnabled,
      frequency: reminderFrequency,
      time: reminderTime
    };
    localStorage.setItem('backup_reminder_settings', JSON.stringify(settings));
  };

  const handleSave = () => {
    updateSettings({
      logo_url: logoUrl || undefined,
      brand_name: brandName,
      primary_color: primaryColor,
      currency,
      currency_symbol: currencySymbol,
      qr_payment_enabled: qrPaymentEnabled,
      qr_payment_account: qrPaymentAccount,
      qr_payment_recipient: qrPaymentRecipient,
      qr_payment_bank: qrPaymentBank,
    });
    
    // Save reminder settings
    saveReminderSettings();
    
    // Show success message with better UX
    const button = document.querySelector('.save-button') as HTMLButtonElement;
    if (button) {
      const originalText = button.innerHTML;
      button.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Saved!';
      button.style.backgroundColor = '#10B981';
      setTimeout(() => {
        button.innerHTML = originalText;
        button.style.backgroundColor = '';
      }, 2000);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setLogoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate current password (for demo, we'll use 'admin123')
    if (passwordData.currentPassword !== 'admin123') {
      setPasswordError('Current password is incorrect');
      return;
    }

    // Validate new password
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    // Validate password confirmation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    // In a real app, this would update the password in the database
    // For this demo, we'll just show success and store in localStorage
    localStorage.setItem('admin_password', passwordData.newPassword);
    
    setPasswordSuccess('Password changed successfully!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setPasswordSuccess('');
      setShowPasswordSection(false);
    }, 3000);
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // Collect all data from localStorage
      const allData = {
        settings: settings,
        products: LocalStorage.load('pos_products'),
        employees: LocalStorage.load('pos_employees'),
        sales: LocalStorage.load('pos_sales'),
        timeEntries: LocalStorage.load('pos_time_entries'),
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `pos-system-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update last backup date
      localStorage.setItem('last_backup_date', new Date().toISOString());
      setLastBackupDate(new Date().toISOString());
      
      // Show success message
      const button = document.querySelector('.export-data-button') as HTMLButtonElement;
      if (button) {
        const originalText = button.innerHTML;
        button.innerHTML = '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>Exported!';
        button.style.backgroundColor = '#10B981';
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.backgroundColor = '';
        }, 2000);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Please select a valid JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.settings || !data.products || !data.employees || !data.sales) {
          alert('Invalid backup file format. Please select a valid POS system backup.');
          return;
        }

        setImportData(data);
        setImportFileName(file.name);
        setShowImportConfirm(true);
      } catch (error) {
        alert('Error reading file. Please ensure it\'s a valid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportData = async () => {
    if (!importData) return;

    setImportLoading(true);
    try {
      // Import all data
      if (importData.settings) {
        updateSettings(importData.settings);
      }
      
      if (importData.products) {
        localStorage.setItem('pos_products', JSON.stringify(importData.products));
      }
      
      if (importData.employees) {
        localStorage.setItem('pos_employees', JSON.stringify(importData.employees));
      }
      
      if (importData.sales) {
        localStorage.setItem('pos_sales', JSON.stringify(importData.sales));
      }
      
      if (importData.timeEntries) {
        localStorage.setItem('pos_time_entries', JSON.stringify(importData.timeEntries));
      }

      setShowImportConfirm(false);
      setImportData(null);
      setImportFileName('');
      
      alert('Data imported successfully! The page will reload to apply changes.');
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing data. Please try again.');
    } finally {
      setImportLoading(false);
    }
  };

  const colorPresets = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#F97316', // Orange
    '#06B6D4', // Cyan
    '#84CC16', // Lime
  ];

  const commonCurrencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
      
      {/* Backup Reminder Notification */}
      {showReminderNotification && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-800">Backup Reminder</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {lastBackupDate 
                    ? `It's been a while since your last backup (${new Date(lastBackupDate).toLocaleDateString()}). Consider backing up your data.`
                    : 'You haven\'t created a backup yet. It\'s recommended to backup your data regularly.'
                  }
                </p>
                <div className="flex items-center space-x-3 mt-3">
                  <button
                    onClick={() => {
                      setShowDataSection(true);
                      setShowReminderNotification(false);
                    }}
                    className="bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-all text-sm"
                  >
                    Backup Now
                  </button>
                  <button
                    onClick={() => setShowReminderNotification(false)}
                    className="text-yellow-600 hover:text-yellow-800 text-sm"
                  >
                    Remind Later
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowReminderNotification(false)}
              className="p-1 text-yellow-400 hover:text-yellow-600 hover:bg-yellow-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Logo Settings */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Brand & Logo Settings</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="Enter your business name"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="https://example.com/logo.png"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Logo File</label>
              <div className="flex items-center space-x-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-all flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-700"
                >
                  <Upload className="w-5 h-5" />
                  <span>Choose File</span>
                </label>
              </div>
            </div>
            
            {/* Logo Preview */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {logoUrl ? (
                <div className="space-y-2">
                  <img src={logoUrl} alt="Logo Preview" className="max-h-16 mx-auto" />
                  <p className="text-xs text-gray-500">Logo Preview</p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Upload className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Logo preview will appear here</p>
                </div>
              )}
            </div>
            
            {/* Brand Preview */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Brand Preview</p>
              <div className="flex items-center space-x-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 w-auto" />
                ) : (
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {brandName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-gray-900">{brandName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Theme Settings</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 border border-gray-300 rounded-lg cursor-pointer"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-base"
                />
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Colors</label>
              <div className="grid grid-cols-4 gap-2">
                {colorPresets.map(color => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      primaryColor === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="flex space-x-2">
                <button
                  className="px-4 py-2 text-white rounded-lg font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: primaryColor }}
                >
                  POS
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Currency Settings */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:col-span-1">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Currency Settings</span>
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => {
                  const selectedCurrency = commonCurrencies.find(c => c.code === e.target.value);
                  setCurrency(e.target.value);
                  if (selectedCurrency) {
                    setCurrencySymbol(selectedCurrency.symbol);
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
              >
                {commonCurrencies.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency Symbol</label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                placeholder="$"
              />
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="space-y-1 text-sm">
                <div>Price: <span className="font-bold">{currencySymbol}25.99</span></div>
                <div>Total: <span className="font-bold">{currencySymbol}125.50</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Settings - Admin Only */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Lock className="w-5 h-5" />
              <span>Security Settings</span>
            </h2>
            
            {!showPasswordSection ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Change your admin password to keep your account secure.
                </p>
                <button
                  onClick={() => setShowPasswordSection(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all flex items-center space-x-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        current: !showPasswords.current
                      })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        new: !showPasswords.new
                      })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value
                      })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords({
                        ...showPasswords,
                        confirm: !showPasswords.confirm
                      })}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all text-base"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Data Management - Admin Only */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 lg:col-span-1">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Data Management</span>
            </h2>
            
            {!showDataSection ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Export all system data for backup or import data to restore from a backup.
                </p>
                <button
                  onClick={() => setShowDataSection(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
                >
                  <Database className="w-4 h-4" />
                  <span>Manage Data</span>
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Export Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download a complete backup of all system data including settings, products, employees, sales, and attendance records.
                  </p>
                  <button
                    onClick={handleExportData}
                    disabled={exportLoading}
                    className="export-data-button bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{exportLoading ? 'Exporting...' : 'Export All Data'}</span>
                  </button>
                </div>

                {/* Import Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                    <FileUp className="w-4 h-4" />
                    <span>Import Data</span>
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Warning:</p>
                        <p>Importing data will replace all current data. Make sure to export current data first if you want to keep it.</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="import-data-file"
                    />
                    <label
                      htmlFor="import-data-file"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2 cursor-pointer inline-flex"
                    >
                      <FileUp className="w-4 h-4" />
                      <span>Select Backup File</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDataSection(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Backup Reminder Settings - Admin Only */}
        {user?.role === 'admin' && (
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Backup Reminders</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="backup_reminder_enabled"
                  checked={backupReminderEnabled}
                  onChange={(e) => setBackupReminderEnabled(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="backup_reminder_enabled" className="ml-2 block text-sm text-gray-900">
                  Enable backup reminders
                </label>
              </div>

              {backupReminderEnabled && (
                <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reminder Frequency
                    </label>
                    <select
                      value={reminderFrequency}
                      onChange={(e) => setReminderFrequency(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {lastBackupDate && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Last Backup</p>
                          <p className="text-sm text-gray-600">
                            {new Date(lastBackupDate).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start space-x-2">
                      <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium">Reminder Schedule:</p>
                        <p>
                          You'll be reminded to backup your data every{' '}
                          <strong>{reminderFrequency === 'daily' ? 'day' : reminderFrequency === 'weekly' ? 'week' : 'month'}</strong>
                          {reminderTime && ` at ${reminderTime}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="save-button bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
        >
          <Save className="w-5 h-5" />
          <span>Save Settings</span>
        </button>
      </div>

      {/* Import Confirmation Modal */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Confirm Data Import</h3>
                </div>
                <button
                  onClick={() => {
                    setShowImportConfirm(false);
                    setImportData(null);
                    setImportFileName('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium mb-1">This action will:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Replace all current settings</li>
                        <li>Replace all products</li>
                        <li>Replace all employees</li>
                        <li>Replace all sales records</li>
                        <li>Replace all attendance records</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    <strong>File:</strong> {importFileName}
                  </p>
                  {importData?.exportedAt && (
                    <p className="text-sm text-gray-600">
                      <strong>Backup Date:</strong> {new Date(importData.exportedAt).toLocaleString()}
                    </p>
                  )}
                  {importData?.version && (
                    <p className="text-sm text-gray-600">
                      <strong>Version:</strong> {importData.version}
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowImportConfirm(false);
                      setImportData(null);
                      setImportFileName('');
                    }}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportData}
                    disabled={importLoading}
                    className="flex-1 px-4 sm:px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 text-base"
                  >
                    {importLoading ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supabase Database Configuration - Separate Section */}
    </div>
  );
};