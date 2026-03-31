#!/usr/bin/env bash
# ==============================================================================
# SheHealth - AWS Infrastructure Deployment Script (Bash)
# ==============================================================================
# Usage: ./deploy.sh
# Requirements: AWS CLI configured with appropriate permissions, zip, npm
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# Helper functions
# ------------------------------------------------------------------------------

step()    { echo -e "\n\033[0;36m==> $1\033[0m"; }
success() { echo -e "    \033[0;32m[OK] $1\033[0m"; }
fail()    { echo -e "    \033[0;31m[FAIL] $1\033[0m"; exit 1; }
skip()    { echo -e "    \033[0;33m[SKIP] $1\033[0m"; }

# Resolve absolute paths relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$SCRIPT_DIR"
LAMBDA_BASE_DIR="$SCRIPT_DIR/../lambda"
FRONTEND_DIR="$SCRIPT_DIR/../frontend"

STACK_NAME="shehealth-stack"
REGION="us-east-1"
TEMPLATE="$INFRA_DIR/cloudformation.yaml"

# Lambda function names and their source folders
declare -A LAMBDA_FUNCTIONS=(
    ["shehealth-chatHandler"]="chatHandler"
    ["shehealth-symptomHandler"]="symptomHandler"
    ["shehealth-reportHandler"]="reportHandler"
)

# ==============================================================================
# STEP 1 - Verify AWS CLI is installed
# ==============================================================================
step "Checking AWS CLI installation..."

if ! command -v aws &>/dev/null; then
    fail "AWS CLI is not installed or not in PATH. Install it from https://aws.amazon.com/cli/"
fi

AWS_VERSION=$(aws --version 2>&1)
success "AWS CLI found: $AWS_VERSION"

# Verify zip is available
if ! command -v zip &>/dev/null; then
    fail "'zip' command not found. Install it (e.g. 'brew install zip' or 'apt install zip')."
fi

# Verify npm is available
if ! command -v npm &>/dev/null; then
    fail "'npm' not found. Install Node.js from https://nodejs.org/"
fi

# ==============================================================================
# STEP 2 - Get current AWS account ID
# ==============================================================================
step "Fetching AWS account identity..."

CALLER_IDENTITY=$(aws sts get-caller-identity --output json) || \
    fail "Failed to get caller identity. Ensure your AWS credentials are configured (aws configure)."

ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Account'])")
CALLER_ARN=$(echo "$CALLER_IDENTITY" | python3 -c "import sys,json; print(json.load(sys.stdin)['Arn'])")

success "Account ID : $ACCOUNT_ID"
success "Caller ARN : $CALLER_ARN"

# ==============================================================================
# STEP 3 - Deploy CloudFormation stack
# ==============================================================================
step "Deploying CloudFormation stack '$STACK_NAME'..."

if [[ ! -f "$TEMPLATE" ]]; then
    fail "CloudFormation template not found at: $TEMPLATE"
fi

aws cloudformation deploy \
    --template-file "$TEMPLATE" \
    --stack-name "$STACK_NAME" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region "$REGION" || fail "CloudFormation deployment failed. Check the AWS Console for stack events."

success "Stack deployed successfully."

# ==============================================================================
# STEP 4 - Retrieve stack outputs
# ==============================================================================
step "Retrieving stack outputs..."

STACK_OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --query "Stacks[0].Outputs" \
    --output json) || fail "Failed to retrieve stack outputs."

# Parse individual output values using python3 (available on macOS and most Linux)
get_output() {
    local key="$1"
    echo "$STACK_OUTPUTS" | python3 -c \
        "import sys,json; outputs={o['OutputKey']:o['OutputValue'] for o in json.load(sys.stdin)}; print(outputs.get('$key',''))"
}

USER_POOL_ID=$(get_output "UserPoolId")
USER_POOL_CLIENT_ID=$(get_output "UserPoolClientId")
API_GATEWAY_URL=$(get_output "ApiGatewayUrl")
REPORTS_BUCKET=$(get_output "ReportsBucketName")

success "UserPoolId       : $USER_POOL_ID"
success "UserPoolClientId : $USER_POOL_CLIENT_ID"
success "ApiGatewayUrl    : $API_GATEWAY_URL"
success "ReportsBucket    : $REPORTS_BUCKET"

# ==============================================================================
# STEP 5 - Package and upload Lambda functions
# ==============================================================================
step "Packaging and uploading Lambda functions..."

# Temp directory for zip files
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT  # Always clean up on exit

for FN_NAME in "${!LAMBDA_FUNCTIONS[@]}"; do
    FN_FOLDER="${LAMBDA_FUNCTIONS[$FN_NAME]}"
    FN_DIR="$LAMBDA_BASE_DIR/$FN_FOLDER"
    ZIP_PATH="$TEMP_DIR/$FN_FOLDER.zip"

    echo -e "\n  -> $FN_NAME"

    # Verify the Lambda source directory exists
    if [[ ! -d "$FN_DIR" ]]; then
        skip "Source folder not found: $FN_DIR"
        continue
    fi

    # Install production dependencies
    echo "     Installing npm dependencies..."
    (cd "$FN_DIR" && npm install --production --silent) || \
        fail "npm install failed for $FN_NAME"

    # Zip the function contents (not the parent folder)
    echo "     Creating deployment package..."
    (cd "$FN_DIR" && zip -r "$ZIP_PATH" . --quiet) || \
        fail "Failed to create zip for $FN_NAME"

    # Upload to Lambda
    echo "     Uploading to AWS Lambda..."
    aws lambda update-function-code \
        --function-name "$FN_NAME" \
        --zip-file "fileb://$ZIP_PATH" \
        --region "$REGION" \
        --output json > /dev/null || fail "Failed to upload $FN_NAME to Lambda."

    success "$FN_NAME updated."
done

# ==============================================================================
# STEP 6 - Update frontend .env file
# ==============================================================================
step "Updating frontend .env file..."

mkdir -p "$FRONTEND_DIR"
ENV_FILE="$FRONTEND_DIR/.env"

cat > "$ENV_FILE" <<EOF
# Auto-generated by deploy.sh on $(date "+%Y-%m-%d %H:%M:%S")
# Do not edit manually - re-run deploy.sh to refresh these values

REACT_APP_AWS_REGION=$REGION
REACT_APP_COGNITO_USER_POOL_ID=$USER_POOL_ID
REACT_APP_COGNITO_CLIENT_ID=$USER_POOL_CLIENT_ID
REACT_APP_API_BASE_URL=$API_GATEWAY_URL
REACT_APP_REPORTS_BUCKET=$REPORTS_BUCKET
EOF

success "Written to $ENV_FILE"

# ==============================================================================
# DONE
# ==============================================================================
echo ""
echo -e "\033[0;32m============================================================\033[0m"
echo -e "\033[0;32m  SheHealth infrastructure deployed successfully!\033[0m"
echo -e "\033[0;32m============================================================\033[0m"
echo ""
echo "Next steps:"
echo "  1. Implement Lambda handler logic in lambda/*"
echo "  2. Run 'cd frontend && npm install && npm start' to start the app"
echo "  3. API base URL: $API_GATEWAY_URL"
echo ""
