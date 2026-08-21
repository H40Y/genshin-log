const CHARACTER_OVERVIEW_PURPLE_THRESHOLD = 7;
const CHARACTER_OVERVIEW_DEFAULT_PAGE_SIZE = 10;
const CHARACTER_OVERVIEW_DEFAULT_SHOW_STANDARD = true;

let characterOverviewPageSize = CHARACTER_OVERVIEW_DEFAULT_PAGE_SIZE;
let currentCharacterOverviewPage = 1;
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
        isPurple: index >= CHARACTER_OVERVIEW_PURPLE_THRESHOLD,
        startsPurpleGroup: index === CHARACTER_OVERVIEW_PURPLE_THRESHOLD,
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

function getCharacterPullScrollState(pulls) {
  const maxScrollLeft = Math.max(0, pulls.scrollWidth - pulls.clientWidth);
  const isScrollable = maxScrollLeft > 1;
  return {
    isScrollable,
    canScrollLeft: isScrollable && pulls.scrollLeft > 1,
    canScrollRight: isScrollable && pulls.scrollLeft < maxScrollLeft - 1,
    maxScrollLeft,
  };
}

function updateCharacterPullScrollHint(pulls) {
  const state = getCharacterPullScrollState(pulls);
  pulls.classList.toggle('is-scrollable', state.isScrollable);
  pulls.classList.toggle('can-scroll-left', state.canScrollLeft);
  pulls.classList.toggle('can-scroll-right', state.canScrollRight);
  return state;
}

function initializeCharacterPullScroller(pulls) {
  pulls.addEventListener('scroll', () => updateCharacterPullScrollHint(pulls), { passive: true });
  requestAnimationFrame(() => {
    const state = getCharacterPullScrollState(pulls);
    if (state.isScrollable) pulls.scrollLeft = state.maxScrollLeft;
    updateCharacterPullScrollHint(pulls);
  });
}

function paginateCharacterOverview(characters, requestedPage, requestedPageSize) {
  const pageSize = Math.max(1, Number(requestedPageSize) || CHARACTER_OVERVIEW_DEFAULT_PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(characters.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(requestedPage) || 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  return {
    currentPage,
    items: characters.slice(start, start + pageSize),
    pageSize,
    totalItems: characters.length,
    totalPages,
  };
}

function resetCharacterOverviewPagination() {
  currentCharacterOverviewPage = 1;
}

function createCharacterOverviewPageSizeControl() {
  const wrap = document.createElement('div');
  wrap.className = 'history-toolbar character-overview-toolbar';

  const standardFilter = document.createElement('label');
  standardFilter.className = 'character-overview-filter';

  const standardCheckbox = document.createElement('input');
  standardCheckbox.type = 'checkbox';
  standardCheckbox.checked = showStandardCharacters;
  standardCheckbox.addEventListener('change', () => {
    showStandardCharacters = standardCheckbox.checked;
    resetCharacterOverviewPagination();
    renderCharacterOverview(currentData);
  });

  const standardFilterText = document.createElement('span');
  standardFilterText.textContent = '显示常驻';
  standardFilter.append(standardCheckbox, standardFilterText);

  const label = document.createElement('label');
  label.className = 'history-page-size';
  label.innerHTML = '<span>每页角色</span>';

  const select = document.createElement('select');
  PAGE_SIZE_OPTIONS.forEach((size) => {
    const option = document.createElement('option');
    option.value = String(size);
    option.textContent = `${size} 个`;
    option.selected = size === characterOverviewPageSize;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    characterOverviewPageSize = Number(select.value);
    resetCharacterOverviewPagination();
    renderCharacterOverview(currentData);
  });

  label.appendChild(select);
  wrap.append(standardFilter, label);
  return wrap;
}

function createCharacterOverviewPagination(pagination) {
  const controls = document.createElement('div');
  controls.className = 'history-pagination character-overview-pagination';

  const pageInfo = document.createElement('div');
  pageInfo.className = 'history-pagination-info';
  pageInfo.textContent = `第 ${pagination.currentPage} / ${pagination.totalPages} 页，共 ${fmt(pagination.totalItems)} 个角色`;

  const actions = document.createElement('div');
  actions.className = 'history-pagination-actions';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ghost-button';
  prevBtn.textContent = '上一页';
  prevBtn.disabled = pagination.currentPage <= 1;
  prevBtn.addEventListener('click', () => {
    currentCharacterOverviewPage -= 1;
    renderCharacterOverview(currentData);
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ghost-button';
  nextBtn.textContent = '下一页';
  nextBtn.disabled = pagination.currentPage >= pagination.totalPages;
  nextBtn.addEventListener('click', () => {
    currentCharacterOverviewPage += 1;
    renderCharacterOverview(currentData);
  });

  actions.append(prevBtn, nextBtn);
  controls.append(pageInfo, actions);
  return controls;
}

function createCharacterOverviewRow(character) {
  const row = document.createElement('div');
  row.className = 'character-overview-row';

  const identity = document.createElement('div');
  identity.className = 'character-overview-identity';

  const name = document.createElement('span');
  name.className = 'character-overview-name';
  name.textContent = character.name;

  const count = document.createElement('span');
  count.className = 'character-overview-count';
  count.textContent = fmt(character.count);
  count.setAttribute('aria-label', `共 ${character.count} 次`);
  identity.append(name, count);

  const pulls = document.createElement('div');
  pulls.className = 'character-overview-pulls';
  pulls.tabIndex = 0;
  pulls.setAttribute('aria-label', `${character.name}的抽取记录，可横向滑动`);
  character.pulls.forEach((record) => {
    if (record.startsPurpleGroup) {
      const separator = document.createElement('span');
      separator.className = 'character-pull-separator';
      separator.textContent = '｜';
      separator.setAttribute('aria-hidden', 'true');
      pulls.appendChild(separator);
    }

    const pill = document.createElement('span');
    pill.className = getCharacterPullPillClass(character, record);
    pill.textContent = formatCharacterPullLabel(record);
    pulls.appendChild(pill);
  });
  initializeCharacterPullScroller(pulls);

  row.append(identity, pulls);
  return row;
}

function renderCharacterOverview(data) {
  const allCharacters = buildCharacterOverview(data);
  const characters = filterCharacterOverviewCharacters(allCharacters, showStandardCharacters);
  const pagination = paginateCharacterOverview(
    characters,
    currentCharacterOverviewPage,
    characterOverviewPageSize,
  );
  currentCharacterOverviewPage = pagination.currentPage;

  const header = document.createElement('div');
  header.className = 'section-header history-section-header character-overview-section-header';
  header.innerHTML = '<h2>角色总览</h2>';
  header.appendChild(createCharacterOverviewPageSizeControl());

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
    pagination.items.forEach((character) => {
      card.appendChild(createCharacterOverviewRow(character));
    });
    card.appendChild(createCharacterOverviewPagination(pagination));
  }

  characterOverviewSection.replaceChildren(header, card);
}
