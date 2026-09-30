#!/usr/bin/env bash
# Writes .env.production from the composytex-admin stack outputs (none are secret).
# Usage: scripts/write-env.sh            (uses current AWS credentials / AWS_PROFILE)
set -euo pipefail

STACK=composytex-admin
REGION=us-east-1
cd "$(dirname "$0")/.."

output() {
  aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

cat > .env.production <<ENV
VITE_API_URL=$(output ApiUrl)
VITE_COGNITO_CLIENT_ID=$(output UserPoolClientId)
VITE_COGNITO_REGION=$REGION
ENV
echo "Wrote .env.production"
