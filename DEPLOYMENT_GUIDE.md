# HABIT MASTERY SYSTEM - 2-WORKFLOW DEPLOYMENT GUIDE

## WORKFLOW OVERVIEW

### Workflow 1: Habit-Analysis-Orchestrator
**Purpose:** Handles form submissions, AI analysis, and JSON generation
**Trigger:** HTTP Webhook (from GHL)
**Combines:**
- Webhook Handler
- Gemini AI Analysis  
- Tag Generation
- JSON Report Creation

### Workflow 2: Report-Publisher
**Purpose:** Handles PDF generation, email sending, and tracking
**Trigger:** HTTP Webhook (from Orchestrator or frontend)
**Combines:**
- PDF Generation (Puppeteer)
- Email Sending (Resend)
- Click Tracking
- GHL Tag Updates

## PIPEDREAM SETUP INSTRUCTIONS

### Step 1: Create Workflow 1 - Habit-Analysis-Orchestrator
1. Go to Pipedream → New Workflow → HTTP API Trigger
2. Name: "Habit-Analysis-Orchestrator"
3. Copy-paste code from `workflows/habit-analysis-orchestrator.js`
4. Set Environment Variables:




GEMINI_API_KEY=your_gemini_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_BUCKET_NAME=ai-analyzer-bucket
PUBLISHER_WORKFLOW_URL=https://your-publisher-workflow.m.pipedream.net




5. Save and note the URL

### Step 2: Create Workflow 2 - Report-Publisher  
1. Go to Pipedream → New Workflow → HTTP API Trigger
2. Name: "Report-Publisher"
3. Copy-paste code from `workflows/report-publisher.js`
4. Set Environment Variables:


RESEND_API_KEY=your_resend_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_BUCKET_NAME=ai-analyzer-bucket
GHL_WEBHOOK_URL=your_ghl_webhook_endpoint
GHL_API_KEY=your_ghl_api_key



5. Save and note the URL

### Step 3: Update Workflow 1 with Workflow 2 URL
1. Go back to Workflow 1 settings
2. Update `PUBLISHER_WORKFLOW_URL` with Workflow 2's actual URL

## ENVIRONMENT VARIABLES SUMMARY

### Workflow 1 (Habit-Analysis-Orchestrator):

