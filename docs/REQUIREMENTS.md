# Carpool App — Product Requirements

**Status:** Draft v0.1 · **Date:** 2026-11-13

---

## 1. Overview

### 1.1 Problem
People who travel the same route regularly (commuters, school runs, office campuses, events) waste money and time driving alone. Coordinating shared rides today happens over WhatsApp groups and spreadsheets: it's hard to see who is driving when, seats get double-booked, splitting fuel costs is awkward, and there is no safety or trust layer.

### 1.2 Vision
A simple mobile app where drivers offer seats on trips they're already making, riders find and book those seats, and the group shares costs fairly — with trust and safety built in.

### 1.3 Goals
| # | Goal | Measure of success |
|---|------|--------------------|
| G1 | Make it fast to offer or find a ride | Offer a ride in < 60 s; find & book in < 3 taps from search results |
| G2 | Make recurring commutes effortless | ≥ 50% of active users have a recurring ride |
| G3 | Fair, friction-free cost sharing | ≥ 90% of trips settled within 7 days |
| G4 | Riders and drivers feel safe | Avg. rating ≥ 4.5; < 1% trips with safety reports |

### 1.4 Non-goals (v1)
- Not a commercial taxi / ride-hailing service (no professional drivers, no profit for drivers — cost-sharing only).
- No on-demand "car in 5 minutes" dispatch.
- No autonomous route optimization across a whole fleet.

---

## 2. Users & Personas

| Persona | Description | Key needs |
|---------|-------------|-----------|
| **Driver** – "Priya, daily commuter" | Drives 25 km to office, has 3 empty seats | Offset fuel/toll costs, low effort, choose who rides |
| **Rider** – "Arjun, no car" | Needs a reliable way to work | Find rides near home, predictable schedule, know who's driving |
| **Group admin** – "HR / school coordinator" | Runs a carpool program for a company, campus or school | Private group, verify members, see participation |
| **Parent** – school run | Rotates driving kids with other parents | Fair rotation schedule, kid-safety, notifications |

A single user can be both a driver and a rider.

---

## 3. Scope by Release

| Release | Theme | Contents |
|---------|-------|----------|
| **MVP (v1)** | Core carpool loop | Accounts, profiles, vehicles, offer ride, search & book, recurring rides, in-app chat, notifications, cost split (record only), ratings, basic safety |
| **v1.1** | Payments & groups | In-app payments/wallet, private groups (company/school), group verification by email domain |
| **v2** | Smarts & scale | Live trip tracking, route-matching suggestions, driver rotation scheduler, rewards / CO₂ stats, admin analytics dashboard, web app |

Priority tags below: **P0** = MVP must-have, **P1** = v1.1, **P2** = v2.

---

## 4. Functional Requirements

### 4.1 Account & Onboarding
| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-1 | Sign up / log in with phone number (OTP) | P0 |
| AUTH-2 | Sign in with Google / Apple | P0 |
| AUTH-3 | Email verification (used for work/school group membership) | P1 |
| AUTH-4 | Log out, delete account (with data deletion) | P0 |
| AUTH-5 | Onboarding: choose role(s) — driver, rider, or both; set home & work/school locations | P0 |

### 4.2 Profile & Vehicle
| ID | Requirement | Priority |
|----|-------------|----------|
| PROF-1 | Profile: name, photo, gender (optional), short bio, languages, preferences (music, smoking, pets, chattiness) | P0 |
| PROF-2 | Public profile view showing rating, trips completed, verification badges, member since | P0 |
| PROF-3 | Verification badges: phone, email, government ID, driver's license | P0 (phone) / P1 (ID, license) |
| VEH-1 | Add one or more vehicles: make, model, color, plate number, seat count, photo | P0 |
| VEH-2 | Driver must have ≥ 1 vehicle before offering a ride | P0 |
| PROF-4 | Emergency contacts (1–3) | P0 |

### 4.3 Offer a Ride (Driver)
| ID | Requirement | Priority |
|----|-------------|----------|
| OFFER-1 | Create a ride: origin, destination, optional stopovers, date, departure time, seats available, vehicle | P0 |
| OFFER-2 | Map-based address search with autocomplete; save favorite places (Home, Work) | P0 |
| OFFER-3 | Suggested price per seat based on distance + fuel cost; driver can adjust within a cap (enforces cost-sharing, not profit) | P0 |
| OFFER-4 | Recurring rides: repeat on chosen weekdays, with end date or indefinitely; edit/cancel single occurrence or series | P0 |
| OFFER-5 | Return trip shortcut (create evening ride from morning ride) | P0 |
| OFFER-6 | Booking mode: instant booking or manual approval | P0 |
| OFFER-7 | Ride rules: women-only, max 2 in back, luggage size, detour tolerance | P1 |
| OFFER-8 | Edit or cancel a ride; all booked riders notified; cancellation reason required | P0 |
| OFFER-9 | Visibility: public, or restricted to a private group | P1 |

