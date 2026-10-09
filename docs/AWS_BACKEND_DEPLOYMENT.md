# EventMate AI - AWS Backend Deployment & Operations Guide

This document records the production AWS deployment of the **EventMate AI** serverless backend.

---

## 1. AWS Architecture Overview

EventMate AI is architected as a secure, serverless application deployed in AWS `us-east-1`:

```
┌────────────────────────────────┐
│  React 18 SPA (Vite / Amplify)  │
└───────────────┬────────────────┘
                │ HTTPS (Bearer JWT / Demo Auth)
                ▼
┌──────────────────────────────────────────────┐
│  Amazon API Gateway (HTTP API v2)            │
│  https://5zbjhov2p7.execute-api.us-east-1...  │
└───────────────────────┬──────────────────────┘
                        │ AWS_PROXY
                        ▼
┌──────────────────────────────────────────────┐
│  AWS Lambda (Node.js 20, 512MB, 30s timeout)  │
│  EventMateAiStack-EventMateBackendLambda...  │
└───────┬───────────────┬──────────────┬───────┘
        │               │              │
        ▼               ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌───────────────────────────┐
│Amazon Cognito│ │Amazon Bedrock│ │Amazon DynamoDB (4 Tables) │
│ User Pool &  │ │  Nova Lite   │ │ • eventmate-ai-events     │
│ Public Client│ │ amazon.nova- │ │ • eventmate-ai-tasks      │
│              │ │   lite-v1:0  │ │ • eventmate-ai-convers... │
│              │ │              │ │ • eventmate-ai-rescue-... │
└──────────────┘ └──────────────┘ └───────────────────────────┘
```

---

## 2. AWS Account & Stack Information

- **AWS Account ID:** `383433255132`
- **AWS Region:** `us-east-1`
- **CloudFormation Stack Name:** `EventMateAiStack`
- **CDK Toolkit Version:** `2.179.0` (Bootstrap Version: 32)
- **Deployment Status:** `CREATE_COMPLETE` / `UPDATE_COMPLETE`

---

## 3. Deployed AWS Resources

### Amazon API Gateway (HTTP API)
- **API ID:** `5zbjhov2p7`
- **HTTPS Endpoint:** `https://5zbjhov2p7.execute-api.us-east-1.amazonaws.com`
- **Protocol:** HTTP API v2 with `$default` auto-deploy stage
- **Routes:** `ANY /{proxy+}` mapped to the Lambda proxy integration

### AWS Lambda
- **Function Name:** `EventMateAiStack-EventMateBackendLambdaB3AAD249-oacu9jjSLNxc`
- **Runtime:** Node.js 20.x
- **Memory:** 512 MB
- **Timeout:** 30 seconds
- **Bundling:** Self-contained bundle via `esbuild` (`dist/handlers/lambda.js`) including all runtime dependencies.

### Amazon Cognito
- **User Pool Name:** `eventmate-ai-users`
- **User Pool ID:** `us-east-1_cWMH6H7IY`
- **Client ID:** `66s3ggaiueebp56mbpu345usf5`
- **Authentication Flows:** `USER_PASSWORD_AUTH`, `USER_SRP_AUTH`
- **Client Type:** Public client (no client secret; safe for browser SPAs)
- **Password Policy:** Min 8 chars, uppercase, lowercase, numbers, symbols

### Amazon DynamoDB Tables (On-Demand Capacity)
1. `eventmate-ai-events` (Partition Key: `eventId`, GSI: `OwnerIndex`)
2. `eventmate-ai-tasks` (Partition Key: `taskId`, GSI: `EventIndex`)
3. `eventmate-ai-conversations` (Partition Key: `eventId`)
4. `eventmate-ai-rescue-proposals` (Partition Key: `proposalId`, GSI: `EventIndex`)

### Amazon Bedrock Integration
- **Model ID:** `amazon.nova-lite-v1:0`
- **IAM Policy:** Least-privilege `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` scoped to `amazon.nova-lite-v1:0` foundation model and inference profiles.

---

## 4. Lambda Runtime Environment Variables

