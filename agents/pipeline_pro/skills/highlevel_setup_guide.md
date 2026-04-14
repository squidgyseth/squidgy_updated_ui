# HighLevel Setup Guide

Step-by-step instructions for configuring Opportunities pipelines in HighLevel, including navigation, stage creation, settings, and best practices.

=======================================================================
## WHEN TO USE

Use this skill when:
- Client asks for detailed setup instructions
- Client needs guidance navigating HighLevel
- Client is ready to implement recommended pipeline
- Client has questions about specific HighLevel settings

**Note:** Always provide overview first, detailed steps only when requested.

=======================================================================
## SETUP APPROACH

**Two-Tier Guidance:**

1. **Overview Level** (Default)
   - High-level steps and navigation path
   - Key settings to configure
   - What to expect in the process
   - Estimated time to complete

2. **Detailed Level** (When Requested)
   - Click-by-click instructions
   - Screenshots descriptions if available
   - Troubleshooting common issues
   - Advanced settings explanations

**Always start with overview, dive deeper only if client asks.**

=======================================================================
## OVERVIEW: PIPELINE SETUP IN HIGHLEVEL

**Quick Navigation Path:**
Settings → Business Profile → Pipelines → Add Pipeline

**Main Steps:**
1. Create new pipeline (name it)
2. Add stages (one at a time or bulk)
3. Set stage probabilities
4. Configure stage settings (optional)
5. Save and activate pipeline
6. Test with sample opportunity

**Estimated Time:** 10-15 minutes for basic pipeline setup

**Prerequisites:**
- HighLevel account with appropriate permissions
- Pipeline structure already planned (from previous skill)
- Stage names and probabilities determined

=======================================================================
## DETAILED SETUP INSTRUCTIONS

### Step 1: Access Pipeline Settings

**Navigation:**
1. Log into your HighLevel account
2. Click on **Settings** in the left sidebar (gear icon)
3. Under "Business Profile" section, click **Pipelines**
4. You'll see a list of existing pipelines (if any)

**What You'll See:**
- List of current pipelines for your location
- Options to add, edit, or delete pipelines
- Default pipelines (if first time setup)

### Step 2: Create New Pipeline

**Instructions:**
1. Click the **"+ Add Pipeline"** button (top right)
2. A modal/form will appear

**Required Fields:**
- **Pipeline Name:** Enter descriptive name (e.g., "Sales Pipeline", "Lead Pipeline")
- **Pipeline Type:** Select "Opportunities" (default)

**Optional Fields:**
- **Description:** Add notes about pipeline purpose (helpful for teams)

**Tips:**
- Use clear names ("B2B Sales Pipeline", "Consultation Pipeline")
- Avoid generic names ("Pipeline 1", "Default")
- Consider multiple pipelines for different deal types

**Click "Create"** or **"Save"** to proceed.

### Step 3: Add Pipeline Stages

**Two Methods:**

**Method A: Add Stages One-by-One**
1. After creating pipeline, you'll see empty stage area
2. Click **"+ Add Stage"** button
3. Enter **Stage Name** (e.g., "New Lead", "Qualified")
4. Set **Probability** percentage (0-100)
5. Click **"Save Stage"**
6. Repeat for each stage in your pipeline

**Method B: Quick Add Multiple Stages** (if available)
1. Some HighLevel versions allow bulk stage creation
2. Look for "Add Multiple Stages" option
3. Enter all stage names at once
4. Set probabilities after creation

**Stage Order:**
- Stages appear in order of creation (usually)
- Drag and drop to reorder if needed
- Left-to-right or top-to-bottom depending on view

### Step 4: Configure Stage Probabilities

**For Each Stage:**
1. Click on stage to edit
2. Find **"Probability"** or **"Win Probability"** field
3. Enter percentage (0-100)
   - Early stages: 10-30%
   - Mid stages: 40-60%
   - Late stages: 70-95%
4. Save changes

**Why Probabilities Matter:**
- Used for revenue forecasting
- Helps prioritize deals
- Tracks pipeline health
- Affects reporting and analytics

