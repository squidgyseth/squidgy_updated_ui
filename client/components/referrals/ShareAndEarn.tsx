import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShareStats } from '@/types/referral.types';
import ReferralFlowLoader from '@/services/referralFlowLoader';
import ReferralService from '@/services/referralService';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';
import { getPlatformIcon, getPlatformColor, getPlatformName } from '@/utils/platformIcons';
import { toast } from 'sonner';

interface ShareAndEarnProps {
  referralCode: string;
  referralLink: string;
  onShare: (channel: string) => void;
  shareStats: ShareStats;
  onCodeUpdate?: (code: string, link: string) => void;
}

export function ShareAndEarn({ referralCode, referralLink, onShare, shareStats, onCodeUpdate }: ShareAndEarnProps) {
  const [sharingConfig, setSharingConfig] = useState<any>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [currentCode, setCurrentCode] = useState(referralCode);
  const [currentLink, setCurrentLink] = useState(referralLink);

  const { userId } = useUser();
  const referralLoader = ReferralFlowLoader.getInstance();
  const referralService = ReferralService.getInstance();

  // Default message template
  const defaultMessage = `Hey! I've been using Squidgy AI to automate my workflow and it's incredible! 🚀

It's like having an entire AI team working for you - from content creation to customer support, everything is automated.

Get 30 days free with my exclusive code: ${referralCode}
${referralLink}

Perfect for agencies, freelancers, and growing businesses. They're limiting access right now, but this code gets you in!

#SquidgyAI #AIAutomation #ProductivityHack`;

  useEffect(() => {
    setCurrentCode(referralCode);
    setCurrentLink(referralLink);
  }, [referralCode, referralLink]);

  useEffect(() => {
    if (currentCode) {
      const message = `Hey! I've been using Squidgy AI to automate my workflow and it's incredible! 🚀

It's like having an entire AI team working for you - from content creation to customer support, everything is automated.

Get 30 days free with my exclusive code: ${currentCode}
${currentLink}

Perfect for agencies, freelancers, and growing businesses. They're limiting access right now, but this code gets you in!

#SquidgyAI #AIAutomation #ProductivityHack`;
      setCustomMessage(message);
    }
  }, [currentCode, currentLink]);

  useEffect(() => {
    loadSharingConfig();
  }, []);

  // Auto-regenerate QR code when link changes (after code refresh)
  useEffect(() => {
    if (currentLink) {
      generateQRCode();
    }
  }, [currentLink]);

  const loadSharingConfig = async () => {
    try {
      const config = await referralLoader.getSharingConfig();
      setSharingConfig(config);
    } catch (error) {
      console.error('Error loading sharing config:', error);
    }
  };

  const generateQRCode = () => {
    // Generate QR code using CURRENT link (updates when code refreshes)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentLink)}`;
    setQrCodeUrl(qrUrl);
  };

  const validateAndRefreshCode = async (): Promise<{ code: string; link: string } | null> => {
    if (!userId) return null;

    try {
      // Check if current code is still active
      const { data: codeCheck, error: checkError } = await supabase
        .from('referral_codes')
        .select('is_active, used_at')
        .eq('code', currentCode)
        .maybeSingle();

      // If code is inactive, used, or doesn't exist, get a new one
      if (checkError || !codeCheck || !codeCheck.is_active || codeCheck.used_at) {
        toast.info('⚠️ Refreshing your referral code...');

        const newCodeData = await referralService.getUserReferralCode(userId);

        // Update local state
        setCurrentCode(newCodeData.code);
        setCurrentLink(newCodeData.link);

        // Notify parent component
        if (onCodeUpdate) {
          onCodeUpdate(newCodeData.code, newCodeData.link);
        }

        toast.success('✅ Code refreshed!');
        return newCodeData;
      }

      return { code: currentCode, link: currentLink };
    } catch (error) {
      console.error('Error validating code:', error);
      // On error, just return current code (fail gracefully)
      return { code: currentCode, link: currentLink };
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      // Validate code before copying
      const validCode = await validateAndRefreshCode();

      if (validCode && (type === 'Code' || type === 'Link')) {
        // If copying code or link, use the validated one
        const textToCopy = type === 'Code' ? validCode.code : validCode.link;
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // For messages, just copy as-is (message will have updated code from useEffect)
        await navigator.clipboard.writeText(text);
      }

      toast.success(`${type} copied to clipboard!`);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSocialShare = async (platform: string) => {
    // Use the custom message from the textarea
    const message = customMessage || defaultMessage;

    switch (platform) {
      case 'instagram':
        // Copy message and open Instagram web
        await copyToClipboard(message, 'Message copied! Paste it in Instagram');
        window.open('https://www.instagram.com/', '_blank');
        break;

      case 'linkedin':
        // LinkedIn sharing - copy message and open share dialog
        await copyToClipboard(message, 'Message copied! Paste it in LinkedIn');
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
        break;

      case 'facebook':
        // Facebook sharing - copy message and open simple share
        await copyToClipboard(message, 'Message copied! Paste it in Facebook');
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
        break;

      case 'whatsapp':
        // Try WhatsApp app first, fallback to web
        const whatsappAppUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
        const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        
        // Create a hidden iframe to test if WhatsApp app is available
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = whatsappAppUrl;
        document.body.appendChild(iframe);
        
        // Set a timer to check if app opened
        const appTimer = setTimeout(() => {
          // If we reach here, app likely didn't open, so use web
          document.body.removeChild(iframe);
          window.open(whatsappWebUrl, '_blank');
          toast.success('Opening WhatsApp Web...');
        }, 2000);
        
        // Check if user left the page (app opened)
        const handleVisibilityChange = () => {
          if (document.hidden) {
            // User likely switched to WhatsApp app
            clearTimeout(appTimer);
            document.body.removeChild(iframe);
            toast.success('Opening WhatsApp App...');
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Also clear timer if user comes back quickly (app didn't open)
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 3000);
        
        break;
    }

    onShare(platform);
  };

  const getTemplateForChannel = async (channel: string) => {
    if (!sharingConfig) return '';
    return await referralLoader.getSharingTemplate(channel, referralCode, referralLink);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-900">{shareStats.total_shares}</div>
            <div className="text-sm text-gray-600">Total Shares</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{shareStats.clicks}</div>
            <div className="text-sm text-gray-600">Link Clicks</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{shareStats.conversions}</div>
            <div className="text-sm text-gray-600">Conversions</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{shareStats.click_through_rate}%</div>
            <div className="text-sm text-gray-600">CTR</div>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{shareStats.conversion_rate}%</div>
            <div className="text-sm text-gray-600">Conv. Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Sharing Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Share Links */}
        <Card>
          <CardHeader>
            <CardTitle>📤 Quick Share</CardTitle>
            <CardDescription>
              Share your referral code instantly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Referral Code</label>
              <div className="flex gap-2">
                <Input 
                  value={referralCode} 
                  readOnly 
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(referralCode, 'Referral code')}
                >
                  📋
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Referral Link</label>
              <div className="flex gap-2">
                <Input 
                  value={referralLink} 
                  readOnly 
                  className="flex-1 text-sm"
                />
                <Button 
                  variant="outline" 
                  onClick={() => copyToClipboard(referralLink, 'Referral link')}
                >
                  📋
                </Button>
              </div>
            </div>


            {/* QR Code */}
            {qrCodeUrl && (
              <div className="text-center space-y-2">
                <label className="text-sm font-medium text-gray-700">QR Code</label>
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Referral QR Code" 
                    className="w-32 h-32 border rounded-lg"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Perfect for in-person sharing
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Custom Message */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>✍️ Custom Message</CardTitle>
            <CardDescription>
              Edit your referral message and share on platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Editable Message */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Your Referral Message</label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                onFocus={async () => {
                  // Validate code before allowing user to edit message
                  await validateAndRefreshCode();
                }}
                placeholder="Enter your custom referral message..."
                rows={8}
                className="resize-none"
              />
            </div>

            {/* Platform Sharing */}
            <div className="space-y-3">
              <h5 className="font-medium text-gray-900">Share on platforms:</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  className="flex items-center gap-2 text-white hover:text-white h-12"
                  style={{ backgroundColor: getPlatformColor('instagram'), borderColor: getPlatformColor('instagram') }}
                  onClick={() => handleSocialShare('instagram')}
                >
                  {getPlatformIcon('instagram', 'w-4 h-4')} Instagram
                </Button>
                <Button 
                  className="flex items-center gap-2 text-white hover:text-white h-12"
                  style={{ backgroundColor: getPlatformColor('linkedin'), borderColor: getPlatformColor('linkedin') }}
                  onClick={() => handleSocialShare('linkedin')}
                >
                  {getPlatformIcon('linkedin', 'w-4 h-4')} LinkedIn
                </Button>
                <Button 
                  className="flex items-center gap-2 text-white hover:text-white h-12"
                  style={{ backgroundColor: getPlatformColor('facebook'), borderColor: getPlatformColor('facebook') }}
                  onClick={() => handleSocialShare('facebook')}
                >
                  {getPlatformIcon('facebook', 'w-4 h-4')} Facebook
                </Button>
                <Button 
                  className="flex items-center gap-2 text-white hover:text-white h-12"
                  style={{ backgroundColor: getPlatformColor('whatsapp'), borderColor: getPlatformColor('whatsapp') }}
                  onClick={() => handleSocialShare('whatsapp')}
                >
                  {getPlatformIcon('whatsapp', 'w-4 h-4')} WhatsApp
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Performance by Channel */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Share Performance by Channel</CardTitle>
          <CardDescription>
            See which platforms work best for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(shareStats.shares_by_channel).map(([channel, shares]) => (
              <div key={channel} className="text-center p-4 border rounded-lg">
                <div className="flex justify-center mb-2">
                  {channel === 'email' ? (
                    <div className="text-2xl">📧</div>
                  ) : channel === 'instagram' ? (
                    <div style={{ color: getPlatformColor('instagram') }}>
                      {getPlatformIcon('instagram', 'w-6 h-6')}
                    </div>
                  ) : channel === 'linkedin' ? (
                    <div style={{ color: getPlatformColor('linkedin') }}>
                      {getPlatformIcon('linkedin', 'w-6 h-6')}
                    </div>
                  ) : channel === 'whatsapp' ? (
                    <div style={{ color: getPlatformColor('whatsapp') }}>
                      {getPlatformIcon('whatsapp', 'w-6 h-6')}
                    </div>
                  ) : (
                    <div className="text-2xl">📱</div>
                  )}
                </div>
                <div className="font-semibold capitalize">{getPlatformName(channel)}</div>
                <div className="text-2xl font-bold text-purple-600">{shares}</div>
                <div className="text-xs text-gray-600">shares</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
