import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Gift, Percent, DollarSign, X } from 'lucide-react';
import { Voucher } from '../types';

const mockVouchers: Voucher[] = [
  { id: '1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10, is_active: true, created_at: new Date().toISOString() },
  { id: '2', code: 'WELCOME', discount_type: 'fixed', discount_value: 5, is_active: true, created_at: new Date().toISOString() },
];

export const VoucherManagement: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
  const [showModal, setShowModal] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    is_active: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const voucherData: Voucher = {
      id: editingVoucher?.id || Date.now().toString(),
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      is_active: formData.is_active,
      created_at: editingVoucher?.created_at || new Date().toISOString()
    };

    if (editingVoucher) {
      setVouchers(prev => prev.map(v => v.id === editingVoucher.id ? voucherData : v));
    } else {
      setVouchers(prev => [...prev, voucherData]);
    }

    setShowModal(false);
    setEditingVoucher(null);
    setFormData({ code: '', discount_type: 'percentage', discount_value: '', is_active: true });
  };

  const handleEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setFormData({
      code: voucher.code,
      discount_type: voucher.discount_type,
      discount_value: voucher.discount_value.toString(),
      is_active: voucher.is_active
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this voucher?')) {
      setVouchers(prev => prev.filter(v => v.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setVouchers(prev => prev.map(v => 
      v.id === id ? { ...v, is_active: !v.is_active } : v
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Voucher Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span>Add Voucher</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {vouchers.map(voucher => (
          <div key={voucher.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{voucher.code}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    voucher.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {voucher.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleEdit(voucher)}
                  className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(voucher.id)}
                  className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                {voucher.discount_type === 'percentage' ? (
                  <Percent className="w-4 h-4 text-gray-400" />
                ) : (
                  <DollarSign className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-lg font-bold text-gray-900">
                  {voucher.discount_type === 'percentage' 
                    ? `${voucher.discount_value}% off` 
                    : `$${voucher.discount_value} off`}
                </span>
              </div>
              
              <button
                onClick={() => toggleStatus(voucher.id)}
                className={`w-full py-2 rounded-lg text-sm font-medium transition-all ${
                  voucher.is_active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {voucher.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Voucher Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingVoucher ? 'Edit Voucher' : 'Add Voucher'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingVoucher(null);
                    setFormData({ code: '', discount_type: 'percentage', discount_value: '', is_active: true });
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voucher Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-base"
                    placeholder="e.g., SAVE10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Discount Type</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'fixed' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Active
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingVoucher(null);
                      setFormData({ code: '', discount_type: 'percentage', discount_value: '', is_active: true });
                    }}
                    className="flex-1 px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-base"
                  >
                    {editingVoucher ? 'Update' : 'Add'} Voucher
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