### Step 5: Advanced Stage Settings (Optional)

**Additional Settings Per Stage:**

**Stage Color:**
- Click color picker
- Choose visual identifier for stage
- Helps with quick visual scanning

**Stage Automation:**
- Set up triggers when deals enter/exit stage
- Examples: Send email, assign task, update tag
- Requires Workflow/Automation setup

**Required Fields:**
- Force specific fields to be filled when entering stage
- Example: Require "Budget" field when moving to "Qualified"

**Stage Notifications:**
- Notify team members when deals enter stage
- Email or in-app notifications

**Stage Limits:** (Some HighLevel versions)
- Set max number of deals allowed in stage
- Helps prevent bottlenecks

### Step 6: Configure Pipeline Settings

**Pipeline-Level Settings:**

**Default Pipeline:**
- Set as default for new opportunities
- Recommended if you have only one pipeline

**Pipeline Permissions:**
- Control who can view/edit pipeline
- Useful for agency with multiple teams/clients

**Pipeline Statuses:**
- Won status (closed/won)
- Lost status (closed/lost)
- Abandoned status (optional)

**Monetary Value Settings:**
- Currency type (USD, GBP, EUR, etc.)
- Deal value requirements

### Step 7: Save and Activate Pipeline

**Final Steps:**
1. Review all stages and settings
2. Check stage order is correct
3. Verify probabilities are set
4. Click **"Save Pipeline"** or **"Activate"**
5. Pipeline is now live and ready to use

**Confirmation:**
- You should see success message
- Pipeline appears in pipelines list
- Ready to add opportunities

### Step 8: Test Pipeline with Sample Opportunity

**Create Test Opportunity:**
1. Go to **Opportunities** section (left sidebar)
2. Click **"+ Add Opportunity"** or **"New Opportunity"**
3. Fill in required fields:
   - Contact/Company name
   - Pipeline (select your new pipeline)
   - Stage (select first stage)
   - Deal value (test amount)
4. Save opportunity

**Test Stage Movement:**
1. Open the test opportunity
2. Try moving it to next stage (drag or dropdown)
3. Verify probability updates
4. Check any automations trigger
5. Delete test opportunity when satisfied

=======================================================================
## HIGHLEVEL NAVIGATION TIPS

**Finding Opportunities:**
- **Main Menu:** Left sidebar → Opportunities
- **Pipeline View:** Kanban/board view of all stages
- **List View:** Table view with filters
- **Contact View:** Opportunities linked to contact

**Quick Actions:**
- **Drag & Drop:** Move opportunities between stages
- **Quick Add:** Click "+" on any stage to add opportunity
- **Bulk Actions:** Select multiple, move/update together
- **Filters:** Filter by owner, value, date, tags

**Common Location Issues:**
- Pipelines are location-specific in HighLevel
- Ensure you're viewing correct sub-account/location
- Agency view vs. Location view differences

=======================================================================
## TROUBLESHOOTING COMMON ISSUES

**Issue 1: Can't Find Pipelines Setting**
- **Solution:** Check user permissions - admin access required
- May be under different menu in older HighLevel versions
- Try: Settings → CRM → Pipelines

**Issue 2: Stages Won't Save**
- **Solution:** Check required fields are filled
- Ensure probability is 0-100 range
- Try refreshing page and re-entering

**Issue 3: Pipeline Not Appearing in Opportunities**
- **Solution:** Ensure pipeline is activated/saved
- Check you're in correct location/sub-account
- Refresh opportunities page

**Issue 4: Automations Not Triggering**
- **Solution:** Verify workflow is active
- Check trigger conditions match stage exactly
- Test with manual stage movement

**Issue 5: Can't Reorder Stages**
- **Solution:** Look for drag handle icon
- Some versions require edit mode
- May need to delete and recreate in correct order

**Issue 6: Deal Values Not Calculating**
- **Solution:** Check pipeline currency settings
- Ensure probabilities are set correctly
- Verify weighted value calculations are enabled

=======================================================================
## BEST PRACTICES FOR HIGHLEVEL PIPELINES

