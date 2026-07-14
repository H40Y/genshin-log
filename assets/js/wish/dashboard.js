function renderOverview(data) {
  const standardPulls = data.wishData.standard.totalPulls;
  const limitedPulls = data.wishData.limitedCharacter.totalPulls + data.wishData.limitedWeapon.totalPulls;
  const limitedHistory = [
    ...data.wishData.limitedCharacter.fiveStarHistory,
    ...data.wishData.limitedWeapon.fiveStarHistory,
  ];
  const standardFiveStars = data.wishData.standard.fiveStarHistory.length + limitedHistory.filter((item) => item.resultType === 'off-banner').length;
  const limitedFiveStars = limitedHistory.filter((item) => item.resultType === 'up').length;

  const cards = document.createElement('div');
  cards.className = 'grid cards-4';
  cards.append(
    makeStatCard('常驻总抽数', fmt(standardPulls), ''),
    makeStatCard('限定总抽数', fmt(limitedPulls), ''),
    makeStatCard('非 UP 5★', fmt(standardFiveStars), ''),
    makeStatCard('UP 5★', fmt(limitedFiveStars), ''),
  );

  overviewSection.innerHTML = '';
  overviewSection.appendChild(cards);
}

function renderBannerCards(data) {
  bannerSection.innerHTML = `
    <div class="section-header">
      <h2>池子概览</h2>
    </div>
  `;

  const grid = document.createElement('div');
  grid.className = 'grid cards-3';

  BANNERS.forEach((banner) => {
    const tpl = document.querySelector('#banner-card-template');
    const node = tpl.content.firstElementChild.cloneNode(true);
    const bannerData = data.wishData[banner.key];
    const history = bannerData.fiveStarHistory || [];
    const allIntervals = getIntervals(history);
    const upIntervals = getUpIntervals(history);
    const avgGap = average(allIntervals);
    const avgUpGap = average(upIntervals);
    const upRate = banner.key === 'standard' ? null : getResultRate(history, 'up');
    const offRate = banner.key === 'standard' ? null : getResultRate(history, 'off-banner');
    const fiveStarRate = getFiveStarRate(bannerData.totalPulls, history.length);
    const latestNames = [...history]
      .sort((a, b) => b.pullIndex - a.pullIndex)
      .slice(0, 6)
      .map((item) => item.itemName)
      .join(' / ');
    const lastFiveStar = history.length ? history[history.length - 1].itemName : '暂无';

    node.querySelector('.banner-title').textContent = banner.label;
    node.querySelector('.banner-subtitle').textContent = banner.subtitle;
    node.querySelector('.banner-pill').textContent = `${fmt(history.length)} 次 5★`;

    const gridEl = node.querySelector('.banner-grid');
    gridEl.append(
      createMetaBox('总抽数', fmt(bannerData.totalPulls)),
      createMetaBox('当前垫抽', fmt(bannerData.totalPulls - (history.length ? history[history.length - 1].pullIndex : 0))),
      createMetaBox('5★ 出率', pct(fiveStarRate)),
      createMetaBox(
        banner.key === 'standard' ? '5★ 平均间隔' : 'UP 5★ 平均间隔',
        `${(banner.key === 'standard' ? avgGap : avgUpGap).toFixed(2)} 抽`,
      ),
      createMetaBox('4★ 角色', fmt((bannerData.fourStarPullIndices?.character || []).length)),
      createMetaBox('4★ 武器', fmt((bannerData.fourStarPullIndices?.weapon || []).length)),
    );

    const totalPullsBox = gridEl.querySelector('.meta-box:first-child');
    if (totalPullsBox) {
      totalPullsBox.classList.add('meta-box-editable');
      const editTotalPullsBtn = document.createElement('button');
      editTotalPullsBtn.type = 'button';
      editTotalPullsBtn.className = 'ghost-button meta-box-corner-button';
      editTotalPullsBtn.textContent = 'i';
      editTotalPullsBtn.setAttribute('aria-label', `修改${banner.label}总抽数`);
      editTotalPullsBtn.title = '修改总抽数';
      editTotalPullsBtn.addEventListener('click', () => openTotalPullsDialog(banner.key));
      totalPullsBox.appendChild(editTotalPullsBtn);
    }

    const notes = [`最后 5★：${lastFiveStar}`];
    if (upRate !== null) notes.push(`UP 率 ${pct(upRate)}`);
    if (offRate !== null) notes.push(`歪率 ${pct(offRate)}`);
    if (latestNames) notes.push(`最近 6 次：${latestNames}`);
    node.querySelector('.banner-note').textContent = notes.join(' ｜ ');

    grid.appendChild(node);
  });

  bannerSection.appendChild(grid);
}

