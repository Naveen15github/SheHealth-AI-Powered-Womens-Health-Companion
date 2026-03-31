# Design Document: SheHealth Frontend Redesign

## Overview

This redesign transforms the SheHealth React SPA from an inline-style-heavy codebase into a cohesive, token-driven UI that matches the Kiddie-inspired maternal health reference. The visual language shifts to a soft pink/coral/teal palette with modern card-based layouts, pill-shaped interactive elements, and a structured landing page. All existing functionality (auth flows, dashboard, AI chat, symptom logging, reports, health profile) is preserved — only the presentation layer changes.

The approach is purely frontend: no API contracts, no backend changes, no new routes. The work is organized into three layers:

1. **CSS Architecture** — a new `src/styles/` directory with `tokens.css` and `components.css` replacing scattered inline style objects.
2. **Component updates** — Navbar gains a hamburger menu; a new public `LandingNavbar` and `AnnouncementBanner` are added for the landing page.
3. **Page rewrites** — each page's JSX is refactored to use CSS class names instead of inline `style` props, and new sections (hero, categories, features grid, footer, dashboard highlights, etc.) are added.

---

## Architecture

### Current State

Every page and component defines a local `styles` object of inline React style props. The brand color `#e91e8c` is hardcoded in each file. There is no shared CSS beyond a minimal `App.css` and `index.css`, both of which only set `box-sizing` and a single `--brand` variable that is never actually consumed via `var()`.

### Target State

```
frontend/src/
├── styles/
│   ├── tokens.css        ← all CSS custom properties (:root)
│   └── components.css    ← shared button, input, card, badge classes
├── index.js              ← imports tokens.css + components.css globally
├── App.jsx               ← unchanged routing
├── components/
│   ├── Navbar.jsx        ← redesigned, hamburger menu added
│   ├── AnnouncementBanner.jsx  ← new
│   ├── ProtectedRoute.jsx      ← unchanged
│   ├── ErrorMessage.jsx        ← updated to use CSS classes
│   └── LoadingSpinner.jsx      ← updated to use CSS classes
└── pages/
    ├── LandingPage.jsx   ← full redesign (banner, public nav, hero, categories, features, footer)
    ├── LoginPage.jsx     ← AuthCard pattern, CSS classes
    ├── RegisterPage.jsx  ← AuthCard pattern, CSS classes
    ├── DashboardPage.jsx ← welcome, tip, quick-actions, appointment card, highlights grid
    ├── ChatPage.jsx      ← pill bubbles, redesigned input bar
    ├── SymptomLoggerPage.jsx ← form card, entry cards
    ├── ReportsPage.jsx   ← report cards, empty state
    └── HealthProfilePage.jsx ← form inputs, checkbox accents
```

### Key Architectural Decisions

**CSS Custom Properties over CSS-in-JS**: The existing codebase uses plain React inline styles. Migrating to CSS custom properties (tokens) in a single file gives us the same single-source-of-truth benefit without adding a CSS-in-JS library dependency. This keeps the build identical (Create React App, no config changes needed).

**No new dependencies**: The redesign uses only what CRA already provides. Google Fonts is loaded via a `<link>` tag in `public/index.html`. No component library, no CSS preprocessor.

**Co-located page CSS files**: Each page may have a `PageName.css` for layout-specific rules (grid columns, hero height, etc.) that don't belong in `components.css`. This keeps shared styles shared and page-specific styles local.

**AnnouncementBanner as a standalone component**: The banner needs session-level dismiss state. Extracting it to its own component keeps `LandingPage` clean and makes the dismiss logic testable in isolation.

**Public vs. authenticated Navbar**: The landing page needs a different nav (Features, How It Works links + Sign Up CTA) from the authenticated nav (Dashboard, Chat, Symptoms, Reports + Logout). Rather than a single Navbar with conditional rendering, `LandingPage` renders its own inline public nav section, keeping the authenticated `Navbar` component unchanged in its responsibility.

---

## Components and Interfaces

### `src/styles/tokens.css`

Defines all CSS custom properties on `:root`. Imported once in `index.js`.

