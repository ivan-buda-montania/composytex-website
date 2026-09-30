#!/usr/bin/env bash
set -e

export AWS_PROFILE=montania-deploy
export AWS_REGION=us-east-1

if [[ ! -f .env.production ]]; then
  echo "Missing .env.production (copy .env.example and fill it from the SAM stack outputs)." >&2
  exit 1
fi

npm run build
# data/ and media/ hold the catalog managed from /admin — never delete or overwrite them here.
aws s3 sync dist/ s3://composytex-website --delete --exclude "data/*" --exclude "media/*"
aws cloudfront create-invalidation --distribution-id EDLEB3DROGP6X --paths "/*"
