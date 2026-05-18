const GITHUB_WORKFLOW_URL =
  'https://api.github.com/repos/Yanchiee/incmv-live-dashboard/actions/workflows/update-dashboard-data.yml/dispatches';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
    },
  });
}

export async function onRequestPost({ env }) {
  if (!env.GITHUB_TOKEN) {
    return json(
      {
        error: 'Refresh is not configured yet. Add GITHUB_TOKEN to Cloudflare Pages.',
      },
      503,
    );
  }

  const response = await fetch(GITHUB_WORKFLOW_URL, {
    method: 'POST',
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'content-type': 'application/json',
      'user-agent': 'incmv-live-dashboard-refresh',
      'x-github-api-version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main' }),
  });

  if (!response.ok) {
    const message = await response.text();
    return json({ error: `GitHub refresh dispatch failed: ${response.status} ${message}` }, 502);
  }

  return json({ ok: true, message: 'Refresh queued.' }, 202);
}

export function onRequest() {
  return json({ error: 'Use POST to queue a refresh.' }, 405);
}
