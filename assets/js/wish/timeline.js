function formatTimelineVersionLabel(pullVersion) {
  if (!pullVersion?.label) return '未标注版本';
  const group = String(pullVersion.group ?? '');
  const parts = group.split('.');
  const patch = parts[parts.length - 1] ?? '';
  const phase = patch === '5' ? '下' : '上';
  return `${pullVersion.label} ${phase}`;
}

function formatTimelineAxisLabel(pullVersion) {
  return pullVersion?.label ?? '未标注版本';
}

function getUpEvents(history) {
  const events = [];
  let previousUpPullIndex = 0;
  let lastOffBannerItem = null;

  history.forEach((item) => {
    if (item.resultType === 'off-banner') {
      lastOffBannerItem = item;
      return;
    }

    if (item.resultType !== 'up') return;

    events.push({
      item,
      cost: item.pullIndex - previousUpPullIndex,
      precedingOffBannerName: lastOffBannerItem?.itemName ?? null,
      capturingRadiance: item.capturingRadiance === true,
    });

    previousUpPullIndex = item.pullIndex;
    lastOffBannerItem = null;
  });

  return events;
}

function getAverageUpCurvePoints(history, typeLabel) {
  const points = [];
  let previousUpPullIndex = 0;
  let totalCost = 0;

  history.forEach((item) => {
    if (item.resultType !== 'up') return;

    const cost = item.pullIndex - previousUpPullIndex;
    totalCost += cost;
    points.push({
      item,
      typeLabel,
      index: points.length + 1,
      cost,
      average: totalCost / (points.length + 1),
    });
    previousUpPullIndex = item.pullIndex;
  });

  return points;
}

