import React from 'react';
import { X, Printer } from 'lucide-react';
import { CartItem } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

interface InvoicePrintProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'ecash';
  paymentDetails?: {
    reference_number?: string;
    bank_name?: string;
    contact_info?: string;
  };
  invoiceNumber: string;
  date: string;
}

export const InvoicePrint: React.FC<InvoicePrintProps> = ({
  isOpen,
  onClose,
  items,
  total,
  paymentMethod,
  paymentDetails,
  invoiceNumber,
  date
}) => {
  const { settings } = useSettings();
  const { user } = useAuth();

  const handlePrint = () => {
    // Hide the modal controls and show only the invoice content
    const printContent = document.querySelector('.invoice-content');
    const originalContent = document.body.innerHTML;
    
    if (printContent) {
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload(); // Reload to restore React functionality
    } else {
      // Fallback to regular print
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Print Controls - Hidden when printing */}
        <div className="p-4 border-b border-gray-200 print:hidden">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Invoice Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8 print:p-0 invoice-content">
          <div className="max-w-3xl mx-auto bg-white">
            {/* Header */}
            <div className="border-b-2 border-gray-200 pb-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {settings.logo_url ? (
                    <img src={settings.logo_url} alt="Logo" className="h-12 w-auto" />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: settings.primary_color }}
                    >
                      {settings.brand_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{settings.brand_name}</h1>
                    <p className="text-gray-600">Point of Sale Invoice</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-bold" style={{ color: settings.primary_color }}>
                    INVOICE
                  </h2>
                  <p className="text-gray-600 mt-1">#{invoiceNumber}</p>
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Invoice Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Invoice Number:</span>
                    <span className="font-medium">#{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{new Date(date).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cashier:</span>
                    <span className="font-medium">{user?.name}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">
                      {paymentMethod === 'ecash' ? 'E-Cash' : 'Cash'}
                    </span>
                  </div>
                  {paymentMethod === 'ecash' && paymentDetails && (
                    <>
                      {paymentDetails.reference_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Reference:</span>
                          <span className="font-medium">{paymentDetails.reference_number}</span>
                        </div>
                      )}
                      {paymentDetails.bank_name && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Bank:</span>
                          <span className="font-medium">{paymentDetails.bank_name}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Purchased</h3>
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">{item.product.name}</div>
                            <div className="text-sm text-gray-500">{item.product.category}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">
                          {settings.currency_symbol}{item.product.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                          {settings.currency_symbol}{(item.product.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-semibold text-gray-900">Subtotal:</span>
                    <span className="text-lg font-semibold text-gray-900">{settings.currency_symbol}{total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-t border-gray-200">
                    <span className="text-xl font-bold text-gray-900">Total:</span>
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: settings.primary_color }}
                    >
                      {settings.currency_symbol}{total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-2">Thank you for your business!</p>
              <p className="text-xs text-gray-500">
                This is a computer-generated invoice. No signature required.
              </p>
              {paymentDetails?.contact_info && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium">Additional Information:</p>
                  <p className="text-xs text-gray-500 mt-1">{paymentDetails.contact_info}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
            visibility: hidden !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .invoice-content {
            padding: 20px !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
          
          .invoice-content * {
            visibility: visible !important;
          }
          
          .fixed,
          .bg-black,
          .bg-opacity-50 {
            position: static !important;
            background: white !important;
          }
          
          .rounded-xl {
            border-radius: 0 !important;
          }
          
          .shadow-xl {
            box-shadow: none !important;
          }
          
          @page {
            margin: 0.5in;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};