### 4.4 Find & Book a Ride (Rider)
| ID | Requirement | Priority |
|----|-------------|----------|
| FIND-1 | Search by origin, destination, date, (optional) time window and seats needed | P0 |
| FIND-2 | Match rides whose route passes within a configurable radius (default 2 km) of rider's pickup and drop-off — not only exact origin/destination | P0 |
| FIND-3 | Results list & map view; sort by departure time, price, distance to pickup, rating | P0 |
| FIND-4 | Filters: price, women-only, verified drivers, instant booking, preferences | P1 |
| FIND-5 | Ride detail: driver profile, vehicle, route on map, pickup point, seats left, price, rules | P0 |
| BOOK-1 | Request/book seat(s); choose pickup & drop-off points along the route | P0 |
| BOOK-2 | Book a recurring seat (e.g., every Mon–Fri on a recurring ride) | P0 |
| BOOK-3 | Driver accepts/declines requests (manual mode); request auto-expires after N hours | P0 |
| BOOK-4 | Rider cancels booking; cancellation policy shown up front | P0 |
| BOOK-5 | Seat inventory is consistent — no overbooking under concurrent requests | P0 |
| FIND-6 | Ride alerts: "notify me when a ride matching this route is posted" | P1 |
| FIND-7 | Ride request board: riders post a need, drivers can respond | P2 |

### 4.5 Trip Day / During Ride
| ID | Requirement | Priority |
|----|-------------|----------|
| TRIP-1 | Reminders before departure (default 1 h and 15 min) | P0 |
| TRIP-2 | Driver taps "Start trip" / "End trip"; riders confirm pickup | P0 |
| TRIP-3 | "Running late" quick message with ETA | P0 |
| TRIP-4 | Navigation hand-off to Google Maps / Apple Maps / Waze | P0 |
| TRIP-5 | Live location sharing of driver to booked riders (only while trip active) | P2 |
| TRIP-6 | No-show reporting (driver or rider) | P0 |

### 4.6 Communication
| ID | Requirement | Priority |
|----|-------------|----------|
| CHAT-1 | 1:1 in-app chat between driver and each rider after booking request | P0 |
| CHAT-2 | Group chat for each ride (driver + all booked riders) | P1 |
| CHAT-3 | Masked calling (phone numbers not revealed) | P1 |
| CHAT-4 | Block and report from chat | P0 |

### 4.7 Notifications
| ID | Requirement | Priority |
|----|-------------|----------|
| NOTIF-1 | Push notifications for: booking request, accept/decline, cancellation, ride changes, new message, trip reminders, payment due/received, rating prompt | P0 |
| NOTIF-2 | Email/SMS fallback for critical events (cancellations within 2 h) | P1 |
| NOTIF-3 | User-configurable notification preferences | P0 |

### 4.8 Cost Sharing & Payments
| ID | Requirement | Priority |
|----|-------------|----------|
| PAY-1 | Each booking shows price per seat; app records what each rider owes per trip | P0 |
| PAY-2 | Running balance per driver–rider pair ("Arjun owes you ₹450 for 6 trips"); mark as settled (cash/UPI/external) | P0 |
| PAY-3 | Split options: per seat (default), split equally by riders, or distance-based | P1 |
| PAY-4 | In-app payments (card, UPI, wallet) via payment provider (e.g., Stripe / Razorpay); payment held until trip completes | P1 |
| PAY-5 | Driver payouts to bank account; payout history | P1 |
| PAY-6 | Receipts and monthly statement (useful for employer commuter benefits) | P1 |
| PAY-7 | Refunds per cancellation policy | P1 |
| PAY-8 | Toll & parking add-ons split among riders | P2 |

### 4.9 Ratings & Reviews
| ID | Requirement | Priority |
|----|-------------|----------|
| RATE-1 | After each trip, driver and riders rate each other 1–5 stars + optional comment and tags (punctual, safe driving, friendly) | P0 |
| RATE-2 | Reviews are visible only after both sides submit, or after 7 days | P1 |
| RATE-3 | Recurring rides: prompt rating weekly, not after every trip | P0 |

### 4.10 Safety & Trust
| ID | Requirement | Priority |
|----|-------------|----------|
| SAFE-1 | SOS button during an active trip: calls local emergency number and alerts emergency contacts with live location | P0 |
| SAFE-2 | Share trip details (driver, car, plate, route, ETA) with a contact via link | P0 |
| SAFE-3 | Report a user (categories: unsafe driving, harassment, no-show, fraud, other) → moderation queue | P0 |
| SAFE-4 | Block users; blocked users never see each other's rides | P0 |
| SAFE-5 | Women-only rides option, available only to verified women users | P1 |
| SAFE-6 | ID & driving-license verification via a KYC provider | P1 |
| SAFE-7 | Automatic suspension after repeated reports pending review | P1 |
| SAFE-8 | Community guidelines & terms accepted at signup | P0 |

