# User Acceptance Testing (UAT) Plan

## MUA Registration & Onboarding Flow

**Document Version:** 1.0  
**Date:** 17 April 2026  
**Project:** Leish.my - MUA Registration Enhancement  
**Status:** Ready for UAT

---

## 1. UAT Overview

### 1.1 Scope

This UAT covers the complete MUA (Makeup Artist) registration and onboarding flow including:

- Phase 1: Quick 2-Step Onboarding
- Phase 2: Photo Upload & Portfolio Management
- Phase 3: Subscription Tiers (Free vs Pro)
- Phase 4: Admin Alert System

### 1.2 Test Environment

| Component | Details |
|-----------|---------|
| Environment | Staging (staging.leish.my) |
| Database | Supabase Staging |
| Stripe | Test Mode |
| Storage | Supabase Storage Staging |

### 1.3 Test Users

| Role | Email | Purpose |
|------|-------|---------|
| New Artist | test-artist-1@example.com | Test onboarding flow |
| Existing Artist | test-artist-2@example.com | Test upgrade/downgrade |
| Admin | admin@leish.my | Test alert system |
| Customer | customer@example.com | Test booking with tiered artists |

---

## 2. Test Cases by Phase

### Phase 1: Quick Onboarding (P1-TC-001 to P1-TC-010)

#### P1-TC-001: Successful 2-Step Onboarding
**Priority:** Critical  
**Preconditions:** User has valid email, not yet registered

**Steps:**
1. Navigate to /sign-in
2. Click "Don't have an account? Sign Up"
3. Select "Makeup Artist" role
4. Fill in display name: "Sarah Beauty"
5. Select state: "Selangor"
6. Fill district: "Petaling Jaya"
7. Click Continue
8. Fill service name: "Bridal Makeup"
9. Fill price: 299
10. Select duration: 120 minutes
11. Click "Go Live"

**Expected Results:**
- Profile created successfully
- Redirected to /pro?onboarded=1
- Dashboard shows "Welcome to Leish Pro"
- Provider is_active = true in database
- Provider tier = 'free'

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-002: Duplicate Display Name Handling
**Priority:** High

**Steps:**
1. Attempt to register with existing display name "Sarah Beauty"
2. Click Continue

**Expected Results:**
- Error message: "A profile with that name already exists. Please try a slightly different display name."
- Suggests alternatives (e.g., "Sarah Beauty PJ")

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-003: Profile Photo Upload During Onboarding
**Priority:** High

**Steps:**
1. Complete Step 1
2. Click "Upload" on profile photo
3. Select valid JPG/PNG image (< 5MB)
4. Complete Step 2 and submit

**Expected Results:**
- Photo uploaded successfully
- Photo appears in dashboard profile
- Photo is set as primary

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-004: Skip Photo Upload
**Priority:** Medium

**Steps:**
1. Complete Step 1 without uploading photo
2. Complete Step 2
3. Submit

**Expected Results:**
- Onboarding succeeds without photo
- Default placeholder shown in profile
- "Add a photo" CTA visible in dashboard

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-005: Mobile Responsive Onboarding
**Priority:** High

**Steps:**
1. Open /sign-in on iPhone Safari (375px width)
2. Complete entire onboarding flow

**Expected Results:**
- All form fields visible and usable
- Buttons easily tappable (min 44px touch target)
- No horizontal scrolling
- Photos upload correctly from camera/gallery

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-006: Validation - Required Fields
**Priority:** High

**Steps:**
1. Leave display name empty
2. Click Continue
3. Leave state unselected
4. Try to continue
5. Leave district empty
6. Try to continue

**Expected Results:**
- Validation errors shown inline
- Cannot proceed without required fields
- Clear error messages

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-007: Onboarding Under 2 Minutes
**Priority:** Critical

**Steps:**
1. Time the complete onboarding process from Step 1 to dashboard

**Expected Results:**
- Total time < 120 seconds
- Each step < 60 seconds average

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-008: Already Has Provider Error
**Priority:** Medium

