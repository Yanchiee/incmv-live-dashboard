import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(__dirname, '..');
const dataDir = path.join(siteDir, 'data');
const outFile = path.join(dataDir, 'dashboard.json');

const BENGUET_VIDEO_ID = 'ROa3kbG5M0U';
const BENGUET_VIDEO_URL = `https://www.youtube.com/watch?v=${BENGUET_VIDEO_ID}`;
const MANILA_TIME_ZONE = 'Asia/Manila';

const playlists = [
  ['Luzon', 'Philippines', 'PLaOv-asq4ONHg8NbfCwEtvojEcUFmBm__', 70],
  ['Visayas', 'Philippines', 'PLaOv-asq4ONGe9Qc9erxAlqsR85JGkdtT', 10],
  ['Mindanao', 'Philippines', 'PLaOv-asq4ONFdLESaEmgV-mZpOA717pA0', 18],
  ['Abroad', 'Abroad', 'PLaOv-asq4ONGHUCg_S3mP9WGdipeQSS6m', 40],
];

let playerInnertubeConfig = null;

const kapisananKeywords = ['BUKLOD', 'KADIWA', 'BINHI', 'PNK'];

const kdoOfficers = [
  ['Yancy', '@Takoshenchie', ['@YibbyAI', '@YancyNacion', '@YancyNacion-n5u']],
  ['Jonie', '@jonieyonga-an5239'],
  ['Lui', '@maluisabustamante2873', ['@luibustamante9493']],
  ['Zky', '@kurtzkylaruan1665', ['@Its_Handsome_Kurtzky5442']],
  ['Elle', '@ellec01914'],
  ['Kim', 'kimberlysarmiento1034'],
  ['Gwyneth', 'gwynethcayabyab5981'],
  ['Rhyndylyn', 'almazanrhyndylyn'],
  ['Febei', '@kristine7303'],
  ['Henry', '@henrycaranto2644'],
  ['Juls', '@Julskie28'],
  ['Jas', '@jasminedaludado7262'],
  ['Gelo', '@gelo4828'],
  ['Anle', '@johnreylucio8970'],
  ['Meryll', '@meryllsagampod7982'],
  ['Wink', '@winkdelarosa2397'],
  ['Ysay', '@yzabelgayadan6013'],
  ['Jazy', '@jazerashleypacardo8593', ['@MugglesOut0506', '@MugglesOut', '@KaJaz-r3n']],
  ['Rejomar', '@RejomarTayaban'],
  ['Yayi', '@AllenAndreiBelen'],
];

const districtOfficers = [
  '@annyeongaseo9936',
  '@akolangtoguyzz1016',
  '@Nezuko-chan-o7j',
  '@matthewspianocover3910',
  '@MrMusic819',
  '@EleanorMislang',
  '@legocrafter7048',
  '@@meangarlitos2606',
  '@AlmaPuno-x5w',
  '@ImeldaBañaga-o5z',
  '@rovellnogoy4494',
  '@luningningpescoso4921',
];

const compoundMonitoring = [
  '@josiepiad8710',
  '@nhil3650',
  '@annyeongaseo9936',
  '@akolangtoguyzz1016',
  '@Nezuko-chan-o7j',
  '@matthewspianocover3910',
  '@MrMusic819',
  '@EleanorMislang',
  '@legocrafter7048',
  '@@meangarlitos2606',
  '@AlmaPuno-x5w',
  '@ImeldaBañaga-o5z',
  '@rovellnogoy4494',
  '@luningningpescoso4921',
  '@blairgatulla6335',
  '@MaryannGarlitos',
  '@PamangelaGarlitos',
  '@alonamaynogoy3411',
  '@ramiltoledo8063',
  '@NorbertoMislang-k1f',
];

