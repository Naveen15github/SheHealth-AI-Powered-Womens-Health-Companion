# Requirements Document

## Introduction

This feature redesigns the entire frontend of the SheHealth app to adopt a visual style inspired by the "Kiddie" maternal health reference design. The redesign applies a soft pink/coral/teal color palette, modern card-based layouts, a structured navigation bar, and a polished landing page to all existing pages — while preserving all current functionality (authentication, health profile, dashboard, AI chat, symptom logging, and reports). No backend changes are required.

## Glossary

- **App**: The SheHealth React single-page application.
- **Design_System**: The shared set of CSS custom properties (color tokens, typography scale, spacing, border-radius, shadow) that all pages and components consume.
- **Navbar**: The top navigation bar rendered on all authenticated pages.
- **LandingPage**: The public-facing root page at `/`.
- **AuthCard**: The centered card container used on LoginPage and RegisterPage.
- **Dashboard**: The authenticated home page at `/dashboard`.
- **ChatPage**: The AI chat interface at `/chat`.
- **SymptomLoggerPage**: The symptom entry and history page at `/symptoms`.
- **ReportsPage**: The health reports list and generation page at `/reports`.
- **HealthProfilePage**: The user profile setup page at `/profile`.
- **Color_Token**: A CSS custom property (e.g. `--color-primary`) defined once in `:root` and referenced throughout the App.
- **Announcement_Banner**: A full-width promotional strip rendered above the Navbar on the LandingPage.
- **HeroSection**: The primary above-the-fold section of the LandingPage containing headline, subtext, and CTA buttons.
- **FeatureCard**: A card component used to highlight a product or feature with an icon, title, and description.
- **Responsive_Breakpoint**: A CSS media query threshold. The App uses two: mobile (< 768 px) and desktop (≥ 768 px).

---

## Requirements

### Requirement 1: Design System — Color Tokens and Typography

**User Story:** As a developer, I want a single source of truth for colors and typography, so that the visual style is consistent across all pages and easy to update.

#### Acceptance Criteria

1. THE Design_System SHALL define the following Color_Tokens as CSS custom properties on `:root`:
   - `--color-primary`: coral/pink (`#E8526A` or equivalent)
   - `--color-primary-light`: soft pink tint (`#FFF0F2`)
   - `--color-teal`: dark teal (`#1B4B5A`)
   - `--color-teal-light`: light teal tint (`#E8F4F7`)
   - `--color-mint`: mint green (`#4CAF8A`)
   - `--color-mint-light`: soft mint tint (`#E8F8F2`)
   - `--color-peach`: peach accent (`#FFB347`)
   - `--color-purple-light`: soft lavender (`#F0E8FF`)
   - `--color-text-primary`: near-black (`#1A1A2E`)
   - `--color-text-secondary`: medium grey (`#555566`)
   - `--color-text-muted`: light grey (`#9999AA`)
   - `--color-border`: light border grey (`#E8E8F0`)
   - `--color-surface`: white (`#FFFFFF`)
   - `--color-background`: off-white page background (`#FAFAFA`)
