const overviewSection = document.querySelector('#overview-section');
const bannerSection = document.querySelector('#banner-section');
const timelineSection = document.querySelector('#timeline-section');
const historySection = document.querySelector('#history-section');
const syncStatus = document.querySelector('#sync-status');
const timelineTooltip = document.querySelector('#timeline-tooltip');
const uploadInput = document.querySelector('#upload-input');
const uigfInput = document.querySelector('#uigf-input');
const uploadBtn = document.querySelector('#upload-btn');
const uigfBtn = document.querySelector('#uigf-btn');
const templateBtn = document.querySelector('#template-btn');
const exportBtn = document.querySelector('#export-btn');
const resetBtn = document.querySelector('#reset-btn');
const sampleBtn = document.querySelector('#sample-btn');
const currentFileLabel = document.querySelector('#current-file-label');
const dirtyIndicator = document.querySelector('#dirty-indicator');
const editDialog = document.querySelector('#edit-dialog');
const editForm = document.querySelector('#edit-form');
const editCancelBtn = document.querySelector('#edit-cancel');
const editCancelMobileBtn = document.querySelector('#edit-cancel-mobile');
const editDeleteBtn = document.querySelector('#edit-delete');
const totalPullsDialog = document.querySelector('#total-pulls-dialog');
const totalPullsForm = document.querySelector('#total-pulls-form');
const totalPullsCancelBtn = document.querySelector('#total-pulls-cancel');
const totalPullsCancelMobileBtn = document.querySelector('#total-pulls-cancel-mobile');
const totalPullsInput = document.querySelector('#total-pulls-input');
const totalPullsLabel = document.querySelector('#total-pulls-label');
const uigfReviewDialog = document.querySelector('#uigf-review-dialog');
const uigfReviewForm = document.querySelector('#uigf-review-form');
const uigfReviewContent = document.querySelector('#uigf-review-content');
const uigfReviewCancelBtn = document.querySelector('#uigf-review-cancel');
const uigfReviewCloseBtn = document.querySelector('#uigf-review-close');
const uigfReviewApplyBtn = document.querySelector('#uigf-review-apply');

const BANNERS = [
  { key: 'standard', label: '常驻池', subtitle: '常驻 / 奔行世间', gachaType: 200 },
  { key: 'limitedCharacter', label: '限定角色池', subtitle: '活动角色祈愿', gachaType: 301 },
  { key: 'limitedWeapon', label: '限定武器池', subtitle: '神铸赋形', gachaType: 302 },
];

const OFFSETS = {
  200: 581,
  301: 2574,
  302: 769,
};

const BANNER_KEY_BY_GACHA_TYPE = {
  200: 'standard',
  301: 'limitedCharacter',
  302: 'limitedWeapon',
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const AVERAGE_UP_DEFAULT_VISIBLE_POINTS = 10;
const AVERAGE_UP_MIN_VISIBLE_POINTS = 5;
const CHARACTER_AVERAGE_UP_EXPECTED_VALUE = 93.45;
const AVERAGE_UP_AXIS_PADDING = 20;
const AVERAGE_UP_RANGE_EPSILON = 0.000001;
const STORAGE_KEY = 'gachaHistory.uploadedData.v1';
const STORAGE_META_KEY = 'gachaHistory.uploadedDataMeta.v1';
const STORAGE_BASELINE_KEY = 'gachaHistory.baselineData.v1';
const STANDARD_CHARACTER_NAMES = new Set(['迪卢克', '琴', '七七', '刻晴', '莫娜', '提纳里', '迪希雅', '梦见月瑞希']);
const STANDARD_WEAPON_NAMES = new Set(['风鹰剑', '天空之刃', '狼的末路', '天空之傲', '和璞鸢', '天空之脊', '四风原典', '天空之卷', '阿莫斯之弓', '天空之翼']);

let storageAvailable = true;
let currentData = null;
let baselineData = null;
let currentFileName = '未加载';
let currentEditing = null;
let currentTotalPullsEditing = null;
let pendingUigfReview = null;
let pageSize = 10;
let currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
let isDirty = false;

function fmt(n) {
  return new Intl.NumberFormat('zh-CN').format(n ?? 0);
}

function pct(value) {
  return `${((value ?? 0) * 100).toFixed(2)}%`;
}

function formatExportDate(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function parseVersionGroup(group) {
  if (!group) return null;
  return String(group).split('.').map((part) => Number(part) || 0);
}

function compareVersionGroup(a, b) {
  const av = parseVersionGroup(a);
  const bv = parseVersionGroup(b);
  if (!av && !bv) return 0;
  if (!av) return 1;
  if (!bv) return -1;

  const length = Math.max(av.length, bv.length);
  for (let i = 0; i < length; i += 1) {
    const left = av[i] ?? 0;
    const right = bv[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
}

function makeStatCard(label, value, meta) {
  const tpl = document.querySelector('#stat-card-template');
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector('.stat-label').textContent = label;
  node.querySelector('.stat-value').textContent = value;
  node.querySelector('.stat-meta').textContent = meta;
  return node;
}

function getIntervals(history) {
  let prev = 0;
  return history.map((item) => {
    const gap = item.pullIndex - prev;
    prev = item.pullIndex;
    return gap;
  });
}

function getUpIntervals(history) {
  const upHistory = history.filter((item) => item.resultType === 'up');
  let prev = 0;
  return upHistory.map((item) => {
    const gap = item.pullIndex - prev;
    prev = item.pullIndex;
    return gap;
  });
}

function getResultRate(history, target) {
  if (!history.length) return null;
  const hit = history.filter((item) => item.resultType === target).length;
  return hit / history.length;
}

function getFiveStarRate(totalPulls, fiveStarCount) {
  if (!totalPulls) return 0;
  return fiveStarCount / totalPulls;
}

function createMetaBox(label, value) {
  const div = document.createElement('div');
  div.className = 'meta-box';
  div.innerHTML = `<div class="meta-box-label">${label}</div><div class="meta-box-value">${value}</div>`;
  return div;
}

function setSyncStatus(message, type = 'muted') {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.dataset.type = type;
}

function updateCurrentFileLabel() {
  if (!currentFileLabel) return;
  currentFileLabel.textContent = `当前数据：${currentFileName}`;
  syncActionButtonHighlight();
}

function updateDirtyIndicator() {
  if (!dirtyIndicator) return;
  dirtyIndicator.hidden = !isDirty;
}

function syncActionButtonHighlight() {
  const hasData = Boolean(currentData);
  uploadBtn?.classList.toggle('is-highlighted', !hasData);
  exportBtn?.classList.toggle('is-highlighted', hasData);
}

function setDirty(nextDirty) {
  isDirty = Boolean(nextDirty);
  updateDirtyIndicator();
}

function isStandardBanner(bannerKey) {
  return bannerKey === 'standard';
}

function isWeaponBanner(bannerKey) {
  return bannerKey === 'limitedWeapon';
}

function isLimitedBanner(bannerKey) {
  return bannerKey === 'limitedCharacter' || bannerKey === 'limitedWeapon';
}

function shouldShowCapturingRadiance(bannerKey) {
  return bannerKey === 'limitedCharacter';
}

function inferLimitedResultType(bannerKey, itemName, itemType) {
  if (bannerKey === 'standard') return 'off-banner';
  if (bannerKey === 'limitedCharacter') {
    return STANDARD_CHARACTER_NAMES.has(itemName) ? 'off-banner' : 'up';
  }
  if (bannerKey === 'limitedWeapon') {
    return STANDARD_WEAPON_NAMES.has(itemName) ? 'off-banner' : 'up';
  }
  if (itemType === '角色') return STANDARD_CHARACTER_NAMES.has(itemName) ? 'off-banner' : 'unknown';
  if (itemType === '武器') return STANDARD_WEAPON_NAMES.has(itemName) ? 'off-banner' : 'unknown';
  return 'unknown';
}

function getBadgeData(item, bannerKey) {
  if (!isLimitedBanner(bannerKey)) return [];

  const badges = [];
  if (item.resultType === 'off-banner') {
    badges.push({ text: '歪', type: 'off-banner' });
  }
  if (item.capturingRadiance === true) {
    badges.push({ text: '捕', type: 'capturing-radiance' });
  }
  return badges;
}

function renderNameWithBadges(item, bannerKey) {
  const badges = getBadgeData(item, bannerKey)
    .map((badge) => `<span class="name-badge name-badge-${badge.type}">${badge.text}</span>`)
    .join('');
  return `<div class="name-cell"><span>${item.itemName}</span>${badges}</div>`;
}

function normalizeBannerData(bannerKey, bannerData) {
  const totalPulls = Number(bannerData?.totalPulls ?? 0);
  const fiveStarHistory = Array.isArray(bannerData?.fiveStarHistory)
    ? bannerData.fiveStarHistory
        .map((item, index) => ({
          id: item?.id ?? `${bannerKey}-${item?.pullIndex ?? index + 1}-${index}`,
          pullIndex: Number(item?.pullIndex ?? 0),
          time: item?.time ?? null,
          itemName: item?.itemName ?? '未命名',
          itemType: item?.itemType ?? '角色',
          resultType: item?.resultType ?? (bannerKey === 'standard' ? 'off-banner' : 'unknown'),
          capturingRadiance: item?.capturingRadiance ?? null,
          pullVersion: item?.pullVersion
            ? {
                label: item.pullVersion.label ?? '',
                group: item.pullVersion.group ?? null,
              }
            : null,
          source: item?.source ?? 'manual',
        }))
        .sort((a, b) => a.pullIndex - b.pullIndex)
    : [];

  const fourStarPullIndices = {
    character: Array.isArray(bannerData?.fourStarPullIndices?.character)
      ? bannerData.fourStarPullIndices.character.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [],
    weapon: Array.isArray(bannerData?.fourStarPullIndices?.weapon)
      ? bannerData.fourStarPullIndices.weapon.map((value) => Number(value)).filter((value) => Number.isFinite(value))
      : [],
  };

  return {
    totalPulls,
    fiveStarHistory,
    fourStarPullIndices,
  };
}

function validateAndNormalizeData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('JSON 根节点必须是对象。');
  }

  if (Number(raw.schemaVersion) !== 4) {
    throw new Error('当前页面仅支持 schemaVersion: 4 的 JSON。');
  }

  if (!raw.wishData || typeof raw.wishData !== 'object') {
    throw new Error('缺少 wishData 对象。');
  }

  const normalizedWishData = {};

  BANNERS.forEach((banner) => {
    if (!raw.wishData[banner.key]) {
      throw new Error(`缺少池子数据：${banner.key}`);
    }
    normalizedWishData[banner.key] = normalizeBannerData(banner.key, raw.wishData[banner.key]);
  });

  return {
    schemaVersion: 4,
    wishData: normalizedWishData,
  };
}

function checkStorageAvailability() {
  try {
    const key = '__gacha_history_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

function persistCurrentData(meta = {}) {
  if (!currentData || !storageAvailable) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
  localStorage.setItem(STORAGE_META_KEY, JSON.stringify(meta));
}

function persistBaselineData() {
  if (!baselineData || !storageAvailable) return;
  localStorage.setItem(STORAGE_BASELINE_KEY, JSON.stringify(baselineData));
}

function clearPersistedData() {
  if (!storageAvailable) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_META_KEY);
  localStorage.removeItem(STORAGE_BASELINE_KEY);
}

function loadStoredData() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return validateAndNormalizeData(parsed);
  } catch (error) {
    clearPersistedData();
    throw error;
  }
}

function loadStoredBaselineData() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(STORAGE_BASELINE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return validateAndNormalizeData(parsed);
  } catch {
    return null;
  }
}

