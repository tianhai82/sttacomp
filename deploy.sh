#!/bin/bash

echo "🔨 Building Svelte app..."
cd web
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚀 Deploying to Firebase..."
cd ..
firebase deploy

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Deployed successfully!"
  echo "🌐 https://ttdraw.web.app"
else
  echo "❌ Deployment failed!"
  exit 1
fi
