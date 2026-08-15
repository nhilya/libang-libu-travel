# Tour Operations PWA — Backend Specification

Status: Initial implementation proposal  
Backend: Existing monolith  
Clients: Tour Guide PWA, Teacher/Client PWA, existing Admin Panel  
Last updated: 2026-08-15

## 1. Objective

Extend the existing backend monolith so that:

- a tour guide can see assigned trips, start duty, complete itinerary checkpoints, report incidents, and share live location during an authorised trip;
- a teacher can see the trip plan, current operational status, guide location/ETA, announcements, and emergency contacts;
- operations/admin can monitor whether a guide started work, arrived, and completed checkpoints on time;
- the system produces an auditable timeline without treating imperfect GPS data as unquestionable proof.

This document covers backend logic and API contracts. UI design and payroll/disciplinary automation are outside the MVP.

## 2. Important PWA Constraint

A pure browser PWA cannot guarantee continuous GPS while the app is closed, suspended, or the phone is locked. The Geolocation API requires HTTPS, user permission, and a visible document before requesting a position. Therefore:

- MVP tracking is reliable while the Guide PWA is open and active;
- offline points can be queued locally and uploaded when connectivity returns;
- a missing point means `tracking unavailable`, not automatically `guide absent`;
- if continuous screen-off tracking is a hard business requirement, ship the Guide app later through a native wrapper or native application with platform background-location permission.

