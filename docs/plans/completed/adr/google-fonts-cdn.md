# Use Google Fonts CDN instead of self-hosted fonts

Self-hosting Roboto and Material Icons requires maintaining ~40 font files across 5 formats (eot, woff, woff2, ttf, svg) totaling ~3MB. Replacing with Google Fonts CDN eliminates local font files and provides automatic format negotiation, browser caching, and preloading. Trade-off: requires network access for font loading, but the app already requires network for Firebase hosting and Google Fonts is highly available (used by millions of sites).
