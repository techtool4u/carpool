# Family & Friends Carpool App: Product Requirements

**Status:** Draft v0.3 (parents, kids and trusted friends) · **Date:** 2026-11-13

---

## 1. Overview

### 1.1 Problem
Parents spend hours each week driving kids to school and after-school classes (music, swimming, sports, tuition). Many families nearby go to the same places at the same times, but sharing the driving is organized through WhatsApp groups and memory:
- Nobody is sure **whose turn** it is, and some parents end up driving more than their share.
- Last-minute changes (sick child, meeting, holiday) cause confusion and missed pickups.
- Parents don't know **when their child was picked up or dropped off**.
- Important child info (allergies, booster seat, emergency contacts) isn't to hand for the driving parent.

The same happens for kids' social life (birthday parties, playdates, movies) and for parents themselves when they share rides with friends to work, events or weekend trips.

### 1.2 Vision
A private app for **your circle: family, other parents and friends**. Parents form carpool groups for school and classes, and the app builds a **fair driving rotation**, shows who's driving today, and sends every parent a **pickup and drop-off notification** for their child. The same trusted circle can organise one-off rides for kids' outings and rides for the adults themselves.

### 1.3 Who it's for
- **Parents, guardians and their trusted friends.** Everything is invite-only: you only ever ride with people in your circle. No public rides, no strangers, no paid drivers.
- Groups can mix parents from the same school with friends and neighbours from anywhere.
- Kids don't have accounts in v1. They're profiles managed by their parents.

### 1.4 Three ways to use it
| Use case | Example | Shape |
|----------|---------|-------|
| **Kids: regular carpools** (core) | School mornings, swimming every Tuesday | Recurring trips, driving rotation, check-ins |
| **Kids: outings with friends** | Riya's birthday party Saturday 4 PM; movie with 3 friends | One-off event, parents offer seats, check-ins |
| **Adults: rides with friends** | Office commute with a neighbour; friends driving to a wedding or weekend trip | Offer / request seats inside your friends circle, optional cost split |

### 1.5 Goals
| # | Goal | Measure of success |
|---|------|--------------------|
| G1 | Everyone always knows who's driving | 0 missed pickups caused by confusion; ≥ 90% of trips confirmed by the driver the day before |
| G2 | Driving is shared fairly | Gap between the most and least driving parent in a group ≤ 1 trip per month |
| G3 | Parents feel their kids are safe | 100% of trips send pickup and drop-off notifications; parent satisfaction ≥ 4.5/5 |
| G4 | Changes are painless | ≥ 80% of swap requests resolved inside the app within 12 h |

| G5 | Easy to organise a one-off ride with friends | Event created and all kids/adults seated in < 3 min |

### 1.6 Non-goals
- Public ride marketplace or matching with unknown people. Only people you've connected with.
- In-app payments or making money from rides. A simple "who owes what" cost split for adult rides only.
- Child accounts, kid-to-kid chat, or anything that collects data directly from children.
- School-bus or professional-driver management.

---

## 2. Users & Roles

| Role | Description | Can do |
|------|-------------|--------|
| **Parent (group admin)** | Creates a carpool group, e.g. "Greenwood School, Grade 3, mornings" | Invite and remove families, set the schedule and rotation rules, everything a member can do |
| **Parent (member)** | A parent in a group | Add their kids, drive their turns, request swaps, receive notifications |
| **Co-parent / guardian** | A second adult in the same family | Shares the family's kids and turns; either adult can drive the family's turn |
| **Friend** | An adult connected to you in the app (another parent, neighbour, colleague) | Join your groups and events when invited; offer or take seats on adult rides |
| **Approved driver** | A trusted adult who may drive your child: grandparent, nanny or family friend, added by a family | Can be assigned that family's turn or an outing; every parent whose child is in the car can see who they are and opt out |
| **Child (profile only)** | Managed by their parents | No login. Holds name, photo, school/class, seat needs, medical notes, emergency contacts |

