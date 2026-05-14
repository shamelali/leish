# 🏢 Studio Owner User Flow

Complete journey for a new studio owner from signup to accepting bookings.

---

## 📍 Entry Points

### Option 1: Direct Signup

- URL: [https://www.leish.my/sign-in](https://www.leish.my/sign-in)

### Option 2: MUA/Studio Registration Page

- URL: [https://www.leish.my/mua](https://www.leish.my/mua)

---

## 📝 Step-by-Step Flow

### Step 1: Landing Page

**URL**: [https://www.leish.my](https://www.leish.my)

User sees:

- Hero section with CTA "Browse Artists" / "List Your Business"
- Navigation: Artists | Studios | Sign In

**Action**: Click "Sign In" or "List Your Business"

---

### Step 2: Sign In / Sign Up

**URL**: [https://www.leish.my/sign-in](https://www.leish.my/sign-in)

Current UI shows:

- Email input
- Password input
- Sign In button
- "Don't have an account? Sign up" link

**For Studio Owner**: Click "Sign up" → Select role

---

### Step 3: Role Selection (Needs Implementation)

During signup, user must select role:

```text
┌─────────────────────────────────────────┐
│  Create Your Account                    │
│                                         │
│  Email: [________________]              │
│  Password: [________________]           │
│  Full Name: [________________]          │
│                                         │
│  I am a:                                │
│  ○ Customer (Book services)             │
│  ● Studio Owner / MUA (Offer services)  │
│                                         │
│  [Create Account]                       │
└─────────────────────────────────────────┘
```

**Role stored in**: `profiles.role` = `studio_manager` or `artist`

---

### Step 4: Email Verification

Supabase sends verification email:

- From: `hello@leish.my`
- Subject: "Verify your email address"
- Link: `https://www.leish.my/auth/callback?token=xxx`

**Action**: User clicks verification link

---

### Step 5: Profile Setup

After verification, redirect to:

- URL: [https://www.leish.my/pro/profile](https://www.leish.my/pro/profile)

**Pro Dashboard - Profile Tab**:

```text
┌─────────────────────────────────────────┐
│  Complete Your Studio Profile           │
│                                         │
│  Studio Information                     │
│  ─────────────────                      │
│  Studio Name: [________________]        │
│  Slug: [studio-name]                    │
│  State: [Selangor ▼]                    │
│  District: [Petaling Jaya ▼]            │
│  Address: [________________]            │
│                                         │
│  About Your Studio                      │
│  [Tell customers about your space,      │
│   team, and specialties... ]            │
│                                         │
│  Specialties:                           │
│  ☑ Bridal    ☑ Event    ☑ Photoshoot    │
│  ☑ Editorial ☑ Natural  ☑ Glam          │
│                                         │
│  Hourly Rate: MYR [_______]             │
│                                         │
│  [Save Profile]                         │
└─────────────────────────────────────────┘
```

**Data saved to**:

- `profiles` - User info
- `providers` - Studio details

---

### Step 6: Add Services

**URL**: [https://www.leish.my/pro/services](https://www.leish.my/pro/services) (or profile page)

```text
┌─────────────────────────────────────────┐
│  Your Services                          │
│  [+ Add New Service]                    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Bridal Package      MYR 1,200   │    │
│  │ Duration: 3 hours               │    │
│  │ [Edit] [Delete]                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Event Makeup        MYR 450     │    │
│  │ Duration: 90 mins               │    │
│  │ [Edit] [Delete]                 │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

**Add Service Modal**:

```text
Service Name: [Bridal Makeup]
Duration: [180] minutes
Price: MYR [850]
Description: [Complete bridal makeup...]

[Save Service]
```

**Data saved to**: `services` table

---

### Step 7: Set Availability

**URL**: [https://www.leish.my/pro/availability](https://www.leish.my/pro/availability)

```text
┌─────────────────────────────────────────┐
│  Your Availability Schedule             │
│                                         │
│  March 2026                             │
│  Su Mo Tu We Th Fr Sa                   │
│       1   2   3   4   5   6   7         │
│   8   9  10  11  12  13  14             │
│  15  16  17  18  19  20  21             │
│  22  23  24  25  26  27  28             │
│  29  30  31                             │
│                                         │
│  Selected Date: March 15, 2026          │
│                                         │
│  Available Times:                       │
│  ☑ 10:00 AM - 12:00 PM                  │
│  ☑ 02:00 PM - 04:00 PM                  │
│  ☑ 04:00 PM - 06:00 PM                  │
│                                         │
│  [+ Add Time Slot] [Save Changes]       │
└─────────────────────────────────────────┘
```

**Data saved to**: `availability_slots` table

---

### Step 8: Connect Payment (Billplz)

**URL**: [https://www.leish.my/pro/payments](https://www.leish.my/pro/payments)

```text
┌─────────────────────────────────────────┐
│  Payment Settings                       │
│                                         │
│  Current Status: ✅ Active              │
│  Payment Gateway: Billplz               │
│                                         │
│  Your Collections:                      │
│  ─────────────────                      │
│  Full Payment Collection                │
│  ID: z2d0ltfs                           │
│  Status: Active                         │
│                                         │
│  Deposit Collection                     │
│  ID: ogf1esbw                           │
│  Status: Active                         │
│                                         │
│  [View Billplz Dashboard]               │
└─────────────────────────────────────────┘
```

**Note**: Payment is handled at platform level. Studio owners receive payouts.

---

### Step 9: Go Live

**Studio Profile Page**: `https://www.leish.my/studios/[studio-slug]`

```text
┌─────────────────────────────────────────┐
│  ✨ Studio One                          │
│  ⭐ 4.9 (23 reviews)                    │
│  📍 Kuala Lumpur, Bukit Bintang         │
│                                         │
│  Professional makeup studio...          │
│                                         │
│  💄 Services                            │
│  ─────────────────                      │
│  Bridal Package    MYR 1,200   [Book]   │
│  Event Makeup      MYR 450     [Book]   │
│                                         │
│  📅 Next Available: Tomorrow, 10:00 AM  │
│                                         │
│  [Book Appointment]                     │
└─────────────────────────────────────────┘
```

---

## 📊 Dashboard Overview

**URL**: [https://www.leish.my/pro](https://www.leish.my/pro)

```text
┌─────────────────────────────────────────┐
│  Pro Dashboard          [Notifications] │
│  Welcome back, Studio One               │
│                                         │
│  Stats Overview                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │ MYR 12K │ │   8     │ │   4.9   │    │
│  │ Revenue │ │ Bookings│ │ Rating  │    │
│  └─────────┘ └─────────┘ └─────────┘    │
│                                         │
│  Upcoming Bookings                      │
│  ─────────────────                      │
│  Today, 2:00 PM    Bridal    Sarah L.   │
│  Tomorrow, 10:00AM Event     Michelle T.│
│                                         │
│  [View All Bookings]                    │
└─────────────────────────────────────────┘
```

---

## 🔔 Notification Flow

### New Booking Received

```text
Email: hello@leish.my -> studio@example.com
Subject: New Booking - BK-12345

You have a new booking.

Service: Bridal Makeup
Date: March 15, 2026 at 10:00 AM
Customer: Sarah Lee
Amount: MYR 850 (Full Payment)

[View Booking Details]
```

### Payment Received

```text
Subject: Payment Received - MYR 850

Payment confirmed via Billplz.
Booking Reference: BK-12345
Amount: MYR 850
Status: Paid

The customer has completed payment.
```

---

## 🗺️ Navigation Structure

```text
/pro                    -> Dashboard (overview)
/pro/profile            -> Edit studio profile
/pro/services           -> Manage services
/pro/availability       -> Set availability
/pro/bookings           -> View all bookings
/pro/payments           -> Payment history
/pro/reviews            -> Customer reviews
```

---

## ⚙️ Technical Implementation

### Database Tables Used

| Table | Purpose |
| ----- | ------- |
| `profiles` | User account info, role |
| `providers` | Studio/artist details |
| `services` | Service offerings |
| `availability_slots` | Bookable time slots |
| `bookings` | Customer bookings |
| `payments` | Payment records |

### API Endpoints

| Endpoint | Method | Purpose |
| -------- | ------ | ------- |
| `/api/providers` | GET/POST | List/create providers |
| `/api/services` | GET/POST | List/create services |
| `/api/availability` | GET/POST | Manage availability |
| `/api/bookings` | GET/PATCH | View/update bookings |
| `/api/payments/status` | GET | Check payment status |

---

## ✅ Completion Checklist

Studio owner can accept bookings when:

- [x] Account created with role = `studio_manager`
- [x] Profile completed (name, location, bio)
- [x] At least 1 service added with price
- [x] Availability slots created
- [x] Payment gateway active (Billplz)
- [x] Public profile page live

---

## 🔗 Quick Links for Testing

| Step | URL |
| ---- | --- |
| Homepage | [https://www.leish.my](https://www.leish.my) |
| Sign In | [https://www.leish.my/sign-in](https://www.leish.my/sign-in) |
| Pro Dashboard | [https://www.leish.my/pro](https://www.leish.my/pro) |
| Artists List | [https://www.leish.my/artists](https://www.leish.my/artists) |
| Studios List | [https://www.leish.my/studios](https://www.leish.my/studios) |

---

## 🐛 Known Issues

### Issue: 404 on Artist Profile

**Cause**: `app/artists/[slug]/page.tsx` uses mock data (`lib/data`) instead of database.

**Fix Needed**: Update to fetch from Supabase:

```typescript
// Currently:
const artist = getArtistBySlug(slug) // Mock data

// Should be:
const artist = await dbArtistService.getBySlug(slug) // Database
```

**Workaround**: Use existing seeded data:

- Artist: [https://www.leish.my/artists/aiko-nakamura](https://www.leish.my/artists/aiko-nakamura)
- Studio: [https://www.leish.my/studios/maison-leish](https://www.leish.my/studios/maison-leish)
