# IF Consultancy — website

A static, single-page site for IF Consultancy. No build step, no dependencies, no framework — plain HTML, CSS and JavaScript, ready to push to GitHub and deploy on Cloudflare Pages.

```
index.html                 All page content
assets/css/style.css       Design system + layout
assets/js/logos.js         Client/partner mark data (file names + alt text)
assets/js/main.js          Wall animation, scroll reveals, accordion, form
assets/logos/*.webp        69 client & partner marks
assets/og-image.png        Social share image
assets/favicon.svg         Favicon
_headers                   Cloudflare security + cache headers
robots.txt, sitemap.xml    Basic SEO
```

## Preview locally

Open a terminal in this folder and run any static server:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly by double-clicking also works, but a local server is closer to production.

## Deploy

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "IF Consultancy website"
git branch -M main
git remote add origin https://github.com/<your-account>/<your-repo>.git
git push -u origin main
```

### 2. Connect Cloudflare Pages

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Select the repository, then set:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
3. **Save and Deploy.** Every push to `main` redeploys automatically.

### 3. Custom domain

Pages project → **Custom domains** → **Set up a domain** → `ifconsultancy-tr.com`. If the domain is already on Cloudflare, the DNS record is created for you; otherwise point the nameservers to Cloudflare first.

## Things to update before launch

- **Contact form.** It currently opens the visitor's email client (`mailto:`), which needs no backend. For a proper inbox form, sign up for Formspree or Cloudflare Pages Functions and replace the submit handler in `assets/js/main.js` (section 7).
- **Leadership bio.** The paragraph about Betul Yucel in the *Leadership* section is written from the brief — review the wording and add specific credentials, board roles or awards.
- **Impact section.** Engagements are described by sector rather than by named client. If any client has approved a named case study, it can replace a row.
- **Client marks.** The 69 logos in `assets/logos/` were extracted from the supplied client sheet. To add or replace one, drop a new file in that folder and add an entry to `assets/js/logos.js`. Higher-resolution originals will look sharper — the current files come from a 648px-wide source.
- **Domain references.** `index.html` (canonical + Open Graph URLs), `robots.txt` and `sitemap.xml` all point to `https://ifconsultancy-tr.com/`.

## Notes

- Fonts load from Google Fonts (Newsreader, Archivo, IBM Plex Mono). To self-host, download the families into `assets/fonts/` and swap the `<link>` in `index.html` for `@font-face` rules.
- The site respects `prefers-reduced-motion`: the logo wall stops drifting and all reveal animations are disabled.
- Tested layout breakpoints: 1024px and 760px.
