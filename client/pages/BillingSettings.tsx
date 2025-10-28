import React, { useState } from 'react';
import { 
  CreditCard,
  Check,
  Download,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export default function BillingSettings() {
  const { user, userId } = useUser();
  const [updating, setUpdating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  
  const [currentPlan] = useState({
    name: 'Professional',
    price: '$49',
    period: 'month',
    features: [
      'Unlimited AI conversations',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
      'Team collaboration'
    ]
  });

  const [paymentMethod] = useState({
    type: 'Visa',
    last4: '4242',
    expiry: '12/25'
  });

  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoiceNumber: 'INV-2023-001',
      date: '2023-10-01',
      amount: 49.00,
      status: 'Paid'
    },
    {
      id: '2',
      invoiceNumber: 'INV-2023-002',
      date: '2023-09-01',
      amount: 49.00,
      status: 'Paid'
    },
    {
      id: '3',
      invoiceNumber: 'INV-2023-003',
      date: '2023-08-01',
      amount: 49.00,
      status: 'Paid'
    },
    {
      id: '4',
      invoiceNumber: 'INV-2023-004',
      date: '2023-07-01',
      amount: 49.00,
      status: 'Paid'
    },
    {
      id: '5',
      invoiceNumber: 'INV-2023-005',
      date: '2023-06-01',
      amount: 49.00,
      status: 'Overdue'
    }
  ]);

  const handleUpdatePaymentMethod = async () => {
    if (!userId) {
      toast.error('Please log in to update payment method');
      return;
    }

    try {
      setUpdating(true);
      // TODO: Implement payment method update
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Payment method updated successfully!');
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast.error(error.message || 'Failed to update payment method');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgradeToEnterprise = async () => {
    if (!userId) {
      toast.error('Please log in to upgrade plan');
      return;
    }

    try {
      setUpgrading(true);
      // TODO: Implement plan upgrade
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Plan upgrade request submitted!');
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast.error(error.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast.success(`Downloading invoice ${invoice.invoiceNumber}...`);
    // TODO: Implement invoice download
  };

  return (
    <SettingsLayout title="Billing & Subscription">
      {/* Current Plan Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Current Plan</h2>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{currentPlan.name}</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Current Plan
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">{currentPlan.price}</span>
              <span className="text-gray-500">/{currentPlan.period}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Next billing: Nov 1, 2023
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {currentPlan.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleUpgradeToEnterprise}
          disabled={upgrading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
        >
          {upgrading ? 'Processing...' : 'Upgrade to Enterprise'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Payment Method Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Payment Method</h2>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {paymentMethod.type} ending in {paymentMethod.last4}
              </div>
              <div className="text-sm text-gray-500">
                Expires {paymentMethod.expiry}
              </div>
            </div>
          </div>
          <button
            onClick={handleUpdatePaymentMethod}
            disabled={updating}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Billing History</h2>
          <p className="text-sm text-gray-500">Showing 5 most recent invoices</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INVOICE
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DATE
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AMOUNT
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'Paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'Pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => handleDownloadInvoice(invoice)}
                      className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </SettingsLayout>
  );
}