**Family** is the core unit: one or more adults, one or more kids, one or more cars. **Friends** are connections between adults; your **circle** is your family plus your friends.

---

## 3. Scope by Release

| Release | Theme | Contents |
|---------|-------|----------|
| **MVP (v1)** | Organize & know | Family setup, kid profiles, friends & invites, invite-only groups (parents + friends), schedules, auto rotation, today's view, swap requests, kids' outings, pickup/drop-off check-in and notifications, group chat, calendar sync |
| **v1.1** | Friends & safety | Adult rides with friends, cost split, approved drivers (incl. family friends), live trip location, absence marking, school holiday calendars, "running late" alerts, fairness report |
| **v2** | Smarter & bigger | Friends-of-friends suggestions (opt-in), route ordering for multiple pickups, school/admin portal, web app |

Priority tags: **P0** = MVP, **P1** = v1.1, **P2** = v2.

---

## 4. Functional Requirements

### 4.1 Account & Family
| ID | Requirement | Priority |
|----|-------------|----------|
| FAM-1 | Sign up with phone number (OTP) or Google / Apple | P0 |
| FAM-2 | Create a family: adult name, photo, phone, home address (only shared with your groups) | P0 |
| FAM-3 | Invite a co-parent to the family; both see and manage everything for the family | P0 |
| FAM-4 | Add one or more cars: make, model, colour, plate, number of seats, booster/car seats available | P0 |
| FAM-5 | Add approved drivers (grandparent, nanny, family friend) with name, photo, phone, relationship; they get a limited login. A friend already in the app can be approved with one tap | P1 |
| FAM-6 | Delete account and all family and child data | P0 |

### 4.2 Friends
| ID | Requirement | Priority |
|----|-------------|----------|
| FRD-1 | Add friends by phone contact, invite link or QR code; both sides must accept | P0 |
| FRD-2 | Friends list with name, photo, family (kids' first names only if the friend's family shares them) | P0 |
| FRD-3 | Friend circles / labels (e.g. "School parents", "Neighbours", "Office") to invite many at once | P1 |
| FRD-4 | Remove or block a friend; they lose access to future events and rides (existing groups ask the admin) | P0 |
| FRD-5 | Optional: suggest friends-of-friends from the same school (opt-in only, never shows kids) | P2 |

