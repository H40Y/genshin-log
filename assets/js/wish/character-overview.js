const CHARACTER_OVERVIEW_COUNT_THRESHOLD = 7;
const CHARACTER_OVERVIEW_DEFAULT_SHOW_STANDARD = true;

let showStandardCharacters = CHARACTER_OVERVIEW_DEFAULT_SHOW_STANDARD;

function compareCharacterPullRecords(a, b) {
  const aVersionGroup = getCharacterPullVersionGroup(a);
  const bVersionGroup = getCharacterPullVersionGroup(b);
  const aUsesStandardFallback = a?.bannerKey === 'standard' && !aVersionGroup;
  const bUsesStandardFallback = b?.bannerKey === 'standard' && !bVersionGroup;
  if (aUsesStandardFallback !== bUsesStandardFallback) return aUsesStandardFallback ? -1 : 1;

  if (a?.bannerKey === b?.bannerKey) {
    return Number(a.pullIndex) - Number(b.pullIndex);
  }

  if (aVersionGroup && bVersionGroup) {
    const versionDifference = compareVersionGroup(aVersionGroup, bVersionGroup);
    if (versionDifference !== 0) return versionDifference;
  }

  const bannerOrder = {
    standard: 0,
    limitedCharacter: 1,
  };
  const bannerDifference = (bannerOrder[a.bannerKey] ?? 99) - (bannerOrder[b.bannerKey] ?? 99);
  if (bannerDifference !== 0) return bannerDifference;
  return Number(a.pullIndex) - Number(b.pullIndex);
}

function getCharacterPullVersionGroup(record) {
  if (record?.bannerKey === 'standard') {
    return GENSHIN_VERSION_INFO.getVersionPhaseByDate(record.time)?.phase.group ?? null;
  }
  const group = String(record?.pullVersion?.group ?? '').trim();
  return group || null;
}

function sortCharacterPullRecords(records) {
  return records.slice().sort(compareCharacterPullRecords);
}

function getLatestLimitedPullIndex(records) {
  return records.reduce((latest, record) => (
    record.bannerKey === 'limitedCharacter'
      ? Math.max(latest, Number(record.pullIndex) || 0)
      : latest
  ), 0);
}

function buildStandardPullRecords(history) {
  let previousFiveStarPullIndex = 0;
  return history
    .slice()
    .sort((a, b) => Number(a.pullIndex) - Number(b.pullIndex))
    .map((item) => {
      const drawCount = Number(item.pullIndex) - previousFiveStarPullIndex;
      previousFiveStarPullIndex = Number(item.pullIndex);
      return {
        bannerKey: 'standard',
        drawCount,
        itemName: item.itemName,
        itemType: item.itemType,
        pullIndex: item.pullIndex,
        time: item.time ?? null,
        pullVersion: null,
      };
    });
}

function buildLimitedCharacterPullRecords(history) {
  let previousUpPullIndex = 0;
  return history
    .slice()
    .sort((a, b) => Number(a.pullIndex) - Number(b.pullIndex))
    .map((item) => {
      const drawCount = Number(item.pullIndex) - previousUpPullIndex;
      const record = {
        bannerKey: 'limitedCharacter',
        drawCount,
        itemName: item.itemName,
        itemType: item.itemType,
        pullIndex: item.pullIndex,
        time: item.time ?? null,
        pullVersion: item.pullVersion ?? null,
      };
      if (item.resultType === 'up') previousUpPullIndex = Number(item.pullIndex);
      return record;
    });
}

function buildCharacterOverview(data) {
  const grouped = new Map();
  const sources = [
    buildStandardPullRecords(data?.wishData?.standard?.fiveStarHistory || []),
    buildLimitedCharacterPullRecords(data?.wishData?.limitedCharacter?.fiveStarHistory || []),
  ];

  sources.forEach((records) => {
    records.forEach((record) => {
      if (record.itemType !== '角色') return;

      const name = String(record.itemName ?? '未命名');
      if (!grouped.has(name)) grouped.set(name, []);
      grouped.get(name).push({
        bannerKey: record.bannerKey,
        drawCount: record.drawCount,
        pullIndex: record.pullIndex,
        time: record.time,
        pullVersion: record.pullVersion,
      });
    });
  });

  return [...grouped.entries()]
    .map(([name, records]) => {
      const pulls = sortCharacterPullRecords(records).map((record, index) => ({
        ...record,
        isPurple: index >= CHARACTER_OVERVIEW_COUNT_THRESHOLD,
        startsPurpleGroup: index === CHARACTER_OVERVIEW_COUNT_THRESHOLD,
      }));
      return {
        name,
        count: pulls.length,
        isStandardCharacter: STANDARD_CHARACTER_NAMES.has(name),
        latestLimitedPullIndex: getLatestLimitedPullIndex(pulls),
        pulls,
      };
    })
    .sort((a, b) => (
      b.count - a.count
      || b.latestLimitedPullIndex - a.latestLimitedPullIndex
      || a.name.localeCompare(b.name, 'zh-CN')
    ));
}

