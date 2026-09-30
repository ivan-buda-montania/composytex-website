#!/usr/bin/env bash
# One-time upload of the initial catalog and images to S3. Refuses to overwrite
# an existing catalog unless --force is given (the live catalog is edited from /admin).
set -euo pipefail

BUCKET=composytex-website
DISTRIBUTION_ID=EDLEB3DROGP6X
cd "$(dirname "$0")/.."

if aws s3api head-object --bucket "$BUCKET" --key data/catalog.json >/dev/null 2>&1 && [[ "${1:-}" != "--force" ]]; then
  echo "s3://$BUCKET/data/catalog.json already exists. Use --force to overwrite it." >&2
  exit 1
fi

aws s3 cp seed/media/ "s3://$BUCKET/media/" --recursive --cache-control "public, max-age=31536000, immutable"
aws s3 cp seed/data/catalog.json "s3://$BUCKET/data/catalog.json" \
  --content-type "application/json; charset=utf-8" --cache-control "public, max-age=60"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/data/*" "/media/*" >/dev/null
echo "Catalog seeded."
