# User Requirements Specification (URS)

## MUA (Makeup Artist) Registration & Onboarding Flow

**Document Version:** 1.0  
**Date:** 17 April 2026  
**Project:** Leish.my - Beauty Services Marketplace  
**Status:** Approved for Development  
**Classification:** Internal Use

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope](#2-scope)
3. [User Personas](#3-user-personas)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Data Requirements](#6-data-requirements)
7. [Interface Requirements](#7-interface-requirements)
8. [Business Rules](#8-business-rules)
9. [Acceptance Criteria](#9-acceptance-criteria)
10. [Dependencies](#10-dependencies)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Glossary](#12-glossary)
13. [Appendices](#13-appendices)

---

## 1. Executive Summary

This document outlines the comprehensive user requirements for the Makeup Artist (MUA) registration and onboarding flow within the Leish.my platform. The primary goal is to minimize friction for artists joining the platform while providing robust tools for profile management, tier-based subscriptions, and administrative oversight.

### 1.1 Key Objectives

| Objective | Priority | Success Metric |
|-----------|----------|----------------|
| Enable MUAs to go live within 2 minutes of registration | Critical | 90% completion rate |
| Support progressive profile completion | High | 80% complete profiles within 7 days |
| Implement tiered subscription model | High | 15% conversion to Pro tier |
| Provide administrative monitoring tools | Medium | 100% of flagged artists reviewed within 24h |

### 1.2 Stakeholders

- **Product Owner:** Platform growth and artist satisfaction
- **Tech Lead:** Implementation feasibility and scalability
- **UX Designer:** User experience and onboarding flow
- **QA Lead:** Testing coverage and quality assurance
- **Operations:** Admin tools and alert management

---

## 2. Scope

### 2.1 In Scope

#### Phase 1: Quick Onboarding (Week 1-2)
- Streamlined 2-step registration process
- Essential information capture only
- Immediate profile activation
- Progressive completion tracking

#### Phase 2: Photo Management (Week 2-3)
- Profile photo upload (optional during onboarding)
- Portfolio gallery management
- Drag-drop reordering and primary selection
- Supabase Storage integration

#### Phase 3: Subscription & Commission (Week 3-4)
- Free tier with 10% commission structure
- Pro tier (RM99/month) with 5% commission
- Stripe integration for payments
- Tier upgrade/downgrade flows

#### Phase 4: Admin Alert System (Week 4-5)
- Automated alerts for low ratings
- Manual alert creation by admins
- Alert dashboard with severity indicators
- Provider suspend/activate actions

### 2.2 Out of Scope

- Real-time external review site scraping (Phase 2 future enhancement)
- In-app messaging/chat system (separate module)
- Mobile native app onboarding
- Multi-language support beyond English/Malay
- AI-powered portfolio optimization

### 2.3 Assumptions

- Artists have basic internet literacy
- Email addresses are valid and accessible
- Stripe supports Malaysian Ringgit (MYR) transactions
- Supabase Storage scales to projected photo volume

### 2.4 Constraints

- Must comply with Malaysia's Personal Data Protection Act (PDPA)
- Commission rates are non-negotiable (set by business)
- Must integrate with existing Supabase Auth system

---

## 3. User Personas

### 3.1 Primary: Sarah - Freelance Makeup Artist

**Demographics:**
- Age: 26
- Location: Kuala Lumpur
- Experience: 3 years freelance
- Specialty: Bridal makeup

**Technical Profile:**
- Tech-comfortable (uses Instagram, WhatsApp Business)
- Primary device: Smartphone
- Time-constrained, values efficiency

**Goals:**
1. Register and go live in under 5 minutes
2. Start receiving booking requests immediately
3. Build profile portfolio over time
4. Upgrade to Pro when income is steady

**Pain Points:**
- Complex multi-step forms are discouraging
- Can't wait days for approval
- Needs flexibility to edit profile on mobile
- Worried about commission fees eating profits

**Quote:** *"I just want to start accepting bookings. I can add my portfolio photos later when I have time."*

### 3.2 Secondary: David - Platform Admin

**Demographics:**
- Age: 35
- Role: Operations Manager
- Experience: 5 years in marketplace operations

**Goals:**
1. Monitor artist quality metrics efficiently
2. Quickly identify and flag problematic artists
3. Review and approve/suspend accounts with clear audit trail
4. Track external reputation issues

**Pain Points:**
- Alert fatigue from too many notifications
- Need context when reviewing flagged artists
- Require clear escalation procedures

**Quote:** *"I need to spot problems before customers do. Give me clear alerts with actionable data."*

---

## 4. Functional Requirements

### 4.1 Registration & Onboarding

#### URS-001: Role Selection
**Priority:** Must Have  
**Description:** Users can select "Makeup Artist" as their role during registration  
**Acceptance Criteria:**
- [ ] Role selection available on sign-up form with clear labels
- [ ] "Makeup Artist" option prominently displayed
- [ ] Role stored in `raw_user_meta_data` during signUp
- [ ] Profile automatically created with `role = 'artist'` via trigger
- [ ] Redirect to `/pro/onboarding` after email verification
- [ ] Google OAuth users prompted to confirm role on first login

**UI Mockup:**
```
[I am a...]
[Customer] [Makeup Artist] [Studio Owner]

Selected: Makeup Artist
"As a makeup artist, you can list your services and 
accept bookings from customers."
```

#### URS-002: Quick Profile Creation (2-Step)
**Priority:** Must Have  
**Description:** Minimal onboarding requiring only essential information  
**Acceptance Criteria:**
- [ ] **Step 1 - Basic Info (Required):**
  - Display name (2-60 characters)
  - State (dropdown: 16 Malaysian states)
  - District/Area (free text)
  - Display name validated for uniqueness (slug check)

- [ ] **Step 2 - Service (Required):**
  - Minimum one service
  - Service name (2-100 characters)
  - Price in MYR (positive number)
  - Duration in minutes (optional, default 60)

- [ ] **Auto-generated fields:**
  - Slug: `{display-name}-{random-4-char}`
  - Provider created with `is_active = true`
  - `tier = 'free'` assigned automatically
  - `created_at = NOW()`

- [ ] **Timing requirements:**
  - Total onboarding time must be < 2 minutes
  - Each step < 1 minute average
  - Progress indicator shows current step

- [ ] **Error handling:**
  - Duplicate display name: Suggest alternatives
  - Network failure: Retry with exponential backoff
  - Validation errors: Inline field-level messages

**Flow Diagram:**
```
Sign Up → Email Verify → Step 1 (Name/Location) 
  → Step 2 (Service) → Dashboard (LIVE)
```

#### URS-003: Optional Fields Post-Registration
**Priority:** Must Have  
**Description:** Additional profile fields can be added later via dashboard  
**Acceptance Criteria:**
- [ ] Optional fields available in `/pro/profile`:
  - Bio (max 500 characters)
  - Years of experience (free text)
  - Specialties (multi-select: Bridal, Event, Natural, Photoshoot, SFX, Lessons)
  - Hourly rate (reference only, doesn't affect service pricing)
  - Social media links (Instagram, Facebook)

- [ ] Profile behavior:
  - Remains publicly visible with incomplete optional fields
  - Shows "Profile incomplete" badge to artist only
  - Can receive bookings with just required fields

- [ ] Persistence:
  - Auto-save draft every 30 seconds
  - Manual "Save Changes" button
  - Confirmation toast on successful save

#### URS-004: Service Management
**Priority:** Must Have  
**Description:** Artists can add, edit, deactivate services  
**Acceptance Criteria:**
- [ ] Minimum one service required to go live (enforced at onboarding)
- [ ] Service fields:
  - Name: 2-100 characters
  - Duration: 15-minute increments (15, 30, 45, 60...)
  - Price: MYR, positive integer
  - Description: Optional, max 200 characters
  - Is active: Boolean toggle

- [ ] Service limits:
  - Free tier: Maximum 5 active services
  - Pro tier: Unlimited services
  - Can have unlimited inactive services

- [ ] Operations:
  - Add new service: + button in services list
  - Edit: Inline or modal form
  - Deactivate: Toggle switch (hidden from booking)
  - Delete: Only if no past bookings
  - Reorder: Drag to set display order (Pro only)

#### URS-005: Progressive Profile Completion Indicator
**Priority:** Should Have  
**Description:** Visual progress tracking encouraging completion  
**Acceptance Criteria:**
- [ ] Progress bar in dashboard showing completion percentage
- [ ] Checklist items:
  - [ ] Profile photo uploaded (20%)
  - [ ] Bio completed (20%)
  - [ ] Experience added (15%)
  - [ ] Specialties selected (15%)
  - [ ] 3+ portfolio photos (20%)
  - [ ] Availability set (10%)

- [ ] Gamification:
  - "Complete your profile" call-to-action
  - Badge: "Rising Star" at 50%
  - Badge: "Complete Profile" at 100%
  - Celebration animation on milestones

- [ ] Tooltip on hover: "Add a bio to help customers get to know you"

### 4.2 Photo & Portfolio Management

#### URS-011: Profile Photo Upload
**Priority:** Must Have  
**Description:** Artists can upload a primary profile photo  
**Acceptance Criteria:**
- [ ] Upload available:
  - During onboarding (Step 2, optional skip)
  - In dashboard anytime via "Edit Profile"
  - Mobile camera or gallery selection

- [ ] Technical specs:
  - Supported formats: JPG, JPEG, PNG, WebP
  - Max file size: 5MB (client-side validation)
  - Recommended dimensions: 400x400px minimum
  - Aspect ratio: 1:1 (square) or 4:5 (portrait)

- [ ] Processing:
  - Auto-resize to multiple sizes: thumbnail (100x100), medium (400x400), full
  - Compression: 80% quality for web optimization
  - Format conversion: WebP for modern browsers
  - Background blur generation for cover images (optional)

- [ ] UX features:
  - Drag-and-drop upload area
  - Preview before upload
  - Crop/rotate editor (basic)
  - Delete and re-upload
  - Default placeholder avatar if not uploaded

#### URS-012: Portfolio Gallery
**Priority:** Should Have  
**Description:** Multiple portfolio images showcasing work  
**Acceptance Criteria:**
- [ ] Upload limits:
  - Free tier: 20 images maximum
  - Pro tier: 50 images maximum
  - Error message when limit reached

- [ ] Image management:
  - Grid view (3 columns desktop, 2 tablet, 1 mobile)
  - Drag-and-drop reordering
  - Set primary image for profile card
  - Caption/description per image (max 100 chars)
  - Category tags: Bridal, Event, SFX, etc.

- [ ] Actions:
  - Upload new: + button in gallery
  - Delete: Individual delete with confirmation
  - Replace: Upload to replace existing
  - View: Lightbox/enlarged view on click

- [ ] Organization:
  - Filter by category
  - Sort by upload date or custom order
  - Bulk select for deletion

#### URS-013: Photo Storage
**Priority:** Must Have  
**Description:** Secure, scalable photo storage infrastructure  
**Acceptance Criteria:**
- [ ] Storage backend:
  - Supabase Storage buckets: `provider-assets`
  - Folder structure: `{provider_id}/{asset_type}/{filename}`
  - Public URL with CDN caching
  - Signed URLs for private assets (if needed)

- [ ] Security:
  - Row-level security policies on storage
  - Users can only access their own photos
  - Admins can access all photos
  - Scan uploads for malware (via ClamAV or similar)

- [ ] Performance:
  - CDN edge caching (Cloudflare/CloudFront)
  - Image optimization on-the-fly
  - Lazy loading for gallery
  - Thumbnail generation on upload

- [ ] Backup:
  - Daily automated backups
  - Cross-region replication
  - 30-day retention for deleted photos

### 4.3 Subscription & Commission Tiers

#### URS-021: Free Tier (Default)
**Priority:** Must Have  
**Description:** Entry-level tier for all new artists  
**Acceptance Criteria:**
- [ ] Automatically assigned on registration
- [ ] Commission structure:
  - 10% platform fee per booking
  - Calculated on total booking amount
  - Deducted before payout to artist
  - Displayed clearly to artist on booking confirmation

- [ ] Limitations:
  - Maximum 10 active clients (unique customers)
  - Maximum 5 active services
  - Maximum 20 portfolio photos
  - Standard placement in search results
  - Basic dashboard only

- [ ] Features included:
  - Public profile listing
  - Receive and manage bookings
  - Basic email notifications
  - Standard customer support
  - Manual payout requests

#### URS-022: Pro Tier
**Priority:** Must Have  
**Description:** Premium subscription with enhanced features  
**Acceptance Criteria:**
- [ ] Pricing:
  - Monthly: RM99/month
  - Yearly: RM999/year (16% discount)
  - 14-day free trial for new subscribers
  - Prorated billing for mid-cycle upgrades

- [ ] Commission structure:
  - Reduced to 5% per booking
  - Savings of 5% vs Free tier
  - Automatic calculation and deduction

- [ ] Feature enhancements:
  - Unlimited active clients
  - Unlimited services
  - 50 portfolio photos
  - Featured placement in search results
  - "Pro" badge on profile
  - Advanced analytics dashboard
  - Reviews management tools (respond to reviews)
  - Priority customer support (< 4h response)
  - Custom booking URLs (`leish.my/book/{slug}`)
  - CSV/PDF report exports
  - Early access to new features

- [ ] Subscription management:
  - Update payment method
  - View billing history
  - Download invoices
  - Cancel anytime (effective end of billing period)

#### URS-023: Tier Upgrade Flow
**Priority:** Must Have  
**Description:** Seamless upgrade from Free to Pro  
**Acceptance Criteria:**
- [ ] Discovery:
  - "Upgrade to Pro" CTA in dashboard sidebar
  - Feature gate prompts: "This feature is available with Pro"
  - Comparison table: Free vs Pro features

- [ ] Checkout flow:
  - Click upgrade → Stripe Checkout session
  - Pre-filled email from account
  - Support credit card payment
  - 3D Secure authentication if required
  - Success redirect back to dashboard

- [ ] Activation:
  - Immediate activation upon payment success
  - Confirmation email sent
  - "Welcome to Pro" onboarding tour
  - New features highlighted with tooltips

- [ ] Failed payment:
  - Retry payment option
  - Email notification with retry link
  - Grace period of 3 days before downgrade

#### URS-024: Tier Downgrade
**Priority:** Should Have  
**Description:** Allow artists to downgrade from Pro to Free  
**Acceptance Criteria:**
- [ ] Initiation:
  - Available in Subscription settings
  - "Cancel Pro" button with confirmation modal
  - Survey: "Why are you leaving?" (optional)

- [ ] Warnings:
  - If exceeding Free tier limits:
    - "You have 15 active clients. Free tier limits to 10."
    - "You have 25 portfolio photos. Free tier limits to 20."
  - Must reduce to limits before downgrade or within 30 days

- [ ] Process:
  - Active until end of current billing period
  - No prorated refunds
  - Email confirmation of downgrade
  - Export data reminder (download reports before downgrade)

- [ ] Post-downgrade:
  - Excess clients: Cannot accept new bookings until reduced
  - Excess services: Automatically deactivate oldest
  - Excess photos: Marked for deletion (30-day grace)

#### URS-025: Commission Calculation
**Priority:** Must Have  
**Description:** Automatic commission deduction per booking  
**Acceptance Criteria:**
- [ ] Calculation logic:
  - Commission = Service Price × Commission Rate
  - Rate determined by artist's tier at booking creation time
  - Applied to all services in booking
  - Rounded to 2 decimal places

- [ ] Display:
  - Booking confirmation: "You'll earn RM135 after 10% commission"
  - Artist dashboard: Earnings breakdown
  - Payout report: Gross, Commission, Net columns

- [ ] Payment flow:
  - Customer pays full amount via Billplz
  - Platform holds funds
  - Commission deducted at payout time
  - Artist receives net amount

- [ ] Refunds:
  - If booking refunded, commission reversed
  - Full refund = full commission reversal
  - Partial refund = proportional commission reversal

### 4.4 Availability & Scheduling

#### URS-036: Availability Setup (Post-Registration)
**Priority:** Must Have  
**Description:** Artists set their available time slots after onboarding  
**Acceptance Criteria:**
- [ ] Access:
  - Available in dashboard under "Availability" tab
  - Accessible immediately after onboarding
  - Can be skipped and set later

- [ ] Weekly schedule:
  - Days of week: Mon-Sun
  - Time slots: 30-minute intervals
  - Format: 24-hour (08:00 - 18:00)
  - Multiple slots per day allowed
  - Copy schedule to all days option

- [ ] Timezone:
  - Default: Asia/Kuala_Lumpur
  - Display current timezone
  - Customer sees times in their timezone (future)

- [ ] Blocking:
  - Block specific dates (vacation, unavailable)
  - Recurring blocks (e.g., every Monday)
  - Calendar view with visual indicators

- [ ] Integration:
  - Sync with bookings (auto-block booked slots)
  - Minimum advance booking: 24 hours (configurable)
  - Maximum advance booking: 90 days (configurable)

### 4.5 Admin Alert System

#### URS-046: Alert Triggers - Low Rating
**Priority:** Must Have  
**Description:** Auto-flag artists with poor customer ratings  
**Acceptance Criteria:**
- [ ] Trigger conditions:
  - Average rating < 3.0 stars
  - Based on minimum 5 reviews (to avoid early false positives)
  - Calculated daily

- [ ] Alert creation:
  - Type: `low_rating`
  - Severity: `high`
  - Description: "Average rating dropped to 2.8/5.0"
  - Auto-populate rating history trend
  - Status: `open`

- [ ] Notification:
  - Immediate email to admin team
  - Dashboard notification badge
  - Included in daily digest

#### URS-047: Alert Triggers - Multiple Complaints
**Priority:** Must Have  
**Description:** Flag artists with repeated customer complaints  
**Acceptance Criteria:**
- [ ] Trigger conditions:
  - 3+ flagged reviews within 30-day rolling window
  - Reviews marked as `flagged` by customers or system

- [ ] Alert details:
  - Type: `complaint`
  - Severity: `high`
  - Description: "3 complaints in 30 days: [reasons]"
  - Aggregate complaint reasons

- [ ] Auto-actions:
  - Configurable: Auto-suspend booking capability
  - Threshold settings in admin panel

#### URS-048: Manual Alert Creation
**Priority:** Must Have  
**Description:** Admins can manually flag artists for review  
**Acceptance Criteria:**
- [ ] Creation flow:
  - "Flag Artist" button in admin provider list
  - Modal form with fields:
    - Alert type (dropdown)
    - Severity (Low/Medium/High)
    - Description (textarea)
    - Source URL (optional, for external links)

- [ ] Types:
  - `low_rating` - Poor customer feedback
  - `external_review` - Negative reviews on external sites
  - `complaint` - Customer or internal complaint
  - `manual_review` - General concern

- [ ] Metadata:
  - Created by: Admin user ID
  - Created at: Timestamp
  - Status: `open`

#### URS-049: External Review Monitoring
**Priority:** Should Have  
**Description:** Track artist reputation on external platforms  
**Acceptance Criteria:**
- [ ] Manual entry:
  - Admin adds external review links
  - Supported platforms: Google, Facebook, Instagram
  - Store: Platform, URL, sentiment, date

- [ ] Sentiment analysis:
  - Manual: Admin marks as positive/neutral/negative
  - Future: Auto-analyze via API

- [ ] Aggregation:
  - External reputation score (weighted average)
  - Dashboard widget: "3 external reviews, 1 negative"
  - Alert if negative external reviews detected

#### URS-050: Alert Dashboard
**Priority:** Must Have  
**Description:** Centralized admin interface for managing alerts  
**Acceptance Criteria:**
- [ ] Provider list enhancements:
  - Alert count badge per provider
  - Color coding: Green (none), Yellow (low), Red (high)
  - Filter: "Show only with alerts"
  - Sort: Severity (high first), then date

- [ ] Alert detail view:
  - Provider info card
  - Alert history timeline
  - Booking statistics (last 30 days)
  - Review history
  - Action buttons

- [ ] Quick actions:
  - Mark investigating
  - Resolve
  - Suspend provider
  - Contact artist

#### URS-051: Alert Actions
**Priority:** Must Have  
**Description:** Admin actions on flagged artists  
**Acceptance Criteria:**
- [ ] Mark Investigating:
  - Sets status to `investigating`
  - Requires notes field
  - Assigns to admin
  - Email notification to team

- [ ] Resolve:
  - Sets status to `resolved`
  - Requires resolution notes
  - Optional: Mark as false positive
  - Timestamp and admin attribution

- [ ] Suspend Provider:
  - Sets `is_suspended = true`
  - Hides from search results immediately
  - Stops new bookings
  - Existing bookings proceed
  - Email notification to artist
  - Reason logged

- [ ] Reactivate Provider:
  - Sets `is_suspended = false`
  - Restores search visibility
  - Allows new bookings
  - Email notification to artist

- [ ] Contact Artist:
  - Opens email compose
  - Pre-filled recipient
  - Template suggestions

- [ ] Audit logging:
  - All actions logged
  - Timestamp, admin ID, action type
  - Immutable log entries

#### URS-052: Alert Notifications
**Priority:** Should Have  
**Description:** Notify admins of new alerts  
**Acceptance Criteria:**
- [ ] Immediate notifications:
  - Email for High severity alerts
  - Slack/Teams webhook integration (optional)
  - SMS for critical alerts (optional)

- [ ] Digest emails:
  - Daily summary of all open alerts
  - Sent at 9 AM admin timezone
  - Grouped by severity
  - Quick links to admin dashboard

- [ ] In-app notifications:
  - Badge count on admin menu
  - Toast notifications for new alerts
  - Persistent until dismissed

### 4.6 Dashboard Features

#### URS-061: Artist Dashboard - Overview
**Priority:** Must Have  
**Description:** Main hub for artist operations  
**Acceptance Criteria:**
- [ ] Metrics widgets:
  - Upcoming bookings (next 7 days)
  - Total earnings this month
  - New profile views
  - Conversion rate

- [ ] Quick actions:
  - Edit profile (links to editor)
  - Manage availability (links to calendar)
  - View analytics (Pro only)
  - Upload photos (links to gallery)

- [ ] Status indicators:
  - Tier status with upgrade CTA
  - Profile completion percentage
  - Alert messages (if any)
  - System announcements

- [ ] Recent activity:
  - Latest booking requests
  - New reviews
  - Payout history

#### URS-062: Artist Dashboard - Profile Editor
**Priority:** Must Have  
**Description:** Comprehensive profile editing interface  
**Acceptance Criteria:**
- [ ] Sections:
  - Basic info: Display name, location
  - About: Bio, experience, specialties
  - Services: Add/edit/delete
  - Photos: Profile + portfolio
  - Social links: Instagram, Facebook
  - Contact: Phone, WhatsApp

- [ ] Editing features:
  - Inline editing or modal forms
  - Auto-save drafts
  - Preview changes before publish
  - Discard changes option
  - Confirmation on save

- [ ] Validation:
  - Real-time field validation
  - Character counters for text fields
  - Required field indicators
  - Error messages in context

#### URS-063: Artist Dashboard - Analytics (Pro Only)
**Priority:** Should Have  
**Description:** Business insights for Pro artists  
**Acceptance Criteria:**
- [ ] Charts and graphs:
  - Booking volume: Daily/weekly/monthly view
  - Revenue trends: Line chart
  - Service popularity: Bar chart
  - Customer sources: Pie chart

- [ ] Metrics:
  - Conversion rate: Views → Bookings
  - Average booking value
  - Customer retention rate
  - Repeat customer percentage
  - Response time to inquiries

- [ ] Date ranges:
  - Last 7 days
  - Last 30 days
  - Last 90 days
  - Custom date range
  - Year-over-year comparison

- [ ] Export:
  - CSV export of raw data
  - PDF report generation
  - Scheduled reports (monthly email)

---

## 5. Non-Functional Requirements

### 5.1 Performance Requirements

| ID | Requirement | Target | Measurement |
|----|-------------|--------|-------------|
| NFR-001 | Onboarding completion time | < 2 minutes | Time from Step 1 start to dashboard load |
| NFR-002 | Dashboard initial load | < 2 seconds | Time to interactive (TTI) |
| NFR-003 | Photo upload (5MB) | < 10 seconds | From selection to upload complete |
| NFR-004 | Search results load | < 1 second | API response time for artist listings |
| NFR-005 | Profile update save | < 2 seconds | Save action to confirmation |
| NFR-006 | Concurrent registrations | 100/minute | Load test threshold |
| NFR-007 | Alert generation | < 5 minutes | From trigger condition to alert created |
| NFR-008 | Image CDN delivery | < 200ms | Time to first byte (TTFB) |
| NFR-009 | Database query time | < 100ms | 95th percentile for common queries |
| NFR-010 | API response time | < 500ms | 95th percentile for all endpoints |

### 5.2 Security Requirements

| ID | Requirement | Implementation Details |
|----|-------------|----------------------|
| NFR-011 | Secure file uploads | MIME type validation, file size limits, malware scanning via ClamAV |
| NFR-012 | RLS policies | All tables enforce row-level security; users access only own data |
| NFR-013 | API rate limiting | 100 requests/minute per IP, 1000 requests/hour per user |
| NFR-014 | Admin audit logging | All provider status changes logged with timestamp and admin ID |
| NFR-015 | PII protection | Encrypt email, phone at rest (AES-256); mask in logs |
| NFR-016 | Session security | HttpOnly cookies, 24h expiry, secure flag, SameSite=strict |
| NFR-017 | Stripe security | Webhook signature verification, PCI compliance via Stripe |
| NFR-018 | Password policy | Min 8 chars, 1 uppercase, 1 lowercase, 1 number |
| NFR-019 | SQL injection prevention | Parameterized queries only, no dynamic SQL |
| NFR-020 | XSS prevention | React auto-escaping, sanitize HTML inputs |

### 5.3 Usability Requirements

| ID | Requirement | Details |
|----|-------------|---------|
| NFR-021 | Mobile responsive | Full functionality on 375px+ screens, tested on iOS Safari and Chrome Android |
| NFR-022 | Accessibility | WCAG 2.1 AA compliance, screen reader compatible, keyboard navigable |
| NFR-023 | Error messages | Clear, actionable, in English and Malay (BM) |
| NFR-024 | Help tooltips | Contextual help on complex fields, dismissible |
| NFR-025 | Progress saving | Auto-save form data every 30 seconds, manual save option |
| NFR-026 | Offline indication | Show "Offline" status when connection lost, retry actions |
| NFR-027 | Loading states | Skeleton screens or spinners for async operations |
| NFR-028 | Empty states | Helpful messages when no data ("No bookings yet, here's how to get started") |
| NFR-029 | Confirmation dialogs | Destructive actions require confirmation (delete, suspend) |
| NFR-030 | Undo actions | Allow undo for non-destructive actions (hide notification) |

### 5.4 Scalability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-031 | Artist capacity | Support 10,000+ registered artists |
| NFR-032 | Photo storage | 500GB+ capacity, expandable |
| NFR-033 | Concurrent bookings | Support 1,000+ simultaneous active bookings |
| NFR-034 | Alert volume | Handle 1,000+ alerts per month without performance degradation |
| NFR-035 | Database connections | Connection pooling for 500+ concurrent connections |
| NFR-036 | CDN bandwidth | 10TB/month bandwidth for image delivery |
| NFR-037 | API throughput | 10,000 requests/minute peak capacity |

### 5.5 Reliability Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-038 | System uptime | 99.9% excluding planned maintenance |
| NFR-039 | Data backup | Daily automated backups, 30-day retention |
| NFR-040 | Disaster recovery | RPO < 24 hours, RTO < 4 hours |
| NFR-041 | Photo backup | 99.999% durability (3x replication) |
| NFR-042 | Error rate | < 0.1% of requests result in 5xx errors |

---

## 6. Data Requirements

### 6.1 New Database Tables

#### Table: `provider_assets`
Stores photos and portfolio images for providers.

```sql
CREATE TABLE provider_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('profile_photo', 'portfolio', 'work_sample')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- RLS policies
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes
CREATE INDEX idx_provider_assets_provider ON provider_assets(provider_id);
CREATE INDEX idx_provider_assets_type ON provider_assets(asset_type);
CREATE INDEX idx_provider_assets_primary ON provider_assets(provider_id, is_primary) WHERE is_primary = true;
```

#### Table: `provider_alerts`
Stores admin alerts for provider monitoring.

```sql
CREATE TYPE alert_type AS ENUM ('low_rating', 'external_review', 'complaint', 'manual_review');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high');
CREATE TYPE alert_status AS ENUM ('open', 'investigating', 'resolved');

CREATE TABLE provider_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    alert_type alert_type NOT NULL,
    severity alert_severity NOT NULL DEFAULT 'medium',
    description TEXT NOT NULL,
    source_url TEXT,
    status alert_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    resolution_notes TEXT,
    created_by UUID REFERENCES profiles(id),
    
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes
CREATE INDEX idx_provider_alerts_provider ON provider_alerts(provider_id);
CREATE INDEX idx_provider_alerts_status ON provider_alerts(status);
CREATE INDEX idx_provider_alerts_severity ON provider_alerts(severity);
CREATE INDEX idx_provider_alerts_created ON provider_alerts(created_at DESC);
```

#### Table: `external_reviews` (Phase 2)
Stores external platform reviews for reputation monitoring.

```sql
CREATE TYPE external_platform AS ENUM ('google', 'facebook', 'instagram', 'other');
CREATE TYPE review_sentiment AS ENUM ('positive', 'neutral', 'negative');

CREATE TABLE external_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    platform external_platform NOT NULL,
    url TEXT NOT NULL,
    sentiment review_sentiment NOT NULL,
    review_date DATE,
    review_content TEXT,
    added_by UUID REFERENCES profiles(id),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes
CREATE INDEX idx_external_reviews_provider ON external_reviews(provider_id);
CREATE INDEX idx_external_reviews_platform ON external_reviews(platform);
```

#### Table: `subscription_history`
Tracks subscription changes for billing and audit.

```sql
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    tier VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('upgrade', 'downgrade', 'renewal', 'cancel')),
    previous_tier VARCHAR(20),
    stripe_subscription_id TEXT,
    amount_myr DECIMAL(10, 2),
    billing_period_start TIMESTAMPTZ,
    billing_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    
    CONSTRAINT fk_provider FOREIGN KEY (provider_id) REFERENCES providers(id)
);

-- Indexes
CREATE INDEX idx_subscription_history_provider ON subscription_history(provider_id);
CREATE INDEX idx_subscription_history_date ON subscription_history(created_at DESC);
```

### 6.2 Existing Table Modifications

#### Alter `providers` Table

```sql
-- Tier and subscription fields
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
ADD COLUMN IF NOT EXISTS tier_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tier_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Compliance and moderation fields
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS communication_violations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Limits
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS client_limit INTEGER DEFAULT 10;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_providers_tier ON providers(tier);
CREATE INDEX IF NOT EXISTS idx_providers_suspended ON providers(is_suspended) WHERE is_suspended = true;
```

### 6.3 Data Migration Strategy

1. **Existing providers**: Set all to `tier = 'free'`
2. **Client count**: Calculate from existing bookings, set `client_limit` accordingly
3. **Alerts**: None initially, alerts created going forward
4. **Assets**: None initially, migrate any existing photos to new structure

---

## 7. Interface Requirements

### 7.1 User Interfaces

#### 7.1.1 Onboarding Wizard (`/pro/onboarding`)

**Step 1 - Basic Info:**
```
┌─────────────────────────────────────────────┐
│  Build Your Profile                    [1/2]│
├─────────────────────────────────────────────┤
│                                             │
│  Display Name *                             │
│  [________________________]                 │
│  This is how clients will find you         │
│                                             │
│  State *            Area/District *        │
│  [Selangor    ▼]  [________________]       │
│                                             │
│            [Continue →]                    │
│                                             │
└─────────────────────────────────────────────┘
```

**Step 2 - Service:**
```
┌─────────────────────────────────────────────┐
│  Add Your First Service                [2/2]│
├─────────────────────────────────────────────┤
│                                             │
│  Service Name *                             │
│  [e.g., Bridal Makeup___________]          │
│                                             │
│  Price (MYR) *                              │
│  [150_______]                              │
│                                             │
│  [Skip for now]  [Go Live →]                │
│                                             │
└─────────────────────────────────────────────┘
```

#### 7.1.2 Artist Dashboard (`/pro`)

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Leish Pro                                    [≡]    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Welcome back, Sarah!                        [⚡ Upgrade]│
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐     │
│  │ Bookings   │  │ Earnings   │  │ Views      │     │
│  │ 5 upcoming │  │ RM2,450    │  │ 234 this   │     │
│  │            │  │ this month │  │ month      │     │
│  └────────────┘  └────────────┘  └────────────┘     │
│                                                      │
│  Profile 65% Complete                     [Complete]  │
│  [████████░░░░░░░░░░]                                │
│                                                      │
│  [📋 Manage Bookings]  [📸 Upload Photos]           │
│  [📅 Set Availability]  [⚙️ Edit Profile]             │
│                                                      │
└──────────────────────────────────────────────────────┘
```

#### 7.1.3 Admin Provider Management (`/admin/providers`)

**Provider List:**
```
┌──────────────────────────────────────────────────────┐
│  Admin Dashboard                            [👤]   │
├──────────────────────────────────────────────────────┤
│  Providers (342)                            [Filter] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [All] [🔴 With Alerts] [⭐ Pro] [⏸️ Suspended]      │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🟡 Aisyah Makeup    KL, Selangor    Free      │ │
│  │    2 alerts                    [View] [Flag]  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │   Sarah Beauty      PJ, Selangor      Pro     │ │
│  │    Active                      [View] [Flag]  │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ 🔴 Bad Artist       KL City        Free       │ │
│  │    Suspended - Low rating     [View]        │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 7.2 API Endpoints

#### 7.2.1 Onboarding API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/onboarding/artist-quick` | POST | Required | Create minimal artist profile |
| `/api/onboarding/validate-slug` | GET | Public | Check display name availability |

**Request: POST /api/onboarding/artist-quick**
```json
{
  "displayName": "Sarah Beauty",
  "state": "Selangor",
  "district": "Petaling Jaya",
  "service": {
    "name": "Bridal Makeup",
    "priceMyr": 299,
    "durationMinutes": 120
  },
  "profilePhoto": "base64encoded..." // optional
}
```

**Response: 201 Created**
```json
{
  "success": true,
  "providerId": "uuid",
  "slug": "sarah-beauty-a1b2",
  "redirectUrl": "/pro?onboarded=1"
}
```

#### 7.2.2 Photo Management API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/provider/assets` | POST | Required | Upload new photo |
| `/api/provider/assets` | GET | Required | List all photos |
| `/api/provider/assets/:id` | DELETE | Required | Delete photo |
| `/api/provider/assets/:id/primary` | PATCH | Required | Set as primary |
| `/api/provider/assets/reorder` | PATCH | Required | Reorder photos |

#### 7.2.3 Subscription API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/subscription/checkout` | POST | Required | Create Stripe checkout session |
| `/api/subscription/cancel` | POST | Required | Cancel subscription |
| `/api/subscription/portal` | POST | Required | Stripe customer portal |
| `/api/subscription/webhook` | POST | Stripe | Stripe webhook handler |
| `/api/subscription/status` | GET | Required | Get current subscription status |

#### 7.2.4 Admin Alert API

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/provider-alerts` | GET | Admin | List all alerts with filters |
| `/api/admin/provider-alerts` | POST | Admin | Create manual alert |
| `/api/admin/provider-alerts/:id` | PATCH | Admin | Update alert status |
| `/api/admin/provider-alerts/:id` | DELETE | Admin | Delete alert |
| `/api/admin/providers/:id/suspend` | POST | Admin | Suspend provider |
| `/api/admin/providers/:id/activate` | POST | Admin | Reactivate provider |
| `/api/admin/providers/:id/alerts` | GET | Admin | Get provider alert history |

---

## 8. Business Rules

### 8.1 Registration Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-001 | Email verification required before onboarding | Supabase Auth `email_confirm` check |
| BR-002 | Display name must be unique | Slug uniqueness constraint in DB |
| BR-003 | At least one service required to go live | API validation before provider creation |
| BR-004 | Profile auto-active after onboarding | `is_active = true` on insert |
| BR-005 | All artists start on Free tier | `tier = 'free'` default |
| BR-006 | Artists must be 18+ to register | Terms acceptance checkbox |

### 8.2 Tier Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-007 | Commission rate locked at booking time | Store `commission_rate` on booking row |
| BR-008 | Pro features disabled immediately on downgrade | Check `tier` column in feature gates |
| BR-009 | Excess clients (>10) must reduce within 30 days of downgrade | Email reminders at 7, 14, 30 days |
| BR-010 | Excess services auto-deactivate on downgrade | Background job on downgrade |
| BR-011 | Free tier limited to 5 active services | API validation on service create |
| BR-012 | Free tier limited to 20 photos | Upload validation check |

### 8.3 Alert Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-013 | Suspended artists hidden from search | `is_active = true AND is_suspended = false` in queries |
| BR-014 | Suspended artists cannot receive new bookings | API validation on booking creation |
| BR-015 | Existing bookings proceed normally when suspended | Only block new bookings, not existing |
| BR-016 | High severity alerts require admin action within 24 hours | SLA tracking in admin dashboard |
| BR-017 | Auto-alerts created by system, manual by admins | `created_by` null for auto, set for manual |
| BR-018 | Alert audit trail immutable | Append-only log table |

### 8.4 Commission Rules

| ID | Rule | Enforcement |
|----|------|-------------|
| BR-019 | Commission calculated on total booking amount | Sum of all service prices |
| BR-020 | Commission rounded to 2 decimal places | `ROUND(amount, 2)` |
| BR-021 | Refunds reverse commission proportionally | Calculate % refund, reverse same % commission |
| BR-022 | Artist receives net amount after commission | Payout = Gross - Commission |

---

## 9. Acceptance Criteria

### Phase 1: Quick Onboarding (Critical Priority)

| AC | Criteria | Test Method |
|----|----------|-------------|
| 1.1 | 2-step onboarding wizard implemented | UI test |
| 1.2 | Step 1 accepts name, state, district | Unit test |
| 1.3 | Step 2 accepts at least one service | Unit test |
| 1.4 | Profile goes live immediately after Step 2 | E2E test |
| 1.5 | Auto-generated slug is unique | Integration test |
| 1.6 | Optional fields editable in dashboard | UI test |
| 1.7 | Progress indicator shows completion % | Visual test |
| 1.8 | Total onboarding time < 2 minutes | Performance test |
| 1.9 | Duplicate name handling with suggestions | Unit test |
| 1.10 | Mobile-responsive onboarding flow | Responsive test |

### Phase 2: Photo Management (High Priority)

| AC | Criteria | Test Method |
|----|----------|-------------|
| 2.1 | Profile photo upload during onboarding | UI test |
| 2.2 | Photo upload in dashboard anytime | UI test |
| 2.3 | Supported formats: JPG, PNG, WebP | Unit test |
| 2.4 | Max file size 5MB enforced client and server | Unit test |
| 2.5 | Auto-thumbnail generation on upload | Integration test |
| 2.6 | Portfolio gallery with 20/50 limits | Unit test |
| 2.7 | Drag-drop reordering functional | UI test |
| 2.8 | Primary image selection works | UI test |
| 2.9 | Photo deletion with confirmation | UI test |
| 2.10 | Supabase Storage integration | Integration test |

### Phase 3: Subscription System (High Priority)

| AC | Criteria | Test Method |
|----|----------|-------------|
| 3.1 | Free tier 10% commission applied | Unit test |
| 3.2 | Pro tier 5% commission applied | Unit test |
| 3.3 | Pro pricing RM99/month, RM999/year | Config test |
| 3.4 | Stripe Checkout integration | Integration test |
| 3.5 | 14-day free trial for new subscribers | Unit test |
| 3.6 | Tier upgrade immediate on payment | E2E test |
| 3.7 | Tier downgrade at end of billing period | Unit test |
| 3.8 | Commission locked at booking time | Unit test |
| 3.9 | Feature gates based on tier | Unit test |
| 3.10 | Billing history tracked | Integration test |

### Phase 4: Admin Alerts (Medium Priority)

| AC | Criteria | Test Method |
|----|----------|-------------|
| 4.1 | Auto-alert on rating < 3.0 | Unit test |
| 4.2 | Auto-alert on 3+ complaints in 30 days | Unit test |
| 4.3 | Manual alert creation by admins | UI test |
| 4.4 | Alert types: low_rating, complaint, etc. | Unit test |
| 4.5 | Severity levels: Low, Medium, High | Unit test |
| 4.6 | Alert dashboard with filters | UI test |
| 4.7 | Provider suspend action | Integration test |
| 4.8 | Provider activate action | Integration test |
| 4.9 | Alert resolution with notes | UI test |
| 4.10 | Email notifications for High severity | Integration test |

---

## 10. Dependencies

### 10.1 Technical Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.x | Web framework |
| React | 19.x | UI library |
| Supabase | Latest | Database, Auth, Storage |
| Stripe | Latest | Payment processing |
| Tailwind CSS | v4 | Styling |
| TypeScript | 5.x | Type safety |
| Zod | Latest | Validation |

### 10.2 External Dependencies

| Dependency | Service | Purpose |
|------------|---------|---------|
| Stripe API | Payment Gateway | Subscription billing |
| Supabase Storage | Object Storage | Photo storage |
| SendGrid/AWS SES | Email Service | Transactional emails |
| Vercel | Hosting | Application deployment |

### 10.3 Internal Dependencies

| Dependency | Component | Impact |
|------------|-----------|--------|
| Existing Auth System | Supabase Auth | Must integrate seamlessly |
| Booking System | Existing | Commission calculation integration |
| Provider Schema | Database | Migration required |
| Admin Dashboard | Existing | Add alert management section |

### 10.4 Critical Path Dependencies

1. **Stripe Account Setup** → Required for Phase 3
   - Malaysia business registration
   - Bank account verification
   - Webhook endpoint configuration

2. **Supabase Storage Configuration** → Required for Phase 2
   - Bucket creation
   - RLS policies setup
   - CDN configuration

3. **Email Service Configuration** → Required for Phase 4
   - Domain verification
   - Template setup
   - API keys configuration

---

## 11. Risks and Mitigations

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Low onboarding completion rate | Medium | High | Analytics tracking, A/B testing step counts, simplify further if <70% completion | Product |
| Photo storage costs exceed budget | Medium | Medium | Compression, tier limits, CDN optimization, monitor usage weekly | Tech |
| Commission calculation errors | Low | High | Unit tests, audit logs, reconciliation reports, manual verification | Tech |
| Admin alert fatigue | Medium | Medium | Severity filtering, digest emails, auto-escalation rules, weekly review | Operations |
| Stripe integration delays | Medium | High | Start integration early, use Stripe test mode, have fallback for manual tier assignment | Tech |
| Artist confusion about tiers | Medium | Medium | Clear comparison table, tooltips, FAQ section, support documentation | Product |
| Mobile onboarding issues | Medium | Medium | Mobile-first design, test on real devices, responsive breakpoints | UX |
| Data migration errors | Low | High | Backup before migration, dry-run tests, rollback plan, verification scripts | Tech |
| Performance degradation | Low | High | Load testing, CDN, database indexing, caching strategies | Tech |
| Compliance violations | Low | Critical | Legal review, PDPA compliance checklist, data encryption, audit trails | Legal |

---

## 12. Glossary

| Term | Definition |
|------|------------|
| **MUA** | Makeup Artist - professional providing makeup services |
| **Free Tier** | Entry-level subscription with basic features and 10% commission |
| **Pro Tier** | Premium subscription with advanced features and 5% commission |
| **Commission** | Platform fee deducted from artist earnings per booking |
| **Provider** | Generic term for artist or studio in the system |
| **Slug** | URL-friendly identifier (e.g., "sarah-beauty-kuala-lumpur") |
| **RLS** | Row-Level Security - Supabase feature for data access control |
| **Onboarding** | Process of registering and setting up a new artist profile |
| **Progressive Profile** | Profile that can be completed over time, not all at once |
| **Alert** | Notification to admin about artist requiring attention |
| **Tier** | Subscription level (Free or Pro) determining features and commission |
| **Payout** | Payment to artist after commission deduction |
| **CDN** | Content Delivery Network - fast image delivery |
| **Availability** | Time slots when artist is available for bookings |
| **Service** | Specific makeup offering (e.g., "Bridal Makeup") |
| **Client** | Customer who books artist services |
| **Booking** | Confirmed appointment between client and artist |

---

## 13. Appendices

### Appendix A: Database Schema Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    profiles     │     │    providers     │     │ provider_assets │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │────<│ owner_id (FK)    │────<│ provider_id(FK) │
│ role            │     │ id (PK)          │     │ url             │
│ full_name       │     │ display_name     │     │ asset_type      │
│ email           │     │ slug             │     │ is_primary      │
│ phone           │     │ state            │     └─────────────────┘
│ subscription_   │     │ district         │              │
│   tier          │     │ tier             │              │
└─────────────────┘     │ is_active        │              │
                        │ is_suspended     │     ┌─────────────────┐
                        └──────────────────┘     │ external_reviews│
                                 │               ├─────────────────┤
                                 │               │ provider_id(FK) │
                        ┌────────▼──────┐        │ platform        │
                        │ provider_     │        │ sentiment       │
                        │ alerts        │        │ url             │
                        ├───────────────┤        └─────────────────┘
                        │ provider_id   │
                        │ alert_type    │
                        │ severity      │
                        │ status        │
                        └───────────────┘
```

### Appendix B: API Response Examples

See Section 7.2 for full API documentation.

### Appendix C: Wireframes

Detailed wireframes available in Figma:
- [Onboarding Flow](https://figma.com/leish/onboarding)
- [Dashboard Design](https://figma.com/leish/dashboard)
- [Admin Panel](https://figma.com/leish/admin)

### Appendix D: Testing Strategy

**Unit Tests:** Jest + React Testing Library
- Component rendering
- Hook behavior
- Utility functions
- Commission calculations

**Integration Tests:** Playwright
- API endpoints
- Database operations
- Stripe webhooks
- File uploads

**E2E Tests:** Playwright
- Complete onboarding flow
- Subscription upgrade
- Alert creation and resolution
- Mobile responsiveness

**Performance Tests:** k6
- Load testing for concurrent users
- API endpoint performance
- Database query optimization

### Appendix E: Rollback Plan

**If Critical Issues Detected:**

1. **Onboarding Issues:**
   - Revert to existing 4-step wizard
   - Disable quick onboarding toggle
   - Preserve completed profiles

2. **Payment Issues:**
   - Disable Pro tier signup
   - Manual tier assignment for existing Pro users
   - Fix and retest before re-enabling

3. **Alert System Issues:**
   - Disable auto-alerts temporarily
   - Continue with manual alerts only
   - Fix and re-enable auto-alerts

4. **Data Migration Issues:**
   - Restore from pre-migration backup
   - Fix migration scripts
   - Retry with verification

---

## Document Approval

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Product Owner | | | |
| Tech Lead | | | |
| UX Designer | | | |
| QA Lead | | | |
| Operations Manager | | | |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 17 Apr 2026 | AI Assistant | Initial comprehensive URS |

---

**End of Document**

---

**Next Steps:**
1. Review and approve URS with stakeholders
2. Create technical specification based on this URS
3. Begin Phase 1 development (Quick Onboarding)
4. Set up project tracking in Jira/Linear
5. Schedule weekly sprint reviews

**Document Owner:** Product Team  
**Review Cycle:** Monthly or upon major feature change  
**Distribution:** Internal teams, stakeholders
