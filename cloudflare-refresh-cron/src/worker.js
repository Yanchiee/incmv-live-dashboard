const REFRESH_URL = 'https://incmv-live-dashboard.pages.dev/api/refresh';
const STATUS_URL = 'https://incmv-live-dashboard.pages.dev/api/refresh-status';

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*',
    },
  });
}

async function triggerRefresh(source) {
  const response = await fetch(REFRESH_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': `incmv-dashboard-refresh-cron/${source}`,
    },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

async function readStatus() {
  const response = await fetch(STATUS_URL, {
    headers: {
      'user-agent': 'incmv-dashboard-refresh-cron/status',
    },
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export default {
  async scheduled(event, env, ctx) {
    ctx.waitUntil(triggerRefresh(`scheduled-${event.cron}`).then((result) => {
      console.log(JSON.stringify({
        at: new Date().toISOString(),
        cron: event.cron,
        result,
      }));
    }));
  },

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/status') {
      return json(await readStatus());
    }

    if (request.method === 'POST' || url.searchParams.get('trigger') === '1') {
      return json(await triggerRefresh('manual'));
    }

    return json({
      ok: true,
      worker: 'incmv-dashboard-refresh-cron',
      schedule: [
        '5,35 0-15 * * * UTC (8:05 AM-11:35 PM Manila backup cadence)',
        '5 16 * * * UTC (12:05 AM Manila)',
      ],
      endpoints: {
        trigger: 'POST / or GET /?trigger=1',
        status: 'GET /status',
      },
    });
  },
};