const lokals = [
  'Baguio City',
  'La Trinidad',
  'Irisan',
  'Gibraltar',
  'Balatoc',
  'Atok Gold',
  'Quezon Hill',
  'Aurora Hill',
  'Hillside',
  'Guisad',
  'Camp 7',
  'Megaroyale Village',
  'City Camp',
  'Norcar',
  'Kias',
  'Camp 6',
  'Loakan Airport',
  'Marcos Highway',
  'Mirador Hills',
  'Penged',
  'Tuba',
  'Tomay',
  'Loacan',
  'San Luis',
  'Kapangan',
  'Pinsao',
  'Buyagan',
  'Greenwater',
  'Ambiong',
  'San Carlos Heights',
  'Sayatan',
  'Sablan',
  'Taloy Sur',
  'Binanga',
  'Bangho',
  'Camp 8',
  'Lourdes',
  'Philex',
  'Tadiangan',
  'Balakbak',
  'Lacaan',
  'Posos',
  'Tublay',
  'Basca',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function manilaDateTime(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: MANILA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  }).format(date);
}

function fetchedAtText(date = new Date()) {
  return `Fetched ${manilaDateTime(date)}`;
}

function updatedAtText(date = new Date()) {
  return `Updated ${manilaDateTime(date)}`;
}

function normalizeWhitespace(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function textRun(value) {
  return value?.simpleText || value?.runs?.map((run) => run.text || '').join('') || '';
}

function walk(value, visitor) {
  if (!value || typeof value !== 'object') return;
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visitor);
  } else {
    for (const item of Object.values(value)) walk(item, visitor);
  }
}

function parseJsonObjectAt(html, objectStart) {
  if (objectStart < 0 || html[objectStart] !== '{') return null;
  let i = objectStart;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (; i < html.length; i += 1) {
    const ch = html[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') {
      inString = true;
    } else if (ch === '{') {
      depth += 1;
    } else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return JSON.parse(html.slice(objectStart, i + 1));
    }
  }
  return null;
}

function parseEmbeddedJson(html, marker) {
  const start = html.indexOf(marker);
  if (start === -1) return null;
  return parseJsonObjectAt(html, start + marker.length);
}

function parseYtcfg(html) {
  const marker = 'ytcfg.set(';
  let offset = 0;
  while (offset < html.length) {
    const start = html.indexOf(marker, offset);
    if (start === -1) return null;
    let objectStart = start + marker.length;
    while (/\s/.test(html[objectStart] || '')) objectStart += 1;
    if (html[objectStart] === '{') return parseJsonObjectAt(html, objectStart);
    offset = start + marker.length;
  }
  return null;
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(options.timeout || 25000),
    headers: {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

function innertubeConfig(html) {
  const ytcfg = parseYtcfg(html);
  return {
    key: ytcfg?.INNERTUBE_API_KEY || html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1],
    context: ytcfg?.INNERTUBE_CONTEXT || {
      client: {
        clientName: 'WEB',
        clientVersion: html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1] || '2.20260508.01.00',
      },
    },
  };
}

function collectCommentPayloads(json) {
  const payloads = [];
  walk(json, (node) => {
    if (node.commentEntityPayload) payloads.push(node.commentEntityPayload);
  });
  return payloads;
}

function collectContinuationTokens(json) {
  const tokens = [];
  walk(json, (node) => {
    const token =
      node.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ||
      node.continuationCommand?.token;
    if (token) tokens.push(token);
  });
  return tokens;
}

function collectCommentContinuationTokens(json) {
  const tokens = [];
  walk(json, (node) => {
    const token = node.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (token) tokens.push(token);
  });
  return tokens;
}

function findInitialCommentTokens(initialData) {
  const tokens = [];
  walk(initialData, (node) => {
    const renderer = node.itemSectionRenderer;
    const hasCommentsHeader = Boolean(renderer?.header?.commentsHeaderRenderer);
    const token = renderer?.contents?.[0]?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
    if (hasCommentsHeader && token) tokens.push({ label: 'Initial comments stream', token });

    for (const item of node.sortFilterSubMenuRenderer?.subMenuItems || []) {
      const sortToken = item.serviceEndpoint?.continuationCommand?.token;
      if (sortToken) tokens.push({ label: `Sort: ${item.title}`, token: sortToken });
    }
  });
  if (!tokens.length) throw new Error('Could not find comment continuation tokens');
  return tokens;
}

