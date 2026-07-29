// == historicalComparisonRuntime.js | stateAndInteractionGuards (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRHistoricalComparisonRuntime(root) {
  'use strict';

  var ENTITY_KIND = 'historical-comparison';
  var ENTITY_ID = 'main';
  var state = {
    initialized: false,
    panelVisible: false,
    references: null,
    activeSide: 'left',
    availability: 'loading',
    unavailableReason: 'Checking Git history availability...',
    selected: { left: 'working-copy', right: '' },
    result: null,
    payloads: { left: [], right: [] },
    selectedMapping: {},
    status: '',
    statusLevel: 'info',
    disposables: [],
    unregisterPanelView: null,
    unregisterMappingCompanion: null,
    unregisterLifecycle: null,
    unregisterModeOption: null,
    loadGeneration: 0
  };
  var refs = {};
  var RAYCAST_CLASS = 'babiaxraycasterclass';
  var RAYCAST_SUSPENDED_ATTRIBUTE = 'data-codexr-raycast-suspended';
  var CHART_ID_BY_COMPONENT = {
    'babia-bars': 'bars',
    'babia-barsmap': 'barsmap',
    'babia-cyls': 'cyls',
    'babia-cylsmap': 'cylsmap',
    'babia-pie': 'pie',
    'babia-doughnut': 'donut',
    'babia-bubbles': 'bubbles',
    'babia-boats': 'boats'
  };
  var CHART_COMPONENT_NAMES = Object.keys(CHART_ID_BY_COMPONENT);

  function getDocument() {
    return root.document;
  }

  function getConfig() {
    var script = getDocument()?.getElementById('codexr-tooling-config-xr-mapping-ui');
    if (!script) {
      return null;
    }
    try {
      return JSON.parse(script.textContent || '{}');
    } catch {
      return null;
    }
  }

  function getClient() {
    return root.CodeXRCollaborationRuntime?.getClient?.(root) || null;
  }

  function isHistoricalModeActiveOrActivating() {
    var modeState = root.CodeXRAnalysisModeRuntime?.getState?.();
    if (modeState?.transitioning) {
      return modeState?.pendingTransitionMode === 'historical-compare';
    }
    return modeState?.mode === 'historical-compare';
  }

  var HISTORICAL_UNAVAILABLE_REASON = 'Historical comparison requires a local Git repository.';

  async function configureAvailability() {
    var picker = root.CodeXRGitRefPickerRuntime;
    var capabilities = picker?.resolveCapabilities ? await picker.resolveCapabilities() : {};
    var enabled = capabilities.historicalComparison === true;
    state.availability = enabled ? 'enabled' : 'disabled';
    state.unavailableReason = enabled
      ? ''
      : String(capabilities.historicalComparisonReason || HISTORICAL_UNAVAILABLE_REASON);
    registerHistoricalModeOption();
  }

  // Delegates to the shared Git-gated mode registration so both Git analyses
  // gate their controller option through one path.
  function registerHistoricalModeOption() {
    state.unregisterModeOption?.();
    state.unregisterModeOption = root.CodeXRGitRefPickerRuntime?.registerGitGatedMode?.({
      modeId: 'historical-compare',
      label: 'Historical comparison',
      color: '#be123c',
      capabilityKey: 'historicalComparison',
      enabled: state.availability === 'enabled',
      reasonFallback: state.unavailableReason || HISTORICAL_UNAVAILABLE_REASON,
      onSelect: selectHistoricalMode
    }) || null;
  }

  function createEntity(tagName, attributes) {
    var entity = getDocument().createElement(tagName);
    Object.keys(attributes || {}).forEach(function (key) {
      entity.setAttribute(key, attributes[key]);
    });
    return entity;
  }

  function suspendRaycastInteraction(rootEntity) {
    if (!rootEntity) {
      return;
    }
    function suspendEntity(entity) {
      if (!entity?.classList?.contains(RAYCAST_CLASS)) {
        return;
      }
      entity.classList.remove(RAYCAST_CLASS);
      entity.setAttribute(RAYCAST_SUSPENDED_ATTRIBUTE, 'true');
    }
    suspendEntity(rootEntity);
    rootEntity.querySelectorAll?.('.' + RAYCAST_CLASS).forEach(suspendEntity);
    refs.originalInteractionObserver?.disconnect?.();
    if (typeof root.MutationObserver !== 'function') {
      return;
    }
    refs.originalInteractionObserver = new root.MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (node?.nodeType !== 1) {
              return;
            }
            suspendEntity(node);
            node.querySelectorAll?.('.' + RAYCAST_CLASS).forEach(suspendEntity);
          });
          return;
        }
        if (mutation.type === 'attributes') {
          suspendEntity(mutation.target);
        }
      });
    });
    refs.originalInteractionObserver.observe(rootEntity, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class']
    });
  }

  function restoreRaycastInteraction(rootEntity) {
    refs.originalInteractionObserver?.disconnect?.();
    refs.originalInteractionObserver = null;
    if (!rootEntity) {
      return;
    }
    var suspended = [];
    if (rootEntity.getAttribute?.(RAYCAST_SUSPENDED_ATTRIBUTE) === 'true') {
      suspended.push(rootEntity);
    }
    rootEntity.querySelectorAll?.('[' + RAYCAST_SUSPENDED_ATTRIBUTE + '="true"]').forEach(function (entity) {
      suspended.push(entity);
    });
    suspended.forEach(function (entity) {
      entity.classList?.add(RAYCAST_CLASS);
      entity.removeAttribute?.(RAYCAST_SUSPENDED_ATTRIBUTE);
    });
  }

  function collectConfiguredIds(config, keys) {
    var ids = [];
    keys.forEach(function (key) {
      var value = config?.[key];
      if (Array.isArray(value)) {
        value.forEach(function (id) { if (id) { ids.push(String(id)); } });
      } else if (value) {
        ids.push(String(value));
      }
    });
    return ids;
  }

  function uniqueElements(elements) {
    return elements.filter(function (element, index) {
      return !!element && elements.indexOf(element) === index;
    });
  }

  function getNormalVisualizationRoots(config) {
    var document = getDocument();
    if (!document) { return []; }
    var roots = [];
    collectConfiguredIds(config || getConfig(), [
      'normalEntityIds',
      'visualizationEntityIds',
      'chartEntityIds',
      'chartEntityId',
      'chartId'
    ]).forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) { roots.push(element); }
    });
    if (config?.chartSelector && typeof document.querySelector === 'function') {
      var selected = document.querySelector(config.chartSelector);
      if (selected) { roots.push(selected); }
    }
    document.querySelectorAll?.('[data-codexr-normal-root="true"], [data-codexr-normal-visualization="true"]')
      .forEach(function (element) { roots.push(element); });
    return uniqueElements(roots);
  }

  function getTemplateChart(config) {
    var document = getDocument();
    if (!document) { return null; }
    if (config?.chartEntityId) {
      return document.getElementById(config.chartEntityId);
    }
    if (Array.isArray(config?.chartEntityIds) && config.chartEntityIds.length) {
      return document.getElementById(config.chartEntityIds[0]);
    }
    return getNormalVisualizationRoots(config)[0] || null;
  }

  function getNormalMappingTargetIds(config) {
    var ids = collectConfiguredIds(config, ['chartEntityIds', 'chartEntityId', 'chartId']);
    if (!ids.length) {
      ids = getNormalVisualizationRoots(config)
        .map(function (element) { return element.id; })
        .filter(Boolean);
    }
    return Array.from(new Set(ids));
  }

