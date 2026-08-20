const spendingSection = document.querySelector('#spending-section');
const syncStatus = document.querySelector('#sync-status');
const uploadInput = document.querySelector('#upload-input');
const uploadTrigger = document.querySelector('#upload-trigger');
const downloadTemplateTrigger = document.querySelector('#download-template');
const downloadCurrentTrigger = document.querySelector('#download-current');
const mobileDownloadCurrentTrigger = document.querySelector('#mobile-download-current');
const loadSampleTrigger = document.querySelector('#load-sample');
const clearLocalDataTrigger = document.querySelector('#clear-local-data');
const currentFileLabel = document.querySelector('#current-file-label');
const dirtyIndicator = document.querySelector('#dirty-indicator');

const otherItemDialog = document.querySelector('#other-item-dialog');
const otherItemForm = document.querySelector('#other-item-form');
const otherItemDialogTitle = document.querySelector('#other-item-dialog-title');
const otherItemNameInput = document.querySelector('#other-item-name-input');
const otherItemAmountInput = document.querySelector('#other-item-amount-input');
const otherItemPrimogemsInput = document.querySelector('#other-item-primogems-input');
const otherItemDeleteButton = document.querySelector('#other-item-delete');

const incentiveItemDialog = document.querySelector('#incentive-item-dialog');
const incentiveItemForm = document.querySelector('#incentive-item-form');
const incentiveItemDialogTitle = document.querySelector('#incentive-item-dialog-title');
const incentiveItemNameInput = document.querySelector('#incentive-item-name-input');
const incentiveItemPrimogemsInput = document.querySelector('#incentive-item-primogems-input');
const incentiveItemCostInput = document.querySelector('#incentive-item-cost-input');
const incentiveItemDeleteButton = document.querySelector('#incentive-item-delete');

const SPENDING_STORAGE_KEY = 'gachaHistory.spending.data.v1';
const SPENDING_STORAGE_META_KEY = 'gachaHistory.spending.meta.v1';
const SPENDING_STORAGE_BASELINE_KEY = 'gachaHistory.spending.baseline.v1';
const SPENDING_FIXED_PURCHASES = [
  { key: 'welkinMoon', label: '空月祝福', unitPrice: 30 },
  { key: 'gnosticHymn', label: '珍珠纪行', unitPrice: 68 },
  { key: 'gnosticChorus', label: '珍珠之歌', unitPrice: 128 },
  { key: 'firstTopUp', label: '首充', unitPrice: 1308 },
];

let storageAvailable = true;
let currentSpendingData = null;
let baselineSpendingData = null;
let currentSpendingFileName = '未加载';
let spendingDirty = false;
let otherItemEditing = null;
let incentiveItemEditing = null;

function cloneSpendingData(data) {
  return JSON.parse(JSON.stringify(data));
}

function escapeSpendingHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeNonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function normalizeFiniteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeCount(value) {
  return Math.floor(normalizeNonNegativeNumber(value));
}

function formatSpendingNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits }).format(normalizeNonNegativeNumber(value));
}

function formatSignedNumber(value, maximumFractionDigits = 2) {
  const number = Number(value) || 0;
  const absolute = new Intl.NumberFormat('zh-CN', { maximumFractionDigits }).format(Math.abs(number));
  if (number > 0) return `+${absolute}`;
  if (number < 0) return `-${absolute}`;
  return absolute;
}

function formatSpendingCurrency(value) {
  const number = normalizeFiniteNumber(value);
  return `¥${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(number)}`;
}

function formatSignedCurrency(value) {
  return `¥${formatSignedNumber(value)}`;
}

function formatSpendingUpdateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseSpendingJsonText(text) {
  try {
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON 格式错误，请检查逗号、引号和括号是否完整。');
    }
    throw error;
  }
}

function buildSpendingTemplateData() {
  return {
    schemaVersion: 1,
    fixedCounts: SPENDING_FIXED_PURCHASES.reduce((result, item) => {
      result[item.key] = 0;
      return result;
    }, {}),
    fixedUpdateTimes: SPENDING_FIXED_PURCHASES.reduce((result, item) => {
      result[item.key] = null;
      return result;
    }, {}),
    otherItems: [],
    incentiveItems: [],
  };
}

