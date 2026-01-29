# Weekly Budget Tracker Spec (Updated)

This spec reflects the current codebase. It separates what is already implemented from remaining work.

## Completed

### Core product
- Shared household budget with members and a weekly budget reset.
- Expense logging with category and optional note.
- Soft delete for transactions.
- Sessions persist until explicit logout.

### Frontend
- Astro + React UI with onboarding flow and main tracker UI.
- History and settings views implemented as UI states in the client app.
- Polling every 10 seconds for transaction refresh.
- PWA setup (manifest, icons, service worker) and offline fallback page.

### Backend
- Express API with MongoDB (Mongoose) models for Household, Member, Transaction, Session.
- Household endpoints: create, fetch, update.
- Member invite endpoint (creates member with magic token and returns invite link).
- Auth endpoints: magic link generation, verify, logout.
- Transaction endpoints: list, create, soft delete.
- Week-start calculation by timezone.

## Todos

### Frontend
- Add a magic-link join flow and `/join` landing route.
- Wire the "I have a magic link" button to the join flow.
- Implement poll-on-focus refresh (in addition to interval polling).
- Consider splitting settings/history into routes if desired.

### Backend
- Send magic-link emails via Resend (currently returns token only).
- Align `GET /api/households/:id/transactions` with `weekStart` parameter (return that week only and compute totals for that week).

### PWA / Offline
- Add offline queue for writes (transactions) and sync on reconnect.

### Ops / Docs
- Confirm environment variable names across frontend and backend.
