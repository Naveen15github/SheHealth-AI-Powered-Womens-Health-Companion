# Implementation Plan: SheHealth App

## Overview

Build the SheHealth women's health AI web application in the `shehealth/` folder. The implementation uses React (Create React App) for the frontend and Node.js 18 Lambda functions for the backend, wired together via API Gateway with Cognito JWT authorization. All AWS infrastructure is provisioned manually (DynamoDB, S3, Cognito, API Gateway) and referenced via environment variables.

## Tasks

- [x] 1. Scaffold project structure
  - Create `shehealth/` root folder with `frontend/` and `lambda/` subdirectories
  - Initialize React app in `shehealth/frontend/` using Create React App
  - Create `shehealth/lambda/chatHandler/`, `shehealth/lambda/symptomHandler/`, `shehealth/lambda/reportHandler/` folders each with their own `package.json`
  - Install frontend dependencies: `axios`, `react-router-dom`, `amazon-cognito-identity-js`
  - Install Lambda dependencies: `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `@aws-sdk/client-bedrock-runtime`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` in each Lambda folder
  - Install test dependencies in `shehealth/frontend/`: `fast-check`, `jest` (already included with CRA)
  - Install test dependencies in each Lambda folder: `fast-check`, `jest`
  - Create `shehealth/frontend/.env` with placeholder values for `REACT_APP_COGNITO_USER_POOL_ID`, `REACT_APP_COGNITO_CLIENT_ID`, `REACT_APP_API_BASE_URL`
  - _Requirements: 11.2_

- [x] 2. AWS infrastructure setup
  - Create `shehealth/infrastructure/setup.md` documenting the manual AWS console steps:
    - DynamoDB table `shehealth-users` (PK: `userId` String)
    - DynamoDB table `shehealth-symptoms` (PK: `userId` String, SK: `timestamp` String)
    - DynamoDB table `shehealth-conversations` (PK: `userId` String, SK: `recordId` String)
    - S3 bucket `shehealth-reports` with private ACL
    - Cognito User Pool with email+password sign-in, minimum 8-char password policy, app client (no secret)
    - API Gateway REST API with Cognito Authorizer, CORS enabled (origins: `*`, methods: GET POST OPTIONS, headers: Content-Type Authorization)
    - API routes: POST /profile, GET /profile, POST /chat, POST /symptoms, GET /symptoms, POST /reports/generate, GET /reports
    - Lambda IAM role with DynamoDB full access on the three tables, S3 read/write on `shehealth-reports`, Bedrock `InvokeModel` permission
    - Lambda environment variables for all three functions: `BEDROCK_REGION`, `DYNAMODB_TABLE_USERS`, `DYNAMODB_TABLE_SYMPTOMS`, `DYNAMODB_TABLE_CONVERSATIONS`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `REPORTS_BUCKET`
  - _Requirements: 9.3, 11.1_