Key tokens:
- Color: `--color-primary`, `--color-primary-light`, `--color-teal`, `--color-teal-light`, `--color-mint`, `--color-mint-light`, `--color-peach`, `--color-purple-light`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-surface`, `--color-background`
- Typography: `--font-size-xs` through `--font-size-3xl`
- Spacing: `--space-xs` through `--space-2xl`
- Radius: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`
- Shadow: `--shadow-card`
- Font family: `--font-family-base` (Inter, system-ui fallback)

### `src/styles/components.css`

Shared utility classes consumed across multiple components:

| Class | Description |
|---|---|
| `.btn-primary` | Coral background, white text, pill radius |
| `.btn-secondary` | Transparent bg, coral border, pill radius |
| `.btn-ghost` | Transparent bg, coral border, standard radius |
| `.btn-disabled` | Primary-light bg, not-allowed cursor |
| `.input-field` | Standard input: radius-md, border-color, focus state |
| `.card` | White bg, radius-lg, shadow-card |
| `.card-teal` | Teal bg, white text, radius-lg |
| `.card-primary-light` | Primary-light bg, radius-lg |
| `.page-container` | Max-width 640px, centered, horizontal padding |
| `.page-container--wide` | Max-width 960px variant |
| `.section-heading` | font-size-2xl, text-primary, font-weight 700 |
| `.badge-primary` | Small pill label in primary color |

### `AnnouncementBanner` component

```
Props: none
State: dismissed (boolean, session-scoped via sessionStorage)
Renders: full-width teal strip with message + dismiss button
```

The component reads `sessionStorage.getItem('banner-dismissed')` on mount. If truthy, renders nothing. On dismiss click, sets the key and re-renders to null.

### `Navbar` component (updated)

```
Props: none
State: menuOpen (boolean)
```

New behavior:
- Fixed 64px height on desktop
- White background + `--color-border` bottom border + `--shadow-card`
- Logo uses `--color-primary`
- Nav links use `--color-text-primary`
- Logout button uses `.btn-primary` (pill shape)
- Below 768px: links hidden, hamburger `<button>` shown with `aria-label="Open navigation menu"` and `aria-expanded={menuOpen}`
- When `menuOpen`, a vertical dropdown panel renders the links

### Page component interfaces

All pages are function components with no prop changes. The redesign only affects their rendered JSX and associated CSS. Existing state, effects, and API calls are preserved verbatim.

---

## Data Models

No new data models are introduced. The redesign is purely presentational. Existing API response shapes consumed by each page remain unchanged:

| Page | API calls | Response shape (unchanged) |
|---|---|---|
| DashboardPage | `getProfile()` | `{ data: { name: string } }` |
| ChatPage | `sendChat(text, conversationId)` | `{ data: { reply: string } }` |
| SymptomLoggerPage | `getSymptoms()`, `logSymptom(form)` | `{ data: SymptomEntry[] }` |
| ReportsPage | `getReports()`, `generateReport()` | `{ data: Report[] }` |
| HealthProfilePage | `saveProfile(payload)` | — |

### Session State

`AnnouncementBanner` introduces one new piece of session state:

```
sessionStorage key: 'banner-dismissed'
type: string ('true' | absent)
lifecycle: cleared when browser tab/session ends
```

### CSS Token Reference (Design System)

```css
/* Colors */
--color-primary:        #E8526A
--color-primary-light:  #FFF0F2
--color-teal:           #1B4B5A
--color-teal-light:     #E8F4F7
--color-mint:           #4CAF8A
--color-mint-light:     #E8F8F2
--color-peach:          #FFB347
--color-purple-light:   #F0E8FF
--color-text-primary:   #1A1A2E
--color-text-secondary: #555566
--color-text-muted:     #9999AA
--color-border:         #E8E8F0
--color-surface:        #FFFFFF
--color-background:     #FAFAFA

/* Typography */
--font-size-xs:   12px
--font-size-sm:   14px
--font-size-base: 16px
--font-size-lg:   18px
--font-size-xl:   22px
--font-size-2xl:  28px
--font-size-3xl:  36px

/* Spacing */
--space-xs:  4px
--space-sm:  8px
--space-md:  16px
--space-lg:  24px
--space-xl:  40px
--space-2xl: 64px

/* Radius */
--radius-sm:   8px
--radius-md:   12px
--radius-lg:   20px
--radius-pill: 50px

/* Shadow */
--shadow-card: 0 2px 16px rgba(0, 0, 0, 0.06)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Design token completeness

*For any* render of the application, all required CSS custom properties (`--color-primary`, `--color-primary-light`, `--color-teal`, `--color-teal-light`, `--color-mint`, `--color-mint-light`, `--color-peach`, `--color-purple-light`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-surface`, `--color-background`, all typography tokens, all spacing tokens, all radius tokens, and `--shadow-card`) must be defined in `tokens.css`.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

