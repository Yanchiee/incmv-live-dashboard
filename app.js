const DATA_URL = 'https://api.github.com/repos/Yanchiee/incmv-live-dashboard/contents/data/dashboard.json?ref=main';
const REFRESH_API_URL = './api/refresh';
const REFRESH_MS = 60 * 1000;
const REFRESH_POLL_MS = 30 * 1000;
const REFRESH_TIMEOUT_MS = 18 * 60 * 1000;

const state = {
  data: null,
  refreshQueuedAt: 0,
  refreshStartedFrom: '',
  refreshPollTimer: null,
};

const formatNumber = new Intl.NumberFormat('en-US');

function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function number(value) {
  return formatNumber.format(Number(value) || 0);
}

function compactTimestamp(value) {
  const raw = String(value || '');
  const [datePart, timePart = ''] = raw.split(', ');
  const timeMatch = timePart.match(/(\d{1,2}:\d{2})(?::\d{2})?\s*([AP]M)/i);
  return {
    time: timeMatch ? `${timeMatch[1]} ${timeMatch[2].toUpperCase()}` : raw || '--',
    detail: datePart && timePart ? `${datePart} / checks every minute` : 'Browser checks every minute',
  };
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function rowHtml(cells) {
  return `<tr>${cells.map((cell) => `<td${cell.numeric ? ' class="number"' : ''}>${escapeHtml(cell.value)}</td>`).join('')}</tr>`;
}

function rowsOrEmpty(rows) {
  return Array.isArray(rows) ? rows : [];
}

function renderEmptyRow(columnCount, message = 'No data available yet') {
  return `<tr><td colspan="${columnCount}">${escapeHtml(message)}</td></tr>`;
}

function renderRankingCards(id, rows, limit = 10) {
  const element = document.getElementById(id);
  if (!element) return;
  const safeRows = rowsOrEmpty(rows).slice(0, limit);
  element.innerHTML = safeRows.length ? safeRows.map((row) => `
    <article class="ranking-card">
      <div class="rank">#${escapeHtml(row.rank || '--')}</div>
      <img src="${escapeHtml(row.thumbnailUrl || '')}" alt="${escapeHtml(row.entry || 'INCMV entry')} thumbnail" loading="lazy">
      <div>
        <p class="entry-title">${escapeHtml(row.entry)}</p>
        <p class="entry-subtitle">${escapeHtml(row.region)} / ${escapeHtml(row.songTitle)}</p>
      </div>
      <div class="views">${number(row.currentViews)} views</div>
    </article>
  `).join('') : '<p class="empty-state">No ranking data available yet.</p>';
}

function renderRankingTable(id, rows, limit = 20) {
  const element = document.getElementById(id);
  if (!element) return;
  const safeRows = rowsOrEmpty(rows).slice(0, limit);
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Region</th><th>Entry</th><th>Song</th><th>Views</th></tr></thead>
      <tbody>
        ${safeRows.length ? safeRows.map((row) => rowHtml([
          { value: row.rank },
          { value: row.region },
          { value: row.entry },
          { value: row.songTitle },
          { value: number(row.currentViews), numeric: true },
        ])).join('') : renderEmptyRow(5)}
      </tbody>
    </table>
  `;
}

function renderSimpleRanking(id, rows, limit = 10) {
  const element = document.getElementById(id);
  if (!element) return;
  const safeRows = rowsOrEmpty(rows).slice(0, limit);
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Entry</th><th>Views</th></tr></thead>
      <tbody>
        ${safeRows.length ? safeRows.map((row) => rowHtml([
          { value: row.rank },
          { value: row.entry },
          { value: number(row.currentViews), numeric: true },
        ])).join('') : renderEmptyRow(3)}
      </tbody>
    </table>
  `;
}

function renderLokalTable(id, rows, limit = 20) {
  const element = document.getElementById(id);
  if (!element) return;
  const safeRows = rowsOrEmpty(rows).slice(0, limit);
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Lokal</th><th>Comments</th></tr></thead>
      <tbody>
        ${safeRows.length ? safeRows.map((row) => rowHtml([
          { value: row.rank },
          { value: row.lokal },
          { value: number(row.matchedComments), numeric: true },
        ])).join('') : renderEmptyRow(3)}
      </tbody>
    </table>
  `;
}

function renderMonitoringTable(id, rows, limit = 18) {
  const element = document.getElementById(id);
  if (!element) return;
  const safeRows = rowsOrEmpty(rows).slice(0, limit);
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Name / Username</th><th>Comments</th><th>Latest</th></tr></thead>
      <tbody>
        ${safeRows.length ? safeRows.map((row) => rowHtml([
          { value: row.rank },
          { value: row.name ? `${row.name} - ${row.username}` : row.username },
          { value: number(row.totalComments), numeric: true },
          { value: row.latestCommentTime || '' },
        ])).join('') : renderEmptyRow(4)}
      </tbody>
    </table>
  `;
}

function renderKapisanan(rows) {
  const safeRows = rowsOrEmpty(rows);
  const total = safeRows.find((row) => row.keyword === 'Total Comments')?.matchedComments
    || safeRows.reduce((sum, row) => sum + (Number(row.matchedComments) || 0), 0);
  text('kapisanan-total', `${number(total)} total`);
  const max = Math.max(...safeRows.filter((row) => row.keyword !== 'Total Comments').map((row) => Number(row.matchedComments) || 0), 1);
  const element = document.getElementById('kapisanan-bars');
  if (!element) return;
  element.innerHTML = safeRows
    .filter((row) => row.keyword !== 'Total Comments')
    .map((row) => `
      <div class="bar-row">
        <div class="bar-label"><span>${escapeHtml(row.keyword)}</span><span>${number(row.matchedComments)}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (row.matchedComments / max) * 100)}%"></div></div>
      </div>
    `).join('');
}

function renderComments(rows) {
  const element = document.getElementById('latest-comments');
  if (!element) return;
  const safeRows = rowsOrEmpty(rows);
  element.innerHTML = safeRows.length ? safeRows.map((row) => `
    <article class="comment">
      <div class="comment-meta">
        <span>${escapeHtml(row.commenterName)}</span>
        <span>${escapeHtml(row.commentTime)}</span>
      </div>
      <p>${escapeHtml(row.commentText)}</p>
    </article>
  `).join('') : '<p class="empty-state">No recent comments available yet.</p>';
}

function renderDashboard(data) {
  const previousGeneratedAt = state.data?.generatedAt || '';
  state.data = data;
  const source = data.source || {};
  const overview = data.overview || {};
  const rankings = data.rankings || {};
  const benguet = overview.benguetEntry;
  const topLokal = overview.topLokal;

  text('total-comments', number(source.fullCommentRows));
  text('comments-fetched', source.fetchedAt || 'No fetch time');
  text('benguet-views', benguet ? number(benguet.currentViews) : '--');
  text('benguet-rank', benguet ? `Global rank #${benguet.rank}` : 'Global rank --');
  text('top-lokal', topLokal?.lokal || '--');
  text('top-lokal-count', topLokal ? `${number(topLokal.matchedComments)} comments` : '-- comments');
  const generated = compactTimestamp(data.generatedAt);
  text('generated-time', generated.time);
  text('generated-detail', generated.detail);
  if (state.refreshQueuedAt && data.generatedAt && data.generatedAt !== state.refreshStartedFrom) {
    clearRefreshQueue(`Refresh complete: ${data.generatedAt}`);
  } else if (!state.refreshQueuedAt) {
    text('refresh-status', `Updated ${data.generatedAt || 'pending'}`);
  } else if (previousGeneratedAt !== data.generatedAt) {
    text('refresh-status', `Refresh queued. Waiting for new data...`);
  }

  const thumb = document.getElementById('benguet-thumb');
  if (thumb && benguet?.thumbnailUrl) thumb.src = benguet.thumbnailUrl;
  text('benguet-title', benguet?.matchedVideoTitle || source.videoTitle || "God's Love | Benguet");
  text('benguet-meta', benguet ? `${number(benguet.currentViews)} views / Global rank #${benguet.rank}` : 'Current views unavailable');
  const link = document.getElementById('benguet-link');
  if (link) link.href = benguet?.youtubeUrl || source.videoUrl || '#';

  renderKapisanan(data.kapisanan || []);
  renderRankingCards('global-ranking', rankings.global || [], 12);
  renderRankingTable('philippines-ranking', rankings.philippines || [], 40);
  renderSimpleRanking('luzon-ranking', rankings.luzon || [], 12);
  renderSimpleRanking('visayas-ranking', rankings.visayas || [], 12);
  renderSimpleRanking('mindanao-ranking', rankings.mindanao || [], 12);
  renderSimpleRanking('abroad-ranking', rankings.abroad || [], 12);
  renderLokalTable('lokal-ranking', data.lokalSummary || [], 12);
  renderLokalTable('lokal-table', data.lokalSummary || [], 20);
  renderMonitoringTable('kdo-table', data.kdo || [], 24);
  renderMonitoringTable('compound-table', data.compoundMonitoring || [], 24);
  renderComments(data.latestComments || []);
}

async function loadDashboard() {
  try {
    const separator = DATA_URL.includes('?') ? '&' : '?';
    const response = await fetch(`${DATA_URL}${separator}v=${Date.now()}`, {
      cache: 'no-store',
      headers: { accept: 'application/vnd.github.raw+json' },
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    renderDashboard(await response.json());
  } catch (error) {
    text('refresh-status', `Data unavailable: ${error.message}`);
  }
}

function setRefreshButtonBusy(isBusy, label = 'Refresh Now') {
  const button = document.getElementById('refresh-now');
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = label;
}

function clearRefreshQueue(message) {
  state.refreshQueuedAt = 0;
  state.refreshStartedFrom = '';
  if (state.refreshPollTimer) {
    clearInterval(state.refreshPollTimer);
    state.refreshPollTimer = null;
  }
  setRefreshButtonBusy(false);
  text('refresh-status', message);
}

async function pollForRefreshResult() {
  if (!state.refreshQueuedAt) return;
  if (Date.now() - state.refreshQueuedAt > REFRESH_TIMEOUT_MS) {
    clearRefreshQueue('Refresh queued, but new data did not arrive yet. It may still be running in GitHub.');
    return;
  }
  await loadDashboard();
}

async function requestRefreshNow() {
  const codeKey = 'incmv-refresh-code';
  let refreshCode = localStorage.getItem(codeKey) || '';
  if (!refreshCode) {
    refreshCode = window.prompt('Enter the refresh code for this dashboard:') || '';
    refreshCode = refreshCode.trim();
    if (!refreshCode) return;
    localStorage.setItem(codeKey, refreshCode);
  }

  setRefreshButtonBusy(true, 'Queueing...');
  text('refresh-status', 'Queueing full dashboard refresh...');

  try {
    const response = await fetch(REFRESH_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-refresh-code': refreshCode,
      },
      body: JSON.stringify({
        generatedAt: state.data?.generatedAt || '',
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(codeKey);
    }
    if (!response.ok) {
      throw new Error(result.error || `${response.status} ${response.statusText}`);
    }

    state.refreshQueuedAt = Date.now();
    state.refreshStartedFrom = state.data?.generatedAt || '';
    setRefreshButtonBusy(true, 'Refresh Queued');
    text('refresh-status', 'Refresh queued. Waiting for GitHub to rebuild the data...');
    if (state.refreshPollTimer) clearInterval(state.refreshPollTimer);
    state.refreshPollTimer = setInterval(pollForRefreshResult, REFRESH_POLL_MS);
    setTimeout(pollForRefreshResult, 8000);
  } catch (error) {
    setRefreshButtonBusy(false);
    text('refresh-status', `Refresh unavailable: ${error.message}`);
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((panel) => panel.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(`tab-${button.dataset.tab}`)?.classList.add('active');
    });
  });
}

setupTabs();
document.getElementById('refresh-now')?.addEventListener('click', requestRefreshNow);
loadDashboard();
setInterval(loadDashboard, REFRESH_MS);
