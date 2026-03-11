import { Navigate } from 'react-router-dom';
import { useUser } from '../hooks/useUser';

export const RootRedirect = () => {
  const { isAuthenticated, isReady } = useUser();

  // Wait for auth check to complete
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

  // Redirect based on authentication status
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};
