(function initializeGenshinVersionInfo(global) {
  const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
  const VERSION_DURATION_DAYS = 42;
  const HALF_DURATION_DAYS = 21;
  const FIRST_VERSION_START_UTC = Date.UTC(2024, 7, 28);
  const VERSION_DEFINITIONS = [
    ['5.0', '5.0'],
    ['5.1', '5.1'],
    ['5.2', '5.2'],
    ['5.3', '5.3'],
    ['5.4', '5.4'],
    ['5.5', '5.5'],
    ['5.6', '5.6'],
    ['5.7', '5.7'],
    ['5.8', '5.8'],
    ['6.0', '月之一'],
    ['6.1', '月之二'],
    ['6.2', '月之三'],
    ['6.3', '月之四'],
    ['6.4', '月之五'],
    ['6.5', '月之六'],
    ['6.6', '月之七'],
    ['6.7', '月之八'],
    ['7.0', '7.0'],
    ['7.1', '7.1'],
    ['7.2', '7.2'],
    ['7.3', '7.3'],
    ['7.4', '7.4'],
    ['7.5', '7.5'],
    ['7.6', '7.6'],
    ['7.7', '7.7'],
    ['7.8', '7.8'],
  ];

  function formatUtcDate(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
  }

  function addUtcDays(timestamp, days) {
    return timestamp + days * DAY_IN_MILLISECONDS;
  }

  const versions = Object.freeze(VERSION_DEFINITIONS.map(([sortKey, label], index) => {
    const startTimestamp = addUtcDays(FIRST_VERSION_START_UTC, index * VERSION_DURATION_DAYS);
    const secondHalfStartTimestamp = addUtcDays(startTimestamp, HALF_DURATION_DAYS);
    const nextVersionStartTimestamp = addUtcDays(startTimestamp, VERSION_DURATION_DAYS);
    const major = sortKey.split('.')[0];
    const firstHalf = Object.freeze({
      key: 'first',
      label: '上半',
      group: `${sortKey}.0`,
      startDate: formatUtcDate(startTimestamp),
      endDate: formatUtcDate(secondHalfStartTimestamp - DAY_IN_MILLISECONDS),
    });
    const secondHalf = Object.freeze({
      key: 'second',
      label: '下半',
      group: `${sortKey}.5`,
      startDate: formatUtcDate(secondHalfStartTimestamp),
      endDate: formatUtcDate(nextVersionStartTimestamp - DAY_IN_MILLISECONDS),
    });

    return Object.freeze({
      id: sortKey,
      label,
      sortKey,
      group: `${major}.x`,
      startDate: firstHalf.startDate,
      endDate: secondHalf.endDate,
      firstHalf,
      secondHalf,
    });
  }));

  function normalizeDate(value) {
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) return null;
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const match = String(value ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const normalized = `${match[1]}-${match[2]}-${match[3]}`;
    const timestamp = Date.parse(`${normalized}T00:00:00Z`);
    return Number.isFinite(timestamp) && formatUtcDate(timestamp) === normalized ? normalized : null;
  }

  function getVersionById(versionId) {
    const normalizedId = String(versionId ?? '').trim();
    return versions.find((version) => version.id === normalizedId) ?? null;
  }

  function getVersionBySortKey(sortKey) {
    const normalizedSortKey = String(sortKey ?? '').trim();
    return versions.find((version) => version.sortKey === normalizedSortKey) ?? null;
  }

  function getVersionByLabel(label) {
    const normalizedLabel = String(label ?? '').trim();
    return versions.find((version) => version.label === normalizedLabel) ?? null;
  }

  function getVersionPhaseByDate(value) {
    const date = normalizeDate(value);
    if (!date) return null;
    const version = versions.find((item) => date >= item.startDate && date <= item.endDate);
    if (!version) return null;
    const phase = date <= version.firstHalf.endDate ? version.firstHalf : version.secondHalf;
    return { date, version, phase };
  }

  function getVersionPhaseByGroup(group) {
    const normalizedGroup = String(group ?? '').trim();
    if (!normalizedGroup) return null;
    for (const version of versions) {
      const phase = [version.firstHalf, version.secondHalf]
        .find((item) => item.group === normalizedGroup);
      if (phase) return { version, phase };
    }
    return null;
  }

  function getCurrentVersion(value = new Date()) {
    const date = normalizeDate(value);
    if (!date) return null;
    return versions.find((version) => date >= version.startDate && date <= version.endDate)
      ?? (date < versions[0].startDate ? versions[0] : versions[versions.length - 1]);
  }

  global.GENSHIN_VERSION_INFO = Object.freeze({
    firstVersionStartDate: versions[0].startDate,
    lastVersionEndDate: versions[versions.length - 1].endDate,
    versions,
    normalizeDate,
    getVersionById,
    getVersionBySortKey,
    getVersionByLabel,
    getVersionPhaseByDate,
    getVersionPhaseByGroup,
    getCurrentVersion,
  });
}(globalThis));