---

### Property 2: Hamburger menu responsive behavior

*For any* Navbar component (authenticated or public), when the viewport width is less than 768px, the hamburger button must be present in the DOM and the navigation links must not be visible; when the viewport is 768px or wider, the navigation links must be visible and the hamburger button must not be visible.

**Validates: Requirements 2.6, 4.4, 15.3**

---

### Property 3: Hamburger menu toggle

*For any* Navbar in mobile viewport, clicking the hamburger button must toggle the dropdown panel's visibility, and the button's `aria-expanded` attribute must reflect the current open/closed state.

**Validates: Requirements 2.7, 16.4**

---

### Property 4: Announcement banner dismiss round-trip

*For any* session where the AnnouncementBanner has not been dismissed, clicking the dismiss button must hide the banner from the DOM and set `sessionStorage['banner-dismissed']` to `'true'`; re-rendering the component in the same session must not show the banner.

**Validates: Requirements 3.3, 3.4**

---

### Property 5: Auth form element styling

*For any* auth form (LoginPage or RegisterPage), all `<input>` elements must have the `input-field` CSS class, the primary submit button must have the `btn-primary` class, and any ghost/back/resend button must have the `btn-ghost` class.

**Validates: Requirements 9.4, 9.5, 9.6**

---

### Property 6: Auth form validation error display

*For any* auth form field that has a validation error, the error message element must be rendered below that field and must have the `--color-primary` color applied (via class or inline style).

**Validates: Requirements 9.7**

---

### Property 7: Auth form loading state

*For any* auth form submission in progress, the LoadingSpinner component must be rendered and the submit button must not be present.

**Validates: Requirements 9.8**

---

### Property 8: Auth multi-step flow transitions

*For any* LoginPage, the step transitions must be: `credentials → otp` when MFA is required, `credentials → verifyAccount` when the account is unconfirmed, and `otp/verifyAccount → credentials` when the back button is clicked. For any RegisterPage, the step transition must be: `register → verify` after successful sign-up.

**Validates: Requirements 9.9**

---

### Property 9: Dashboard welcome heading contains user name

*For any* authenticated user with a non-empty name in their profile, the Dashboard welcome heading must contain that name.

**Validates: Requirements 10.1**

---

### Property 10: Quick-action card styling

*For any* quick-action card rendered on the Dashboard, the card element must have the `card` CSS class (white background, radius-lg, shadow-card) and a primary-colored icon or accent element.

**Validates: Requirements 10.4**

---

### Property 11: Chat message bubble styling

*For any* user message rendered in ChatPage, the bubble element must have the user-bubble CSS class (primary background, white text, right-aligned pill). *For any* assistant message rendered in ChatPage, the bubble element must have the assistant-bubble CSS class (background color, text-primary, left-aligned pill).

**Validates: Requirements 11.3, 11.4**

---

### Property 12: Chat send button disabled state

*For any* ChatPage state where the input is empty or a request is in flight, the send button must have the `btn-disabled` class and must not have the `btn-primary` class.

**Validates: Requirements 11.6**

---

### Property 13: Chat functionality preservation

*For any* sequence of user messages sent via ChatPage, the component must: append the user message to the list, show the typing indicator while loading, append the assistant reply on success, and show an error message on API failure — matching the behavior of the original implementation.

**Validates: Requirements 11.8**

---

### Property 14: Symptom entry card styling

*For any* symptom entry rendered in SymptomLoggerPage, the entry element must have the `card` CSS class and the symptom type label must have the `--color-primary` color class.