// == historicalComparisonRuntime.js | chartParkingAndUiHelpers (assembled per manifest.json; see COMPONENTS.md) ==
  function parkOriginalChart(original) {
    if (root.CodeXRAnalysisSurfaceRuntime?.setNormalVisible) {
      root.CodeXRAnalysisSurfaceRuntime.setNormalVisible(false);
      refs.originalCharts = [];
      if (original) { suspendRaycastInteraction(original); }
      return;
    }
    var roots = getNormalVisualizationRoots(getConfig());
    if (original && !roots.includes(original)) {
      roots.push(original);
    }
    refs.originalCharts = uniqueElements(roots);
    refs.originalCharts.forEach(function (element) {
      suspendRaycastInteraction(element);
      element.setAttribute?.('visible', false);
    });
  }

  function restoreOriginalChart() {
    if (root.CodeXRAnalysisSurfaceRuntime?.setNormalVisible) {
      if (root.CodeXRAnalysisModeRuntime?.getState?.().mode === 'single') {
        root.CodeXRAnalysisSurfaceRuntime.setNormalVisible(true);
      }
      var original = getTemplateChart(getConfig());
      restoreRaycastInteraction(original);
      refs.originalCharts = null;
      return original;
    }
    var originals = Array.isArray(refs.originalCharts) ? refs.originalCharts : [];
    if (!originals.length) {
      return null;
    }
    if (root.CodeXRAnalysisModeRuntime?.getState?.().mode === 'single') {
      originals.forEach(function (element) {
        element.setAttribute?.('visible', true);
      });
    }
    originals.forEach(restoreRaycastInteraction);
    refs.originalCharts = null;
    return originals[0] || null;
  }

  function restoreOriginalChartMapping(config) {
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    var ids = getNormalMappingTargetIds(config);
    if (!ids.length || !mappingRuntime?.setChartEntityIds) {
      return;
    }
    mappingRuntime.setChartEntityIds(ids, { renormalize: false });
    mappingRuntime.switchMappingContext?.('normal-analysis', {
      reason: 'historical-restore-normal-targets',
      applyToEntities: false
    });
  }

  function setText(entity, value, width, color) {
    var target = entity?._codexrLabel || entity;
    if (!target) {
      return;
    }
    if (String(target.tagName || '').toLowerCase() === 'a-text') {
      target.setAttribute('value', String(value || ''));
      target.setAttribute('width', width || 3);
      target.setAttribute('color', color || '#ffffff');
      return;
    }
    target.setAttribute('text', {
      value: String(value || ''),
      align: 'center',
      color: color || '#ffffff',
      width: width || 3,
      baseline: 'center',
      wrapCount: 38
    });
  }

  function createText(value, position, width, color, align, wrapCount) {
    return createEntity('a-text', {
      value: String(value || ''),
      position: position || '0 0 0.03',
      width: width || 5.8,
      color: color || '#ffffff',
      align: align || 'center',
      baseline: 'center',
      'wrap-count': wrapCount || 38
    });
  }

  function setStatus(message, level) {
    state.status = String(message || '');
    state.statusLevel = level || 'info';
    refs.status?.setAttribute('value', state.status);
    refs.status?.setAttribute(
      'color',
      state.statusLevel === 'error' ? '#fca5a5' : '#fde68a'
    );
    refs.status?.setAttribute('visible', !!state.status);
  }

  function buildButton(label, position, width, height, onClick, color, textWidth) {
    var button = createEntity('a-plane', {
      position: position,
      width: width || 1.35,
      height: height || 0.3,
      material: 'color: ' + (color || '#1e3a5f') + '; opacity: 0.96; shader: flat',
      class: 'babiaxraycasterclass codexr-history-button',
      'data-codexr-interactive': 'true'
    });
    button._codexrLabel = createText(
      label,
      '0 0 0.02',
      textWidth || Math.max(2.2, (width || 1.35) * 1.85)
    );
    button.appendChild(button._codexrLabel);
    button.addEventListener('click', onClick);
    return button;
  }

// == historicalComparisonRuntime.js | offlineGitData (assembled per manifest.json; see COMPONENTS.md) ==
  // Real offline comparisons for self-contained exports.
  //
  // When the export shipped per-revision payloads (manifest.gitData), the
  // selection panel lists the exported sources through the normal picker and
  // Compare builds the comparison HERE: fetch both payloads, compute the four
  // delta counters the XR scene actually reads (delta.metrics is LivePanel
  // territory), and ride the exact applySharedState path a live result uses.

  function getOfflineGitData() {
    var manifest = getClient()?.getOfflineExportManifest?.();
    var gitData = manifest?.gitData;
    return gitData && Array.isArray(gitData.references?.sources) ? gitData : null;
  }

  function getOfflineTargetType() {
    var manifest = getClient()?.getOfflineExportManifest?.();
    return String(manifest?.target?.type || 'directory');
  }

  function synthesizeOfflineHistoricalReferences(gitData) {
    var sources = gitData.references.sources.filter(function (source) {
      return source && Number(source.itemCount || 0) > 0 && !!resolveOfflinePayloadUrl(gitData, source.id);
    });
    return {
      repositoryRoot: gitData.references.repositoryRoot || '',
      targetRelativePath: gitData.references.targetRelativePath || '',
      workingTreeDirty: gitData.references.workingTreeDirty === true,
      activeBranch: gitData.references.activeBranch || null,
      sources: sources,
      pageSize: gitData.references.pageSize || 5,
      activeRequest: null
    };
  }

  function resolveOfflineSource(gitData, sourceId) {
    return gitData.references.sources.find(function (source) {
      return source && source.id === sourceId;
    }) || null;
  }

  function resolveOfflinePayloadUrl(gitData, sourceId) {
    if (sourceId === 'working-copy') {
      return gitData.workingCopyPayloadUrl || null;
    }
    var source = resolveOfflineSource(gitData, sourceId);
    return source ? String(source.payloadUrl || '') || null : null;
  }

  // Port of the server's buildDelta counters + entriesHaveMetricChanges
  // (historicalComparisonService.ts). metrics stays empty: the XR companion
  // computes its metric table from the live mapping over state.payloads.
  var OFFLINE_DELTA_IGNORED_FIELDS = {
    comparisonKey: true, evolutionKey: true, filePath: true, treePath: true,
    timestamp: true, status: true, lineStart: true, lineEnd: true,
    fileName: true, functionName: true, relativePath: true
  };

  function offlineEntriesDiffer(left, right, targetType) {
    var keys = {};
    Object.keys(left || {}).forEach(function (key) { keys[key] = true; });
    Object.keys(right || {}).forEach(function (key) { keys[key] = true; });
    var names = Object.keys(keys);
    for (var index = 0; index < names.length; index += 1) {
      var key = names[index];
      if (OFFLINE_DELTA_IGNORED_FIELDS[key]) {
        continue;
      }
      var leftValue = left ? left[key] : undefined;
      var rightValue = right ? right[key] : undefined;
      if (
        (typeof leftValue === 'number' || typeof rightValue === 'number')
        && Number(leftValue || 0) !== Number(rightValue || 0)
      ) {
        return true;
      }
      if (
        targetType === 'file'
        && typeof leftValue === 'string'
        && typeof rightValue === 'string'
        && leftValue !== rightValue
      ) {
        return true;
      }
    }
    return false;
  }

  function buildOfflineDelta(leftEntries, rightEntries, targetType) {
    var leftByKey = new Map();
    (leftEntries || []).forEach(function (entry) {
      leftByKey.set(String(entry?.comparisonKey || ''), entry);
    });
    var rightByKey = new Map();
    (rightEntries || []).forEach(function (entry) {
      rightByKey.set(String(entry?.comparisonKey || ''), entry);
    });
    var added = 0;
    var removed = 0;
    var modified = 0;
    var unchanged = 0;
    leftByKey.forEach(function (leftEntry, key) {
      var rightEntry = rightByKey.get(key);
      if (!rightEntry) {
        removed += 1;
      } else if (offlineEntriesDiffer(leftEntry, rightEntry, targetType)) {
        modified += 1;
      } else {
        unchanged += 1;
      }
    });
    rightByKey.forEach(function (_rightEntry, key) {
      if (!leftByKey.has(key)) {
        added += 1;
      }
    });
    return { added: added, removed: removed, modified: modified, unchanged: unchanged, metrics: [] };
  }

  async function fetchOfflinePayload(url) {
    var response = await fetch(String(url), { cache: 'no-store' });
    if (!response.ok) {
      throw new Error('An exported revision payload could not be loaded.');
    }
    var payload = await response.json();
    if (
      !Array.isArray(payload)
      || !payload.some(function (entry) {
        return entry && typeof entry === 'object' && !Array.isArray(entry);
      })
    ) {
      throw new Error('The exported revision contains no usable analysis data.');
    }
    return payload.filter(function (entry) {
      return entry && typeof entry === 'object' && !Array.isArray(entry);
    });
  }

  async function startOfflineGitComparison() {
    var gitData = getOfflineGitData();
    if (!gitData) {
      return;
    }
    var leftUrl = resolveOfflinePayloadUrl(gitData, state.selected.left);
    var rightUrl = resolveOfflinePayloadUrl(gitData, state.selected.right);
    if (!leftUrl || !rightUrl) {
      setStatus('One of the selected revisions is not part of this export.', 'error');
      return;
    }
    try {
      setStatus('Comparing exported revisions...', 'info');
      var payloads = await Promise.all([fetchOfflinePayload(leftUrl), fetchOfflinePayload(rightUrl)]);
      var targetType = getOfflineTargetType();
      state.offlineCompareRevision = (state.offlineCompareRevision || 0) + 1;
      var result = {
        revision: state.offlineCompareRevision,
        mode: 'historical-compare',
        left: {
          source: resolveOfflineSource(gitData, state.selected.left)
            || { id: state.selected.left, kind: 'workingCopy', label: 'Working copy' },
          url: leftUrl,
          itemCount: payloads[0].length,
          missingTarget: false,
          warnings: []
        },
        right: {
          source: resolveOfflineSource(gitData, state.selected.right)
            || { id: state.selected.right, kind: 'workingCopy', label: 'Working copy' },
          url: rightUrl,
          itemCount: payloads[1].length,
          missingTarget: false,
          warnings: []
        },
        delta: buildOfflineDelta(payloads[0], payloads[1], targetType),
        generatedAt: new Date().toISOString()
      };
      await applySharedState({
        entityKind: 'historical-comparison',
        entityId: 'main',
        mode: 'historical-compare',
        result: result
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), 'error');
    }
  }