### 4.11 Groups (Company / School / Community)
| ID | Requirement | Priority |
|----|-------------|----------|
| GRP-1 | Create a private group; join by invite link, code, or verified email domain (e.g., @company.com) | P1 |
| GRP-2 | Rides can be posted to a group only (visible to members) | P1 |
| GRP-3 | Group admins: approve/remove members, pin announcements | P1 |
| GRP-4 | Rotation scheduler: members of a group take turns driving on a schedule; app shows "whose turn" and balances fairness | P2 |
| GRP-5 | Group dashboard: active members, trips, CO₂ saved | P2 |

### 4.12 History, Stats & Engagement
| ID | Requirement | Priority |
|----|-------------|----------|
| HIST-1 | My Rides: upcoming, past, cancelled (as driver and rider) | P0 |
| HIST-2 | Personal stats: trips, km shared, money saved, CO₂ saved | P2 |
| HIST-3 | Referral program / invite friends | P2 |

### 4.13 Admin / Back-office (web)
| ID | Requirement | Priority |
|----|-------------|----------|
| ADM-1 | Search users, rides, bookings; view details | P0 |
| ADM-2 | Moderation queue for reports; actions: warn, suspend, ban, refund | P0 |
| ADM-3 | Verify ID/license documents (manual fallback) | P1 |
| ADM-4 | Configure pricing caps, cancellation policy, search radius | P1 |
| ADM-5 | Analytics: DAU/MAU, rides posted, booking rate, fill rate, cancellations | P2 |
| ADM-6 | Audit log of admin actions | P0 |

---

## 5. Key User Flows

1. **Driver offers a commute:** Onboard → add vehicle → "Offer ride" → Home → Work, 8:30 AM, Mon–Fri, 3 seats → accept suggested price → publish → (optional) create return ride.
2. **Rider books:** Search Home → Work, tomorrow 8–9 AM → results within 2 km → open ride → choose pickup point → request seat (recurring Mon–Fri) → driver approves → chat opens.
3. **Trip day:** Reminders → driver starts trip → rider confirms pickup → end trip → amount added to balance / charged → rating prompt.
4. **Cancellation:** Driver cancels a single occurrence → all riders notified with reason → rider sees alternative ride suggestions → refund if prepaid.
5. **Safety incident:** Rider taps SOS → emergency call option + contacts get SMS with live link → incident logged for admin review.

---

## 6. Business Rules

| Rule | Default (configurable) |
|------|------------------------|
| Max price per seat | Fuel cost per km × distance ÷ (seats + 1), × 1.2 cap — prevents profiteering |
| Booking request expiry | 12 h or 1 h before departure, whichever is sooner |
| Rider free cancellation | Up to 2 h before departure; after that 50% charge (when in-app payment enabled) |
| Driver cancellation | Full refund to riders; repeated late cancellations lower driver visibility |
| No-show | Rider no-show → full charge; driver no-show → full refund + flag |
| Min account age to drive | Phone-verified; ID + license verification required in v1.1 |
| Ride posting window | Up to 30 days ahead (recurring rides generate occurrences 4 weeks ahead) |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Platforms** | iOS 16+ and Android 10+ (single codebase); admin as web app |
| **Performance** | Search results < 2 s (p95); app cold start < 3 s; API p95 < 300 ms |
| **Scalability** | Design for 100k users / 10k daily trips without re-architecture |
| **Availability** | 99.5% uptime MVP; 99.9% target v2 |
| **Consistency** | Seat booking must be transactional (no overbooking) |
| **Security** | TLS everywhere; passwords never stored (OTP/OAuth); JWT with short-lived access + refresh tokens; PII encrypted at rest; rate limiting on OTP and search; OWASP Top 10 & MASVS reviewed |
| **Privacy** | Exact home address never shown publicly — show approximate pickup area until booking confirmed; live location only during active trip; GDPR / India DPDP Act compliant: consent, data export, deletion |
| **Payments** | PCI-DSS handled by payment provider; app never stores card numbers |
| **Accessibility** | WCAG 2.1 AA: screen-reader labels, dynamic text size, color contrast |
| **Localization** | Multi-language and multi-currency ready from day 1 (strings externalized) |
| **Offline** | Upcoming ride details & driver contact viewable offline |
| **Observability** | Crash reporting, structured logs, metrics, alerting on error rate |
| **Battery** | Location only used in foreground except during an active trip |

