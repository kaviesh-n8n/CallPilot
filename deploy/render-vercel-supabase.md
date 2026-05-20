# CallPilot SaaS Deployment

This repo can now be launched with:

- `ui/` on Vercel
- `api/` on Render using [render.yaml](../render.yaml)
- Supabase for Postgres
- Cloudflare R2 for recordings/uploads
- Cloudflare DNS in front of the public app and API

## Recommended launch order

1. Deploy the frontend on Vercel.
2. Create the backend Blueprint on Render.
3. Paste the Supabase Postgres URL into Render.
4. Create an R2 bucket and paste the R2 S3 credentials into Render.
5. Point your Cloudflare DNS records at Vercel and Render.
6. Add telephony/provider BYOK credentials inside the app.

That order avoids guessing URLs during setup.

## Vercel project

Create one Vercel project from this GitHub repo with:

- **Root Directory**: `ui`
- **Framework**: Next.js

Environment variables:

```text
NEXT_PUBLIC_BACKEND_URL=https://<your-render-backend>.onrender.com
NEXT_PUBLIC_NODE_ENV=production
```

`NEXT_PUBLIC_BACKEND_URL` is enough for both browser and server-side requests now. You can still add `BACKEND_URL` separately if you want an explicit server-only override.

## Render Blueprint

The included `render.yaml` provisions:

- `callpilot-cache` as a Render Key Value instance
- `callpilot-api` as a single Docker web service

It intentionally runs at **one instance** because the current Docker entrypoint starts:

- FastAPI
- ARQ workers
- campaign orchestrator
- telephony manager

all in the same container. That is stable for beta traffic, but not the final autoscaling shape.

### Render secret/env values to paste

During Blueprint creation, Render will prompt for:

```text
DATABASE_URL
S3_BUCKET
S3_REGION
S3_ENDPOINT_URL
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
UI_APP_URL
```

Use these values:

- `DATABASE_URL`: Supabase connection string with the scheme changed to `postgresql+asyncpg://`
- `S3_BUCKET`: your R2 bucket name
- `S3_REGION`: `auto` for R2
- `S3_ENDPOINT_URL`: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `AWS_ACCESS_KEY_ID`: R2 access key ID
- `AWS_SECRET_ACCESS_KEY`: R2 secret access key
- `UI_APP_URL`: your Vercel production URL or custom app domain

`BACKEND_API_ENDPOINT` does not need to be set on Render unless you want to override the default. The backend now falls back to Render's `RENDER_EXTERNAL_URL`.

## Supabase

Create a Supabase project and copy the Postgres connection string.

CallPilot expects SQLAlchemy async format:

```text
postgresql+asyncpg://postgres:<password>@<host>:5432/postgres
```

If Supabase gives you `postgresql://...`, change only the prefix to `postgresql+asyncpg://`.

## Cloudflare R2

Create:

- one bucket for media, for example `callpilot-media`
- one R2 API token with object read/write access to that bucket

Then use:

```text
ENABLE_AWS_S3=true
S3_BUCKET=callpilot-media
S3_REGION=auto
S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=<R2 access key>
AWS_SECRET_ACCESS_KEY=<R2 secret>
```

CallPilot now supports generic S3 endpoints, so R2 works without patching boto config outside the app.

## Cloudflare DNS

Typical records:

```text
app   CNAME  cname.vercel-dns.com
api   CNAME  <your-render-backend>.onrender.com
```

Then update:

- Vercel custom domain for `app.<your-domain>`
- Render custom domain for `api.<your-domain>`
- `NEXT_PUBLIC_BACKEND_URL=https://api.<your-domain>`
- `UI_APP_URL=https://app.<your-domain>`

## What is still beta-shaped

Before calling this "scale-ready", we should still do three follow-ups:

1. Split the backend into separate Render services for API and workers.
2. Add a TURN strategy for harder network conditions and cleaner WebRTC reliability.
3. Add Stripe billing, hard plan limits, and encrypted BYOK key rotation flows.
