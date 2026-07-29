// == dependencyGraphRuntime.js | configAndStatus (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRDependencyGraphRuntime(root) {
  'use strict';

  var AFRAME = root.AFRAME;
  var COMPONENT = 'codexr-dependency-graph';
  var ENTITY_KIND = 'dependency-graph';
  var ENTITY_ID = 'main';
  var RAYCAST_CLASS = 'babiaxraycasterclass';
  var GRAPH_WIDTH = 4.7;
  var GRAPH_DEPTH = 2.35;
  var GRAPH_BASE_Y = 0.12;
  var GRAPH_HEIGHT = 1.05;
  // The scope breadcrumb (path label) lives at HOME by default; while a detail
  // card is visible it dodges to DOCKED — a low, forward band the card (anchored
  // at graphTopY + 0.92, lower edge >= ~1.33) never reaches. The tween is driven
  // manually in tick() (see updateScopeLabelDock), so the numeric endpoints are
  // the source of truth; HOME's string form seeds the initial position attribute.
  var SCOPE_LABEL_HOME_VEC = { x: 0, y: 1.52, z: 0.18 };
  var SCOPE_LABEL_DOCKED_VEC = { x: 0, y: 0.2, z: 1.28 };
  var SCOPE_LABEL_HOME = SCOPE_LABEL_HOME_VEC.x + ' ' + SCOPE_LABEL_HOME_VEC.y + ' ' + SCOPE_LABEL_HOME_VEC.z;
  // Multiple legends can be pinned at once; cards are laid out in a
  // non-overlapping grid above the graph (see legendSlotPosition), each with a
  // connector to its node/edge. Oldest is evicted past MAX_PINNED_LEGENDS.
  var MAX_PINNED_LEGENDS = 6;
  // cardHeight must cover the tallest rendered card (a navigable node card with
  // 7 metrics + an action button is ~1.72) so grid rows never overlap.
  var LEGEND_SLOT = {
    perRow: 2, cardWidth: 2.5, cardHeight: 1.85, gapX: 0.34, gapY: 0.3, originYOffset: 1.05, z: 0.18
  };
  // Flow-particle catalogues — part of the SHARED room contract: the ids travel
  // in the dependency-graph entity as `flowSize` / `flowSpeed` (validated by the
  // analysis server), so every participant sees the same particles.
  var FLOW_SIZE_OPTIONS = [
    { id: 's', label: 'S', scale: 0.6 },
    { id: 'm', label: 'M', scale: 1 },
    { id: 'l', label: 'L', scale: 1.5 },
    { id: 'xl', label: 'XL', scale: 2.2 }
  ];
  var FLOW_SPEED_OPTIONS = [
    { id: 'x05', label: 'x0.5', multiplier: 0.5 },
    { id: 'x1', label: 'x1', multiplier: 1 },
    { id: 'x2', label: 'x2', multiplier: 2 },
    { id: 'x3', label: 'x3', multiplier: 3 }
  ];
  var FLOW_DEFAULTS = { flowSize: 'm', flowSpeed: 'x1' };
  // Edge traversals per second at x1 (matches the pre-configurable behaviour).
  var FLOW_BASE_SPEED = 0.42;
  function flowSizeOption(id) {
    return FLOW_SIZE_OPTIONS.find(function (option) { return option.id === id; })
      || FLOW_SIZE_OPTIONS[1];
  }
  function flowSpeedOption(id) {
    return FLOW_SPEED_OPTIONS.find(function (option) { return option.id === id; })
      || FLOW_SPEED_OPTIONS[1];
  }
  // Single source of truth for the settings panel's row Y positions (and its
  // registered height) — keep every renderControls row anchored here instead of
  // scattering magic numbers through the layout code.
  var PANEL_ROWS = {
    scope: 2.95,
    layout: 2.45,
    nav: 1.95,
    mapping: 1.35,
    relationsBase: 0.75,
    relationsStep: 0.52,
    edges: -0.40,
    detail: -0.85,
    flow: -1.30,
    legendMarks: -1.74,
    legendLabels: -1.88,
    density: -2.04,
    shapes: -2.20,
    actions: -2.58,
    hover: -2.92,
    status: -3.20,
    waitingText: 0.6,
    waitingButton: -1.4,
    panelHeight: 6.8
  };
  var AXIS_TICK_COUNT = 10;
  var EXTERNAL_SUMMARY_ID = 'codexr:external-summary';
  // Edge-encoding palettes, buckets and legend models live in edgeEncoding.js.
  var RELATIONS = ['import', 'include', 'require', 'inheritance', 'implementation', 'call', 'contains'];
  var RELATION_HELP = {
    import: 'Imports: module dependencies declared with import or equivalent syntax.',
    include: 'Includes: source or header files included during compilation or preprocessing.',
    require: 'Requires: modules or packages loaded with require-style syntax.',
    inheritance: 'Inheritance: classes or types that extend another type.',
    implementation: 'Implementation: classes or types implementing interfaces or traits.',
    call: 'Calls: detectable function or method calls; some languages are best-effort.',
    contains: 'Contains: a module or type owns the connected symbol.'
  };
  var COLORS = {
    Python: '#3776ab', Ruby: '#cc342d', Java: '#e76f00', C: '#659ad2',
    'C++': '#00599c', 'C#': '#9b4f96', JavaScript: '#f7df1e',
    TypeScript: '#3178c6', Go: '#00add8', PHP: '#777bb4',
    Swift: '#f05138', Kotlin: '#7f52ff', external: '#94a3b8',
    directory: '#22d3ee', parent: '#f59e0b', symbol: '#a78bfa'
  };
  var state = {
    initialized: false,
    availability: 'loading',
    unavailableReason: '',
    snapshot: null,
    dataset: null,
    projectDataset: null,
    fileDatasets: {},
    originalRoots: [],
    unregisterMode: null,
    unregisterPanel: null,
    unregisterLifecycle: null,
    disposables: [],
    datasetLoadGeneration: 0,
    viewGeneration: 0,
    active: false,
    transitionLocked: false,
    retryTimers: new Set()
  };
  var refs = {};

  function doc() { return root.document; }
  function client() { return root.CodeXRCollaborationRuntime?.getClient?.(root) || null; }
  function config() {
    var script = doc()?.getElementById('codexr-tooling-config-xr-mapping-ui');
    try { return JSON.parse(script?.textContent || '{}'); } catch { return {}; }
  }
  function entity(tag, attributes) {
    var el = doc().createElement(tag);
    Object.keys(attributes || {}).forEach(function (key) { el.setAttribute(key, attributes[key]); });
    return el;
  }
  function text(value, position, width, color, align, wrapCount) {
    return entity('a-text', {
      value: value || '', position: position || '0 0 0.02', width: width || 5,
      color: color || '#fff', align: align || 'center', baseline: 'center',
      'wrap-count': wrapCount || 42
    });
  }
  function button(label, position, width, onClick, color) {
    var el = entity('a-plane', {
      position: position, width: width || 1.5, height: 0.38,
      material: 'color: ' + (color || '#4c1d95') + '; opacity: 0.96; shader: flat',
      class: onClick ? RAYCAST_CLASS : '', 'data-codexr-interactive': onClick ? 'true' : 'false'
    });
    el.appendChild(text(label, '0 0 0.02', Math.max(2, (width || 1.5) * 1.7)));
    if (onClick) { el.addEventListener('click', onClick); }
    return el;
  }
  function attachHelp(el, message) {
    if (!message) { return el; }
    el.setAttribute('data-codexr-help', message);
    el.addEventListener('mouseenter', function () { setStatus(message, false); });
    el.addEventListener('mouseleave', function () {
      setStatus(state.snapshot?.status === 'ready' ? '' : (state.snapshot?.message || ''), false);
    });
    return el;
  }
  function cycleButton(label, position, width, onPrevious, onNext, color, help) {
    var rootEl = entity('a-entity', { position: position });
    var segmentWidth = 0.46;
    var centerWidth = Math.max(0.5, width - (segmentWidth * 2));
    var background = entity('a-plane', {
      width: width, height: 0.38,
      material: 'color: ' + (color || '#4c1d95') + '; opacity: 0.96; shader: flat'
    });
    var left = entity('a-plane', {
      position: (-width / 2 + segmentWidth / 2) + ' 0 0.012',
      width: segmentWidth, height: 0.38,
      material: 'color: ' + (color || '#4c1d95') + '; opacity: 0.001; shader: flat; depthWrite: false',
      class: RAYCAST_CLASS, 'data-codexr-interactive': 'true'
    });
    var center = entity('a-plane', {
      position: '0 0 0.012', width: centerWidth, height: 0.38,
      material: 'color: ' + (color || '#4c1d95') + '; opacity: 0.001; shader: flat; depthWrite: false',
      class: RAYCAST_CLASS, 'data-codexr-interactive': 'true'
    });
    var right = entity('a-plane', {
      position: (width / 2 - segmentWidth / 2) + ' 0 0.012',
      width: segmentWidth, height: 0.38,
      material: 'color: ' + (color || '#4c1d95') + '; opacity: 0.001; shader: flat; depthWrite: false',
      class: RAYCAST_CLASS, 'data-codexr-interactive': 'true'
    });
    left.appendChild(text('<', '0 0 0.012', 1.1));
    center.appendChild(text(label, '0 0 0.012', Math.max(2, centerWidth * 1.7)));
    right.appendChild(text('>', '0 0 0.012', 1.1));
    left.addEventListener('click', onPrevious);
    center.addEventListener('click', onNext);
    right.addEventListener('click', onNext);
    [left, center, right].forEach(function (part) { attachHelp(part, help); });
    rootEl.appendChild(background);
    rootEl.appendChild(left);
    rootEl.appendChild(center);
    rootEl.appendChild(right);
    return rootEl;
  }
  function setStatus(message, error) {
    if (!refs.status) { return; }
    refs.status.setAttribute('value', message || '');
    refs.status.setAttribute('color', error ? '#fca5a5' : '#fde68a');
    refs.status.setAttribute('visible', !!message);
  }
  function collectConfiguredIds(cfg, keys) {
    var ids = [];
    keys.forEach(function (key) {
      var value = cfg?.[key];
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
// == dependencyGraphRuntime.js | edgeEncoding (assembled per manifest.json; see COMPONENTS.md) ==
  // Single source of truth for the edge visual-encoding domain: palettes,
  // occurrence buckets, per-edge styling, the encoding catalogue shown on the
  // "Edges:" cycle button, and the declarative legend each mode renders.

  var EDGE_ENCODINGS = ['relation-type', 'intensity-color', 'intensity-width', 'intensity-combined'];
  var RELATION_COLORS = {
    import: '#67e8f9', include: '#22d3ee', require: '#60a5fa',
    inheritance: '#e879f9', implementation: '#c084fc', call: '#f59e0b',
    contains: '#a3e635'
  };
  // Compact forms that fit under a legend swatch chip.
  var RELATION_SHORT_LABELS = {
    import: 'import', include: 'include', require: 'require',
    inheritance: 'inherit', implementation: 'implem', call: 'call',
    contains: 'contain'
  };
  var INTENSITY_COLORS = ['#67e8f9', '#38bdf8', '#818cf8', '#f59e0b', '#f97316'];
  var INTENSITY_BUCKET_LABELS = ['1', '2-3', '4-7', '8-15', '16+'];
  var FALLBACK_INTENSITY_WIDTHS = [.006, .009, .013, .018, .024];
  var FALLBACK_CONFIDENCE_OPACITY = { exact: .78, probable: .52, ambiguous: .28 };

  var EDGE_ENCODING_DEFS = {
    'relation-type': {
      label: 'Relation type',
      help: 'Edge colour identifies the relation kind (see the filter chips); width is constant.'
    },
    'intensity-color': {
      label: 'Intensity color',
      help: 'Edge colour encodes how often the relation occurs.'
    },
    'intensity-width': {
      label: 'Intensity width',
      help: 'Edge width encodes occurrences; colour still identifies the relation kind.'
    },
    'intensity-combined': {
      label: 'Color + width',
      help: 'Colour and width both encode how often the relation occurs.'
    }
  };

  function intensityBucket(occurrences) {
    var value = Math.max(1, Number(occurrences || 1));
    return value >= 16 ? 4 : value >= 8 ? 3 : value >= 4 ? 2 : value >= 2 ? 1 : 0;
  }

  function edgeStyle(edge, encoding, visualBudget) {
    var bucket = intensityBucket(edge?.occurrences);
    var useIntensityColor = encoding === 'intensity-color' || encoding === 'intensity-combined';
    var useIntensityWidth = encoding === 'intensity-width' || encoding === 'intensity-combined';
    var widths = visualBudget?.widths || FALLBACK_INTENSITY_WIDTHS;
    var defaultWidth = widths[1] || widths[0] || .006;
    return {
      bucket: bucket,
      color: useIntensityColor
        ? INTENSITY_COLORS[bucket]
        : (RELATION_COLORS[edge?.kind] || RELATION_COLORS.import),
      width: useIntensityWidth ? widths[bucket] : defaultWidth,
      opacity: root.CodeXRDependencyVisualBudgetRuntime?.opacityFor?.(
        visualBudget?.effectiveProfile || 'balanced',
        edge?.confidence || 'probable',
        false
      ) || FALLBACK_CONFIDENCE_OPACITY[edge?.confidence] || FALLBACK_CONFIDENCE_OPACITY.probable
    };
  }

  // Declarative legend for the active encoding. Modes that colour by relation
  // kind (relation-type, intensity-width) show one swatch per kind; the
  // intensity-coloured modes show the 5-bucket occurrence ramp with bars that
  // grow like the widths do.
  function edgeEncodingLegend(encoding) {
    if (encoding === 'intensity-color' || encoding === 'intensity-combined') {
      return {
        type: 'ramp',
        entries: INTENSITY_COLORS.map(function (color, index) {
          return {
            color: color,
            label: INTENSITY_BUCKET_LABELS[index],
            barHeight: .035 + (index * .018)
          };
        })
      };
    }
    return {
      type: 'swatches',
      entries: RELATIONS.map(function (kind) {
        return {
          color: RELATION_COLORS[kind] || RELATION_COLORS.import,
          label: RELATION_SHORT_LABELS[kind] || kind,
          barHeight: .07
        };
      })
    };
  }

// == dependencyGraphRuntime.js | datasetProjection (assembled per manifest.json; see COMPONENTS.md) ==
  function getNormalVisualizationRoots() {
    var document = doc();
    if (!document) { return []; }
    var cfg = config();
    var roots = [];
    collectConfiguredIds(cfg, [
      'normalEntityIds',
      'visualizationEntityIds',
      'chartEntityIds',
      'chartEntityId',
      'chartId'
    ]).forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) { roots.push(element); }
    });
    if (cfg?.chartSelector && typeof document.querySelector === 'function') {
      var selected = document.querySelector(cfg.chartSelector);
      if (selected) { roots.push(selected); }
    }
    document.querySelectorAll?.('[data-codexr-normal-root="true"], [data-codexr-normal-visualization="true"]')
      .forEach(function (element) { roots.push(element); });
    return uniqueElements(roots);
  }
  // A-Frame's raycaster still intersects entities hidden via `visible`, so a
  // parked chart must also give up its raycast classes or its invisible nodes
  // keep stealing clicks from the graph. Suspended classes are marked on the
  // element and restored verbatim (same contract as the historical-comparison
  // and analysis-mode runtimes).
  var RAYCAST_SUSPENDED_ATTR = 'data-codexr-raycast-suspended';
  function suspendSubtreeRaycast(rootElement) {
    if (!rootElement) { return; }
    var suspend = function (element) {
      if (!element?.classList?.contains(RAYCAST_CLASS)) { return; }
      element.classList.remove(RAYCAST_CLASS);
      element.setAttribute(RAYCAST_SUSPENDED_ATTR, 'true');
    };
    suspend(rootElement);
    rootElement.querySelectorAll?.('.' + RAYCAST_CLASS).forEach(suspend);
  }
  function restoreSubtreeRaycast(rootElement) {
    if (!rootElement) { return; }
    var restore = function (element) {
      element.classList?.add(RAYCAST_CLASS);
      element.removeAttribute?.(RAYCAST_SUSPENDED_ATTR);
    };
    if (rootElement.getAttribute?.(RAYCAST_SUSPENDED_ATTR) === 'true') { restore(rootElement); }
    rootElement.querySelectorAll?.('[' + RAYCAST_SUSPENDED_ATTR + '="true"]').forEach(restore);
  }
  function parkOriginal() {
    var surface = root.CodeXRAnalysisSurfaceRuntime;
    if (surface?.setNormalVisible) {
      surface.setNormalVisible(false);
      state.originalRoots = [];
      return;
    }
    var roots = getNormalVisualizationRoots();
    if (!roots.length) { return; }
    state.originalRoots = roots;
    roots.forEach(function (element) {
      suspendSubtreeRaycast(element);
      element.setAttribute?.('visible', false);
      if (element.object3D) { element.object3D.visible = false; }
    });
  }
  function restoreOriginal() {
    var surface = root.CodeXRAnalysisSurfaceRuntime;
    if (surface?.setNormalVisible && root.CodeXRAnalysisModeRuntime?.getState?.().mode === 'single') {
      surface.setNormalVisible(true);
      return;
    }
    if (!state.originalRoots.length) { return; }
    if (root.CodeXRAnalysisModeRuntime?.getState?.().mode === 'single') {
      state.originalRoots.forEach(function (element) {
        element.setAttribute?.('visible', true);
        if (element.object3D) { element.object3D.visible = true; }
        restoreSubtreeRaycast(element);
      });
    } else {
      state.originalRoots.forEach(restoreSubtreeRaycast);
    }
    state.originalRoots = [];
  }
  function removeGraph() {
    refs.graph?.components?.[COMPONENT]?.disposeView?.();
    refs.graph?.remove?.();
    refs.graph = null;
  }
  function clearRenderRetries() {
    state.retryTimers.forEach(function (timer) { root.clearTimeout?.(timer); });
    state.retryTimers.clear();
  }
  function setTransitionLocked(locked, message) {
    state.transitionLocked = !!locked;
    if (message) { setStatus(message, false); }
    // The lock is a promise of a server answer; if none arrives the watchdog
    // releases it with a visible error instead of eating every later click.
    if (state.transitionLockTimer) {
      clearTimeout(state.transitionLockTimer);
      state.transitionLockTimer = null;
    }
    if (state.transitionLocked) {
      state.transitionLockTimer = setTimeout(function () {
        state.transitionLockTimer = null;
        if (state.transitionLocked) {
          state.transitionLocked = false;
          setStatus('The dependency analysis did not respond. Try again.', true);
          root.console?.warn?.('[CodeXR][DependencyGraph] dependency-graph-start received no response within 20s.');
        }
      }, 20000);
      state.transitionLockTimer?.unref?.();
    }
  }
  function disposeView() {
    state.active = false;
    state.viewGeneration += 1;
    state.datasetLoadGeneration += 1;
    clearRenderRetries();
    removeGraph();
    restoreOriginal();
    setTransitionLocked(false);
  }
  function isDependencyModeActiveOrActivating() {
    var modeState = root.CodeXRAnalysisModeRuntime?.getState?.();
    if (modeState?.transitioning) {
      return modeState?.pendingTransitionMode === 'dependency-graph';
    }
    return modeState?.mode === 'dependency-graph';
  }

  // intensityBucket / edgeStyle live in edgeEncoding.js (shared IIFE scope).

  function graphDensityStats(dataset) {
    var nodes = Array.isArray(dataset?.nodes) ? dataset.nodes : [];
    var edges = Array.isArray(dataset?.edges) ? dataset.edges : [];
    var degree = {};
    edges.forEach(function (edge) {
      degree[edge.source] = Number(degree[edge.source] || 0) + 1;
      degree[edge.target] = Number(degree[edge.target] || 0) + 1;
    });
    return {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      maxDegree: Math.max.apply(Math, Object.values(degree).concat([0]))
    };
  }

  function setDetailOverride(nextOverride) {
    root.CodeXRDependencyVisualBudgetRuntime?.setOverride?.(nextOverride);
    refs.graph?.components?.[COMPONENT]?.refreshVisualBudget?.();
    renderControls();
  }

  function mergeConfidence(current, next) {
    var rank = { exact: 0, probable: 1, ambiguous: 2 };
    return (rank[next] || 0) > (rank[current] || 0) ? next : current;
  }

  function buildExternalSummaryDataset(dataset) {
    var source = dataset || { nodes: [], edges: [] };
    var externalIds = new Set((source.nodes || []).filter(function (node) {
      return node.external;
    }).map(function (node) { return node.id; }));
    if (!externalIds.size) { return source; }

    var internalNodes = (source.nodes || []).filter(function (node) { return !node.external; });
    var internalIds = new Set(internalNodes.map(function (node) { return node.id; }));
    var externalEdges = (source.edges || []).filter(function (edge) {
      return externalIds.has(edge.source) || externalIds.has(edge.target);
    });
    if (!externalEdges.length) {
      return Object.assign({}, source, {
        nodes: internalNodes,
        edges: (source.edges || []).filter(function (edge) {
          return internalIds.has(edge.source) && internalIds.has(edge.target);
        })
      });
    }

    var packages = {};
    (source.nodes || []).filter(function (node) { return node.external; }).forEach(function (node) {
      packages[node.id] = node.label || node.id;
    });
    var relationKinds = {};
    var edgeMap = {};
    var totalOccurrences = 0;
    externalEdges.forEach(function (edge) {
      var internalId = externalIds.has(edge.source) ? edge.target : edge.source;
      if (!internalIds.has(internalId)) { return; }
      var outgoing = !externalIds.has(edge.source);
      var sourceId = outgoing ? internalId : EXTERNAL_SUMMARY_ID;
      var targetId = outgoing ? EXTERNAL_SUMMARY_ID : internalId;
      var key = sourceId + '|' + targetId + '|' + edge.kind;
      var occurrences = Math.max(1, Number(edge.occurrences || 1));
      relationKinds[edge.kind] = Number(relationKinds[edge.kind] || 0) + occurrences;
      totalOccurrences += occurrences;
      if (!edgeMap[key]) {
        edgeMap[key] = Object.assign({}, edge, {
          id: 'external-summary-edge:' + key,
          source: sourceId,
          target: targetId,
          occurrences: 0,
          confidence: edge.confidence || 'probable',
          syntheticExternal: true
        });
      }
      edgeMap[key].occurrences += occurrences;
      edgeMap[key].confidence = mergeConfidence(edgeMap[key].confidence, edge.confidence || 'probable');
    });

    var packageCounts = {};
    externalEdges.forEach(function (edge) {
      var externalId = externalIds.has(edge.source) ? edge.source : edge.target;
      var label = packages[externalId] || externalId;
      packageCounts[label] = Number(packageCounts[label] || 0) + Number(edge.occurrences || 1);
    });
    var topPackages = Object.keys(packageCounts).sort(function (a, b) {
      return packageCounts[b] - packageCounts[a] || a.localeCompare(b);
    }).slice(0, 3);
    var summaryNode = {
      id: EXTERNAL_SUMMARY_ID,
      kind: 'external-summary',
      label: 'External dependencies',
      external: true,
      syntheticExternal: true,
      metrics: {
        totalLines: 0,
        fanIn: 0,
        fanOut: 0,
        degree: externalEdges.length,
        dependentCount: 0,
        cycleSize: 0,
        relationCount: totalOccurrences
      },
      summary: {
        packageCount: externalIds.size,
        relationCount: totalOccurrences,
        topPackages: topPackages,
        relationKinds: relationKinds
      }
    };
    var internalEdges = (source.edges || []).filter(function (edge) {
      return internalIds.has(edge.source) && internalIds.has(edge.target);
    });
    return Object.assign({}, source, {
      nodes: internalNodes.concat([summaryNode]),
      edges: internalEdges.concat(Object.values(edgeMap))
    });
  }

  function normalizeRelativePath(value) {
    return String(value || '').replace(/\\/g, '/').replace(/^\.\/+/, '')
      .replace(/\/+/g, '/').replace(/^\/|\/$/g, '');
  }
  function directoryName(value) {
    var normalized = normalizeRelativePath(value);
    var index = normalized.lastIndexOf('/');
    return index < 0 ? '' : normalized.slice(0, index);
  }
  function baseName(value) {
    var normalized = normalizeRelativePath(value);
    var index = normalized.lastIndexOf('/');
    return index < 0 ? normalized : normalized.slice(index + 1);
  }
  function createAggregateNode(id, label, navigationPath, syntheticKind) {
    return {
      id: id, kind: 'group', label: label, relativePath: navigationPath,
      navigationPath: navigationPath, syntheticKind: syntheticKind,
      external: false,
      metrics: {
        totalLines: 0, fanIn: 0, fanOut: 0, degree: 0,
        dependentCount: 0, cycleSize: 0, relationCount: 0
      }
    };
  }
  function addNodeMetrics(target, source) {
    Object.keys(target.metrics || {}).forEach(function (metric) {
      target.metrics[metric] += Number(source?.metrics?.[metric] || 0);
    });
  }
  function aggregateProjectedEdges(edges, membership, visibleIds) {
    var edgeMap = {};
    (edges || []).forEach(function (edge) {
      var source = membership[edge.source] || edge.source;
      var target = membership[edge.target] || edge.target;
      if (!visibleIds.has(source) || !visibleIds.has(target) || source === target) { return; }
      var key = source + '|' + target + '|' + edge.kind;
      if (!edgeMap[key]) {
        edgeMap[key] = Object.assign({}, edge, {
          id: 'scope-edge:' + key, source: source, target: target, occurrences: 0
        });
      }
      edgeMap[key].occurrences += Math.max(1, Number(edge.occurrences || 1));
      edgeMap[key].confidence = mergeConfidence(
        edgeMap[key].confidence || 'exact', edge.confidence || 'probable'
      );
    });
    return Object.values(edgeMap);
  }
  function projectDirectoryScope(dataset, scopePath) {
    var current = normalizeRelativePath(scopePath);
    var prefix = current ? current + '/' : '';
    var parentPath = directoryName(current);
    var parentId = 'scope:parent:' + (current || 'root');
    var nodes = [];
    var membership = {};
    var aggregates = {};
    if (current) {
      aggregates[parentId] = createAggregateNode(parentId, '..', parentPath, 'parent');
      nodes.push(aggregates[parentId]);
    }
    (dataset.nodes || []).filter(function (node) {
      return !node.external && node.kind === 'file';
    }).forEach(function (node) {
      var relative = normalizeRelativePath(node.relativePath || node.label);
      var directParent = directoryName(relative);
      if (directParent === current) {
        membership[node.id] = node.id;
        nodes.push(Object.assign({}, node));
        return;
      }
      if (relative.indexOf(prefix) === 0) {
        var remainder = relative.slice(prefix.length);
        if (remainder.indexOf('/') >= 0) {
          var childName = remainder.split('/')[0];
          var childPath = prefix + childName;
          var childId = 'scope:directory:' + childPath;
          if (!aggregates[childId]) {
            aggregates[childId] = createAggregateNode(childId, childName, childPath, 'directory');
            nodes.push(aggregates[childId]);
          }
          membership[node.id] = childId;
          addNodeMetrics(aggregates[childId], node);
          return;
        }
      }
      if (current) {
        membership[node.id] = parentId;
        addNodeMetrics(aggregates[parentId], node);
      }
    });
    (dataset.nodes || []).filter(function (node) { return node.external; }).forEach(function (node) {
      membership[node.id] = node.id;
      nodes.push(Object.assign({}, node));
    });
    var visibleIds = new Set(nodes.map(function (node) { return node.id; }));
    return Object.assign({}, dataset, {
      nodes: nodes,
      edges: aggregateProjectedEdges(dataset.edges, membership, visibleIds),
      scopeLabel: current || '(project root)'
    });
  }
  function projectFileScope(dataset) {
    var internalSummaryId = 'codexr:internal-files-summary';
    var symbols = (dataset.nodes || []).filter(function (node) {
      return node.kind === 'symbol';
    }).map(function (node) { return Object.assign({}, node); });
    var otherFiles = (dataset.nodes || []).filter(function (node) {
      return !node.external && node.kind === 'file';
    });
    var nodes = symbols.slice();
    var membership = {};
    symbols.forEach(function (node) { membership[node.id] = node.id; });
    if (otherFiles.length) {
      var summary = createAggregateNode(
        internalSummaryId, 'Other project files', '', 'internal-files'
      );
      otherFiles.forEach(function (node) {
        membership[node.id] = internalSummaryId;
        addNodeMetrics(summary, node);
      });
      nodes.push(summary);
    }
    (dataset.nodes || []).filter(function (node) { return node.external; }).forEach(function (node) {
      membership[node.id] = node.id;
      nodes.push(Object.assign({}, node));
    });
    var visibleIds = new Set(nodes.map(function (node) { return node.id; }));
    return Object.assign({}, dataset, {
      nodes: nodes,
      edges: aggregateProjectedEdges(dataset.edges, membership, visibleIds),
      scopeLabel: dataset.targetRelativePath || 'File dependencies'
    });
  }
  function filteredDataset() {
    if (!state.snapshot) { return { nodes: [], edges: [] }; }
    var scope = state.snapshot.scope || { kind: 'directory', relativePath: '' };
    var pathKey = normalizeRelativePath(scope.relativePath);
    var selected = scope.kind === 'file'
      ? state.fileDatasets[pathKey] || (state.dataset?.targetType === 'file' ? state.dataset : null)
      : state.projectDataset || (state.dataset?.targetType === 'directory' ? state.dataset : null);
    if (!selected) { return { nodes: [], edges: [] }; }
    var projected = scope.kind === 'file'
      ? projectFileScope(selected)
      : projectDirectoryScope(selected, scope.relativePath);
    var source = state.snapshot.showExternal ? projected : buildExternalSummaryDataset(projected);
    var nodes = (source.nodes || []).filter(function (node) {
      return state.snapshot.showExternal || !node.external || node.syntheticExternal;
    });
    var ids = new Set(nodes.map(function (node) { return node.id; }));
    var edges = (source.edges || []).filter(function (edge) {
      return ids.has(edge.source) && ids.has(edge.target)
        && state.snapshot.relationFilters?.[edge.kind] !== false;
    });
    return { nodes: nodes, edges: edges, scopeLabel: projected.scopeLabel };
  }

  function publishState(patch) {
    if (!state.snapshot || state.transitionLocked) { return; }
    state.snapshot = Object.assign({}, state.snapshot, patch || {});
    client()?.sendMessage?.('dependency-graph-settings', {
      layout: state.snapshot.layout,
      showExternal: state.snapshot.showExternal,
      edgeEncoding: state.snapshot.edgeEncoding || 'relation-type',
      flowSize: state.snapshot.flowSize || FLOW_DEFAULTS.flowSize,
      flowSpeed: state.snapshot.flowSpeed || FLOW_DEFAULTS.flowSpeed,
      relationFilters: state.snapshot.relationFilters,
      mapping: state.snapshot.mapping,
      scope: state.snapshot.scope
    });
    renderControls();
    renderGraph();
  }

