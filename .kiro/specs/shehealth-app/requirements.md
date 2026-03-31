# Requirements Document

## Introduction

SheHealth is a production-level women's health AI web application that provides a compassionate, judgment-free space for women to ask health questions, log symptoms, and receive AI-generated weekly health summaries. The app focuses on conditions such as PCOS, irregular periods, thyroid issues, hormonal health, and mental wellness. It is built entirely on AWS free-tier services: React frontend hosted on AWS Amplify, Amazon Cognito for authentication, API Gateway + Lambda for the backend, Amazon Bedrock (Claude claude-sonnet-4-20250514) for AI, DynamoDB for data storage, and S3 for report storage.

## Glossary

- **SheHealth**: The web application being built.
- **User**: An authenticated woman using the SheHealth application.
- **Auth_Service**: Amazon Cognito user pool handling sign-up, login, and JWT token issuance.
- **API_Gateway**: Amazon API Gateway REST API that routes requests to Lambda functions with CORS enabled.
- **Chat_Handler**: AWS Lambda function (Node.js 18) that processes AI chat requests via Amazon Bedrock.
- **Symptom_Handler**: AWS Lambda function (Node.js 18) that saves and retrieves symptom logs.
- **Report_Handler**: AWS Lambda function (Node.js 18) that generates and retrieves weekly health summaries.
- **Bedrock_Client**: Amazon Bedrock integration using the Claude claude-sonnet-4-20250514 model.
- **Users_Table**: DynamoDB table `shehealth-users` storing user profile data.
- **Symptoms_Table**: DynamoDB table `shehealth-symptoms` storing symptom logs.
- **Conversations_Table**: DynamoDB table `shehealth-conversations` storing chat history.
- **Reports_Bucket**: Amazon S3 bucket storing generated weekly health summary reports.
- **JWT_Token**: JSON Web Token issued by Cognito, used to authenticate API requests.
- **Health_Profile**: User-provided data collected after first login: age, health conditions, and average cycle length.
- **Symptom_Log**: A single entry recording symptom type, severity, date, and optional notes.
- **Weekly_Summary**: An AI-generated health summary based on the last 7 days of symptom logs.
- **Dashboard**: The main authenticated landing page showing health tips and quick actions.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a new visitor, I want to create an account with my name, email, and password, so that I can securely access my personal health data.

#### Acceptance Criteria

1. THE Auth_Service SHALL accept a registration request containing a name, a valid email address, and a password of at least 8 characters.
2. WHEN a User submits a valid registration form, THE Auth_Service SHALL create a new Cognito user account and return a confirmation.
3. IF a User submits a registration form with an email address already registered, THEN THE Auth_Service SHALL return an error message stating the email is already in use.
4. IF a User submits a registration form with a password shorter than 8 characters, THEN THE Auth_Service SHALL return an error message describing the password requirement.
5. WHEN a User successfully registers, THE SheHealth frontend SHALL redirect the User to the Health Profile setup page.

---

### Requirement 2: User Authentication

**User Story:** As a registered user, I want to log in with my email and password, so that I can access my health data securely.

#### Acceptance Criteria

1. WHEN a User submits valid login credentials, THE Auth_Service SHALL return a JWT_Token containing the user's `sub` claim as the userId.
2. IF a User submits invalid login credentials, THEN THE Auth_Service SHALL return an error message stating the credentials are incorrect.
3. WHILE a User is authenticated, THE SheHealth frontend SHALL include the JWT_Token in the Authorization header of all API requests.
4. WHEN a JWT_Token expires, THE SheHealth frontend SHALL redirect the User to the login page.
5. WHEN a User clicks the logout button, THE SheHealth frontend SHALL clear the JWT_Token from local storage and redirect the User to the landing page.

---

### Requirement 3: Health Profile Setup

**User Story:** As a newly registered user, I want to provide my health profile details after first login, so that the app can personalise my experience.

#### Acceptance Criteria

1. WHEN a User logs in for the first time and no Health_Profile exists in the Users_Table, THE SheHealth frontend SHALL display the Health Profile setup page before the Dashboard.
2. THE Health Profile setup page SHALL collect the following fields: age (numeric), health conditions (multi-select from: PCOS, thyroid, endometriosis, other), and average cycle length (numeric, in days).
3. WHEN a User submits a completed Health Profile form, THE API_Gateway SHALL route the request to the Chat_Handler which SHALL save the profile to the Users_Table using the userId from the JWT_Token.
4. IF a User submits the Health Profile form with the age field empty, THEN THE SheHealth frontend SHALL display an inline error message on the age field.
5. WHEN the Health_Profile is saved successfully, THE SheHealth frontend SHALL redirect the User to the Dashboard.

