function setFieldVisible(fieldName, visible) {
  const field = editForm.querySelector(`[data-field="${fieldName}"]`);
  if (!field) return;
  field.style.display = visible ? '' : 'none';
}

function syncBodyDialogState() {
  const anyOpen = Boolean(editDialog?.open || totalPullsDialog?.open || uigfReviewDialog?.open);
  document.documentElement.classList.toggle('dialog-open', anyOpen);
  document.body.classList.toggle('dialog-open', anyOpen);
}

function closeEditDialog() {
  if (!editDialog?.open) return;
  editDialog.close();
  syncBodyDialogState();
  currentEditing = null;
}

function closeTotalPullsDialog() {
  if (!totalPullsDialog?.open) return;
  totalPullsDialog.close();
  syncBodyDialogState();
  currentTotalPullsEditing = null;
}

function closeUigfReviewDialog() {
  if (!uigfReviewDialog?.open) return;
  uigfReviewDialog.close();
  syncBodyDialogState();
}

function buildRecordId(bannerKey, pullIndex) {
  return `${bannerKey}-${pullIndex}-${Date.now()}`;
}

function getBannerHistory(bannerKey) {
  return currentData?.wishData?.[bannerKey]?.fiveStarHistory ?? [];
}

function findRecord(bannerKey, recordId) {
  return getBannerHistory(bannerKey).find((item) => String(item.id) === String(recordId)) ?? null;
}

function configureEditForm(bannerKey, item) {
  const standard = isStandardBanner(bannerKey);
  const weapon = isWeaponBanner(bannerKey);

  setFieldVisible('resultType', !standard);
  setFieldVisible('capturingRadiance', shouldShowCapturingRadiance(bannerKey));
  setFieldVisible('pullVersionLabel', !standard);
  setFieldVisible('pullVersionGroup', !standard);
  setFieldVisible('time', true);
  setFieldVisible('source', true);

  editForm.pullIndex.value = item.pullIndex ?? '';
  editForm.itemName.value = item.itemName ?? '';
  editForm.itemType.value = item.itemType ?? (weapon ? '武器' : '角色');
  editForm.time.value = item.time ?? '';
  editForm.source.value = item.source ?? 'manual';

  if (standard) {
    editForm.resultType.value = 'off-banner';
    editForm.capturingRadiance.value = '';
    editForm.pullVersionLabel.value = '';
    editForm.pullVersionGroup.value = '';
    return;
  }

  editForm.resultType.value = item.resultType ?? 'unknown';
  editForm.pullVersionLabel.value = item.pullVersion?.label ?? '';
  editForm.pullVersionGroup.value = item.pullVersion?.group ?? '';

  if (weapon) {
    editForm.capturingRadiance.value = '';
    return;
  }

  editForm.capturingRadiance.value = item.capturingRadiance === null || item.capturingRadiance === undefined
    ? ''
    : String(Boolean(item.capturingRadiance));
}

function openCreateDialog(bannerKey) {
  if (!currentData) return;
  currentEditing = { mode: 'create', bannerKey, recordId: null };
  configureEditForm(bannerKey, {
    pullIndex: '',
    itemName: '',
    itemType: isWeaponBanner(bannerKey) ? '武器' : '角色',
    resultType: isStandardBanner(bannerKey) ? 'off-banner' : 'up',
    capturingRadiance: null,
    pullVersion: null,
    time: null,
    source: 'manual',
  });
  editDeleteBtn.style.display = 'none';
  editDialog.querySelector('h3').textContent = '新增 5★ 记录';
  editDialog.showModal();
  syncBodyDialogState();
}

function openEditDialog(bannerKey, recordId) {
  const item = findRecord(bannerKey, recordId);
  if (!item) return;

  currentEditing = { mode: 'edit', bannerKey, recordId };
  configureEditForm(bannerKey, item);
  editDeleteBtn.style.display = '';
  editDialog.querySelector('h3').textContent = '修改 5★ 记录';
  editDialog.showModal();
  syncBodyDialogState();
}

