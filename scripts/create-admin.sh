#!/usr/bin/env bash
# Creates the single superadmin. Cognito emails a temporary password; the first
# login at /admin asks to replace it.
# Usage: scripts/create-admin.sh owner@example.com
set -euo pipefail

EMAIL="${1:?Usage: $0 <email>}"
STACK=composytex-admin
REGION=us-east-1

POOL_ID=$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)

aws cognito-idp admin-create-user --region "$REGION" --user-pool-id "$POOL_ID" \
  --username "$EMAIL" \
  --user-attributes Name=email,Value="$EMAIL" Name=email_verified,Value=true \
  --desired-delivery-mediums EMAIL >/dev/null
echo "Admin $EMAIL created. A temporary password was sent by email."