**1. Start Simple**
- Begin with basic pipeline (5-7 stages)
- Add complexity later as needed
- Test thoroughly before rolling out to team

**2. Clear Stage Names**
- Use descriptive names everyone understands
- Avoid jargon or abbreviations
- Consistent naming convention across pipelines

**3. Conservative Probabilities**
- Start lower than you think
- Adjust based on actual conversion data
- Better to under-forecast than over-forecast

**4. Regular Maintenance**
- Review pipeline quarterly
- Archive or remove unused stages
- Update probabilities based on actual data

**5. Team Training**
- Document your stage definitions
- Train team on when to move deals
- Create internal guidelines for consistency

**6. Use Automations Wisely**
- Automate repetitive tasks (notifications, assignments)
- Don't over-automate (keeps human oversight)
- Test automations thoroughly

**7. Monitor Pipeline Health**
- Track stage conversion rates
- Identify bottlenecks (stages with many stuck deals)
- Review average time in each stage

=======================================================================
## ADVANCED FEATURES

**Multiple Pipelines:**
- Create separate pipelines for different products/services
- Different sales processes for different deal types
- Example: "New Business Pipeline" vs "Upsell Pipeline"

**Pipeline Reporting:**
- HighLevel provides pipeline analytics
- Track conversion rates by stage
- Forecast revenue based on probabilities
- Monitor team performance

**Custom Fields:**
- Add custom fields to opportunities
- Capture deal-specific information
- Use in automations and reporting

**Pipeline Permissions:**
- Control visibility by user role
- Sales managers see all, reps see only theirs
- Agency setup: different pipelines per client

**Pipeline Templates:**
- Save successful pipeline as template
- Duplicate to new locations/sub-accounts
- Useful for agencies managing multiple clients

=======================================================================
## FREQUENTLY ASKED QUESTIONS

**Q: Can I edit a pipeline after creating it?**
A: Yes, you can edit stage names, probabilities, and settings anytime. Be careful when renaming stages if you have active deals - they'll retain the new names.

**Q: What happens to deals if I delete a stage?**
A: HighLevel typically asks you to move deals to another stage first. Don't delete stages with active opportunities.

**Q: Can I have multiple pipelines?**
A: Yes, create as many as needed for different deal types or sales processes. Each opportunity can only be in one pipeline at a time.

**Q: How do I move a deal between pipelines?**
A: Open the opportunity, click pipeline dropdown, select new pipeline. Deal will move to first stage of new pipeline.

**Q: Do pipeline changes affect reporting?**
A: Yes, historical data reflects the pipeline structure at time of reporting. Major changes can affect trend analysis.

**Q: Can I automate stage progression?**
A: Not directly - stages should represent manual decision points. But you can automate tasks, notifications, and field updates when stages change.

**Q: What's the difference between pipeline stages and opportunity statuses?**
A: Stages represent active sales process steps. Statuses (Won, Lost) represent final outcomes and remove opportunity from active pipeline.

=======================================================================
## NEXT STEPS AFTER SETUP

**Immediate Actions:**
1. Import or create first real opportunities
2. Train team on new pipeline structure
3. Set up basic automations (notifications)
4. Create documentation for stage definitions

**First Week:**
1. Monitor team usage and questions
2. Adjust stage names if causing confusion
3. Test all automations with real deals
4. Review initial pipeline flow

**First Month:**
1. Analyze stage conversion rates
2. Identify bottlenecks or issues
3. Gather team feedback
4. Make refinements as needed

**Ongoing:**
1. Weekly: Review pipeline health
2. Monthly: Analyze conversion rates
3. Quarterly: Optimize and refine structure
4. Annually: Major pipeline review

=======================================================================
## VALIDATION CHECKLIST

Before going live with pipeline:
- ✅ All stages created with clear names
- ✅ Probabilities set for each stage (increasing progression)
- ✅ Stage order is correct
- ✅ Pipeline saved and activated
- ✅ Test opportunity created and moved through stages
- ✅ Any automations are tested and working
- ✅ Team trained on stage definitions
- ✅ Documentation created for reference