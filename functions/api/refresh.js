const GITHUB_WORKFLOW_URL =
  'https://api.github.com/repos/Yanchiee/incmv-live-dashboard/actions/workflows/update-dashboard-data.yml/dispatches';
const RUNS_URL =
  'https://api.github.com/repos/Yanchiee/incmv-live-dashboard/actions/workflows/update-dashboard-data.yml/runs?per_page=1&branch=main';

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

  const headers = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'user-agent': 'incmv-live-dashboard-refresh',
    'x-github-api-version': '2022-11-28',
  };

  const statusResponse = await fetch(`${RUNS_URL}&t=${Date.now()}`, { headers });
  if (!statusResponse.ok) {
    const message = await statusResponse.text();
    return json({ error: `GitHub status lookup failed: ${statusResponse.status} ${message}` }, 502);
  }

  const statusBody = await statusResponse.json();
  const latestRun = statusBody.workflow_runs?.[0];
  if (latestRun && ['queued', 'in_progress', 'pending', 'waiting', 'requested'].includes(latestRun.status)) {
    return json(
      {
        ok: true,
        alreadyRunning: true,
        message: 'A dashboard refresh is already running.',
        run: {
          id: latestRun.id,
          status: latestRun.status,
          conclusion: latestRun.conclusion,
          createdAt: latestRun.created_at,
          updatedAt: latestRun.updated_at,
          url: latestRun.html_url,
        },
      },
      202,
    );
  }

  const response = await fetch(GITHUB_WORKFLOW_URL, {
    method: 'POST',
    headers: {
      ...headers,
      'content-type': 'application/json',
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
