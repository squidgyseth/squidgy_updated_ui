import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Percent, Home, Building2, Package, CreditCard, Banknote, Calendar, Zap, TrendingUp, Clock, Sun, Layers, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';
import { OptimizedAgentService } from '../services/optimizedAgentService';
import { CURRENCIES, getCountryEnergyDefaults, getCurrencyFromCountry } from '../utils/currencyUtils';
import { getBusinessDetails } from '../lib/api';

interface SolarConfigData {
  installation_price: number;
  dealer_fee: number;
  broker_fee: number;
  property_type: 'residential' | 'commercial' | 'other';
  allow_financed: boolean;
  allow_cash: boolean;
  financing_apr: number;
  financing_term: number;
  energy_price: number;
  yearly_cost_increase: number;
  installation_lifespan: number;
  typical_panel_count: number;
  max_roof_segments: number;
  solar_incentive: number;
}

export default function SolarConfig() {
  const navigate = useNavigate();
  const { user, userId } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [agentConfig, setAgentConfig] = useState<any>(null);
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState('GBP'); // Default to GBP
  const currency = CURRENCIES[selectedCurrency];
  
  // Helper function to get agent ID
  const getAgentId = () => agentConfig?.agent?.id || 'SOL';
  
  // Default values that will be updated from YAML
  const [config, setConfig] = useState<SolarConfigData>({
    installation_price: 2,
    dealer_fee: 15,
    broker_fee: 50,
    property_type: 'residential',
    allow_financed: true,
    allow_cash: true,
    financing_apr: 5,
    financing_term: 240,
    energy_price: 0.17,
    yearly_cost_increase: 4,
    installation_lifespan: 20,
    typical_panel_count: 40,
    max_roof_segments: 4,
    solar_incentive: 3
  });

  // Load agent configuration and defaults
  useEffect(() => {
    const loadAgentConfig = () => {
      try {
        const agentService = OptimizedAgentService.getInstance();
        const config = agentService.getAgentById('SOL');
        if (config) {
          setAgentConfig(config);
          
          // Update default values from YAML if they exist
          const defaults = config.solar_config?.defaults;
          if (defaults) {
            setConfig(prevConfig => ({
              ...prevConfig,
              installation_price: defaults.installation_price || prevConfig.installation_price,
              dealer_fee: defaults.dealer_fee || prevConfig.dealer_fee,
              broker_fee: defaults.broker_fee || prevConfig.broker_fee,
              financing_apr: defaults.financing_apr || prevConfig.financing_apr,
              financing_term: defaults.financing_term || prevConfig.financing_term,
              energy_price: defaults.energy_price || prevConfig.energy_price,
              yearly_cost_increase: defaults.yearly_cost_increase || prevConfig.yearly_cost_increase,
              installation_lifespan: defaults.installation_lifespan || prevConfig.installation_lifespan,
              typical_panel_count: defaults.typical_panel_count || prevConfig.typical_panel_count,
              max_roof_segments: defaults.max_roof_segments || prevConfig.max_roof_segments,
              solar_incentive: defaults.solar_incentive || prevConfig.solar_incentive
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load agent config:', error);
      }
    };

    loadAgentConfig();
  }, []);

  // Load existing configuration if available
  useEffect(() => {
    if (userId) {
      loadExistingConfig();
    }
  }, [userId]);

  const loadExistingConfig = async () => {
    try {
      setLoading(true);
      
      // First, get the user's country from business details
      const businessDetails = await getBusinessDetails(userId);
      const countryCode = businessDetails?.country || 'GB'; // Default to UK
      
      // Get country-specific defaults
      const countryDefaults = getCountryEnergyDefaults(countryCode);
      setSelectedCurrency(countryDefaults.currency.code);
      
      const { data, error } = await supabase
        .from('solar_setup')
        .select('*')
        .eq('firm_user_id', userId)
        .eq('agent_id', getAgentId())
        .single();

      if (data && !error) {
        setConfig({
          installation_price: data.installation_price || countryDefaults.installationPrice,
          dealer_fee: data.dealer_fee || 15,
          broker_fee: data.broker_fee || countryDefaults.brokerFee,
          property_type: data.property_type?.toLowerCase() || 'residential',
          allow_financed: data.allow_financed !== false,
          allow_cash: data.allow_cash !== false,
          financing_apr: data.financing_apr || 5,
          financing_term: data.financing_term || 240,
          energy_price: data.energy_price || countryDefaults.energyPrice,
          yearly_cost_increase: data.yearly_electric_cost_increase || 4,
          installation_lifespan: data.installation_lifespan || 25,
          typical_panel_count: data.typical_panel_count || 40,
          max_roof_segments: data.max_roof_segments || 4,
          solar_incentive: data.solar_incentive || 30
        });
        
        // If there's a saved currency in the data, use it
        if (data.currency) {
          setSelectedCurrency(data.currency);
        }
      } else {
        // Set country-specific default values if no existing data
        setConfig({
          installation_price: countryDefaults.installationPrice,
          dealer_fee: 15,
          broker_fee: countryDefaults.brokerFee,
          property_type: 'residential',
          allow_financed: true,
          allow_cash: true,
          financing_apr: 5,
          financing_term: 240,
          energy_price: countryDefaults.energyPrice,
          yearly_cost_increase: 4,
          installation_lifespan: 25,
          typical_panel_count: 40,
          max_roof_segments: 4,
          solar_incentive: 30
        });
      }
    } catch (error) {
      console.log('No existing config found');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('Please log in to save configuration');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('solar_setup')
        .upsert({
          firm_user_id: userId,
          agent_id: getAgentId(),
          installation_price: config.installation_price,
          dealer_fee: config.dealer_fee,
          broker_fee: config.broker_fee,
          property_type: config.property_type.charAt(0).toUpperCase() + config.property_type.slice(1),
          allow_financed: config.allow_financed,
          allow_cash: config.allow_cash,
          financing_apr: config.financing_apr,
          financing_term: config.financing_term,
          currency: selectedCurrency,
          energy_price: config.energy_price,
          yearly_electric_cost_increase: config.yearly_cost_increase,
          installation_lifespan: config.installation_lifespan,
          typical_panel_count: config.typical_panel_count,
          max_roof_segments: config.max_roof_segments,
          solar_incentive: config.solar_incentive,
          setup_status: 'completed',
          last_updated_timestamp: new Date().toISOString()
        }, {
          onConflict: 'firm_user_id,agent_id'
        });

      if (error) throw error;
      
      toast.success('Solar configuration saved successfully!');
      
      // Navigate to agent chat after saving
      setTimeout(() => {
        navigate(`/chat/${getAgentId()}`);
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/chat/${getAgentId()}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl">
                  <Sun className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Solar Setup</h1>
                  <p className="text-sm text-gray-500">Configure your solar offer details</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100">

          {/* Currency Selector */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full md:w-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {Object.values(CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name} ({curr.code})
                </option>
              ))}
            </select>
          </div>

          {/* Pricing Formula Explanation */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How Solar Pricing is Calculated
            </h3>
            <div className="text-xs text-blue-800 space-y-2">
              <div className="font-medium">Total Installation Cost:</div>
              <div className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                Base Cost = (System Size in kW) × (Installation Price per kW)
              </div>
              <div className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                + Dealer Fee = Base Cost × (Dealer Fee %)
              </div>
              <div className="ml-2 font-mono bg-white px-2 py-1 rounded border">
                + Broker Fee = Broker Fee %
              </div>
              <div className="ml-2 font-mono bg-white px-2 py-1 rounded border border-blue-300">
                <strong>Final Price = Base Cost + Dealer Fee + Broker Fee</strong>
              </div>
              <div className="mt-3 text-blue-700">
                <strong>Annual Savings:</strong> System Output (kWh) × Energy Price ({currency.symbol}/kWh) × (1 + Annual Increase)
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Installation Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Banknote className="w-4 h-4 text-green-600" />
                Installation price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  value={config.installation_price}
                  onChange={(e) => setConfig({...config, installation_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-12 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">/kW</span>
              </div>
            </div>

            {/* Dealer Fee */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Percent className="w-4 h-4 text-orange-500" />
                Dealer fee
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.dealer_fee}
                  onChange={(e) => setConfig({...config, dealer_fee: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> If you are the installer or work directly without a dealer, set this to 0.
                </p>
              </div>
            </div>

            {/* Broker Fee */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Percent className="w-4 h-4 text-orange-500" />
                Broker fee
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.broker_fee}
                  onChange={(e) => setConfig({...config, broker_fee: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-800">
                  <strong>Note:</strong> If you handle sales directly or work without a broker, set this to 0.
                </p>
              </div>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Property type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setConfig({...config, property_type: 'residential'})}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    config.property_type === 'residential'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  <span className="text-xs">Residential</span>
                </button>
                <button
                  onClick={() => setConfig({...config, property_type: 'commercial'})}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    config.property_type === 'commercial'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs">Commercial</span>
                </button>
                <button
                  onClick={() => setConfig({...config, property_type: 'other'})}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    config.property_type === 'other'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span className="text-xs">Other</span>
                </button>
              </div>
            </div>

            {/* Purchase Options */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Purchase options</label>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_financed}
                    onChange={(e) => setConfig({...config, allow_financed: e.target.checked})}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    Allow financed purchases
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_cash}
                    onChange={(e) => setConfig({...config, allow_cash: e.target.checked})}
                    className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <span className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-gray-500" />
                    Allow cash purchases
                  </span>
                </label>
              </div>
            </div>

            {/* Financing Fields - Only show if financing is allowed */}
            {config.allow_financed && (
              <>
                {/* Financing APR */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Percent className="w-4 h-4 text-orange-500" />
                    Financing APR
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.financing_apr}
                      onChange={(e) => setConfig({...config, financing_apr: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                  </div>
                </div>

                {/* Financing Term */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Financing term
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={config.financing_term}
                      onChange={(e) => setConfig({...config, financing_term: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">Months</span>
                  </div>
                </div>
              </>
            )}

            {/* Energy Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Banknote className="w-4 h-4 text-green-600" />
                Energy price
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.energy_price}
                  onChange={(e) => setConfig({...config, energy_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-12 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">/kWh</span>
              </div>
            </div>

            {/* Yearly Electric Cost Increase */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                Yearly electric cost increase
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.yearly_cost_increase}
                  onChange={(e) => setConfig({...config, yearly_cost_increase: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* Installation Lifespan */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="w-4 h-4 text-orange-500" />
                Installation lifespan
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.installation_lifespan}
                  onChange={(e) => setConfig({...config, installation_lifespan: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">Years</span>
              </div>
            </div>

            {/* Typical Panel Count */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Sun className="w-4 h-4 text-orange-500" />
                Typical panel count
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.typical_panel_count}
                  onChange={(e) => setConfig({...config, typical_panel_count: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">Panels</span>
              </div>
            </div>

            {/* Maximum Roof Segments */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Layers className="w-4 h-4 text-orange-500" />
                Maximum roof segments
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.max_roof_segments}
                  onChange={(e) => setConfig({...config, max_roof_segments: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">Segments</span>
              </div>
            </div>

            {/* Solar Incentive */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Award className="w-4 h-4 text-orange-500" />
                Solar incentive
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.solar_incentive}
                  onChange={(e) => setConfig({...config, solar_incentive: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-12 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-xl hover:from-orange-600 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-xl"
            >
              {saving ? 'Saving Configuration...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}