**Validates: Requirements 12.5, 12.6**

---

### Property 15: Symptom logger functionality preservation

*For any* valid symptom form submission, the new entry must appear at the top of the symptom list and the form must reset to its default values.

**Validates: Requirements 12.7**

---

### Property 16: Report card styling

*For any* report card rendered in ReportsPage, the card element must have the `card` CSS class, the date label must have the primary color class, and any download button must have the `btn-ghost` class.

**Validates: Requirements 13.2, 13.3, 13.4**

---

### Property 17: Reports functionality preservation

*For any* ReportsPage, generating a report must prepend the new report to the list; if the API returns a 400, the appropriate error message must be shown; if no reports exist, the empty state element must be rendered.

**Validates: Requirements 13.5, 13.6**

---

### Property 18: Health profile form input styling

*For any* input element in HealthProfilePage, the element must have the `input-field` CSS class, and the submit button must have the `btn-primary` class.

**Validates: Requirements 14.2, 14.4**

---

### Property 19: Health profile functionality preservation

*For any* valid profile form submission, the component must call `saveProfile` with the correct payload and navigate to `/dashboard` on success; if age is empty, the inline age error must be shown and `saveProfile` must not be called.

**Validates: Requirements 14.5**

---

### Property 20: Accessible icon labels

*For any* rendered page, all `<img>` elements that convey meaning must have a non-empty `alt` attribute, and all icon-only interactive elements must have a non-empty `aria-label` attribute.

**Validates: Requirements 16.2**

---

### Property 21: Color contrast compliance

*For any* text color token paired with its intended background token, the computed contrast ratio must be at least 4.5:1 for normal text sizes and at least 3:1 for large text (≥ 18px or bold ≥ 14px), per WCAG 2.1 AA.

**Validates: Requirements 16.3**

---

### Property 22: Form inputs have associated labels

*For any* `<input>` or `<select>` element rendered in any page, the element must either have a corresponding `<label>` with a matching `for`/`id` pair or have a non-empty `aria-label` attribute.

**Validates: Requirements 16.5**

---

### Property 23: No inline style props in page components

*For any* page component file (`LandingPage.jsx`, `LoginPage.jsx`, `RegisterPage.jsx`, `DashboardPage.jsx`, `ChatPage.jsx`, `SymptomLoggerPage.jsx`, `ReportsPage.jsx`, `HealthProfilePage.jsx`), the source must not contain any `style={{` JSX attribute.

**Validates: Requirements 17.4**

---

### Property 24: Shared CSS classes defined in components.css

*For any* CSS class name that appears in two or more component or page files, that class must be defined in `src/styles/components.css` and not in any page-specific CSS file.

**Validates: Requirements 17.5**

---

## Error Handling

### CSS Token Fallbacks

