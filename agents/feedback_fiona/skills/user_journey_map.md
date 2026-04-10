# User Journey Map | Squidgy Platform

Complete reference guide for what regular users see and can access after logging into the Squidgy platform. Use this to understand user context when collecting feedback.

=======================================================================
## HOW TO USE THIS SKILL

**CRITICAL:** This skill must be consulted **during every feedback collection** to:

1. **Identify the exact location** of the bug/issue/feature request
2. **Standardize terminology** across all feedback submissions
3. **Ask clarifying questions** to pinpoint the problem area
4. **Ensure consistent categorization** in the `feature_area` and `category` fields

### When User Reports a Bug or Suggestion

**ALWAYS ask these clarifying questions using this map:**

1. **"Which page were you on?"** 
   - Match their answer to pages in this map (Dashboard, Chat, Leads, Settings, etc.)
   - Use the exact page names from this document

2. **"What were you trying to do?"**
   - Match to workflows described in this map
   - Use standardized action descriptions

3. **"Which feature/section specifically?"**
   - For Settings: Which settings page? (Account, Business, Integrations, etc.)
   - For Chat: Which AI Mate were you talking to?
   - For Content: Newsletter or Social Post?

4. **"Can you describe the exact steps?"**
   - Use page names and feature names from this map
   - Record using consistent terminology

### Example Clarification Flow

**User says:** "The social media thing isn't working"

**You ask (using this map):**
- "Were you in the Chat interface talking to the Social Media Planner, or were you on the Historical Social Posts page?"
- "Were you trying to create a new post, schedule an existing post, or edit a draft?"
- "Which platform were you posting to? (Facebook, Instagram, LinkedIn)"

**Result:** Standardized feedback with clear location and context

### Standardized Field Values

Use this map to populate these fields consistently:

- **`category`**: `agent_behaviour | ui_ux | integrations | billing | performance | other`
- **`feature_area`**: Use exact page/feature names from this map:
  - `dashboard | chat_interface | leads_page | referrals_page`
  - `account_settings | business_settings | team_settings | integrations_settings | billing_settings`
  - `social_media_planner | newsletter_creator | personal_assistant | content_repurposer`
  - `historical_newsletters | historical_social_posts | newsletter_editor`
  - `mobile_experience`

=======================================================================
## NAVIGATION STRUCTURE

### Left Sidebar Navigation (Always Visible)
Users see a fixed left sidebar with icons for:
- **Home/Dashboard** — Main overview page
- **Chat** — Access to AI Mates (assistants)
- **Leads** — Lead management
- **Referrals** — Referral program
- **Settings** — Account and business settings
- **Logout** — Sign out

### Top Navigation
- **Company branding/logo** (customizable)
- **Notification bell** — Platform notifications
- **User account dropdown** — Profile and quick settings

=======================================================================
## POST-LOGIN USER JOURNEY

### 1. INITIAL LOGIN REDIRECT
After successful login, users are redirected to:
- **Dashboard** (`/dashboard`) — Main platform entry point
- **Waitlist users:** Waitlist welcome page (`/waitlist-welcome`)

=======================================================================
## MAIN PAGES (REGULAR USERS)

### DASHBOARD (`/dashboard`)
**What users see:**
- Welcome message with user name
- Quick stats overview (leads, scheduled content, recent activity)
- Active AI Mates cards with quick access
- Recent conversations preview
- Upcoming scheduled content (newsletters, social posts)
- Quick action buttons (Start new chat, Create content, View leads)
- Setup progress indicator (if onboarding incomplete)

**Features:**
- Click on AI Mate cards to start conversations
- View recent activity feed
- Access quick actions
- See platform usage stats

---

### CHAT INTERFACE (`/chat` or `/chat/:agentId`)
**What users see:**
- **Left panel:** List of available AI Mates (assistants) organized by category
  - Personal Assistant (default)
  - Content Repurposer
  - Social Media Planner
  - Newsletter Creator
  - Lead Manager
  - Business Advisor
  - Custom agents (if created)
- **Center panel:** Active conversation with selected AI Mate
  - Message history
  - Input box with file upload, voice input
  - Interactive buttons for quick actions
  - Content previews (social posts, newsletters)
- **Right panel (optional):** Agent details, previous sessions, scheduled content

**Features:**
- Send text messages to AI Mates
- Upload files (images, videos, PDFs, documents)
- Voice input
- View and edit generated content
- Schedule social media posts
- Schedule newsletters
- Access previous conversations
- Switch between different AI Mates
- Group chat with multiple agents

**Sub-routes:**
- `/chat/personal_assistant` — Default AI Mate
- `/chat/:agentId` — Specific AI Mate conversation
- `/chat/group/:groupId` — Group chat with multiple agents