// == dependencyGraphRuntime.js | scalesAndControls (assembled per manifest.json; see COMPONENTS.md) ==
  function openDirectory(relativePath) {
    publishState({
      scope: { kind: 'directory', relativePath: normalizeRelativePath(relativePath) }
    });
  }

  function openFile(relativePath) {
    var normalized = normalizeRelativePath(relativePath);
    if (!normalized) { return; }
    if (state.fileDatasets[normalized]) {
      publishState({ scope: { kind: 'file', relativePath: normalized } });
      return;
    }
    // Extracting a file's symbols is a server-side analysis: an exported copy
    // can only drill into files whose dataset was cached before export.
    if (client()?.isOfflineExport?.()) {
      setStatus('File symbols are not part of this export: drilling into ' + normalized + ' needs the live CodeXR session.', true);
      return;
    }
    setStatus('Loading symbols for ' + normalized + '...', false);
    client()?.sendMessage?.('dependency-file-scope-request', { relativePath: normalized });
  }

  function cycleValue(current, candidates, direction) {
    var index = candidates.indexOf(current);
    if (index < 0) { index = 0; }
    return candidates[(index + direction + candidates.length) % candidates.length];
  }

  function getMetricMaximum(nodes, metric) {
    return Math.max.apply(Math, (nodes || []).map(function (node) {
      var value = Number(node.metrics?.[metric] || 0);
      return Number.isFinite(value) ? value : 0;
    }).concat([0]));
  }

  function computeNiceScale(maximum, targetTicks) {
    var safeMaximum = Math.max(0, Number(maximum) || 0);
    if (safeMaximum === 0) {
      return { maximum: 1, step: 1, ticks: [0, 1] };
    }
    var roughStep = safeMaximum / Math.max(1, Number(targetTicks) || AXIS_TICK_COUNT);
    var magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    var normalized = roughStep / magnitude;
    var niceFactor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    var step = niceFactor * magnitude;
    var scaleMaximum = Math.ceil(safeMaximum / step) * step;
    var ticks = [];
    for (var value = 0; value <= scaleMaximum + step * .001; value += step) {
      ticks.push(Number(value.toFixed(10)));
    }
    return { maximum: scaleMaximum, step: step, ticks: ticks };
  }

  function formatAxisValue(value) {
    var numeric = Number(value || 0);
    if (Math.abs(numeric) >= 1000000) { return (numeric / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'; }
    if (Math.abs(numeric) >= 1000) { return (numeric / 1000).toFixed(1).replace(/\.0$/, '') + 'k'; }
    if (Math.abs(numeric) >= 10 || Number.isInteger(numeric)) { return String(Math.round(numeric)); }
    return numeric.toFixed(1).replace(/\.0$/, '');
  }

  function buildMetricScales(nodes, mapping) {
    return {
      x: computeNiceScale(getMetricMaximum(nodes, mapping?.x || 'fanOut'), AXIS_TICK_COUNT),
      z: computeNiceScale(getMetricMaximum(nodes, mapping?.z || 'fanIn'), AXIS_TICK_COUNT),
      y: computeNiceScale(getMetricMaximum(nodes, mapping?.height || 'fanIn'), 5)
    };
  }

  function symbolVisual(node, layout) {
    var kind = node?.symbolKind;
    var colors = {
      module: '#14b8a6', function: '#38bdf8', method: '#22d3ee',
      class: '#f472b6', interface: '#c084fc', trait: '#a78bfa',
      struct: '#fb923c', record: '#fbbf24', enum: '#a3e635'
    };
    var shapes = {
      module: 'polyhedron', function: 'sphere', method: 'cylinder',
      class: 'pyramid', interface: 'diamond', trait: 'diamond',
      struct: 'box', record: 'box', enum: 'short-cylinder'
    };
    if (kind) {
      return { color: colors[kind] || COLORS.symbol, shape: shapes[kind] || 'sphere' };
    }
    if (node?.syntheticKind === 'parent') { return { color: COLORS.parent, shape: 'portal' }; }
    if (node?.syntheticKind === 'directory') { return { color: COLORS.directory, shape: 'box' }; }
    if (node?.syntheticKind === 'internal-files') { return { color: '#34d399', shape: 'portal' }; }
    if (node?.syntheticExternal) {
      return { color: '#fb923c', shape: layout === 'force-3d' ? 'sphere' : 'portal' };
    }
    return null;
  }

  function nodeGeometry(shape, radius) {
    var diameter = radius * 1.7;
    if (shape === 'box') {
      return 'primitive: box; width: ' + diameter + '; height: ' + diameter + '; depth: ' + diameter;
    }
    if (shape === 'portal') {
      return 'primitive: box; width: ' + (radius * 2.8) + '; height: ' + (radius * 1.8)
        + '; depth: ' + (radius * .6);
    }
    if (shape === 'cylinder') {
      return 'primitive: cylinder; radius: ' + (radius * .72) + '; height: ' + (radius * 2.1)
        + '; segmentsRadial: 16';
    }
    if (shape === 'short-cylinder') {
      return 'primitive: cylinder; radius: ' + radius + '; height: ' + (radius * .75)
        + '; segmentsRadial: 12';
    }
    if (shape === 'pyramid') {
      return 'primitive: cone; radiusBottom: ' + radius + '; radiusTop: 0; height: '
        + (radius * 2.2) + '; segmentsRadial: 4';
    }
    if (shape === 'diamond') {
      return 'primitive: octahedron; radius: ' + radius;
    }
    if (shape === 'polyhedron') {
      return 'primitive: dodecahedron; radius: ' + radius;
    }
    return 'primitive: sphere; radius: ' + radius + '; segmentsWidth: 18; segmentsHeight: 12';
  }

  // Type colour used as the legend accent (matches the node's own colour).
  function nodeAccentColor(node) {
    var visual = symbolVisual(node, 'force-3d');
    if (visual) { return visual.color; }
    if (node?.external || node?.syntheticExternal) { return '#fb923c'; }
    if (node?.syntheticKind === 'parent') { return COLORS.parent || '#64748b'; }
    if (node?.syntheticKind === 'directory' || node?.kind === 'group') { return COLORS.directory || '#38bdf8'; }
    return COLORS[node?.language] || '#38bdf8';
  }

  function nodeSubtitle(node) {
    if (node?.syntheticKind === 'parent') { return 'Parent directory'; }
    if (node?.syntheticKind === 'directory' || node?.kind === 'group') { return 'Directory'; }
    var bits = [];
    if (node?.symbolKind) { bits.push(String(node.symbolKind).toUpperCase()); }
    else if (node?.kind === 'file') { bits.push('FILE'); }
    if (node?.language) { bits.push(String(node.language)); }
    if (node?.lineStart) { bits.push('Line ' + node.lineStart); }
    else if (node?.relativePath) { bits.push(String(node.relativePath)); }
    return bits.join(' · ') || (node?.external ? 'External dependency' : 'Node');
  }

  function nodeDetailModel(node) {
    var metrics = node?.metrics || {};
    if (node?.syntheticExternal) {
      var summary = node.summary || {};
      var kindEntries = Object.keys(summary.relationKinds || {}).map(function (kind) {
        return { label: kind, value: String(summary.relationKinds[kind]) };
      });
      var kindsText = kindEntries.map(function (entry) {
        return entry.label + ' ' + entry.value;
      }).join('   ');
      return {
        title: 'External dependencies',
        subtitle: Number(summary.packageCount || 0) + ' hidden packages',
        accentColor: '#fb923c',
        rows: [
          { label: 'Packages', value: String(Number(summary.packageCount || 0)) },
          { label: 'Relations', value: String(Number(summary.relationCount || 0)) }
        ].concat(kindEntries.slice(0, 4)),
        primary: 'Relations ' + Number(summary.relationCount || 0)
          + (summary.topPackages?.length ? '   Top: ' + summary.topPackages.join(', ') : ''),
        secondary: kindsText || 'No external relation details'
      };
    }
    var fanIn = Number(metrics.fanIn || 0);
    var fanOut = Number(metrics.fanOut || 0);
    // Instability (Ce / (Ca + Ce)) — a standard dependency-health metric.
    var instability = (fanIn + fanOut) > 0 ? Math.round((fanOut / (fanIn + fanOut)) * 100) : 0;
    return {
      title: node?.label || node?.id || 'Unknown node',
      subtitle: nodeSubtitle(node),
      accentColor: nodeAccentColor(node),
      rows: [
        { label: 'Fan-in', value: String(fanIn) },
        { label: 'Fan-out', value: String(fanOut) },
        { label: 'Degree', value: String(Number(metrics.degree || 0)) },
        { label: 'Relations', value: String(Number(metrics.relationCount || 0)) },
        { label: 'Cycle', value: String(Number(metrics.cycleSize || 0)) },
        { label: 'Lines', value: String(Number(metrics.totalLines || 0)) },
        { label: 'Instab.', value: instability + '%' }
      ],
      primary: 'Fan-in ' + fanIn
        + '   Fan-out ' + fanOut
        + '   Degree ' + Number(metrics.degree || 0),
      secondary: 'Relations ' + Number(metrics.relationCount || 0)
        + '   Cycle ' + Number(metrics.cycleSize || 0)
        + '   Lines ' + Number(metrics.totalLines || 0)
    };
  }

  function edgeDetailModel(edge, nodes) {
    var accent = '#f59e0b';
    try { accent = edgeStyle(edge, 'relation-type').color || accent; } catch (_error) { /* keep default */ }
    return {
      title: String(edge?.kind || 'relation').toUpperCase(),
      subtitle: (nodes[edge?.source]?.data?.label || edge?.source || 'Unknown')
        + '  →  ' + (nodes[edge?.target]?.data?.label || edge?.target || 'Unknown'),
      accentColor: accent,
      rows: [
        { label: 'Confidence', value: String(edge?.confidence || 'unknown') },
        { label: 'Occurs', value: String(Number(edge?.occurrences || 1)) }
      ],
      primary: 'Confidence: ' + String(edge?.confidence || 'unknown'),
      secondary: 'Occurrences: ' + Number(edge?.occurrences || 1)
    };
  }

  function truncateText(value, maximumLength) {
    var normalized = String(value || '').replace(/\s+/g, ' ').trim();
    return normalized.length > maximumLength
      ? normalized.slice(0, Math.max(1, maximumLength - 3)) + '...'
      : normalized;
  }

  // All rows anchor to PANEL_ROWS (configAndStatus.js) — one place to re-space
  // the panel instead of magic Y literals scattered through the layout code.
  function rowPosition(x, y) {
    return x + ' ' + y + ' 0.02';
  }

  // Renders the active encoding's legend (from edgeEncodingLegend) into the
  // band under the flow row: colour marks at one row, labels beneath.
  function renderEdgeLegend(legend) {
    if (!refs.controls || !legend?.entries?.length) { return; }
    var pitch = legend.type === 'swatches' ? 0.74 : 0.78;
    var startX = -((legend.entries.length - 1) / 2) * pitch;
    legend.entries.forEach(function (entry, index) {
      var x = startX + (index * pitch);
      refs.controls.appendChild(entity('a-plane', {
        position: x + ' ' + PANEL_ROWS.legendMarks + ' 0.024',
        width: legend.type === 'swatches' ? 0.56 : 0.66,
        height: entry.barHeight || 0.07,
        material: 'color: ' + entry.color + '; opacity: .98; shader: flat'
      }));
      refs.controls.appendChild(text(entry.label, rowPosition(x, PANEL_ROWS.legendLabels), 0.72, '#cbd5e1', 'center', 9));
    });
  }

  function renderControls() {
    if (!refs.controls) { return; }
    while (refs.controls.firstChild) { refs.controls.removeChild(refs.controls.firstChild); }
    if (!state.snapshot) {
      refs.controls.appendChild(text(
        state.availability === 'disabled'
          ? state.unavailableReason
          : 'Waiting for the dependency snapshot...',
        rowPosition(0, PANEL_ROWS.waitingText), 5.2, state.availability === 'disabled' ? '#fca5a5' : '#fde68a'
      ));
      refs.controls.appendChild(button(
        'Re-analyze', rowPosition(0, PANEL_ROWS.waitingButton), 1.7, reanalyze, '#b45309'
      ));
      return;
    }
    var scope = state.snapshot.scope || { kind: 'directory', relativePath: '' };
    refs.controls.appendChild(text(
      (scope.kind === 'file' ? 'File: ' : 'Folder: ')
        + (normalizeRelativePath(scope.relativePath) || '(project root)'),
      rowPosition(0, PANEL_ROWS.scope), 5.2, '#67e8f9'
    ));
    var layouts = ['force-3d', 'hierarchical', 'metric-space'];
    refs.controls.appendChild(cycleButton(
      'Layout: ' + state.snapshot.layout, rowPosition(0, PANEL_ROWS.layout), 4.9,
      function () { publishState({ layout: cycleValue(state.snapshot.layout, layouts, -1) }); },
      function () { publishState({ layout: cycleValue(state.snapshot.layout, layouts, 1) }); },
      '#6d28d9',
      'Layout controls how nodes are positioned: spatial, dependency levels or metric axes.'
    ));
    var normalizedScopePath = normalizeRelativePath(scope.relativePath);
    var parentPath = directoryName(normalizedScopePath);
    var navigationLabel = scope.kind === 'file'
      ? 'Back to: ' + (parentPath || 'root')
      : normalizedScopePath
        ? 'Up: ' + (parentPath || 'root')
        : 'Project root';
    refs.controls.appendChild(attachHelp(button(
      truncateText(navigationLabel, 26),
      rowPosition(-1.55, PANEL_ROWS.nav),
      2.75,
      normalizedScopePath ? function () { openDirectory(parentPath); } : null,
      normalizedScopePath ? '#0f766e' : '#475569'
    ), normalizedScopePath
      ? navigationLabel
      : 'The dependency graph is already showing the project root.'));
    refs.controls.appendChild(attachHelp(button(
      'Root',
      rowPosition(0.15, PANEL_ROWS.nav),
      0.55,
      normalizedScopePath ? function () { openDirectory(''); } : null,
      normalizedScopePath ? '#0369a1' : '#475569'
    ), 'Return directly to the project root.'));
    var externalValues = [false, true];
    refs.controls.appendChild(cycleButton(
      state.snapshot.showExternal ? 'External: shown' : 'External: hidden',
      rowPosition(1.75, PANEL_ROWS.nav), 2.05,
      function () { publishState({ showExternal: cycleValue(state.snapshot.showExternal, externalValues, -1) }); },
      function () { publishState({ showExternal: cycleValue(state.snapshot.showExternal, externalValues, 1) }); },
      '#7c3aed',
      'External dependencies are packages or modules resolved outside the analyzed project.'
    ));
    var numericMetrics = ['degree', 'fanIn', 'fanOut', 'totalLines', 'relationCount', 'cycleSize'];
    var mappingControls = state.snapshot.layout === 'metric-space'
      ? [
        { key: 'x', label: 'X', x: -2.2 },
        { key: 'z', label: 'Z', x: -1.1 },
        { key: 'size', label: 'Size', x: 0 },
        { key: 'height', label: 'Height', x: 1.1 },
        { key: 'color', label: 'Color', x: 2.2 }
      ]
      : [
        { key: 'size', label: 'Size', x: -1.9 },
        { key: 'height', label: 'Height', x: 0 },
        { key: 'color', label: 'Color', x: 1.9 }
      ];
    mappingControls.forEach(function (mappingControl) {
      var mappingHelp = mappingControl.key === 'color'
        ? 'Color selects the metric or language used to color each node.'
        : mappingControl.key === 'height'
          ? 'Height selects the metric used to raise nodes above the table.'
          : mappingControl.key === 'size'
            ? 'Size selects the metric used to scale each node.'
            : mappingControl.key.toUpperCase() + ' selects the metric used for this spatial axis.';
      function updateMapping(direction) {
        var mapping = Object.assign({}, state.snapshot.mapping);
        var candidates = mappingControl.key === 'color'
          ? ['language', 'degree', 'fanIn', 'fanOut', 'cycleSize']
          : numericMetrics;
        mapping[mappingControl.key] = cycleValue(mapping[mappingControl.key], candidates, direction);
        publishState({ mapping: mapping });
      }
      refs.controls.appendChild(cycleButton(
        mappingControl.label + ': ' + state.snapshot.mapping?.[mappingControl.key],
        rowPosition(mappingControl.x, PANEL_ROWS.mapping),
        state.snapshot.layout === 'metric-space' ? 1.02 : 1.72,
        function () { updateMapping(-1); },
        function () { updateMapping(1); },
        '#5b21b6',
        mappingHelp
      ));
    });
    RELATIONS.forEach(function (relation, index) {
      var enabled = state.snapshot.relationFilters?.[relation] !== false;
      var toggleRelation = function () {
        var filters = Object.assign({}, state.snapshot.relationFilters);
        filters[relation] = !enabled;
        publishState({ relationFilters: filters });
      };
      var filterButton = cycleButton(
        (enabled ? 'ON ' : 'OFF ') + relation,
        rowPosition(
          -2.1 + ((index % 4) * 1.4),
          PANEL_ROWS.relationsBase - (Math.floor(index / 4) * PANEL_ROWS.relationsStep)
        ),
        1.25,
        toggleRelation,
        toggleRelation,
        enabled ? '#0f766e' : '#475569',
        RELATION_HELP[relation]
      );
      // The chip doubles as an always-visible legend: this relation's edge
      // colour, discoverable regardless of the active encoding.
      filterButton.appendChild(entity('a-plane', {
        position: '-0.57 0 0.02',
        width: 0.07,
        height: 0.3,
        material: 'color: ' + (RELATION_COLORS[relation] || '#67e8f9') + '; opacity: .98; shader: flat'
      }));
      refs.controls.appendChild(filterButton);
    });
    var currentEncoding = state.snapshot.edgeEncoding || 'relation-type';
    var encodingDef = EDGE_ENCODING_DEFS[currentEncoding] || EDGE_ENCODING_DEFS['relation-type'];
    refs.controls.appendChild(cycleButton(
      'Edges: ' + encodingDef.label, rowPosition(0, PANEL_ROWS.edges), 4.9,
      function () { publishState({ edgeEncoding: cycleValue(currentEncoding, EDGE_ENCODINGS, -1) }); },
      function () { publishState({ edgeEncoding: cycleValue(currentEncoding, EDGE_ENCODINGS, 1) }); },
      '#9a3412',
      encodingDef.help
    ));
    var flowQuality = root.CodeXRRenderBudgetRuntime?.getSnapshot?.().quality || 'full';
    var visualBudget = root.CodeXRDependencyVisualBudgetRuntime?.getSnapshot?.() || {
      override: 'auto', profile: 'sparse', effectiveProfile: 'sparse'
    };
    var detailOverrides = ['auto', 'full', 'focus'];
    refs.controls.appendChild(cycleButton(
      'Detail: ' + visualBudget.override,
      rowPosition(0, PANEL_ROWS.detail),
      4.9,
      function () {
        setDetailOverride(cycleValue(visualBudget.override, detailOverrides, -1));
      },
      function () {
        setDetailOverride(cycleValue(visualBudget.override, detailOverrides, 1));
      },
      '#334155',
      'Detail is local to this device. Auto adapts to density, Full increases contrast, and Focus emphasizes interactions.'
    ));
    // Flow-particle preferences — shared with the whole room (validated by the
    // analysis server), so every participant sees the same size and pace.
    var flowSizeIds = FLOW_SIZE_OPTIONS.map(function (option) { return option.id; });
    var flowSpeedIds = FLOW_SPEED_OPTIONS.map(function (option) { return option.id; });
    var currentFlowSize = flowSizeOption(state.snapshot.flowSize).id;
    var currentFlowSpeed = flowSpeedOption(state.snapshot.flowSpeed).id;
    refs.controls.appendChild(cycleButton(
      'Flow size: ' + flowSizeOption(currentFlowSize).label,
      rowPosition(-1.28, PANEL_ROWS.flow), 2.35,
      function () { publishState({ flowSize: cycleValue(currentFlowSize, flowSizeIds, -1) }); },
      function () { publishState({ flowSize: cycleValue(currentFlowSize, flowSizeIds, 1) }); },
      '#155e75',
      'Size of the particles travelling along the edges. Shared with the room.'
    ));
    refs.controls.appendChild(cycleButton(
      'Flow speed: ' + flowSpeedOption(currentFlowSpeed).label,
      rowPosition(1.28, PANEL_ROWS.flow), 2.35,
      function () { publishState({ flowSpeed: cycleValue(currentFlowSpeed, flowSpeedIds, -1) }); },
      function () { publishState({ flowSpeed: cycleValue(currentFlowSpeed, flowSpeedIds, 1) }); },
      '#155e75',
      'Pace of the particles travelling along the edges. Shared with the room.'
    ));
    // Per-mode edge legend: relation-kind swatches or the occurrence ramp,
    // rendered from the declarative model in edgeEncoding.js (one code path).
    renderEdgeLegend(edgeEncodingLegend(currentEncoding));
    refs.controls.appendChild(text(
      'Density: ' + visualBudget.profile + ' | Flow: ' + flowQuality + ' | Opacity = confidence',
      rowPosition(0, PANEL_ROWS.density), 5.8, '#fdba74', 'center', 64
    ));
    // Kept to a single line (high wrap-count) so it never overruns the buttons
    // below it; the panel is wide enough (background width 6.2) to stay legible.
    refs.controls.appendChild(text(
      'Shapes: sphere function | cylinder method | pyramid class | diamond interface | box folder',
      rowPosition(0, PANEL_ROWS.shapes), 5.9, '#ddd6fe', 'center', 92
    ));
    refs.controls.appendChild(button('Reset view', rowPosition(-0.9, PANEL_ROWS.actions), 1.55, resetView, '#475569'));
    refs.controls.appendChild(button('Re-analyze', rowPosition(0.9, PANEL_ROWS.actions), 1.55, reanalyze, '#b45309'));
    refs.controls.appendChild(text(
      'Hover nodes or edges for details. Click once to pin and again to release.',
      rowPosition(0, PANEL_ROWS.hover), 5.9, '#cbd5e1', 'center', 74
    ));
    refs.status = text(state.snapshot.message || '', rowPosition(0, PANEL_ROWS.status), 5.6, '#fde68a');
    refs.controls.appendChild(refs.status);
  }

  function buildPanel() {
    if (refs.controls || !root.CodeXRMappingUiRuntime?.registerPanelView) { return; }
    if (!root.CodeXRMappingUiRuntime.isPanelReady?.()) {
      // Event-driven: register as soon as the controller panel exists.
      if (!refs.panelMountQueued) {
        refs.panelMountQueued = true;
        root.CodeXRMappingUiRuntime.whenPanelReady?.(function () {
          refs.panelMountQueued = false;
          buildPanel();
        });
      }
      return;
    }
    refs.controls = entity('a-entity', { position: '0 0 0.04' });
    state.unregisterPanel = root.CodeXRMappingUiRuntime.registerPanelView({
      id: 'dependency-graph',
      title: 'Dependencies',
      headerButton: false,
      panelHeight: PANEL_ROWS.panelHeight,
      content: refs.controls,
      onShow: renderControls
    });
  }

  function createLayoutWorker() {
    var source = [
      'self.onmessage=function(event){',
      'var p=event.data,n=p.nodes||[],e=p.edges||[],layout=p.layout,w=p.width,d=p.depth,m=p.mapping||{},s=p.scales||{};',
      'var out={};',
      'if(layout==="hierarchical"){var incoming={};n.forEach(function(x){incoming[x.id]=0;});e.forEach(function(x){incoming[x.target]=(incoming[x.target]||0)+1;});',
      'var levels={};n.forEach(function(x){var l=Math.min(6,incoming[x.id]||0);(levels[l]||(levels[l]=[])).push(x);});',
      'Object.keys(levels).forEach(function(k){var a=levels[k];a.forEach(function(x,i){out[x.id]={x:-w/2+(Number(k)+.5)*(w/7),y:.12+(i%4)*.18,z:-d/2+((i+.5)/a.length)*d};});});',
      '}else if(layout==="metric-space"){var xMetric=m.x||"fanOut",zMetric=m.z||"fanIn",maxX=Math.max(1,Number(s.x&&s.x.maximum||1)),maxZ=Math.max(1,Number(s.z&&s.z.maximum||1));n.forEach(function(x){out[x.id]={x:-w/2+(Number(x.metrics[xMetric]||0)/maxX)*w,y:.12,z:-d/2+(Number(x.metrics[zMetric]||0)/maxZ)*d};});',
      '}else{var count=Math.max(1,n.length);n.forEach(function(x,i){var ring=Math.floor(Math.sqrt(i)),angle=i*2.399963;var radius=Math.min(Math.min(w,d)*.45,.28+ring*.22);out[x.id]={x:Math.cos(angle)*radius,y:.12+(i%5)*.09,z:Math.sin(angle)*radius};});}',
      'self.postMessage({generation:p.generation,positions:out});};'
    ].join('');
    return new root.Worker(root.URL.createObjectURL(new root.Blob([source], { type: 'application/javascript' })));
  }

// == dependencyGraphRuntime.js | componentCore (assembled per manifest.json; see COMPONENTS.md) ==
  function registerComponent() {
    if (!AFRAME?.registerComponent || AFRAME.components[COMPONENT]) { return; }
    AFRAME.registerComponent(COMPONENT, {
      init: function () {
        this.worker = null;
        this.nodes = {};
        this.edges = [];
        this.edgeObjects = [];
        this.edgeRecords = {};
        this.edgeBatches = {};
        this.edgeBatchObjects = [];
        this.edgeTransform = root.THREE ? new root.THREE.Object3D() : null;
        this.flowPoints = null;
        this.flowGeometry = null;
        this.flowPositions = null;
        this.flowColors = null;
        this.flowClock = 0;
        this.flowQuality = root.CodeXRRenderBudgetRuntime?.getSnapshot?.().quality || 'full';
        this.visualBudget = root.CodeXRDependencyVisualBudgetRuntime?.getSnapshot?.() || {
          profile: 'sparse',
          effectiveProfile: 'sparse',
          override: 'auto',
          widths: FALLBACK_INTENSITY_WIDTHS,
          flowLimit: 300,
          arrowsForAll: true
        };
        this.focusEdgeObjects = [];
        this.focusEdgeIds = new Set();
        this.lastFlowCount = 0;
        this.visibleArrowCount = 0;
        this.selectionHalos = {};
        this.selectionStartedAt = 0;
        this.axisObjects = [];
        this.axesRoot = null;
        this.legendCards = {};
        this.legendBoard = null;
        this.legendBoardYaw = null;
        this.scopeLabelRoot = null;
        this.scopeLabelChip = null;
        this.scopeLabelDockedState = false;
        this.scopeLabelDockPhase = 0;
        this.pinnedSelections = [];
        this.hoveredSelection = null;
        this.graphTopY = GRAPH_BASE_Y;
        this.layoutGeneration = 0;
        this.pendingGraph = null;
        this.transition = null;
        this.transitionFrame = null;
        this.transitionDuration = root.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ? 0 : 600;
        this.ensureWorker();
        var self = this;
        this.disposeRenderBudget = root.CodeXRRenderBudgetRuntime?.subscribe?.(function (budget) {
          var qualityChanged = self.flowQuality !== budget.quality;
          self.flowQuality = budget.quality;
          self.refreshVisualBudget();
          if (qualityChanged) { renderControls(); }
        }) || null;
      },
      tick: function (time, timeDelta) {
        // Legends follow the user: the board (all cards, rigid group) and the
        // scope breadcrumb yaw-billboard toward the camera. Rotating the group
        // as one keeps the cards' relative layout fixed — they can never rotate
        // into overlapping each other.
        this.updateLegendBoard();
        if (this.scopeLabelRoot?.object3D) {
          root.CodeXRCommonRuntime?.faceCameraYaw?.(this.scopeLabelRoot, this.el.sceneEl);
        }
        this.updateHighlightTransition();
        this.updateSelectionHalo(time || 0);
        this.updateFocusEdges();
        this.updateFlow(timeDelta);
        this.updateScopeLabelDock(timeDelta);
      },
      remove: function () {
        this.disposeView();
        this.disposeRenderBudget?.();
        this.disposeRenderBudget = null;
        this.worker?.terminate?.();
        this.worker = null;
      },
      ensureWorker: function () {
        if (this.worker) {
          return this.worker;
        }
        this.worker = createLayoutWorker();
        this.worker.onmessage = this.applyPositions.bind(this);
        return this.worker;
      },
      disposeView: function () {
        this.layoutGeneration += 1;
        this.pendingGraph = null;
        this.transition = null;
        if (this.transitionFrame !== null) {
          root.cancelAnimationFrame?.(this.transitionFrame);
          this.transitionFrame = null;
        }
        this.clear();
      },
      resetView: function () {
        this.hideAllLegends();
        this.clear(false);
        if (this.currentDataset && this.currentView) {
          this.setGraph(this.currentDataset, this.currentView);
        }
      },
      clear: function (preserveSelection) {
        (this.edgeObjects || []).forEach(function (line) {
          line.parent?.remove?.(line);
          line.geometry?.dispose?.();
          line.material?.dispose?.();
        }, this);
        this.disposeEdgeBatches();
        this.disposeFlowLayer();
        this.disposeFocusEdges();
        this.disposeSelectionHalos();
        (this.axisObjects || []).forEach(function (object) {
          object.parent?.remove?.(object);
          object.geometry?.dispose?.();
          object.material?.dispose?.();
        });
        while (this.el.firstChild) { this.el.removeChild(this.el.firstChild); }
        this.nodes = {};
        this.edges = [];
        this.edgeObjects = [];
        this.edgeRecords = {};
        this.edgeBatches = {};
        this.edgeBatchObjects = [];
        this.axisObjects = [];
        this.axesRoot = null;
        // The legend board (cards + connectors inside it) was a child of this.el
        // and is gone with the firstChild sweep above; drop the stale references.
        this.legendCards = {};
        this.legendBoard = null;
        this.legendBoardYaw = null;
        this.scopeLabel = null;
        this.scopeLabelRoot = null;
        this.scopeLabelChip = null;
        this.scopeLabelDockedState = false;
        this.scopeLabelDockPhase = 0;
        this.hoveredSelection = null;
        this.lastFlowCount = 0;
        this.visibleArrowCount = 0;
        this.graphTopY = GRAPH_BASE_Y;
        if (!preserveSelection) { this.pinnedSelections = []; }
      },
      setGraph: function (dataset, view) {
        dataset = dataset || { nodes: [], edges: [] };
        dataset.nodes = Array.isArray(dataset.nodes) ? dataset.nodes : [];
        dataset.edges = Array.isArray(dataset.edges) ? dataset.edges : [];
        var renderableIds = new Set(dataset.nodes.map(function (node) { return node.id; }));
        dataset = Object.assign({}, dataset, {
          nodes: dataset.nodes.slice(),
          edges: dataset.edges.filter(function (edge) {
            return renderableIds.has(edge.source) && renderableIds.has(edge.target);
          })
        });
        this.currentDataset = dataset;
        this.currentView = view;
        // Drop any breadcrumb that isn't the tracked one before (re)building —
        // kills a residue left at the old position by a prior mount/re-render,
        // however it got orphaned, so two can never stack.
        if (this.el.querySelectorAll) {
          var trackedRoot = this.scopeLabelRoot;
          this.el.querySelectorAll('.codexr-scope-breadcrumb').forEach(function (breadcrumb) {
            if (breadcrumb !== trackedRoot) {
              breadcrumb.parentNode && breadcrumb.parentNode.removeChild(breadcrumb);
            }
          });
        }
        if (!this.scopeLabelRoot?.isConnected) {
          this.scopeLabelRoot = entity('a-entity', {
            position: SCOPE_LABEL_HOME,
            class: 'codexr-scope-breadcrumb'
          });
          // Dark contrast chip behind the breadcrumb so the path stays legible
          // over the graph and the white table; depthTest:false keeps it from
          // being occluded by nodes/edges at either the home or docked position.
          this.scopeLabelChip = entity('a-plane', {
            position: '0 0 -0.01',
            width: 3, height: 0.34,
            material: 'color: #0b1220; opacity: 0.82; shader: flat; side: double; transparent: true; depthTest: false'
          });
          this.scopeLabel = text('', '0 0 0.02', 5.4, '#67e8f9');
          this.scopeLabel.setAttribute('side', 'double');
          this.scopeLabelRoot.appendChild(this.scopeLabelChip);
          this.scopeLabelRoot.appendChild(this.scopeLabel);
          this.el.appendChild(this.scopeLabelRoot);
          this.scopeLabelDockedState = false;
          this.scopeLabelDockPhase = 0;
        }
        var scopeText = (view.scope?.kind === 'file' ? 'File: ' : 'Folder: ')
          + (normalizeRelativePath(view.scope?.relativePath) || '(project root)');
        this.scopeLabel.setAttribute('value', scopeText);
        // Snug the chip to the text (~0.129 per char at this label width/wrap).
        this.scopeLabelChip.setAttribute(
          'width',
          Math.max(1.5, Math.min(5.4, scopeText.length * 0.129 + 0.35))
        );
        var layoutNodes = dataset.nodes.filter(function (node) { return !node.syntheticExternal; });
        var metricScales = buildMetricScales(layoutNodes, view.mapping);
        var maxMetric = Math.max.apply(Math, layoutNodes.map(function (node) {
          return Number(node.metrics?.[view.mapping?.size || 'degree'] || 0);
        }).concat([1]));
        var visuals = {};
        dataset.nodes.forEach(function (node) {
          var metric = Number(node.metrics?.[view.mapping?.size || 'degree'] || 0);
          var radius = 0.055 + Math.sqrt(metric / maxMetric) * 0.14;
          var colorMetric = view.mapping?.color || 'language';
          var numericColor = Number(node.metrics?.[colorMetric]);
          var color = colorMetric === 'language'
            ? (COLORS[node.language] || COLORS[node.external ? 'external' : 'TypeScript'])
            : numericGradient(numericColor, maxMetric);
          var semanticVisual = symbolVisual(node, view.layout);
          if (semanticVisual) {
            color = semanticVisual.color;
          }
          if (node.syntheticExternal || node.syntheticKind) {
            radius = .16;
          }
          visuals[node.id] = {
            radius: radius,
            color: color,
            shape: semanticVisual?.shape || (node.kind === 'group' ? 'box' : 'sphere')
          };
        });
        var visualBudget = root.CodeXRDependencyVisualBudgetRuntime?.update?.(
          graphDensityStats(dataset),
          this.flowQuality
        ) || this.visualBudget;
        var generation = ++this.layoutGeneration;
        this.pendingGraph = {
          generation: generation,
          dataset: dataset,
          view: view,
          metricScales: metricScales,
          visuals: visuals,
          edges: dataset.edges,
          visualBudget: visualBudget
        };
        this.ensureWorker().postMessage({
          generation: generation,
          nodes: layoutNodes,
          edges: this.pendingGraph.edges,
          layout: view.layout,
          mapping: view.mapping,
          scales: metricScales,
          width: GRAPH_WIDTH,
          depth: GRAPH_DEPTH
        });
      },
      // While a detail card is visible the scope breadcrumb dodges out of the
      // card's band (HOME -> DOCKED) and returns when the card hides. This only
      // records the target; the move is tweened deterministically in tick() so
      // it never depends on the A-Frame animation component re-firing.
      setScopeLabelDocked: function (docked) {
        this.scopeLabelDockedState = !!docked;
      },
      updateScopeLabelDock: function (timeDelta) {
        var group = this.scopeLabelRoot;
        if (!group || !group.object3D) { return; }
        var target = this.scopeLabelDockedState ? 1 : 0;
        if (this.scopeLabelDockPhase === undefined) { this.scopeLabelDockPhase = target; }
        if (this.scopeLabelDockPhase === target) { return; }
        var step = Math.min(1, Math.max(0, (Number(timeDelta) || 16) / 220));
        this.scopeLabelDockPhase = target > this.scopeLabelDockPhase
          ? Math.min(target, this.scopeLabelDockPhase + step)
          : Math.max(target, this.scopeLabelDockPhase - step);
        var t = this.scopeLabelDockPhase;
        var eased = t * t * (3 - 2 * t);
        group.object3D.position.set(
          SCOPE_LABEL_HOME_VEC.x + (SCOPE_LABEL_DOCKED_VEC.x - SCOPE_LABEL_HOME_VEC.x) * eased,
          SCOPE_LABEL_HOME_VEC.y + (SCOPE_LABEL_DOCKED_VEC.y - SCOPE_LABEL_HOME_VEC.y) * eased,
          SCOPE_LABEL_HOME_VEC.z + (SCOPE_LABEL_DOCKED_VEC.z - SCOPE_LABEL_HOME_VEC.z) * eased
        );
      },
      applyPositions: function (event) {
        var response = event.data || {};
        if (!this.pendingGraph || response.generation !== this.pendingGraph.generation) { return; }
        var positions = response.positions || {};
        var pending = this.pendingGraph;
        var summary = pending.dataset.nodes.find(function (node) { return node.syntheticExternal; });
        if (summary) {
          positions[summary.id] = pending.view.layout === 'force-3d'
            ? { x: GRAPH_WIDTH * .38, y: GRAPH_HEIGHT * .72, z: -GRAPH_DEPTH * .36 }
            : { x: GRAPH_WIDTH * .39, y: GRAPH_HEIGHT * .62, z: GRAPH_DEPTH * .34 };
        }
        this.pendingGraph = null;
        this.beginTransition(pending, positions);
      },
      createNodeRecord: function (node, visual, startPosition) {
        var self = this;
        var nodeEl = entity('a-entity', {
          geometry: nodeGeometry(visual.shape, visual.radius),
          material: 'color: ' + visual.color + '; shader: flat; transparent: true; opacity: 0',
          class: RAYCAST_CLASS,
          'data-node-id': node.id,
          'data-codexr-interactive': 'true'
        });
        nodeEl.object3D.position.copy(startPosition);
        nodeEl.object3D.scale.setScalar(0);
        nodeEl.addEventListener('mouseenter', function () {
          self.showTransientSelection({ type: 'node', id: node.id });
        });
        nodeEl.addEventListener('mouseleave', function () {
          self.hideTransientSelection({ type: 'node', id: node.id });
        });
        nodeEl.addEventListener('click', function (clickEvent) {
          clickEvent.stopPropagation?.();
          self.togglePinnedSelection({ type: 'node', id: node.id });
        });
        this.el.appendChild(nodeEl);
        return {
          el: nodeEl,
          data: node,
          radius: visual.radius,
          shape: visual.shape,
          highlightTarget: 1,
          highlightColor: false,
          baseColor: visual.color
        };
      },
      beginTransition: function (pending, positions) {
        if (!root.THREE) { return; }
        var self = this;
        var heightMetric = pending.view.mapping?.height || 'fanIn';
        var heightMaximum = Math.max(1, Number(pending.metricScales?.y?.maximum || 1));
        var targetIds = new Set();
        var nodeTransitions = [];
        Object.keys(positions).forEach(function (id) {
          var node = pending.dataset.nodes.find(function (candidate) { return candidate.id === id; });
          var visual = pending.visuals[id];
          if (!node || !visual) { return; }
          targetIds.add(id);
          var p = positions[id];
          var mappedHeight = (Math.max(0, Number(node.metrics?.[heightMetric] || 0)) / heightMaximum) * GRAPH_HEIGHT;
          var targetPosition = new root.THREE.Vector3(p.x, p.y + mappedHeight, p.z);
          var record = self.nodes[id];
          if (!record) {
            var connected = pending.edges.find(function (edge) {
              return edge.source === id && self.nodes[edge.target]
                || edge.target === id && self.nodes[edge.source];
            });
            var neighborId = connected
              ? (connected.source === id ? connected.target : connected.source)
              : null;
            var startPosition = neighborId && self.nodes[neighborId]
              ? self.nodes[neighborId].el.object3D.position.clone()
              : new root.THREE.Vector3(0, GRAPH_BASE_Y, 0);
            record = self.createNodeRecord(node, visual, startPosition);
            self.nodes[id] = record;
          }
          var material = record.el.getAttribute('material') || {};
          var previousRadius = Math.max(.0001, Number(record.radius || visual.radius));
          nodeTransitions.push({
            id: id,
            record: record,
            remove: false,
            fromPosition: record.el.object3D.position.clone(),
            toPosition: targetPosition,
            fromScale: Number(record.el.object3D.scale.x || 0),
            toScale: visual.radius / previousRadius,
            fromOpacity: Number(material.opacity ?? 1),
            toOpacity: 1,
            fromColor: new root.THREE.Color(material.color || visual.color),
            toColor: new root.THREE.Color(visual.color)
          });
          record.data = node;
          record.targetRadius = visual.radius;
          record.shape = visual.shape;
          record.baseColor = visual.color;
        });
        Object.keys(this.nodes).forEach(function (id) {
          if (targetIds.has(id)) { return; }
          var record = self.nodes[id];
          var material = record.el.getAttribute('material') || {};
          nodeTransitions.push({
            id: id,
            record: record,
            remove: true,
            fromPosition: record.el.object3D.position.clone(),
            toPosition: record.el.object3D.position.clone(),
            fromScale: Number(record.el.object3D.scale.x || 1),
            toScale: 0,
            fromOpacity: Number(material.opacity ?? 1),
            toOpacity: 0,
            fromColor: new root.THREE.Color(material.color || '#64748b'),
            toColor: new root.THREE.Color(material.color || '#64748b')
          });
        });
        this.visualBudget = pending.visualBudget || this.visualBudget;
        this.reconcileEdges(pending.edges, pending.view);
        this.dataset = pending.dataset;
        this.edges = pending.edges;
        this.view = pending.view;
        this.metricScales = pending.metricScales;
        this.transition = {
          startedAt: null,
          duration: this.transitionDuration,
          nodes: nodeTransitions,
          edgeIds: new Set(pending.edges.map(function (edge) { return edge.id; }))
        };
        // Write every edge's geometry + encoding colour immediately: the batches
        // were just recreated with seeded (white) instance colours, and the real
        // colours must not depend on the transition loop getting its first frame.
        this.refreshEdgeColors(this.hasActiveSelection());
        this.scheduleTransitionFrame();
      },
      refreshVisualBudget: function () {
        if (!this.edges?.length) {
          this.visualBudget = root.CodeXRDependencyVisualBudgetRuntime?.update?.(
            { nodeCount: Object.keys(this.nodes || {}).length, edgeCount: 0, maxDegree: 0 },
            this.flowQuality
          ) || this.visualBudget;
          return;
        }
        this.visualBudget = root.CodeXRDependencyVisualBudgetRuntime?.update?.(
          graphDensityStats({ nodes: Object.values(this.nodes).map(function (record) { return record.data; }), edges: this.edges }),
          this.flowQuality
        ) || this.visualBudget;
        this.reconcileEdges(this.edges, this.view || {});
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          var record = this.edgeRecords[edgeId];
          if (!record.remove) { this.updateEdgeGeometry(record); }
        }, this);
        this.refreshEdgeColors(this.hasActiveSelection());
        this.rebuildFocusEdges();
        this.updateFlowVisibility();
      },
      scheduleTransitionFrame: function () {
        if (!this.transition) { return; }
        if (this.transitionDuration === 0 || !root.requestAnimationFrame) {
          this.updateTransition(root.performance?.now?.() || Date.now(), true);
          return;
        }
        if (this.transitionFrame !== null) {
          root.cancelAnimationFrame?.(this.transitionFrame);
        }
        var self = this;
        this.transitionFrame = root.requestAnimationFrame(function (time) {
          self.transitionFrame = null;
          self.updateTransition(time, false);
        });
      },
// == dependencyGraphRuntime.js | edgesAndHighlights (assembled per manifest.json; see COMPONENTS.md) ==
      disposeEdgeBatches: function () {
        (this.edgeBatchObjects || []).forEach(function (object) {
          object.parent?.remove?.(object);
          object.geometry?.dispose?.();
          object.material?.dispose?.();
        });
        this.edgeBatches = {};
        this.edgeBatchObjects = [];
      },
      disposeFocusEdges: function () {
        (this.focusEdgeObjects || []).forEach(function (record) {
          [record.body, record.arrow].forEach(function (object) {
            object?.parent?.remove?.(object);
            object?.geometry?.dispose?.();
            object?.material?.dispose?.();
          });
        });
        this.focusEdgeObjects = [];
        this.focusEdgeIds = new Set();
      },
      rebuildFocusEdges: function () {
        this.disposeFocusEdges();
        if (!root.THREE || !this.hasActiveSelection()) { return; }
        var records = Object.values(this.edgeRecords).filter(function (record) {
          return !record.remove && (record.highlighted || this.isEdgeActive(record.data));
        }, this).sort(function (left, right) {
          return Number(right.data.occurrences || 1) - Number(left.data.occurrences || 1);
        }).slice(0, 40);
        records.forEach(function (record) {
          this.focusEdgeIds.add(record.data.id);
          var opacity = root.CodeXRDependencyVisualBudgetRuntime?.opacityFor?.(
            this.visualBudget?.effectiveProfile || 'balanced',
            record.data.confidence || 'probable',
            true
          ) || .94;
          var material = new root.THREE.MeshBasicMaterial({
            color: record.style?.color || '#fcd34d',
            transparent: true,
            opacity: opacity,
            depthWrite: false
          });
          var body = new root.THREE.Mesh(
            new root.THREE.CylinderGeometry(.01, .01, 1, 8),
            material
          );
          var arrow = new root.THREE.Mesh(
            new root.THREE.ConeGeometry(.026, .085, 8),
            material.clone()
          );
          body.frustumCulled = false;
          arrow.frustumCulled = false;
          this.el.object3D.add(body);
          this.el.object3D.add(arrow);
          this.focusEdgeObjects.push({ record: record, body: body, arrow: arrow });
        }, this);
        this.updateFocusEdges();
      },
      updateFocusEdges: function () {
        if (!root.THREE) { return; }
        (this.focusEdgeObjects || []).forEach(function (focus) {
          var source = this.nodes[focus.record.data.source]?.el?.object3D?.position;
          var target = this.nodes[focus.record.data.target]?.el?.object3D?.position;
          if (!source || !target) {
            focus.body.visible = false;
            focus.arrow.visible = false;
            return;
          }
          var direction = target.clone().sub(source);
          var length = Math.max(.001, direction.length());
          var normalized = direction.clone().normalize();
          var midpoint = source.clone().add(target).multiplyScalar(.5);
          var width = Math.max(.009, Number(focus.record.style?.width || .006) * 1.85);
          focus.body.visible = true;
          focus.body.position.copy(midpoint);
          focus.body.quaternion.setFromUnitVectors(new root.THREE.Vector3(0, 1, 0), normalized);
          focus.body.scale.set(width / .01, length, width / .01);
          focus.arrow.visible = true;
          focus.arrow.position.copy(target).addScaledVector(normalized, -.075);
          focus.arrow.quaternion.setFromUnitVectors(new root.THREE.Vector3(0, 1, 0), normalized);
          focus.arrow.scale.setScalar(Math.max(.9, width / .012));
        }, this);
      },
      createEdgeBatch: function (confidence, count) {
        if (!root.THREE || count < 1) { return null; }
        var opacity = root.CodeXRDependencyVisualBudgetRuntime?.opacityFor?.(
          this.visualBudget?.effectiveProfile || 'balanced',
          confidence,
          false
        ) || FALLBACK_CONFIDENCE_OPACITY[confidence] || FALLBACK_CONFIDENCE_OPACITY.probable;
        // NOTE: no `vertexColors` here — the cylinder/cone geometries carry no
        // per-vertex colour attribute, and enabling it made the shader multiply
        // by a missing attribute (black edges everywhere, setColorAt ignored).
        // Instance colours only need the instanceColor buffer, seeded below
        // BEFORE first render so the material compiles with instancing colour.
        var body = new root.THREE.InstancedMesh(
          new root.THREE.CylinderGeometry(.01, .01, 1, 6),
          new root.THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true,
            opacity: opacity, depthWrite: false
          }),
          count
        );
        var arrows = new root.THREE.InstancedMesh(
          new root.THREE.ConeGeometry(.026, .085, 6),
          new root.THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true,
            opacity: Math.min(1, opacity + .12), depthWrite: false
          }),
          count
        );
        var seed = new root.THREE.Color('#ffffff');
        for (var index = 0; index < count; index++) {
          body.setColorAt(index, seed);
          arrows.setColorAt(index, seed);
        }
        if (body.instanceColor) { body.instanceColor.needsUpdate = true; }
        if (arrows.instanceColor) { arrows.instanceColor.needsUpdate = true; }
        body.instanceMatrix.setUsage?.(root.THREE.DynamicDrawUsage);
        arrows.instanceMatrix.setUsage?.(root.THREE.DynamicDrawUsage);
        body.frustumCulled = false;
        arrows.frustumCulled = false;
        this.el.object3D.add(body);
        this.el.object3D.add(arrows);
        this.edgeBatchObjects.push(body, arrows);
        return { body: body, arrows: arrows, nextIndex: 0 };
      },
      createEdgeRecord: function (edge) {
        if (!root.THREE) { return null; }
        var self = this;
        var hitMesh = new root.THREE.Mesh(
          new root.THREE.CylinderGeometry(.018, .018, 1, 6),
          new root.THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
            colorWrite: false,
            visible: false
          })
        );
        var edgeEl = entity('a-entity', {
          class: RAYCAST_CLASS,
          'data-edge-id': edge.id,
          'data-codexr-interactive': 'true'
        });
        edgeEl.setObject3D('edge-hit-target', hitMesh);
        edgeEl.addEventListener('mouseenter', function () {
          self.showTransientSelection({ type: 'edge', id: edge.id });
        });
        edgeEl.addEventListener('mouseleave', function () {
          self.hideTransientSelection({ type: 'edge', id: edge.id });
        });
        edgeEl.addEventListener('click', function (clickEvent) {
          clickEvent.stopPropagation?.();
          self.togglePinnedSelection({ type: 'edge', id: edge.id });
        });
        this.el.appendChild(edgeEl);
        this.edgeObjects.push(hitMesh);
        return {
          el: edgeEl,
          data: edge,
          hitMesh: hitMesh,
          midpoint: new root.THREE.Vector3(),
          style: edgeStyle(edge, this.view?.edgeEncoding || 'relation-type', this.visualBudget),
          batch: null,
          instanceIndex: -1,
          remove: false
        };
      },
      reconcileEdges: function (nextEdges, nextView) {
        var self = this;
        var nextIds = new Set();
        this.disposeEdgeBatches();
        var confidenceCounts = {};
        nextEdges.forEach(function (edge) {
          var key = edge.confidence || 'probable';
          confidenceCounts[key] = Number(confidenceCounts[key] || 0) + 1;
        });
        Object.keys(confidenceCounts).forEach(function (confidence) {
          self.edgeBatches[confidence] = self.createEdgeBatch(confidence, confidenceCounts[confidence]);
        });
        nextEdges.forEach(function (edge) {
          nextIds.add(edge.id);
          var record = self.edgeRecords[edge.id];
          if (!record) {
            record = self.createEdgeRecord(edge);
            if (!record) { return; }
            self.edgeRecords[edge.id] = record;
          }
          record.data = edge;
          record.style = edgeStyle(
            edge,
            nextView?.edgeEncoding || self.view?.edgeEncoding || 'relation-type',
            self.visualBudget
          );
          record.batch = self.edgeBatches[edge.confidence || 'probable'];
          record.instanceIndex = record.batch ? record.batch.nextIndex++ : -1;
          record.remove = false;
        });
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          if (nextIds.has(edgeId)) { return; }
          var record = self.edgeRecords[edgeId];
          record.batch = null;
          record.instanceIndex = -1;
          record.hitMesh.visible = false;
          record.remove = true;
        });
      },
      updateEdgeGeometry: function (record) {
        if (!root.THREE) { return; }
        var source = this.nodes[record.data.source]?.el?.object3D?.position;
        var target = this.nodes[record.data.target]?.el?.object3D?.position;
        if (!source || !target || !record.batch || record.instanceIndex < 0) {
          record.hitMesh.visible = false;
          return;
        }
        record.hitMesh.visible = true;
        record.midpoint.copy(source).add(target).multiplyScalar(.5);
        var direction = target.clone().sub(source);
        var length = Math.max(.001, direction.length());
        record.hitMesh.position.copy(record.midpoint);
        record.hitMesh.scale.set(1, length, 1);
        record.hitMesh.quaternion.setFromUnitVectors(
          new root.THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
        var style = record.style || edgeStyle(
          record.data,
          this.view?.edgeEncoding || 'relation-type',
          this.visualBudget
        );
        var normalizedDirection = direction.clone().normalize();
        this.edgeTransform.position.copy(record.midpoint);
        this.edgeTransform.quaternion.setFromUnitVectors(
          new root.THREE.Vector3(0, 1, 0),
          normalizedDirection
        );
        this.edgeTransform.scale.set(style.width / .01, length, style.width / .01);
        this.edgeTransform.updateMatrix();
        record.batch.body.setMatrixAt(record.instanceIndex, this.edgeTransform.matrix);
        record.batch.body.setColorAt(record.instanceIndex, new root.THREE.Color(style.color));

        var showArrow = this.visualBudget?.arrowsForAll || this.focusEdgeIds.has(record.data.id);
        this.edgeTransform.position.copy(target).addScaledVector(normalizedDirection, -.075);
        this.edgeTransform.quaternion.setFromUnitVectors(
          new root.THREE.Vector3(0, 1, 0),
          normalizedDirection
        );
        this.edgeTransform.scale.setScalar(showArrow ? Math.max(.75, style.width / .012) : 0);
        this.edgeTransform.updateMatrix();
        record.batch.arrows.setMatrixAt(record.instanceIndex, this.edgeTransform.matrix);
        record.batch.arrows.setColorAt(record.instanceIndex, new root.THREE.Color(style.color));
      },
      flushEdgeBatches: function () {
        Object.values(this.edgeBatches || {}).forEach(function (batch) {
          if (!batch) { return; }
          batch.body.instanceMatrix.needsUpdate = true;
          batch.arrows.instanceMatrix.needsUpdate = true;
          if (batch.body.instanceColor) { batch.body.instanceColor.needsUpdate = true; }
          if (batch.arrows.instanceColor) { batch.arrows.instanceColor.needsUpdate = true; }
        });
      },
      isEdgeActive: function (edge) {
        var active = this.activeSelections ? this.activeSelections() : [];
        if (!active.length) { return false; }
        return active.some(function (selection) {
          if (selection.type === 'edge') { return selection.id === edge.id; }
          return edge.source === selection.id || edge.target === selection.id;
        });
      },
      refreshEdgeColors: function (anySelected) {
        if (!root.THREE) { return; }
        this.visibleArrowCount = 0;
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          var record = this.edgeRecords[edgeId];
          if (!record.batch || record.instanceIndex < 0) { return; }
          var active = !anySelected || record.highlighted;
          var color = new root.THREE.Color(record.style?.color || '#67e8f9');
          if (!active) { color.multiplyScalar(.42); }
          this.updateEdgeGeometry(record);
          record.batch.body.setColorAt(record.instanceIndex, color);
          record.batch.arrows.setColorAt(record.instanceIndex, color);
        }, this);
        this.flushEdgeBatches();
      },
      updateHighlightTransition: function () {
        Object.keys(this.nodes).forEach(function (nodeId) {
          var record = this.nodes[nodeId];
          var material = record.el.getAttribute('material') || {};
          var current = Number(material.opacity ?? 1);
          var target = Number(record.highlightTarget ?? 1);
          if (Math.abs(current - target) < .01) { current = target; }
          else { current += (target - current) * .16; }
          record.el.setAttribute('material', 'opacity', current);
          record.el.setAttribute('material', 'transparent', current < .999);
          if (root.THREE && record.baseColor) {
            var targetColor = new root.THREE.Color(record.baseColor);
            if (record.highlightColor) {
              targetColor.lerp(new root.THREE.Color('#ffffff'), .28);
            }
            var currentColor = new root.THREE.Color(material.color || record.baseColor);
            currentColor.lerp(targetColor, .18);
            record.el.setAttribute('material', 'color', '#' + currentColor.getHexString());
          }
        }, this);
      },
      disposeSingleHalo: function (halo) {
        if (!halo) { return; }
        halo.parent?.remove?.(halo);
        halo.geometry?.dispose?.();
        halo.material?.dispose?.();
      },
      // One pulsing halo per pinned/hovered node; syncs the live set to `nodeIds`.
      syncSelectionHalos: function (nodeIds) {
        this.selectionHalos = this.selectionHalos || {};
        if (!root.THREE) { return; }
        var wanted = {};
        (nodeIds || []).forEach(function (id) { wanted[id] = true; });
        Object.keys(this.selectionHalos).forEach(function (id) {
          if (!wanted[id]) {
            this.disposeSingleHalo(this.selectionHalos[id]);
            delete this.selectionHalos[id];
          }
        }, this);
        (nodeIds || []).forEach(function (id) {
          if (this.selectionHalos[id] || !this.nodes[id]) { return; }
          var radius = Math.max(.09, Number(this.nodes[id].radius || .1)) * 1.5;
          var halo = new root.THREE.Mesh(
            new root.THREE.SphereGeometry(radius, 12, 8),
            new root.THREE.MeshBasicMaterial({
              color: 0xfcd34d, transparent: true, opacity: .42,
              wireframe: true, depthWrite: false
            })
          );
          halo.userData.nodeId = id;
          this.el.object3D.add(halo);
          this.selectionHalos[id] = halo;
        }, this);
      },
      updateSelectionHalo: function (time) {
        this.selectionHalos = this.selectionHalos || {};
        var self = this;
        var pulse = this.flowQuality === 'static' ? 1 : 1 + Math.sin(time * .005) * .08;
        Object.keys(this.selectionHalos).forEach(function (id) {
          var halo = self.selectionHalos[id];
          var node = self.nodes[id];
          if (!node) {
            self.disposeSingleHalo(halo);
            delete self.selectionHalos[id];
            return;
          }
          halo.position.copy(node.el.object3D.position);
          halo.scale.setScalar(pulse);
        });
      },
      disposeSelectionHalos: function () {
        this.selectionHalos = this.selectionHalos || {};
        var self = this;
        Object.keys(this.selectionHalos).forEach(function (id) {
          self.disposeSingleHalo(self.selectionHalos[id]);
        });
        this.selectionHalos = {};
      },
