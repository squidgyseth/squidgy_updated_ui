import React, { useState, useEffect } from 'react';
import { 
  CreditCard,
  Check,
  Download,
  ArrowRight,
  Calendar,
  X,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { InvoiceStorageService } from '../services/invoiceStorageService';
import CombinedUsageAnalytics from '../components/billing/CombinedUsageAnalytics';
import UsageAnalytics from '../components/billing/UsageAnalytics';
import ToolUsageAnalytics from '../components/billing/ToolUsageAnalytics';
import MonthlyUsageLimit from '../components/billing/MonthlyUsageLimit';

interface BillingSettings {
  id: string;
  plan_name: string;
  plan_price: number;
  plan_period: string;
  plan_status: string;
  next_billing_date: string | null;
  payment_method_type: string | null;
  payment_method_last4: string | null;
  payment_method_expiry: string | null;
  payment_method_brand: string | null;
  subscription_features: string[] | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  currency: string;
  paid_at?: string;
  invoice_pdf_url?: string;
  due_date?: string;
}


export default function BillingSettings() {
  const navigate = useNavigate();
  const { user, profile, isReady, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<string | null>(null);
  const [generatingPdfs, setGeneratingPdfs] = useState(false);
  
  const [billingSettings, setBillingSettings] = useState<BillingSettings | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Load billing settings and invoices
  useEffect(() => {
    const loadBillingData = async () => {
      if (!profile?.user_id || !profile?.company_id) return;
      
      setLoading(true);
      try {
        const { supabase } = await import('../lib/supabase');
        
        // Load billing settings
        const { data: billingData, error: billingError } = await supabase
          .from('billing_settings')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('company_id', profile.company_id)
          .single();

        if (billingError && billingError.code !== 'PGRST116') {
          console.error('Error loading billing settings:', billingError);
        } else if (billingData) {
          setBillingSettings(billingData);
        } else {
          // Create default billing settings if none exist
          const defaultSettings = {
            user_id: profile.user_id,
            company_id: profile.company_id,
            plan_name: 'Free',
            plan_price: 0,
            plan_period: 'month',
            plan_status: 'active'
          };
          
          const { data: newBilling, error: createError } = await supabase
            .from('billing_settings')
            .insert(defaultSettings)
            .select()
            .single();
            
          if (!createError && newBilling) {
            setBillingSettings(newBilling);
          }
        }

        // Load invoices
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('billing_invoices')
          .select('*')
          .eq('user_id', profile.user_id)
          .eq('company_id', profile.company_id)
          .order('invoice_date', { ascending: false })
          .limit(5);

        if (invoiceError) {
          console.error('Error loading invoices:', invoiceError);
        } else if (invoiceData) {
          setInvoices(invoiceData);
        }
        
      } catch (error) {
        console.error('Error loading billing data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isReady && isAuthenticated) {
      loadBillingData();
    }
  }, [profile?.user_id, profile?.company_id, isReady, isAuthenticated]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleUpdatePaymentMethod = async () => {
    if (!profile?.user_id) {
      toast.error('Please log in to update payment method');
      return;
    }

    try {
      setUpdating(true);
      
      // Simulate opening payment method setup
      toast.info('Opening payment method setup...');
      
      // TODO: Open Stripe Elements modal or redirect to payment setup page
      // For now, simulate adding a card
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful card addition
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('billing_settings')
        .update({
          payment_method_type: 'card',
          payment_method_last4: '4242',
          payment_method_expiry: '12/26',
          payment_method_brand: 'Visa',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)
        .eq('company_id', profile.company_id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setBillingSettings(prev => prev ? {
        ...prev,
        payment_method_type: 'card',
        payment_method_last4: '4242',
        payment_method_expiry: '12/26',
        payment_method_brand: 'Visa'
      } : null);
      
      toast.success('Payment method added successfully! You can now upgrade your plan.');
      
    } catch (error: any) {
      console.error('Error updating payment method:', error);
      toast.error(error.message || 'Failed to update payment method');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgradeToEnterprise = () => {
    if (!profile?.user_id) {
      toast.error('Please log in to upgrade plan');
      return;
    }

    // Check if user already has a payment method
    if (billingSettings?.payment_method_type) {
      // User has payment method, proceed with upgrade
      handleDirectUpgrade();
    } else {
      // No payment method, redirect to add payment method
      toast.info('Please add a payment method to upgrade your plan');
      setUpgrading(true);
      
      // Simulate navigation to payment method setup
      setTimeout(() => {
        // This would typically navigate to a payment setup modal or page
        // For now, we'll trigger the payment method update flow
        handleUpdatePaymentMethod();
        setUpgrading(false);
      }, 500);
    }
  };

  const handleDirectUpgrade = async () => {
    if (!billingSettings) return;
    
    try {
      setUpgrading(true);
      
      // TODO: Integrate with Stripe to process the upgrade
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update billing settings with new plan
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('billing_settings')
        .update({
          plan_name: 'Enterprise',
          plan_price: 99.00,
          subscription_features: [
            'Unlimited AI conversations',
            'Advanced analytics & reporting',
            'Priority 24/7 support',
            'Custom integrations & API access',
            'Advanced team collaboration',
            'White-label solutions',
            'Dedicated account manager',
            'Custom training & onboarding'
          ],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile?.user_id)
        .eq('company_id', profile?.company_id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setBillingSettings(prev => prev ? {
        ...prev,
        plan_name: 'Enterprise',
        plan_price: 99.00,
        subscription_features: [
          'Unlimited AI conversations',
          'Advanced analytics & reporting',
          'Priority 24/7 support',
          'Custom integrations & API access',
          'Advanced team collaboration',
          'White-label solutions',
          'Dedicated account manager',
          'Custom training & onboarding'
        ]
      } : null);
      
      toast.success('Successfully upgraded to Enterprise plan!');
      
    } catch (error: any) {
      console.error('Error upgrading plan:', error);
      toast.error(error.message || 'Failed to upgrade plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleManagePlan = () => {
    setShowPlanSelection(true);
  };

  const handlePlanChange = async (newPlan: string, newPrice: number, newFeatures: string[]) => {
    if (!profile?.user_id || !profile?.company_id) {
      toast.error('Please log in to change plan');
      return;
    }

    try {
      setUpgrading(true);
      setShowPlanSelection(false);
      
      // TODO: Integrate with Stripe for real plan change
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { supabase } = await import('../lib/supabase');
      
      const { error } = await supabase
        .from('billing_settings')
        .update({
          plan_name: newPlan,
          plan_price: newPrice,
          subscription_features: newFeatures,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)
        .eq('company_id', profile.company_id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setBillingSettings(prev => prev ? {
        ...prev,
        plan_name: newPlan,
        plan_price: newPrice,
        subscription_features: newFeatures
      } : null);
      
      toast.success(`Successfully changed to ${newPlan} plan!`);
      
    } catch (error: any) {
      console.error('Error changing plan:', error);
      toast.error(error.message || 'Failed to change plan');
    } finally {
      setUpgrading(false);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      if (invoice.invoice_pdf_url) {
        // Open the PDF URL in a new tab
        window.open(invoice.invoice_pdf_url, '_blank');
        toast.success(`Opening invoice ${invoice.invoice_number}...`);
      } else {
        // Generate PDF if not exists
        if (!profile?.user_id || !profile?.company_id) {
          toast.error('Please log in to download invoice');
          return;
        }

        toast.info('Generating invoice PDF... Please wait.');
        
        const invoiceData = {
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          due_date: invoice.due_date || new Date().toISOString(),
          amount: invoice.amount,
          currency: invoice.currency,
          description: 'Monthly Subscription',
          line_items: [
            {
              description: 'Monthly Subscription',
              quantity: 1,
              unit_price: invoice.amount,
              total: invoice.amount
            }
          ]
        };

        const pdfUrl = await InvoiceStorageService.generateAndUploadInvoice(
          invoiceData,
          profile.user_id,
          profile.company_id
        );

        if (pdfUrl) {
          // Update invoice with PDF URL
          const { supabase } = await import('../lib/supabase');
          await supabase
            .from('billing_invoices')
            .update({ invoice_pdf_url: pdfUrl })
            .eq('id', invoice.id);

          // Update local state
          setInvoices(prev => prev.map(inv => 
            inv.id === invoice.id 
              ? { ...inv, invoice_pdf_url: pdfUrl }
              : inv
          ));

          // Open the generated PDF
          window.open(pdfUrl, '_blank');
          toast.success(`Invoice ${invoice.invoice_number} generated and opened!`);
        } else {
          toast.error('Failed to generate invoice PDF');
        }
      }
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handlePayInvoice = async (invoice: Invoice) => {
    if (!profile?.user_id || !profile?.company_id) {
      toast.error('Please log in to pay invoice');
      return;
    }

    try {
      setPayingInvoice(invoice.id);
      
      // Simulate payment processing
      toast.info('Processing payment...');
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const { supabase } = await import('../lib/supabase');
      
      // Update invoice status to paid
      const { error } = await supabase
        .from('billing_invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update local state
      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id 
          ? { ...inv, status: 'paid' as const, paid_at: new Date().toISOString() }
          : inv
      ));
      
      toast.success(`Payment successful! Invoice ${invoice.invoice_number} has been paid.`);
      
    } catch (error: any) {
      console.error('Error paying invoice:', error);
      toast.error(error.message || 'Failed to process payment');
    } finally {
      setPayingInvoice(null);
    }
  };

  const createDummyInvoices = async () => {
    if (!profile?.user_id || !profile?.company_id) {
      toast.error('Please log in to create dummy invoices');
      return;
    }

    try {
      setLoading(true);
      const { supabase } = await import('../lib/supabase');
      
      const currentDate = new Date();
      
      // Generate random invoice numbers with timestamp to ensure uniqueness
      const generateRandomInvoiceNumber = () => {
        const timestamp = Date.now();
        const randomSuffix = Math.floor(Math.random() * 9000) + 1000; // 4-digit random number
        return `INV-${currentDate.getFullYear()}-${timestamp}-${randomSuffix}`;
      };

      // Random plan types and amounts
      const planTypes = [
        { name: 'Free', amount: 0.00, description: 'Free Plan - Monthly Subscription' },
        { name: 'Professional', amount: 49.00, description: 'Professional Plan - Monthly Subscription' },
        { name: 'Enterprise', amount: 99.00, description: 'Enterprise Plan - Monthly Subscription' },
        { name: 'Starter', amount: 19.00, description: 'Starter Plan - Monthly Subscription' },
        { name: 'Team', amount: 79.00, description: 'Team Plan - Monthly Subscription' }
      ];

      // Random statuses
      const statuses = ['pending', 'paid', 'overdue'] as const;

      const dummyInvoices = Array.from({ length: 5 }, (_, index) => {
        const randomPlan = planTypes[Math.floor(Math.random() * planTypes.length)];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        const daysAgo = Math.floor(Math.random() * 180) + 1; // Random days between 1-180
        const dueDaysOffset = Math.floor(Math.random() * 60) - 30; // Random offset -30 to +30 days
        
        const invoiceDate = new Date(currentDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        const dueDate = new Date(invoiceDate.getTime() + dueDaysOffset * 24 * 60 * 60 * 1000);
        
        // If status is paid, add paid_at date
        const paidAt = randomStatus === 'paid' 
          ? new Date(dueDate.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString()
          : null;

        return {
          user_id: profile.user_id,
          company_id: profile.company_id,
          invoice_number: generateRandomInvoiceNumber(),
          invoice_date: invoiceDate.toISOString(),
          due_date: dueDate.toISOString(),
          amount: randomPlan.amount,
          currency: 'USD',
          status: randomStatus,
          description: randomPlan.description,
          ...(paidAt && { paid_at: paidAt }),
          line_items: [
            {
              description: randomPlan.name + ' Plan',
              quantity: 1,
              unit_price: randomPlan.amount,
              total: randomPlan.amount
            }
          ]
        };
      });

      // Since we're generating random unique invoice numbers, we can skip duplicate checking
      const newInvoices = dummyInvoices;

      const { data, error } = await supabase
        .from('billing_invoices')
        .insert(newInvoices)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      // Generate PDFs for new invoices
      if (data && data.length > 0) {
        setGeneratingPdfs(true);
        toast.info('Generating invoice PDFs... This may take a moment.');
        
        const updatedInvoices = [];
        
        for (const invoice of data) {
          try {
            const invoiceData = {
              invoice_number: invoice.invoice_number,
              invoice_date: invoice.invoice_date,
              due_date: invoice.due_date || new Date().toISOString(),
              amount: invoice.amount,
              currency: invoice.currency,
              description: invoice.description || 'Monthly Subscription',
              line_items: invoice.line_items || [
                {
                  description: invoice.description || 'Monthly Subscription',
                  quantity: 1,
                  unit_price: invoice.amount,
                  total: invoice.amount
                }
              ]
            };

            const pdfUrl = await InvoiceStorageService.generateAndUploadInvoice(
              invoiceData,
              profile.user_id,
              profile.company_id
            );

            if (pdfUrl) {
              // Update invoice with PDF URL
              const { error: updateError } = await supabase
                .from('billing_invoices')
                .update({ invoice_pdf_url: pdfUrl })
                .eq('id', invoice.id);

              if (!updateError) {
                updatedInvoices.push({ ...invoice, invoice_pdf_url: pdfUrl });
              } else {
                updatedInvoices.push(invoice);
              }
            } else {
              updatedInvoices.push(invoice);
            }
          } catch (error) {
            console.error('Error generating PDF for invoice:', invoice.invoice_number, error);
            updatedInvoices.push(invoice);
          }
        }

        setInvoices(updatedInvoices.sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime()));
        setGeneratingPdfs(false);
      }

      toast.success(`Created ${newInvoices.length} new random invoices with PDFs successfully!`);
      
    } catch (error: any) {
      console.error('Error creating dummy invoices:', error);
      toast.error(error.message || 'Failed to create dummy invoices');
    } finally {
      setLoading(false);
    }
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SettingsLayout title="Billing & Subscription">
      {/* Monthly Usage Limit */}
      {profile?.user_id && (
        <MonthlyUsageLimit userId={profile.user_id} />
      )}

      {/* Current Plan Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Current Plan</h2>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold text-gray-900">{billingSettings?.plan_name || 'Free'}</h3>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                Current Plan
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-900">
                ${billingSettings?.plan_price?.toFixed(2) || '0.00'}
              </span>
              <span className="text-gray-500">/{billingSettings?.plan_period || 'month'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            Next billing: {billingSettings?.next_billing_date 
              ? new Date(billingSettings.next_billing_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
              : 'N/A'
            }
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {(billingSettings?.subscription_features || 
            (billingSettings?.plan_name === 'Enterprise' ? [
              'Unlimited AI conversations',
              'Advanced analytics & reporting',
              'Priority 24/7 support',
              'Custom integrations & API access',
              'Advanced team collaboration',
              'White-label solutions',
              'Dedicated account manager',
              'Custom training & onboarding'
            ] : billingSettings?.plan_name === 'Professional' ? [
              'Unlimited AI conversations',
              'Advanced analytics',
              'Priority support',
              'Custom integrations',
              'Team collaboration'
            ] : [
              'Basic AI conversations',
              'Standard support',
              'Limited features'
            ])
          ).map((feature, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-green-600" />
              </div>
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
        </div>

        {billingSettings?.plan_name === 'Enterprise' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">
                  You're on the Enterprise plan
                </div>
                <div className="text-sm text-green-600">
                  Enjoying all premium features
                </div>
              </div>
            </div>
            <button
              onClick={handleManagePlan}
              disabled={upgrading}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {upgrading ? 'Processing...' : 'Change Plan'}
            </button>
          </div>
        ) : (
          <button
            onClick={handleUpgradeToEnterprise}
            disabled={upgrading}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {upgrading ? 'Processing...' : billingSettings?.payment_method_type ? 'Upgrade to Enterprise' : 'Add Payment & Upgrade'}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
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
              {billingSettings?.payment_method_type ? (
                <>
                  <div className="font-medium text-gray-900">
                    {billingSettings.payment_method_brand || 'Card'} ending in {billingSettings.payment_method_last4}
                  </div>
                  <div className="text-sm text-gray-500">
                    Expires {billingSettings.payment_method_expiry}
                  </div>
                </>
              ) : (
                <div className="font-medium text-gray-500">
                  No payment method on file
                </div>
              )}
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

      {/* Combined Usage Overview Section */}
      {profile?.user_id && (
        <div className="mb-6">
          <CombinedUsageAnalytics userId={profile.user_id} />
        </div>
      )}

      {/* Token Usage Analytics Section */}
      {profile?.user_id && (
        <div className="mb-6">
          <UsageAnalytics userId={profile.user_id} />
        </div>
      )}

      {/* Tool Usage Analytics Section */}
      {profile?.user_id && (
        <div className="mb-6">
          <ToolUsageAnalytics userId={profile.user_id} />
        </div>
      )}

      {/* Billing History Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Billing History</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={createDummyInvoices}
              disabled={loading || generatingPdfs}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPdfs ? 'Generating PDFs...' : loading ? 'Creating...' : 'Add Random Invoices'}
            </button>
            <p className="text-sm text-gray-500">Showing recent invoices</p>
          </div>
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
              {invoices.length > 0 ? invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.invoice_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(invoice.invoice_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${invoice.amount.toFixed(2)} {invoice.currency}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <button 
                          onClick={() => handlePayInvoice(invoice)}
                          disabled={payingInvoice === invoice.id}
                          className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <DollarSign className="w-4 h-4" />
                          {payingInvoice === invoice.id ? 'Processing...' : 'Pay Now'}
                        </button>
                      ) : null}
                      <button 
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        title={invoice.invoice_pdf_url ? 'Download PDF' : 'Generate and download PDF'}
                      >
                        <Download className="w-4 h-4" />
                        {invoice.invoice_pdf_url ? 'Download' : 'Generate PDF'}
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Selection Modal */}
      {showPlanSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Change Your Plan</h3>
              <button 
                onClick={() => setShowPlanSelection(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Free Plan */}
                <div className={`border-2 rounded-lg p-6 ${
                  billingSettings?.plan_name === 'Free' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors cursor-pointer`}>
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">Free</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">$0</div>
                    <div className="text-gray-500">/month</div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      'Basic AI conversations',
                      'Standard support',
                      'Limited features'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {billingSettings?.plan_name === 'Free' ? (
                    <button className="w-full py-2 px-4 border border-purple-500 text-purple-600 rounded-lg font-medium">
                      Current Plan
                    </button>
                  ) : (
                    <>
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <div className="font-medium">Downgrade Warning</div>
                          <div>You'll lose access to premium features immediately.</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handlePlanChange('Free', 0, [
                          'Basic AI conversations',
                          'Standard support',
                          'Limited features'
                        ])}
                        className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Downgrade to Free
                      </button>
                    </>
                  )}
                </div>

                {/* Professional Plan */}
                <div className={`border-2 rounded-lg p-6 ${
                  billingSettings?.plan_name === 'Professional' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors cursor-pointer`}>
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">Professional</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">$49</div>
                    <div className="text-gray-500">/month</div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      'Unlimited AI conversations',
                      'Advanced analytics',
                      'Priority support',
                      'Custom integrations',
                      'Team collaboration'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {billingSettings?.plan_name === 'Professional' ? (
                    <button className="w-full py-2 px-4 border border-purple-500 text-purple-600 rounded-lg font-medium">
                      Current Plan
                    </button>
                  ) : billingSettings?.plan_name === 'Enterprise' ? (
                    <>
                      <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                          <div className="font-medium">Downgrade Warning</div>
                          <div>You'll lose Enterprise features like white-label solutions and dedicated support.</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handlePlanChange('Professional', 49.00, [
                          'Unlimited AI conversations',
                          'Advanced analytics',
                          'Priority support',
                          'Custom integrations',
                          'Team collaboration'
                        ])}
                        className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        Downgrade to Professional
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handlePlanChange('Professional', 49.00, [
                        'Unlimited AI conversations',
                        'Advanced analytics',
                        'Priority support',
                        'Custom integrations',
                        'Team collaboration'
                      ])}
                      className="w-full py-2 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                    >
                      Upgrade to Professional
                    </button>
                  )}
                </div>

                {/* Enterprise Plan */}
                <div className={`border-2 rounded-lg p-6 ${
                  billingSettings?.plan_name === 'Enterprise' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                } transition-colors cursor-pointer relative`}>
                  {billingSettings?.plan_name !== 'Enterprise' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">Enterprise</h4>
                    <div className="text-3xl font-bold text-gray-900 mt-2">$99</div>
                    <div className="text-gray-500">/month</div>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {[
                      'Unlimited AI conversations',
                      'Advanced analytics & reporting',
                      'Priority 24/7 support',
                      'Custom integrations & API access',
                      'Advanced team collaboration',
                      'White-label solutions',
                      'Dedicated account manager',
                      'Custom training & onboarding'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {billingSettings?.plan_name === 'Enterprise' ? (
                    <button className="w-full py-2 px-4 border border-purple-500 text-purple-600 rounded-lg font-medium">
                      Current Plan
                    </button>
                  ) : (
                    <button 
                      onClick={() => handlePlanChange('Enterprise', 99.00, [
                        'Unlimited AI conversations',
                        'Advanced analytics & reporting',
                        'Priority 24/7 support',
                        'Custom integrations & API access',
                        'Advanced team collaboration',
                        'White-label solutions',
                        'Dedicated account manager',
                        'Custom training & onboarding'
                      ])}
                      className="w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Upgrade to Enterprise
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-6 text-center text-sm text-gray-500">
                Changes will take effect immediately. Downgrades will be prorated and credited to your account.
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
