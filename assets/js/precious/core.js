const preciousSection = document.querySelector('#precious-section');
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
const preciousVersionDialog = document.querySelector('#precious-version-dialog');
const preciousVersionForm = document.querySelector('#precious-version-form');
const preciousVersionCancelBtn = document.querySelector('#precious-version-cancel');
const preciousVersionTitle = document.querySelector('#precious-version-title');
const preciousVersionLabelInput = document.querySelector('#precious-version-label-input');
const preciousVersionSortKeyInput = document.querySelector('#precious-version-sort-key-input');
const preciousVersionDeleteBtn = document.querySelector('#precious-version-delete');
const preciousIncomeDialog = document.querySelector('#precious-income-dialog');
const preciousIncomeForm = document.querySelector('#precious-income-form');
const preciousIncomeCancelBtn = document.querySelector('#precious-income-cancel');
const preciousIncomeDeleteBtn = document.querySelector('#precious-income-delete');
const preciousIncomeTitle = document.querySelector('#precious-income-title');
const preciousIncomeMaterialInput = document.querySelector('#precious-income-material-input');
const preciousIncomeSourceInput = document.querySelector('#precious-income-source-input');
const preciousIncomeModeFields = document.querySelector('#precious-income-mode-fields');
const preciousIncomeNoteInput = document.querySelector('#precious-income-note-input');
const preciousExpenseDialog = document.querySelector('#precious-expense-dialog');
const preciousExpenseForm = document.querySelector('#precious-expense-form');
const preciousExpenseCancelBtn = document.querySelector('#precious-expense-cancel');
const preciousExpenseDeleteBtn = document.querySelector('#precious-expense-delete');
const preciousExpenseTitle = document.querySelector('#precious-expense-title');
const preciousExpenseMaterialInput = document.querySelector('#precious-expense-material-input');
const preciousExpenseAmountInput = document.querySelector('#precious-expense-amount-input');
const preciousExpenseVersionTrigger = document.querySelector('#precious-expense-version-trigger');
const preciousExpenseVersionTriggerText = document.querySelector('#precious-expense-version-trigger-text');
const preciousExpenseSetNameInput = document.querySelector('#precious-expense-set-name-input');
const preciousExpenseSlotInput = document.querySelector('#precious-expense-slot-input');
const preciousExpenseMainStatInput = document.querySelector('#precious-expense-main-stat-input');
const preciousExpenseNoteInput = document.querySelector('#precious-expense-note-input');
const versionPickerDialog = document.querySelector('#version-picker-dialog');
const versionPickerDialogTitle = document.querySelector('#version-picker-dialog-title');
const versionPickerDialogClose = document.querySelector('#version-picker-dialog-close');
const versionPickerGroupList = document.querySelector('#version-picker-group-list');
const versionPickerVersionList = document.querySelector('#version-picker-version-list');
const versionPickerSelectShell = document.querySelector('#version-picker-select-shell');
const versionPickerEditShell = document.querySelector('#version-picker-edit-shell');
const versionPickerEditorLabel = document.querySelector('#version-picker-editor-label');
const versionPickerEditorInput = document.querySelector('#version-picker-editor-input');
const versionPickerEditorSave = document.querySelector('#version-picker-editor-save');
const versionPickerEditorHint = document.querySelector('#version-picker-editor-hint');
const versionPickerEditList = document.querySelector('#version-picker-edit-list');