---

### LEADS PAGE (`/leads`)
**What users see:**
- Table/list of all captured leads
- Lead details (name, email, phone, source, date)
- Lead status indicators (new, contacted, qualified, converted)
- Search and filter options
- Lead activity timeline

**Features:**
- View lead details
- Update lead status
- Add notes to leads
- Export leads
- Filter by date, source, status
- Search leads

---

### REFERRALS PAGE (`/referrals`)
**What users see:**
- Referral program overview
- Personal referral link
- Referral stats (invites sent, signups, rewards earned)
- Referral leaderboard
- Reward tiers and benefits
- Share buttons (email, social media)

**Features:**
- Copy referral link
- Share via email or social media
- Track referral performance
- View rewards earned
- See leaderboard rankings

---

### SETTINGS PAGES

#### Account Settings (`/account-settings`)
**What users see:**
- Profile information (name, email, phone)
- Password change form
- Email preferences
- Account status
- Subscription details

**Features:**
- Update profile information
- Change password
- Manage email preferences
- View account status

#### Business Settings (`/business-settings`)
**What users see:**
- Business name and details
- Business type/industry
- Business description
- Contact information
- Business hours
- Service areas

**Features:**
- Update business information
- Configure business details
- Set business hours
- Define service areas

#### Team Settings (`/team-settings`)
**What users see:**
- Team members list
- Roles and permissions
- Invite team members form
- Team activity log

**Features:**
- Add team members
- Assign roles
- Manage permissions
- Remove team members
- View team activity

#### Personalization Settings (`/personalisation-settings`)
**What users see:**
- Brand voice settings
- Tone preferences
- Communication style
- Custom instructions for AI Mates
- Content preferences

**Features:**
- Customize AI Mate behavior
- Set brand voice
- Configure tone preferences
- Add custom instructions

#### Integrations Settings (`/integrations-settings`)
**What users see:**
- Available integrations list:
  - GoHighLevel (GHL)
  - Facebook/Meta
  - Google Calendar
  - Email providers
  - Other third-party tools
- Connection status for each integration
- Setup instructions
- Sync settings

**Features:**
- Connect/disconnect integrations
- Configure integration settings
- Test connections
- View sync status
- Manage API keys

#### Templates Settings (`/templates-settings`)
**What users see:**
- Saved content templates
- Template categories (social posts, newsletters, emails)
- Template preview
- Create new template button

**Features:**
- Create custom templates
- Edit existing templates
- Delete templates
- Use templates in content creation

#### Billing Settings (`/billing-settings`)
**What users see:**
- Current subscription plan
- Usage analytics (messages, content created, API calls)
- Monthly usage limits
- Billing history
- Payment method
- Upgrade/downgrade options
- Invoice downloads

**Features:**
- View usage stats
- Change subscription plan
- Update payment method
- Download invoices
- View billing history
- Monitor usage limits

#### Notifications Preferences (`/notifications-preferences`)
**What users see:**
- Notification categories (email, in-app, SMS)
- Toggle switches for each notification type
- Frequency settings
- Quiet hours configuration

**Features:**
- Enable/disable notifications
- Set notification frequency
- Configure quiet hours
- Choose notification channels

---

### CONTENT MANAGEMENT PAGES

#### Historical Newsletters (`/historical-newsletters`)
**What users see:**
- List of all created newsletters
- Newsletter status (draft, scheduled, sent)
- Preview thumbnails
- Creation date
- Send date (if scheduled)
- Performance metrics (opens, clicks)

**Features:**
- View newsletter details
- Edit draft newsletters
- Reschedule newsletters
- View performance stats
- Delete newsletters

#### Historical Social Posts (`/historical-social-posts`)
**What users see:**
- Grid/list of all social media posts
- Post status (draft, scheduled, published)
- Platform indicators (Facebook, Instagram, LinkedIn)
- Preview images/text
- Scheduled date/time
- Performance metrics (likes, shares, comments)

**Features:**
- View post details
- Edit draft posts
- Reschedule posts
- Move to drafts
- Delete posts
- View performance stats

#### Newsletter Editor (`/newsletter-editor`)
**What users see:**
- Rich text editor
- Newsletter template selector
- Preview panel
- Subject line input
- Recipient list selector
- Schedule/send options

**Features:**
- Write newsletter content
- Format text (bold, italic, headings, lists)
- Add images and links
- Preview newsletter
- Schedule or send immediately
- Save as draft

#### Newsletter Preview (`/newsletter-preview`)
**What users see:**
- Full newsletter preview as it will appear to recipients
- Desktop and mobile views
- Edit button to return to editor

#### Social Media Preview (`/social-preview`)
**What users see:**
- Social post preview for each platform
- Platform-specific formatting
- Character count
- Image preview
- Hashtags
- Schedule options

