// == projectEvolutionRuntime.js | stateAndUiAtoms (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRProjectEvolutionRuntime(root) {
  'use strict';

  var ENTITY_KIND = 'project-evolution';
  var ENTITY_ID = 'main';
  var MODE = 'project-evolution';
  var COMPONENT_BY_CHART = {
    bars: 'babia-bars',
    barsmap: 'babia-barsmap',
    cyls: 'babia-cyls',
    cylsmap: 'babia-cylsmap',
    donut: 'babia-doughnut',
    pie: 'babia-pie',
    bubbles: 'babia-bubbles',
    boats: 'babia-boats'
  };
  // Derived from the map above rather than guessed from the attribute name:
  // `donut` maps to `babia-doughnut`, so stripping the `babia-` prefix and
  // looking the key up missed exactly that one and let a doughnut component
  // ride along onto the movie's chart entity.
  var CHART_COMPONENT_NAMES = Object.keys(COMPONENT_BY_CHART).map(function (chartId) {
    return COMPONENT_BY_CHART[chartId];
  });
  var state = {
    initialized: false,
    availability: 'loading',
    unavailableReason: 'Checking Git history availability...',
    references: null,
    result: null,
    frameIndex: 0,
    playing: false,
    speed: 1,
    frameDurationMs: 5000,
    settleDelayMs: 5000,
    playbackGeneration: 0,
    viewGeneration: 0,
    frameApplyRequestId: 0,
    supersededFrameApplyIds: {},
    timelineMode: 'auto',
    // True while the server is building the movie: shows the progress bar and
    // makes the panel reserve room for it.
    generating: false,
    // True while a confirmed chart/axis change is being applied to the current
    // frame: playback and seeking stay locked until it settles.
    applyingMapping: false,
    // Whether the movie was playing when the user left the mode, so re-entry
    // resumes playback and not just the frame position.
    resumePlayback: false,
    // Seconds left before the movie advances (0 while a frame is still
    // settling): the panel prints it on its status line, the companion on its
    // own countdown line.
    nextFrameSeconds: 0,
    unregisterMappingCompanion: null,
    rangeSide: 'start',
    startSourceId: '',
    endSourceId: '',
    manualSourceIds: [],
    pendingFrameApply: null,
    dataRefreshGeneration: 0,
    appliedFrameIndex: -1,
    appliedResultRevision: 0,
    playbackMappingSnapshot: null,
    timer: null,
    status: '',
    statusLevel: 'info',
    activeChartId: 'boats',
    unregisterPanelView: null,
    unregisterModeOption: null,
    unregisterLifecycle: null,
    disposables: []
  };
  var refs = {};
  // Section heights, top to bottom. Positions are COMPUTED from these (see
  // layoutPanel) instead of being hand-tuned constants: the range row folds
  // away when it is not in use, and every section keeps a real gap, so nothing
  // overlaps and nothing drifts outside the panel margins.
  var PANEL_LAYOUT = {
    left: -2.85,
    right: 2.55,
    // The usable strip is not centred on 0, so full-width rows must be centred
    // here or they hang over the right edge.
    centerX: -0.15,
    contentWidth: 5.4,
    gap: 0.18,
    helpHeight: 0.3,
    infoHeight: 0.3,
    modeHeight: 0.36,
    rangeHeight: 0.36,
    tabsHeight: 0.3,
    referenceRows: 6,
    rowGap: 0.32,
    pagerHeight: 0.3,
    nowShowingHeight: 0.5,
    progressHeight: 0.26,
    actionsHeight: 0.4,
    transportHeight: 0.38,
    speedHeight: 0.32,
    timelineBarHeight: 0.3,
    sparklineHeight: 0.5,
    statusHeight: 0.3,
    bottomPadding: 0.34
  };

  function doc() { return root.document; }
  function client() { return root.CodeXRCollaborationRuntime?.getClient?.(root) || null; }

  function changeToEvolutionAnalysis(context) {
    return root.CodeXRAnalysisModeRuntime?.changeAnalysis?.(MODE, context || {})
      || Promise.resolve(false);
  }

  function config() {
    var script = doc().getElementById?.('codexr-tooling-config-xr-mapping-ui');
    try { return JSON.parse(script.textContent || '{}'); } catch { return {}; }
  }

  function entity(tag, attrs) {
    var element = doc().createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    return element;
  }

  function text(value, position, width, color, align) {
    return entity('a-text', {
      value: value || '',
      position: position || '0 0 0',
      width: width || 5,
      color: color || '#ffffff',
      align: align || 'center',
      baseline: 'center',
      'wrap-count': 42
    });
  }

  function smallText(value, position, width, color, align, wrapCount) {
    return entity('a-text', {
      value: value || '',
      position: position || '0 0 0',
      width: width || 3,
      color: color || '#ffffff',
      align: align || 'left',
      baseline: 'center',
      'wrap-count': wrapCount || 60
    });
  }

  // Buttons come from the shared Git chrome so this panel and the historical
  // comparison look like the same product; only the marker class stays local.
  function button(label, position, width, onClick, color, options) {
    var config = options || {};
    return root.CodeXRGitRefPickerRuntime.buildButton(
      label,
      position,
      width || 1,
      config.height || 0.36,
      color || '#0f3a5f',
      onClick,
      config.textWidth || (width || 1) * 1.55,
      { className: 'codexr-project-evolution-button', wrapCount: config.wrapCount || 22 }
    );
  }

  function modeButton(label, position, onClick, color) {
    return button(label, position, 1.42, onClick, color, { height: 0.36, textWidth: 1.95, wrapCount: 18 });
  }

  function primaryActionButton(label, position, onClick) {
    return button(label, position, 3.15, onClick, '#be123c', { height: 0.4, textWidth: 3.9, wrapCount: 28 });
  }

  function transportButton(label, position, onClick) {
    return button(label, position, 1.32, onClick, label === 'Play' ? '#0e7490' : '#1e3a5f', {
      height: 0.38,
      textWidth: 1.75,
      wrapCount: 14
    });
  }

  // `width` narrows the same atom for the controller companion's column
  // (the panel keeps the default), so both places speak one vocabulary.
  function speedButton(label, position, speed, width) {
    var buttonWidth = Number(width) || 1.02;
    return button(label, position, buttonWidth, function () { setSpeed(speed); }, '#334155', {
      height: 0.32,
      textWidth: buttonWidth * 1.32,
      wrapCount: 10
    });
  }

  function setStatus(message, level) {
    state.status = String(message || '');
    state.statusLevel = level || 'info';
    refs.status?.setAttribute('value', state.status);
    refs.status?.setAttribute('color', level === 'error' ? '#fecaca' : '#fde68a');
  }