All CSS custom properties should include fallback values in their `var()` calls for browsers that may not support custom properties (though CRA's target browsers all support them). Example: `color: var(--color-primary, #E8526A)`.

### AnnouncementBanner — sessionStorage Unavailable

If `sessionStorage` is unavailable (e.g., private browsing with storage blocked), the banner dismiss should fail silently — the banner will reappear on re-render but the app will not crash. The component should wrap the `sessionStorage` call in a try/catch.

### Navbar Hamburger Menu — Focus Management

When the hamburger menu is closed (either by clicking a link or clicking the button again), focus should return to the hamburger button to maintain keyboard navigation flow. If the focused element is inside the dropdown when it closes, the component should programmatically move focus to the hamburger button.

### Image/Icon Loading Failures

All decorative images (hero illustration, category icons) should have `alt=""` to be ignored by screen readers if they fail to load. Meaningful icons (e.g., quick-action card icons) should have descriptive `alt` or `aria-label` text so the UI remains usable if the image fails.

### API Error States (Preserved)

All existing error handling in page components is preserved unchanged:
- DashboardPage: profile load failure shows `ErrorMessage`
- ChatPage: 401 redirects to login; other errors show `ErrorMessage`
- SymptomLoggerPage: form submit and list load errors show `ErrorMessage`
- ReportsPage: 400 on generate shows specific message; other errors show `ErrorMessage`
- HealthProfilePage: save failure shows `ErrorMessage`

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- **Unit tests** verify specific examples, integration points, and edge cases
- **Property tests** verify universal behaviors across many generated inputs

### Unit Tests

Unit tests use **React Testing Library** (already included in CRA) with **Jest**.

Key unit test scenarios:

- `tokens.css` contains all required custom property names (file content assertion)
- `components.css` contains all required class names (file content assertion)
- `AnnouncementBanner` renders with message text and dismiss button
- `AnnouncementBanner` does not render when `sessionStorage['banner-dismissed']` is set
- `Navbar` renders logo, all nav links, and logout button
- `Navbar` hamburger button has `aria-label="Open navigation menu"` and correct `aria-expanded`
- `LandingPage` renders banner, public nav, hero, categories section, features section, footer
- `LandingPage` "Get Started" click navigates to `/register`
- `LoginPage` renders AuthCard with logo, form fields, and submit button
- `RegisterPage` renders AuthCard with logo, form fields, and submit button
- `DashboardPage` renders welcome heading, tip card, three quick-action cards, appointment card, highlights grid
- `ChatPage` renders Navbar, disclaimer, clear button, input, send button
- `ReportsPage` renders empty state when reports array is empty
- `HealthProfilePage` renders heading, subtitle, age input, condition checkboxes, submit button

### Property-Based Tests

Property-based tests use **fast-check** (install: `npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**. Each test is tagged with a comment referencing the design property.

| Property | Test description | Generator inputs |
|---|---|---|
| Property 2 | Hamburger visibility at any viewport width | `fc.integer({ min: 320, max: 1440 })` for viewport width |
| Property 3 | Hamburger toggle updates aria-expanded | `fc.boolean()` for initial open state |
| Property 4 | Banner dismiss round-trip | `fc.string()` for session key presence |
| Property 5 | Auth form element classes | `fc.constantFrom('login', 'register')` for form type |
| Property 6 | Validation error display | `fc.record({ field: fc.string(), message: fc.string() })` |
| Property 8 | Auth step transitions | `fc.constantFrom('MFA_REQUIRED', 'UserNotConfirmedException', 'SUCCESS')` for auth result |
| Property 9 | Dashboard welcome heading | `fc.string({ minLength: 1 })` for user name |
| Property 11 | Chat bubble classes | `fc.array(fc.record({ role: fc.constantFrom('user', 'assistant'), content: fc.string() }))` |
| Property 12 | Send button disabled state | `fc.boolean()` for loading, `fc.string()` for input value |
| Property 13 | Chat send/receive flow | `fc.string({ minLength: 1 })` for message text |
| Property 14 | Symptom entry card classes | `fc.array(fc.record({ symptomType: fc.string(), severity: fc.integer({ min: 1, max: 10 }), timestamp: fc.date() }))` |
| Property 16 | Report card classes | `fc.array(fc.record({ reportId: fc.uuid(), date: fc.date(), summary: fc.string() }))` |
| Property 18 | Health profile input classes | `fc.record({ age: fc.string(), cycleLength: fc.string() })` |
| Property 21 | Color contrast ratios | `fc.constantFrom(...colorTokenPairs)` for token pairs |
| Property 22 | Form inputs have labels | `fc.constantFrom('login', 'register', 'profile', 'symptoms')` for page |
| Property 23 | No inline style props | `fc.constantFrom(...pageFilePaths)` for file paths |
| Property 24 | Shared classes in components.css | `fc.string()` for class name appearing in multiple files |

**Tag format for each property test:**
```js
// Feature: frontend-redesign, Property N: <property_text>
```

### Testing Notes

- Properties 2, 3 (responsive behavior) require mocking `window.innerWidth` or using a resize observer mock
- Property 21 (color contrast) requires a WCAG contrast ratio calculation utility — use the `relative luminance` formula from WCAG 2.1
- Properties 23, 24 (CSS architecture) are static analysis tests that read file contents rather than rendering components
- Property 13 (chat functionality) requires mocking `sendChat` from `apiService`
- All tests that render components with routing must wrap in `MemoryRouter`
- All tests that render authenticated pages must mock `authService` to return a valid session
