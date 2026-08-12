uploadTrigger?.addEventListener('click', () => uploadInput?.click());
downloadTemplateTrigger?.addEventListener('click', handleSpendingTemplateDownload);
downloadCurrentTrigger?.addEventListener('click', handleSpendingExport);
loadSampleTrigger?.addEventListener('click', handleSpendingLoadSample);
clearLocalDataTrigger?.addEventListener('click', handleSpendingClearLocalData);

uploadInput?.addEventListener('change', async () => {
  const file = uploadInput.files?.[0];
  if (!file) return;
  try {
    currentSpendingData = validateAndNormalizeSpendingData(JSON.parse(await file.text()));
    baselineSpendingData = cloneSpendingData(currentSpendingData);
    currentSpendingFileName = file.name || '已上传数据';
    spendingDirty = false;
    persistSpendingBaseline();
    persistSpendingSnapshot();
    rerenderSpending();
    updateSpendingCurrentFileLabel();
    updateSpendingDirtyIndicator();
    setSpendingSyncStatus('氪金历史 JSON 已加载。', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSpendingSyncStatus(`加载失败：${message}`, 'error');
    alert(`加载失败：${message}`);
  } finally {
    uploadInput.value = '';
  }
});

document.querySelector('[data-dialog-cancel="other"]')?.addEventListener('click', closeOtherItemDialog);
bindSpendingDialogBackdropClose(otherItemDialog, closeOtherItemDialog);
otherItemDialog?.addEventListener('close', syncSpendingBodyDialogState);
otherItemForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveOtherItem();
    closeOtherItemDialog();
    setSpendingSyncStatus('其他计数已保存；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSpendingSyncStatus(`保存失败：${message}`, 'error');
    alert(`保存失败：${message}`);
  }
});
otherItemDeleteButton?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条其他计数吗？')) return;
  deleteOtherItem();
  closeOtherItemDialog();
  setSpendingSyncStatus('其他计数已删除；如需保留，请导出 JSON。', 'success');
});

document.querySelector('[data-dialog-cancel="incentive"]')?.addEventListener('click', closeIncentiveItemDialog);
bindSpendingDialogBackdropClose(incentiveItemDialog, closeIncentiveItemDialog);
incentiveItemDialog?.addEventListener('close', syncSpendingBodyDialogState);
incentiveItemForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveIncentiveItem();
    closeIncentiveItemDialog();
    setSpendingSyncStatus('激励计数已保存；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    setSpendingSyncStatus(`保存失败：${message}`, 'error');
    alert(`保存失败：${message}`);
  }
});
incentiveItemDeleteButton?.addEventListener('click', () => {
  if (!window.confirm('确定删除这条激励计数吗？')) return;
  deleteIncentiveItem();
  closeIncentiveItemDialog();
  setSpendingSyncStatus('激励计数已删除；如需保留，请导出 JSON。', 'success');
});

function mainSpending() {
  checkSpendingStorageAvailability();
  try {
    currentSpendingData = loadStoredSpendingData() || buildSpendingTemplateData();
    baselineSpendingData = loadStoredSpendingBaseline();
    const storedMeta = loadStoredSpendingMeta();
    spendingDirty = Boolean(storedMeta?.isDirty);
    currentSpendingFileName = storedMeta?.fileName ?? (baselineSpendingData ? '浏览器缓存' : '未加载');
  } catch {
    currentSpendingData = buildSpendingTemplateData();
    baselineSpendingData = null;
    currentSpendingFileName = '未加载';
    spendingDirty = false;
  }
  rerenderSpending();
  updateSpendingCurrentFileLabel();
  updateSpendingDirtyIndicator();
}

mainSpending();
