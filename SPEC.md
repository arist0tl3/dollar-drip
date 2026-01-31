# Weekly Budget App - Design Specification
Version 2.0 | January 2026

## Overview
Weekly Budget is a simple, fast expense tracker for households (individuals, couples, roommates, families). The core value is friction at the right moment: a quick gut-check before swiping a card.

## Design principles
- Speed is everything. Logging an expense should take seconds.
- The number is the hero. Remaining budget is the primary element.
- Opinionated defaults with one-tap overrides.
- No visual clutter. Category icons are functional; decorative emojis are not used elsewhere.

## Technical stack
- Frontend: Astro + React + Tailwind CSS
- Deployment: PWA
- Authentication: Magic links (passwordless)

## Onboarding flow (7 steps)
Welcome and Success screens are not counted in step progress.

1) Name your budget
- Single text input
- Continue disabled until input has content

2) Add yourself
- Name + email
- Both required

3) Invite others (optional)
- Add member cards with remove
- "Skip for now" if none

4) Weekly budget amount
- Large numeric display
- Presets: $300, $400, $500, $600, $750, $900
- Default: $500

5) Pick categories
- Grid of 20 categories (4 columns)
- Select up to 6 favorites
- Counter: "x/6"
- Default favorites: Groceries, Dining, Coffee, Gas

6) Reset day
- Pick one of 7 days
- Default: Monday

7) Carry-over rules
- Under budget: Roll it over / Start fresh (default: Start fresh)
- Over budget: Subtract it / Start fresh (default: Subtract it)

## Main tracker
- Header: household name (settings), reset countdown, history link
- Budget hero: remaining amount + color status
  - Green: >50% remaining
  - Yellow: 25-50% remaining
  - Red: <25% remaining
- Progress bar matches status color
- Numeric keypad input (whole dollars only)
  - 3x4 grid: 1-9, Clear, 0, Backspace
  - Max 5 digits ($99,999)
- Note field hidden by default; shown via "+ Add a note"
- Category grid: 3 columns of 6 favorites
- "More categories" opens full list
- Log button enabled only when amount > 0 and category selected

## History
- Newest first
- Category icon, amount, user, time, optional note
- Delete button per entry

## Visual design
- Background: slate-950
- Surfaces: slate-900
- Interactives: slate-800
- Primary: emerald-500
- Warning: yellow-500
- Danger: red-500
- Typography: system fonts; budget amount is the largest element
- Spacing: p-6, rounded-2xl/3xl cards, rounded-xl inputs

## Data model updates
- Household:
  - resetDay (0-6)
  - favoriteCategoryIds (array of strings)
  - carryOverSurplus (boolean)
  - carryOverDebt (boolean)

## Validation rules
- Transaction amount must be a positive whole dollar integer.

## Future considerations
- Settings screen for household config changes
- Week-over-week history
- Category breakdown visualization
- Push notifications
- Edit existing transactions
