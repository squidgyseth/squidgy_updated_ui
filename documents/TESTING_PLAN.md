# ONBOARDING SYSTEM TESTING PLAN

## Critical Issues Found & Fixed:
1. ✅ Welcome.tsx was not saving completion to database - FIXED
2. ✅ All components now properly integrated with database
3. ✅ Smart routing logic implemented

## Flow Testing Scenarios:

### **Scenario 1: NEW USER LOGIN**
**Expected Path**: Login → `/ai-onboarding/business-type`

**Steps to Test**:
1. User visits `/login`
2. User enters credentials and submits
3. `signIn()` authenticates user
4. `onboardingRouter.determineLoginRoute(userId)` is called
5. Database check: `onboardingDataService.isOnboardingCompleted(userId)` → returns `false`
6. Database check: `onboardingDataService.getOnboardingProgress(userId)` → returns `null`
7. Router returns: `{ shouldShowOnboarding: true, redirectPath: '/ai-onboarding/business-type', isNewUser: true }`
8. User is redirected to business type selection

**Potential Issues**:
- ⚠️ **Auth timing**: Login.tsx waits up to 3 seconds for userId - may timeout
- ⚠️ **Database connection**: If database is down, falls back to onboarding (safe)
- ⚠️ **userId lookup**: Email-to-userId conversion in auth service

### **Scenario 2: RETURNING USER (PARTIAL PROGRESS)**
**Expected Path**: Login → Current step (e.g., `/ai-onboarding/choose-assistants`)

**Steps to Test**:
1. User has previously completed steps 1-2, stopped at step 3
2. Database has: `current_step: 3, business_type: 'saas_tech', selected_departments: ['marketing', 'sales']`
3. Login triggers `onboardingRouter.determineLoginRoute(userId)`
4. `isOnboardingCompleted()` → returns `false`
5. `getOnboardingProgress()` → returns progress object with `current_step: 3`
6. Router calls `getStepPath(3)` → returns `/ai-onboarding/choose-assistants`
7. User is redirected to step 3
8. Component loads data via `onboardingRouter.loadOnboardingDataForStep(userId, 3)`
9. Form pre-fills with existing data

**Potential Issues**:
- ⚠️ **Data consistency**: What if step 2 data is missing but current_step is 3?
- ⚠️ **Component mounting**: Race conditions between auth and data loading
- ⚠️ **Step dependencies**: Step 3 needs data from steps 1-2

### **Scenario 3: COMPLETED USER**
**Expected Path**: Login → `/dashboard`

**Steps to Test**:
1. User has `is_completed: true` in database
2. Login triggers `onboardingRouter.determineLoginRoute(userId)`
3. `isOnboardingCompleted()` → returns `true`
4. Router returns: `{ shouldShowOnboarding: false, redirectPath: '/dashboard', isReturningUser: true }`
5. User is redirected to dashboard

**Potential Issues**:
- ✅ **Simple flow** - least likely to have issues

### **Scenario 4: SIDEBAR ONBOARDING ICON CLICK**
**Expected Path**: Dashboard → `/ai-onboarding/business-type` (for editing)

**Steps to Test**:
1. Completed user clicks onboarding icon in sidebar
2. `onboardingRouter.handleOnboardingIconClick(userId)` is called
3. Router always returns step 1 for editing: `/ai-onboarding/business-type`
4. Components load existing data for pre-filling

**Potential Issues**:
- ⚠️ **Missing implementation**: Sidebar onboarding icon not yet implemented
- ⚠️ **Edit mode**: Need to distinguish between new and edit mode

### **Scenario 5: STEP-BY-STEP PROGRESSION**
**Expected Path**: Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Dashboard

**Critical Database Operations**:
1. **Step 1**: Save `business_type` to `user_onboarding`
2. **Step 2**: Save `selected_departments` to `user_onboarding` 
3. **Step 3**: Save `selected_assistants` to `user_onboarding`
4. **Step 4**: Save personalizations to `assistant_personalizations` table
5. **Step 5**: Save company details to `onboarding_company_details` table
6. **Step 6**: Mark `is_completed: true, onboarding_completed_at: NOW()` in `user_onboarding`

**Potential Issues**:
- ⚠️ **Partial save failures**: What if step 3 saves assistants but step 4 personalization fails?
- ⚠️ **Data integrity**: Foreign key constraints and cascading
- ⚠️ **Transaction handling**: No atomic transactions across multiple tables
- ⚠️ **Error recovery**: Users might get stuck if save fails

## Error Scenarios to Test:

### **Database Errors**:
- Connection timeout
- Foreign key constraint violations
- Table doesn't exist
- User permissions

### **Authentication Errors**:
- User ID not found
- Email lookup fails
- Auth session expired

### **Network Errors**:
- API calls fail
- Timeout errors
- Intermittent connectivity

## Data Validation Issues:

### **Missing Data**:
- User completes step 3 but step 1 data is missing
- Current step is 4 but no assistants selected
- Company name is empty in step 5

### **Invalid Data Types**:
- Array fields saved as strings
- Date formatting issues
- UUID format validation

## Performance Issues:

### **Database Queries**:
- Multiple sequential database calls in components
- No caching of configuration data
- Repeated auth state checks

### **Component Loading**:
- All components wait for auth + database
- YAML config loaded multiple times
- No optimistic UI updates

## Recommendations:

### **High Priority Fixes**:
1. ✅ **Implement sidebar onboarding icon** - In todo list
2. ✅ **Add error boundaries** - Consider for production
3. ✅ **Implement retry logic** - For failed database operations
4. ✅ **Add data validation** - Before saving to database
5. ✅ **Better loading states** - Already implemented

### **Medium Priority**:
1. Add transaction support for multi-table operations
2. Implement optimistic UI updates
3. Add comprehensive error logging
4. Cache YAML configuration
5. Add data migration utilities

### **Low Priority**:
1. Add analytics tracking
2. Implement A/B testing
3. Add performance monitoring
4. Optimize database queries

## Testing Commands:

```bash
# Run the development server
npm run dev

# Test database connection
# Check Supabase dashboard

# Test authentication
# Try login with valid/invalid credentials

# Test onboarding flow
# Create new user and complete full flow

# Test returning user
# Login with existing user
```

## Manual Test Checklist:

- [ ] New user can complete full onboarding
- [ ] Returning user resumes from correct step
- [ ] Completed user goes to dashboard
- [ ] All data saves correctly to database
- [ ] Error handling works properly
- [ ] Loading states display correctly
- [ ] Forms pre-fill with existing data
- [ ] Navigation works between steps
- [ ] Welcome page marks completion
- [ ] Database queries are efficient

## Success Criteria:

✅ All 5 scenarios work without errors  
✅ Database stores data correctly  
✅ Users can edit existing onboarding  
✅ Error handling gracefully falls back  
✅ Performance is acceptable (&lt;2s page loads)  
✅ No data loss during flow  