function findVideoTitle(initialData) {
  let title = '';
  walk(initialData, (node) => {
    if (!title && node.videoPrimaryInfoRenderer?.title?.runs) {
      title = textRun(node.videoPrimaryInfoRenderer.title);
    }
  });
  return title || "God's Love | Benguet | INCMV AWARDS 2026";
}

async function postInnertube(pathName, config, body) {
  if (!config.key) throw new Error('Missing YouTube Innertube key');
  const response = await fetch(`https://www.youtube.com/youtubei/v1/${pathName}?key=${config.key}`, {
    method: 'POST',
    signal: AbortSignal.timeout(25000),
    headers: {
      'content-type': 'application/json',
      'user-agent': 'Mozilla/5.0',
      'x-youtube-client-name': '1',
      'x-youtube-client-version': config.context?.client?.clientVersion || '',
    },
    body: JSON.stringify({ context: config.context, ...body }),
  });
  if (!response.ok) throw new Error(`YouTube ${pathName} request failed: ${response.status} ${response.statusText}`);
  return response.json();
}

function normalizeComment(payload, sequence, sourceStream, fetchedAt) {
  const properties = payload.properties || {};
  const author = payload.author || {};
  return {
    sequence,
    sourceStream,
    commentId: properties.commentId || '',
    commenterName: author.displayName || properties.authorButtonA11y || '',
    commenterHandle: properties.authorButtonA11y || author.displayName || '',
    commentTimeShown: properties.publishedTime || '',
    commentText: properties.content?.content || '',
    channelId: author.channelId || '',
    commentUrl: properties.commentId ? `${BENGUET_VIDEO_URL}&lc=${properties.commentId}` : '',
    fetchedAt,
  };
}

async function fetchBenguetComments() {
  const fetchedAtIso = new Date().toISOString();
  const html = await fetchText(`${BENGUET_VIDEO_URL}&hl=en`);
  const config = innertubeConfig(html);
  const initialData = parseEmbeddedJson(html, 'var ytInitialData = ');
  if (!initialData) throw new Error('Could not parse YouTube initial data for comments');
  const seedTokens = findInitialCommentTokens(initialData);
  const videoTitle = findVideoTitle(initialData);
  const queue = seedTokens.map(({ label, token }) => ({ token, sourceStream: label }));
  const seenTokens = new Set();
  const seenCommentIds = new Set();
  const comments = [];
  let requests = 0;

  while (queue.length) {
    const { token, sourceStream } = queue.shift();
    if (!token || seenTokens.has(token)) continue;
    seenTokens.add(token);
    requests += 1;

    const json = await postInnertube('next', config, { continuation: token });
    for (const payload of collectCommentPayloads(json)) {
      const id = payload.properties?.commentId || `${comments.length + 1}`;
      if (seenCommentIds.has(id)) continue;
      seenCommentIds.add(id);
      comments.push(normalizeComment(payload, comments.length + 1, sourceStream, fetchedAtIso));
    }

    for (const nextToken of collectCommentContinuationTokens(json)) {
      if (!seenTokens.has(nextToken)) queue.push({ token: nextToken, sourceStream });
    }

    if (requests % 50 === 0) console.log(`comments requests=${requests} comments=${comments.length} queue=${queue.length}`);
    await sleep(60);
  }

  return {
    metadata: {
      videoTitle,
      videoUrl: BENGUET_VIDEO_URL,
      fetchedAt: fetchedAtIso,
      requestCount: requests,
      uniqueComments: comments.length,
      seedStreams: seedTokens.map(({ label }) => label),
    },
    comments,
  };
}