// == historicalComparisonRuntime.js | selectionPanel (assembled per manifest.json; see COMPONENTS.md) ==
  // The Git source selector embeds the shared CodeXRGitRefPickerRuntime picker
  // in 'compare' mode (two slots + category tabs); this file only owns the
  // history-specific chrome around it (selection detail, Back/Compare
  // actions, status) and the compare message plumbing.
  function buildPanel() {
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    var pickerRuntime = root.CodeXRGitRefPickerRuntime;
    if (
      !mappingRuntime?.registerPanelView
      || !mappingRuntime.isPanelReady?.()
      || !pickerRuntime?.createPicker
      || refs.panel
    ) {
      return !!refs.panel;
    }
    refs.panel = createEntity('a-entity', {
      id: 'codexrHistoricalComparisonPanel',
      position: '0 0 0.04',
      visible: false
    });

    refs.sourceRoot = createEntity('a-entity', { position: '0 0 0.02', visible: true });

    refs.picker = root.CodeXRGitRefPickerRuntime.createPicker({
      mode: 'compare',
      pageSize: 7,
      slotsY: 2.3,
      tabsY: 1.75,
      listY: 0.9,
      listTopY: 0.32,
      rowGap: 0.32,
      pagerY: -1.5,
      rowClass: 'codexr-history-button',
      slots: [
        { id: 'left', label: 'LEFT', color: '#164e63', activeColor: '#67e8f9' },
        { id: 'right', label: 'RIGHT', color: '#166534', activeColor: '#6ee7b7' }
      ],
      slotSelection: function (slotId) { return state.selected[slotId]; },
      resolveRowState: function (source, ctx) {
        return { selected: state.selected[ctx.activeSlot] === source.id, color: '#be123c' };
      },
      onSelect: function (sourceId, slotId) {
        state.selected[slotId] = sourceId;
        renderSelectionDetail();
      },
      onSlotChange: function (slotId) {
        state.activeSide = slotId;
        renderSelectionDetail();
      }
    });
    refs.sourceRoot.appendChild(refs.picker.el);

    refs.selectionDetail = createText('', '0 -1.02 0.02', 5.45, '#cbd5e1', 'center', 52);
    refs.status = createText('', '-2.82 -1.98 0.02', 5.65, '#fde68a', 'left', 42);
    refs.status.setAttribute('visible', false);

    refs.sourceRoot.appendChild(refs.selectionDetail);
    // Two centred actions: Back and Compare (the old third 'Axes' shortcut was
    // removed — the mapping/axes view is reached automatically after Compare).
    refs.sourceRoot.appendChild(buildButton('Back', '-0.75 -2.4 0.02', 1.3, 0.38, function () {
      root.CodeXRAnalysisModeRuntime?.openSelector?.();
    }, '#475569'));
    refs.sourceRoot.appendChild(buildButton('Compare', '0.75 -2.4 0.02', 1.3, 0.38, startComparison, '#be123c'));

    refs.panel.appendChild(refs.sourceRoot);
    refs.panel.appendChild(refs.status);
    buildMappingCompanion(mappingRuntime);
    state.unregisterPanelView = mappingRuntime.registerPanelView({
      id: 'historical-selection',
      title: 'History comparison',
      headerButton: false,
      panelHeight: 6.45,
      content: refs.panel,
      onShow: function () {
        state.panelVisible = true;
        showSourceSelection();
      },
      onHide: function () {
        state.panelVisible = false;
      }
    });
    return true;
  }

  function openPanel() {
    if (!buildPanel()) {
      setTimeout(openPanel, 100);
      return;
    }
    root.CodeXRMappingUiRuntime?.showPanelView?.('historical-selection');
  }

  function closePanel() {
    state.panelVisible = false;
    if (root.CodeXRAnalysisControllerRuntime.showView) {
      root.CodeXRAnalysisControllerRuntime.showView('historical.mapping', {
        mode: 'historical-compare',
        mappingContextId: 'historical-comparison',
        reason: 'historical-comparison-ready'
      });
      return;
    }
    root.CodeXRMappingUiRuntime?.showPanelView?.('mapping');
  }

  function showSourceSelection() {
    if (state.availability !== 'enabled') {
      setStatus(state.unavailableReason, 'error');
      return;
    }
    refs.sourceRoot?.setAttribute('visible', true);
    refs.status?.setAttribute('position', '-2.82 -2.17 0.02');
    root.CodeXRMappingUiRuntime?.setPanelViewTitle?.('historical-selection', 'History comparison');
    root.CodeXRMappingUiRuntime?.setPanelViewHeight?.('historical-selection', 6.45);
    // An exported copy has no git or Python behind it. With exported
    // per-revision payloads (gitData) the panel works for real: the picker
    // lists the exported sources and Compare composes any pair locally.
    // Without them, fall back to replaying the computed comparisons.
    if (getClient()?.isOfflineExport?.()) {
      var offlineGitData = getOfflineGitData();
      if (offlineGitData) {
        state.references = synthesizeOfflineHistoricalReferences(offlineGitData);
        renderReferences();
        setStatus('Offline export: pick any two exported revisions and press Compare.', 'info');
        return;
      }
      showOfflineReplayStatus();
      return;
    }
    setStatus('Loading local Git references...', 'info');
    var client = getClient();
    if (!client?.sendMessage?.('historical-comparison-references-request', {})) {
      setStatus('Collaboration connection is not ready.', 'error');
    }
  }

  // Feeds the shared picker with the latest references and refreshes the
  // history-specific selection detail. Called whenever references arrive.
  function renderReferences() {
    if (!refs.picker) {
      return;
    }
    var allSources = Array.isArray(state.references?.sources) ? state.references.sources : [];
    if (!state.selected.right) {
      state.selected.right = allSources.find(function (source) {
        return source.id !== 'working-copy';
      })?.id || 'working-copy';
    }
    refs.picker.setReferences(state.references);
    renderSelectionDetail();
  }

  function renderSelectionDetail() {
    if (!refs.selectionDetail) {
      return;
    }
    var allSources = Array.isArray(state.references?.sources) ? state.references.sources : [];
    var active = allSources.find(function (source) {
      return source.id === state.selected[state.activeSide];
    });
    refs.selectionDetail.setAttribute('value', buildSelectionDetail(active));
    refs.picker?.render();
  }

  function buildSelectionDetail(source) {
    if (!source) {
      return 'No source selected';
    }
    var described = root.CodeXRGitRefPickerRuntime.describeSource(source);
    if (described.isLive) {
      return described.label + '\nWorking copy';
    }
    var subject = described.subject ? '\n' + described.subject : '';
    return truncate(described.label + '\n' + described.date + subject, 112);
  }

  function truncate(value, limit) {
    var text = String(value || '');
    return text.length > limit ? text.slice(0, Math.max(1, limit - 3)) + '...' : text;
  }

  // ── Field Mapping child section (mapping companion) ───────────────────────
  // A right-column child of the Field Mapping view for this analysis, laid out
  // as a framed card that fills the column: section title, two colour-coded
  // side chips, a per-axis-metric comparison table (left / right / difference —
  // always the metrics currently mapped to the chart axes, read live from the
  // mapping-ui), a 2×2 file-delta dashboard, and a Change comparison action.
  // Built once; updated attribute-only (the panel's childList observer must
  // not see node churn — same rule as the pooled Git ref rows).

  var COMPANION_METRIC_ROWS = 5;
  // Right-column x columns (companion root at the column centre, ~3.1 wide;
  // everything is centred inside the framing card, content within ±1.4).
  var COMP_COL = { name: -1.4, left: -0.1, right: 0.55, diff: 1.15 };
  var COMPANION_CARD_W = 2.98;   // framing card width
  var COMPANION_TABLE_W = 2.82;  // header bar / zebra row width
  var COMPANION_ROW_GAP = 0.32;
  var COMPANION_STAT_META = [
    { key: 'added', label: 'Added', color: '#4ade80' },
    { key: 'removed', label: 'Removed', color: '#f87171' },
    { key: 'modified', label: 'Modified', color: '#fbbf24' },
    { key: 'unchanged', label: 'Unchanged', color: '#94a3b8' }
  ];

  function compText(value, position, width, color, align, wrapCount) {
    return createText(value, position, width, color, align || 'left', wrapCount || 18);
  }

  function setRowVisible(el, visible) {
    if (!el) { return; }
    if (el.object3D) { el.object3D.visible = !!visible; }
    el.setAttribute('visible', visible ? 'true' : 'false');
  }

  function formatMetricValue(value) {
    var n = Number(value) || 0;
    var abs = Math.abs(n);
    if (abs >= 100000) { return (n / 1000).toFixed(0) + 'k'; }
    if (abs >= 1000) { return (n / 1000).toFixed(1) + 'k'; }
    return (Math.round(n * 10) / 10).toString();
  }

  function buildMappingCompanion(mappingRuntime) {
    if (refs.companionRoot || !mappingRuntime?.registerMappingCompanion) {
      return;
    }
    refs.companionRoot = createEntity('a-entity', {});

    // Framing card (border behind a subtle fill) so the column reads as one
    // cohesive section instead of loose elements floating on the panel.
    refs.companionCardBorder = createEntity('a-plane', {
      position: '0 0 -0.04', width: COMPANION_CARD_W + 0.06, height: 1,
      material: 'color: #2b3a55; opacity: 0.55; shader: flat'
    });
    refs.companionCard = createEntity('a-plane', {
      position: '0 0 -0.03', width: COMPANION_CARD_W, height: 1,
      material: 'color: #0e1526; opacity: 0.66; shader: flat'
    });
    refs.companionRoot.appendChild(refs.companionCardBorder);
    refs.companionRoot.appendChild(refs.companionCard);

    // Section title + accent underline.
    refs.companionTitle = createText('COMPARISON', '0 0 0.01', 2.3, '#f9a8d4', 'center', 22);
    refs.companionUnderline = createEntity('a-plane', {
      position: '0 0 -0.005', width: 2.4, height: 0.012,
      material: 'color: #f472b6; opacity: 0.85; shader: flat'
    });
    refs.companionRoot.appendChild(refs.companionTitle);
    refs.companionRoot.appendChild(refs.companionUnderline);

    // Side chips: which branch is on each axis side (colour-coded, full width).
    refs.companionLeftChip = buildSideChip('#0e3a4a', '#67e8f9', 'LEFT');
    refs.companionRightChip = buildSideChip('#123524', '#6ee7b7', 'RIGHT');
    refs.companionRoot.appendChild(refs.companionLeftChip.root);
    refs.companionRoot.appendChild(refs.companionRightChip.root);

    // Table header bar + column labels (y set in positionMappingCompanion).
    refs.companionHeaderBar = createEntity('a-plane', {
      position: '0 0 -0.008', width: COMPANION_TABLE_W, height: 0.3,
      material: 'color: #1e293b; opacity: 0.75; shader: flat'
    });
    refs.companionRoot.appendChild(refs.companionHeaderBar);
    refs.companionHeader = {
      name: createText('Metric', COMP_COL.name + ' 0 0.01', 1.0, '#94a3b8', 'left', 12),
      left: createText('L', COMP_COL.left + ' 0 0.01', 0.5, '#67e8f9', 'center', 6),
      right: createText('R', COMP_COL.right + ' 0 0.01', 0.5, '#6ee7b7', 'center', 6),
      diff: createText('Diff', COMP_COL.diff + ' 0 0.01', 0.7, '#fde68a', 'center', 8)
    };
    refs.companionRoot.appendChild(refs.companionHeader.name);
    refs.companionRoot.appendChild(refs.companionHeader.left);
    refs.companionRoot.appendChild(refs.companionHeader.right);
    refs.companionRoot.appendChild(refs.companionHeader.diff);

    // Pooled metric rows, each with a zebra background (y set later).
    refs.companionRows = [];
    for (var i = 0; i < COMPANION_METRIC_ROWS; i += 1) {
      var row = createEntity('a-entity', { position: '0 0 0', visible: 'false' });
      row.appendChild(createEntity('a-plane', {
        position: '0 0 -0.006', width: COMPANION_TABLE_W, height: COMPANION_ROW_GAP,
        material: 'color: #1e293b; opacity: ' + (i % 2 === 0 ? 0.32 : 0.12) + '; shader: flat'
      }));
      row.__name = compText('', COMP_COL.name + ' 0 0', 1.0, '#e2e8f0', 'left', 13);
      row.__left = compText('', COMP_COL.left + ' 0 0', 0.62, '#a5f3fc', 'center', 8);
      row.__right = compText('', COMP_COL.right + ' 0 0', 0.62, '#a7f3d0', 'center', 8);
      row.__diff = compText('', COMP_COL.diff + ' 0 0', 0.7, '#cbd5e1', 'center', 9);
      row.appendChild(row.__name);
      row.appendChild(row.__left);
      row.appendChild(row.__right);
      row.appendChild(row.__diff);
      refs.companionRoot.appendChild(row);
      refs.companionRows.push(row);
    }
    refs.companionVisibleRows = 0;

    // Placeholder shown when no metric is mapped to the axes yet.
    refs.companionEmpty = createText('Map metrics to the chart axes to compare them here', '0 0 0.01', 2.4, '#64748b', 'center', 26);
    setRowVisible(refs.companionEmpty, false);
    refs.companionRoot.appendChild(refs.companionEmpty);

    // File-delta dashboard: a "Files changed" heading over four stat cells
    // (Added / Removed / Modified / Unchanged) so it's clear the counts are
    // files. Values filled in updateMappingCompanion.
    refs.companionFilesLabel = createText('Files (right vs left)', '0 0 0.01', 2.1, '#cbd5e1', 'center', 24);
    refs.companionRoot.appendChild(refs.companionFilesLabel);
    refs.companionStats = COMPANION_STAT_META.map(function (meta) {
      var cell = buildStatCell(meta.label, meta.color);
      refs.companionRoot.appendChild(cell.root);
      return cell;
    });

    // Change comparison action (pinned near the bottom of the card).
    refs.companionButton = buildButton('Change comparison', '0 0 0', 2.5, 0.38, changeComparison, '#be123c', 3.2);
    refs.companionRoot.appendChild(refs.companionButton);

    positionMappingCompanion();

    state.unregisterMappingCompanion = mappingRuntime.registerMappingCompanion('historical-comparison', {
      content: refs.companionRoot,
      placement: 'side',
      width: 3.1,
      title: 'Field Mapping - History comparison',
      layout: layoutMappingCompanion
    }) || null;
    updateMappingCompanion();
  }

  // The mapping panel is much taller than the comparison content, so distribute
  // it across the full framing card: title + chips near the top, the metric
  // table centred in the free middle, and the file dashboard + Change
  // comparison pinned near the bottom. Runs on panel (re)layout (layout
  // callback) and when the visible-row count changes — attribute-only.
  function layoutMappingCompanion(availableHeight) {
    var h = Number(availableHeight) || 0;
    if (h > 0) {
      refs.companionHeight = h;
    }
    positionMappingCompanion();
  }

  function positionMappingCompanion() {
    if (!refs.companionRoot) {
      return;
    }
    var h = Number(refs.companionHeight) || 6.45;
    var cardTop = 0.12;
    var cardBottom = -(h - 0.18);
    var cardHeight = cardTop - cardBottom;
    var cardCentre = (cardTop + cardBottom) / 2;

    // Framing card fills the whole column.
    refs.companionCard.setAttribute('height', Math.max(0.6, cardHeight));
    refs.companionCard.setAttribute('position', '0 ' + cardCentre + ' -0.03');
    refs.companionCardBorder.setAttribute('height', Math.max(0.6, cardHeight) + 0.06);
    refs.companionCardBorder.setAttribute('position', '0 ' + cardCentre + ' -0.04');

    // Top group: title + underline + the two side chips.
    var titleY = cardTop - 0.28;
    refs.companionTitle.setAttribute('position', '0 ' + titleY + ' 0.01');
    refs.companionUnderline.setAttribute('position', '0 ' + (titleY - 0.17) + ' -0.005');
    var leftChipY = titleY - 0.5;
    var rightChipY = leftChipY - 0.36;
    refs.companionLeftChip.root.setAttribute('position', '0 ' + leftChipY + ' 0');
    refs.companionRightChip.root.setAttribute('position', '0 ' + rightChipY + ' 0');
    var topGroupBottom = rightChipY - 0.3;

    // Bottom group: "Files changed" heading + file dashboard (2×2) above the
    // Change comparison button.
    var buttonY = cardBottom + 0.34;
    var statBottomRowY = buttonY + 0.62;
    var statTopRowY = statBottomRowY + 0.46;
    refs.companionStats.forEach(function (cell, index) {
      var x = index % 2 === 0 ? -0.72 : 0.72;
      var y = index < 2 ? statTopRowY : statBottomRowY;
      cell.root.setAttribute('position', x + ' ' + y + ' 0');
    });
    var filesLabelY = statTopRowY + 0.36;
    refs.companionFilesLabel.setAttribute('position', '0 ' + filesLabelY + ' 0.01');
    var bottomGroupTop = filesLabelY + 0.2;

    // Middle group: centre the metric table (header + rows) in the free space.
    var visibleRows = Math.max(0, Math.min(COMPANION_METRIC_ROWS, Number(refs.companionVisibleRows) || 0));
    var tableHeight = 0.34 + (Math.max(1, visibleRows) * COMPANION_ROW_GAP);
    var regionHeight = Math.max(0, topGroupBottom - bottomGroupTop);
    var headerY = topGroupBottom - Math.max(0, (regionHeight - tableHeight) / 2);
    var firstRowY = headerY - 0.36;

    refs.companionHeaderBar.setAttribute('position', '0 ' + headerY + ' -0.008');
    refs.companionHeader.name.setAttribute('position', COMP_COL.name + ' ' + headerY + ' 0.01');
    refs.companionHeader.left.setAttribute('position', COMP_COL.left + ' ' + headerY + ' 0.01');
    refs.companionHeader.right.setAttribute('position', COMP_COL.right + ' ' + headerY + ' 0.01');
    refs.companionHeader.diff.setAttribute('position', COMP_COL.diff + ' ' + headerY + ' 0.01');
    refs.companionRows.forEach(function (row, index) {
      row.setAttribute('position', '0 ' + (firstRowY - (index * COMPANION_ROW_GAP)) + ' 0');
    });
    refs.companionEmpty.setAttribute('position', '0 ' + firstRowY + ' 0.01');
    refs.companionButton.setAttribute('position', '0 ' + buttonY + ' 0');
  }

  // Full-width side chip: accent bar + side tag ("LEFT"/"RIGHT") + branch label.
  function buildSideChip(bgColor, accentColor, sideTag) {
    var root_ = createEntity('a-entity', { position: '0 0 0' });
    root_.appendChild(createEntity('a-plane', {
      position: '0 0 -0.006', width: 2.82, height: 0.3,
      material: 'color: ' + bgColor + '; opacity: 0.92; shader: flat'
    }));
    root_.appendChild(createEntity('a-plane', {
      position: '-1.37 0 0', width: 0.08, height: 0.3,
      material: 'color: ' + accentColor + '; opacity: 0.98; shader: flat'
    }));
    root_.appendChild(createText(sideTag, '-1.28 0 0.01', 0.55, accentColor, 'left', 7));
    var label = createText('', '-0.58 0 0.01', 1.95, '#e2e8f0', 'left', 32);
    root_.appendChild(label);
    return { root: root_, label: label };
  }

  // One dashboard stat cell (value on top, label below, on a subtle plate).
  function buildStatCell(labelText, accentColor) {
    var root_ = createEntity('a-entity', { position: '0 0 0' });
    root_.appendChild(createEntity('a-plane', {
      position: '0 0 -0.006', width: 1.34, height: 0.4,
      material: 'color: #16233b; opacity: 0.8; shader: flat'
    }));
    var value = createText('0', '0 0.075 0.01', 0.65, accentColor, 'center', 8);
    root_.appendChild(value);
    root_.appendChild(createText(labelText, '0 -0.095 0.01', 1.2, '#94a3b8', 'center', 16));
    return { root: root_, value: value };
  }

  function chipText(dataset) {
    if (!dataset?.source) {
      return '-';
    }
    var described = root.CodeXRGitRefPickerRuntime.describeSource(dataset.source);
    var date = described.isLive ? 'Working copy' : described.date;
    return truncate(described.label + '  -  ' + date, 32);
  }

  // The comparison table always mirrors what the user has mapped to the chart
  // axes right now — read live from the mapping-ui (its lastKnownGoodMapping is
  // the mapping the charts actually use), not a stale cache. A confirmed axis
  // change (codexr-mapping-confirmed) also re-triggers this update.
  function getLiveMapping() {
    var mappingState = root.CodeXRMappingUiRuntime?.getState?.() || {};
    if (Object.keys(mappingState.lastKnownGoodMapping || {}).length) {
      return mappingState.lastKnownGoodMapping;
    }
    if (Object.keys(mappingState.selectedByDimension || {}).length) {
      return mappingState.selectedByDimension;
    }
    return state.selectedMapping || {};
  }

  function updateMappingCompanion() {
    if (!refs.companionRoot) {
      return;
    }
    refs.companionLeftChip?.label.setAttribute('value', chipText(state.result?.left));
    refs.companionRightChip?.label.setAttribute('value', chipText(state.result?.right));

    state.selectedMapping = getLiveMapping();
    var metrics = state.result
      ? getMappedMetricDeltas(state.selectedMapping, state.payloads).slice(0, COMPANION_METRIC_ROWS)
      : [];
    refs.companionVisibleRows = metrics.length;
    refs.companionRows.forEach(function (row, index) {
      var metric = metrics[index];
      if (!metric) {
        setRowVisible(row, false);
        return;
      }
      setRowVisible(row, true);
      row.__name.setAttribute('value', truncate(metric.metric, 13));
      row.__left.setAttribute('value', formatMetricValue(metric.left));
      row.__right.setAttribute('value', formatMetricValue(metric.right));
      var diff = Number(metric.delta) || 0;
      var sign = diff > 0 ? '+' : '';
      row.__diff.setAttribute('value', sign + formatMetricValue(diff));
      row.__diff.setAttribute('color', diff > 0 ? '#4ade80' : (diff < 0 ? '#f87171' : '#94a3b8'));
    });
    // Empty state: placeholder instead of a lone table header.
    var hasRows = metrics.length > 0;
    setRowVisible(refs.companionEmpty, !hasRows);
    setRowVisible(refs.companionHeaderBar, hasRows);
    setRowVisible(refs.companionHeader.name, hasRows);
    setRowVisible(refs.companionHeader.left, hasRows);
    setRowVisible(refs.companionHeader.right, hasRows);
    setRowVisible(refs.companionHeader.diff, hasRows);

    var delta = state.result?.delta || {};
    refs.companionStats.forEach(function (cell, index) {
      cell.value.setAttribute('value', state.result ? String(Number(delta[COMPANION_STAT_META[index].key] || 0)) : '-');
    });

    // Row count changed → re-centre the table in its middle zone.
    positionMappingCompanion();
  }

  // Clears the table (comparison geometry + result) and reopens the source
  // selector, ready to pick a new pair. The mode stays historical.
  function changeComparison() {
    state.loadGeneration += 1;
    disposeComparisonGeometry(true);
    updateMappingCompanion();
    setStatus('', 'info');
    openPanel();
  }

