# Steps to build and deploy
## 1. Containerise to docker
`gcloud builds submit --tag gcr.io/ttdraw/api`

## 2. Deploying to Cloud Run
`gcloud run deploy --image gcr.io/ttdraw/api --platform managed`

## 3. Deploy static files to Firebase
- RUN `yarn build` locally in web folder
- Run `firebase deploy`