# sttacomp

A drawing application with a Go API backend and Svelte frontend.

## Tech Stack
- **Backend:** Go (Gin framework) running on Cloud Run
- **Frontend:** Svelte + Vite + Tailwind CSS served via Firebase Hosting
- **Infra:** Google Cloud Run, Firebase Hosting, Google Container Registry

---

## Local Development

### Prerequisites
- Go 1.23+
- Node.js 18+
- `gcloud` CLI (for deployment)
- Firebase CLI (`npm install -g firebase-tools`)

### 1. Start the Go API
```bash
go run main.go
```
The API runs on `http://localhost:8080`.

### 2. Start the frontend dev server
```bash
cd web
npm install
npm run dev
```
The frontend runs on `http://localhost:5173` and proxies `/api` requests to the Go API via Vite.

---

## Deployment

### 1. Containerize & push the API to Google Container Registry
```bash
gcloud builds submit --tag gcr.io/ttdraw/api
```

### 2. Deploy the API to Cloud Run
```bash
gcloud run deploy --image gcr.io/ttdraw/api --platform managed
```

### 3. Build & deploy the frontend to Firebase Hosting
```bash
cd web
npm run build
cd ..
firebase deploy
```

### 4. Clean up (optional)
Remove unused files in Google Cloud Storage buckets as needed.