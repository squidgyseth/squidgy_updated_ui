import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, ArrowRight, Settings, Home, Loader2 } from 'lucide-react';

const SocialPostAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);

  const status = searchParams.get('status');
  const message = searchParams.get('message');
  const postId = searchParams.get('post_id');

  // Check if we're in processing mode
  useEffect(() => {
    if (status === 'processing') {
      setIsProcessing(true);
    }
  }, [status]);

  useEffect(() => {
    // Auto-redirect countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const getMessageContent = () => {
    if (status === 'success') {
      return {
        icon: <CheckCircle className="w-20 h-20 text-green-500" />,
        title: 'Post Postponed Successfully!',
        description: 'Your social media post has been moved to drafts and will not be published at the originally scheduled time.',
        details: postId ? `Post ID: ${postId}` : null,
        iconBg: 'bg-green-100',
      };
    }

    // Error messages
    const errorMessages: Record<string, { title: string; description: string; action?: string }> = {
      account_not_found: {
        title: 'Account Not Found',
        description: 'Your social media account could not be found. Please ensure your accounts are properly connected.',
        action: 'Go to Settings',
      },
      incomplete_credentials: {
        title: 'Incomplete Credentials',
        description: 'Your social media account credentials are incomplete. Please reconnect your accounts.',
        action: 'Go to Settings',
      },
      post_not_found: {
        title: 'Post Not Found',
        description: 'The post could not be found or doesn\'t belong to your account. It may have been deleted or moved.',
      },
      authentication_failed: {
        title: 'Authentication Failed',
        description: 'Your access token may have expired. Please reconnect your social media accounts.',
        action: 'Go to Settings',
      },
      post_deleted: {
        title: 'Post Not Found',
        description: 'The post may have already been deleted or published.',
      },
      already_published: {
        title: 'Already Published',
        description: 'This post has already been published to social media and cannot be postponed.',
      },
      no_accounts: {
        title: 'No Accounts Found',
        description: 'No social media accounts were found for this post.',
        action: 'Go to Settings',
      },
      delete_failed: {
        title: 'Delete Failed',
        description: 'We were unable to delete the post. Please try again or contact support.',
      },
      recreate_failed: {
        title: 'Operation Failed',
        description: 'The post was deleted but could not be recreated. Please check your drafts or contact support.',
      },
      unexpected_error: {
        title: 'Unexpected Error',
        description: 'An unexpected error occurred. Please try again or contact support if the issue persists.',
      },
    };

    const errorContent = errorMessages[message || 'unexpected_error'] || errorMessages.unexpected_error;

    return {
      icon: <XCircle className="w-20 h-20 text-red-500" />,
      title: errorContent.title,
      description: errorContent.description,
      action: errorContent.action,
      iconBg: 'bg-red-100',
    };
  };

  const content = getMessageContent();

  const handleActionClick = () => {
    if (content.action === 'Go to Settings') {
      navigate('/settings/integrations');
    } else {
      navigate('/');
    }
  };

  // Show processing state
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
          <div className="bg-purple-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Processing Your Request
          </h1>
          <p className="text-gray-600 text-center mb-6 leading-relaxed">
            We're postponing your social media post. This will only take a moment...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        {/* Icon */}
        <div className={`${content.iconBg} rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 animate-scaleIn`}>
          {content.icon}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
          {content.title}
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6 leading-relaxed">
          {content.description}
        </p>

        {/* Details */}
        {content.details && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 text-center font-medium">
              {content.details}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {content.action && (
            <button
              onClick={handleActionClick}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Settings size={20} />
              {content.action}
            </button>
          )}
          
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Home size={20} />
            Go to Dashboard
          </button>
        </div>

        {/* Auto-redirect notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Redirecting to dashboard in {countdown} seconds...
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default SocialPostAction;