**Steps:**
1. Complete onboarding successfully
2. Navigate to /pro/onboarding again

**Expected Results:**
- Redirected to /pro dashboard
- Message: "Profile already exists"

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-009: Non-Artist Cannot Access
**Priority:** High

**Steps:**
1. Register as Customer role
2. Navigate to /pro/onboarding

**Expected Results:**
- Redirected to home page
- Error: "Forbidden" or "Access denied"

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P1-TC-010: Slug Generation Uniqueness
**Priority:** Medium

**Steps:**
1. Register "John Makeup"
2. Register another "John Makeup" (different email)

**Expected Results:**
- First slug: "john-makeup-ab12"
- Second slug: "john-makeup-cd34" (different suffix)
- Both profiles accessible via unique URLs

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

### Phase 2: Photo Management (P2-TC-001 to P2-TC-008)

#### P2-TC-001: Upload Portfolio Photos
**Priority:** High

**Steps:**
1. Login as artist
2. Navigate to /pro/profile
3. Click "Upload Photos"
4. Select 5 photos
5. Click "Upload 5 images"

**Expected Results:**
- All photos uploaded successfully
- Thumbnails generated
- Photos appear in gallery grid
- Database entries created

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-002: Photo Limit Enforcement (Free Tier)
**Priority:** High

**Steps:**
1. Upload 19 photos (as Free tier)
2. Try to upload 2 more

**Expected Results:**
- Error: "Photo limit reached. Upgrade to Pro for more."
- Upload blocked

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-003: Set Primary Photo
**Priority:** Medium

**Steps:**
1. Upload multiple photos
2. Click "Set as Primary" on one photo

**Expected Results:**
- Selected photo marked as PRIMARY
- Previous primary unset
- Profile displays new primary photo

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-004: Delete Photo
**Priority:** Medium

**Steps:**
1. Upload photo
2. Click delete icon
3. Confirm deletion

**Expected Results:**
- Photo removed from gallery
- Photo deleted from storage
- Database entry removed

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-005: Photo Size Validation
**Priority:** Medium

**Steps:**
1. Try to upload 10MB image

**Expected Results:**
- Error: "Photo must be less than 5MB"
- Upload blocked before submission

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-006: Photo Format Validation
**Priority:** Medium

**Steps:**
1. Try to upload PDF file
2. Try to upload HEIC file

**Expected Results:**
- Error: "Only image files allowed"
- Upload blocked

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-007: Pro Tier - 50 Photo Limit
**Priority:** High

**Preconditions:** User is Pro tier

**Steps:**
1. Upload 25 photos
2. Upload 25 more (total 50)
3. Try to upload 51st

**Expected Results:**
- First 50 upload successfully
- 51st blocked with message

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P2-TC-008: Storage Security (RLS)
**Priority:** Critical

**Steps:**
1. Artist A tries to view Artist B's photos via API
2. Attempt unauthorized access

**Expected Results:**
- Access denied (403)
- Photos only visible to owner and admins

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

### Phase 3: Subscription Tiers (P3-TC-001 to P3-TC-012)

#### P3-TC-001: Free Tier Default Assignment
**Priority:** Critical

**Steps:**
1. Complete onboarding as new artist
2. Check database

**Expected Results:**
- tier = 'free'
- client_limit = 10
- commission_rate not yet set (calculated at booking)

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-002: Pro Upgrade Flow
**Priority:** Critical

**Steps:**
1. Login as Free tier artist
2. Navigate to /pro/upgrade
3. Click "Start Free Trial"
4. Complete Stripe Checkout with test card
5. Return to dashboard

**Expected Results:**
- Redirected to Stripe Checkout
- 14-day trial started
- tier = 'pro'
- Welcome message shown
- Pro badge visible

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-003: Commission Calculation - Free Tier
**Priority:** Critical

**Steps:**
1. Create booking as Free tier artist
2. Service price: RM200

