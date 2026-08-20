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
  ['assets/js/wish/core.js', 'assets/js/wish/import-export.js'],
  ['buildTemplateData', 'validateAndNormalizeData'],
);
const precious = loadPageDataApi(
  ['assets/js/precious/core.js'],
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
    /缺少 fixedCounts 对象/,
  );
});
