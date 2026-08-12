function syncSpendingBodyDialogState() {
  const anyOpen = [otherItemDialog, incentiveItemDialog].some((dialog) => Boolean(dialog?.open));
  document.documentElement.classList.toggle('dialog-open', anyOpen);
  document.body.classList.toggle('dialog-open', anyOpen);
}

function closeOtherItemDialog() {
  if (otherItemDialog?.open) otherItemDialog.close();
  otherItemEditing = null;
  syncSpendingBodyDialogState();
}

function closeIncentiveItemDialog() {
  if (incentiveItemDialog?.open) incentiveItemDialog.close();
  incentiveItemEditing = null;
  syncSpendingBodyDialogState();
}

function updateFixedPurchaseCount(key, rawValue) {
  if (!SPENDING_FIXED_PURCHASES.some((item) => item.key === key)) return;
  getSpendingData().fixedCounts[key] = normalizeCount(rawValue);
  markSpendingChanged();
  rerenderSpending();
  setSpendingSyncStatus('固定项计数已更新；如需保留，请导出 JSON。', 'success');
}

function openCreateOtherItemDialog() {
  otherItemEditing = { mode: 'create', id: null };
  otherItemDialogTitle.textContent = '新增其他计数';
  otherItemDeleteButton.style.display = 'none';
  otherItemNameInput.value = '';
  otherItemAmountInput.value = '';
  otherItemPrimogemsInput.value = '';
  otherItemDialog.showModal();
  syncSpendingBodyDialogState();
  otherItemNameInput.focus();
}

function openEditOtherItemDialog(id) {
  const item = getSpendingData().otherItems.find((entry) => entry.id === id);
  if (!item) return;
  otherItemEditing = { mode: 'edit', id };
  otherItemDialogTitle.textContent = '修改其他计数';
  otherItemDeleteButton.style.display = '';
  otherItemNameInput.value = item.name;
  otherItemAmountInput.value = item.amount;
  otherItemPrimogemsInput.value = item.primogems;
  otherItemDialog.showModal();
  syncSpendingBodyDialogState();
  otherItemNameInput.focus();
}

function saveOtherItem() {
  const name = otherItemNameInput.value.trim();
  const amount = Number(otherItemAmountInput.value);
  const primogems = Number(otherItemPrimogemsInput.value);
  if (!name) throw new Error('项目不能为空。');
  if (!Number.isFinite(amount) || amount < 0) throw new Error('金额必须是大于或等于 0 的数字。');
  if (!Number.isInteger(primogems) || primogems < 0) throw new Error('氪金所得必须是大于或等于 0 的整数。');

  const input = { name, amount, primogems, updateTime: new Date().toISOString() };
  if (otherItemEditing.mode === 'create') {
    getSpendingData().otherItems.push({ id: buildSpendingRecordId('spending-other'), ...input });
  } else {
    const index = getSpendingData().otherItems.findIndex((item) => item.id === otherItemEditing.id);
    if (index < 0) throw new Error('未找到要修改的其他计数。');
    getSpendingData().otherItems.splice(index, 1, { ...getSpendingData().otherItems[index], ...input });
  }
  markSpendingChanged();
  rerenderSpending();
}

function deleteOtherItem() {
  if (!otherItemEditing || otherItemEditing.mode !== 'edit') return;
  const index = getSpendingData().otherItems.findIndex((item) => item.id === otherItemEditing.id);
  if (index >= 0) getSpendingData().otherItems.splice(index, 1);
  markSpendingChanged();
  rerenderSpending();
}

function openCreateIncentiveItemDialog() {
  incentiveItemEditing = { mode: 'create', id: null };
  incentiveItemDialogTitle.textContent = '新增激励计数';
  incentiveItemDeleteButton.style.display = 'none';
  incentiveItemNameInput.value = '';
  incentiveItemPrimogemsInput.value = '';
  incentiveItemCostInput.value = '';
  incentiveItemDialog.showModal();
  syncSpendingBodyDialogState();
  incentiveItemNameInput.focus();
}

function openEditIncentiveItemDialog(id) {
  const item = getSpendingData().incentiveItems.find((entry) => entry.id === id);
  if (!item) return;
  incentiveItemEditing = { mode: 'edit', id };
  incentiveItemDialogTitle.textContent = '修改激励计数';
  incentiveItemDeleteButton.style.display = '';
  incentiveItemNameInput.value = item.name;
  incentiveItemPrimogemsInput.value = item.primogems;
  incentiveItemCostInput.value = item.cost;
  incentiveItemDialog.showModal();
  syncSpendingBodyDialogState();
  incentiveItemNameInput.focus();
}

function saveIncentiveItem() {
  const name = incentiveItemNameInput.value.trim();
  const primogems = Number(incentiveItemPrimogemsInput.value);
  const cost = Number(incentiveItemCostInput.value);
  if (!name) throw new Error('项目不能为空。');
  if (!Number.isInteger(primogems) || primogems < 0) throw new Error('激励值必须是大于或等于 0 的整数。');
  if (!Number.isFinite(cost)) throw new Error('成本必须是有效数字。');

  const input = { name, primogems, cost, updateTime: new Date().toISOString() };
  if (incentiveItemEditing.mode === 'create') {
    getSpendingData().incentiveItems.push({ id: buildSpendingRecordId('spending-incentive'), ...input });
  } else {
    const index = getSpendingData().incentiveItems.findIndex((item) => item.id === incentiveItemEditing.id);
    if (index < 0) throw new Error('未找到要修改的激励计数。');
    getSpendingData().incentiveItems.splice(index, 1, { ...getSpendingData().incentiveItems[index], ...input });
  }
  markSpendingChanged();
  rerenderSpending();
}

function deleteIncentiveItem() {
  if (!incentiveItemEditing || incentiveItemEditing.mode !== 'edit') return;
  const index = getSpendingData().incentiveItems.findIndex((item) => item.id === incentiveItemEditing.id);
  if (index >= 0) getSpendingData().incentiveItems.splice(index, 1);
  markSpendingChanged();
  rerenderSpending();
}

function bindSpendingDialogBackdropClose(dialog, onClose) {
  let backdropPointerId = null;

  function isBackdropPointer(event) {
    if (event.target !== dialog) return false;
    const rect = dialog.getBoundingClientRect();
    const pointerInside = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    return !pointerInside;
  }

  dialog?.addEventListener('pointerdown', (event) => {
    backdropPointerId = isBackdropPointer(event) ? event.pointerId : null;
  });
  dialog?.addEventListener('pointerup', (event) => {
    const shouldClose = backdropPointerId === event.pointerId && isBackdropPointer(event);
    backdropPointerId = null;
    if (shouldClose) onClose();
  });
  dialog?.addEventListener('pointercancel', () => { backdropPointerId = null; });
  dialog?.addEventListener('close', () => { backdropPointerId = null; });
}