function loadStoredMeta() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(STORAGE_META_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSnapshot() {
  persistCurrentData({
    fileName: currentFileName,
    importedAt: new Date().toISOString(),
    isDirty,
  });
}

function markEdited() {
  setDirty(true);
  persistSnapshot();
}

function rerender() {
  if (!currentData) {
    renderEmptyState();
    return;
  }

  renderOverview(currentData);
  renderBannerCards(currentData);
  renderTimeline(currentData);
  renderHistory(currentData);
}

function renderOverview(data) {
  const standardPulls = data.wishData.standard.totalPulls;
  const limitedPulls = data.wishData.limitedCharacter.totalPulls + data.wishData.limitedWeapon.totalPulls;
  const limitedHistory = [
    ...data.wishData.limitedCharacter.fiveStarHistory,
    ...data.wishData.limitedWeapon.fiveStarHistory,
  ];
  const standardFiveStars = data.wishData.standard.fiveStarHistory.length + limitedHistory.filter((item) => item.resultType === 'off-banner').length;
  const limitedFiveStars = limitedHistory.filter((item) => item.resultType === 'up').length;

  const cards = document.createElement('div');
  cards.className = 'grid cards-4';
  cards.append(
    makeStatCard('常驻总抽数', fmt(standardPulls), ''),
    makeStatCard('限定总抽数', fmt(limitedPulls), ''),
    makeStatCard('非 UP 5★', fmt(standardFiveStars), ''),
    makeStatCard('UP 5★', fmt(limitedFiveStars), ''),
  );

  overviewSection.innerHTML = '';
  overviewSection.appendChild(cards);
}

function renderBannerCards(data) {
  bannerSection.innerHTML = `
    <div class="section-header">
      <h2>池子概览</h2>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'grid cards-3';

  BANNERS.forEach((banner) => {
    const tpl = document.querySelector('#banner-card-template');
    const node = tpl.content.firstElementChild.cloneNode(true);
    const bannerData = data.wishData[banner.key];
    const history = bannerData.fiveStarHistory || [];
    const allIntervals = getIntervals(history);
    const upIntervals = getUpIntervals(history);
    const avgGap = average(allIntervals);
    const avgUpGap = average(upIntervals);
    const upRate = banner.key === 'standard' ? null : getResultRate(history, 'up');
    const offRate = banner.key === 'standard' ? null : getResultRate(history, 'off-banner');
    const fiveStarRate = getFiveStarRate(bannerData.totalPulls, history.length);
    const latestNames = [...history]
      .sort((a, b) => b.pullIndex - a.pullIndex)
      .slice(0, 6)
      .map((item) => item.itemName)
      .join(' / ');
    const lastFiveStar = history.length ? history[history.length - 1].itemName : '暂无';

    node.querySelector('.banner-title').textContent = banner.label;
    node.querySelector('.banner-subtitle').textContent = banner.subtitle;
    node.querySelector('.banner-pill').textContent = `${fmt(history.length)} 次 5★`;

    const gridEl = node.querySelector('.banner-grid');
    gridEl.append(
      createMetaBox('总抽数', fmt(bannerData.totalPulls)),
      createMetaBox('当前垫抽', fmt(bannerData.totalPulls - (history.length ? history[history.length - 1].pullIndex : 0))),
      createMetaBox('5★ 出率', pct(fiveStarRate)),
      createMetaBox(
        banner.key === 'standard' ? '5★ 平均间隔' : 'UP 5★ 平均间隔',
        `${(banner.key === 'standard' ? avgGap : avgUpGap).toFixed(2)} 抽`,
      ),
      createMetaBox('4★ 角色', fmt((bannerData.fourStarPullIndices?.character || []).length)),
      createMetaBox('4★ 武器', fmt((bannerData.fourStarPullIndices?.weapon || []).length)),
    );

    const totalPullsBox = gridEl.querySelector('.meta-box:first-child');
    if (totalPullsBox) {
      totalPullsBox.classList.add('meta-box-editable');
      const editTotalPullsBtn = document.createElement('button');
      editTotalPullsBtn.type = 'button';
      editTotalPullsBtn.className = 'ghost-button meta-box-corner-button';
      editTotalPullsBtn.textContent = 'i';
      editTotalPullsBtn.setAttribute('aria-label', `修改${banner.label}总抽数`);
      editTotalPullsBtn.title = '修改总抽数';
      editTotalPullsBtn.addEventListener('click', () => openTotalPullsDialog(banner.key));
      totalPullsBox.appendChild(editTotalPullsBtn);
    }

    const notes = [`最后 5★：${lastFiveStar}`];
    if (upRate !== null) notes.push(`UP 率 ${pct(upRate)}`);
    if (offRate !== null) notes.push(`歪率 ${pct(offRate)}`);
    if (latestNames) notes.push(`最近 6 次：${latestNames}`);
    node.querySelector('.banner-note').textContent = notes.join(' ｜ ');

    grid.appendChild(node);
  });

  bannerSection.appendChild(grid);
}

function formatTimelineVersionLabel(pullVersion) {
  if (!pullVersion?.label) return '未标注版本';
  const group = String(pullVersion.group ?? '');
  const parts = group.split('.');
  const patch = parts[parts.length - 1] ?? '';
  const phase = patch === '5' ? '下' : '上';
  return `${pullVersion.label} ${phase}`;
}

function formatTimelineAxisLabel(pullVersion) {
  return pullVersion?.label ?? '未标注版本';
}

function getUpEvents(history) {
  const events = [];
  let previousUpPullIndex = 0;
  let lastOffBannerItem = null;

  history.forEach((item) => {
    if (item.resultType === 'off-banner') {
      lastOffBannerItem = item;
      return;
    }

    if (item.resultType !== 'up') return;

    events.push({
      item,
      cost: item.pullIndex - previousUpPullIndex,
      precedingOffBannerName: lastOffBannerItem?.itemName ?? null,
      capturingRadiance: item.capturingRadiance === true,
    });

    previousUpPullIndex = item.pullIndex;
    lastOffBannerItem = null;
  });

  return events;
}

function getAverageUpCurvePoints(history, typeLabel) {
  const points = [];
  let previousUpPullIndex = 0;
  let totalCost = 0;

  history.forEach((item) => {
    if (item.resultType !== 'up') return;

    const cost = item.pullIndex - previousUpPullIndex;
    totalCost += cost;
    points.push({
      item,
      typeLabel,
      index: points.length + 1,
      cost,
      average: totalCost / (points.length + 1),
    });
    previousUpPullIndex = item.pullIndex;
  });

  return points;
}

function groupUpEventsByVersion(events) {
  const grouped = new Map();

  events.forEach((eventData) => {
    const versionLabel = eventData.item.pullVersion?.label ?? '未标注版本';
    const versionGroup = eventData.item.pullVersion?.group ?? null;
    const key = `${versionGroup ?? 'null'}::${versionLabel}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        versionLabel,
        versionGroup,
        events: [],
      });
    }
    grouped.get(key).events.push(eventData);
  });

  return [...grouped.values()].sort((a, b) => compareVersionGroup(a.versionGroup, b.versionGroup));
}

function showTimelineTooltip(event, timelineEvent, typeLabel) {
  if (!timelineTooltip) return;

  const tags = [];
  if (timelineEvent.precedingOffBannerName) {
    tags.push(`歪 ${timelineEvent.precedingOffBannerName}`);
  }
  if (timelineEvent.capturingRadiance) {
    tags.push('捕获明光');
  }

  timelineTooltip.innerHTML = `
    <div class="timeline-tooltip-title">${timelineEvent.item.itemName}</div>
    <div class="timeline-tooltip-line">${typeLabel}｜${formatTimelineVersionLabel(timelineEvent.item.pullVersion)}</div>
    <div class="timeline-tooltip-line">花费 ${timelineEvent.cost} 抽</div>
    ${tags.length ? `<div class="timeline-tooltip-tags">${tags.map((tag) => `<span class="timeline-tooltip-tag">${tag}</span>`).join('')}</div>` : ''}
  `;

  timelineTooltip.hidden = false;
  moveTimelineTooltip(event);
}

function moveTimelineTooltip(event) {
  if (!timelineTooltip || timelineTooltip.hidden) return;
  const offset = 16;
  const tooltipRect = timelineTooltip.getBoundingClientRect();
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + tooltipRect.width > window.innerWidth - 12) {
    left = event.clientX - tooltipRect.width - offset;
  }
  if (top + tooltipRect.height > window.innerHeight - 12) {
    top = event.clientY - tooltipRect.height - offset;
  }

  timelineTooltip.style.left = `${Math.max(12, left)}px`;
  timelineTooltip.style.top = `${Math.max(12, top)}px`;
}

function hideTimelineTooltip() {
  if (!timelineTooltip) return;
  timelineTooltip.hidden = true;
}

function createTimelineBar(eventData, maxCost, typeLabel, options = {}) {
  const { hideValue = false } = options;

  const barWrap = document.createElement('div');
  barWrap.className = hideValue ? 'timeline-bar-wrap timeline-bar-wrap-compact' : 'timeline-bar-wrap';

  const barOuter = document.createElement('div');
  barOuter.className = 'timeline-bar-outer';

  const bar = document.createElement('div');
  bar.className = 'timeline-bar';
  const height = maxCost > 0 ? Math.max(12, (eventData.cost / maxCost) * 180) : 12;
  bar.style.height = `${height}px`;

  if (eventData.precedingOffBannerName) {
    const marker = document.createElement('span');
    marker.className = 'timeline-bar-marker timeline-bar-marker-off-banner';
    marker.textContent = '歪';
    barOuter.appendChild(marker);
  }

  if (eventData.capturingRadiance) {
    const marker = document.createElement('span');
    marker.className = 'timeline-bar-marker timeline-bar-marker-capturing-radiance';
    marker.textContent = '捕';
    barOuter.appendChild(marker);
  }

  barOuter.appendChild(bar);
  barOuter.addEventListener('mouseenter', (domEvent) => showTimelineTooltip(domEvent, eventData, typeLabel));
  barOuter.addEventListener('mousemove', moveTimelineTooltip);
  barOuter.addEventListener('mouseleave', hideTimelineTooltip);

  const value = document.createElement('div');
  value.className = hideValue ? 'timeline-bar-value timeline-bar-value-placeholder' : 'timeline-bar-value';
  value.textContent = hideValue ? '' : String(eventData.cost);

  barWrap.append(value, barOuter);
  return barWrap;
}

