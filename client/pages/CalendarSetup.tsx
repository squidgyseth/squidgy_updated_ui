import { useState, useEffect } from "react";
import { X, Menu, Calendar, HelpCircle, Clock, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ChatInterface } from "../components/ChatInterface";
import { UserAccountDropdown } from "../components/UserAccountDropdown";
import { SetupStepsSidebar } from "../components/SetupStepsSidebar";
import { GoogleCalendarIntegration } from "../components/GoogleCalendarIntegration";
import { useUser } from "../hooks/useUser";
import { saveCalendarSetup, getCalendarSetup } from "../lib/api";
import { toast } from "sonner";



// Business Hours Component
function BusinessHours({ businessHours, setBusinessHours, onValidationChange }: {
  businessHours: Record<string, { enabled: boolean; start: string; end: string }>;
  setBusinessHours: (hours: Record<string, { enabled: boolean; start: string; end: string }>) => void;
  onValidationChange?: (isValid: boolean) => void;
}) {
  const [timeErrors, setTimeErrors] = useState<Record<string, string>>({});

  const toggleDay = (day: string) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        enabled: !prev[day as keyof typeof prev].enabled
      }
    }));
    // Clear error when disabling
    if (businessHours[day as keyof typeof businessHours].enabled) {
      setTimeErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[day];
        return newErrors;
      });
    }
  };

  const validateTimeRange = (startTime: string, endTime: string): boolean => {
    if (!startTime || !endTime) return true; // Don't validate empty times
    
    // Convert time strings to comparable numbers (e.g., "09:00" -> 900, "17:00" -> 1700)
    const timeToNumber = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 100 + minutes;
    };
    
    return timeToNumber(startTime) < timeToNumber(endTime);
  };

  const updateTime = (day: string, field: 'start' | 'end', value: string) => {
    const currentDay = businessHours[day as keyof typeof businessHours];
    const newStart = field === 'start' ? value : currentDay.start;
    const newEnd = field === 'end' ? value : currentDay.end;
    
    // Validate the time range
    const isValid = validateTimeRange(newStart, newEnd);
    
    let newErrors = { ...timeErrors };
    
    if (!isValid) {
      newErrors[day] = 'End time must be after start time';
    } else {
      // Clear error if valid
      delete newErrors[day];
    }
    
    setTimeErrors(newErrors);
    
    // Notify parent about validation state
    if (onValidationChange) {
      onValidationChange(Object.keys(newErrors).length === 0);
    }
    
    // Update the time regardless (let user see what they typed)
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const days = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];
  
  // Format time for display (e.g., "09:00" -> "9:00 AM")
  const formatTimeDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
  };

  return (
    <div className="space-y-4">
      {days.map(({ key, label }) => (
        <div key={key}>
          <label className="flex items-center gap-3 mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={businessHours[key as keyof typeof businessHours].enabled}
              onChange={() => toggleDay(key)}
              className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
            />
            <span className="text-text-primary font-medium flex-1">{label}</span>
            {businessHours[key as keyof typeof businessHours].enabled && 
             businessHours[key as keyof typeof businessHours].start && 
             businessHours[key as keyof typeof businessHours].end && (
              <span className="text-xs text-gray-500">
                {formatTimeDisplay(businessHours[key as keyof typeof businessHours].start)} - {formatTimeDisplay(businessHours[key as keyof typeof businessHours].end)}
              </span>
            )}
          </label>
          
          {businessHours[key as keyof typeof businessHours].enabled && (
            <>
              <div className="ml-8 flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-text-secondary mb-1">Starts</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={businessHours[key as keyof typeof businessHours].start}
                      onChange={(e) => updateTime(key, 'start', e.target.value)}
                      className={`w-full p-3 pr-10 border rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent ${
                        timeErrors[key] ? 'border-red-500' : 'border-grey-500'
                      }`}
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm text-text-secondary mb-1">Ends</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={businessHours[key as keyof typeof businessHours].end}
                      onChange={(e) => updateTime(key, 'end', e.target.value)}
                      className={`w-full p-3 pr-10 border rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent ${
                        timeErrors[key] ? 'border-red-500' : 'border-grey-500'
                      }`}
                    />
                    <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
              {timeErrors[key] && (
                <div className="ml-8 mt-1 text-red-500 text-xs flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {timeErrors[key]}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// Main Calendar Setup Page Component
export default function CalendarSetup() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userId } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [hasTimeErrors, setHasTimeErrors] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Form state - starting with empty/default values
  const [calendarName, setCalendarName] = useState('');
  const [description, setDescription] = useState('');
  const [callDuration, setCallDuration] = useState(60);
  const [maxCallsPerDay, setMaxCallsPerDay] = useState(0);
  const [noticeHours, setNoticeHours] = useState(0);
  const [bookAheadDays, setBookAheadDays] = useState(0);
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [allowRescheduling, setAllowRescheduling] = useState(true);
  const [allowCancellations, setAllowCancellations] = useState(true);
  const [enableCallbackRequests, setEnableCallbackRequests] = useState(true);
  const [callbackResponseTime, setCallbackResponseTime] = useState(24);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '09:00', end: '17:00' },
    sunday: { enabled: false, start: '09:00', end: '17:00' },
  });

  // Load existing data from database on component mount
  useEffect(() => {
    const loadExistingData = async () => {
      if (userId && !dataLoaded) {
        const existingData = await getCalendarSetup(userId);
        if (existingData) {
          setCalendarName(existingData.calendar_name || "");
          setDescription(existingData.description || "");
          setCallDuration(existingData.call_duration || 60);
          setMaxCallsPerDay(existingData.max_calls_per_day || 0);
          setNoticeHours(existingData.notice_hours || 0);
          setBookAheadDays(existingData.book_ahead_days || 0);
          setAutoConfirm(existingData.auto_confirm ?? true);
          setAllowRescheduling(existingData.allow_rescheduling ?? true);
          setAllowCancellations(existingData.allow_cancellations ?? true);
          setEnableCallbackRequests(existingData.enable_callback_requests ?? true);
          setCallbackResponseTime(existingData.callback_response_time || 24);
          if (existingData.business_hours) {
            setBusinessHours(existingData.business_hours);
          }
          setDataLoaded(true);
        } else {
          // Set default values if no existing data
          setCalendarName('Solar consultations');
          setDescription('Schedule solar consultations and site visits with potential customers.');
          setMaxCallsPerDay(8);
          setNoticeHours(24);
          setBookAheadDays(24);
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

    if (hasTimeErrors) {
      toast.error('Please fix the time errors before continuing');
      return;
    }

    setIsLoading(true);
    
    try {
      const calendarSetupData = {
        firm_user_id: userId,
        agent_id: 'SOL',
        calendar_name: calendarName,
        description: description,
        call_duration: callDuration,
        max_calls_per_day: maxCallsPerDay,
        notice_hours: noticeHours,
        book_ahead_days: bookAheadDays,
        auto_confirm: autoConfirm,
        allow_rescheduling: allowRescheduling,
        allow_cancellations: allowCancellations,
        enable_callback_requests: enableCallbackRequests,
        callback_response_time: callbackResponseTime,
        google_calendar_connected: googleCalendarConnected,
        business_hours: businessHours,
        setup_status: 'completed'
      };

      const result = await saveCalendarSetup(calendarSetupData);
      
      if (result.success) {
        toast.success('Calendar setup saved successfully!');
        navigate('/notifications-preferences');
      } else {
        toast.error('Failed to save calendar setup');
      }
    } catch (error: any) {
      console.error('Calendar setup save error:', error);
      toast.error(error.message || 'Failed to save calendar setup');
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
          <UserAccountDropdown />
        </div>
        <button className="text-squidgy-purple font-bold text-sm px-5 py-3 rounded-button hover:bg-gray-50 transition-colors">
          Close (save draft)
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1 bg-grey-800">
        <div className="h-full bg-squidgy-gradient" style={{ width: '480px' }}></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Chat Interface */}
        <div className="p-5">
          <ChatInterface 
            agentName="Seth agent"
            agentDescription="Calendar Setup Assistant"
            context="calendar_setup"
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
                <Calendar className="w-6 h-6 text-squidgy-purple" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">4. Calendar setup</h2>
              <p className="text-text-secondary text-sm">
                Please review how appointments and calls will function in your calendar.
              </p>
            </div>

            {/* Calendar Name */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">Calendar name</label>
              <input
                type="text"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">Description</label>
              <textarea
                className="w-full h-20 p-3 border border-grey-500 rounded-md text-text-primary text-base resize-none focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Google Calendar Integration */}
            <div className="mb-6">
              <GoogleCalendarIntegration 
                onIntegrationChange={setGoogleCalendarConnected}
              />
            </div>

            {/* Call Duration and Max Calls */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Call duration</label>
                <div className="relative">
                  <select 
                    value={callDuration}
                    onChange={(e) => setCallDuration(parseInt(e.target.value))}
                    className="w-full p-3 pr-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent appearance-none"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="90">90 minutes</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Max calls per day</label>
                <div className="relative">
                  <select
                    value={maxCallsPerDay}
                    onChange={(e) => setMaxCallsPerDay(parseInt(e.target.value))}
                    className="w-full p-3 pr-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent appearance-none"
                  >
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                    <option value="12">12</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Rules Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Rules</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Notice (hours)</label>
                  <input
                    type="number"
                    value={noticeHours}
                    onChange={(e) => setNoticeHours(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-text-primary mb-2">Book ahead (days)</label>
                  <input
                    type="number"
                    value={bookAheadDays}
                    onChange={(e) => setBookAheadDays(parseInt(e.target.value) || 0)}
                    className="w-full p-3 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoConfirm}
                    onChange={(e) => setAutoConfirm(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Auto-confirm appointments</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowRescheduling}
                    onChange={(e) => setAllowRescheduling(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Allow rescheduling</span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowCancellations}
                    onChange={(e) => setAllowCancellations(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Allow cancellations</span>
                </label>
              </div>
            </div>

            {/* Callback Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Callback Options</h3>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableCallbackRequests}
                    onChange={(e) => setEnableCallbackRequests(e.target.checked)}
                    className="w-5 h-5 text-squidgy-purple border-gray-300 rounded focus:ring-squidgy-purple"
                  />
                  <span className="text-text-primary">Enable callback requests</span>
                </label>
                
                {enableCallbackRequests && (
                  <div className="ml-8">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-amber-800 font-medium mb-1">How callback requests work</p>
                          <p className="text-xs text-amber-700">
                            When customers request a callback, the AI will collect their details and preferences. 
                            The request will be passed to your team, but it's not 100% confirmed until manual follow-up.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-text-primary mb-2">
                        Target response time (hours)
                      </label>
                      <div className="relative">
                        <select
                          value={callbackResponseTime}
                          onChange={(e) => setCallbackResponseTime(parseInt(e.target.value))}
                          className="w-full p-3 pr-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent appearance-none"
                        >
                          <option value="2">2 hours</option>
                          <option value="4">4 hours</option>
                          <option value="8">8 hours</option>
                          <option value="24">24 hours</option>
                          <option value="48">48 hours</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      </div>
                      <p className="text-xs text-text-secondary mt-1">
                        This is the timeframe the AI will communicate to customers for callback expectations
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Business hours</h3>
              <BusinessHours 
                businessHours={businessHours} 
                setBusinessHours={setBusinessHours}
                onValidationChange={(isValid) => setHasTimeErrors(!isValid)}
              />
            </div>

            {/* Continue Button */}
            <button 
              onClick={handleContinue}
              disabled={isLoading || hasTimeErrors}
              className="w-full bg-squidgy-gradient text-white font-bold text-sm py-3 px-5 rounded-button hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title={hasTimeErrors ? 'Please fix time errors before continuing' : ''}
            >
              {isLoading ? 'Saving...' : hasTimeErrors ? 'Fix Time Errors to Continue' : 'Continue'}
              {!isLoading && !hasTimeErrors && (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 21 21">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.83333 10.1123H17.1667M17.1667 10.1123L12.1667 5.1123M17.1667 10.1123L12.1667 15.1123" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Setup Steps Sidebar */}
        <div className="hidden lg:block">
          <SetupStepsSidebar currentStep={4} />
        </div>
      </div>

      {/* Mobile Setup Steps Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="absolute right-0 top-0 h-full">
            <SetupStepsSidebar currentStep={4} />
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