function parseViews(text) {
  const raw = String(text || '').replace(/,/g, '').toLowerCase();
  const match = raw.match(/([\d.]+)\s*([kmb])?\s*views?/i);
  if (!match) return 0;
  const amount = Number(match[1]);
  const multiplier = { k: 1000, m: 1000000, b: 1000000000 }[match[2]] || 1;
  return Math.round(amount * multiplier);
}

function parseVideoTitle(title) {
  const parts = normalizeWhitespace(title).split('|').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 3) {
    return {
      songTitle: parts.slice(0, -2).join(' | '),
      entry: parts.at(-2),
    };
  }
  return { songTitle: normalizeWhitespace(title), entry: '' };
}

function extractPlaylistVideos(data, region, group, playlistId, seen) {
  const videos = [];
  const continuations = [];
  walk(data, (node) => {
    if (node.playlistVideoRenderer?.videoId) {
      const renderer = node.playlistVideoRenderer;
      const title = normalizeWhitespace(textRun(renderer.title));
      if (!title) return;
      const { songTitle, entry } = parseVideoTitle(title);
      const videoInfo = textRun(renderer.videoInfo);
      const published = videoInfo.split('•').map((part) => part.trim()).at(-1) || '';
      const videoId = renderer.videoId;
      if (!seen.has(videoId)) {
        seen.add(videoId);
        videos.push({
          videoId,
          region,
          group,
          playlistId,
          entry,
          songTitle,
          title,
          views: parseViews(videoInfo),
          viewsExact: false,
          viewCountSource: 'playlist rounded text',
          published,
          fetchedFrom: `${region} playlist`,
        });
      }
    }
    if (node.continuationCommand?.token) continuations.push(node.continuationCommand.token);
  });
  return { videos, continuations };
}

async function collectPlaylistOnce(region, group, playlistId) {
  const html = await fetchText(`https://www.youtube.com/playlist?list=${playlistId}`);
  const config = innertubeConfig(html);
  if (!playerInnertubeConfig?.key && config.key) playerInnertubeConfig = config;
  const data = parseEmbeddedJson(html, 'var ytInitialData = ');
  if (!data) throw new Error(`Could not parse playlist data for ${region}`);
  const seen = new Set();
  const all = [];
  const initial = extractPlaylistVideos(data, region, group, playlistId, seen);
  all.push(...initial.videos);
  const queue = [...new Set(initial.continuations)];
  const usedTokens = new Set();
  while (queue.length) {
    const token = queue.shift();
    if (!token || usedTokens.has(token)) continue;
    usedTokens.add(token);
    try {
      const nextData = await postInnertube('browse', config, { continuation: token });
      const next = extractPlaylistVideos(nextData, region, group, playlistId, seen);
      all.push(...next.videos);
      for (const nextToken of next.continuations) {
        if (!usedTokens.has(nextToken)) queue.push(nextToken);
      }
    } catch (error) {
      console.error(`${region} continuation skipped: ${error.message}`);
    }
  }
  return all;
}

async function collectPlaylist(region, group, playlistId, minimumCount) {
  let last = [];
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    last = await collectPlaylistOnce(region, group, playlistId);
    if (last.length >= minimumCount) return last;
    console.error(`${region}: only ${last.length} playlist videos on attempt ${attempt}; retrying`);
    await sleep(1500 * attempt);
  }
  if (last.length < minimumCount) {
    throw new Error(`${region} playlist returned ${last.length} videos; expected at least ${minimumCount}`);
  }
  return last;
}

async function hydrateVideoFromPlayer(video) {
  if (!playerInnertubeConfig?.key) throw new Error('Missing YouTube player config');
  const json = await postInnertube('player', playerInnertubeConfig, { videoId: video.videoId });
  const exactViews = Number(json.videoDetails?.viewCount);
  if (Number.isFinite(exactViews) && exactViews > 0) {
    video.views = exactViews;
    video.viewsExact = true;
    video.viewCountSource = 'youtube player exact viewCount';
  }
  const publishDate = json.microformat?.playerMicroformatRenderer?.publishDate;
  if (publishDate) video.published = publishDate;
}