- [x] 3. Implement shared frontend components and services
  - [x] 3.1 Create `authService.js` in `shehealth/frontend/src/services/`
    - Implement `signUp(name, email, password)` using `amazon-cognito-identity-js` CognitoUserPool
    - Implement `signIn(email, password)` returning the IdToken string
    - Implement `signOut()` clearing localStorage
    - Implement `getToken()` returning stored IdToken or null
    - Implement `getCurrentUser()` returning decoded token payload (name, sub) or null
    - Store IdToken under key `shehealth_token` in localStorage
    - _Requirements: 1.1, 1.2, 2.1, 2.5_

  - [ ]* 3.2 Write property tests for authService
    - **Property 2: Short passwords are always rejected**
    - **Validates: Requirements 1.4**
    - **Property 5: API requests carry Authorization header**
    - **Validates: Requirements 2.3**
    - File: `shehealth/frontend/src/tests/property/auth.property.test.js`

  - [x] 3.3 Create `apiService.js` in `shehealth/frontend/src/services/`
    - Create an Axios instance with `baseURL` from `REACT_APP_API_BASE_URL`
    - Add a request interceptor that reads `getToken()` and sets `Authorization: Bearer <token>` on every request
    - Add a response interceptor that catches 401 responses and redirects to `/login`
    - Export typed methods: `getProfile()`, `saveProfile(data)`, `sendChat(message, conversationId)`, `logSymptom(data)`, `getSymptoms()`, `generateReport()`, `getReports()`
    - _Requirements: 2.3, 2.4_

  - [ ]* 3.4 Write property tests for apiService
    - **Property 5: API requests always carry the Authorization header**
    - **Validates: Requirements 2.3**
    - File: `shehealth/frontend/src/tests/property/auth.property.test.js`

  - [x] 3.5 Create shared UI components
    - `ProtectedRoute.jsx`: check `getToken()`, if null redirect to `/login`; if token expired (check `exp` claim) redirect to `/login`; otherwise render children
    - `LoadingSpinner.jsx`: centered spinner using CSS animation, brand color `#e91e8c`
    - `ErrorMessage.jsx`: inline error display, plain-English text, no stack traces
    - `Navbar.jsx`: authenticated nav with links to Dashboard, Chat, Symptoms, Reports, and a Logout button that calls `signOut()` and redirects to `/`
    - _Requirements: 2.4, 2.5, 10.1, 10.3, 10.4_

- [x] 4. Implement public pages (Landing, Register, Login)
  - [x] 4.1 Create `LandingPage.jsx`
    - Hero section with tagline "Your health, your voice"
    - "Sign Up" button navigating to `/register`
    - "Log In" button navigating to `/login`
    - Mobile-first responsive CSS (320px–1920px), brand color `#e91e8c` on buttons
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2_

  - [x] 4.2 Create `RegisterPage.jsx`
    - Form fields: name, email, password (min 8 chars with inline validation error)
    - On submit: call `authService.signUp()`, on success redirect to `/profile`
    - Display inline error messages for duplicate email and short password
    - Show `LoadingSpinner` while request is in flight; show `ErrorMessage` on failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.3, 10.4_

  - [x] 4.3 Create `LoginPage.jsx`
    - Form fields: email, password
    - On submit: call `authService.signIn()`, store token, then call `getProfile()` — if 404 redirect to `/profile`, else redirect to `/dashboard`
    - Display inline error for invalid credentials
    - Show `LoadingSpinner` while request is in flight; show `ErrorMessage` on failure
    - _Requirements: 2.1, 2.2, 3.1, 10.3, 10.4_

- [x] 5. Implement protected pages (Profile, Dashboard)
  - [x] 5.1 Create `HealthProfilePage.jsx`
    - Form fields: age (number, required with inline error if empty), healthConditions (multi-select checkboxes: PCOS, thyroid, endometriosis, other), cycleLength (number)
    - On submit: call `apiService.saveProfile(data)`, on success redirect to `/dashboard`
    - Show `LoadingSpinner` during save; show `ErrorMessage` on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 10.3, 10.4_

  - [x] 5.2 Create `DashboardPage.jsx`
    - On mount: call `apiService.getProfile()` to retrieve user name; show `LoadingSpinner` while loading
    - Display welcome message with user's name
    - Display a static daily health tip (rotate from a hardcoded array of 7 tips, index by `dayOfYear % 7`)
    - Three quick-action buttons: "Chat" → `/chat`, "Log Symptoms" → `/symptoms`, "View Reports" → `/reports`
    - On load failure: show `ErrorMessage` with plain-English message
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.3, 10.4_

- [x] 6. Implement App router and wire public/protected routes
  - Update `App.jsx` to use `react-router-dom` v6 `<Routes>`
  - Public routes: `/` → LandingPage, `/register` → RegisterPage, `/login` → LoginPage
  - Protected routes (wrapped in `ProtectedRoute`): `/profile` → HealthProfilePage, `/dashboard` → DashboardPage, `/chat` → ChatPage (stub), `/symptoms` → SymptomLoggerPage (stub), `/reports` → ReportsPage (stub)
  - Apply global CSS: font-family, brand color variable `--brand: #e91e8c`, mobile-first base styles
  - _Requirements: 2.4, 3.1, 4.2, 4.3, 10.1, 10.2_

