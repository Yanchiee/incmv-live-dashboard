const GITHUB_CONTENT_URL =
  'https://api.github.com/repos/Yanchiee/incmv-live-dashboard/contents/data/dashboard.json?ref=main';
const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/Yanchiee/incmv-live-dashboard/main/data/dashboard.json';

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

async function fetchGithubData(env) {
  const headers = {
    accept: 'application/vnd.github.raw+json',
    'user-agent': 'incmv-live-dashboard-data',
    'x-github-api-version': '2022-11-28',
  };
  if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;

  const response = await fetch(`${GITHUB_CONTENT_URL}&t=${Date.now()}`, { headers });
  if (response.ok) return response;

  if (env.GITHUB_TOKEN) {
    const message = await response.text();
    throw new Error(`GitHub contents fetch failed: ${response.status} ${message}`);
  }

  return fetch(`${GITHUB_RAW_URL}?t=${Date.now()}`, {
    headers: {
      accept: 'application/json',
      'user-agent': 'incmv-live-dashboard-data',
    },
  });
}

export async function onRequestGet({ env }) {
  try {
    const response = await fetchGithubData(env);
    if (!response.ok) {
      const message = await response.text();
      return json({ error: `Dashboard data fetch failed: ${response.status} ${message}` }, 502);
    }

    const text = await response.text();
    return new Response(text, {
      headers: {
        'content-type': 'application/json',
        'cache-control': 'no-store',
        'access-control-allow-origin': '*',
      },
    });
  } catch (error) {
    return json({ error: error.message }, 502);
  }
}

export function onRequest() {
  return json({ error: 'Use GET to read dashboard data.' }, 405);
}