async function hydrateVideo(video) {
  try {
    await hydrateVideoFromPlayer(video);
    return;
  } catch (error) {
    video.notes = `player exact view fetch failed: ${error.message}`;
  }

  try {
    const html = await fetchText(`https://www.youtube.com/watch?v=${video.videoId}`);
    const viewMatch =
      html.match(/"viewCount":"(\d+)"/) ||
      html.match(/"view_count":(\d+)/) ||
      html.match(/"views":\{"simpleText":"([^"]+)"/);
    if (viewMatch) {
      const rawViews = viewMatch[1];
      video.views = /^\d+$/.test(rawViews) ? Number(rawViews) : parseViews(rawViews);
      if (/^\d[\d,]*\s*(views?)?$/i.test(rawViews.trim())) {
        video.viewsExact = true;
        video.viewCountSource = 'watch page exact viewCount';
      }
    }
    const dateMatch = html.match(/"publishDate":"([^"]+)"/) || html.match(/"datePublished":"([^"]+)"/);
    if (dateMatch) video.published = dateMatch[1];
  } catch (error) {
    video.notes = `${video.notes}; watch page view fetch failed: ${error.message}`;
  }
}

function previousExactViewMap(previousPayload) {
  const rows = Object.values(previousPayload?.rankings || {}).flat();
  return new Map(
    rows
      .filter((row) => {
        if (!row?.youtubeUrl || !row.currentViews) return false;
        if (row.viewCountExact === true) return true;
        if (!row.viewCountSource) return true;
        return row.viewCountSource !== 'playlist rounded text';
      })
      .map((row) => [row.youtubeUrl.split('v=').at(-1)?.split('&')[0], row]),
  );
}

function preservePreviousExactViews(videos, previousPayload) {
  const previousByVideoId = previousExactViewMap(previousPayload);
  for (const video of videos) {
    if (video.viewsExact) continue;
    const previous = previousByVideoId.get(video.videoId);
    if (!previous?.currentViews) continue;
    video.views = previous.currentViews;
    video.viewsExact = true;
    video.viewCountSource = 'previous exact viewCount retained';
  }
}

