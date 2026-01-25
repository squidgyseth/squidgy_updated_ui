import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown, LayoutDashboard, Building2 } from "lucide-react";
import { useUser } from "../hooks/useUser";
import { useNavigate } from "react-router-dom";
import { createProxyUrl } from "../utils/urlMasking";

export function UserAccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, profile, clearUser, isAuthenticated, isReady } = useUser();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Debug logging
  console.log('UserAccountDropdown - Auth status:', { isAuthenticated, user, profile, isReady });

  // Show loading state while auth is initializing
  if (!isReady) {
    return (
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleAccountSettings = () => {
    setIsOpen(false);
    navigate('/account-settings');
  };

  const handleBusinessSettings = () => {
    setIsOpen(false);
    navigate('/business-settings');
  };

  const handleDashboard = () => {
    setIsOpen(false);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await clearUser();
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";
  const displayEmail = user?.email || "user@example.com";
  const avatarUrl = profile?.profile_avatar_url ? createProxyUrl(profile.profile_avatar_url, 'avatar') : undefined;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Account Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Account menu"
      >
        <div className="w-8 h-8 bg-squidgy-gradient rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* User Info Section */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to gradient with icon if image fails to load
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).classList.remove('hidden');
                      }
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-squidgy-gradient flex items-center justify-center ${avatarUrl ? 'hidden' : ''}`}>
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {displayName}
                </p>
                <p className="text-xs text-text-secondary truncate">
                  {displayEmail}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              onClick={handleDashboard}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-gray-500" />
              Go to Dashboard
            </button>

            <button
              onClick={handleAccountSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 text-gray-500" />
              Account Settings
            </button>

            <button
              onClick={handleBusinessSettings}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-primary hover:bg-gray-50 transition-colors"
            >
              <Building2 className="w-4 h-4 text-gray-500" />
              Business Settings
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