function buildTimelineEventRuns(events) {
  const runs = [];
  let index = 0;

  while (index < events.length) {
    const current = events[index];
    const name = current.item?.itemName ?? '';
    let end = index + 1;

    while (end < events.length && (events[end].item?.itemName ?? '') === name) {
      end += 1;
    }

    const runEvents = events.slice(index, end);
    const totalCost = runEvents.reduce((sum, eventData) => sum + (eventData.cost ?? 0), 0);

    runs.push({
      itemName: name,
      count: end - index,
      events: runEvents,
      totalCost,
    });

    index = end;
  }

  return runs;
}

function createTimelineEventGroup(run, maxCost, typeLabel) {
  const shouldHighlight = run.count >= 2;
  const node = document.createElement('div');
  node.className = shouldHighlight ? 'timeline-event-group timeline-event-group-highlight' : 'timeline-event-group';

  if (shouldHighlight) {
    const badge = document.createElement('div');
    badge.className = 'timeline-event-group-count';
    badge.textContent = `${run.totalCost}`;
    node.appendChild(badge);
  }

  const barsRow = document.createElement('div');
  barsRow.className = 'timeline-event-group-bars';
  run.events.forEach((eventData) => {
    barsRow.appendChild(createTimelineBar(eventData, maxCost, typeLabel, { hideValue: shouldHighlight }));
  });

  node.appendChild(barsRow);
  return node;
}

function createTimelineTrack(title, versionGroups, typeLabel, maxCost) {
  const track = document.createElement('div');
  track.className = 'timeline-track';

  const header = document.createElement('div');
  header.className = 'timeline-track-header';
  header.textContent = title;

  const content = document.createElement('div');
  content.className = 'timeline-track-content';

  if (!versionGroups.length) {
    const empty = document.createElement('div');
    empty.className = 'card empty-state';
    empty.textContent = '暂无可展示的 UP 记录';
    content.appendChild(empty);
  } else {
    versionGroups.forEach((group) => {
      const versionColumn = document.createElement('div');
      versionColumn.className = 'timeline-version-column';

      const versionBlock = document.createElement('div');
      versionBlock.className = 'timeline-version-block';

      const bars = document.createElement('div');
      bars.className = 'timeline-version-bars';
      buildTimelineEventRuns(group.events).forEach((run) => {
        bars.appendChild(createTimelineEventGroup(run, maxCost, typeLabel));
      });

      const label = document.createElement('div');
      label.className = 'timeline-version-label';
      label.textContent = formatTimelineAxisLabel(group.events[0]?.item.pullVersion ?? null);

      versionBlock.appendChild(bars);
      versionColumn.append(versionBlock, label);
      content.appendChild(versionColumn);
    });
  }

  track.append(header, content);
  return track;
}

function showAverageUpCurveTooltip(event, point) {
  if (!timelineTooltip) return;

  timelineTooltip.innerHTML = `
    <div class="timeline-tooltip-line average-up-curve-tooltip-value">${point.average.toFixed(2)} 抽</div>
  `;

  timelineTooltip.hidden = false;
  moveTimelineTooltip(event);
}

function getAverageUpPointRatio(points, index) {
  if (points.length <= 1) return 0.5;
  return (index - 1) / (points.length - 1);
}

function getAverageUpVisiblePoints(points, rangeStart, rangeEnd) {
  if (points.length <= 1) return points;

  const start = Math.min(rangeStart, rangeEnd);
  const end = Math.max(rangeStart, rangeEnd);
  return points.filter((point) => {
    const ratio = getAverageUpPointRatio(points, point.index);
    return ratio >= start - AVERAGE_UP_RANGE_EPSILON && ratio <= end + AVERAGE_UP_RANGE_EPSILON;
  });
}

