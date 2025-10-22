import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Percent, Home, Building2, Package, CreditCard, Banknote, Calendar, Zap, TrendingUp, Clock, Sun, Layers, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';

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
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
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

  // Load existing configuration if available
  useEffect(() => {
    if (user?.id) {
      loadExistingConfig();
    }
  }, [user]);

  const loadExistingConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('solar_configurations')
        .select('*')
        .eq('firm_user_id', user?.id)
        .single();

      if (data && !error) {
        setConfig(data.config_data);
        toast.success('Loaded existing configuration');
      }
    } catch (error) {
      console.log('No existing config found');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('Please log in to save configuration');
      return;
    }

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('solar_configurations')
        .upsert({
          firm_user_id: user.id,
          config_data: config,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'firm_user_id'
        });

      if (error) throw error;
      
      toast.success('Solar configuration saved successfully!');
      
      // Navigate to SOL Bot chat after saving
      setTimeout(() => {
        navigate('/chat/sol');
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
                onClick={() => navigate(-1)}
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
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-lg hover:from-orange-600 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg"
            >
              {saving ? 'Saving...' : 'Save & Continue'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-orange-100">
          <p className="text-gray-600 mb-8">
            Please review your solar offer details. You can edit these later as well.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Installation Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 text-orange-500" />
                Installation price
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={config.installation_price}
                  onChange={(e) => setConfig({...config, installation_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">$/Watt</span>
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
            </div>

            {/* Broker Fee */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 text-orange-500" />
                Broker fee
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={config.broker_fee}
                  onChange={(e) => setConfig({...config, broker_fee: parseFloat(e.target.value) || 0})}
                  className="w-full px-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
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
                  disabled={!config.allow_financed}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
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
                  disabled={!config.allow_financed}
                  className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">Months</span>
              </div>
            </div>

            {/* Energy Price */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Zap className="w-4 h-4 text-orange-500" />
                Energy price
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={config.energy_price}
                  onChange={(e) => setConfig({...config, energy_price: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-3 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">$/kWh</span>
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
              {saving ? 'Saving Configuration...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}