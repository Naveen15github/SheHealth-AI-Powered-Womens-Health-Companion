# SheHealth — AI-Powered Women's Health Companion

> A full-stack serverless health application **built entirely using [Kiro](https://kiro.dev)** — Amazon's AI-powered IDE. Powered by AWS services and Groq AI (Llama 3 models), SheHealth helps women track symptoms, chat with an AI health assistant, and generate structured medical reports — all in a secure, scalable, cloud-native architecture.

> 🛠️ **This project was developed end-to-end with Kiro** — from generating the initial CloudFormation infrastructure, writing Lambda business logic, scaffolding the React frontend, to debugging and iterating on features. Kiro's spec-driven development and AI agent capabilities made building a production-grade serverless app dramatically faster than traditional development workflows.

---

## 📸 Live Demo

> **Deployed URL:** `https://d3dczdioqgaqqt.cloudfront.net`

![SheHealth Landing Page](screenshots/01-landing-hero.png)
![SheHealth Features Section](screenshots/02-landing-features.png)

---

## 🚀 How to Use the App

Here's a quick guide to get started with SheHealth from the moment you land on the site:

**Step 1 — Sign Up**
Click **Sign Up** on the landing page or navigate to `/register`. Enter your email and a password. Amazon Cognito sends a 6-digit OTP to your email — enter it to verify and activate your account.

**Step 2 — Log In**
Navigate to `/login`, enter your credentials, and you'll land on the Dashboard. Your session persists across browser reloads — no need to log in again unless you explicitly log out.

**Step 3 — Explore the Dashboard**
The Dashboard shows a daily health tip, a multilingual AI banner, quick-action buttons for AI Assistant / Log Symptoms / View Reports, and health topic categories (Fitness, Wellness, Cycle, Nutrition, Mental Health, Community).

**Step 4 — Chat with the AI Assistant**
Click **AI Assistant** in the nav bar. Type your health question in the input box at the bottom — you can ask in **English**, **Tamil**, or **Tanglish** and the AI responds in the same language. Previous conversations are saved in the left sidebar and can be resumed at any time.

**Step 5 — Log Your Symptoms**
Click **Symptoms** in the nav. Select a symptom type (Cramps, Fatigue, Mood Swings, etc.), pick the date, drag the severity slider to rate it 1–10, add optional notes, and click **Log Symptom**. Your logged entries appear below the form immediately.

**Step 6 — Generate a Health Report**
Click **Reports** in the nav. Set a from-date and to-date range, then click **Generate Report**. The AI reads all your symptom logs for that period and produces a structured medical report with: Patient Health Summary, Symptom Analysis, Clinical Observations, and Recommendations. Click **Download PDF** to save it.

**Step 7 — Re-download Past Reports**
All previously generated reports appear below the generator card with their date, symptom count, and a preview of the AI summary. Each **Download PDF** button generates a fresh pre-signed S3 URL valid for 1 hour.

---

## 📑 Table of Contents

- [About the Project](#about-the-project)
- [Architecture Overview](#architecture-overview)
- [Tech Stack](#tech-stack)
- [AWS Services — What, How, and Why](#aws-services--what-how-and-why)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Deployment Guide](#deployment-guide)
- [Screenshots — Walkthrough](#screenshots--walkthrough)
- [API Reference](#api-reference)
- [Environment Variables](#environment-variables)
- [Known Issues & Limitations](#known-issues--limitations)
- [Future Improvements](#future-improvements)

---

## Built with Kiro

This entire project was built using **[Kiro](https://kiro.dev)**, Amazon's AI-powered IDE designed for spec-driven, agent-assisted development.

Kiro fundamentally changed how I approached building this. Instead of switching between a code editor, AWS Console, documentation tabs, and a terminal, everything happened inside one environment. I described what I wanted — "create a DynamoDB table for symptom logs with userId and timestamp as a composite key" — and Kiro generated the CloudFormation YAML, the Lambda SDK calls, and the API Gateway integration in one go.

**Specifically, Kiro helped me:**

- **Design the architecture** — I described the app requirements and Kiro suggested the right AWS services and how they should connect
- **Write the CloudFormation template** — the entire `cloudformation.yaml` with all DynamoDB tables, S3 buckets, Cognito, Lambda functions, IAM roles, API Gateway routes, and CloudFront was iteratively built with Kiro
- **Implement Lambda handlers** — all three Lambda functions (`chatHandler`, `symptomHandler`, `reportHandler`) were written and debugged with Kiro's inline AI assistance
- **Build the React frontend** — component scaffolding, Cognito SDK integration, API wiring, and routing were all done inside Kiro
- **Debug cross-service issues** — things like CORS errors between CloudFront and API Gateway, Cognito JWT authorizer misconfigurations, and pre-signed URL expiry issues were resolved much faster with Kiro's context-aware suggestions
- **Write the deployment script** — the `deploy.ps1` PowerShell script that builds, syncs, and invalidates CloudFront was generated and refined in Kiro

Without Kiro, this project would have taken significantly longer — coordinating IAM permissions, getting CORS right across multiple AWS services, and wiring Cognito to API Gateway manually are all notoriously tedious. Kiro compressed what would have been days of documentation-reading and trial-and-error into a focused build session.

---

## About the Project

I built SheHealth as a personal project to explore how modern cloud infrastructure and large language models can come together to create something genuinely useful. Women's health has always been under-resourced in tech — most health apps are generic, lack context, and don't really help users articulate what they're experiencing to a doctor.

SheHealth solves three specific problems:

1. **Symptom tracking is fragmented** — Most people rely on memory or a notes app. SheHealth provides a structured log with severity ratings, timestamps, and the ability to look back at the last 30 days of data at a glance.

2. **There's no accessible first-response health guidance** — Booking a doctor's appointment for every minor concern isn't practical. The AI chat assistant in SheHealth understands health profiles and prior context to give informed, relevant responses without the wait.

3. **Doctor visits are inefficient without documentation** — I added a report generation feature that takes all your logged symptoms, passes them through an LLM with a medical report prompt, and produces a structured PDF-ready report in a format a doctor can actually read.

The entire backend is serverless. There are no servers to manage, no databases to patch, and no infrastructure to babysit. Everything scales automatically and costs essentially nothing at low traffic.

---

## Architecture Overview

<!-- ============================================================ -->
<!-- 🖼️  DIAGRAM: Insert your AWS architecture diagram here.      -->
<!-- Recommended tool: draw.io, Excalidraw, or Lucidchart.        -->
<!-- Show: React (S3+CloudFront) → API Gateway → Lambda → DynamoDB/S3 -->
<!-- Also show: Cognito for auth, Groq for AI inference           -->
<!-- ============================================================ -->

**High-level flow:**

```
User Browser
    │
    ▼
Amazon CloudFront  (CDN — serves React app from nearest edge)
    │
    ▼
Amazon S3  (static hosting — stores compiled React build)
    │
    ▼ (API calls with JWT token)
Amazon API Gateway  (REST API — JWT authorizer via Cognito)
    │
    ├──► AWS Lambda: chatHandler      → DynamoDB (profiles, conversations)
    │                                 → Groq AI  (chat responses)
    │
    ├──► AWS Lambda: symptomHandler   → DynamoDB (symptom logs)
    │
    └──► AWS Lambda: reportHandler    → DynamoDB (symptom data fetch)
                                      → Groq AI  (report generation)
                                      → Amazon S3 (report storage)
                                      → Pre-signed URL → User
```

**Authentication flow:**

```
User enters credentials
    │
    ▼
amazon-cognito-identity-js SDK (frontend)
    │
    ▼
Amazon Cognito User Pool
    │  (validates credentials, issues JWT)
    ▼
ID Token stored in localStorage
    │  (attached to every API request as Authorization header)
    ▼
API Gateway Cognito Authorizer validates token
    │  (Lambda never sees unauthenticated requests)
    ▼
Lambda executes with verified userId
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **IDE / Dev Tool** | **Kiro (AI-powered IDE by Amazon)** |
| Frontend | React, amazon-cognito-identity-js |
| Hosting | Amazon S3 + CloudFront |
| Auth | Amazon Cognito (User Pools) |
| API | Amazon API Gateway (REST) |
| Backend | AWS Lambda (Node.js) |
| Database | Amazon DynamoDB |
| File Storage | Amazon S3 |
| AI Inference | Groq API (Llama 3.3 70B / Llama 3.1 8B / Llama 4 Scout) |
| Infrastructure | AWS CloudFormation |
| Deployment | PowerShell deploy script (`deploy.ps1`) |

---

## AWS Services — What, How, and Why

### Amazon Cognito

**What it is:**
A managed user authentication service provided by AWS.

**How I used it:**
Cognito handles the entire authentication flow — user registration with email and password, email verification via OTP, login, JWT token issuance, and token refresh. I integrated the `amazon-cognito-identity-js` SDK directly into the React frontend, which means the browser communicates with Cognito without routing auth requests through the backend. On successful login, Cognito returns an ID token (JWT) which I store in `localStorage` and attach to every outgoing API request as an `Authorization` header.

**Why I chose this over building custom auth:**
Writing secure authentication from scratch — password hashing, brute-force protection, token expiry management, email verification — is both complex and easy to get wrong. Cognito handles all of that out of the box. It's also HIPAA-eligible, which matters for a health application. Most importantly, Cognito integrates natively with API Gateway as a JWT authorizer, which means I didn't need to write a single line of authentication middleware in Lambda. Invalid or expired tokens are rejected at the gateway layer before Lambda is ever invoked.

---

### AWS Lambda

**What it is:**
Serverless compute — code runs on demand without provisioning or managing any servers.

**How I used it:**
I split the backend logic across three Lambda functions, each responsible for a specific domain:

- **`chatHandler`** — handles `GET /profile`, `POST /profile`, and `POST /chat`. Reads and writes user health profiles to DynamoDB and calls Groq AI to generate contextual chat responses.
- **`symptomHandler`** — handles `GET /symptoms` and `POST /symptoms`. Validates incoming symptom data, stores it in DynamoDB, and retrieves the last 30 days of entries for the current user.
- **`reportHandler`** — handles `GET /reports` and `POST /reports/generate`. Fetches symptom data from DynamoDB, sends it to Groq AI with a structured medical report prompt, saves the output as a `.txt` file to S3, and returns a pre-signed URL the user can download.

**Why Lambda:**
Lambda scales automatically — from zero requests to thousands of concurrent invocations with no configuration changes. The cost model is per-request: the first one million requests per month are free, and beyond that it's fractions of a cent. For a health app with unpredictable and potentially low traffic, running an always-on server would be wasteful and expensive. With Lambda, idle time costs nothing.

---

### Amazon DynamoDB

**What it is:**
A fully managed NoSQL database with single-digit millisecond performance at any scale.

**How I used it:**
I designed three tables to store all application data:

- **`shehealth-users`** — stores user health profiles including `userId`, age, and health conditions. The partition key is `userId` (the Cognito `sub` field).
- **`shehealth-symptoms`** — stores individual symptom log entries with `userId`, `timestamp`, `symptomType`, `severity`, and optional notes. The composite key of `userId` + `timestamp` enables efficient time-range queries for the last 30 days.
- **`shehealth-conversations`** — stores both chat message history and generated report metadata. Uses a composite key of `userId` + `recordId`, where `recordId` encodes the conversation ID and timestamp to ensure correct ordering.

**Why DynamoDB:**
DynamoDB's pay-per-request billing model means the database costs nothing when the app is idle. It scales automatically without any provisioning, requires no schema migrations, and integrates natively with Lambda through the AWS SDK. Using `userId` as the partition key ensures each user's data is physically isolated at the storage level, and queries remain fast regardless of how large the total dataset grows.

---

### Amazon S3

**What it is:**
Object storage — stores any type of file at virtually unlimited scale.

**How I used it:**
I provisioned two separate S3 buckets for different purposes:

- **`shehealth-reports-{accountId}`** — stores generated health reports as `.txt` files. This bucket has no public access. Users access their reports through pre-signed URLs that I generate on demand in the `reportHandler` Lambda. Each URL expires after one hour, so files remain private even though they're temporarily accessible for download.
- **`shehealth-frontend-{accountId}`** — hosts the compiled React application as a static website. All HTML, CSS, and JavaScript build artifacts are stored here and served via CloudFront.

**Why S3:**
S3 is the most cost-effective way to store files at scale — storage costs fractions of a cent per gigabyte per month. For the frontend, S3 static hosting completely eliminates the need for a web server. For reports, S3 provides durable, encrypted storage with access controlled entirely through pre-signed URLs, so I never have to expose the bucket publicly or manage download authentication myself.

---

### Amazon API Gateway

**What it is:**
A managed service that creates, publishes, and secures REST APIs.

**How I used it:**
I configured a single REST API with five resource paths: `/profile`, `/chat`, `/symptoms`, `/reports`, and `/reports/generate`. Each path routes requests to the appropriate Lambda function. Every route except `OPTIONS` (which handles CORS preflight) is protected by a Cognito JWT authorizer — API Gateway validates the incoming token before the Lambda function is even invoked. I configured CORS headers at the API level so the frontend can make requests from any domain, including the CloudFront distribution.

**Why API Gateway:**
API Gateway handles authentication enforcement, rate limiting, CORS configuration, and request routing without requiring any custom code. Because token validation happens at the gateway layer, Lambda only executes with confirmed, authenticated requests — this reduces Lambda invocation costs and adds a security boundary. Invalid tokens are rejected before they reach any application logic.

---

### Amazon CloudFront

**What it is:**
A global Content Delivery Network (CDN) with over 400 edge locations worldwide.

**How I used it:**
CloudFront sits in front of the S3 frontend bucket so all user traffic is served from the nearest edge location rather than hitting an S3 origin directly. My configuration includes:

- **HTTPS enforcement** — HTTP requests are automatically redirected to HTTPS
- **SPA routing support** — 404 and 403 error responses return `index.html` so React Router handles client-side navigation correctly
- **Aggressive caching** — JavaScript and CSS assets are cached for one year with immutable headers
- **No-cache for `index.html`** — ensures users always receive the latest app version after deployments
- **Cache invalidation on every deployment** — the deploy script automatically invalidates the CloudFront cache after pushing a new build

**Why CloudFront:**
Without CloudFront, users in India would be hitting an S3 bucket in `us-east-1`, adding 200–300ms of latency to every page load. CloudFront serves content from the nearest edge location, making load times fast regardless of where the user is. It also provides HTTPS termination for free with no SSL certificate management, DDoS protection through AWS Shield Standard, and reduces S3 data transfer costs.

---

### Groq AI

**What it is:**
An AI inference platform that runs open-source large language models at extremely high speed using custom LPU (Language Processing Unit) hardware.

**How I used it:**
Lambda functions make direct HTTPS calls to Groq's OpenAI-compatible API endpoint. I configured three models in a fallback chain to maximize availability:

1. **`llama-3.3-70b-versatile`** — primary model, best response quality
2. **`llama-3.1-8b-instant`** — first fallback, fastest model (~560 tokens per second)
3. **`meta-llama/llama-4-scout-17b`** — second fallback, latest Llama 4 architecture

If the primary model hits a rate limit, times out, or returns an error, the system automatically retries with the next model in the chain. From the user's perspective, the response always comes through unless all three models fail simultaneously.

For report generation, I use a separate, structured system prompt that instructs the model to act as a medical report writer, formatting output with clearly defined sections: Patient Health Summary, Symptom Analysis, Clinical Observations, and Recommendations — in plain text suitable for a doctor to read.

**Why Groq over OpenAI or Gemini:**
Groq's free tier is generous enough to support a health app at this scale. More importantly, Groq's inference speed — 280 to 750 tokens per second compared to OpenAI's roughly 50 — makes the chat experience feel genuinely responsive rather than loading. The Llama models also handle Tamil script and Tanglish phonetics without any special configuration. Language behavior is entirely controlled through the system prompt, so I can support multilingual conversations without maintaining separate model integrations.

---

### AWS CloudFormation

**What it is:**
Infrastructure as Code — defines and provisions all AWS resources through a single declarative YAML template.

**How I used it:**
A single `cloudformation.yaml` file defines every AWS resource in the application: all three DynamoDB tables, both S3 buckets, the Cognito User Pool and App Client, IAM execution roles, all three Lambda functions, the API Gateway REST API with every route, method, and authorizer, the CloudFront distribution, and all cross-service permissions. Running `./deploy.ps1` applies the template and creates or updates everything in one command.

**Why CloudFormation:**
Setting up all of this infrastructure manually through the AWS Console would take several hours and introduce human error. With CloudFormation, the entire stack can be recreated in any AWS account in under 15 minutes with a single command. More importantly, the infrastructure is version-controlled alongside the application code — every change to the architecture is tracked in Git, reviewable, and reversible.

---

## Features

- **User Authentication** — Register, verify email via OTP, login, and logout using Amazon Cognito. Sessions persist across browser reloads.
- **Health Profile Setup** — On first login, users fill in a health profile (age, existing conditions) that the AI uses as context in every conversation.
- **AI Chat Assistant** — Conversational health assistant powered by Llama 3.3 70B. Understands the user's health profile and prior messages. Supports English, Tamil, and Tanglish.
- **Symptom Logging** — Log symptoms with type, severity (1–10), date, and notes. Stored per-user in DynamoDB.
- **Symptom History** — View the last 30 days of logged symptoms with timestamps and severity.
- **Medical Report Generation** — One-click report generation that collects all logged symptoms, sends them to Groq AI with a medical prompt, and produces a structured health report downloadable via a secure pre-signed URL.
- **Report History** — View and re-download all previously generated reports.
- **Fully Serverless** — No servers to manage. Auto-scales to any traffic level. Near-zero idle cost.
- **Multi-model Fallback** — If the primary AI model is unavailable, requests automatically fall through to backup models with no visible disruption.

---

## Project Structure

```
shehealth/
├── frontend/                     # React application
│   ├── public/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # Route-level page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── Symptoms.jsx
│   │   │   └── Reports.jsx
│   │   ├── utils/
│   │   │   ├── auth.js           # Cognito SDK helpers
│   │   │   └── api.js            # Axios instance with JWT header
│   │   └── App.jsx
│   └── package.json
│
├── backend/
│   ├── chatHandler/
│   │   └── index.js              # /profile and /chat Lambda
│   ├── symptomHandler/
│   │   └── index.js              # /symptoms Lambda
│   └── reportHandler/
│       └── index.js              # /reports Lambda
│
├── infrastructure/
│   └── cloudformation.yaml       # Complete AWS infrastructure definition
│
├── deploy.ps1                    # One-command deployment script
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS CLI configured with an IAM user that has sufficient permissions
- PowerShell (for the deploy script — works on Windows, macOS, and Linux)
- A Groq API key (free at [console.groq.com](https://console.groq.com))

### Local Development Setup

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/shehealth.git
cd shehealth
```

**2. Install frontend dependencies**

```bash
cd frontend
npm install
```

**3. Create a `.env` file in the `frontend/` directory**

```env
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_API_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
```

> You'll get these values after running the CloudFormation deployment (see below).

**4. Start the development server**

```bash
npm start
```

The app runs at `http://localhost:3000`.

---

## Deployment Guide

### Step 1 — Deploy AWS Infrastructure

The CloudFormation template provisions everything in one shot.

```bash
# From the project root
aws cloudformation deploy \
  --template-file infrastructure/cloudformation.yaml \
  --stack-name shehealth \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GroqApiKey=your_groq_api_key_here
```

Wait for the stack to reach `CREATE_COMPLETE` (approximately 10–15 minutes).

### Step 2 — Retrieve Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name shehealth \
  --query "Stacks[0].Outputs"
```

Note down:
- `UserPoolId`
- `UserPoolClientId`
- `ApiGatewayUrl`
- `CloudFrontDomain`
- `FrontendBucketName`

### Step 3 — Configure Frontend Environment

Update `frontend/.env` with the values from Step 2.

```env
REACT_APP_USER_POOL_ID=<UserPoolId>
REACT_APP_CLIENT_ID=<UserPoolClientId>
REACT_APP_API_URL=<ApiGatewayUrl>
```

### Step 4 — Build and Deploy Frontend

```bash
cd frontend
npm run build
aws s3 sync build/ s3://<FrontendBucketName> --delete
```

### Step 5 — Invalidate CloudFront Cache

```bash
aws cloudfront create-invalidation \
  --distribution-id <your-distribution-id> \
  --paths "/*"
```

Alternatively, run the all-in-one deploy script:

```powershell
./deploy.ps1
```

The script handles Steps 3 through 5 automatically after the infrastructure is deployed.

### Step 6 — Access the App

Navigate to your CloudFront domain:

```
https://<CloudFrontDomain>.cloudfront.net
```

---

## Screenshots — Walkthrough

### 1. Registration & Email Verification

![Login Page](screenshots/03-login.png)

User enters their email and password. Cognito sends a 6-digit OTP to the email address. After verification, the account is activated and the user is redirected to the Dashboard.

---

### 2. Dashboard

![Dashboard — Welcome & Quick Actions](screenshots/04-dashboard-top.png)
![Dashboard — Health Topics](screenshots/05-dashboard-topics.png)

On login, users land on the Dashboard. A daily health tip, a multilingual AI banner, and quick-action cards for AI Assistant, Log Symptoms, and View Reports are all immediately accessible. Scrolling down reveals health topic categories and a "Schedule an Appointment" CTA.

---

### 3. AI Chat Assistant

**English:**
![AI Chat — English](screenshots/11-chat-english.png)

**Tanglish (Tamil-English mix):**
![AI Chat — Tanglish](screenshots/12-chat-tanglish.png)

**Pure Tamil:**
![AI Chat — Tamil](screenshots/13-chat-tamil.png)

The chat interface sends messages to `POST /chat`. Lambda passes the full conversation history, the user's health profile, and the current message to the Groq API. Responses from Llama 3.3 70B typically arrive within 1–2 seconds. The left sidebar stores all past conversations — users can switch between them or start a fresh one with **+ New Chat**. The AI seamlessly handles English, Tanglish, and Tamil in the same session.

---

### 4. Symptom Logging

![Symptom Logger Form](screenshots/06-symptom-logger.png)
![Symptom History](screenshots/07-symptom-history.png)

Users log symptoms with a type (Cramps, Fatigue, Mood Swings, Fever, etc.), date, severity rating (1–10 slider), and optional notes. `POST /symptoms` validates and stores the entry in DynamoDB. `GET /symptoms` retrieves the last 30 days of entries sorted by timestamp, displayed as a card list below the form. Each entry shows the symptom name, date, severity, and any notes added.

---

### 5. Report Generation

![Health Reports Page](screenshots/08-reports-page.png)

Clicking **Generate Report** calls `POST /reports/generate`. Lambda fetches all symptom data for the selected date range from DynamoDB, constructs a structured medical prompt, and sends it to Groq AI. The output is saved to a private S3 bucket and a pre-signed URL valid for 1 hour is returned. Previously generated reports show a summary preview inline with a **Download PDF** button.

### 6. Generated Report — Doctor-Ready PDF

![Generated Report — Page 1](screenshots/09-report-pdf-page1.png)
![Generated Report — Page 2](screenshots/10-report-pdf-page2.png)

The downloaded report is formatted with clearly defined sections: **Patient Health Summary**, **Symptom Analysis**, **Clinical Observations**, and **Recommendations** — structured specifically to be useful in a clinical setting. A disclaimer footer clarifies it is AI-generated and intended to assist, not replace, a doctor's diagnosis.

---

## API Reference

All endpoints require an `Authorization: <Cognito ID Token>` header. The Cognito JWT authorizer on API Gateway validates the token before any Lambda is invoked.

| Method | Endpoint | Lambda | Description |
|--------|----------|--------|-------------|
| `GET` | `/profile` | chatHandler | Retrieve the authenticated user's health profile |
| `POST` | `/profile` | chatHandler | Create or update the user's health profile |
| `POST` | `/chat` | chatHandler | Send a chat message, receive AI response |
| `GET` | `/symptoms` | symptomHandler | Get last 30 days of symptom logs |
| `POST` | `/symptoms` | symptomHandler | Log a new symptom entry |
| `GET` | `/reports` | reportHandler | List all previously generated reports |
| `POST` | `/reports/generate` | reportHandler | Generate a new medical report from symptom data |

### Sample Request — POST `/chat`

```json
{
  "message": "I've been having severe cramps for 3 days. Is this normal?",
  "conversationId": "conv_1234567890"
}
```

### Sample Response — POST `/chat`

```json
{
  "response": "Based on your profile, prolonged severe cramps lasting more than 3 days can sometimes indicate conditions like endometriosis or fibroids. I'd recommend tracking the pain intensity and timing over the next cycle...",
  "conversationId": "conv_1234567890"
}
```

### Sample Request — POST `/symptoms`

```json
{
  "symptomType": "cramps",
  "severity": 8,
  "notes": "Started after lunch, sharp pain lower abdomen",
  "timestamp": "2025-07-18T14:30:00Z"
}
```

---

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `REACT_APP_USER_POOL_ID` | Cognito User Pool ID (from CloudFormation output) |
| `REACT_APP_CLIENT_ID` | Cognito App Client ID (from CloudFormation output) |
| `REACT_APP_API_URL` | API Gateway invoke URL including stage (e.g., `.../prod`) |

### Lambda (set via CloudFormation parameters / environment)

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key for AI inference |
| `USERS_TABLE` | DynamoDB table name for user profiles |
| `SYMPTOMS_TABLE` | DynamoDB table name for symptom logs |
| `CONVERSATIONS_TABLE` | DynamoDB table name for conversations and reports |
| `REPORTS_BUCKET` | S3 bucket name for storing generated reports |

---

## Known Issues & Limitations

- **Report format** — Reports are currently generated as plain `.txt` files. PDF formatting with proper sections and styling is planned but not yet implemented.
- **Groq rate limits** — The free tier has per-minute token limits. High-volume chat sessions may occasionally fall back to the smaller model. This is handled silently in the fallback chain.
- **No real-time chat streaming** — Responses from the AI are returned as a complete message once generation finishes. Streaming with WebSockets or SSE is on the roadmap.
- **Single AWS region** — The stack currently deploys to a single region. Multi-region replication for DynamoDB is not configured.
- **No data export** — Users can download individual reports but cannot export all their symptom data in bulk (planned feature).

---

## Future Improvements

- [ ] **Streaming AI responses** — Use Server-Sent Events or WebSocket API on API Gateway to stream tokens as they're generated, improving perceived response time
- [ ] **PDF report generation** — Use a Lambda layer with a headless PDF library to render formatted reports instead of plain text
- [ ] **Push notifications** — SNS + mobile push to remind users to log symptoms daily
- [ ] **Symptom visualizations** — Charts showing severity trends over time using a D3 or Recharts integration in the frontend
- [ ] **Multi-language UI** — Full Tamil language support in the interface, not just in the AI chat
- [ ] **Doctor sharing** — Generate a shareable link for reports that a doctor can access without requiring a SheHealth account
- [ ] **Wearable integration** — Pull heart rate and cycle data from Apple Health or Google Fit via API

---

## License

This project is licensed under the MIT License. See `LICENSE` for details.

---

## Acknowledgments

- [Kiro](https://kiro.dev) — the AI-powered IDE that made building this entire project possible; from CloudFormation to Lambda to React, Kiro was the co-pilot throughout
- [Groq](https://groq.com) — for making fast, free AI inference accessible to indie developers
- [Meta AI](https://ai.meta.com) — for open-sourcing the Llama model family
- [AWS](https://aws.amazon.com) — for the free tier that made building and hosting this project essentially free
- The women who gave feedback during early testing and pushed for the Tamil language support

---

*Built with ☁️ Kiro, a lot of CloudFormation YAML, and one too many IAM policy debugging sessions.*
