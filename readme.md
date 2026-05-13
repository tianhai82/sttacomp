# sttacomp

A tournament draw calculator and draw preparation tool built with Svelte and deployed as a static site on Firebase Hosting.

## Features

- **Draw Calculator** — Compute knockout tournament draw positions from group stage results
- **Draw Preparation** — Define groups, fill in winner/runner-up details, draw positions interactively, and preview the knockout chart. Supports event naming, export/import of draw state with 7-day local persistence.
- **Responsive** — Desktop side-by-side layout; mobile bottom tab bar with chart sub-tabs

## Tech Stack
- **Frontend:** Svelte 5 (runes) + Vite 6 + Tailwind CSS 4
- **Routing:** svelte-spa-router (hash-based)
- **Testing:** Vitest + @testing-library/svelte
- **Deployment:** Firebase Hosting (static site)

---

## Local Development

### Prerequisites
- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)

### Start the dev server
```bash
cd web
npm install
npm run dev
```
The app runs on `http://localhost:5173`.

---

## Deployment

### Build & deploy to Firebase Hosting
```bash
cd web
npm run build
cd ..
firebase deploy
```

The app is now deployed as a pure static site.