- [ ] 7. Checkpoint — verify frontend shell
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement chatHandler Lambda
  - [x] 8.1 Create `shehealth/lambda/chatHandler/index.js`
    - At cold start: validate all required env vars (`BEDROCK_REGION`, `DYNAMODB_TABLE_USERS`, `DYNAMODB_TABLE_CONVERSATIONS`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`); if any missing, log descriptive error and return HTTP 500 for all requests
    - Extract `userId` from `event.requestContext.authorizer.claims.sub` only
    - Route `GET /profile`: `GetItem` from `shehealth-users` by `userId`, return profile fields
    - Route `POST /profile`: `PutItem` to `shehealth-users` with `userId`, `name`, `age`, `healthConditions`, `cycleLength`, `createdAt`
    - Route `POST /chat`: parse `{ message, conversationId }` from body; query last 10 messages from `shehealth-conversations` by `userId + conversationId` sorted by `createdAt` desc; build Bedrock request with exact system prompt + history + new message; call `BedrockRuntimeClient.InvokeModel` with model `anthropic.claude-sonnet-4-20250514`; save user message and AI response to `shehealth-conversations` with all required fields; return `{ reply, conversationId }`
    - On Bedrock error: return HTTP 500 with plain-English message
    - Add CORS headers to all responses
    - _Requirements: 3.3, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.10, 9.1, 9.2, 11.1, 11.3_

  - [ ]* 8.2 Write unit tests for chatHandler
    - Test profile GET/POST happy paths with mocked DynamoDB
    - Test chat happy path with mocked Bedrock and DynamoDB
    - Test Bedrock error returns HTTP 500
    - Test missing env var returns HTTP 500
    - File: `shehealth/lambda/chatHandler/tests/chatHandler.test.js`
    - _Requirements: 6.1–6.6, 6.10, 11.3_

  - [ ]* 8.3 Write property tests for chatHandler
    - **Property 7: Health profile userId always equals JWT sub**
    - **Validates: Requirements 3.3, 9.1**
    - **Property 8: Chat context is capped at the last 10 messages**
    - **Validates: Requirements 6.3**
    - **Property 9: Bedrock request always includes the exact system prompt**
    - **Validates: Requirements 6.4**
    - **Property 10: Chat exchange is persisted with all required fields**
    - **Validates: Requirements 6.5, 6.6**
    - **Property 19: Missing environment variable causes HTTP 500**
    - **Validates: Requirements 11.1, 11.3**
    - File: `shehealth/lambda/chatHandler/tests/chat.property.test.js`

- [x] 9. Implement symptomHandler Lambda
  - [x] 9.1 Create `shehealth/lambda/symptomHandler/index.js`
    - At cold start: validate required env vars (`DYNAMODB_TABLE_SYMPTOMS`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`); if any missing, log and return HTTP 500
    - Extract `userId` from `event.requestContext.authorizer.claims.sub` only
    - Route `POST /symptoms`: validate `symptomType` is one of {cramps, fatigue, mood, bloating, headache, other} → HTTP 400 if invalid; validate `severity` is integer 1–10 → HTTP 400 if invalid; generate `symptomId` (UUID v4); `PutItem` to `shehealth-symptoms` with `userId`, `timestamp` (ISO 8601 now), `symptomId`, `symptomType`, `severity`, `notes`; return HTTP 201 `{ symptomId }`
    - Route `GET /symptoms`: query `shehealth-symptoms` by `userId` with `timestamp >= now - 30 days`; return array of Symptom_Log objects
    - Add CORS headers to all responses
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2, 11.1, 11.3_

  - [ ]* 9.2 Write unit tests for symptomHandler
    - Test POST happy path with mocked DynamoDB
    - Test GET returns only last 30 days with mocked data spanning 60 days
    - Test severity boundary values (1, 10 valid; 0, 11, "abc" invalid)
    - Test invalid symptomType returns HTTP 400
    - File: `shehealth/lambda/symptomHandler/tests/symptomHandler.test.js`
    - _Requirements: 7.3–7.6_

  - [ ]* 9.3 Write property tests for symptomHandler
    - **Property 11: Symptom log is persisted with all required fields**
    - **Validates: Requirements 7.3, 9.1**
    - **Property 12: Severity outside 1–10 is always rejected**
    - **Validates: Requirements 7.4**
    - **Property 13: Invalid symptomType is always rejected**
    - **Validates: Requirements 7.5**
    - **Property 14: GET /symptoms returns only the last 30 days**
    - **Validates: Requirements 7.6**
    - File: `shehealth/lambda/symptomHandler/tests/symptoms.property.test.js`

