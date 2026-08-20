const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');

function loadCharacterOverviewApi() {
  const context = vm.createContext({
    console,
    Number,
    String,
    Array,
    Object,
    Map,
    Math,
  });
  const source = fs.readFileSync(
    path.join(projectRoot, 'assets/js/wish/character-overview.js'),
    'utf8',
  );
  vm.runInContext(source, context, { filename: 'character-overview.js' });
  vm.runInContext(`globalThis.testApi = {
    buildCharacterOverview,
    buildLimitedCharacterPullRecords,
    buildStandardPullRecords,
    formatCharacterPullLabel,
    getCharacterPullScrollState,
    paginateCharacterOverview,
    sortCharacterPullRecords,
  };`, context);
  return context.testApi;
}

const api = loadCharacterOverviewApi();

function makeData(standard, limitedCharacter) {
  return {
    wishData: {
      standard: { fiveStarHistory: standard },
      limitedCharacter: { fiveStarHistory: limitedCharacter },
    },
  };
}

test('character overview aggregates only five-star characters from the two character pools', () => {
  const data = makeData(
    [
      { itemName: '迪卢克', itemType: '角色', pullIndex: 1072 },
      { itemName: '天空之刃', itemType: '武器', pullIndex: 1100 },
    ],
    [
      { itemName: '尼可', itemType: '角色', pullIndex: 5905, pullVersion: { label: '月之七' } },
      { itemName: '迪卢克', itemType: '角色', pullIndex: 4791, pullVersion: { label: '5.7' } },
      { itemName: '尼可', itemType: '角色', pullIndex: 5982, pullVersion: { label: '月之七' } },
      { itemName: '某武器', itemType: '武器', pullIndex: 6000, pullVersion: { label: '月之七' } },
      { itemName: '尼可', itemType: '角色', pullIndex: 6140, pullVersion: { label: '月之七' } },
    ],
  );

  const result = api.buildCharacterOverview(data);
  assert.deepEqual(Array.from(result, (item) => [item.name, item.count]), [
    ['尼可', 3],
    ['迪卢克', 2],
  ]);
  assert.deepEqual(
    Array.from(result[1].pulls, (record) => [record.bannerKey, record.pullIndex]),
    [['standard', 1072], ['limitedCharacter', 4791]],
  );
});

test('equal counts are ordered by the latest limited-character pull index descending', () => {
  const data = makeData(
    [{ itemName: '琴', itemType: '角色', pullIndex: 900 }],
    [
      { itemName: '琴', itemType: '角色', pullIndex: 3000 },
      { itemName: '莫娜', itemType: '角色', pullIndex: 3500 },
      { itemName: '莫娜', itemType: '角色', pullIndex: 4200 },
    ],
  );

  assert.deepEqual(
    Array.from(api.buildCharacterOverview(data), (item) => item.name),
    ['莫娜', '琴'],
  );
});

test('pull records use the standard-first fallback and ascending indices within each pool', () => {
  const sorted = api.sortCharacterPullRecords([
    { bannerKey: 'limitedCharacter', pullIndex: 500 },
    { bannerKey: 'standard', pullIndex: 200 },
    { bannerKey: 'limitedCharacter', pullIndex: 100 },
    { bannerKey: 'standard', pullIndex: 50 },
  ]);

  assert.deepEqual(Array.from(sorted, (record) => `${record.bannerKey}:${record.pullIndex}`), [
    'standard:50',
    'standard:200',
    'limitedCharacter:100',
    'limitedCharacter:500',
  ]);
});

test('missing limited version labels use the agreed fallback', () => {
  assert.equal(
    api.formatCharacterPullLabel({ bannerKey: 'limitedCharacter', drawCount: 76, pullVersion: null }),
    '未标注·76',
  );
  assert.equal(
    api.formatCharacterPullLabel({ bannerKey: 'standard', drawCount: 72, pullVersion: null }),
    '常驻·72',
  );
});

test('standard draw counts use every previous five-star including weapons', () => {
  const records = api.buildStandardPullRecords([
    { itemName: '迪卢克', itemType: '角色', pullIndex: 180 },
    { itemName: '天空之刃', itemType: '武器', pullIndex: 80 },
    { itemName: '琴', itemType: '角色', pullIndex: 250 },
  ]);

  assert.deepEqual(
    Array.from(records, (record) => [record.itemName, record.drawCount]),
    [['天空之刃', 80], ['迪卢克', 100], ['琴', 70]],
  );
});

test('limited draw counts use the previous UP while retaining off-banner records', () => {
  const records = api.buildLimitedCharacterPullRecords([
    { itemName: '限定角色甲', itemType: '角色', pullIndex: 75, resultType: 'up' },
    { itemName: '迪卢克', itemType: '角色', pullIndex: 150, resultType: 'off-banner' },
    { itemName: '限定角色乙', itemType: '角色', pullIndex: 225, resultType: 'up' },
    { itemName: '限定角色丙', itemType: '角色', pullIndex: 300, resultType: 'up' },
  ]);

  assert.deepEqual(
    Array.from(records, (record) => [record.itemName, record.drawCount]),
    [['限定角色甲', 75], ['迪卢克', 75], ['限定角色乙', 150], ['限定角色丙', 75]],
  );
});

test('the eighth and later pulls are purple and separated without truncation', () => {
  const records = Array.from({ length: 9 }, (_, index) => ({
    itemName: '迪卢克',
    itemType: '角色',
    pullIndex: index + 1,
    pullVersion: { label: '5.7' },
  }));

  const [character] = api.buildCharacterOverview(makeData([], records));
  assert.equal(character.count, 9);
  assert.equal(character.pulls.length, 9);
  assert.deepEqual(
    Array.from(character.pulls, (record) => [record.isPurple, record.startsPurpleGroup]),
    [
      [false, false],
      [false, false],
      [false, false],
      [false, false],
      [false, false],
      [false, false],
      [false, false],
      [true, true],
      [true, false],
    ],
  );
});

test('character overview pagination defaults to ten items and clamps invalid pages', () => {
  const characters = Array.from({ length: 23 }, (_, index) => ({ name: `角色 ${index + 1}` }));
  const firstPage = api.paginateCharacterOverview(characters, 1, 10);
  const lastPage = api.paginateCharacterOverview(characters, 99, 10);

  assert.equal(firstPage.currentPage, 1);
  assert.equal(firstPage.items.length, 10);
  assert.equal(firstPage.totalPages, 3);
  assert.equal(lastPage.currentPage, 3);
  assert.equal(lastPage.items.length, 3);
});

test('scroll hints reflect the available directions without exposing a scrollbar dependency', () => {
  assert.deepEqual(
    { ...api.getCharacterPullScrollState({ scrollLeft: 0, scrollWidth: 700, clientWidth: 300 }) },
    { isScrollable: true, canScrollLeft: false, canScrollRight: true, maxScrollLeft: 400 },
  );
  assert.deepEqual(
    { ...api.getCharacterPullScrollState({ scrollLeft: 400, scrollWidth: 700, clientWidth: 300 }) },
    { isScrollable: true, canScrollLeft: true, canScrollRight: false, maxScrollLeft: 400 },
  );
  assert.deepEqual(
    { ...api.getCharacterPullScrollState({ scrollLeft: 0, scrollWidth: 300, clientWidth: 300 }) },
    { isScrollable: false, canScrollLeft: false, canScrollRight: false, maxScrollLeft: 0 },
  );
});
