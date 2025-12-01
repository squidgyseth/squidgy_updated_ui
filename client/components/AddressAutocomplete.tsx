import { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2 } from 'lucide-react';

// Updated to better match Nominatim's response structure
interface AddressResult {
  formatted_address: string;
  street_number?: string;
  street_name?: string;
  city?: string;
  suburb?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  country_code?: string;
  lat?: string;
  lon?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: AddressResult) => void;
  country?: string;
  placeholder?: string;
  disabled?: boolean;
}

// Helper to parse Nominatim response into our AddressResult format
const parseNominatimResponse = (nominatimResult: any): AddressResult => {
  const address = nominatimResult.address || {};
  return {
    formatted_address: nominatimResult.display_name,
    street_number: address.house_number,
    street_name: address.road,
    city: address.city || address.town || address.village || address.hamlet,
    suburb: address.suburb,
    state: address.state,
    postal_code: address.postcode,
    country: address.country,
    country_code: address.country_code,
    lat: nominatimResult.lat,
    lon: nominatimResult.lon,
  };
};

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  country = 'US', // Can be used to bias results
  placeholder = 'Start typing your address...',
  disabled = false
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch address suggestions from Nominatim API
  useEffect(() => {
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: value,
          format: 'json',
          addressdetails: '1',
          limit: '5',
        });

        // Add country code to bias results if available
        if (country) {
            params.append('countrycodes', country.toLowerCase());
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
          headers: {
            'User-Agent': 'SquidgyApp/1.0 (contact@example.com)', // Nominatim requires a user agent
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from Nominatim API');
        }

        const data = await response.json();
        const parsedSuggestions = data.map(parseNominatimResponse);
        
        setSuggestions(parsedSuggestions);
        setShowSuggestions(parsedSuggestions.length > 0);
      } catch (error) {
        console.error("Error fetching address suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce delay

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [value, country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setSelectedIndex(-1);
  };

  const handleAddressSelect = async (address: AddressResult) => {
    setShowSuggestions(false);
    setIsLoading(true);

    let finalAddress = address;

    // If we have lat/lon, perform a reverse geocode for more accurate details
    if (address.lat && address.lon) {
      try {
        const params = new URLSearchParams({
          lat: address.lat,
          lon: address.lon,
          format: 'json',
          addressdetails: '1',
        });

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
          headers: {
            'User-Agent': 'SquidgyApp/1.0 (contact@example.com)',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch from Nominatim reverse API');
        }

        const reverseData = await response.json();
        // Merge the more detailed address info from reverse geocoding
        finalAddress = parseNominatimResponse(reverseData);

      } catch (error) {
        console.error("Error during reverse geocoding:", error);
        // Fallback to the original suggestion if reverse geocoding fails
      }
    }

    const streetAddress = [finalAddress.street_number, finalAddress.street_name, finalAddress.suburb].filter(Boolean).join(' ');
    onChange(streetAddress || finalAddress.formatted_address);

    // Pass the full address data to parent for auto-filling other fields
    onAddressSelect(finalAddress);
    
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleAddressSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value || ''}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full p-3 pl-10 pr-10 border border-grey-500 rounded-md text-text-primary text-base focus:outline-none focus:ring-2 focus:ring-squidgy-purple focus:border-transparent"
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.lat + suggestion.lon + index} // More stable key
              onClick={() => handleAddressSelect(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-purple-50 text-squidgy-purple'
                  : 'hover:bg-gray-50 text-text-primary'
              }`}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 text-gray-400" />
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {suggestion.formatted_address}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {[suggestion.city, suggestion.state, suggestion.postal_code].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && value && value.length >= 3 && !isLoading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <div className="text-sm text-gray-500 text-center">
            No addresses found. Try typing more of your address.
          </div>
        </div>
      )}
    </div>
  );
}