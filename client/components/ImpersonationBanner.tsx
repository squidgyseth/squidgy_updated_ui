import { AlertCircle, LogOut } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { toast } from 'sonner';

export default function ImpersonationBanner() {
  const { isImpersonating, returnToAdmin, profile } = useUser();

  const handleReturnToAdmin = async () => {
    try {
      toast.loading('Returning to admin account...');
      await returnToAdmin();
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || 'Failed to return to admin');
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">Admin Mode:</span>
              <span>
                You are currently viewing as{' '}
                <span className="font-bold">{profile?.full_name || profile?.email || 'User'}</span>
              </span>
            </div>
          </div>
          <button
            onClick={handleReturnToAdmin}
            className="flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg hover:bg-gray-100 transition-colors font-medium shadow-md"
          >
            <LogOut className="w-4 h-4" />
            Return to Admin
          </button>
        </div>
      </div>
    </div>
  );
}
