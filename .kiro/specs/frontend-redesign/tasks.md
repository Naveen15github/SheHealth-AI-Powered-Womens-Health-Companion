# Implementation Plan: SheHealth Frontend Redesign

## Overview

Migrate the SheHealth React SPA from inline styles to a token-driven CSS architecture, then progressively redesign each page and component to match the Kiddie-inspired maternal health reference design. All existing functionality is preserved throughout.

## Tasks

- [x] 1. Set up CSS architecture — tokens and shared component styles
  - [x] 1.1 Create `src/styles/tokens.css` with all CSS custom properties on `:root`
    - Define all 14 color tokens, 7 typography tokens, 6 spacing tokens, 4 radius tokens, and `--shadow-card`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [ ]* 1.2 Write property test for design token completeness
    - **Property 1: Design token completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  - [x] 1.3 Create `src/styles/components.css` with all shared utility classes
    - Implement `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-disabled`, `.input-field`, `.card`, `.card-teal`, `.card-primary-light`, `.page-container`, `.page-container--wide`, `.section-heading`, `.badge-primary`
    - _Requirements: 17.1, 17.2, 17.5_
  - [ ]* 1.4 Write unit test asserting all required class names exist in `components.css`
    - Test file content for presence of each class selector
    - _Requirements: 17.2_
  - [x] 1.5 Import `tokens.css` and `components.css` globally in `src/index.js`
    - Add Google Fonts Inter `<link>` tag to `public/index.html`
    - _Requirements: 1.6, 17.1_


- [x] 2. Redesign Navbar component
  - [x] 2.1 Update `src/components/Navbar.jsx` with new visual styles and hamburger menu
    - Apply white background, `--color-border` bottom border, `--shadow-card`, fixed 64px height
    - Logo in `--color-primary`, nav links in `--color-text-primary`, logout as `.btn-primary`
    - Add `menuOpen` state, hamburger `<button>` with `aria-label="Open navigation menu"` and `aria-expanded={menuOpen}`
    - Render vertical dropdown panel when `menuOpen` is true
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 16.4_
  - [ ]* 2.2 Write property test for hamburger menu responsive behavior
    - **Property 2: Hamburger menu responsive behavior**
    - **Validates: Requirements 2.6, 4.4, 15.3**
  - [ ]* 2.3 Write property test for hamburger menu toggle and aria-expanded
    - **Property 3: Hamburger menu toggle**
    - **Validates: Requirements 2.7, 16.4**
  - [ ]* 2.4 Write unit tests for Navbar
    - Test logo, nav links, logout button render; hamburger aria attributes
    - _Requirements: 2.1, 2.2, 2.3, 16.4_

- [x] 3. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build `AnnouncementBanner` component and redesign `LandingPage`
  - [x] 4.1 Create `src/components/AnnouncementBanner.jsx`
    - Read `sessionStorage['banner-dismissed']` on mount; render null if set
    - Render full-width teal strip with promotional message and dismiss button
    - On dismiss: set `sessionStorage['banner-dismissed'] = 'true'` inside try/catch, update state to hide
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 4.2 Write property test for announcement banner dismiss round-trip
    - **Property 4: Announcement banner dismiss round-trip**
    - **Validates: Requirements 3.3, 3.4**
  - [ ]* 4.3 Write unit tests for AnnouncementBanner
    - Test renders with message; does not render when sessionStorage key is set
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [x] 4.4 Rewrite `src/pages/LandingPage.jsx` with all new sections
    - Public navbar with logo, Features/How It Works links, search icon, Sign Up `.btn-primary` pill (navigates to `/register`)
    - HeroSection: bold headline with primary accent, subtitle, Get Started + Learn More CTAs, social proof element, two-column desktop / single-column mobile layout
    - Explore Categories section: 4+ category cards in horizontal scroll on mobile, grid on desktop
    - Features grid: 3+ FeatureCards with icon, title, description; white bg, `--radius-lg`, `--shadow-card`
    - Footer: "Join SheHealth Today" heading, Sign Up Free CTA, copyright, disclaimer; `--color-teal` background
    - Render `AnnouncementBanner` above public navbar
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 5.1–5.8, 6.1–6.4, 7.1–7.5, 8.1–8.3, 15.2_
  - [ ]* 4.5 Write unit tests for LandingPage sections
    - Test banner, public nav, hero CTAs, categories section, features section, footer render
    - _Requirements: 3.1, 4.1, 5.3, 5.5, 5.6_


