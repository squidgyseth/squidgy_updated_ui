import React, { useState, useEffect } from 'react';
import { X, Search, Image as ImageIcon, Upload, Check } from 'lucide-react';
import { useUser } from '../../hooks/useUser';
import { toast } from 'sonner';
import { ghlMediaService } from '../../services/ghlMediaService';

interface MediaItem {
  id: string;
  url: string;
  name: string;
  thumbnail?: string;
  createdAt?: Date;
}

interface MediaLibraryProps {
  onSelectImage?: (image: MediaItem) => void;
  onClose?: () => void;
  multiSelect?: boolean;
}

export default function MediaLibrary({ onSelectImage, onClose, multiSelect = false }: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<'my-media' | 'search'>('my-media');
  const [searchQuery, setSearchQuery] = useState('');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<MediaItem[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchingUnsplash, setSearchingUnsplash] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const { userId } = useUser();

  // Load media from GHL API
  const fetchMedia = async () => {
    if (!userId) {
      setError('User ID not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const files = await ghlMediaService.fetchMedia(userId, 'social_media_scheduler');
      
      const mediaItems: MediaItem[] = files.map(file => ({
        id: file.id,
        url: file.url,
        name: file.name,
        thumbnail: file.thumbnailUrl,
        createdAt: new Date(file.createdAt)
      }));
      
      setMediaItems(mediaItems);
    } catch (err) {
      console.error('Error loading media:', err);
      setError(err instanceof Error ? err.message : 'Failed to load media');
      toast.error('Failed to load media from HighLevel');
      setMediaItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [userId]);

  const searchUnsplash = async () => {
    if (!unsplashQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    setSearchingUnsplash(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(unsplashQuery)}`,
        {
          headers: {
            'Authorization': 'Client-ID HLOAvAE2KAkwoqtnqCkQyVxnXWkWuDcTJf0azVXFURY'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search Unsplash');
      }

      const data = await response.json();
      const results: MediaItem[] = data.results.map((photo: any) => ({
        id: photo.id,
        url: photo.urls.regular,
        name: photo.alt_description || photo.description || 'Unsplash Image',
        thumbnail: photo.urls.thumb,
        createdAt: new Date(photo.created_at)
      }));

      setUnsplashResults(results);
      toast.success(`Found ${results.length} images`);
    } catch (err) {
      console.error('Error searching Unsplash:', err);
      toast.error('Failed to search Unsplash');
    } finally {
      setSearchingUnsplash(false);
    }
  };

  const uploadUnsplashImage = async (imageUrl: string, imageName: string) => {
    if (!userId) return;

    setUploading(true);
    try {
      // Download the image
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      const file = new File([blob], `${imageName}.jpg`, { type: 'image/jpeg' });

      // Upload to GHL
      await ghlMediaService.uploadFile(userId, file, 'social_media_scheduler');
      
      toast.success('Image uploaded to your media library!');
      
      // Switch to My Media tab and refresh
      setActiveTab('my-media');
      await fetchMedia();
    } catch (err) {
      console.error('Error uploading Unsplash image:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image or video file.');
      return;
    }

    // Validate file size
    const isVideo = file.type.startsWith('video/');
    const maxSize = isVideo ? 500 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      const maxSizeMB = isVideo ? 500 : 25;
      toast.error(`File size exceeds ${maxSizeMB}MB limit`);
      return;
    }

    setUploading(true);
    try {
      // Upload to GHL
      await ghlMediaService.uploadFile(userId, file, 'social_media_scheduler');
      
      toast.success('File uploaded successfully!');
      
      // Refresh media list
      await fetchMedia();
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const filteredItems = mediaItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageClick = (item: MediaItem) => {
    if (multiSelect) {
      const newSelected = new Set(selectedImages);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedImages(newSelected);
    } else {
      if (onSelectImage) {
        onSelectImage(item);
      }
      if (onClose) {
        onClose();
      }
    }
  };

  const handleInsertSelected = () => {
    if (multiSelect && onSelectImage) {
      selectedImages.forEach(id => {
        const item = mediaItems.find(m => m.id === id);
        if (item) {
          onSelectImage(item);
        }
      });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Media Library
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Section - My Media */}
          <div className="flex-1 flex flex-col border-r">
            {/* My Media Header */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">My Media</h3>
              <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Upload Button with Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUploadMenu(!showUploadMenu)}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
            
            {showUploadMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-10">
                <label className="block px-4 py-2 hover:bg-gray-100 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    From Device
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      handleFileUpload(e);
                      setShowUploadMenu(false);
                    }}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => {
                    const url = prompt('Enter image URL:');
                    if (url) {
                      // Handle URL upload
                      toast.info('URL upload coming soon!');
                    }
                    setShowUploadMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  From URL
                </button>
              </div>
            )}
          </div>
              </div>
            </div>

            {/* My Media Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <ImageIcon className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">No images found</p>
                  <p className="text-sm">Upload images or adjust your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleImageClick(item)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImages.has(item.id)
                          ? 'border-purple-500 shadow-lg'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        {selectedImages.has(item.id) && (
                          <div className="absolute top-2 right-2 bg-purple-500 rounded-full p-1">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Unsplash Search */}
          <div className="w-96 flex flex-col">
            {/* Unsplash Header */}
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Get New Stock Images</h3>
              <div className="flex flex-col gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Unsplash images..."
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUnsplash()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                </div>
                <button
                  onClick={searchUnsplash}
                  disabled={searchingUnsplash || !unsplashQuery.trim()}
                  className="w-full px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
                >
                  {searchingUnsplash ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Unsplash Results Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              {searchingUnsplash ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : unsplashResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <Search className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">Search for images</p>
                  <p className="text-sm text-center">Enter a search term above to find images from Unsplash</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {unsplashResults.map((item) => (
                    <div
                      key={item.id}
                      className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-300 transition-all"
                    >
                      <div className="aspect-square bg-gray-100">
                        <img
                          src={item.thumbnail || item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            uploadUnsplashImage(item.url, item.name);
                          }}
                          className="opacity-0 group-hover:opacity-100 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-all"
                        >
                          Upload
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                        <p className="text-white text-xs font-medium truncate">
                          {item.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {selectedImages.size > 0 && (
              <span>{selectedImages.size} image{selectedImages.size !== 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            {multiSelect && selectedImages.size > 0 && (
              <button
                onClick={handleInsertSelected}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
              >
                Insert Selected
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
