# INCMV 2026 Live Dashboard

Public dashboard for INCMV 2026 rankings, Benguet comment monitoring, Kapisanan counts, Lokal counts, and officer monitoring snapshots.

The site is static and reads its latest numbers from `data/dashboard.json`.

## Deployments

GitHub pushes to `main` deploy this folder to the existing Cloudflare Pages
project `incmv-live-dashboard`.

The GitHub repository needs one secret:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with permission to edit
  Cloudflare Pages for account `1adbe6308690a1d3ce7fb732fa17e859`.