Configured automatically via CDK in `infrastructure/lib/eventmate-ai-stack.ts`:

```env
EVENTS_TABLE_NAME=eventmate-ai-events
TASKS_TABLE_NAME=eventmate-ai-tasks
CONVERSATIONS_TABLE_NAME=eventmate-ai-conversations
RESCUE_PROPOSALS_TABLE_NAME=eventmate-ai-rescue-proposals
COGNITO_USER_POOL_ID=us-east-1_cWMH6H7IY
COGNITO_CLIENT_ID=66s3ggaiueebp56mbpu345usf5
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
NODE_ENV=production
```

---

## 5. Verification Results

All automated verification tests ran live against the deployed AWS infrastructure:

| Component / Action | Status | Observation |
| :--- | :---: | :--- |
| **API Gateway / Health** | ✅ PASS | `GET /health` returned HTTP 200 with security headers and status `healthy`. |
| **Unauthenticated Rejection** | ✅ PASS | `GET /events` rejected with HTTP 401 `{"error":"Unauthorized"}`. |
| **Cognito Authentication** | ✅ PASS | Authenticated with `USER_PASSWORD_AUTH`, returned valid RS256 JWT ID token. |
| **DynamoDB Event Creation** | ✅ PASS | `POST /events` created `evt_c93da4c6e8c5` in `eventmate-ai-events`. |
| **DynamoDB Task Creation** | ✅ PASS | `POST /events/:id/tasks` created `tsk_e291b2fd8921` in `eventmate-ai-tasks`. |
| **DynamoDB Querying** | ✅ PASS | `GET /events/:id/tasks` returned tasks for the owner. |
| **Readiness Progress Calc** | ✅ PASS | `GET /events/:id/progress` computed readiness score. |
| **Plan Rescue Generation** | ✅ PASS | `POST /events/:id/rescue` generated 3 pivot options in DynamoDB. |
| **Bedrock Nova Lite Agent** | ✅ PASS | `POST /agent/chat` invoked Nova Lite, executed `list_event_tasks` tool. |

---

## 6. How to Configure CORS for AWS Amplify

The stack currently allows local development origins (`http://localhost:5173`, `http://localhost:3000`).

Once your React frontend is deployed to AWS Amplify (e.g. `https://main.d1234567890abc.amplifyapp.com`):

1. Set the environment variable in your terminal:
   ```bash
   $env:ALLOWED_ORIGINS="https://main.d1234567890abc.amplifyapp.com"
   ```
2. Redeploy the CDK stack:
   ```bash
   npm --workspace=infrastructure run build
   npx cdk deploy EventMateAiStack --app "node infrastructure/bin/infrastructure.js" --require-approval never
   ```
   CDK will update the API Gateway preflight configuration without recreating any DynamoDB tables or Cognito pools.

---

## 7. How to Redeploy Backend Code After Changes

Whenever you modify files in `backend/src/`:

1. Compile and bundle the backend:
   ```bash
   npm --workspace=backend run build
   ```
   *(This runs `tsc` and `esbuild` to produce `backend/dist/handlers/lambda.js`)*
2. Compile and deploy via CDK:
   ```bash
   npm --workspace=infrastructure run build
   npx cdk deploy EventMateAiStack --app "node infrastructure/bin/infrastructure.js" --require-approval never
   ```

---

## 8. How to View Lambda Logs & Monitor Costs

### CloudWatch Logs
To stream live Lambda logs using the AWS CLI:
```bash
aws logs tail "/aws/lambda/EventMateAiStack-EventMateBackendLambdaB3AAD249-oacu9jjSLNxc" --follow --region us-east-1
```

### Cost Monitoring
- **DynamoDB:** Configured with `PAY_PER_REQUEST` (On-Demand). You pay $0 when the application is idle.
- **Cognito:** Free tier covers up to 50,000 monthly active users (MAUs).
- **Lambda:** Free tier includes 1,000,000 free requests and 3.2 million seconds of compute time per month.
- **Bedrock Nova Lite:** Extremely cost-effective (~$0.06 per 1M input tokens, ~$0.24 per 1M output tokens).
