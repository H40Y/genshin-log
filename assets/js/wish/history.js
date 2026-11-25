let activeHistoryBanner = BANNERS.find((banner) => banner.key === 'limitedCharacter');

function getGap(history, item) {
  const index = history.findIndex((entry) => entry.id === item.id);
  if (index <= 0) return item.pullIndex;
  return item.pullIndex - history[index - 1].pullIndex;
}

function buildHistoryTable(item, bannerKey, history) {
  const gap = getGap(history, item);

  if (isStandardBanner(bannerKey)) {
    return `
      <td>${item.pullIndex}</td>
      <td>${gap}</td>
      <td>${renderNameWithBadges(item, bannerKey)}</td>
      <td>${item.itemType}</td>
      <td>${item.time ?? '—'}</td>
      <td><button class="table-button" data-action="edit" data-banner="${bannerKey}" data-record-id="${item.id}">修改</button></td>
    `;
  }

  return `
    <td>${item.pullIndex}</td>
    <td>${gap}</td>
    <td>${renderNameWithBadges(item, bannerKey)}</td>
    <td>${item.itemType}</td>
    <td>${item.pullVersion?.label ?? ''}</td>
    <td><button class="table-button" data-action="edit" data-banner="${bannerKey}" data-record-id="${item.id}">修改</button></td>
  `;
}

function buildHistoryHead(bannerKey) {
  if (isStandardBanner(bannerKey)) {
    return `
      <tr>
        <th>抽位</th>
        <th>抽数</th>
        <th>名称</th>
        <th>类型</th>
        <th>时间</th>
        <th>操作</th>
      </tr>
    `;
  }

  return `
    <tr>
      <th>抽位</th>
      <th>抽数</th>
      <th>名称</th>
      <th>类型</th>
      <th>版本</th>
      <th>操作</th>
    </tr>
  `;
}

function createPaginationControls(bannerKey, totalItems, totalPages) {
  const controls = document.createElement('div');
  controls.className = 'history-pagination';

  const pageInfo = document.createElement('div');
  pageInfo.className = 'history-pagination-info';
  pageInfo.textContent = `第 ${currentPages[bannerKey]} / ${totalPages} 页，共 ${fmt(totalItems)} 条`;

  const actions = document.createElement('div');
  actions.className = 'history-pagination-actions';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'ghost-button';
  prevBtn.textContent = '上一页';
  prevBtn.disabled = currentPages[bannerKey] <= 1;
  prevBtn.addEventListener('click', () => {
    currentPages[bannerKey] -= 1;
    renderHistory(currentData);
  });

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'ghost-button';
  nextBtn.textContent = '下一页';
  nextBtn.disabled = currentPages[bannerKey] >= totalPages;
  nextBtn.addEventListener('click', () => {
    currentPages[bannerKey] += 1;
    renderHistory(currentData);
  });

  actions.append(prevBtn, nextBtn);
  controls.append(pageInfo, actions);
  return controls;
}

function createPageSizeControl() {
  const wrap = document.createElement('div');
  wrap.className = 'history-toolbar';

  const label = document.createElement('label');
  label.className = 'history-page-size';
  label.innerHTML = '<span>每页条目</span>';

  const select = document.createElement('select');
  PAGE_SIZE_OPTIONS.forEach((size) => {
    const option = document.createElement('option');
    option.value = String(size);
    option.textContent = `${size} 条`;
    option.selected = size === pageSize;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    pageSize = Number(select.value);
    currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
    renderHistory(currentData);
  });

  label.appendChild(select);
  wrap.appendChild(label);
  return wrap;
}

function createHistoryHeader() {
  const sectionHeader = document.createElement('div');
  sectionHeader.className = 'section-header history-section-header';
  sectionHeader.innerHTML = '<h2>5★ 历史</h2>';
  sectionHeader.appendChild(createPageSizeControl());
  return sectionHeader;
}

function createHistoryCard() {
  const sectionCard = document.createElement('article');
  sectionCard.className = 'card history-card';
  sectionCard.innerHTML = `
    <div class="history-header">
      <div class="history-summary"></div>
    </div>
    <button type="button" class="ghost-button section-corner-button">+</button>
    <div class="history-card-content"></div>
  `;

  const select = document.createElement('select');
  select.className = 'history-banner-select';
  select.setAttribute('aria-label', '选择 5★ 历史卡池');
  BANNERS.forEach((banner) => {
    const option = document.createElement('option');
    option.value = banner.key;
    option.textContent = banner.label;
    select.appendChild(option);
  });
  select.value = activeHistoryBanner.key;
  select.addEventListener('change', () => {
    activeHistoryBanner = BANNERS.find((banner) => banner.key === select.value);
    renderHistory(currentData);
  });

  sectionCard.querySelector('.history-header').prepend(select);
  sectionCard.querySelector('.section-corner-button').addEventListener('click', () => {
    openCreateDialog(activeHistoryBanner.key);
  });
  return sectionCard;
}

function renderHistory(data) {
  let sectionCard = historySection.querySelector('.history-card');
  if (!sectionCard) {
    sectionCard = createHistoryCard();
    historySection.append(createHistoryHeader(), sectionCard);
  }

  const banner = activeHistoryBanner;
  const bannerData = data.wishData[banner.key];
  const sortedHistory = bannerData.fiveStarHistory.slice().sort((a, b) => a.pullIndex - b.pullIndex);
  const descHistory = sortedHistory.slice().sort((a, b) => b.pullIndex - a.pullIndex);
  const totalPages = Math.max(1, Math.ceil(descHistory.length / pageSize));
  currentPages[banner.key] = Math.min(currentPages[banner.key] || 1, totalPages);
  const start = (currentPages[banner.key] - 1) * pageSize;
  const pageItems = descHistory.slice(start, start + pageSize);

  const rows = pageItems.map((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = buildHistoryTable(item, banner.key, sortedHistory);
    return tr;
  });

  const table = document.createElement('table');
  table.className = 'history-table';
  table.innerHTML = `
    <colgroup>
      <col class="history-col-pull-index">
      <col class="history-col-gap">
      <col class="history-col-name">
      <col class="history-col-type">
      <col class="history-col-detail">
      <col class="history-col-action">
    </colgroup>
    <thead>${buildHistoryHead(banner.key)}</thead>
  `;
  const tbody = document.createElement('tbody');
  rows.forEach((row) => tbody.appendChild(row));
  table.appendChild(tbody);

  const tableWrap = document.createElement('div');
  tableWrap.className = 'table-wrap';
  tableWrap.appendChild(table);

  sectionCard.querySelector('.history-summary').textContent = `${fmt(descHistory.length)} 条 5★ 记录`;
  const addButton = sectionCard.querySelector('.section-corner-button');
  addButton.setAttribute('aria-label', `新增${banner.label}5★`);
  addButton.title = `新增${banner.label} 5★`;
  table.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => openEditDialog(button.dataset.banner, button.dataset.recordId));
  });

  sectionCard.querySelector('.history-card-content').replaceChildren(
    tableWrap,
    createPaginationControls(banner.key, descHistory.length, totalPages),
  );
}