const PRECIOUS_STORAGE_KEY = 'gachaHistory.preciousOnly.data.v8';
const PRECIOUS_STORAGE_META_KEY = 'gachaHistory.preciousOnly.meta.v8';
const PRECIOUS_STORAGE_BASELINE_KEY = 'gachaHistory.preciousOnly.baseline.v8';
const PRECIOUS_MATERIALS = [
  { key: 'sanctifyingUnction', label: '祝圣之霜' },
  { key: 'sanctifyingEssence', label: '启圣之尘' },
];
const PRECIOUS_VERSION_INCOME_SOURCE_OPTIONS = {
  sanctifyingUnction: [
    { key: 'extraction', label: '萃取' },
    { key: 'bp', label: '纪行' },
  ],
  sanctifyingEssence: [
    { key: 'nether', label: '幽境' },
    { key: 'bp', label: '纪行' },
  ],
};
const PRECIOUS_OTHER_INCOME_SOURCE_OPTIONS = {
  sanctifyingUnction: ['剧诗', '砺行修远', '地区探索', '庆典', '其他'],
  sanctifyingEssence: ['砺行修远', '地区探索', '庆典', '其他'],
};
const PRECIOUS_INCOME_SOURCE_SORT_ORDER = ['extraction', 'nether', '剧诗', '地区探索', 'bp', '砺行修远', '庆典', '其他'];
const PRECIOUS_VERSION_GROUPS = {
  '5.x': [
    { label: '5.0', sortKey: '5.0' },
    { label: '5.1', sortKey: '5.1' },
    { label: '5.2', sortKey: '5.2' },
    { label: '5.3', sortKey: '5.3' },
    { label: '5.4', sortKey: '5.4' },
    { label: '5.5', sortKey: '5.5' },
    { label: '5.6', sortKey: '5.6' },
    { label: '5.7', sortKey: '5.7' },
    { label: '5.8', sortKey: '5.8' },
  ],
  '6.x': [
    { label: '月之一', sortKey: '6.0' },
    { label: '月之二', sortKey: '6.1' },
    { label: '月之三', sortKey: '6.2' },
    { label: '月之四', sortKey: '6.3' },
    { label: '月之五', sortKey: '6.4' },
    { label: '月之六', sortKey: '6.5' },
  ],
};
const ARTIFACT_SLOT_OPTIONS = ['生之花', '死之羽', '时之沙', '空之杯', '理之冠'];
const ARTIFACT_MAIN_STATS_BY_SLOT = {
  生之花: ['生命'],
  死之羽: ['攻击'],
  时之沙: ['攻击', '防御', '生命', '精通', '充能'],
  空之杯: ['攻击', '防御', '生命', '精通', '水伤', '火伤', '雷伤', '冰伤', '风伤', '岩伤', '草伤', '物理'],
  理之冠: ['攻击', '防御', '生命', '精通', '暴击', '爆伤', '治疗'],
};
const EXPENSE_AMOUNT_BY_MATERIAL_AND_SLOT = {
  sanctifyingUnction: { 生之花: 1, 死之羽: 1, 时之沙: 2, 空之杯: 4, 理之冠: 3 },
  sanctifyingEssence: { 生之花: 1, 死之羽: 1, 时之沙: 2, 空之杯: 2, 理之冠: 2 },
};

let storageAvailable = true;
let currentPreciousData = null;
let baselinePreciousData = null;
let currentPreciousFileName = '未加载';
let preciousDirty = false;
let preciousVersionEditing = null;
let preciousIncomeEditing = null;
let preciousExpenseEditing = null;
let preciousIncomeSelection = { group: '', versionId: '' };
let preciousExpenseSelection = { group: '', versionId: '' };
let activeVersionPickerTarget = null;
let versionPickerMode = 'select';
let draftIncomeVersionEntries = [];
let preciousExpensePageByMaterial = {};
let preciousMobilePanelByMaterial = {};
const PRECIOUS_EXPENSE_PAGE_SIZE = 15;