2. THE Design_System SHALL define a typography scale using CSS custom properties: `--font-size-xs` (12px), `--font-size-sm` (14px), `--font-size-base` (16px), `--font-size-lg` (18px), `--font-size-xl` (22px), `--font-size-2xl` (28px), `--font-size-3xl` (36px).
3. THE Design_System SHALL define spacing tokens: `--space-xs` (4px), `--space-sm` (8px), `--space-md` (16px), `--space-lg` (24px), `--space-xl` (40px), `--space-2xl` (64px).
4. THE Design_System SHALL define `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (20px), `--radius-pill` (50px) for border-radius.
5. THE Design_System SHALL define `--shadow-card` as a subtle box-shadow for card elevation.
6. THE App SHALL use the Google Font "Inter" (or system-ui fallback) as the base font family.

---

### Requirement 2: Navbar Redesign

**User Story:** As a user, I want a clean, modern navigation bar, so that I can easily navigate between app sections.

#### Acceptance Criteria

1. THE Navbar SHALL display the "SheHealth" logo on the left using `--color-primary`.
2. THE Navbar SHALL display navigation links (Dashboard, Chat, Symptoms, Reports) in the center or right area using `--color-text-primary`.
3. THE Navbar SHALL display a "Logout" button styled as a pill button using `--color-primary` as background.
4. THE Navbar SHALL have a white background with a bottom border using `--color-border`.
5. THE Navbar SHALL have a fixed height of 64px on desktop.
6. WHEN the viewport width is less than 768px, THE Navbar SHALL collapse navigation links into a hamburger menu icon.
7. WHEN the hamburger menu is activated, THE Navbar SHALL display navigation links in a vertical dropdown panel.
8. THE Navbar SHALL apply a subtle box-shadow (`--shadow-card`) to visually separate it from page content.

---

### Requirement 3: LandingPage — Announcement Banner

**User Story:** As a visitor, I want to see a promotional banner at the top of the landing page, so that I am aware of key offerings.

#### Acceptance Criteria

1. THE LandingPage SHALL render an Announcement_Banner above the Navbar with a `--color-teal` background and white text.
2. THE Announcement_Banner SHALL display a short promotional message (e.g. "Your compassionate AI health companion — now with weekly reports").
3. THE Announcement_Banner SHALL have a dismiss button that hides the banner for the current session.
4. WHEN the Announcement_Banner is dismissed, THE App SHALL not re-display it until the browser session ends.

---

### Requirement 4: LandingPage — Navbar (Public)

**User Story:** As a visitor, I want a navigation bar on the landing page with clear sign-up and login options, so that I can quickly access the app.

#### Acceptance Criteria

1. THE LandingPage SHALL render a public Navbar with the "SheHealth" logo, navigation links (Features, How It Works), a search icon, and a "Sign Up" pill button using `--color-primary`.
2. THE LandingPage public Navbar SHALL have a white background with `--color-border` bottom border.
3. WHEN the "Sign Up" button is clicked, THE App SHALL navigate to `/register`.
4. WHEN the viewport width is less than 768px, THE LandingPage public Navbar SHALL collapse links into a hamburger menu.

---

### Requirement 5: LandingPage — Hero Section

**User Story:** As a visitor, I want a compelling hero section, so that I immediately understand the app's value and can take action.

#### Acceptance Criteria

1. THE HeroSection SHALL display a bold headline using `--font-size-3xl` and `--color-text-primary`, with a `--color-primary` accent word or phrase.
2. THE HeroSection SHALL display a subtitle paragraph using `--font-size-base` and `--color-text-secondary`.
3. THE HeroSection SHALL display a "Get Started" primary CTA button styled with `--color-primary` background and `--radius-pill`.
4. THE HeroSection SHALL display a "Learn More" secondary CTA button styled with a `--color-primary` border and transparent background.
5. WHEN "Get Started" is clicked, THE App SHALL navigate to `/register`.
6. WHEN "Learn More" is clicked, THE App SHALL scroll to the features section on the LandingPage.
7. THE HeroSection SHALL display a Trustpilot-style social proof element (star rating and user count text).
8. THE HeroSection SHALL use a two-column layout on desktop (text left, illustrative graphic right) and a single-column stacked layout on mobile.

---

### Requirement 6: LandingPage — Explore Categories Section

**User Story:** As a visitor, I want to browse health feature categories, so that I can understand what the app offers.

#### Acceptance Criteria

1. THE LandingPage SHALL render an "Explore Categories" section below the HeroSection.
2. THE "Explore Categories" section SHALL display at least four category cards (e.g. AI Chat, Symptom Tracking, Health Reports, Pregnancy Wellness) in a horizontally scrollable row on mobile and a grid on desktop.
3. EACH category card SHALL display an icon, a category name, and use a pastel background color drawn from the Design_System color tokens.
4. WHEN a category card is clicked, THE App SHALL scroll to or navigate to the relevant section or page.

---

### Requirement 7: LandingPage — Features Grid Section

**User Story:** As a visitor, I want to see the app's key features presented clearly, so that I can decide whether to sign up.

#### Acceptance Criteria

1. THE LandingPage SHALL render a "Features" section with a section heading using `--font-size-2xl`.
2. THE Features section SHALL display at least three FeatureCards in a responsive grid (1 column on mobile, 3 columns on desktop).
3. EACH FeatureCard SHALL display an emoji or SVG icon, a title, and a description.
4. EACH FeatureCard SHALL have a white background, `--radius-lg` border-radius, and `--shadow-card` box-shadow.
5. EACH FeatureCard SHALL use a pastel accent color from the Design_System for the icon background.

---

### Requirement 8: LandingPage — Footer Section

**User Story:** As a visitor, I want a footer with key links and a call-to-action, so that I can find important information and sign up.

#### Acceptance Criteria

1. THE LandingPage SHALL render a footer section with a "Join SheHealth Today" heading and a "Sign Up Free" CTA button.
2. THE footer SHALL display a copyright notice and a disclaimer: "General health information only. Always consult a qualified doctor."
3. THE footer SHALL use `--color-teal` as the background color with white text.

---

### Requirement 9: Authentication Pages (Login and Register) Redesign

**User Story:** As a user, I want polished login and registration forms, so that the authentication experience feels trustworthy and modern.

#### Acceptance Criteria

1. THE LoginPage and RegisterPage SHALL center an AuthCard on the page with a `--color-primary-light` gradient background.
2. THE AuthCard SHALL have a white background, `--radius-lg` border-radius, and `--shadow-card` box-shadow.
3. THE AuthCard SHALL display the "SheHealth" logo in `--color-primary` at the top.
4. ALL form input fields SHALL have `--radius-md` border-radius, `--color-border` default border, and a `--color-primary` focus border.
5. THE primary submit button SHALL use `--color-primary` background and `--radius-pill` border-radius.
6. THE secondary/ghost button (Back, Resend) SHALL use a `--color-primary` border with transparent background.
7. WHEN a form field has a validation error, THE AuthCard SHALL display the error message in `--color-primary` below the field.
8. WHEN the form is submitting, THE AuthCard SHALL display a loading spinner styled with `--color-primary`.
9. THE LoginPage and RegisterPage SHALL preserve all existing multi-step flows (OTP verification, account confirmation, resend code).

---

### Requirement 10: Dashboard Page Redesign

**User Story:** As an authenticated user, I want a visually engaging dashboard, so that I can quickly access all app features and see my daily health tip.

#### Acceptance Criteria

1. THE Dashboard SHALL display a welcome heading with the user's name using `--font-size-2xl` and `--color-text-primary`.
2. THE Dashboard SHALL display a "Daily Tip" card with a `--color-primary-light` background, a `--color-primary` label, and tip text.
3. THE Dashboard SHALL display quick-action cards for Chat, Log Symptoms, and View Reports in a responsive grid.
4. EACH quick-action card SHALL have a white background, `--radius-lg` border-radius, `--shadow-card`, and a `--color-primary` icon or accent.
5. WHEN a quick-action card is hovered, THE Dashboard SHALL apply a `--color-primary` background with white text transition.
6. THE Dashboard SHALL display a "Schedule / Upcoming" placeholder card styled with `--color-teal` background and white text, consistent with the reference design's appointment card.
7. THE Dashboard SHALL display a feature highlights grid (icons for key health topics) below the quick-action cards, using pastel icon backgrounds from the Design_System.

---

### Requirement 11: Chat Page Redesign

**User Story:** As a user, I want a clean, modern chat interface, so that conversations with the AI feel comfortable and easy to follow.

#### Acceptance Criteria

1. THE ChatPage SHALL display the Navbar at the top.
2. THE ChatPage SHALL display a disclaimer banner below the Navbar with a `--color-primary-light` background and `--color-text-primary` text.
3. User message bubbles SHALL use `--color-primary` background with white text and a right-aligned pill shape.
4. Assistant message bubbles SHALL use `--color-background` background with `--color-text-primary` text and a left-aligned pill shape.
5. THE ChatPage input area SHALL have a rounded text input with `--color-border` border and a send button using `--color-primary`.
6. WHEN the send button is disabled (empty input or loading), THE ChatPage SHALL render the send button with `--color-primary-light` background.
7. THE ChatPage SHALL display a "Clear Conversation" button styled as a ghost button using `--color-primary` border.
8. THE ChatPage SHALL preserve all existing chat functionality (send, receive, typing indicator, error handling, session management).

---

### Requirement 12: Symptom Logger Page Redesign

**User Story:** As a user, I want a well-structured symptom logging interface, so that entering and reviewing symptoms feels intuitive.

#### Acceptance Criteria

1. THE SymptomLoggerPage SHALL display a "Log a Symptom" form card with `--color-primary-light` background and `--radius-lg` border-radius.
2. THE symptom type selector SHALL be styled consistently with the Design_System input styles.
3. THE severity slider SHALL use `--color-primary` as the accent color.
4. THE submit button SHALL use `--color-primary` background and `--radius-pill`.
5. EACH logged symptom entry SHALL be displayed as a card with white background, `--color-border` border, and `--radius-md` border-radius.
6. THE symptom type label on each entry card SHALL use `--color-primary` color.
7. THE SymptomLoggerPage SHALL preserve all existing functionality (form submission, symptom list, error handling).

---

### Requirement 13: Reports Page Redesign

**User Story:** As a user, I want a polished reports page, so that viewing and generating health reports feels professional.

#### Acceptance Criteria

1. THE ReportsPage SHALL display a page header with the "Health Reports" title and a "Generate Weekly Report" button using `--color-primary` and `--radius-pill`.
2. EACH report card SHALL have a white background, `--color-border` border, `--radius-lg` border-radius, and `--shadow-card`.
3. THE report date label SHALL use `--color-primary` color.
4. THE download button SHALL be styled as a ghost button with `--color-primary` border.
5. WHEN no reports exist, THE ReportsPage SHALL display an empty state illustration or icon with a descriptive message.
6. THE ReportsPage SHALL preserve all existing functionality (report generation, list display, download, error handling).

---

### Requirement 14: Health Profile Page Redesign

**User Story:** As a new user, I want a welcoming profile setup page, so that entering my health information feels easy and trustworthy.

#### Acceptance Criteria

1. THE HealthProfilePage SHALL display a page heading and subtitle using Design_System typography tokens.
2. ALL form inputs SHALL follow the Design_System input styles (border-radius, border color, focus state).
3. THE health condition checkboxes SHALL use `--color-primary` as the accent color.
4. THE submit button SHALL use `--color-primary` background and `--radius-pill`.
5. THE HealthProfilePage SHALL preserve all existing functionality (form validation, profile save, navigation to dashboard).

---

### Requirement 15: Responsive Design

**User Story:** As a user on any device, I want the app to display correctly, so that I can use it on mobile and desktop.

#### Acceptance Criteria

1. THE App SHALL be fully usable at viewport widths from 320px to 1440px.
2. WHEN the viewport width is less than 768px, THE App SHALL display single-column layouts for all multi-column sections.
3. WHEN the viewport width is less than 768px, THE Navbar SHALL collapse to a hamburger menu.
4. THE App SHALL not display horizontal scrollbars at any supported viewport width, except for intentionally scrollable carousels.
5. ALL touch targets (buttons, links, inputs) SHALL have a minimum height of 44px on mobile viewports.

---

### Requirement 16: Accessibility

**User Story:** As a user with accessibility needs, I want the redesigned UI to be navigable and readable, so that I can use the app regardless of ability.

#### Acceptance Criteria

1. ALL interactive elements (buttons, links, inputs) SHALL have visible focus indicators using `--color-primary` outline.
2. ALL images and icons that convey meaning SHALL have descriptive `alt` text or `aria-label` attributes.
3. THE color contrast ratio between text and its background SHALL meet WCAG 2.1 AA minimum (4.5:1 for normal text, 3:1 for large text).
4. THE Navbar hamburger menu button SHALL have an `aria-label` of "Open navigation menu" and `aria-expanded` reflecting the open/closed state.
5. ALL form inputs SHALL have associated `<label>` elements or `aria-label` attributes.

---

### Requirement 17: CSS Architecture

**User Story:** As a developer, I want a maintainable CSS structure, so that the design system is easy to extend and override.

#### Acceptance Criteria

1. THE App SHALL define all Color_Tokens, typography tokens, spacing tokens, and radius tokens in a single `src/styles/tokens.css` file imported globally.
2. THE App SHALL define shared component styles (buttons, inputs, cards) in a `src/styles/components.css` file.
3. EACH page component MAY have a co-located CSS file for page-specific layout styles.
4. THE App SHALL remove all inline `style` prop objects from page components and replace them with CSS class names.
5. IF a CSS class is used in more than one component, THE App SHALL define it in `src/styles/components.css` rather than in a page-specific file.
