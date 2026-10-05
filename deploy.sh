#!/usr/bin/env bash
# Builds the site and publishes it. Used by GitHub Actions (credentials from OIDC)
# and by hand as a fallback (uses the montania-deploy profile).
set -euo pipefail

if [[ -z "${CI:-}" ]]; then
  export AWS_PROFILE=montania-deploy
fi
export AWS_REGION=us-east-1

# The deploy profile can't read CloudFormation, so the stack outputs come from the montania profile.
if [[ ! -f .env.production ]]; then
  echo "==> .env.production missing, generating it from the composytex-admin stack..."
  AWS_PROFILE=montania scripts/write-env.sh
fi

npm run build
# data/ and media/ hold the catalog managed from /admin — never delete or overwrite them here.
aws s3 sync dist/ s3://composytex-website --delete --exclude "data/*" --exclude "media/*"
aws cloudfront create-invalidation --distribution-id EDLEB3DROGP6X --paths "/*" --query Invalidation.Id --output text
