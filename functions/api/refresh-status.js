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

export async function onRequestGet({ request, env }) {
  const refreshCode = request.headers.get('x-refresh-code') || '';
  if (!env.REFRESH_CODE || !env.GITHUB_TOKEN) {
    return json({ error: 'Refresh status is not configured yet.' }, 503);
  }

  if (refreshCode !== env.REFRESH_CODE) {
    return json({ error: 'Invalid refresh code.' }, 403);
  }

  const response = await fetch(RUNS_URL, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'user-agent': 'incmv-live-dashboard-refresh-status',
      'x-github-api-version': '2022-11-28',
    },
  });

  if (!response.ok) {
    const message = await response.text();
    return json({ error: `GitHub status lookup failed: ${response.status} ${message}` }, 502);
  }

  const body = await response.json();
  const run = body.workflow_runs?.[0];
  if (!run) return json({ run: null });

  return json({
    run: {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url,
    },
  });
}

export function onRequest() {
  return json({ error: 'Use GET to read refresh status.' }, 405);
}