// == projectEvolutionRuntime.js | timelineAndSources (assembled per manifest.json; see COMPONENTS.md) ==
  function unwrapPayload(message) {
    return message && typeof message === 'object' && Object.prototype.hasOwnProperty.call(message, 'payload')
      ? message.payload
      : message;
  }

  function setTimelineMode(mode) {
    var nextMode = mode === 'range' || mode === 'manual' ? mode : 'auto';
    if (state.timelineMode !== nextMode) {
      state.startSourceId = '';
      state.endSourceId = '';
      state.manualSourceIds = [];
      state.rangeSide = 'start';
    }
    state.timelineMode = nextMode;
    render();
  }

  function setRangeSide(side) {
    state.rangeSide = side === 'end' ? 'end' : 'start';
    render();
  }

  function compact(value, limit) {
    var textValue = String(value || '');
    return textValue.length > limit ? textValue.slice(0, Math.max(1, limit - 3)) + '...' : textValue;
  }

  // The shared git-ref-picker runtime owns source descriptions, but it is
  // presentation chrome: if it is missing, playback must keep running on the
  // raw source fields instead of dying inside play() with `playing` stuck on.
  function describeSourceSafe(source) {
    var picker = root.CodeXRGitRefPickerRuntime;
    if (picker?.describeSource) {
      return picker.describeSource(source);
    }
    var description = String(source?.description || '');
    var dateMatch = description.match(/^(\d{4}-\d{2}-\d{2})/);
    return {
      label: String(source?.label || source?.id || 'unknown'),
      date: String(source?.date || (dateMatch ? dateMatch[1] : '')),
      subject: '',
      typeLabel: String(source?.revisionType || source?.refType || '')
    };
  }

  function sourceDescription(source) {
    if (!source) { return 'Not selected'; }
    var described = describeSourceSafe(source);
    var subject = described.subject ? ' - ' + described.subject : '';
    return compact(described.label + subject, 56);
  }

  function getSuggestedAutoOrderById() {
    var order = {};
    // References stay null until the server answers; stop() renders during
    // deactivate, so this must not assume the mode was ever opened.
    var references = state.references || {};
    var ids = Array.isArray(references.suggestedSourceIds)
      ? references.suggestedSourceIds
      : [];
    ids.forEach(function (id, index) {
      if (id && order[id] === undefined) {
        order[id] = index + 1;
      }
    });
    return order;
  }

  // Now-showing / playback-overlay text reuses the shared vocabulary.
  function splitSourceDescription(source) {
    var described = describeSourceSafe(source);
    return {
      label: compact(described.label, 16),
      date: described.date,
      subject: compact(described.subject, 42),
      type: described.typeLabel
    };
  }

  // ── Playback chrome: timeline bar, generation progress, evolution sparkline ──
  // All three are pooled: nodes are created once here and later updated by
  // attribute only (the controller panel watches childList mutations).

  var TIMELINE_MAX_TICKS = 40;
  var TIMELINE_WIDTH = 5.4;

  // `store` keeps this instance's ticks/cursor, so the panel and the controller
  // companion can each own a bar without sharing nodes. `width` sizes THIS
  // instance: the shared constant overflowed the narrower companion column.
  function buildTimelineBar(store, width) {
    store.width = Number(width) || TIMELINE_WIDTH;
    var barRoot = entity('a-entity', { position: '0 0 0.02' });
    barRoot.appendChild(entity('a-plane', {
      position: '0 0 -0.005',
      width: store.width,
      height: 0.07,
      material: 'color: #1e293b; opacity: 0.9; shader: flat'
    }));
    // Clickable strip: seek to the frame under the pointer.
    var strip = entity('a-plane', {
      position: '0 0 0',
      width: store.width,
      height: 0.26,
      material: 'color: #000000; opacity: 0.001; transparent: true; shader: flat',
      class: 'babiaxraycasterclass codexr-project-evolution-button',
      'data-codexr-interactive': 'true'
    });
    strip.addEventListener('click', function (event) {
      var frames = state.result?.frames || [];
      // Seeking is locked while a chart/mapping change is being applied.
      if (!frames.length || state.applyingMapping) { return; }
      var localX = resolveLocalX(event, strip);
      var ratio = Math.min(1, Math.max(0, (localX + (store.width / 2)) / store.width));
      stop();
      seek(Math.round(ratio * (frames.length - 1)));
    });
    barRoot.appendChild(strip);
    store.ticks = [];
    for (var tickIndex = 0; tickIndex < TIMELINE_MAX_TICKS; tickIndex += 1) {
      var tick = entity('a-plane', {
        position: '0 0 0.001',
        width: 0.03,
        height: 0.16,
        material: 'color: #475569; opacity: 0.9; shader: flat',
        visible: 'false'
      });
      barRoot.appendChild(tick);
      store.ticks.push(tick);
    }
    store.cursor = entity('a-plane', {
      position: '0 0 0.003',
      width: 0.07,
      height: 0.28,
      material: 'color: #fde68a; opacity: 0.98; shader: flat',
      visible: 'false'
    });
    barRoot.appendChild(store.cursor);
    store.root = barRoot;
    return barRoot;
  }

  // Pointer x in the strip's own frame, so a click maps to a frame index.
  function resolveLocalX(event, strip) {
    var point = event?.detail?.intersection?.point;
    if (!point || !strip.object3D) { return 0; }
    var local = point.clone ? point.clone() : null;
    if (!local || !strip.object3D.worldToLocal) { return 0; }
    return strip.object3D.worldToLocal(local).x;
  }

  function renderTimelineBar(store) {
    if (!store?.root) { return; }
    var frames = state.result?.frames || [];
    var count = frames.length;
    var barWidth = store.width || TIMELINE_WIDTH;
    setNodeVisible(store.root, count > 0);
    if (!count) { return; }
    var shown = Math.min(count, TIMELINE_MAX_TICKS);
    store.ticks.forEach(function (tick, index) {
      var active = index < shown;
      setNodeVisible(tick, active);
      if (!active) { return; }
      var ratio = shown === 1 ? 0.5 : index / (shown - 1);
      tick.setAttribute('position', ((ratio - 0.5) * barWidth) + ' 0 0.001');
    });
    var cursorRatio = count === 1 ? 0.5 : state.frameIndex / (count - 1);
    store.cursor.setAttribute('position', ((cursorRatio - 0.5) * barWidth) + ' 0 0.003');
    setNodeVisible(store.cursor, true);
  }

  function buildProgressBar() {
    var progressRoot = entity('a-entity', { position: '0 0 0.02', visible: 'false' });
    progressRoot.appendChild(entity('a-plane', {
      position: '0 0 -0.005',
      width: TIMELINE_WIDTH,
      height: 0.14,
      material: 'color: #0b1220; opacity: 0.9; shader: flat'
    }));
    refs.progressFill = entity('a-plane', {
      position: (-TIMELINE_WIDTH / 2) + ' 0 0',
      width: 0.01,
      height: 0.14,
      material: 'color: #0e7490; opacity: 0.95; shader: flat'
    });
    progressRoot.appendChild(refs.progressFill);
    refs.progressLabel = smallText('', '0 0 0.01', 3.4, '#e0f2fe', 'center', 34);
    progressRoot.appendChild(refs.progressLabel);
    return progressRoot;
  }

  // Driven by project-evolution-progress, which already carries frameIndex and
  // frameCount — generating a movie takes a while and used to show only text.
  function renderGenerationProgress(payload) {
    if (!refs.progressRoot) { return; }
    var count = Number(payload?.frameCount) || 0;
    var index = Number(payload?.frameIndex) || 0;
    var analyzing = payload?.state === 'analyzing' && count > 0;
    setNodeVisible(refs.progressRoot, analyzing);
    if (!analyzing) { return; }
    var ratio = Math.min(1, Math.max(0, index / count));
    var width = Math.max(0.01, ratio * TIMELINE_WIDTH);
    refs.progressFill.setAttribute('width', width);
    // Grows from the left edge.
    refs.progressFill.setAttribute('position', ((width / 2) - (TIMELINE_WIDTH / 2)) + ' 0 0');
    refs.progressLabel.setAttribute('value', 'Generating frame ' + Math.min(index + 1, count) + ' / ' + count);
  }

  function buildSparkline() {
    var sparkRoot = entity('a-entity', { position: '0 0 0.02', visible: 'false' });
    // Relative to the sparkline root, which layoutPanel centres on the strip.
    sparkRoot.appendChild(smallText('Files per frame', (-TIMELINE_WIDTH / 2) + ' 0.2 0.01', 2.4, '#94a3b8', 'left', 26));
    refs.sparkBars = [];
    for (var barIndex = 0; barIndex < TIMELINE_MAX_TICKS; barIndex += 1) {
      var bar = entity('a-plane', {
        position: '0 0 0.001',
        width: 0.08,
        height: 0.02,
        material: 'color: #38bdf8; opacity: 0.85; shader: flat',
        visible: 'false'
      });
      sparkRoot.appendChild(bar);
      refs.sparkBars.push(bar);
    }
    return sparkRoot;
  }

  // itemCount already travels with every frame, so the trend costs no extra
  // request: each bar is one frame, the current one highlighted.
  function renderSparkline() {
    if (!refs.sparkline) { return; }
    var frames = state.result?.frames || [];
    var shown = Math.min(frames.length, TIMELINE_MAX_TICKS);
    setNodeVisible(refs.sparkline, shown > 1);
    if (shown <= 1) { return; }
    var counts = frames.slice(0, shown).map(function (frame) { return Number(frame?.itemCount) || 0; });
    var peak = Math.max.apply(null, counts.concat([1]));
    var maxHeight = 0.32;
    refs.sparkBars.forEach(function (bar, index) {
      var active = index < shown;
      setNodeVisible(bar, active);
      if (!active) { return; }
      var height = Math.max(0.02, (counts[index] / peak) * maxHeight);
      var ratio = shown === 1 ? 0.5 : index / (shown - 1);
      bar.setAttribute('height', height);
      bar.setAttribute('position', ((ratio - 0.5) * TIMELINE_WIDTH) + ' ' + (-0.12 + (height / 2)) + ' 0.001');
      bar.setAttribute(
        'material',
        'color: ' + (index === state.frameIndex ? '#fde68a' : '#38bdf8') + '; opacity: 0.9; shader: flat'
      );
    });
  }

  // ── Controller companion ────────────────────────────────────────────────
  // Child section of the Field Mapping view (same side placement Historical
  // uses): with the chart/axis controls on the left, this keeps the movie and
  // its transport on the right, so the chart can be re-mapped between frames.

  var COMPANION_WIDTH = 3.1;

  // Companion → timeline selection panel (mirror of Historical's "Change
  // comparison"). The explicit view wins over the lifecycle resolver, so this
  // reaches the selection panel even while a movie exists.
  function showMovieSelectionView() {
    root.CodeXRAnalysisControllerRuntime?.showView?.('project-evolution.playback', {
      mode: MODE,
      reason: 'project-evolution-change-movie',
      mappingContextId: MODE
    }) || root.CodeXRMappingUiRuntime?.showPanelView?.(MODE);
  }

  // Selection panel → Field Mapping view without regenerating (mirror of
  // Historical's closePanel). Only meaningful once a movie exists.
  function showMovieMappingView() {
    root.CodeXRAnalysisControllerRuntime?.showView?.('project-evolution.mapping', {
      mode: MODE,
      reason: 'project-evolution-open-mapping',
      mappingContextId: MODE
    }) || root.CodeXRMappingUiRuntime?.showPanelView?.('mapping');
  }

  // Companion column geometry: the mapping-ui reserves COMPANION_WIDTH; the
  // framing card (same chrome as the historical COMPARISON card) sits inside,
  // and every child stays within its ±1.4 content strip.
  var COMPANION_CARD_W = 2.98;
  var COMPANION_BAR_W = 2.6;
  var COMPANION_SPEED_W = 0.86;

  function buildMovieCompanion(mappingRuntime) {
    if (refs.companionRoot || !mappingRuntime?.registerMappingCompanion) { return; }
    refs.companionRoot = entity('a-entity', {});
    // Framing card (border behind a subtle fill) so the column reads as one
    // cohesive section instead of loose elements floating on the panel.
    refs.companionCardBorder = entity('a-plane', {
      position: '0 0 -0.04', width: COMPANION_CARD_W + 0.06, height: 1,
      material: 'color: #2b3a55; opacity: 0.55; shader: flat'
    });
    refs.companionCard = entity('a-plane', {
      position: '0 0 -0.03', width: COMPANION_CARD_W, height: 1,
      material: 'color: #0e1526; opacity: 0.66; shader: flat'
    });
    refs.companionRoot.appendChild(refs.companionCardBorder);
    refs.companionRoot.appendChild(refs.companionCard);
    // Section title + accent underline, in the movie's amber.
    refs.companionTitle = smallText('PROJECT EVOLUTION', '0 0 0.01', 2.3, '#f59e0b', 'center', 22);
    refs.companionUnderline = entity('a-plane', {
      position: '0 0 -0.005', width: 2.4, height: 0.012,
      material: 'color: #f59e0b; opacity: 0.85; shader: flat'
    });
    refs.companionRoot.appendChild(refs.companionTitle);
    refs.companionRoot.appendChild(refs.companionUnderline);
    refs.companionFrame = smallText('No movie loaded', '0 0 0.01', 2.7, '#e0f2fe', 'center', 26);
    refs.companionRoot.appendChild(refs.companionFrame);
    refs.companionDetail = smallText('', '0 0 0.01', 2.8, '#94a3b8', 'center', 36);
    refs.companionRoot.appendChild(refs.companionDetail);
    refs.companionTimeline = {};
    refs.companionBar = buildTimelineBar(refs.companionTimeline, COMPANION_BAR_W);
    refs.companionRoot.appendChild(refs.companionBar);
    refs.companionTransport = entity('a-entity', { position: '0 0 0.02' });
    refs.companionPrev = button('Prev', '-1.0 0 0', 0.9, previousFrame, '#1e3a5f', { height: 0.34, textWidth: 1.2, wrapCount: 12 });
    refs.companionPlay = button('Play', '0 0 0', 0.9, togglePlay, '#0e7490', { height: 0.34, textWidth: 1.2, wrapCount: 12 });
    refs.companionNext = button('Next', '1.0 0 0', 0.9, nextFrame, '#1e3a5f', { height: 0.34, textWidth: 1.2, wrapCount: 12 });
    refs.companionTransport.appendChild(refs.companionPrev);
    refs.companionTransport.appendChild(refs.companionPlay);
    refs.companionTransport.appendChild(refs.companionNext);
    refs.companionRoot.appendChild(refs.companionTransport);
    // Speed shortcuts: same labels and atom as the panel, narrowed to the
    // column (extremes at ±1.33, inside the card's ±1.4 content strip).
    refs.companionSpeedRoot = entity('a-entity', { position: '0 0 0.02' });
    refs.companionSpeedRoot.appendChild(speedButton('0.5x', '-0.9 0 0', 0.5, COMPANION_SPEED_W));
    refs.companionSpeedRoot.appendChild(speedButton('1x', '0 0 0', 1, COMPANION_SPEED_W));
    refs.companionSpeedRoot.appendChild(speedButton('2x', '0.9 0 0', 2, COMPANION_SPEED_W));
    refs.companionRoot.appendChild(refs.companionSpeedRoot);
    refs.companionCountdown = smallText('', '0 0 0.01', 2.7, '#67e8f9', 'center', 30);
    refs.companionRoot.appendChild(refs.companionCountdown);
    refs.companionHint = smallText('', '0 0 0.01', 2.7, '#fde68a', 'center', 34);
    refs.companionRoot.appendChild(refs.companionHint);
    refs.companionBack = button('Change movie', '0 0 0', 2.2, showMovieSelectionView, '#be123c', { height: 0.38, textWidth: 2.8, wrapCount: 18 });
    refs.companionRoot.appendChild(refs.companionBack);

    state.unregisterMappingCompanion = mappingRuntime.registerMappingCompanion(MODE, {
      content: refs.companionRoot,
      placement: 'side',
      width: COMPANION_WIDTH,
      title: 'Field Mapping - Project evolution',
      layout: layoutMovieCompanion
    }) || null;
    layoutMovieCompanion(6.45);
    renderMovieCompanion();
  }

  // Fills the column like the historical card: the frame stretches to the
  // available height, the info group hangs from the top, Change movie is
  // pinned to the bottom edge, and the playback group centres in between.
  function layoutMovieCompanion(availableHeight) {
    if (!refs.companionRoot) { return; }
    var height = Number(availableHeight) || 6.45;
    var cardTop = 0.12;
    var cardBottom = -(height - 0.18);
    var cardHeight = Math.max(0.6, cardTop - cardBottom);
    var cardCentre = (cardTop + cardBottom) / 2;
    refs.companionCard?.setAttribute?.('height', cardHeight);
    refs.companionCard?.setAttribute?.('position', '0 ' + cardCentre + ' -0.03');
    refs.companionCardBorder?.setAttribute?.('height', cardHeight + 0.06);
    refs.companionCardBorder?.setAttribute?.('position', '0 ' + cardCentre + ' -0.04');

    // Top group: title + underline + frame counter + commit detail.
    var titleY = cardTop - 0.28;
    refs.companionTitle?.setAttribute?.('position', '0 ' + titleY + ' 0.01');
    refs.companionUnderline?.setAttribute?.('position', '0 ' + (titleY - 0.17) + ' -0.005');
    var frameY = titleY - 0.55;
    refs.companionFrame?.setAttribute?.('position', '0 ' + frameY + ' 0.01');
    var detailY = frameY - 0.3;
    refs.companionDetail?.setAttribute?.('position', '0 ' + detailY + ' 0.01');
    var topGroupBottom = detailY - 0.26;

    // Bottom group: the action pinned near the card's lower edge.
    var buttonY = cardBottom + 0.34;
    refs.companionBack?.setAttribute?.('position', '0 ' + buttonY + ' 0.02');
    var bottomGroupTop = buttonY + 0.34;

    // Middle group: timeline bar, transport, speed shortcuts, the countdown
    // to the next frame and the lock hint, spread around the centre of
    // whatever space is free between the two anchored groups.
    var midCentre = (topGroupBottom + bottomGroupTop) / 2;
    refs.companionBar?.setAttribute?.('position', '0 ' + (midCentre + 1.04) + ' 0.02');
    refs.companionTransport?.setAttribute?.('position', '0 ' + (midCentre + 0.52) + ' 0.02');
    refs.companionSpeedRoot?.setAttribute?.('position', '0 ' + midCentre + ' 0.02');
    refs.companionCountdown?.setAttribute?.('position', '0 ' + (midCentre - 0.52) + ' 0.01');
    refs.companionHint?.setAttribute?.('position', '0 ' + (midCentre - 1.04) + ' 0.01');
    // Visibility is NOT touched here: the mapping-ui's syncMappingCompanion is
    // the only owner. Forcing it visible from the layout leaked this section
    // into every other analysis' mapping view.
    return height;
  }

  // Mirrors the panel: current frame, timeline cursor, Play/Pause label, and
  // why a control is currently locked.
  function renderMovieCompanion() {
    if (!refs.companionRoot) { return; }
    var frames = state.result?.frames || [];
    var frame = frames[state.frameIndex];
    var parts = frames.length ? splitSourceDescription(frame?.source || frame) : null;
    refs.companionFrame?.setAttribute('value', frames.length
      ? 'Frame ' + (state.frameIndex + 1) + ' / ' + frames.length
      : 'No movie loaded');
    refs.companionDetail?.setAttribute('value', parts
      ? compact(parts.date + ' | ' + parts.label + (parts.subject ? ' - ' + parts.subject : ''), 44)
      : '');
    renderTimelineBar(refs.companionTimeline);
    setButtonText(refs.companionPlay, state.playing ? 'Pause' : 'Play');
    paintSpeedRow(refs.companionSpeedRoot);
    refs.companionCountdown?.setAttribute('value', playbackCountdownText());
    refs.companionHint?.setAttribute('value', movieLockHint());
  }

  // How long until the movie advances. Empty while stopped: the line only
  // speaks when there is a wait to report.
  function playbackCountdownText() {
    if (!state.playing) { return ''; }
    if (state.frameIndex >= ((state.result?.frames || []).length - 1)) { return 'Last frame'; }
    return state.nextFrameSeconds > 0
      ? 'Next frame in ' + state.nextFrameSeconds + 's'
      : 'Preparing next frame...';
  }

  // Highlights the speed the movie is actually running at. Shared by the
  // panel row and the companion row so both always agree.
  function paintSpeedRow(rootEntity) {
    if (!rootEntity) { return; }
    [0.5, 1, 2].forEach(function (speed, index) {
      paintButton(rootEntity, index, state.speed === speed ? '#0e7490' : '#334155');
    });
  }

  // One sentence explaining the current safety lock, or empty when free.
  function movieLockHint() {
    if (state.applyingMapping) { return 'Applying chart change...'; }
    if (state.playing) { return 'Pause to change chart or axes.'; }
    if (!(state.result?.frames || []).length) { return 'Generate a movie to play it here.'; }
    return 'Paused: chart and axes can be changed.';
  }

  function setButtonText(buttonEl, value) {
    var label = buttonEl && (buttonEl._codexrLabel || buttonEl.querySelector?.('a-text'));
    label?.setAttribute?.('value', value);
  }

  function buildNowShowingCard() {
    var card = entity('a-plane', {
      // Positioned by layoutPanel.
      position: '0 0 0.02',
      width: PANEL_LAYOUT.contentWidth,
      height: 0.46,
      material: 'color: #111827; opacity: 0.76; shader: flat'
    });
    refs.frameTitle = smallText('Now showing', '-2.58 0.12 0.02', 2.2, '#67e8f9', 'left', 18);
    refs.frameDetail = smallText('No movie loaded', '-2.58 -0.08 0.02', 5.05, '#e0f2fe', 'left', 62);
    card.appendChild(refs.frameTitle);
    card.appendChild(refs.frameDetail);
    return card;
  }

  function findSource(sourceId) {
    var sources = Array.isArray(state.references?.sources) ? state.references.sources : [];
    return sources.find(function (source) { return source.id === sourceId; }) || null;
  }

  function sceneEl() {
    return doc().querySelector?.('a-scene') || doc().body || null;
  }

