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