async function hydrateAllVideos(videos, concurrency = 8) {
  let index = 0;
  async function worker() {
    while (index < videos.length) {
      const video = videos[index];
      index += 1;
      await hydrateVideo(video);
      await sleep(60);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

function ranked(videos) {
  return [...videos].sort((a, b) => {
    const countDiff = (Number(b.views) || 0) - (Number(a.views) || 0);
    if (countDiff !== 0) return countDiff;
    return (a.entry || a.title).localeCompare(b.entry || b.title, 'en', { sensitivity: 'base' });
  });
}

function thumbnailFromVideoId(videoId) {
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';
}

function rankingRows(videos, limit = 150) {
  return ranked(videos).slice(0, limit).map((video, index) => ({
    rank: index + 1,
    region: video.region,
    entry: video.entry,
    songTitle: video.songTitle,
    currentViews: Number(video.views) || 0,
    published: video.published || '',
    matchedVideoTitle: video.title,
    youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    thumbnailUrl: thumbnailFromVideoId(video.videoId),
    fetchedAt: fetchedAtText(),
    viewCountExact: Boolean(video.viewsExact),
    viewCountSource: video.viewCountSource || 'unknown',
  }));
}

async function fetchIncmvRankings(previousPayload) {
  const allVideos = [];
  for (const [region, group, playlistId, minimumCount] of playlists) {
    const entries = await collectPlaylist(region, group, playlistId, minimumCount);
    console.log(`${region}: ${entries.length} playlist videos`);
    allVideos.push(...entries);
  }
  await hydrateAllVideos(allVideos);
  preservePreviousExactViews(allVideos, previousPayload);
  return {
    global: rankingRows(allVideos),
    philippines: rankingRows(allVideos.filter((video) => video.group === 'Philippines')),
    luzon: rankingRows(allVideos.filter((video) => video.region === 'Luzon')),
    visayas: rankingRows(allVideos.filter((video) => video.region === 'Visayas')),
    mindanao: rankingRows(allVideos.filter((video) => video.region === 'Mindanao')),
    abroad: rankingRows(allVideos.filter((video) => video.region === 'Abroad')),
  };
}

async function readPreviousPayload() {
  try {
    return JSON.parse(await fs.readFile(outFile, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeHandle(value) {
  return String(value || '').trim().replace(/^@+/, '').toLowerCase();
}

function commentHandles(comment) {
  return new Set([normalizeHandle(comment.commenterName), normalizeHandle(comment.commenterHandle)]);
}

function commentMatchesHandle(comment, handle) {
  return commentHandles(comment).has(normalizeHandle(handle));
}

function commentMatchesKeywords(comment, keywords) {
  const haystack = `${comment.commenterName || ''}\n${comment.commenterHandle || ''}\n${comment.commentText || ''}`.toLowerCase();
  return keywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

function commentAgeMs(comment) {
  const raw = String(comment.commentTimeShown || '').toLowerCase().replace(/\(edited\)/g, '').trim();
  if (!raw || raw === 'now' || raw === 'just now') return 0;
  const match = raw.match(/(\d+(?:\.\d+)?)\s*(second|minute|hour|day|week|month|year)s?\s*ago/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  };
  return amount * multipliers[unit];
}

function newestFirst(comments) {
  return [...comments].sort((a, b) => {
    const ageDiff = commentAgeMs(a) - commentAgeMs(b);
    if (ageDiff !== 0) return ageDiff;
    return (a.sequence || 0) - (b.sequence || 0);
  });
}

function findBenguetEntry(globalRows) {
  return globalRows.find((row) => row.entry.toLowerCase() === 'benguet') || null;
}

function buildLokalSummary(comments) {
  return lokals
    .map((lokal) => ({
      lokal,
      matchedComments: comments.filter((comment) => commentMatchesKeywords(comment, [lokal]).length > 0).length,
      updatedAt: fetchedAtText(new Date(comments[0]?.fetchedAt || Date.now())),
    }))
    .sort((a, b) => {
      const countDiff = b.matchedComments - a.matchedComments;
      if (countDiff !== 0) return countDiff;
      return a.lokal.localeCompare(b.lokal, 'en', { sensitivity: 'base' });
    })
    .map((row, index) => ({ rank: index + 1, ...row }));
}

function buildKapisanan(comments) {
  const fetchedAt = fetchedAtText(new Date(comments[0]?.fetchedAt || Date.now()));
  return kapisananKeywords.map((keyword) => ({
    keyword,
    matchedComments: comments.filter((comment) => commentMatchesKeywords(comment, [keyword]).length > 0).length,
    updatedAt: fetchedAt,
  }));
}

function buildMonitoring(comments, people, limit = 30) {
  return people
    .map(([name, username, aliases = []]) => {
      const handles = [username, ...aliases];
      const matched = newestFirst(comments.filter((comment) => handles.some((handle) => commentMatchesHandle(comment, handle))));
      return {
        name,
        username: handles.join(', '),
        totalComments: matched.length,
        latestCommentTime: matched[0]?.commentTimeShown || '',
        fetchedAt: matched[0] ? fetchedAtText(new Date(matched[0].fetchedAt)) : '',
      };
    })
    .sort((a, b) => {
      const countDiff = b.totalComments - a.totalComments;
      if (countDiff !== 0) return countDiff;
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
    })
    .slice(0, limit)
    .map((row, index) => ({ rank: index + 1, ...row }));
}

function buildSimpleMonitoring(comments, handles) {
  return handles.map((handle, index) => ({
    rank: index + 1,
    username: handle,
    totalComments: comments.filter((comment) => commentMatchesHandle(comment, handle)).length,
  }));
}

function buildLatestComments(comments, limit = 25) {
  return newestFirst(comments).slice(0, limit).map((comment, index) => ({
    number: index + 1,
    commenterName: comment.commenterName,
    commentTime: comment.commentTimeShown,
    commentText: comment.commentText,
    commentUrl: comment.commentUrl,
    fetchedAt: fetchedAtText(new Date(comment.fetchedAt)),
  }));
}

const generatedAt = manilaDateTime();
const previousPayload = await readPreviousPayload();
const [commentResult, rankings] = await Promise.all([
  fetchBenguetComments()
    .then((data) => ({ ok: true, data }))
    .catch((error) => ({ ok: false, error })),
  fetchIncmvRankings(previousPayload),
]);

let commentData = null;
let comments = [];
let source;
let lokalSummary;
let kapisanan;
let kdo;
let districtOfficerRows;
let compoundMonitoringRows;
let latestComments;
let topLokal;

if (commentResult.ok) {
  commentData = commentResult.data;
  comments = commentData.comments;
  const sourceFetchedAt = fetchedAtText(new Date(commentData.metadata.fetchedAt));
  lokalSummary = buildLokalSummary(comments);
  kapisanan = buildKapisanan(comments);
  kdo = buildMonitoring(comments, kdoOfficers, 24);
  districtOfficerRows = buildSimpleMonitoring(comments, districtOfficers);
  compoundMonitoringRows = buildSimpleMonitoring(comments, compoundMonitoring);
  latestComments = buildLatestComments(comments);
  topLokal = lokalSummary[0] || null;
  source = {
    videoTitle: commentData.metadata.videoTitle,
    videoUrl: commentData.metadata.videoUrl,
    fetchedAt: sourceFetchedAt,
    workbookUpdatedAt: updatedAtText(),
    fullCommentRows: commentData.metadata.uniqueComments,
    kapisananRows: kapisanan.reduce((total, row) => total + row.matchedComments, 0),
    lokalTabs: lokals.length,
    refreshStatus: 'fresh',
  };
} else {
  if (!previousPayload) throw commentResult.error;
  console.error(`Comment refresh failed; reusing previous comment metrics: ${commentResult.error.message}`);
  source = {
    ...(previousPayload.source || {}),
    workbookUpdatedAt: updatedAtText(),
    refreshStatus: `comments reused after YouTube rate limit: ${commentResult.error.message}`,
  };
  lokalSummary = previousPayload.lokalSummary || [];
  kapisanan = previousPayload.kapisanan || [];
  kdo = previousPayload.kdo || [];
  districtOfficerRows = previousPayload.districtOfficers || [];
  compoundMonitoringRows = previousPayload.compoundMonitoring || [];
  latestComments = previousPayload.latestComments || [];
  topLokal = previousPayload.overview?.topLokal || lokalSummary[0] || null;
}

const payload = {
  generatedAt,
  source,
  overview: {
    benguetEntry: findBenguetEntry(rankings.global),
    topGlobal: rankings.global[0] || null,
    topPhilippines: rankings.philippines[0] || null,
    topLokal,
  },
  rankings,
  lokalSummary,
  kapisanan,
  kdo,
  districtOfficers: districtOfficerRows,
  compoundMonitoring: compoundMonitoringRows,
  latestComments,
};

await fs.mkdir(dataDir, { recursive: true });
await fs.writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`);

console.log(`Wrote ${outFile}`);
console.log(
  JSON.stringify(
    {
      generatedAt: payload.generatedAt,
      comments: payload.source.fullCommentRows,
      kapisananRows: payload.source.kapisananRows,
      benguetViews: payload.overview.benguetEntry?.currentViews || 0,
      rankingCounts: Object.fromEntries(Object.entries(payload.rankings).map(([key, rows]) => [key, rows.length])),
    },
    null,
    2,
  ),
);
