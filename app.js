const DATA_URL = './data/dashboard.json';
const REFRESH_MS = 60 * 1000;

const state = {
  data: null,
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

function renderRankingCards(id, rows, limit = 10) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = rows.slice(0, limit).map((row) => `
    <article class="ranking-card">
      <div class="rank">#${row.rank}</div>
      <img src="${escapeHtml(row.thumbnailUrl)}" alt="${escapeHtml(row.entry)} thumbnail" loading="lazy">
      <div>
        <p class="entry-title">${escapeHtml(row.entry)}</p>
        <p class="entry-subtitle">${escapeHtml(row.region)} / ${escapeHtml(row.songTitle)}</p>
      </div>
      <div class="views">${number(row.currentViews)} views</div>
    </article>
  `).join('');
}

function renderRankingTable(id, rows, limit = 20) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Region</th><th>Entry</th><th>Song</th><th>Views</th></tr></thead>
      <tbody>
        ${rows.slice(0, limit).map((row) => rowHtml([
          { value: row.rank },
          { value: row.region },
          { value: row.entry },
          { value: row.songTitle },
          { value: number(row.currentViews), numeric: true },
        ])).join('')}
      </tbody>
    </table>
  `;
}

function renderSimpleRanking(id, rows, limit = 10) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Entry</th><th>Views</th></tr></thead>
      <tbody>
        ${rows.slice(0, limit).map((row) => rowHtml([
          { value: row.rank },
          { value: row.entry },
          { value: number(row.currentViews), numeric: true },
        ])).join('')}
      </tbody>
    </table>
  `;
}

function renderLokalTable(id, rows, limit = 20) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Lokal</th><th>Comments</th></tr></thead>
      <tbody>
        ${rows.slice(0, limit).map((row) => rowHtml([
          { value: row.rank },
          { value: row.lokal },
          { value: number(row.matchedComments), numeric: true },
        ])).join('')}
      </tbody>
    </table>
  `;
}

function renderMonitoringTable(id, rows, limit = 18) {
  const element = document.getElementById(id);
  if (!element) return;
  element.innerHTML = `
    <table>
      <thead><tr><th>Rank</th><th>Name / Username</th><th>Comments</th><th>Latest</th></tr></thead>
      <tbody>
        ${rows.slice(0, limit).map((row) => rowHtml([
          { value: row.rank },
          { value: row.name ? `${row.name} - ${row.username}` : row.username },
          { value: number(row.totalComments), numeric: true },
          { value: row.latestCommentTime || '' },
        ])).join('')}
      </tbody>
    </table>
  `;
}

function renderKapisanan(rows) {
  const total = rows.find((row) => row.keyword === 'Total Comments')?.matchedComments
    || rows.reduce((sum, row) => sum + row.matchedComments, 0);
  text('kapisanan-total', `${number(total)} total`);
  const max = Math.max(...rows.filter((row) => row.keyword !== 'Total Comments').map((row) => row.matchedComments), 1);
  const element = document.getElementById('kapisanan-bars');
  element.innerHTML = rows
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
  element.innerHTML = rows.map((row) => `
    <article class="comment">
      <div class="comment-meta">
        <span>${escapeHtml(row.commenterName)}</span>
        <span>${escapeHtml(row.commentTime)}</span>
      </div>
      <p>${escapeHtml(row.commentText)}</p>
    </article>
  `).join('');
}

function renderDashboard(data) {
  state.data = data;
  const benguet = data.overview.benguetEntry;
  const topLokal = data.overview.topLokal;

  text('total-comments', number(data.source.fullCommentRows));
  text('comments-fetched', data.source.fetchedAt || 'No fetch time');
  text('benguet-views', benguet ? number(benguet.currentViews) : '--');
  text('benguet-rank', benguet ? `Global rank #${benguet.rank}` : 'Global rank --');
  text('top-lokal', topLokal?.lokal || '--');
  text('top-lokal-count', topLokal ? `${number(topLokal.matchedComments)} comments` : '-- comments');
  const generated = compactTimestamp(data.generatedAt);
  text('generated-time', generated.time);
  text('generated-detail', generated.detail);
  text('refresh-status', `Updated ${data.generatedAt}`);

  const thumb = document.getElementById('benguet-thumb');
  if (thumb && benguet?.thumbnailUrl) thumb.src = benguet.thumbnailUrl;
  text('benguet-title', benguet?.matchedVideoTitle || data.source.videoTitle || "God's Love | Benguet");
  text('benguet-meta', benguet ? `${number(benguet.currentViews)} views / Global rank #${benguet.rank}` : 'Current views unavailable');
  const link = document.getElementById('benguet-link');
  if (link) link.href = benguet?.youtubeUrl || data.source.videoUrl || '#';

  renderKapisanan(data.kapisanan || []);
  renderRankingCards('global-ranking', data.rankings.global || [], 12);
  renderRankingTable('philippines-ranking', data.rankings.philippines || [], 40);
  renderSimpleRanking('luzon-ranking', data.rankings.luzon || [], 12);
  renderSimpleRanking('visayas-ranking', data.rankings.visayas || [], 12);
  renderSimpleRanking('mindanao-ranking', data.rankings.mindanao || [], 12);
  renderSimpleRanking('abroad-ranking', data.rankings.abroad || [], 12);
  renderLokalTable('lokal-ranking', data.lokalSummary || [], 12);
  renderLokalTable('lokal-table', data.lokalSummary || [], 20);
  renderMonitoringTable('kdo-table', data.kdo || [], 24);
  renderMonitoringTable('compound-table', data.compoundMonitoring || [], 24);
  renderComments(data.latestComments || []);
}

async function loadDashboard() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    renderDashboard(await response.json());
  } catch (error) {
    text('refresh-status', `Data unavailable: ${error.message}`);
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
loadDashboard();
setInterval(loadDashboard, REFRESH_MS);