// == dependencyGraphRuntime.js | flowAndAxes (assembled per manifest.json; see COMPONENTS.md) ==
      ensureFlowLayer: function (capacity) {
        if (!root.THREE || capacity < 1) { return; }
        if (this.flowPositions && this.flowPositions.length >= capacity * 3) { return; }
        this.disposeFlowLayer();
        this.flowPositions = new Float32Array(capacity * 3);
        this.flowColors = new Float32Array(capacity * 3);
        this.flowGeometry = new root.THREE.BufferGeometry();
        this.flowGeometry.setAttribute('position', new root.THREE.BufferAttribute(this.flowPositions, 3));
        this.flowGeometry.setAttribute('color', new root.THREE.BufferAttribute(this.flowColors, 3));
        this.flowPoints = new root.THREE.Points(this.flowGeometry, new root.THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          vertexColors: true,
          uniforms: {
            pointSize: { value: this.visualBudget?.effectiveProfile === 'dense' ? 3 : 5 },
            pointScale: { value: 1 },
            opacity: { value: .88 }
          },
          vertexShader: [
            'varying vec3 vColor;',
            'uniform float pointSize;',
            'uniform float pointScale;',
            'void main() {',
            '  vColor = color;',
            '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
            // True perspective attenuation for this scene's 2-15 unit viewing
            // range: base size at ~6 units, growing nearer / shrinking farther,
            // clamped in pixels so close-up particles stay tasteful. (The old
            // `80/max(40,dist)` was tuned for a far larger scale — below 40
            // units it pinned a constant pixel size, which read as particles
            // shrinking on approach relative to the perspective-scaled graph.)
            '  gl_PointSize = clamp(pointSize * pointScale * (6.0 / max(0.5, -mvPosition.z)), 1.0, 28.0);',
            '  gl_Position = projectionMatrix * mvPosition;',
            '}'
          ].join('\n'),
          fragmentShader: [
            'varying vec3 vColor;',
            'uniform float opacity;',
            'void main() {',
            '  vec2 p = gl_PointCoord - vec2(0.5);',
            '  float radial = 1.0 - smoothstep(0.16, 0.5, length(vec2(p.x * 0.72, p.y)));',
            '  float tail = smoothstep(-0.5, 0.42, p.x);',
            '  float alpha = radial * (0.3 + 0.7 * tail) * opacity;',
            '  if (alpha < 0.02) discard;',
            '  gl_FragColor = vec4(vColor, alpha);',
            '}'
          ].join('\n')
        }));
        this.flowPoints.frustumCulled = false;
        this.el.object3D.add(this.flowPoints);
      },
      disposeFlowLayer: function () {
        if (this.flowPoints) {
          this.flowPoints.parent?.remove?.(this.flowPoints);
          this.flowPoints.material?.dispose?.();
        }
        this.flowGeometry?.dispose?.();
        this.flowPoints = this.flowGeometry = this.flowPositions = this.flowColors = null;
      },
      activeFlowEdges: function () {
        if (this.flowQuality === 'static') { return []; }
        var records = Object.values(this.edgeRecords).filter(function (record) {
          return !record.remove && record.batch;
        });
        var active = records.filter(function (record) {
          return record.highlighted || this.isEdgeActive(record.data);
        }, this).sort(function (left, right) {
          return Number(right.data.occurrences || 1) - Number(left.data.occurrences || 1);
        });
        var effectiveProfile = this.visualBudget?.effectiveProfile || 'balanced';
        var limit = Number(this.visualBudget?.flowLimit || 40);
        if (effectiveProfile === 'dense' || this.visualBudget?.override === 'focus') {
          return active.slice(0, limit);
        }
        var ranked = records.slice().sort(function (left, right) {
          return Number(right.data.occurrences || 1) - Number(left.data.occurrences || 1);
        });
        var preferred = active.concat(ranked.filter(function (record) {
          return !active.includes(record);
        }));
        return preferred.slice(0, limit);
      },
      updateFlowVisibility: function () {
        if (this.flowPoints) {
          this.flowPoints.visible = this.flowQuality !== 'static';
          if (this.flowPoints.material?.uniforms?.pointSize) {
            this.flowPoints.material.uniforms.pointSize.value =
              this.visualBudget?.effectiveProfile === 'dense' ? 3
                : this.visualBudget?.effectiveProfile === 'balanced' ? 4 : 5;
          }
        }
        Object.values(this.edgeRecords).forEach(function (record) {
          if (!record.remove) { this.updateEdgeGeometry(record); }
        }, this);
        this.flushEdgeBatches();
      },
      updateFlow: function (timeDelta) {
        if (!root.THREE) { return; }
        var records = this.activeFlowEdges();
        if (!records.length) {
          if (this.flowGeometry) { this.flowGeometry.setDrawRange(0, 0); }
          this.lastFlowCount = 0;
          return;
        }
        this.ensureFlowLayer(records.length);
        // Room-shared particle preferences (validated by the server, defaults
        // applied in applySharedState). The phase clock accumulates with the
        // frame delta so a speed change re-paces the particles smoothly instead
        // of teleporting them (an absolute-time phase would jump).
        this.flowPoints.material.uniforms.pointScale.value =
          flowSizeOption(this.view?.flowSize).scale;
        this.flowClock = ((this.flowClock || 0)
          + (Math.max(0, Number(timeDelta) || 16) / 1000)
            * FLOW_BASE_SPEED
            * flowSpeedOption(this.view?.flowSpeed).multiplier) % 1;
        var selection = this.primarySelection ? this.primarySelection() : null;
        var count = 0;
        records.forEach(function (record, index) {
          var source = this.nodes[record.data.source]?.el?.object3D?.position;
          var target = this.nodes[record.data.target]?.el?.object3D?.position;
          if (!source || !target) { return; }
          var phase = (this.flowClock + ((index * .137) % 1)) % 1;
          var position = source.clone().lerp(target, phase);
          this.flowPositions[count * 3] = position.x;
          this.flowPositions[count * 3 + 1] = position.y;
          this.flowPositions[count * 3 + 2] = position.z;
          var color = new root.THREE.Color(record.style?.color || '#fcd34d');
          if (selection?.type === 'node') {
            color.set(record.data.source === selection.id ? '#22d3ee' : '#fbbf24');
          }
          this.flowColors[count * 3] = color.r;
          this.flowColors[count * 3 + 1] = color.g;
          this.flowColors[count * 3 + 2] = color.b;
          count += 1;
        }, this);
        this.flowGeometry.setDrawRange(0, count);
        this.flowGeometry.getAttribute('position').needsUpdate = true;
        this.flowGeometry.getAttribute('color').needsUpdate = true;
        this.flowPoints.visible = count > 0;
        this.lastFlowCount = count;
      },
      updateTransition: function (time, forceComplete) {
        if (!this.transition || !root.THREE) { return; }
        if (this.transition.startedAt === null) {
          this.transition.startedAt = time;
        }
        var duration = Math.max(0, Number(this.transition.duration || 0));
        var raw = forceComplete || duration === 0
          ? 1
          : Math.min(1, Math.max(0, (time - this.transition.startedAt) / duration));
        this.el.setAttribute('data-codexr-transition-progress', raw.toFixed(3));
        var progress = raw * raw * (3 - (2 * raw));
        this.graphTopY = GRAPH_BASE_Y + GRAPH_HEIGHT;
        this.transition.nodes.forEach(function (item) {
          item.record.el.object3D.position.lerpVectors(item.fromPosition, item.toPosition, progress);
          var scale = item.fromScale + ((item.toScale - item.fromScale) * progress);
          item.record.el.object3D.scale.setScalar(scale);
          var opacity = item.fromOpacity + ((item.toOpacity - item.fromOpacity) * progress);
          var color = item.fromColor.clone().lerp(item.toColor, progress);
          item.record.el.setAttribute('material', 'opacity', opacity);
          item.record.el.setAttribute('material', 'color', '#' + color.getHexString());
          item.record.el.setAttribute('material', 'transparent', opacity < 1);
          this.graphTopY = Math.max(
            this.graphTopY,
            item.record.el.object3D.position.y + Number(item.record.targetRadius || item.record.radius || 0)
          );
        }, this);
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          var record = this.edgeRecords[edgeId];
          this.updateEdgeGeometry(record);
        }, this);
        this.flushEdgeBatches();
        this.positionPinnedTooltip();
        if (raw < 1) {
          this.scheduleTransitionFrame();
          return;
        }

        this.transition.nodes.filter(function (item) { return item.remove; }).forEach(function (item) {
          item.record.el.remove?.();
          delete this.nodes[item.id];
        }, this);
        this.transition.nodes.filter(function (item) { return !item.remove; }).forEach(function (item) {
          var targetRadius = item.record.targetRadius || item.record.radius;
          if (item.record.shape === 'box' || item.record.shape === 'portal') {
            item.record.el.setAttribute('width', item.record.shape === 'portal' ? targetRadius * 2.8 : targetRadius * 1.7);
            item.record.el.setAttribute('height', item.record.shape === 'portal' ? targetRadius * 1.8 : targetRadius * 1.7);
            item.record.el.setAttribute('depth', item.record.shape === 'portal' ? targetRadius * .6 : targetRadius * 1.7);
          } else {
            item.record.el.setAttribute('radius', targetRadius);
          }
          item.record.radius = targetRadius;
          item.record.targetRadius = null;
          item.record.el.object3D.scale.setScalar(1);
        });
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          var record = this.edgeRecords[edgeId];
          if (!record.remove) { return; }
          record.el.remove?.();
          record.hitMesh.geometry?.dispose?.();
          record.hitMesh.material?.dispose?.();
          delete this.edgeRecords[edgeId];
        }, this);
        this.edgeObjects = Object.values(this.edgeRecords).flatMap(function (record) {
          return [record.hitMesh];
        });
        this.clearAxes();
        this.drawAxes();
        if (this.hasActiveSelection()) {
          // Nodes/edges may have vanished in the new layout; drop those pins and
          // re-place the surviving legends into their slots.
          this.prunePinnedSelections();
          this.relayoutLegends();
        }
        this.transition = null;
        this.transitionFrame = null;
        this.el.removeAttribute('data-codexr-transition-progress');
      },
      clearAxes: function () {
        (this.axisObjects || []).forEach(function (object) {
          object.parent?.remove?.(object);
          object.geometry?.dispose?.();
          object.material?.dispose?.();
        });
        this.axisObjects = [];
        this.axesRoot?.remove?.();
        this.axesRoot = null;
      },
      addAxisLine: function (start, end, color) {
        var geometry = new root.THREE.BufferGeometry().setFromPoints([start, end]);
        var line = new root.THREE.Line(geometry, new root.THREE.LineBasicMaterial({
          color: color, transparent: true, opacity: .9
        }));
        this.el.object3D.add(line);
        this.axisObjects.push(line);
        return line;
      },
      addAxisArrow: function (position, direction, color) {
        var geometry = new root.THREE.ConeGeometry(.055, .18, 8);
        var material = new root.THREE.MeshBasicMaterial({ color: color });
        var arrow = new root.THREE.Mesh(geometry, material);
        arrow.position.copy(position);
        arrow.quaternion.setFromUnitVectors(
          new root.THREE.Vector3(0, 1, 0),
          direction.clone().normalize()
        );
        this.el.object3D.add(arrow);
        this.axisObjects.push(arrow);
        return arrow;
      },
      addAxisLabel: function (value, position, color, width, align) {
        var label = text(value, position.x + ' ' + position.y + ' ' + position.z, width || 1.2, color, align || 'center');
        label.setAttribute('wrap-count', 24);
        this.axesRoot.appendChild(label);
        return label;
      },
      drawAxes: function () {
        if (!root.THREE) { return; }
        this.axesRoot = entity('a-entity', { 'data-codexr-dependency-axes': 'true' });
        this.el.appendChild(this.axesRoot);
        var origin = new root.THREE.Vector3(-GRAPH_WIDTH / 2, .035, -GRAPH_DEPTH / 2);
        var xEnd = new root.THREE.Vector3(GRAPH_WIDTH / 2, .035, -GRAPH_DEPTH / 2);
        var zEnd = new root.THREE.Vector3(-GRAPH_WIDTH / 2, .035, GRAPH_DEPTH / 2);
        var yEnd = new root.THREE.Vector3(-GRAPH_WIDTH / 2, GRAPH_BASE_Y + GRAPH_HEIGHT, -GRAPH_DEPTH / 2);
        var self = this;
        var drawTicks = function (axis, scale, metric, color) {
          scale.ticks.forEach(function (value) {
            var ratio = value / Math.max(1, scale.maximum);
            var position;
            if (axis === 'x') {
              position = new root.THREE.Vector3(origin.x + GRAPH_WIDTH * ratio, origin.y, origin.z);
              self.addAxisLine(
                position.clone().add(new root.THREE.Vector3(0, 0, -.035)),
                position.clone().add(new root.THREE.Vector3(0, 0, .035)),
                color
              );
              self.addAxisLabel(formatAxisValue(value), position.clone().add(new root.THREE.Vector3(0, .08, -.11)), color, .72);
            } else if (axis === 'z') {
              position = new root.THREE.Vector3(origin.x, origin.y, origin.z + GRAPH_DEPTH * ratio);
              self.addAxisLine(
                position.clone().add(new root.THREE.Vector3(-.035, 0, 0)),
                position.clone().add(new root.THREE.Vector3(.035, 0, 0)),
                color
              );
              self.addAxisLabel(formatAxisValue(value), position.clone().add(new root.THREE.Vector3(-.13, .08, 0)), color, .72, 'right');
            } else {
              position = new root.THREE.Vector3(origin.x, GRAPH_BASE_Y + GRAPH_HEIGHT * ratio, origin.z);
              self.addAxisLine(
                position.clone().add(new root.THREE.Vector3(-.035, 0, 0)),
                position.clone().add(new root.THREE.Vector3(.035, 0, 0)),
                color
              );
              self.addAxisLabel(formatAxisValue(value), position.clone().add(new root.THREE.Vector3(-.14, 0, 0)), color, .72, 'right');
            }
          });
          var end = axis === 'x' ? xEnd : axis === 'z' ? zEnd : yEnd;
          var offset = axis === 'x'
            ? new root.THREE.Vector3(-.25, .2, -.05)
            : axis === 'z'
              ? new root.THREE.Vector3(-.2, .2, -.12)
              : new root.THREE.Vector3(.15, .12, 0);
          self.addAxisLabel(axis.toUpperCase() + ': ' + metric, end.clone().add(offset), color, 1.7, axis === 'y' ? 'left' : 'center');
        };
        this.addAxisLine(origin, yEnd, 0x4ade80);
        this.addAxisArrow(yEnd, new root.THREE.Vector3(0, 1, 0), 0x4ade80);
        drawTicks('y', this.metricScales.y, this.view.mapping?.height || 'fanIn', '#4ade80');
        if (this.view.layout === 'metric-space') {
          this.addAxisLine(origin, xEnd, 0xfb7185);
          this.addAxisLine(origin, zEnd, 0x60a5fa);
          this.addAxisArrow(xEnd, new root.THREE.Vector3(1, 0, 0), 0xfb7185);
          this.addAxisArrow(zEnd, new root.THREE.Vector3(0, 0, 1), 0x60a5fa);
          drawTicks('x', this.metricScales.x, this.view.mapping?.x || 'fanOut', '#fb7185');
          drawTicks('z', this.metricScales.z, this.view.mapping?.z || 'fanIn', '#60a5fa');
        }
      },
