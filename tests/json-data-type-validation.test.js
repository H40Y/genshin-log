const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function loadPageDataApi(files, exposedFunctions) {
  const context = vm.createContext({
    document: {
      querySelector: () => null,
      createElement: () => ({}),
      documentElement: { classList: { toggle() {} } },
      body: { classList: { toggle() {} } },
    },
    localStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {},
    },
    window: {},
    URL,
    Blob,
    Intl,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Set,
    Map,
    Math,
  });

  files.forEach((file) => {
    const source = fs.readFileSync(path.join(projectRoot, file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  });
  vm.runInContext(`globalThis.testApi = { ${exposedFunctions.join(', ')} };`, context);
  return context.testApi;
}

const wish = loadPageDataApi(
  ['assets/js/version-info.js', 'assets/js/wish/core.js', 'assets/js/wish/import-export.js'],
  ['analyzeUigfFromFile', 'buildDiff', 'buildTemplateData', 'getPullVersionByTime', 'renderVersionPhaseOptions', 'resolveUigfOffset', 'validateAndNormalizeData'],
);
const precious = loadPageDataApi(
  ['assets/js/version-info.js', 'assets/js/precious/core.js'],
  ['buildPreciousTemplateData', 'validateAndNormalizePreciousData'],
);
const spending = loadPageDataApi(
  ['assets/js/spending/core.js'],
  ['buildSpendingTemplateData', 'validateAndNormalizeSpendingData'],
);

function withoutDataType(data) {
  const copy = JSON.parse(JSON.stringify(data));
  delete copy.dataType;
  return copy;
}

test('templates include their page-specific data type', () => {
  assert.equal(wish.buildTemplateData().dataType, 'wish-history');
  assert.equal(precious.buildPreciousTemplateData().dataType, 'precious-resources');
  assert.equal(spending.buildSpendingTemplateData().dataType, 'spending-history');
});

test('each page accepts its current and legacy untagged JSON', () => {
  const cases = [
    [wish.buildTemplateData(), wish.validateAndNormalizeData],
    [precious.buildPreciousTemplateData(), precious.validateAndNormalizePreciousData],
    [spending.buildSpendingTemplateData(), spending.validateAndNormalizeSpendingData],
  ];

  cases.forEach(([template, validate]) => {
    assert.doesNotThrow(() => validate(template));
    assert.doesNotThrow(() => validate(withoutDataType(template)));
  });
});

test('tagged JSON cannot be imported by another page', () => {
  assert.throws(
    () => precious.validateAndNormalizePreciousData(spending.buildSpendingTemplateData()),
    /数据类型不匹配/,
  );
  assert.throws(
    () => spending.validateAndNormalizeSpendingData(precious.buildPreciousTemplateData()),
    /数据类型不匹配/,
  );
  assert.throws(
    () => wish.validateAndNormalizeData(precious.buildPreciousTemplateData()),
    /数据类型不匹配/,
  );
});

test('legacy untagged JSON with the same schemaVersion cannot cross pages', () => {
  assert.throws(
    () => precious.validateAndNormalizePreciousData(withoutDataType(spending.buildSpendingTemplateData())),
    /缺少 versions 数组/,
  );
  assert.throws(
    () => spending.validateAndNormalizeSpendingData(withoutDataType(precious.buildPreciousTemplateData())),
    /schemaVersion/,
  );
});

test('precious schema 1 version ids migrate to built-in stable ids', () => {
  const legacy = {
    dataType: 'precious-resources',
    schemaVersion: 1,
    versions: [
      { id: 'default-version-1-7', label: '5.6', sortKey: '5.6', group: '5.x' },
      { id: 'precious-version-random', label: '月之七', sortKey: '6.6', group: '6.x' },
    ],
    materials: {
      sanctifyingUnction: {
        versionIncomeRecords: [{ sourceKey: 'bp', entries: [{ versionId: 'precious-version-random', amount: 1 }] }],
      },
      sanctifyingEssence: {
        expenses: [{ versionId: 'default-version-1-7', amount: 2 }],
      },
    },
  };

  const normalized = precious.validateAndNormalizePreciousData(legacy);
  assert.equal(normalized.schemaVersion, 2);
  assert.equal('versions' in normalized, false);
  assert.equal(normalized.materials.sanctifyingUnction.versionIncomeRecords[0].entries[0].versionId, '6.6');
  assert.equal(normalized.materials.sanctifyingEssence.expenses[0].versionId, '5.6');
});

test('precious migration rejects referenced versions outside the built-in catalog', () => {
  const legacy = {
    schemaVersion: 1,
    versions: [{ id: 'future-version', label: '8.0', sortKey: '8.0', group: '8.x' }],
    materials: {
      sanctifyingUnction: {
        versionIncomeRecords: [{ sourceKey: 'bp', entries: [{ versionId: 'future-version', amount: 1 }] }],
      },
      sanctifyingEssence: {},
    },
  };

  assert.throws(() => precious.validateAndNormalizePreciousData(legacy), /无法迁移到内置版本/);
});

test('UIGF limited five-stars infer their built-in version phase from time', () => {
  const diff = wish.buildDiff(wish.buildTemplateData(), [
    {
      gacha_type: '301',
      rank_type: '5',
      name: '示例角色',
      item_type: '角色',
      time: '2025-05-30 12:00:00',
    },
  ], '301');

  assert.deepEqual(
    { ...diff.newFiveStars[0].pullVersion },
    { label: '5.6', group: '5.6.5' },
  );
});

test('UIGF can initialize the wish page without existing main data', async () => {
  const review = await wish.analyzeUigfFromFile({
    name: 'uigf.json',
    text: async () => JSON.stringify({
      list: [
        {
          gacha_type: '301',
          rank_type: '5',
          name: '示例角色',
          item_type: '角色',
          time: '2025-05-30 12:00:00',
        },
      ],
    }),
  });

  assert.equal(review.isInitialization, true);
  assert.equal(review.initialData.schemaVersion, 4);
  assert.equal(review.checks.every((check) => check.ok && check.skipped), true);
  const limitedCharacterDiff = review.diffs.find((diff) => diff.bannerKey === 'limitedCharacter');
  assert.equal(limitedCharacterDiff.offset, 0);
  assert.equal(limitedCharacterDiff.candidateTotalPulls, 1);
  assert.equal(limitedCharacterDiff.newFiveStars[0].pullIndex, 1);
});

test('UIGF incremental import infers a per-banner offset from overlapping records', () => {
  const schema = wish.buildTemplateData();
  schema.wishData.limitedCharacter.totalPulls = 100;
  schema.wishData.limitedCharacter.fiveStarHistory.push({
    id: 'existing-100',
    pullIndex: 100,
    time: '2025-05-30 12:00:00',
    itemName: '示例角色',
    itemType: '角色',
    resultType: 'up',
    capturingRadiance: null,
    pullVersion: { label: '5.6', group: '5.6.5' },
    source: 'manual',
  });
  const uigfList = [
    {
      gacha_type: '301',
      rank_type: '5',
      name: '示例角色',
      item_type: '角色',
      time: '2025-05-30 12:00:00',
    },
    {
      gacha_type: '301',
      rank_type: '4',
      name: '示例四星',
      item_type: '角色',
      time: '2025-05-29 12:00:00',
    },
  ];

  const check = wish.resolveUigfOffset(schema, uigfList, '301');
  assert.equal(check.ok, true);
  assert.equal(check.appliedOffset, 98);

  const diff = wish.buildDiff(schema, uigfList, '301', check.appliedOffset);
  assert.equal(diff.newFiveStars.length, 0);
  assert.equal(diff.newFourStars[0].pullIndex, 99);
});

test('duplicate five-star metadata contributes offset votes without creating record ambiguity', () => {
  const schema = wish.buildTemplateData();
  schema.wishData.limitedCharacter.totalPulls = 103;
  schema.wishData.limitedCharacter.fiveStarHistory = [100, 103].map((pullIndex) => ({
    id: `duplicate-${pullIndex}`,
    pullIndex,
    time: '2025-03-04 18:01:34',
    itemName: '芙宁娜',
    itemType: '角色',
    resultType: 'up',
    capturingRadiance: null,
    pullVersion: { label: '5.4', group: '5.4.0' },
    source: 'manual',
  }));
  const duplicateFiveStar = {
    gacha_type: '301',
    rank_type: '5',
    name: '芙宁娜',
    item_type: '角色',
    time: '2025-03-04 18:01:34',
  };
  const uigfList = [
    duplicateFiveStar,
    { gacha_type: '301', rank_type: '3', name: '冷刃', item_type: '武器', time: '2025-03-04 18:01:34' },
    { gacha_type: '301', rank_type: '3', name: '黎明神剑', item_type: '武器', time: '2025-03-04 18:01:34' },
    duplicateFiveStar,
  ];

  const check = wish.resolveUigfOffset(schema, uigfList, '301');
  assert.equal(check.ok, true);
  assert.equal(check.appliedOffset, 99);
  assert.equal(check.support, 2);
  assert.equal('ambiguous' in check, false);

  const diff = wish.buildDiff(schema, uigfList, '301', check.appliedOffset);
  assert.equal(diff.newFiveStars.length, 0);
  assert.equal(diff.patchFiveStars.length, 0);
});

test('UIGF incremental import rejects a populated banner without an offset anchor', () => {
  const schema = wish.buildTemplateData();
  schema.wishData.standard.totalPulls = 80;
  const check = wish.resolveUigfOffset(schema, [
    {
      gacha_type: '200',
      rank_type: '5',
      name: '刻晴',
      item_type: '角色',
      time: '2025-05-30 12:00:00',
    },
  ], '200');

  assert.equal(check.ok, false);
  assert.equal(check.appliedOffset, null);
});

test('UIGF review version choices come only from the built-in catalog', () => {
  const options = wish.renderVersionPhaseOptions('6.6.5');
  assert.match(options, /value="6\.6\.5" selected>月之七·下半/);
  assert.match(options, /value="7\.8\.5">7\.8·下半/);
  assert.doesNotMatch(options, /<input/);
  assert.equal(wish.getPullVersionByTime('2024-08-27 23:59:59'), null);
});