**Features:**
- Preview post on different platforms
- Edit post content
- Schedule post
- Publish immediately
- Save as draft

---

### HELP PAGE (`/help`)
**What users see:**
- FAQ sections
- Getting started guides
- Video tutorials
- Feature documentation
- Contact support form
- Knowledge base search

**Features:**
- Search help articles
- Browse FAQ categories
- Watch tutorial videos
- Contact support
- Submit feedback

=======================================================================
## MOBILE EXPERIENCE (`/mobile/*`)

### Mobile Chats (`/mobile/chats`)
**What users see:**
- Mobile-optimized chat interface
- Simplified navigation
- Touch-friendly controls
- Swipe gestures for actions

=======================================================================
## SPECIAL PAGES

### Social Post Action (`/social-post-action`)
**What users see:**
- Accessed via email links
- Quick actions for social posts (approve, edit, postpone)
- No full login required (token-based)

### Waitlist Welcome (`/waitlist-welcome`)
**What users see:**
- Welcome message for waitlisted users
- Expected wait time
- Early access benefits
- Referral incentive

=======================================================================
## WHAT USERS CANNOT SEE (ADMIN ONLY)

Regular users do NOT have access to:
- `/admin/*` — Admin dashboard, user management, analytics, settings
- Agent builder/creator tools
- Platform configuration
- User impersonation
- System logs and monitoring

=======================================================================
## COMMON USER WORKFLOWS

### Creating Social Media Content
1. Go to Dashboard or Chat
2. Click on Social Media Planner AI Mate
3. Describe content needs or upload files
4. Review generated posts
5. Edit if needed
6. Schedule or publish
7. View in Historical Social Posts

### Creating Newsletter
1. Chat with Newsletter Creator AI Mate
2. Provide topic or content
3. Review generated newsletter
4. Edit in Newsletter Editor
5. Preview newsletter
6. Schedule or send
7. View in Historical Newsletters

### Managing Leads
1. Go to Leads page
2. View lead list
3. Click on lead for details
4. Update status or add notes
5. Export if needed

### Connecting Integrations
1. Go to Settings → Integrations
2. Select integration (GHL, Facebook, etc.)
3. Click Connect
4. Follow OAuth flow
5. Configure settings
6. Test connection

### Getting Help
1. Click Help in navigation
2. Search knowledge base
3. Browse FAQ
4. Watch tutorials
5. Contact support if needed

=======================================================================
## FEEDBACK CONTEXT QUESTIONS

When users mention issues or requests, ask clarifying questions based on this map:

**For navigation issues:**
- "Which page were you on when this happened?"
- "Were you using the left sidebar, top menu, or a button on the page?"

**For feature requests:**
- "Is this related to the Dashboard, Chat, Leads, or Settings?"
- "Which AI Mate were you working with?"

**For content creation issues:**
- "Were you creating a social post or newsletter?"
- "Did this happen in the chat interface or the editor?"

**For integration issues:**
- "Which integration were you trying to connect? (GHL, Facebook, Google Calendar, etc.)"
- "Did you see any error messages in Settings → Integrations?"

**For performance issues:**
- "Which page was slow or not loading?"
- "Were you uploading files, generating content, or viewing history?"

=======================================================================
## TERMINOLOGY GUIDE

**Terms users understand:**
- AI Mates / Assistants — The AI agents they chat with
- Dashboard — Main overview page
- Chat — Conversation interface
- Leads — Potential customers
- Social posts — Social media content
- Newsletters — Email campaigns
- Settings — Configuration pages
- Integrations — Connected third-party tools

**Terms users may NOT understand:**
- Agents (use "AI Mates" instead)
- N8N workflows (backend automation)
- Supabase (database)
- Vector search (similarity detection)
- Webhooks (integration triggers)

=======================================================================
## NOTES FOR FEEDBACK COLLECTION

1. **Page context matters** — Always ask which page they were on
2. **AI Mate context** — If chat-related, ask which AI Mate
3. **Workflow stage** — Understand where in their workflow the issue occurred
4. **Mobile vs Desktop** — Ask if they're on mobile or desktop
5. **Integration context** — Many issues relate to third-party connections
6. **Content type** — Distinguish between social posts and newsletters
7. **User role** — Regular users vs team members (different permissions)

=======================================================================
## COMMON PAIN POINTS TO WATCH FOR

Based on platform structure, users commonly report issues with:
- Integration connection failures (GHL, Facebook)
- Content scheduling not working
- AI Mate responses being unclear
- Navigation confusion (too many settings pages)
- Mobile experience limitations
- File upload issues in chat
- Newsletter formatting problems
- Lead sync delays
- Notification overload