---

## 8. Data Model (high level)

```
User ─┬─< Vehicle
      ├─< Ride (as driver) ─┬─< RideOccurrence ─< Booking >─ User (rider)
      │                     └─< Stopover
      ├─< Booking (as rider)
      ├─< Rating (given / received)
      ├─< EmergencyContact
      ├─< GroupMember >─ Group
      └─< Report

Booking ─< Payment / LedgerEntry
Ride ─< ChatThread ─< Message
```

| Entity | Key fields |
|--------|-----------|
| User | id, name, phone, email, photo, gender?, verification flags, rating_avg, status |
| Vehicle | id, owner_id, make, model, color, plate, seats |
| Ride | id, driver_id, vehicle_id, origin, destination, route_polyline, recurrence_rule, price_per_seat, seats, booking_mode, visibility, group_id? |
| RideOccurrence | id, ride_id, date, departure_time, seats_left, status |
| Booking | id, occurrence_id, rider_id, pickup, dropoff, seats, status, price |
| LedgerEntry | id, booking_id, payer_id, payee_id, amount, currency, status |
| Rating | id, trip_id, from_user, to_user, stars, tags, comment |
| Report | id, reporter_id, reported_id, ride_id?, category, details, status |
| Group | id, name, type, email_domain?, admins |

---

## 9. Suggested Technical Architecture

| Layer | Recommendation | Why |
|-------|---------------|-----|
| Mobile | **React Native (Expo)** or **Flutter** | One codebase for iOS + Android |
| Backend | **Node.js (NestJS)** or **Python (FastAPI)** REST API + WebSocket for chat | Common, well supported |
| Database | **PostgreSQL + PostGIS** | Geospatial route matching ("rides passing near me") |
| Cache / queue | Redis (sessions, rate limits, job queue) | Reminders, request expiry, notifications |
| Auth | Firebase Auth / Supabase Auth / Auth0 | Phone OTP + Google/Apple out of the box |
| Maps | Google Maps Platform (Places, Directions) or Mapbox | Autocomplete, routes, ETAs |
| Push | Firebase Cloud Messaging + APNs | |
| Payments | Stripe (global) / Razorpay (India) | Escrow-like holds, payouts |
| Hosting | AWS / GCP, or Supabase for fastest MVP | |
| Admin | Next.js web app | |

**Fastest MVP path:** Flutter or React Native + Supabase (Postgres + PostGIS + Auth + Realtime chat) + Google Maps + FCM.

---

## 10. Analytics & KPIs

- Activation: % new users who post or book a ride within 7 days
- Liquidity: search → at least one result rate; seat fill rate per ride
- Conversion: ride detail → booking request → confirmed
- Retention: W1 / W4 retention; % users with recurring bookings
- Reliability: cancellation rate (driver vs. rider), no-show rate
- Trust: average rating, reports per 1,000 trips
- Impact: km shared, CO₂ saved

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Chicken-and-egg (no drivers → no riders) | Launch inside one company/campus/neighborhood first (groups); seed with known commuters |
| Legal: drivers seen as commercial operators | Enforce cost-sharing price cap; clear terms; check local regulations |
| Safety incidents | Verification, SOS, ratings, moderation, women-only option |
| Insurance | Clarify in terms that drivers' personal insurance applies; explore partner coverage later |
| Privacy leaks (home address) | Approximate locations until booking confirmed |
| Map / SMS API costs | Cache routes; rate limit OTP; monitor spend |

---

## 12. Milestones (indicative)

| Phase | Duration | Output |
|-------|----------|--------|
| 0. Discovery | 1–2 wks | Confirm open questions, wireframes, tech choices |
| 1. Design | 2 wks | UI designs for MVP flows, design system |
| 2. MVP build | 8–10 wks | Section 4 P0 features, admin basics |
| 3. Pilot | 4 wks | Closed beta with one group (20–100 users), fix & iterate |
| 4. v1.1 | 6 wks | Payments, groups, verification |
| 5. v2 | ongoing | Live tracking, rotation scheduler, analytics |

---

## 13. Open Questions (need your decision)

1. **Who is it for first?** Personal use with friends/coworkers, a specific company/school, or a public app for anyone?
2. **Country/region?** Decides currency, payment provider (UPI/Razorpay vs. Stripe), legal rules, and maps provider.
3. **Money handling in MVP:** just track who owes what (simpler), or real in-app payments?
4. **Platform:** both iOS and Android from day one, or start with one (or a web app/PWA)?
5. **School-run / kids use case** in scope? (Adds guardian accounts and stricter safety.)
6. **Budget & team:** solo developer, or a team? Affects tech choice (e.g., Supabase for speed).
