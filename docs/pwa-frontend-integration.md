# PWA Frontend Integration

Implemented routes:

- `/guide` — guide duty, foreground GPS tracking, offline GPS queue, and checkpoint actions.
- `/teacher` — live guide/trip status, itinerary progress, and teacher acknowledgement.
- `/admin/monitoring` — trip readiness, live GPS freshness, monitoring evidence and approval workflow.

## API Configuration

```env
NEXT_PUBLIC_API_URL=https://your-monolith.example.com
```

When the URL is missing or remains `https://api.example.com`, the frontend uses a browser-local demo adapter. This allows both dashboards and their shared state to be reviewed before the backend is available.

Production requests use the `/api/v1` contract in `docs/pwa-backend-spec.md`, include cookies with `credentials: include`, and send `Idempotency-Key` for mutations.

## Implemented API Calls

- `GET /api/v1/trips?scope=mine&role={guide|teacher}`
- `GET /api/v1/trips/{tripId}`
- `GET /api/v1/trips/{tripId}/live-status`
- `POST /api/v1/trips/{tripId}/duty/start`
- `POST /api/v1/trips/{tripId}/duty/end`
- `POST /api/v1/trips/{tripId}/tracking/points:batch`
- `POST /api/v1/trips/{tripId}/stops/{stopId}/arrive`
- `POST /api/v1/trips/{tripId}/stops/{stopId}/complete`
- `POST /api/v1/trips/{tripId}/stops/{stopId}/acknowledge`
- `GET /api/v1/trips/{tripId}/monitoring`
- `PATCH /api/v1/trips/{tripId}/monitoring/{itemId}`
- `POST /api/v1/trips/{tripId}/monitoring/{itemId}/evidence`
- `POST /api/v1/trips/{tripId}/monitoring/{itemId}/review`

## Monitoring Workflow

Statuses: `PENDING → SUBMITTED → APPROVED` or `REJECTED → SUBMITTED`.

- Admin owns pre-tour bus, driver and food compliance checks.
- Guide owns their profile evidence and during-tour bus, driver and food checks.
- Teacher verifies during-tour submissions and submits the after-tour operations review.
- Admin verifies pre-tour/after-tour submissions and sees the consolidated dashboard.
- Evidence uploads use `multipart/form-data`; other monitoring mutations are idempotent JSON requests.

## GPS Behaviour

- GPS starts only after the guide taps **Start duty** and grants browser permission.
- The page uses `watchPosition` with high accuracy.
- Points upload every 30 seconds or when five points are buffered.
- Failed batches are stored in IndexedDB and replayed when the device reconnects.
- GPS is stopped when duty ends or the component unmounts.
- A pure PWA should remain open for dependable tracking; continuous screen-off tracking is not guaranteed.

## PWA Files

- `app/manifest.ts`
- `public/sw.js`
- `public/app-icon.svg`
- `components/pwa-register.tsx`

The service worker is registered only in production builds.