- [x] 10. Implement reportHandler Lambda
  - [x] 10.1 Create `shehealth/lambda/reportHandler/index.js`
    - At cold start: validate required env vars (`BEDROCK_REGION`, `DYNAMODB_TABLE_SYMPTOMS`, `DYNAMODB_TABLE_CONVERSATIONS`, `REPORTS_BUCKET`, `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`); if any missing, log and return HTTP 500
    - Extract `userId` from `event.requestContext.authorizer.claims.sub` only
    - Route `POST /reports/generate`: query `shehealth-symptoms` for last 7 days by `userId`; if no entries return HTTP 400 "No symptom data found for the last 7 days."; call Bedrock to generate plain-English Weekly_Summary; generate `reportId` (UUID v4); save report record to `shehealth-conversations` with `recordType: "report"`, `userId`, `recordId: report#{reportId}`, `content`, `reportDate`, `s3Key: reports/{userId}/{reportId}.txt`, `createdAt`; upload summary text to S3 at that key; return `{ reportId, summary, date }`
    - Route `GET /reports`: query `shehealth-conversations` by `userId` filtering `recordType = "report"`; for each record generate a pre-signed S3 GetObject URL with expiry 3600 seconds; return array of `{ reportId, date, summary, downloadUrl }`
    - Add CORS headers to all responses
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.8, 9.1, 9.2, 9.4, 11.1, 11.3_

  - [ ]* 10.2 Write unit tests for reportHandler
    - Test POST /reports/generate happy path with mocked DynamoDB, Bedrock, S3
    - Test HTTP 400 when no symptoms in last 7 days
    - Test GET /reports returns pre-signed URLs with mocked S3
    - Test missing env var returns HTTP 500
    - File: `shehealth/lambda/reportHandler/tests/reportHandler.test.js`
    - _Requirements: 8.3–8.8_

  - [ ]* 10.3 Write property tests for reportHandler
    - **Property 15: Report generation queries only the last 7 days of symptoms**
    - **Validates: Requirements 8.3, 8.4**
    - **Property 16: Report generate-then-retrieve round trip**
    - **Validates: Requirements 8.5, 8.6**
    - **Property 17: Pre-signed URLs are configured with 3600-second expiry**
    - **Validates: Requirements 9.4**
    - File: `shehealth/lambda/reportHandler/tests/reports.property.test.js`

- [ ] 11. Checkpoint — verify all Lambda unit and property tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Implement Chat page
  - [x] 12.1 Create `ChatPage.jsx` in `shehealth/frontend/src/pages/`
    - Maintain local state: `messages[]`, `inputText`, `conversationId` (UUID generated on mount), `isLoading`, `error`
    - Render scrollable message list with user and assistant bubbles styled with brand color for user messages
    - On send: call `apiService.sendChat(inputText, conversationId)`; show typing indicator (`LoadingSpinner`) while awaiting response; append AI reply to messages on success
    - "Clear Conversation" button: reset `messages` and generate a new `conversationId`
    - Display disclaimer: "SheHealth provides general health information only. Always consult a qualified doctor for medical advice."
    - On 401 response: display "Your session has expired. Please log in again." and redirect to `/login`
    - On other error: show `ErrorMessage` with plain-English text
    - _Requirements: 6.2, 6.7, 6.8, 6.9, 6.10, 10.1, 10.3, 10.4_