// == historicalComparisonRuntime.js | compareFlowAndMessages (assembled per manifest.json; see COMPONENTS.md) ==
  // Replay support for self-contained exports: the manifest lists every
  // comparison that was computed before the export, newest first.
  function getOfflineReplayList() {
    var manifest = getClient()?.getOfflineExportManifest?.();
    var comparisons = manifest?.historicalComparison?.comparisons;
    return Array.isArray(comparisons) ? comparisons : [];
  }

  function showOfflineReplayStatus() {
    var replays = getOfflineReplayList();
    if (replays.length === 0) {
      setStatus('No comparison was computed before this export: computing one needs the live CodeXR session.', 'error');
      return;
    }
    var next = replays[(state.offlineReplayIndex || 0) % replays.length];
    setStatus(
      'Offline export: ' + replays.length + ' computed comparison(s) available.\n'
      + 'Compare replays the next one: #' + next.revision + ' ' + (next.leftLabel || '?') + ' vs ' + (next.rightLabel || '?'),
      'info'
    );
  }

  async function loadOfflineComparison(entry) {
    try {
      setStatus('Loading exported comparison #' + entry.revision + '...', 'info');
      var response = await fetch(String(entry.url), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Exported comparison #' + entry.revision + ' could not be loaded.');
      }
      var result = await response.json();
      await applySharedState({
        entityKind: 'historical-comparison',
        entityId: 'main',
        mode: 'historical-compare',
        result: result
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), 'error');
    }
  }

  function startComparison() {
    // Offline with exported git payloads, Compare works for real: validate
    // the selection like online and compose the comparison locally. Without
    // payloads, walk the replay list of precomputed comparisons.
    if (getClient()?.isOfflineExport?.()) {
      if (getOfflineGitData()) {
        if (!state.selected.left || !state.selected.right) {
          setStatus('Select both comparison sources.', 'error');
          return;
        }
        if (state.selected.left === state.selected.right) {
          setStatus('Choose two different comparison sources.', 'error');
          return;
        }
        void startOfflineGitComparison();
        return;
      }
      var replays = getOfflineReplayList();
      if (replays.length === 0) {
        setStatus('No comparison was computed before this export: computing one needs the live CodeXR session.', 'error');
        return;
      }
      var index = (state.offlineReplayIndex || 0) % replays.length;
      state.offlineReplayIndex = index + 1;
      void loadOfflineComparison(replays[index]);
      return;
    }
    if (!state.selected.left || !state.selected.right) {
      setStatus('Select both comparison sources.', 'error');
      return;
    }
    if (state.selected.left === state.selected.right) {
      setStatus('Choose two different comparison sources.', 'error');
      return;
    }
    setStatus('Analyzing historical comparison. Please wait...', 'info');
    getClient()?.sendMessage?.('historical-comparison-start', {
      leftSourceId: state.selected.left,
      rightSourceId: state.selected.right
    });
  }

  function showHistoricalSelectionPanel() {
    root.CodeXRAnalysisModeRuntime.setSelectionPanel?.('historical-selection');
    root.CodeXRMappingUiRuntime.showPanelView?.('historical-selection');
    showSourceSelection();
  }

  // Single entry path: no explicit controllerView/panelViewId — the mode's
  // resolveControllerView routes (mapping when a comparison is live, source
  // selector otherwise), so the local transition and the server echo can
  // never disagree.
  async function enterHistoricalSelection() {
    getClient().sendMessage?.('analysis-mode-activate', {
      mode: 'historical-compare'
    });
    await root.CodeXRAnalysisModeRuntime.changeAnalysis('historical-compare', {
      reason: 'historical-mode-entry'
    });
  }

  function selectHistoricalMode() {
    root.console?.log?.('[CodeXR.Debug]: Historical comparison mode selected', {
      hasResult: !!state.result,
      revision: state.result?.revision || null
    });
    void enterHistoricalSelection();
  }

  function handleReferences(message) {
    state.references = message?.payload || null;
    var activeRequest = state.references?.activeRequest;
    if (activeRequest?.leftSourceId && activeRequest?.rightSourceId) {
      state.selected = {
        left: activeRequest.leftSourceId,
        right: activeRequest.rightSourceId
      };
    }
    // Category/paging now live inside the shared picker; the panel only feeds
    // it the references and keeps the selection detail.
    renderReferences();
    var excludedCount = Number(state.references?.eligibility?.excludedSources?.length || 0);
    setStatus(
      excludedCount
        ? excludedCount + ' revision(s) were hidden because they contain no analyzable data.'
        : '',
      'info'
    );
  }

  function handleProgress(message) {
    setStatus(message?.payload?.message || 'Analyzing...', 'info');
  }

  function handleError(message) {
    var code = String(message?.payload?.code || '');
    var rawMessage = String(message?.payload?.message || '');
    var friendlyMessage = code === 'references-unavailable' || /not a git repository|git-command-failed/i.test(rawMessage)
      ? 'History compare requires an analysis inside a local Git repository.'
      : code === 'comparison-busy'
        ? 'Another comparison is already being generated.'
        : code === 'comparison-source-no-data'
          ? rawMessage
        : 'Historical comparison failed. Please try again.';
    setStatus(friendlyMessage, 'error');
  }

  async function applySharedState(snapshot) {
    if (!snapshot || !snapshot.result) {
      return;
    }
    if (!isHistoricalModeActiveOrActivating()) {
      state.result = snapshot.result;
      return;
    }
    try {
      var loadGeneration = ++state.loadGeneration;
      setStatus('Loading comparison datasets...', 'info');
      var result = snapshot.result;
      var responses = await Promise.all([
        fetch(result.left.url + '?revision=' + result.revision, { cache: 'no-store' }),
        fetch(result.right.url + '?revision=' + result.revision, { cache: 'no-store' })
      ]);
      if (!responses[0].ok || !responses[1].ok) {
        throw new Error('Comparison datasets could not be loaded.');
      }
      var datasets = await Promise.all(responses.map(function (response) { return response.json(); }));
      if (
        loadGeneration !== state.loadGeneration
        || !isHistoricalModeActiveOrActivating()
      ) {
        return;
      }
      var previousResult = state.result;
      state.result = result;
      if (canRefreshLiveSide(result, previousResult)) {
        await refreshLiveSide(result, datasets);
      } else {
        await renderComparison(result, datasets[0], datasets[1]);
      }
      closePanel();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), 'error');
    }
  }

