/**
 * Content Repurposer Parser Service
 * Directly parses content repurposer JSON responses and extracts individual posts
 * No webhook needed - processes the JSON immediately upon receipt
 */

interface SocialMediaPost {
  platform: string;
  content: string;
  image_prompt?: string;
  hashtags?: string[];
}

interface ParsedContentResult {
  posts: SocialMediaPost[];
  generalAssets?: {
    quotes?: string[];
    tips?: string[];
    stats?: string[];
    faqs?: string[];
    callToActions?: string[];
  };
}

class ContentRepurposerParser {
  private static instance: ContentRepurposerParser;

  private constructor() {}

  static getInstance(): ContentRepurposerParser {
    if (!ContentRepurposerParser.instance) {
      ContentRepurposerParser.instance = new ContentRepurposerParser();
    }
    return ContentRepurposerParser.instance;
  }

  /**
   * Parse content repurposer JSON response and extract individual posts
   */
  parseContentResponse(responseContent: string): ParsedContentResult {
    try {
      let contentData: any;

      // Handle string responses
      if (typeof responseContent === 'string') {
        // Handle error structure with raw JSON content
        try {
          const parsed = JSON.parse(responseContent);
          if (parsed && parsed.error && parsed.raw) {
            // Extract JSON from markdown code blocks
            const rawContent = parsed.raw.replace(/```json\n|\n```/g, '');
            contentData = JSON.parse(rawContent);
          } else {
            contentData = parsed;
          }
        } catch {
          console.error('[ContentRepurposerParser] Failed to parse JSON content');
          return { posts: [] };
        }
      } else {
        contentData = responseContent;
      }

      const posts: SocialMediaPost[] = [];
      let generalAssets: any = {};

      // Extract posts from new platform-based format
      if (contentData.LinkedIn || contentData.InstagramFacebook || contentData.TikTokReels) {
        this.extractPostsFromNewFormat(contentData, posts);
      }

      // Extract general assets
      if (contentData.GeneralAssets) {
        generalAssets = this.parseGeneralAssets(contentData.GeneralAssets);
      }

      // Handle legacy format fallback
      if (posts.length === 0) {
        // Check for array format
        if (Array.isArray(contentData)) {
          contentData.forEach((item: any) => {
            if (item.ContentRepurposerPosts) {
              this.extractPostsFromLegacyFormat(item.ContentRepurposerPosts, posts);
            }
          });
        } 
        // Handle object format
        else if (contentData.ContentRepurposerPosts) {
          this.extractPostsFromLegacyFormat(contentData.ContentRepurposerPosts, posts);
        }
      }

      return { posts, generalAssets };
    } catch (error) {
      console.error('[ContentRepurposerParser] Error parsing content:', error);
      return { posts: [] };
    }
  }

