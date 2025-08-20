import React, { useState } from 'react';
import { X, CreditCard, Banknote, Printer, Tag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Sale, PaymentMethodType, Voucher } from '../types';
import { InvoicePrint } from './InvoicePrint';
import { LocalStorage } from '../lib/storage';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { items, total, clearCart, appliedVoucher, voucherDiscount, applyVoucher, removeVoucher } = useCart();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState('');

  const subtotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const finalTotal = subtotal - voucherDiscount;

  // Mock vouchers for demo
  const mockVouchers: Voucher[] = [
    { id: '1', code: 'SAVE10', discount_type: 'percentage', discount_value: 10, is_active: true, created_at: new Date().toISOString() },
    { id: '2', code: 'WELCOME', discount_type: 'fixed', discount_value: 5, is_active: true, created_at: new Date().toISOString() },
  ];

  const handleApplyVoucher = () => {
    const voucher = mockVouchers.find(v => v.code === voucherCode.toUpperCase() && v.is_active);
    if (voucher) {
      applyVoucher(voucher);
      setVoucherError('');
      setVoucherCode('');
    } else {
      setVoucherError('Invalid or expired voucher code');
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === 'ecash' && (!referenceNumber || !bankName)) {
      alert('Please provide reference number and bank name for e-cash payment');
      return;
    }

    if (items.length === 0) {
      alert('Cart is empty');
      return;
    }
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const sale: Sale = {
        id: Date.now().toString(),
        total: finalTotal,
        payment_method: paymentMethod,
        payment_details: paymentMethod === 'ecash' ? {
          reference_number: referenceNumber,
          bank_name: bankName,
          contact_info: contactInfo || undefined
        } : undefined,
        items: items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        employee_id: user?.id || '1',
        created_at: new Date().toISOString()
      };

      // Save sale to localStorage
      LocalStorage.save('pos_sales', sale);
      
      setCompletedSale(sale);
      setIsProcessing(false);
      setShowInvoice(true);
    } catch (error) {
      console.error('Error saving sale:', error);
      setIsProcessing(false);
      alert('Error processing payment. Please try again.');
    }

  };

  const handleClose = () => {
    setPaymentMethod('cash');
    setReferenceNumber('');
    setBankName('');
    setContactInfo('');
    setVoucherCode('');
    setVoucherError('');
    setCompletedSale(null);
    setShowInvoice(false);
    removeVoucher();
    if (completedSale) {
      clearCart();
    }
    onClose();
  };

  if (!isOpen) return null;

  if (showInvoice && completedSale) {
    return (
      <InvoicePrint
        isOpen={true}
        onClose={handleClose}
        items={items}
        total={finalTotal}
        paymentMethod={paymentMethod}
        paymentDetails={paymentMethod === 'ecash' ? {
          reference_number: referenceNumber,
          bank_name: bankName,
          contact_info: contactInfo
        } : undefined}
        invoiceNumber={completedSale.id}
        date={completedSale.created_at}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Checkout</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Order Summary */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Order Summary</h3>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{item.product.name} x{item.quantity}</span>
                  <span>{settings.currency_symbol}{(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{settings.currency_symbol}{subtotal.toFixed(2)}</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount ({appliedVoucher?.code})</span>
                    <span>-{settings.currency_symbol}{voucherDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span style={{ color: settings.primary_color }}>{settings.currency_symbol}{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Voucher Section */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Discount Voucher</h3>
            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{appliedVoucher.code}</span>
                  <span className="text-sm text-green-600">
                    ({appliedVoucher.discount_type === 'percentage' 
                      ? `${appliedVoucher.discount_value}% off` 
                      : `${settings.currency_symbol}${appliedVoucher.discount_value} off`})
                  </span>
                </div>
                <button
                  onClick={removeVoucher}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Enter voucher code"
                />
                <button
                  onClick={handleApplyVoucher}
                  className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base"
                >
                  Apply
                </button>
              </div>
            )}
            {voucherError && (
              <p className="text-red-500 text-sm mt-1">{voucherError}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-2 sm:p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('ecash')}
                className={`p-2 sm:p-3 rounded-lg border-2 flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base ${
                  paymentMethod === 'ecash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>E-Cash</span>
              </button>
            </div>
          </div>

          {/* E-Cash Details */}
          {paymentMethod === 'ecash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number *
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Enter reference number"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Enter bank name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Info (Optional)
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  placeholder="Phone or email (optional)"
                />
              </div>
            </div>
          )}

          {/* Process Payment Button */}
          <button
            onClick={handlePayment}
            disabled={isProcessing || items.length === 0}
            className="w-full py-3 px-4 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            style={{ backgroundColor: settings.primary_color }}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base">{`Process Payment - ${settings.currency_symbol}${finalTotal.toFixed(2)}`}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}