function normalizeSpendingData(raw) {
  const fixedCounts = {};
  const fixedUpdateTimes = {};
  SPENDING_FIXED_PURCHASES.forEach((item) => {
    fixedCounts[item.key] = normalizeCount(raw?.fixedCounts?.[item.key]);
    fixedUpdateTimes[item.key] = raw?.fixedUpdateTimes?.[item.key] ?? null;
  });

  const otherItems = Array.isArray(raw?.otherItems)
    ? raw.otherItems.map((item, index) => ({
      id: String(item?.id ?? `other-${index + 1}`),
      name: String(item?.name ?? '').trim(),
      amount: normalizeNonNegativeNumber(item?.amount),
      primogems: normalizeCount(item?.primogems),
      updateTime: item?.updateTime ?? null,
    })).filter((item) => item.name)
    : [];

  const incentiveItems = Array.isArray(raw?.incentiveItems)
    ? raw.incentiveItems.map((item, index) => ({
      id: String(item?.id ?? `incentive-${index + 1}`),
      name: String(item?.name ?? '').trim(),
      primogems: normalizeCount(item?.primogems),
      cost: normalizeFiniteNumber(item?.cost),
      updateTime: item?.updateTime ?? null,
    })).filter((item) => item.name)
    : [];

  return { schemaVersion: 1, fixedCounts, fixedUpdateTimes, otherItems, incentiveItems };
}

function validateAndNormalizeSpendingData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('JSON 根节点必须是对象。');
  if (Number(raw.schemaVersion) !== 1) throw new Error('当前氪金历史页仅支持 schemaVersion: 1 的 JSON。');
  return normalizeSpendingData(raw);
}

function buildSampleSpendingData() {
  const now = new Date().toISOString();
  return validateAndNormalizeSpendingData({
    schemaVersion: 1,
    fixedCounts: {
      welkinMoon: 12,
      gnosticHymn: 4,
      gnosticChorus: 1,
      firstTopUp: 1,
    },
    fixedUpdateTimes: {
      welkinMoon: now,
      gnosticHymn: now,
      gnosticChorus: now,
      firstTopUp: now,
    },
    otherItems: [
      { id: 'sample-other-1', name: '创世结晶补充', amount: 198, primogems: 1980, updateTime: now },
      { id: 'sample-other-2', name: '联动礼包', amount: 68, primogems: 680, updateTime: now },
    ],
    incentiveItems: [
      { id: 'sample-incentive-1', name: '平台活动返利', primogems: 3280, cost: 100, updateTime: now },
      { id: 'sample-incentive-2', name: '线下活动奖励', primogems: 1600, cost: 50, updateTime: now },
    ],
  });
}

function getSpendingData() {
  if (!currentSpendingData) currentSpendingData = buildSpendingTemplateData();
  return currentSpendingData;
}

function summarizeSpending() {
  const data = getSpendingData();
  const fixedTotal = SPENDING_FIXED_PURCHASES.reduce((sum, item) => {
    return sum + normalizeCount(data.fixedCounts[item.key]) * item.unitPrice;
  }, 0);
  const otherTotal = data.otherItems.reduce((sum, item) => sum + normalizeNonNegativeNumber(item.amount), 0);
  const otherPrimogems = data.otherItems.reduce((sum, item) => sum + normalizeCount(item.primogems), 0);
  const incentivePrimogems = data.incentiveItems.reduce((sum, item) => sum + normalizeCount(item.primogems), 0);
  const incentiveCost = data.incentiveItems.reduce((sum, item) => sum + normalizeFiniteNumber(item.cost), 0);
  const totalSpent = fixedTotal + otherTotal;
  const extraBalance = (otherPrimogems + incentivePrimogems) / 20 - otherTotal - incentiveCost;
  const extraBalancePrimogems = extraBalance * 20;
  return { fixedTotal, otherTotal, otherPrimogems, incentivePrimogems, incentiveCost, totalSpent, extraBalance, extraBalancePrimogems };
}

function buildSpendingRecordId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setSpendingSyncStatus(message, type = 'muted') {
  if (!syncStatus) return;
  syncStatus.textContent = message;
  syncStatus.dataset.type = type;
}

