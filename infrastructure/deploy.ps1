#!/usr/bin/env pwsh
# ==============================================================================
# SheHealth - AWS Infrastructure Deployment Script (PowerShell)
# ==============================================================================
# Usage: ./deploy.ps1
# Requirements: AWS CLI configured with appropriate permissions
# ==============================================================================

$ErrorActionPreference = "Stop"

# ------------------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------------------

function Write-Step {
    param([string]$Message)
    Write-Host "`n==> $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "    [OK] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "    [FAIL] $Message" -ForegroundColor Red
    exit 1
}

# Resolve the directory this script lives in so relative paths always work
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir  = $ScriptDir
$LambdaBaseDir = Join-Path (Join-Path $ScriptDir "..") "lambda"
$FrontendDir   = Join-Path (Join-Path $ScriptDir "..") "frontend"

$StackName = "shehealth-stack"
$Region    = "us-east-1"
$Template  = Join-Path $InfraDir "cloudformation.yaml"

# Lambda function names and their source folders
$LambdaFunctions = @(
    @{ Name = "shehealth-chatHandler";    Folder = "chatHandler"    },
    @{ Name = "shehealth-symptomHandler"; Folder = "symptomHandler" },
    @{ Name = "shehealth-reportHandler";  Folder = "reportHandler"  }
)

# ==============================================================================
# STEP 1 - Verify AWS CLI is installed
# ==============================================================================
Write-Step "Checking AWS CLI installation..."

try {
    $awsVersion = aws --version 2>&1
    Write-Success "AWS CLI found: $awsVersion"
} catch {
    Write-Fail "AWS CLI is not installed or not in PATH. Install it from https://aws.amazon.com/cli/"
}

# ==============================================================================
# STEP 2 - Get current AWS account ID
# ==============================================================================
Write-Step "Fetching AWS account identity..."

try {
    $callerIdentity = aws sts get-caller-identity --output json | ConvertFrom-Json
    $AccountId = $callerIdentity.Account
    $CallerArn = $callerIdentity.Arn
    Write-Success "Account ID : $AccountId"
    Write-Success "Caller ARN : $CallerArn"
} catch {
    Write-Fail "Failed to get caller identity. Ensure your AWS credentials are configured (aws configure)."
}

# ==============================================================================
# STEP 3 - Deploy CloudFormation stack
# ==============================================================================
Write-Step "Deploying CloudFormation stack '$StackName'..."

if (-not (Test-Path $Template)) {
    Write-Fail "CloudFormation template not found at: $Template"
}

try {
    aws cloudformation deploy `
        --template-file $Template `
        --stack-name $StackName `
        --capabilities CAPABILITY_NAMED_IAM `
        --region $Region

    Write-Success "Stack deployed successfully."
} catch {
    Write-Fail "CloudFormation deployment failed. Check the AWS Console for stack events."
}

# ==============================================================================
# STEP 4 - Retrieve stack outputs
# ==============================================================================
Write-Step "Retrieving stack outputs..."

try {
    $stackOutputsRaw = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query "Stacks[0].Outputs" `
        --output json | ConvertFrom-Json

    # Build a hashtable for easy lookup
    $Outputs = @{}
    foreach ($output in $stackOutputsRaw) {
        $Outputs[$output.OutputKey] = $output.OutputValue
    }

    Write-Success "UserPoolId       : $($Outputs['UserPoolId'])"
    Write-Success "UserPoolClientId : $($Outputs['UserPoolClientId'])"
    Write-Success "ApiGatewayUrl    : $($Outputs['ApiGatewayUrl'])"
    Write-Success "ReportsBucket    : $($Outputs['ReportsBucketName'])"
} catch {
    Write-Fail "Failed to retrieve stack outputs."
}

# ==============================================================================
# STEP 5 - Package and upload Lambda functions
# ==============================================================================
Write-Step "Packaging and uploading Lambda functions..."

# Temp directory for zip files
$TempDir = Join-Path $env:TEMP "shehealth-lambda-deploy"
if (Test-Path $TempDir) { Remove-Item $TempDir -Recurse -Force }
New-Item -ItemType Directory -Path $TempDir | Out-Null

foreach ($fn in $LambdaFunctions) {
    $FnName   = $fn.Name
    $FnFolder = $fn.Folder
    $FnDir    = Join-Path $LambdaBaseDir $FnFolder
    $ZipPath  = Join-Path $TempDir "$FnFolder.zip"

    Write-Host "`n  -> $FnName" -ForegroundColor Yellow

    # Verify the Lambda source directory exists
    if (-not (Test-Path $FnDir)) {
        Write-Host "     [SKIP] Source folder not found: $FnDir" -ForegroundColor DarkYellow
        continue
    }

    # Install production dependencies
    Write-Host "     Installing npm dependencies..."
    try {
        Push-Location $FnDir
        npm install --production --silent
        Pop-Location
    } catch {
        Pop-Location
        Write-Fail "npm install failed for $FnName"
    }

    # Zip the function contents (not the folder itself)
    Write-Host "     Creating deployment package..."
    try {
        # Compress-Archive needs the contents, not the folder wrapper
        $FilesToZip = Get-ChildItem -Path $FnDir -Recurse | Where-Object { -not $_.PSIsContainer }
        Compress-Archive -Path "$FnDir\*" -DestinationPath $ZipPath -Force
    } catch {
        Write-Fail "Failed to create zip for $FnName"
    }

    # Upload to Lambda
    Write-Host "     Uploading to AWS Lambda..."
    try {
        aws lambda update-function-code `
            --function-name $FnName `
            --zip-file "fileb://$ZipPath" `
            --region $Region `
            --output json | Out-Null

        Write-Success "$FnName updated."
    } catch {
        Write-Fail "Failed to upload $FnName to Lambda."
    }
}