function groupUpEventsByVersion(events) {
  const grouped = new Map();

  events.forEach((eventData) => {
    const versionLabel = eventData.item.pullVersion?.label ?? '未标注版本';
    const versionGroup = eventData.item.pullVersion?.group ?? null;
    const key = `${versionGroup ?? 'null'}::${versionLabel}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        versionLabel,
        versionGroup,
        events: [],
      });
    }
    grouped.get(key).events.push(eventData);
  });

  return [...grouped.values()].sort((a, b) => compareVersionGroup(a.versionGroup, b.versionGroup));
}

function showTimelineTooltip(event, timelineEvent, typeLabel) {
  if (!timelineTooltip) return;

  const tags = [];
  if (timelineEvent.precedingOffBannerName) {
    tags.push(`歪 ${timelineEvent.precedingOffBannerName}`);
  }
  if (timelineEvent.capturingRadiance) {
    tags.push('捕获明光');
  }

  timelineTooltip.innerHTML = `
    <div class="timeline-tooltip-title">${timelineEvent.item.itemName}</div>
    <div class="timeline-tooltip-line">${typeLabel}｜${formatTimelineVersionLabel(timelineEvent.item.pullVersion)}</div>
    <div class="timeline-tooltip-line">花费 ${timelineEvent.cost} 抽</div>
    ${tags.length ? `<div class="timeline-tooltip-tags">${tags.map((tag) => `<span class="timeline-tooltip-tag">${tag}</span>`).join('')}</div>` : ''}
  `;

  timelineTooltip.hidden = false;
  moveTimelineTooltip(event);
}

function moveTimelineTooltip(event) {
  if (!timelineTooltip || timelineTooltip.hidden) return;
  const offset = 16;
  const tooltipRect = timelineTooltip.getBoundingClientRect();
  let left = event.clientX + offset;
  let top = event.clientY + offset;

  if (left + tooltipRect.width > window.innerWidth - 12) {
    left = event.clientX - tooltipRect.width - offset;
  }
  if (top + tooltipRect.height > window.innerHeight - 12) {
    top = event.clientY - tooltipRect.height - offset;
  }

  timelineTooltip.style.left = `${Math.max(12, left)}px`;
  timelineTooltip.style.top = `${Math.max(12, top)}px`;
}

function hideTimelineTooltip() {
  if (!timelineTooltip) return;
  timelineTooltip.hidden = true;
}

function createTimelineBar(eventData, maxCost, typeLabel, options = {}) {
  const { hideValue = false } = options;

  const barWrap = document.createElement('div');
  barWrap.className = hideValue ? 'timeline-bar-wrap timeline-bar-wrap-compact' : 'timeline-bar-wrap';

  const barOuter = document.createElement('div');
  barOuter.className = 'timeline-bar-outer';

  const bar = document.createElement('div');
  bar.className = 'timeline-bar';
  const height = maxCost > 0 ? Math.max(12, (eventData.cost / maxCost) * 180) : 12;
  bar.style.height = `${height}px`;

  if (eventData.precedingOffBannerName) {
    const marker = document.createElement('span');
    marker.className = 'timeline-bar-marker timeline-bar-marker-off-banner';
    marker.textContent = '歪';
    barOuter.appendChild(marker);
  }

  if (eventData.capturingRadiance) {
    const marker = document.createElement('span');
    marker.className = 'timeline-bar-marker timeline-bar-marker-capturing-radiance';
    marker.textContent = '捕';
    barOuter.appendChild(marker);
  }

  barOuter.appendChild(bar);
  barOuter.addEventListener('mouseenter', (domEvent) => showTimelineTooltip(domEvent, eventData, typeLabel));
  barOuter.addEventListener('mousemove', moveTimelineTooltip);
  barOuter.addEventListener('mouseleave', hideTimelineTooltip);

  const value = document.createElement('div');
  value.className = hideValue ? 'timeline-bar-value timeline-bar-value-placeholder' : 'timeline-bar-value';
  value.textContent = hideValue ? '' : String(eventData.cost);

  barWrap.append(value, barOuter);
  return barWrap;
}

function buildTimelineEventRuns(events) {
  const runs = [];
  let index = 0;

  while (index < events.length) {
    const current = events[index];
    const name = current.item?.itemName ?? '';
    let end = index + 1;

    while (end < events.length && (events[end].item?.itemName ?? '') === name) {
      end += 1;
    }

    const runEvents = events.slice(index, end);
    const totalCost = runEvents.reduce((sum, eventData) => sum + (eventData.cost ?? 0), 0);

    runs.push({
      itemName: name,
      count: end - index,
      events: runEvents,
      totalCost,
    });

    index = end;
  }

  return runs;
}

function createTimelineEventGroup(run, maxCost, typeLabel) {
  const shouldHighlight = run.count >= 2;
  const node = document.createElement('div');
  node.className = shouldHighlight ? 'timeline-event-group timeline-event-group-highlight' : 'timeline-event-group';

  if (shouldHighlight) {
    const badge = document.createElement('div');
    badge.className = 'timeline-event-group-count';
    badge.textContent = `${run.totalCost}`;
    node.appendChild(badge);
  }

  const barsRow = document.createElement('div');
  barsRow.className = 'timeline-event-group-bars';
  run.events.forEach((eventData) => {
    barsRow.appendChild(createTimelineBar(eventData, maxCost, typeLabel, { hideValue: shouldHighlight }));
  });

  node.appendChild(barsRow);
  return node;
}

function createTimelineTrack(title, versionGroups, typeLabel, maxCost) {
  const track = document.createElement('div');
  track.className = 'timeline-track';

  const header = document.createElement('div');
  header.className = 'timeline-track-header';
  header.textContent = title;

  const content = document.createElement('div');
  content.className = 'timeline-track-content';

  if (!versionGroups.length) {
    const empty = document.createElement('div');
    empty.className = 'card empty-state';
    empty.textContent = '暂无可展示的 UP 记录';
    content.appendChild(empty);
  } else {
    versionGroups.forEach((group) => {
      const versionColumn = document.createElement('div');
      versionColumn.className = 'timeline-version-column';

      const versionBlock = document.createElement('div');
      versionBlock.className = 'timeline-version-block';

      const bars = document.createElement('div');
      bars.className = 'timeline-version-bars';
      buildTimelineEventRuns(group.events).forEach((run) => {
        bars.appendChild(createTimelineEventGroup(run, maxCost, typeLabel));
      });

      const label = document.createElement('div');
      label.className = 'timeline-version-label';
      label.textContent = formatTimelineAxisLabel(group.events[0]?.item.pullVersion ?? null);

      versionBlock.appendChild(bars);
      versionColumn.append(versionBlock, label);
      content.appendChild(versionColumn);
    });
  }

  track.append(header, content);
  return track;
}

function showAverageUpCurveTooltip(event, point) {
  if (!timelineTooltip) return;

  timelineTooltip.innerHTML = `
    <div class="timeline-tooltip-line average-up-curve-tooltip-value">${point.average.toFixed(2)} 抽</div>
  `;

  timelineTooltip.hidden = false;
  moveTimelineTooltip(event);
}

function getAverageUpPointRatio(points, index) {
  if (points.length <= 1) return 0.5;
  return (index - 1) / (points.length - 1);
}

function getAverageUpVisiblePoints(points, rangeStart, rangeEnd) {
  if (points.length <= 1) return points;

  const start = Math.min(rangeStart, rangeEnd);
  const end = Math.max(rangeStart, rangeEnd);
  return points.filter((point) => {
    const ratio = getAverageUpPointRatio(points, point.index);
    return ratio >= start - AVERAGE_UP_RANGE_EPSILON && ratio <= end + AVERAGE_UP_RANGE_EPSILON;
  });
}

function getAverageUpCurveStats(points) {
  const values = points.map((point) => point.average);
  return {
    min: values.length ? Math.min(...values) : 0,
    max: values.length ? Math.max(...values) : 0,
  };
}

function getAverageUpCurveTrend(points) {
  if (points.length < 2) {
    return { label: '持平', symbol: '→', className: 'average-up-curve-trend-flat' };
  }

  const diff = points[points.length - 1].average - points[0].average;
  if (Math.abs(diff) < AVERAGE_UP_RANGE_EPSILON) {
    return { label: '持平', symbol: '→', className: 'average-up-curve-trend-flat' };
  }
  return diff > 0
    ? { label: '上升', symbol: '↑', className: 'average-up-curve-trend-up' }
    : { label: '下降', symbol: '↓', className: 'average-up-curve-trend-down' };
}

function createAverageUpCurveStats(points) {
  const stats = getAverageUpCurveStats(points);
  const trend = getAverageUpCurveTrend(points);
  const node = document.createElement('div');
  node.className = 'average-up-curve-stats';
  [
    ['最低', stats.min],
    ['最高', stats.max],
  ].forEach(([label, value]) => {
    const item = document.createElement('div');
    item.className = 'average-up-curve-stat';
    item.innerHTML = `<span>${label}</span>${value.toFixed(2)} 抽`;
    node.appendChild(item);
  });

  const trendItem = document.createElement('div');
  trendItem.className = `average-up-curve-stat average-up-curve-trend ${trend.className}`;
  trendItem.innerHTML = `<span>趋势</span>${trend.symbol}`;
  trendItem.title = trend.label;
  node.appendChild(trendItem);
  return node;
}

function formatAverageUpAxisTick(value) {
  return String(Math.round(value));
}

function getAverageUpCurvePad(mini) {
  return mini
    ? { top: 8, right: 12, bottom: 8, left: 12 }
    : { top: 18, right: 16, bottom: 18, left: 36 };
}

function getAverageUpNavigatorLayout(navigatorWidth, navigatorHeight) {
  const width = Math.max(1, Math.round(navigatorWidth || 860));
  const height = Math.max(1, Math.round(navigatorHeight || 52));
  const viewBoxWidth = Math.max(360, width);
  const viewBoxHeight = 54;
  const pad = getAverageUpCurvePad(true);
  const scale = Math.min(width / viewBoxWidth, height / viewBoxHeight);
  const renderedWidth = viewBoxWidth * scale;
  const offsetX = (width - renderedWidth) / 2;

  return {
    width,
    scale,
    plotStart: offsetX + pad.left * scale,
    plotWidth: Math.max(1, (viewBoxWidth - pad.left - pad.right) * scale),
  };
}

function getAverageUpNavigatorRanges(rangeStart, rangeEnd, navigatorWidth, navigatorHeight) {
  const layout = getAverageUpNavigatorLayout(navigatorWidth, navigatorHeight);
  const startPx = Math.min(rangeStart, rangeEnd) * layout.width;
  const endPx = Math.max(rangeStart, rangeEnd) * layout.width;
  const dataRange = {
    start: (startPx - layout.plotStart) / layout.plotWidth,
    end: (endPx - layout.plotStart) / layout.plotWidth,
  };
  const markerRadius = 2.5;
  const markerStrokeHalfWidth = 1;
  const markerOverlap = (markerRadius + markerStrokeHalfWidth) * layout.scale / layout.plotWidth;

  return {
    dataRange,
    renderRange: {
      start: dataRange.start - markerOverlap,
      end: dataRange.end + markerOverlap,
    },
  };
}

function getAverageUpNavigatorRatioForDataRatio(dataRatio, navigatorWidth, navigatorHeight) {
  const layout = getAverageUpNavigatorLayout(navigatorWidth, navigatorHeight);
  return Math.min(1, Math.max(0, (
    layout.plotStart + dataRatio * layout.plotWidth
  ) / layout.width));
}

function getAverageUpMinimumNavigatorRange(points, navigatorWidth, navigatorHeight) {
  if (points.length <= AVERAGE_UP_MIN_VISIBLE_POINTS) return 1;

  const layout = getAverageUpNavigatorLayout(navigatorWidth, navigatorHeight);
  const minDataRange = (AVERAGE_UP_MIN_VISIBLE_POINTS - 1) / Math.max(1, points.length - 1);
  return minDataRange * layout.plotWidth / layout.width;
}

function createAverageUpCurveSvg(series, options = {}) {
  const {
    mini = false,
    rangeStart = 0,
    rangeEnd = 1,
    chartWidth = 860,
    navigatorWidth = chartWidth,
    navigatorHeight = 52,
  } = options;
  const points = series.points;
  const width = Math.max(360, Math.round(chartWidth));
  const height = mini ? 54 : 260;
  const pad = getAverageUpCurvePad(mini);
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const expectedAverage = !mini && Number.isFinite(series.expectedAverage)
    ? series.expectedAverage
    : null;
  const stats = getAverageUpCurveStats(expectedAverage === null
    ? points
    : [...points, { average: expectedAverage }]);
  const yMin = Math.max(0, Math.floor((stats.min - AVERAGE_UP_AXIS_PADDING) / 10) * 10);
  const yMax = Math.ceil((stats.max + AVERAGE_UP_AXIS_PADDING) / 10) * 10;
  const yRange = Math.max(1, yMax - yMin);
  const navigatorRanges = mini
    ? null
    : getAverageUpNavigatorRanges(rangeStart, rangeEnd, navigatorWidth, navigatorHeight);
  const dataRange = navigatorRanges?.dataRange || { start: 0, end: 1 };
  const renderRange = navigatorRanges?.renderRange || dataRange;
  const xFor = (index) => {
    if (points.length <= 1) return pad.left + plotWidth / 2;
    const ratio = getAverageUpPointRatio(points, index);
    const start = dataRange.start;
    const end = dataRange.end;
    return pad.left + ((ratio - start) / Math.max(0.01, end - start)) * plotWidth;
  };
  const renderXFor = (index) => {
    const x = xFor(index);
    return mini ? x : Math.min(width - pad.right, Math.max(pad.left, x));
  };
  const yFor = (value) => pad.top + plotHeight - ((value - yMin) / yRange) * plotHeight;
  const yTicks = mini ? [] : [...new Set([yMin, (yMin + yMax) / 2, yMax])];
  const visiblePoints = mini ? points : getAverageUpVisiblePoints(points, renderRange.start, renderRange.end);
  const averageAtRatio = (ratio) => {
    if (points.length <= 1) return points[0]?.average ?? 0;

    const scaledIndex = ratio * (points.length - 1);
    const leftIndex = Math.floor(scaledIndex);
    const rightIndex = Math.ceil(scaledIndex);
    const left = points[leftIndex];
    const right = points[rightIndex];
    if (!left || !right || leftIndex === rightIndex) return (left || right)?.average ?? 0;

    const progress = scaledIndex - leftIndex;
    return left.average + (right.average - left.average) * progress;
  };
  const linePoints = (() => {
    if (mini || points.length <= 1) return visiblePoints;

    const clampedStart = Math.max(0, renderRange.start);
    const clampedEnd = Math.min(1, renderRange.end);
    if (clampedStart > clampedEnd) return [];

    const line = [];
    if (renderRange.start > 0) {
      line.push({
        index: 1 + clampedStart * (points.length - 1),
        average: averageAtRatio(clampedStart),
      });
    }
    line.push(...visiblePoints);
    if (renderRange.end < 1) {
      line.push({
        index: 1 + clampedEnd * (points.length - 1),
        average: averageAtRatio(clampedEnd),
      });
    }
    return line;
  })();
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', mini ? 'average-up-curve-navigator-svg' : 'average-up-curve-svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `${series.label}平均 UP 抽数变化曲线`);

  yTicks.forEach((tick) => {
    const y = yFor(tick);
    const line = document.createElementNS(svgNs, 'line');
    line.setAttribute('class', 'average-up-curve-grid');
    line.setAttribute('x1', pad.left);
    line.setAttribute('x2', width - pad.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    svg.appendChild(line);

    const label = document.createElementNS(svgNs, 'text');
    label.setAttribute('class', 'average-up-curve-axis-label');
    label.setAttribute('x', pad.left - 12);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.textContent = formatAverageUpAxisTick(tick);
    svg.appendChild(label);
  });

  if (expectedAverage !== null) {
    const expectedY = yFor(expectedAverage);
    const expectedLine = document.createElementNS(svgNs, 'line');
    expectedLine.setAttribute('class', 'average-up-curve-expected-line');
    expectedLine.setAttribute('x1', pad.left);
    expectedLine.setAttribute('x2', width - pad.right);
    expectedLine.setAttribute('y1', expectedY);
    expectedLine.setAttribute('y2', expectedY);
    svg.appendChild(expectedLine);

    const expectedLabel = document.createElementNS(svgNs, 'text');
    expectedLabel.setAttribute('class', 'average-up-curve-expected-label');
    expectedLabel.setAttribute('x', width - pad.right - 4);
    expectedLabel.setAttribute('y', Math.max(pad.top + 12, expectedY - 6));
    expectedLabel.setAttribute('text-anchor', 'end');
    expectedLabel.textContent = `期望 ${expectedAverage.toFixed(2)}`;
    svg.appendChild(expectedLabel);
  }

  const polyline = document.createElementNS(svgNs, 'polyline');
  polyline.setAttribute('class', `average-up-curve-line ${series.className}`);
  polyline.setAttribute(
    'points',
    linePoints.map((point) => `${renderXFor(point.index)},${yFor(point.average)}`).join(' '),
  );
  svg.appendChild(polyline);

  visiblePoints.forEach((point) => {
    const cx = renderXFor(point.index);
    const cy = yFor(point.average);
    const circle = document.createElementNS(svgNs, 'circle');
    circle.setAttribute('class', `average-up-curve-point ${series.className}`);
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', mini ? 2.5 : 4);
    svg.appendChild(circle);

    if (!mini) {
      const hitArea = document.createElementNS(svgNs, 'circle');
      hitArea.setAttribute('class', 'average-up-curve-hit-area');
      hitArea.setAttribute('cx', cx);
      hitArea.setAttribute('cy', cy);
      hitArea.setAttribute('r', 12);
      hitArea.addEventListener('mouseenter', (domEvent) => showAverageUpCurveTooltip(domEvent, point));
      hitArea.addEventListener('mousemove', moveTimelineTooltip);
      hitArea.addEventListener('mouseleave', hideTimelineTooltip);
      svg.appendChild(hitArea);
    }
  });

  return svg;
}

function syncAverageUpNavigator(thumb, state) {
  const start = Math.min(state.start, state.end);
  const end = Math.max(state.start, state.end);
  thumb.style.left = `${start * 100}%`;
  thumb.style.width = `${Math.max(0, end - start) * 100}%`;
}

function normalizeAverageUpRange(state) {
  if (state.start <= AVERAGE_UP_RANGE_EPSILON) state.start = 0;
  if (1 - state.end <= AVERAGE_UP_RANGE_EPSILON) state.end = 1;
}

function clampAverageUpRange(state, minRange, maxRange) {
  const range = Math.min(maxRange, Math.max(minRange, state.end - state.start));
  const center = (state.start + state.end) / 2;
  state.start = Math.min(1 - range, Math.max(0, center - range / 2));
  state.end = state.start + range;
  normalizeAverageUpRange(state);
}

function applyAverageUpRange(viewport, thumb, state, minRange, maxRange, renderMainChart) {
  clampAverageUpRange(state, minRange, maxRange);
  renderMainChart();
  syncAverageUpNavigator(thumb, state);
}

function createAverageUpCurveTrack(series) {
  const track = document.createElement('div');
  track.className = 'average-up-curve-track';

  const header = document.createElement('div');
  header.className = 'average-up-curve-track-header';

  const title = document.createElement('div');
  title.className = 'average-up-curve-track-title';
  title.textContent = series.label;

  let statsNode = createAverageUpCurveStats(series.points);
  header.append(title, statsNode);

  const viewport = document.createElement('div');
  viewport.className = 'average-up-curve-viewport';

  const navigator = document.createElement('div');
  navigator.className = 'average-up-curve-navigator';

  const renderNavigatorChart = () => {
    const existingThumb = navigator.querySelector('.average-up-curve-navigator-thumb');
    navigator.replaceChildren(createAverageUpCurveSvg(series, {
      mini: true,
      chartWidth: navigator.clientWidth || 860,
    }));
    if (existingThumb) navigator.appendChild(existingThumb);
  };

  const thumb = document.createElement('div');
  thumb.className = 'average-up-curve-navigator-thumb';

  const leftHandle = document.createElement('span');
  leftHandle.className = 'average-up-curve-navigator-handle average-up-curve-navigator-handle-left';

  const rightHandle = document.createElement('span');
  rightHandle.className = 'average-up-curve-navigator-handle average-up-curve-navigator-handle-right';

  thumb.append(leftHandle, rightHandle);
  navigator.appendChild(thumb);

  const maxRange = 1;
  const getMinRange = () => Math.min(
    maxRange,
    getAverageUpMinimumNavigatorRange(
      series.points,
      navigator.clientWidth || 860,
      navigator.clientHeight || 52,
    ),
  );
  const state = {
    start: 0,
    end: 1,
  };

  const resetAverageUpInitialRange = () => {
    if (series.points.length <= AVERAGE_UP_DEFAULT_VISIBLE_POINTS) {
      state.start = 0;
      state.end = 1;
      return;
    }

    const firstVisibleDataRatio = (series.points.length - AVERAGE_UP_DEFAULT_VISIBLE_POINTS)
      / Math.max(1, series.points.length - 1);
    state.end = 1;
    state.start = getAverageUpNavigatorRatioForDataRatio(
      firstVisibleDataRatio,
      navigator.clientWidth || 860,
      navigator.clientHeight || 52,
    );
    const minRange = getMinRange();
    if (state.end - state.start < minRange) {
      state.start = Math.max(0, state.end - minRange);
    }
  };

  const renderStats = () => {
    const { renderRange } = getAverageUpNavigatorRanges(
      state.start,
      state.end,
      navigator.clientWidth || 860,
      navigator.clientHeight || 52,
    );
    const visiblePoints = getAverageUpVisiblePoints(series.points, renderRange.start, renderRange.end);
    const nextStatsNode = createAverageUpCurveStats(visiblePoints.length ? visiblePoints : series.points);
    statsNode.replaceWith(nextStatsNode);
    statsNode = nextStatsNode;
  };

  const renderMainChart = () => {
    renderStats();
    viewport.replaceChildren(createAverageUpCurveSvg(series, {
      rangeStart: state.start,
      rangeEnd: state.end,
      chartWidth: viewport.clientWidth || 860,
      navigatorWidth: navigator.clientWidth || 860,
      navigatorHeight: navigator.clientHeight || 52,
    }));
  };

  const resizeObserver = new ResizeObserver(() => {
    if (!document.body.contains(viewport)) {
      resizeObserver.disconnect();
      return;
    }
    clampAverageUpRange(state, getMinRange(), maxRange);
    renderMainChart();
    renderNavigatorChart();
    syncAverageUpNavigator(thumb, state);
  });
  resizeObserver.observe(viewport);
  resizeObserver.observe(navigator);

  const ratioFromClientX = (clientX) => {
    const rect = navigator.getBoundingClientRect();
    if (!rect.width) return 0;
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };

  const moveRangeTo = (centerRatio) => {
    const range = state.end - state.start;
    state.start = Math.min(1 - range, Math.max(0, centerRatio - range / 2));
    state.end = state.start + range;
    applyAverageUpRange(viewport, thumb, state, getMinRange(), maxRange, renderMainChart);
  };

  const resizeRange = (side, ratio) => {
    const minRange = getMinRange();
    if (side === 'left') {
      state.start = Math.min(state.end - minRange, Math.max(state.end - maxRange, Math.max(0, ratio)));
    } else {
      state.end = Math.max(state.start + minRange, Math.min(state.start + maxRange, Math.min(1, ratio)));
    }
    applyAverageUpRange(viewport, thumb, state, minRange, maxRange, renderMainChart);
  };

  const startDrag = (event, mode) => {
    event.preventDefault();
    const dragTarget = event.currentTarget;
    const pointerRatio = ratioFromClientX(event.clientX);
    const grabOffset = mode === 'move'
      ? pointerRatio - (state.start + state.end) / 2
      : 0;
    dragTarget.setPointerCapture(event.pointerId);
    if (mode !== 'move') resizeRange(mode, pointerRatio);

    const onPointerMove = (moveEvent) => {
      if (mode === 'move') {
        moveRangeTo(ratioFromClientX(moveEvent.clientX) - grabOffset);
      } else {
        resizeRange(mode, ratioFromClientX(moveEvent.clientX));
      }
    };
    const stopDrag = (endEvent) => {
      if (dragTarget.hasPointerCapture(endEvent.pointerId)) {
        dragTarget.releasePointerCapture(endEvent.pointerId);
      }
      dragTarget.removeEventListener('pointermove', onPointerMove);
      dragTarget.removeEventListener('pointerup', stopDrag);
      dragTarget.removeEventListener('pointercancel', stopDrag);
    };

    dragTarget.addEventListener('pointermove', onPointerMove);
    dragTarget.addEventListener('pointerup', stopDrag);
    dragTarget.addEventListener('pointercancel', stopDrag);
  };

  leftHandle.addEventListener('pointerdown', (event) => startDrag(event, 'left'));
  rightHandle.addEventListener('pointerdown', (event) => startDrag(event, 'right'));
  thumb.addEventListener('pointerdown', (event) => {
    if (event.target === leftHandle || event.target === rightHandle) return;
    startDrag(event, 'move');
  });
  navigator.addEventListener('pointerdown', (event) => {
    if (event.target === thumb || event.target === leftHandle || event.target === rightHandle) return;
    event.preventDefault();
    moveRangeTo(ratioFromClientX(event.clientX));
  });

  requestAnimationFrame(() => {
    resetAverageUpInitialRange();
    renderNavigatorChart();
    applyAverageUpRange(viewport, thumb, state, getMinRange(), maxRange, renderMainChart);
  });
  track.append(header, viewport, navigator);
  return track;
}

function createAverageUpCurveChart(seriesList) {
  const chart = document.createElement('div');
  chart.className = 'average-up-curve';

  const header = document.createElement('div');
  header.className = 'timeline-track-header';
  header.textContent = '平均 UP 抽数';

  const content = document.createElement('div');
  content.className = 'average-up-curve-content';

  const points = seriesList.flatMap((series) => series.points);
  if (!points.length) {
    const empty = document.createElement('div');
    empty.className = 'card empty-state';
    empty.textContent = '暂无可展示的 UP 记录';
    content.appendChild(empty);
    chart.append(header, content);
    return chart;
  }

  seriesList.forEach((series) => {
    if (!series.points.length) return;
    content.appendChild(createAverageUpCurveTrack(series));
  });

  chart.append(header, content);
  return chart;
}

function stabilizeTimelineRender() {
  const blocks = timelineSection.querySelectorAll('.timeline-version-block');
  if (!blocks.length) return;

  requestAnimationFrame(() => {
    blocks.forEach((block) => {
      void block.getBoundingClientRect();
      block.style.transform = 'translateZ(0)';
    });

    requestAnimationFrame(() => {
      blocks.forEach((block) => {
        block.style.transform = '';
      });
    });
  });
}

function renderTimeline(data) {
  const characterEvents = getUpEvents(data.wishData.limitedCharacter.fiveStarHistory || []);
  const weaponEvents = getUpEvents(data.wishData.limitedWeapon.fiveStarHistory || []);
  const characterGroups = groupUpEventsByVersion(characterEvents);
  const weaponGroups = groupUpEventsByVersion(weaponEvents);
  const maxCost = Math.max(
    0,
    ...characterEvents.map((eventData) => eventData.cost),
    ...weaponEvents.map((eventData) => eventData.cost),
  );

  timelineSection.innerHTML = `
    <div class="section-header">
      <h2>时间轴</h2>
    </div>
  `;

  const shell = document.createElement('div');
  shell.className = 'card timeline-shell';
  shell.append(
    createTimelineTrack('角色池 UP 时间轴', characterGroups, '角色池', maxCost),
    createTimelineTrack('武器池 UP 时间轴', weaponGroups, '武器池', maxCost),
    createAverageUpCurveChart([
      {
        label: '角色池',
        className: 'average-up-curve-character',
        expectedAverage: CHARACTER_AVERAGE_UP_EXPECTED_VALUE,
        points: getAverageUpCurvePoints(data.wishData.limitedCharacter.fiveStarHistory || [], '角色池'),
      },
      {
        label: '武器池',
        className: 'average-up-curve-weapon',
        points: getAverageUpCurvePoints(data.wishData.limitedWeapon.fiveStarHistory || [], '武器池'),
      },
    ]),
  );

  timelineSection.appendChild(shell);
  stabilizeTimelineRender();
}
