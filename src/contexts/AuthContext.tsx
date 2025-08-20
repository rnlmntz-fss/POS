import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { LocalStorage } from '../lib/storage';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Default local users for demo
const defaultUsers: User[] = [
  {
    id: '1',
    email: 'admin@pos.com',
    name: 'Admin User',
    role: 'admin',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    email: 'employee@pos.com',
    name: 'Employee User',
    role: 'employee',
    created_at: new Date().toISOString()
  }
];

// Default passwords (in a real app, these would be hashed)
const defaultPasswords: Record<string, string> = {
  'admin@pos.com': 'admin123',
  'employee@pos.com': 'emp123'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for local session
    const localUser = localStorage.getItem('pos_current_user');
    if (localUser) {
      setUser(JSON.parse(localUser));
    }
      setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Check default users first
      let user = defaultUsers.find(u => u.email === email);
      let correctPassword = defaultPasswords[email];
      
      // Check if admin password has been changed
      if (email === 'admin@pos.com') {
        const storedAdminPassword = localStorage.getItem('admin_password');
        if (storedAdminPassword) {
          correctPassword = storedAdminPassword;
        }
      }
      
      // If not found in default users, check localStorage employees
      if (!user) {
        const employees = LocalStorage.load<User>('pos_employees');
        user = employees.find(u => u.email === email);
        // Use the actual password stored with the employee
        correctPassword = user?.password;
      }

      if (!user || password !== correctPassword) {
        throw new Error('Invalid credentials');
      }

      setUser(user);
      localStorage.setItem('pos_current_user', JSON.stringify(user));
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('pos_current_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};