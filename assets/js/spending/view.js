let spendingDigitRollAnimationFrame = null;

function buildSpendingDigitRoller(element, value) {
  if (!element) return;

  const formattedValue = formatSpendingCurrency(value);
  let digitIndex = 0;
  element.replaceChildren();
  element.setAttribute('aria-label', formattedValue);

  Array.from(formattedValue).forEach((character) => {
    if (/\d/.test(character)) {
      const targetDigit = Number(character);
      const digitWindow = document.createElement('span');
      const digitReel = document.createElement('span');
      digitWindow.className = 'spending-digit-window';
      digitWindow.setAttribute('aria-hidden', 'true');
      digitReel.className = 'spending-digit-reel';
      digitReel.style.setProperty('--spending-digit-offset', `-${targetDigit}em`);
      digitReel.style.setProperty('--spending-digit-delay', `${digitIndex * 55}ms`);
      digitReel.style.setProperty('--spending-digit-duration', `${520 + (targetDigit * 70)}ms`);

      for (let step = 0; step <= targetDigit; step += 1) {
        const digit = document.createElement('span');
        digit.className = 'spending-digit';
        digit.textContent = String(step);
        digitReel.appendChild(digit);
      }

      digitWindow.appendChild(digitReel);
      element.appendChild(digitWindow);
      digitIndex += 1;
      return;
    }

    const separator = document.createElement('span');
    separator.className = 'spending-digit-separator';
    separator.setAttribute('aria-hidden', 'true');
    separator.textContent = character;
    element.appendChild(separator);
  });
}

function animateSpendingTotal(element) {
  if (!element) return;

  if (spendingDigitRollAnimationFrame !== null) {
    cancelAnimationFrame(spendingDigitRollAnimationFrame);
    spendingDigitRollAnimationFrame = null;
  }

  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    element.classList.add('is-rolling');
    return;
  }

  spendingDigitRollAnimationFrame = requestAnimationFrame(() => {
    spendingDigitRollAnimationFrame = requestAnimationFrame(() => {
      element.classList.add('is-rolling');
      spendingDigitRollAnimationFrame = null;
    });
  });
}

function buildSpendingHero(totals) {
  const card = document.createElement('section');
  card.className = 'card spending-hero';
  card.innerHTML = `
    <div class="spending-hero-content">
      <div class="spending-hero-label">总氪金金额</div>
      <div class="spending-total-amount"></div>
    </div>`;
  buildSpendingDigitRoller(card.querySelector('.spending-total-amount'), totals.totalSpent);
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
        const updateTime = formatSpendingUpdateTime(data.fixedUpdateTimes[item.key]);
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
            <div class="fixed-update-time">${escapeSpendingHtml(updateTime)}</div>
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
  const primogemValue = (totals.otherPrimogems + totals.incentivePrimogems) / 20;
  const card = document.createElement('section');
  card.className = 'card profit-card';
  card.dataset.tone = totals.extraBalance > 0 ? 'positive' : totals.extraBalance < 0 ? 'negative' : 'neutral';
  card.innerHTML = `
    <div class="profit-label-row">
      <span class="profit-label">额外盈亏</span>
      <span class="profit-info">
        <button class="profit-info-trigger" type="button" aria-label="查看额外盈亏计算方式" aria-describedby="profit-formula-tooltip">i</button>
        <span class="profit-tooltip" id="profit-formula-tooltip" role="tooltip">
          <span class="profit-formula-title">计算方式</span>
          <span class="profit-formula-stack">
            <span class="profit-formula-row">
              <span class="profit-formula-operator"></span>
              <span class="profit-formula-term">
                原石折算
                <small>（${formatSpendingNumber(totals.otherPrimogems, 0)} 氪金所得 + ${formatSpendingNumber(totals.incentivePrimogems, 0)} 激励值）÷ 20</small>
              </span>
              <span class="profit-formula-amount">${formatSpendingCurrency(primogemValue)}</span>
            </span>
            <span class="profit-formula-row">
              <span class="profit-formula-operator">−</span>
              <span class="profit-formula-term">其他金额</span>
              <span class="profit-formula-amount">${formatSpendingCurrency(totals.otherTotal)}</span>
            </span>
            <span class="profit-formula-row">
              <span class="profit-formula-operator">−</span>
              <span class="profit-formula-term">成本</span>
              <span class="profit-formula-amount">${formatSpendingCurrency(totals.incentiveCost)}</span>
            </span>
            <span class="profit-formula-rule" aria-hidden="true"></span>
            <span class="profit-formula-row profit-formula-result">
              <span class="profit-formula-operator">=</span>
              <span class="profit-formula-term">额外盈亏</span>
              <span class="profit-formula-amount">${formatSignedCurrency(totals.extraBalance)}</span>
            </span>
          </span>
        </span>
      </span>
    </div>
    <div class="profit-value">${formatSignedNumber(totals.extraBalancePrimogems)} 原石</div>
    <div class="profit-reference">${formatSignedCurrency(totals.extraBalance)}</div>`;
  return card;
}

function rerenderSpending() {
  const totals = summarizeSpending();
  if (spendingDigitRollAnimationFrame !== null) {
    cancelAnimationFrame(spendingDigitRollAnimationFrame);
    spendingDigitRollAnimationFrame = null;
  }
  spendingSection.innerHTML = '';
  const stack = document.createElement('div');
  stack.className = 'spending-stack';
  const summary = document.createElement('div');
  summary.className = 'spending-summary-grid';
  const hero = buildSpendingHero(totals);
  summary.appendChild(hero);
  summary.appendChild(buildExtraBalanceCard(totals));
  stack.appendChild(summary);
  stack.appendChild(buildFixedPurchaseCard());
  stack.appendChild(buildOtherItemsCard(totals));
  stack.appendChild(buildIncentiveItemsCard(totals));
  spendingSection.appendChild(stack);
  animateSpendingTotal(hero.querySelector('.spending-total-amount'));
}