function openTotalPullsDialog(bannerKey) {
  if (!currentData) return;
  currentTotalPullsEditing = bannerKey;
  const banner = BANNERS.find((item) => item.key === bannerKey);
  totalPullsLabel.textContent = `${banner?.label ?? '当前池子'}总抽数`;
  totalPullsInput.value = String(currentData.wishData[bannerKey].totalPulls ?? 0);
  totalPullsDialog.showModal();
  syncBodyDialogState();
}

function normalizeRecordInput(bannerKey) {
  const pullIndex = Number(editForm.pullIndex.value);
  if (!Number.isFinite(pullIndex) || pullIndex <= 0) {
    throw new Error('抽位必须是大于 0 的数字。');
  }

  const itemName = editForm.itemName.value.trim();
  if (!itemName) {
    throw new Error('名称不能为空。');
  }

  const time = editForm.time.value.trim() || null;
  const source = editForm.source.value || 'manual';
  const standard = isStandardBanner(bannerKey);

  return {
    pullIndex,
    itemName,
    itemType: editForm.itemType.value,
    resultType: standard ? 'off-banner' : editForm.resultType.value,
    capturingRadiance: shouldShowCapturingRadiance(bannerKey)
      ? (editForm.capturingRadiance.value === '' ? null : editForm.capturingRadiance.value === 'true')
      : null,
    pullVersion: standard
      ? null
      : {
          label: editForm.pullVersionLabel.value.trim() || '',
          group: editForm.pullVersionGroup.value.trim() || null,
        },
    time,
    source,
  };
}

function replaceBannerHistory(bannerKey, nextHistory) {
  currentData.wishData[bannerKey].fiveStarHistory = nextHistory
    .map((item) => ({ ...item }))
    .sort((a, b) => a.pullIndex - b.pullIndex);
}

function updateBannerTotalPullsFloor(bannerKey) {
  const banner = currentData.wishData[bannerKey];
  const maxPullIndex = Math.max(0, ...banner.fiveStarHistory.map((item) => Number(item.pullIndex) || 0));
  if (banner.totalPulls < maxPullIndex) {
    banner.totalPulls = maxPullIndex;
  }
}

function saveEditedRecord() {
  if (!currentEditing || !currentData) return;

  const { bannerKey, mode, recordId } = currentEditing;
  const nextRecord = normalizeRecordInput(bannerKey);
  const history = getBannerHistory(bannerKey);

  const duplicate = history.find((item) => item.pullIndex === nextRecord.pullIndex && String(item.id) !== String(recordId));
  if (duplicate) {
    throw new Error(`该池子中已存在抽位 ${nextRecord.pullIndex} 的记录。`);
  }

  if (mode === 'create') {
    replaceBannerHistory(bannerKey, [
      ...history,
      {
        id: buildRecordId(bannerKey, nextRecord.pullIndex),
        ...nextRecord,
      },
    ]);
  } else {
    replaceBannerHistory(
      bannerKey,
      history.map((item) => (String(item.id) === String(recordId)
        ? {
            ...item,
            ...nextRecord,
          }
        : item)),
    );
  }

  updateBannerTotalPullsFloor(bannerKey);
  markEdited();
  rerender();
}

function deleteEditedRecord() {
  if (!currentEditing || currentEditing.mode !== 'edit' || !currentData) return;

  const { bannerKey, recordId } = currentEditing;
  const history = getBannerHistory(bannerKey);
  replaceBannerHistory(
    bannerKey,
    history.filter((item) => String(item.id) !== String(recordId)),
  );
  markEdited();
  rerender();
}

function saveTotalPulls() {
  if (!currentData || !currentTotalPullsEditing) return;

  const bannerKey = currentTotalPullsEditing;
  const nextTotalPulls = Number(totalPullsInput.value);
  if (!Number.isFinite(nextTotalPulls) || nextTotalPulls < 0) {
    throw new Error('总抽数必须是大于等于 0 的数字。');
  }

  const maxPullIndex = Math.max(0, ...currentData.wishData[bannerKey].fiveStarHistory.map((item) => Number(item.pullIndex) || 0));
  if (nextTotalPulls < maxPullIndex) {
    throw new Error(`总抽数不能小于当前 5★ 最大抽位 ${maxPullIndex}。`);
  }

  currentData.wishData[bannerKey].totalPulls = nextTotalPulls;
  markEdited();
  rerender();
}
