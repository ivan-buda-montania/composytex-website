#!/usr/bin/env bash
set -e

export AWS_PROFILE=montania-deploy
export AWS_REGION=us-east-1

npm run build
aws s3 sync dist/ s3://composytex-website --delete
aws cloudfront create-invalidation --distribution-id EDLEB3DROGP6X --paths "/*"