References: [W3C Geolocation](https://www.w3.org/TR/geolocation/), [W3C Page Visibility](https://www.w3.org/TR/page-visibility-2/), and [Web Background Sync](https://wicg.github.io/background-sync/spec/).

## 3. System Boundary

Use the existing monolith as the single source of truth.

```text
Guide PWA ───────┐
                 ├── HTTPS API ── Existing Monolith ── Primary Database
Teacher PWA ─────┤                     │
                 │                     ├── Queue / scheduled jobs
Admin Panel ─────┘                     └── SSE or WebSocket updates
```

Do not create a separate tracking microservice for MVP. Isolate the tracking code inside a monolith module so it can be extracted later only if volume requires it.

## 4. Roles and Permissions

| Capability | Guide | Teacher | Operations/Admin |
|---|---:|---:|---:|
| View assigned trip | Yes | Yes, own school/trip | Yes |
| Start/stop guide duty | Yes, self | No | Override with reason |
| Upload own GPS | Yes, during tracking window | No | No |
| View live guide location | Own trip | Own active trip | Assigned/managed trips |
| Update checkpoint status | Yes | Acknowledge only | Override with reason |
| Report incident | Yes | Yes | Yes |
| View historical raw GPS | No | No | Restricted admin permission |
| Manage trip/assignment | No | No | Yes |
| View punctuality report | Own summary | Trip summary | Yes |

Required permissions:

- `trip.read.assigned`
- `trip.manage`
- `tracking.write.self`
- `tracking.read.active`
- `tracking.read.history`
- `incident.write`
- `operations.override`

All object access must also verify tenant/school/trip ownership. Role checks alone are insufficient.

## 5. Core Trip State Machine

```text
DRAFT → CONFIRMED → READY → IN_PROGRESS → COMPLETED
   └──────────────→ CANCELLED ←──────────────┘
```

Rules:

- `CONFIRMED`: school, date, guide assignment, and itinerary exist.
- `READY`: required briefing and guide acknowledgement are complete.
- `IN_PROGRESS`: guide starts duty or operations performs an audited override.
- `COMPLETED`: final mandatory checkpoint is completed and trip is closed.
- cancellation requires a reason, actor, and server timestamp.
- state changes are append-only events in addition to updating the current trip row.

## 6. Guide Duty Flow

1. Guide signs in and loads assigned trips.
2. Guide opens a trip and accepts the assignment.
3. Within the allowed tracking window, the Guide PWA requests location permission.
4. Guide taps **Start duty**.
5. Backend creates a tracking session and a `DUTY_STARTED` event.
6. PWA sends batched location points and checkpoint actions.
7. Backend calculates arrival/departure facts and raises operational alerts.
8. Guide completes the final checkpoint and taps **End duty**.
9. Backend closes tracking, computes the punctuality summary, and marks the trip complete when all completion rules pass.

Default tracking window:

```text
trip scheduled start - 60 minutes
through
trip scheduled end + 60 minutes
```

An admin may change the window per trip. Location uploads outside it must be rejected unless an active audited override exists.

## 7. Teacher/Client Flow

Teacher PWA should expose only operationally useful information:

- itinerary, meeting point, guide profile, vehicle/contact information;
- current trip state;
- latest guide position, accuracy, and `last updated` age;
- next checkpoint and ETA when available;
- delay/arrival/departure announcements;
- incident and emergency action;
- teacher acknowledgement for selected checkpoints.

Teacher access begins when a trip is confirmed and live-location access begins at the tracking window. Live location ends when duty ends. Teachers must not receive raw historical route data.

## 8. Punctuality Logic

### 8.1 Definitions

Each itinerary stop contains:

- `scheduled_arrival_at`
- `scheduled_departure_at`
- `latitude`, `longitude`
- `geofence_radius_m` (default `100` metres)
- `arrival_grace_minutes` (default `10`)
- `departure_grace_minutes` (default `10`)
- whether guide confirmation is required
- whether teacher acknowledgement is required

An automatic arrival is the earliest accepted GPS point that:

- belongs to the active guide tracking session;
- has `accuracy_m <= 100` by default;
- is inside the stop geofence;
- has a plausible device timestamp;
- passes duplicate and impossible-speed checks.

Guide manual check-in may be used when GPS is unavailable. Store it as a separate evidence type and optionally require teacher confirmation or admin review.

### 8.2 Status

```text
ON_TIME:       actual time <= scheduled time + grace
LATE:          actual time > scheduled time + grace
VERY_LATE:     actual time > scheduled time + configured escalation threshold
MISSING:       no accepted event by the alert threshold
UNVERIFIED:    only manual or low-quality evidence exists
NOT_APPLICABLE:checkpoint was cancelled or officially rescheduled
```

Delay in minutes:

```text
max(0, actual_arrival_at - scheduled_arrival_at)
```

Server time is authoritative for API receipt and state changes. Device time is retained to reconstruct offline activity, but it must never silently replace server time.

### 8.3 Rescheduling

Changing a scheduled time must create a new itinerary revision. Reports must retain:

- original scheduled time;
- revised scheduled time;
- reason and actor;
- time the change was made.

This prevents an administrator from erasing lateness by overwriting the original schedule.

### 8.4 Fairness Rule

Never trigger payroll or disciplinary action from GPS alone. Flag the trip for review when evidence is missing, low accuracy, offline for a long period, or potentially spoofed.

## 9. GPS Collection Rules

Recommended foreground collection policy:

- moving: one point every `15–30` seconds;
- stationary: one point every `60–120` seconds;
- immediately on start duty, checkpoint action, incident, and end duty;
- batch up to `50` points or upload every `30` seconds;
- stop collection immediately when duty ends or consent is withdrawn.

Each point contains:

```json
{
  "id": "01J...client_generated_ulid",
  "recordedAt": "2026-08-15T01:20:31.000Z",
  "latitude": 4.5975,
  "longitude": 101.0901,
  "accuracyM": 18.4,
  "altitudeM": null,
  "headingDeg": 92,
  "speedMps": 4.2,
  "sequence": 128,
  "source": "browser_geolocation"
}
```

Backend validation:

- latitude `-90..90`; longitude `-180..180`;
- accuracy must be positive and below the configured hard limit;
- deduplicate on tracking session + client point ID;
- reject points too far in the future;
- accept delayed offline points only within the configured upload age;
- calculate server-side distance, geofence match, and speed between points;
- mark suspicious data; do not discard it silently;
- never trust client-submitted guide ID, trip ID, punctuality, or geofence result.

Suggested quality flags:

- `LOW_ACCURACY`
- `STALE_UPLOAD`
- `OUT_OF_ORDER`
- `IMPOSSIBLE_SPEED`
- `LARGE_LOCATION_JUMP`
- `MOCK_LOCATION_SUSPECTED`
- `TRACKING_GAP`

## 10. Data Model

Names may be adapted to existing monolith conventions. IDs should use the system's existing UUID/ULID strategy.

### `trips`

- `id`
- `school_id`
- `title`
- `timezone` — default `Asia/Kuala_Lumpur`
- `scheduled_start_at`, `scheduled_end_at`
- `status`
- `tracking_starts_at`, `tracking_ends_at`
- `current_itinerary_revision_id`
- timestamps

### `trip_participants`

- `id`, `trip_id`, `user_id`
- `role`: `GUIDE`, `TEACHER`, `OPERATIONS`
- `assignment_status`: `INVITED`, `ACCEPTED`, `DECLINED`, `REMOVED`
- `accepted_at`
- unique `(trip_id, user_id, role)`

### `itinerary_revisions`

- `id`, `trip_id`, `revision_number`
- `change_reason`, `created_by`, `created_at`
- immutable after activation

### `itinerary_stops`

- `id`, `revision_id`, `sequence`
- `name`, `address`
- `latitude`, `longitude`, `geofence_radius_m`
- planned arrival/departure and grace fields
- confirmation requirements
- unique `(revision_id, sequence)`

### `tracking_sessions`

- `id`, `trip_id`, `guide_user_id`
- `started_at`, `ended_at`
- `started_latitude`, `started_longitude`, `started_accuracy_m`
- `end_reason`: `GUIDE_ENDED`, `TRIP_COMPLETED`, `ADMIN_ENDED`, `EXPIRED`
- `device_id`, `app_version`
- only one active session per guide/trip

### `location_points`

- `id`, `tracking_session_id`
- `client_point_id`, `sequence`
- `recorded_at`, `received_at`
- coordinates, accuracy, altitude, heading, speed
- `quality_status`, `quality_flags`
- optional matched `itinerary_stop_id`
- unique `(tracking_session_id, client_point_id)`
- index `(tracking_session_id, recorded_at)`
- index `(received_at)` for retention cleanup

For PostgreSQL at higher volume, partition by month on `recorded_at`. Do not add partitioning before actual volume justifies it.

### `trip_events`

- `id`, `trip_id`, optional `stop_id`
- `type`
- `actor_user_id`, `actor_role`
- `occurred_at`, `received_at`
- `evidence_type`: `GPS`, `GUIDE_MANUAL`, `TEACHER_CONFIRMED`, `ADMIN_OVERRIDE`, `SYSTEM`
- `evidence_id`
- `metadata` JSON
- append-only

Event examples:

- `ASSIGNMENT_ACCEPTED`
- `DUTY_STARTED`, `DUTY_ENDED`
- `STOP_ARRIVED`, `STOP_DEPARTED`
- `CHECKPOINT_COMPLETED`
- `TEACHER_ACKNOWLEDGED`
- `INCIDENT_REPORTED`
- `TRACKING_PERMISSION_DENIED`
- `TRACKING_LOST`, `TRACKING_RESUMED`
- `SCHEDULE_REVISED`

### `operational_alerts`

- `id`, `trip_id`, optional `stop_id`, optional `guide_user_id`
- `type`, `severity`
- `opened_at`, `acknowledged_at`, `resolved_at`
- `acknowledged_by`, `resolved_by`
- `resolution_note`
- deduplication key

### `incidents`

- `id`, `trip_id`, optional `stop_id`
- reporter, category, severity, description
- coordinates and attachment references when voluntarily supplied
- lifecycle/status and resolution audit fields

### `device_registrations`

- `id`, `user_id`, `device_id`
- push subscription/token
- platform, app version, last seen
- revoked timestamp

### `audit_logs`

Record access to raw location history, admin overrides, schedule revisions, participant changes, and tracking window changes.

### `monitoring_items`

- `id`, `trip_id`
- `stage`: `PRE_TOUR`, `DURING_TOUR`, `AFTER_TOUR`
- `category`: `BUS`, `DRIVER`, `TOUR_GUIDE`, `FOOD`
- `title`, `description`
- `owner_role`, `verifier_role`
- `required_evidence`
- `status`: `PENDING`, `SUBMITTED`, `APPROVED`, `REJECTED`, `NOT_APPLICABLE`
- `notes`, optional `score`
- submission and review audit fields

### `monitoring_evidence`

- `id`, `monitoring_item_id`
- object-storage key, original filename, MIME type and file size
- uploader, upload timestamp and optional capture timestamp
- malware-scan status and checksum
- never accept a public client-provided URL as trusted evidence

## 11. API Contract

Prefix example: `/api/v1`.

### Authentication and profile

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /me`
- `POST /devices/register`
- `DELETE /devices/{deviceId}`

Use the monolith's existing auth flow. Prefer short-lived access tokens plus rotating refresh tokens in secure, HTTP-only cookies where architecture permits.

### Shared trip endpoints

- `GET /trips?scope=mine&from=&to=`
- `GET /trips/{tripId}`
- `GET /trips/{tripId}/itinerary`
- `GET /trips/{tripId}/timeline`
- `GET /trips/{tripId}/live-status`
- `POST /trips/{tripId}/incidents`

### Guide endpoints

- `POST /trips/{tripId}/assignment/accept`
- `POST /trips/{tripId}/assignment/decline`
- `POST /trips/{tripId}/duty/start`
- `POST /trips/{tripId}/tracking/points:batch`
- `POST /trips/{tripId}/tracking/status`
- `POST /trips/{tripId}/stops/{stopId}/arrive`
- `POST /trips/{tripId}/stops/{stopId}/depart`
- `POST /trips/{tripId}/stops/{stopId}/complete`
- `POST /trips/{tripId}/duty/end`

### Teacher endpoints

- `POST /trips/{tripId}/stops/{stopId}/acknowledge`
- `POST /trips/{tripId}/emergency-contact-request`

### Admin endpoints

- CRUD for trips, participants, revisions, and stops
- `POST /trips/{tripId}/overrides`
- `GET /operations/live-trips`
- `GET /operations/trips/{tripId}/punctuality`
- `GET /operations/trips/{tripId}/location-history`
- `POST /operations/alerts/{alertId}/acknowledge`
- `POST /operations/alerts/{alertId}/resolve`

### Monitoring endpoints

- `GET /trips/{tripId}/monitoring`
- `PATCH /trips/{tripId}/monitoring/{itemId}`
- `POST /trips/{tripId}/monitoring/{itemId}/evidence`
- `POST /trips/{tripId}/monitoring/{itemId}/review`

The server validates item ownership, verifier role, required evidence and legal state transitions. Clients cannot approve their own submission unless a specifically audited admin policy allows it.

Raw history endpoint requires `tracking.read.history`, a declared access reason, and an audit log entry.

### Idempotency

Mutation requests from PWAs must accept an `Idempotency-Key`. Replaying the same key with the same payload returns the original result; using it with a different payload returns `409 Conflict`.

### Standard error body

```json
{
  "error": {
    "code": "TRACKING_WINDOW_CLOSED",
    "message": "Location sharing is not active for this trip.",
    "requestId": "req_01J...",
    "details": {}
  }
}
```

## 12. Live Updates

For MVP, use Server-Sent Events if clients only receive server updates:

- `GET /trips/{tripId}/stream`
- `GET /operations/live-trips/stream`

Events:

- `trip.status.changed`
- `guide.location.changed`
- `stop.status.changed`
- `alert.opened`
- `alert.resolved`
- `incident.created`

Send a heartbeat every `20–30` seconds. Clients reconnect with the last event ID. Never publish raw location at GPS sampling frequency; throttle the displayed live position to approximately every `15–30` seconds.

Use WebSockets only if future requirements need continuous bidirectional messaging.

## 13. Alert Rules

Initial configurable rules:

| Alert | Default trigger | Severity |
|---|---|---|
| Duty not started | 10 min before trip start | Warning |
| Guide late to first stop | Arrival grace exceeded | High |
| Tracking gap | No accepted point for 5 min during active duty | Warning |
| Long tracking gap | No accepted point for 15 min | High |
| Route deviation | Outside configured corridor for 10 min | Warning |
| Stop overdue | No arrival by scheduled time + grace | High |
| SOS/critical incident | User-triggered | Critical |

Alerts must be deduplicated and stateful. Do not create a new row on every scheduled-job run.

Notifications:

- operations: in-app + push; optional WhatsApp/SMS later;
- guide: push for overdue actions;
- teacher: only relevant delays, arrival, major incident, or operational announcement.

## 14. Scheduled Jobs

- open upcoming tracking windows;
- detect duty-not-started and overdue stops;
- detect stale live tracking;
- expire abandoned tracking sessions;
- calculate final punctuality summary;
- send notification retries with exponential backoff;
- delete/anonymise expired location data according to retention policy.

Jobs must be idempotent and safe to rerun.

## 15. Security, Privacy, and Consent

Location data is sensitive personal data. Minimum controls:

- HTTPS everywhere;
- explicit in-app explanation before browser permission request;
- track only assigned guides and only within the trip window;
- visible `Sharing location` indicator and a clear stop action;
- tenant and trip-level authorisation on every read/write;
- encrypt data in transit and at rest;
- redact coordinates from normal application logs and error reporting;
- signed URLs and access checks for incident attachments;
- rate limits per user, device, and IP;
- audit all historical location access and admin overrides;
- no teacher access after the live trip window;
- no secret tracking outside duty hours;
- define a privacy notice and staff policy reviewed for Malaysia PDPA compliance.

Suggested retention defaults, subject to legal/business approval:

- raw GPS points: `30 days`;
- derived trip/checkpoint events and punctuality result: `24 months`;
- security/audit logs: according to the organisation's audit policy;
- incidents: according to safety and insurance requirements.

After raw GPS expiry, retain only derived times, quality status, and required audit facts.

## 16. Offline Behaviour

Guide PWA stores pending actions and GPS batches in IndexedDB.

- every queued item has client ID, device time, sequence, and idempotency key;
- UI labels unsynced actions clearly;
- upload oldest items first when online;
- preserve original device time and server receipt time;
- checkpoint action conflicts return the authoritative server state;
- do not allow offline admin overrides;
- sensitive offline data must be minimal and cleared after successful sync/logout.

## 17. Observability

Metrics:

- active tracking sessions;
- accepted/rejected GPS points;
- location batch latency and age;
- tracking gaps per device/app version;
- SSE connections/reconnects;
- notification delivery success;
- late/missing checkpoint counts;
- API error and authorisation failure rates.

Structured logs should contain request ID, trip ID, session ID, user ID, event type, and result, but not raw coordinates.

## 18. Acceptance Criteria

### Guide

- can access only assigned trips;
- cannot start duty outside the permitted window;
- can start duty with granted GPS permission;
- can continue checkpoint work when GPS permission is denied, but status becomes unverified;
- can upload an offline batch without duplicates;
- sees whether data is live, queued, permission-denied, or stale;
- location collection stops when duty ends.

### Teacher

- can access only trips linked to their school/account;
- sees latest guide location and its age during an active trip;
- cannot access raw route history;
- receives status/delay updates without refreshing;
- loses live-location access when tracking ends.

### Operations/Admin

- sees active trips and last guide update age;
- receives duty-not-started, tracking-gap, and overdue-stop alerts;
- sees original and revised schedule values;
- can override a state only with a reason;
- can review the evidence type behind each arrival;
- every raw-history access and override is audited.

### Security

- horizontal access tests fail for unrelated schools/trips;
- location uploads fail for another guide's tracking session;
- location uploads fail outside the authorised window;
- expired/revoked tokens cannot create points;
- logs contain no raw coordinates.

## 19. Required Test Scenarios

1. Guide starts duty on time with accurate GPS.
2. Guide arrives inside geofence before schedule.
3. Guide arrives after grace period.
4. GPS accuracy is worse than the threshold.
5. Location permission is denied.
6. Network disappears, points queue, and later sync out of order.
7. Same batch is retried three times.
8. Device clock is five minutes ahead/behind.
9. Impossible location jump is received.
10. Guide attempts tracking outside duty window.
11. Teacher attempts another school's trip.
12. Admin revises a schedule after the original time.
13. Tracking stops unexpectedly for 5 and 15 minutes.
14. Guide ends duty while queued points remain.
15. Raw GPS retention job removes points but preserves derived events.

## 20. Delivery Plan

### Phase 1 — Operational MVP

- roles and trip-scoped authorisation;
- trip assignments and itinerary revisions;
- guide duty start/end;
- foreground GPS batch ingestion;
- automatic geofence arrivals;
- manual checkpoint events;
- teacher live status;
- admin live trip view;
- core alerts and audit logs;
- offline queue/idempotency.

### Phase 2 — Reliability

- push notifications;
- richer incident attachments;
- route corridor/deviation rules;
- ETA provider integration;
- device/app health dashboard;
- configurable retention and exported operational report.

### Phase 3 — Only if required

- native wrapper/native Guide app for continuous background GPS;
- payroll/workforce integration after legal and HR review;
- advanced spoof detection;
- separate high-volume tracking storage/service.

## 21. Decisions Needed Before Implementation

1. Backend language/framework and database used by the monolith.
2. Existing user, school/tenant, trip, and auth schema.
3. Whether one trip may have multiple simultaneous guides.
4. Who may see live location: lead teacher only or all linked teachers.
5. Default geofence, grace periods, and escalation contacts.
6. Approved raw-location retention period.
7. Whether continuous screen-off tracking is mandatory.
8. Push provider and whether WhatsApp/SMS escalation is required.
9. Incident attachment storage provider.
10. HR/legal policy for using location data in performance review.

## 22. Definition of Done for Backend MVP

- schema migrations are reversible;
- OpenAPI documentation exists for all endpoints;
- RBAC and object-level access tests pass;
- idempotency and offline replay tests pass;
- alert jobs are idempotent;
- SSE/live update reconnection is tested;
- privacy retention job is tested;
- admin audit trail is queryable;
- load test covers expected concurrent trips and GPS batch rate;
- runbook covers tracking outage, queue failure, and notification failure.