// == projectEvolutionRuntime.js | overlayAndPanel (assembled per manifest.json; see COMPONENTS.md) ==
  function ensurePlaybackOverlay() {
    if (refs.playbackOverlay && refs.playbackOverlay?.isConnected !== false) {
      return refs.playbackOverlay;
    }
    var overlay = entity('a-entity', {
      id: 'codexr-project-evolution-playback-overlay',
      position: '0 3.35 -18',
      visible: 'false',
      'data-codexr-role': 'project-evolution playback-overlay'
    });
    overlay.appendChild(entity('a-plane', {
      width: 6.2,
      height: 0.72,
      material: 'color: #111827; opacity: 0.78; transparent: true; shader: flat'
    }));
    refs.overlayTitle = text('', '0 0.17 0.02', 5.8, '#fde68a');
    refs.overlayDetail = smallText('', '-2.7 -0.15 0.02', 5.4, '#e0f2fe', 'left', 52);
    overlay.appendChild(refs.overlayTitle);
    overlay.appendChild(refs.overlayDetail);
    sceneEl().appendChild?.(overlay);
    refs.playbackOverlay = overlay;
    return overlay;
  }

  function updatePlaybackOverlay(frame, frameCount, visible) {
    var overlay = ensurePlaybackOverlay();
    overlay.setAttribute?.('visible', visible && frameCount ? 'true' : 'false');
    if (!visible || !frameCount || !frame) { return; }
    var parts = splitSourceDescription(frame.source || frame);
    refs.overlayTitle?.setAttribute('value', 'Project evolution  ' + (state.frameIndex + 1) + ' / ' + frameCount + '  |  ' + parts.date);
    refs.overlayDetail?.setAttribute('value', compact(parts.label + (parts.subject ? ' - ' + parts.subject : ''), 86));
  }

  function hidePlaybackOverlay() {
    refs.playbackOverlay?.setAttribute('visible', 'false');
  }

  var EVOLUTION_UNAVAILABLE_REASON = 'Project evolution requires a local Git repository.';

  async function configureAvailability() {
    var picker = root.CodeXRGitRefPickerRuntime;
    var capabilities = picker?.resolveCapabilities ? await picker.resolveCapabilities() : {};
    var enabled = capabilities.projectEvolution === true;
    state.availability = enabled ? 'enabled' : 'disabled';
    state.unavailableReason = enabled
      ? ''
      : String(capabilities.projectEvolutionReason || EVOLUTION_UNAVAILABLE_REASON);
    registerModeOption();
  }

  // Delegates to the shared Git-gated mode registration (see historical).
  function registerModeOption() {
    state.unregisterModeOption?.();
    state.unregisterModeOption = root.CodeXRGitRefPickerRuntime?.registerGitGatedMode?.({
      modeId: MODE,
      label: 'Project evolution',
      color: '#f59e0b',
      capabilityKey: 'projectEvolution',
      enabled: state.availability === 'enabled',
      reasonFallback: state.unavailableReason || EVOLUTION_UNAVAILABLE_REASON,
      onSelect: selectMode
    }) || null;
  }

  function buildPanel() {
    if (refs.panel || !root.CodeXRMappingUiRuntime?.registerPanelView || !root.CodeXRGitRefPickerRuntime?.createPicker) {
      return !!refs.panel;
    }
    if (!root.CodeXRMappingUiRuntime.isPanelReady?.()) {
      // Event-driven: register as soon as the controller panel exists.
      if (!refs.panelMountQueued) {
        refs.panelMountQueued = true;
        root.CodeXRMappingUiRuntime.whenPanelReady?.(function () {
          refs.panelMountQueued = false;
          buildPanel();
        });
      }
      return false;
    }
    refs.panel = entity('a-entity', { position: '0 0 0.04' });
    // No title here: the controller's own header already names the view. It was
    // printed twice.
    refs.help = text('Replay the project through local Git commits.', '0 0 0.02', 5.8, '#cbd5e1');
    refs.panel.appendChild(refs.help);
    refs.info = text('Automatic timeline: oldest commits to newest commits.', '0 0 0.02', 5.8, '#ffffff');
    refs.panel.appendChild(refs.info);
    refs.modeRoot = entity('a-entity', { position: '0 0 0.02' });
    refs.modeRoot.appendChild(modeButton('Auto', '-1.75 0 0', function () { setTimelineMode('auto'); }, '#0e7490'));
    refs.modeRoot.appendChild(modeButton('Range', '0 0 0', function () { setTimelineMode('range'); }, '#334155'));
    refs.modeRoot.appendChild(modeButton('Manual', '1.75 0 0', function () { setTimelineMode('manual'); }, '#334155'));
    refs.panel.appendChild(refs.modeRoot);
    refs.rangeRoot = entity('a-entity', { position: '0 0 0.02' });
    refs.rangeRoot.appendChild(button('Pick start', '-1.05 0 0', 1.65, function () { setRangeSide('start'); }, '#15803d', { textWidth: 2.1, wrapCount: 18 }));
    refs.rangeRoot.appendChild(button('Pick end', '1.05 0 0', 1.65, function () { setRangeSide('end'); }, '#b91c1c', { textWidth: 2.1, wrapCount: 18 }));
    refs.panel.appendChild(refs.rangeRoot);
    // Ordered multi-select source list is the shared Git picker in 'sequence'
    // mode, now with the same category tabs and time-order toggle the
    // comparison uses — hundreds of commits are unusable without them.
    refs.picker = root.CodeXRGitRefPickerRuntime.createPicker({
      mode: 'sequence',
      tabs: true,
      sortToggle: true,
      pageSize: PANEL_LAYOUT.referenceRows,
      rowGap: PANEL_LAYOUT.rowGap,
      // Laid out relative to the picker root, which layoutPanel positions as a
      // single block: tabs on top, then the rows, then the pager.
      tabsY: -(PANEL_LAYOUT.tabsHeight / 2),
      listY: -(PANEL_LAYOUT.tabsHeight + PANEL_LAYOUT.gap),
      listTopY: 0,
      pagerY: -(pickerBlockHeight() - (PANEL_LAYOUT.pagerHeight / 2)),
      rowClass: 'codexr-project-evolution-button',
      resolveRowState: resolveRowStateForSource,
      onRowClick: function (source) { selectSourceForTimeline(source); }
    });
    refs.panel.appendChild(refs.picker.el);
    refs.frame = buildNowShowingCard();
    refs.panel.appendChild(refs.frame);
    refs.progressRoot = buildProgressBar();
    refs.panel.appendChild(refs.progressRoot);
    refs.generateButton = primaryActionButton('Generate movie', '0 0 0.02', startSelectedTimeline);
    refs.panel.appendChild(refs.generateButton);
    refs.clearButton = button('Clear movie', '0 0 0.02', 1.5, clearMovie, '#7f1d1d', {
      height: 0.4,
      textWidth: 1.9,
      wrapCount: 14
    });
    refs.panel.appendChild(refs.clearButton);
    // Back to the Field Mapping view without regenerating (mirror of
    // Historical's closePanel); its row folds away until a movie exists.
    refs.mappingButton = button('Field mapping', '0 0 0.02', 3.15, showMovieMappingView, '#0e7490', {
      height: 0.4,
      textWidth: 3.9,
      wrapCount: 28
    });
    refs.panel.appendChild(refs.mappingButton);
    refs.transportRoot = entity('a-entity', { position: '0 0 0.02' });
    refs.transportRoot.appendChild(transportButton('Prev', '-1.65 0 0', previousFrame));
    refs.playButton = transportButton('Play', '0 0 0', togglePlay);
    refs.transportRoot.appendChild(refs.playButton);
    refs.transportRoot.appendChild(transportButton('Next', '1.65 0 0', nextFrame));
    refs.panel.appendChild(refs.transportRoot);
    refs.speedRoot = entity('a-entity', { position: '0 0 0.02' });
    refs.speedRoot.appendChild(speedButton('0.5x', '-1.35 0 0', 0.5));
    refs.speedRoot.appendChild(speedButton('1x', '0 0 0', 1));
    refs.speedRoot.appendChild(speedButton('2x', '1.35 0 0', 2));
    refs.panel.appendChild(refs.speedRoot);
    refs.timeline = {};
    refs.timelineBar = buildTimelineBar(refs.timeline);
    refs.panel.appendChild(refs.timelineBar);
    refs.sparkline = buildSparkline();
    refs.panel.appendChild(refs.sparkline);
    refs.status = smallText('', PANEL_LAYOUT.left + ' 0 0.02', 5.7, '#fde68a', 'left', 54);
    refs.panel.appendChild(refs.status);
    state.unregisterPanelView = root.CodeXRMappingUiRuntime?.registerPanelView({
      id: MODE,
      title: 'Project evolution',
      buttonLabel: 'E',
      headerButton: false,
      panelHeight: layoutPanel(),
      content: refs.panel,
      onShow: handlePanelShown
    });
    // Child section of the Field Mapping view: chart/axis controls on the left,
    // the movie and its transport on the right (same pattern as Historical).
    buildMovieCompanion(root.CodeXRMappingUiRuntime);
    return true;
  }

  // Places every section from PANEL_LAYOUT, top to bottom, and returns the
  // panel height it needs. The range row only takes space in Range mode, so the
  // rest of the panel moves up instead of leaving a hole.
  function layoutPanel() {
    var L = PANEL_LAYOUT;
    var hasMovie = !!(state.result?.frames || []).length;
    var generating = !!state.generating;
    // Sections in order. `show: false` folds one away completely — it neither
    // takes space nor leaves a hole (the range row outside Range mode, the
    // playback chrome before a movie exists).
    var sections = [
      { node: refs.help, height: L.helpHeight, show: true },
      { node: refs.info, height: L.infoHeight, show: true },
      { node: refs.modeRoot, height: L.modeHeight, show: true },
      { node: refs.rangeRoot, height: L.rangeHeight, show: state.timelineMode === 'range' },
      { node: refs.picker?.el, height: pickerBlockHeight(), show: true, anchorTop: true },
      { node: refs.frame, height: L.nowShowingHeight, show: true },
      { node: refs.progressRoot, height: L.progressHeight, show: generating },
      { node: null, height: L.actionsHeight, show: true, actions: true },
      { node: refs.mappingButton, height: L.actionsHeight, show: hasMovie },
      { node: refs.transportRoot, height: L.transportHeight, show: true },
      { node: refs.speedRoot, height: L.speedHeight, show: true },
      { node: refs.timelineBar, height: L.timelineBarHeight, show: hasMovie },
      { node: refs.sparkline, height: L.sparklineHeight, show: hasMovie },
      { node: refs.status, height: L.statusHeight, show: true, alignLeft: true }
    ];
    var visible = sections.filter(function (section) { return section.show; });
    var contentHeight = visible.reduce(function (total, section) {
      return total + section.height;
    }, 0) + (Math.max(0, visible.length - 1) * L.gap);

    // Content is centred on the panel, which is drawn around y = 0.
    var y = contentHeight / 2;
    sections.forEach(function (section) {
      if (!section.actions) { setNodeVisible(section.node, section.show); }
      if (!section.show) { return; }
      if (section.anchorTop) {
        // The picker positions its own internals downward from its root.
        section.node?.setAttribute?.('position', L.centerX + ' ' + y + ' 0.02');
        y -= section.height + L.gap;
        return;
      }
      y -= section.height / 2;
      if (section.actions) {
        // Generate + Clear share a row, both inside the panel margins.
        refs.generateButton?.setAttribute?.('position', (L.centerX - 0.85) + ' ' + y + ' 0.02');
        refs.clearButton?.setAttribute?.('position', (L.centerX + 1.55) + ' ' + y + ' 0.02');
      } else {
        // Left-aligned text (the status line) hangs from the left margin.
        section.node?.setAttribute?.('position', (section.alignLeft ? L.left : L.centerX) + ' ' + y + ' 0.02');
      }
      y -= (section.height / 2) + L.gap;
    });
    return Math.max(2.45, contentHeight + L.bottomPadding);
  }

  function pickerBlockHeight() {
    var L = PANEL_LAYOUT;
    return L.tabsHeight + L.gap + (L.referenceRows * L.rowGap) + L.gap + L.pagerHeight;
  }

  function setNodeVisible(node, visible) {
    if (!node) { return; }
    if (node.object3D) { node.object3D.visible = !!visible; }
    node.setAttribute?.('visible', visible ? 'true' : 'false');
  }

  function handlePanelShown() {
    render();
    if (isEvolutionModeActiveOrActivating()) {
      return;
    }
    root.CodeXRAnalysisModeRuntime?.setSelectionPanel?.(MODE);
    client()?.sendMessage?.('analysis-mode-activate', { mode: MODE });
    void changeToEvolutionAnalysis({
      reason: 'project-evolution-panel-shown',
      controllerView: 'project-evolution',
      panelViewId: MODE
    });
  }