function syncSpendingActionButtonHighlight() {
  const hasData = Boolean(baselineSpendingData);
  uploadTrigger?.classList.toggle('is-highlighted', !hasData);
  downloadCurrentTrigger?.classList.toggle('is-highlighted', hasData);
  mobileDownloadCurrentTrigger?.classList.toggle('is-highlighted', hasData);
}

function updateSpendingCurrentFileLabel() {
  if (currentFileLabel) currentFileLabel.textContent = `当前数据：${currentSpendingFileName}`;
  syncSpendingActionButtonHighlight();
}

function updateSpendingDirtyIndicator() {
  if (dirtyIndicator) dirtyIndicator.hidden = !spendingDirty;
}

function checkSpendingStorageAvailability() {
  try {
    const key = '__gacha_history_spending_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}

function persistSpendingSnapshot() {
  if (!storageAvailable || !currentSpendingData) return;
  localStorage.setItem(SPENDING_STORAGE_KEY, JSON.stringify(currentSpendingData));
  localStorage.setItem(SPENDING_STORAGE_META_KEY, JSON.stringify({
    isDirty: spendingDirty,
    fileName: currentSpendingFileName,
  }));
}

function persistSpendingBaseline() {
  if (storageAvailable && baselineSpendingData) {
    localStorage.setItem(SPENDING_STORAGE_BASELINE_KEY, JSON.stringify(baselineSpendingData));
  }
}

function loadStoredSpendingData() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(SPENDING_STORAGE_KEY);
  return raw ? validateAndNormalizeSpendingData(JSON.parse(raw)) : null;
}

function loadStoredSpendingBaseline() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(SPENDING_STORAGE_BASELINE_KEY);
  return raw ? validateAndNormalizeSpendingData(JSON.parse(raw)) : null;
}

function loadStoredSpendingMeta() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(SPENDING_STORAGE_META_KEY);
  return raw ? JSON.parse(raw) : null;
}

function clearSpendingStorage() {
  if (!storageAvailable) return;
  localStorage.removeItem(SPENDING_STORAGE_KEY);
  localStorage.removeItem(SPENDING_STORAGE_META_KEY);
  localStorage.removeItem(SPENDING_STORAGE_BASELINE_KEY);
}

function markSpendingChanged() {
  spendingDirty = true;
  persistSpendingSnapshot();
  updateSpendingDirtyIndicator();
}

function formatSpendingExportDate(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function downloadSpendingJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function handleSpendingTemplateDownload() {
  downloadSpendingJsonFile(buildSpendingTemplateData(), 'spending-history.schema-v1.template.json');
  setSpendingSyncStatus('模板已下载。', 'success');
}

function handleSpendingExport() {
  downloadSpendingJsonFile(cloneSpendingData(getSpendingData()), `spending-history.${formatSpendingExportDate()}.json`);
  baselineSpendingData = cloneSpendingData(getSpendingData());
  currentSpendingFileName = '最近导出的数据';
  spendingDirty = false;
  persistSpendingBaseline();
  persistSpendingSnapshot();
  updateSpendingCurrentFileLabel();
  updateSpendingDirtyIndicator();
  setSpendingSyncStatus('导出完成。', 'success');
}

function handleSpendingClearLocalData() {
  if (!window.confirm('确定清空当前氪金历史页的本地数据吗？这不会删除你已经导出的 JSON 文件。')) return;
  currentSpendingData = buildSpendingTemplateData();
  baselineSpendingData = null;
  currentSpendingFileName = '未加载';
  spendingDirty = false;
  clearSpendingStorage();
  rerenderSpending();
  updateSpendingCurrentFileLabel();
  updateSpendingDirtyIndicator();
  setSpendingSyncStatus('已清空氪金历史页本地数据。', 'success');
}

function handleSpendingLoadSample() {
  currentSpendingData = buildSampleSpendingData();
  baselineSpendingData = cloneSpendingData(currentSpendingData);
  currentSpendingFileName = '内置示例数据';
  spendingDirty = false;
  persistSpendingBaseline();
  persistSpendingSnapshot();
  rerenderSpending();
  updateSpendingCurrentFileLabel();
  updateSpendingDirtyIndicator();
  setSpendingSyncStatus('已加载示例数据。', 'success');
}
