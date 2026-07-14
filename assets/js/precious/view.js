function buildPreciousRecordId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function groupVersionsForDisplay() {
  const grouped = new Map();
  sortVersions(getPreciousData().versions).forEach((version) => {
    const key = version.group || inferVersionGroup(version.sortKey, version.label);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(version);
  });
  return [...grouped.entries()].sort((a, b) => Number(String(a[0]).match(/^\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER) - Number(String(b[0]).match(/^\d+/)?.[0] ?? Number.MAX_SAFE_INTEGER));
}
function getVersionGroups() { return groupVersionsForDisplay(); }
function getLatestExpenseVersionId(materialKey) {
  const expenses = getPreciousMaterialData(materialKey).expenses || [];
  if (expenses.length) {
    const latestExpense = expenses
      .slice()
      .sort((a, b) => compareVersionGroup(getVersionMap().get(a.versionId)?.sortKey, getVersionMap().get(b.versionId)?.sortKey))[expenses.length - 1];
    if (latestExpense?.versionId) return latestExpense.versionId;
  }
  const versions = sortVersions(getPreciousData().versions);
  return versions[versions.length - 1]?.id ?? '';
}
function groupExpensesByVersion(expenses) {
  const grouped = new Map();
  expenses.forEach((item) => { const key = item.versionId || 'unassigned'; if (!grouped.has(key)) grouped.set(key, []); grouped.get(key).push(item); });
  return [...grouped.entries()].sort((a, b) => compareVersionGroup(getVersionMap().get(a[0])?.sortKey, getVersionMap().get(b[0])?.sortKey));
}
function paginateExpenseGroups(groups, pageSize = PRECIOUS_EXPENSE_PAGE_SIZE) {
  if (!groups.length) return [];
  const pages = [];
  let currentPage = [];
  let currentCount = 0;
  groups.forEach((group) => {
    const groupCount = group[1].length;
    if (!currentPage.length) {
      currentPage.push(group);
      currentCount = groupCount;
      return;
    }
    if (currentCount + groupCount <= pageSize) {
      currentPage.push(group);
      currentCount += groupCount;
      return;
    }
    pages.push(currentPage);
    currentPage = [group];
    currentCount = groupCount;
  });
  if (currentPage.length) pages.push(currentPage);
  return pages;
}
function getExpensePage(materialKey, totalPages) {
  const currentPage = preciousExpensePageByMaterial[materialKey] ?? totalPages;
  return Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1));
}
function setExpensePage(materialKey, page) {
  preciousExpensePageByMaterial[materialKey] = page;
  rerenderPrecious();
}
function collectIncomeItems(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  return [
    ...material.versionIncomeRecords.map((record) => ({ id: record.id, type: 'version', sourceLabel: getVersionIncomeSourceLabel(materialKey, record.sourceKey), cycleLabel: getIncomeCycleLabel(materialKey, record.sourceKey, record), amount: record.entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0), note: record.note ?? '', detail: `${fmt(record.entries.length)} 个版本` })),
    ...material.otherIncomes.map((record) => ({ id: record.id, type: 'other', sourceLabel: record.source, cycleLabel: getIncomeCycleLabel(materialKey, record.source, record), amount: record.amount, note: record.note ?? '', detail: '' })),
  ].sort((a, b) => getIncomeSourceSortIndex(a.type === 'version' ? getPreciousMaterialData(materialKey).versionIncomeRecords.find((record) => record.id === a.id)?.sourceKey : a.sourceLabel) - getIncomeSourceSortIndex(b.type === 'version' ? getPreciousMaterialData(materialKey).versionIncomeRecords.find((record) => record.id === b.id)?.sourceKey : b.sourceLabel) || a.sourceLabel.localeCompare(b.sourceLabel, 'zh-CN'));
}
function createIconButton(title, onClick) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'icon-button'; button.textContent = '+'; button.title = title; button.setAttribute('aria-label', title); button.addEventListener('click', onClick); return button;
}
function createBlockHeader(title, summary, addTitle, onAdd) {
  const header = document.createElement('div'); header.className = 'block-header';
  const left = document.createElement('div'); left.className = 'block-header-left';
  const h3 = document.createElement('h3'); h3.textContent = title; left.appendChild(h3);
  if (summary) { const badge = document.createElement('div'); badge.className = 'history-summary'; badge.textContent = summary; left.appendChild(badge); }
  const right = document.createElement('div'); if (onAdd) right.appendChild(createIconButton(addTitle, onAdd));
  header.append(left, right); return header;
}
function createMaterialTabs(materialKey, activePanel, counts) {
  const tabs = document.createElement('div');
  tabs.className = 'precious-material-tabs';
  tabs.setAttribute('role', 'tablist');
  [
    ['income', '收入', counts.income],
    ['expense', '支出', counts.expense],
  ].forEach(([panel, label, count]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = activePanel === panel ? 'precious-material-tab is-active' : 'precious-material-tab';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', activePanel === panel ? 'true' : 'false');
    button.textContent = `${label} ${fmt(count)}`;
    button.addEventListener('click', () => {
      preciousMobilePanelByMaterial[materialKey] = panel;
      rerenderPrecious();
    });
    tabs.appendChild(button);
  });
  return tabs;
}
function buildPreciousStatCard(materialKey) {
  const node = document.createElement('article'); node.className = 'card precious-stat-card';
  const summary = summarizeMaterial(materialKey);
  node.innerHTML = `<div class="precious-stat-title">${getMaterialLabel(materialKey)}</div>`;
  const grid = document.createElement('div'); grid.className = 'precious-stat-grid';
  grid.append(createMetaBox('总收入', fmt(summary.incomeTotal)), createMetaBox('总支出', fmt(summary.expenseTotal)), createMetaBox('当前结余', fmt(summary.balance)));
  node.appendChild(grid); return node;
}
function buildVersionsCard() {
  const versionCard = document.createElement('article'); versionCard.className = 'card versions-card-muted';
  versionCard.appendChild(createBlockHeader('记录版本', `${fmt(getPreciousData().versions.length)} 个版本`, '修改版本', openCreatePreciousVersionDialog));
  groupVersionsForDisplay().forEach(([groupName, versions]) => {
    const details = document.createElement('details'); details.className = 'version-group-details';
    const summary = document.createElement('summary'); summary.textContent = `${groupName} · ${fmt(versions.length)} 个版本`; details.appendChild(summary);
    const list = document.createElement('div'); list.className = 'version-chip-list';
    versions.forEach((version) => {
      const row = document.createElement('div'); row.className = 'version-chip'; row.innerHTML = `<span>${version.label}</span>`;
      const editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'ghost-button compact-button'; editBtn.textContent = '修改'; editBtn.addEventListener('click', () => openEditPreciousVersionDialog(version.id)); row.appendChild(editBtn); list.appendChild(row);
    });
    details.appendChild(list); versionCard.appendChild(details);
  });
  return versionCard;
}
function buildPreciousIncomeSubBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const groups = [
    ...material.versionIncomeRecords.map((record) => ({
      id: record.id,
      type: 'version',
      title: getVersionIncomeSourceLabel(materialKey, record.sourceKey),
      items: [{
        id: record.id,
        type: 'version',
        sourceLabel: getVersionIncomeSourceLabel(materialKey, record.sourceKey),
        cycleLabel: getIncomeCycleLabel(materialKey, record.sourceKey, record),
        amount: record.entries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0),
        note: record.note ?? '',
      }],
    })),
    ...material.otherIncomes.reduce((acc, record) => {
      const existing = acc.find((group) => group.title === record.source);
      const item = {
        id: record.id,
        type: 'other',
        sourceLabel: record.source,
        cycleLabel: getIncomeCycleLabel(materialKey, record.source, record),
        amount: record.amount,
        note: record.note ?? '',
      };
      if (existing) existing.items.push(item);
      else acc.push({ id: `group-${record.source}`, type: 'other-group', title: record.source, items: [item] });
      return acc;
    }, []),
  ].sort((a, b) => getIncomeSourceSortIndex(a.type === 'version' ? material.versionIncomeRecords.find((record) => record.id === a.id)?.sourceKey : a.title) - getIncomeSourceSortIndex(b.type === 'version' ? material.versionIncomeRecords.find((record) => record.id === b.id)?.sourceKey : b.title) || a.title.localeCompare(b.title, 'zh-CN'));
  const totalAmount = groups.reduce((sum, group) => sum + group.items.reduce((inner, item) => inner + (Number(item.amount) || 0), 0), 0);
  const card = document.createElement('section'); card.className = 'subcard';
  card.appendChild(createBlockHeader('收入', `${fmt(totalAmount)} 个`, `新增${getMaterialLabel(materialKey)}收入`, () => openCreatePreciousIncomeDialog(materialKey)));
  if (!groups.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '暂无收入记录'; card.appendChild(note); return card; }
  groups.forEach((group) => {
    const section = document.createElement('div'); section.className = 'nested-group';
    const groupAmount = group.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const title = document.createElement('div'); title.className = 'nested-group-title'; title.textContent = `${group.title} · ${fmt(groupAmount)} 个`; section.appendChild(title);
    const tableWrap = document.createElement('div'); tableWrap.className = 'table-wrap';
    const table = document.createElement('table'); table.innerHTML = '<thead><tr><th>周期</th><th>数量</th><th>备注</th><th>操作</th></tr></thead>';
    const tbody = document.createElement('tbody');
    group.items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${item.cycleLabel}</td><td>${fmt(item.amount)}</td><td>${item.note || '—'}</td><td><button class="table-button compact-button" data-action="edit-income" data-material="${materialKey}" data-record-id="${item.id}" data-record-type="${item.type}">修改</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); tableWrap.appendChild(table); section.appendChild(tableWrap); card.appendChild(section);
  });
  card.querySelectorAll('[data-action="edit-income"]').forEach((button) => button.addEventListener('click', () => openEditPreciousIncomeDialog(button.dataset.material, button.dataset.recordType, button.dataset.recordId)));
  return card;
}
function buildPreciousExpenseSubBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const totalAmount = material.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const card = document.createElement('section'); card.className = 'subcard';
  card.appendChild(createBlockHeader('支出', `${fmt(totalAmount)} 个`, `新增${getMaterialLabel(materialKey)}支出`, () => openCreatePreciousExpenseDialog(materialKey)));
  if (!getPreciousData().versions.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '先新增版本分组，再录入支出。'; card.appendChild(note); return card; }
  if (!material.expenses.length) { const note = document.createElement('div'); note.className = 'empty-state'; note.textContent = '暂无支出记录'; card.appendChild(note); return card; }
  const groupedExpenses = groupExpensesByVersion(material.expenses);
  const pages = paginateExpenseGroups(groupedExpenses);
  const totalPages = pages.length;
  const currentPage = getExpensePage(materialKey, totalPages);
  const currentGroups = pages[currentPage - 1] || [];
  currentGroups.forEach(([versionId, items]) => {
    const group = document.createElement('div'); group.className = 'nested-group';
    const groupAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const title = document.createElement('div'); title.className = 'nested-group-title'; title.textContent = `${getVersionLabel(versionId)} · ${fmt(groupAmount)} 个`; group.appendChild(title);
    const tableWrap = document.createElement('div'); tableWrap.className = 'table-wrap';
    const table = document.createElement('table'); table.innerHTML = '<thead><tr><th>数量</th><th>套装</th><th>部位</th><th>属性</th><th>备注</th><th>操作</th></tr></thead>';
    const tbody = document.createElement('tbody');
    items.forEach((item) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${fmt(item.amount)}</td><td>${item.setName}</td><td>${item.slot}</td><td>${item.mainStat}</td><td>${item.note || '—'}</td><td><button class="table-button compact-button" data-action="edit-expense" data-material="${materialKey}" data-record-id="${item.id}">修改</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody); tableWrap.appendChild(table); group.appendChild(tableWrap); card.appendChild(group);
  });
  if (totalPages > 1) {
    const pagination = document.createElement('div');
    pagination.className = 'pagination-row';
    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'ghost-button compact-button';
      prevBtn.textContent = '上一页';
      prevBtn.addEventListener('click', () => setExpensePage(materialKey, currentPage - 1));
      pagination.appendChild(prevBtn);
    }
    const pageInfo = document.createElement('div');
    pageInfo.className = 'history-summary';
    pageInfo.textContent = `${currentPage} / ${totalPages}`;
    pagination.appendChild(pageInfo);
    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'ghost-button compact-button';
      nextBtn.textContent = '下一页';
      nextBtn.addEventListener('click', () => setExpensePage(materialKey, currentPage + 1));
      pagination.appendChild(nextBtn);
    }
    card.appendChild(pagination);
  }
  card.querySelectorAll('[data-action="edit-expense"]').forEach((button) => button.addEventListener('click', () => openEditPreciousExpenseDialog(button.dataset.material, button.dataset.recordId)));
  return card;
}
function buildPreciousMaterialBlock(materialKey) {
  const material = getPreciousMaterialData(materialKey);
  const incomeAmount = material.versionIncomeRecords.reduce((sum, record) => sum + record.entries.reduce((inner, entry) => inner + (Number(entry.amount) || 0), 0), 0)
    + material.otherIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const expenseAmount = material.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const activePanel = preciousMobilePanelByMaterial[materialKey] || 'income';
  const block = document.createElement('article'); block.className = 'card precious-material-block';
  block.appendChild(createBlockHeader(getMaterialLabel(materialKey)));
  block.appendChild(createMaterialTabs(materialKey, activePanel, { income: incomeAmount, expense: expenseAmount }));
  const grid = document.createElement('div'); grid.className = 'grid cards-2 precious-material-grid';
  const incomeBlock = buildPreciousIncomeSubBlock(materialKey);
  incomeBlock.classList.add('precious-material-panel');
  incomeBlock.dataset.panel = 'income';
  incomeBlock.hidden = activePanel !== 'income';
  const expenseBlock = buildPreciousExpenseSubBlock(materialKey);
  expenseBlock.classList.add('precious-material-panel');
  expenseBlock.dataset.panel = 'expense';
  expenseBlock.hidden = activePanel !== 'expense';
  grid.appendChild(incomeBlock); grid.appendChild(expenseBlock); block.appendChild(grid); return block;
}
