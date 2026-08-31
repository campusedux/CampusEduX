# CampusEduX legal website

Static, self-contained pages for the public legal site at `https://campusedux.app/`.

## Source of truth

These files are **generated** — do not edit them by hand. The content lives in:

- `../src/legal/legal.config.json` — company/contact details, jurisdiction, refund rules, per-document versions
- `../src/legal/content/*.json` — the document bodies

The mobile app renders the *same* JSON, so the app and the website never drift.

## Regenerate

```
cd mobile-app
npm run legal:html      # -> writes this folder
```

Run this after editing any content or config file, then redeploy.

## Deploy

Upload the contents of this folder to your web host so these paths resolve:

| File | URL |
|---|---|
| `privacy-policy.html` | `https://campusedux.app/privacy-policy` |
| `terms.html` | `https://campusedux.app/terms` |
| `refund-policy.html` | `https://campusedux.app/refund-policy` |
| `project-license.html` | `https://campusedux.app/project-license` |
| `community-guidelines.html` | `https://campusedux.app/community-guidelines` |
| `disclaimer.html` | `https://campusedux.app/disclaimer` |
| `data-and-permissions.html` | `https://campusedux.app/data-and-permissions` |
| `delete-account.html` | `https://campusedux.app/delete-account` |
| `contact.html` | `https://campusedux.app/contact` |
| `index.html` | `https://campusedux.app/legal` |

Strip the `.html` extension in your host's routing (most static hosts do this
automatically, or via a `_redirects` / rewrite rule). The `<link rel="canonical">`
in each page already points at the extension-less URL.

The **Google Play "Privacy policy" field** should be set to
`https://campusedux.app/privacy-policy` once this is live.