// == historicalComparisonRuntime.js | comparisonCharts (assembled per manifest.json; see COMPONENTS.md) ==
  function getChartComponentName(chart) {
    if (!chart) {
      return '';
    }
    // The chart-id marker is the authoritative statement of which chart the
    // entity carries. Scanning the component list first picked by DECLARATION
    // ORDER, so an entity still holding a leftover component could be read as
    // the wrong chart — and then cloned with the wrong orientation.
    var markedChartId = String(chart.getAttribute?.('data-codexr-active-chart-id') || '');
    if (markedChartId) {
      var markedComponent = CHART_COMPONENT_NAMES.find(function (name) {
        return CHART_ID_BY_COMPONENT[name] === markedChartId && chart.hasAttribute?.(name);
      });
      if (markedComponent) {
        return markedComponent;
      }
    }
    return CHART_COMPONENT_NAMES.find(function (name) {
      return chart.hasAttribute?.(name);
    }) || chart.getAttributeNames().find(function (name) {
      return name.indexOf('babia-') === 0
        && name !== 'babia-queryjson'
        && name !== 'babia-treebuilder';
    }) || '';
  }

  function isHierarchicalBoatsComponent(componentName) {
    return componentName === 'babia-boats';
  }

  // Orientation comes from the canonical presentation profile of the chart the
  // clone actually carries — never inherited from the original entity, which
  // may still be wearing a previous chart's rotation.
  function getChartRotationForComponent(componentName) {
    var chartId = CHART_ID_BY_COMPONENT[componentName] || '';
    var presentation = chartId
      ? root.CodeXRMappingUiRuntime?.getChartPresentation?.(chartId)
      : null;
    return (presentation && presentation.rotation) || '0 0 0';
  }

  // Shared boats tree contract (generator-injected via the mapping runtime):
  // directory quarters split the full analyzed path (filePath — both sides
  // rebuild it against the ORIGINAL target, so working copy and materialized
  // commit paint identical quarters), file mode the synthetic treePath.
  function comparisonTreeField(targetType) {
    var treeFields = root.CodeXRMappingUiRuntime?.getChartBaseConfig?.()?.treeFields;
    if (targetType === 'directory') {
      return treeFields?.directory || 'filePath';
    }
    return treeFields?.file || 'treePath';
  }

  function createDataSource(id, url) {
    return createEntity('a-entity', {
      id: id,
      'babia-queryjson': 'url: ' + url
    });
  }

  function setDeclarativeBabiaComponent(entity, componentName, componentData) {
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    if (
      mappingRuntime
      && typeof mappingRuntime.setDeclarativeAttribute === 'function'
      && typeof mappingRuntime.serializeDeclarativeComponentData === 'function'
    ) {
      mappingRuntime.setDeclarativeAttribute(
        entity,
        componentName,
        mappingRuntime.serializeDeclarativeComponentData(componentData)
      );
      return true;
    }
    entity.setAttribute(componentName, componentData);
    return true;
  }

  function serializeInlineBabiaData(payload) {
    // A-Frame component strings use semicolons as property separators. Keep
    // user-controlled names/paths lossless inside inline JSON by encoding the
    // character before the shared component serializer sees it; JSON.parse
    // restores it transparently for Babia.
    return JSON.stringify(payload).replace(/;/g, '\\u003b');
  }

  function vectorToPositionAttribute(position) {
    var source = position || {};
    return [
      Number.isFinite(source.x) ? source.x : 0,
      Number.isFinite(source.y) ? source.y : 1,
      Number.isFinite(source.z) ? source.z : -18
    ].join(' ');
  }

  function getHistoricalContainmentProfile(zone) {
    var profileId = zone && zone.id === 'right' ? 'historical-right' : 'historical-left';
    var profile = root.CodeXRAnalysisTableRuntime?.getContainmentProfile?.(profileId);
    if (!profile) {
      profile = {
        id: profileId,
        position: { x: zone.anchorX, y: 1, z: zone.anchorZ },
        containment: {
          enabled: true,
          anchorX: zone.anchorX,
          anchorY: 1,
          anchorZ: zone.anchorZ,
          targetWidth: zone.width,
          targetHeight: 1.8,
          targetDepth: zone.depth,
          bootstrapPlanarMaxRatio: 0.84,
          minPlanarOccupancyRatio: 0.78,
          maxPlanarOccupancyRatio: 0.92,
          heightBandMinRatio: 0.34,
          heightBandMaxRatio: 0.68,
          tableTopPadding: 0.14,
          tableEdgeMargin: 0.12,
          yScaleMin: 0.01,
          yScaleMax: 12,
          containmentToleranceRatio: 0.018,
          periodicContainmentEnabled: true,
          transformTransitionMs: 650,
          hardHeightGuardEnabled: true
        }
      };
    }
    return profile;
  }

  function createChartFromTemplate(original, id, sourceId, zone, targetType, options) {
    var clone = createEntity('a-entity');
    var componentName = getChartComponentName(original);
    original.getAttributeNames().forEach(function (attributeName) {
      if (
        attributeName === 'id'
        || attributeName === 'visible'
        || attributeName === 'position'
        || attributeName === 'scale'
        // Orientation and the chart marker are derived below from the chart
        // this clone actually carries, not copied from an entity that may be
        // wearing a previous chart's rotation.
        || attributeName === 'rotation'
        || attributeName === 'data-codexr-active-chart-id'
        || attributeName === 'codexr-chart-containment'
        || CHART_COMPONENT_NAMES.indexOf(attributeName) !== -1
      ) {
        return;
      }
      clone.setAttribute(attributeName, original.getAttribute(attributeName));
    });
    clone.setAttribute('id', id);
    clone.setAttribute('rotation', getChartRotationForComponent(componentName));
    if (CHART_ID_BY_COMPONENT[componentName]) {
      clone.setAttribute('data-codexr-active-chart-id', CHART_ID_BY_COMPONENT[componentName]);
    }
    if (componentName) {
      var chartData = Object.assign({}, original.getAttribute(componentName) || {});
      if (options?.inlineData) {
        delete chartData.from;
        chartData.data = serializeInlineBabiaData(options.inlineData);
        chartData.field = 'uid';
      } else {
        delete chartData.data;
        chartData.from = sourceId;
      }
      setDeclarativeBabiaComponent(clone, componentName, chartData);
    }
    var containmentProfile = getHistoricalContainmentProfile(zone);
    clone.setAttribute('scale', '0.01 0.05 0.01');
    if (root.CodeXRAnalysisTableRuntime.applyContainmentProfile) {
      root.CodeXRAnalysisTableRuntime.applyContainmentProfile(clone, containmentProfile);
    } else {
      clone.setAttribute('position', vectorToPositionAttribute(containmentProfile.position));
      clone.setAttribute('codexr-chart-containment', containmentProfile.containment);
    }
    clone.dataset.codexrComparisonTargetType = targetType || '';
    return clone;
  }

  function normalizeComparisonPath(value) {
    return String(value || '')
      .replace(/\\/g, '/')
      .split('/')
      .filter(Boolean);
  }

  function buildComparisonBoatsTree(payload, pathField, namespace) {
    var roots = [];
    var safeNamespace = String(namespace || 'comparison').replace(/[^a-zA-Z0-9_-]/g, '-');

    normalizePayload(payload).forEach(function (entry) {
      // Payloads decorated before relativePath existed only carry filePath.
      var parts = normalizeComparisonPath(entry?.[pathField] || entry?.filePath);
      if (!parts.length) {
        return;
      }

      var siblings = roots;
      var accumulated = [];
      parts.forEach(function (part, index) {
        accumulated.push(part);
        var isLeaf = index === parts.length - 1;
        var existing = siblings.find(function (candidate) {
          return candidate && candidate.name === part;
        });
        var node = existing;

        if (!node) {
          node = isLeaf ? Object.assign({}, entry) : { children: [] };
          node.name = part;
          node.uid = safeNamespace + ':' + accumulated.join('/');
          siblings.push(node);
        } else if (isLeaf) {
          Object.assign(node, entry);
          node.name = part;
          node.uid = safeNamespace + ':' + accumulated.join('/');
        }

        if (!isLeaf) {
          if (!Array.isArray(node.children)) {
            node.children = [];
          }
          siblings = node.children;
        }
      });
    });

    return roots;
  }

  // Side nameplates are shared Git chrome (see codexrGitRefPickerRuntime): a
  // lectern-style plate on the table edge closest to the user. Project
  // evolution labels its current frame with the very same plate.
  function buildSideNameplateText(source) {
    return root.CodeXRGitRefPickerRuntime.buildSourceNameplateText(source);
  }

  function createSideNameplate(source, zone, color) {
    return root.CodeXRGitRefPickerRuntime.createSourceNameplate(source, zone, color);
  }

  async function renderComparison(result, leftPayload, rightPayload) {
    disposeComparisonGeometry(false);
    var config = getConfig();
    var scene = getDocument()?.querySelector('a-scene');
    var original = getTemplateChart(config);
    if (!scene || !original) {
      throw new Error('The original XR chart is not available.');
    }
    state.payloads = {
      left: normalizePayload(leftPayload),
      right: normalizePayload(rightPayload)
    };
    refs.comparisonRoot = createEntity('a-entity', {
      id: 'codexrHistoricalComparisonRoot',
      'data-codexr-analysis-root': 'true',
      'data-codexr-analysis-mode': 'historical-compare',
      // Preserved: leaving the mode hides this root (surface preserve pass)
      // instead of removing it, so returning restores the comparison as left
      // without a rebuild — same save/restore pattern as the single mode.
      'data-codexr-preserve': 'true'
    });
    if (root.CodeXRAnalysisSurfaceRuntime?.mountRoot) {
      root.CodeXRAnalysisSurfaceRuntime.mountRoot('historical-compare', refs.comparisonRoot);
    } else {
      scene.appendChild(refs.comparisonRoot);
    }
    var chartComponent = getChartComponentName(original);
    var leftFrom = 'codexrComparisonDataLeft';
    var rightFrom = 'codexrComparisonDataRight';
    var boatsPathField = comparisonTreeField(config?.targetType);
    var leftChartOptions = null;
    var rightChartOptions = null;
    if (isHierarchicalBoatsComponent(chartComponent)) {
      leftFrom = '';
      rightFrom = '';
      leftChartOptions = {
        inlineData: buildComparisonBoatsTree(state.payloads.left, boatsPathField, 'codexr-left')
      };
      rightChartOptions = {
        inlineData: buildComparisonBoatsTree(state.payloads.right, boatsPathField, 'codexr-right')
      };
    } else {
      var leftData = createDataSource('codexrComparisonDataLeft', result.left.url + '?revision=' + result.revision);
      var rightData = createDataSource('codexrComparisonDataRight', result.right.url + '?revision=' + result.revision);
      refs.comparisonRoot.appendChild(leftData);
      refs.comparisonRoot.appendChild(rightData);
    }

    await nextFrame();
    var zones = root.CodeXRAnalysisTableRuntime?.getAnalysisTableZones?.('historical-compare') || [
      { id: 'left', anchorX: -1.45, anchorZ: -18, width: 2.7, depth: 3.218 },
      { id: 'right', anchorX: 1.45, anchorZ: -18, width: 2.7, depth: 3.218 }
    ];
    var activeChartIds = [];
    if (result.left.itemCount > 0) {
      var leftChart = createChartFromTemplate(
        original,
        'codexrComparisonChartLeft',
        leftFrom,
        zones[0],
        config?.targetType,
        leftChartOptions
      );
      refs.comparisonRoot.appendChild(leftChart);
      activeChartIds.push(leftChart.id);
    } else {
      refs.comparisonRoot.appendChild(createEmptyState(result.left, zones[0], '#67e8f9'));
    }
    if (result.right.itemCount > 0) {
      var rightChart = createChartFromTemplate(
        original,
        'codexrComparisonChartRight',
        rightFrom,
        zones[1],
        config?.targetType,
        rightChartOptions
      );
      refs.comparisonRoot.appendChild(rightChart);
      activeChartIds.push(rightChart.id);
    } else {
      refs.comparisonRoot.appendChild(createEmptyState(result.right, zones[1], '#6ee7b7'));
    }
    // Side nameplates on the table edge; the delta/metric comparison now lives
    // in the Field Mapping companion table (no floating text over the table).
    refs.leftLabel = createSideNameplate(result.left.source, zones[0], '#67e8f9');
    refs.rightLabel = createSideNameplate(result.right.source, zones[1], '#6ee7b7');
    updateMappingCompanion();
    refs.comparisonRoot.appendChild(refs.leftLabel);
    refs.comparisonRoot.appendChild(refs.rightLabel);

    await nextFrame();
    refs.comparisonChartIds = activeChartIds.slice();
    root.CodeXRMappingUiRuntime?.setChartEntityIds?.(
      activeChartIds,
      { renormalize: false }
    );
    root.CodeXRMappingUiRuntime.switchMappingContext?.('historical-comparison', {
      reason: 'historical-comparison-ready'
    });
    parkOriginalChart(original);
    // Targeted: only the two comparison charts. renormalizeAll would also
    // re-fit charts belonging to other modes (the parked normal one), leaving
    // them re-measuring for no reason.
    root.CodeXRAnalysisTableRuntime?.renormalizeCharts?.(activeChartIds, 'historical-comparison-ready');
    if (activeChartIds.length) {
      var stabilization = await root.CodeXRAnalysisTableRuntime?.waitForChartsStable?.(activeChartIds, {
        timeoutMs: 12000,
        pollMs: 140,
        stablePasses: 2
      });
      if (stabilization && !stabilization.valid) {
        throw new Error('One side of the historical comparison could not build a valid chart.');
      }
    }
    refs.renderedRevision = result.revision;
  }

  // Fast path for re-entering the mode with the comparison still mounted
  // (hidden by the surface preserve pass on leave): re-park the normal charts,
  // re-show the preserved root and re-point the mapping controller at the
  // comparison — no geometry rebuild, the scene comes back exactly as left.
  function restoreComparisonScene() {
    var config = getConfig();
    var original = getTemplateChart(config);
    parkOriginalChart(original);
    if (root.CodeXRAnalysisSurfaceRuntime?.mountRoot) {
      root.CodeXRAnalysisSurfaceRuntime.mountRoot('historical-compare', refs.comparisonRoot);
    }
    var chartIds = Array.isArray(refs.comparisonChartIds) ? refs.comparisonChartIds : [];
    if (chartIds.length) {
      root.CodeXRMappingUiRuntime?.setChartEntityIds?.(
        chartIds,
        { renormalize: false }
      );
    }
    root.CodeXRMappingUiRuntime?.switchMappingContext?.('historical-comparison', {
      reason: 'historical-comparison-restored'
    });
    // The charts were hidden, so any re-fit request made meanwhile was deferred.
    // Honour it now that they are visible again: a no-op when nothing changed
    // (the fit they already have is still valid), a real re-fit if it did.
    if (chartIds.length) {
      root.CodeXRAnalysisTableRuntime?.renormalizeCharts?.(chartIds, 'historical-comparison-restored');
    }
  }

  function createEmptyState(dataset, zone, color) {
    var empty = createEntity('a-plane', {
      position: zone.anchorX + ' 1.55 ' + zone.anchorZ,
      width: Math.max(1.4, zone.width - 0.3),
      height: 1.25,
      material: 'color: #172033; opacity: 0.92; shader: flat'
    });
    empty.appendChild(createText(
      dataset.missingTarget
        ? 'Target not present in this revision'
        : 'This analysis produced no elements',
      '0 0 0.03',
      3.3,
      color,
      'center',
      34
    ));
    return empty;
  }