**Expected Results:**
- Commission: RM20 (10%)
- Artist earns: RM180
- Displayed clearly in dashboard

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-004: Commission Calculation - Pro Tier
**Priority:** Critical

**Preconditions:** Artist is Pro tier

**Steps:**
1. Create booking
2. Service price: RM200

**Expected Results:**
- Commission: RM10 (5%)
- Artist earns: RM190
- 5% savings highlighted

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-005: Commission Locked at Booking Time
**Priority:** High

**Steps:**
1. Artist books (Free tier) - Commission 10%
2. Artist upgrades to Pro
3. Check previous booking commission

**Expected Results:**
- Previous booking still shows 10%
- New bookings show 5%
- Commission not retroactively changed

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-006: Yearly Subscription
**Priority:** Medium

**Steps:**
1. Navigate to /pro/upgrade
2. Select "Yearly"
3. Complete checkout

**Expected Results:**
- Charged RM999/year
- 16% savings indicated
- Billing period: 1 year

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-007: Subscription Cancellation
**Priority:** High

**Steps:**
1. Login as Pro tier
2. Navigate to Stripe billing portal
3. Cancel subscription
4. Wait for end of period

**Expected Results:**
- Can continue using Pro until period ends
- tier changes to 'free' at period end
- Email notification sent
- Excess resources flagged for cleanup

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-008: Free Tier Limits - Services
**Priority:** Medium

**Steps:**
1. As Free tier, add 5 services
2. Try to add 6th service

**Expected Results:**
- Error: "Service limit reached. Upgrade to Pro for unlimited services."
- Cannot add beyond limit

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-009: Pro Features Available
**Priority:** High

**Preconditions:** Artist is Pro

**Steps:**
1. Navigate to Analytics
2. Check for featured placement
3. Test custom booking URL

**Expected Results:**
- Analytics dashboard visible
- Featured placement in search
- Custom URL working: leish.my/book/[slug]

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-010: Stripe Webhook Handling
**Priority:** Critical

**Steps:**
1. Trigger checkout.session.completed webhook
2. Trigger invoice.paid webhook
3. Trigger customer.subscription.deleted webhook

**Expected Results:**
- Tier updated correctly
- Subscription history logged
- Audit trail created

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-011: Failed Payment Handling
**Priority:** Medium

**Steps:**
1. Try to upgrade with declined test card
2. Enter incorrect 3D Secure

**Expected Results:**
- Error message shown
- Not redirected to success
- Can retry with different card

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P3-TC-012: Subscription History
**Priority:** Medium

**Steps:**
1. Upgrade to Pro
2. Downgrade to Free
3. Upgrade again
4. Check subscription_history table

**Expected Results:**
- All actions logged
- Timestamps accurate
- Amounts recorded

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

### Phase 4: Admin Alert System (P4-TC-001 to P4-TC-010)

#### P4-TC-001: Auto-Alert on Low Rating
**Priority:** Critical

**Preconditions:** Artist has 5+ reviews, average < 3.0

**Steps:**
1. Customer leaves review bringing average below 3.0
2. Wait for rating calculation (daily job)

**Expected Results:**
- Alert created: type = 'low_rating', severity = 'high'
- Alert visible in /admin/providers
- Admin notification sent (if configured)

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-002: Manual Alert Creation
**Priority:** High

**Steps:**
1. Login as admin
2. Navigate to /admin/providers
3. Click "Flag" on provider
4. Fill alert form
5. Submit

**Expected Results:**
- Alert created in database
- Alert count updated on provider
- Alert visible in dashboard

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-003: Suspend Provider
**Priority:** Critical

**Steps:**
1. Find provider with alert
2. Click "Suspend"
3. Add reason: "Multiple complaints"
4. Confirm

**Expected Results:**
- Provider is_suspended = true
- Provider hidden from search
- Cannot receive new bookings
- Existing bookings continue

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-004: Activate Suspended Provider
**Priority:** High

