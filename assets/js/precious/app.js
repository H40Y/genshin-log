function rerenderPrecious() {
  const data = getPreciousData();
  preciousSection.innerHTML = '';
  const hasRecords = data.versions.length || PRECIOUS_MATERIALS.some((material) => {
    const materialData = getPreciousMaterialData(material.key);
    return materialData.versionIncomeRecords.length || materialData.otherIncomes.length || materialData.expenses.length;
  });
  if (!hasRecords) {
    preciousSection.innerHTML = `<div class="card landing-card"><div class="landing-badge">贵重资源</div><h2>现在就可以开始</h2><p>你可以直接下载模板、上传已有 JSON，或者先加载示例数据看看页面结构。若想从零录入，也可以直接从“新增版本分组”开始。</p><div class="tools-actions"><button id="empty-download-template" class="ghost-button compact-button" type="button">下载模板</button><button id="empty-load-sample" class="ghost-button compact-button" type="button">加载示例数据</button><button id="empty-add-version" class="primary-button compact-button" type="button">新增版本分组</button></div></div>`;
    preciousSection.querySelector('#empty-download-template')?.addEventListener('click', handleTemplateDownload);
    preciousSection.querySelector('#empty-load-sample')?.addEventListener('click', handleLoadSample);
    preciousSection.querySelector('#empty-add-version')?.addEventListener('click', openCreatePreciousVersionDialog);
    return;
  }
  const statGrid = document.createElement('div'); statGrid.className = 'grid cards-2 precious-stat-shell'; PRECIOUS_MATERIALS.forEach((material) => statGrid.appendChild(buildPreciousStatCard(material.key))); preciousSection.appendChild(statGrid);
  PRECIOUS_MATERIALS.forEach((material) => preciousSection.appendChild(buildPreciousMaterialBlock(material.key)));
  const settingsSection = document.createElement('section'); settingsSection.className = 'section settings-section'; settingsSection.appendChild(buildVersionsCard()); preciousSection.appendChild(settingsSection);
}

function bindDialogBackdropClose(dialog, onClose) {
  dialog?.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const clickedInside = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (!clickedInside) onClose();
  });
}

uploadTrigger?.addEventListener('click', () => uploadInput?.click());
downloadTemplateTrigger?.addEventListener('click', handleTemplateDownload);
downloadCurrentTrigger?.addEventListener('click', handleExport);
loadSampleTrigger?.addEventListener('click', handleLoadSample);
clearLocalDataTrigger?.addEventListener('click', handleClearLocalData);

uploadInput?.addEventListener('change', async () => {
  const file = uploadInput.files?.[0]; if (!file) return;
  try {
    currentPreciousData = validateAndNormalizePreciousData(JSON.parse(await file.text())); baselinePreciousData = cloneData(currentPreciousData); currentPreciousFileName = file.name || '已上传数据'; preciousDirty = false; persistPreciousBaseline(); persistPreciousSnapshot(); rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator(); setSyncStatus('贵重资源 JSON 已加载。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`加载失败：${msg}`, 'error'); alert(`加载失败：${msg}`);
  } finally { uploadInput.value = ''; }
});

document.querySelector('[data-dialog-cancel="version"]')?.addEventListener('click', closePreciousVersionDialog);
bindDialogBackdropClose(preciousVersionDialog, closePreciousVersionDialog);
preciousVersionDialog?.addEventListener('close', syncBodyDialogState);
preciousVersionDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这个版本分组吗？')) return;
  try { deletePreciousVersion(); closePreciousVersionDialog(); setSyncStatus('版本分组已删除；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`删除失败：${msg}`, 'error'); alert(`删除失败：${msg}`); }
});
preciousVersionForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousVersion(); closePreciousVersionDialog(); setSyncStatus('版本分组已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});

document.querySelector('[data-dialog-cancel="income"]')?.addEventListener('click', closePreciousIncomeDialog);
bindDialogBackdropClose(preciousIncomeDialog, closePreciousIncomeDialog);
preciousIncomeDialog?.addEventListener('close', syncBodyDialogState);
preciousIncomeMaterialInput?.addEventListener('change', syncIncomeDialogFields);
preciousIncomeSourceInput?.addEventListener('change', syncIncomeDialogFields);
preciousIncomeForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousIncome(); closePreciousIncomeDialog(); setSyncStatus('收入记录已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});
preciousIncomeDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条收入记录吗？')) return;
  deletePreciousIncome(); closePreciousIncomeDialog(); setSyncStatus('收入记录已删除；如需保留，请导出 JSON。', 'success');
});

versionPickerEditorSave?.addEventListener('click', () => {
  try { saveVersionPickerEditEntry(); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`填写失败：${msg}`, 'error'); alert(`填写失败：${msg}`); }
});

document.querySelector('[data-dialog-cancel="expense"]')?.addEventListener('click', closePreciousExpenseDialog);
bindDialogBackdropClose(preciousExpenseDialog, closePreciousExpenseDialog);
preciousExpenseDialog?.addEventListener('close', syncBodyDialogState);
preciousExpenseMaterialInput?.addEventListener('change', () => { syncExpenseAmountBySelection(); syncExpenseSetNameInput(); });
preciousExpenseSlotInput?.addEventListener('change', () => { refreshExpenseMainStatOptions(preciousExpenseSlotInput.value); syncExpenseAmountBySelection(); });
preciousExpenseForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try { savePreciousExpense(); closePreciousExpenseDialog(); setSyncStatus('支出记录已保存；如需保留，请导出 JSON。', 'success'); }
  catch (error) { const msg = error instanceof Error ? error.message : String(error); setSyncStatus(`保存失败：${msg}`, 'error'); alert(`保存失败：${msg}`); }
});
preciousExpenseDeleteBtn?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条支出记录吗？')) return;
  deletePreciousExpense(); closePreciousExpenseDialog(); setSyncStatus('支出记录已删除；如需保留，请导出 JSON。', 'success');
});

function main() {
  checkStorageAvailability(); populateExpenseSlotOptions('生之花');
  try {
    currentPreciousData = loadStoredPreciousData() || buildPreciousTemplateData();
    baselinePreciousData = loadStoredPreciousBaseline();
    const storedMeta = loadStoredMeta(PRECIOUS_STORAGE_META_KEY);
    preciousDirty = Boolean(storedMeta?.isDirty);
    currentPreciousFileName = storedMeta?.fileName ?? (baselinePreciousData ? '浏览器缓存' : '未加载');
  }
  catch {
    currentPreciousData = buildPreciousTemplateData();
    baselinePreciousData = null;
    currentPreciousFileName = '未加载';
    preciousDirty = false;
  }
  rerenderPrecious(); updateCurrentFileLabel(); updateDirtyIndicator();
}

main();

preciousExpenseVersionTrigger?.addEventListener('click', () => openVersionPickerDialog('expense'));
bindDialogBackdropClose(versionPickerDialog, closeVersionPickerDialog);
versionPickerDialog?.addEventListener('close', () => { activeVersionPickerTarget = null; versionPickerMode = 'select'; syncBodyDialogState(); });