function getAverageUpCurveStats(points) {
  const values = points.map((point) => point.average);
  return {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

function getAverageUpCurveTrend(points) {
  if (points.length < 2) {
    return { label: '持平', symbol: '→', className: 'average-up-curve-trend-flat' };
  }

  const diff = points[points.length - 1].average - points[0].average;
  if (Math.abs(diff) < AVERAGE_UP_RANGE_EPSILON) {
    return { label: '持平', symbol: '→', className: 'average-up-curve-trend-flat' };
  }
  return diff > 0
    ? { label: '上升', symbol: '↑', className: 'average-up-curve-trend-up' }
    : { label: '下降', symbol: '↓', className: 'average-up-curve-trend-down' };
}

function createAverageUpCurveStats(points) {
  const stats = getAverageUpCurveStats(points);
  const trend = getAverageUpCurveTrend(points);
  const node = document.createElement('div');
  node.className = 'average-up-curve-stats';
  [
    ['最低', stats.min],
    ['最高', stats.max],
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'average-up-curve-stat';
    item.innerHTML = `<span>${label}</span>${value.toFixed(2)} 抽`;
    node.appendChild(item);
  });

  const trendItem = document.createElement('div');
  trendItem.className = `average-up-curve-stat average-up-curve-trend ${trend.className}`;
  trendItem.innerHTML = `<span>趋势</span>${trend.symbol}`;
  trendItem.title = trend.label;
  node.appendChild(trendItem);
  return node;
}

function formatAverageUpAxisTick(value) {
  return String(Math.round(value));
}

function getAverageUpCurvePad(mini) {
  return mini
    ? { top: 8, right: 12, bottom: 8, left: 12 }
    : { top: 18, right: 16, bottom: 18, left: 36 };
}

function getAverageUpNavigatorDataRange(rangeStart, rangeEnd, navigatorWidth) {
  const width = Math.max(360, Math.round(navigatorWidth || 860));
  const pad = getAverageUpCurvePad(true);
  const plotWidth = Math.max(1, width - pad.left - pad.right);
  const startPx = Math.min(rangeStart, rangeEnd) * width;
  const endPx = Math.max(rangeStart, rangeEnd) * width;

  return {
    start: (startPx - pad.left) / plotWidth,
    end: (endPx - pad.left) / plotWidth,
  };
}

function getAverageUpNavigatorRatioForDataRatio(dataRatio, navigatorWidth) {
  const width = Math.max(360, Math.round(navigatorWidth || 860));
  const pad = getAverageUpCurvePad(true);
  const plotWidth = Math.max(1, width - pad.left - pad.right);
  return Math.min(1, Math.max(0, (pad.left + dataRatio * plotWidth) / width));
}

function getAverageUpMinimumNavigatorRange(points, navigatorWidth) {
  if (points.length <= AVERAGE_UP_MIN_VISIBLE_POINTS) return 1;

  const minDataRange = (AVERAGE_UP_MIN_VISIBLE_POINTS - 1) / Math.max(1, points.length - 1);
  return getAverageUpNavigatorRatioForDataRatio(minDataRange, navigatorWidth)
    - getAverageUpNavigatorRatioForDataRatio(0, navigatorWidth);
}

function createAverageUpCurveSvg(series, options = {}) {
  const {
    mini = false,
    rangeStart = 0,
    rangeEnd = 1,
    chartWidth = 860,
    navigatorWidth = chartWidth,
  } = options;
  const points = series.points;
  const width = Math.max(360, Math.round(chartWidth));
  const height = mini ? 54 : 260;
  const pad = getAverageUpCurvePad(mini);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const expectedAverage = !mini && Number.isFinite(series.expectedAverage)
    ? series.expectedAverage
    : null;
  const stats = getAverageUpCurveStats(expectedAverage === null
    ? points
    : [...points, { average: expectedAverage }]);
  const yMin = Math.max(0, Math.floor((stats.min - AVERAGE_UP_AXIS_PADDING) / 10) * 10);
  const yMax = Math.ceil((stats.max + AVERAGE_UP_AXIS_PADDING) / 10) * 10;
  const yRange = Math.max(1, yMax - yMin);
  const dataRange = mini
    ? { start: 0, end: 1 }
    : getAverageUpNavigatorDataRange(rangeStart, rangeEnd, navigatorWidth);
  const xFor = (index) => {
    if (points.length <= 1) return pad.left + plotWidth / 2;
    const ratio = getAverageUpPointRatio(points, index);
    const start = dataRange.start;
    const end = dataRange.end;
    return pad.left + ((ratio - start) / Math.max(0.01, end - start)) * plotWidth;
  };
  const yFor = (value) => pad.top + plotHeight - ((value - yMin) / yRange) * plotHeight;
  const yTicks = mini ? [] : [...new Set([yMin, (yMin + yMax) / 2, yMax])];
  const visiblePoints = mini ? points : getAverageUpVisiblePoints(points, dataRange.start, dataRange.end);
  const averageAtRatio = (ratio) => {
    if (points.length <= 1) return points[0]?.average ?? 0;

    const scaledIndex = ratio * (points.length - 1);
    const leftIndex = Math.floor(scaledIndex);
    const rightIndex = Math.ceil(scaledIndex);
    const left = points[leftIndex];
    const right = points[rightIndex];
    if (!left || !right || leftIndex === rightIndex) return (left || right)?.average ?? 0;

    const progress = scaledIndex - leftIndex;
    return left.average + (right.average - left.average) * progress;
  };
  const linePoints = (() => {
    if (mini || points.length <= 1) return visiblePoints;

    const clampedStart = Math.max(0, dataRange.start);
    const clampedEnd = Math.min(1, dataRange.end);
    if (clampedStart > clampedEnd) return [];

    const line = [];
    if (dataRange.start > 0) {
      line.push({
        index: 1 + clampedStart * (points.length - 1),
        average: averageAtRatio(clampedStart),
      });
    }
    line.push(...visiblePoints);
    if (dataRange.end < 1) {
      line.push({
        index: 1 + clampedEnd * (points.length - 1),
        average: averageAtRatio(clampedEnd),
      });
    }
    return line;
  })();
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', mini ? 'average-up-curve-navigator-svg' : 'average-up-curve-svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${series.label}平均 UP 抽数变化曲线`);

  yTicks.forEach((tick) => {
    const y = yFor(tick);
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('class', 'average-up-curve-grid');
    line.setAttribute('x1', pad.left);
    line.setAttribute('x2', width - pad.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    svg.appendChild(line);

    const label = document.createElementNS(svgNs, 'text');
    label.setAttribute('class', 'average-up-curve-axis-label');
    label.setAttribute('x', pad.left - 12);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.textContent = formatAverageUpAxisTick(tick);
    svg.appendChild(label);
  });

  if (expectedAverage !== null) {
    const expectedY = yFor(expectedAverage);
    const expectedLine = document.createElementNS(svgNs, 'line');
    expectedLine.setAttribute('class', 'average-up-curve-expected-line');
    expectedLine.setAttribute('x1', pad.left);
    expectedLine.setAttribute('x2', width - pad.right);
    expectedLine.setAttribute('y1', expectedY);
    expectedLine.setAttribute('y2', expectedY);
    svg.appendChild(expectedLine);

    const expectedLabel = document.createElementNS(svgNs, 'text');
    expectedLabel.setAttribute('class', 'average-up-curve-expected-label');
    expectedLabel.setAttribute('x', width - pad.right - 4);
    expectedLabel.setAttribute('y', Math.max(pad.top + 12, expectedY - 6));
    expectedLabel.setAttribute('text-anchor', 'end');
    expectedLabel.textContent = `期望 ${expectedAverage.toFixed(2)}`;
    svg.appendChild(expectedLabel);
  }

  const polyline = document.createElementNS(svgNs, 'polyline');
  polyline.setAttribute('class', `average-up-curve-line ${series.className}`);
  polyline.setAttribute(
    'points',
    linePoints.map((point) => `${xFor(point.index)},${yFor(point.average)}`).join(' '),
  );
  svg.appendChild(polyline);

  visiblePoints.forEach((point) => {
    const cx = xFor(point.index);
    const cy = yFor(point.average);
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('class', `average-up-curve-point ${series.className}`);
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', mini ? 2.5 : 4);
    svg.appendChild(circle);

    if (!mini) {
      const hitArea = document.createElementNS(svgNs, 'circle');
      hitArea.setAttribute('class', 'average-up-curve-hit-area');
      hitArea.setAttribute('cx', cx);
      hitArea.setAttribute('cy', cy);
      hitArea.setAttribute('r', 12);
      hitArea.addEventListener('mouseenter', (domEvent) => showAverageUpCurveTooltip(domEvent, point));
      hitArea.addEventListener('mousemove', moveTimelineTooltip);
      hitArea.addEventListener('mouseleave', hideTimelineTooltip);
      svg.appendChild(hitArea);
    }
  });

  return svg;
}

function syncAverageUpNavigator(thumb, state) {
  const start = Math.min(state.start, state.end);
  const end = Math.max(state.start, state.end);
  thumb.style.left = `${start * 100}%`;
  thumb.style.width = `${Math.max(0, end - start) * 100}%`;
}

function normalizeAverageUpRange(state) {
  if (state.start <= AVERAGE_UP_RANGE_EPSILON) state.start = 0;
  if (1 - state.end <= AVERAGE_UP_RANGE_EPSILON) state.end = 1;
}

function clampAverageUpRange(state, minRange, maxRange) {
  const range = Math.min(maxRange, Math.max(minRange, state.end - state.start));
  const center = (state.start + state.end) / 2;
  state.start = Math.min(1 - range, Math.max(0, center - range / 2));
  state.end = state.start + range;
  normalizeAverageUpRange(state);
}

function applyAverageUpRange(viewport, thumb, state, minRange, maxRange, renderMainChart) {
  clampAverageUpRange(state, minRange, maxRange);
  renderMainChart();
  syncAverageUpNavigator(thumb, state);
}

function createAverageUpCurveTrack(series) {
  const track = document.createElement('div');
  track.className = 'average-up-curve-track';

  const header = document.createElement('div');
  header.className = 'average-up-curve-track-header';

  const title = document.createElement('div');
  title.className = 'average-up-curve-track-title';
  title.textContent = series.label;

  let statsNode = createAverageUpCurveStats(series.points);
  header.append(title, statsNode);

  const viewport = document.createElement('div');
  viewport.className = 'average-up-curve-viewport';

  const navigator = document.createElement('div');
  navigator.className = 'average-up-curve-navigator';

  const renderNavigatorChart = () => {
    const existingThumb = navigator.querySelector('.average-up-curve-navigator-thumb');
    navigator.replaceChildren(createAverageUpCurveSvg(series, {
      mini: true,
      chartWidth: navigator.clientWidth || 860,
    }));
    if (existingThumb) navigator.appendChild(existingThumb);
  };

  const thumb = document.createElement('div');
  thumb.className = 'average-up-curve-navigator-thumb';

  const leftHandle = document.createElement('span');
  leftHandle.className = 'average-up-curve-navigator-handle average-up-curve-navigator-handle-left';

  const rightHandle = document.createElement('span');
  rightHandle.className = 'average-up-curve-navigator-handle average-up-curve-navigator-handle-right';

  thumb.append(leftHandle, rightHandle);
  navigator.appendChild(thumb);

  const maxRange = 1;
  const getMinRange = () => Math.min(
    maxRange,
    getAverageUpMinimumNavigatorRange(series.points, navigator.clientWidth || 860),
  );
  const state = {
    start: 0,
    end: 1,
  };

  const resetAverageUpInitialRange = () => {
    if (series.points.length <= AVERAGE_UP_DEFAULT_VISIBLE_POINTS) {
      state.start = 0;
      state.end = 1;
      return;
    }

    const firstVisibleDataRatio = (series.points.length - AVERAGE_UP_DEFAULT_VISIBLE_POINTS)
      / Math.max(1, series.points.length - 1);
    state.end = 1;
    state.start = getAverageUpNavigatorRatioForDataRatio(
      firstVisibleDataRatio,
      navigator.clientWidth || 860,
    );
    const minRange = getMinRange();
    if (state.end - state.start < minRange) {
      state.start = Math.max(0, state.end - minRange);
    }
  };

  const renderStats = () => {
    const dataRange = getAverageUpNavigatorDataRange(state.start, state.end, navigator.clientWidth || 860);
    const visiblePoints = getAverageUpVisiblePoints(series.points, dataRange.start, dataRange.end);
    const nextStatsNode = createAverageUpCurveStats(visiblePoints.length ? visiblePoints : series.points);
    statsNode.replaceWith(nextStatsNode);
    statsNode = nextStatsNode;
  };

  const renderMainChart = () => {
    renderStats();
    viewport.replaceChildren(createAverageUpCurveSvg(series, {
      rangeStart: state.start,
      rangeEnd: state.end,
      chartWidth: viewport.clientWidth || 860,
      navigatorWidth: navigator.clientWidth || 860,
    }));
  };

  const resizeObserver = new ResizeObserver(() => {
    if (!document.body.contains(viewport)) {
      resizeObserver.disconnect();
      return;
    }
    clampAverageUpRange(state, getMinRange(), maxRange);
    renderMainChart();
    renderNavigatorChart();
    syncAverageUpNavigator(thumb, state);
  });
  resizeObserver.observe(viewport);
  resizeObserver.observe(navigator);

  const ratioFromClientX = (clientX) => {
    const rect = navigator.getBoundingClientRect();
    if (!rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const moveRangeTo = (centerRatio) => {
    const range = state.end - state.start;
    state.start = Math.min(1 - range, Math.max(0, centerRatio - range / 2));
    state.end = state.start + range;
    applyAverageUpRange(viewport, thumb, state, getMinRange(), maxRange, renderMainChart);
  };

  const resizeRange = (side, ratio) => {
    const minRange = getMinRange();
    if (side === 'left') {
      state.start = Math.min(state.end - minRange, Math.max(state.end - maxRange, Math.max(0, ratio)));
    } else {
      state.end = Math.max(state.start + minRange, Math.min(state.start + maxRange, Math.min(1, ratio)));
    }
    applyAverageUpRange(viewport, thumb, state, minRange, maxRange, renderMainChart);
  };

  const startDrag = (event, mode) => {
    event.preventDefault();
    const dragTarget = event.currentTarget;
    dragTarget.setPointerCapture(event.pointerId);
    if (mode === 'move') {
      moveRangeTo(ratioFromClientX(event.clientX));
    } else {
      resizeRange(mode, ratioFromClientX(event.clientX));
    }

    const onPointerMove = (moveEvent) => {
      if (mode === 'move') {
        moveRangeTo(ratioFromClientX(moveEvent.clientX));
      } else {
        resizeRange(mode, ratioFromClientX(moveEvent.clientX));
      }
    };
    const onPointerUp = (upEvent) => {
      dragTarget.releasePointerCapture(upEvent.pointerId);
      dragTarget.removeEventListener('pointermove', onPointerMove);
      dragTarget.removeEventListener('pointerup', onPointerUp);
    };

    dragTarget.addEventListener('pointermove', onPointerMove);
    dragTarget.addEventListener('pointerup', onPointerUp);
  };

  leftHandle.addEventListener('pointerdown', (event) => startDrag(event, 'left'));
  rightHandle.addEventListener('pointerdown', (event) => startDrag(event, 'right'));
  thumb.addEventListener('pointerdown', (event) => {
    if (event.target === leftHandle || event.target === rightHandle) return;
    startDrag(event, 'move');
  });
  navigator.addEventListener('pointerdown', (event) => {
    if (event.target === thumb || event.target === leftHandle || event.target === rightHandle) return;
    event.preventDefault();
    moveRangeTo(ratioFromClientX(event.clientX));
  });

  requestAnimationFrame(() => {
    resetAverageUpInitialRange();
    renderNavigatorChart();
    applyAverageUpRange(viewport, thumb, state, getMinRange(), maxRange, renderMainChart);
  });
  track.append(header, viewport, navigator);
  return track;
}

function createAverageUpCurveChart(seriesList) {
  const chart = document.createElement('div');
  chart.className = 'average-up-curve';

  const header = document.createElement('div');
  header.className = 'timeline-track-header';
  header.textContent = '平均 UP 抽数';

  const content = document.createElement('div');
  content.className = 'average-up-curve-content';

  const points = seriesList.flatMap((series) => series.points);
  if (!points.length) {
    const empty = document.createElement('div');
    empty.className = 'card empty-state';
    empty.textContent = '暂无可展示的 UP 记录';
    content.appendChild(empty);
    chart.append(header, content);
    return chart;
  }

  seriesList.forEach((series) => {
    if (!series.points.length) return;
    content.appendChild(createAverageUpCurveTrack(series));
  });

  chart.append(header, content);
  return chart;
}

function stabilizeTimelineRender() {
  const blocks = timelineSection.querySelectorAll('.timeline-version-block');
  if (!blocks.length) return;

  requestAnimationFrame(() => {
    blocks.forEach((block) => {
      void block.getBoundingClientRect();
      block.style.transform = 'translateZ(0)';
    });

    requestAnimationFrame(() => {
      blocks.forEach((block) => {
        block.style.transform = '';
      });
    });
  });
}

function renderTimeline(data) {
  const characterEvents = getUpEvents(data.wishData.limitedCharacter.fiveStarHistory || []);
  const weaponEvents = getUpEvents(data.wishData.limitedWeapon.fiveStarHistory || []);
  const characterGroups = groupUpEventsByVersion(characterEvents);
  const weaponGroups = groupUpEventsByVersion(weaponEvents);
  const maxCost = Math.max(
    0,
    ...characterEvents.map((eventData) => eventData.cost),
    ...weaponEvents.map((eventData) => eventData.cost),
  );

  timelineSection.innerHTML = `
    <div class="section-header">
      <h2>时间轴</h2>
    </div>
  `;

  const shell = document.createElement('div');
  shell.className = 'card timeline-shell';
  shell.append(
    createTimelineTrack('角色池 UP 时间轴', characterGroups, '角色池', maxCost),
    createTimelineTrack('武器池 UP 时间轴', weaponGroups, '武器池', maxCost),
    createAverageUpCurveChart([
      {
        label: '角色池',
        className: 'average-up-curve-character',
        expectedAverage: CHARACTER_AVERAGE_UP_EXPECTED_VALUE,
        points: getAverageUpCurvePoints(data.wishData.limitedCharacter.fiveStarHistory || [], '角色池'),
      },
      {
        label: '武器池',
        className: 'average-up-curve-weapon',
        points: getAverageUpCurvePoints(data.wishData.limitedWeapon.fiveStarHistory || [], '武器池'),
      },
    ]),
  );

  timelineSection.appendChild(shell);
  stabilizeTimelineRender();
}

function getGap(history, item) {
  const index = history.findIndex((entry) => entry.id === item.id);
  if (index <= 0) return item.pullIndex;
  return item.pullIndex - history[index - 1].pullIndex;
}

function buildHistoryTable(item, bannerKey, history) {
  const gap = getGap(history, item);

  if (isStandardBanner(bannerKey)) {
    return `
      <td>${item.pullIndex}</td>
      <td>${gap}</td>
      <td>${renderNameWithBadges(item, bannerKey)}</td>
      <td>${item.itemType}</td>
      <td>${item.time ?? '—'}</td>
      <td><button class="table-button" data-action="edit" data-banner="${bannerKey}" data-record-id="${item.id}">修改</button></td>
    `;
  }

  return `
    <td>${item.pullIndex}</td>
    <td>${gap}</td>
    <td>${renderNameWithBadges(item, bannerKey)}</td>
    <td>${item.itemType}</td>
    <td>${item.pullVersion?.label ?? ''}</td>
    <td><button class="table-button" data-action="edit" data-banner="${bannerKey}" data-record-id="${item.id}">修改</button></td>
  `;
}

function buildHistoryHead(bannerKey) {
  if (isStandardBanner(bannerKey)) {
    return `
      <tr>
        <th>抽位</th>
        <th>抽数</th>
        <th>名称</th>
        <th>类型</th>
        <th>时间</th>
        <th>操作</th>
      </tr>
    `;
  }

  return `
    <tr>
      <th>抽位</th>
      <th>抽数</th>
      <th>名称</th>
      <th>类型</th>
      <th>版本</th>
      <th>操作</th>
    </tr>
  `;
}

function createPaginationControls(bannerKey, totalItems, totalPages) {
  const controls = document.createElement('div');
  controls.className = 'history-pagination';

  const pageInfo = document.createElement('div');
  pageInfo.className = 'history-pagination-info';
  pageInfo.textContent = `第 ${currentPages[bannerKey]} / ${totalPages} 页，共 ${fmt(totalItems)} 条`;

  const actions = document.createElement('div');
  actions.className = 'history-pagination-actions';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ghost-button';
  prevBtn.textContent = '上一页';
  prevBtn.disabled = currentPages[bannerKey] <= 1;
  prevBtn.addEventListener('click', () => {
    currentPages[bannerKey] -= 1;
    renderHistory(currentData);
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ghost-button';
  nextBtn.textContent = '下一页';
  nextBtn.disabled = currentPages[bannerKey] >= totalPages;
  nextBtn.addEventListener('click', () => {
    currentPages[bannerKey] += 1;
    renderHistory(currentData);
  });

  actions.append(prevBtn, nextBtn);
  controls.append(pageInfo, actions);
  return controls;
}

function createPageSizeControl() {
  const wrap = document.createElement('div');
  wrap.className = 'history-toolbar';

  const label = document.createElement('label');
  label.className = 'history-page-size';
  label.innerHTML = '<span>每页条目</span>';

  const select = document.createElement('select');
  PAGE_SIZE_OPTIONS.forEach((size) => {
    const option = document.createElement('option');
    option.value = String(size);
    option.textContent = `${size} 条`;
    option.selected = size === pageSize;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    pageSize = Number(select.value);
    currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
    renderHistory(currentData);
  });

  label.appendChild(select);
  wrap.appendChild(label);
  return wrap;
}

function renderHistory(data) {
  historySection.innerHTML = `
    <div class="section-header">
      <h2>5★ 历史</h2>
      <p>当前修改只作用于页面内存数据，不会直接改本地文件；如需保留，请手动导出 JSON。</p>
    </div>
  `;
  historySection.appendChild(createPageSizeControl());

  BANNERS.forEach((banner) => {
    const bannerData = data.wishData[banner.key];
    const sortedHistory = bannerData.fiveStarHistory.slice().sort((a, b) => a.pullIndex - b.pullIndex);
    const descHistory = sortedHistory.slice().sort((a, b) => b.pullIndex - a.pullIndex);
    const totalPages = Math.max(1, Math.ceil(descHistory.length / pageSize));
    currentPages[banner.key] = Math.min(currentPages[banner.key] || 1, totalPages);
    const start = (currentPages[banner.key] - 1) * pageSize;
    const pageItems = descHistory.slice(start, start + pageSize);

    const sectionCard = document.createElement('article');
    sectionCard.className = 'card history-card';

    const rows = pageItems.map((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = buildHistoryTable(item, banner.key, sortedHistory);
      return tr;
    });

    const table = document.createElement('table');
    table.innerHTML = `<thead>${buildHistoryHead(banner.key)}</thead>`;
    const tbody = document.createElement('tbody');
    rows.forEach((row) => tbody.appendChild(row));
    table.appendChild(tbody);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    tableWrap.appendChild(table);

    sectionCard.innerHTML = `
      <div class="history-header">
        <div class="history-header-left">
          <h3>${banner.label}</h3>
          <div class="history-summary">${fmt(bannerData.fiveStarHistory.length)} 条 5★ 记录</div>
        </div>
        <div></div>
      </div>
    `;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'ghost-button section-corner-button';
    addButton.textContent = '+';
    addButton.setAttribute('aria-label', `新增${banner.label}5★`);
    addButton.title = `新增${banner.label} 5★`;
    addButton.addEventListener('click', () => openCreateDialog(banner.key));

    sectionCard.appendChild(addButton);
    sectionCard.appendChild(tableWrap);
    sectionCard.appendChild(createPaginationControls(banner.key, descHistory.length, totalPages));
    historySection.appendChild(sectionCard);
  });

  historySection.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => openEditDialog(button.dataset.banner, button.dataset.recordId));
  });
}

function setFieldVisible(fieldName, visible) {
  const field = editForm.querySelector(`[data-field="${fieldName}"]`);
  if (!field) return;
  field.style.display = visible ? '' : 'none';
}

function syncBodyDialogState() {
  const anyOpen = Boolean(editDialog?.open || totalPullsDialog?.open || uigfReviewDialog?.open);
  document.body.classList.toggle('dialog-open', anyOpen);
}

function closeEditDialog() {
  if (!editDialog?.open) return;
  editDialog.close();
  syncBodyDialogState();
  currentEditing = null;
}

function closeTotalPullsDialog() {
  if (!totalPullsDialog?.open) return;
  totalPullsDialog.close();
  syncBodyDialogState();
  currentTotalPullsEditing = null;
}

function closeUigfReviewDialog() {
  if (!uigfReviewDialog?.open) return;
  uigfReviewDialog.close();
  syncBodyDialogState();
}

function buildRecordId(bannerKey, pullIndex) {
  return `${bannerKey}-${pullIndex}-${Date.now()}`;
}

function getBannerHistory(bannerKey) {
  return currentData?.wishData?.[bannerKey]?.fiveStarHistory ?? [];
}

function findRecord(bannerKey, recordId) {
  return getBannerHistory(bannerKey).find((item) => String(item.id) === String(recordId)) ?? null;
}

function configureEditForm(bannerKey, item) {
  const standard = isStandardBanner(bannerKey);
  const weapon = isWeaponBanner(bannerKey);

  setFieldVisible('resultType', !standard);
  setFieldVisible('capturingRadiance', shouldShowCapturingRadiance(bannerKey));
  setFieldVisible('pullVersionLabel', !standard);
  setFieldVisible('pullVersionGroup', !standard);
  setFieldVisible('time', true);
  setFieldVisible('source', true);

  editForm.pullIndex.value = item.pullIndex ?? '';
  editForm.itemName.value = item.itemName ?? '';
  editForm.itemType.value = item.itemType ?? (weapon ? '武器' : '角色');
  editForm.time.value = item.time ?? '';
  editForm.source.value = item.source ?? 'manual';

  if (standard) {
    editForm.resultType.value = 'off-banner';
    editForm.capturingRadiance.value = '';
    editForm.pullVersionLabel.value = '';
    editForm.pullVersionGroup.value = '';
    return;
  }

  editForm.resultType.value = item.resultType ?? 'unknown';
  editForm.pullVersionLabel.value = item.pullVersion?.label ?? '';
  editForm.pullVersionGroup.value = item.pullVersion?.group ?? '';

  if (weapon) {
    editForm.capturingRadiance.value = '';
    return;
  }

  editForm.capturingRadiance.value = item.capturingRadiance === null || item.capturingRadiance === undefined
    ? ''
    : String(Boolean(item.capturingRadiance));
}

function openCreateDialog(bannerKey) {
  if (!currentData) return;
  currentEditing = { mode: 'create', bannerKey, recordId: null };
  configureEditForm(bannerKey, {
    pullIndex: '',
    itemName: '',
    itemType: isWeaponBanner(bannerKey) ? '武器' : '角色',
    resultType: isStandardBanner(bannerKey) ? 'off-banner' : 'up',
    capturingRadiance: null,
    pullVersion: null,
    time: null,
    source: 'manual',
  });
  editDeleteBtn.style.display = 'none';
  editDialog.querySelector('h3').textContent = '新增 5★ 记录';
  editDialog.showModal();
  syncBodyDialogState();
}

function openEditDialog(bannerKey, recordId) {
  const item = findRecord(bannerKey, recordId);
  if (!item) return;

  currentEditing = { mode: 'edit', bannerKey, recordId };
  configureEditForm(bannerKey, item);
  editDeleteBtn.style.display = '';
  editDialog.querySelector('h3').textContent = '修改 5★ 记录';
  editDialog.showModal();
  syncBodyDialogState();
}

function openTotalPullsDialog(bannerKey) {
  if (!currentData) return;
  currentTotalPullsEditing = bannerKey;
  const banner = BANNERS.find((item) => item.key === bannerKey);
  totalPullsLabel.textContent = `${banner?.label ?? '当前池子'}总抽数`;
  totalPullsInput.value = String(currentData.wishData[bannerKey].totalPulls ?? 0);
  totalPullsDialog.showModal();
  syncBodyDialogState();
}

function normalizeRecordInput(bannerKey) {
  const pullIndex = Number(editForm.pullIndex.value);
  if (!Number.isFinite(pullIndex) || pullIndex <= 0) {
    throw new Error('抽位必须是大于 0 的数字。');
  }

  const itemName = editForm.itemName.value.trim();
  if (!itemName) {
    throw new Error('名称不能为空。');
  }

  const time = editForm.time.value.trim() || null;
  const source = editForm.source.value || 'manual';
  const standard = isStandardBanner(bannerKey);

  return {
    pullIndex,
    itemName,
    itemType: editForm.itemType.value,
    resultType: standard ? 'off-banner' : editForm.resultType.value,
    capturingRadiance: shouldShowCapturingRadiance(bannerKey)
      ? (editForm.capturingRadiance.value === '' ? null : editForm.capturingRadiance.value === 'true')
      : null,
    pullVersion: standard
      ? null
      : {
          label: editForm.pullVersionLabel.value.trim() || '',
          group: editForm.pullVersionGroup.value.trim() || null,
        },
    time,
    source,
  };
}

function replaceBannerHistory(bannerKey, nextHistory) {
  currentData.wishData[bannerKey].fiveStarHistory = nextHistory
    .map((item) => ({ ...item }))
    .sort((a, b) => a.pullIndex - b.pullIndex);
}

function updateBannerTotalPullsFloor(bannerKey) {
  const banner = currentData.wishData[bannerKey];
  const maxPullIndex = Math.max(0, ...banner.fiveStarHistory.map((item) => Number(item.pullIndex) || 0));
  if (banner.totalPulls < maxPullIndex) {
    banner.totalPulls = maxPullIndex;
  }
}

function saveEditedRecord() {
  if (!currentEditing || !currentData) return;

  const { bannerKey, mode, recordId } = currentEditing;
  const nextRecord = normalizeRecordInput(bannerKey);
  const history = getBannerHistory(bannerKey);

  const duplicate = history.find((item) => item.pullIndex === nextRecord.pullIndex && String(item.id) !== String(recordId));
  if (duplicate) {
    throw new Error(`该池子中已存在抽位 ${nextRecord.pullIndex} 的记录。`);
  }

  if (mode === 'create') {
    replaceBannerHistory(bannerKey, [
      ...history,
      {
        id: buildRecordId(bannerKey, nextRecord.pullIndex),
        ...nextRecord,
      },
    ]);
  } else {
    replaceBannerHistory(
      bannerKey,
      history.map((item) => (String(item.id) === String(recordId)
        ? {
            ...item,
            ...nextRecord,
          }
        : item)),
    );
  }

  updateBannerTotalPullsFloor(bannerKey);
  markEdited();
  rerender();
}

function deleteEditedRecord() {
  if (!currentEditing || currentEditing.mode !== 'edit' || !currentData) return;

  const { bannerKey, recordId } = currentEditing;
  const history = getBannerHistory(bannerKey);
  replaceBannerHistory(
    bannerKey,
    history.filter((item) => String(item.id) !== String(recordId)),
  );
  markEdited();
  rerender();
}

function saveTotalPulls() {
  if (!currentData || !currentTotalPullsEditing) return;

  const bannerKey = currentTotalPullsEditing;
  const nextTotalPulls = Number(totalPullsInput.value);
  if (!Number.isFinite(nextTotalPulls) || nextTotalPulls < 0) {
    throw new Error('总抽数必须是大于等于 0 的数字。');
  }

  const maxPullIndex = Math.max(0, ...currentData.wishData[bannerKey].fiveStarHistory.map((item) => Number(item.pullIndex) || 0));
  if (nextTotalPulls < maxPullIndex) {
    throw new Error(`总抽数不能小于当前 5★ 最大抽位 ${maxPullIndex}。`);
  }

  currentData.wishData[bannerKey].totalPulls = nextTotalPulls;
  markEdited();
  rerender();
}

function renderEmptyState() {
  overviewSection.innerHTML = `
    <div class="card landing-card">
      <div class="landing-badge">纯静态模式</div>
      <h2>上传符合规范的 JSON 后开始查看</h2>
      <p>
        你可以直接双击打开 <code>index.html</code>，然后上传 <code>schemaVersion: 4</code> 的 wish-data JSON。
      </p>
      <ul class="landing-list">
        <li>支持页面内修改 5★ 记录与总抽数</li>
        <li>支持导入 UIGF 自动更新已有数据</li>
        <li>修改只发生在当前页面数据里，想保留请手动导出 JSON</li>
      </ul>
    </div>
  `;
  bannerSection.innerHTML = '';
  timelineSection.innerHTML = '';
  historySection.innerHTML = '';
}

function buildTemplateData() {
  return {
    schemaVersion: 4,
    wishData: {
      standard: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
      limitedCharacter: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
      limitedWeapon: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
    },
  };
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importFromFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  const normalized = validateAndNormalizeData(payload);
  currentData = normalized;
  baselineData = cloneData(normalized);
  currentFileName = file.name;
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  persistBaselineData();
  persistSnapshot();
  updateCurrentFileLabel();
  rerender();
}

function getBannerRows(uigfList, gachaType) {
  const normalizedType = String(gachaType);
  const rows = uigfList.filter((row) => String(row.gacha_type) === normalizedType);
  const total = rows.length;
  return rows.map((row, index) => ({
    ...row,
    originalLocalIndex: index + 1,
    reversedLocalIndex: total - index,
    pullIndex: total - index + OFFSETS[normalizedType],
  }));
}

function ensureSortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function buildTimedOffsetCheck(schema, uigfList, gachaType) {
  const bannerKey = BANNER_KEY_BY_GACHA_TYPE[gachaType];
  const schemaTimed = schema.wishData[bannerKey].fiveStarHistory.filter((row) => row.time);
  const uigfTimedFive = getBannerRows(uigfList, gachaType).filter((row) => String(row.rank_type) === '5');

  const byTime = new Map();
  for (const row of uigfTimedFive) {
    if (!byTime.has(row.time)) byTime.set(row.time, []);
    byTime.get(row.time).push(row);
  }

  const offsets = [];
  const ambiguous = [];

  for (const row of schemaTimed) {
    const candidates = (byTime.get(row.time) || []).filter(
      (item) => item.name === row.itemName && item.item_type === row.itemType,
    );

    if (candidates.length === 1) {
      offsets.push(row.pullIndex - candidates[0].reversedLocalIndex);
    } else {
      ambiguous.push({
        pullIndex: row.pullIndex,
        time: row.time,
        itemName: row.itemName,
        candidateCount: candidates.length,
      });
    }
  }

  const uniqueOffsets = [...new Set(offsets)];
  return {
    gachaType: String(gachaType),
    bannerKey,
    expectedOffset: OFFSETS[String(gachaType)],
    uniqueOffsets,
    ok: uniqueOffsets.length === 1 && uniqueOffsets[0] === OFFSETS[String(gachaType)],
    ambiguous,
  };
}

function buildDiff(schema, uigfList, gachaType) {
  const bannerKey = BANNER_KEY_BY_GACHA_TYPE[gachaType];
  const banner = schema.wishData[bannerKey];
  const mapped = getBannerRows(uigfList, gachaType);

  const existingFourCharacter = new Set(banner.fourStarPullIndices.character);
  const existingFourWeapon = new Set(banner.fourStarPullIndices.weapon);
  const existingFive = new Map(banner.fiveStarHistory.map((row) => [row.pullIndex, row]));

  const newFourStars = [];
  const patchFiveStars = [];
  const newFiveStars = [];
  const conflicts = [];

  for (const row of mapped) {
    const pullIndex = row.pullIndex;

    if (String(row.rank_type) === '4') {
      const targetType = row.item_type === '角色' ? 'character' : row.item_type === '武器' ? 'weapon' : null;
      const existingType = existingFourCharacter.has(pullIndex)
        ? 'character'
        : existingFourWeapon.has(pullIndex)
          ? 'weapon'
          : null;

      if (!existingType) {
        newFourStars.push({
          pullIndex,
          itemType: row.item_type,
          name: row.name,
          time: row.time,
          originalLocalIndex: row.originalLocalIndex,
          reversedLocalIndex: row.reversedLocalIndex,
        });
      } else if (existingType !== targetType) {
        const existingRecord = {
          pullIndex,
          existingType,
          newType: targetType,
          name: row.name,
          time: row.time,
        };
        if (
          (existingType === 'character' && targetType === 'weapon' && row.name === '昭心') ||
          (existingType === 'weapon' && targetType === 'character' && row.name === '砂糖')
        ) {
          // confirmed historical correction
        } else {
          conflicts.push(existingRecord);
        }
      }
    }

    if (String(row.rank_type) === '5') {
      const existing = existingFive.get(pullIndex);
      if (!existing) {
        newFiveStars.push({
          pullIndex,
          itemName: row.name,
          itemType: row.item_type,
          time: row.time,
          resultType: inferLimitedResultType(bannerKey, row.name, row.item_type),
          capturingRadiance: null,
          pullVersion: null,
          originalLocalIndex: row.originalLocalIndex,
          reversedLocalIndex: row.reversedLocalIndex,
        });
      } else {
        const changes = {};
        if (existing.time !== row.time) changes.time = { from: existing.time, to: row.time };
        if (existing.itemName !== row.name) changes.itemName = { from: existing.itemName, to: row.name };
        if (existing.itemType !== row.item_type) changes.itemType = { from: existing.itemType, to: row.item_type };
        if (Object.keys(changes).length > 0) {
          patchFiveStars.push({ pullIndex, changes });
        }
      }
    }
  }

  return {
    bannerKey,
    bannerLabel: BANNERS.find((item) => item.key === bannerKey)?.label ?? bannerKey,
    gachaType: String(gachaType),
    offset: OFFSETS[String(gachaType)],
    currentTotalPulls: banner.totalPulls,
    candidateTotalPulls: Math.max(banner.totalPulls, ...mapped.map((row) => row.pullIndex), banner.totalPulls),
    newFourStars,
    newFiveStars,
    patchFiveStars,
    conflicts,
  };
}

function applyDiff(schema, diff) {
  const banner = schema.wishData[diff.bannerKey];
  const four = banner.fourStarPullIndices;

  const removeIndex = (pullIndex) => {
    four.character = four.character.filter((x) => x !== pullIndex);
    four.weapon = four.weapon.filter((x) => x !== pullIndex);
  };

  const addIndex = (pullIndex, type) => {
    removeIndex(pullIndex);
    four[type].push(pullIndex);
    four.character = ensureSortedUnique(four.character);
    four.weapon = ensureSortedUnique(four.weapon);
  };

  banner.totalPulls = diff.candidateTotalPulls;

  for (const patch of diff.patchFiveStars) {
    const rec = banner.fiveStarHistory.find((item) => item.pullIndex === patch.pullIndex);
    if (!rec) continue;
    if (patch.changes.time) rec.time = patch.changes.time.to;
    if (patch.changes.itemName) rec.itemName = patch.changes.itemName.to;
    if (patch.changes.itemType) rec.itemType = patch.changes.itemType.to;
    rec.source = rec.source ?? 'auto';
  }

  for (const item of diff.newFourStars) {
    const type = item.itemType === '角色' ? 'character' : 'weapon';
    addIndex(item.pullIndex, type);
  }

  for (const item of diff.conflicts) {
    addIndex(item.pullIndex, item.newType);
  }

  for (const item of diff.newFiveStars) {
    banner.fiveStarHistory.push({
      id: `${diff.bannerKey}-${item.pullIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pullIndex: item.pullIndex,
      time: item.time,
      itemName: item.itemName,
      itemType: item.itemType,
      resultType: item.resultType ?? (diff.bannerKey === 'standard' ? 'off-banner' : 'unknown'),
      capturingRadiance: item.capturingRadiance ?? null,
      pullVersion: item.pullVersion
        ? {
            label: item.pullVersion.label ?? '',
            group: item.pullVersion.group ?? null,
          }
        : null,
      source: 'auto',
    });
  }

  banner.fiveStarHistory.sort((a, b) => a.pullIndex - b.pullIndex);
}