- [x] 5. Redesign authentication pages (LoginPage and RegisterPage)
  - [x] 5.1 Update `src/pages/LoginPage.jsx` to use AuthCard pattern and CSS classes
    - Center AuthCard with `--color-primary-light` gradient background; white bg, `--radius-lg`, `--shadow-card`
    - Logo in `--color-primary` at top; all inputs get `.input-field`; submit gets `.btn-primary`; ghost/back/resend get `.btn-ghost`
    - Error messages rendered below fields with `--color-primary` color; loading spinner shown during submission
    - Preserve all existing multi-step flows (credentials → otp, credentials → verifyAccount, back transitions)
    - Remove all `style={{` inline props
    - _Requirements: 9.1–9.9, 17.4_
  - [x] 5.2 Update `src/pages/RegisterPage.jsx` to use AuthCard pattern and CSS classes
    - Same AuthCard treatment as LoginPage; preserve register → verify step transition
    - Remove all `style={{` inline props
    - _Requirements: 9.1–9.9, 17.4_
  - [ ]* 5.3 Write property test for auth form element CSS classes
    - **Property 5: Auth form element styling**
    - **Validates: Requirements 9.4, 9.5, 9.6**
  - [ ]* 5.4 Write property test for auth form validation error display
    - **Property 6: Auth form validation error display**
    - **Validates: Requirements 9.7**
  - [ ]* 5.5 Write property test for auth form loading state
    - **Property 7: Auth form loading state**
    - **Validates: Requirements 9.8**
  - [ ]* 5.6 Write property test for auth multi-step flow transitions
    - **Property 8: Auth multi-step flow transitions**
    - **Validates: Requirements 9.9**
  - [ ]* 5.7 Write unit tests for LoginPage and RegisterPage
    - Test AuthCard renders logo, fields, submit; error and loading states
    - _Requirements: 9.1–9.9_

- [x] 6. Checkpoint — Ensure all tests pass, ask the user if questions arise.

- [x] 7. Redesign DashboardPage
  - [x] 7.1 Update `src/pages/DashboardPage.jsx` with new layout and components
    - Welcome heading with user name using `--font-size-2xl`
    - Daily Tip card with `--color-primary-light` background and `--color-primary` label
    - Three quick-action cards (Chat, Log Symptoms, View Reports) in responsive grid; each with `.card` class and primary icon/accent; hover transition to primary background with white text
    - Schedule/Upcoming placeholder card with `.card-teal`
    - Feature highlights grid with pastel icon backgrounds
    - Remove all `style={{` inline props
    - _Requirements: 10.1–10.7, 17.4_
  - [ ]* 7.2 Write property test for dashboard welcome heading contains user name
    - **Property 9: Dashboard welcome heading contains user name**
    - **Validates: Requirements 10.1**
  - [ ]* 7.3 Write property test for quick-action card styling
    - **Property 10: Quick-action card styling**
    - **Validates: Requirements 10.4**
  - [ ]* 7.4 Write unit tests for DashboardPage
    - Test welcome heading, tip card, quick-action cards, appointment card, highlights grid
    - _Requirements: 10.1–10.7_

- [x] 8. Redesign ChatPage
  - [x] 8.1 Update `src/pages/ChatPage.jsx` with new visual styles
    - Disclaimer banner below Navbar with `--color-primary-light` background
    - User bubbles: primary bg, white text, right-aligned pill; assistant bubbles: background color, text-primary, left-aligned pill
    - Rounded input with `--color-border`; send button `.btn-primary` when active, `.btn-disabled` when empty/loading
    - Clear Conversation as `.btn-ghost`
    - Preserve all existing chat logic (send, receive, typing indicator, error handling, session management)
    - Remove all `style={{` inline props
    - _Requirements: 11.1–11.8, 17.4_
  - [ ]* 8.2 Write property test for chat message bubble styling
    - **Property 11: Chat message bubble styling**
    - **Validates: Requirements 11.3, 11.4**
  - [ ]* 8.3 Write property test for chat send button disabled state
    - **Property 12: Chat send button disabled state**
    - **Validates: Requirements 11.6**
  - [ ]* 8.4 Write property test for chat send/receive functionality preservation
    - **Property 13: Chat functionality preservation**
    - **Validates: Requirements 11.8**
  - [ ]* 8.5 Write unit tests for ChatPage
    - Test disclaimer, bubble classes, send button states, clear button
    - _Requirements: 11.1–11.8_


- [x] 9. Redesign SymptomLoggerPage
  - [x] 9.1 Update `src/pages/SymptomLoggerPage.jsx` with new visual styles
    - Log form wrapped in card with `--color-primary-light` background and `--radius-lg`
    - Symptom type selector and severity slider styled with Design_System tokens; slider accent `--color-primary`
    - Submit button as `.btn-primary`
    - Each symptom entry as `.card` with `--color-border` border; symptom type label in `--color-primary`
    - Preserve all existing functionality (form submission, symptom list, error handling)
    - Remove all `style={{` inline props
    - _Requirements: 12.1–12.7, 17.4_
  - [ ]* 9.2 Write property test for symptom entry card styling
    - **Property 14: Symptom entry card styling**
    - **Validates: Requirements 12.5, 12.6**
  - [ ]* 9.3 Write property test for symptom logger functionality preservation
    - **Property 15: Symptom logger functionality preservation**
    - **Validates: Requirements 12.7**
  - [ ]* 9.4 Write unit tests for SymptomLoggerPage
    - Test form card, entry cards, submit button, error handling
    - _Requirements: 12.1–12.7_