// == projectEvolutionRuntime.js | offlineGitData (assembled per manifest.json; see COMPONENTS.md) ==
  // Real offline movie generation for self-contained exports.
  //
  // When the export shipped per-revision payloads (manifest.gitData), the
  // timeline panel works for real: Auto samples with the SAME algorithm the
  // live server uses (CodeXRGitRefPickerRuntime.sampleTimeline, a parity-
  // tested port), Range slices the exported timeline, Manual picks exact
  // revisions, and every frame plays from its exported payload file.

  function getOfflineGitData() {
    var manifest = client()?.getOfflineExportManifest?.();
    var gitData = manifest?.gitData;
    return gitData && Array.isArray(gitData.references?.sources) ? gitData : null;
  }

  function isOfflineSourceUsable(gitData, source) {
    return !!source
      && Number(source.itemCount || 0) > 0
      && !!offlinePayloadUrl(gitData, source);
  }

  function synthesizeOfflineEvolutionReferences(gitData) {
    var sources = gitData.references.sources.filter(function (source) {
      return isOfflineSourceUsable(gitData, source);
    });
    return {
      repositoryRoot: gitData.references.repositoryRoot || '',
      targetRelativePath: gitData.references.targetRelativePath || '',
      workingTreeDirty: gitData.references.workingTreeDirty === true,
      activeBranch: gitData.references.activeBranch || null,
      sources: sources,
      pageSize: gitData.references.pageSize || 5,
      suggestedSourceIds: gitData.suggestedSourceIds || [],
      maxFrames: gitData.maxFrames || 24,
      activeRequest: null
    };
  }

  function offlineSourceById(gitData, sourceId) {
    return gitData.references.sources.find(function (source) {
      return source && source.id === sourceId;
    }) || null;
  }

  function offlineTimeline(gitData) {
    return (gitData.timelineSourceIds || [])
      .map(function (sourceId) { return offlineSourceById(gitData, sourceId); })
      .filter(function (source) { return isOfflineSourceUsable(gitData, source); });
  }

  function offlinePayloadUrl(gitData, source) {
    if (!source) {
      return null;
    }
    if (source.kind === 'workingCopy' || source.id === 'working-copy') {
      return gitData.workingCopyPayloadUrl || String(source.payloadUrl || '') || null;
    }
    return String(source.payloadUrl || '') || null;
  }

  function offlineTimelineIndex(timeline, sourceId, gitData) {
    for (var index = 0; index < timeline.length; index += 1) {
      if (timeline[index].id === sourceId) {
        return index;
      }
    }
    if (sourceId === 'working-copy') {
      return timeline.length - 1;
    }
    var source = offlineSourceById(gitData, sourceId);
    var sha = source && source.commitSha;
    if (sha) {
      for (var shaIndex = 0; shaIndex < timeline.length; shaIndex += 1) {
        if (timeline[shaIndex].commitSha === sha) {
          return shaIndex;
        }
      }
    }
    return -1;
  }

  function buildOfflineFrames(gitData, mode, options) {
    var timeline = offlineTimeline(gitData);
    var maxFrames = Math.max(1, Math.min(96, Math.floor(Number(options.maxFrames || gitData.maxFrames || 24))));
    var sampler = root.CodeXRGitRefPickerRuntime?.sampleTimeline;
    var selected = [];

    if (mode === 'manual' && Array.isArray(options.sourceIds) && options.sourceIds.length) {
      selected = options.sourceIds
        .map(function (sourceId) { return offlineSourceById(gitData, sourceId); })
        .filter(function (source) { return isOfflineSourceUsable(gitData, source); })
        .sort(function (a, b) {
          return offlineTimelineIndex(timeline, a.id, gitData) - offlineTimelineIndex(timeline, b.id, gitData);
        })
        .slice(0, maxFrames);
    } else if (mode === 'range' && options.startSourceId && options.endSourceId) {
      var startIndex = offlineTimelineIndex(timeline, options.startSourceId, gitData);
      var endIndex = offlineTimelineIndex(timeline, options.endSourceId, gitData);
      if (startIndex < 0 || endIndex < 0) {
        return [];
      }
      var from = Math.min(startIndex, endIndex);
      var to = Math.max(startIndex, endIndex);
      var sliced = timeline.slice(from, to + 1);
      selected = sampler ? sampler(sliced, maxFrames, null) : sliced.slice(0, maxFrames);
    } else {
      // Auto: with the exported default the shipped suggestion is used
      // verbatim (exact parity with the live suggestion); any other maxFrames
      // resamples with the shared algorithm.
      if (maxFrames === (gitData.maxFrames || 24) && Array.isArray(gitData.suggestedSourceIds) && gitData.suggestedSourceIds.length) {
        selected = gitData.suggestedSourceIds
          .map(function (sourceId) { return offlineSourceById(gitData, sourceId); })
          .filter(function (source) { return isOfflineSourceUsable(gitData, source); });
      } else {
        var endAnchor = offlineSourceById(gitData, 'working-copy') || timeline[timeline.length - 1] || null;
        selected = sampler ? sampler(timeline, maxFrames, endAnchor) : timeline.slice(0, maxFrames);
      }
    }

    return selected
      .map(function (source, index) {
        if (!isOfflineSourceUsable(gitData, source)) {
          return null;
        }
        var url = offlinePayloadUrl(gitData, source);
        if (!url) {
          return null;
        }
        return {
          index: index,
          url: url,
          source: source,
          label: source.label || source.id,
          date: source.date || '',
          itemCount: Number(source.itemCount || 0)
        };
      })
      .filter(function (frame) { return !!frame; })
      .map(function (frame, index) {
        frame.index = index;
        return frame;
      });
  }

  function startOfflineTimeline() {
    var gitData = getOfflineGitData();
    if (!gitData) {
      return;
    }
    var frames = buildOfflineFrames(gitData, state.timelineMode, {
      maxFrames: state.references?.maxFrames,
      startSourceId: state.startSourceId,
      endSourceId: state.endSourceId,
      sourceIds: (state.manualSourceIds || []).slice()
    });
    if (frames.length < 2) {
      setStatus('Project evolution needs at least two exported revisions with usable data.', 'error');
      return;
    }
    clearChartVisualization();
    state.offlineMovieRevision = (state.offlineMovieRevision || 0) + 1;
    setStatus('Movie built from ' + frames.length + ' exported revisions.', 'info');
    // Explicit user action while the mode is active: applying locally is the
    // passive-entity contract's sanctioned path (the entity never self-
    // activates; the user just pressed Generate).
    applySharedState({
      entityKind: ENTITY_KIND,
      entityId: 'main',
      mode: MODE,
      result: {
        revision: state.offlineMovieRevision,
        mode: MODE,
        frames: frames,
        excludedSources: [],
        generatedAt: new Date().toISOString()
      }
    });
  }