### 4.3 Child Profiles
| ID | Requirement | Priority |
|----|-------------|----------|
| KID-1 | Add a child: first name, photo, age/grade, school | P0 |
| KID-2 | Seat needs: car seat / booster / none (used to check a driver's car fits everyone) | P0 |
| KID-3 | Medical and care notes: allergies, medications, conditions, "who can collect me" notes | P0 |
| KID-4 | Emergency contacts (at least 2) | P0 |
| KID-5 | Visibility: child details are only visible to the adults driving that child (in the same group); sensitive notes are shown to the driver only for the day of the trip | P0 |

### 4.4 Carpool Groups
| ID | Requirement | Priority |
|----|-------------|----------|
| GRP-1 | Create a group for an activity: name, place (school / class address), type (school, sports, music, tuition, friends, other) | P0 |
| GRP-2 | Invite families **only** from your friends list, by link, QR code or phone contact; any parent or friend can be invited, not only those from the same school; the admin approves each family before they join | P0 |
| GRP-3 | Members see each family in the group: adults, kids in this group, cars, approved drivers | P0 |
| GRP-4 | Admin can remove a family, transfer admin, or archive the group (e.g. end of school year) | P0 |
| GRP-5 | A family can belong to many groups (school mornings, swimming Tuesdays, etc.) | P0 |
| GRP-6 | Group size limit (default 8 families) to keep groups small and trusted | P0 |

### 4.5 Schedule
| ID | Requirement | Priority |
|----|-------------|----------|
| SCH-1 | Define trips for a group: direction (to activity / back home / both), days of the week, times | P0 |
| SCH-2 | Each family chooses which trips each child joins (e.g. mornings only) | P0 |
| SCH-3 | One-off trips (field trip, a tournament on Saturday) | P0 |
| SCH-4 | Skip dates: holidays, exams, cancelled classes; skipped trips don't count in the rotation | P0 |
| SCH-5 | Import school holiday calendar (ICS file or link) | P1 |
| SCH-6 | Mark a child absent for a date ("Mia is sick today"); driver and group notified | P1 |
| SCH-7 | Pickup order and pickup times worked out from home addresses | P2 |

### 4.6 Driving Rotation (core feature)
| ID | Requirement | Priority |
|----|-------------|----------|
| ROT-1 | Auto-generate a driving rotation for the upcoming weeks from the families' availability | P0 |
| ROT-2 | Rotation modes: round-robin by trip, by day of the week ("I always drive Tuesdays"), or by week | P0 |
| ROT-3 | Each family sets availability: days/times they **can't** drive | P0 |
| ROT-4 | Fairness: the rotation balances the number of trips (weighted by number of kids or distance, optional) across families; a fairness counter shows each family's trips given vs. received | P0 |
| ROT-5 | The rotation only assigns a driver whose car has enough seats and the right car/booster seats for the kids on that trip | P0 |
| ROT-6 | Admin can edit any assignment manually; the rotation rebalances the following weeks | P0 |
| ROT-7 | Driver confirms their turn the evening before ("Confirmed ✓"); if not confirmed by a set time, the admin and that family get a reminder | P0 |
| ROT-8 | Monthly fairness report per group | P1 |

### 4.7 Swaps & Changes
| ID | Requirement | Priority |
|----|-------------|----------|
| SWAP-1 | "I can't drive": the driver requests cover for a trip; all available families get a request | P0 |
| SWAP-2 | Another parent accepts with one tap ("I'll cover"); option for a direct swap ("I'll take your Tue, you take my Thu") | P0 |
| SWAP-3 | Unresolved requests escalate: reminder after 2 h, urgent alert to all if under 12 h before the trip | P0 |
| SWAP-4 | Accepted swaps update the rotation and the fairness counter automatically | P0 |
| SWAP-5 | History of all changes visible to the group | P0 |

### 4.8 Kids' Outings with Friends
| ID | Requirement | Priority |
|----|-------------|----------|
| OUT-1 | Create a one-off outing: name (e.g. "Riya's birthday party"), place, date, time to go and return, kids invited | P0 |
| OUT-2 | Invite friend families or a whole group; each parent RSVPs for their kids and says whether they can drive and how many seats | P0 |
| OUT-3 | Seat planner: app suggests which kid goes in which car (seat count, car/booster seats, nearest home); parents can drag to change | P0 |
| OUT-4 | Separate drivers for the way there and the way back | P0 |
| OUT-5 | Same check-in and notifications as regular trips (picked up, arrived, dropped home) | P0 |
| OUT-6 | Outing chat for the parents involved; auto-archived after the event | P0 |
| OUT-7 | Outings count towards the fairness counter only if the group chooses so | P1 |

### 4.9 Adult Rides with Friends
| ID | Requirement | Priority |
|----|-------------|----------|
| ADR-1 | Offer a ride to friends: from, to, date/time, seats, one-off or recurring (e.g. office Mon–Fri) | P1 |
| ADR-2 | Choose who sees it: all friends, a circle (e.g. "Office"), or chosen people | P1 |
| ADR-3 | Friends request a seat; driver accepts; or friends post "Need a ride" for others to offer | P1 |
| ADR-4 | Events for adults (wedding, concert, weekend trip): several cars, seat planner, group chat | P1 |
| ADR-5 | Optional cost split per ride (fuel, tolls, parking): record who owes what, mark as settled (cash / UPI / bank) | P1 |
| ADR-6 | Kids can be added to an adult ride by their own parent (e.g. family weekend trip with friends) | P1 |

### 4.10 Trip Day
| ID | Requirement | Priority |
|----|-------------|----------|
| TRIP-1 | **Today** view: every trip today for the family's kids, with the driver, car, time and the kids in the car | P0 |
| TRIP-2 | Morning reminder to the driver with the list of kids, addresses and seat needs | P0 |
| TRIP-3 | Driver taps **Start trip**, then checks off each child at **pickup** (✓ in car) and **drop-off** (✓ at school/class/home) | P0 |
| TRIP-4 | Each parent gets a notification when their child is picked up and dropped off, with the time | P0 |
| TRIP-5 | Alert to the parent if a child isn't checked in within 10 minutes of the planned pickup | P0 |
| TRIP-6 | "Running late" one-tap alert with new ETA to all parents in the trip | P1 |
| TRIP-7 | Live location of the car, visible only to the parents of the kids in the car, only during the trip | P1 |
| TRIP-8 | Hand-off to Google Maps / Apple Maps / Waze for navigation | P0 |
| TRIP-9 | Quick access to each child's medical notes and emergency contacts during the trip | P0 |

### 4.11 Communication & Notifications
| ID | Requirement | Priority |
|----|-------------|----------|
| COM-1 | Group chat for parents (adults only) | P0 |
| COM-2 | Call another parent from the trip screen | P0 |
| COM-3 | Push notifications: turn reminders, confirmation needed, swap requests, pickup/drop-off check-ins, absences, schedule changes, friend requests, outing invites and RSVPs, ride requests | P0 |
| COM-4 | SMS fallback for check-in and urgent alerts | P1 |
| COM-5 | Notification settings per group and per type, with quiet hours | P0 |

### 4.12 Calendar
| ID | Requirement | Priority |
|----|-------------|----------|
| CAL-1 | Calendar view of the family's driving turns, kids' trips, outings and adult rides (week / month) | P0 |
| CAL-2 | Sync "my driving turns" to Google / Apple / Outlook calendar, updated after swaps | P0 |

### 4.13 Safety & Privacy
| ID | Requirement | Priority |
|----|-------------|----------|
| SAFE-1 | Invite-only groups, outings and rides; you can only see people you are friends with or share a group with; no public search for groups, families or rides | P0 |
| SAFE-2 | Only adults in the same group see a child's details; medical notes only for that trip's driver | P0 |
| SAFE-3 | Driver checklist accepted when joining a group: valid licence, insured car, no phone use while driving, proper car seats | P0 |
| SAFE-4 | Each family can see and approve who may drive their child (including approved drivers); a family can opt their child out of a specific driver | P1 |
| SAFE-5 | Emergency button on the trip screen: call emergency services, and alert all parents in the trip with location | P0 |
| SAFE-6 | Audit log of check-ins, assignments and changes, kept for 90 days | P0 |
| SAFE-7 | Report a concern to the group admin privately | P1 |

### 4.14 Optional: Cost Sharing
| ID | Requirement | Priority |
|----|-------------|----------|
| COST-1 | Cost split for adult rides (see ADR-5) | P1 |
| COST-2 | Optional fuel/cost tracker for kids' groups where driving is uneven (e.g. one family has no car) | P2 |

---

## 5. Key User Flows

1. **Start a carpool:** Parent signs up → adds family, kids, car → creates group "Greenwood School, Grade 3" → sets trips (Mon–Fri, 7:45 AM to school, 3:15 PM home) → shares invite link in the parents' WhatsApp.
2. **Join:** Another parent opens the link → signs up → adds kids and car → requests to join → admin approves → sets "can't drive" days.
3. **Rotation:** Once 3 or more families have joined, admin taps "Generate rotation" → reviews 4 weeks of turns → publishes; everyone's calendar updates.
4. **Evening before:** Tomorrow's driver gets "You're driving Mia, Aarav and Leo to school at 7:45. Confirm?" → taps Confirm.
5. **Trip:** Driver taps Start → picks up each child and checks them in → parents get "Mia was picked up at 7:48 by Priya (white Honda City)" → drop-off at school → "Mia was dropped at Greenwood School at 8:12".
6. **Can't drive:** Driver taps "Need cover" → others notified → a parent taps "I'll cover" → rotation and fairness counter update → everyone notified.
7. **Sick child:** Parent marks Leo absent for today → driver notified and Leo removed from today's pickup list.
8. **Birthday party:** Parent creates outing "Riya's party, Sat 4–7 PM" → invites 5 friend families → each RSVPs and two parents offer seats → seat planner fills the cars → check-ins on the day notify every parent.
9. **Adult ride:** Parent offers "Office, Mon–Fri 9 AM, 2 seats" to the "Neighbours" circle → a friend requests a seat → accepted → weekly cost split recorded.

---

## 6. Business Rules

| Rule | Default (configurable per group) |
|------|------------------------|
| Max families per group | 8 (outings and adult events: up to 30 people) |
| Rotation horizon | 4 weeks ahead, extended automatically each week |
| Driver confirmation deadline | 8 PM the evening before |
| Swap escalation | Reminder after 2 h; urgent alert to all when < 12 h before the trip |
| Missed check-in alert | 10 min after planned pickup |
| Fairness weighting | 1 trip = 1 point (option: weight by number of kids or distance) |
| Seat check | Assign a driver only if seats ≥ kids on the trip and car/booster seats match |
| Who can see a ride or outing | Only invited friends / group members |
| Driving a child | Only parents in the group or approved drivers the child's parent has approved |
| Data retention | Trip and check-in logs 90 days; full deletion on request |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Platforms** | iOS 16+ and Android 10+ (one codebase) |
| **Reliability** | Check-in and notifications are the most important path: notification sent < 10 s after check-in; 99.9% notification delivery with SMS fallback |
| **Performance** | Today view loads < 1.5 s; works on slow mobile data |
| **Offline** | Today's trip, kids list, medical notes and emergency contacts available offline; check-ins queue and sync when back online |
| **Child privacy** | Comply with COPPA (US), GDPR-K (EU/UK) and India DPDP Act rules on children's data: verifiable parental consent, minimum data, no ads, no tracking/analytics on child data, no data sold or shared |
| **Security** | Encryption in transit and at rest; medical notes encrypted separately; role-based access (family, group, driver-of-the-day); short-lived sessions; rate-limited OTP |
| **Location** | Location only used during an active trip; never stored beyond 24 h |
| **Accessibility** | WCAG 2.1 AA; large tap targets for use in a hurry |
| **Localization** | Multi-language ready; 12/24 h time; local date formats |
| **Observability** | Crash reporting and alerts on failed notifications (without logging children's personal data) |

---

## 8. Data Model (high level)

```
Family ─┬─< Adult (parent, co-parent, approved driver)
        ├─< Child ─< EmergencyContact
        ├─< Car
        └─< Availability (can't-drive slots)

Adult ─< Friendship >─ Adult   (status: pending / accepted / blocked)
Adult ─< Circle ─< CircleMember

Outing / AdultRide ─┬─< Invite (family or adult, RSVP)
                    ├─< CarAssignment (car, driver, direction) ─< Seat (child or adult)
                    └─< CostEntry (adult rides only)

Group ─┬─< GroupMembership >─ Family
       ├─< TripTemplate (days, time, direction)  ─< TripInstance
       ├─< SkipDate
       └─< ChatMessage

TripInstance ─┬─ driver: Adult, car: Car
              ├─< TripRider >─ Child   (status: scheduled / absent / picked_up / dropped_off)
              └─< SwapRequest
Group ─< AuditLog
```

| Entity | Key fields |
|--------|-----------|
| Family | id, name, home_address (encrypted), created_at |
| Adult | id, family_id, role, name, phone, photo |
| Child | id, family_id, first_name, photo, grade, seat_need, medical_notes (encrypted) |
| Car | id, family_id, make, model, colour, plate, seats, car_seats, boosters |
| Group | id, name, type, place, admin_ids, rotation_mode, settings |
| TripTemplate | id, group_id, direction, weekdays, time |
| TripInstance | id, template_id, date, time, driver_id, car_id, status, confirmed_at |
| TripRider | trip_id, child_id, status, picked_up_at, dropped_off_at |
| SwapRequest | id, trip_id, from_family, to_family, type (cover/swap), status |
| FairnessLedger | group_id, family_id, trips_driven, trips_received |
| Friendship | adult_a, adult_b, status, created_at |
| Outing | id, organiser_id, name, place, date, go_time, return_time, group_id? |
| AdultRide | id, driver_id, from, to, datetime, recurrence, seats, visibility (all / circle / people) |
| CostEntry | ride_id, payer_id, payee_id, amount, settled |

---

## 9. Suggested Technical Architecture

| Layer | Recommendation |
|-------|---------------|
| Mobile app | Flutter or React Native (Expo) |
| Backend | Supabase (Postgres, Auth, Row-Level Security, Realtime) for the MVP; row-level security is a strong fit for "only my group sees my kids" |
| Jobs | Scheduled functions for rotation generation, reminders, confirmation deadlines, missed-check-in alerts |
| Notifications | Firebase Cloud Messaging + APNs; Twilio (or similar) for SMS fallback |
| Maps | Google Maps (address autocomplete, navigation hand-off, live location in v1.1) |
| Calendar | ICS feed per family for calendar sync |

**Rotation algorithm (MVP):** for each upcoming trip, choose among the available families whose car fits the kids, the one with the lowest (trips driven − fair share), breaking ties by who drove longest ago. Recompute future weeks after any change.

---

## 10. Analytics & KPIs (no child data)

- Groups created, families per group, % groups with an active rotation
- Friend connections per user; outings and adult rides created; seats filled
- % trips confirmed by the deadline; swap requests and time to resolve
- % trips with complete check-ins; missed-check-in alerts
- Fairness spread per group
- Weekly active families; retention over a school term

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Child-safety incident | Invite-only groups, driver checklist, check-ins, missed-check-in alerts, emergency button, approved-driver visibility |
| Children's data privacy / legal | Collect minimum data, parental consent, encryption, COPPA/GDPR-K/DPDP review before launch |
| Adult rides blur into a public ride service | Rides only visible to accepted friends; cost split only (no profit), no public listing |
| Parents keep using WhatsApp | Make the invite flow WhatsApp-friendly; send useful notifications so the app is where the truth lives |
| Notification failure → missed pickup | SMS fallback, missed-check-in alerts, offline trip info |
| Liability / insurance | Terms clarify that parents arrange carpools among themselves; the app is a coordination tool; driver checklist |

---

## 12. Milestones (indicative)

| Phase | Duration | Output |
|-------|----------|--------|
| 0. Discovery | 1–2 wks | Interview 5–10 parents, confirm open questions, wireframes |
| 1. Design | 2 wks | UI for MVP flows |
| 2. MVP build | 8 wks | All P0 features |
| 3. Pilot | 1 school term | 2–3 real groups at one school; iterate |
| 4. v1.1 | 6 wks | Live location, approved drivers, holidays, absences |

---

## 13. Open Questions

1. **Country/region?** Decides privacy law (COPPA / GDPR-K / DPDP) and SMS provider.
2. **Friends-of-friends**: should a friend's friend be able to see an outing you're both invited to? (Draft: only if invited by the organiser.)
3. **Who should see live location**: all parents in the group, or only parents of the kids in that car? (Draft: only kids in the car.)
4. **Older kids (12+)**: should they get a simple read-only app to see who's picking them up? (Draft: not in v1.)
5. **Rotation weighting**: is "one trip = one turn" fair enough, or should longer routes / more kids count more?
6. **Platform**: iOS and Android from day one?
