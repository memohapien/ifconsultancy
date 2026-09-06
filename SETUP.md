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

## 5. KV Namespace (CMS content storage)

```bash
wrangler kv namespace create CONTENT_KV
```

Uncomment the `[[kv_namespaces]]` CONTENT_KV block in `wrangler.toml` and paste the `id`.

Content stored in KV takes priority over static JSON files. The admin panel at `/admin/` writes to KV; the site reads from KV first and falls back to `/content/*.json` if KV is empty or unavailable.

## 6. Environment Variables

Set these in **Cloudflare Dashboard → Pages → Settings → Environment variables**:

| Variable | Description | Example |
|---|---|---|
| `TURNSTILE_SECRET_KEY` | Turnstile secret key | `0x...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `RESEND_FROM` | Sender address | `IF Consultancy <noreply@ifconsultancy-tr.com>` |
| `NOTIFY_EMAIL` | Notification recipient | `if@ifconsultancy-tr.com` |
| `ADMIN_KEY` | Secret key for admin panel auth | Any strong random string |

## 7. Admin Panel

The admin panel is available at `/admin/`. It provides a JSON editor for all dynamic content types (Capabilities, Impact, Global, Nexus, Logos).

**Authentication:** Uses the `ADMIN_KEY` environment variable. Enter the key to log in.

**Recommended:** Protect `/admin/*` with [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/applications/configure-apps/) for an additional authentication layer before the admin key prompt.

## 8. R2 Bucket (logo storage — Phase 2)

```bash
wrangler r2 bucket create ifconsultancy-logos
```

Uncomment the `[[r2_buckets]]` block in `wrangler.toml`.

## Content Management

Content can be managed two ways:

1. **Admin panel (recommended):** Go to `/admin/`, log in with your `ADMIN_KEY`, edit JSON, and save. Changes go live within ~60 seconds via Cloudflare KV.

2. **Static files (fallback):** Edit `/content/*.json` files directly and push to the repository. These are used when KV has no data for a content type.

Content types:

- `capabilities` — Capabilities accordion + contact form topics
- `impact` — Selected impact entries
- `global` — Stats, markets, client types, recognition
- `nexus` — IF Nexus features
- `logos` — Client logo wall data

## Local Development

```bash
wrangler pages dev .
```

This starts a local server with Pages Functions support on `http://localhost:8788`.
