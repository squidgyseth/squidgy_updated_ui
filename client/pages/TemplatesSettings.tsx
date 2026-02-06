import React, { useState, useEffect } from 'react';
import { SettingsLayout } from '../components/layout/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, RefreshCw, Eye, X } from 'lucide-react';
import { useUser } from '../hooks/useUser';
import { profilesApi } from '../lib/supabase-api';
import { toast } from 'sonner';

interface TemplateLayer {
  name: string;
  type: string;
  description?: string;
  text?: string;
  fontFamily?: string;
  color?: string;
  imageUrl?: string;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  preview?: string;
  size: { width: number; height: number };
  layers: TemplateLayer[];
  isEnabled: boolean;
}

export default function TemplatesSettings() {
  const { user } = useUser();
  const [firmUserId, setFirmUserId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [togglingTemplateId, setTogglingTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Get user's business ID from business_settings table
  const getUserFirmId = async () => {
    if (!user?.email) return;
    try {
      const { data: profile } = await profilesApi.getByEmail(user.email);
      if (profile?.user_id) {
        // Fetch business_settings.id using user_id
        const { supabase } = await import('../lib/supabase');
        const { data: businessSettings } = await supabase
          .from('business_settings')
          .select('id')
          .eq('user_id', profile.user_id)
          .single();
        
        if (businessSettings?.id) {
          setFirmUserId(businessSettings.id);
          console.log('✅ Business ID from business_settings:', businessSettings.id);
        }
      }
    } catch (error) {
      console.error('Error getting business ID:', error);
    }
  };

  useEffect(() => {
    getUserFirmId();
  }, [user]);

  // Fetch templates from Templated.io
  const fetchTemplates = async () => {
    if (!firmUserId) return;
    
    setTemplatesLoading(true);
    setTemplatesError(null);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/templated/templates/${firmUserId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.templates || []);
        console.log(`✅ Loaded ${data.templates?.length || 0} templates (${data.enabledCount || 0} enabled)`);
      } else {
        throw new Error(data.message || 'Failed to fetch templates');
      }
    } catch (error: any) {
      console.error('❌ Error fetching templates:', error);
      setTemplatesError(error.message || 'Failed to load templates');
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Toggle template enabled/disabled for user
  const handleToggleTemplate = async (templateId: string, enable: boolean) => {
    if (!firmUserId) {
      toast.error('User ID not available');
      return;
    }
    
    setTogglingTemplateId(templateId);
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/templated/templates/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          user_id: firmUserId,
          enable: enable
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setTemplates(prev => prev.map(t => 
          t.id === templateId ? { ...t, isEnabled: enable } : t
        ));
        toast.success(`Template ${enable ? 'enabled' : 'disabled'}`);
      } else {
        throw new Error(data.message || 'Failed to update template');
      }
    } catch (error: any) {
      console.error('❌ Error toggling template:', error);
      toast.error(error.message || 'Failed to update template');
    } finally {
      setTogglingTemplateId(null);
    }
  };

  // Fetch templates when firmUserId is available
  useEffect(() => {
    if (firmUserId) {
      fetchTemplates();
    }
  }, [firmUserId]);

  const enabledCount = templates.filter(t => t.isEnabled).length;

  return (
    <SettingsLayout title="Templates">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-500 mt-1">
            Select which templates you want to use for your business. Enabled templates will be available for your social media posts.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-purple-50 rounded-lg px-4 py-2">
            <span className="text-sm text-purple-700">
              <strong>{enabledCount}</strong> enabled
            </span>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <span className="text-sm text-gray-600">
              <strong>{templates.length}</strong> total templates
            </span>
          </div>
        </div>

        {/* Loading State */}
        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading templates...</span>
          </div>
        ) : templatesError ? (
          /* Error State */
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <p className="text-red-600">{templatesError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchTemplates}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Templates Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div 
                key={template.id} 
                className={`relative rounded-xl overflow-hidden transition-all duration-300 shadow-sm hover:shadow-lg ${
                  template.isEnabled 
                    ? 'ring-3 ring-green-500 shadow-green-100' 
                    : 'ring-1 ring-gray-200 hover:ring-gray-300'
                }`}
              >
                {/* Enabled Banner */}
                {template.isEnabled && (
                  <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold py-1.5 px-3 flex items-center justify-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    ENABLED
                  </div>
                )}
                
                {/* Template Preview */}
                <div className={`relative h-44 bg-gray-100 ${template.isEnabled ? 'mt-0' : ''}`}>
                  {template.preview ? (
                    <img 
                      src={template.preview} 
                      alt={template.name}
                      className={`w-full h-full object-cover transition-all ${
                        template.isEnabled ? 'brightness-100' : 'brightness-95 hover:brightness-100'
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No preview
                    </div>
                  )}
                  
                  {/* Gradient overlay for enabled */}
                  {template.isEnabled && (
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent pointer-events-none" />
                  )}
                  
                  {/* Size badge */}
                  <Badge 
                    variant="secondary" 
                    className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium backdrop-blur-sm"
                  >
                    {template.size.width}×{template.size.height}
                  </Badge>
                  
                  {/* Preview button */}
                  {template.preview && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 left-2 bg-white/90 hover:bg-white text-gray-700 backdrop-blur-sm shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewTemplate(template);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                  )}
                </div>
                
                {/* Card Content */}
                <div className={`p-4 bg-white ${template.isEnabled ? 'border-t-2 border-green-500' : ''}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">
                          {template.description}
                        </p>
                      )}
                    </div>
                    {template.isEnabled && (
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">
                      {template.layers?.length || 0} layers
                    </span>
                    <Button
                      size="sm"
                      disabled={togglingTemplateId === template.id}
                      onClick={() => handleToggleTemplate(template.id, !template.isEnabled)}
                      className={
                        template.isEnabled 
                          ? "bg-white border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium" 
                          : "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-sm"
                      }
                    >
                      {togglingTemplateId === template.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : template.isEnabled ? (
                        <>
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Disable
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Enable
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Empty State */}
        {templates.length === 0 && !templatesLoading && !templatesError && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No templates available</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={fetchTemplates}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewTemplate(null)}
        >
          <div 
            className="relative bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col border border-white/20"
            style={{ maxHeight: 'calc(100vh - 2rem)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/20 bg-black/30 backdrop-blur-sm rounded-t-2xl flex-shrink-0">
              <div>
                <h3 className="font-semibold text-lg text-white">{previewTemplate.name}</h3>
                <p className="text-sm text-white/70">
                  {previewTemplate.size.width} × {previewTemplate.size.height} • {previewTemplate.layers?.length || 0} layers
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full w-8 h-8 p-0 text-white hover:bg-white/20"
                onClick={() => setPreviewTemplate(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Modal Content - Image Preview */}
            <div className="flex-1 overflow-auto p-6 bg-transparent flex items-center justify-center">
              {previewTemplate.preview ? (
                <img 
                  src={previewTemplate.preview} 
                  alt={previewTemplate.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
                />
              ) : (
                <div className="text-gray-400">No preview available</div>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-white/20 bg-black/30 backdrop-blur-sm rounded-b-2xl flex-shrink-0">
              <div className="flex items-center gap-2">
                {previewTemplate.isEnabled ? (
                  <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-white/10 text-white/70 border-white/20">
                    Not enabled
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-white/10 border border-white/30 text-white hover:bg-white/20 font-medium"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  disabled={togglingTemplateId === previewTemplate.id}
                  onClick={() => {
                    handleToggleTemplate(previewTemplate.id, !previewTemplate.isEnabled);
                    setPreviewTemplate(prev => prev ? { ...prev, isEnabled: !prev.isEnabled } : null);
                  }}
                  className={
                    previewTemplate.isEnabled 
                      ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-sm" 
                      : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-sm"
                  }
                >
                  {togglingTemplateId === previewTemplate.id ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : previewTemplate.isEnabled ? (
                    <XCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {previewTemplate.isEnabled ? 'Disable Template' : 'Enable Template'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SettingsLayout>
  );
}
