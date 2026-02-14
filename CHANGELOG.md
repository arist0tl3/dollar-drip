# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [Unreleased]

### Added
- PWA install prompt and hint, plus new add-expense flow layout and weekly mini chart.
- Magic link join route and login request screen.
- OTP login for PWA users with numeric keypad entry.
- Postmark email delivery for magic links and OTP codes.
- Carry-over budget logic for weekly resets.
- Hidden reverse-expense flow in the avatar menu that logs negative transactions with normal amount/category entry.

### Changed
- App name and PWA assets updated to Dollar Drip.
- Transaction loading now on demand rather than polling.
- Weekly balance aligns with server week start.

### Fixed
- Mongo connection now initializes on server startup.
- Transaction creation now accepts negative amounts (still rejects zero) so reverse expenses can be saved.

## [0.1.0] - 2026-01-29
### Added
- Initial Astro + React frontend with onboarding, tracker, history, and settings screens.
- Express API with household, auth, and transaction endpoints.
- MongoDB models for households, members, sessions, and transactions.
- PWA manifest, service worker, and offline fallback.