---

### Requirement 4: Landing Page

**User Story:** As a visitor, I want to see a welcoming landing page, so that I understand what SheHealth offers and can sign up or log in.

#### Acceptance Criteria

1. THE SheHealth landing page SHALL display a hero section containing the tagline "Your health, your voice".
2. THE SheHealth landing page SHALL display a "Sign Up" button that navigates to the registration page.
3. THE SheHealth landing page SHALL display a "Log In" button that navigates to the login page.
4. THE SheHealth landing page SHALL be fully responsive and render correctly on screen widths from 320px to 1920px.

---

### Requirement 5: Dashboard

**User Story:** As an authenticated user, I want to see a personalised dashboard after login, so that I can quickly access the app's core features.

#### Acceptance Criteria

1. WHEN a User navigates to the Dashboard, THE Dashboard SHALL display a welcome message including the User's name retrieved from the Users_Table.
2. THE Dashboard SHALL display a daily health tip relevant to women's wellness.
3. THE Dashboard SHALL display three quick-action buttons: "Chat", "Log Symptoms", and "View Reports", each navigating to the corresponding page.
4. WHILE the Dashboard is loading user data, THE Dashboard SHALL display a loading spinner.
5. IF the Dashboard fails to load user data, THEN THE Dashboard SHALL display a plain-English error message without technical jargon.

---

### Requirement 6: AI Chat Interface

**User Story:** As an authenticated user, I want to chat with an AI health assistant, so that I can get compassionate, informative answers to my women's health questions.

#### Acceptance Criteria

1. WHEN a User sends a message on the Chat page, THE Chat_Handler SHALL validate the JWT_Token before processing the request.
2. IF the JWT_Token is invalid or missing, THEN THE Chat_Handler SHALL return an HTTP 401 response and THE SheHealth frontend SHALL display a session-expired message.
3. WHEN a valid chat request is received, THE Chat_Handler SHALL load the last 10 messages from the Conversations_Table for the authenticated User.
4. WHEN building the Bedrock request, THE Chat_Handler SHALL include the following system prompt: "You are SheHealth, a compassionate women's health AI assistant. You specialise in PCOS, endometriosis, thyroid disorders, menstrual health, hormonal imbalances, and women's mental wellness. Always be warm, empathetic, and judgment-free. Never diagnose. Always suggest consulting a doctor for serious concerns. Keep answers clear and simple."
5. WHEN the Bedrock_Client returns a response, THE Chat_Handler SHALL save the User's message and the AI response to the Conversations_Table with the userId, conversationId, role, message text, and timestamp.
6. THE Chat_Handler SHALL return the AI response as a JSON object to the API_Gateway.
7. WHILE the AI response is being generated, THE SheHealth Chat page SHALL display a typing indicator.
8. THE SheHealth Chat page SHALL display a disclaimer: "SheHealth provides general health information only. Always consult a qualified doctor for medical advice."
9. THE SheHealth Chat page SHALL display a "Clear Conversation" button that removes the current conversation from the UI.
10. IF the Bedrock_Client returns an error, THEN THE Chat_Handler SHALL return an HTTP 500 response and THE SheHealth frontend SHALL display a plain-English error message.

---

### Requirement 7: Symptom Logging

**User Story:** As an authenticated user, I want to log my symptoms with details, so that I can track my health patterns over time.

#### Acceptance Criteria

1. WHEN a User submits a symptom log, THE Symptom_Handler SHALL validate the JWT_Token before processing the request.
2. IF the JWT_Token is invalid or missing, THEN THE Symptom_Handler SHALL return an HTTP 401 response.
3. WHEN a valid POST /symptoms request is received, THE Symptom_Handler SHALL save a Symptom_Log to the Symptoms_Table containing: userId (from JWT sub), timestamp (ISO 8601), symptomType (one of: cramps, fatigue, mood, bloating, headache, other), severity (integer 1–10), and notes (optional string).
4. IF a POST /symptoms request is received with a severity value outside the range 1–10, THEN THE Symptom_Handler SHALL return an HTTP 400 response with a descriptive error message.
5. IF a POST /symptoms request is received with a missing or invalid symptomType, THEN THE Symptom_Handler SHALL return an HTTP 400 response with a descriptive error message.
6. WHEN a valid GET /symptoms request is received, THE Symptom_Handler SHALL return all Symptom_Log entries from the Symptoms_Table for the authenticated User with a timestamp within the last 30 days.
7. THE SheHealth Symptom Logger page SHALL display an empty state message "No symptoms logged yet. How are you feeling today?" WHEN no Symptom_Log entries exist for the User.

