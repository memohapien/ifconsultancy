# IF Consultancy — Cloudflare Setup Guide

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/) with Pages project linked to this repository
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) installed (`npm i -g wrangler`)
- [Resend account](https://resend.com/) for transactional email

## 1. D1 Database (contact form storage)

```bash
wrangler d1 create ifconsultancy-db
```

Copy the `database_id` from the output into `wrangler.toml`, then run the schema:

```bash
wrangler d1 execute ifconsultancy-db --file=./db/schema.sql
```

Uncomment the `[[d1_databases]]` block in `wrangler.toml` and paste your `database_id`.

## 2. KV Namespace (rate limiting)

```bash
wrangler kv namespace create RATE_KV
```

Uncomment the `[[kv_namespaces]]` block in `wrangler.toml` and paste the `id`.

## 3. Cloudflare Turnstile (bot protection)

1. Go to **Cloudflare Dashboard → Turnstile**
2. Add a new site for `ifconsultancy-tr.com`
3. Copy the **Site Key** into `index.html` (replace `YOUR_SITE_KEY` in the `cf-turnstile` div)
4. Set the **Secret Key** as an environment variable (see below)

## 4. Resend (email notifications)

1. Sign up at [resend.com](https://resend.com/)
2. Verify your domain (`ifconsultancy-tr.com`)
3. Create an API key
4. Set environment variables (see below)

## 5. Environment Variables

Set these in **Cloudflare Dashboard → Pages → Settings → Environment variables**:

| Variable | Description | Example |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Turnstile secret key | `0x...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `RESEND_FROM` | Sender address | `IF Consultancy <noreply@ifconsultancy-tr.com>` |
| `NOTIFY_EMAIL` | Notification recipient | `if@ifconsultancy-tr.com` |

## 6. R2 Bucket (logo storage — Phase 2)

```bash
wrangler r2 bucket create ifconsultancy-logos
```

Uncomment the `[[r2_buckets]]` block in `wrangler.toml`.

## Content Files

Dynamic content is served from `/content/*.json`:

- `capabilities.json` — Capabilities accordion + contact form topics
- `impact.json` — Selected impact entries
- `global.json` — Stats, markets, client types, recognition
- `nexus.json` — IF Nexus features
- `logos.json` — Client logo wall data

Edit these files directly and push to update the site content.

## Local Development

```bash
wrangler pages dev .
```

This starts a local server with Pages Functions support on `http://localhost:8788`.
