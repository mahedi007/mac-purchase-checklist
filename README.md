# MacCheck guide

Check whether a MacBook is brand new, open box, Apple refurbished, third-party refurbished or second hand before you buy. Static site: plain HTML, CSS and JavaScript, no build step.

## Files

| File | What it does |
|---|---|
| `index.html` | Page structure: sidebar, Condition, Checklist, Tools views |
| `styles.css` | Apple-style design, light and dark mode, mobile tab bar |
| `data.js` | All content: checklist items, detector questions, part number prefixes, region codes |
| `app.js` | Detector scoring, checklist logic, routing, test tools |
| `favicon.svg` | Site icon |
| `_headers` | Cloudflare Pages security and cache headers |

To change wording or add a check, edit `data.js` only. Each checklist item has `m` (purchase types it applies to) and `db: true` for deal-breakers.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```
## Notes
- Progress is stored in the visitor's browser (localStorage) only. No server, no tracking.
- External assets: Lucide icons (cdn.jsdelivr.net, pinned to 0.383.0) and the Inter font (Google Fonts) as a fallback for non-Apple devices.
- Not affiliated with Apple. The condition verdict is an estimate, not proof.