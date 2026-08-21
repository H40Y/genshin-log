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
  ['buildDiff', 'buildTemplateData', 'getPullVersionByTime', 'renderVersionPhaseOptions', 'validateAndNormalizeData'],
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

test('UIGF review version choices come only from the built-in catalog', () => {
  const options = wish.renderVersionPhaseOptions('6.6.5');
  assert.match(options, /value="6\.6\.5" selected>月之七·下半/);
  assert.match(options, /value="7\.8\.5">7\.8·下半/);
  assert.doesNotMatch(options, /<input/);
  assert.equal(wish.getPullVersionByTime('2024-08-27 23:59:59'), null);
});