# Clean up temp zips
Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue

# ==============================================================================
# STEP 6 - Update frontend .env file
# ==============================================================================
Write-Step "Updating frontend .env file..."

$EnvFile = Join-Path $FrontendDir ".env"

# Create the frontend directory if it doesn't exist yet
if (-not (Test-Path $FrontendDir)) {
    New-Item -ItemType Directory -Path $FrontendDir | Out-Null
}

$EnvContent = @"
# Auto-generated by deploy.ps1 on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
# Do not edit manually - re-run deploy.ps1 to refresh these values

REACT_APP_AWS_REGION=$Region
REACT_APP_COGNITO_USER_POOL_ID=$($Outputs['UserPoolId'])
REACT_APP_COGNITO_CLIENT_ID=$($Outputs['UserPoolClientId'])
REACT_APP_API_BASE_URL=$($Outputs['ApiGatewayUrl'])
REACT_APP_REPORTS_BUCKET=$($Outputs['ReportsBucketName'])
"@

Set-Content -Path $EnvFile -Value $EnvContent -Encoding UTF8
Write-Success "Written to $EnvFile"

# ==============================================================================
# STEP 7 - Build React app and deploy to S3 + invalidate CloudFront cache
# ==============================================================================
Write-Step "Building React app and deploying to S3..."

$FrontendBucket = $Outputs['FrontendBucketName']
$CloudFrontId = $null

# Get CloudFront distribution ID from the domain name output
try {
    $cfDomain = $Outputs['CloudFrontURL'] -replace 'https://', ''
    $cfList = aws cloudfront list-distributions --output json | ConvertFrom-Json
    $cfDist = $cfList.DistributionList.Items | Where-Object { $_.DomainName -eq $cfDomain }
    if ($cfDist) { $CloudFrontId = $cfDist.Id }
} catch {
    Write-Host "     [WARN] Could not get CloudFront distribution ID" -ForegroundColor DarkYellow
}

# Build the React app
Write-Host "     Running npm run build..."
try {
    Push-Location $FrontendDir
    npm run build
    Pop-Location
    Write-Success "React build complete."
} catch {
    Pop-Location
    Write-Fail "React build failed. Check the output above."
}

# Upload build output to S3
Write-Host "     Uploading to S3 bucket: $FrontendBucket..."
try {
    aws s3 sync "$FrontendDir\build" "s3://$FrontendBucket" `
        --delete `
        --cache-control "public,max-age=31536000,immutable" `
        --exclude "index.html" `
        --region $Region

    # Upload index.html with no-cache so updates are picked up immediately
    aws s3 cp "$FrontendDir\build\index.html" "s3://$FrontendBucket/index.html" `
        --cache-control "no-cache,no-store,must-revalidate" `
        --content-type "text/html" `
        --region $Region

    Write-Success "Frontend uploaded to S3."
} catch {
    Write-Fail "Failed to upload frontend to S3."
}

# Invalidate CloudFront cache so users get the latest version
if ($CloudFrontId) {
    Write-Host "     Invalidating CloudFront cache..."
    try {
        aws cloudfront create-invalidation `
            --distribution-id $CloudFrontId `
            --paths "/*" | Out-Null
        Write-Success "CloudFront cache invalidated."
    } catch {
        Write-Host "     [WARN] CloudFront invalidation failed - users may see cached version for up to 24h" -ForegroundColor DarkYellow
    }
}

$cfUrl = $Outputs["CloudFrontURL"]
Write-Success "Frontend deployed. URL: $cfUrl"

# ==============================================================================
# DONE
# ==============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  SheHealth infrastructure deployed successfully!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Implement Lambda handler logic in lambda/*" -ForegroundColor White
Write-Host "  2. Run 'cd frontend && npm install && npm start' to start the app" -ForegroundColor White
Write-Host "  3. API base URL: $($Outputs['ApiGatewayUrl'])" -ForegroundColor White
$cfUrl = $Outputs["CloudFrontURL"]
Write-Host "  4. App URL (CloudFront): $cfUrl" -ForegroundColor White
Write-Host ""