// == projectEvolutionRuntime.js | playbackControlsAndMessages (assembled per manifest.json; see COMPONENTS.md) ==
  function render() {
    renderTimelineControls();
    // Result stays null until a movie is built; stop() renders during
    // deactivate/disposeView, so this runs for never-opened modes too.
    var frames = state.result?.frames || [];
    var frame = frames[state.frameIndex];
    updateNowShowing(frame, frames.length);
    renderTimelineBar(refs.timeline);
    renderSparkline();
    renderMovieCompanion();
    // The chart/axis controls follow playback: usable only when stopped.
    syncMappingControlsLock();
    // Sections are re-placed here because the range row folds in/out with the
    // timeline mode; the panel height follows it.
    if (refs.panel) {
      root.CodeXRMappingUiRuntime?.setPanelViewHeight?.(MODE, layoutPanel());
    }
    // render() runs before the panel exists (activate with no movie) and during
    // deactivate, so every node here is optional all the way down.
    refs.playButton?.querySelector?.('a-text')?.setAttribute?.('value', state.playing ? 'Pause' : 'Play');
  }

  function updateNowShowing(frame, frameCount) {
    if (!refs.frameTitle || !refs.frameDetail) { return; }
    if (!frameCount) {
      refs.frameTitle.setAttribute('value', 'Now showing');
      refs.frameDetail.setAttribute('value', 'No movie loaded');
      return;
    }
    var parts = splitSourceDescription(frame.source || frame);
    refs.frameTitle.setAttribute('value', 'Frame ' + (state.frameIndex + 1) + ' / ' + frameCount);
    refs.frameDetail.setAttribute('value', compact(parts.date + ' | ' + parts.label + (parts.subject ? ' - ' + parts.subject : ''), 72));
  }

  // Committer time as a sortable number: the precise epoch timestamp when the
  // server sends one, else the (day-granular) short date, else NaN. The short
  // date alone ties every same-day ref, which painted refs NEWER than the
  // range end as span.
  function sourceTimeKey(source) {
    var timestamp = Number(source?.timestamp);
    if (Number.isFinite(timestamp) && timestamp > 0) { return timestamp * 1000; }
    var parsed = Date.parse(String(source?.date || ''));
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  // A range ENDPOINT without a time can only be the working copy, which is
  // "now": Infinity sorts after every commit so the span up to Live still
  // paints. Only endpoints get this fallback — an undated row being TESTED is
  // the Live row itself, which is either an endpoint (coloured by id before
  // the span check) or genuinely outside a commit-ended range.
  function endpointTimeKey(source) {
    var time = sourceTimeKey(source);
    if (Number.isFinite(time)) { return time; }
    var isLive = source?.kind === 'workingCopy' || source?.revisionType === 'working-copy';
    return isLive ? Infinity : NaN;
  }

  // True when the source falls between the two picked range endpoints. Uses
  // committer times because the range is temporal; the endpoints themselves
  // (and refs aliasing their commit) are handled — and coloured — separately.
  function isInsideSelectedRange(source) {
    if (!state.startSourceId || !state.endSourceId) { return false; }
    var startTime = endpointTimeKey(findSource(state.startSourceId));
    var endTime = endpointTimeKey(findSource(state.endSourceId));
    var time = sourceTimeKey(source);
    if (!Number.isFinite(time) || isNaN(startTime) || isNaN(endTime)) { return false; }
    return time >= Math.min(startTime, endTime) && time <= Math.max(startTime, endTime);
  }

  // Per-row highlight/order for the shared picker: start/end (range), the
  // span between them, the click-order number (manual), or the suggested
  // order (auto).
  function resolveRowStateForSource(source) {
    if (!source) { return { selected: false }; }
    if (source.id === state.startSourceId) {
      return { selected: true, color: '#15803d' };
    }
    if (source.id === state.endSourceId) {
      return { selected: true, color: '#b91c1c' };
    }
    // A ref pointing AT an endpoint's commit (a branch/tag on the same sha,
    // e.g. the repo tip picked as end plus origin/master) IS that endpoint,
    // not span: its colour answers "why is this row marked".
    if (state.timelineMode === 'range' && source.commitSha) {
      if (source.commitSha === findSource(state.startSourceId)?.commitSha) {
        return { selected: true, color: '#15803d' };
      }
      if (source.commitSha === findSource(state.endSourceId)?.commitSha) {
        return { selected: true, color: '#b91c1c' };
      }
    }
    if (state.timelineMode === 'range' && isInsideSelectedRange(source)) {
      return { selected: true, color: '#b45309' };
    }
    var manualIndex = state.manualSourceIds.indexOf(source.id);
    if (manualIndex >= 0) {
      return { selected: true, color: '#7c3aed', orderLabel: String(manualIndex + 1) };
    }
    if (state.timelineMode === 'auto') {
      var autoOrder = getSuggestedAutoOrderById()[source.id];
      if (autoOrder) {
        return { selected: true, color: '#92400e', orderLabel: String(autoOrder) };
      }
    }
    return { selected: false };
  }

  // Panel buttons are only there once buildPanel ran; painting one that does not
  // exist must never throw (this runs from the mode's activate/deactivate).
  function paintButton(rootEntity, index, color) {
    rootEntity?.children?.[index]?.setAttribute?.(
      'material',
      'color: ' + color + '; opacity: 0.95; shader: flat'
    );
  }

  function renderTimelineControls() {
    if (!refs.picker) { return; }
    paintButton(refs.modeRoot, 0, state.timelineMode === 'auto' ? '#be123c' : '#334155');
    paintButton(refs.modeRoot, 1, state.timelineMode === 'range' ? '#be123c' : '#334155');
    paintButton(refs.modeRoot, 2, state.timelineMode === 'manual' ? '#be123c' : '#334155');
    refs.rangeRoot?.setAttribute?.('visible', state.timelineMode === 'range');
    paintButton(refs.rangeRoot, 0, state.rangeSide === 'start' ? '#16a34a' : '#14532d');
    paintButton(refs.rangeRoot, 1, state.rangeSide === 'end' ? '#dc2626' : '#7f1d1d');
    // Same active-speed highlight the companion shows, so both rows agree.
    paintSpeedRow(refs.speedRoot);
    var autoCount = Object.keys(getSuggestedAutoOrderById()).length;
    var info = state.timelineMode === 'auto'
      ? 'Auto: CodeXR samples ' + (autoCount || 'the') + ' timeline frames.'
      : state.timelineMode === 'range'
        ? 'Range: ' + state.rangeSide.toUpperCase() + ' | ' + sourceDescription(findSource(state.startSourceId)) + ' -> ' + sourceDescription(findSource(state.endSourceId))
        : 'Manual: ' + state.manualSourceIds.length + ' selected frames.';
    refs.info?.setAttribute('value', info);
    refs.picker.render();
  }

  function selectSourceForTimeline(source) {
    if (state.timelineMode === 'range') {
      if (state.rangeSide === 'end') {
        state.endSourceId = source.id;
      } else {
        state.startSourceId = source.id;
      }
      render();
      return;
    }
    if (state.timelineMode === 'manual') {
      if (state.manualSourceIds.includes(source.id)) {
        state.manualSourceIds = state.manualSourceIds.filter(function (id) { return id !== source.id; });
      } else {
        state.manualSourceIds.push(source.id);
      }
      render();
    }
  }

  function selectMode() {
    openSelection();
  }

  async function openSelection() {
    if (state.availability !== 'enabled') {
      setStatus(state.unavailableReason, 'error');
      return false;
    }
    buildPanel();
    root.CodeXRAnalysisModeRuntime?.setSelectionPanel?.(MODE);
    client()?.sendMessage?.('analysis-mode-activate', { mode: MODE });
    // Single entry path: no explicit controllerView/panelViewId — the mode's
    // resolveControllerView routes (Field Mapping when a movie exists, the
    // selection panel otherwise) and the lifecycle's activate shows it, so
    // the local transition and the server echo can never disagree.
    await changeToEvolutionAnalysis({ reason: 'project-evolution-selection' });
    // An exported copy cannot ask a server for references. With exported
    // per-revision payloads the panel works for real (synthesized references,
    // local generation); without them, replay the exported movie only.
    if (client()?.isOfflineExport?.()) {
      var offlineGitData = getOfflineGitData();
      if (offlineGitData) {
        state.references = synthesizeOfflineEvolutionReferences(offlineGitData);
        refs.picker?.setReferences(state.references);
        render();
        setStatus(
          'Offline export: generate a movie from the '
          + offlineGitData.analyzedRevisionCount + ' exported revisions (Auto, Range or Manual).',
          'info'
        );
        return true;
      }
      var frameCount = state.result?.frames?.length || 0;
      setStatus(
        frameCount
          ? 'Exported movie: play, pause and seek work here. Generating a new movie needs the live CodeXR session.'
          : 'No evolution movie was generated before this export: generating one needs the live CodeXR session.',
        frameCount ? 'info' : 'error'
      );
      return true;
    }
    setStatus('Loading project timeline...', 'info');
    if (!client()?.sendMessage?.('project-evolution-references-request', {})) {
      setStatus('Collaboration connection is not ready.', 'error');
    }
    return true;
  }

  function startSelectedTimeline() {
    if (client()?.isOfflineExport?.()) {
      if (getOfflineGitData()) {
        if (state.timelineMode === 'range' && (!state.startSourceId || !state.endSourceId)) {
          setStatus('Choose start and end commits for the range.', 'error');
          return;
        }
        if (state.timelineMode === 'manual' && (state.manualSourceIds || []).length < 1) {
          setStatus('Select at least one commit for the manual movie.', 'error');
          return;
        }
        startOfflineTimeline();
        return;
      }
      setStatus('This export replays the movie generated before export: a new movie needs the live CodeXR session.', 'error');
      return;
    }
    var request = {
      mode: state.timelineMode,
      maxFrames: Number(state.references.maxFrames || 24)
    };
    if (state.timelineMode === 'range') {
      request.startSourceId = state.startSourceId;
      request.endSourceId = state.endSourceId;
      if (!request.startSourceId || !request.endSourceId) {
        setStatus('Choose start and end commits for the range.', 'error');
        return;
      }
    }
    if (state.timelineMode === 'manual') {
      request.sourceIds = state.manualSourceIds.slice();
      if (request.sourceIds.length < 1) {
        setStatus('Select at least one commit for the manual movie.', 'error');
        return;
      }
    }
    setStatus('Analyzing project evolution. Please wait...', 'info');
    clearChartVisualization();
    client()?.sendMessage?.('project-evolution-start', request);
  }

  function clearMovie() {
    // Clearing deletes server-side files; offline it would only wipe the
    // replay this export exists to provide. With exported git payloads,
    // clearing is fine: the movie can be regenerated locally at will.
    if (client()?.isOfflineExport?.()) {
      if (getOfflineGitData()) {
        stop();
        applyClearedState('Project evolution movie cleared.');
        return;
      }
      setStatus('This exported movie is replay-only: it cannot be cleared or regenerated here.', 'error');
      return;
    }
    stop();
    setStatus('Clearing project evolution movie...', 'info');
    if (!client()?.sendMessage?.('project-evolution-clear', {})) {
      applyClearedState('Project evolution movie cleared locally.');
    }
  }

  function handleReferences(message) {
    var payload = unwrapPayload(message);
    state.references = payload || null;
    refs.picker?.setReferences(state.references);
    var count = (refs.picker?.getVisibleSources?.() || []).filter(function (source) {
      return source && source.kind === 'gitRef';
    }).length;
    var excludedCount = Number(state.references?.eligibility?.excludedSources?.length || 0);
    var suffix = excludedCount
      ? ' ' + excludedCount + ' revision(s) were hidden because they contain no analyzable data.'
      : '';
    setStatus(
      count ? 'Ready to generate ' + count + ' timeline frames.' + suffix : 'Fewer than two revisions contain analyzable data.' + suffix,
      count >= 2 ? 'info' : 'error'
    );
    render();
  }

  function handleProgress(message) {
    var payload = unwrapPayload(message);
    if (!payload) { return; }
    setStatus(payload.message || '', payload.state === 'error' ? 'error' : 'info');
    // Drives both the progress bar and whether the panel reserves room for it.
    state.generating = payload.state === 'analyzing' && Number(payload.frameCount) > 0;
    renderGenerationProgress(payload);
    render();
  }

  function handleError(message) {
    var payload = unwrapPayload(message);
    state.pendingFrameApply?.reject?.(new Error(payload.message || 'Project evolution failed.'));
    state.pendingFrameApply = null;
    stop();
    setStatus(payload.message || 'Project evolution failed.', 'error');
  }

// == projectEvolutionRuntime.js | frameApplication (assembled per manifest.json; see COMPONENTS.md) ==
  function handleFrameApplied(message) {
    var payload = unwrapPayload(message);
    if (
      !payload
      || !state.result
      || Number(payload.revision) !== Number(state.result.revision)
    ) {
      return;
    }
    var frames = state.result.frames || [];
    var frameIndex = Math.max(0, Math.min(frames.length - 1, Number(payload.frameIndex) || 0));
    var pending = state.pendingFrameApply;
    if (payload.requestId && state.supersededFrameApplyIds[payload.requestId]) {
      delete state.supersededFrameApplyIds[payload.requestId];
      return;
    }
    if (
      pending
      && payload.requestId
      && pending.requestId
      && payload.requestId !== pending.requestId
    ) {
      return;
    }
    if (
      pending
      && Number(pending.revision) === Number(payload.revision)
      && Number(pending.frameIndex) === frameIndex
    ) {
      state.pendingFrameApply = null;
      pending.resolve(payload);
      return;
    }
    state.frameIndex = frameIndex;
    var viewGeneration = state.viewGeneration;
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return;
    }
    void applyBridgeFrameToChart(frames[state.frameIndex], payload.bridgeUrl, viewGeneration).then(function (applied) {
      if (!applied || !isEvolutionViewCurrent(viewGeneration)) {
        return;
      }
      render();
      updatePlaybackOverlay(frames[state.frameIndex], frames.length, state.playing);
    });
  }

  function isEvolutionModeActiveOrActivating() {
    var modeState = root.CodeXRAnalysisModeRuntime?.getState?.();
    if (modeState?.transitioning) {
      return modeState?.pendingTransitionMode === MODE;
    }
    return modeState?.mode === MODE;
  }

  // Mode-data entities are PASSIVE: receiving a movie result must never steal
  // the table from whatever mode the participant is in. Only the authoritative
  // `analysis-view` entity (or an explicit user action) changes the active
  // mode — the server publishes it when a generation completes, and the mode
  // lifecycle's activate() renders from the result stored here. Same contract
  // as the historical and dependency runtimes; new modes must follow it too
  // (see COMPONENTS.md). The unconditional transition that used to live here
  // hijacked the scene on room-snapshot replays and in exported copies.
  function applySharedState(shared) {
    if (!shared || shared.entityKind !== ENTITY_KIND || !shared.result) {
      return;
    }
    var previousRevision = Number(state.result?.revision || 0);
    state.result = shared.result;
    state.frameIndex = 0;
    if (previousRevision && previousRevision !== Number(shared.result.revision || 0)) {
      releaseEvolutionVisualization();
    }
    if (!isEvolutionModeActiveOrActivating()) {
      return;
    }
    setStatus('Project evolution ready.', 'info');
    // Already in (or entering) evolution: reroute from the selection panel to
    // the movie view and land on the first frame. resolveControllerView picks
    // the view, so the local transition and the server echo cannot disagree.
    var transition = changeToEvolutionAnalysis({ reason: 'project-evolution-ready' });
    void Promise.resolve(transition).then(function () {
      return seek(0);
    });
  }

  // Safe to call cold (no movie built yet) and repeatedly: this runs from the
  // mode's activate() on every entry without a result, so anything that throws
  // here aborts the transition and bounces the user back to the analysis
  // selector. The refs start out undefined (`var refs = {}`), so each node is
  // detached only if it is actually mounted.
  function detachEvolutionNode(node) {
    node?.parentNode?.removeChild?.(node);
  }

  function releaseEvolutionVisualization() {
    state.dataRefreshGeneration += 1;
    releaseEvolutionChart();
    root.CodeXRMappingUiRuntime?.releaseChartEntity?.(refs.evolutionTreeBuilder);
    detachEvolutionNode(refs.frameNameplate);
    detachEvolutionNode(refs.evolutionDataSource);
    detachEvolutionNode(refs.evolutionRoot);
    refs.frameNameplate = null;
    refs.evolutionRoot = null;
    refs.evolutionDataSource = null;
    refs.evolutionTreeBuilder = null;
    state.appliedFrameIndex = -1;
    state.appliedResultRevision = 0;
  }

  // Table-edge plate naming the commit on screen — the same shared plate the
  // historical comparison uses for its two sides, so both Git analyses label
  // the table identically. Created once, updated by attribute.
  function updateFrameNameplate(frame) {
    var picker = root.CodeXRGitRefPickerRuntime;
    var source = frame?.source || frame;
    if (!picker?.createSourceNameplate || !source) { return; }
    if (!refs.frameNameplate) {
      var zone = root.CodeXRAnalysisTableRuntime?.getAnalysisTableZones?.('project-evolution')?.[0]
        || { anchorX: 0, anchorZ: -18, depth: 3.2 };
      refs.frameNameplate = picker.createSourceNameplate(source, zone, '#f59e0b');
      refs.frameNameplate.setAttribute?.('id', 'codexrProjectEvolutionFrameNameplate');
      refs.frameNameplate.setAttribute?.(
        'data-codexr-role',
        'project-evolution auxiliary'
      );
      doc().querySelector?.('a-scene')?.appendChild?.(refs.frameNameplate);
      return;
    }
    picker.setSourceNameplate?.(refs.frameNameplate, source, '#f59e0b');
    setNodeVisible(refs.frameNameplate, true);
  }

  function clearChartVisualization() {
    var ownedPrimaryAnalysis = isEvolutionModeActiveOrActivating();
    releaseEvolutionVisualization();
    if (state.pendingFrameApply?.requestId) {
      state.supersededFrameApplyIds[state.pendingFrameApply?.requestId] = true;
    }
    state.pendingFrameApply?.reject?.(Object.assign(new Error('Project evolution movie cleared.'), {
      code: 'project-evolution-cleared'
    }));
    state.pendingFrameApply = null;
    if (ownedPrimaryAnalysis) {
      root.CodeXRMappingUiRuntime?.setChartEntityIds?.([], { renormalize: false });
    }
  }

  function applyClearedState(message) {
    invalidateEvolutionView('project-evolution-cleared');
    stop();
    state.result = null;
    state.frameIndex = 0;
    state.playbackMappingSnapshot = null;
    clearChartVisualization();
    hidePlaybackOverlay();
    updateNowShowing(null, 0);
    setStatus(message || 'Project evolution movie cleared.', 'info');
    render();
  }

  function getChartEntities() {
    return refs.evolutionChart?.isConnected === false || !refs.evolutionChart
      ? []
      : [refs.evolutionChart];
  }

  function getDefaultChartId() {
    // Boats is the mode's identity chart. config().chartId is the chart the
    // NORMAL analysis scene was created with — preferring it opened the movie
    // as a pie when the scene was a pie. Fall back to it only when the scene
    // has no boats template.
    var toolingConfig = config();
    var hasBoats = Array.isArray(toolingConfig.availableCharts)
      && toolingConfig.availableCharts.some(function (chart) { return chart && chart.id === 'boats'; });
    return hasBoats ? 'boats' : (toolingConfig.chartId || 'boats');
  }

  function getActiveChartId() {
    return state.activeChartId || getDefaultChartId();
  }

  function getDefaultMappingForChart(chartId) {
    var defaults = config().defaultMappingsByChart || {};
    return Object.assign({}, defaults[chartId] || {});
  }

  function getActiveMappingForChart(chartId) {
    var mappingState = root.CodeXRMappingUiRuntime?.getState?.() || {};
    var defaultMapping = getDefaultMappingForChart(chartId);
    var liveMapping = mappingState.mappingContextId === MODE && mappingState.chartId === chartId
      ? (mappingState.lastKnownGoodMapping || mappingState.selectedByDimension || {})
      : {};
    return Object.assign({}, defaultMapping, liveMapping);
  }

  function syncActiveChartFromMapping() {
    var mappingState = root.CodeXRMappingUiRuntime?.getState?.() || {};
    if (mappingState.mappingContextId !== MODE || !mappingState.chartId) {
      return false;
    }
    if (mappingState.chartId === state.activeChartId) {
      return false;
    }
    state.activeChartId = mappingState.chartId;
    return true;
  }

  // A confirmed chart/axis change reconfigures only the persistent chart.
  // The datasource URL, bridge payload and frame index stay untouched.
  function onMappingConfirmed() {
    if (state.playing) {
      if (state.playbackMappingSnapshot) {
        root.CodeXRMappingUiRuntime?.restoreState?.(
          state.playbackMappingSnapshot,
          { applyToEntities: false, forceWhenLocked: true }
        );
      }
      setStatus('Playback running - pause to change chart or axes.', 'info');
      render();
      return;
    }
    if (!(state.result?.frames || []).length) {
      syncActiveChartFromMapping();
      return;
    }
    if (state.applyingMapping) {
      return;
    }
    stop();
    setMappingApplying(true);
    var chartChanged = syncActiveChartFromMapping();
    Promise.resolve(applyEvolutionChartSelection(chartChanged, state.viewGeneration))
      .catch(function () { /* seek reports its own failure through the status */ })
      .then(function (applied) {
        if (applied) {
          state.playbackMappingSnapshot = root.CodeXRMappingUiRuntime?.getState?.() || null;
        }
        setMappingApplying(false);
      });
  }

  // Single source of truth for the "chart change in flight" lock.
  function setMappingApplying(applying) {
    state.applyingMapping = !!applying;
    setStatus(applying ? 'Applying chart change...' : '', applying ? 'info' : 'info');
    render();
    if (!state.applyingMapping) {
      // The lock that may have deferred a leave/return resume is gone.
      tryResumePlayback();
    }
  }

  // The chart/axis controls are only safe to use while the movie is stopped.
  function syncMappingControlsLock() {
    var locked = state.playing;
    root.CodeXRMappingUiRuntime?.setMappingControlsEnabled?.(
      !locked,
      locked ? 'Playback running - pause to change chart or axes.' : ''
    );
  }

  function isHierarchicalBoatsChart(chartId, componentName) {
    return chartId === 'boats'
      || componentName === 'babia-boats';
  }

