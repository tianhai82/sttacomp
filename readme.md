# sttacomp

A tournament draw calculator built with Svelte and deployed as a static site on Firebase Hosting.

## Tech Stack
- **Frontend:** Svelte + Vite + Tailwind CSS
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