# SheHealth — AWS Infrastructure Setup Guide

This guide walks you through manually provisioning every AWS resource needed to run SheHealth via the AWS Console. Follow the steps in order — later steps depend on values from earlier ones.

---

## Prerequisites

- An AWS account with billing enabled (all resources below are free-tier eligible)
- AWS Console access at https://console.aws.amazon.com
- Your AWS **Account ID** (12-digit number shown in the top-right corner of the console)

---

## Step 1 — DynamoDB Tables

Navigate to **DynamoDB → Tables → Create table**.

### 1.1 `shehealth-users`

| Setting | Value |
|---|---|
| Table name | `shehealth-users` |
| Partition key | `userId` (String) |
| Sort key | *(leave blank)* |
| Table settings | Customize settings |
| Capacity mode | **On-demand** |

Click **Create table**.

---

### 1.2 `shehealth-symptoms`

| Setting | Value |
|---|---|
| Table name | `shehealth-symptoms` |
| Partition key | `userId` (String) |
| Sort key | `timestamp` (String) |
| Table settings | Customize settings |
| Capacity mode | **On-demand** |

Click **Create table**.

---

### 1.3 `shehealth-conversations`

| Setting | Value |
|---|---|
| Table name | `shehealth-conversations` |
| Partition key | `userId` (String) |
| Sort key | `recordId` (String) |
| Table settings | Customize settings |
| Capacity mode | **On-demand** |

Click **Create table**.

---

## Step 2 — S3 Bucket

Navigate to **S3 → Create bucket**.

| Setting | Value |
|---|---|
| Bucket name | `shehealth-reports-{your-account-id}` (replace with your 12-digit account ID) |
| AWS Region | `us-east-1` (must match your Lambda region) |
| Object Ownership | ACLs disabled (recommended) |
| Block Public Access | **Block all public access** ✓ (leave all four checkboxes checked) |
| Bucket Versioning | Disabled |
| Default encryption | SSE-S3 (default) |

Click **Create bucket**.

> No bucket policy is needed. Lambda will access the bucket via its IAM role.

📋 **Note down**: `shehealth-reports-{your-account-id}` — you'll need this for Lambda env vars.

---

## Step 3 — Amazon Cognito User Pool

Navigate to **Cognito → User pools → Create user pool**.

### 3.1 Authentication providers

- Sign-in options: check **Email**
- Click **Next**

### 3.2 Security requirements

- Password policy: **Custom**
  - Minimum length: **8**
  - Require uppercase: optional (uncheck for simplicity)
  - Require lowercase: optional
  - Require numbers: optional
  - Require special characters: optional
- MFA: **No MFA**
- User account recovery: leave defaults
- Click **Next**

### 3.3 Sign-up experience

- Self-registration: **Enable**
- Required attributes: check **name** and **email**
- Click **Next**

### 3.4 Message delivery

- Email provider: **Send email with Cognito** (free tier)
- Click **Next**

### 3.5 Integrate your app

- User pool name: `shehealth-user-pool`
- Hosted UI: **Do not use the Hosted UI**
- App type: **Public client**
- App client name: `shehealth-web-client`
- Client secret: **Don't generate a client secret** ✓
- Click **Next**

### 3.6 Review and create

- Review all settings and click **Create user pool**

📋 **Note down**:
- **User Pool ID** — shown on the user pool detail page (format: `us-east-1_XXXXXXXXX`)
- **App Client ID** — found under **App integration → App clients** tab

---

## Step 4 — IAM Role for Lambda

Navigate to **IAM → Roles → Create role**.

### 4.1 Trusted entity

- Trusted entity type: **AWS service**
- Use case: **Lambda**
- Click **Next**

### 4.2 Add permissions

Search for and attach: **AWSLambdaBasicExecutionRole**

Click **Next**.

### 4.3 Name and create

- Role name: `shehealth-lambda-role`
- Click **Create role**

### 4.4 Add inline policy

After the role is created, open it and click **Add permissions → Create inline policy**.