function summarizeUigfResult(checks, diffs) {
  const count = diffs.reduce((acc, diff) => ({
    newFourStars: acc.newFourStars + diff.newFourStars.length,
    newFiveStars: acc.newFiveStars + diff.newFiveStars.length,
    patchFiveStars: acc.patchFiveStars + diff.patchFiveStars.length,
    conflicts: acc.conflicts + diff.conflicts.length,
    totalPullsRaised: acc.totalPullsRaised + (diff.candidateTotalPulls > diff.currentTotalPulls ? 1 : 0),
  }), { newFourStars: 0, newFiveStars: 0, patchFiveStars: 0, conflicts: 0, totalPullsRaised: 0 });

  const failed = checks.filter((item) => !item.ok);
  return { count, failed };
}

function getUigfSupplementalItems(review) {
  if (!review?.diffs) return [];
  return review.diffs.flatMap((diff) => {
    if (!isLimitedBanner(diff.bannerKey)) return [];
    return diff.newFiveStars.map((item, itemIndex) => ({
      diff,
      item,
      itemIndex,
      key: `${diff.bannerKey}:${item.pullIndex}:${itemIndex}`,
    }));
  });
}

function renderResultTypeOptions(value) {
  return [
    ['up', 'up'],
    ['off-banner', 'off-banner'],
    ['unknown', 'unknown'],
  ].map(([optionValue, label]) => `<option value="${optionValue}"${value === optionValue ? ' selected' : ''}>${label}</option>`).join('');
}