  /**
   * Extract posts from new platform-based format
   * Format: { LinkedIn: { Post1: { Caption: "...", ImagePrompt: "..." } }, ... }
   */
  private extractPostsFromNewFormat(contentData: any, posts: SocialMediaPost[]): void {
    // Process LinkedIn posts
    if (contentData.LinkedIn) {
      Object.entries(contentData.LinkedIn).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Caption || postData.Script)) {
          posts.push({
            platform: 'LinkedIn',
            content: postData.Caption || postData.Script || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }

    // Process Instagram/Facebook posts
    if (contentData.InstagramFacebook) {
      Object.entries(contentData.InstagramFacebook).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Caption || postData.Script)) {
          posts.push({
            platform: 'Instagram',
            content: postData.Caption || postData.Script || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }

    // Process TikTok/Reels posts
    if (contentData.TikTokReels) {
      Object.entries(contentData.TikTokReels).forEach(([postKey, postData]: [string, any]) => {
        if (postData && (postData.Script || postData.Idea)) {
          posts.push({
            platform: 'TikTok',
            content: postData.Script || postData.Idea || '',
            image_prompt: postData.ImagePrompt || ''
          });
        }
      });
    }
  }

  /**
   * Extract posts from legacy ContentRepurposerPosts format
   */
  private extractPostsFromLegacyFormat(contentRepurposerPosts: any, posts: SocialMediaPost[]): void {
    // LinkedIn Posts
    if (contentRepurposerPosts.LinkedInPost1) {
      posts.push({
        platform: 'LinkedIn',
        content: contentRepurposerPosts.LinkedInPost1,
        image_prompt: contentRepurposerPosts.LinkedInImagePrompt1 || ''
      });
    }
    if (contentRepurposerPosts.LinkedInPost2) {
      posts.push({
        platform: 'LinkedIn',
        content: contentRepurposerPosts.LinkedInPost2,
        image_prompt: contentRepurposerPosts.LinkedInImagePrompt2 || ''
      });
    }

    // Instagram/Facebook Posts
    if (contentRepurposerPosts.InstagramFacebookPost1) {
      posts.push({
        platform: 'Instagram',
        content: contentRepurposerPosts.InstagramFacebookPost1,
        image_prompt: contentRepurposerPosts.InstagramFacebookImagePrompt1 || '',
        hashtags: contentRepurposerPosts.InstagramFacebookHashtags1 || []
      });
    }
    if (contentRepurposerPosts.InstagramFacebookPost2) {
      posts.push({
        platform: 'Instagram',
        content: contentRepurposerPosts.InstagramFacebookPost2,
        image_prompt: contentRepurposerPosts.InstagramFacebookImagePrompt2 || '',
        hashtags: contentRepurposerPosts.InstagramFacebookHashtags2 || []
      });
    }

    // TikTok/Reels Posts
    if (contentRepurposerPosts.TikTokReelsPost1) {
      posts.push({
        platform: 'TikTok',
        content: contentRepurposerPosts.TikTokReelsPost1,
        image_prompt: contentRepurposerPosts.TikTokReelsImagePrompt1 || '',
        hashtags: contentRepurposerPosts.TikTokReelsHashtags1 || []
      });
    }
    if (contentRepurposerPosts.TikTokReelsPost2) {
      posts.push({
        platform: 'TikTok',
        content: contentRepurposerPosts.TikTokReelsPost2,
        image_prompt: contentRepurposerPosts.TikTokReelsImagePrompt2 || '',
        hashtags: contentRepurposerPosts.TikTokReelsHashtags2 || []
      });
    }
  }

  /**
   * Parse GeneralAssets section
   */
  private parseGeneralAssets(generalAssets: any): any {
    const assets: any = {};

    // Parse pipe-separated strings into arrays
    if (generalAssets.Quotes && typeof generalAssets.Quotes === 'string') {
      assets.quotes = generalAssets.Quotes.split('|').map((q: string) => q.trim()).filter((q: string) => q);
    }

    if (generalAssets.Tips && typeof generalAssets.Tips === 'string') {
      assets.tips = generalAssets.Tips.split('|').map((t: string) => t.trim()).filter((t: string) => t);
    }

    if (generalAssets.Stats && typeof generalAssets.Stats === 'string') {
      assets.stats = generalAssets.Stats.split('|').map((s: string) => s.trim()).filter((s: string) => s);
    }

    if (generalAssets.FAQs && typeof generalAssets.FAQs === 'string') {
      assets.faqs = generalAssets.FAQs.split('|').map((f: string) => f.trim()).filter((f: string) => f);
    }

    if (generalAssets.CallToActions && typeof generalAssets.CallToActions === 'string') {
      assets.callToActions = generalAssets.CallToActions.split('|').map((c: string) => c.trim()).filter((c: string) => c);
    }

    return assets;
  }

  /**
   * Create image records for database insertion
   */
  createImageRecords(posts: SocialMediaPost[], historyRecord: any, generalAssets?: any): any[] {
    const records: any[] = [];
    
    // Add social media posts
    posts.forEach((post, index) => {
      records.push({
        user_id: historyRecord.user_id,
        agent_id: 'content_repurposer',
        platform: post.platform.toLowerCase(), // Use lowercase for database
        post_id: `${historyRecord.session_id}_${post.platform.toLowerCase()}_${index + 1}`,
        content: post.content,
        image_url: null, // Will be generated on-demand
        prompt: post.image_prompt || '',
        generation_type: 'direct_parse',
        session_id: historyRecord.session_id,
        history_content_repurposer_id: historyRecord.id,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        in_use: true
      });
    });
    
    // Add GeneralAssets (Additional Assets)
    if (generalAssets) {
      let assetIndex = 1;
      
      // Add quotes
      if (generalAssets.quotes?.length) {
        generalAssets.quotes.forEach((quote: string) => {
          records.push({
            user_id: historyRecord.user_id,
            agent_id: 'content_repurposer',
            platform: 'general', // Use 'general' for additional assets
            post_id: `${historyRecord.session_id}_general_quote_${assetIndex}`,
            content: quote,
            image_url: null,
            prompt: '',
            generation_type: 'direct_parse',
            session_id: historyRecord.session_id,
            history_content_repurposer_id: historyRecord.id,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            in_use: true
          });
          assetIndex++;
        });
      }
      
      // Add tips
      if (generalAssets.tips?.length) {
        generalAssets.tips.forEach((tip: string) => {
          records.push({
            user_id: historyRecord.user_id,
            agent_id: 'content_repurposer',
            platform: 'general',
            post_id: `${historyRecord.session_id}_general_tip_${assetIndex}`,
            content: tip,
            image_url: null,
            prompt: '',
            generation_type: 'direct_parse',
            session_id: historyRecord.session_id,
            history_content_repurposer_id: historyRecord.id,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            in_use: true
          });
          assetIndex++;
        });
      }
      
      // Add stats
      if (generalAssets.stats?.length) {
        generalAssets.stats.forEach((stat: string) => {
          records.push({
            user_id: historyRecord.user_id,
            agent_id: 'content_repurposer',
            platform: 'general',
            post_id: `${historyRecord.session_id}_general_stat_${assetIndex}`,
            content: stat,
            image_url: null,
            prompt: '',
            generation_type: 'direct_parse',
            session_id: historyRecord.session_id,
            history_content_repurposer_id: historyRecord.id,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            in_use: true
          });
          assetIndex++;
        });
      }
      
      // Add FAQs
      if (generalAssets.faqs?.length) {
        generalAssets.faqs.forEach((faq: string) => {
          records.push({
            user_id: historyRecord.user_id,
            agent_id: 'content_repurposer',
            platform: 'general',
            post_id: `${historyRecord.session_id}_general_faq_${assetIndex}`,
            content: faq,
            image_url: null,
            prompt: '',
            generation_type: 'direct_parse',
            session_id: historyRecord.session_id,
            history_content_repurposer_id: historyRecord.id,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            in_use: true
          });
          assetIndex++;
        });
      }
      
      // Add call to actions
      if (generalAssets.callToActions?.length) {
        generalAssets.callToActions.forEach((cta: string) => {
          records.push({
            user_id: historyRecord.user_id,
            agent_id: 'content_repurposer',
            platform: 'general',
            post_id: `${historyRecord.session_id}_general_cta_${assetIndex}`,
            content: cta,
            image_url: null,
            prompt: '',
            generation_type: 'direct_parse',
            session_id: historyRecord.session_id,
            history_content_repurposer_id: historyRecord.id,
            created_date: new Date().toISOString(),
            updated_date: new Date().toISOString(),
            in_use: true
          });
          assetIndex++;
        });
      }
    }
    
    return records;
  }
}

export default ContentRepurposerParser.getInstance();