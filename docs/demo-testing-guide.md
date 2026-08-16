# Demo Testing Guide

## 1. Start the frontend

```bash
npm run dev
```

The current placeholder `NEXT_PUBLIC_API_URL=https://api.example.com` automatically enables demo mode. Demo data is shared through browser storage; no backend is required.

## 2. Open the three operations views

Open these routes in three tabs in the same browser profile:

- `http://localhost:3000/guide`
- `http://localhost:3000/teacher`
- `http://localhost:3000/admin/monitoring`

Use **Reset demo** in any yellow banner before starting a presentation.

## 3. Test D-Day trip flow

1. In Guide, press **Start duty & share GPS**.
2. Allow browser location permission. Localhost is accepted as a secure context by modern browsers.
3. If GPS is unavailable or denied, the app must show the correct state without blocking manual operations.
4. Press **Mark arrived** for the first checkpoint.
5. Check Teacher and Admin tabs. They should update through cross-tab storage sync; Teacher also polls every 20 seconds.
6. In Guide, press **Complete stop**.
7. In Teacher, press **Acknowledge**.
8. Repeat checkpoints, then press **End duty** in Guide.
9. Confirm Teacher/Admin show completed duty and that Guide no longer reports active location sharing.

## 4. Test monitoring evidence flow

1. In Guide, open **Monitoring mechanism → During tour**.
2. Add evidence for bus arrival or food checks. Demo mode stores only filename metadata, not the actual file.
3. Add notes/score and press **Submit check**.
4. In Teacher, open **Review trip evidence → During tour**.
5. Approve or reject the submitted item.
6. In Admin, confirm the consolidated status and counts update.
7. For pre-tour testing, use Admin to upload bus/driver/food documents and use Guide to submit profile/intro evidence.

## 5. Show the quotation email mockup

Open:

```text
http://localhost:3000/email-preview/quotation
```

- switch between Desktop and Mobile;
- use **Open email HTML** to show the actual table-based email output;
- meeting and WhatsApp buttons are presentation placeholders;
- the quotation values are sample data.

## 6. Test client confirmation and payment

1. Keep Admin open at `http://localhost:3000/admin/monitoring`.
2. Open `http://localhost:3000/email-preview/quotation`, then click **Open email HTML**.
3. In the email, click **Review & confirm quotation**.
4. Tick the confirmation and press **Accept quotation**.
5. Enter the authorised representative, accept the terms, then press **Sign agreement**.
6. Press **Pay ... · Demo FPX**. This is a simulation and does not charge any account.
7. Return to Admin. The commercial card should show **Deposit paid · Booking unlocked**.
8. Use **Reset demo** to repeat the presentation.

Direct HTML endpoint:

```text
GET /api/demo/quotation-email
```

## 7. Pull an Admin report

1. Open `http://localhost:3000/admin/monitoring` and press **Generate report**.
2. Confirm the report contains commercial status, GPS, itinerary and monitoring evidence.
3. Press **Download CSV** to open the operational data in Excel or Google Sheets.
4. Press **Print / Save PDF**, then select **Save as PDF** in the browser print dialog.
5. Update a Guide or Teacher task, return to the report and press **Refresh** to verify the latest status.

## 8. What is mocked

- authentication and role assignment;
- AI proposal generation;
- actual email/WhatsApp delivery;
- meeting booking;
- agreement signature, payment gateway transaction and bookings;
- server-side persistence and file storage;
- continuous background GPS.

## 9. Later integration testing

When the monolith is connected:

- point `NEXT_PUBLIC_API_URL` to the test environment;
- use test teacher/guide/admin accounts;
- use an email sandbox such as Mailpit or the email provider's test inbox;
- use an approved WhatsApp Business test number/template;
- verify API idempotency, RBAC, upload scanning and audit events;
- repeat this guide without demo mode.