function filterCharacterOverviewCharacters(
  characters,
  includeStandardCharacters = CHARACTER_OVERVIEW_DEFAULT_SHOW_STANDARD,
) {
  if (includeStandardCharacters) return characters.slice();
  return characters.filter((character) => !character.isStandardCharacter);
}

function formatCharacterPullLabel(record) {
  if (record.bannerKey === 'standard') {
    return `常驻·${record.drawCount}`;
  }

  const versionLabel = String(record.pullVersion?.label ?? '').trim() || '未标注';
  return `${versionLabel}·${record.drawCount}`;
}

function getCharacterPullPillClass(character, record) {
  if (record.isPurple) return 'character-pull-pill character-pull-pill-purple';
  if (character.isStandardCharacter) return 'character-pull-pill character-pull-pill-standard';
  return 'character-pull-pill';
}

function groupCharacterOverviewByCount(characters) {
  const groups = new Map();
  characters.forEach((character) => {
    const count = Math.min(character.count, CHARACTER_OVERVIEW_COUNT_THRESHOLD + 1);
    if (!groups.has(count)) groups.set(count, []);
    groups.get(count).push(character);
  });
  return groups;
}

function createCharacterOverviewFilter() {
  const standardFilter = document.createElement('label');
  standardFilter.className = 'character-overview-filter';

  const standardCheckbox = document.createElement('input');
  standardCheckbox.type = 'checkbox';
  standardCheckbox.checked = showStandardCharacters;
  standardCheckbox.addEventListener('change', () => {
    showStandardCharacters = standardCheckbox.checked;
    renderCharacterOverview(currentData);
    characterOverviewSection.querySelector('.character-overview-filter input').focus();
  });

  const standardFilterText = document.createElement('span');
  standardFilterText.textContent = '显示常驻';
  standardFilter.append(standardCheckbox, standardFilterText);

  return standardFilter;
}

function showCharacterPullDetails(character) {
  const title = characterPullDialog.querySelector('#character-pull-dialog-title');
  const pulls = characterPullDialog.querySelector('.character-overview-pulls');
  title.textContent = `${character.name} · ${fmt(character.count)} 次`;

  const entries = document.createDocumentFragment();
  character.pulls.forEach((record) => {
    if (record.startsPurpleGroup) {
      const separator = document.createElement('span');
      separator.className = 'character-pull-separator';
      separator.textContent = '｜';
      separator.setAttribute('aria-hidden', 'true');
      entries.appendChild(separator);
    }

    const pill = document.createElement('span');
    pill.className = getCharacterPullPillClass(character, record);
    pill.textContent = formatCharacterPullLabel(record);
    entries.appendChild(pill);
  });
  pulls.replaceChildren(entries);
  characterPullDialog.showModal();
  syncBodyDialogState();
}

function createCharacterOverviewRow(count, characters) {
  const row = document.createElement('div');
  row.className = 'character-overview-row';

  const label = document.createElement('div');
  label.className = 'character-overview-count';
  label.textContent = count > CHARACTER_OVERVIEW_COUNT_THRESHOLD
    ? `${CHARACTER_OVERVIEW_COUNT_THRESHOLD}+次`
    : `${count}次`;

  const names = document.createElement('div');
  names.className = 'character-overview-names';
  characters.forEach((character) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = getCharacterPullPillClass(character, {
      isPurple: count > CHARACTER_OVERVIEW_COUNT_THRESHOLD,
    }) + ' character-overview-name';
    button.textContent = character.name;
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', () => showCharacterPullDetails(character));
    names.appendChild(button);
  });

  row.append(label, names);
  return row;
}

function renderCharacterOverview(data) {
  const allCharacters = buildCharacterOverview(data);
  const characters = filterCharacterOverviewCharacters(allCharacters, showStandardCharacters);

  const header = document.createElement('div');
  header.className = 'section-header history-section-header character-overview-section-header';
  header.innerHTML = '<h2>角色总览</h2>';
  header.appendChild(createCharacterOverviewFilter());

  const card = document.createElement('article');
  card.className = 'card character-overview-card';

  if (!characters.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state character-overview-empty';
    empty.textContent = allCharacters.length
      ? '暂无符合筛选条件的 5★ 角色'
      : '暂无 5★ 角色记录';
    card.appendChild(empty);
  } else {
    groupCharacterOverviewByCount(characters).forEach((group, count) => {
      card.appendChild(createCharacterOverviewRow(count, group));
    });
  }

  characterOverviewSection.replaceChildren(header, card);
}
