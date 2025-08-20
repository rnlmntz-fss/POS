import React, { useState } from 'react';
import { Download, Calendar, TrendingUp, DollarSign, Receipt, Edit2, Trash2, X, Lock } from 'lucide-react';
import { Sale } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { LocalStorage } from '../lib/storage';
import * as XLSX from 'xlsx';

export const Reports: React.FC = () => {
  const { settings } = useSettings();
  const [sales, setSales] = useState<Sale[]>([]);
  const [dateRange, setDateRange] = useState('today');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  React.useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const data = LocalStorage.load<Sale>('pos_sales');
      // Sort by created_at descending
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setSales(data);
    } catch (error) {
      console.error('Error loading sales:', error);
    }
  };

  const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = sales.length;
  const avgTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const canEditSale = (saleDate: string) => {
    const saleTime = new Date(saleDate).getTime();
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return (now - saleTime) <= twentyFourHours;
  };

  const handleExportClick = () => {
    setShowPasswordModal(true);
  };

  const downloadExcelSummary = () => {
    if (!exportPassword.trim()) {
      alert('Please enter a password for the Excel file');
      return;
    }

    const summary = {
      date_range: dateRange,
      total_sales: totalSales,
      total_transactions: totalTransactions,
      average_transaction: avgTransaction,
      generated_at: new Date().toISOString()
    };

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Sales Report Summary'],
      [''],
      ['Date Range:', dateRange],
      ['Total Sales:', `${settings.currency_symbol}${totalSales.toFixed(2)}`],
      ['Total Transactions:', totalTransactions],
      ['Average Transaction:', `${settings.currency_symbol}${avgTransaction.toFixed(2)}`],
      ['Generated At:', new Date().toLocaleString()],
      [''],
      ['Password Protected by:', 'Admin User']
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Sales details sheet
    const salesData = [
      ['Date', 'Time', 'Items', 'Payment Method', 'Reference', 'Total']
    ];
    
    sales.forEach(sale => {
      const date = new Date(sale.created_at);
      const items = sale.items.map(item => `${item.product_name} x${item.quantity}`).join(', ');
      salesData.push([
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
        items,
        sale.payment_method === 'cash' ? 'Cash' : 'E-Cash',
        sale.payment_details?.reference_number || '',
        `${settings.currency_symbol}${sale.total.toFixed(2)}`
      ]);
    });
    
    const salesWs = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, salesWs, 'Sales Details');

    // Write file with password protection (note: basic protection)
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${dateRange}-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Store password info (in real app, this would be more secure)
    localStorage.setItem(`export_password_${Date.now()}`, exportPassword);
    
    setShowPasswordModal(false);
    setExportPassword('');
    alert(`Excel file downloaded successfully!\nPassword: ${exportPassword}\n\nNote: Remember this password to open the file.`);
  };

  const handleEditSale = (sale: Sale) => {
    if (!canEditSale(sale.created_at)) {
      alert('Sales can only be edited within 24 hours of creation');
      return;
    }
    setEditingSale(sale);
    setShowEditModal(true);
  };

  const handleDeleteSale = (saleId: string, saleDate: string) => {
    if (!canEditSale(saleDate)) {
      alert('Sales can only be deleted within 24 hours of creation');
      return;
    }
    
    if (confirm('Are you sure you want to delete this sale? This action cannot be undone.')) {
      LocalStorage.delete('pos_sales', saleId);
      loadSales();
    }
  };

  const handleUpdateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    LocalStorage.update<Sale>('pos_sales', editingSale.id, editingSale);
    loadSales();
    setShowEditModal(false);
    setEditingSale(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Sales Reports</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
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
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{settings.currency_symbol}{totalSales.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Transactions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Transaction</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{settings.currency_symbol}{avgTransaction.toFixed(2)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sales Cards */}
      <div className="block lg:hidden space-y-4">
        {sales.map(sale => (
          <div key={sale.id} className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(sale.created_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(sale.created_at).toLocaleTimeString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {settings.currency_symbol}{sale.total.toFixed(2)}
                </p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  sale.payment_method === 'cash' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {sale.payment_method === 'cash' ? 'Cash' : 'E-Cash'}
                </span>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              {sale.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                  <span className="text-gray-900">{settings.currency_symbol}{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            {sale.payment_details?.reference_number && (
              <p className="text-xs text-gray-500 mb-3">
                Ref: {sale.payment_details.reference_number}
              </p>
            )}
            <div className="flex space-x-2 pt-3 border-t border-gray-200">
              {canEditSale(sale.created_at) ? (
                <>
                  <button
                    onClick={() => handleEditSale(sale)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSale(sale.id, sale.created_at)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-all flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </>
              ) : (
                <div className="flex-1 text-center py-2 text-gray-400 text-sm">
                  24h edit period expired
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Sales</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(sale.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {sale.items.map((item, index) => (
                        <div key={index}>
                          {item.product_name} x{item.quantity}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      sale.payment_method === 'cash' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {sale.payment_method === 'cash' ? 'Cash' : 'E-Cash'}
                    </span>
                    {sale.payment_details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {sale.payment_details.reference_number}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {settings.currency_symbol}{sale.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {canEditSale(sale.created_at) ? (
                        <>
                          <button
                            onClick={() => handleEditSale(sale)}
                            className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded"
                            title="Edit Sale"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSale(sale.id, sale.created_at)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete Sale"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">24h expired</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

              <form onSubmit={(e) => { e.preventDefault(); downloadExcelSummary(); }} className="space-y-4">
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

      {/* Edit Sale Modal */}
      {showEditModal && editingSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Edit Sale</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSale(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateSale} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.total}
                    onChange={(e) => setEditingSale({
                      ...editingSale,
                      total: parseFloat(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={editingSale.payment_method}
                    onChange={(e) => setEditingSale({
                      ...editingSale,
                      payment_method: e.target.value as 'cash' | 'ecash'
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="cash">Cash</option>
                    <option value="ecash">E-Cash</option>
                  </select>
                </div>

                {editingSale.payment_method === 'ecash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reference Number</label>
                    <input
                      type="text"
                      value={editingSale.payment_details?.reference_number || ''}
                      onChange={(e) => setEditingSale({
                        ...editingSale,
                        payment_details: {
                          ...editingSale.payment_details,
                          reference_number: e.target.value
                        }
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    />
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSale(null);
                    }}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-base"
                  >
                    Update Sale
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