- [x] 13. Implement Symptom Logger page
  - [x] 13.1 Create `SymptomLoggerPage.jsx` in `shehealth/frontend/src/pages/`
    - On mount: call `apiService.getSymptoms()` and render list of last 30 days of logs; show `LoadingSpinner` while loading
    - Log form: symptomType dropdown (cramps, fatigue, mood, bloating, headache, other), severity slider 1–10, notes textarea (optional)
    - On submit: call `apiService.logSymptom(data)`; on success prepend new entry to list; show `LoadingSpinner` during submit
    - Empty state: display "No symptoms logged yet. How are you feeling today?" when list is empty
    - On error: show `ErrorMessage` with plain-English text
    - _Requirements: 7.7, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Implement Reports page
  - [x] 14.1 Create `ReportsPage.jsx` in `shehealth/frontend/src/pages/`
    - On mount: call `apiService.getReports()` and render list of weekly summaries; show `LoadingSpinner` while loading
    - "Generate Weekly Report" button: call `apiService.generateReport()`; on success prepend new report to list; show `LoadingSpinner` during generation
    - Each report card: display report date, summary text preview, and a "Download" button that opens the pre-signed S3 URL in a new tab
    - Empty state: display "No reports yet. Generate your first weekly health summary." when list is empty
    - On HTTP 400 (no symptoms): display "No symptom data found for the last 7 days."
    - On other error: show `ErrorMessage` with plain-English text
    - _Requirements: 8.6, 8.7, 8.8, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 15. Write frontend property and security tests
  - [ ]* 15.1 Write property tests for registration validation
    - **Property 1: Valid registration inputs produce a saved account**
    - **Validates: Requirements 1.1, 1.2**
    - **Property 2: Short passwords are always rejected**
    - **Validates: Requirements 1.4**
    - File: `shehealth/frontend/src/tests/property/registration.property.test.js`

  - [ ]* 15.2 Write property tests for authentication
    - **Property 3: Valid login returns a JWT containing the sub claim**
    - **Validates: Requirements 2.1**
    - **Property 4: Invalid credentials are always rejected**
    - **Validates: Requirements 2.2**
    - File: `shehealth/frontend/src/tests/property/auth.property.test.js`

  - [ ]* 15.3 Write property tests for security and data isolation
    - **Property 6: Unauthenticated requests are always rejected with HTTP 401**
    - **Validates: Requirements 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 9.3**
    - **Property 18: All DB queries are scoped to the authenticated user's ID**
    - **Validates: Requirements 9.2**
    - File: `shehealth/frontend/src/tests/property/security.property.test.js`

  - [ ]* 15.4 Write property tests for config/env validation
    - **Property 19: Missing environment variable causes HTTP 500 on all requests**
    - **Validates: Requirements 11.1, 11.3**
    - File: `shehealth/lambda/chatHandler/tests/config.property.test.js`

- [x] 16. Integration — wire frontend to deployed Lambda endpoints
  - Update `shehealth/frontend/.env` with real values for `REACT_APP_COGNITO_USER_POOL_ID`, `REACT_APP_COGNITO_CLIENT_ID`, `REACT_APP_API_BASE_URL` after AWS resources are created
  - Verify `authService.js` CognitoUserPool is initialized with the env var values
  - Verify `apiService.js` Axios baseURL points to the API Gateway invoke URL
  - Confirm all 7 API routes in `apiService.js` match the deployed API Gateway paths exactly
  - _Requirements: 2.3, 11.2_

- [ ] 17. Final checkpoint — full integration verification
  - Ensure all unit tests and property tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- All Lambda functions must extract `userId` exclusively from `event.requestContext.authorizer.claims.sub` — never from the request body
- Property tests use `fast-check` with a minimum of 100 iterations per property
- The brand color `#e91e8c` must be used consistently across all interactive elements
- AWS infrastructure must be created manually via the AWS Console before running integration tests; see `shehealth/infrastructure/setup.md`