---

### Requirement 8: Weekly Health Reports

**User Story:** As an authenticated user, I want to generate and download weekly health summaries, so that I can review my health trends and share them with my doctor.

#### Acceptance Criteria

1. WHEN a User requests a report via POST /reports/generate, THE Report_Handler SHALL validate the JWT_Token before processing.
2. IF the JWT_Token is invalid or missing, THEN THE Report_Handler SHALL return an HTTP 401 response.
3. WHEN a valid POST /reports/generate request is received, THE Report_Handler SHALL query the Symptoms_Table for all Symptom_Log entries for the authenticated User within the last 7 days.
4. WHEN symptom data is retrieved, THE Report_Handler SHALL call the Bedrock_Client to generate a friendly, plain-English Weekly_Summary based on the symptom data.
5. WHEN the Bedrock_Client returns the Weekly_Summary, THE Report_Handler SHALL save the summary to the Conversations_Table (reports record) and store the report file in the Reports_Bucket.
6. WHEN a valid GET /reports request is received, THE Report_Handler SHALL return a list of Weekly_Summary records for the authenticated User from the Conversations_Table, each containing: report date, summary text, and a pre-signed S3 download URL.
7. THE SheHealth Reports page SHALL display a "Download" button for each Weekly_Summary that triggers download via the pre-signed S3 URL.
8. IF no Symptom_Log entries exist for the last 7 days when POST /reports/generate is called, THEN THE Report_Handler SHALL return an HTTP 400 response with the message "No symptom data found for the last 7 days."

---

### Requirement 9: Data Isolation and Security

**User Story:** As an authenticated user, I want my health data to be private and accessible only to me, so that my sensitive information is protected.

#### Acceptance Criteria

1. THE Chat_Handler, Symptom_Handler, and Report_Handler SHALL each extract the userId exclusively from the `sub` claim of the validated JWT_Token, not from request body or query parameters.
2. WHEN any Lambda function queries the Users_Table, Symptoms_Table, or Conversations_Table, THE Lambda function SHALL scope all read and write operations to the userId derived from the JWT_Token.
3. IF a request is received without a valid JWT_Token, THEN THE API_Gateway SHALL return an HTTP 401 response before the request reaches any Lambda function.
4. THE Reports_Bucket SHALL generate pre-signed URLs with an expiry of 3600 seconds (1 hour) for report downloads.

---

### Requirement 10: UI Design and Accessibility

**User Story:** As a user, I want a clean, mobile-first interface with a warm visual design, so that the app feels welcoming and is easy to use on any device.

#### Acceptance Criteria

1. THE SheHealth frontend SHALL use a primary brand color of #e91e8c (soft rose/pink) consistently across buttons, highlights, and interactive elements.
2. THE SheHealth frontend SHALL be mobile-first responsive, rendering correctly on screen widths from 320px to 1920px.
3. WHILE any API call is in progress, THE SheHealth frontend SHALL display a loading spinner on the relevant page or component.
4. IF any API call returns an error, THEN THE SheHealth frontend SHALL display the error in plain English without exposing technical error codes or stack traces to the User.
5. THE SheHealth frontend SHALL display friendly empty-state messages on the Symptom Logger and Reports pages when no data exists for the User.

---

### Requirement 11: Environment Configuration

**User Story:** As a developer deploying SheHealth, I want all AWS resource identifiers managed via environment variables, so that the app can be configured without code changes.

#### Acceptance Criteria

1. THE Chat_Handler, Symptom_Handler, and Report_Handler SHALL each read the following environment variables at runtime: `BEDROCK_REGION`, `DYNAMODB_TABLE_USERS`, `DYNAMODB_TABLE_SYMPTOMS`, `DYNAMODB_TABLE_CONVERSATIONS`, `COGNITO_USER_POOL_ID`, and `COGNITO_CLIENT_ID`.
2. THE SheHealth frontend SHALL read `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` from build-time environment variables (e.g. `.env` file or Amplify environment settings).
3. IF any required environment variable is missing at Lambda cold start, THEN THE Lambda function SHALL log a descriptive error message and return an HTTP 500 response for all requests.
