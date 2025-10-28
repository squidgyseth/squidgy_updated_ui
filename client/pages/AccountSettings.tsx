import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { profilesApi } from '../lib/supabase-api';
import { toast } from 'sonner';
import { SettingsLayout } from '../components/layout/SettingsLayout';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile, isReady, isAuthenticated } = useUser();
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.profile_avatar_url || '');
    }
  }, [profile]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login');
    }
  }, [isReady, isAuthenticated, navigate]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF, WEBP)' });
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({ type: 'error', text: 'Image file is too large (max 5MB)' });
      return;
    }
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    
    setAvatarFile(file);
    setMessage(null);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!profile) return null;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Check if Supabase is configured
      const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || 
                           !import.meta.env.VITE_SUPABASE_URL || 
                           import.meta.env.VITE_SUPABASE_URL === 'https://your-project.supabase.co';

      if (isDevelopment) {
        // Simulate upload progress for development
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // Return the current preview URL (base64) for development
        return avatarUrl;
      }

      // Production mode - use Supabase storage like old design
      const { supabase } = await import('../lib/supabase');
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id || profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload to profiles bucket (same as old design)
      const { data, error } = await supabase
        .storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) throw error;
      
      setUploadProgress(100);
      
      // Get public URL (same as old design)
      const { data: urlData } = supabase
        .storage
        .from('profiles')
        .getPublicUrl(filePath);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }
      
      return urlData.publicUrl;
      
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile || !user) return;
    
    setIsSaving(true);
    setMessage(null);
    
    try {
      let newAvatarUrl = avatarUrl;
      
      // Upload avatar if changed
      if (avatarFile) {
        try {
          const uploadedUrl = await uploadAvatar(avatarFile);
          if (uploadedUrl) {
            newAvatarUrl = uploadedUrl;
          }
        } catch (error: any) {
          throw new Error(`Avatar upload failed: ${error.message}`);
        }
      }
      
      // Always attempt Supabase update - remove development mode bypass
      const { supabase } = await import('../lib/supabase');
      
      const profileId = profile.user_id || profile.id || user?.id;
      
      console.log('Attempting Supabase update with profile:', {
        profile_id: profile.id,
        user_id: profile.user_id,
        full_name: fullName,
        profile_avatar_url: newAvatarUrl,
        profileId: profileId
      });
      
      if (!profileId) {
        throw new Error('No valid profile ID found. Cannot update profile.');
      }
      
      // Check if profile exists by id first
      const { data: existingProfile } = await profilesApi.getById(profileId);
        
      console.log('Existing profile check by id:', existingProfile);
      
      let updateResult;
      
      if (!existingProfile) {
        // Check if profile exists by email (to avoid duplicate email constraint)
        const { data: emailProfile } = await profilesApi.getByEmail(user?.email || profile?.email);
          
        console.log('Existing profile check by email:', emailProfile);
        
        if (emailProfile) {
          // Profile exists with this email, update it instead of creating new one
          console.log('Updating existing profile found by email:', emailProfile.id);
          updateResult = await profilesApi.updateById(emailProfile.id, {
            full_name: fullName,
            profile_avatar_url: newAvatarUrl,
            updated_at: new Date().toISOString()
          });
        } else {
          // Create new profile only if no profile exists with this email
          console.log('Creating new profile for user:', profileId);
          updateResult = await profilesApi.create({
            id: profileId,
            user_id: crypto.randomUUID(),
            email: user?.email || profile?.email,
            full_name: fullName,
            profile_avatar_url: newAvatarUrl,
            role: 'member',
            company_id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      } else {
        // Update existing profile using id column (same as old design)
        console.log('Updating existing profile for user:', profileId);
        updateResult = await profilesApi.updateById(profileId, {
          full_name: fullName,
          profile_avatar_url: newAvatarUrl,
          updated_at: new Date().toISOString()
        });
      }
        
      console.log('Supabase operation result:', updateResult);
      
      if (updateResult.error) {
        console.error('Supabase operation error:', updateResult.error);
        throw updateResult.error;
      }
      
      if (!updateResult.data || updateResult.data.length === 0) {
        throw new Error(`Failed to save profile for user ID: ${profileId}`);
      }
      
      console.log('Profile saved successfully in Supabase:', updateResult.data[0]);
      
      // Log the exact record that was updated for debugging
      console.log('Updated profile record details:', {
        id: updateResult.data[0].id,
        user_id: updateResult.data[0].user_id,
        email: updateResult.data[0].email,
        full_name: updateResult.data[0].full_name,
        profile_avatar_url: updateResult.data[0].profile_avatar_url
      });
      
      // Also verify the update by querying the database again
      const { data: verifyData } = await profilesApi.getById(profileId);
        
      console.log('Verification query result:', verifyData);
      
      // Refresh the profile in UserProvider to show updated data immediately
      if (refreshProfile) {
        await refreshProfile();
      }
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setAvatarFile(null);
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error updating profile. Please try again.' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <SettingsLayout title="Profile Settings">
      {/* Profile Photo Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-2xl font-bold">
                  {fullName ? fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-4 h-4 text-gray-600" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Photo</h3>
            <p className="text-sm text-gray-500 mb-4">This will be displayed on your profile</p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setAvatarUrl('');
                  setAvatarFile(null);
                  toast.success('Profile photo removed');
                }}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Change
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Profile Information</h3>
        
        <div className="space-y-6">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your full name"
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value="••••••••••"
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving || isUploading}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </SettingsLayout>
  );
}
