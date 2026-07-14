function renderEmptyState() {
  overviewSection.innerHTML = `
    <div class="card landing-card">
      <div class="landing-badge">纯静态模式</div>
      <h2>上传符合规范的 JSON 后开始查看</h2>
      <p>
        你可以直接双击打开 <code>index.html</code>，然后上传 <code>schemaVersion: 4</code> 的 wish-data JSON。
      </p>
      <ul class="landing-list">
        <li>支持页面内修改 5★ 记录与总抽数</li>
        <li>支持导入 UIGF 自动更新已有数据</li>
        <li>修改只发生在当前页面数据里，想保留请手动导出 JSON</li>
      </ul>
    </div>
  `;
  bannerSection.innerHTML = '';
  timelineSection.innerHTML = '';
  historySection.innerHTML = '';
}

function buildTemplateData() {
  return {
    schemaVersion: 4,
    wishData: {
      standard: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
      limitedCharacter: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
      limitedWeapon: {
        totalPulls: 0,
        fiveStarHistory: [],
        fourStarPullIndices: {
          character: [],
          weapon: [],
        },
      },
    },
  };
}

function downloadJsonFile(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function importFromFile(file) {
  const text = await file.text();
  const payload = JSON.parse(text);
  const normalized = validateAndNormalizeData(payload);
  currentData = normalized;
  baselineData = cloneData(normalized);
  currentFileName = file.name;
  currentPages = Object.fromEntries(BANNERS.map((banner) => [banner.key, 1]));
  setDirty(false);
  persistBaselineData();
  persistSnapshot();
  updateCurrentFileLabel();
  rerender();
}

function getBannerRows(uigfList, gachaType) {
  const normalizedType = String(gachaType);
  const rows = uigfList.filter((row) => String(row.gacha_type) === normalizedType);
  const total = rows.length;
  return rows.map((row, index) => ({
    ...row,
    originalLocalIndex: index + 1,
    reversedLocalIndex: total - index,
    pullIndex: total - index + OFFSETS[normalizedType],
  }));
}

function ensureSortedUnique(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}

function buildTimedOffsetCheck(schema, uigfList, gachaType) {
  const bannerKey = BANNER_KEY_BY_GACHA_TYPE[gachaType];
  const schemaTimed = schema.wishData[bannerKey].fiveStarHistory.filter((row) => row.time);
  const uigfTimedFive = getBannerRows(uigfList, gachaType).filter((row) => String(row.rank_type) === '5');

  const byTime = new Map();
  for (const row of uigfTimedFive) {
    if (!byTime.has(row.time)) byTime.set(row.time, []);
    byTime.get(row.time).push(row);
  }

  const offsets = [];
  const ambiguous = [];

  for (const row of schemaTimed) {
    const candidates = (byTime.get(row.time) || []).filter(
      (item) => item.name === row.itemName && item.item_type === row.itemType,
    );

    if (candidates.length === 1) {
      offsets.push(row.pullIndex - candidates[0].reversedLocalIndex);
    } else {
      ambiguous.push({
        pullIndex: row.pullIndex,
        time: row.time,
        itemName: row.itemName,
        candidateCount: candidates.length,
      });
    }
  }

  const uniqueOffsets = [...new Set(offsets)];
  return {
    gachaType: String(gachaType),
    bannerKey,
    expectedOffset: OFFSETS[String(gachaType)],
    uniqueOffsets,
    ok: uniqueOffsets.length === 1 && uniqueOffsets[0] === OFFSETS[String(gachaType)],
    ambiguous,
  };
}

function buildDiff(schema, uigfList, gachaType) {
  const bannerKey = BANNER_KEY_BY_GACHA_TYPE[gachaType];
  const banner = schema.wishData[bannerKey];
  const mapped = getBannerRows(uigfList, gachaType);

  const existingFourCharacter = new Set(banner.fourStarPullIndices.character);
  const existingFourWeapon = new Set(banner.fourStarPullIndices.weapon);
  const existingFive = new Map(banner.fiveStarHistory.map((row) => [row.pullIndex, row]));

  const newFourStars = [];
  const patchFiveStars = [];
  const newFiveStars = [];
  const conflicts = [];

  for (const row of mapped) {
    const pullIndex = row.pullIndex;

    if (String(row.rank_type) === '4') {
      const targetType = row.item_type === '角色' ? 'character' : row.item_type === '武器' ? 'weapon' : null;
      const existingType = existingFourCharacter.has(pullIndex)
        ? 'character'
        : existingFourWeapon.has(pullIndex)
          ? 'weapon'
          : null;

      if (!existingType) {
        newFourStars.push({
          pullIndex,
          itemType: row.item_type,
          name: row.name,
          time: row.time,
          originalLocalIndex: row.originalLocalIndex,
          reversedLocalIndex: row.reversedLocalIndex,
        });
      } else if (existingType !== targetType) {
        const existingRecord = {
          pullIndex,
          existingType,
          newType: targetType,
          name: row.name,
          time: row.time,
        };
        if (
          (existingType === 'character' && targetType === 'weapon' && row.name === '昭心') ||
          (existingType === 'weapon' && targetType === 'character' && row.name === '砂糖')
        ) {
          // confirmed historical correction
        } else {
          conflicts.push(existingRecord);
        }
      }
    }

    if (String(row.rank_type) === '5') {
      const existing = existingFive.get(pullIndex);
      if (!existing) {
        newFiveStars.push({
          pullIndex,
          itemName: row.name,
          itemType: row.item_type,
          time: row.time,
          resultType: inferLimitedResultType(bannerKey, row.name, row.item_type),
          capturingRadiance: null,
          pullVersion: null,
          originalLocalIndex: row.originalLocalIndex,
          reversedLocalIndex: row.reversedLocalIndex,
        });
      } else {
        const changes = {};
        if (existing.time !== row.time) changes.time = { from: existing.time, to: row.time };
        if (existing.itemName !== row.name) changes.itemName = { from: existing.itemName, to: row.name };
        if (existing.itemType !== row.item_type) changes.itemType = { from: existing.itemType, to: row.item_type };
        if (Object.keys(changes).length > 0) {
          patchFiveStars.push({ pullIndex, changes });
        }
      }
    }
  }

  return {
    bannerKey,
    bannerLabel: BANNERS.find((item) => item.key === bannerKey)?.label ?? bannerKey,
    gachaType: String(gachaType),
    offset: OFFSETS[String(gachaType)],
    currentTotalPulls: banner.totalPulls,
    candidateTotalPulls: Math.max(banner.totalPulls, ...mapped.map((row) => row.pullIndex), banner.totalPulls),
    newFourStars,
    newFiveStars,
    patchFiveStars,
    conflicts,
  };
}

function applyDiff(schema, diff) {
  const banner = schema.wishData[diff.bannerKey];
  const four = banner.fourStarPullIndices;

  const removeIndex = (pullIndex) => {
    four.character = four.character.filter((x) => x !== pullIndex);
    four.weapon = four.weapon.filter((x) => x !== pullIndex);
  };

  const addIndex = (pullIndex, type) => {
    removeIndex(pullIndex);
    four[type].push(pullIndex);
    four.character = ensureSortedUnique(four.character);
    four.weapon = ensureSortedUnique(four.weapon);
  };

  banner.totalPulls = diff.candidateTotalPulls;

  for (const patch of diff.patchFiveStars) {
    const rec = banner.fiveStarHistory.find((item) => item.pullIndex === patch.pullIndex);
    if (!rec) continue;
    if (patch.changes.time) rec.time = patch.changes.time.to;
    if (patch.changes.itemName) rec.itemName = patch.changes.itemName.to;
    if (patch.changes.itemType) rec.itemType = patch.changes.itemType.to;
    rec.source = rec.source ?? 'auto';
  }

  for (const item of diff.newFourStars) {
    const type = item.itemType === '角色' ? 'character' : 'weapon';
    addIndex(item.pullIndex, type);
  }

  for (const item of diff.conflicts) {
    addIndex(item.pullIndex, item.newType);
  }

  for (const item of diff.newFiveStars) {
    banner.fiveStarHistory.push({
      id: `${diff.bannerKey}-${item.pullIndex}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      pullIndex: item.pullIndex,
      time: item.time,
      itemName: item.itemName,
      itemType: item.itemType,
      resultType: item.resultType ?? (diff.bannerKey === 'standard' ? 'off-banner' : 'unknown'),
      capturingRadiance: item.capturingRadiance ?? null,
      pullVersion: item.pullVersion
        ? {
            label: item.pullVersion.label ?? '',
            group: item.pullVersion.group ?? null,
          }
        : null,
      source: 'auto',
    });
  }

  banner.fiveStarHistory.sort((a, b) => a.pullIndex - b.pullIndex);
}

function summarizeUigfResult(checks, diffs) {
  const count = diffs.reduce((acc, diff) => ({
    newFourStars: acc.newFourStars + diff.newFourStars.length,
    newFiveStars: acc.newFiveStars + diff.newFiveStars.length,
    patchFiveStars: acc.patchFiveStars + diff.patchFiveStars.length,
    conflicts: acc.conflicts + diff.conflicts.length,
    totalPullsRaised: acc.totalPullsRaised + (diff.candidateTotalPulls > diff.currentTotalPulls ? 1 : 0),
  }), { newFourStars: 0, newFiveStars: 0, patchFiveStars: 0, conflicts: 0, totalPullsRaised: 0 });

  const failed = checks.filter((item) => !item.ok);
  return { count, failed };
}

function getUigfSupplementalItems(review) {
  if (!review?.diffs) return [];
  return review.diffs.flatMap((diff) => {
    if (!isLimitedBanner(diff.bannerKey)) return [];
    return diff.newFiveStars.map((item, itemIndex) => ({
      diff,
      item,
      itemIndex,
      key: `${diff.bannerKey}:${item.pullIndex}:${itemIndex}`,
    }));
  });
}

function renderResultTypeOptions(value) {
  return [
    ['up', 'up'],
    ['off-banner', 'off-banner'],
    ['unknown', 'unknown'],
  ].map(([optionValue, label]) => `<option value="${optionValue}"${value === optionValue ? ' selected' : ''}>${label}</option>`).join('');
}

function renderCapturingRadianceOptions(value) {
  return [
    ['', '未记录'],
    ['true', '是'],
    ['false', '否'],
  ].map(([optionValue, label]) => {
    const normalizedValue = value === null || value === undefined ? '' : String(Boolean(value));
    return `<option value="${optionValue}"${normalizedValue === optionValue ? ' selected' : ''}>${label}</option>`;
  }).join('');
}

function renderUigfSupplementalSection(review) {
  const items = getUigfSupplementalItems(review);
  if (!items.length) {
    return `
      <section class="uigf-section">
        <h4>待补充信息</h4>
        <div class="uigf-note">本次没有新增限定 5★ 记录。</div>
      </section>
    `;
  }

  const rows = items.map(({ diff, item, itemIndex }) => {
    const versionLabel = item.pullVersion?.label ?? '';
    const versionGroup = item.pullVersion?.group ?? '';
    const captureControl = diff.bannerKey === 'limitedCharacter'
      ? `<select data-uigf-field="capturingRadiance" data-banner="${diff.bannerKey}" data-index="${itemIndex}">${renderCapturingRadianceOptions(item.capturingRadiance)}</select>`
      : '<span class="uigf-muted-cell">—</span>';

    return `
      <tr>
        <td>${escapeHtml(diff.bannerLabel)}</td>
        <td>${item.pullIndex}</td>
        <td>${escapeHtml(item.itemName)}</td>
        <td>${escapeHtml(item.itemType)}</td>
        <td>
          <select data-uigf-field="resultType" data-banner="${diff.bannerKey}" data-index="${itemIndex}">
            ${renderResultTypeOptions(item.resultType ?? 'unknown')}
          </select>
        </td>
        <td><input data-uigf-field="pullVersionLabel" data-banner="${diff.bannerKey}" data-index="${itemIndex}" value="${escapeHtml(versionLabel)}" placeholder="如 5.6 / 月之一" /></td>
        <td><input data-uigf-field="pullVersionGroup" data-banner="${diff.bannerKey}" data-index="${itemIndex}" value="${escapeHtml(versionGroup)}" placeholder="如 5.6.0 / 5.6.5" /></td>
        <td>${captureControl}</td>
      </tr>
    `;
  }).join('');

  return `
    <section class="uigf-section">
      <h4>待补充信息</h4>
      <div class="uigf-supplemental-toolbar">
        <label>
          <span>批量版本标签</span>
          <input id="uigf-batch-version-label" placeholder="如 5.6 / 月之一" />
        </label>
        <label>
          <span>批量版本分组</span>
          <input id="uigf-batch-version-group" placeholder="如 5.6.0 / 5.6.5" />
        </label>
        <button type="button" class="ghost-button compact-button" id="uigf-batch-fill-empty">填充空白</button>
        <button type="button" class="ghost-button compact-button" id="uigf-batch-fill-all">覆盖全部</button>
      </div>
      <div class="table-wrap uigf-supplemental-table-wrap">
        <table class="uigf-supplemental-table">
          <thead>
            <tr>
              <th>池子</th>
              <th>抽位</th>
              <th>名称</th>
              <th>类型</th>
              <th>结果</th>
              <th>版本标签</th>
              <th>版本分组</th>
              <th>捕获明光</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
  `;
}

function bindUigfSupplementalControls() {
  const fillVersionInputs = (overwrite) => {
    const labelValue = uigfReviewContent.querySelector('#uigf-batch-version-label')?.value.trim() ?? '';
    const groupValue = uigfReviewContent.querySelector('#uigf-batch-version-group')?.value.trim() ?? '';

    uigfReviewContent.querySelectorAll('[data-uigf-field="pullVersionLabel"]').forEach((input) => {
      if (overwrite || !input.value.trim()) input.value = labelValue;
    });
    uigfReviewContent.querySelectorAll('[data-uigf-field="pullVersionGroup"]').forEach((input) => {
      if (overwrite || !input.value.trim()) input.value = groupValue;
    });
  };

  uigfReviewContent.querySelector('#uigf-batch-fill-empty')?.addEventListener('click', () => fillVersionInputs(false));
  uigfReviewContent.querySelector('#uigf-batch-fill-all')?.addEventListener('click', () => fillVersionInputs(true));
}

function syncUigfSupplementalInputs(review) {
  const items = getUigfSupplementalItems(review);
  for (const { diff, item, itemIndex } of items) {
    const fieldSelector = (field) => `[data-uigf-field="${field}"][data-banner="${diff.bannerKey}"][data-index="${itemIndex}"]`;
    const resultType = uigfReviewContent.querySelector(fieldSelector('resultType'))?.value ?? 'unknown';
    const label = uigfReviewContent.querySelector(fieldSelector('pullVersionLabel'))?.value.trim() ?? '';
    const group = uigfReviewContent.querySelector(fieldSelector('pullVersionGroup'))?.value.trim() ?? '';
    const captureValue = uigfReviewContent.querySelector(fieldSelector('capturingRadiance'))?.value ?? '';

    if (!label || !group) {
      throw new Error(`请补充 ${diff.bannerLabel} ${item.pullIndex} 抽 ${item.itemName} 的版本标签和版本分组。`);
    }

    item.resultType = resultType;
    item.pullVersion = { label, group };
    item.capturingRadiance = diff.bannerKey === 'limitedCharacter'
      ? (captureValue === '' ? null : captureValue === 'true')
      : null;
  }
}

function renderUigfReviewPanel(review) {
  const { count, failed } = summarizeUigfResult(review.checks, review.diffs);

  const checkHtml = review.checks.map((check) => {
    const status = check.ok ? '通过' : '失败';
    const offsets = check.uniqueOffsets.length ? check.uniqueOffsets.join(', ') : '无可用匹配';
    return `
      <div class="uigf-check-card ${check.ok ? 'is-ok' : 'is-failed'}">
        <div><strong>${BANNERS.find((item) => item.key === check.bannerKey)?.label ?? check.bannerKey}</strong></div>
        <div>校验：${status}</div>
        <div>期望 offset：${check.expectedOffset}</div>
        <div>实际 offset：${offsets}</div>
        ${check.ambiguous.length ? `<div>歧义匹配：${check.ambiguous.length} 条</div>` : ''}
      </div>
    `;
  }).join('');

  const diffHtml = review.diffs.map((diff) => {
    const totalPullsNote = diff.candidateTotalPulls > diff.currentTotalPulls
      ? `<div class="uigf-note">总抽数将从 ${diff.currentTotalPulls} 提升到 ${diff.candidateTotalPulls}</div>`
      : '';

    const newFiveHtml = diff.newFiveStars.length
      ? `<details class="uigf-details"><summary>新增 5★（${diff.newFiveStars.length}）</summary><ul>${diff.newFiveStars.map((item) => `<li>${item.pullIndex} 抽：${item.itemName}（${item.itemType}）${item.time ? `｜${item.time}` : ''}</li>`).join('')}</ul></details>`
      : '';

    const patchFiveHtml = diff.patchFiveStars.length
      ? `<details class="uigf-details"><summary>修补已有 5★（${diff.patchFiveStars.length}）</summary><ul>${diff.patchFiveStars.map((item) => {
          const parts = [];
          if (item.changes.time) parts.push(`时间 ${item.changes.time.from ?? '—'} → ${item.changes.time.to ?? '—'}`);
          if (item.changes.itemName) parts.push(`名称 ${item.changes.itemName.from} → ${item.changes.itemName.to}`);
          if (item.changes.itemType) parts.push(`类型 ${item.changes.itemType.from} → ${item.changes.itemType.to}`);
          return `<li>${item.pullIndex} 抽：${parts.join('；')}</li>`;
        }).join('')}</ul></details>`
      : '';

    const newFourHtml = diff.newFourStars.length
      ? `<details class="uigf-details"><summary>新增 4★ 索引（${diff.newFourStars.length}）</summary><ul>${diff.newFourStars.slice(0, 20).map((item) => `<li>${item.pullIndex} 抽：${item.name}（${item.itemType}）</li>`).join('')}</ul>${diff.newFourStars.length > 20 ? '<div class="uigf-note">仅展示前 20 条</div>' : ''}</details>`
      : '';

    const conflictsHtml = diff.conflicts.length
      ? `<details class="uigf-details"><summary>4★ 冲突（${diff.conflicts.length}）</summary><ul>${diff.conflicts.map((item) => `<li>${item.pullIndex} 抽：现有 ${item.existingType}，UIGF 判定 ${item.newType}，名称 ${item.name}</li>`).join('')}</ul><div class="uigf-note">当前实现会优先采用 UIGF 判定类型。</div></details>`
      : '';

    return `
      <article class="card uigf-diff-card">
        <h4>${diff.bannerLabel}</h4>
        <div class="uigf-summary-line">新增 4★：${diff.newFourStars.length} ｜ 新增 5★：${diff.newFiveStars.length} ｜ 修补 5★：${diff.patchFiveStars.length} ｜ 冲突：${diff.conflicts.length}</div>
        ${totalPullsNote}
        ${newFiveHtml}
        ${patchFiveHtml}
        ${newFourHtml}
        ${conflictsHtml}
      </article>
    `;
  }).join('');

  uigfReviewContent.innerHTML = `
    <div class="uigf-overview-grid">
      <div class="uigf-overview-item"><span>新增 4★</span><strong>${count.newFourStars}</strong></div>
      <div class="uigf-overview-item"><span>新增 5★</span><strong>${count.newFiveStars}</strong></div>
      <div class="uigf-overview-item"><span>修补 5★</span><strong>${count.patchFiveStars}</strong></div>
      <div class="uigf-overview-item"><span>发现冲突</span><strong>${count.conflicts}</strong></div>
    </div>
    <section class="uigf-section">
      <h4>偏移校验</h4>
      <div class="uigf-check-grid">${checkHtml}</div>
      ${failed.length ? '<div class="uigf-warning">存在 offset 校验失败，当前不建议应用导入结果。</div>' : ''}
    </section>
    <section class="uigf-section">
      <h4>变更详情</h4>
      <div class="uigf-diff-grid">${diffHtml}</div>
    </section>
    ${renderUigfSupplementalSection(review)}
  `;

  bindUigfSupplementalControls();
  uigfReviewApplyBtn.disabled = failed.length > 0;
}

async function analyzeUigfFromFile(file) {
  if (!currentData) {
    throw new Error('请先上传 schemaVersion: 4 的主 JSON，再导入 UIGF。');
  }

  const text = await file.text();
  const imported = JSON.parse(text);
  const uigfList = Array.isArray(imported.list) ? imported.list : [];
  if (!uigfList.length) {
    throw new Error('UIGF 文件缺少 list 数组，或数组为空。');
  }

  const checks = ['200', '301', '302'].map((gachaType) => buildTimedOffsetCheck(currentData, uigfList, gachaType));
  const diffs = ['200', '301', '302'].map((gachaType) => buildDiff(currentData, uigfList, gachaType));
  return {
    fileName: file.name,
    checks,
    diffs,
  };
}