function fmt(n) { return new Intl.NumberFormat('zh-CN').format(n ?? 0); }
function inferVersionGroup(sortKey, label = '') {
  const first = String(sortKey ?? label ?? '').trim().split('.')[0];
  if (first) return `${first}.x`;
  return '未分组';
}
function compareVersionGroup(a, b) {
  const av = String(a ?? '').split('.').map((part) => Number(part) || 0);
  const bv = String(b ?? '').split('.').map((part) => Number(part) || 0);
  const length = Math.max(av.length, bv.length);
  for (let i = 0; i < length; i += 1) {
    const left = av[i] ?? 0;
    const right = bv[i] ?? 0;
    if (left !== right) return left - right;
  }
  return 0;
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
function syncActionButtonHighlight() {
  const hasData = Boolean(baselinePreciousData);
  uploadTrigger?.classList.toggle('is-highlighted', !hasData);
  downloadCurrentTrigger?.classList.toggle('is-highlighted', hasData);
  mobileDownloadCurrentTrigger?.classList.toggle('is-highlighted', hasData);
}
function updateCurrentFileLabel() {
  if (currentFileLabel) currentFileLabel.textContent = `当前数据：${currentPreciousFileName}`;
  syncActionButtonHighlight();
}
function updateDirtyIndicator() {
  if (dirtyIndicator) dirtyIndicator.hidden = !preciousDirty;
}
function syncBodyDialogState() {
  const dialogs = [preciousVersionDialog, preciousIncomeDialog, preciousExpenseDialog, versionPickerDialog];
  document.body.classList.toggle('dialog-open', dialogs.some((dialog) => Boolean(dialog?.open)));
}
function closePreciousVersionDialog() { if (!preciousVersionDialog?.open) return; preciousVersionDialog.close(); syncBodyDialogState(); preciousVersionEditing = null; }
function closePreciousIncomeDialog() { if (!preciousIncomeDialog?.open) return; preciousIncomeDialog.close(); syncBodyDialogState(); preciousIncomeEditing = null; draftIncomeVersionEntries = []; }
function closePreciousExpenseDialog() { if (!preciousExpenseDialog?.open) return; preciousExpenseDialog.close(); syncBodyDialogState(); preciousExpenseEditing = null; }
function checkStorageAvailability() {
  try {
    const key = '__gacha_history_precious_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
}
function cloneData(data) { return JSON.parse(JSON.stringify(data)); }
function buildDefaultPreciousVersions() {
  const versions = [];
  Object.entries(PRECIOUS_VERSION_GROUPS).forEach(([groupName, items], groupIndex) => {
    items.forEach((item, index) => {
      versions.push({ id: `default-version-${groupIndex + 1}-${index + 1}`, label: item.label, sortKey: item.sortKey, group: groupName });
    });
  });
  return versions;
}
function buildMaterialTemplate(materialKey) {
  return {
    versionIncomeSources: cloneData(PRECIOUS_VERSION_INCOME_SOURCE_OPTIONS[materialKey] ?? []),
    versionIncomeRecords: [],
    otherIncomes: [],
    expenses: [],
    expenseSetOptions: [],
  };
}
function buildPreciousTemplateData() {
  return {
    schemaVersion: 1,
    versions: buildDefaultPreciousVersions(),
    materials: {
      sanctifyingUnction: buildMaterialTemplate('sanctifyingUnction'),
      sanctifyingEssence: buildMaterialTemplate('sanctifyingEssence'),
    },
  };
}
function normalizeVersionIncomeSourceList(materialKey, list) {
  const defaults = PRECIOUS_VERSION_INCOME_SOURCE_OPTIONS[materialKey] ?? [];
  const base = Array.isArray(list) ? list : defaults;
  const mapped = base.map((item, index) => {
    if (!item) return null;
    if (typeof item === 'string') {
      const value = item.trim();
      if (!value) return null;
      return { key: value, label: value };
    }
    const key = String(item.key ?? item.label ?? `source-${index + 1}`).trim();
    const label = String(item.label ?? item.key ?? `来源 ${index + 1}`).trim();
    if (!key || !label) return null;
    return { key, label };
  }).filter(Boolean);
  return [...defaults, ...mapped].reduce((acc, item) => {
    if (!acc.some((existing) => existing.key === item.key)) acc.push(item);
    return acc;
  }, []);
}
function normalizeVersionEntries(entries) {
  return Array.isArray(entries)
    ? entries.map((item) => ({ versionId: String(item?.versionId ?? '').trim(), amount: Number(item?.amount ?? 0) })).filter((item) => item.versionId)
    : [];
}
function normalizeOtherIncomes(list, materialKey) {
  return Array.isArray(list)
    ? list.map((item, index) => ({
      id: String(item?.id ?? `${materialKey}-other-income-${index + 1}`),
      source: String(item?.source ?? '').trim(),
      cycleLabel: String(item?.cycleLabel ?? '').trim(),
      amount: Number(item?.amount ?? 0),
      note: item?.note ?? '',
      updateTime: item?.updateTime ?? null,
    })).filter((item) => item.source)
    : [];
}
function normalizeExpenses(list, materialKey) {
  return Array.isArray(list)
    ? list.map((item, index) => ({
      id: String(item?.id ?? `${materialKey}-expense-${index + 1}`),
      versionId: String(item?.versionId ?? ''),
      amount: Number(item?.amount ?? 0),
      setName: item?.setName ?? '',
      slot: item?.slot ?? '生之花',
      mainStat: item?.mainStat ?? '生命',
      note: item?.note ?? '',
      updateTime: item?.updateTime ?? null,
    }))
    : [];
}
function normalizeExpenseSetOptions(list, materialKey, expenses = []) {
  const fromList = Array.isArray(list) ? list : [];
  const fromExpenses = Array.isArray(expenses) ? expenses.map((item) => item?.setName).filter(Boolean) : [];
  return [...new Set([...fromList, ...fromExpenses].map((item) => String(item).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}
function normalizePreciousResources(raw) {
  const versions = Array.isArray(raw?.versions)
    ? raw.versions.map((item, index) => ({
      id: String(item?.id ?? `version-${index + 1}`),
      label: String(item?.label ?? '').trim() || `未命名版本 ${index + 1}`,
      sortKey: String(item?.sortKey ?? '').trim() || String(item?.label ?? '').trim() || null,
      group: String(item?.group ?? '').trim() || inferVersionGroup(item?.sortKey, item?.label),
    }))
    : buildDefaultPreciousVersions();
  const materials = {};
  PRECIOUS_MATERIALS.forEach((material) => {
    const source = raw?.materials?.[material.key] ?? {};
    materials[material.key] = {
      versionIncomeSources: normalizeVersionIncomeSourceList(material.key, source.versionIncomeSources),
      versionIncomeRecords: Array.isArray(source.versionIncomeRecords)
        ? source.versionIncomeRecords.map((item, index) => ({
          id: String(item?.id ?? `${material.key}-version-income-${index + 1}`),
          sourceKey: String(item?.sourceKey ?? '').trim(),
          note: item?.note ?? '',
          updateTime: item?.updateTime ?? null,
          entries: normalizeVersionEntries(item?.entries),
        })).filter((item) => item.sourceKey)
        : [],
      otherIncomes: normalizeOtherIncomes(source.otherIncomes, material.key),
      expenses: normalizeExpenses(source.expenses, material.key),
      expenseSetOptions: normalizeExpenseSetOptions(source.expenseSetOptions, material.key, source.expenses),
    };
  });
  return { schemaVersion: 1, versions, materials };
}
function validateAndNormalizePreciousData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('JSON 根节点必须是对象。');
  if (Number(raw.schemaVersion) !== 1) throw new Error('当前贵重资源页仅支持 schemaVersion: 1 的 JSON。');
  return normalizePreciousResources(raw);
}
function buildSamplePreciousData() {
  const now = new Date().toISOString();
  return validateAndNormalizePreciousData({
    schemaVersion: 1,
    versions: buildDefaultPreciousVersions(),
    materials: {
      sanctifyingUnction: {
        versionIncomeSources: [{ key: 'extraction', label: '萃取' }, { key: 'bp', label: '纪行' }],
        versionIncomeRecords: [
          { id: 'sample-unction-version-extraction', sourceKey: 'extraction', note: '版本周期来源示例', updateTime: now, entries: [{ versionId: 'default-version-1-6', amount: 2 }, { versionId: 'default-version-1-7', amount: 2 }] },
        ],
        otherIncomes: [{ id: 'sample-unction-other-1', source: '其他', cycleLabel: '补发', amount: 1, note: '示例', updateTime: now }],
        expenses: [],
      },
      sanctifyingEssence: {
        versionIncomeSources: [{ key: 'nether', label: '幽境' }, { key: 'bp', label: '纪行' }],
        versionIncomeRecords: [],
        otherIncomes: [{ id: 'sample-essence-other-1', source: '其他', cycleLabel: '一次性获取', amount: 2, note: '', updateTime: now }],
        expenses: [{ id: 'sample-expense-1', versionId: 'default-version-1-7', amount: 2, setName: '逐影猎人', slot: '理之冠', mainStat: '暴击', note: '测试示例', updateTime: now }],
      },
    },
  });
}
function ensurePreciousData() { if (!currentPreciousData) currentPreciousData = buildPreciousTemplateData(); return currentPreciousData; }
function getPreciousData() { return ensurePreciousData(); }
function getPreciousMaterialData(materialKey) { return getPreciousData().materials[materialKey]; }
function getMaterialLabel(materialKey) { return PRECIOUS_MATERIALS.find((item) => item.key === materialKey)?.label ?? materialKey; }
function getVersionMap() { return new Map(getPreciousData().versions.map((item) => [item.id, item])); }
function getVersionLabel(versionId) { return getVersionMap().get(versionId)?.label ?? '未分组'; }
function sortVersions(list) { return list.slice().sort((a, b) => compareVersionGroup(a.sortKey, b.sortKey) || a.label.localeCompare(b.label, 'zh-CN')); }
function getVersionIncomeSourceOptions(materialKey) { return getPreciousMaterialData(materialKey).versionIncomeSources || []; }
function getVersionIncomeSourceLabel(materialKey, sourceKey) { return getVersionIncomeSourceOptions(materialKey).find((item) => item.key === sourceKey)?.label ?? sourceKey; }
function getIncomeSourceSortIndex(sourceValue) {
  const index = PRECIOUS_INCOME_SOURCE_SORT_ORDER.indexOf(sourceValue);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}
function getAvailableVersionIncomeSourceOptions(materialKey, editingRecordId = null) {
  const usedSourceKeys = new Set(
    getPreciousMaterialData(materialKey).versionIncomeRecords
      .filter((record) => record.id !== editingRecordId)
      .map((record) => record.sourceKey),
  );
  return getVersionIncomeSourceOptions(materialKey)
    .filter((item) => !usedSourceKeys.has(item.key))
    .sort((a, b) => getIncomeSourceSortIndex(a.key) - getIncomeSourceSortIndex(b.key) || a.label.localeCompare(b.label, 'zh-CN'));
}
function getIncomeSourceMode(materialKey, sourceValue) {
  const versionSource = getVersionIncomeSourceOptions(materialKey).some((item) => item.key === sourceValue);
  return versionSource ? 'version' : 'other';
}
function getIncomeCycleLabel(materialKey, sourceValue, record) {
  return getIncomeSourceMode(materialKey, sourceValue) === 'version' ? '版本' : (record?.cycleLabel || '—');
}
function summarizeMaterial(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const incomeTotal = material.versionIncomeRecords.reduce((sum, record) => sum + record.entries.reduce((inner, entry) => inner + (Number(entry.amount) || 0), 0), 0)
    + material.otherIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const expenseTotal = material.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  return { incomeTotal, expenseTotal, balance: incomeTotal - expenseTotal };
}
function persistPreciousSnapshot() {
  if (!storageAvailable || !currentPreciousData) return;
  localStorage.setItem(PRECIOUS_STORAGE_KEY, JSON.stringify(currentPreciousData));
  localStorage.setItem(PRECIOUS_STORAGE_META_KEY, JSON.stringify({ isDirty: preciousDirty, fileName: currentPreciousFileName }));
}
function persistPreciousBaseline() { if (storageAvailable && baselinePreciousData) localStorage.setItem(PRECIOUS_STORAGE_BASELINE_KEY, JSON.stringify(baselinePreciousData)); }
function loadStoredPreciousData() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(PRECIOUS_STORAGE_KEY);
  return raw ? validateAndNormalizePreciousData(JSON.parse(raw)) : null;
}
function loadStoredPreciousBaseline() {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(PRECIOUS_STORAGE_BASELINE_KEY);
  return raw ? validateAndNormalizePreciousData(JSON.parse(raw)) : null;
}
function loadStoredMeta(key) {
  if (!storageAvailable) return null;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
function formatExportDate(date = new Date()) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}
function clearPreciousStorage() {
  if (!storageAvailable) return;
  localStorage.removeItem(PRECIOUS_STORAGE_KEY);
  localStorage.removeItem(PRECIOUS_STORAGE_META_KEY);
  localStorage.removeItem(PRECIOUS_STORAGE_BASELINE_KEY);
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
function handleTemplateDownload() { downloadJsonFile(buildPreciousTemplateData(), 'precious-resources.schema-v1.template.json'); setSyncStatus('模板已下载。', 'success'); }
function handleExport() { downloadJsonFile(cloneData(getPreciousData()), `precious-resources.${formatExportDate()}.json`); preciousDirty = false; persistPreciousSnapshot(); updateDirtyIndicator(); setSyncStatus('导出完成。', 'success'); }
function handleClearLocalData() {
  if (!window.confirm('确定清空当前贵重资源页的本地数据吗？这不会删除你已经导出的 JSON 文件。')) return;
  currentPreciousData = buildPreciousTemplateData(); baselinePreciousData = null; currentPreciousFileName = '未加载'; preciousDirty = false; clearPreciousStorage(); rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator(); setSyncStatus('已清空贵重资源页本地数据。', 'success');
}
function handleLoadSample() {
  currentPreciousData = buildSamplePreciousData(); baselinePreciousData = cloneData(currentPreciousData); currentPreciousFileName = '内置示例数据'; preciousDirty = false; persistPreciousBaseline(); persistPreciousSnapshot(); rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator(); setSyncStatus('已加载示例数据。', 'success');
}
