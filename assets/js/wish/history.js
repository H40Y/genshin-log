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

function renderHistory(data) {
  historySection.innerHTML = `
    <div class="section-header">
      <h2>5★ 历史</h2>
      <p>当前修改只作用于页面内存数据，不会直接改本地文件；如需保留，请手动导出 JSON。</p>
    </div>
  `;
  historySection.appendChild(createPageSizeControl());

  BANNERS.forEach((banner) => {
    const bannerData = data.wishData[banner.key];
    const sortedHistory = bannerData.fiveStarHistory.slice().sort((a, b) => a.pullIndex - b.pullIndex);
    const descHistory = sortedHistory.slice().sort((a, b) => b.pullIndex - a.pullIndex);
    const totalPages = Math.max(1, Math.ceil(descHistory.length / pageSize));
    currentPages[banner.key] = Math.min(currentPages[banner.key] || 1, totalPages);
    const start = (currentPages[banner.key] - 1) * pageSize;
    const pageItems = descHistory.slice(start, start + pageSize);

    const sectionCard = document.createElement('article');
    sectionCard.className = 'card history-card';

    const rows = pageItems.map((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = buildHistoryTable(item, banner.key, sortedHistory);
      return tr;
    });

    const table = document.createElement('table');
    table.innerHTML = `<thead>${buildHistoryHead(banner.key)}</thead>`;
    const tbody = document.createElement('tbody');
    rows.forEach((row) => tbody.appendChild(row));
    table.appendChild(tbody);

    const tableWrap = document.createElement('div');
    tableWrap.className = 'table-wrap';
    tableWrap.appendChild(table);

    sectionCard.innerHTML = `
      <div class="history-header">
        <div class="history-header-left">
          <h3>${banner.label}</h3>
          <div class="history-summary">${fmt(bannerData.fiveStarHistory.length)} 条 5★ 记录</div>
        </div>
        <div></div>
      </div>
    `;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'ghost-button section-corner-button';
    addButton.textContent = '+';
    addButton.setAttribute('aria-label', `新增${banner.label}5★`);
    addButton.title = `新增${banner.label} 5★`;
    addButton.addEventListener('click', () => openCreateDialog(banner.key));

    sectionCard.appendChild(addButton);
    sectionCard.appendChild(tableWrap);
    sectionCard.appendChild(createPaginationControls(banner.key, descHistory.length, totalPages));
    historySection.appendChild(sectionCard);
  });

  historySection.querySelectorAll('[data-action="edit"]').forEach((button) => {
    button.addEventListener('click', () => openEditDialog(button.dataset.banner, button.dataset.recordId));
  });
}

