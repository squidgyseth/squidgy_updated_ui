import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Palette, Plus, Trash2 } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
  background?: string;
  tags?: string[];
  isClone?: boolean;
  sourceTemplateId?: string;
}

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: Template) => void;
  userId?: string;
}

const TEMPLATED_API_KEY = import.meta.env.VITE_TEMPLATED_API_KEY || '';
const TEMPLATED_API_URL_LIST = 'https://api.templated.io/v1/templates';
const TEMPLATED_API_URL_SINGLE = 'https://api.templated.io/v1/template';

interface TemplateGroup {
  name: string;
  templates: Template[];
  thumbnail?: string;
}

export default function TemplateSelector({ isOpen, onClose, onSelectTemplate, userId }: TemplateSelectorProps) {
  const [genericTemplates, setGenericTemplates] = useState<Template[]>([]);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [genericPage, setGenericPage] = useState(0);
  const [userPage, setUserPage] = useState(0);
  const [genericTotalPages, setGenericTotalPages] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [cloning, setCloning] = useState(false);
  const [cloningTemplateId, setCloningTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchTemplates();
    }
  }, [isOpen, genericPage, userPage, userId]);

  // Listen for messages from Templated.io iframe
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Verify the message is from Templated.io
      if (event.origin !== 'https://app.templated.io') return;

      // Log all messages from Templated.io for debugging
      console.log('📨 Message from Templated.io:', event.data);
      console.log('📨 Event data type:', typeof event.data);
      console.log('📨 Event data action:', event.data?.action);

      // Parse the data if it's a string
      let parsedData = event.data;
      if (typeof event.data === 'string') {
        try {
          parsedData = JSON.parse(event.data);
          console.log('📨 Parsed data:', parsedData);
        } catch (e) {
          console.log('⚠️ Failed to parse event data');
        }
      }

      // Check if a template was created - Templated.io sends action:'create'
      const isTemplateCreated = parsedData?.action === 'create';
      
      console.log('🔍 Is template created?', isTemplateCreated);
      
      if (isTemplateCreated) {
        const templateId = parsedData?.templateId;
        
        console.log('🎨 Template ID received:', templateId);
        console.log('👤 User ID:', userId);
        
        if (templateId && userId) {
          console.log('✅ All conditions met - adding userId tag to template:', templateId);
          
          try {
            // Add userId tag to the newly created template immediately
            await addTagToTemplate(templateId, userId);
            console.log('✅ Successfully added userId tag to new template:', templateId);
            
            // Don't close the modal - let user continue editing
            // Just refresh templates in background so it appears in the list when they close
            setTimeout(() => {
              fetchTemplates();
            }, 1000);
          } catch (err) {
            console.error('❌ Error adding tag to new template:', err);
            setError('Failed to tag new template. Please add the tag manually.');
          }
        } else {
          console.log('⚠️ Missing required data:', {
            hasTemplateId: !!templateId,
            hasUserId: !!userId
          });
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [userId, isCreatingNew]);

  const fetchTemplates = async () => {
    console.log('🔄 fetchTemplates called with userId:', userId);
    setLoading(true);
    setError(null);

    try {
      // Fetch public templates with showeveryone tag
      console.log('📥 Fetching public templates...');
      const genericParams = new URLSearchParams({
        tags: 'showeveryone',
        limit: '25',
        page: genericPage.toString()
      });

      const genericResponse = await fetch(`${TEMPLATED_API_URL_LIST}?${genericParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TEMPLATED_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!genericResponse.ok) {
        throw new Error(`Failed to fetch generic templates: ${genericResponse.status}`);
      }

      const genericData = await genericResponse.json();
      const genericTemplatesList = Array.isArray(genericData) ? genericData : (genericData.templates || []);
      setGenericTemplates(genericTemplatesList);
      console.log('✅ Generic templates loaded:', genericTemplatesList.length);
      
      // Calculate total pages (assuming 25 per page)
      if (genericTemplatesList.length === 25) {
        setGenericTotalPages(genericPage + 2); // At least one more page
      } else {
        setGenericTotalPages(genericPage + 1);
      }

      // Fetch user's custom templates if userId is provided
      if (userId) {
        console.log('📥 Fetching user templates with userId:', userId);
        const userParams = new URLSearchParams({
          tags: userId,
          limit: '25',
          page: userPage.toString()
        });

        const userResponse = await fetch(`${TEMPLATED_API_URL_LIST}?${userParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${TEMPLATED_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const userTemplatesList = Array.isArray(userData) ? userData : (userData.templates || []);
          setUserTemplates(userTemplatesList);
          console.log('✅ User templates loaded:', userTemplatesList.length);
          
          // Calculate total pages
          if (userTemplatesList.length === 25) {
            setUserTotalPages(userPage + 2);
          } else {
            setUserTotalPages(userPage + 1);
          }
        } else {
          console.warn('⚠️ Failed to fetch user templates:', userResponse.status);
        }
      } else {
        console.log('⚠️ No userId provided, skipping user templates fetch');
        setUserTemplates([]); // Clear user templates if no userId
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredGenericTemplates = genericTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUserTemplates = userTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group templates by first word(s) of name
  const groupTemplates = (templates: Template[]): TemplateGroup[] => {
    const groups: { [key: string]: Template[] } = {};
    
    templates.forEach(template => {
      // Extract first word or first two words if it's a compound name
      const nameParts = template.name.split(/[-\s]/);
      let groupName = nameParts[0];
      
      // For compound names like "AiT Social", "Photo-Layer", etc.
      if (nameParts.length > 1 && nameParts[1] && nameParts[1].length > 2) {
        groupName = `${nameParts[0]} ${nameParts[1]}`;
      }
      
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(template);
    });
    
    // Convert to array and sort by group name
    return Object.entries(groups)
      .map(([name, templates]) => ({
        name,
        templates,
        thumbnail: templates[0]?.thumbnail
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const templateGroups = groupTemplates(filteredGenericTemplates);

  const hasTemplates = filteredGenericTemplates.length > 0 || filteredUserTemplates.length > 0;

  const duplicateTemplate = async (templateId: string): Promise<any> => {
    try {
      const response = await fetch(`${TEMPLATED_API_URL_SINGLE}/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEMPLATED_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to duplicate template: ${response.status} - ${errorText}`);
      }

      const duplicatedTemplate = await response.json();
      return duplicatedTemplate;
    } catch (err) {
      console.error('Error duplicating template:', err);
      throw err;
    }
  };

  const removeTagsFromTemplate = async (templateId: string, tags: string[]): Promise<void> => {
    try {
      const response = await fetch(`${TEMPLATED_API_URL_SINGLE}/${templateId}/tags`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEMPLATED_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tags)
      });

      if (!response.ok) {
        throw new Error(`Failed to remove tags from template: ${response.status}`);
      }
    } catch (err) {
      console.error('Error removing tags from template:', err);
      throw err;
    }
  };

  const addTagToTemplate = async (templateId: string, tag: string): Promise<void> => {
    try {
      const response = await fetch(`${TEMPLATED_API_URL_SINGLE}/${templateId}/tags`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TEMPLATED_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([tag])
      });

      if (!response.ok) {
        throw new Error(`Failed to add tag to template: ${response.status}`);
      }
    } catch (err) {
      console.error('Error adding tag to template:', err);
      throw err;
    }
  };

  const handleCustomiseClick = async (template: Template, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!userId) {
      setError('User ID is required to customise templates');
      return;
    }

    setCloning(true);
    setCloningTemplateId(template.id);
    
    try {
      // Step 1: Duplicate the template
      const duplicatedTemplate = await duplicateTemplate(template.id);
      
      if (!duplicatedTemplate || !duplicatedTemplate.id) {
        throw new Error('Failed to get duplicated template');
      }

      console.log('Duplicated template:', duplicatedTemplate);

      // Step 2: Remove original tags from the duplicated template
      if (template.tags && template.tags.length > 0) {
        await removeTagsFromTemplate(duplicatedTemplate.id, template.tags);
        console.log('Removed original tags from duplicated template');
      }

      // Step 3: Add userId as a tag to the duplicated template
      await addTagToTemplate(duplicatedTemplate.id, userId);

      console.log('Added userId tag to duplicated template:', duplicatedTemplate.id);

      // Step 4: Open the duplicated template in the editor immediately
      setEditingTemplateId(duplicatedTemplate.id);
      
      // Step 5: Notify parent component with the duplicated template
      if (onSelectTemplate) {
        onSelectTemplate({
          ...template,
          id: duplicatedTemplate.id,
          tags: [userId]
        });
      }

      // Refresh user templates in background to show the new duplicate
      setTimeout(() => {
        fetchTemplates();
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate template');
      console.error('Duplicate error:', err);
    } finally {
      setCloning(false);
      setCloningTemplateId(null);
    }
  };

  const handleEditClick = (template: Template, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingTemplateId(template.id);
  };

  const handleCreateNewTemplate = () => {
    setIsCreatingNew(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreatingNew(false);
    // Refresh templates when closing the editor
    fetchTemplates();
  };

  const handleCloseEditModal = () => {
    setEditingTemplateId(null);
    // Refresh templates when closing the editor
    fetchTemplates();
  };


  const deleteTemplate = async (templateId: string): Promise<void> => {
    try {
      const response = await fetch(`${TEMPLATED_API_URL_SINGLE}/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TEMPLATED_API_KEY}`
        }
      });

      if (!response.ok && response.status !== 204) {
        throw new Error(`Failed to delete template: ${response.status}`);
      }
    } catch (err) {
      console.error('Error deleting template:', err);
      throw err;
    }
  };

  const handleDeleteClick = async (template: Template, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Confirm deletion
    const confirmed = window.confirm(
      `Are you sure you want to delete "${template.name}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      await deleteTemplate(template.id);
      console.log('✅ Template deleted successfully:', template.id);
      
      // Refresh templates to remove the deleted one from the list
      fetchTemplates();
    } catch (err) {
      console.error('❌ Error deleting template:', err);
      setError('Failed to delete template. Please try again.');
    }
  };

  const handleTemplateClick = (template: Template, isGeneric: boolean) => {
    // For custom templates, just select them directly
    if (!isGeneric && onSelectTemplate) {
      onSelectTemplate(template);
    }
    // Generic templates don't do anything on click - only the Customise button works
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your social media templates</p>
      </div>

      {/* Create New Template Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={handleCreateNewTemplate}
          className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Template
        </button>
      </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Loading templates...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-2">Error: {error}</p>
                <button
                  onClick={fetchTemplates}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Public Templates Section - Grouped */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Public Templates
                  {filteredGenericTemplates.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({filteredGenericTemplates.length})</span>
                  )}
                </h2>
                {templateGroups.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No public templates found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {templateGroups.map((group) => (
                      <div
                        key={group.name}
                        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-200"
                      >
                        {/* Group Thumbnail */}
                        <div
                          className="w-full h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden"
                        >
                          {group.thumbnail ? (
                            <img
                              src={group.thumbnail}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center p-4">
                              <Palette className="w-12 h-12 mx-auto mb-2" />
                              <p className="text-xs">No preview</p>
                            </div>
                          )}
                          {/* Template count badge */}
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                            {group.templates.length} template{group.templates.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        {/* Group Info */}
                        <div className="p-4">
                          <h3 className="font-semibold text-base text-gray-900 mb-1">
                            {group.name}
                          </h3>
                          <p className="text-xs text-gray-500 mb-3">
                            {group.templates.length} layer{group.templates.length !== 1 ? 's' : ''}
                          </p>
                          
                          {/* Action Buttons */}
                          <button
                            onClick={() => setPreviewGroup(group)}
                            className="w-full px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-1"
                          >
                            <Palette className="w-4 h-4" />
                            Preview
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Templates Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Custom Templates
                  {filteredUserTemplates.length > 0 && (
                    <span className="ml-2 text-sm text-gray-500">({filteredUserTemplates.length})</span>
                  )}
                </h2>
                {filteredUserTemplates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No custom templates found</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredUserTemplates.map((template) => {
                      return (
                        <div
                          key={template.id}
                          onClick={() => handleTemplateClick(template, false)}
                          className="group cursor-pointer"
                        >
                          <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all mb-3">
                            <div
                              className="w-full h-48 bg-gray-100 flex items-center justify-center relative overflow-hidden"
                              style={{ backgroundColor: template.background || '#f3f4f6' }}
                            >
                              {template.thumbnail ? (
                                <img
                                  src={template.thumbnail}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-gray-400 text-center p-4">
                                  <p className="text-xs">No preview</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                              {template.name}
                            </h3>
                            <p className="text-xs text-gray-500">
                              {template.width} × {template.height} px
                            </p>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={(e) => handleEditClick(template, e)}
                                className="flex-1 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Customise
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(template, e)}
                                className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                                title="Delete template"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Pagination for Custom Templates */}
                {userTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      onClick={() => setUserPage(Math.max(0, userPage - 1))}
                      disabled={userPage === 0}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {userPage + 1} of {userTotalPages}
                    </span>
                    <button
                      onClick={() => setUserPage(userPage + 1)}
                      disabled={userPage >= userTotalPages - 1}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      {/* Templated.io Editor Modal - Edit Existing Template */}
      {editingTemplateId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseEditModal}>
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Edit Template</h2>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Templated.io Embed */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`https://app.templated.io/editor/${editingTemplateId}?embed=25a602ca-dfcd-4b2e-b602-a222ca6fc318`}
                width="100%"
                height="100%"
                allow="clipboard-write; clipboard-read"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Templated.io Editor"
              />
            </div>
          </div>
        </div>
      )}

      {/* Template Group Preview Modal */}
      {previewGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setPreviewGroup(null)}>
          <div className="bg-white rounded-lg shadow-xl w-[90vw] h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">{previewGroup.name}</h2>
                <span className="text-sm text-gray-500">({previewGroup.templates.length} templates)</span>
              </div>
              <button
                onClick={() => setPreviewGroup(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {previewGroup.templates.map((template) => {
                  const isCloning = cloning && cloningTemplateId === template.id;
                  return (
                    <div
                      key={template.id}
                      className={`group ${isCloning ? 'opacity-50' : ''}`}
                    >
                      <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all mb-3 border border-gray-200">
                        <div
                          className="w-full bg-gray-100 flex items-center justify-center relative overflow-hidden"
                          style={{ 
                            backgroundColor: template.background || '#f3f4f6',
                            aspectRatio: `${template.width} / ${template.height}`,
                            maxHeight: '500px'
                          }}
                        >
                          {template.thumbnail ? (
                            <img
                              src={template.thumbnail}
                              alt={template.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-gray-400 text-center p-4">
                              <p className="text-xs">No preview</p>
                            </div>
                          )}
                          {isCloning && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-900 truncate mb-1">
                          {template.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {template.width} × {template.height} px
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewGroup(null); // Close preview modal
                            handleCustomiseClick(template, e);
                          }}
                          disabled={cloning}
                          className="w-full px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCloning ? 'Customising...' : 'Customise'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templated.io Editor Modal - Create New Template */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleCloseCreateModal}>
          <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-800">Create New Template</h2>
              </div>
              <button
                onClick={handleCloseCreateModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Templated.io Embed - Blank Template */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src="https://app.templated.io/editor?embed=25a602ca-dfcd-4b2e-b602-a222ca6fc318"
                width="100%"
                height="100%"
                allow="clipboard-write; clipboard-read"
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Templated.io Editor"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
