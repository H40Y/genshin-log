function buildSpendingHero(totals) {
  const card = document.createElement('section');
  card.className = 'card spending-hero';
  card.innerHTML = `
    <div class="spending-hero-content">
      <div class="spending-hero-label">总氪金金额</div>
      <div class="spending-total-amount">${formatSpendingCurrency(totals.totalSpent)}</div>
    </div>`;
  return card;
}

function buildFixedPurchaseCard() {
  const data = getSpendingData();
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="spending-card-header">
      <div>
        <h2>固定项计数</h2>
      </div>
    </div>
    <div class="fixed-purchase-grid">
      ${SPENDING_FIXED_PURCHASES.map((item) => {
        const count = normalizeCount(data.fixedCounts[item.key]);
        return `
          <article class="fixed-purchase-item">
            <div>
              <div class="fixed-purchase-title">${escapeSpendingHtml(item.label)}</div>
              <div class="fixed-purchase-price">固定单价 ${formatSpendingCurrency(item.unitPrice)}</div>
            </div>
            <label class="fixed-count-label">
              <input type="number" min="0" step="1" inputmode="numeric" value="${count}" data-fixed-count="${escapeSpendingHtml(item.key)}" aria-label="${escapeSpendingHtml(item.label)}购买次数" />
              <span class="fixed-count-unit">次</span>
            </label>
            <div class="fixed-subtotal">小计<strong>${formatSpendingCurrency(count * item.unitPrice)}</strong></div>
          </article>`;
      }).join('')}
    </div>`;

  card.querySelectorAll('[data-fixed-count]').forEach((input) => {
    input.addEventListener('change', () => updateFixedPurchaseCount(input.dataset.fixedCount, input.value));
  });
  return card;
}

function buildOtherItemsCard(totals) {
  const data = getSpendingData();
  const rows = data.otherItems.map((item) => `
    <tr>
      <td>${escapeSpendingHtml(item.name)}</td>
      <td class="numeric-cell">${formatSpendingNumber(item.primogems, 0)}</td>
      <td class="numeric-cell">${formatSpendingCurrency(item.amount)}</td>
      <td><button class="table-button compact-button" type="button" data-edit-other="${escapeSpendingHtml(item.id)}">编辑</button></td>
    </tr>`).join('');
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="spending-card-header">
      <div>
        <h2>其他计数</h2>
      </div>
      <button class="icon-button" type="button" id="add-other-item" aria-label="新增其他计数">＋</button>
    </div>
    <div class="table-wrap">
      <table class="spending-table other-items-table">
        <thead><tr><th>项目</th><th class="numeric-cell">氪金所得（原石）</th><th class="numeric-cell">金额</th><th>操作</th></tr></thead>
        <tbody>
          ${rows || '<tr><td class="empty-table-cell" colspan="4">还没有其他计数，点击右上角“＋”添加。</td></tr>'}
          ${rows ? `<tr class="table-total-row"><td>合计</td><td class="numeric-cell">${formatSpendingNumber(totals.otherPrimogems, 0)}</td><td class="numeric-cell">${formatSpendingCurrency(totals.otherTotal)}</td><td></td></tr>` : ''}
        </tbody>
      </table>
    </div>`;
  card.querySelector('#add-other-item')?.addEventListener('click', openCreateOtherItemDialog);
  card.querySelectorAll('[data-edit-other]').forEach((button) => {
    button.addEventListener('click', () => openEditOtherItemDialog(button.dataset.editOther));
  });
  return card;
}

function buildIncentiveItemsCard(totals) {
  const data = getSpendingData();
  const rows = data.incentiveItems.map((item) => `
    <tr>
      <td>${escapeSpendingHtml(item.name)}</td>
      <td class="numeric-cell">${formatSpendingNumber(item.primogems, 0)}</td>
      <td class="numeric-cell">${formatSpendingCurrency(item.cost)}</td>
      <td><button class="table-button compact-button" type="button" data-edit-incentive="${escapeSpendingHtml(item.id)}">编辑</button></td>
    </tr>`).join('');
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <div class="spending-card-header">
      <div>
        <h2>激励计数</h2>
      </div>
      <button class="icon-button" type="button" id="add-incentive-item" aria-label="新增激励计数">＋</button>
    </div>
    <div class="table-wrap">
      <table class="spending-table incentive-table">
        <thead><tr><th>项目</th><th class="numeric-cell">激励值（原石）</th><th class="numeric-cell">成本</th><th>操作</th></tr></thead>
        <tbody>
          ${rows || '<tr><td class="empty-table-cell" colspan="4">还没有激励计数，点击右上角“＋”添加。</td></tr>'}
          ${rows ? `<tr class="table-total-row"><td>合计</td><td class="numeric-cell">${formatSpendingNumber(totals.incentivePrimogems, 0)}</td><td class="numeric-cell">${formatSpendingCurrency(totals.incentiveCost)}</td><td></td></tr>` : ''}
        </tbody>
      </table>
    </div>`;
  card.querySelector('#add-incentive-item')?.addEventListener('click', openCreateIncentiveItemDialog);
  card.querySelectorAll('[data-edit-incentive]').forEach((button) => {
    button.addEventListener('click', () => openEditIncentiveItemDialog(button.dataset.editIncentive));
  });
  return card;
}

function buildExtraBalanceCard(totals) {
  const card = document.createElement('section');
  card.className = 'card profit-card';
  card.dataset.tone = totals.extraBalance > 0 ? 'positive' : totals.extraBalance < 0 ? 'negative' : 'neutral';
  card.innerHTML = `
    <div class="profit-label">额外盈亏</div>
    <div class="profit-value">${formatSignedNumber(totals.extraBalancePrimogems)} 原石</div>
    <div class="profit-reference">${formatSignedCurrency(totals.extraBalance)}</div>
    <div class="profit-formula">
      计算方式：（${formatSpendingNumber(totals.otherPrimogems, 0)} 氪金所得
      + ${formatSpendingNumber(totals.incentivePrimogems, 0)} 激励值）÷ 20
      - ${formatSpendingCurrency(totals.otherTotal)}（其他金额）
      - ${formatSpendingCurrency(totals.incentiveCost)}（成本）
    </div>`;
  return card;
}

function rerenderSpending() {
  const totals = summarizeSpending();
  spendingSection.innerHTML = '';
  const stack = document.createElement('div');
  stack.className = 'spending-stack';
  stack.appendChild(buildSpendingHero(totals));
  stack.appendChild(buildFixedPurchaseCard());
  stack.appendChild(buildOtherItemsCard(totals));
  stack.appendChild(buildIncentiveItemsCard(totals));
  stack.appendChild(buildExtraBalanceCard(totals));
  spendingSection.appendChild(stack);
}
