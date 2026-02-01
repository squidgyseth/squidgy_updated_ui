# Personal Assistant Workflow Changes

## Summary
Simplified onboarding flow to only ask for Brand Voice + Target Audience, then immediately enable the agent.

## Changes Made to `SA_Personal_Assistant.json`

### 1. **Save User Settings Tool** (Lines 433-476)
**Before:**
- Saved: brand_voice, target_audience, primary_goals, calendar_type, notifications_enabled

**After:**
- Saves: brand_voice, target_audience ONLY

### 2. **Pre-Process JavaScript** (Line 117)
**Removed template variable replacements:**
- ❌ `primary_goals`
- ❌ `calendar_types`
- ❌ `notification_options`

**Updated tools description:**
- Before: "Save User Settings - Save to profiles table (FIRST agent only: brand_voice, target_audience, primary_goals as comma-separated string, calendar_type, notifications_enabled)"
- After: "Save User Settings - Save to profiles table (brand_voice, target_audience only)"

**Added emphasis:**
- "Enable Agent - ...MUST be called for EVERY agent enablement!"

**Removed from return object:**
- ❌ `primary_goals`
- ❌ `calendar_types`
- ❌ `notification_options`
- ❌ `business_types`

### 3. **Enable Agent Tool** (Lines 478-514)
**No changes needed** - Already correct:
- Inserts into `assistant_personalizations`
- Sets `is_enabled=true`
- Takes `assistant_id` as parameter

## New Onboarding Flow

### First Agent:
1. Website Analysis
2. Agent Selection
3. Brand Voice → **Calls "Save User Settings"**
4. Target Audience → **Calls "Enable Agent"** → Done ✅

### Additional Agent:
1. Agent Selection
2. Brand Voice
3. Target Audience → **Calls "Enable Agent"** → Done ✅

## Import Instructions

**IMPORTANT:** This workflow file is gitignored. To apply changes:

1. Open n8n dashboard
2. Navigate to Workflows
3. Find "SA_Personal_Assistant"
4. Click "..." → "Import from file"
5. Select: `n8n_workflows/SA_Personal_Assistant.json`
6. Click "Save" and "Activate"

## Validation

✅ JSON syntax validated
✅ No references to removed fields (primary_goals, calendar_types, notifications_enabled)
✅ Tools correctly configured
✅ Pre-process code updated
✅ Template replacements cleaned up

## Testing Checklist

After importing:
- [ ] Test first agent onboarding (should ask website → agent → brand voice → target audience → enable)
- [ ] Test additional agent onboarding (should ask agent → brand voice → target audience → enable)
- [ ] Verify "Enable Agent" tool is called (check `assistant_personalizations` table)
- [ ] Verify "Save User Settings" only saves brand_voice + target_audience
- [ ] Confirm no prompts for primary goals, calendar, or notifications
