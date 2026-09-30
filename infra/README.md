# Catalog admin (`/admin`)

The product catalog is no longer part of the source code. It lives in S3 and is edited by a single
superadmin at `https://composytex.com/admin`.

```
composytex.com ── CloudFront ──┬─ /*                  → S3 site build (public pages + /admin)
                               ├─ /data/catalog.json  → S3 catalog (single JSON document)
                               └─ /media/*            → S3 product images
/admin → Cognito (login) → API Gateway HTTP API (JWT check) → Lambda → S3 + CloudFront invalidation
                                                                     └→ Amazon Translate (ES → EN)
```

- **Spanish is the source language.** The admin form only takes Spanish; on save the Lambda
  generates English with Amazon Translate. Text that is unchanged keeps its existing English, so
  only new or edited strings get translated.
- **Concurrency:** writes use S3 conditional puts (`If-Match`), so edits never overwrite each other.
- **Freshness:** each save invalidates `/data/catalog.json` in CloudFront. Changes show up in about 1 minute.
- **Images** are resized in the browser (max 1600 px, WebP), uploaded through the API, and deleted
  from S3 once no product references them.

## One-time setup

Needs an AWS profile with admin rights. The `montania-deploy` role can only sync the site.

1. **Deploy the stack** ([AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)):
   ```bash
   cd infra
   sam build && sam deploy --profile <admin-profile>
   ```
   Note the outputs: `ApiUrl`, `UserPoolClientId`, `SpaRewriteFunctionArn`.

2. **Attach the SPA rewrite function** to distribution `EDLEB3DROGP6X`
   (CloudFront console → Behaviors → Default (*) → Edit → Function associations →
   *Viewer request* → CloudFront Functions → `composytex-spa-rewrite`).
   This makes `/admin`, `/machinery`, etc. load when opened directly or refreshed
   (without it S3 answers 403). Already attached on 2026-09-30.

3. **Seed the catalog** (uploads `seed/` to S3, refuses to overwrite an existing catalog):
   ```bash
   AWS_PROFILE=<admin-profile> scripts/seed-catalog.sh
   ```

4. **Create the superadmin.** Cognito emails a temporary password. The first login asks for a new one:
   ```bash
   AWS_PROFILE=<admin-profile> scripts/create-admin.sh owner@example.com
   ```

5. **Configure and deploy the site:**
   ```bash
   cp .env.example .env.production   # fill VITE_API_URL and VITE_COGNITO_CLIENT_ID from step 1
   ./deploy.sh
   ```
   `deploy.sh` excludes `data/` and `media/` from `s3 sync --delete`, so deploys never touch the live catalog.

## Local development

`npm run dev` serves `/data/*` and `/media/*` from `seed/`. Only public pages use these files.
`/admin` always talks to the real API. To use it locally, create `.env.development.local` with the
same values as `.env.production`, plus `VITE_MEDIA_BASE=https://composytex.com`.

`seed/data/catalog.json` is only the initial content. After seeding, the live catalog in S3 is the
source of truth.

## Password reset

The login screen has *¿Olvidaste tu contraseña?*. Cognito emails a code to the admin address.

## Cost

Cognito Lite (free under 10k monthly users), a few Lambda/API calls, and Amazon Translate on
edited text only ($15 per million characters; the whole catalog is about 40k characters).
Probably about $1/month or less.
