import { useState, useEffect } from "react";
import { X, Menu, Sun, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatInterface } from "../components/ChatInterface";
import { UserAccountDropdown } from "../components/UserAccountDropdown";
import { SetupStepsSidebar } from "../components/SetupStepsSidebar";
import NotificationBell from "../components/NotificationBell";
import { useUser } from "../hooks/useUser";
import { saveSolarSetup, getSolarSetup, getBusinessDetails } from "../lib/api";
import { toast } from "sonner";
import { CURRENCIES, getCountryEnergyDefaults, getCurrencyFromCountry } from "../utils/currencyUtils";



// Helper component for input fields with help icons
function HelpTooltip({ content }: { content: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="ml-2 text-gray-400 hover:text-gray-600"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {showTooltip && (
        <div className="absolute left-6 top-0 z-10 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
          {content}
          <div className="absolute left-0 top-2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
        </div>
      )}
    </div>
  );
}

// Main Solar Setup Page Component
export default function SolarSetup() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState('GBP'); // Default to GBP
  const currency = CURRENCIES[selectedCurrency];
  
  // Form state - starting with empty/default values
  const [installationPrice, setInstallationPrice] = useState(0);
  const [dealerFee, setDealerFee] = useState(0);
  const [brokerFee, setBrokerFee] = useState(0);
  const [allowFinanced, setAllowFinanced] = useState(true);
  const [allowCash, setAllowCash] = useState(true);
  const [financingApr, setFinancingApr] = useState(0);
  const [financingTerm, setFinancingTerm] = useState(0);
  const [energyPrice, setEnergyPrice] = useState(0);
  const [yearlyElectricCostIncrease, setYearlyElectricCostIncrease] = useState(0);
  const [installationLifespan, setInstallationLifespan] = useState(0);
  const [typicalPanelCount, setTypicalPanelCount] = useState(0);
  const [maxRoofSegments, setMaxRoofSegments] = useState(0);
  const [solarIncentive, setSolarIncentive] = useState(0);
  const [propertyType, setPropertyType] = useState('Residential');

  // Load existing data from database on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (userId && !dataLoaded) {
        // First, get the user's country from business details
        const businessDetails = await getBusinessDetails(userId);
        const countryCode = businessDetails?.country || 'GB'; // Default to UK
        
        // Get country-specific defaults
        const countryDefaults = getCountryEnergyDefaults(countryCode);
        setSelectedCurrency(countryDefaults.currency.code);
        
        // Then check for existing solar setup data
        const existingData = await getSolarSetup(userId);
        if (existingData) {
          setInstallationPrice(existingData.installation_price || countryDefaults.installationPrice);
          setDealerFee(existingData.dealer_fee || 15);
          setBrokerFee(existingData.broker_fee || countryDefaults.brokerFee);
          setAllowFinanced(existingData.allow_financed ?? true);
          setAllowCash(existingData.allow_cash ?? true);
          setFinancingApr(existingData.financing_apr || 5);
          setFinancingTerm(existingData.financing_term || 240);
          setEnergyPrice(existingData.energy_price || countryDefaults.energyPrice);
          setYearlyElectricCostIncrease(existingData.yearly_electric_cost_increase || 4);
          setInstallationLifespan(existingData.installation_lifespan || 25);
          setTypicalPanelCount(existingData.typical_panel_count || 40);
          setMaxRoofSegments(existingData.max_roof_segments || 4);
          setSolarIncentive(existingData.solar_incentive || 30);
          setPropertyType(existingData.property_type || 'Residential');
          
          // If there's a saved currency in the data, use it
          if (existingData.currency) {
            setSelectedCurrency(existingData.currency);
          }
          
          setDataLoaded(true);
        } else {
          // Set country-specific default values if no existing data
          setInstallationPrice(countryDefaults.installationPrice);
          setDealerFee(15.0);
          setBrokerFee(countryDefaults.brokerFee);
          setFinancingApr(5.0);
          setFinancingTerm(240);
          setEnergyPrice(countryDefaults.energyPrice);
          setYearlyElectricCostIncrease(4.0);
          setInstallationLifespan(25);
          setTypicalPanelCount(40);
          setMaxRoofSegments(4);
          setSolarIncentive(30.0);
          setPropertyType('Residential');
          setDataLoaded(true);
        }
      }
    };

    loadExistingData();
  }, [userId, dataLoaded]);

  const handleContinue = async () => {
    if (!userId) {
      toast.error('Please log in to continue');
      return;
    }

    // Validate all numeric fields are >= 0 (except Purchase Options which are checkboxes)
    const numericFields = [
      { value: installationPrice, name: 'Installation price' },
      { value: dealerFee, name: 'Dealer fee' },
      { value: brokerFee, name: 'Broker fee' },
      { value: energyPrice, name: 'Energy price' },
      { value: yearlyElectricCostIncrease, name: 'Yearly electric cost increase' },
      { value: installationLifespan, name: 'Installation lifespan' },
      { value: typicalPanelCount, name: 'Typical panel count' },
      { value: maxRoofSegments, name: 'Maximum roof segments' },
      { value: solarIncentive, name: 'Solar incentive' }
    ];

    // Add financing fields to validation only if financing is enabled
    if (allowFinanced) {
      numericFields.push(
        { value: financingApr, name: 'Financing APR' },
        { value: financingTerm, name: 'Financing term' }
      );
    }

    const invalidFields = numericFields.filter(field => field.value < 0);
    
    if (invalidFields.length > 0) {
      const fieldNames = invalidFields.map(field => field.name).join(', ');
      toast.error(`Please ensure all fields have positive values. Invalid fields: ${fieldNames}`);
      return;
    }

    setIsLoading(true);
    
    try {
      const solarSetupData = {
        firm_user_id: userId,
        agent_id: 'SOL',
        installation_price: installationPrice,
        dealer_fee: dealerFee,
        broker_fee: brokerFee,
        allow_financed: allowFinanced,
        allow_cash: allowCash,
        financing_apr: financingApr,
        financing_term: financingTerm,
        energy_price: energyPrice,
        yearly_electric_cost_increase: yearlyElectricCostIncrease,
        installation_lifespan: installationLifespan,
        typical_panel_count: typicalPanelCount,
        max_roof_segments: maxRoofSegments,
        solar_incentive: solarIncentive,
        property_type: propertyType,
        currency: selectedCurrency,
        setup_status: 'completed'
      };

      const result = await saveSolarSetup(solarSetupData);
      
      if (result.success) {
        toast.success('Solar setup saved successfully!');
        navigate('/calendar-setup');
      } else {
        toast.error('Failed to save solar setup');
      }
    } catch (error: any) {
      console.error('Solar setup save error:', error);
      toast.error(error.message || 'Failed to save solar setup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="h-16 bg-white border-b border-grey-700 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-text-primary" />
          </button>
          
          <div className="w-6 h-6 bg-squidgy-gradient rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
          <span className="font-bold text-lg text-text-primary">Squidgy</span>
          <div className="flex items-center gap-3 ml-4">
            <NotificationBell />
            <UserAccountDropdown />
          </div>
        </div>
        <button className="text-squidgy-purple font-bold text-sm px-5 py-3 rounded-button hover:bg-gray-50 transition-colors">
          Close (save draft)
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-grey-800">
        <div className="h-full w-96 bg-squidgy-gradient"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="p-5">
          <ChatInterface 
            agentName="Seth agent"
            agentDescription="Solar Setup Assistant"
            context="solar_setup"
          />
        </div>

        {/* Main Form Content */}
        <div className="flex-1 max-w-2xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-text-primary mb-8">Create an agent</h1>
          </div>

          {/* Form */}
          <div className="max-w-lg mx-auto">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sun className="w-6 h-6 text-squidgy-purple" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">3. Solar setup</h2>
              <p className="text-text-secondary text-sm">
                Please review your solar offer details. You can edit these later as well.
              </p>
            </div>

            {/* Currency Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">Currency</label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
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

            {/* Installation Price */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Installation price
                <HelpTooltip content={`Base price charged per kilowatt of solar panel capacity. Typical: ${currency.symbol}${getCountryEnergyDefaults('GB').installationPrice}/kW`} />
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-50 border border-r-0 border-grey-500 rounded-l-md text-text-primary font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={installationPrice}
                  onChange={(e) => setInstallationPrice(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">/kW</span>
              </div>
            </div>

            {/* Dealer Fee */}
            <div className="mb-6">
              <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> If you are the installer or work directly without a dealer, set this to 0%.
                </p>
              </div>
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Dealer fee
                <HelpTooltip content="Percentage fee added to the base installation price for dealer markup. Set to 0% if you are the installer or there's no dealer involved." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={dealerFee}
                  onChange={(e) => setDealerFee(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">%</span>
              </div>
            </div>

            {/* Broker Fee */}
            <div className="mb-6">
              <div className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800">
                  <strong>Note:</strong> If you handle sales directly or work without a broker, set this to 0%.
                </p>
              </div>
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Broker fee
                <HelpTooltip content={`Percentage charged as a broker fee for the installation. Set to 0% if you handle sales directly or there's no broker involved. Typical: ${getCountryEnergyDefaults('GB').brokerFee}%`} />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={brokerFee}
                  onChange={(e) => setBrokerFee(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">%</span>
              </div>
            </div>

            {/* Property Type */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-4">
                Property type
                <HelpTooltip content="Type of property where the solar installation will be performed." />
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    value="Residential"
                    checked={propertyType === 'Residential'}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Residential</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    value="Commercial"
                    checked={propertyType === 'Commercial'}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Commercial</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="propertyType"
                    value="Other"
                    checked={propertyType === 'Other'}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Other</span>
                </label>
              </div>
            </div>

            {/* Purchase Options */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-4">Purchase options</label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowFinanced}
                    onChange={(e) => setAllowFinanced(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Allow financed purchases</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCash}
                    onChange={(e) => setAllowCash(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Allow cash purchases</span>
                </label>
              </div>
            </div>

            {/* Financing Fields - Only show if financing is allowed */}
            {allowFinanced && (
              <>
                {/* Financing APR */}
                <div className="mb-6">
                  <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                    Financing APR
                    <HelpTooltip content="Annual Percentage Rate for financing options offered to customers." />
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={financingApr}
                      onChange={(e) => setFinancingApr(parseFloat(e.target.value) || 0)}
                      className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                    />
                    <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">%</span>
                  </div>
                </div>

                {/* Financing Term */}
                <div className="mb-6">
                  <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                    Financing term
                    <HelpTooltip content="Length of the financing term in months." />
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={financingTerm}
                      onChange={(e) => setFinancingTerm(parseInt(e.target.value) || 0)}
                      className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                    />
                    <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">Months</span>
                  </div>
                </div>
              </>
            )}

            {/* Energy Price */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Energy price
                <HelpTooltip content={`Current electricity rate per kilowatt-hour for cost comparison calculations. Typical: ${currency.symbol}${getCountryEnergyDefaults('GB').energyPrice}/kWh`} />
              </label>
              <div className="flex items-center">
                <span className="px-4 py-3 bg-gray-50 border border-r-0 border-grey-500 rounded-l-md text-text-primary font-bold">{currency.symbol}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={energyPrice}
                  onChange={(e) => setEnergyPrice(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">/kWh</span>
              </div>
            </div>

            {/* Yearly Electric Cost Increase */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Yearly electric cost increase
                <HelpTooltip content="Expected annual increase in electricity costs for savings calculations." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={yearlyElectricCostIncrease}
                  onChange={(e) => setYearlyElectricCostIncrease(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">%</span>
              </div>
            </div>

            {/* Installation Lifespan */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Installation lifespan
                <HelpTooltip content="Expected lifespan of the solar installation in years." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={installationLifespan}
                  onChange={(e) => setInstallationLifespan(parseInt(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">Years</span>
              </div>
            </div>

            {/* Typical Panel Count */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Typical panel count
                <HelpTooltip content="Average number of solar panels in a typical installation." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={typicalPanelCount}
                  onChange={(e) => setTypicalPanelCount(parseInt(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">Panels</span>
              </div>
            </div>

            {/* Maximum Roof Segments */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Maximum roof segments
                <HelpTooltip content="Maximum number of roof segments that can be used for panel installation." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={maxRoofSegments}
                  onChange={(e) => setMaxRoofSegments(parseInt(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">Segments</span>
              </div>
            </div>

            {/* Solar Incentive */}
            <div className="mb-8">
              <label className="flex items-center text-sm font-semibold text-text-primary mb-2">
                Solar incentive
                <HelpTooltip content="Percentage discount or incentive offered on solar installations." />
              </label>
              <div className="flex items-center">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={solarIncentive}
                  onChange={(e) => setSolarIncentive(parseFloat(e.target.value) || 0)}
                  className="flex-1 p-3 border border-grey-500 rounded-l-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                />
                <span className="px-4 py-3 bg-gray-50 border border-l-0 border-grey-500 rounded-r-md text-text-primary">%</span>
              </div>
            </div>


            {/* Continue Button */}
            <button 
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full bg-squidgy-gradient text-white font-bold text-sm py-3 px-5 rounded-button hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Continue'}
              {!isLoading && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 21 21">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.83333 10.1123H17.1667M17.1667 10.1123L12.1667 5.1123M17.1667 10.1123L12.1667 15.1123" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Setup Steps Sidebar */}
        <div className="hidden lg:block">
          <SetupStepsSidebar currentStep={3} />
        </div>
      </div>

      {/* Mobile Setup Steps Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full">
            <SetupStepsSidebar currentStep={3} />
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-primary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