// == dependencyGraphRuntime.js | tooltipsAndSelection (assembled per manifest.json; see COMPONENTS.md) ==
      selectionKey: function (selection) {
        return String(selection.type) + ':' + String(selection.id);
      },
      recordFor: function (selection) {
        return selection.type === 'node' ? this.nodes[selection.id] : this.edgeRecords[selection.id];
      },
      selectionAnchor: function (selection, record) {
        record = record || this.recordFor(selection);
        if (!record) { return null; }
        var point = selection.type === 'node' ? record.el.object3D.position : record.midpoint;
        return { x: Number(point.x || 0), y: Number(point.y || 0), z: Number(point.z || 0) };
      },
      isPinned: function (selection) {
        return (this.pinnedSelections || []).some(function (pinned) {
          return pinned.type === selection.type && pinned.id === selection.id;
        });
      },
      hasActiveSelection: function () {
        return (this.pinnedSelections || []).length > 0 || !!this.hoveredSelection;
      },
      // The last-touched selection, used by the single-focus visuals (flow tint,
      // status readout) that stay meaningful with just one representative.
      primarySelection: function () {
        if (this.hoveredSelection) { return this.hoveredSelection; }
        var pinned = this.pinnedSelections || [];
        return pinned.length ? pinned[pinned.length - 1] : null;
      },
      // Every legend currently on screen: all pins plus a distinct hover.
      activeSelections: function () {
        var list = (this.pinnedSelections || []).slice();
        if (this.hoveredSelection && !this.isPinned(this.hoveredSelection)) {
          list.push(this.hoveredSelection);
        }
        return list;
      },
      // All legend cards live under one board entity; the board yaw-billboards
      // toward the user as a rigid group, so cards follow the viewer without
      // ever rotating into each other (their relative layout never changes).
      ensureLegendBoard: function () {
        if (this.legendBoard?.isConnected) { return this.legendBoard; }
        this.legendBoard = entity('a-entity', { class: 'codexr-legend-board' });
        this.legendBoardYaw = null;
        this.el.appendChild(this.legendBoard);
        return this.legendBoard;
      },
      // Node/edge anchors are expressed in the graph's space; leader lines live
      // inside the (rotated) board, so anchors must be converted per update.
      anchorInBoardSpace: function (anchor) {
        if (!anchor || !root.THREE || !this.legendBoard?.object3D) { return anchor; }
        var vec = new root.THREE.Vector3(anchor.x, anchor.y, anchor.z);
        this.el.object3D.updateWorldMatrix(true, false);
        this.el.object3D.localToWorld(vec);
        this.legendBoard.object3D.updateWorldMatrix(true, false);
        this.legendBoard.object3D.worldToLocal(vec);
        return { x: vec.x, y: vec.y, z: vec.z };
      },
      updateLegendBoard: function () {
        var board = this.legendBoard;
        if (!board?.object3D || !this.hasActiveSelection()) { return; }
        root.CodeXRCommonRuntime?.faceCameraYaw?.(board, this.el.sceneEl);
        var yaw = board.object3D.rotation.y;
        if (this.legendBoardYaw == null || Math.abs(yaw - this.legendBoardYaw) > .004) {
          this.legendBoardYaw = yaw;
          this.positionPinnedTooltip();
        }
      },
      acquireLegendCard: function (key) {
        this.legendCards = this.legendCards || {};
        if (this.legendCards[key]) { return this.legendCards[key]; }
        var card = root.CodeXRCommonRuntime?.createTooltip
          ? root.CodeXRCommonRuntime.createTooltip({ accentColor: '#38bdf8', width: LEGEND_SLOT.cardWidth })
          : null;
        if (!card) { return null; }
        this.ensureLegendBoard().appendChild(card.root);
        this.legendCards[key] = card;
        return card;
      },
      releaseLegendCard: function (key) {
        this.legendCards = this.legendCards || {};
        var card = this.legendCards[key];
        if (!card) { return; }
        if (card.action?.parentNode) { card.action.parentNode.removeChild(card.action); }
        root.CodeXRCommonRuntime?.hideTooltip?.(card);
        if (card.connectorRoot?.parentNode) { card.connectorRoot.parentNode.removeChild(card.connectorRoot); }
        if (card.root?.parentNode) { card.root.parentNode.removeChild(card.root); }
        delete this.legendCards[key];
      },
      renderLegendCard: function (card, selection, slotPosition) {
        var record = this.recordFor(selection);
        if (!card || !record || !root.CodeXRCommonRuntime?.updateTooltip) { return; }
        var detail = selection.type === 'node'
          ? nodeDetailModel(record.data)
          : edgeDetailModel(record.data, this.nodes);
        var anchor = this.selectionAnchor(selection, record);
        var canNavigate = selection.type === 'node'
          && (record.data.kind === 'group' || record.data.kind === 'file' || record.data.syntheticExternal);
        if (card.action?.parentNode) { card.action.parentNode.removeChild(card.action); }
        card.action = null;
        root.CodeXRCommonRuntime.updateTooltip(card, detail, slotPosition, {
          width: LEGEND_SLOT.cardWidth,
          columns: 2,
          footerReserve: canNavigate ? .3 : 0,
          titleLength: 28,
          connectorTarget: this.anchorInBoardSpace(anchor),
          connectorColor: detail.accentColor || '#38bdf8'
        });
        if (canNavigate) {
          var data = record.data;
          var actionLabel = data.syntheticExternal ? 'Show external'
            : data.syntheticKind === 'parent' ? 'Go to parent'
            : data.syntheticKind === 'directory' ? 'Open folder'
            : data.kind === 'file' ? 'Open file' : 'Open';
          card.action = button(
            actionLabel,
            '0 ' + (-(card.height / 2) + .17) + ' 0.02',
            data.syntheticExternal ? 1.9 : 1.5,
            function (event) {
              event.stopPropagation?.();
              if (data.syntheticExternal) { publishState({ showExternal: true }); }
              else if (data.kind === 'file') { openFile(data.relativePath || data.label); }
              else { openDirectory(data.navigationPath || data.relativePath || ''); }
            },
            data.syntheticExternal ? '#c2410c' : '#7c3aed'
          );
          card.root.appendChild(card.action);
        }
      },
      // Re-place every visible legend into a non-overlapping grid slot above the
      // graph, drop cards whose selection is gone, and refresh the shared visuals.
      relayoutLegends: function () {
        this.legendCards = this.legendCards || {};
        var active = this.activeSelections();
        var wanted = {};
        active.forEach(function (selection) { wanted[this.selectionKey(selection)] = true; }, this);
        Object.keys(this.legendCards).forEach(function (key) {
          if (!wanted[key]) { this.releaseLegendCard(key); }
        }, this);
        if (active.length) {
          // The board carries the grid origin; slots are board-relative so the
          // yaw billboard rotates the whole arrangement rigidly.
          var board = this.ensureLegendBoard();
          board.setAttribute('position', '0 ' + (this.graphTopY + LEGEND_SLOT.originYOffset) + ' ' + LEGEND_SLOT.z);
          this.legendBoardYaw = null;
        }
        active.forEach(function (selection, index) {
          if (!this.recordFor(selection)) { return; }
          var card = this.acquireLegendCard(this.selectionKey(selection));
          if (!card) { return; }
          var slot = root.CodeXRCommonRuntime.legendSlotPosition(index, active.length, {
            perRow: LEGEND_SLOT.perRow,
            cardWidth: LEGEND_SLOT.cardWidth,
            cardHeight: LEGEND_SLOT.cardHeight,
            gapX: LEGEND_SLOT.gapX,
            gapY: LEGEND_SLOT.gapY,
            originY: 0,
            z: 0
          });
          this.renderLegendCard(card, selection, slot);
        }, this);
        this.applyHighlightUnion();
        this.setScopeLabelDocked(active.length > 0);
      },
      // Called from the transition tick and on board rotation: keep each card's
      // leader line on its node/edge (slots are fixed; anchors move under the
      // transition, and the board-space anchor changes as the board turns).
      positionPinnedTooltip: function () {
        if (!root.THREE || !root.CodeXRCommonRuntime?.updateTooltipConnector) { return; }
        this.activeSelections().forEach(function (selection) {
          var card = (this.legendCards || {})[this.selectionKey(selection)];
          if (!card || !card.root?.getAttribute('visible')) { return; }
          var anchor = this.selectionAnchor(selection);
          if (!anchor) { return; }
          var pos = card.root.getAttribute('position') || { x: 0, y: 0, z: 0 };
          root.CodeXRCommonRuntime.updateTooltipConnector(card, {
            x: Number(pos.x || 0), y: Number(pos.y || 0), z: Number(pos.z || 0)
          }, this.anchorInBoardSpace(anchor), { connectorColor: card.accentColor || '#38bdf8' });
        }, this);
      },
      showTransientSelection: function (selection) {
        if (this.isPinned(selection)) { return; }
        this.hoveredSelection = selection;
        this.relayoutLegends();
      },
      hideTransientSelection: function (selection) {
        if (this.hoveredSelection?.type !== selection.type
            || this.hoveredSelection?.id !== selection.id) { return; }
        this.hoveredSelection = null;
        this.relayoutLegends();
      },
      togglePinnedSelection: function (selection) {
        this.pinnedSelections = this.pinnedSelections || [];
        if (this.isPinned(selection)) {
          this.pinnedSelections = this.pinnedSelections.filter(function (pinned) {
            return !(pinned.type === selection.type && pinned.id === selection.id);
          });
        } else {
          this.pinnedSelections.push({ type: selection.type, id: selection.id });
          if (this.pinnedSelections.length > MAX_PINNED_LEGENDS) {
            this.releaseLegendCard(this.selectionKey(this.pinnedSelections.shift()));
          }
        }
        if (this.hoveredSelection
            && this.hoveredSelection.type === selection.type
            && this.hoveredSelection.id === selection.id) {
          this.hoveredSelection = null;
        }
        this.relayoutLegends();
      },
      restorePinnedSelection: function () {
        this.relayoutLegends();
      },
      // Drop selections whose node/edge no longer exists (after a re-layout).
      prunePinnedSelections: function () {
        var self = this;
        this.pinnedSelections = (this.pinnedSelections || []).filter(function (selection) {
          if (self.recordFor(selection)) { return true; }
          self.releaseLegendCard(self.selectionKey(selection));
          return false;
        });
        if (this.hoveredSelection && !this.recordFor(this.hoveredSelection)) {
          this.releaseLegendCard(this.selectionKey(this.hoveredSelection));
          this.hoveredSelection = null;
        }
      },
      hideAllLegends: function () {
        this.pinnedSelections = [];
        this.hoveredSelection = null;
        Object.keys(this.legendCards || {}).forEach(function (key) { this.releaseLegendCard(key); }, this);
        this.clearHighlight();
        this.setScopeLabelDocked(false);
      },
      // Highlight the union of every active selection's neighbourhood (so pinning
      // several nodes keeps all their relations lit, not just the last one).
      applyHighlightUnion: function () {
        var active = this.activeSelections();
        if (!active.length) { this.clearHighlight(); return; }
        var related = new Set();
        var edges = this.dataset?.edges || [];
        active.forEach(function (selection) {
          if (selection.type === 'node') {
            related.add(selection.id);
            edges.forEach(function (edge) {
              if (edge.source === selection.id) { related.add(edge.target); }
              if (edge.target === selection.id) { related.add(edge.source); }
            });
          } else {
            var edge = this.edgeRecords[selection.id]?.data;
            if (edge) { related.add(edge.source); related.add(edge.target); }
          }
        }, this);
        Object.keys(this.nodes).forEach(function (nodeId) {
          this.nodes[nodeId].highlightTarget = related.has(nodeId) ? 1 : .18;
          this.nodes[nodeId].highlightColor = related.has(nodeId);
        }, this);
        var self = this;
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          self.edgeRecords[edgeId].highlighted = self.isEdgeActive(self.edgeRecords[edgeId].data);
        });
        this.selectionStartedAt = root.performance?.now?.() || Date.now();
        this.syncSelectionHalos(active
          .filter(function (selection) { return selection.type === 'node'; })
          .map(function (selection) { return selection.id; }));
        this.refreshEdgeColors(true);
        this.rebuildFocusEdges();
        this.updateFlowVisibility();
        var primary = this.primarySelection();
        if (primary) {
          var detail = primary.type === 'node'
            ? nodeDetailModel(this.nodes[primary.id]?.data)
            : edgeDetailModel(this.edgeRecords[primary.id]?.data, this.nodes);
          if (detail) {
            setStatus([detail.title, detail.subtitle, detail.primary, detail.secondary].join(' | '), false);
          }
        }
      },
      clearHighlight: function () {
        Object.keys(this.nodes).forEach(function (nodeId) {
          this.nodes[nodeId].highlightTarget = 1;
          this.nodes[nodeId].highlightColor = false;
        }, this);
        Object.keys(this.edgeRecords).forEach(function (edgeId) {
          this.edgeRecords[edgeId].highlighted = false;
        }, this);
        this.disposeSelectionHalos();
        this.refreshEdgeColors(false);
        this.disposeFocusEdges();
        this.updateFlowVisibility();
        setStatus('', false);
      },
      selectNode: function (id) {
        this.togglePinnedSelection({ type: 'node', id: id });
      },
      getDebugSnapshot: function () {
        var visibleRecords = Object.values(this.edgeRecords || {}).filter(function (record) {
          return !record.remove && record.batch;
        });
        var activeSelection = this.primarySelection();
        return {
          layout: this.view?.layout || null,
          pinnedCount: (this.pinnedSelections || []).length,
          scope: this.view?.scope ? Object.assign({}, this.view.scope) : null,
          mapping: Object.assign({}, this.view?.mapping || {}),
          edgeEncoding: this.view?.edgeEncoding || 'relation-type',
          datasetNodes: Number(state.dataset?.nodes?.length || this.dataset?.nodes?.length || 0),
          datasetEdges: Number(state.dataset?.edges?.length || this.dataset?.edges?.length || 0),
          visibleNodes: Object.keys(this.nodes || {}).length,
          visibleEdges: visibleRecords.length,
          arrowCount: visibleRecords.filter(function (record) {
            return this.visualBudget?.arrowsForAll || this.focusEdgeIds.has(record.data.id);
          }, this).length,
          animatedFlowCount: Number(this.lastFlowCount || 0),
          focusEdgeCount: Number(this.focusEdgeObjects?.length || 0),
          selection: activeSelection ? Object.assign({}, activeSelection) : null,
          transitionActive: !!this.transition,
          transitionProgress: this.el.getAttribute('data-codexr-transition-progress') || null,
          layoutGeneration: Number(this.layoutGeneration || 0),
          detailOverride: this.visualBudget?.override || 'auto',
          densityProfile: this.visualBudget?.profile || 'unknown',
          effectiveProfile: this.visualBudget?.effectiveProfile || 'unknown'
        };
      }
    });
  }

  function numericGradient(value, maxValue) {
    var ratio = Math.max(0, Math.min(1, Number(value || 0) / Math.max(1, Number(maxValue || 1))));
    var red = Math.round(38 + (217 * ratio));
    var green = Math.round(198 - (110 * ratio));
    var blue = Math.round(218 - (174 * ratio));
    return '#' + [red, green, blue].map(function (part) {
      return part.toString(16).padStart(2, '0');
    }).join('');
  }

  function renderGraph() {
    if (!state.active || !state.dataset || !state.snapshot || state.snapshot.status !== 'ready') { return; }
    parkOriginal();
    if (refs.graph && !refs.graph.isConnected) {
      refs.graph = null;
    }
    if (!refs.graph) {
      refs.graph = entity('a-entity', {
        id: 'codexrDependencyGraph',
        position: '0 1.02 -18',
        'data-codexr-analysis-root': 'true',
        'data-codexr-analysis-mode': 'dependency-graph',
        'codexr-dependency-graph': ''
      });
      refs.graph.addEventListener('componentinitialized', function (event) {
        if (event?.detail?.name !== COMPONENT) { return; }
        renderCurrentGraphIfReady();
      });
      if (root.CodeXRAnalysisSurfaceRuntime?.mountRoot) {
        root.CodeXRAnalysisSurfaceRuntime.mountRoot('dependency-graph', refs.graph);
      } else {
        doc()?.querySelector('a-scene')?.appendChild(refs.graph);
      }
    } else {
      root.CodeXRAnalysisSurfaceRuntime?.mountRoot?.('dependency-graph', refs.graph);
    }
    var graph = filteredDataset();
    renderGraphWhenReady(graph, state.snapshot, state.viewGeneration, 0);
  }

