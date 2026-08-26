# IF Consultancy — Cloudflare-ready website

## Structure

```text
/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── if-logo.png
│   └── client-ecosystem.jpg
├── package.json
├── wrangler.jsonc
└── README.md
```

## Cloudflare Git deployment

- Connect this GitHub repository to the Cloudflare Worker.
- Root directory: `/`
- Build command: leave empty.
- Deploy command: `npx wrangler deploy`
- No environment variables are required.

The Wrangler config points Cloudflare at `./public`, which contains the static site.

## Contact

if@ifconsultancy-tr.com

## Important

The client ecosystem section is based on the organization/logo sheet supplied by the site owner and is worded as a selected client/project/collaboration ecosystem rather than asserting that every organization is a current client.