// == projectEvolutionRuntime.js | declarativePipeline (assembled per manifest.json) ==
  var EVOLUTION_TREE_COMPONENT = 'babia-treebuilder';
  var EVOLUTION_DATA_ID = 'codexrProjectEvolutionData';
  var EVOLUTION_TREE_ID = 'codexrProjectEvolutionTree';
  var EVOLUTION_CHART_ID = 'codexrProjectEvolutionChart';

  function ensureEvolutionRoot(frame) {
    if (refs.evolutionRoot?.isConnected !== false && refs.evolutionRoot) {
      root.CodeXRAnalysisSurfaceRuntime?.mountRoot?.(MODE, refs.evolutionRoot);
    } else {
      refs.evolutionRoot = entity('a-entity', {
        id: 'codexrProjectEvolutionRoot',
        'data-codexr-analysis-root': 'true',
        'data-codexr-analysis-mode': MODE,
        'data-codexr-preserve': 'true'
      });
      if (root.CodeXRAnalysisSurfaceRuntime?.mountRoot) {
        root.CodeXRAnalysisSurfaceRuntime.mountRoot(MODE, refs.evolutionRoot);
      } else {
        doc().querySelector?.('a-scene')?.appendChild?.(refs.evolutionRoot);
      }
    }
    if (frame) {
      refs.evolutionRoot.setAttribute(
        'data-codexr-frame-index',
        String((Number(frame.index) || 0) + 1)
      );
    }
    return refs.evolutionRoot;
  }

  function projectEvolutionContainmentProfile() {
    return root.CodeXRAnalysisTableRuntime?.getContainmentProfile?.(MODE) || {
      id: MODE,
      position: { x: 0, y: 1, z: -18 },
      containment: {
        enabled: true,
        anchorX: 0,
        anchorY: 1,
        anchorZ: -18,
        targetWidth: 5.614,
        targetHeight: 1.8,
        targetDepth: 3.218,
        bootstrapPlanarMaxRatio: 0.84,
        minPlanarOccupancyRatio: 0.78,
        maxPlanarOccupancyRatio: 0.92,
        heightBandMinRatio: 0.38,
        heightBandMaxRatio: 0.72,
        tableTopPadding: 0.9,
        tableEdgeMargin: 0.18,
        yScaleMin: 0.01,
        yScaleMax: 12,
        containmentToleranceRatio: 0.018,
        periodicContainmentEnabled: true,
        stabilizationCheckMs: 140,
        stabilizationMaxChecks: 14,
        stabilizationStablePasses: 3,
        transformTransitionMs: 650,
        hardHeightGuardEnabled: true
      }
    };
  }

  function evolutionTreeField(targetType) {
    var treeFields = root.CodeXRMappingUiRuntime?.getChartBaseConfig?.()?.treeFields;
    return targetType === 'directory'
      ? (treeFields?.directory || 'filePath')
      : (treeFields?.file || 'treePath');
  }

  function evolutionChartTitle() {
    return String(config().analysisTitle || 'Project Evolution');
  }

  function serializeEvolutionComponentData(data) {
    var serializer = root.CodeXRMappingUiRuntime?.serializeDeclarativeComponentData;
    if (typeof serializer === 'function') {
      return serializer(data);
    }
    return Object.keys(data || {})
      .filter(function (key) {
        return data[key] !== undefined && data[key] !== null && data[key] !== '';
      })
      .map(function (key) {
        return key + ': ' + String(data[key]).replace(/;/g, ',');
      })
      .join(';\n');
  }

  function ensureEvolutionDataSource(frameUrl) {
    var scene = doc().querySelector?.('a-scene');
    if (!scene) {
      return { entity: null, created: false };
    }
    if (refs.evolutionDataSource) {
      if (refs.evolutionDataSource.parentNode !== scene) {
        scene.appendChild(refs.evolutionDataSource);
      }
      return { entity: refs.evolutionDataSource, created: false };
    }
    var url = String(frameUrl || bridgeUrl() || '');
    if (!url) {
      return { entity: null, created: false };
    }
    refs.evolutionDataSource = entity('a-entity', {
      id: EVOLUTION_DATA_ID,
      'data-codexr-role': 'project-evolution datasource',
      'data-codexr-project-evolution-support': 'true',
      'data-codexr-evolution-url': url
    });
    root.CodeXRMappingUiRuntime?.setDeclarativeAttribute?.(
      refs.evolutionDataSource,
      'babia-queryjson',
      serializeEvolutionComponentData({ url: url })
    );
    scene.appendChild(refs.evolutionDataSource);
    return { entity: refs.evolutionDataSource, created: true };
  }

  function ensureEvolutionTreeBuilder(rootEl) {
    if (refs.evolutionTreeBuilder) {
      if (refs.evolutionTreeBuilder.parentNode !== rootEl) {
        rootEl.insertBefore?.(refs.evolutionTreeBuilder, rootEl.firstChild || null);
      }
      return refs.evolutionTreeBuilder;
    }
    refs.evolutionTreeBuilder = root.CodeXRMappingUiRuntime?.buildDeclarativeTreeEntity?.({
      entityId: EVOLUTION_TREE_ID,
      sourceId: EVOLUTION_DATA_ID,
      field: evolutionTreeField(config().targetType),
      splitBy: '/'
    }) || null;
    if (!refs.evolutionTreeBuilder) {
      return null;
    }
    refs.evolutionTreeBuilder.setAttribute(
      'data-codexr-role',
      'project-evolution treebuilder'
    );
    rootEl.insertBefore?.(refs.evolutionTreeBuilder, rootEl.firstChild || null);
    return refs.evolutionTreeBuilder;
  }

  function namespaceEvolutionTreeNodes(nodes, namespace) {
    var safeNamespace = String(namespace || MODE).replace(/[^a-zA-Z0-9_-]/g, '-');
    return (Array.isArray(nodes) ? nodes : []).map(function (node) {
      var copy = Object.assign({}, node);
      var rawUid = String(node?.uid || node?.name || '');
      copy.uid = rawUid.indexOf(safeNamespace + ':') === 0
        ? rawUid
        : safeNamespace + ':' + rawUid;
      if (Array.isArray(node?.children)) {
        copy.children = namespaceEvolutionTreeNodes(node.children, safeNamespace);
      }
      return copy;
    });
  }

  function scopeEvolutionTreeOutput(treeBuilder) {
    var component = treeBuilder?.components?.[EVOLUTION_TREE_COMPONENT];
    var buffer = component?.notiBuffer;
    if (!buffer || typeof buffer.set !== 'function' || buffer.__codexrEvolutionNamespace) {
      return !!buffer;
    }
    var originalSet = buffer.set.bind(buffer);
    buffer.set = function (payload) {
      originalSet(namespaceEvolutionTreeNodes(payload, MODE));
    };
    buffer.__codexrEvolutionNamespace = MODE;
    if (buffer.data !== undefined) {
      buffer.data = namespaceEvolutionTreeNodes(buffer.data, MODE);
    }
    return true;
  }

  function evolutionChartSourceId(chartId) {
    return chartId === 'boats' ? EVOLUTION_TREE_ID : EVOLUTION_DATA_ID;
  }

  function declarativeEvolutionChartOptions(chartId, applyTransform) {
    return {
      entityId: EVOLUTION_CHART_ID,
      chartId: chartId,
      sourceId: evolutionChartSourceId(chartId),
      mapping: getActiveMappingForChart(chartId),
      title: evolutionChartTitle(),
      containmentProfile: projectEvolutionContainmentProfile(),
      role: 'project-evolution chart',
      applyTransform: applyTransform !== false,
      applyInitialScale: applyTransform !== false
    };
  }

  function buildEvolutionChart(chartId) {
    var chart = root.CodeXRMappingUiRuntime?.buildDeclarativeChartEntity?.(
      declarativeEvolutionChartOptions(chartId, true)
    ) || null;
    if (!chart) {
      return null;
    }
    chart.setAttribute('data-codexr-project-evolution-chart', 'true');
    chart.setAttribute('data-codexr-project-evolution-chart-id', chartId);
    return chart;
  }

  function releaseEvolutionChart() {
    var chartIds = refs.evolutionChart?.id ? [refs.evolutionChart.id] : [];
    root.CodeXRAnalysisTableRuntime?.cancelChartDataTransition?.(
      chartIds,
      'project-evolution-chart-released'
    );
    root.CodeXRMappingUiRuntime?.releaseChartEntity?.(refs.evolutionChart);
    refs.evolutionChart?.parentNode?.removeChild?.(refs.evolutionChart);
    refs.evolutionChart = null;
  }

  function ensureEvolutionChart(chartId, rootEl) {
    var chart = refs.evolutionChart;
    if (
      chart
      && chart.getAttribute?.('data-codexr-project-evolution-chart-id') === chartId
    ) {
      if (chart.parentNode !== rootEl) {
        rootEl.appendChild(chart);
      }
      chart.setAttribute('visible', true);
      return chart;
    }
    var nextChart = buildEvolutionChart(chartId);
    if (!nextChart) {
      return null;
    }
    releaseEvolutionChart();
    rootEl.appendChild(nextChart);
    refs.evolutionChart = nextChart;
    state.activeChartId = chartId;
    return refs.evolutionChart;
  }

  function configureEvolutionChart(chart, chartId) {
    if (!chart) {
      return false;
    }
    return !!root.CodeXRMappingUiRuntime?.configureDeclarativeChartEntity?.(
      chart,
      declarativeEvolutionChartOptions(chartId, false)
    );
  }

  function waitForComponent(element, componentName, timeoutMs) {
    if (!element || !componentName) {
      return Promise.resolve(false);
    }
    if (element.components && element.components[componentName]) {
      return Promise.resolve(true);
    }
    return new Promise(function (resolve) {
      var settled = false;
      var timeout = root.setTimeout(function () {
        if (settled) { return; }
        settled = true;
        element.removeEventListener?.('componentinitialized', onInitialized);
        resolve(!!(element.components && element.components[componentName]));
      }, timeoutMs || 1200);
      function onInitialized(event) {
        if (event.detail.name !== componentName || settled) {
          return;
        }
        settled = true;
        root.clearTimeout?.(timeout);
        element.removeEventListener?.('componentinitialized', onInitialized);
        resolve(true);
      }
      element.addEventListener?.('componentinitialized', onInitialized);
    });
  }

  function nextRenderFrame() {
    return new Promise(function (resolve) {
      (root.requestAnimationFrame || function (callback) {
        return root.setTimeout(callback, 16);
      })(function () { resolve(true); });
    });
  }

  async function ensureDeclarativeEvolutionPipeline(frame, frameUrl, viewGeneration) {
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return null;
    }
    var chartId = getActiveChartId();
    var componentName = COMPONENT_BY_CHART[chartId];
    if (!componentName) {
      return null;
    }
    var rootEl = ensureEvolutionRoot(frame);
    var dataResult = ensureEvolutionDataSource(frameUrl);
    var dataSource = dataResult.entity;
    if (!dataSource || !await waitForComponent(dataSource, 'babia-queryjson', 1200)) {
      setStatus('Project evolution datasource is not available.', 'error');
      return null;
    }
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return null;
    }
    var treeBuilder = ensureEvolutionTreeBuilder(rootEl);
    if (!treeBuilder || !await waitForComponent(treeBuilder, EVOLUTION_TREE_COMPONENT, 1200)) {
      setStatus('Project evolution tree is not available.', 'error');
      return null;
    }
    scopeEvolutionTreeOutput(treeBuilder);
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return null;
    }
    var chart = ensureEvolutionChart(chartId, rootEl);
    if (!chart || !await waitForComponent(chart, componentName, 1200)) {
      setStatus('Project evolution chart is not available.', 'error');
      return null;
    }
    await waitForComponent(chart, 'codexr-chart-containment', 1200);
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return null;
    }
    root.CodeXRMappingUiRuntime?.setChartEntityIds?.([chart.id], {
      renormalize: false
    });
    return {
      chartId: chartId,
      componentName: componentName,
      chart: chart,
      dataSource: dataSource,
      dataSourceCreated: dataResult.created,
      treeBuilder: treeBuilder
    };
  }

  function getEvolutionDataBuffer() {
    return refs.evolutionDataSource?.components?.['babia-queryjson']?.notiBuffer || null;
  }

  function refreshEvolutionDataSource(frameUrl) {
    var viewGeneration = state.viewGeneration;
    if (
      !refs.evolutionDataSource
      || !frameUrl
      || !isEvolutionViewCurrent(viewGeneration)
    ) {
      return 0;
    }
    var generation = ++state.dataRefreshGeneration;
    refs.evolutionDataSource.setAttribute('data-codexr-evolution-url', frameUrl);
    root.CodeXRMappingUiRuntime?.setDeclarativeAttribute?.(
      refs.evolutionDataSource,
      'babia-queryjson',
      serializeEvolutionComponentData({ url: frameUrl })
    );
    return generation;
  }

  function beginInitialEvolutionDataLoad(frameUrl) {
    state.dataRefreshGeneration += 1;
    refs.evolutionDataSource?.setAttribute?.('data-codexr-evolution-url', frameUrl);
    return state.dataRefreshGeneration;
  }

  function waitForEvolutionDataRefresh(
    generation,
    previousData,
    viewGeneration,
    timeoutMs,
    acceptCurrentData
  ) {
    var startedAt = Date.now();
    return new Promise(function (resolve) {
      function inspect() {
        if (
          generation !== state.dataRefreshGeneration
          || !isEvolutionViewCurrent(viewGeneration)
        ) {
          resolve(false);
          return;
        }
        var buffer = getEvolutionDataBuffer();
        if (
          buffer
          && buffer.data !== undefined
          && (acceptCurrentData || buffer.data !== previousData)
        ) {
          resolve(true);
          return;
        }
        if (Date.now() - startedAt >= (timeoutMs || 8000)) {
          resolve(false);
          return;
        }
        root.setTimeout(inspect, 30);
      }
      inspect();
    });
  }

  function captureEvolutionChartTransition(chart, componentName) {
    var component = chart?.components?.[componentName] || null;
    return {
      component: component,
      figures: component?.figures,
      figuresOld: component?.figures_old,
      childCount: Number(chart?.children?.length) || 0
    };
  }

  function waitForEvolutionChartAnimation(
    chart,
    componentName,
    generation,
    viewGeneration,
    previousTransition
  ) {
    var startedAt = Date.now();
    var sawAnimation = false;
    return new Promise(function (resolve) {
      function inspect() {
        if (
          generation !== state.dataRefreshGeneration
          || !isEvolutionViewCurrent(viewGeneration)
          || chart !== refs.evolutionChart
        ) {
          resolve(false);
          return;
        }
        var component = chart?.components?.[componentName];
        if (!component) {
          if (Date.now() - startedAt > 1800) {
            resolve(false);
          } else {
            root.setTimeout(inspect, 30);
          }
          return;
        }
        var duration = Math.max(
          0,
          Number(component.duration) || Number(component.data?.dur) || 0
        );
        var observesFigures = componentName === 'babia-boats';
        var producerUpdateObserved = !previousTransition || (
          observesFigures
            ? (
              component !== previousTransition.component
              || component.figures !== previousTransition.figures
              || component.figures_old !== previousTransition.figuresOld
            )
            : (
              component !== previousTransition.component
              || (Number(chart?.children?.length) || 0) !== previousTransition.childCount
              || Date.now() - startedAt >= 60
            )
        );
        if (!producerUpdateObserved) {
          if (Date.now() - startedAt > Math.max(1800, duration + 600)) {
            resolve(false);
          } else {
            root.setTimeout(inspect, 30);
          }
          return;
        }
        if (component.animation === true) {
          sawAnimation = true;
          if (Date.now() - startedAt > duration + 1800) {
            resolve(true);
          } else {
            root.setTimeout(inspect, 40);
          }
          return;
        }
        void nextRenderFrame().then(function () {
          void nextRenderFrame().then(function () {
            resolve(
              generation === state.dataRefreshGeneration
              && isEvolutionViewCurrent(viewGeneration)
              && chart === refs.evolutionChart
              && (!sawAnimation || component.animation !== true)
            );
          });
        });
      }
      inspect();
    });
  }

  function getEvolutionContainmentIds() {
    return refs.evolutionChart?.isConnected === false || !refs.evolutionChart?.id
      ? []
      : [refs.evolutionChart.id];
  }

  function beginEvolutionDataTransition(reason) {
    root.CodeXRAnalysisTableRuntime?.beginChartDataTransition?.(
      getEvolutionContainmentIds(),
      reason || 'project-evolution-frame'
    );
  }

  function finishEvolutionDataTransition(reason) {
    root.CodeXRAnalysisTableRuntime?.finishChartDataTransition?.(
      getEvolutionContainmentIds(),
      reason || 'project-evolution-frame'
    );
  }

  function cancelEvolutionDataTransition(reason) {
    root.CodeXRAnalysisTableRuntime?.cancelChartDataTransition?.(
      getEvolutionContainmentIds(),
      reason || 'project-evolution-cancelled'
    );
  }

  async function waitForEvolutionContainmentStable(viewGeneration) {
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    var ids = getEvolutionContainmentIds();
    var wait = root.CodeXRAnalysisTableRuntime?.waitForChartsStable;
    if (typeof wait !== 'function' || !ids.length) {
      await nextRenderFrame();
      return isEvolutionViewCurrent(viewGeneration);
    }
    try {
      await wait(ids, { timeoutMs: 12000, pollMs: 120, stablePasses: 2 });
      return isEvolutionViewCurrent(viewGeneration);
    } catch (_error) {
      return false;
    }
  }