Switch to the **JSON** editor and paste:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:{your-account-id}:table/shehealth-users",
        "arn:aws:dynamodb:us-east-1:{your-account-id}:table/shehealth-symptoms",
        "arn:aws:dynamodb:us-east-1:{your-account-id}:table/shehealth-conversations"
      ]
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::shehealth-reports-{your-account-id}/*"
    },
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-20250514"
    }
  ]
}
```

> Replace `{your-account-id}` with your 12-digit AWS account ID in all three DynamoDB ARNs and the S3 ARN.

- Policy name: `shehealth-lambda-inline-policy`
- Click **Create policy**

---

## Step 5 — Lambda Functions

Navigate to **Lambda → Create function** for each of the three functions below. Repeat this section three times.

### Common settings for all three functions

| Setting | Value |
|---|---|
| Author from scratch | selected |
| Runtime | **Node.js 18.x** |
| Architecture | x86_64 |
| Execution role | **Use an existing role** → `shehealth-lambda-role` |

After creation, go to **Configuration → General configuration → Edit**:
- Memory: **256 MB**
- Timeout: **0 min 30 sec**
- Save

### 5.1 `chatHandler`

- Function name: `shehealth-chatHandler`

### 5.2 `symptomHandler`

- Function name: `shehealth-symptomHandler`

### 5.3 `reportHandler`

- Function name: `shehealth-reportHandler`

---

### 5.4 Environment variables (set on each function)

For each function, go to **Configuration → Environment variables → Edit → Add environment variable** and add all of the following:

| Key | Value |
|---|---|
| `BEDROCK_REGION` | `us-east-1` |
| `DYNAMODB_TABLE_USERS` | `shehealth-users` |
| `DYNAMODB_TABLE_SYMPTOMS` | `shehealth-symptoms` |
| `DYNAMODB_TABLE_CONVERSATIONS` | `shehealth-conversations` |
| `COGNITO_USER_POOL_ID` | *(User Pool ID from Step 3)* |
| `COGNITO_CLIENT_ID` | *(App Client ID from Step 3)* |
| `REPORTS_BUCKET` | `shehealth-reports-{your-account-id}` |

Click **Save**.

---

### 5.5 Upload function code

For each Lambda function:

1. In your terminal, navigate to the corresponding folder:
   - `shehealth/lambda/chatHandler/`
   - `shehealth/lambda/symptomHandler/`
   - `shehealth/lambda/reportHandler/`
2. Run `npm install` to install dependencies
3. Zip the folder contents (not the folder itself):
   ```bash
   # macOS / Linux
   zip -r function.zip . --exclude "*.test.js" --exclude "tests/*"

   # Windows (PowerShell)
   Compress-Archive -Path * -DestinationPath function.zip
   ```
4. In the Lambda console, go to **Code → Upload from → .zip file**
5. Upload `function.zip`
6. Verify the handler is set to `index.handler` under **Runtime settings**

---

## Step 6 — API Gateway REST API

Navigate to **API Gateway → Create API → REST API → Build**.

### 6.1 Create the API

| Setting | Value |
|---|---|
| API name | `shehealth-api` |
| Description | SheHealth REST API |
| Endpoint type | Regional |

Click **Create API**.

---

### 6.2 Create Cognito Authorizer

In the left panel, click **Authorizers → Create authorizer**.

| Setting | Value |
|---|---|
| Name | `shehealth-cognito-auth` |
| Type | **Cognito** |
| Cognito User Pool | Select `shehealth-user-pool` (from Step 3) |
| Token source | `Authorization` |
| Token validation | *(leave blank)* |

Click **Create authorizer**.

To test it: click **Test authorizer** and paste a valid Cognito IdToken — you should see the decoded claims.

---

### 6.3 Create resources and methods

For each route below, you will:
1. Create the resource (if it doesn't exist)
2. Create the method
3. Set the integration and authorizer

#### Resources to create

```
/profile
/chat
/symptoms
/reports
  /generate
```

**Creating a resource**: In the Resources panel, select the parent (`/`), then click **Create resource**. Enter the resource name and path. Leave "Configure as proxy resource" unchecked.

**Creating a method**: Select the resource, click **Create method**, choose the HTTP method, then configure:

| Setting | Value |
|---|---|
| Integration type | Lambda Function |
| Lambda region | `us-east-1` |
| Lambda function | *(function name from Step 5)* |
| Use Lambda Proxy integration | ✓ **checked** |

After saving, click the method → **Method Request → Authorization** → select `shehealth-cognito-auth`.

#### Method → Lambda mapping

| Method | Resource | Lambda Function |
|---|---|---|
| POST | `/profile` | `shehealth-chatHandler` |
| GET | `/profile` | `shehealth-chatHandler` |
| POST | `/chat` | `shehealth-chatHandler` |
| POST | `/symptoms` | `shehealth-symptomHandler` |
| GET | `/symptoms` | `shehealth-symptomHandler` |
| POST | `/reports/generate` | `shehealth-reportHandler` |
| GET | `/reports` | `shehealth-reportHandler` |

---

### 6.4 Enable CORS on all resources

For each resource (`/profile`, `/chat`, `/symptoms`, `/reports`, `/reports/generate`):

1. Select the resource
2. Click **Actions → Enable CORS** (or **Enable CORS** button in the resource panel)
3. Set:
   - Access-Control-Allow-Origin: `'*'`
   - Access-Control-Allow-Headers: `'Content-Type,Authorization'`
   - Access-Control-Allow-Methods: `'GET,POST,OPTIONS'`
4. Click **Enable CORS and replace existing CORS headers**
5. Confirm the dialog

---

### 6.5 Deploy the API

1. Click **Actions → Deploy API** (or the **Deploy** button)
2. Deployment stage: **[New Stage]**
3. Stage name: `prod`
4. Click **Deploy**

📋 **Note down**: The **Invoke URL** shown at the top of the stage editor — it looks like:
`https://{api-id}.execute-api.us-east-1.amazonaws.com/prod`

---

## Step 7 — Amazon Bedrock Model Access

Navigate to **Amazon Bedrock → Model access** (in the left sidebar, under **Bedrock configurations**).

> Make sure you are in the **us-east-1 (N. Virginia)** region.

1. Click **Manage model access**
2. Find **Anthropic** in the list and check **Claude claude-sonnet-4-20250514** (also listed as `claude-sonnet-4-20250514`)
3. Click **Request model access**
4. Accept the Anthropic end-user license agreement if prompted
5. Wait for status to change from **Available to request** to **Access granted** (usually instant, sometimes a few minutes)

---

## Step 8 — AWS Amplify (Frontend Hosting)

Navigate to **AWS Amplify → New app → Host web app**.

### Option A — Connect a Git repository (recommended)

1. Choose your Git provider (GitHub, GitLab, Bitbucket, or AWS CodeCommit)
2. Authorize Amplify and select your repository and branch
3. App name: `shehealth`
4. Build settings — Amplify should auto-detect Create React App. Verify the build command is:
   ```
   cd shehealth/frontend && npm run build
   ```
   And the output directory is:
   ```
   shehealth/frontend/build
   ```
5. Add environment variables (click **Advanced settings**):

| Key | Value |
|---|---|
| `REACT_APP_COGNITO_USER_POOL_ID` | *(User Pool ID from Step 3)* |
| `REACT_APP_COGNITO_CLIENT_ID` | *(App Client ID from Step 3)* |
| `REACT_APP_API_BASE_URL` | *(Invoke URL from Step 6, e.g. `https://xxx.execute-api.us-east-1.amazonaws.com/prod`)* |

6. Click **Save and deploy**

### Option B — Manual upload

1. Build the frontend locally:
   ```bash
   cd shehealth/frontend
   npm install
   REACT_APP_COGNITO_USER_POOL_ID=xxx \
   REACT_APP_COGNITO_CLIENT_ID=xxx \
   REACT_APP_API_BASE_URL=https://xxx.execute-api.us-east-1.amazonaws.com/prod \
   npm run build
   ```
2. In Amplify, choose **Deploy without Git provider**
3. Drag and drop the `shehealth/frontend/build/` folder
4. Click **Save and deploy**

📋 **Note down**: The Amplify app URL (e.g. `https://main.xxxxxxxx.amplifyapp.com`)

---

## Post-Setup Checklist

Copy these values into your `.env` files and Lambda environment variables before running the app.

### `shehealth/frontend/.env`

```env
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_API_BASE_URL=https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod
```

### Lambda environment variables (all three functions)

```env
BEDROCK_REGION=us-east-1
DYNAMODB_TABLE_USERS=shehealth-users
DYNAMODB_TABLE_SYMPTOMS=shehealth-symptoms
DYNAMODB_TABLE_CONVERSATIONS=shehealth-conversations
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
REPORTS_BUCKET=shehealth-reports-{your-account-id}
```

### Verification checklist

- [ ] All 3 DynamoDB tables created with correct keys and on-demand billing
- [ ] S3 bucket created with all public access blocked
- [ ] Cognito User Pool created; User Pool ID and App Client ID noted
- [ ] IAM role `shehealth-lambda-role` created with inline policy (DynamoDB + S3 + Bedrock)
- [ ] All 3 Lambda functions created (Node.js 18.x, 256 MB, 30s timeout, correct role)
- [ ] All 7 environment variables set on each Lambda function
- [ ] Lambda code uploaded as ZIP for all 3 functions
- [ ] API Gateway `shehealth-api` created with Cognito Authorizer
- [ ] All 7 routes created with correct Lambda integrations and authorizer attached
- [ ] CORS enabled on all resources
- [ ] API deployed to `prod` stage; Invoke URL noted
- [ ] Bedrock model access granted for `anthropic.claude-sonnet-4-20250514` in `us-east-1`
- [ ] Amplify app deployed with all 3 frontend environment variables set
- [ ] `shehealth/frontend/.env` updated with real values