// == historicalComparisonRuntime.js | liveRefreshAndRegistration (assembled per manifest.json; see COMPONENTS.md) ==
  function nextFrame() {
    return new Promise(function (resolve) {
      (root.requestAnimationFrame || function (callback) { return setTimeout(callback, 16); })(resolve);
    });
  }

  function canRefreshLiveSide(result, previousResult) {
    if (!previousResult || !refs.comparisonRoot) {
      return false;
    }
    var sameSources = previousResult.left.source.id === result.left.source.id
      && previousResult.right.source.id === result.right.source.id;
    var liveSide = result.left.source.kind === 'workingCopy' ? 'left'
      : result.right.source.kind === 'workingCopy' ? 'right'
        : '';
    return sameSources
      && !!liveSide
      && previousResult[liveSide].itemCount > 0
      && result[liveSide].itemCount > 0;
  }

  async function refreshLiveSide(result, datasets) {
    var liveSide = result.left.source.kind === 'workingCopy' ? 'left' : 'right';
    var dataset = result[liveSide];
    state.payloads[liveSide] = normalizePayload(datasets[liveSide === 'left' ? 0 : 1]);
    var chart = getDocument().getElementById(
      liveSide === 'left' ? 'codexrComparisonChartLeft' : 'codexrComparisonChartRight'
    );
    var componentName = getChartComponentName(chart);
    if (isHierarchicalBoatsComponent(componentName)) {
      var config = getConfig();
      var pathField = comparisonTreeField(config?.targetType);
      var chartData = Object.assign({}, chart.getAttribute(componentName) || {});
      delete chartData.from;
      chartData.data = serializeInlineBabiaData(buildComparisonBoatsTree(
        state.payloads[liveSide],
        pathField,
        liveSide === 'left' ? 'codexr-left' : 'codexr-right'
      ));
      chartData.field = 'uid';
      setDeclarativeBabiaComponent(chart, componentName, chartData);
    } else {
      var dataEntity = getDocument().getElementById(
        liveSide === 'left' ? 'codexrComparisonDataLeft' : 'codexrComparisonDataRight'
      );
      if (!dataEntity) {
        throw new Error('The live comparison data source is unavailable.');
      }
      dataEntity.setAttribute('babia-queryjson', 'url: ' + dataset.url + '?revision=' + result.revision);
    }
    setText(liveSide === 'left' ? refs.leftLabel : refs.rightLabel, buildSideNameplateText(dataset.source), 2.6, liveSide === 'left' ? '#67e8f9' : '#6ee7b7');
    updateMappingCompanion();
    state.result = result;
    refs.renderedRevision = result.revision;
    await nextFrame();
    // Targeted renormalization: only the refreshed live chart. Renormalizing
    // every chart reset the untouched immutable side to its 'rebuilding'
    // containment state, waiting for a Babia build event that never comes —
    // the chart vanished behind "The chart is still rebuilding its geometry".
    root.CodeXRAnalysisTableRuntime?.renormalizeCharts?.(
      [liveSide === 'left' ? 'codexrComparisonChartLeft' : 'codexrComparisonChartRight'],
      'historical-comparison-live-refresh'
    );
  }

  function normalizePayload(payload) {
    return Array.isArray(payload) ? payload : [];
  }

  function sumMetric(payload, metric) {
    return normalizePayload(payload).reduce(function (sum, entry) {
      var value = Number(entry && entry[metric]);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function getMappedMetricDeltas(mapping, payloads) {
    var fields = Object.keys(mapping || {}).map(function (key) {
      return String(mapping[key] || '');
    }).filter(Boolean);
    return Array.from(new Set(fields)).map(function (metric) {
      var left = sumMetric(payloads?.left, metric);
      var right = sumMetric(payloads?.right, metric);
      return { metric: metric, left: left, right: right, delta: right - left };
    }).filter(function (metric) {
      return metric.left !== 0 || metric.right !== 0;
    });
  }

  function handleMappingConfirmed(event) {
    // The comparison table always mirrors what the user maps to the chart axes:
    // a changed axis metric re-computes its left/right/delta here.
    state.selectedMapping = Object.assign({}, event?.detail?.selectedByDimension || {});
    updateMappingCompanion();
  }

  // Hands the scene back to the normal charts (raycast + mapping targets)
  // without touching the comparison geometry.
  function releaseSceneToNormal() {
    var config = getConfig();
    var original = restoreOriginalChart() || getTemplateChart(config);
    restoreRaycastInteraction(original);
    restoreOriginalChartMapping(config);
  }

  function disposeComparisonGeometry(clearResult) {
    // Babia leaves a removed chart component subscribed to its data producer,
    // so a discarded comparison chart repaints itself on the next push. Release
    // both before dropping the root.
    (Array.isArray(refs.comparisonChartIds) ? refs.comparisonChartIds : []).forEach(function (chartId) {
      var chart = getDocument()?.getElementById?.(chartId);
      if (chart) {
        root.CodeXRMappingUiRuntime?.releaseChartEntity?.(chart);
      }
    });
    if (refs.comparisonRoot?.parentNode) {
      refs.comparisonRoot.parentNode.removeChild(refs.comparisonRoot);
    }
    refs.comparisonRoot = null;
    refs.comparisonChartIds = null;
    refs.renderedRevision = null;
    releaseSceneToNormal();
    if (clearResult !== false) {
      state.result = null;
      state.payloads = { left: [], right: [] };
    }
  }

  // Leaving the mode with a live comparison: SAVE it. The root stays mounted
  // (the surface preserve pass hides it with its own interaction bookkeeping)
  // and only the scene is handed back to normal; restoreComparisonScene brings
  // everything back as left, with no rebuild (and no visible teardown).
  function parkComparisonGeometry() {
    root.CodeXRAnalysisSurfaceRuntime?.preserveModeRoots?.('historical-compare');
    releaseSceneToNormal();
  }

  function releaseComparisonOnLeave() {
    state.loadGeneration += 1;
    if (state.result && refs.comparisonRoot?.isConnected) {
      parkComparisonGeometry();
      return;
    }
    disposeComparisonGeometry(false);
  }

  function registerCollaboration() {
    var client = getClient();
    if (!client) {
      return;
    }
    state.disposables.push(client.onMessage?.('historical-comparison-references', handleReferences));
    state.disposables.push(client.onMessage?.('historical-comparison-progress', handleProgress));
    state.disposables.push(client.onMessage?.('historical-comparison-error', handleError));
    client.registerEntityRuntime?.({
      entityKind: ENTITY_KIND,
      entityId: ENTITY_ID,
      applySharedState: applySharedState,
      publishInitialSharedState: function () {}
    });
  }

  function mountPanelView() {
    if (buildPanel()) {
      return;
    }
    // Event-driven: the controller calls back once its panel exists (a capped
    // retry here used to silently drop the view on slow scenes).
    root.CodeXRMappingUiRuntime?.whenPanelReady?.(function () {
      buildPanel();
    });
  }

  function autoInit() {
    if (state.initialized || !getDocument()) {
      return;
    }
    state.initialized = true;
    state.unregisterLifecycle = root.CodeXRAnalysisModeRuntime?.register?.('historical-compare', {
      mappingContextId: 'historical-comparison',
      activate: function () {
        if (state.result) {
          // Comparison geometry still mounted (preserved on leave, or a
          // duplicate activation): restore it in place — no renderComparison,
          // no re-park/stabilization wait, the scene comes back as left.
          if (refs.comparisonRoot?.isConnected) {
            restoreComparisonScene();
            if (state.result.revision !== refs.renderedRevision) {
              // The live side moved while the mode was parked (the entity
              // update only stored state.result): re-sync the charts now.
              return applySharedState({
                entityKind: ENTITY_KIND,
                entityId: ENTITY_ID,
                mode: 'historical-compare',
                result: state.result
              });
            }
            closePanel();
            return true;
          }
          if (state.payloads.left.length || state.payloads.right.length) {
            return renderComparison(
              state.result,
              state.payloads.left,
              state.payloads.right
            ).then(function () {
              closePanel();
            });
          }
          return applySharedState({
            entityKind: ENTITY_KIND,
            entityId: ENTITY_ID,
            mode: 'historical-compare',
            result: state.result
          });
        }
        showHistoricalSelectionPanel();
        return true;
      },
      // Leaving historical SAVES a live comparison (root preserved-and-hidden,
      // result + payloads kept) so returning restores it as left; with none,
      // the geometry is disposed and re-entry shows the source selector.
      // Determinism comes from resolveControllerView below: every route
      // (local + authoritative echo) agrees on historical.mapping when a
      // comparison exists, historical.selection otherwise.
      deactivate: function () {
        releaseComparisonOnLeave();
      },
      // Authoritative default view for this mode: with a live comparison the
      // controller restores it (mapping); otherwise it shows the source
      // selector. getDefaultControllerViewForMode consults this so the local
      // transition and the server echo can never disagree on the view.
      resolveControllerView: function () {
        return state.result ? 'historical.mapping' : 'historical.selection';
      }
    }) || null;
    registerHistoricalModeOption();
    mountPanelView();
    state.selectedMapping = Object.assign(
      {},
      root.CodeXRMappingUiRuntime?.getState?.().lastKnownGoodMapping || {}
    );
    getDocument().addEventListener('codexr-mapping-confirmed', handleMappingConfirmed);
    state.disposables.push(function () {
      getDocument()?.removeEventListener('codexr-mapping-confirmed', handleMappingConfirmed);
    });
    void configureAvailability();
    registerCollaboration();
  }

  var runtime = {
    autoInit: autoInit,
    open: openPanel,
    close: closePanel,
    activate: enterHistoricalSelection,
    deactivate: function () {
      return root.CodeXRAnalysisModeRuntime?.deactivate?.('historical-compare');
    },
    disposeView: function () {
      releaseComparisonOnLeave();
    },
    applySharedState: applySharedState,
    getState: function () {
      return {
        panelVisible: state.panelVisible,
        selected: Object.assign({}, state.selected),
        result: state.result,
        status: state.status
      };
    },
    destroy: function () {
      state.disposables.forEach(function (dispose) { dispose?.(); });
      state.disposables = [];
      disposeComparisonGeometry();
      state.unregisterModeOption?.();
      state.unregisterModeOption = null;
      state.unregisterLifecycle?.();
      state.unregisterLifecycle = null;
      state.unregisterPanelView?.();
      state.unregisterPanelView = null;
      state.unregisterMappingCompanion?.();
      state.unregisterMappingCompanion = null;
      refs.panel = null;
      refs.companionRoot = null;
      state.initialized = false;
    },
    __testing: {
      buildComparisonBoatsTree: buildComparisonBoatsTree,
      serializeInlineBabiaData: serializeInlineBabiaData,
      selectHistoricalMode: selectHistoricalMode,
      // The comparison clones borrow decoration from the scene chart, so what
      // they must NOT borrow (orientation, a foreign chart component) is
      // asserted by running the builder.
      createChartFromTemplate: createChartFromTemplate,
      // The offline delta port is asserted by CALLING it over payload pairs,
      // not by reading its source.
      buildOfflineDelta: buildOfflineDelta,
      synthesizeOfflineHistoricalReferences: synthesizeOfflineHistoricalReferences
    }
  };

  if (getDocument()) {
    if (getDocument().readyState === 'loading') {
      getDocument().addEventListener('DOMContentLoaded', autoInit, { once: true });
    } else {
      autoInit();
    }
  }
  root.CodeXRHistoricalComparisonRuntime = runtime;
})(typeof window !== 'undefined' ? window : this);
