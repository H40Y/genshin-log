function getVersionDisplayText(selectionState) { const version = getVersionMap().get(selectionState?.versionId); return version ? version.label : '请选择版本'; }
function syncVersionTriggerText() { if (preciousExpenseVersionTriggerText) preciousExpenseVersionTriggerText.textContent = getVersionDisplayText(preciousExpenseSelection); }
function closeVersionPickerDialog() { if (!versionPickerDialog?.open) return; versionPickerDialog.close(); activeVersionPickerTarget = null; versionPickerMode = 'select'; syncBodyDialogState(); }
function openVersionPickerDialog(target) {
  activeVersionPickerTarget = target;
  versionPickerMode = target === 'income' ? 'edit' : 'select';
  versionPickerDialogTitle.textContent = target === 'income' ? '编辑版本数量' : '选择版本';
  versionPickerSelectShell.hidden = false;
  versionPickerEditShell.hidden = versionPickerMode !== 'edit';
  const selectionState = target === 'income' ? preciousIncomeSelection : preciousExpenseSelection;
  renderCascadePicker(versionPickerGroupList, versionPickerVersionList, selectionState);
  syncVersionPickerEditShell();
  versionPickerDialog.showModal();
  syncBodyDialogState();
}
function renderCascadePicker(groupContainer, versionContainer, selectionState) {
  const groups = getVersionGroups();
  if (!selectionState.group) selectionState.group = groups[0]?.[0] ?? '';
  const currentGroupEntry = groups.find(([name]) => name === selectionState.group) || groups[0];
  if (currentGroupEntry && !currentGroupEntry[1].some((item) => item.id === selectionState.versionId)) selectionState.versionId = currentGroupEntry[1][0]?.id ?? '';
  groupContainer.innerHTML = '';
  groups.forEach(([groupName]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = selectionState.group === groupName ? 'cascade-item is-active' : 'cascade-item';
    button.textContent = groupName;
    button.addEventListener('click', () => {
      selectionState.group = groupName;
      selectionState.versionId = '';
      renderCascadePicker(groupContainer, versionContainer, selectionState);
      if (versionPickerMode === 'select') syncVersionTriggerText();
      else syncVersionPickerEditShell();
    });
    groupContainer.appendChild(button);
  });
  const activeGroup = groups.find(([name]) => name === selectionState.group) || currentGroupEntry;
  versionContainer.innerHTML = '';
  (activeGroup?.[1] || []).forEach((version) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = selectionState.versionId === version.id ? 'cascade-item is-active' : 'cascade-item';
    button.textContent = version.label;
    button.addEventListener('click', () => {
      selectionState.versionId = version.id;
      renderCascadePicker(groupContainer, versionContainer, selectionState);
      if (versionPickerMode === 'select') { syncVersionTriggerText(); closeVersionPickerDialog(); }
      else syncVersionPickerEditShell();
    });
    versionContainer.appendChild(button);
  });
  selectionState.group = activeGroup?.[0] || '';
  selectionState.versionId = selectionState.versionId || activeGroup?.[1]?.[0]?.id || '';
}
function syncVersionPickerEditShell() {
  if (versionPickerMode !== 'edit') return;
  versionPickerEditorLabel.textContent = `数量（${getVersionDisplayText(preciousIncomeSelection)}）`;
  const entry = draftIncomeVersionEntries.find((item) => item.versionId === preciousIncomeSelection.versionId);
  versionPickerEditorInput.value = Number.isFinite(entry?.amount) ? String(entry.amount) : '';
  versionPickerEditorHint.textContent = '';
  renderVersionPickerEditList();
}
function renderVersionPickerEditList() {
  if (versionPickerMode !== 'edit') return;
  versionPickerEditList.innerHTML = '';
  if (!draftIncomeVersionEntries.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '尚未录入任何版本数量';
    versionPickerEditList.appendChild(empty);
    return;
  }
  draftIncomeVersionEntries.slice().sort((a, b) => compareVersionGroup(getVersionMap().get(a.versionId)?.sortKey, getVersionMap().get(b.versionId)?.sortKey)).forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'version-entry-chip compact-chip';
    row.innerHTML = `<span>${getVersionLabel(entry.versionId)}·${fmt(entry.amount)}</span>`;
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'chip-close-button';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      draftIncomeVersionEntries = draftIncomeVersionEntries.filter((item) => item.versionId !== entry.versionId);
      renderVersionPickerEditList();
      syncIncomeVersionSummary();
    });
    row.appendChild(removeBtn);
    versionPickerEditList.appendChild(row);
  });
}
function syncIncomeVersionSummary() {
  const summaryNode = document.querySelector('#precious-income-version-summary');
  if (!summaryNode) return;
  summaryNode.textContent = draftIncomeVersionEntries.length ? `已记录 ${fmt(draftIncomeVersionEntries.length)} 个版本` : '尚未填写版本数量';
}
function renderIncomeModeFields(mode) {
  if (mode === 'version') {
    preciousIncomeModeFields.innerHTML = `<div class="form-span-2 income-mode-block"><div class="income-mode-title">版本数量</div><div class="version-inline-summary compact-summary" id="precious-income-version-summary">${draftIncomeVersionEntries.length ? `已记录 ${fmt(draftIncomeVersionEntries.length)} 个版本` : '尚未填写版本数量'}</div></div>`;
  } else {
    preciousIncomeModeFields.innerHTML = `<div class="form-span-2 inline-fields"><label><span>周期</span><input id="precious-income-cycle-label-input" name="cycleLabel" /></label><label><span>数量</span><input id="precious-income-amount-input" name="amount" type="number" min="1" /></label></div>`;
  }
}
function syncIncomeDialogFields() {
  if (!preciousIncomeEditing) return;
  const materialKey = preciousIncomeMaterialInput.value;
  const editingRecordId = preciousIncomeEditing.type === 'version' ? preciousIncomeEditing.recordId : null;
  const versionSources = getAvailableVersionIncomeSourceOptions(materialKey, editingRecordId);
  const otherSources = PRECIOUS_OTHER_INCOME_SOURCE_OPTIONS[materialKey] ?? [];
  const allSources = [
    ...versionSources.map((item) => ({ value: item.key, label: item.label, mode: 'version' })),
    ...otherSources.map((value) => ({ value, label: value, mode: 'other' })),
  ].sort((a, b) => getIncomeSourceSortIndex(a.value) - getIncomeSourceSortIndex(b.value) || a.label.localeCompare(b.label, 'zh-CN'));
  const previousValue = preciousIncomeSourceInput.value;
  preciousIncomeSourceInput.innerHTML = '';
  allSources.forEach((item) => {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    option.dataset.mode = item.mode;
    preciousIncomeSourceInput.appendChild(option);
  });
  if (allSources.some((item) => item.value === previousValue)) preciousIncomeSourceInput.value = previousValue;
  else if (preciousIncomeEditing.mode === 'edit') {
    if (preciousIncomeEditing.type === 'version') {
      const record = findPreciousVersionIncomeRecord(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      preciousIncomeSourceInput.value = record?.sourceKey ?? allSources[0]?.value ?? '';
    } else {
      const record = findPreciousOtherIncome(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      preciousIncomeSourceInput.value = record?.source ?? allSources[0]?.value ?? '';
    }
  } else preciousIncomeSourceInput.value = allSources[0]?.value ?? '';

  const mode = getIncomeSourceMode(materialKey, preciousIncomeSourceInput.value);
  renderIncomeModeFields(mode);
  if (mode === 'version') {
    document.querySelector('#precious-income-version-summary')?.addEventListener('click', () => openVersionPickerDialog('income'));
    syncIncomeVersionSummary();
  } else {
    const cycleInput = document.querySelector('#precious-income-cycle-label-input');
    const amountInput = document.querySelector('#precious-income-amount-input');
    if (preciousIncomeEditing.mode === 'edit' && preciousIncomeEditing.type === 'other') {
      const record = findPreciousOtherIncome(preciousIncomeEditing.materialKey, preciousIncomeEditing.recordId);
      if (record) {
        cycleInput.value = record.cycleLabel ?? '';
        amountInput.value = String(record.amount ?? '');
      }
    }
  }
}
function saveVersionPickerEditEntry() {
  const versionId = preciousIncomeSelection.versionId;
  const amount = Number(versionPickerEditorInput.value);
  if (!getVersionMap().has(versionId)) throw new Error('请选择具体版本。');
  if (!Number.isFinite(amount) || amount < 0) throw new Error('版本数量必须大于等于 0。');
  const index = draftIncomeVersionEntries.findIndex((item) => item.versionId === versionId);
  if (index >= 0) draftIncomeVersionEntries.splice(index, 1, { versionId, amount });
  else draftIncomeVersionEntries.push({ versionId, amount });
  renderVersionPickerEditList();
  syncIncomeVersionSummary();
}
function syncExpenseAmountBySelection() {
  const materialKey = preciousExpenseMaterialInput?.value;
  const slot = preciousExpenseSlotInput?.value;
  const amount = EXPENSE_AMOUNT_BY_MATERIAL_AND_SLOT[materialKey]?.[slot];
  if (preciousExpenseAmountInput && Number.isFinite(amount)) preciousExpenseAmountInput.value = String(amount);
}
function refreshExpenseMainStatOptions(selectedSlot, selectedMainStat = '') {
  preciousExpenseMainStatInput.innerHTML = '';
  (ARTIFACT_MAIN_STATS_BY_SLOT[selectedSlot] || []).forEach((value, index) => {
    const option = document.createElement('option'); option.value = value; option.textContent = value; option.selected = selectedMainStat ? value === selectedMainStat : index === 0; preciousExpenseMainStatInput.appendChild(option);
  });
}
function populateExpenseSlotOptions(selectedSlot = '生之花') {
  preciousExpenseSlotInput.innerHTML = '';
  ARTIFACT_SLOT_OPTIONS.forEach((slot) => {
    const option = document.createElement('option'); option.value = slot; option.textContent = slot; option.selected = slot === selectedSlot; preciousExpenseSlotInput.appendChild(option);
  });
  refreshExpenseMainStatOptions(selectedSlot);
  syncExpenseAmountBySelection();
}
function syncExpenseSetNameInput() {
  if (!preciousExpenseSetNameInput) return;
  const options = PRECIOUS_MATERIALS
    .flatMap((material) => getPreciousMaterialData(material.key).expenseSetOptions || [])
    .filter(Boolean)
    .filter((value, index, array) => array.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b, 'zh-CN'));
  const currentValue = preciousExpenseSetNameInput.value;
  preciousExpenseSetNameInput.setAttribute('list', 'precious-expense-set-options');
  let datalist = document.querySelector('#precious-expense-set-options');
  if (!datalist) {
    datalist = document.createElement('datalist');
    datalist.id = 'precious-expense-set-options';
    preciousExpenseSetNameInput.parentElement?.appendChild(datalist);
  }
  datalist.innerHTML = '';
  options.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    datalist.appendChild(option);
  });
  preciousExpenseSetNameInput.value = currentValue;
}
function findPreciousVersionIncomeRecord(materialKey, recordId) { return getPreciousMaterialData(materialKey).versionIncomeRecords.find((item) => item.id === recordId) ?? null; }
function findPreciousOtherIncome(materialKey, recordId) { return getPreciousMaterialData(materialKey).otherIncomes.find((item) => item.id === recordId) ?? null; }
function findPreciousExpense(materialKey, recordId) { return getPreciousMaterialData(materialKey).expenses.find((item) => item.id === recordId) ?? null; }
function ensurePreciousVersionsExist() { ensurePreciousData(); if (!getPreciousData().versions.length) throw new Error('请先新增至少一个版本分组。'); }
function openCreatePreciousVersionDialog() {
  ensurePreciousData(); preciousVersionEditing = { mode: 'create', versionId: null }; preciousVersionTitle.textContent = '新增版本分组'; preciousVersionLabelInput.value = ''; preciousVersionSortKeyInput.value = ''; preciousVersionDeleteBtn.style.display = 'none'; preciousVersionDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousVersionDialog(versionId) {
  const version = getPreciousData().versions.find((item) => item.id === versionId); if (!version) return;
  preciousVersionEditing = { mode: 'edit', versionId }; preciousVersionTitle.textContent = '修改版本分组'; preciousVersionLabelInput.value = version.label; preciousVersionSortKeyInput.value = version.sortKey ?? ''; preciousVersionDeleteBtn.style.display = ''; preciousVersionDialog.showModal(); syncBodyDialogState();
}
function savePreciousVersion() {
  const label = preciousVersionLabelInput.value.trim(); const sortKey = preciousVersionSortKeyInput.value.trim();
  if (!label) throw new Error('版本标签不能为空。'); if (!sortKey) throw new Error('sortKey 不能为空。');
  const versions = getPreciousData().versions; const group = inferVersionGroup(sortKey, label);
  if (preciousVersionEditing.mode === 'create') versions.push({ id: buildPreciousRecordId('precious-version'), label, sortKey, group });
  else {
    const target = versions.find((item) => item.id === preciousVersionEditing.versionId); if (!target) throw new Error('未找到要修改的版本分组。');
    target.label = label; target.sortKey = sortKey; target.group = group;
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousVersion() {
  const versionId = preciousVersionEditing.versionId;
  const usedCount = PRECIOUS_MATERIALS.reduce((sum, material) => {
    const data = getPreciousMaterialData(material.key);
    return sum + data.versionIncomeRecords.reduce((inner, record) => inner + record.entries.filter((item) => item.versionId === versionId).length, 0) + data.expenses.filter((item) => item.versionId === versionId).length;
  }, 0);
  if (usedCount > 0) throw new Error('该版本分组已被版本来源收入或支出记录使用，暂不允许删除。');
  currentPreciousData.versions = currentPreciousData.versions.filter((item) => item.id !== versionId); preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function openCreatePreciousIncomeDialog(defaultMaterialKey = 'sanctifyingUnction') {
  preciousIncomeEditing = { mode: 'create', type: 'version', materialKey: defaultMaterialKey, recordId: null };
  draftIncomeVersionEntries = []; preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: '' };
  preciousIncomeTitle.textContent = '新增收入记录'; preciousIncomeDeleteBtn.style.display = 'none'; preciousIncomeMaterialInput.value = defaultMaterialKey; preciousIncomeNoteInput.value = ''; syncIncomeDialogFields(); preciousIncomeDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousIncomeDialog(materialKey, type, recordId) {
  if (type === 'version') {
    const record = findPreciousVersionIncomeRecord(materialKey, recordId); if (!record) return;
    preciousIncomeEditing = { mode: 'edit', type, materialKey, recordId }; draftIncomeVersionEntries = cloneData(record.entries || []); preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: draftIncomeVersionEntries[0]?.versionId ?? '' };
    preciousIncomeTitle.textContent = '修改收入记录'; preciousIncomeDeleteBtn.style.display = ''; preciousIncomeMaterialInput.value = materialKey; preciousIncomeNoteInput.value = record.note ?? ''; syncIncomeDialogFields(); preciousIncomeSourceInput.value = record.sourceKey; syncIncomeDialogFields();
  } else {
    const record = findPreciousOtherIncome(materialKey, recordId); if (!record) return;
    preciousIncomeEditing = { mode: 'edit', type, materialKey, recordId }; draftIncomeVersionEntries = []; preciousIncomeSelection = { group: getVersionGroups()[0]?.[0] ?? '', versionId: '' };
    preciousIncomeTitle.textContent = '修改收入记录'; preciousIncomeDeleteBtn.style.display = ''; preciousIncomeMaterialInput.value = materialKey; preciousIncomeNoteInput.value = record.note ?? ''; syncIncomeDialogFields(); preciousIncomeSourceInput.value = record.source; syncIncomeDialogFields();
  }
  preciousIncomeDialog.showModal(); syncBodyDialogState();
}
function normalizePreciousIncomeInput() {
  const materialKey = preciousIncomeMaterialInput.value; const sourceValue = preciousIncomeSourceInput.value.trim();
  if (!PRECIOUS_MATERIALS.some((item) => item.key === materialKey)) throw new Error('收入材料不合法。');
  if (!sourceValue) throw new Error('来源不能为空。');
  const mode = getIncomeSourceMode(materialKey, sourceValue);
  if (mode === 'version') {
    if (!getVersionIncomeSourceOptions(materialKey).some((item) => item.key === sourceValue)) throw new Error('版本来源不合法。');
    if (!draftIncomeVersionEntries.length) throw new Error('请先录入版本数量。');
    return { type: 'version', materialKey, sourceKey: sourceValue, note: preciousIncomeNoteInput.value.trim(), updateTime: new Date().toISOString(), entries: cloneData(draftIncomeVersionEntries) };
  }
  const cycleLabel = document.querySelector('#precious-income-cycle-label-input')?.value.trim();
  const amount = Number(document.querySelector('#precious-income-amount-input')?.value);
  if (!cycleLabel) throw new Error('周期不能为空。'); if (!Number.isFinite(amount) || amount <= 0) throw new Error('收入数量必须大于 0。');
  return { type: 'other', materialKey, source: sourceValue, cycleLabel, amount, note: preciousIncomeNoteInput.value.trim(), updateTime: new Date().toISOString() };
}
function savePreciousIncome() {
  const input = normalizePreciousIncomeInput();
  if (input.type === 'version') {
    const list = getPreciousMaterialData(input.materialKey).versionIncomeRecords;
    if (preciousIncomeEditing.mode === 'create') {
      const duplicate = list.find((item) => item.sourceKey === input.sourceKey); if (duplicate) throw new Error('该版本来源已存在，请直接修改原记录。');
      list.push({ id: buildPreciousRecordId('precious-version-income'), sourceKey: input.sourceKey, note: input.note, updateTime: input.updateTime, entries: input.entries });
    } else {
      const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index < 0) throw new Error('未找到要修改的版本来源收入记录。');
      const duplicate = list.find((item, itemIndex) => item.sourceKey === input.sourceKey && itemIndex !== index); if (duplicate) throw new Error('该版本来源已存在，请避免重复。');
      const previous = list[index]; list.splice(index, 1, { ...previous, sourceKey: input.sourceKey, note: input.note, updateTime: input.updateTime, entries: input.entries });
    }
  } else {
    const list = getPreciousMaterialData(input.materialKey).otherIncomes;
    if (preciousIncomeEditing.mode === 'create') list.push({ id: buildPreciousRecordId('precious-other-income'), ...input });
    else {
      const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index < 0) throw new Error('未找到要修改的其他来源收入记录。');
      const previous = list[index]; list.splice(index, 1, { ...previous, ...input });
    }
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousIncome() {
  if (!preciousIncomeEditing) return;
  if (preciousIncomeEditing.type === 'version') {
    const list = getPreciousMaterialData(preciousIncomeEditing.materialKey).versionIncomeRecords; const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index >= 0) list.splice(index, 1);
  } else {
    const list = getPreciousMaterialData(preciousIncomeEditing.materialKey).otherIncomes; const index = list.findIndex((item) => item.id === preciousIncomeEditing.recordId); if (index >= 0) list.splice(index, 1);
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function openCreatePreciousExpenseDialog(defaultMaterialKey = 'sanctifyingUnction') {
  ensurePreciousVersionsExist(); preciousExpenseEditing = { mode: 'create', materialKey: defaultMaterialKey, recordId: null };
  const latestVersionId = getLatestExpenseVersionId(defaultMaterialKey);
  const latestVersion = getVersionMap().get(latestVersionId);
  preciousExpenseSelection = { group: latestVersion?.group ?? getVersionGroups()[0]?.[0] ?? '', versionId: latestVersionId };
  preciousExpenseTitle.textContent = '新增支出记录'; preciousExpenseDeleteBtn.style.display = 'none'; preciousExpenseMaterialInput.value = defaultMaterialKey; syncVersionTriggerText(); preciousExpenseAmountInput.value = ''; preciousExpenseSetNameInput.value = ''; preciousExpenseNoteInput.value = ''; populateExpenseSlotOptions('生之花'); syncExpenseSetNameInput(); preciousExpenseDialog.showModal(); syncBodyDialogState();
}
function openEditPreciousExpenseDialog(materialKey, recordId) {
  const record = findPreciousExpense(materialKey, recordId); if (!record) return;
  const version = getVersionMap().get(record.versionId); preciousExpenseEditing = { mode: 'edit', materialKey, recordId }; preciousExpenseSelection = { group: version?.group ?? getVersionGroups()[0]?.[0] ?? '', versionId: record.versionId };
  preciousExpenseTitle.textContent = '修改支出记录'; preciousExpenseDeleteBtn.style.display = ''; preciousExpenseMaterialInput.value = materialKey; syncVersionTriggerText(); preciousExpenseSetNameInput.value = record.setName ?? ''; populateExpenseSlotOptions(record.slot ?? '生之花'); refreshExpenseMainStatOptions(record.slot ?? '生之花', record.mainStat ?? '生命'); syncExpenseAmountBySelection(); syncExpenseSetNameInput(); preciousExpenseNoteInput.value = record.note ?? ''; preciousExpenseDialog.showModal(); syncBodyDialogState();
}
function normalizePreciousExpenseInput() {
  const materialKey = preciousExpenseMaterialInput.value; const amount = Number(preciousExpenseAmountInput.value); const versionId = preciousExpenseSelection.versionId; const setName = preciousExpenseSetNameInput.value.trim(); const slot = preciousExpenseSlotInput.value; const mainStat = preciousExpenseMainStatInput.value;
  if (!PRECIOUS_MATERIALS.some((item) => item.key === materialKey)) throw new Error('支出材料不合法。'); if (!Number.isFinite(amount) || amount <= 0) throw new Error('支出数量必须大于 0。'); if (!getVersionMap().has(versionId)) throw new Error('请选择版本。'); if (!setName) throw new Error('圣遗物套装不能为空。'); if (!ARTIFACT_SLOT_OPTIONS.includes(slot)) throw new Error('圣遗物部位不合法。'); if (!(ARTIFACT_MAIN_STATS_BY_SLOT[slot] || []).includes(mainStat)) throw new Error('该部位下属性不合法。');
  return { materialKey, versionId, amount, setName, slot, mainStat, note: preciousExpenseNoteInput.value.trim(), updateTime: new Date().toISOString() };
}
function savePreciousExpense() {
  const input = normalizePreciousExpenseInput();

  if (preciousExpenseEditing.mode === 'create') getPreciousMaterialData(input.materialKey).expenses.push({ id: buildPreciousRecordId('precious-expense'), ...input });
  else {
    const oldList = getPreciousMaterialData(preciousExpenseEditing.materialKey).expenses;
    const index = oldList.findIndex((item) => item.id === preciousExpenseEditing.recordId);
    if (index < 0) throw new Error('未找到要修改的支出记录。');
    const updatedExpense = { ...oldList[index], ...input };
    if (input.materialKey === preciousExpenseEditing.materialKey) oldList.splice(index, 1, updatedExpense);
    else {
      oldList.splice(index, 1);
      getPreciousMaterialData(input.materialKey).expenses.push(updatedExpense);
    }
  }
  const expenseSetOptions = getPreciousMaterialData(input.materialKey).expenseSetOptions || [];
  if (!expenseSetOptions.includes(input.setName)) {
    expenseSetOptions.push(input.setName);
    expenseSetOptions.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    getPreciousMaterialData(input.materialKey).expenseSetOptions = expenseSetOptions;
  }
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
function deletePreciousExpense() {
  const list = getPreciousMaterialData(preciousExpenseEditing.materialKey).expenses; const index = list.findIndex((item) => item.id === preciousExpenseEditing.recordId); if (index >= 0) list.splice(index, 1);
  preciousDirty = true; persistPreciousSnapshot(); rerenderPrecious(); updateDirtyIndicator();
}
