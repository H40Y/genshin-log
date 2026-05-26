const preciousSection = document.querySelector('#precious-section');
const syncStatus = document.querySelector('#sync-status');
const uploadInput = document.querySelector('#upload-input');
const uploadTrigger = document.querySelector('#upload-trigger');
const downloadTemplateTrigger = document.querySelector('#download-template');
const downloadCurrentTrigger = document.querySelector('#download-current');
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
function buildPreciousRecordId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function groupVersionsForDisplay() {
  const grouped = new Map();
  sortVersions(getPreciousData().versions).forEach((version) => {
    const key = version.group || inferVersionGroup(version.sortKey, version.label);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(version);
  });
  return [...grouped.entries()].sort((a, b) => Number(String(a[0]).match(/^\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER) - Number(String(b[0]).match(/^\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER));
}
function getVersionGroups() { return groupVersionsForDisplay(); }
function getLatestExpenseVersionId(materialKey) {
  const expenses = getPreciousMaterialData(materialKey).expenses || [];
  if (expenses.length) {
    const latestExpense = expenses
      .slice()
      .sort((a, b) => compareVersionGroup(getVersionMap().get(a.versionId)?.sortKey, getVersionMap().get(b.versionId)?.sortKey))[expenses.length - 1];
    if (latestExpense?.versionId) return latestExpense.versionId;
  }
  const versions = sortVersions(getPreciousData().versions);
  return versions[versions.length - 1]?.id ?? '';
}
function groupExpensesByVersion(expenses) {
  const grouped = new Map();
  expenses.forEach((item) => { const key = item.versionId || 'unassigned'; if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(item); });
  return [...grouped.entries()].sort((a, b) => compareVersionGroup(getVersionMap().get(a[0])?.sortKey, getVersionMap().get(b[0])?.sortKey));
}
function paginateExpenseGroups(groups, pageSize = PRECIOUS_EXPENSE_PAGE_SIZE) {
  if (!groups.length) return [];
  const pages = [];
  let currentPage = [];
  let currentCount = 0;
  groups.forEach((group) => {
    const groupCount = group[1].length;
    if (!currentPage.length) {
      currentPage.push(group);
      currentCount = groupCount;
      return;
    }
    if (currentCount + groupCount <= pageSize) {
      currentPage.push(group);
      currentCount += groupCount;
      return;
    }
    pages.push(currentPage);
    currentPage = [group];
    currentCount = groupCount;
  });
  if (currentPage.length) pages.push(currentPage);
  return pages;
}
function getExpensePage(materialKey, totalPages) {
  const currentPage = preciousExpensePageByMaterial[materialKey] ?? totalPages;
  return Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
}
function setExpensePage(materialKey, page) {
  preciousExpensePageByMaterial[materialKey] = page;
  rerenderPrecious();
}
function collectIncomeItems(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  return [
    ...material.versionIncomeRecords.map((record) => ({ id: record.id, type: 'version', sourceLabel: getVersionIncomeSourceLabel(materialKey, record.sourceKey), cycleLabel: getIncomeCycleLabel(materialKey, record.sourceKey, record), amount: record.entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0), note: record.note ?? '', detail: `${fmt(record.entries.length)} 个版本` })),
    ...material.otherIncomes.map((record) => ({ id: record.id, type: 'other', sourceLabel: record.source, cycleLabel: getIncomeCycleLabel(materialKey, record.source, record), amount: record.amount, note: record.note ?? '', detail: '' })),
  ].sort((a, b) => getIncomeSourceSortIndex(a.type === 'version' ? getPreciousMaterialData(materialKey).versionIncomeRecords.find((record) => record.id === a.id)?.sourceKey : a.sourceLabel) - getIncomeSourceSortIndex(b.type === 'version' ? getPreciousMaterialData(materialKey).versionIncomeRecords.find((record) => record.id === b.id)?.sourceKey : b.sourceLabel) || a.sourceLabel.localeCompare(b.sourceLabel, 'zh-CN'));
}
function createIconButton(title, onClick) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'icon-button'; button.textContent = '+'; button.title = title; button.setAttribute('aria-label', title); button.addEventListener('click', onClick); return button;
}
function createBlockHeader(title, summary, addTitle, onAdd) {
  const header = document.createElement('div'); header.className = 'block-header';
  const left = document.createElement('div'); left.className = 'block-header-left';
  const h3 = document.createElement('h3'); h3.textContent = title; left.appendChild(h3);
  if (summary) { const badge = document.createElement('div'); badge.className = 'history-summary'; badge.textContent = summary; left.appendChild(badge); }
  const right = document.createElement('div'); if (onAdd) right.appendChild(createIconButton(addTitle, onAdd));
  header.append(left, right); return header;
}
function buildPreciousStatCard(materialKey) {
  const node = document.createElement('article'); node.className = 'card precious-stat-card';
  const summary = summarizeMaterial(materialKey);
  node.innerHTML = `<div class="precious-stat-title">${getMaterialLabel(materialKey)}</div>`;
  const grid = document.createElement('div'); grid.className = 'precious-stat-grid';
  grid.append(createMetaBox('总收入', fmt(summary.incomeTotal)), createMetaBox('总支出', fmt(summary.expenseTotal)), createMetaBox('当前结余', fmt(summary.balance)));
  node.appendChild(grid); return node;
}
function buildVersionsCard() {
  const versionCard = document.createElement('article'); versionCard.className = 'card versions-card-muted';
  versionCard.appendChild(createBlockHeader('记录版本', `${fmt(getPreciousData().versions.length)} 个版本`, '修改版本', openCreatePreciousVersionDialog));
  groupVersionsForDisplay().forEach(([groupName, versions]) => {
    const details = document.createElement('details'); details.className = 'version-group-details';
    const summary = document.createElement('summary'); summary.textContent = `${groupName} · ${fmt(versions.length)} 个版本`; details.appendChild(summary);
    const list = document.createElement('div'); list.className = 'version-chip-list';
    versions.forEach((version) => {
      const row = document.createElement('div'); row.className = 'version-chip'; row.innerHTML = `<span>${version.label}</span>`;
      const editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'ghost-button compact-button'; editBtn.textContent = '修改'; editBtn.addEventListener('click', () => openEditPreciousVersionDialog(version.id)); row.appendChild(editBtn); list.appendChild(row);
    });
    details.appendChild(list); versionCard.appendChild(details);
  });
  return versionCard;
}
function buildPreciousIncomeSubBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const groups = [
    ...material.versionIncomeRecords.map((record) => ({
      id: record.id,
      type: 'version',
      title: getVersionIncomeSourceLabel(materialKey, record.sourceKey),
      items: [{
        id: record.id,
        type: 'version',
        sourceLabel: getVersionIncomeSourceLabel(materialKey, record.sourceKey),
        cycleLabel: getIncomeCycleLabel(materialKey, record.sourceKey, record),
        amount: record.entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
        note: record.note ?? '',
      }],
    })),
    ...material.otherIncomes.reduce((acc, record) => {
      const existing = acc.find((group) => group.title === record.source);
      const item = {
        id: record.id,
        type: 'other',
        sourceLabel: record.source,
        cycleLabel: getIncomeCycleLabel(materialKey, record.source, record),
        amount: record.amount,
        note: record.note ?? '',
      };
      if (existing) existing.items.push(item);
      else acc.push({ id: `group-${record.source}`, type: 'other-group', title: record.source, items: [item] });
      return acc;
    }, []),
  ].sort((a, b) => getIncomeSourceSortIndex(a.type === 'version' ? material.versionIncomeRecords.find((record) => record.id === a.id)?.sourceKey : a.title) - getIncomeSourceSortIndex(b.type === 'version' ? material.versionIncomeRecords.find((record) => record.id === b.id)?.sourceKey : b.title) || a.title.localeCompare(b.title, 'zh-CN'));
  const totalAmount = groups.reduce((sum, group) => sum + group.items.reduce((inner, item) => inner + (Number(item.amount) || 0), 0), 0);
  const card = document.createElement('section'); card.className = 'subcard';
  card.appendChild(createBlockHeader('收入', `${fmt(totalAmount)} 个`, `新增${getMaterialLabel(materialKey)}收入`, () => openCreatePreciousIncomeDialog(materialKey)));
  if (!groups.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '暂无收入记录'; card.appendChild(note); return card; }
  groups.forEach((group) => {
    const section = document.createElement('div'); section.className = 'nested-group';
    const groupAmount = group.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const title = document.createElement('div'); title.className = 'nested-group-title'; title.textContent = `${group.title} · ${fmt(groupAmount)} 个`; section.appendChild(title);
    const tableWrap = document.createElement('div'); tableWrap.className = 'table-wrap';
    const table = document.createElement('table'); table.innerHTML = '<thead><tr><th>周期</th><th>数量</th><th>备注</th><th>操作</th></tr></thead>';
    const tbody = document.createElement('tbody');
    group.items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.cycleLabel}</td><td>${fmt(item.amount)}</td><td>${item.note || '—'}</td><td><button class="table-button compact-button" data-action="edit-income" data-material="${materialKey}" data-record-id="${item.id}" data-record-type="${item.type}">修改</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); tableWrap.appendChild(table); section.appendChild(tableWrap); card.appendChild(section);
  });
  card.querySelectorAll('[data-action="edit-income"]').forEach((button) => button.addEventListener('click', () => openEditPreciousIncomeDialog(button.dataset.material, button.dataset.recordType, button.dataset.recordId)));
  return card;
}
function buildPreciousExpenseSubBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const totalAmount = material.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const card = document.createElement('section'); card.className = 'subcard';
  card.appendChild(createBlockHeader('支出', `${fmt(totalAmount)} 个`, `新增${getMaterialLabel(materialKey)}支出`, () => openCreatePreciousExpenseDialog(materialKey)));
  if (!getPreciousData().versions.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '先新增版本分组，再录入支出。'; card.appendChild(note); return card; }
  if (!material.expenses.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '暂无支出记录'; card.appendChild(note); return card; }
  const groupedExpenses = groupExpensesByVersion(material.expenses);
  const pages = paginateExpenseGroups(groupedExpenses);
  const totalPages = pages.length;
  const currentPage = getExpensePage(materialKey, totalPages);
  const currentGroups = pages[currentPage - 1] || [];
  currentGroups.forEach(([versionId, items]) => {
    const group = document.createElement('div'); group.className = 'nested-group';
    const groupAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const title = document.createElement('div'); title.className = 'nested-group-title'; title.textContent = `${getVersionLabel(versionId)} · ${fmt(groupAmount)} 个`; group.appendChild(title);
    const tableWrap = document.createElement('div'); tableWrap.className = 'table-wrap';
    const table = document.createElement('table'); table.innerHTML = '<thead><tr><th>数量</th><th>套装</th><th>部位</th><th>属性</th><th>备注</th><th>操作</th></tr></thead>';
    const tbody = document.createElement('tbody');
    items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmt(item.amount)}</td><td>${item.setName}</td><td>${item.slot}</td><td>${item.mainStat}</td><td>${item.note || '—'}</td><td><button class="table-button compact-button" data-action="edit-expense" data-material="${materialKey}" data-record-id="${item.id}">修改</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); tableWrap.appendChild(table); group.appendChild(tableWrap); card.appendChild(group);
  });
  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination-row';
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'ghost-button compact-button';
      prevBtn.textContent = '上一页';
      prevBtn.addEventListener('click', () => setExpensePage(materialKey, currentPage - 1));
      pagination.appendChild(prevBtn);
    }
    const pageInfo = document.createElement('div');
    pageInfo.className = 'history-summary';
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    pagination.appendChild(pageInfo);
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'ghost-button compact-button';
      nextBtn.textContent = '下一页';
      nextBtn.addEventListener('click', () => setExpensePage(materialKey, currentPage + 1));
      pagination.appendChild(nextBtn);
    }
    card.appendChild(pagination);
  }
  card.querySelectorAll('[data-action="edit-expense"]').forEach((button) => button.addEventListener('click', () => openEditPreciousExpenseDialog(button.dataset.material, button.dataset.recordId)));
  return card;
}
function buildPreciousMaterialBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const incomeAmount = material.versionIncomeRecords.reduce((sum, record) => sum + record.entries.reduce((inner, entry) => inner + (Number(entry.amount) || 0), 0), 0)
    + material.otherIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const expenseAmount = material.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const block = document.createElement('article'); block.className = 'card precious-material-block';
  block.appendChild(createBlockHeader(getMaterialLabel(materialKey)));
  const grid = document.createElement('div'); grid.className = 'grid cards-2 precious-material-grid';
  grid.appendChild(buildPreciousIncomeSubBlock(materialKey)); grid.appendChild(buildPreciousExpenseSubBlock(materialKey)); block.appendChild(grid); return block;
}
function getVersionDisplayText(selectionState) { const version = getVersionMap().get(selectionState?.versionId); return version ? version.label : '请选择版本'; }
function syncVersionTriggerText() { if (preciousExpenseVersionTriggerText) preciousExpenseVersionTriggerText.textContent = getVersionDisplayText(preciousExpenseSelection); }
function closeVersionPickerDialog() { if (!versionPickerDialog?.open) return; versionPickerDialog.close(); activeVersionPickerTarget = null; versionPickerMode = 'select'; syncBodyDialogState(); }
function openVersionPickerDialog(target) {
  activeVersionPickerTarget = target;
  versionPickerMode = target === 'income' ? 'edit' : 'select';
  versionPickerDialogTitle.textContent = target === 'income' ? '编辑版本数量' : '选择版本';
  versionPickerSelectShell.hidden = false;
  versionPickerEditShell.hidden = versionPickerMode !== 'edit';
  const selectionState = target === 'income' ? preciousIncomeSelection : preciousExpenseSelection;
  renderCascadePicker(versionPickerGroupList, versionPickerVersionList, selectionState);
  syncVersionPickerEditShell();
  versionPickerDialog.showModal();
  syncBodyDialogState();
}
function renderCascadePicker(groupContainer, versionContainer, selectionState) {
  const groups = getVersionGroups();
  if (!selectionState.group) selectionState.group = groups[0]?.[0] ?? '';
  const currentGroupEntry = groups.find(([name]) => name === selectionState.group) || groups[0];
  if (currentGroupEntry && !currentGroupEntry[1].some((item) => item.id === selectionState.versionId)) selectionState.versionId = currentGroupEntry[1][0]?.id ?? '';
  groupContainer.innerHTML = '';
  groups.forEach(([groupName]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = selectionState.group === groupName ? 'cascade-item is-active' : 'cascade-item';
    button.textContent = groupName;
    button.addEventListener('click', () => {
      selectionState.group = groupName;
      selectionState.versionId = '';
      renderCascadePicker(groupContainer, versionContainer, selectionState);
      if (versionPickerMode === 'select') syncVersionTriggerText();
      else syncVersionPickerEditShell();
    });
    groupContainer.appendChild(button);
  });
  const activeGroup = groups.find(([name]) => name === selectionState.group) || currentGroupEntry;
  versionContainer.innerHTML = '';
  (activeGroup?.[1] || []).forEach((version) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = selectionState.versionId === version.id ? 'cascade-item is-active' : 'cascade-item';
    button.textContent = version.label;
    button.addEventListener('click', () => {
      selectionState.versionId = version.id;
      renderCascadePicker(groupContainer, versionContainer, selectionState);
      if (versionPickerMode === 'select') { syncVersionTriggerText(); closeVersionPickerDialog(); }
      else syncVersionPickerEditShell();
    });
    versionContainer.appendChild(button);
  });
  selectionState.group = activeGroup?.[0] || '';
  selectionState.versionId = selectionState.versionId || activeGroup?.[1]?.[0]?.id || '';
}
function syncVersionPickerEditShell() {
  if (versionPickerMode !== 'edit') return;
  versionPickerEditorLabel.textContent = `数量（${getVersionDisplayText(preciousIncomeSelection)}）`;
  const entry = draftIncomeVersionEntries.find((item) => item.versionId === preciousIncomeSelection.versionId);
  versionPickerEditorInput.value = Number.isFinite(entry?.amount) ? String(entry.amount) : '';
  versionPickerEditorHint.textContent = '';
  renderVersionPickerEditList();
}
function renderVersionPickerEditList() {
  if (versionPickerMode !== 'edit') return;
  versionPickerEditList.innerHTML = '';
  if (!draftIncomeVersionEntries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '尚未录入任何版本数量';
    versionPickerEditList.appendChild(empty);
    return;
  }
  draftIncomeVersionEntries.slice().sort((a, b) => compareVersionGroup(getVersionMap().get(a.versionId)?.sortKey, getVersionMap().get(b.versionId)?.sortKey)).forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'version-entry-chip compact-chip';
    row.innerHTML = `<span>${getVersionLabel(entry.versionId)}·${fmt(entry.amount)}</span>`;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'chip-close-button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      draftIncomeVersionEntries = draftIncomeVersionEntries.filter((item) => item.versionId !== entry.versionId);
      renderVersionPickerEditList();
      syncIncomeVersionSummary();
    });
    row.appendChild(removeBtn);
    versionPickerEditList.appendChild(row);
  });
}
function syncIncomeVersionSummary() {
  const summaryNode = document.querySelector('#precious-income-version-summary');
  if (!summaryNode) return;
  summaryNode.textContent = draftIncomeVersionEntries.length ? `已记录 ${fmt(draftIncomeVersionEntries.length)} 个版本` : '尚未填写版本数量';
}
function renderIncomeModeFields(mode) {
  if (mode === 'version') {
    preciousIncomeModeFields.innerHTML = `<div class="form-span-2 income-mode-block"><div class="income-mode-title">版本数量</div><div class="version-inline-summary compact-summary" id="precious-income-version-summary">${draftIncomeVersionEntries.length ? `已记录 ${fmt(draftIncomeVersionEntries.length)} 个版本` : '尚未填写版本数量'}</div></div>`;
  } else {
    preciousIncomeModeFields.innerHTML = `<div class="form-span-2 inline-fields"><label><span>周期</span><input id="precious-income-cycle-label-input" name="cycleLabel" /></label><label><span>数量</span><input id="precious-income-amount-input" name="amount" type="number" min="1" /></label></div>`;
  }
}
function syncIncomeDialogFields() {
  if (!preciousIncomeEditing) return;
  const materialKey = preciousIncomeMaterialInput.value;
  const editingRecordId = preciousIncomeEditing.type === 'version' ? preciousIncomeEditing.recordId : null;
  const versionSources = getAvailableVersionIncomeSourceOptions(materialKey, editingRecordId);
  const otherSources = PRECIOUS_OTHER_INCOME_SOURCE_OPTIONS[materialKey] ?? [];
  const allSources = [
    ...versionSources.map((item) => ({ value: item.key, label: item.label, mode: 'version' })),
    ...otherSources.map((value) => ({ value, label: value, mode: 'other' })),
  ].sort((a, b) => getIncomeSourceSortIndex(a.value) - getIncomeSourceSortIndex(b.value) || a.label.localeCompare(b.label, 'zh-CN'));
  const previousValue = preciousIncomeSourceInput.value;
  preciousIncomeSourceInput.innerHTML = '';
  allSources.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    option.dataset.mode = item.mode;
    preciousIncomeSourceInput.appendChild(option);
  });
  if (allSources.some((item) => item.value === previousValue)) preciousIncomeSourceInput.value = previousValue;
  else if (preciousIncomeEditing.mode === 'edit') {
    if (preciousIncomeEditing.type === 'version') {
      const record = findPreciousVersionIncomeRecord(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      preciousIncomeSourceInput.value = record?.sourceKey ?? allSources[0]?.value ?? '';
    } else {
      const record = findPreciousOtherIncome(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      preciousIncomeSourceInput.value = record?.source ?? allSources[0]?.value ?? '';
    }
  } else preciousIncomeSourceInput.value = allSources[0]?.value ?? '';

  const mode = getIncomeSourceMode(materialKey, preciousIncomeSourceInput.value);
  renderIncomeModeFields(mode);
  if (mode === 'version') {
    document.querySelector('#precious-income-version-summary')?.addEventListener('click', () => openVersionPickerDialog('income'));
    syncIncomeVersionSummary();
  } else {
    const cycleInput = document.querySelector('#precious-income-cycle-label-input');
    const amountInput = document.querySelector('#precious-income-amount-input');
    if (preciousIncomeEditing.mode === 'edit' && preciousIncomeEditing.type === 'other') {
      const record = findPreciousOtherIncome(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      if (record) {
        cycleInput.value = record.cycleLabel ?? '';
        amountInput.value = String(record.amount ?? '');
      }
    }
  }
}
function saveVersionPickerEditEntry() {
  const versionId = preciousIncomeSelection.versionId;
  const amount = Number(versionPickerEditorInput.value);
  if (!getVersionMap().has(versionId)) throw new Error('请选择具体版本。');
  if (!Number.isFinite(amount) || amount < 0) throw new Error('版本数量必须大于等于 0。');
  const index = draftIncomeVersionEntries.findIndex((item) => item.versionId === versionId);
  if (index >= 0) draftIncomeVersionEntries.splice(index, 1, { versionId, amount });
  else draftIncomeVersionEntries.push({ versionId, amount });
  renderVersionPickerEditList();
  syncIncomeVersionSummary();
}
function syncExpenseAmountBySelection() {
  const materialKey = preciousExpenseMaterialInput?.value;
  const slot = preciousExpenseSlotInput?.value;
  const amount = EXPENSE_AMOUNT_BY_MATERIAL_AND_SLOT[materialKey]?.[slot];
  if (preciousExpenseAmountInput && Number.isFinite(amount)) preciousExpenseAmountInput.value = String(amount);
}
function refreshExpenseMainStatOptions(selectedSlot, selectedMainStat = '') {
  preciousExpenseMainStatInput.innerHTML = '';
  (ARTIFACT_MAIN_STATS_BY_SLOT[selectedSlot] || []).forEach((value, index) => {
    const option = document.createElement('option'); option.value = value; option.textContent = value; option.selected = selectedMainStat ? value === selectedMainStat : index === 0; preciousExpenseMainStatInput.appendChild(option);
  });
}
function populateExpenseSlotOptions(selectedSlot = '生之花') {
  preciousExpenseSlotInput.innerHTML = '';
  ARTIFACT_SLOT_OPTIONS.forEach((slot) => {
    const option = document.createElement('option'); option.value = slot; option.textContent = slot; option.selected = slot === selectedSlot; preciousExpenseSlotInput.appendChild(option);
  });
  refreshExpenseMainStatOptions(selectedSlot);
  syncExpenseAmountBySelection();
}
function syncExpenseSetNameInput() {
  if (!preciousExpenseSetNameInput) return;
  const options = PRECIOUS_MATERIALS
    .flatMap((material) => getPreciousMaterialData(material.key).expenseSetOptions || [])
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const currentValue = preciousExpenseSetNameInput.value;
  preciousExpenseSetNameInput.setAttribute('list', 'precious-expense-set-options');
  let datalist = document.querySelector('#precious-expense-set-options');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'precious-expense-set-options';
    preciousExpenseSetNameInput.parentElement?.appendChild(datalist);
  }
  datalist.innerHTML = '';
  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
  });
  preciousExpenseSetNameInput.value = currentValue;
}
function findPreciousVersionIncomeRecord(materialKey, recordId) { return getPreciousMaterialData(materialKey).versionIncomeRecords.find((item) => item.id === recordId) ?? null; }
function findPreciousOtherIncome(materialKey, recordId) { return getPreciousMaterialData(materialKey).otherIncomes.find((item) => item.id === recordId) ?? null; }
function findPreciousExpense(materialKey, recordId) { return getPreciousMaterialData(materialKey).expenses.find((item) => item.id === recordId) ?? null; }
function ensurePreciousVersionsExist() { ensurePreciousData(); if (!getPreciousData().versions.length) throw new Error('请先新增至少一个版本分组。'); }
function openCreatePreciousVersionDialog() {
  ensurePreciousData(); preciousVersionEditing = { mode: 'create', versionId: null }; preciousVersionTitle.textContent = '新增版本分组'; preciousVersionLabelInput.value = ''; preciousVersionSortKeyInput.value = ''; preciousVersionDeleteBtn.style.display = 'none'; preciousVersionDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousVersionDialog(versionId) {
  const version = getPreciousData().versions.find((item) => item.id === versionId); if (!version) return;
  preciousVersionEditing = { mode: 'edit', versionId }; preciousVersionTitle.textContent = '修改版本分组'; preciousVersionLabelInput.value = version.label; preciousVersionSortKeyInput.value = version.sortKey ?? ''; preciousVersionDeleteBtn.style.display = ''; preciousVersionDialog.showModal(); syncBodyDialogState();
}
function savePreciousVersion() {
  const label = preciousVersionLabelInput.value.trim(); const sortKey = preciousVersionSortKeyInput.value.trim();
  if (!label) throw new Error('版本标签不能为空。'); if (!sortKey) throw new Error('sortKey 不能为空。');
  const versions = getPreciousData().versions; const group = inferVersionGroup(sortKey, label);
  if (preciousVersionEditing.mode === 'create') versions.push({ id: buildPreciousRecordId('precious-version'), label, sortKey, group });
  else {
    const target = versions.find((item) => item.id === preciousVersionEditing.versionId); if (!target) throw new Error('未找到要修改的版本分组。');
    target.label = label; target.sortKey = sortKey; target.group = group;
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousVersion() {
  const versionId = preciousVersionEditing.versionId;
  const usedCount = PRECIOUS_MATERIALS.reduce((sum, material) => {
    const data = getPreciousMaterialData(material.key);
    return sum + data.versionIncomeRecords.reduce((inner, record) => inner + record.entries.filter((item) => item.versionId === versionId).length, 0) + data.expenses.filter((item) => item.versionId === versionId).length;
  }, 0);
  if (usedCount > 0) throw new Error('该版本分组已被版本来源收入或支出记录使用，暂不允许删除。');
  currentPreciousData.versions = currentPreciousData.versions.filter((item) => item.id !== versionId); preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function openCreatePreciousIncomeDialog(defaultMaterialKey = 'sanctifyingUnction') {
  preciousIncomeEditing = { mode: 'create', type: 'version', materialKey: defaultMaterialKey, recordId: null };
  draftIncomeVersionEntries = []; preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: '' };
  preciousIncomeTitle.textContent = '新增收入记录'; preciousIncomeDeleteBtn.style.display = 'none'; preciousIncomeMaterialInput.value = defaultMaterialKey; preciousIncomeNoteInput.value = ''; syncIncomeDialogFields(); preciousIncomeDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousIncomeDialog(materialKey, type, recordId) {
  if (type === 'version') {
    const record = findPreciousVersionIncomeRecord(materialKey, recordId); if (!record) return;
    preciousIncomeEditing = { mode: 'edit', type, materialKey, recordId }; draftIncomeVersionEntries = cloneData(record.entries || []); preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: draftIncomeVersionEntries[0]?.versionId ?? '' };
    preciousIncomeTitle.textContent = '修改收入记录'; preciousIncomeDeleteBtn.style.display = ''; preciousIncomeMaterialInput.value = materialKey; preciousIncomeNoteInput.value = record.note ?? ''; syncIncomeDialogFields(); preciousIncomeSourceInput.value = record.sourceKey; syncIncomeDialogFields();
  } else {
    const record = findPreciousOtherIncome(materialKey, recordId); if (!record) return;
    preciousIncomeEditing = { mode: 'edit', type, materialKey, recordId }; draftIncomeVersionEntries = []; preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: '' };
    preciousIncomeTitle.textContent = '修改收入记录'; preciousIncomeDeleteBtn.style.display = ''; preciousIncomeMaterialInput.value = materialKey; preciousIncomeNoteInput.value = record.note ?? ''; syncIncomeDialogFields(); preciousIncomeSourceInput.value = record.source; syncIncomeDialogFields();
  }
  preciousIncomeDialog.showModal(); syncBodyDialogState();
}
function normalizePreciousIncomeInput() {
  const materialKey = preciousIncomeMaterialInput.value; const sourceValue = preciousIncomeSourceInput.value.trim();
  if (!PRECIOUS_MATERIALS.some((item) => item.key === materialKey)) throw new Error('收入材料不合法。');
  if (!sourceValue) throw new Error('来源不能为空。');
  const mode = getIncomeSourceMode(materialKey, sourceValue);
  if (mode === 'version') {
    if (!getVersionIncomeSourceOptions(materialKey).some((item) => item.key === sourceValue)) throw new Error('版本来源不合法。');
    if (!draftIncomeVersionEntries.length) throw new Error('请先录入版本数量。');
    return { type: 'version', materialKey, sourceKey: sourceValue, note: preciousIncomeNoteInput.value.trim(), updateTime: new Date().toISOString(), entries: cloneData(draftIncomeVersionEntries) };
  }
  const cycleLabel = document.querySelector('#precious-income-cycle-label-input')?.value.trim();
  const amount = Number(document.querySelector('#precious-income-amount-input')?.value);
  if (!cycleLabel) throw new Error('周期不能为空。'); if (!Number.isFinite(amount) || amount <= 0) throw new Error('收入数量必须大于 0。');
  return { type: 'other', materialKey, source: sourceValue, cycleLabel, amount, note: preciousIncomeNoteInput.value.trim(), updateTime: new Date().toISOString() };
}
function savePreciousIncome() {
  const input = normalizePreciousIncomeInput();
  if (input.type === 'version') {
    const list = getPreciousMaterialData(input.materialKey).versionIncomeRecords;
    if (preciousIncomeEditing.mode === 'create') {
      const duplicate = list.find((item) => item.sourceKey === input.sourceKey); if (duplicate) throw new Error('该版本来源已存在，请直接修改原记录。');
      list.push({ id: buildPreciousRecordId('precious-version-income'), sourceKey: input.sourceKey, note: input.note, updateTime: input.updateTime, entries: input.entries });
    } else {
      const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index < 0) throw new Error('未找到要修改的版本来源收入记录。');
      const duplicate = list.find((item, itemIndex) => item.sourceKey === input.sourceKey && itemIndex !== index); if (duplicate) throw new Error('该版本来源已存在，请避免重复。');
      const previous = list[index]; list.splice(index, 1, { ...previous, sourceKey: input.sourceKey, note: input.note, updateTime: input.updateTime, entries: input.entries });
    }
  } else {
    const list = getPreciousMaterialData(input.materialKey).otherIncomes;
    if (preciousIncomeEditing.mode === 'create') list.push({ id: buildPreciousRecordId('precious-other-income'), ...input });
    else {
      const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index < 0) throw new Error('未找到要修改的其他来源收入记录。');
      const previous = list[index]; list.splice(index, 1, { ...previous, ...input });
    }
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousIncome() {
  if (!preciousIncomeEditing) return;
  if (preciousIncomeEditing.type === 'version') {
    const list = getPreciousMaterialData(preciousIncomeEditing.materialKey).versionIncomeRecords; const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index >= 0) list.splice(index, 1);
  } else {
    const list = getPreciousMaterialData(preciousIncomeEditing.materialKey).otherIncomes; const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index >= 0) list.splice(index, 1);
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function openCreatePreciousExpenseDialog(defaultMaterialKey = 'sanctifyingUnction') {
  ensurePreciousVersionsExist(); preciousExpenseEditing = { mode: 'create', materialKey: defaultMaterialKey, recordId: null };
  const latestVersionId = getLatestExpenseVersionId(defaultMaterialKey);
  const latestVersion = getVersionMap().get(latestVersionId);
  preciousExpenseSelection = { group: latestVersion?.group ?? getVersionGroups()[0]?.[0] ?? '', versionId: latestVersionId };
  preciousExpenseTitle.textContent = '新增支出记录'; preciousExpenseDeleteBtn.style.display = 'none'; preciousExpenseMaterialInput.value = defaultMaterialKey; syncVersionTriggerText(); preciousExpenseAmountInput.value = ''; preciousExpenseSetNameInput.value = ''; preciousExpenseNoteInput.value = ''; populateExpenseSlotOptions('生之花'); syncExpenseSetNameInput(); preciousExpenseDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousExpenseDialog(materialKey, recordId) {
  const record = findPreciousExpense(materialKey, recordId); if (!record) return;
  const version = getVersionMap().get(record.versionId); preciousExpenseEditing = { mode: 'edit', materialKey, recordId }; preciousExpenseSelection = { group: version?.group ?? getVersionGroups()[0]?.[0] ?? '', versionId: record.versionId };
  preciousExpenseTitle.textContent = '修改支出记录'; preciousExpenseDeleteBtn.style.display = ''; preciousExpenseMaterialInput.value = materialKey; syncVersionTriggerText(); preciousExpenseSetNameInput.value = record.setName ?? ''; populateExpenseSlotOptions(record.slot ?? '生之花'); refreshExpenseMainStatOptions(record.slot ?? '生之花', record.mainStat ?? '生命'); syncExpenseAmountBySelection(); syncExpenseSetNameInput(); preciousExpenseNoteInput.value = record.note ?? ''; preciousExpenseDialog.showModal(); syncBodyDialogState();
}
function normalizePreciousExpenseInput() {
  const materialKey = preciousExpenseMaterialInput.value; const amount = Number(preciousExpenseAmountInput.value); const versionId = preciousExpenseSelection.versionId; const setName = preciousExpenseSetNameInput.value.trim(); const slot = preciousExpenseSlotInput.value; const mainStat = preciousExpenseMainStatInput.value;
  if (!PRECIOUS_MATERIALS.some((item) => item.key === materialKey)) throw new Error('支出材料不合法。'); if (!Number.isFinite(amount) || amount <= 0) throw new Error('支出数量必须大于 0。'); if (!getVersionMap().has(versionId)) throw new Error('请选择版本。'); if (!setName) throw new Error('圣遗物套装不能为空。'); if (!ARTIFACT_SLOT_OPTIONS.includes(slot)) throw new Error('圣遗物部位不合法。'); if (!(ARTIFACT_MAIN_STATS_BY_SLOT[slot] || []).includes(mainStat)) throw new Error('该部位下属性不合法。');
  return { materialKey, versionId, amount, setName, slot, mainStat, note: preciousExpenseNoteInput.value.trim(), updateTime: new Date().toISOString() };
}
function savePreciousExpense() {
  const input = normalizePreciousExpenseInput();

  if (preciousExpenseEditing.mode === 'create') getPreciousMaterialData(input.materialKey).expenses.push({ id: buildPreciousRecordId('precious-expense'), ...input });
  else {
    const oldList = getPreciousMaterialData(preciousExpenseEditing.materialKey).expenses; const index = oldList.findIndex((item) => item.id === preciousExpenseEditing.recordId); if (index < 0) throw new Error('未找到要修改的支出记录。'); const previous = oldList[index]; oldList.splice(index, 1); getPreciousMaterialData(input.materialKey).expenses.push({ ...previous, ...input });
  }
  const expenseSetOptions = getPreciousMaterialData(input.materialKey).expenseSetOptions || [];
  if (!expenseSetOptions.includes(input.setName)) {
    expenseSetOptions.push(input.setName);
    expenseSetOptions.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    getPreciousMaterialData(input.materialKey).expenseSetOptions = expenseSetOptions;
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousExpense() {
  const list = getPreciousMaterialData(preciousExpenseEditing.materialKey).expenses; const index = list.findIndex((item) => item.id === preciousExpenseEditing.recordId); if (index >= 0) list.splice(index, 1);
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function rerenderPrecious() {
  const data = getPreciousData();
  preciousSection.innerHTML = '';
  const hasRecords = data.versions.length || PRECIOUS_MATERIALS.some((material) => {
    const materialData = getPreciousMaterialData(material.key);
    return materialData.versionIncomeRecords.length || materialData.otherIncomes.length || materialData.expenses.length;
  });
  if (!hasRecords) {
    preciousSection.innerHTML = `<div class="card landing-card"><div class="landing-badge">贵重资源</div><h2>现在就可以开始</h2><p>你可以直接下载模板、上传已有 JSON，或者先加载示例数据看看页面结构。若想从零录入，也可以直接从“新增版本分组”开始。</p><div class="tools-actions"><button id="empty-download-template" class="ghost-button compact-button" type="button">下载模板</button><button id="empty-load-sample" class="ghost-button compact-button" type="button">加载示例数据</button><button id="empty-add-version" class="primary-button compact-button" type="button">新增版本分组</button></div></div>`;
    preciousSection.querySelector('#empty-download-template')?.addEventListener('click', handleTemplateDownload);
    preciousSection.querySelector('#empty-load-sample')?.addEventListener('click', handleLoadSample);
    preciousSection.querySelector('#empty-add-version')?.addEventListener('click', openCreatePreciousVersionDialog);
    return;
  }
  const statGrid = document.createElement('div'); statGrid.className = 'grid cards-2 precious-stat-shell'; PRECIOUS_MATERIALS.forEach((material) => statGrid.appendChild(buildPreciousStatCard(material.key))); preciousSection.appendChild(statGrid);
  PRECIOUS_MATERIALS.forEach((material) => preciousSection.appendChild(buildPreciousMaterialBlock(material.key)));
  const settingsSection = document.createElement('section'); settingsSection.className = 'section settings-section'; settingsSection.appendChild(buildVersionsCard()); preciousSection.appendChild(settingsSection);
}

uploadTrigger?.addEventListener('click', () => uploadInput?.click());
downloadTemplateTrigger?.addEventListener('click', handleTemplateDownload);
downloadCurrentTrigger?.addEventListener('click', handleExport);
loadSampleTrigger?.addEventListener('click', handleLoadSample);
clearLocalDataTrigger?.addEventListener('click', handleClearLocalData);

uploadInput?.addEventListener('change', async () => {
  const file = uploadInput.files?.[0]; if (!file) return;
  try {
    currentPreciousData = validateAndNormalizePreciousData(JSON.parse(await file.text())); baselinePreciousData = cloneData(currentPreciousData); currentPreciousFileName = file.name || '已上传数据'; preciousDirty = false; persistPreciousBaseline(); persistPreciousSnapshot(); rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator(); setSyncStatus('贵重资源 JSON 已加载。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`加载失败：${msg}`, 'error'); alert(`加载失败：${msg}`);
  } finally { uploadInput.value = ''; }
});

preciousVersionCancelBtn?.addEventListener('click', closePreciousVersionDialog);
preciousVersionDialog?.addEventListener('close', syncBodyDialogState);
preciousVersionDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这个版本分组吗？')) return;
  try { deletePreciousVersion(); closePreciousVersionDialog(); setSyncStatus('版本分组已删除；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`删除失败：${msg}`, 'error'); alert(`删除失败：${msg}`); }
});
preciousVersionForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousVersion(); closePreciousVersionDialog(); setSyncStatus('版本分组已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});

preciousIncomeCancelBtn?.addEventListener('click', closePreciousIncomeDialog);
preciousIncomeDialog?.addEventListener('close', syncBodyDialogState);
preciousIncomeMaterialInput?.addEventListener('change', syncIncomeDialogFields);
preciousIncomeSourceInput?.addEventListener('change', syncIncomeDialogFields);
preciousIncomeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousIncome(); closePreciousIncomeDialog(); setSyncStatus('收入记录已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});
preciousIncomeDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条收入记录吗？')) return;
  deletePreciousIncome(); closePreciousIncomeDialog(); setSyncStatus('收入记录已删除；如需保留，请导出 JSON。', 'success');
});

versionPickerEditorSave?.addEventListener('click', () => {
  try { saveVersionPickerEditEntry(); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`填写失败：${msg}`, 'error'); alert(`填写失败：${msg}`); }
});

preciousExpenseCancelBtn?.addEventListener('click', closePreciousExpenseDialog);
preciousExpenseDialog?.addEventListener('close', syncBodyDialogState);
preciousExpenseMaterialInput?.addEventListener('change', () => { syncExpenseAmountBySelection(); syncExpenseSetNameInput(); });
preciousExpenseSlotInput?.addEventListener('change', () => { refreshExpenseMainStatOptions(preciousExpenseSlotInput.value); syncExpenseAmountBySelection(); });
preciousExpenseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousExpense(); closePreciousExpenseDialog(); setSyncStatus('支出记录已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});
preciousExpenseDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条支出记录吗？')) return;
  deletePreciousExpense(); closePreciousExpenseDialog(); setSyncStatus('支出记录已删除；如需保留，请导出 JSON。', 'success');
});

function main() {
  checkStorageAvailability(); populateExpenseSlotOptions('生之花');
  try {
    currentPreciousData = loadStoredPreciousData() || buildPreciousTemplateData();
    baselinePreciousData = loadStoredPreciousBaseline();
    const storedMeta = loadStoredMeta(PRECIOUS_STORAGE_META_KEY);
    preciousDirty = Boolean(storedMeta?.isDirty);
    currentPreciousFileName = storedMeta?.fileName ?? (baselinePreciousData ? '浏览器缓存' : '未加载');
  }
  catch {
    currentPreciousData = buildPreciousTemplateData();
    baselinePreciousData = null;
    currentPreciousFileName = '未加载';
    preciousDirty = false;
  }
  rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator();
}

main();

preciousExpenseVersionTrigger?.addEventListener('click', () => openVersionPickerDialog('expense'));
versionPickerDialogClose?.addEventListener('click', closeVersionPickerDialog);
versionPickerDialog?.addEventListener('close', () => { activeVersionPickerTarget = null; versionPickerMode = 'select'; syncBodyDialogState(); });
