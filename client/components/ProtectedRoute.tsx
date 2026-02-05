import { Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isReady, user } = useUser();


  // IMPORTANT: Always wait for isReady before making any navigation decisions
  // This prevents redirecting to login while auth is still being checked
  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                       !import.meta.env.VITE_SUPABASE_URL || 
                       import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

  // Only redirect to login AFTER we're sure auth check is complete (isReady = true)
  if (!isAuthenticated && !isDevelopment) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content if authenticated or in development
  return <>{children}</>;
};
