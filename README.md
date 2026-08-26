# IF Consultancy

Premium static website for IF Consultancy.

## Structure

- `public/` — website assets
- `wrangler.jsonc` — Cloudflare Workers Static Assets configuration

## Cloudflare Git deployment

Connect this GitHub repository to Cloudflare Workers Builds.

- Production branch: `main`
- Build command: leave empty
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

The site is served from `./public`.
