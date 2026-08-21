const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const projectRoot = path.resolve(__dirname, '..');
const context = vm.createContext({ Date, Number, String, Object, Array });
const source = fs.readFileSync(path.join(projectRoot, 'assets/js/version-info.js'), 'utf8');
vm.runInContext(source, context, { filename: 'version-info.js' });
const versionInfo = context.GENSHIN_VERSION_INFO;

test('built-in version catalog follows the attached version sequence through 7.8', () => {
  assert.equal(versionInfo.versions.length, 26);
  assert.deepEqual(
    Array.from(versionInfo.versions, (version) => version.id),
    [
      '5.0', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8',
      '6.0', '6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7',
      '7.0', '7.1', '7.2', '7.3', '7.4', '7.5', '7.6', '7.7', '7.8',
    ],
  );
  assert.equal(versionInfo.getVersionById('6.7').label, '月之八');
});

test('version and half dates are calculated as inclusive 21-day ranges', () => {
  const version50 = versionInfo.getVersionById('5.0');
  assert.deepEqual(
    {
      startDate: version50.startDate,
      endDate: version50.endDate,
      firstHalf: { ...version50.firstHalf },
      secondHalf: { ...version50.secondHalf },
    },
    {
      startDate: '2024-08-28',
      endDate: '2024-10-08',
      firstHalf: {
        key: 'first', label: '上半', group: '5.0.0', startDate: '2024-08-28', endDate: '2024-09-17',
      },
      secondHalf: {
        key: 'second', label: '下半', group: '5.0.5', startDate: '2024-09-18', endDate: '2024-10-08',
      },
    },
  );

  const version78 = versionInfo.getVersionById('7.8');
  assert.equal(version78.startDate, '2027-07-14');
  assert.equal(version78.endDate, '2027-08-24');
});

test('dates map to the correct built-in version half at boundaries', () => {
  assert.equal(versionInfo.getVersionPhaseByDate('2024-09-17 23:59:59').phase.group, '5.0.0');
  assert.equal(versionInfo.getVersionPhaseByDate('2024-09-18 00:00:00').phase.group, '5.0.5');
  assert.equal(versionInfo.getVersionPhaseByDate('2026-08-21 12:00:00').version.id, '7.0');
  assert.equal(versionInfo.getVersionPhaseByDate('2024-08-27 23:59:59'), null);
});

test('version groups map back to their canonical label and half', () => {
  const matched = versionInfo.getVersionPhaseByGroup('6.6.5');
  assert.equal(matched.version.label, '月之七');
  assert.equal(matched.phase.label, '下半');
  assert.equal(versionInfo.getVersionPhaseByGroup('6.8.0'), null);
});
