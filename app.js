const DATA_URL = './api/dashboard-data';
const REFRESH_API_URL = './api/refresh';
const REFRESH_STATUS_API_URL = './api/refresh-status';
const REFRESH_MS = 60 * 1000;
const REFRESH_POLL_MS = 30 * 1000;
const REFRESH_TIMEOUT_MS = 18 * 60 * 1000;
const REFRESH_PROGRESS_MS = 7000;

const state = {
  data: null,
  refreshQueuedAt: 0,
  refreshStartedFrom: '',
  refreshPollTimer: null,
  refreshProgressTimer: null,
  refreshRunStatus: '',
};

const formatNumber = new Intl.NumberFormat('en-US');

function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setRefreshMessage(status, detail = '') {
  text('refresh-status', status);
  text('refresh-detail', detail || 'Browser checks every minute');
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
    const statusNote = source.refreshStatus && source.refreshStatus !== 'fresh' ? ` (${source.refreshStatus})` : '';
    clearRefreshQueue(`Refresh complete: ${data.generatedAt}${statusNote}`, 'Latest dashboard data has loaded on this page.');
  } else if (!state.refreshQueuedAt) {
    const statusNote = source.refreshStatus && source.refreshStatus !== 'fresh' ? ` (${source.refreshStatus})` : '';
    setRefreshMessage(`Updated ${data.generatedAt || 'pending'}${statusNote}`, 'Browser checks every minute for newer data.');
  } else if (previousGeneratedAt !== data.generatedAt) {
    setRefreshMessage('Refresh queued. Waiting for new data...', currentRefreshDetail());
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
    setRefreshMessage(`Data unavailable: ${error.message}`, 'The page will try again on the next automatic check.');
  }
}

function setRefreshButtonBusy(isBusy, label = 'Refresh Now') {
  const button = document.getElementById('refresh-now');
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = label;
}

function clearRefreshQueue(message, detail = '') {
  state.refreshQueuedAt = 0;
  state.refreshStartedFrom = '';
  state.refreshRunStatus = '';
  if (state.refreshPollTimer) {
    clearInterval(state.refreshPollTimer);
    state.refreshPollTimer = null;
  }
  if (state.refreshProgressTimer) {
    clearInterval(state.refreshProgressTimer);
    state.refreshProgressTimer = null;
  }
  setRefreshButtonBusy(false);
  setRefreshMessage(message, detail);
}

function currentRefreshDetail() {
  if (!state.refreshQueuedAt) return 'Browser checks every minute for newer data.';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.refreshQueuedAt) / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedLabel = elapsedMinutes > 0 ? `${elapsedMinutes} min ${elapsedSeconds % 60}s` : `${elapsedSeconds}s`;
  const reason = 'This can take a few minutes because GitHub starts a cloud job, YouTube pages and playlists are fetched, then the dashboard file is rebuilt.';
  if (state.refreshRunStatus === 'queued') return `Queued in GitHub Actions. ${reason}`;
  if (state.refreshRunStatus === 'in_progress') return `Running for ${elapsedLabel}. Fetching YouTube data and rebuilding the dashboard.`;
  if (state.refreshRunStatus === 'completed:success') return 'GitHub finished successfully. Loading the newest dashboard data now.';
  if (state.refreshRunStatus?.startsWith('completed:')) return 'GitHub finished but reported a problem. The previous dashboard data is still available.';
  if (elapsedSeconds < 20) return `Starting the cloud refresh. ${reason}`;
  if (elapsedSeconds < 90) return `Cloud job is starting. ${reason}`;
  if (elapsedSeconds < 240) return `Still running after ${elapsedLabel}. YouTube fetches are the slowest part.`;
  return `Still waiting after ${elapsedLabel}. Large playlist/comment fetches or YouTube rate limits can slow this down.`;
}

function updateRefreshProgress() {
  if (!state.refreshQueuedAt) return;
  setRefreshMessage('Refreshing live dashboard...', currentRefreshDetail());
}

async function loadRefreshRunStatus() {
  if (!state.refreshQueuedAt) return null;
  try {
    const response = await fetch(`${REFRESH_STATUS_API_URL}?v=${Date.now()}`);
    if (!response.ok) return null;
    const result = await response.json();
    const run = result.run;
    if (!run) return null;
    state.refreshRunStatus = `${run.status}${run.conclusion ? `:${run.conclusion}` : ''}`;
    return run;
  } catch {
    return null;
  }
}

async function pollForRefreshResult() {
  if (!state.refreshQueuedAt) return;
  if (Date.now() - state.refreshQueuedAt > REFRESH_TIMEOUT_MS) {
    clearRefreshQueue(
      'Refresh queued, but new data did not arrive yet.',
      'The GitHub job may still be running or YouTube may be rate-limiting the fetch. Try again in a few minutes.',
    );
    return;
  }
  const run = await loadRefreshRunStatus();
  updateRefreshProgress();
  await loadDashboard();
  if (run?.status === 'completed' && run.conclusion !== 'success' && state.refreshStartedFrom === state.data?.generatedAt) {
    clearRefreshQueue(
      'Refresh did not finish successfully.',
      'The previous dashboard data is still shown. GitHub or YouTube may have returned a temporary error.',
    );
  }
}

async function requestRefreshNow() {
  setRefreshButtonBusy(true, 'Queueing...');
  setRefreshMessage(
    'Queueing full dashboard refresh...',
    'Please wait a few minutes. GitHub will fetch YouTube comments, playlist views, and rebuild the dashboard data.',
  );

  try {
    const response = await fetch(REFRESH_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        generatedAt: state.data?.generatedAt || '',
      }),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || `${response.status} ${response.statusText}`);
    }

    state.refreshQueuedAt = Date.now();
    state.refreshStartedFrom = state.data?.generatedAt || '';
    state.refreshRunStatus = 'queued';
    setRefreshButtonBusy(true, 'Refreshing...');
    updateRefreshProgress();
    if (state.refreshPollTimer) clearInterval(state.refreshPollTimer);
    if (state.refreshProgressTimer) clearInterval(state.refreshProgressTimer);
    state.refreshPollTimer = setInterval(pollForRefreshResult, REFRESH_POLL_MS);
    state.refreshProgressTimer = setInterval(updateRefreshProgress, REFRESH_PROGRESS_MS);
    setTimeout(pollForRefreshResult, 8000);
  } catch (error) {
    setRefreshButtonBusy(false);
    setRefreshMessage(`Refresh unavailable: ${error.message}`, 'Please try again shortly.');
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