**Steps:**
1. Find suspended provider
2. Click "Activate"
3. Confirm

**Expected Results:**
- Provider is_suspended = false
- Provider appears in search
- Can receive new bookings
- Audit log entry created

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-005: Alert Filtering
**Priority:** Medium

**Steps:**
1. Navigate to /admin/providers
2. Click "With Alerts" filter
3. Click "Suspended" filter

**Expected Results:**
- Only providers with alerts shown
- Suspended providers shown
- Count badges accurate

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-006: Resolve Alert
**Priority:** High

**Steps:**
1. Open provider with alert
2. Click "Mark as Resolved"
3. Add resolution notes
4. Submit

**Expected Results:**
- Alert status = 'resolved'
- Resolution notes saved
- resolved_by set
- resolved_at timestamp set
- Alert removed from open count

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-007: Alert Severity Levels
**Priority:** Medium

**Steps:**
1. Create alerts with Low, Medium, High severity
2. View in dashboard

**Expected Results:**
- Color coding: Yellow (Low), Orange (Medium), Red (High)
- Sortable by severity
- High alerts shown first

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-008: Audit Logging
**Priority:** High

**Steps:**
1. Suspend provider
2. Activate provider
3. Resolve alert
4. Check admin_audit_log table

**Expected Results:**
- All actions logged
- Actor ID recorded
- Timestamps accurate
- Metadata complete

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-009: Non-Admin Cannot Access
**Priority:** Critical

**Steps:**
1. Login as artist
2. Navigate to /admin/providers

**Expected Results:**
- Redirected to home
- Error: "Forbidden" or "Access denied"
- No admin functionality accessible

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

#### P4-TC-010: Alert Summary Stats
**Priority:** Medium

**Steps:**
1. View /admin/providers
2. Check stat cards at top

**Expected Results:**
- Total Providers: accurate count
- With Alerts: accurate count
- Suspended: accurate count
- Pro Tier: accurate count

**Acceptance Criteria:** ✓ PASS / ✗ FAIL

---

## 3. UAT Sign-Off Criteria

### 3.1 Critical Success Factors

- [ ] All Critical priority test cases pass
- [ ] 95% of High priority test cases pass
- [ ] No Critical bugs unresolved
- [ ] Performance targets met (onboarding < 2 minutes)
- [ ] Security requirements verified (RLS policies working)

### 3.2 Sign-Off Approvals Required

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| QA Lead | | | |
| Tech Lead | | | |
| Operations Manager | | | |

---

## 4. Defect Tracking

### Defect Log

| ID | Test Case | Severity | Description | Status | Assigned To |
|----|-----------|----------|-------------|--------|-------------|
| | | | | | |
| | | | | | |
| | | | | | |

### Severity Definitions

- **Critical:** Blocks critical path, no workaround
- **High:** Major functionality impacted, workaround exists
- **Medium:** Minor functionality impacted
- **Low:** Cosmetic issue

---

## 5. UAT Execution Timeline

| Phase | Duration | Start Date | End Date |
|-------|----------|------------|----------|
| Phase 1: Quick Onboarding | 2 days | | |
| Phase 2: Photo Management | 2 days | | |
| Phase 3: Subscription Tiers | 3 days | | |
| Phase 4: Admin Alerts | 2 days | | |
| Regression Testing | 1 day | | |
| **Total** | **10 days** | | |

---

## 6. Go/No-Go Decision

### Go Criteria

- [ ] All Critical test cases pass
- [ ] UAT sign-off obtained
- [ ] Production deployment checklist complete
- [ ] Rollback plan tested
- [ ] Monitoring configured

### No-Go Triggers

- Any Critical defect unresolved
- Performance degradation > 20%
- Security vulnerability identified
- Data integrity issue found

---

**Prepared By:** AI Assistant  
**Reviewed By:** [To be filled]  
**Approved By:** [To be filled]

---

**END OF UAT PLAN**
