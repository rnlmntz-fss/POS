import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { POS } from './components/POS';
import { ProductManagement } from './components/ProductManagement';
import { EmployeeManagement } from './components/EmployeeManagement';
import { VoucherManagement } from './components/VoucherManagement';
import { Reports } from './components/Reports';
import { SettingsPanel } from './components/SettingsPanel';
import { TimeCard } from './components/TimeCard';
import { AttendanceReports } from './components/AttendanceReports';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('pos');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'pos':
        return <POS />;
      case 'products':
        return user.role === 'admin' ? <ProductManagement /> : <POS />;
      case 'employees':
        return user.role === 'admin' ? <EmployeeManagement /> : <POS />;
      case 'vouchers':
        return user.role === 'admin' ? <VoucherManagement /> : <POS />;
      case 'reports':
        return user.role === 'admin' ? <Reports /> : <POS />;
      case 'attendance':
        return user.role === 'admin' ? <AttendanceReports /> : <POS />;
      case 'timecard':
        return <TimeCard />;
      case 'settings':
        return user.role === 'admin' ? <SettingsPanel /> : <POS />;
      default:
        return <POS />;
    }
  };

  return (
    <CartProvider>
      <Layout currentView={currentView} onViewChange={setCurrentView}>
        {renderView()}
      </Layout>
    </CartProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;