// == projectEvolutionRuntime.js | framePlaybackEngine (assembled per manifest.json) ==
  function bridgeUrl() {
    return String(state.result?.bridgeUrl || (state.result?.revision
      ? '/evolution/revision-' + state.result.revision + '/data.json'
      : ''));
  }

  function frameUrlWithCache(frame, rawUrl) {
    var raw = client()?.isOfflineExport?.()
      ? String(frame.url || '')
      : String(rawUrl || bridgeUrl() || frame.url || '');
    if (!raw) { return ''; }
    var separator = raw.indexOf('?') === -1 ? '?' : '&';
    return raw + separator
      + 'revision=' + encodeURIComponent(String(state.result?.revision || ''))
      + '&frame=' + encodeURIComponent(String((frame.index || 0) + 1))
      + '&t=' + Date.now();
  }

  async function applyEvolutionChartSelection(chartChanged, viewGeneration) {
    if (!isEvolutionViewCurrent(viewGeneration) || state.playing) {
      return false;
    }
    if (chartChanged) {
      releaseEvolutionChart();
    }
    var frame = state.result?.frames?.[state.frameIndex];
    var currentUrl = refs.evolutionDataSource?.getAttribute?.(
      'data-codexr-evolution-url'
    ) || frameUrlWithCache(frame || {}, '');
    var pipeline = await ensureDeclarativeEvolutionPipeline(
      frame,
      currentUrl,
      viewGeneration
    );
    if (!pipeline || !isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    beginEvolutionDataTransition('project-evolution-chart-selection');
    if (!chartChanged && !configureEvolutionChart(pipeline.chart, pipeline.chartId)) {
      cancelEvolutionDataTransition('project-evolution-chart-selection-cancelled');
      return false;
    }
    await nextRenderFrame();
    await waitForEvolutionChartAnimation(
      pipeline.chart,
      pipeline.componentName,
      state.dataRefreshGeneration,
      viewGeneration
    );
    if (!isEvolutionViewCurrent(viewGeneration)) {
      cancelEvolutionDataTransition('project-evolution-chart-selection-cancelled');
      return false;
    }
    finishEvolutionDataTransition('project-evolution-chart-selection');
    await waitForEvolutionContainmentStable(viewGeneration);
    return isEvolutionViewCurrent(viewGeneration);
  }

  async function applyBridgeFrameToChart(frame, appliedBridgeUrl) {
    var requestedViewGeneration = arguments.length > 2
      ? arguments[2]
      : state.viewGeneration;
    var viewGeneration = Number.isFinite(Number(requestedViewGeneration))
      ? Number(requestedViewGeneration)
      : state.viewGeneration;
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    var frameUrl = frameUrlWithCache(frame, appliedBridgeUrl);
    if (!frameUrl) {
      setStatus('This evolution movie has no bridge data URL.', 'error');
      return false;
    }
    var previousData = getEvolutionDataBuffer()?.data;
    var pipeline = await ensureDeclarativeEvolutionPipeline(
      frame,
      frameUrl,
      viewGeneration
    );
    if (!pipeline || !isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    var previousTransition = pipeline.dataSourceCreated
      ? null
      : captureEvolutionChartTransition(
        pipeline.chart,
        pipeline.componentName
      );
    beginEvolutionDataTransition('project-evolution-frame');
    var refreshGeneration = pipeline.dataSourceCreated
      ? beginInitialEvolutionDataLoad(frameUrl)
      : refreshEvolutionDataSource(frameUrl);
    if (!refreshGeneration) {
      cancelEvolutionDataTransition('project-evolution-frame-cancelled');
      return false;
    }
    var refreshed = await waitForEvolutionDataRefresh(
      refreshGeneration,
      previousData,
      viewGeneration,
      8000,
      pipeline.dataSourceCreated
    );
    if (!refreshed || !isEvolutionViewCurrent(viewGeneration)) {
      cancelEvolutionDataTransition('project-evolution-frame-refresh-failed');
      if (isEvolutionViewCurrent(viewGeneration)) {
        setStatus('Project evolution data could not be refreshed.', 'error');
      }
      return false;
    }
    var animated = await waitForEvolutionChartAnimation(
      pipeline.chart,
      pipeline.componentName,
      refreshGeneration,
      viewGeneration,
      previousTransition
    );
    if (!animated || !isEvolutionViewCurrent(viewGeneration)) {
      cancelEvolutionDataTransition('project-evolution-frame-animation-cancelled');
      if (isEvolutionViewCurrent(viewGeneration)) {
        setStatus('Project evolution chart did not consume the new frame.', 'error');
      }
      return false;
    }
    finishEvolutionDataTransition('project-evolution-frame');
    await waitForEvolutionContainmentStable(viewGeneration);
    if (!isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    state.appliedFrameIndex = Number(frame.index) || 0;
    state.appliedResultRevision = Number(state.result?.revision) || 0;
    return true;
  }

  function requestBridgeFrame(frameIndex) {
    var revision = state.result.revision;
    if (!revision) {
      return Promise.reject(new Error('project-evolution-missing-revision'));
    }
    if (state.pendingFrameApply?.reject) {
      if (state.pendingFrameApply?.requestId) {
        state.supersededFrameApplyIds[state.pendingFrameApply.requestId] = true;
      }
      state.pendingFrameApply.reject(Object.assign(
        new Error('project-evolution-frame-apply-superseded'),
        { code: 'project-evolution-frame-apply-superseded' }
      ));
    }
    var runtimeClient = client();
    if (runtimeClient?.isOfflineExport?.()) {
      return Promise.resolve({
        revision: revision,
        frameIndex: frameIndex,
        bridgeUrl: ''
      });
    }
    if (!runtimeClient?.sendMessage) {
      return Promise.resolve({
        revision: revision,
        frameIndex: frameIndex,
        bridgeUrl: bridgeUrl()
      });
    }
    return new Promise(function (resolve, reject) {
      var requestId = 'frame-' + (++state.frameApplyRequestId) + '-' + Date.now();
      var timeoutId = root.setTimeout(function () {
        if (
          state.pendingFrameApply?.frameIndex === frameIndex
          && state.pendingFrameApply?.revision === revision
          && state.pendingFrameApply?.requestId === requestId
        ) {
          state.pendingFrameApply = null;
          reject(Object.assign(
            new Error('project-evolution-frame-apply-timeout'),
            { code: 'project-evolution-frame-apply-timeout' }
          ));
        }
      }, 8000);
      state.pendingFrameApply = {
        revision: revision,
        frameIndex: frameIndex,
        requestId: requestId,
        resolve: function (payload) {
          root.clearTimeout?.(timeoutId);
          resolve(payload);
        },
        reject: function (error) {
          root.clearTimeout?.(timeoutId);
          reject(error);
        }
      };
      var sent = runtimeClient?.sendMessage('project-evolution-apply-frame', {
        revision: revision,
        frameIndex: frameIndex,
        requestId: requestId
      });
      if (sent === false) {
        state.pendingFrameApply = null;
        root.clearTimeout?.(timeoutId);
        reject(Object.assign(
          new Error('project-evolution-frame-apply-unavailable'),
          { code: 'project-evolution-frame-apply-unavailable' }
        ));
      }
    });
  }

  function waitForFrameStable(generation) {
    var ids = getEvolutionContainmentIds();
    var wait = root.CodeXRAnalysisTableRuntime?.waitForChartsStable;
    var promise = typeof wait === 'function' && ids.length
      ? wait(ids, { timeoutMs: 12000, pollMs: 160, stablePasses: 2 })
      : Promise.resolve(true);
    return Promise.resolve(promise).catch(function () {
      if (state.playing && generation === state.playbackGeneration) {
        setStatus('Chart did not report stable in time; continuing playback.', 'info');
      }
    });
  }

  function waitOneSecond() {
    return new Promise(function (resolve) { root.setTimeout(resolve, 1000); });
  }

  async function waitBeforeNextFrame(generation) {
    if (state.frameIndex >= (state.result.frames || []).length - 1) {
      return;
    }
    setCountdownSeconds(0);
    setStatus('Waiting for chart animation to settle...', 'info');
    await waitForFrameStable(generation);
    var seconds = Math.max(
      1,
      Math.round((state.settleDelayMs || 2200) / 1000 / Math.max(0.25, state.speed))
    );
    while (
      seconds > 0
      && state.playing
      && generation === state.playbackGeneration
    ) {
      setCountdownSeconds(seconds);
      setStatus('Next frame in ' + seconds + 's...', 'info');
      await waitOneSecond();
      seconds -= 1;
    }
    setCountdownSeconds(0);
  }

  function setCountdownSeconds(seconds) {
    state.nextFrameSeconds = Math.max(0, Number(seconds) || 0);
    renderMovieCompanion();
  }

  async function seek(index, requestedViewGeneration) {
    var viewGeneration = Number.isFinite(Number(requestedViewGeneration))
      ? Number(requestedViewGeneration)
      : state.viewGeneration;
    var frames = state.result?.frames || [];
    if (
      state.applyingMapping
      || !frames.length
      || !isEvolutionViewCurrent(viewGeneration)
    ) {
      return false;
    }
    state.frameIndex = Math.max(0, Math.min(frames.length - 1, Number(index) || 0));
    var requestedFrameIndex = state.frameIndex;
    var applied = null;
    try {
      applied = await requestBridgeFrame(requestedFrameIndex);
    } catch (error) {
      if (
        error.code === 'project-evolution-frame-apply-superseded'
        || error.message === 'project-evolution-frame-apply-superseded'
        || error.code === 'project-evolution-view-released'
        || error.message === 'project-evolution-view-released'
      ) {
        return false;
      }
      setStatus(
        error instanceof Error
          ? error.message
          : 'Project evolution frame could not be applied.',
        'error'
      );
      return false;
    }
    if (
      requestedFrameIndex !== state.frameIndex
      || !isEvolutionViewCurrent(viewGeneration)
    ) {
      return false;
    }
    var appliedToChart = await applyBridgeFrameToChart(
      frames[requestedFrameIndex],
      applied.bridgeUrl,
      viewGeneration
    );
    if (!appliedToChart || !isEvolutionViewCurrent(viewGeneration)) {
      return false;
    }
    render();
    updateFrameNameplate(frames[requestedFrameIndex]);
    updatePlaybackOverlay(frames[requestedFrameIndex], frames.length, state.playing);
    return isEvolutionViewCurrent(viewGeneration);
  }

  async function scheduleNext(generation) {
    clearTimeout(state.timer);
    await waitBeforeNextFrame(generation);
    if (!state.playing || generation !== state.playbackGeneration) { return; }
    if (state.frameIndex >= (state.result.frames || []).length - 1) {
      state.playing = false;
      state.playbackGeneration += 1;
      clearTimeout(state.timer);
      state.timer = null;
      hidePlaybackOverlay();
      setStatus('Project evolution finished.', 'info');
      render();
      return;
    }
    void seek(state.frameIndex + 1).then(function () {
      if (state.playing && generation === state.playbackGeneration) {
        void scheduleNext(generation);
      }
    });
  }

// == projectEvolutionRuntime.js | transportAndRegistration (assembled per manifest.json; see COMPONENTS.md) ==
  function play() {
    if (!isEvolutionViewCurrent(state.viewGeneration)) {
      return false;
    }
    if (!state.result?.frames?.length) {
      setStatus('Generate a project evolution movie first.', 'error');
      return false;
    }
    // Safety: never start a movie while a chart/axis change is still landing.
    if (state.applyingMapping) {
      setStatus('Applying chart change - playback starts when it settles.', 'info');
      return false;
    }
    state.playbackMappingSnapshot = root.CodeXRMappingUiRuntime?.getState?.() || null;
    state.playing = true;
    state.playbackGeneration += 1;
    render();
    updatePlaybackOverlay(state.result.frames[state.frameIndex], state.result.frames.length, true);
    void scheduleNext(state.playbackGeneration);
    return true;
  }

  function stop() {
    state.playing = false;
    state.playbackGeneration += 1;
    clearTimeout(state.timer);
    state.timer = null;
    // Otherwise the last "Next frame in Ns" stays frozen on the companion.
    state.nextFrameSeconds = 0;
    hidePlaybackOverlay();
    render();
  }

  function togglePlay() {
    if (state.playing) {
      // A deliberate pause also cancels any pending auto-resume, so playback
      // never restarts behind the user's back once a lock releases.
      state.resumePlayback = false;
      stop();
    } else {
      play();
    }
  }

  // Resume playback saved by releaseEvolutionOnLeave — but only when nothing
  // holds the safety lock. Re-entering the mode re-applies the chart mapping,
  // which raises `applyingMapping`; a one-shot play() here was silently
  // rejected by that lock, so the flag stays set and setMappingApplying(false)
  // retries once the change settles.
  function tryResumePlayback() {
    if (!state.resumePlayback) { return; }
    if (state.applyingMapping || state.playing || !(state.result?.frames || []).length) { return; }
    state.resumePlayback = false;
    play();
  }

  function nextFrame() {
    if (state.applyingMapping || !isEvolutionViewCurrent(state.viewGeneration)) { return false; }
    stop();
    return seek(state.frameIndex + 1);
  }

  function previousFrame() {
    if (state.applyingMapping || !isEvolutionViewCurrent(state.viewGeneration)) { return false; }
    stop();
    return seek(state.frameIndex - 1);
  }

  function setSpeed(speed) {
    state.speed = Number(speed) || 1;
    setStatus('Playback speed: ' + state.speed + 'x', 'info');
    // Repaints both speed rows (panel + companion) so they show which speed
    // the movie is actually running at.
    render();
    if (state.playing) {
      state.playbackGeneration += 1;
      void scheduleNext(state.playbackGeneration);
    }
  }

  function isEvolutionViewCurrent(viewGeneration) {
    if (Number(viewGeneration) !== Number(state.viewGeneration)) {
      return false;
    }
    var modeState = root.CodeXRAnalysisModeRuntime?.getState?.() || {};
    if (modeState.transitioning) {
      return modeState.pendingTransitionMode === MODE;
    }
    return modeState.mode === MODE;
  }

  function invalidateEvolutionView(reason) {
    state.viewGeneration += 1;
    state.dataRefreshGeneration += 1;
    cancelEvolutionDataTransition(reason || 'project-evolution-view-released');
    if (state.pendingFrameApply?.requestId) {
      state.supersededFrameApplyIds[state.pendingFrameApply.requestId] = true;
    }
    state.pendingFrameApply?.reject?.(Object.assign(
      new Error(reason || 'project-evolution-view-released'),
      { code: reason || 'project-evolution-view-released' }
    ));
    state.pendingFrameApply = null;
    return state.viewGeneration;
  }

  function captureEvolutionState() {
    return {
      resultRevision: Number(state.result?.revision || 0),
      frameIndex: state.frameIndex,
      resumePlayback: state.resumePlayback || state.playing,
      speed: state.speed,
      activeChartId: state.activeChartId,
      timelineMode: state.timelineMode,
      rangeSide: state.rangeSide,
      startSourceId: state.startSourceId,
      endSourceId: state.endSourceId,
      manualSourceIds: state.manualSourceIds.slice()
    };
  }

  function restoreEvolutionState(snapshot) {
    if (!snapshot || typeof snapshot !== 'object') {
      return;
    }
    state.speed = Number(snapshot.speed) || state.speed;
    state.activeChartId = snapshot.activeChartId || state.activeChartId;
    state.timelineMode = snapshot.timelineMode || state.timelineMode;
    state.rangeSide = snapshot.rangeSide === 'end' ? 'end' : 'start';
    state.startSourceId = String(snapshot.startSourceId || '');
    state.endSourceId = String(snapshot.endSourceId || '');
    state.manualSourceIds = Array.isArray(snapshot.manualSourceIds)
      ? snapshot.manualSourceIds.slice()
      : [];
    if (
      state.result
      && Number(state.result.revision || 0) === Number(snapshot.resultRevision || 0)
    ) {
      state.frameIndex = Math.max(
        0,
        Math.min((state.result.frames || []).length - 1, Number(snapshot.frameIndex) || 0)
      );
      state.resumePlayback = !!snapshot.resumePlayback;
    }
  }

  // Leaving the mode, per scenario: a generation in flight is CANCELLED and
  // everything cleaned (the server aborts its workers on project-evolution-clear
  // and broadcasts -cleared, which resets the local state too); a generated
  // movie is paused, remembering whether it was playing so re-entry resumes it.
  function releaseEvolutionOnLeave() {
    invalidateEvolutionView('project-evolution-view-released');
    if (state.generating) {
      state.generating = false;
      renderGenerationProgress({ state: 'idle' });
      clearMovie();
    } else {
      state.resumePlayback = state.resumePlayback || state.playing;
    }
    stop();
    root.CodeXRAnalysisSurfaceRuntime?.preserveModeRoots?.(MODE);
    setNodeVisible(refs.frameNameplate, false);
    root.CodeXRMappingUiRuntime?.setMappingControlsEnabled?.(true, '');
    hidePlaybackOverlay();
    // Hand the chart entity targeting back to the scene: while a movie is
    // loaded the override points at the evolution chart, and leaving it in
    // place made the NORMAL analysis' chart switches and mapping applies land
    // on the parked movie chart. Re-entry re-claims it on the next frame
    // apply.
    root.CodeXRMappingUiRuntime?.setChartEntityIds?.([], { renormalize: false });
  }

  function registerCollaboration() {
    var runtimeClient = client();
    if (!runtimeClient) { return; }
    state.disposables.push(runtimeClient?.onMessage?.('project-evolution-references', handleReferences));
    state.disposables.push(runtimeClient?.onMessage?.('project-evolution-progress', handleProgress));
    state.disposables.push(runtimeClient?.onMessage?.('project-evolution-error', handleError));
    state.disposables.push(runtimeClient?.onMessage?.('project-evolution-frame-applied', handleFrameApplied));
    state.disposables.push(runtimeClient?.onMessage?.('project-evolution-cleared', function (message) {
      applyClearedState(unwrapPayload(message).message || 'Project evolution movie cleared.');
    }));
    runtimeClient?.registerEntityRuntime?.({
      entityKind: ENTITY_KIND,
      entityId: ENTITY_ID,
      applySharedState: applySharedState,
      publishInitialSharedState: function () {},
      handleCollaborationMessage: function (message) {
        if (message.type === 'entity-removed') {
          applyClearedState('Project evolution movie cleared.');
        }
      }
    });
  }

  function autoInit() {
    if (state.initialized || !doc()) { return; }
    state.initialized = true;
    state.unregisterLifecycle = root.CodeXRAnalysisModeRuntime?.register?.(MODE, {
      mappingContextId: MODE,
      captureState: captureEvolutionState,
      restoreState: function (activation) {
        if (activation?.token?.isCurrent && !activation.token.isCurrent()) {
          return;
        }
        restoreEvolutionState(activation?.savedState);
      },
      activate: function (activation) {
        if (activation?.token?.isCurrent && !activation.token.isCurrent()) {
          return false;
        }
        state.viewGeneration += 1;
        var viewGeneration = state.viewGeneration;
        root.CodeXRAnalysisSurfaceRuntime?.activateMode?.(MODE);
        state.activeChartId = state.activeChartId || getDefaultChartId();
        var mappingState = root.CodeXRMappingUiRuntime?.getState?.() || {};
        if (mappingState.chartId !== state.activeChartId && root.CodeXRMappingUiRuntime?.selectChart) {
          // UI-only: the movie pipeline applies the chart to ITS entity when
          // a frame lands. A full switch here ran while the resolved chart
          // ids still pointed at the parked NORMAL chart and converted it.
          root.CodeXRMappingUiRuntime?.selectChart(state.activeChartId, { applyToEntities: false });
        }
        // Same route the resolver below picks: with a movie, land on the
        // Field Mapping view (chart/axes left, movie companion right) —
        // without one, on the timeline selection panel.
        var activateView = state.result ? 'project-evolution.mapping' : 'project-evolution';
        root.CodeXRAnalysisControllerRuntime?.showView?.(activateView, {
          mode: MODE,
          reason: 'project-evolution-activate',
          mappingContextId: MODE
        }) || root.CodeXRMappingUiRuntime?.showPanelView?.(state.result ? 'mapping' : MODE);
        if (!state.references) {
          client()?.sendMessage?.('project-evolution-references-request', {});
        }
        if (!state.result) {
          clearChartVisualization();
          buildPanel();
          render();
          return true;
        }
        // Reclaim the preserved surface immediately. The bridge refresh below
        // may take several seconds, but the already-rendered frame is valid
        // saved state and must be visible as soon as the mode owns the table.
        var currentFrame = state.result.frames?.[state.frameIndex];
        if (currentFrame && refs.evolutionRoot) {
          ensureEvolutionRoot(currentFrame);
          refs.evolutionChart.setAttribute?.('visible', true);
          root.CodeXRMappingUiRuntime?.setChartEntityIds?.(
            getChartEntities().map(function (chart) { return chart.id; }).filter(Boolean),
            { renormalize: false }
          );
          updateFrameNameplate(currentFrame);
          updatePlaybackOverlay(currentFrame, state.result.frames.length, false);
        }
        // A preserved pipeline already represents this exact frame. Re-entry
        // remounts it without a server request or datasource refresh.
        var hasPreservedFrame = !!(
          refs.evolutionRoot
          && refs.evolutionDataSource
          && refs.evolutionTreeBuilder
          && refs.evolutionChart
          && Number(state.appliedResultRevision) === Number(state.result.revision)
          && Number(state.appliedFrameIndex) === Number(state.frameIndex)
        );
        var activation = hasPreservedFrame
          ? Promise.resolve(waitForEvolutionContainmentStable(viewGeneration))
          : Promise.resolve(seek(state.frameIndex, viewGeneration));
        return activation.then(function (applied) {
          if (!isEvolutionViewCurrent(viewGeneration)) {
            return false;
          }
          if (applied) {
            tryResumePlayback();
          } else {
            state.resumePlayback = false;
          }
          return applied;
        });
      },
      deactivate: function () {
        releaseEvolutionOnLeave();
      },
      // With a generated movie the mode lives on the Field Mapping view
      // (mapping controls + movie companion); otherwise on its selection
      // panel. getDefaultControllerViewForMode and the authoritative server
      // echo both consult this, so local and echoed routing cannot disagree
      // — same contract as historical-compare.
      resolveControllerView: function () {
        return state.result ? 'project-evolution.mapping' : 'project-evolution';
      }
    }) || null;
    registerModeOption();
    buildPanel();
    void configureAvailability();
    registerCollaboration();
    doc().addEventListener?.('codexr-mapping-confirmed', onMappingConfirmed);
  }

  var runtime = {
    autoInit: autoInit,
    openSelection: openSelection,
    start: startSelectedTimeline,
    clear: clearMovie,
    play: play,
    pause: stop,
    seek: seek,
    __testing: {
      isHierarchicalBoatsChart: isHierarchicalBoatsChart,
      frameUrlWithCache: frameUrlWithCache,
      bridgeUrl: bridgeUrl,
      projectEvolutionContainmentProfile: projectEvolutionContainmentProfile,
      getActiveMappingForChart: getActiveMappingForChart,
      getSuggestedAutoOrderById: getSuggestedAutoOrderById,
      // Declarative chart construction is exercised directly so the movie
      // cannot regress to cloning the parked Single chart.
      buildEvolutionChart: buildEvolutionChart,
      namespaceEvolutionTreeNodes: namespaceEvolutionTreeNodes,
      getDefaultChartId: getDefaultChartId,
      releaseEvolutionVisualization: releaseEvolutionVisualization,
      // The passive-entity contract (a movie snapshot must never steal the
      // table from another mode) is asserted by CALLING this, not by reading
      // its source.
      applySharedState: applySharedState,
      // Offline movie generation from exported git payloads: asserted by
      // building frames for each timeline mode, not by reading source.
      buildOfflineFrames: buildOfflineFrames,
      synthesizeOfflineEvolutionReferences: synthesizeOfflineEvolutionReferences
    },
    getState: function () {
      return {
        availability: state.availability,
        status: state.status,
        result: state.result,
        frameIndex: state.frameIndex,
        playing: state.playing,
        speed: state.speed,
        // Interlock observability: which safety state is holding playback.
        generating: state.generating,
        applyingMapping: state.applyingMapping,
        resumePlayback: state.resumePlayback,
        appliedFrameIndex: state.appliedFrameIndex,
        appliedResultRevision: state.appliedResultRevision
      };
    },
    destroy: function () {
      stop();
      releaseEvolutionVisualization();
      state.disposables.forEach(function (dispose) { dispose?.(); });
      state.disposables = [];
      doc().removeEventListener?.('codexr-mapping-confirmed', onMappingConfirmed);
      state.unregisterModeOption?.();
      state.unregisterLifecycle?.();
      state.unregisterPanelView?.();
      state.unregisterMappingCompanion?.();
      state.unregisterMappingCompanion = null;
      refs.companionRoot = null;
      // The overlay only exists once playback has run at least once.
      refs.playbackOverlay?.parentNode?.removeChild?.(refs.playbackOverlay);
      refs.playbackOverlay = null;
      state.initialized = false;
    }
  };

  if (doc()) {
    if (doc().readyState === 'loading') {
      doc().addEventListener('DOMContentLoaded', autoInit, { once: true });
    } else {
      autoInit();
    }
  }
  root.CodeXRProjectEvolutionRuntime = runtime;
})(typeof window !== 'undefined' ? window : this);
