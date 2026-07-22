function applyPendingUigfReview() {
  if (!pendingUigfReview || !currentData) {
    throw new Error('当前没有待应用的 UIGF 导入结果。');
  }

  const { failed } = summarizeUigfResult(pendingUigfReview.checks, pendingUigfReview.diffs);
  if (failed.length > 0) {
    throw new Error('当前存在 offset 校验失败，不能应用。');
  }

  syncUigfSupplementalInputs(pendingUigfReview);

  const next = cloneData(currentData);
  pendingUigfReview.diffs.forEach((diff) => applyDiff(next, diff));
  currentData = validateAndNormalizeData(next);
  markEdited();
  rerender();

  const summary = summarizeUigfResult(pendingUigfReview.checks, pendingUigfReview.diffs).count;
  pendingUigfReview = null;
  closeUigfReviewDialog();
  return summary;
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

uploadBtn?.addEventListener('click', () => {
  uploadInput?.click();
});

uigfBtn?.addEventListener('click', () => {
  uigfInput?.click();
});

uploadInput?.addEventListener('change', async () => {
  const file = uploadInput.files?.[0];
  if (!file) return;

  try {
    setSyncStatus('正在读取主 JSON…');
    await importFromFile(file);
    setSyncStatus(storageAvailable ? 'JSON 已加载。' : 'JSON 已加载（当前浏览器禁用了本地缓存）。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`加载失败：${msg}`, 'error');
    alert(`加载失败：${msg}`);
  } finally {
    uploadInput.value = '';
  }
});

uigfInput?.addEventListener('change', async () => {
  const file = uigfInput.files?.[0];
  if (!file) return;

  try {
    setSyncStatus('正在分析 UIGF 导入结果…');
    pendingUigfReview = await analyzeUigfFromFile(file);
    renderUigfReviewPanel(pendingUigfReview);
    uigfReviewDialog.showModal();
    syncBodyDialogState();
    setSyncStatus('UIGF 分析完成，请确认是否应用。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`UIGF 导入失败：${msg}`, 'error');
    alert(`UIGF 导入失败：${msg}`);
  } finally {
    uigfInput.value = '';
  }
});

templateBtn?.addEventListener('click', () => {
  downloadJsonFile(buildTemplateData(), 'wish-data.schema-v4.template.json');
  setSyncStatus('模板已下载。', 'success');
});

exportBtn?.addEventListener('click', () => {
  if (!currentData) {
    setSyncStatus('当前没有可导出的数据。', 'error');
    return;
  }

  downloadJsonFile(cloneData(currentData), `wish-data.${formatExportDate()}.json`);
  setDirty(false);
  persistSnapshot();
  setSyncStatus('导出完成。', 'success');
});

resetBtn?.addEventListener('click', () => {
  if (!currentData) {
    setSyncStatus('当前没有已加载的数据。');
    return;
  }

  const confirmed = window.confirm('确定清除当前浏览器里保存的数据吗？');
  if (!confirmed) return;

  currentData = null;
  baselineData = null;
  pendingUigfReview = null;
  currentFileName = '未加载';
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  clearPersistedData();
  updateCurrentFileLabel();
  setSyncStatus('已清除本地缓存数据。', 'success');
  rerender();
});

sampleBtn?.addEventListener('click', () => {
  const sampleData = buildTemplateData();
  sampleData.wishData.standard.totalPulls = 80;
  sampleData.wishData.standard.fiveStarHistory = [
    {
      id: 'standard-80',
      pullIndex: 80,
      time: null,
      itemName: '刻晴',
      itemType: '角色',
      resultType: 'off-banner',
      capturingRadiance: null,
      pullVersion: null,
      source: 'manual',
    },
  ];
  sampleData.wishData.limitedCharacter.totalPulls = 160;
  sampleData.wishData.limitedCharacter.fiveStarHistory = [
    {
      id: 'limitedCharacter-75',
      pullIndex: 75,
      time: null,
      itemName: '迪卢克',
      itemType: '角色',
      resultType: 'off-banner',
      capturingRadiance: null,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
    {
      id: 'limitedCharacter-152',
      pullIndex: 152,
      time: null,
      itemName: '爱可菲',
      itemType: '角色',
      resultType: 'up',
      capturingRadiance: false,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
  ];
  sampleData.wishData.limitedWeapon.totalPulls = 70;
  sampleData.wishData.limitedWeapon.fiveStarHistory = [
    {
      id: 'limitedWeapon-63',
      pullIndex: 63,
      time: null,
      itemName: '香韵奏者',
      itemType: '武器',
      resultType: 'up',
      capturingRadiance: null,
      pullVersion: { label: '5.6', group: '5.6.0' },
      source: 'manual',
    },
  ];

  currentData = validateAndNormalizeData(sampleData);
  baselineData = cloneData(currentData);
  currentFileName = '内置示例数据';
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  persistBaselineData();
  persistSnapshot();
  updateCurrentFileLabel();
  setSyncStatus(storageAvailable ? '已加载示例数据。' : '已加载示例数据（当前浏览器禁用了本地缓存）。', 'success');
  rerender();
});

editCancelMobileBtn?.addEventListener('click', () => {
  closeEditDialog();
});

bindDialogBackdropClose(editDialog, closeEditDialog);
editDialog?.addEventListener('close', syncBodyDialogState);

totalPullsCancelMobileBtn?.addEventListener('click', () => {
  closeTotalPullsDialog();
});

bindDialogBackdropClose(totalPullsDialog, closeTotalPullsDialog);
totalPullsDialog?.addEventListener('close', syncBodyDialogState);

uigfReviewCloseBtn?.addEventListener('click', () => {
  closeUigfReviewDialog();
});

bindDialogBackdropClose(uigfReviewDialog, closeUigfReviewDialog);
uigfReviewDialog?.addEventListener('close', syncBodyDialogState);

editForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveEditedRecord();
    closeEditDialog();
    setSyncStatus('修改已写入当前页面数据；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`保存失败：${msg}`, 'error');
    alert(`保存失败：${msg}`);
  }
});

editDeleteBtn?.addEventListener('click', () => {
  const confirmed = window.confirm('确定删除这条 5★ 记录吗？');
  if (!confirmed) return;

  deleteEditedRecord();
  closeEditDialog();
  setSyncStatus('条目已从当前页面数据中删除；如需保留，请导出 JSON。', 'success');
});

totalPullsForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    saveTotalPulls();
    closeTotalPullsDialog();
    setSyncStatus('总抽数已写入当前页面数据；如需保留，请导出 JSON。', 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`保存失败：${msg}`, 'error');
    alert(`保存失败：${msg}`);
  }
});

uigfReviewForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const summary = applyPendingUigfReview();
    setSyncStatus(`UIGF 已应用：新增 4★ ${summary.newFourStars} 条，新增 5★ ${summary.newFiveStars} 条，修补 5★ ${summary.patchFiveStars} 条。`, 'success');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    setSyncStatus(`应用失败：${msg}`, 'error');
    alert(`应用失败：${msg}`);
  }
});

window.addEventListener('scroll', hideTimelineTooltip, { passive: true });
window.addEventListener('resize', hideTimelineTooltip);

function main() {
  checkStorageAvailability();

  try {
    const storedData = loadStoredData();
    const storedBaseline = loadStoredBaselineData();
    const storedMeta = loadStoredMeta();
    if (storedData) {
      currentData = storedData;
      baselineData = storedBaseline ? cloneData(storedBaseline) : cloneData(storedData);
      currentFileName = storedMeta?.fileName ?? '浏览器缓存';
      setDirty(Boolean(storedMeta?.isDirty));
      updateCurrentFileLabel();
      setSyncStatus('已恢复浏览器缓存中的数据。', 'success');
    } else {
      currentFileName = '未加载';
      setDirty(false);
      updateCurrentFileLabel();
      setSyncStatus(storageAvailable ? '准备就绪，等待上传 JSON。' : '准备就绪，等待上传 JSON（当前浏览器禁用了本地缓存）。');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    currentFileName = '未加载';
    setDirty(false);
    updateCurrentFileLabel();
    setSyncStatus(`浏览器缓存已损坏，已重置：${msg}`, 'error');
  }

  rerender();
}

main();
