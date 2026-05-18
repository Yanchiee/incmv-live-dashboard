# INCMV 2026 Live Dashboard

Public dashboard for INCMV 2026 rankings, Benguet comment monitoring, Kapisanan counts, Lokal counts, and officer monitoring snapshots.

The site is static and reads its latest numbers from `data/dashboard.json`.

## Cloud updates

GitHub Actions runs `scripts/update-dashboard-data.mjs` on schedule, so the
dashboard can refresh even when the local computer is off. The action fetches
the public YouTube comments and official INCMV playlist rankings, rewrites
`data/dashboard.json`, and commits the change. The public Cloudflare Pages site
reads that JSON directly from the GitHub `main` branch, so scheduled number
updates do not require a Cloudflare deploy.

## Manual refresh button

The dashboard includes a `Refresh Now` button. It calls the Cloudflare Pages
Function at `/api/refresh`, which dispatches the GitHub Actions updater.

Cloudflare Pages needs these secrets configured before the button can queue a
real refresh:

- `REFRESH_CODE`: the private code entered in the dashboard prompt.
- `GITHUB_TOKEN`: a GitHub token with permission to dispatch workflows for this
  repository.

For Slack notifications from GitHub Actions, add this GitHub repository secret:

- `SLACK_WEBHOOK_URL`: an incoming Slack webhook URL for the target channel or
  DM.

## Deployments

GitHub pushes to `main` deploy this folder to the existing Cloudflare Pages
project `incmv-live-dashboard`.

The GitHub repository needs one secret:

- `CLOUDFLARE_API_TOKEN`: a Cloudflare API token with permission to edit
  Cloudflare Pages for account `1adbe6308690a1d3ce7fb732fa17e859`.
