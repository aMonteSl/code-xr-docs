// == xrChartMappingUiRuntime.js | configAndLabels (assembled per manifest.json; see COMPONENTS.md) ==
(function (root, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(root);
  } else {
    root.CodeXRMappingUiRuntime = factory(root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : typeof self !== 'undefined' ? self : this, function (root) {
  'use strict';

  var CONFIG_KEY = '__CODEXR_XR_MAPPING_UI__';
  var CONFIG_SCRIPT_ID = 'codexr-tooling-config-xr-mapping-ui';
  var SHARED_ENTITY_KIND = 'mapping';
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

  // ── Controller contract ─────────────────────────────────────────────
  // This runtime is the table's controller: one shared panel hosting one
  // "panel view" per analysis surface. Feature runtimes contribute views via
  // registerPanelView({ id, title, content, headerButton, ... }) — never by
  // touching the panel directly — and must schedule that call through
  // whenPanelReady() (fires immediately once the panel exists, queues
  // otherwise), so load order and scene timing cannot strand a view.
  // To add a new analysis surface: register its panel view, then map its
  // controller view(s) here so mode transitions can address it.
  //
  // A view that asks for `headerButton: true` also gets a say in how that
  // button reads: `buttonLabel` (a word, not a letter), `buttonWidth` (the
  // 0.34 square is the default; widen it to fit the label) and `buttonColor`
  // — a declared colour outranks the open/closed default, so the button can
  // mean something. `setPanelViewButtonColor(viewId, color)` changes it while
  // the scene runs, which is how the analysis selector wears the colour of the
  // analysis you are in. Labels must stay ASCII: the SDF font ships no bullet,
  // arrow or icon glyph.
  var PANEL_READY_CALLBACKS = [];

  var CONTROLLER_PANEL_BY_VIEW = {
    'visualization-menu': 'visualization-mode',
    'single.mapping': 'mapping',
    'dependency.settings': 'dependency-graph',
    'historical.selection': 'historical-selection',
    'historical.mapping': 'mapping',
    'project-evolution': 'project-evolution',
    'project-evolution.selection': 'project-evolution',
    'project-evolution.playback': 'project-evolution',
    'project-evolution.mapping': 'mapping'
  };

  var CONTROLLER_VIEW_BY_PANEL = {
    'visualization-mode': 'visualization-menu',
    mapping: 'single.mapping',
    'dependency-graph': 'dependency.settings',
    'historical-selection': 'historical.selection',
    'project-evolution': 'project-evolution'
  };

  var refs = {
    panel: null,
    panelContent: null,
    panelTitle: null,
    panelTitleBackdrop: null,
    toggle: null,
    rowsRoot: null,
    chartRoot: null,
    panelBackground: null,
    panelBorder: null,
    statusText: null
  };

  var state = {
    initialized: false,
    visible: true,
    selectedByDimension: {},
    lastKnownGoodMapping: {},
    invalidOptionsByDimension: {},
    adaptiveLoopActive: false,
    activeCornerId: null,
    lastCornerSwitchAt: 0,
    lastConfigSnapshot: null,
    pendingValidationTimers: [],
    pendingMappingToken: 0,
    pendingMapping: null,
    statusMessage: '',
    statusLevel: 'info',
    statusClearTimer: null,
    suppressSharedPublish: false,
    chartEntityIdsOverride: null,
    activeMappingContextId: 'normal-analysis',
    mappingProfiles: {},
    // Per-context companion sections shown under the mapping view (child
    // versions of the Field Mapping panel, e.g. the historical comparison
    // extension with its side info + change-comparison action).
    mappingCompanions: {},
    activePanelView: 'mapping',
    mappingPanelHeight: 2.45,
    panelViews: {},
    panelViewObservers: {},
    runtimeConfig: null,
    activeChartId: null,
    mode: 'single',
    activeControllerView: 'single.mapping',
    mappingControlsLocked: false,
    // Mapping profile currently rendered (context + chart); guards the
    // idempotent context switch.
    appliedMappingProfileKey: null
  };

  var ADAPTIVE_DEFAULTS = {
    cornerSwitchThreshold: 0.35,
    cornerSwitchCooldownMs: 500,
    panelLift: 0.04,
    panelForwardOffset: 0.12
  };

  var PANEL_LAYOUT = {
    left: -2.85,
    right: 2.55,
    labelWidth: 7.4,
    buttonGap: 0.08,
    rowGap: 0.28,
    sectionGap: 0.32,
    labelToButtonsGap: 0.3,
    maxChartRows: 3,
    chartRootHeightOffset: 0.34,
    rowsRootHeightOffset: 1.72,
    panelHeightPadding: 2.95
  };

  // Header controls (the view buttons and the +/- toggle). The panel renders
  // at 0.2 world scale, so 0.34 is a ~7 cm square: enough for one glyph, which
  // is why a button that needs a word asks for a wider plate.
  var HEADER_BUTTON_HEIGHT = 0.34;
  var HEADER_BUTTON_MIN_WIDTH = 0.34;
  var HEADER_BUTTON_GAP = 0.08;
  var HEADER_BUTTON_MAX_LABEL = 16;
  // Text width relative to the plate, the same ratio the panel's option
  // buttons use — at the inherited `width: 1` a label was ~5 mm tall.
  var HEADER_BUTTON_TEXT_RATIO = 1.9;

  function getPanelContentWidth() {
    return PANEL_LAYOUT.right - PANEL_LAYOUT.left;
  }

  function getGridButtonWidth(cols) {
    var safeCols = Math.max(1, Number(cols) || 1);
    return (getPanelContentWidth() - PANEL_LAYOUT.buttonGap * (safeCols - 1)) / safeCols;
  }

  function getGridButtonX(colIndex, buttonWidth) {
    return PANEL_LAYOUT.left + colIndex * (buttonWidth + PANEL_LAYOUT.buttonGap) + buttonWidth * 0.5;
  }

  function getDoc() {
    return root.document;
  }

  function getConfig() {
    if (state.runtimeConfig) {
      return state.runtimeConfig;
    }
    var document = getDoc();
    var configScript = document ? document.getElementById(CONFIG_SCRIPT_ID) : null;
    if (configScript && typeof configScript.textContent === 'string') {
      try {
        state.runtimeConfig = JSON.parse(configScript.textContent);
        state.activeChartId = state.runtimeConfig.chartId || null;
        // Pristine scene chart, captured before selectChart ever mutates
        // config.chartId: modes that are not project evolution restore the
        // selector to this chart on entry.
        state.sceneChartId = state.runtimeConfig.chartId || null;
        return state.runtimeConfig;
      } catch (error) {
        console.warn('CODEXR_MAPPING_UI: invalid JSON config script', error);
      }
    }
    // No config found (yet): report null instead of throwing — callers treat
    // a missing config as "not ready" and the bootstrap keeps re-trying.
    state.runtimeConfig = root[CONFIG_KEY] || null;
    state.activeChartId = state.runtimeConfig ? (state.runtimeConfig.chartId || null) : null;
    return state.runtimeConfig;
  }

  function createEntity(tagName, attributes) {
    var entity = getDoc().createElement(tagName);
    Object.keys(attributes || {}).forEach(function (key) {
      entity.setAttribute(key, attributes[key]);
    });
    return entity;
  }

  function clearEntity(entity) {
    while (entity && entity.firstChild) {
      entity.removeChild(entity.firstChild);
    }
  }

  function pickColumns(fieldCount) {
    if (fieldCount <= 5) {
      return 2;
    }
    if (fieldCount <= 10) {
      return 3;
    }
    return 4;
  }

  function compactLabel(rawName) {
    var map = {
      Complexity: 'Cplx',
      Number: 'No',
      Function: 'Fn',
      Average: 'Avg',
      Cyclomatic: 'Cyclo',
      Nesting: 'Nest',
      Parameters: 'Params',
      Parameter: 'Param',
      Count: 'Cnt',
      Maximum: 'Max',
      Minimum: 'Min'
    };
    var normalized = String(rawName || '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();

    var compacted = normalized
      .split(/\s+/)
      .map(function (word) {
        return map[word] || word;
      })
      .join(' ');

    if (compacted.length <= 18) {
      return compacted;
    }
    return compacted.slice(0, 15) + '...';
  }

  function humanizeFieldName(rawName) {
    return String(rawName || '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }

  function getFriendlyAxisLabel(config, dimensionId) {
    var dimension = getDimensionConfig(config, dimensionId);
    if (dimension && dimension.label) {
      return String(dimension.label);
    }
    return humanizeFieldName(dimensionId || 'this axis') || 'this axis';
  }

  function buildFriendlyInvalidMappingMessage(config, dimensionId, fieldName, reason, includeRestoreLine) {
    var axisLabel = getFriendlyAxisLabel(config, dimensionId);
    var fieldLabel = humanizeFieldName(fieldName);
    var lines = [];

    if (reason && /no chart data is available yet/i.test(reason)) {
      lines.push('This chart is still loading data for ' + axisLabel + '.');
      lines.push('CodeXR kept the last valid mapping until the visualization is ready.');
      lines.push('Try again once the chart finishes loading.');
      return lines.join('\n');
    }

    if (fieldLabel) {
      lines.push('"' + fieldLabel + '" caused an invalid chart for ' + axisLabel + '.');
    } else {
      lines.push('That field caused an invalid chart for ' + axisLabel + '.');
    }

    if (includeRestoreLine === false) {
      lines.push('CodeXR blocked this option because Babia failed the last time it was used.');
    } else {
      lines.push('CodeXR restored the last valid mapping to keep the visualization stable.');
    }

    lines.push('Try another field for this axis.');
    return lines.join('\n');
  }

// == xrChartMappingUiRuntime.js | placementGeometry (assembled per manifest.json; see COMPONENTS.md) ==
  function parsePosition(rawPosition) {
    var tokens = String(rawPosition || '0 0 0').trim().split(/\s+/);
    return {
      x: Number(tokens[0]) || 0,
      y: Number(tokens[1]) || 0,
      z: Number(tokens[2]) || 0
    };
  }

  function toPosition(position) {
    return position.x + ' ' + position.y + ' ' + position.z;
  }

  function parseRotation(rawRotation) {
    var tokens = String(rawRotation || '0 0 0').trim().split(/\s+/);
    return {
      x: Number(tokens[0]) || 0,
      y: Number(tokens[1]) || 0,
      z: Number(tokens[2]) || 0
    };
  }

  function getScene() {
    var document = getDoc();
    return document ? document.querySelector('a-scene') : null;
  }

  function getCollaborationClient() {
    var collaborationRuntime = root.CodeXRCollaborationRuntime;
    if (!collaborationRuntime || typeof collaborationRuntime.getClient !== 'function') {
      return null;
    }
    return collaborationRuntime.getClient(root);
  }

  function getCameraWorldPosition() {
    var scene = getScene();
    if (!scene || !root.THREE) {
      return null;
    }
    if (scene.camera && scene.camera.getWorldPosition) {
      var fromSceneCamera = new root.THREE.Vector3();
      scene.camera.getWorldPosition(fromSceneCamera);
      return fromSceneCamera;
    }
    var cameraEntity = getDoc().querySelector('a-camera, [camera]');
    if (!cameraEntity || !cameraEntity.object3D || !cameraEntity.object3D.getWorldPosition) {
      return null;
    }
    var fromEntity = new root.THREE.Vector3();
    cameraEntity.object3D.getWorldPosition(fromEntity);
    return fromEntity;
  }

  function buildAdaptiveCorners(config) {
    if (!config || !config.adaptiveCorner) {
      return [];
    }

    var table = config.adaptiveCorner.table || {};
    var anchorX = Number(table.anchorX);
    var anchorY = Number(table.anchorY);
    var anchorZ = Number(table.anchorZ);
    var width = Number(table.width);
    var depth = Number(table.depth);

    if (!isFinite(anchorX) || !isFinite(anchorZ) || !isFinite(width) || !isFinite(depth) || width <= 0 || depth <= 0) {
      return [];
    }

    var safeAnchorY = isFinite(anchorY) ? anchorY : parsePosition(config.panelPosition).y;
    var marginX = Number(config.adaptiveCorner.marginX);
    var marginZ = Number(config.adaptiveCorner.marginZ);
    var halfX = width * 0.5 + (isFinite(marginX) ? marginX : 0.45);
    var halfZ = depth * 0.5 + (isFinite(marginZ) ? marginZ : 0.45);

    return [
      { id: 'front-right', x: anchorX + halfX, y: safeAnchorY, z: anchorZ + halfZ },
      { id: 'front-left', x: anchorX - halfX, y: safeAnchorY, z: anchorZ + halfZ },
      { id: 'back-right', x: anchorX + halfX, y: safeAnchorY, z: anchorZ - halfZ },
      { id: 'back-left', x: anchorX - halfX, y: safeAnchorY, z: anchorZ - halfZ }
    ];
  }

  function pickNearestCorner(config, cameraWorldPosition) {
    var corners = buildAdaptiveCorners(config);
    if (!cameraWorldPosition || corners.length === 0) {
      return null;
    }

    var current = null;
    var best = null;

    corners.forEach(function (corner) {
      var dx = corner.x - cameraWorldPosition.x;
      var dz = corner.z - cameraWorldPosition.z;
      var squaredDistance = dx * dx + dz * dz;
      if (corner.id === state.activeCornerId) {
        current = { corner: corner, squaredDistance: squaredDistance };
      }
      if (!best || squaredDistance < best.squaredDistance) {
        best = { corner: corner, squaredDistance: squaredDistance };
      }
    });

    if (!best) {
      return null;
    }

    if (!current) {
      return best.corner;
    }

    var now = Date.now();
    var threshold = Number(config.adaptiveCorner.switchThreshold);
    var effectiveThreshold = isFinite(threshold) ? threshold : ADAPTIVE_DEFAULTS.cornerSwitchThreshold;
    var thresholdSquared = effectiveThreshold * effectiveThreshold;
    var cooldownMs = Number(config.adaptiveCorner.switchCooldownMs);
    var effectiveCooldownMs = isFinite(cooldownMs) ? cooldownMs : ADAPTIVE_DEFAULTS.cornerSwitchCooldownMs;

    if (now - state.lastCornerSwitchAt < effectiveCooldownMs) {
      return current.corner;
    }

    if (best.corner.id !== current.corner.id && (current.squaredDistance - best.squaredDistance) > thresholdSquared) {
      state.lastCornerSwitchAt = now;
      return best.corner;
    }

    return current.corner;
  }

  function orientPanelToCamera(config, targetPosition, cameraWorldPosition) {
    if (!refs.panel || !targetPosition || !cameraWorldPosition) {
      return;
    }

    var dx = cameraWorldPosition.x - targetPosition.x;
    var dz = cameraWorldPosition.z - targetPosition.z;
    if (Math.abs(dx) < 0.000001 && Math.abs(dz) < 0.000001) {
      return;
    }

    var yawDeg = Math.atan2(dx, dz) * (180 / Math.PI);
    var currentRotation = parseRotation(config.panelRotation || '0 0 0');
    refs.panel.setAttribute('rotation', currentRotation.x + ' ' + yawDeg.toFixed(2) + ' ' + currentRotation.z);
  }

  function applyAdaptivePlacement(config) {
    if (!config || !config.adaptiveCorner || !refs.panel || !refs.panel.parentElement) {
      return;
    }

    var cameraWorldPosition = getCameraWorldPosition();
    if (!cameraWorldPosition) {
      return;
    }

    var corner = pickNearestCorner(config, cameraWorldPosition);
    if (!corner) {
      return;
    }

    state.activeCornerId = corner.id;

    var panelLift = Number(config.adaptiveCorner.panelLift);
    var forwardOffset = Number(config.adaptiveCorner.panelForwardOffset);
    var safeLift = isFinite(panelLift) ? panelLift : ADAPTIVE_DEFAULTS.panelLift;
    var safeForwardOffset = isFinite(forwardOffset) ? forwardOffset : ADAPTIVE_DEFAULTS.panelForwardOffset;

    var towardCameraX = cameraWorldPosition.x - corner.x;
    var towardCameraZ = cameraWorldPosition.z - corner.z;
    var magnitude = Math.sqrt(towardCameraX * towardCameraX + towardCameraZ * towardCameraZ) || 1;

    var targetPosition = {
      x: corner.x + (towardCameraX / magnitude) * safeForwardOffset,
      y: corner.y + safeLift,
      z: corner.z + (towardCameraZ / magnitude) * safeForwardOffset
    };

    refs.panel.setAttribute('position', toPosition(targetPosition));
    orientPanelToCamera(config, targetPosition, cameraWorldPosition);
  }

  function updateAdaptivePlacement() {
    var config = getConfig();
    if (!config || !config.adaptiveCorner || !refs.panel || !refs.panel.isConnected) {
      state.adaptiveLoopActive = false;
      return;
    }

    applyAdaptivePlacement(config);
    var nextFrame = root.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
    nextFrame(updateAdaptivePlacement);
  }

  function ensureAdaptivePlacementLoop() {
    if (state.adaptiveLoopActive) {
      return;
    }
    state.adaptiveLoopActive = true;
    updateAdaptivePlacement();
  }

// == xrChartMappingUiRuntime.js | chartDiscovery (assembled per manifest.json; see COMPONENTS.md) ==
  function getChartEntity(config) {
    var entities = getChartEntities(config);
    return entities.length ? entities[0] : null;
  }

  function getConfiguredChartEntityIds(config) {
    return Array.isArray(state.chartEntityIdsOverride) && state.chartEntityIdsOverride.length
      ? state.chartEntityIdsOverride
      : (Array.isArray(config && config.chartEntityIds) && config.chartEntityIds.length
        ? config.chartEntityIds
        : [config && config.chartEntityId]);
  }

  function hasEntityAttribute(entity, attributeName) {
    if (!entity || !attributeName) {
      return false;
    }
    if (typeof entity.hasAttribute === 'function') {
      return entity.hasAttribute(attributeName);
    }
    return typeof entity.getAttribute === 'function' && entity.getAttribute(attributeName) !== undefined;
  }

  function isAnalysisRootEntity(entity) {
    return !!(entity && (
      hasEntityAttribute(entity, 'data-codexr-analysis-root')
      || hasEntityAttribute(entity, 'data-codexr-normal-root')
      || hasEntityAttribute(entity, 'data-codexr-analysis-surface')
    ));
  }

  // A live A-Frame component leaves no DOM attribute, so an entity built at
  // runtime (the project-evolution movie chart) failed every attribute check
  // here: chart resolution fell through to the parked NORMAL chart, and a chart
  // switch made in the movie converted that one instead. Live components count.
  function hasEntityComponent(entity, componentName) {
    return !!(componentName && entity && entity.components && entity.components[componentName]);
  }

  function isChartMappingEntity(entity, componentName) {
    if (!entity) {
      return false;
    }
    if (
      hasEntityAttribute(entity, 'codexr-chart-containment')
      || hasEntityAttribute(entity, 'data-codexr-chart-containment')
      || hasEntityComponent(entity, 'codexr-chart-containment')
    ) {
      return true;
    }
    if (isAnalysisRootEntity(entity)) {
      return false;
    }
    return !!(componentName && (hasEntityAttribute(entity, componentName) || hasEntityComponent(entity, componentName)));
  }

  function queryEntities(scope, selector) {
    if (!scope || typeof scope.querySelectorAll !== 'function') {
      return [];
    }
    try {
      return Array.prototype.slice.call(scope.querySelectorAll(selector) || []);
    } catch (error) {
      return [];
    }
  }

  function getChartSearchScopes(config) {
    var document = getDoc();
    if (!document) {
      return [];
    }

    var scopeIds = [
      config && config.normalRootId,
      config && config.normalSurfaceId,
      'codexrNormalAnalysisRoot',
      'codexrAnalysisSurface'
    ].filter(Boolean);
    var scopes = [];
    scopeIds.forEach(function (id) {
      if (!document.getElementById) {
        return;
      }
      var scope = document.getElementById(id);
      if (scope && scopes.indexOf(scope) === -1) {
        scopes.push(scope);
      }
    });
    scopes.push(document);
    return scopes;
  }

  function findFallbackChartEntity(config, preferredId) {
    var document = getDoc();
    if (!document) {
      return null;
    }
    var componentName = getChartComponentName(config);

    if (preferredId && document.getElementById) {
      var preferred = document.getElementById(preferredId);
      if (isChartMappingEntity(preferred, componentName)) {
        return preferred;
      }
      var contained = queryEntities(preferred, '[codexr-chart-containment]');
      if (contained.length) {
        var containedMatch = componentName
          ? contained.find(function (entity) { return hasEntityAttribute(entity, componentName); })
          : null;
        return containedMatch || contained[0];
      }
    }

    var scopes = getChartSearchScopes(config);
    for (var i = 0; i < scopes.length; i += 1) {
      var charts = queryEntities(scopes[i], '[codexr-chart-containment]');
      if (!charts.length) {
        continue;
      }
      if (componentName) {
        var componentMatch = charts.find(function (entity) {
          return hasEntityAttribute(entity, componentName);
        });
        if (componentMatch) {
          return componentMatch;
        }
      }
      return charts[0];
    }
    return null;
  }

  function buildChartValidationTargets(config) {
    var ids = getConfiguredChartEntityIds(config).filter(Boolean).map(String);
    if (!ids.length) {
      return [function resolveChartTarget() {
        return findFallbackChartEntity(config);
      }];
    }
    return ids.map(function (id) {
      return function resolveChartTarget() {
        return findFallbackChartEntity(config, id);
      };
    });
  }

  function getChartEntities(config) {
    var document = getDoc();
    if (!document || !config) {
      return [];
    }
    var ids = getConfiguredChartEntityIds(config);
    var componentName = getChartComponentName(config);
    var directMatches = ids
      .filter(Boolean)
      .map(function (id) { return document.getElementById(id); })
      .filter(function (entity) { return isChartMappingEntity(entity, componentName); });
    if (directMatches.length) {
      return directMatches;
    }

    var fallback = findFallbackChartEntity(config);
    return fallback ? [fallback] : [];
  }

// == xrChartMappingUiRuntime.js | mappingProfiles (assembled per manifest.json; see COMPONENTS.md) ==
  function cloneMapping(mapping) {
    return Object.assign({}, mapping || {});
  }

  function cloneInvalidOptions(invalidOptionsByDimension) {
    return JSON.parse(JSON.stringify(invalidOptionsByDimension || {}));
  }

  function getActiveChartId(config) {
    return state.activeChartId || (config && config.chartId) || '';
  }

  function getMappingProfileKey(contextId, chartId) {
    return String(contextId || 'default') + '::' + String(chartId || 'default-chart');
  }

  function getDimensionsForChart(config, chartId) {
    var byChart = config && config.dimensionsByChart;
    if (byChart && Array.isArray(byChart[chartId])) {
      return byChart[chartId];
    }
    // config.dimensions belongs to the chart currently applied (selectChart
    // rewrites it), so it is only a valid answer for that same chart — using it
    // for another one handed back the PREVIOUS chart's axes.
    var appliedChartId = config && config.chartId;
    if (!chartId || chartId === appliedChartId) {
      return Array.isArray(config && config.dimensions) ? config.dimensions : [];
    }
    return [];
  }

  // The mapping of a chart always covers every dimension the chart declares:
  // published defaults first, then the dimension's own current/first field for
  // anything missing. A partial mapping reached Babia as a missing axis, which
  // is what surfaced as "invalid axis" (and it can still arrive that way from a
  // scene generated before the contract was fixed).
  function getDefaultMappingForChart(config, chartId) {
    var defaultsByChart = config && config.defaultMappingsByChart;
    var published = defaultsByChart && defaultsByChart[chartId]
      ? cloneMapping(defaultsByChart[chartId])
      : {};
    getDimensionsForChart(config, chartId).forEach(function (dimension) {
      if (!dimension || !dimension.id || published[dimension.id]) {
        return;
      }
      var fields = Array.isArray(dimension.fields) ? dimension.fields : [];
      var field = dimension.currentField || fields[0] || '';
      if (field) {
        published[dimension.id] = field;
      }
    });
    return published;
  }

  function buildDefaultMappingSnapshot(config) {
    var selectedByDimension = getDefaultMappingForChart(config, getActiveChartId(config));
    return {
      visible: config && config.panelVisible !== false,
      selectedByDimension: cloneMapping(selectedByDimension),
      lastKnownGoodMapping: cloneMapping(selectedByDimension),
      invalidOptionsByDimension: {}
    };
  }

  // Reconciles a mapping against the chart that is about to be applied: the
  // chart's own dimensions win the shape (stale axes from the previous chart are
  // dropped, missing ones are filled from the defaults). Every snapshot path —
  // restore, context switch, chart switch — funnels through here, so no chart
  // can be applied with a partial or foreign mapping.
  function reconcileMappingForChart(mapping, fallbackMapping, dimensions) {
    var source = mapping && typeof mapping === 'object' && !Array.isArray(mapping) ? mapping : {};
    if (!dimensions.length) {
      return Object.assign({}, fallbackMapping, source);
    }
    var reconciled = {};
    dimensions.forEach(function (dimension) {
      if (!dimension || !dimension.id) { return; }
      var field = source[dimension.id] || fallbackMapping[dimension.id] || '';
      if (field) {
        reconciled[dimension.id] = field;
      }
    });
    return reconciled;
  }

  function normalizeMappingSnapshot(snapshot, config) {
    var fallback = buildDefaultMappingSnapshot(config);
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return fallback;
    }
    var dimensions = getDimensionsForChart(config, getActiveChartId(config));
    var selected = reconcileMappingForChart(snapshot.selectedByDimension, fallback.selectedByDimension, dimensions);
    var lastKnownGood = snapshot.lastKnownGoodMapping && typeof snapshot.lastKnownGoodMapping === 'object' && !Array.isArray(snapshot.lastKnownGoodMapping)
      ? reconcileMappingForChart(snapshot.lastKnownGoodMapping, selected, dimensions)
      : selected;
    return {
      visible: typeof snapshot.visible === 'boolean' ? snapshot.visible : fallback.visible,
      selectedByDimension: cloneMapping(selected),
      lastKnownGoodMapping: cloneMapping(lastKnownGood),
      invalidOptionsByDimension: cloneInvalidOptions(snapshot.invalidOptionsByDimension)
    };
  }

  function captureMappingProfile() {
    var confirmedMapping = Object.keys(state.lastKnownGoodMapping || {}).length
      ? state.lastKnownGoodMapping
      : state.selectedByDimension;
    return {
      visible: state.visible,
      selectedByDimension: cloneMapping(confirmedMapping),
      lastKnownGoodMapping: cloneMapping(confirmedMapping),
      invalidOptionsByDimension: cloneInvalidOptions(state.invalidOptionsByDimension)
    };
  }

  function saveActiveMappingProfile() {
    var contextId = state.activeMappingContextId || 'default';
    var chartId = getActiveChartId(getConfig());
    var profileKey = getMappingProfileKey(contextId, chartId);
    state.mappingProfiles[profileKey] = captureMappingProfile();
    return state.mappingProfiles[profileKey];
  }

  // `options.applyToEntities: false` updates the runtime STATE and rows only:
  // UI-only chart switches route the panel while the resolved chart entities
  // may belong to another mode — applying the new mapping to them stamped a
  // foreign chart component onto the parked normal chart.
  function applyMappingRuntimeState(config, runtimeState, reason, options) {
    var applyToEntities = !options || options.applyToEntities !== false;
    var snapshot = normalizeMappingSnapshot(runtimeState, config);
    clearPendingValidationTimers();
    clearStatusTimer();
    state.pendingMapping = null;
    state.statusMessage = '';
    state.statusLevel = 'info';
    state.visible = snapshot.visible;
    state.selectedByDimension = cloneMapping(snapshot.selectedByDimension);
    state.lastKnownGoodMapping = cloneMapping(snapshot.lastKnownGoodMapping || snapshot.selectedByDimension);
    state.invalidOptionsByDimension = cloneInvalidOptions(snapshot.invalidOptionsByDimension);
    if (applyToEntities) {
      applyMappingSnapshot(config, state.lastKnownGoodMapping, reason || 'mapping-ui-restore');
    }
    state.selectedByDimension = cloneMapping(state.lastKnownGoodMapping);
    setVisible(config, state.visible);
    renderRows(config);
    // No re-fit request here: applyMappingSnapshot above already asks for one
    // when it actually applies a mapping to the charts. Asking again queued a
    // second pass over every chart for the same change.
    saveActiveMappingProfile();
    // Single place where the runtime state is applied → the profile now on
    // screen. switchMappingContext compares against this to stay idempotent.
    state.appliedMappingProfileKey = getMappingProfileKey(
      state.activeMappingContextId,
      getActiveChartId(config)
    );
    return true;
  }

  function mappingsEqual(left, right) {
    var leftKeys = Object.keys(left || {});
    var rightKeys = Object.keys(right || {});
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    return leftKeys.every(function (key) {
      return (left || {})[key] === (right || {})[key];
    });
  }

  function getChartComponentName(config) {
    return COMPONENT_BY_CHART[(state.activeChartId || (config && config.chartId)) || ''] || null;
  }

  function buildChartComponentUpdate(chartEntity, componentName, mappingSnapshot) {
    var currentData = chartEntity && componentName
      ? chartEntity.getAttribute(componentName)
      : null;
    var preservedData = currentData && typeof currentData === 'object' && !Array.isArray(currentData)
      ? currentData
      : {};
    return Object.assign({}, preservedData, mappingSnapshot || {});
  }

  // The chart the entity is actually WEARING, which is not always the chart
  // the selector points at: `selectChart(id, { applyToEntities: false })`
  // moves the selector alone (every mode change does it, so a mode can own its
  // own entity), leaving the scene chart on the previous type until something
  // re-applies the mapping.
  function getEntityChartId(chartEntity) {
    return chartEntity && typeof chartEntity.getAttribute === 'function'
      ? String(chartEntity.getAttribute('data-codexr-active-chart-id') || '')
      : '';
  }

  function applyMappingToCharts(chartEntities, componentName, mappingSnapshot) {
    var activeChartId = state.activeChartId;
    chartEntities.forEach(function (chartEntity) {
      var entityChartId = getEntityChartId(chartEntity);
      // Stamping the new component onto an entity still wearing the previous
      // one left it half converted: both babia components alive, the previous
      // chart's rotation still applied (a boats arriving after a pie stayed
      // rotated 90°) and a stale chart-id marker, which also mis-routes the
      // containment's fit strategy and surface lift. Converting it properly is
      // what applyChartTypeToEntity already does.
      if (activeChartId && entityChartId && entityChartId !== activeChartId) {
        applyChartTypeToEntity(chartEntity, activeChartId, mappingSnapshot);
        return;
      }
      setDeclarativeAttribute(
        chartEntity,
        componentName,
        serializeDeclarativeComponentData(
          buildChartComponentUpdate(chartEntity, componentName, mappingSnapshot)
        )
      );
    });
    // A re-mapping changes the fields that rank and filter the top-N slice:
    // recompute slice content for every entity reading from one.
    refreshChartDataSlicesForMapping(
      chartEntities,
      componentName,
      state.activeChartId,
      mappingSnapshot
    );
  }

  function isHierarchicalChart(chartId) {
    return chartId === 'boats';
  }

  // Canonical chart construction, injected by the generator as JSON
  // (#codexr-chart-base-config). The fallback mirrors the generator's values
  // (chartPresentation.ts) for scenes generated before the config existed and
  // for harnesses; the injected config always wins so the generator stays the
  // single source.
  var BOATS_BASE_ATTRIBUTES_FALLBACK = {
    legend: true,
    legend_text: '{name}\n{fheight} (height): {height}\n{farea} (area): {area}\n{fcolor} (color): {color}',
    height_building_legend: -0.5,
    legend_scale: 0.25,
    legend_lookat: '[camera]',
    axis_name: true,
    extra: 1,
    separation: 0.5,
    zone_elevation: 0.01,
    height_quarter_legend_box: 0.01,
    height_quarter_legend_title: 2.5
  };
  var CHART_BASE_CONFIG_FALLBACK = {
    boats: BOATS_BASE_ATTRIBUTES_FALLBACK,
    // Mirror of CHART_PRESENTATION_PROFILES (chartPresentation.ts): rotation
    // the chart needs to stand as Babia designed it, base component
    // attributes beyond the mapped fields, and how many data rows the chart
    // can express legibly (applied as a top-N slice by chartDataSlice.js).
    presentation: {
      bars: { rotation: '0 0 0', initialScale: '1.5 1.5 1.5', fit: 'planar-uniform', rowBudget: 20, orderBy: 'height', keyBy: ['x_axis'], baseAttributes: {} },
      barsmap: { rotation: '0 0 0', initialScale: '1.5 1.5 1.5', rowBudget: 30, orderBy: 'height', keyBy: ['x_axis', 'z_axis'], baseAttributes: {} },
      cyls: { rotation: '0 0 0', initialScale: '1.5 1.5 1.5', fit: 'planar-uniform', rowBudget: 20, orderBy: 'height', keyBy: ['x_axis'], baseAttributes: { radiusMax: 1 } },
      cylsmap: { rotation: '0 0 0', initialScale: '1.5 1.5 1.5', fit: 'planar-uniform', rowBudget: 30, orderBy: 'height', keyBy: ['x_axis', 'z_axis'], baseAttributes: { radiusMax: 1 } },
      pie: { rotation: '90 0 0', initialScale: '1.5 1.5 1.5', fit: 'uniform', rowBudget: 12, orderBy: 'size', keyBy: ['key'], baseAttributes: { titlePosition: '2.5 0 -3' } },
      donut: { rotation: '90 0 0', initialScale: '1.5 1.5 1.5', fit: 'uniform', rowBudget: 12, orderBy: 'size', keyBy: ['key'], baseAttributes: { titlePosition: '2.5 0 -3' } },
      bubbles: { rotation: '0 0 0', initialScale: '1.5 1.5 1.5', fit: 'uniform', rowBudget: 12, orderBy: 'height', keyBy: ['x_axis', 'z_axis'], surfaceLift: 0.03, baseAttributes: { heightMax: 5, radiusMax: 1.5 } },
      boats: {
        rotation: '0 0 0',
        initialScale: '0.01 0.05 0.01',
        preserveRelativeHierarchyLayers: true,
        baseAttributes: BOATS_BASE_ATTRIBUTES_FALLBACK
      }
    },
    treeFields: { directory: 'filePath', file: 'treePath' }
  };
  var chartBaseConfigCache = null;

  function getChartBaseConfig() {
    if (chartBaseConfigCache) {
      return chartBaseConfigCache;
    }
    var parsed = null;
    var element = getDoc()?.getElementById?.('codexr-chart-base-config');
    if (element && element.textContent) {
      try {
        parsed = JSON.parse(element.textContent);
      } catch (error) {
        console.warn('CODEXR_MAPPING_UI: invalid codexr-chart-base-config JSON', error);
      }
    }
    var presentation = {};
    Object.keys(CHART_BASE_CONFIG_FALLBACK.presentation).forEach(function (chartId) {
      var fallbackProfile = CHART_BASE_CONFIG_FALLBACK.presentation[chartId];
      var injectedProfile = (parsed && parsed.presentation && parsed.presentation[chartId]) || {};
      // Scenes generated before the presentation profile existed inject only
      // the legacy `boats` key: it must keep overriding the boats base.
      var legacyBoatsOverride = chartId === 'boats' ? (parsed?.boats || {}) : {};
      presentation[chartId] = Object.assign({}, fallbackProfile, injectedProfile, {
        baseAttributes: Object.assign(
          {},
          fallbackProfile.baseAttributes,
          legacyBoatsOverride,
          injectedProfile.baseAttributes || {}
        )
      });
    });
    chartBaseConfigCache = {
      boats: Object.assign({}, CHART_BASE_CONFIG_FALLBACK.boats, parsed?.boats || {}),
      presentation: presentation,
      treeFields: Object.assign({}, CHART_BASE_CONFIG_FALLBACK.treeFields, parsed?.treeFields || {})
    };
    return chartBaseConfigCache;
  }

  function getChartPresentation(chartId) {
    var presentation = getChartBaseConfig().presentation;
    return presentation[chartId] || {
      rotation: '0 0 0',
      initialScale: '1.5 1.5 1.5',
      baseAttributes: {}
    };
  }

  function getChartFromSource(chartId, existingData) {
    if (existingData && existingData.from) {
      var fromValue = String(existingData.from);
      if (isHierarchicalChart(chartId)) {
        if (/Tree/i.test(fromValue) || fromValue === 'tree') {
          return fromValue;
        }
        return 'tree';
      }
      if (/Comparison/i.test(fromValue) && !/Tree/i.test(fromValue)) {
        return fromValue;
      }
    }
    return isHierarchicalChart(chartId) ? 'tree' : 'data';
  }

  function buildRuntimeChartData(chartId, existingData, mappingSnapshot) {
    var data = Object.assign({}, mappingSnapshot || {});
    var source = getChartFromSource(chartId, existingData);
    // Budgeted charts read from the CodeXR-maintained top-N slice instead of
    // the full dataset (chartDataSlice.js); boats keeps its tree source.
    data.from = resolveChartDataSourceId(chartId, source, mappingSnapshot);
    data.legend = true;
    data.palette = existingData.palette || 'ubuntu';
    data.title = existingData.title || 'CodeXR Analysis';
    data.axis_name = true;

    // Every chart carries its canonical base attributes (normalization caps,
    // title placement, boats construction) under the mapping — the live
    // switch used to drop them for everything but boats, which is how
    // bubbles lost heightMax/radiusMax and exploded to raw metric scale.
    return Object.assign({}, getChartPresentation(chartId).baseAttributes, data);
  }

  function serializeDeclarativeComponentData(componentData) {
    return Object.keys(componentData || {})
      .filter(function (key) {
        var value = componentData[key];
        return value !== undefined && value !== null && value !== '';
      })
      .map(function (key) {
        var value = componentData[key];
        if (Array.isArray(value)) {
          value = value.join(',');
        } else if (value && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        return key + ': ' + String(value).replace(/;/g, ',');
      })
      .join(';\n');
  }

  function setDeclarativeAttribute(element, name, value) {
    if (!element || !name) {
      return false;
    }
    var serialized = String(value ?? '');
    var nativeSetter = root.Element?.prototype?.setAttribute;
    if (typeof nativeSetter !== 'function') {
      element.setAttribute?.(name, serialized);
      return true;
    }
    // Once mounted, A-Frame's setter is still responsible for updating the
    // live component. It serializes component attributes as "", however, so
    // restore the authoritative declarative string with the native DOM setter.
    if (element.isConnected) {
      element.setAttribute(name, serialized);
    }
    nativeSetter.call(element, name, serialized);
    return true;
  }

  function syncHierarchyLayerStability(chart, presentation) {
    if (!chart) {
      return false;
    }
    var attributeName = 'codexr-boats-layout-stability';
    if (presentation && presentation.preserveRelativeHierarchyLayers === true) {
      return setDeclarativeAttribute(chart, attributeName, 'enabled: true');
    }
    if (typeof chart.removeAttribute === 'function') {
      chart.removeAttribute(attributeName);
    }
    return false;
  }

  function declarativePosition(position) {
    if (typeof position === 'string' && position.trim()) {
      return position;
    }
    var value = position || {};
    return [
      Number.isFinite(Number(value.x)) ? Number(value.x) : 0,
      Number.isFinite(Number(value.y)) ? Number(value.y) : 1,
      Number.isFinite(Number(value.z)) ? Number(value.z) : -18
    ].join(' ');
  }

  function buildDeclarativeTreeEntity(options) {
    var settings = options || {};
    var document = getDoc();
    if (!document?.createElement) {
      return null;
    }
    var tree = document.createElement('a-entity');
    setDeclarativeAttribute(tree, 'id', String(settings.entityId || 'tree'));
    setDeclarativeAttribute(
      tree,
      'babia-treebuilder',
      serializeDeclarativeComponentData({
        field: settings.field || 'filePath',
        split_by: settings.splitBy || '/',
        from: settings.sourceId || 'data'
      })
    );
    return tree;
  }

  function buildDeclarativeChartComponentData(options) {
    var settings = options || {};
    var chartId = String(settings.chartId || '');
    var existingData = {
      from: settings.sourceId || (isHierarchicalChart(chartId) ? 'tree' : 'data'),
      palette: settings.palette || 'ubuntu',
      title: settings.title || 'CodeXR Analysis'
    };
    var mapping = settings.mapping || {};
    var data = buildRuntimeChartData(chartId, existingData, mapping);
    var ordered = {
      from: existingData.from,
      title: data.title,
      palette: data.palette
    };
    Object.keys(mapping).forEach(function (key) {
      ordered[key] = data[key];
    });
    Object.keys(data).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
        ordered[key] = data[key];
      }
    });
    return Object.assign(ordered, settings.componentData || {});
  }

  function configureDeclarativeChartEntity(chart, options) {
    var settings = options || {};
    var chartId = String(settings.chartId || '');
    var componentName = COMPONENT_BY_CHART[chartId];
    if (!chart || !componentName) {
      return false;
    }
    var presentation = getChartPresentation(chartId);
    setDeclarativeAttribute(chart, 'data-codexr-active-chart-id', chartId);
    if (settings.role) {
      setDeclarativeAttribute(chart, 'data-codexr-role', String(settings.role));
    }
    if (settings.applyTransform !== false) {
      if (settings.containmentProfile) {
        var containmentProfile = settings.containmentProfile;
        setDeclarativeAttribute(
          chart,
          'codexr-chart-containment',
          serializeDeclarativeComponentData(containmentProfile.containment || {})
        );
        setDeclarativeAttribute(chart, 'data-codexr-chart-containment', 'true');
        setDeclarativeAttribute(
          chart,
          'position',
          declarativePosition(containmentProfile.position)
        );
      } else if (settings.position) {
        setDeclarativeAttribute(chart, 'position', declarativePosition(settings.position));
      }
      setDeclarativeAttribute(
        chart,
        'rotation',
        settings.rotation || presentation.rotation || '0 0 0'
      );
      if (settings.applyInitialScale !== false) {
        setDeclarativeAttribute(
          chart,
          'scale',
          settings.initialScale || presentation.initialScale || '1.5 1.5 1.5'
        );
      }
    }
    syncHierarchyLayerStability(chart, presentation);
    // Install/update Babia last. On a connected entity the component may
    // synchronously build during setAttribute(), so its canonical scale and
    // hierarchy-layer policy must already be in force before that first
    // generateElements call.
    setDeclarativeAttribute(
      chart,
      componentName,
      serializeDeclarativeComponentData(buildDeclarativeChartComponentData(settings))
    );
    return true;
  }

  function buildDeclarativeChartEntity(options) {
    var settings = options || {};
    var document = getDoc();
    if (!document?.createElement) {
      return null;
    }
    var chart = document.createElement('a-entity');
    setDeclarativeAttribute(chart, 'id', String(settings.entityId || 'chart'));
    return configureDeclarativeChartEntity(chart, settings) ? chart : null;
  }

  function readCurrentChartData(chartEntity) {
    if (!chartEntity || typeof chartEntity.getAttribute !== 'function') {
      return {};
    }
    var componentNames = Object.keys(COMPONENT_BY_CHART).map(function (chartId) {
      return COMPONENT_BY_CHART[chartId];
    }).filter(function (componentName, index, list) {
      return componentName && list.indexOf(componentName) === index;
    });
    for (var i = 0; i < componentNames.length; i += 1) {
      var value = chartEntity.getAttribute(componentNames[i]);
      if (value && typeof value === 'object') {
        return value;
      }
    }
    return {};
  }

  // BabiaXR chart components subscribe to their data source through the
  // producer's NotiBuffer and — as of 1.3.4 — NONE of them declares `remove()`,
  // so removing the component leaves its callback registered. The next data
  // push (every refresh; in project evolution, every frame) then makes the
  // DELETED chart paint itself again on top of the new one: the leftover
  // geometry left behind by a chart switch. Unregistering with Babia's own API
  // is what its components forgot to do.
  function releaseChartComponentSubscription(chartEntity, componentName) {
    var component = chartEntity && chartEntity.components && chartEntity.components[componentName];
    if (!component) {
      return;
    }
    var buffer = component.prodComponent && component.prodComponent.notiBuffer;
    if (buffer && typeof buffer.unregister === 'function' && component.notiBufferId !== undefined) {
      try {
        buffer.unregister(component.notiBufferId);
      } catch (error) {
        console.warn('CODEXR_MAPPING_UI: could not unsubscribe ' + componentName, error);
      }
    }
    component.prodComponent = null;
    component.notiBufferId = undefined;
  }

  function releaseChartEntity(chartEntity) {
    if (!chartEntity || !chartEntity.components) {
      return;
    }
    Object.keys(chartEntity.components).forEach(function (componentName) {
      if (componentName.indexOf('babia-') === 0) {
        releaseChartComponentSubscription(chartEntity, componentName);
      }
    });
  }

  function clearChartComponents(chartEntity) {
    Object.keys(COMPONENT_BY_CHART).forEach(function (chartId) {
      var componentName = COMPONENT_BY_CHART[chartId];
      if (componentName && chartEntity.removeAttribute) {
        releaseChartComponentSubscription(chartEntity, componentName);
        chartEntity.removeAttribute(componentName);
      }
    });
  }

  function clearChartGeneratedChildren(chartEntity) {
    if (!chartEntity || typeof chartEntity.removeChild !== 'function') {
      return;
    }
    while (chartEntity.firstChild) {
      chartEntity.removeChild(chartEntity.firstChild);
    }
  }

  // Second line of defence: anything hanging off the chart entity that no LIVE
  // component claims is residue from a previous chart (Babia caches its roots
  // as `chartEl`/`titleEl` on the component instance). Runs after the new chart
  // has had time to build, so a producer we could not reach cannot leave a
  // ghost chart on the table.
  function sweepOrphanChartChildren(chartEntity) {
    if (!chartEntity || !chartEntity.children || typeof chartEntity.removeChild !== 'function') {
      return 0;
    }
    var liveRoots = [];
    var unclaimableLiveComponent = false;
    Object.keys(chartEntity.components || {}).forEach(function (componentName) {
      if (componentName.indexOf('babia-') !== 0 || componentName === 'babia-queryjson') {
        return;
      }
      var component = chartEntity.components[componentName];
      var claimed = 0;
      ['chartEl', 'titleEl', 'legendEl'].forEach(function (key) {
        if (component && component[key]) {
          liveRoots.push(component[key]);
          claimed += 1;
        }
      });
      if (!claimed) {
        // babia-boats appends its figures DIRECTLY to the entity and exposes
        // no root property at all: with a component like that live, orphans
        // cannot be told apart from the chart itself. Sweeping here deleted
        // the freshly built boats and left the table empty until the next
        // data push (a mapping change) rebuilt it.
        unclaimableLiveComponent = true;
      }
    });
    if (unclaimableLiveComponent) {
      return 0;
    }
    var removed = 0;
    Array.prototype.slice.call(chartEntity.children).forEach(function (child) {
      // Never touch nodes CodeXR itself mounts inside a chart.
      if (child.getAttribute && String(child.getAttribute('data-codexr-role') || '')) {
        return;
      }
      if (liveRoots.indexOf(child) === -1) {
        chartEntity.removeChild(child);
        removed += 1;
      }
    });
    return removed;
  }

  function scheduleOrphanChartSweep(chartEntity) {
    if (!chartEntity) {
      return;
    }
    [400, 1500].forEach(function (delayMs) {
      setTimeout(function () {
        var removed = sweepOrphanChartChildren(chartEntity);
        if (removed) {
          resizeTrace('chart-orphan-children-removed', { chartId: chartEntity.id || '', removed: removed });
        }
      }, delayMs);
    });
  }

  function applyChartDefaultTransform(chartEntity, chartId) {
    if (!chartEntity || typeof chartEntity.setAttribute !== 'function') {
      return;
    }
    // Canonical orientation from the presentation profile: pie/donut lie flat
    // by construction and Babia's own demos stand them with 90 0 0.
    setDeclarativeAttribute(chartEntity, 'rotation', getChartPresentation(chartId).rotation);
  }

  // A scene generated by an older extension build can carry a chart entity
  // whose HTML predates the presentation profile: a pie/donut generated flat
  // (rotation 0 0 0) and no chart-id attribute for the fit profiles. Align
  // the ACTIVE chart with its profile at bootstrap so the runtime heals such
  // scenes without waiting for a chart switch or a re-generation.
  function syncActiveChartPresentation(config) {
    var chartId = state.activeChartId || (config && config.chartId) || null;
    if (!chartId || !COMPONENT_BY_CHART[chartId]) {
      return;
    }
    getChartEntities(config).forEach(function (chartEntity) {
      if (!chartEntity || typeof chartEntity.setAttribute !== 'function') {
        return;
      }
      if (typeof chartEntity.getAttribute === 'function'
        && !chartEntity.getAttribute('data-codexr-active-chart-id')) {
        chartEntity.setAttribute('data-codexr-active-chart-id', chartId);
      }
      applyChartDefaultTransform(chartEntity, chartId);
      syncHierarchyLayerStability(chartEntity, getChartPresentation(chartId));
    });
  }

  function applyChartTypeToEntity(chartEntity, chartId, mappingSnapshot) {
    var componentName = COMPONENT_BY_CHART[chartId];
    if (!chartEntity || !componentName || typeof chartEntity.setAttribute !== 'function') {
      return false;
    }
    var existingData = readCurrentChartData(chartEntity);
    var presentation = getChartPresentation(chartId);
    clearChartComponents(chartEntity);
    clearChartGeneratedChildren(chartEntity);
    // An explicit chart-type change starts a new Babia instance. Reset its
    // REAL object3D scale before installing the component: the DOM may still
    // say 0.01 0.05 0.01 while containment has raised object3D.scale.y. Boats
    // reads that live Y scale synchronously during its first layout.
    setDeclarativeAttribute(chartEntity, 'data-codexr-active-chart-id', chartId);
    applyChartDefaultTransform(chartEntity, chartId);
    setDeclarativeAttribute(
      chartEntity,
      'scale',
      presentation.initialScale || '1.5 1.5 1.5'
    );
    syncHierarchyLayerStability(chartEntity, presentation);
    setDeclarativeAttribute(
      chartEntity,
      componentName,
      serializeDeclarativeComponentData(
        buildRuntimeChartData(chartId, existingData, mappingSnapshot)
      )
    );
    scheduleOrphanChartSweep(chartEntity);
    return true;
  }

  function applyChartTypeToEntities(config, chartId, mappingSnapshot) {
    var chartEntities = getChartEntities(config);
    var componentName = COMPONENT_BY_CHART[chartId];
    if (!chartEntities.length || !componentName) {
      return false;
    }
    chartEntities.forEach(function (chartEntity) {
      applyChartTypeToEntity(chartEntity, chartId, mappingSnapshot);
    });
    return true;
  }

  function getDimensionConfig(config, dimensionId) {
    var dimensions = Array.isArray(config && config.dimensions) ? config.dimensions : [];
    for (var i = 0; i < dimensions.length; i += 1) {
      if (dimensions[i] && dimensions[i].id === dimensionId) {
        return dimensions[i];
      }
    }
    return null;
  }

  // == xrChartMappingUiRuntime.js | chartDataSlice (assembled per manifest.json; see COMPONENTS.md) ==
  //
  // Top-N sliced datasource for row-budgeted charts.
  //
  // The bars/cyls families draw ONE element per data row keyed by the axis
  // label — Babia does not aggregate, and duplicate labels overwrite each
  // other — so a deep analysis (hundreds of rows) turns them into unreadable
  // walls that the table then shrinks to nothing. Charts whose presentation
  // profile declares a rowBudget therefore read from a CodeXR-maintained
  // babia-queryjson entity that carries only the top-N rows, ranked by the
  // field mapped to the profile's orderBy dimension. Boats has no budget (its
  // design is per-file) and keeps the full tree.
  //
  // The slice also honours dimension value rules BY VALUE: rows whose mapped
  // field violates numeric-positive are dropped (babia-cylsmap computes axis
  // lengths with Math.max over radii filtered by `o != ''`, which drops 0 and
  // yields -Infinity axes when any radius is 0 — the "invalid axes" rejection).
  //
  // One slice entity per underlying source (normal analysis: data; historical
  // duals: one per comparison producer). Each slice subscribes to its
  // producer's NotiBuffer, so re-analysis pushes and evolution frame swaps
  // flow through automatically.

  var CHART_DATA_SLICE_PREFIX = 'codexrChartDataSlice__';
  // sourceId -> { el, producer, notiBufferId, rows, lastChartId, lastMapping }
  var chartDataSlices = {};

  function getSliceEntityId(sourceId) {
    return CHART_DATA_SLICE_PREFIX + sourceId;
  }

  function getSourceIdFromSliceId(candidateId) {
    var value = String(candidateId || '');
    return value.indexOf(CHART_DATA_SLICE_PREFIX) === 0
      ? value.slice(CHART_DATA_SLICE_PREFIX.length)
      : null;
  }

  // Mirror of the value rules templateCharts declares per dimension, for
  // scenes whose injected config predates them (and for harnesses without a
  // config). The injected availableCharts always wins when present.
  var DIMENSION_VALUE_RULES_FALLBACK = {
    bars: { height: 'numeric-finite' },
    barsmap: { height: 'numeric-finite' },
    cyls: { height: 'numeric-finite', radius: 'numeric-positive' },
    cylsmap: { height: 'numeric-finite', radius: 'numeric-positive' },
    bubbles: { height: 'numeric-finite', radius: 'numeric-positive' },
    pie: { size: 'numeric-positive' },
    donut: { size: 'numeric-positive' }
  };

  function getChartDimensionDefs(config, chartId) {
    var charts = Array.isArray(config && config.availableCharts) ? config.availableCharts : [];
    for (var i = 0; i < charts.length; i += 1) {
      if (charts[i] && charts[i].id === chartId) {
        return Array.isArray(charts[i].dimensions) ? charts[i].dimensions : [];
      }
    }
    var fallbackRules = DIMENSION_VALUE_RULES_FALLBACK[chartId] || {};
    return Object.keys(fallbackRules).map(function (dimensionId) {
      return { id: dimensionId, valueRule: fallbackRules[dimensionId] };
    });
  }

  function computeChartDataSlice(chartId, rows, mappingSnapshot) {
    var profile = getChartPresentation(chartId);
    var budget = Number(profile.rowBudget);
    if (!Array.isArray(rows) || !isFinite(budget) || budget <= 0) {
      return Array.isArray(rows) ? rows : [];
    }
    var mapping = mappingSnapshot || {};
    var dimensionDefs = getChartDimensionDefs(getConfig(), chartId);

    var filtered = rows.filter(function (row) {
      if (!row || typeof row !== 'object') {
        return false;
      }
      for (var i = 0; i < dimensionDefs.length; i += 1) {
        var dimension = dimensionDefs[i];
        var field = dimension && mapping[dimension.id];
        if (!field || !dimension.valueRule) {
          continue;
        }
        var value = Number(row[field]);
        if (dimension.valueRule === 'numeric-positive' && !(isFinite(value) && value > 0)) {
          return false;
        }
        if (dimension.valueRule === 'numeric-finite' && !isFinite(value)) {
          return false;
        }
      }
      return true;
    });

    var orderField = profile.orderBy ? mapping[profile.orderBy] : null;
    if (orderField) {
      // Stable rank by the mapped magnitude, largest first: the slice keeps
      // the rows the chart is most likely being asked about.
      filtered = filtered
        .map(function (row, index) { return { row: row, index: index }; })
        .sort(function (a, b) {
          var left = Number(a.row[orderField]);
          var right = Number(b.row[orderField]);
          var leftRank = isFinite(left) ? left : -Infinity;
          var rightRank = isFinite(right) ? right : -Infinity;
          if (leftRank !== rightRank) {
            return rightRank - leftRank;
          }
          return a.index - b.index;
        })
        .map(function (entry) { return entry.row; });
    }

    // Babia keys chart elements by the label values of the keyBy dimensions
    // (babia-name): rows sharing a key collapse onto one element and the
    // later row silently overwrites the earlier one — three same-named
    // vendored files became one corrupted bar. Keep only the highest-ranked
    // row per distinct key combination.
    var keyFields = Array.isArray(profile.keyBy)
      ? profile.keyBy.map(function (dimensionId) { return mapping[dimensionId]; }).filter(Boolean)
      : [];
    if (keyFields.length) {
      var seenKeys = {};
      filtered = filtered.filter(function (row) {
        var key = keyFields.map(function (field) { return String(row[field]); }).join(' ');
        if (seenKeys[key]) {
          return false;
        }
        seenKeys[key] = true;
        return true;
      });
    }

    return filtered.slice(0, budget);
  }

  function applyChartDataSliceRows(record) {
    if (!record || !record.el || !Array.isArray(record.rows) || !record.lastChartId) {
      return;
    }
    var sliceRows = computeChartDataSlice(record.lastChartId, record.rows, record.lastMapping);
    try {
      record.el.setAttribute('babia-queryjson', 'data', JSON.stringify(sliceRows));
    } catch (error) {
      console.warn('CODEXR_MAPPING_UI: could not update chart data slice', error);
    }
  }

  function ensureChartDataSlice(sourceId) {
    if (chartDataSlices[sourceId]) {
      return chartDataSlices[sourceId];
    }
    var document = getDoc();
    var producerEl = document ? document.getElementById(sourceId) : null;
    var producer = producerEl && producerEl.components && producerEl.components['babia-queryjson'];
    if (!producer || !producer.notiBuffer) {
      // Not a queryjson producer (or not initialized yet): nothing to slice.
      return null;
    }
    var sliceEl = document.getElementById(getSliceEntityId(sourceId));
    if (!sliceEl) {
      sliceEl = document.createElement('a-entity');
      sliceEl.id = getSliceEntityId(sourceId);
      (producerEl.parentNode || producerEl.sceneEl || document.body).appendChild(sliceEl);
    }
    var record = {
      el: sliceEl,
      producer: producer,
      notiBufferId: undefined,
      rows: null,
      lastChartId: null,
      lastMapping: null
    };
    // NotiBuffer.register fires immediately when the producer already has
    // data, so `record.rows` is normally populated before this returns; later
    // pushes (re-analysis, evolution frames) recompute the slice in place.
    record.notiBufferId = producer.notiBuffer.register(function (rows) {
      record.rows = Array.isArray(rows) ? rows : [];
      applyChartDataSliceRows(record);
    });
    chartDataSlices[sourceId] = record;
    return record;
  }

  function updateChartDataSlice(sourceId, chartId, mappingSnapshot) {
    var record = ensureChartDataSlice(sourceId);
    if (!record) {
      return false;
    }
    record.lastChartId = chartId;
    record.lastMapping = Object.assign({}, mappingSnapshot || {});
    applyChartDataSliceRows(record);
    return true;
  }

  // Called while building a chart's component data: budgeted charts are
  // redirected to their source's slice entity; everything else (boats' tree,
  // unknown producers) keeps the original source untouched.
  function resolveChartDataSourceId(chartId, sourceId, mappingSnapshot) {
    var profile = getChartPresentation(chartId);
    if (!profile.rowBudget || !sourceId) {
      return sourceId;
    }
    var underlyingSourceId = getSourceIdFromSliceId(sourceId) || sourceId;
    if (!updateChartDataSlice(underlyingSourceId, chartId, mappingSnapshot)) {
      // Producer not ready yet (bootstrap): keep the raw source for now and
      // re-point once the slice can be built.
      scheduleChartDataSliceSync();
      return underlyingSourceId;
    }
    var record = chartDataSlices[underlyingSourceId];
    var sliceComponent = record.el.components && record.el.components['babia-queryjson'];
    if (!sliceComponent || !sliceComponent.notiBuffer) {
      // The slice entity was created this very tick: A-Frame registers the
      // component instance BEFORE running init(), so `components` may already
      // list babia-queryjson while its notiBuffer does not exist yet. Babia's
      // updateFunction silently skips registration in that window, leaving
      // the chart permanently data-less. Render from the raw source once and
      // re-point when the slice is genuinely live.
      scheduleChartDataSliceSync();
      return underlyingSourceId;
    }
    return getSliceEntityId(underlyingSourceId);
  }

  // Re-points the ACTIVE chart entities at their slice when they still read a
  // raw source that should be budgeted. Used at bootstrap (a generated scene's
  // initial chart carries `from: data` in its HTML) and whenever a slice
  // entity was not yet live at build time.
  function syncActiveChartDataSlice() {
    var config = getConfig();
    // Warm the main slice as soon as the producer is live, whatever chart is
    // active: a budgeted chart built against a slice that does not exist yet
    // falls back to the raw source once, and Babia's keyed element reuse then
    // keeps the raw build's positions when the slice lands.
    ensureChartDataSlice('data');
    var chartId = state.activeChartId || (config && config.chartId) || null;
    if (!chartId || !getChartPresentation(chartId).rowBudget) {
      return true;
    }
    var componentName = COMPONENT_BY_CHART[chartId];
    if (!componentName) {
      return true;
    }
    var mapping = Object.keys(state.selectedByDimension || {}).length
      ? state.selectedByDimension
      : ((config && config.defaultMappingsByChart && config.defaultMappingsByChart[chartId]) || {});
    var synced = true;
    getChartEntities(config).forEach(function (chartEntity) {
      var currentData = chartEntity && typeof chartEntity.getAttribute === 'function'
        ? chartEntity.getAttribute(componentName)
        : null;
      if (!currentData || typeof currentData !== 'object' || !currentData.from) {
        return;
      }
      var currentSource = String(currentData.from);
      var resolved = resolveChartDataSourceId(chartId, currentSource, mapping);
      if (resolved !== currentSource) {
        chartEntity.setAttribute(componentName, 'from', resolved);
      } else if (!getSourceIdFromSliceId(currentSource)) {
        synced = false;
      }
    });
    return synced;
  }

  var chartDataSliceSyncTimer = null;
  var chartDataSliceSyncAttempts = 0;

  function scheduleChartDataSliceSync() {
    if (chartDataSliceSyncTimer || chartDataSliceSyncAttempts >= 25) {
      return;
    }
    chartDataSliceSyncTimer = root.setTimeout?.(function () {
      chartDataSliceSyncTimer = null;
      chartDataSliceSyncAttempts += 1;
      if (!syncActiveChartDataSlice()) {
        scheduleChartDataSliceSync();
      }
    }, 400);
  }

  // Mapping changes ranked/filter fields: recompute the slice content behind
  // every chart entity that reads from one, keeping `from` untouched.
  function refreshChartDataSlicesForMapping(chartEntities, componentName, chartId, mappingSnapshot) {
    (chartEntities || []).forEach(function (chartEntity) {
      var currentData = chartEntity && componentName ? chartEntity.getAttribute(componentName) : null;
      var sourceId = currentData && typeof currentData === 'object'
        ? getSourceIdFromSliceId(currentData.from)
        : null;
      if (sourceId) {
        updateChartDataSlice(sourceId, chartId, mappingSnapshot);
      }
    });
  }

// == xrChartMappingUiRuntime.js | statusAndSharedState (assembled per manifest.json; see COMPONENTS.md) ==
  function clearPendingValidationTimers() {
    while (state.pendingValidationTimers.length > 0) {
      clearTimeout(state.pendingValidationTimers.pop());
    }
  }

  function updateStatusText() {
    if (!refs.statusText) {
      return;
    }
    refs.statusText.setAttribute('value', state.statusMessage || '');
    refs.statusText.setAttribute('color', state.statusLevel === 'error' ? '#fca5a5' : '#fde68a');
    // This text belongs to the mapping view: other panel views (e.g. project
    // evolution) place their own status in the same spot, and a message set
    // while another view is active (playback locks refresh every frame) must
    // not paint over it. showPanelView re-evaluates this on view switches.
    var visible = state.activePanelView === 'mapping' && !!state.statusMessage;
    refs.statusText.setAttribute('visible', visible);
    if (refs.statusText.object3D) {
      refs.statusText.object3D.visible = visible;
    }
  }

  function clearStatusTimer() {
    if (state.statusClearTimer) {
      clearTimeout(state.statusClearTimer);
      state.statusClearTimer = null;
    }
  }

  function setStatusMessage(message, level, ttlMs) {
    state.statusMessage = message || '';
    state.statusLevel = level || 'warning';
    updateStatusText();
    clearStatusTimer();
    if (state.statusMessage && ttlMs !== 0) {
      state.statusClearTimer = setTimeout(function () {
        state.statusClearTimer = null;
        state.statusMessage = '';
        updateStatusText();
      }, typeof ttlMs === 'number' ? ttlMs : 3200);
    }
  }

  function markInvalidOption(dimensionId, fieldName, reason) {
    if (!state.invalidOptionsByDimension[dimensionId]) {
      state.invalidOptionsByDimension[dimensionId] = {};
    }
    state.invalidOptionsByDimension[dimensionId][fieldName] = reason || 'This mapping is currently invalid.';
  }

  function clearInvalidOption(dimensionId, fieldName) {
    if (!state.invalidOptionsByDimension[dimensionId]) {
      return;
    }
    delete state.invalidOptionsByDimension[dimensionId][fieldName];
    if (Object.keys(state.invalidOptionsByDimension[dimensionId]).length === 0) {
      delete state.invalidOptionsByDimension[dimensionId];
    }
  }

  function getInvalidOptionReason(dimensionId, fieldName) {
    return state.invalidOptionsByDimension[dimensionId] && state.invalidOptionsByDimension[dimensionId][fieldName]
      ? state.invalidOptionsByDimension[dimensionId][fieldName]
      : '';
  }

  function applyMappingSnapshot(config, mappingSnapshot, reason) {
    var chartEntities = getChartEntities(config);
    var componentName = getChartComponentName(config);
    if (!chartEntities.length || !componentName || !mappingSnapshot) {
      return false;
    }

    applyMappingToCharts(chartEntities, componentName, mappingSnapshot);
    state.selectedByDimension = cloneMapping(mappingSnapshot);
    requestChartContainmentRenormalize(reason || 'mapping-ui-snapshot');
    return true;
  }

  function inspectChartStatus(config) {
    var chartTargets = buildChartValidationTargets(config);
    var analysisTableRuntime = root.CodeXRAnalysisTableRuntime;
    if (!analysisTableRuntime || typeof analysisTableRuntime.getChartStatus !== 'function') {
      return { ready: true, valid: true, reason: 'containment-runtime-unavailable' };
    }
    var statuses = chartTargets.map(function (resolveChartTarget) {
      return analysisTableRuntime.getChartStatus(resolveChartTarget());
    });
    var pending = statuses.find(function (status) { return !status || status.ready === false; });
    if (pending) {
      return pending;
    }
    return statuses.find(function (status) { return status.valid === false; })
      || { ready: true, valid: true, reason: 'ok' };
  }

  function getSharedMappingEntityId(config) {
    var baseId = config && (config.chartEntityId || config.chartSelector || config.chartId)
        ? String(config.chartEntityId || config.chartSelector || config.chartId)
        : 'default-chart';
    return String(baseId).replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  function buildSharedMappingState(config) {
    return {
      entityKind: SHARED_ENTITY_KIND,
      entityId: getSharedMappingEntityId(config),
      chartId: getActiveChartId(config),
      componentName: getChartComponentName(config) || '',
      selectedByDimension: cloneMapping(state.lastKnownGoodMapping || state.selectedByDimension)
    };
  }

  function publishSharedMappingState(config, eventType) {
    if (state.suppressSharedPublish) {
      return false;
    }
    var client = getCollaborationClient();
    if (!client || typeof client.sendEntityState !== 'function') {
      return false;
    }
    return client.sendEntityState(buildSharedMappingState(config), eventType || 'entity-updated');
  }

  function applySharedMappingState(config, snapshot) {
    if (!snapshot || typeof snapshot !== 'object' || !snapshot.selectedByDimension) {
      return false;
    }
    if (state.mappingControlsLocked) {
      setStatusMessage('Playback running - pause to change chart or axes.', 'info', 0);
      return false;
    }

    state.suppressSharedPublish = true;
    try {
      clearPendingValidationTimers();
      state.pendingMapping = null;
      var delegatedEntityApply = state.activeMappingContextId === 'project-evolution';
      if (snapshot.chartId && snapshot.chartId !== getActiveChartId(config)) {
        selectChart(
          snapshot.chartId,
          delegatedEntityApply ? { applyToEntities: false } : undefined
        );
      }
      state.selectedByDimension = cloneMapping(snapshot.selectedByDimension);
      state.lastKnownGoodMapping = cloneMapping(snapshot.selectedByDimension);
      if (!delegatedEntityApply) {
        applyMappingSnapshot(config, snapshot.selectedByDimension, 'mapping-ui-room-sync');
      }
      saveActiveMappingProfile();
      renderRows(config);
      notifyMappingConfirmed(state.lastKnownGoodMapping);
      return true;
    } finally {
      state.suppressSharedPublish = false;
    }
  }

  function publishInitialSharedMappingState(config) {
    return publishSharedMappingState(config, 'entity-added');
  }

  function registerSharedMappingEntity(config) {
    var client = getCollaborationClient();
    if (!client || typeof client.registerEntityRuntime !== 'function') {
      return;
    }

    client.registerEntityRuntime({
      entityKind: SHARED_ENTITY_KIND,
      entityId: getSharedMappingEntityId(config),
      applySharedState: function (snapshot) {
        applySharedMappingState(config, snapshot);
      },
      publishInitialSharedState: function () {
        publishInitialSharedMappingState(config);
      }
    });
  }

  function notifyMappingConfirmed(mapping) {
    var document = getDoc();
    if (!document || typeof document.dispatchEvent !== 'function') {
      return;
    }
    var detail = {
      selectedByDimension: cloneMapping(mapping || {}),
      chartId: getActiveChartId(getConfig()),
      mappingContextId: state.activeMappingContextId
    };
    if (typeof root.CustomEvent === 'function') {
      document.dispatchEvent(new root.CustomEvent('codexr-mapping-confirmed', { detail: detail }));
      return;
    }
    document.dispatchEvent({
      type: 'codexr-mapping-confirmed',
      detail: detail
    });
  }

// == xrChartMappingUiRuntime.js | pendingValidation (assembled per manifest.json; see COMPONENTS.md) ==
  function confirmPendingMapping(config, token) {
    if (!state.pendingMapping || state.pendingMapping.token !== token) {
      return;
    }
    clearInvalidOption(state.pendingMapping.dimensionId, state.pendingMapping.fieldName);
    state.lastKnownGoodMapping = cloneMapping(state.pendingMapping.nextMapping);
    state.pendingMapping = null;
    clearPendingValidationTimers();
    saveActiveMappingProfile();
    resizeTrace('mapping-confirmed', {
      token: token,
      selectedByDimension: state.lastKnownGoodMapping
    });
    publishSharedMappingState(config);
    notifyMappingConfirmed(state.lastKnownGoodMapping);
  }

  function revertPendingMapping(config, token, reason) {
    if (!state.pendingMapping || state.pendingMapping.token !== token) {
      return;
    }
    var friendlyMessage = buildFriendlyInvalidMappingMessage(
      config,
      state.pendingMapping.dimensionId,
      state.pendingMapping.fieldName,
      reason,
      true
    );
    markInvalidOption(state.pendingMapping.dimensionId, state.pendingMapping.fieldName, friendlyMessage);
    applyMappingSnapshot(config, state.pendingMapping.previousMapping, 'mapping-ui-revert');
    setStatusMessage(friendlyMessage, 'error', 4800);
    resizeTrace('mapping-reverted-invalid-babia-frame', {
      token: token,
      reason: reason || 'invalid-chart-state'
    });
    state.pendingMapping = null;
    clearPendingValidationTimers();
    renderRows(config);
  }

  function evaluatePendingMapping(config, token, result) {
    if (!state.pendingMapping || state.pendingMapping.token !== token) {
      return;
    }

    if (result && result.valid && result.stabilized) {
      confirmPendingMapping(config, token);
      renderRows(config);
      return;
    }

    if (result && result.valid && !result.stabilized) {
      applyMappingSnapshot(config, state.pendingMapping.previousMapping, 'mapping-ui-unstable-revert');
      state.pendingMapping = null;
      clearPendingValidationTimers();
      scheduleContainmentValidationBursts('mapping-ui-revert');
      setStatusMessage(
        'The chart did not stabilize inside the table after changing this metric. CodeXR restored the previous mapping.',
        'error',
        4800
      );
      resizeTrace('mapping-reverted-unstable-containment', {
        token: token,
        reason: result.reason || result.state || 'not-stabilized'
      });
      renderRows(config);
      return;
    }

    if (result && result.state === 'invalid') {
      var invalidStatus = (result.statuses || []).find(function (status) {
        return status && status.valid === false && status.ready === true;
      });
      revertPendingMapping(
        config,
        token,
        invalidStatus?.message || 'The selected mapping produced invalid chart geometry.'
      );
      return;
    }

    applyMappingSnapshot(config, state.pendingMapping.previousMapping, 'mapping-ui-timeout-revert');
    state.pendingMapping = null;
    clearPendingValidationTimers();
    scheduleContainmentValidationBursts('mapping-ui-timeout-revert');
    setStatusMessage(
      'The chart did not finish rebuilding. CodeXR restored the previous mapping; you can try this field again.',
      'error',
      4800
    );
    renderRows(config);
  }

  function schedulePendingMappingValidation(config, token) {
    clearPendingValidationTimers();
    var runtime = root.CodeXRAnalysisTableRuntime;
    var chartTargets = buildChartValidationTargets(config);
    requestChartContainmentRenormalize('mapping-ui-validation-start');
    scheduleContainmentValidationBursts('mapping-ui-validation');
    if (!runtime || typeof runtime.waitForChartsStable !== 'function') {
      var timer = setTimeout(function () {
        var status = inspectChartStatus(config);
        evaluatePendingMapping(config, token, {
          state: status && status.valid ? 'stabilized' : 'invalid',
          valid: !!(status && status.valid),
          stabilized: !!(status && status.valid),
          statuses: status ? [status] : []
        });
      }, 1200);
      state.pendingValidationTimers.push(timer);
      return;
    }

    runtime.waitForChartsStable(chartTargets, {
      timeoutMs: 26000,
      pollMs: 120,
      stablePasses: 2
    }).then(function (result) {
      evaluatePendingMapping(config, token, result);
    });
  }

  // Safety net for a chart TYPE switch. The per-dimension pending-mapping flow
  // above never covered it, so a chart that came out geometrically invalid just
  // stayed broken on screen while the panel said "Chart changed to X". Reverts
  // ONLY on genuinely invalid geometry — a slow chart is not a failure, so
  // timeouts are left alone (unlike the per-dimension flow, which is reverting a
  // single field the user can retry).
  function scheduleChartSwitchValidation(config, chartId, previousChartId) {
    var runtime = root.CodeXRAnalysisTableRuntime;
    if (!runtime || typeof runtime.waitForChartsStable !== 'function' || !previousChartId || previousChartId === chartId) {
      return;
    }
    state.chartSwitchToken = (state.chartSwitchToken || 0) + 1;
    var token = state.chartSwitchToken;
    runtime.waitForChartsStable(buildChartValidationTargets(config), {
      timeoutMs: 26000,
      pollMs: 120,
      stablePasses: 2
    }).then(function (result) {
      // A newer switch (or a mode change) supersedes this check.
      if (token !== state.chartSwitchToken || getActiveChartId(getConfig()) !== chartId) {
        return;
      }
      if (!result || result.state !== 'invalid') {
        return;
      }
      var invalidStatus = (result.statuses || []).find(function (status) {
        return status && status.valid === false && status.ready === true;
      });
      resizeTrace('chart-switch-reverted-invalid', {
        chartId: chartId,
        previousChartId: previousChartId,
        reason: invalidStatus?.reason || 'invalid-chart-state'
      });
      if (selectChart(previousChartId)) {
        setStatusMessage(
          (invalidStatus?.message || 'That chart produced invalid geometry.')
            + ' CodeXR restored the previous chart.',
          'error',
          4800
        );
      }
    });
  }

  // Re-fit ladder for the seconds after a mapping/chart change, while Babia is
  // still building geometry. It stops as soon as every chart reports a settled,
  // valid fit: the full 18 s ladder kept re-measuring an already stable scene,
  // and each rung landed inside the previous rung's 650 ms transition.
  function scheduleContainmentValidationBursts(reason) {
    var analysisTableRuntime = root.CodeXRAnalysisTableRuntime;
    if (!analysisTableRuntime || typeof analysisTableRuntime.renormalizeAll !== 'function') {
      return;
    }
    if (state.containmentBurstChain) {
      state.containmentBurstChain.cancelled = true;
    }
    var chain = { cancelled: false };
    state.containmentBurstChain = chain;
    [650, 1300, 2200, 3600, 5200, 7600, 10500, 14000, 18000].forEach(function (delayMs, index) {
      var timer = setTimeout(function () {
        if (chain.cancelled) {
          return;
        }
        analysisTableRuntime.renormalizeAll((reason || 'mapping-ui-validation') + '-burst-' + (index + 1));
        var diagnostic = analysisTableRuntime.getActiveContainmentDiagnostics?.();
        var settled = !!diagnostic
          && diagnostic.level === 'ok'
          && (diagnostic.statuses || []).length > 0
          && (diagnostic.statuses || []).every(function (status) {
            return status && status.ready === true && status.valid !== false;
          });
        if (settled) {
          chain.cancelled = true;
        }
      }, delayMs);
      state.pendingValidationTimers.push(timer);
    });
  }

  function resizeTrace(label, payload) {
    if (payload !== undefined) {
      console.log('[Re-size] ' + label, payload);
      return;
    }
    console.log('[Re-size] ' + label);
  }

  // One re-fit request, on the next frame. Waiting for Babia to finish building
  // the geometry is the containment component's job (markWaitingGeometry +
  // scheduleRetry + its stabilization loop); the extra 300 ms "settled" pass
  // this used to schedule was a second, competing retry mechanism whose only
  // visible effect was a late re-fit — the flash after the scene was already
  // correct.
  function requestChartContainmentRenormalize(reason) {
    var analysisTableRuntime = root.CodeXRAnalysisTableRuntime;
    if (!analysisTableRuntime || typeof analysisTableRuntime.renormalizeAll !== 'function') {
      return;
    }

    var nextFrame = root.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
    nextFrame(function () {
      analysisTableRuntime.renormalizeAll(reason || 'mapping-ui-change');
    });
  }

// == xrChartMappingUiRuntime.js | dimensionAndViews (assembled per manifest.json; see COMPONENTS.md) ==
  function applyDimensionSelection(config, dimensionId, fieldName, options) {
    if (state.mappingControlsLocked && !(options && options.forceWhenLocked === true)) {
      setStatusMessage('Playback running - pause to change chart or axes.', 'info', 0);
      return false;
    }
    var chartEntities = getChartEntities(config);
    var componentName = getChartComponentName(config);
    var alreadySelected = state.selectedByDimension[dimensionId] === fieldName;
    var forceSelection = !!(options && options.force === true);
    var invalidOptionReason = getInvalidOptionReason(dimensionId, fieldName);

    if (!chartEntities.length || !componentName) {
      return false;
    }

    if (alreadySelected && !forceSelection) {
      return false;
    }

    if (invalidOptionReason && !forceSelection) {
      setStatusMessage(invalidOptionReason, 'error', 3600);
      resizeTrace('mapping-selection-blocked', {
        chartId: config && config.chartId,
        dimensionId: dimensionId,
        fieldName: fieldName,
        reason: invalidOptionReason,
        phase: 'disabled-option'
      });
      return false;
    }

    var previousMapping = cloneMapping(state.selectedByDimension);
    var nextMapping = cloneMapping(previousMapping);
    nextMapping[dimensionId] = fieldName;
    var delegatedEntityApply = state.activeMappingContextId === 'project-evolution';

    if (!delegatedEntityApply) {
      applyMappingToCharts(chartEntities, componentName, nextMapping);
    }

    state.selectedByDimension = cloneMapping(nextMapping);
    clearStatusTimer();

    if (delegatedEntityApply) {
      clearPendingValidationTimers();
      clearInvalidOption(dimensionId, fieldName);
      state.lastKnownGoodMapping = cloneMapping(nextMapping);
      state.pendingMapping = null;
      saveActiveMappingProfile();
      publishSharedMappingState(config);
      notifyMappingConfirmed(state.lastKnownGoodMapping);
    } else if (!options || options.trackPending !== false) {
      clearPendingValidationTimers();
      state.pendingMappingToken += 1;
      state.pendingMapping = {
        token: state.pendingMappingToken,
        dimensionId: dimensionId,
        fieldName: fieldName,
        previousMapping: previousMapping,
        nextMapping: nextMapping
      };
      schedulePendingMappingValidation(config, state.pendingMappingToken);
    } else {
      clearInvalidOption(dimensionId, fieldName);
      state.lastKnownGoodMapping = cloneMapping(nextMapping);
      saveActiveMappingProfile();
      state.pendingMapping = null;
    }

    if (!delegatedEntityApply && (!options || options.renormalize !== false)) {
      requestChartContainmentRenormalize('mapping-ui-change');
    }

    return true;
  }

  function syncToggleLabel(config) {
    if (!refs.toggle) {
      return;
    }
    refs.toggle.setAttribute('material', {
      color: state.visible ? '#f3b108' : '#16a34a',
      opacity: 0.98,
      shader: 'flat',
      transparent: true
    });
    refs.toggle.setAttribute('text', {
      value: state.visible ? '-' : '+',
      align: 'center',
      color: '#ffffff',
      width: 1,
      baseline: 'center',
      anchor: 'center'
    });
  }

  function setVisible(config, visible) {
    state.visible = !!visible;
    if (refs.panelContent) {
      refs.panelContent.setAttribute('visible', state.visible);
    }
    syncPanelInteractions();
    syncToggleLabel(config);
  }

  function setEntityInteractionEnabled(entity, enabled) {
    if (!entity) {
      return;
    }
    var controls = [entity].concat(
      entity.querySelectorAll
        ? Array.prototype.slice.call(entity.querySelectorAll('[data-codexr-interactive="true"]'))
        : []
    );
    controls.forEach(function (control) {
      if (!control || !control.classList) {
        return;
      }
      if (enabled) {
        control.classList.add('babiaxraycasterclass');
      } else {
        control.classList.remove('babiaxraycasterclass');
      }
    });
  }

  function syncPanelViewInteraction(viewId) {
    var view = state.panelViews[viewId];
    if (!view || !view.content) {
      return;
    }
    setEntityInteractionEnabled(view.content, state.visible && state.activePanelView === viewId);
  }

  function syncPanelInteractions() {
    if (refs.rowsRoot) {
      setEntityInteractionEnabled(refs.rowsRoot, state.visible && state.activePanelView === 'mapping');
    }
    if (refs.chartRoot) {
      setEntityInteractionEnabled(refs.chartRoot, state.visible && state.activePanelView === 'mapping');
    }
    var activeCompanion = getActiveMappingCompanion();
    Object.keys(state.mappingCompanions).forEach(function (contextId) {
      var companion = state.mappingCompanions[contextId];
      setEntityInteractionEnabled(
        companion.content,
        state.visible && state.activePanelView === 'mapping' && companion === activeCompanion
      );
    });
    Object.keys(state.panelViews).forEach(syncPanelViewInteraction);
  }

  // ── Mapping companions ────────────────────────────────────────────────────
  // A companion is a per-mapping-context child section of the Field Mapping
  // view: extra content (and optionally a child title) shown under the mapping
  // rows only while its context is active. Registered once, toggled by
  // context/view switches — never rebuilt.

  function getActiveMappingCompanion() {
    return state.mappingCompanions[state.activeMappingContextId] || null;
  }

  // Panel layout constants shared by the side-companion geometry. The base
  // background (6.2 wide, centred at x=0) spans -3.1..3.1; a 'side' companion
  // widens the panel and re-centres the whole block on the mount axis, so the
  // left mapping column and the right companion straddle the centre evenly
  // (the widened panel stays aligned with the table axis, not shifted right).
  var BASE_PANEL_WIDTH = 6.2;
  var BASE_RIGHT_EDGE = BASE_PANEL_WIDTH / 2;
  var COMPANION_SIDE_GAP = 0.12;

  function registerMappingCompanion(contextId, options) {
    var id = String(contextId || '');
    if (!id || !options?.content || !refs.panelContent) {
      return null;
    }
    var companion = {
      content: options.content,
      placement: options?.placement === 'side' ? 'side' : 'bottom',
      // 'side' → width of the right column; 'bottom' → extra panel height.
      width: Math.max(1.5, Number(options.width) || 3),
      height: Math.max(0.4, Number(options.height) || 0.9),
      // Optional: called with the available column height when the panel is
      // (re)laid out, so a 'side' companion can fill its lateral space.
      layout: typeof options.layout === 'function' ? options.layout : null,
      title: options.title || null
    };
    setCompanionContentVisible(companion.content, false);
    refs.panelContent.appendChild(companion.content);
    state.mappingCompanions[id] = companion;
    syncMappingCompanion();
    return function () {
      if (state.mappingCompanions[id] === companion) {
        companion.content?.remove();
        delete state.mappingCompanions[id];
        syncMappingCompanion();
      }
    };
  }

  // Title of the mapping view: the active context's companion names it (child
  // view), otherwise the generic one. Single source so the header is written
  // once per update instead of generic-then-overwritten.
  function getMappingPanelTitle() {
    return getActiveMappingCompanion()?.title || 'CodeXR Field Mapping';
  }

  // Companion visibility owner. Sets BOTH the attribute and object3D.visible:
  // A-Frame 1.7.1 caches the `visible` attribute on reused entities, and a
  // cached no-op left another analysis' companion painted over the mapping rows.
  function setCompanionContentVisible(content, visible) {
    if (!content) { return; }
    content.setAttribute('visible', !!visible);
    if (content.object3D) {
      content.object3D.visible = !!visible;
    }
  }

  // Re-syncs companion visibility/title/height for the current context. Runs
  // on context switches and whenever the mapping view is (re)shown.
  function syncMappingCompanion() {
    if (state.activePanelView !== 'mapping') {
      return;
    }
    var active = getActiveMappingCompanion();
    Object.keys(state.mappingCompanions).forEach(function (contextId) {
      var companion = state.mappingCompanions[contextId];
      var isActive = companion === active;
      setCompanionContentVisible(companion.content, isActive);
      setEntityInteractionEnabled(companion.content, isActive && state.visible);
    });
    if (refs.panelTitle) {
      refs.panelTitle.setAttribute('value', getMappingPanelTitle());
    }
    // A bottom companion grows the panel height; a side companion keeps the
    // height and widens it (handled inside applyPanelHeight).
    applyPanelHeight(state.mappingPanelHeight + (active && active.placement === 'bottom' ? active.height : 0));
  }

  function applyPanelHeight(panelHeight) {
    var height = Math.max(2.45, Number(panelHeight) || 2.45);
    var companion = state.activePanelView === 'mapping' ? getActiveMappingCompanion() : null;
    var sideCompanion = companion && companion.placement === 'side' ? companion : null;
    // A side companion widens the panel by sideWidth. Rather than growing to the
    // right only (which pushes the centre off the mount axis), the whole block
    // is re-centred: the background sits at x=0 and every element is shifted left
    // by centreShift so the left column and the right companion straddle the
    // mount evenly — the widened panel stays aligned with the table axis.
    var sideWidth = sideCompanion ? sideCompanion.width + COMPANION_SIDE_GAP : 0;
    var centreShift = sideWidth / 2;
    var rightEdge = BASE_RIGHT_EDGE + sideWidth;

    if (companion) {
      companion.content.setAttribute(
        'position',
        sideCompanion
          // Right column: anchored top, under the title, flush with the right edge.
          ? (BASE_RIGHT_EDGE + COMPANION_SIDE_GAP + sideCompanion.width * 0.5 - centreShift) + ' ' + (height * 0.5 - 0.12) + ' 0.03'
          // Bottom strip: above the status line.
          : '0 ' + (-(height * 0.5) + companion.height * 0.5 + 0.5) + ' 0.03'
      );
      // Let a side companion fill the available column height.
      if (sideCompanion && typeof sideCompanion.layout === 'function') {
        sideCompanion.layout(height);
      }
    }
    if (refs.panelBackground) {
      refs.panelBackground.setAttribute('width', BASE_PANEL_WIDTH + sideWidth);
      refs.panelBackground.setAttribute('height', height);
      refs.panelBackground.setAttribute('position', '0 0 0');
    }
    if (refs.panelBorder) {
      refs.panelBorder.setAttribute('width', BASE_PANEL_WIDTH + 0.05 + sideWidth);
      refs.panelBorder.setAttribute('height', height + 0.05);
      refs.panelBorder.setAttribute('position', '0 0 -0.01');
    }
    if (refs.panelTitleBackdrop) {
      refs.panelTitleBackdrop.setAttribute('position', '0 ' + (height * 0.5 + 0.23) + ' 0.02');
    }
    if (refs.panelTitle) {
      refs.panelTitle.setAttribute('position', '0 ' + (height * 0.5 + 0.23) + ' 0.03');
    }
    if (refs.rowsRoot) {
      refs.rowsRoot.setAttribute('position', (-0.05 - centreShift) + ' ' + (height * 0.45 - PANEL_LAYOUT.rowsRootHeightOffset) + ' 0.02');
    }
    if (refs.chartRoot) {
      refs.chartRoot.setAttribute('position', (-0.05 - centreShift) + ' ' + (height * 0.45 - PANEL_LAYOUT.chartRootHeightOffset) + ' 0.03');
    }
    if (refs.statusText) {
      refs.statusText.setAttribute('position', (-2.85 - centreShift) + ' ' + (-height * 0.5 + 0.36) + ' 0.03');
    }
    if (refs.toggle) {
      // Follows the (possibly widened) right edge of the re-centred panel.
      refs.toggle.setAttribute('position', (rightEdge - centreShift - 0.15) + ' ' + (height * 0.5 + 0.17) + ' 0.04');
    }
    // Header buttons are laid out from the right, each against the previous
    // one: they no longer share a width, so a fixed pitch would either overlap
    // the +/- toggle or leave a hole.
    var headerCursor = rightEdge - centreShift - 0.32 - HEADER_BUTTON_GAP;
    Object.keys(state.panelViews).map(function (viewId) {
      return state.panelViews[viewId];
    }).filter(function (view) {
      return !!view.button;
    }).forEach(function (view) {
      var width = view.buttonWidth || HEADER_BUTTON_MIN_WIDTH;
      view.button?.setAttribute(
        'position',
        (headerCursor - (width * 0.5)) + ' ' + (height * 0.5 + 0.17) + ' 0.04'
      );
      headerCursor -= width + HEADER_BUTTON_GAP;
    });
  }

  function syncPanelViewButtons() {
    Object.keys(state.panelViews).forEach(function (viewId) {
      var view = state.panelViews[viewId];
      var active = state.activePanelView === viewId;
      var width = view.buttonWidth || HEADER_BUTTON_MIN_WIDTH;
      view.button?.setAttribute('material', {
        // A declared colour is the view saying what the button MEANS (the
        // analysis selector paints it with the colour of the analysis you are
        // in); without one, the button just reports whether its view is open.
        color: view.buttonColor || (active ? '#be123c' : '#0e7490'),
        opacity: 0.98,
        shader: 'flat',
        transparent: true
      });
      view.button?.setAttribute('text', {
        value: view.buttonLabel,
        align: 'center',
        color: '#ffffff',
        width: width * HEADER_BUTTON_TEXT_RATIO,
        baseline: 'center',
        anchor: 'center'
      });
    });
  }

  function setPanelViewButtonColor(viewId, color) {
    var view = state.panelViews[viewId];
    if (!view) {
      return false;
    }
    view.buttonColor = color ? String(color) : '';
    syncPanelViewButtons();
    return true;
  }

  function showPanelView(viewId) {
    var targetView = viewId && viewId !== 'mapping' ? state.panelViews[viewId] : null;
    var nextViewId = targetView ? viewId : 'mapping';
    if (CONTROLLER_VIEW_BY_PANEL[nextViewId]) {
      state.activeControllerView = CONTROLLER_VIEW_BY_PANEL[nextViewId];
    }
    root.console?.log?.('[CodeXR.Debug]: Mapping panel view requested', {
      requested: viewId || 'mapping',
      resolved: nextViewId,
      previous: state.activePanelView
    });
    var previousView = state.panelViews[state.activePanelView];
    if (previousView && previousView.id !== nextViewId) {
      previousView.content.setAttribute('visible', false);
      previousView.onHide?.();
    }

    state.activePanelView = nextViewId;
    if (refs.rowsRoot) {
      refs.rowsRoot.setAttribute('visible', nextViewId === 'mapping');
    }
    if (refs.chartRoot) {
      refs.chartRoot.setAttribute('visible', nextViewId === 'mapping');
    }
    // updateStatusText owns the status visibility (mapping view only, attr +
    // object3D); re-running it here applies the view switch just stored above.
    updateStatusText();

    if (nextViewId === 'mapping') {
      if (refs.panelTitle) {
        // Resolved once: writing the generic title here and letting
        // syncMappingCompanion overwrite it made the header flicker.
        refs.panelTitle.setAttribute('value', getMappingPanelTitle());
      }
      Object.keys(state.panelViews).forEach(function (registeredViewId) {
        state.panelViews[registeredViewId].content.setAttribute('visible', false);
      });
      applyPanelHeight(state.mappingPanelHeight);
      // Child version of the mapping view: the active context's companion
      // (title + extra section) overlays the defaults set just above.
      syncMappingCompanion();
    } else {
      Object.keys(state.mappingCompanions).forEach(function (contextId) {
        setCompanionContentVisible(state.mappingCompanions[contextId].content, false);
        setEntityInteractionEnabled(state.mappingCompanions[contextId].content, false);
      });
      targetView.content.setAttribute('visible', true);
      if (refs.panelTitle) {
        refs.panelTitle.setAttribute('value', targetView.title);
      }
      applyPanelHeight(targetView.panelHeight);
      targetView.onShow?.();
    }

    syncPanelInteractions();
    setVisible(getConfig() || {}, true);
    syncPanelViewButtons();
    return nextViewId;
  }

  function normalizeControllerView(viewId) {
    var requested = String(viewId || 'single.mapping');
    return CONTROLLER_PANEL_BY_VIEW[requested] ? requested : 'single.mapping';
  }

  function inferModeFromControllerView(viewId) {
    if (viewId === 'visualization-menu') {
      return 'selection';
    }
    if (viewId.indexOf('dependency.') === 0) {
      return 'dependency-graph';
    }
    if (viewId.indexOf('historical.') === 0) {
      return 'historical-compare';
    }
    if (viewId.indexOf('project-evolution') === 0) {
      return 'project-evolution';
    }
    return 'single';
  }

  function showControllerView(viewId, context) {
    var nextViewId = normalizeControllerView(viewId);
    var nextMode = String(context.mode || inferModeFromControllerView(nextViewId));
    var panelId = CONTROLLER_PANEL_BY_VIEW[nextViewId] || 'mapping';
    state.activeControllerView = nextViewId;
    state.mode = nextMode;
    if (context.mappingContextId) {
      // Idempotent inside: re-applying the active context would rebuild every
      // panel row.
      switchMappingContext(context.mappingContextId, {
        reason: context.reason || ('controller-view-' + nextViewId)
      });
    }
    var resolvedPanel = showPanelView(panelId);
    // showPanelView maps the panel back to its own default controller view
    // (several controller views share one panel, e.g. historical.mapping and
    // single.mapping both use 'mapping'), so re-assert the caller's view.
    state.activeControllerView = nextViewId;
    state.mode = nextMode;
    return {
      mode: state.mode,
      controllerView: nextViewId,
      panelView: resolvedPanel
    };
  }


// == xrChartMappingUiRuntime.js | panelUi (assembled per manifest.json; see COMPONENTS.md) ==
  /**
   * Run `callback` as soon as the controller panel exists — immediately when
   * it is already built, otherwise queued until buildUi() completes. This is
   * the supported way for feature runtimes to time their registerPanelView
   * call: polling with capped retries silently loses views on slow scenes.
   */
  function whenPanelReady(callback) {
    if (typeof callback !== 'function') {
      return false;
    }
    if (refs.panel && refs.panelContent) {
      callback();
      return true;
    }
    PANEL_READY_CALLBACKS.push(callback);
    return true;
  }

  function flushPanelReadyCallbacks() {
    while (PANEL_READY_CALLBACKS.length) {
      var callback = PANEL_READY_CALLBACKS.shift();
      try {
        callback();
      } catch (error) {
        console.warn('[CodeXR][MappingUI] panel-ready callback failed:', error);
      }
    }
  }

  function registerPanelView(options) {
    if (!refs.panel || !refs.panelContent) {
      return null;
    }
    if (!options || !options.id || !options.content) {
      return function () {};
    }
    var viewId = String(options.id);
    var existing = state.panelViews[viewId];
    if (existing) {
      state.panelViewObservers[viewId]?.disconnect?.();
      delete state.panelViewObservers[viewId];
      existing.button?.remove();
      existing.content?.remove();
    }

    var content = options.content;
    content.setAttribute('visible', false);
    setEntityInteractionEnabled(content, false);
    refs.panelContent.appendChild(content);
    var observer = null;
    if (typeof root.MutationObserver === 'function') {
      observer = new root.MutationObserver(function () {
        syncPanelViewInteraction(viewId);
      });
      observer.observe(content, { childList: true, subtree: true });
      state.panelViewObservers[viewId] = observer;
    }
    // A header button used to be a single uppercase letter on a square plate,
    // which said nothing about where it led. A view can now ask for a wider
    // plate and carry a real word; the square stays the default so nothing
    // else has to change.
    var buttonWidth = Math.max(HEADER_BUTTON_MIN_WIDTH, Number(options.buttonWidth) || HEADER_BUTTON_MIN_WIDTH);
    var button = null;
    if (options.headerButton === true) {
      button = createEntity('a-plane', {
        id: 'codexrMappingUiView-' + viewId,
        class: 'babiaxraycasterclass codexr-mapping-ui-view-toggle',
        'data-codexr-interactive': 'true',
        width: buttonWidth,
        height: HEADER_BUTTON_HEIGHT
      });
      refs.panel.appendChild(button);
    }

    state.panelViews[viewId] = {
      id: viewId,
      title: String(options.title || viewId),
      buttonLabel: String(options.buttonLabel || options.title || viewId).slice(0, HEADER_BUTTON_MAX_LABEL),
      buttonWidth: buttonWidth,
      // Declared colour wins over the active/idle default, so a view can make
      // its button mean something (the analysis selector paints it with the
      // colour of the analysis you are in).
      buttonColor: options.buttonColor ? String(options.buttonColor) : '',
      panelHeight: Math.max(2.45, Number(options.panelHeight) || 2.45),
      content: content,
      button: button,
      onShow: typeof options.onShow === 'function' ? options.onShow : null,
      onHide: typeof options.onHide === 'function' ? options.onHide : null,
      onToggleActive: typeof options.onToggleActive === 'function'
        ? options.onToggleActive
        : null
    };
    button?.addEventListener('click', function () {
      root.console?.log?.('[CodeXR.Debug]: Mapping panel header button clicked', {
        viewId: viewId,
        activePanelView: state.activePanelView
      });
      if (state.activePanelView === viewId && state.panelViews[viewId]?.onToggleActive) {
        state.panelViews[viewId].onToggleActive();
        return;
      }
      showPanelView(viewId);
    });
    applyPanelHeight(state.activePanelView === 'mapping'
      ? state.mappingPanelHeight
      : state.panelViews[state.activePanelView]?.panelHeight);
    syncPanelViewButtons();

    return function () {
      var view = state.panelViews[viewId];
      if (!view) {
        return;
      }
      if (state.activePanelView === viewId) {
        showPanelView('mapping');
      }
      state.panelViewObservers[viewId]?.disconnect?.();
      delete state.panelViewObservers[viewId];
      view.button?.remove();
      view.content?.remove();
      delete state.panelViews[viewId];
      applyPanelHeight(state.mappingPanelHeight);
    };
  }

  function setPanelViewTitle(viewId, title) {
    var view = state.panelViews[String(viewId || '')];
    if (!view) {
      return false;
    }
    view.title = String(title || view.title);
    if (state.activePanelView === view.id && refs.panelTitle) {
      refs.panelTitle.setAttribute('value', view.title);
    }
    return true;
  }

  function setPanelViewHeight(viewId, panelHeight) {
    var view = state.panelViews[String(viewId || '')];
    if (!view) {
      return false;
    }
    view.panelHeight = Math.max(2.45, Number(panelHeight) || view.panelHeight);
    if (state.activePanelView === view.id) {
      applyPanelHeight(view.panelHeight);
    }
    return true;
  }

  function renderRows(config) {
    if (!refs.rowsRoot) {
      return;
    }

    clearEntity(refs.rowsRoot);

    var dimensions = Array.isArray(config.dimensions) ? config.dimensions : [];
    var cursorY = 0;

    dimensions.forEach(function (dimension) {
      if (!dimension || dimension.hidden) {
        return;
      }

      var fields = Array.isArray(dimension.fields) ? dimension.fields : [];
      if (fields.length === 0) {
        return;
      }

      var label = createEntity('a-text', {
        value: (dimension.label || dimension.id) + (dimension.dataType === 'numeric' ? ' [N]' : ''),
        align: 'left',
        color: '#cde7ff',
        width: PANEL_LAYOUT.labelWidth,
        position: PANEL_LAYOUT.left + ' ' + (cursorY - 0.05) + ' 0.02'
      });
      refs.rowsRoot.appendChild(label);
      cursorY -= PANEL_LAYOUT.labelToButtonsGap;

      var cols = pickColumns(fields.length);
      var buttonWidth = getGridButtonWidth(cols);

      fields.forEach(function (fieldName, fieldIndex) {
        var rowIndex = Math.floor(fieldIndex / cols);
        var colIndex = fieldIndex % cols;
        var isActive = state.selectedByDimension[dimension.id] === fieldName;
        var invalidReason = getInvalidOptionReason(dimension.id, fieldName);
        var isDisabled = !!invalidReason && !isActive;

        var x = getGridButtonX(colIndex, buttonWidth);
        var y = cursorY - rowIndex * PANEL_LAYOUT.rowGap;

        var button = createEntity('a-plane', {
          class: 'babiaxraycasterclass codexr-mapping-ui-option',
          'data-codexr-interactive': 'true',
          color: isActive ? '#be123c' : (isDisabled ? '#334155' : '#1e3a5f'),
          width: buttonWidth,
          height: 0.22,
          opacity: isActive ? 0.98 : (isDisabled ? 0.55 : 0.92),
          position: x + ' ' + y + ' 0.01'
        });

        var text = createEntity('a-text', {
          value: compactLabel(fieldName),
          align: 'center',
          color: isDisabled ? '#cbd5e1' : '#ffffff',
          width: buttonWidth * 1.9,
          position: '0 0 0.01'
        });

        button.appendChild(text);
        button.addEventListener('click', function () {
          if (isDisabled) {
            setStatusMessage(invalidReason, 'error', 4000);
            return;
          }
          var changed = applyDimensionSelection(config, dimension.id, fieldName);
          if (changed) {
            renderRows(config);
          }
        });

        refs.rowsRoot.appendChild(button);
      });

      cursorY -= Math.ceil(fields.length / cols) * PANEL_LAYOUT.rowGap + PANEL_LAYOUT.sectionGap;
    });

    var panelHeight = Math.max(2.9, Math.abs(cursorY) + PANEL_LAYOUT.panelHeightPadding);
    state.mappingPanelHeight = panelHeight;
    if (state.activePanelView === 'mapping') {
      applyPanelHeight(panelHeight);
    }
    if (refs.statusText) {
      updateStatusText();
    }
  }

  function renderChartSelector(config) {
    if (!refs.chartRoot) {
      return;
    }
    clearEntity(refs.chartRoot);
    var charts = Array.isArray(config && config.availableCharts) ? config.availableCharts : [];
    if (!charts.length) {
      return;
    }
    refs.chartRoot.appendChild(createEntity('a-text', {
      value: 'Chart',
      align: 'left',
      color: '#cde7ff',
      width: PANEL_LAYOUT.labelWidth,
      position: PANEL_LAYOUT.left + ' 0.02 0.02'
    }));
    var visibleCharts = charts.slice(0, 9);
    var cols = Math.min(3, Math.max(1, visibleCharts.length));
    var buttonWidth = getGridButtonWidth(cols);
    visibleCharts.forEach(function (chart, index) {
      var rowIndex = Math.floor(index / cols);
      var colIndex = index % cols;
      var active = chart.id === getActiveChartId(config);
      var x = getGridButtonX(colIndex, buttonWidth);
      var y = -PANEL_LAYOUT.labelToButtonsGap - rowIndex * PANEL_LAYOUT.rowGap;
      var button = createEntity('a-plane', {
        class: 'babiaxraycasterclass codexr-mapping-ui-chart-option',
        'data-codexr-interactive': 'true',
        'data-codexr-chart-id': chart.id,
        color: active ? '#be123c' : '#0f3a5f',
        width: buttonWidth,
        height: 0.22,
        opacity: active ? 0.98 : 0.9,
        position: x + ' ' + y + ' 0.01'
      });
      button.appendChild(createEntity('a-text', {
        value: compactLabel(chart.name || chart.id),
        align: 'center',
        color: '#ffffff',
        width: buttonWidth * 1.8,
        position: '0 0 0.01'
      }));
      button.addEventListener('click', function () {
        selectChart(chart.id);
      });
      refs.chartRoot.appendChild(button);
    });
  }

  // `options.applyToEntities: false` switches the SELECTOR only (profile,
  // dimensions, rows) without converting any chart entity: modes whose chart
  // pipeline owns its own entities (project evolution) route the panel here
  // while the resolved entity ids may still point at ANOTHER mode's parked
  // chart — a full switch converted the normal analysis' chart in place.
  function selectChart(chartId, options) {
    if (state.mappingControlsLocked && !(options && options.forceWhenLocked === true)) {
      setStatusMessage('Playback running - pause to change chart or axes.', 'info', 0);
      return false;
    }
    var requestedEntityApply = !options || options.applyToEntities !== false;
    // Project Evolution owns the identity of its chart. The selector updates
    // its profile and emits the normal confirmation event; the mode runtime
    // then replaces exactly one chart node without temporarily converting the
    // old one in place.
    var delegatedEntityApply = requestedEntityApply
      && state.activeMappingContextId === 'project-evolution';
    var applyToEntities = requestedEntityApply && !delegatedEntityApply;
    var config = getConfig();
    if (!config || !chartId || chartId === getActiveChartId(config)) {
      return false;
    }
    var chart = (config.availableCharts || []).find(function (candidate) {
      return candidate && candidate.id === chartId;
    });
    if (!chart || !COMPONENT_BY_CHART[chartId]) {
      setStatusMessage('This chart is not available in the current XR scene.', 'error', 4200);
      return false;
    }

    saveActiveMappingProfile();
    var previousChartId = getActiveChartId(config);
    var previousDimensions = config.dimensions;
    var nextDimensions = getDimensionsForChart(config, chartId);
    var profileKey = getMappingProfileKey(state.activeMappingContextId, chartId);
    var nextSnapshot = state.mappingProfiles[profileKey] || {
      visible: state.visible,
      selectedByDimension: getDefaultMappingForChart(config, chartId),
      lastKnownGoodMapping: getDefaultMappingForChart(config, chartId),
      invalidOptionsByDimension: {}
    };

    if (!nextDimensions.length) {
      setStatusMessage('This chart has no compatible fields for the current analysis data.', 'error', 4200);
      return false;
    }

    if (applyToEntities && !applyChartTypeToEntities(config, chartId, nextSnapshot.lastKnownGoodMapping || nextSnapshot.selectedByDimension)) {
      config.dimensions = previousDimensions;
      state.activeChartId = previousChartId;
      setStatusMessage('CodeXR could not switch chart; the previous chart was kept.', 'error', 4800);
      return false;
    }

    state.activeChartId = chartId;
    config.chartId = chartId;
    config.dimensions = nextDimensions;
    applyMappingRuntimeState(config, nextSnapshot, 'mapping-ui-chart-switch-' + chartId, { applyToEntities: applyToEntities });
    renderChartSelector(config);
    renderRows(config);
    if (requestedEntityApply) {
      if (applyToEntities) {
        requestChartContainmentRenormalize('mapping-ui-chart-switch');
        scheduleContainmentValidationBursts('mapping-ui-chart-switch');
      }
      setStatusMessage('Chart changed to ' + (chart.name || chartId) + '.', 'info', 2600);
      publishSharedMappingState(config);
      notifyMappingConfirmed(state.lastKnownGoodMapping);
      // Reverts by itself if the new chart turns out geometrically invalid,
      // instead of leaving a broken chart under a success message.
      if (applyToEntities) {
        scheduleChartSwitchValidation(config, chartId, previousChartId);
      }
    }
    return true;
  }

  function buildUi(config) {
    var scene = getDoc().querySelector(config.sceneSelector || '#scene');
    if (!scene) {
      return;
    }

    var existingPanel = getDoc().getElementById(config.panelId || 'codexrMappingUiPanel');
    var existingToggle = getDoc().getElementById(config.toggleId || 'codexrMappingUiToggle');
    if (existingPanel) {
      existingPanel.remove();
    }
    if (existingToggle) {
      existingToggle.remove();
    }

    refs.panel = createEntity('a-entity', {
      id: config.panelId || 'codexrMappingUiPanel',
      position: config.panelPosition || '8 2 -8',
      rotation: config.panelRotation || '0 -70 0',
      scale: (config.panelScale || 0.2) + ' ' + (config.panelScale || 0.2) + ' ' + (config.panelScale || 0.2),
      class: 'codexr-mapping-ui-panel',
      visible: true
    });

    if (config.hideOnEnterAr === true) {
      refs.panel.setAttribute('hide-on-enter-ar', '');
    } else {
      refs.panel.removeAttribute('hide-on-enter-ar');
    }

    refs.panelContent = createEntity('a-entity', {
      position: '0 0 0',
      visible: state.visible !== false
    });

    refs.panelBackground = createEntity('a-plane', {
      color: '#0A1628',
      opacity: 0.94,
      width: 6.2,
      height: 2.2,
      position: '0 0 0'
    });

    refs.panelBorder = createEntity('a-box', {
      color: '#22d3ee',
      opacity: 0.5,
      width: 6.25,
      height: 2.25,
      depth: 0.01,
      position: '0 0 -0.01'
    });

    refs.panelTitleBackdrop = createEntity('a-plane', {
      color: '#0b4f6c',
      opacity: 0.96,
      width: 2.7,
      height: 0.34,
      position: '0 1.32 0.02'
    });

    refs.panelTitle = createEntity('a-text', {
      value: 'CodeXR Field Mapping',
      align: 'center',
      color: '#eaf4ff',
      width: 7,
      position: '0 1.32 0.03'
    });

    refs.rowsRoot = createEntity('a-entity', {
      position: '-0.05 -0.18 0.02'
    });

    refs.chartRoot = createEntity('a-entity', {
      position: '-0.05 0.9 0.03'
    });

    refs.statusText = createEntity('a-text', {
      value: '',
      align: 'left',
      color: '#fde68a',
      width: 5.9,
      position: '-2.85 -0.86 0.03',
      visible: false,
      'wrap-count': 30,
      baseline: 'top'
    });

    refs.panelContent.appendChild(refs.panelBackground);
    refs.panelContent.appendChild(refs.panelBorder);
    refs.panelContent.appendChild(refs.panelTitleBackdrop);
    refs.panelContent.appendChild(refs.panelTitle);
    refs.panelContent.appendChild(refs.chartRoot);
    refs.panelContent.appendChild(refs.rowsRoot);
    refs.panelContent.appendChild(refs.statusText);
    refs.panel.appendChild(refs.panelContent);

    refs.toggle = createEntity('a-plane', {
      id: config.toggleId || 'codexrMappingUiToggle',
      class: 'babiaxraycasterclass codexr-mapping-ui-toggle',
      width: 0.34,
      height: 0.34,
      position: '2.95 1.26 0.04'
    });

    refs.toggle.addEventListener('click', function () {
      setVisible(config, !state.visible);
    });

    refs.panel.appendChild(refs.toggle);
    scene.appendChild(refs.panel);
    state.activeCornerId = null;
    syncToggleLabel(config);
    setVisible(config, state.visible);
    updateStatusText();
    renderChartSelector(config);
    renderRows(config);

    if (config.adaptiveCorner) {
      applyAdaptivePlacement(config);
      ensureAdaptivePlacementLoop();
    }

    // The panel is now usable: let every queued feature runtime register its
    // view (analysis selector, dependencies, historical, evolution, ...).
    flushPanelReadyCallbacks();
  }

// == xrChartMappingUiRuntime.js | stateAndBootstrap (assembled per manifest.json; see COMPONENTS.md) ==
  function hydrateStateFromConfig(config) {
    state.activeMappingContextId = state.activeMappingContextId || 'normal-analysis';
    state.activeChartId = state.activeChartId || (config && config.chartId) || null;
    var profileKey = getMappingProfileKey(state.activeMappingContextId, getActiveChartId(config));
    var snapshot = state.mappingProfiles[profileKey] || buildDefaultMappingSnapshot(config);
    applyMappingRuntimeState(config, snapshot, 'mapping-ui-hydrate');
  }

  function switchMappingContext(contextId, options) {
    var config = getConfig();
    if (!config) {
      return false;
    }
    var nextContextId = String(contextId || 'default');
    var applyToEntities = !options || options.applyToEntities !== false;
    // Idempotent: re-applying the profile already in force would run
    // applyMappingRuntimeState → renderRows, which clears and rebuilds every
    // panel row — the visible controller flash when an entry applies its state
    // more than once. Only the companion needs re-syncing (attribute-only).
    if (getMappingProfileKey(nextContextId, getActiveChartId(config)) === state.appliedMappingProfileKey) {
      state.activeMappingContextId = nextContextId;
      syncMappingCompanion();
      return getState();
    }
    saveActiveMappingProfile();
    state.activeMappingContextId = nextContextId;
    var profileKey = getMappingProfileKey(nextContextId, getActiveChartId(config));
    var profile = state.mappingProfiles[profileKey] || buildDefaultMappingSnapshot(config);
    applyMappingRuntimeState(config, profile,
      (options && options.reason) || ('mapping-ui-context-' + nextContextId),
      { applyToEntities: applyToEntities }
    );
    // The mapping view is context-sensitive: swap in the new context's
    // companion section (child title + content) if one is registered.
    syncMappingCompanion();
    return getState();
  }

  function getState() {
    return {
      visible: state.visible,
      mode: state.mode,
      controllerView: state.activeControllerView,
      mappingContextId: state.activeMappingContextId,
      chartId: getActiveChartId(getConfig()),
      selectedByDimension: Object.assign({}, state.selectedByDimension),
      lastKnownGoodMapping: Object.assign({}, state.lastKnownGoodMapping),
      invalidOptionsByDimension: cloneInvalidOptions(state.invalidOptionsByDimension || {})
    };
  }

  function restoreState(runtimeState, options) {
    var config = getConfig();
    if (!config || !runtimeState || typeof runtimeState !== 'object' || Array.isArray(runtimeState)) {
      console.warn('[CodeXR][MappingUI] Invalid state snapshot; restore skipped.');
      return false;
    }
    if (state.mappingControlsLocked && !(options && options.forceWhenLocked === true)) {
      setStatusMessage('Playback running - pause to change chart or axes.', 'info', 0);
      return false;
    }

    return applyMappingRuntimeState(
      config,
      runtimeState,
      'mapping-ui-restore',
      { applyToEntities: !options || options.applyToEntities !== false }
    );
  }

  var sceneLoadHookInstalled = false;

  function autoInit() {
    var config = getConfig();
    if (!config || state.initialized) {
      return;
    }

    // Never build panel entities into a scene that is still loading: entities
    // attached mid-load can wedge A-Frame's load pipeline (their components
    // never initialize and the scene never fires 'loaded'). Deterministic
    // ordering instead of timing luck.
    var scene = getScene();
    if (scene && scene.hasLoaded === false) {
      if (!sceneLoadHookInstalled) {
        sceneLoadHookInstalled = true;
        scene.addEventListener('loaded', function () {
          autoInit();
        }, { once: true });
      }
      return;
    }

    state.initialized = true;

    hydrateStateFromConfig(config);
    buildUi(config);
    registerSharedMappingEntity(config);
    // A generated scene's initial chart reads the raw source in its HTML:
    // if that chart is row-budgeted, re-point it at its top-N slice as soon
    // as the producers are live. Its rotation and chart-id attribute are
    // aligned with the presentation profile too — scenes generated by older
    // builds shipped pie/donut lying flat.
    syncActiveChartPresentation(config);
    scheduleChartDataSliceSync();
  }

  var runtime = {
    autoInit: autoInit,
    getState: getState,
    restoreState: restoreState,
    selectChart: selectChart,
    // The chart the XR scene was generated with, immune to later selector
    // switches — the mode machinery restores it when leaving project
    // evolution (the only mode that selects its own chart).
    getSceneChartId: function () {
      getConfig();
      return state.sceneChartId || null;
    },
    // Unsubscribes an entity's Babia chart components from their data producer
    // before it is dropped or rebuilt. Babia never does it, so a discarded
    // chart keeps repainting on every data push.
    releaseChartEntity: releaseChartEntity,
    switchMappingContext: switchMappingContext,
    showView: showControllerView,
    // Lets other runtimes surface a message on the controller's status line
    // (e.g. the mode machinery reporting why an analysis could not open).
    setStatusMessage: setStatusMessage,
    // Locks the chart/axis controls while an analysis cannot safely accept a
    // re-mapping (project evolution locks them while its movie is playing).
    // `reason` is shown so the panel explains why it is not responding.
    setMappingControlsEnabled: function (enabled, reason) {
      state.mappingControlsLocked = !enabled;
      setEntityInteractionEnabled(refs.rowsRoot, !!enabled);
      setEntityInteractionEnabled(refs.chartRoot, !!enabled);
      if (!enabled && reason) {
        setStatusMessage(String(reason), 'info', 0);
      } else if (enabled && state.statusLevel === 'info') {
        setStatusMessage('', 'info', 0);
      }
      return !state.mappingControlsLocked;
    },
    getControllerState: function () {
      return {
        mode: state.mode,
        controllerView: state.activeControllerView,
        panelView: state.activePanelView
      };
    },
    getMappingContext: function () {
      return state.activeMappingContextId;
    },
    refreshAdaptivePlacement: function () {
      var config = getConfig();
      if (!config || !config.adaptiveCorner) {
        return;
      }
      applyAdaptivePlacement(config);
      ensureAdaptivePlacementLoop();
    },
    setVisible: function (visible) {
      var config = getConfig();
      if (!config) {
        return;
      }
      setVisible(config, visible);
    },
    // Canonical chart construction (injected by the generator): the evolution
    // movie and the historical comparison read the boats base and the tree
    // field contract from here instead of keeping their own copies.
    getChartBaseConfig: getChartBaseConfig,
    // Canonical per-chart presentation (rotation, base attributes, row
    // budget) — injected by the generator with a runtime fallback mirror.
    getChartPresentation: getChartPresentation,
    // Canonical chart-data constructor for analysis runtimes that create
    // their own entities. This is production API, not a test-only escape hatch.
    buildRuntimeChartData: buildRuntimeChartData,
    // Declarative construction is the shared DOM contract for every runtime
    // that creates a Babia producer or chart after the initial HTML load.
    // Component values are complete A-Frame strings, so outerHTML remains as
    // readable and auditable as the generated Single analysis.
    buildDeclarativeTreeEntity: buildDeclarativeTreeEntity,
    buildDeclarativeChartEntity: buildDeclarativeChartEntity,
    configureDeclarativeChartEntity: configureDeclarativeChartEntity,
    serializeDeclarativeComponentData: serializeDeclarativeComponentData,
    setDeclarativeAttribute: setDeclarativeAttribute,
    registerPanelView: registerPanelView,
    registerMappingCompanion: registerMappingCompanion,
    showPanelView: showPanelView,
    setPanelViewTitle: setPanelViewTitle,
    setPanelViewHeight: setPanelViewHeight,
    // Lets a view keep its header button meaningful — the analysis selector
    // repaints it with the colour of the analysis currently on the table.
    setPanelViewButtonColor: setPanelViewButtonColor,
    getActivePanelView: function () {
      return state.activePanelView;
    },
    isPanelReady: function () {
      return !!(refs.panel && refs.panelContent);
    },
    whenPanelReady: whenPanelReady,
    setChartEntityIds: function (chartEntityIds, options) {
      state.chartEntityIdsOverride = Array.isArray(chartEntityIds)
        ? chartEntityIds.filter(Boolean).map(String)
        : null;
      if (!options || options.renormalize !== false) {
        requestChartContainmentRenormalize('mapping-ui-targets-changed');
      }
      return state.chartEntityIdsOverride ? state.chartEntityIdsOverride.slice() : [];
    },
    __testing: {
      getInvalidOptionReason: getInvalidOptionReason,
      buildChartComponentUpdate: buildChartComponentUpdate,
      buildRuntimeChartData: buildRuntimeChartData,
      buildDeclarativeTreeEntity: buildDeclarativeTreeEntity,
      buildDeclarativeChartEntity: buildDeclarativeChartEntity,
      configureDeclarativeChartEntity: configureDeclarativeChartEntity,
      serializeDeclarativeComponentData: serializeDeclarativeComponentData,
      setDeclarativeAttribute: setDeclarativeAttribute,
      // Applying a mapping must also RECONCILE an entity still wearing a
      // previous chart type — the path that used to leave a pie's rotation on
      // a boats — so it is exercised directly.
      applyMappingToCharts: applyMappingToCharts,
      setActiveChartIdForTests: function (chartId) {
        state.activeChartId = chartId;
      },
      applyChartTypeToEntity: applyChartTypeToEntity,
      applyChartTypeToEntities: applyChartTypeToEntities,
      isHierarchicalChart: isHierarchicalChart,
      clearChartGeneratedChildren: clearChartGeneratedChildren,
      applyChartDefaultTransform: applyChartDefaultTransform,
      getMappingProfileKey: getMappingProfileKey,
      // The "a chart's mapping always covers its dimensions" invariant is what
      // keeps Babia from building a chart with a missing axis, so it is tested
      // directly rather than through a full chart switch.
      getDefaultMappingForChart: getDefaultMappingForChart,
      getDimensionsForChart: getDimensionsForChart,
      sweepOrphanChartChildren: sweepOrphanChartChildren,
      computeChartDataSlice: computeChartDataSlice,
      resolveChartDataSourceId: resolveChartDataSourceId,
      getSliceEntityId: getSliceEntityId,
      syncActiveChartDataSlice: syncActiveChartDataSlice,
      PANEL_LAYOUT: PANEL_LAYOUT,
      getGridButtonWidth: getGridButtonWidth,
      getGridButtonX: getGridButtonX
    }
  };

  // Bootstrap keeps re-trying until the tooling config is present: a config
  // script injected after DOMContentLoaded must delay the controller, never
  // permanently disable it (autoInit is a no-op until getConfig() resolves).
  function bootstrapWhenConfigReady(attempt) {
    runtime.autoInit();
    if (state.initialized || attempt >= 120) {
      return;
    }
    root.setTimeout?.(function () {
      bootstrapWhenConfigReady(attempt + 1);
    }, 250);
  }

  if (root.document && root.__CODEXR_DISABLE_MAPPING_AUTO_INIT__ !== true) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', function () {
        bootstrapWhenConfigReady(0);
      }, { once: true });
    } else {
      bootstrapWhenConfigReady(0);
    }
  }

  root.CodeXRMappingUiRuntime = runtime;
  root.CodeXRAnalysisControllerRuntime = runtime;
  return runtime;
});