- [x] 10. Redesign ReportsPage
  - [x] 10.1 Update `src/pages/ReportsPage.jsx` with new visual styles
    - Page header with "Health Reports" title and Generate Weekly Report as `.btn-primary` pill
    - Each report card as `.card` with `--color-border` border; date label in `--color-primary`; download as `.btn-ghost`
    - Empty state with icon/illustration and descriptive message when no reports exist
    - Preserve all existing functionality (generation, list, download, error handling)
    - Remove all `style={{` inline props
    - _Requirements: 13.1–13.6, 17.4_
  - [ ]* 10.2 Write property test for report card styling
    - **Property 16: Report card styling**
    - **Validates: Requirements 13.2, 13.3, 13.4**
  - [ ]* 10.3 Write property test for reports functionality preservation
    - **Property 17: Reports functionality preservation**
    - **Validates: Requirements 13.5, 13.6**
  - [ ]* 10.4 Write unit tests for ReportsPage
    - Test report cards, empty state, generate button, download button
    - _Requirements: 13.1–13.6_

- [x] 11. Redesign HealthProfilePage
  - [x] 11.1 Update `src/pages/HealthProfilePage.jsx` with new visual styles
    - Page heading and subtitle using Design_System typography tokens
    - All inputs get `.input-field`; health condition checkboxes accented with `--color-primary`; submit as `.btn-primary`
    - Preserve all existing functionality (form validation, profile save, navigation to dashboard)
    - Remove all `style={{` inline props
    - _Requirements: 14.1–14.5, 17.4_
  - [ ]* 11.2 Write property test for health profile form input styling
    - **Property 18: Health profile form input styling**
    - **Validates: Requirements 14.2, 14.4**
  - [ ]* 11.3 Write property test for health profile functionality preservation
    - **Property 19: Health profile functionality preservation**
    - **Validates: Requirements 14.5**
  - [ ]* 11.4 Write unit tests for HealthProfilePage
    - Test heading, inputs, checkboxes, submit button, validation error, save flow
    - _Requirements: 14.1–14.5_

- [x] 12. Checkpoint — Ensure all tests pass, ask the user if questions arise.


- [x] 13. Accessibility and CSS architecture validation
  - [x] 13.1 Audit all interactive elements for visible focus indicators using `--color-primary` outline
    - Add focus styles to any button, link, or input missing them in `components.css`
    - _Requirements: 16.1_
  - [x] 13.2 Audit all images and icon-only interactive elements for `alt` / `aria-label` attributes
    - Add descriptive `alt` text to meaningful images; `alt=""` to decorative images; `aria-label` to icon-only buttons
    - _Requirements: 16.2_
  - [x] 13.3 Audit all form inputs across all pages for associated `<label>` or `aria-label`
    - Fix any input missing a label association
    - _Requirements: 16.5_
  - [ ]* 13.4 Write property test for accessible icon labels
    - **Property 20: Accessible icon labels**
    - **Validates: Requirements 16.2**
  - [ ]* 13.5 Write property test for color contrast compliance
    - **Property 21: Color contrast compliance**
    - Implement WCAG 2.1 relative luminance formula to compute contrast ratios for all token pairs
    - **Validates: Requirements 16.3**
  - [ ]* 13.6 Write property test for form inputs having associated labels
    - **Property 22: Form inputs have associated labels**
    - **Validates: Requirements 16.5**
  - [x] 13.7 Verify no `style={{` inline props remain in any page component file
    - Search all page files and remove any remaining inline style props, replacing with CSS classes
    - _Requirements: 17.4_
  - [ ]* 13.8 Write property test for no inline style props in page components
    - **Property 23: No inline style props in page components**
    - **Validates: Requirements 17.4**
  - [ ]* 13.9 Write property test for shared CSS classes defined in components.css
    - **Property 24: Shared CSS classes defined in components.css**
    - **Validates: Requirements 17.5**

- [x] 14. Responsive design verification and final wiring
  - [x] 14.1 Add responsive CSS rules for all multi-column sections
    - Ensure single-column layouts below 768px for hero, categories, features grid, dashboard grid, quick-action cards
    - Ensure no horizontal scrollbars at 320px–1440px (except intentional carousels)
    - Ensure all touch targets have minimum 44px height on mobile
    - _Requirements: 15.1, 15.2, 15.4, 15.5_
  - [x] 14.2 Update `src/components/ErrorMessage.jsx` and `src/components/LoadingSpinner.jsx` to use CSS classes
    - Replace any inline styles with class names from `components.css`
    - _Requirements: 17.4_
  - [x] 14.3 Verify all page-specific CSS files are co-located and only contain layout rules not shared elsewhere
    - Move any class used in 2+ files to `components.css`
    - _Requirements: 17.3, 17.5_

- [x] 15. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (`npm install --save-dev fast-check`) with minimum 100 iterations each
- All component tests must wrap in `MemoryRouter`; authenticated page tests must mock `authService`
- Properties 2, 3 require mocking `window.innerWidth`; Property 21 requires the WCAG relative luminance formula
- Properties 23, 24 are static analysis tests that read file contents rather than render components