function renderCapturingRadianceOptions(value) {
  return [
    ['', '未记录'],
    ['true', '是'],
    ['false', '否'],
  ].map(([optionValue, label]) => {
    const normalizedValue = value === null || value === undefined ? '' : String(Boolean(value));
    return `<option value="${optionValue}"${normalizedValue === optionValue ? ' selected' : ''}>${label}</option>`;
  }).join('');
}

function renderUigfSupplementalSection(review) {
  const items = getUigfSupplementalItems(review);
  if (!items.length) {
    return `
      <section class="uigf-section">
        <h4>待补充信息</h4>
        <div class="uigf-note">本次没有新增限定 5★ 记录。</div>
      </section>
    `;
  }

  const rows = items.map(({ diff, item, itemIndex }) => {
    const versionLabel = item.pullVersion?.label ?? '';
    const versionGroup = item.pullVersion?.group ?? '';
    const captureControl = diff.bannerKey === 'limitedCharacter'
      ? `<select data-uigf-field="capturingRadiance" data-banner="${diff.bannerKey}" data-index="${itemIndex}">${renderCapturingRadianceOptions(item.capturingRadiance)}</select>`
      : '<span class="uigf-muted-cell">—</span>';

    return `
      <tr>
        <td>${escapeHtml(diff.bannerLabel)}</td>
        <td>${item.pullIndex}</td>
        <td>${escapeHtml(item.itemName)}</td>
        <td>${escapeHtml(item.itemType)}</td>
        <td>
          <select data-uigf-field="resultType" data-banner="${diff.bannerKey}" data-index="${itemIndex}">
            ${renderResultTypeOptions(item.resultType ?? 'unknown')}
          </select>
        </td>
        <td><input data-uigf-field="pullVersionLabel" data-banner="${diff.bannerKey}" data-index="${itemIndex}" value="${escapeHtml(versionLabel)}" placeholder="如 5.6 / 月之一" /></td>
        <td><input data-uigf-field="pullVersionGroup" data-banner="${diff.bannerKey}" data-index="${itemIndex}" value="${escapeHtml(versionGroup)}" placeholder="如 5.6.0 / 5.6.5" /></td>
        <td>${captureControl}</td>
      </tr>
    `;
  }).join('');

  return `
    <section class="uigf-section">
      <h4>待补充信息</h4>
      <div class="uigf-supplemental-toolbar">
        <label>
          <span>批量版本标签</span>
          <input id="uigf-batch-version-label" placeholder="如 5.6 / 月之一" />
        </label>
        <label>
          <span>批量版本分组</span>
          <input id="uigf-batch-version-group" placeholder="如 5.6.0 / 5.6.5" />
        </label>
        <button type="button" class="ghost-button compact-button" id="uigf-batch-fill-empty">填充空白</button>
        <button type="button" class="ghost-button compact-button" id="uigf-batch-fill-all">覆盖全部</button>
      </div>
      <div class="table-wrap uigf-supplemental-table-wrap">
        <table class="uigf-supplemental-table">
          <thead>
            <tr>
              <th>池子</th>
              <th>抽位</th>
              <th>名称</th>
              <th>类型</th>
              <th>结果</th>
              <th>版本标签</th>
              <th>版本分组</th>
              <th>捕获明光</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function bindUigfSupplementalControls() {
  const fillVersionInputs = (overwrite) => {
    const labelValue = uigfReviewContent.querySelector('#uigf-batch-version-label')?.value.trim() ?? '';
    const groupValue = uigfReviewContent.querySelector('#uigf-batch-version-group')?.value.trim() ?? '';

    uigfReviewContent.querySelectorAll('[data-uigf-field="pullVersionLabel"]').forEach((input) => {
      if (overwrite || !input.value.trim()) input.value = labelValue;
    });
    uigfReviewContent.querySelectorAll('[data-uigf-field="pullVersionGroup"]').forEach((input) => {
      if (overwrite || !input.value.trim()) input.value = groupValue;
    });
  };

  uigfReviewContent.querySelector('#uigf-batch-fill-empty')?.addEventListener('click', () => fillVersionInputs(false));
  uigfReviewContent.querySelector('#uigf-batch-fill-all')?.addEventListener('click', () => fillVersionInputs(true));
}

function syncUigfSupplementalInputs(review) {
  const items = getUigfSupplementalItems(review);
  for (const { diff, item, itemIndex } of items) {
    const fieldSelector = (field) => `[data-uigf-field="${field}"][data-banner="${diff.bannerKey}"][data-index="${itemIndex}"]`;
    const resultType = uigfReviewContent.querySelector(fieldSelector('resultType'))?.value ?? 'unknown';
    const label = uigfReviewContent.querySelector(fieldSelector('pullVersionLabel'))?.value.trim() ?? '';
    const group = uigfReviewContent.querySelector(fieldSelector('pullVersionGroup'))?.value.trim() ?? '';
    const captureValue = uigfReviewContent.querySelector(fieldSelector('capturingRadiance'))?.value ?? '';

    if (!label || !group) {
      throw new Error(`请补充 ${diff.bannerLabel} ${item.pullIndex} 抽 ${item.itemName} 的版本标签和版本分组。`);
    }

    item.resultType = resultType;
    item.pullVersion = { label, group };
    item.capturingRadiance = diff.bannerKey === 'limitedCharacter'
      ? (captureValue === '' ? null : captureValue === 'true')
      : null;
  }
}

function renderUigfReviewPanel(review) {
  const { count, failed } = summarizeUigfResult(review.checks, review.diffs);

  const checkHtml = review.checks.map((check) => {
    const status = check.ok ? '通过' : '失败';
    const offsets = check.uniqueOffsets.length ? check.uniqueOffsets.join(', ') : '无可用匹配';
    return `
      <div class="uigf-check-card ${check.ok ? 'is-ok' : 'is-failed'}">
        <div><strong>${BANNERS.find((item) => item.key === check.bannerKey)?.label ?? check.bannerKey}</strong></div>
        <div>校验：${status}</div>
        <div>期望 offset：${check.expectedOffset}</div>
        <div>实际 offset：${offsets}</div>
        ${check.ambiguous.length ? `<div>歧义匹配：${check.ambiguous.length} 条</div>` : ''}
      </div>
    `;
  }).join('');

  const diffHtml = review.diffs.map((diff) => {
    const totalPullsNote = diff.candidateTotalPulls > diff.currentTotalPulls
      ? `<div class="uigf-note">总抽数将从 ${diff.currentTotalPulls} 提升到 ${diff.candidateTotalPulls}</div>`
      : '';

    const newFiveHtml = diff.newFiveStars.length
      ? `<details class="uigf-details"><summary>新增 5★（${diff.newFiveStars.length}）</summary><ul>${diff.newFiveStars.map((item) => `<li>${item.pullIndex} 抽：${item.itemName}（${item.itemType}）${item.time ? `｜${item.time}` : ''}</li>`).join('')}</ul></details>`
      : '';

    const patchFiveHtml = diff.patchFiveStars.length
      ? `<details class="uigf-details"><summary>修补已有 5★（${diff.patchFiveStars.length}）</summary><ul>${diff.patchFiveStars.map((item) => {
          const parts = [];
          if (item.changes.time) parts.push(`时间 ${item.changes.time.from ?? '—'} → ${item.changes.time.to ?? '—'}`);
          if (item.changes.itemName) parts.push(`名称 ${item.changes.itemName.from} → ${item.changes.itemName.to}`);
          if (item.changes.itemType) parts.push(`类型 ${item.changes.itemType.from} → ${item.changes.itemType.to}`);
          return `<li>${item.pullIndex} 抽：${parts.join('；')}</li>`;
        }).join('')}</ul></details>`
      : '';

    const newFourHtml = diff.newFourStars.length
      ? `<details class="uigf-details"><summary>新增 4★ 索引（${diff.newFourStars.length}）</summary><ul>${diff.newFourStars.slice(0, 20).map((item) => `<li>${item.pullIndex} 抽：${item.name}（${item.itemType}）</li>`).join('')}</ul>${diff.newFourStars.length > 20 ? '<div class="uigf-note">仅展示前 20 条</div>' : ''}</details>`
      : '';

    const conflictsHtml = diff.conflicts.length
      ? `<details class="uigf-details"><summary>4★ 冲突（${diff.conflicts.length}）</summary><ul>${diff.conflicts.map((item) => `<li>${item.pullIndex} 抽：现有 ${item.existingType}，UIGF 判定 ${item.newType}，名称 ${item.name}</li>`).join('')}</ul><div class="uigf-note">当前实现会优先采用 UIGF 判定类型。</div></details>`
      : '';

    return `
      <article class="card uigf-diff-card">
        <h4>${diff.bannerLabel}</h4>
        <div class="uigf-summary-line">新增 4★：${diff.newFourStars.length} ｜ 新增 5★：${diff.newFiveStars.length} ｜ 修补 5★：${diff.patchFiveStars.length} ｜ 冲突：${diff.conflicts.length}</div>
        ${totalPullsNote}
        ${newFiveHtml}
        ${patchFiveHtml}
        ${newFourHtml}
        ${conflictsHtml}
      </article>
    `;
  }).join('');

  uigfReviewContent.innerHTML = `
    <div class="uigf-overview-grid">
      <div class="uigf-overview-item"><span>新增 4★</span><strong>${count.newFourStars}</strong></div>
      <div class="uigf-overview-item"><span>新增 5★</span><strong>${count.newFiveStars}</strong></div>
      <div class="uigf-overview-item"><span>修补 5★</span><strong>${count.patchFiveStars}</strong></div>
      <div class="uigf-overview-item"><span>发现冲突</span><strong>${count.conflicts}</strong></div>
    </div>
    <section class="uigf-section">
      <h4>偏移校验</h4>
      <div class="uigf-check-grid">${checkHtml}</div>
      ${failed.length ? '<div class="uigf-warning">存在 offset 校验失败，当前不建议应用导入结果。</div>' : ''}
    </section>
    <section class="uigf-section">
      <h4>变更详情</h4>
      <div class="uigf-diff-grid">${diffHtml}</div>
    </section>
    ${renderUigfSupplementalSection(review)}
  `;

  bindUigfSupplementalControls();
  uigfReviewApplyBtn.disabled = failed.length > 0;
}

async function analyzeUigfFromFile(file) {
  if (!currentData) {
    throw new Error('请先上传 schemaVersion: 4 的主 JSON，再导入 UIGF。');
  }

  const text = await file.text();
  const imported = JSON.parse(text);
  const uigfList = Array.isArray(imported.list) ? imported.list : [];
  if (!uigfList.length) {
    throw new Error('UIGF 文件缺少 list 数组，或数组为空。');
  }

  const checks = ['200', '301', '302'].map((gachaType) => buildTimedOffsetCheck(currentData, uigfList, gachaType));
  const diffs = ['200', '301', '302'].map((gachaType) => buildDiff(currentData, uigfList, gachaType));
  return {
    fileName: file.name,
    checks,
    diffs,
  };
}

function applyPendingUigfReview() {
  if (!pendingUigfReview || !currentData) {
    throw new Error('当前没有待应用的 UIGF 导入结果。');
  }

  const { failed } = summarizeUigfResult(pendingUigfReview.checks, pendingUigfReview.diffs);
  if (failed.length > 0) {
    throw new Error('当前存在 offset 校验失败，不能应用。');
  }

  syncUigfSupplementalInputs(pendingUigfReview);

  const next = cloneData(currentData);
  pendingUigfReview.diffs.forEach((diff) => applyDiff(next, diff));
  currentData = validateAndNormalizeData(next);
  markEdited();
  rerender();

  const summary = summarizeUigfResult(pendingUigfReview.checks, pendingUigfReview.diffs).count;
  pendingUigfReview = null;
  closeUigfReviewDialog();
  return summary;
}

uploadBtn?.addEventListener('click', () => {
  uploadInput?.click();
});

uigfBtn?.addEventListener('click', () => {
  uigfInput?.click();
});

uploadInput?.addEventListener('change', async () => {
  const file = uploadInput.files?.[0];
  if (!file) return;

  try {
    setSyncStatus('正在读取主 JSON…');
    await importFromFile(file);
    setSyncStatus(storageAvailable ? 'JSON 已加载。' : 'JSON 已加载（当前浏览器禁用了本地缓存）。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`加载失败：${msg}`, 'error');
    alert(`加载失败：${msg}`);
  } finally {
    uploadInput.value = '';
  }
});

uigfInput?.addEventListener('change', async () => {
  const file = uigfInput.files?.[0];
  if (!file) return;

  try {
    setSyncStatus('正在分析 UIGF 导入结果…');
    pendingUigfReview = await analyzeUigfFromFile(file);
    renderUigfReviewPanel(pendingUigfReview);
    uigfReviewDialog.showModal();
    syncBodyDialogState();
    setSyncStatus('UIGF 分析完成，请确认是否应用。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`UIGF 导入失败：${msg}`, 'error');
    alert(`UIGF 导入失败：${msg}`);
  } finally {
    uigfInput.value = '';
  }
});

templateBtn?.addEventListener('click', () => {
  downloadJsonFile(buildTemplateData(), 'wish-data.schema-v4.template.json');
  setSyncStatus('模板已下载。', 'success');
});

exportBtn?.addEventListener('click', () => {
  if (!currentData) {
    setSyncStatus('当前没有可导出的数据。', 'error');
    return;
  }

  downloadJsonFile(cloneData(currentData), `wish-data.${formatExportDate()}.json`);
  setDirty(false);
  persistSnapshot();
  setSyncStatus('导出完成。', 'success');
});

resetBtn?.addEventListener('click', () => {
  if (!currentData) {
    setSyncStatus('当前没有已加载的数据。');
    return;
  }

  const confirmed = window.confirm('确定清除当前浏览器里保存的数据吗？');
  if (!confirmed) return;

  currentData = null;
  baselineData = null;
  pendingUigfReview = null;
  currentFileName = '未加载';
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  clearPersistedData();
  updateCurrentFileLabel();
  setSyncStatus('已清除本地缓存数据。', 'success');
  rerender();
});

sampleBtn?.addEventListener('click', () => {
  const sampleData = buildTemplateData();
  sampleData.wishData.standard.totalPulls = 80;
  sampleData.wishData.standard.fiveStarHistory = [
    {
      id: 'standard-80',
      pullIndex: 80,
      time: null,
      itemName: '刻晴',
      itemType: '角色',
      resultType: 'off-banner',
      capturingRadiance: null,
      pullVersion: null,
      source: 'manual',
    },
  ];
  sampleData.wishData.limitedCharacter.totalPulls = 160;
  sampleData.wishData.limitedCharacter.fiveStarHistory = [
    {
      id: 'limitedCharacter-75',
      pullIndex: 75,
      time: null,
      itemName: '迪卢克',
      itemType: '角色',
      resultType: 'off-banner',
      capturingRadiance: null,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
    {
      id: 'limitedCharacter-152',
      pullIndex: 152,
      time: null,
      itemName: '爱可菲',
      itemType: '角色',
      resultType: 'up',
      capturingRadiance: false,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
  ];
  sampleData.wishData.limitedWeapon.totalPulls = 70;
  sampleData.wishData.limitedWeapon.fiveStarHistory = [
    {
      id: 'limitedWeapon-63',
      pullIndex: 63,
      time: null,
      itemName: '香韵奏者',
      itemType: '武器',
      resultType: 'up',
      capturingRadiance: null,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
  ];

  currentData = validateAndNormalizeData(sampleData);
  baselineData = cloneData(currentData);
  currentFileName = '内置示例数据';
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  persistBaselineData();
  persistSnapshot();
  updateCurrentFileLabel();
  setSyncStatus(storageAvailable ? '已加载示例数据。' : '已加载示例数据（当前浏览器禁用了本地缓存）。', 'success');
  rerender();
});

editCancelBtn?.addEventListener('click', () => {
  closeEditDialog();
});

editCancelMobileBtn?.addEventListener('click', () => {
  closeEditDialog();
});

editDialog?.addEventListener('close', syncBodyDialogState);

totalPullsCancelBtn?.addEventListener('click', () => {
  closeTotalPullsDialog();
});

totalPullsCancelMobileBtn?.addEventListener('click', () => {
  closeTotalPullsDialog();
});

totalPullsDialog?.addEventListener('close', syncBodyDialogState);

uigfReviewCancelBtn?.addEventListener('click', () => {
  closeUigfReviewDialog();
});

uigfReviewCloseBtn?.addEventListener('click', () => {
  closeUigfReviewDialog();
});

uigfReviewDialog?.addEventListener('close', syncBodyDialogState);

editForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveEditedRecord();
    closeEditDialog();
    setSyncStatus('修改已写入当前页面数据；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`保存失败：${msg}`, 'error');
    alert(`保存失败：${msg}`);
  }
});

editDeleteBtn?.addEventListener('click', () => {
  const confirmed = window.confirm('确定删除这条 5★ 记录吗？');
  if (!confirmed) return;

  deleteEditedRecord();
  closeEditDialog();
  setSyncStatus('条目已从当前页面数据中删除；如需保留，请导出 JSON。', 'success');
});

totalPullsForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveTotalPulls();
    closeTotalPullsDialog();
    setSyncStatus('总抽数已写入当前页面数据；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`保存失败：${msg}`, 'error');
    alert(`保存失败：${msg}`);
  }
});

uigfReviewForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const summary = applyPendingUigfReview();
    setSyncStatus(`UIGF 已应用：新增 4★ ${summary.newFourStars} 条，新增 5★ ${summary.newFiveStars} 条，修补 5★ ${summary.patchFiveStars} 条。`, 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`应用失败：${msg}`, 'error');
    alert(`应用失败：${msg}`);
  }
});

window.addEventListener('scroll', hideTimelineTooltip, { passive: true });
window.addEventListener('resize', hideTimelineTooltip);

function main() {
  checkStorageAvailability();

  try {
    const storedData = loadStoredData();
    const storedBaseline = loadStoredBaselineData();
    const storedMeta = loadStoredMeta();
    if (storedData) {
      currentData = storedData;
      baselineData = storedBaseline ? cloneData(storedBaseline) : cloneData(storedData);
      currentFileName = storedMeta?.fileName ?? '浏览器缓存';
      setDirty(Boolean(storedMeta?.isDirty));
      updateCurrentFileLabel();
      setSyncStatus('已恢复浏览器缓存中的数据。', 'success');
    } else {
      currentFileName = '未加载';
      setDirty(false);
      updateCurrentFileLabel();
      setSyncStatus(storageAvailable ? '准备就绪，等待上传 JSON。' : '准备就绪，等待上传 JSON（当前浏览器禁用了本地缓存）。');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    currentFileName = '未加载';
    setDirty(false);
    updateCurrentFileLabel();
    setSyncStatus(`浏览器缓存已损坏，已重置：${msg}`, 'error');
  }

  rerender();
}

main();
