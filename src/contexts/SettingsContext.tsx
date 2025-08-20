import React, { createContext, useContext, useState, useEffect } from 'react';
import { Settings } from '../types';

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  id: '1',
  brand_name: 'POS System',
  primary_color: '#3B82F6',
  currency: 'USD',
  currency_symbol: '$',
  updated_at: new Date().toISOString()
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  useEffect(() => {
    const storedSettings = localStorage.getItem('pos_settings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates, updated_at: new Date().toISOString() };
    setSettings(newSettings);
    localStorage.setItem('pos_settings', JSON.stringify(newSettings));
    
    // Update CSS custom property for primary color
    if (updates.primary_color) {
      document.documentElement.style.setProperty('--primary-color', updates.primary_color);
    }
  };

  // Set initial CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', settings.primary_color);
  }, [settings.primary_color]);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};