# @finodex/form-embed

A drop-in JS bundle that renders any Finodex form on any website. Built with
[Preact](https://preactjs.com) (~3KB runtime) and bundled with Vite as a single
self-contained IIFE.

## Usage on a host site

```html
<!-- Auto-init: scan for [data-finodex-form] on load -->
<div
  data-finodex-form="contact"
  data-finodex-org="1"
  data-finodex-api="https://api.finodex.net"
></div>
<script src="https://forms.finodex.net/finodex-forms.js" async></script>
```

Or programmatically:

```html
<div id="my-form"></div>
<script src="https://forms.finodex.net/finodex-forms.js"></script>
<script>
  FinodexForms.render({
    container: document.getElementById("my-form"),
    slug: "contact",
    orgId: 1,
    apiBase: "https://api.finodex.net", // optional
    onSuccess: (result) => console.log("submitted:", result),
    onError: (err) => console.error(err),
    submitLabel: "Send message",
  });
</script>
```

## Allowed origins

The form's `config.allowedOrigins` (set in the admin panel) controls which
host pages may submit. Empty list = any origin (useful for local testing).
Add specific origins like `https://example.com` to lock down.

## Local dev

```bash
npm install
npm run dev      # vite dev server with HMR
npm run build    # single-file IIFE → dist/finodex-forms.js
```

`VITE_DEFAULT_API_BASE` env var sets the baked-in default API base URL
(overridable per form via `data-finodex-api` / `apiBase`).

## File layout

- `src/main.tsx` — IIFE entry; exposes `window.FinodexForms`
- `src/DynamicForm.tsx` — Preact component that fetches schema + renders
- `src/api.ts` — `fetch`-based API client
- `src/styles.css` — scoped `.fdx-form-*` styles, inlined into bundle
- `src/types.ts` — shared TS types

## Architecture notes

- **Light DOM, scoped classes** (`fdx-form-*`) — embed inherits host fonts/colors,
  host can override via CSS.
- **`fetch` with `credentials: "omit"`** — no cookies sent cross-origin.
- **HMAC + rate limit + honeypot** are all server-side concerns; this client
  just trusts the schema and submits.