// == dependencyGraphRuntime.js | viewLifecycle (assembled per manifest.json; see COMPONENTS.md) ==
  function renderCurrentGraphIfReady() {
    if (!state.active || !state.dataset || state.snapshot?.status !== 'ready') { return; }
    var component = refs.graph?.components?.[COMPONENT];
    if (!component?.setGraph) { return; }
    component.setGraph(filteredDataset(), state.snapshot);
  }

  function renderGraphWhenReady(graph, snapshot, viewGeneration, attempt) {
    if (!state.active || state.snapshot !== snapshot || state.viewGeneration !== viewGeneration) { return; }
    if (!refs.graph?.isConnected) {
      scheduleGraphRenderRetry(graph, snapshot, viewGeneration, attempt);
      return;
    }
    var component = refs.graph.components?.[COMPONENT];
    if (component?.setGraph) {
      component.setGraph(graph, snapshot);
      return;
    }
    scheduleGraphRenderRetry(graph, snapshot, viewGeneration, attempt);
  }

  function scheduleGraphRenderRetry(graph, snapshot, viewGeneration, attempt) {
    if (attempt >= 120) {
      setStatus('Dependency graph component could not be initialized.', true);
      return;
    }
    var timer = setTimeout(function () {
      state.retryTimers.delete(timer);
      renderGraphWhenReady(graph, snapshot, viewGeneration, attempt + 1);
    }, 50);
    state.retryTimers.add(timer);
  }

  function resetView() {
    if (state.transitionLocked) { return; }
    refs.graph?.components?.[COMPONENT]?.resetView?.();
    var rig = doc()?.getElementById('rig');
    // Eye height lives on the rig itself — never on the camera.
    rig?.setAttribute?.('position', '0.07 1.75 -10.75');
    rig?.setAttribute?.('rotation', '0 0 0');
    setStatus('View reset.', false);
  }

  async function applySharedState(snapshot) {
    snapshot = snapshot ? Object.assign({
      edgeEncoding: 'relation-type',
      flowSize: FLOW_DEFAULTS.flowSize,
      flowSpeed: FLOW_DEFAULTS.flowSpeed,
      scope: { kind: 'directory', relativePath: '' }
    }, snapshot) : snapshot;
    state.snapshot = snapshot;
    if (!snapshot) {
      renderControls();
      return;
    }
    if (!isDependencyModeActiveOrActivating()) {
      renderControls();
      return;
    }
    renderControls();
    if (snapshot.status !== 'ready' || !snapshot.datasetUrl) {
      setStatus(snapshot.message || 'Analyzing dependencies...', false);
      if (snapshot.status === 'error') {
        setTransitionLocked(false);
      }
      return;
    }
    try {
      var loadGeneration = ++state.datasetLoadGeneration;
      var viewGeneration = state.viewGeneration;
      var response = await fetch(snapshot.datasetUrl + '?revision=' + snapshot.revision, { cache: 'no-store' });
      if (!response.ok) { throw new Error('Dependency dataset could not be loaded.'); }
      var dataset = await response.json();
      if (
        loadGeneration !== state.datasetLoadGeneration
        || viewGeneration !== state.viewGeneration
        || state.snapshot !== snapshot
        || !state.active
      ) {
        return;
      }
      state.dataset = dataset;
      if (dataset.targetType === 'directory') {
        state.projectDataset = dataset;
      } else {
        var fileKey = normalizeRelativePath(
          dataset.targetRelativePath || snapshot.scope?.relativePath
        );
        state.fileDatasets[fileKey] = dataset;
      }
      if (snapshot.projectDatasetUrl) {
        var projectResponse = await fetch(
          snapshot.projectDatasetUrl + '?sourceRevision=' + Number(snapshot.sourceRevision || 0),
          { cache: 'no-store' }
        );
        if (
          projectResponse.ok
          && loadGeneration === state.datasetLoadGeneration
          && viewGeneration === state.viewGeneration
          && state.active
        ) {
          var projectDataset = await projectResponse.json();
          if (projectDataset?.targetType === 'directory') {
            state.projectDataset = projectDataset;
          }
        }
      }
      renderGraph();
      setTransitionLocked(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error), true);
      setTransitionLocked(false);
    }
  }

  function hasReadySnapshot() {
    return state.snapshot?.status === 'ready' && !!state.snapshot?.datasetUrl;
  }

  function activateReadySnapshot(reason) {
    if (!hasReadySnapshot()) { return false; }
    var offline = client()?.isOfflineExport?.() === true;
    root.console?.log?.('[CodeXR.Debug]: Activating existing dependency graph snapshot', {
      offline: offline,
      hasDataset: !!state.dataset,
      datasetUrl: state.snapshot.datasetUrl
    });
    if (!offline) {
      client()?.sendMessage?.('analysis-mode-activate', {
        mode: 'dependency-graph'
      });
    }
    void root.CodeXRAnalysisModeRuntime?.changeAnalysis?.('dependency-graph', {
      reason: reason || 'local-dependency-mode-option',
      panelViewId: 'dependency-graph'
    });
    return true;
  }

  async function start() {
    if (state.availability !== 'enabled') {
      setStatus(state.unavailableReason, true);
      return;
    }
    if (state.transitionLocked) { return; }
    if (hasReadySnapshot() && client()?.isOfflineExport?.()) {
      activateReadySnapshot('offline-dependency-snapshot');
      return;
    }
    // An exported copy has no server to analyze with: say so instead of
    // entering the send-retry loop below, which would spin forever.
    if (client()?.isOfflineExport?.()) {
      setStatus('This exported analysis is read-only: re-analysis needs the live CodeXR session.', true);
      return;
    }
    var connection = client();
    if (!connection?.sendMessage) {
      setStatus('Dependency analysis is unavailable: no collaboration channel.', true);
      return;
    }
    setTransitionLocked(true, 'Opening dependencies...');
    // The hop to selection is cosmetic; the server's authoritative
    // analysis-view broadcast is what really drives the scene into
    // dependency mode. A failed local transition must never swallow the
    // start message (start() is called as `void start()` — an escaped
    // rejection here is total silence in the scene).
    try {
      await root.CodeXRAnalysisModeRuntime?.changeAnalysis?.('selection', {
        reason: 'dependency-refresh'
      });
    } catch (error) {
      root.console?.warn?.('[CodeXR][DependencyGraph] selection hop failed; sending dependency-graph-start anyway.', error);
    }
    // send() drops silently while the socket is still connecting — retry
    // until it goes through. Gated on a send generation of its own (the
    // transition lock legitimately clears during the hop to selection).
    var sendGeneration = state.startSendGeneration = (state.startSendGeneration || 0) + 1;
    var attemptSend = function () {
      if (sendGeneration !== state.startSendGeneration) { return; }
      // Only an explicit `false` means "socket not ready, dropped" — clients
      // whose sendMessage returns nothing are treated as delivered.
      if (client()?.sendMessage?.('dependency-graph-start', {}) !== false) { return; }
      root.console?.warn?.('[CodeXR][DependencyGraph] collaboration socket not ready; retrying dependency-graph-start...');
      setTimeout(attemptSend, 500);
    };
    attemptSend();
  }
  async function reanalyze() {
    if (state.availability !== 'enabled' || state.transitionLocked) { return; }
    if (client()?.isOfflineExport?.()) {
      setStatus('This exported analysis is read-only: re-analysis needs the live CodeXR session.', true);
      return;
    }
    setTransitionLocked(true, 'Re-analyzing dependencies...');
    client()?.sendMessage?.('dependency-graph-start', { forceFull: true });
  }
  function selectDependencyMode() {
    if (activateReadySnapshot('local-dependency-mode-option')) {
      return;
    }
    root.console?.log?.('[CodeXR.Debug]: Dependency graph mode selected; starting dependency analysis', {
      hasDataset: !!state.dataset,
      availability: state.availability
    });
    void start();
  }
  async function openModeSelector() {
    return root.CodeXRAnalysisModeRuntime?.openSelector?.();
  }
  async function configureAvailability() {
    try {
      var info = await client()?.getSessionInfoAsync?.();
      state.availability = info?.capabilities?.dependencyGraph === true ? 'enabled' : 'disabled';
      state.unavailableReason = info?.capabilities?.dependencyGraphReason
        || 'Dependency graphs require an XR file, directory, or project analysis.';
    } catch {
      state.availability = 'disabled';
      state.unavailableReason = 'Dependency graph availability could not be checked.';
    }
    registerDependencyModeOption();
  }
  function registerDependencyModeOption() {
    state.unregisterMode?.();
    state.unregisterMode = root.CodeXRAnalysisModeRuntime?.registerModeOption?.({
      id: 'dependency-graph',
      label: 'Dependency graph',
      color: '#7c3aed',
      disabled: state.availability !== 'enabled',
      disabledReason: state.unavailableReason
        || 'Dependency graphs require an XR file, directory, or project analysis.',
      onSelect: selectDependencyMode
    }) || null;
  }
  function registerCollaboration() {
    var connection = client();
    state.disposables.push(connection?.onMessage?.('dependency-graph-progress', function (message) {
      setStatus(message?.payload?.message || 'Analyzing dependencies...', false);
    }));
    state.disposables.push(connection?.onMessage?.('dependency-graph-error', function (message) {
      root.console?.warn?.('[CodeXR][DependencyGraph] Server reported:', message?.payload?.message || 'Dependency analysis failed.');
      setStatus(message?.payload?.message || 'Dependency analysis failed.', true);
      setTransitionLocked(false);
    }));
    connection?.registerEntityRuntime?.({
      entityKind: ENTITY_KIND,
      entityId: ENTITY_ID,
      applySharedState: applySharedState,
      publishInitialSharedState: function () {}
    });
  }
  function mount(attempt) {
    buildPanel();
    if (!state.unregisterLifecycle && root.CodeXRAnalysisModeRuntime?.register) {
      state.unregisterLifecycle = root.CodeXRAnalysisModeRuntime.register('dependency-graph', {
        mappingContextId: null,
        activate: function () {
          state.active = true;
          state.viewGeneration += 1;
          parkOriginal();
          renderControls();
          if (state.dataset && state.snapshot?.status === 'ready') {
            renderGraph();
            setTransitionLocked(false);
            void applySharedState(state.snapshot);
            return;
          }
          if (state.snapshot) {
            return applySharedState(state.snapshot);
          }
        },
        deactivate: function () {
          disposeView();
        }
      });
    }
    if (!state.unregisterMode && root.CodeXRAnalysisModeRuntime?.registerModeOption) {
      registerDependencyModeOption();
    }
    if ((!refs.controls || !state.unregisterMode || !state.unregisterLifecycle) && attempt < 30) {
      setTimeout(function () { mount(attempt + 1); }, 100);
    }
  }
  function autoInit() {
    if (state.initialized || !doc()) { return; }
    state.initialized = true;
    registerComponent();
    mount(0);
    registerCollaboration();
    void configureAvailability();
  }
  root.CodeXRDependencyGraphRuntime = {
    autoInit: autoInit,
    start: start,
    openModeSelector: openModeSelector,
    applySharedState: applySharedState,
    resetView: resetView,
    openDirectory: openDirectory,
    openFile: openFile,
    getState: function () { return state; },
    __testing: {
      computeNiceScale: computeNiceScale,
      buildMetricScales: buildMetricScales,
      nodeDetailModel: nodeDetailModel,
      edgeDetailModel: edgeDetailModel,
      intensityBucket: intensityBucket,
      edgeStyle: edgeStyle,
      edgeEncodingLegend: edgeEncodingLegend,
      flowSizeOption: flowSizeOption,
      flowSpeedOption: flowSpeedOption,
      FLOW_SIZE_OPTIONS: FLOW_SIZE_OPTIONS,
      FLOW_SPEED_OPTIONS: FLOW_SPEED_OPTIONS,
      FLOW_DEFAULTS: FLOW_DEFAULTS,
      graphDensityStats: graphDensityStats,
      buildExternalSummaryDataset: buildExternalSummaryDataset,
      projectDirectoryScope: projectDirectoryScope,
      projectFileScope: projectFileScope,
      normalizeRelativePath: normalizeRelativePath,
      symbolVisual: symbolVisual,
      selectDependencyMode: selectDependencyMode
    },
    destroy: function () {
      state.disposables.forEach(function (dispose) { dispose?.(); });
      state.unregisterMode?.();
      state.unregisterPanel?.();
      state.unregisterLifecycle?.();
      state.unregisterLifecycle = null;
      clearRenderRetries();
      disposeView();
      state.initialized = false;
    }
  };
  if (doc()) {
    if (doc().readyState === 'loading') { doc().addEventListener('DOMContentLoaded', autoInit, { once: true }); }
    else { autoInit(); }
  }
})(typeof window !== 'undefined' ? window : this);
