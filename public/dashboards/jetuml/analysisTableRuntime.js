// == analysisTableRuntime.js | zonesAndProfiles (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRAnalysisTableComponents(root) {
  'use strict';

  var AFRAME = root.AFRAME;
  var COMPONENT_NAME = 'codexr-chart-containment';
  var BOATS_LAYOUT_STABILITY_COMPONENT_NAME = 'codexr-boats-layout-stability';
  // Plain DOM marker stamped next to the component so runtime-built charts
  // (whose component is set programmatically and therefore leaves no DOM
  // attribute) stay discoverable by attribute selectors.
  var CONTAINMENT_MARKER_ATTRIBUTE = 'data-codexr-chart-containment';
  var TABLE_COMPONENT_NAME = 'codexr-analysis-table';
  var RUNTIME_GLOBAL_NAME = 'CodeXRAnalysisTableRuntime';
  var DEBUG_GLOBAL_NAME = 'CodeXRChartDebugBands';
  if (!AFRAME || !AFRAME.registerComponent) {
    return;
  }
  var registerContainment = !AFRAME.components[COMPONENT_NAME];
  var registerTable = !AFRAME.components[TABLE_COMPONENT_NAME];
  var registerBoatsLayoutStability = !AFRAME.components[BOATS_LAYOUT_STABILITY_COMPONENT_NAME];
  if (!registerContainment && !registerTable && !registerBoatsLayoutStability) {
    return;
  }

  var DEFAULTS = {
    targetWidth: 5.614,
    targetHeight: 1.8,
    targetDepth: 3.218,
    anchorX: 0,
    anchorY: 1,
    anchorZ: -18,
    tableTopSurfaceOffsetY: -0.08,
    tabletopAnchorEpsilon: 0.004,
    tabletopAnchorDeadbandY: 0.015,
    retries: 45,
    retryDelayMs: 90,
    tableTopPadding: 0.9,
    bootstrapPlanarMaxRatio: 0.84,
    minPlanarOccupancyRatio: 0.78,
    maxPlanarOccupancyRatio: 0.92,
    heightBandMinRatio: 0.38,
    heightBandMaxRatio: 0.72,
    tableEdgeMargin: 0.18,
    yScaleMin: 0.01,
    yScaleMax: 12,
    containmentToleranceRatio: 0.018,
    containmentMaxIterations: 8,
    containmentCheckMs: 700,
    periodicContainmentEnabled: true,
    renormalizeDebounceMs: 280,
    stabilizationCheckMs: 140,
    stabilizationMaxChecks: 14,
    stabilizationStablePasses: 3,
    transformTransitionMs: 650,
    hardHeightGuardEnabled: true,
    heightUnderflowCorrectionEnabled: true,
    planarUnderflowCorrectionEnabled: true
  };

  var MODE_THEME_BY_ID = {
    selection: {
      top: 'color: #f8fafc; metalness: 0.04; roughness: 0.86',
      trim: 'color: #cbd5e1; metalness: 0.16; roughness: 0.48',
      base: 'color: #64748b; metalness: 0.2; roughness: 0.68'
    },
    single: {
      top: 'color: #0e7490; metalness: 0.12; roughness: 0.72',
      trim: 'color: #67e8f9; metalness: 0.28; roughness: 0.42',
      base: 'color: #164e63; metalness: 0.24; roughness: 0.66'
    },
    'historical-compare': {
      top: 'color: #be123c; metalness: 0.16; roughness: 0.7',
      trim: 'color: #fb7185; metalness: 0.28; roughness: 0.42',
      base: 'color: #881337; metalness: 0.26; roughness: 0.66'
    },
    'dependency-graph': {
      top: 'color: #7c3aed; metalness: 0.18; roughness: 0.68',
      trim: 'color: #c4b5fd; metalness: 0.3; roughness: 0.38',
      base: 'color: #4c1d95; metalness: 0.3; roughness: 0.62'
    },
    'project-evolution': {
      top: 'color: #f59e0b; metalness: 0.14; roughness: 0.72',
      trim: 'color: #fde68a; metalness: 0.28; roughness: 0.42',
      base: 'color: #92400e; metalness: 0.26; roughness: 0.64'
    }
  };

  var DEBUG_STATE = {
    enabled: false
  };
  var TABLE_DIAGNOSTIC_STATE = {
    key: '',
    firstSeenAt: 0
  };
  var TABLE_WARNING_PERSISTENCE_MS = 2600;
  // Coalesced refresh of the table warning surface. Containment components
  // request a refresh on every lifecycle transition; one shared timer samples
  // the diagnostics so the displayed warning always converges to the current
  // chart state instead of freezing on whatever the last caller observed.
  var TABLE_DIAGNOSTIC_REFRESH = {
    timer: null,
    lastRunAt: 0
  };

  var FULL_TABLE_ZONE = {
    id: 'single',
    anchorX: DEFAULTS.anchorX,
    anchorZ: DEFAULTS.anchorZ,
    width: DEFAULTS.targetWidth,
    depth: DEFAULTS.targetDepth
  };

  function getAnalysisTableZonesForMode(mode) {
    var fullWidth = DEFAULTS.targetWidth;
    var fullDepth = DEFAULTS.targetDepth;
    if (mode !== 'historical-compare') {
      return [Object.assign({}, FULL_TABLE_ZONE)];
    }
    var centerGap = 0.18;
    var zoneWidth = (fullWidth - centerGap) / 2;
    var centerOffset = (zoneWidth + centerGap) / 2;
    return [
      {
        id: 'left',
        anchorX: -centerOffset,
        anchorZ: DEFAULTS.anchorZ,
        width: zoneWidth,
        depth: fullDepth
      },
      {
        id: 'right',
        anchorX: centerOffset,
        anchorZ: DEFAULTS.anchorZ,
        width: zoneWidth,
        depth: fullDepth
      }
    ];
  }

  function baseContainmentProfileData(zone, overrides) {
    var sourceZone = zone || FULL_TABLE_ZONE;
    return Object.assign({
      enabled: true,
      anchorX: sourceZone.anchorX,
      anchorY: DEFAULTS.anchorY,
      anchorZ: sourceZone.anchorZ,
      tableTopPadding: DEFAULTS.tableTopPadding,
      targetWidth: sourceZone.width,
      targetHeight: DEFAULTS.targetHeight,
      targetDepth: sourceZone.depth,
      bootstrapPlanarMaxRatio: DEFAULTS.bootstrapPlanarMaxRatio,
      minPlanarOccupancyRatio: DEFAULTS.minPlanarOccupancyRatio,
      maxPlanarOccupancyRatio: DEFAULTS.maxPlanarOccupancyRatio,
      heightBandMinRatio: DEFAULTS.heightBandMinRatio,
      heightBandMaxRatio: DEFAULTS.heightBandMaxRatio,
      tableEdgeMargin: DEFAULTS.tableEdgeMargin,
      yScaleMin: DEFAULTS.yScaleMin,
      yScaleMax: DEFAULTS.yScaleMax,
      containmentToleranceRatio: DEFAULTS.containmentToleranceRatio,
      periodicContainmentEnabled: DEFAULTS.periodicContainmentEnabled,
      stabilizationCheckMs: DEFAULTS.stabilizationCheckMs,
      stabilizationMaxChecks: DEFAULTS.stabilizationMaxChecks,
      stabilizationStablePasses: DEFAULTS.stabilizationStablePasses,
      transformTransitionMs: DEFAULTS.transformTransitionMs,
      hardHeightGuardEnabled: DEFAULTS.hardHeightGuardEnabled,
      heightUnderflowCorrectionEnabled: DEFAULTS.heightUnderflowCorrectionEnabled,
      planarUnderflowCorrectionEnabled: DEFAULTS.planarUnderflowCorrectionEnabled
    }, overrides || {});
  }

  function profilePosition(data) {
    return {
      x: data.anchorX,
      y: data.anchorY,
      z: data.anchorZ
    };
  }

  function vectorToAttribute(value) {
    if (typeof value === 'string') {
      return value;
    }
    var source = value || {};
    return String(Number.isFinite(source.x) ? source.x : 0)
      + ' ' + String(Number.isFinite(source.y) ? source.y : 0)
      + ' ' + String(Number.isFinite(source.z) ? source.z : 0);
  }

  function clonePlainObject(value) {
    return Object.assign({}, value || {});
  }

  function createContainmentProfile(id, zone, overrides) {
    var containment = baseContainmentProfileData(zone, overrides);
    return {
      id: id || 'default',
      zone: Object.assign({}, zone || FULL_TABLE_ZONE),
      position: profilePosition(containment),
      containment: containment
    };
  }

  function resolveContainmentProfile(profileOrMode, zone) {
    if (profileOrMode && typeof profileOrMode === 'object') {
      var objectContainment = clonePlainObject(profileOrMode.containment || profileOrMode);
      return {
        id: profileOrMode.id || 'custom',
        zone: profileOrMode.zone ? Object.assign({}, profileOrMode.zone) : null,
        position: profileOrMode.position || profilePosition(objectContainment),
        containment: objectContainment
      };
    }

    var profileId = String(profileOrMode || 'default');
    if (profileId === 'single' || profileId === 'dependency-graph' || profileId === 'project-evolution') {
      return createContainmentProfile(profileId, FULL_TABLE_ZONE);
    }

    if (profileId === 'historical-left' || profileId === 'historical-right') {
      var historicalZones = getAnalysisTableZonesForMode('historical-compare');
      var historicalZone = profileId === 'historical-left' ? historicalZones[0] : historicalZones[1];
      return createContainmentProfile(profileId, historicalZone, {
        tableTopPadding: 0.14,
        tableEdgeMargin: 0.12,
        heightBandMinRatio: 0.34,
        heightBandMaxRatio: 0.68
      });
    }

    if (profileId === 'historical-compare') {
      var zoneId = typeof zone === 'string' ? zone : (zone && zone.id);
      return resolveContainmentProfile(zoneId === 'right' ? 'historical-right' : 'historical-left');
    }

    return createContainmentProfile('default', FULL_TABLE_ZONE);
  }

  var PID_PROFILE = {
    planar: {
      kp: 6.2,
      ki: 0.55,
      kd: 1.15,
      integralLimit: 1.4,
      maxVelocity: 1.3,
      epsilon: 0.0015
    },
    vertical: {
      kp: 5.4,
      ki: 0.45,
      kd: 0.95,
      integralLimit: 1.1,
      maxVelocity: 1.0,
      epsilon: 0.0015
    },
    stableTicks: 8,
    dtMin: 1 / 120,
    dtMax: 0.08,
    // Dead zone relative to the axis' CURRENT scale (the per-axis `epsilon`
    // stays as an absolute floor): boats runs at 0.01 scale and flat charts at
    // 1.5+, so one absolute number cannot serve both.
    relativeEpsilonRatio: 0.002
  };

  // `lookat` keeps camera-facing billboards out of the measurements: their
  // world AABB changes as the user turns, which is measurement noise, never
  // chart content.
  var CONTENT_AUXILIARY_TOKEN_PATTERN = /(legend|label|title|axis|tick|grid|mapping|debug|tooltip|lookat)/i;
  var CONTAINMENT_AUXILIARY_TOKEN_PATTERN = /(legend|label|title|mapping|debug|tooltip|lookat)/i;

  // Terminal-state watchdog. Once a fit converged the component goes settled
  // and only this periodic check runs: a RELATIVE drift must persist for
  // `resumeSamples` consecutive checks before the controller re-engages
  // (one-sample blips are measurement noise), while a hard violation
  // (occupancy past the physical limit by `hardViolationRatio`) re-engages
  // immediately.
  var SETTLED_WATCH = {
    resumeThresholdRatio: 0.02,
    resumeSamples: 2,
    hardViolationRatio: 1.05
  };
  var TEXT_COMPONENT_KEYS = ['text', 'troika-text'];

// == analysisTableRuntime.js | geometryUtils (assembled per manifest.json; see COMPONENTS.md) ==
  function toFixedNumber(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Number(value.toFixed(3));
  }

  function toTransformNumber(value) {
    if (!Number.isFinite(value)) {
      return 0;
    }
    return Number(value.toFixed(6));
  }

  function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
  }

  // True when the entity is actually on screen: its own object3D is visible and
  // so is every ancestor (a parked analysis root hides the whole subtree).
  function isObject3DVisibleInScene(el) {
    var object3D = el && el.object3D;
    if (!object3D) {
      return false;
    }
    for (var node = object3D; node; node = node.parent) {
      if (node.visible === false) {
        return false;
      }
    }
    return true;
  }

  function midpoint(minValue, maxValue) {
    return minValue + ((maxValue - minValue) / 2);
  }

  function isFiniteVector3Like(value) {
    return !!value
      && Number.isFinite(value.x)
      && Number.isFinite(value.y)
      && Number.isFinite(value.z);
  }

  function isFiniteBoundsInfo(boundsInfo) {
    return !!boundsInfo
      && !!boundsInfo.bounds
      && !!boundsInfo.bounds.min
      && !!boundsInfo.bounds.max
      && isFiniteVector3Like(boundsInfo.size)
      && isFiniteVector3Like(boundsInfo.center)
      && isFiniteVector3Like(boundsInfo.bounds.min)
      && isFiniteVector3Like(boundsInfo.bounds.max);
  }

  function hasPositiveSize(size) {
    return !!size
      && Number.isFinite(size.x)
      && Number.isFinite(size.y)
      && Number.isFinite(size.z)
      && size.x > 0
      && size.y > 0
      && size.z > 0;
  }

  function hasUsableMeasurements(measurements) {
    return !!measurements
      && isFiniteBoundsInfo(measurements.primary)
      && isFiniteBoundsInfo(measurements.containment)
      && isFiniteBoundsInfo(measurements.full)
      && hasPositiveSize(measurements.primary.size);
  }

  function cloneScale(object3D) {
    return {
      x: object3D.scale.x,
      y: object3D.scale.y,
      z: object3D.scale.z
    };
  }

  function cloneTransform(object3D) {
    if (!object3D || !isFiniteVector3Like(object3D.position) || !isFiniteVector3Like(object3D.scale)) {
      return null;
    }

    return {
      position: {
        x: object3D.position.x,
        y: object3D.position.y,
        z: object3D.position.z
      },
      scale: {
        x: object3D.scale.x,
        y: object3D.scale.y,
        z: object3D.scale.z
      },
      visible: object3D.visible !== false
    };
  }

  function formatVector3Like(value) {
    return toTransformNumber(value.x) + ' ' + toTransformNumber(value.y) + ' ' + toTransformNumber(value.z);
  }

  function transformsDiffer(a, b) {
    if (!a || !b || !isFiniteVector3Like(a.position) || !isFiniteVector3Like(a.scale) || !isFiniteVector3Like(b.position) || !isFiniteVector3Like(b.scale)) {
      return false;
    }
    return Math.abs(a.position.x - b.position.x) > 0.0005
      || Math.abs(a.position.y - b.position.y) > 0.0005
      || Math.abs(a.position.z - b.position.z) > 0.0005
      || Math.abs(a.scale.x - b.scale.x) > 0.0005
      || Math.abs(a.scale.y - b.scale.y) > 0.0005
      || Math.abs(a.scale.z - b.scale.z) > 0.0005;
  }

  function restoreTransform(object3D, snapshot) {
    if (!object3D || !snapshot || !isFiniteVector3Like(snapshot.position) || !isFiniteVector3Like(snapshot.scale)) {
      return false;
    }

    object3D.position.set(snapshot.position.x, snapshot.position.y, snapshot.position.z);
    object3D.scale.set(snapshot.scale.x, snapshot.scale.y, snapshot.scale.z);
    object3D.visible = snapshot.visible !== false;
    object3D.updateMatrixWorld(true);
    return true;
  }

  function buildBounds(three, object3D) {
    var bounds = new three.Box3();
    var size = new three.Vector3();
    var center = new three.Vector3();
    bounds.setFromObject(object3D);
    bounds.getSize(size);
    bounds.getCenter(center);
    if (!isFiniteVector3Like(size) || !isFiniteVector3Like(center) || !isFiniteVector3Like(bounds.min) || !isFiniteVector3Like(bounds.max)) {
      return null;
    }
    return {
      bounds: bounds,
      size: size,
      center: center
    };
  }

  function debugLog() {
    if (!DEBUG_STATE.enabled) {
      return;
    }
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[CodeXR][AnalysisTable]');
    console.log.apply(console, args);
  }

  function debugTable(label, payload) {
    if (!DEBUG_STATE.enabled || typeof console.table !== 'function') {
      return;
    }
    console.log('[CodeXR][AnalysisTable] ' + label);
    console.table(payload);
  }

  function resizeTrace(label, payload) {
    if (!DEBUG_STATE.enabled) {
      return;
    }
    if (payload !== undefined) {
      console.log('[Re-size] ' + label, payload);
      return;
    }
    console.log('[Re-size] ' + label);
  }

  function collectNonFiniteValueIssues(value, path, issues, depth) {
    var targetIssues = issues || [];
    if (targetIssues.length >= 8 || depth > 4 || value === null || value === undefined) {
      return targetIssues;
    }

    if (typeof value === 'number') {
      if (!Number.isFinite(value)) {
        targetIssues.push({
          path: path || 'value',
          value: String(value)
        });
      }
      return targetIssues;
    }

    if (typeof value === 'string') {
      if (/infinity|nan/i.test(value)) {
        targetIssues.push({
          path: path || 'value',
          value: value
        });
      }
      return targetIssues;
    }

    if (Array.isArray(value)) {
      value.slice(0, 12).forEach(function (item, index) {
        collectNonFiniteValueIssues(item, (path || 'value') + '[' + index + ']', targetIssues, depth + 1);
      });
      return targetIssues;
    }

    if (typeof value === 'object') {
      Object.keys(value).slice(0, 16).forEach(function (key) {
        collectNonFiniteValueIssues(value[key], (path ? path + '.' : '') + key, targetIssues, depth + 1);
      });
    }

    return targetIssues;
  }

  function inspectAxisAttributeValue(axisEl, attrName) {
    if (!axisEl || !attrName) {
      return null;
    }

    var attrValue = axisEl.getAttribute ? axisEl.getAttribute(attrName) : null;
    var issues = collectNonFiniteValueIssues(attrValue, attrName, [], 0);
    if ((!issues || issues.length === 0) && axisEl.components && axisEl.components[attrName]) {
      issues = collectNonFiniteValueIssues(axisEl.components[attrName].data, attrName + '.data', [], 0);
    }

    if (!issues || issues.length === 0) {
      return null;
    }

    return {
      reason: 'invalid-axis-length',
      attribute: attrName,
      elementId: axisEl.id || '',
      issues: issues
    };
  }

  function inspectInvalidAxisState(chartEl) {
    if (!chartEl || !chartEl.querySelectorAll) {
      return null;
    }

    var axisSelectors = ['babia-axis-x', 'babia-axis-y', 'babia-axis-z'];
    for (var selectorIndex = 0; selectorIndex < axisSelectors.length; selectorIndex += 1) {
      var attrName = axisSelectors[selectorIndex];
      var matches = chartEl.querySelectorAll('[' + attrName + ']');
      for (var matchIndex = 0; matchIndex < matches.length; matchIndex += 1) {
        var issue = inspectAxisAttributeValue(matches[matchIndex], attrName);
        if (issue) {
          return issue;
        }
      }
    }

    return null;
  }

  function entityMetaString(entity) {
    var classAttr = entity.getAttribute ? entity.getAttribute('class') : '';
    var attributeNames = entity.getAttributeNames ? entity.getAttributeNames() : [];
    return [
      entity.id || '',
      typeof classAttr === 'string' ? classAttr : '',
      entity.getAttribute ? (entity.getAttribute('data-name') || entity.getAttribute('name') || '') : '',
      entity.getAttribute ? (entity.getAttribute('data-codexr-role') || '') : '',
      Array.isArray(attributeNames) ? attributeNames.join(' ') : ''
    ].join(' ');
  }

  // Meta of the mesh's WHOLE ancestor entity chain up to (excluding) the chart
  // root. Babia nests its chrome: the legend container carries the
  // `babiaxrLegend` class, but its background plane is an anonymous child
  // entity — judging only the immediate owner let those meshes into the
  // measurement, and a `legend_lookat` billboard changes its world AABB as the
  // camera turns, which kept nudging the fit while the user moved around.
  function collectNodeMeta(node) {
    var parts = [];
    var tagName = '';
    var hasTextComponent = false;
    var current = node;
    var lastEntity = null;
    while (current) {
      var entity = current.el;
      if (entity && entity !== lastEntity) {
        if (
          (entity.components && entity.components[COMPONENT_NAME])
          || entity.tagName === 'A-SCENE'
        ) {
          break;
        }
        parts.push(entityMetaString(entity));
        if (!tagName && entity.tagName) {
          tagName = entity.tagName;
        }
        hasTextComponent = hasTextComponent || !!(entity.hasAttribute && TEXT_COMPONENT_KEYS.some(function (key) {
          return entity.hasAttribute(key);
        }));
        lastEntity = entity;
      }
      current = current.parent;
    }

    return {
      tagName: tagName,
      combined: parts.join(' '),
      nodeName: node && node.name ? String(node.name) : '',
      hasTextComponent: hasTextComponent
    };
  }

  function matchesAuxiliaryPattern(meta, pattern) {
    if (!meta) {
      return false;
    }

    if (String(meta.tagName || '').toLowerCase() === 'a-text') {
      return true;
    }

    if (meta.hasTextComponent) {
      return true;
    }

    return pattern.test([meta.combined || '', meta.nodeName || ''].join(' '));
  }

  function matchesIgnoredBoundsMeta(meta) {
    return matchesAuxiliaryPattern(meta, CONTENT_AUXILIARY_TOKEN_PATTERN);
  }

  function matchesIgnoredContainmentBoundsMeta(meta) {
    return matchesAuxiliaryPattern(meta, CONTAINMENT_AUXILIARY_TOKEN_PATTERN);
  }

  function shouldIgnoreNodeForContentBounds(node) {
    if (!node) {
      return false;
    }
    return matchesIgnoredBoundsMeta(collectNodeMeta(node));
  }

  function shouldIgnoreNodeForContainmentBounds(node) {
    if (!node) {
      return false;
    }
    return matchesIgnoredContainmentBoundsMeta(collectNodeMeta(node));
  }

  function buildBoundsFromNodes(three, nodes) {
    if (!three || !three.Box3 || !three.Vector3 || !Array.isArray(nodes) || nodes.length === 0) {
      return null;
    }

    var aggregate = new three.Box3();
    var firstBounds = null;

    nodes.forEach(function (node) {
      if (!node || !node.geometry) {
        return;
      }

      if (!node.geometry.boundingBox && typeof node.geometry.computeBoundingBox === 'function') {
        node.geometry.computeBoundingBox();
      }

      if (!node.geometry.boundingBox || typeof node.geometry.boundingBox.clone !== 'function') {
        return;
      }

      var worldBounds = node.geometry.boundingBox.clone();
      if (typeof worldBounds.applyMatrix4 === 'function' && node.matrixWorld) {
        worldBounds.applyMatrix4(node.matrixWorld);
      }

      if (!isFiniteVector3Like(worldBounds.min) || !isFiniteVector3Like(worldBounds.max)) {
        return;
      }

      if (!firstBounds) {
        firstBounds = worldBounds;
        if (typeof aggregate.copy === 'function') {
          aggregate.copy(worldBounds);
        } else {
          aggregate.min.copy(worldBounds.min);
          aggregate.max.copy(worldBounds.max);
        }
      } else if (typeof aggregate.union === 'function') {
        aggregate.union(worldBounds);
      }
    });

    if (!firstBounds) {
      return null;
    }

    var size = new three.Vector3();
    var center = new three.Vector3();
    aggregate.getSize(size);
    aggregate.getCenter(center);
    if (!isFiniteVector3Like(size) || !isFiniteVector3Like(center)) {
      return null;
    }

    return {
      bounds: aggregate,
      size: size,
      center: center
    };
  }

  function buildFilteredBounds(three, object3D, shouldIgnoreNode) {
    if (!three || !object3D || typeof object3D.traverse !== 'function') {
      return null;
    }

    var nodes = [];
    object3D.updateMatrixWorld(true);
    object3D.traverse(function (node) {
      if (!node || node.visible === false || !node.geometry) {
        return;
      }
      if (shouldIgnoreNode && shouldIgnoreNode(node)) {
        return;
      }
      nodes.push(node);
    });

    return buildBoundsFromNodes(three, nodes);
  }

  function buildContentBounds(three, object3D) {
    return buildFilteredBounds(three, object3D, shouldIgnoreNodeForContentBounds);
  }

  function buildContainmentBounds(three, object3D) {
    return buildFilteredBounds(three, object3D, shouldIgnoreNodeForContainmentBounds);
  }

  function buildRenderableBounds(three, object3D) {
    return buildFilteredBounds(three, object3D, null);
  }

  function shouldUseDerivedBounds(derivedBounds, referenceBounds) {
    if (!isFiniteBoundsInfo(derivedBounds) || !isFiniteBoundsInfo(referenceBounds)) {
      return !!derivedBounds;
    }

    if (derivedBounds.size.x <= 0.05 || derivedBounds.size.y <= 0.01 || derivedBounds.size.z <= 0.05) {
      return false;
    }

    var widthRatio = derivedBounds.size.x / Math.max(referenceBounds.size.x, 0.0001);
    var depthRatio = derivedBounds.size.z / Math.max(referenceBounds.size.z, 0.0001);

    if (widthRatio < 0.015 && depthRatio < 0.015) {
      return false;
    }

    return true;
  }

  function shouldUseContentBounds(contentBounds, fullBounds) {
    return shouldUseDerivedBounds(contentBounds, fullBounds);
  }

  function resolveHeightBandTargets(data) {
    var minRatio = clamp(
      Number.isFinite(data.heightBandMinRatio) ? data.heightBandMinRatio : DEFAULTS.heightBandMinRatio,
      0.05,
      0.95
    );
    var maxRatio = clamp(
      Number.isFinite(data.heightBandMaxRatio) ? data.heightBandMaxRatio : DEFAULTS.heightBandMaxRatio,
      minRatio + 0.01,
      0.99
    );

    return {
      minHeight: data.targetHeight * minRatio,
      maxHeight: data.targetHeight * maxRatio,
      minRatio: minRatio,
      maxRatio: maxRatio
    };
  }

  function getTableTopY(data) {
    var surfaceOffset = Number.isFinite(data.tableTopSurfaceOffsetY)
      ? data.tableTopSurfaceOffsetY
      : DEFAULTS.tableTopSurfaceOffsetY;
    var epsilon = Number.isFinite(data.tabletopAnchorEpsilon)
      ? data.tabletopAnchorEpsilon
      : DEFAULTS.tabletopAnchorEpsilon;
    return (data.anchorY || 0) + surfaceOffset + Math.max(0, epsilon);
  }

// == analysisTableRuntime.js | containmentLimits (assembled per manifest.json; see COMPONENTS.md) ==
  function computeContainmentLimits(data) {
    var targetWidth = Math.max(data.targetWidth, 0.0001);
    var targetDepth = Math.max(data.targetDepth, 0.0001);
    var topWidth = Math.max(targetWidth, targetWidth + Math.max(0, data.tableTopPadding || 0));
    var topDepth = Math.max(targetDepth, targetDepth + Math.max(0, data.tableTopPadding || 0));
    var edgeMargin = clamp(
      Number.isFinite(data.tableEdgeMargin) ? data.tableEdgeMargin : DEFAULTS.tableEdgeMargin,
      0,
      Math.max(0, (Math.min(topWidth, topDepth) * 0.45))
    );

    return {
      topWidth: topWidth,
      topDepth: topDepth,
      containmentWidthLimit: Math.max(topWidth - (edgeMargin * 2), targetWidth * 0.25),
      containmentDepthLimit: Math.max(topDepth - (edgeMargin * 2), targetDepth * 0.25),
      edgeMargin: edgeMargin
    };
  }

  function computeContainmentPlanarLimit(containmentBounds, data) {
    if (!isFiniteBoundsInfo(containmentBounds) || !data) {
      return null;
    }

    var limits = computeContainmentLimits(data);
    var xFactor = containmentBounds.size.x > 0
      ? (limits.containmentWidthLimit / containmentBounds.size.x)
      : Number.POSITIVE_INFINITY;
    var zFactor = containmentBounds.size.z > 0
      ? (limits.containmentDepthLimit / containmentBounds.size.z)
      : Number.POSITIVE_INFINITY;
    var limit = Math.min(xFactor, zFactor);

    return {
      factor: limit,
      xFactor: xFactor,
      zFactor: zFactor,
      containmentWidthLimit: limits.containmentWidthLimit,
      containmentDepthLimit: limits.containmentDepthLimit,
      edgeMargin: limits.edgeMargin
    };
  }

  function resolveBootstrapPlanarMax(data) {
    return clamp(
      Number.isFinite(data.bootstrapPlanarMaxRatio) ? data.bootstrapPlanarMaxRatio : DEFAULTS.bootstrapPlanarMaxRatio,
      0.05,
      0.99
    );
  }

  function resolveSteadyPlanarRange(data) {
    var minPlanar = clamp(
      Number.isFinite(data.minPlanarOccupancyRatio) ? data.minPlanarOccupancyRatio : DEFAULTS.minPlanarOccupancyRatio,
      0.10,
      0.98
    );
    var maxPlanar = clamp(
      Number.isFinite(data.maxPlanarOccupancyRatio) ? data.maxPlanarOccupancyRatio : DEFAULTS.maxPlanarOccupancyRatio,
      minPlanar + 0.01,
      0.99
    );

    return {
      min: minPlanar,
      max: maxPlanar
    };
  }

  function computePlanarAxisTargetScale(primarySize, containmentSize, currentScale, containmentLimitSize, range, toleranceRatio, allowUnderflowCorrection) {
    if (!Number.isFinite(primarySize) || !Number.isFinite(containmentSize) || !Number.isFinite(currentScale) || !Number.isFinite(containmentLimitSize) || primarySize <= 0 || containmentSize <= 0 || currentScale <= 0 || containmentLimitSize <= 0 || !range) {
      return null;
    }

    var ratio = primarySize / containmentLimitSize;
    var setpointRatio = midpoint(range.min, range.max);
    var resolvedToleranceRatio = clamp(
      Number.isFinite(toleranceRatio) ? toleranceRatio : DEFAULTS.containmentToleranceRatio,
      0,
      0.25
    );
    var containmentTolerance = containmentLimitSize * resolvedToleranceRatio;
    // The scale ceiling aims INSIDE the limit (half a tolerance of margin), not
    // at the exact edge: an equilibrium sitting on the edge meant any
    // measurement noise flipped it across and triggered a correction — the
    // micro-resizes users saw while simply moving around.
    var maxAllowedScale = currentScale * ((containmentLimitSize * (1 - resolvedToleranceRatio / 2)) / containmentSize);
    if (!Number.isFinite(maxAllowedScale) || maxAllowedScale <= 0) {
      maxAllowedScale = currentScale;
    }

    var correctUnderflow = allowUnderflowCorrection !== false;
    // Hysteresis on the band edges: a chart already accepted as fitted must
    // leave the band by a real margin (one tolerance) before it is corrected.
    var underflowing = ratio < range.min * (1 - resolvedToleranceRatio);
    var overflowing = containmentSize > (containmentLimitSize + containmentTolerance);
    var underflowAllowed = underflowing && !correctUnderflow && !overflowing;
    var withinBand = (ratio >= range.min * (1 - resolvedToleranceRatio) && ratio <= range.max * (1 + resolvedToleranceRatio)) || underflowAllowed;
    var desiredScale = currentScale;
    var reason = 'within-band';

    if (overflowing) {
      desiredScale = Math.min(currentScale, maxAllowedScale);
      reason = 'containment-overflow';
      withinBand = false;
    } else if (underflowAllowed) {
      reason = 'underflow-accepted';
    } else if (!withinBand) {
      desiredScale = currentScale * (setpointRatio / Math.max(ratio, 0.00001));
      reason = ratio < range.min ? 'toward-midpoint-up' : 'toward-midpoint-down';
    }

    var targetScale = Math.min(desiredScale, maxAllowedScale);
    if (!Number.isFinite(targetScale) || targetScale <= 0) {
      targetScale = currentScale;
    }

    return {
      ratio: ratio,
      setpointRatio: setpointRatio,
      targetScale: targetScale,
      maxAllowedScale: maxAllowedScale,
      withinBand: withinBand && !overflowing,
      underflowing: underflowing && !overflowing,
      underflowAllowed: underflowAllowed,
      overflowing: overflowing,
      compromised: targetScale + 0.0005 < desiredScale,
      reason: reason
    };
  }

  function computePeakHeight(boundsInfo, data) {
    if (!isFiniteBoundsInfo(boundsInfo) || !data) {
      return null;
    }

    var peakHeight = boundsInfo.bounds.max.y - getTableTopY(data);
    if (!Number.isFinite(peakHeight)) {
      return null;
    }
    return peakHeight;
  }

  function computeBootstrapPlanarScale(primaryBounds, containmentBounds, data) {
    if (!isFiniteBoundsInfo(primaryBounds) || !isFiniteBoundsInfo(containmentBounds) || !data) {
      return null;
    }

    var targetWidth = Math.max(data.targetWidth, 0.0001);
    var targetDepth = Math.max(data.targetDepth, 0.0001);
    var containmentLimit = computeContainmentPlanarLimit(containmentBounds, data);
    var containmentWidthLimit = containmentLimit ? containmentLimit.containmentWidthLimit : targetWidth;
    var containmentDepthLimit = containmentLimit ? containmentLimit.containmentDepthLimit : targetDepth;
    var bootstrapMax = resolveBootstrapPlanarMax(data);
    var xRatio = primaryBounds.size.x / targetWidth;
    var zRatio = primaryBounds.size.z / targetDepth;
    var xRangeFactor = xRatio > bootstrapMax
      ? (bootstrapMax / Math.max(xRatio, 0.00001))
      : 1;
    var zRangeFactor = zRatio > bootstrapMax
      ? (bootstrapMax / Math.max(zRatio, 0.00001))
      : 1;
    var xContainmentFactor = containmentBounds.size.x > 0
      ? containmentWidthLimit / containmentBounds.size.x
      : 1;
    var zContainmentFactor = containmentBounds.size.z > 0
      ? containmentDepthLimit / containmentBounds.size.z
      : 1;
    var xFactor = Math.min(1, xRangeFactor, xContainmentFactor);
    var zFactor = Math.min(1, zRangeFactor, zContainmentFactor);

    return {
      xFactor: Number.isFinite(xFactor) && xFactor > 0 ? xFactor : 1,
      zFactor: Number.isFinite(zFactor) && zFactor > 0 ? zFactor : 1,
      factor: Math.min(
        Number.isFinite(xFactor) && xFactor > 0 ? xFactor : 1,
        Number.isFinite(zFactor) && zFactor > 0 ? zFactor : 1
      ),
      reason: (xFactor < 0.9995 || zFactor < 0.9995) ? 'bootstrap-containment' : 'bootstrap-visible',
      maxRatioX: xRatio,
      maxRatioZ: zRatio,
      containmentWidthLimit: containmentWidthLimit,
      containmentDepthLimit: containmentDepthLimit,
      edgeMargin: containmentLimit ? containmentLimit.edgeMargin : 0,
      bootstrapPlanarMaxRatio: bootstrapMax
    };
  }

  function computeHeightBandScale(currentHeight, currentScaleY, bandTargets, yScaleMin, yScaleMax, allowUnderflowCorrection) {
    if (!Number.isFinite(currentHeight) || currentHeight <= 0 || !Number.isFinite(currentScaleY) || !bandTargets) {
      return null;
    }

    var targetY = currentScaleY;
    var correctUnderflow = allowUnderflowCorrection !== false;

    if (currentHeight < bandTargets.minHeight && correctUnderflow) {
      targetY = currentScaleY * (bandTargets.minHeight / currentHeight);
    } else if (currentHeight > bandTargets.maxHeight) {
      targetY = currentScaleY * (bandTargets.maxHeight / currentHeight);
    }

    targetY = clamp(targetY, yScaleMin, yScaleMax);

    return {
      changed: Math.abs(targetY - currentScaleY) > 0.0001,
      targetY: targetY
    };
  }

  function computeHeightBandTargetScale(currentHeight, currentScaleY, bandTargets, yScaleMin, yScaleMax, allowUnderflowCorrection, toleranceRatio) {
    if (!Number.isFinite(currentHeight) || currentHeight <= 0 || !Number.isFinite(currentScaleY) || !bandTargets) {
      return null;
    }

    // Same hysteresis as the planar band: an already-fitted height must leave
    // the band by a real margin before a correction fires (strict edges made
    // measurement noise flip the withinBand flag back and forth).
    var bandTolerance = clamp(
      Number.isFinite(toleranceRatio) ? toleranceRatio : DEFAULTS.containmentToleranceRatio,
      0,
      0.25
    );
    var setpointHeight = midpoint(bandTargets.minHeight, bandTargets.maxHeight);
    var correctUnderflow = allowUnderflowCorrection !== false;
    var targetScale = currentScaleY;
    var desiredScale = currentScaleY;
    var reason = 'within-band';
    var underflowing = currentHeight < bandTargets.minHeight * (1 - bandTolerance);
    var overflowing = currentHeight > bandTargets.maxHeight * (1 + bandTolerance);
    var underflowAllowed = underflowing && !correctUnderflow;
    var withinBand = (!underflowing && !overflowing) || underflowAllowed;

    if (underflowAllowed) {
      reason = 'underflow-accepted';
    } else if (!withinBand) {
      desiredScale = currentScaleY * (setpointHeight / currentHeight);
      targetScale = desiredScale;
      reason = underflowing ? 'toward-midpoint-up' : 'toward-midpoint-down';
    }

    targetScale = clamp(targetScale, yScaleMin, yScaleMax);

    return {
      targetScale: targetScale,
      setpointHeight: setpointHeight,
      withinBand: withinBand,
      underflowing: underflowing,
      underflowAllowed: underflowAllowed,
      overflowing: overflowing,
      compromised: Math.abs(targetScale - desiredScale) > 0.0005,
      reason: reason
    };
  }

  function computeHardHeightGuardTarget(currentHeight, currentScaleY, bandTargets, yScaleMin, yScaleMax, enabled, toleranceRatio) {
    if (enabled === false || !Number.isFinite(currentHeight) || currentHeight <= 0 || !Number.isFinite(currentScaleY) || currentScaleY <= 0 || !bandTargets || !Number.isFinite(bandTargets.maxHeight) || bandTargets.maxHeight <= 0) {
      return {
        enabled: enabled !== false,
        overflowing: false,
        changed: false,
        targetY: currentScaleY,
        maxHeight: bandTargets && Number.isFinite(bandTargets.maxHeight) ? bandTargets.maxHeight : null,
        heightRatio: null,
        compromised: false
      };
    }

    var heightRatio = currentHeight / bandTargets.maxHeight;
    // Relative threshold: 1.0005 fired on measurement noise (0.05 % of the
    // ceiling) — the safety guard only reacts to a REAL overshoot now; the
    // band correction handles anything smaller, smoothly.
    var guardTolerance = clamp(
      Number.isFinite(toleranceRatio) ? toleranceRatio : DEFAULTS.containmentToleranceRatio,
      0,
      0.25
    );
    var overflowing = heightRatio > 1 + guardTolerance;
    var desiredY = overflowing ? currentScaleY * (bandTargets.maxHeight / currentHeight) : currentScaleY;
    var targetY = clamp(desiredY, yScaleMin, yScaleMax);

    return {
      enabled: true,
      overflowing: overflowing,
      changed: overflowing && Math.abs(targetY - currentScaleY) > 0.0001,
      targetY: targetY,
      maxHeight: bandTargets.maxHeight,
      heightRatio: heightRatio,
      compromised: overflowing && Math.abs(targetY - desiredY) > 0.0005
    };
  }

  function constrainPlanarTargetForHeightCompromise(target, currentScale, yTarget, currentHeight, maxHeight) {
    if (!target || !target.underflowing || !Number.isFinite(currentScale) || currentScale <= 0 || !Number.isFinite(currentHeight) || currentHeight <= 0 || !Number.isFinite(maxHeight) || maxHeight <= 0) {
      return target;
    }

    if (!yTarget || (!yTarget.compromised && !(currentHeight * (target.targetScale / currentScale) > maxHeight))) {
      return target;
    }

    var maxHeightPreservingScale = currentScale * (maxHeight / currentHeight) * 0.985;
    if (!Number.isFinite(maxHeightPreservingScale) || maxHeightPreservingScale <= 0 || target.targetScale <= maxHeightPreservingScale) {
      return target;
    }

    var constrained = Object.assign({}, target);
    constrained.targetScale = Math.max(0.000001, maxHeightPreservingScale);
    constrained.compromised = true;
    constrained.reason = 'height-overflow-compromise';
    return constrained;
  }

  function createNeutralHeightBandTarget(currentScaleY, reason) {
    var scale = Number.isFinite(currentScaleY) && currentScaleY > 0 ? currentScaleY : 1;
    return {
      targetScale: scale,
      setpointHeight: null,
      withinBand: true,
      underflowing: false,
      overflowing: false,
      compromised: false,
      reason: reason || 'height-unavailable'
    };
  }

  function targetNeedsCorrection(target, currentScale) {
    return !!target
      && !target.withinBand
      && !target.compromised
      && Number.isFinite(target.targetScale)
      && Number.isFinite(currentScale)
      && Math.abs(target.targetScale - currentScale) > 0.0005;
  }

// == analysisTableRuntime.js | chartFitProfiles (assembled per manifest.json; see COMPONENTS.md) ==
  //
  // Per-chart containment fit strategy.
  //
  // The default pipeline scales the chart's LOCAL axes independently against
  // the table's world limits, assuming the entity is not rotated. Circular
  // charts break both assumptions: pie/doughnut geometry lies flat by
  // construction and stands up via entity rotation (90 0 0, the same one
  // Babia's own demos use), which swaps the local axes the world limits map
  // to — the per-axis controller then "lowers the height" by squashing the
  // disk's vertical world extent to zero while inflating its depth. And even
  // unrotated, anisotropic scaling would turn a circle into an ellipse.
  //
  // Charts whose presentation profile declares `fit: 'uniform'` therefore get
  // a single-factor fit: one multiplicative factor on all three local axes,
  // sized so the WORLD bounds fill the tightest table budget (width, depth or
  // height band). The factor preserves aspect by construction, so no
  // minimum-occupancy requirement applies — a standing disk is height-bound
  // and can never legitimately fill the table's width.

  // 'uniform': one factor on all three axes (circular charts — anything else
  // squashes the rotated disk or turns the circle into an ellipse).
  // 'planar-uniform': x and z share one SCALE VALUE, y stays independent
  // (row charts whose geometry is round or whose axis labels lie flat along
  // z: independent planar axes left the labels at raw size, flooding the
  // room floor, and made cylinders/spheres elliptical).
  var FIT_MODE_BY_CHART_ID = {
    pie: 'uniform',
    donut: 'uniform',
    bubbles: 'uniform',
    bars: 'planar-uniform',
    cyls: 'planar-uniform',
    cylsmap: 'planar-uniform'
  };
  var FIT_MODE_BY_COMPONENT_NAME = {
    'babia-pie': 'uniform',
    'babia-doughnut': 'uniform',
    'babia-bubbles': 'uniform',
    'babia-bars': 'planar-uniform',
    'babia-cyls': 'planar-uniform',
    'babia-cylsmap': 'planar-uniform'
  };
  var KNOWN_FIT_MODES = { uniform: true, 'planar-uniform': true };
  var UNIFORM_FIT_MARGIN = 0.98;

  // Clearance above the anchor plane, per chart. The anchor plane sits at the
  // tabletop slab, ~1.7 cm under the glass drawn over it: flat-bottomed
  // charts hide that inside the glass, spheres get sliced by it. Mirrors
  // chartPresentation.ts (surfaceLift) for scenes generated before it.
  var SURFACE_LIFT_BY_CHART_ID = { bubbles: 0.03 };
  var SURFACE_LIFT_BY_COMPONENT_NAME = { 'babia-bubbles': 0.03 };

  function resolveChartSurfaceLift(el) {
    if (!el) {
      return 0;
    }
    var chartId = (typeof el.getAttribute === 'function' && el.getAttribute('data-codexr-active-chart-id')) || '';
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    if (chartId && mappingRuntime && typeof mappingRuntime.getChartPresentation === 'function') {
      var profile = mappingRuntime.getChartPresentation(chartId);
      if (profile && Number.isFinite(profile.surfaceLift)) {
        return Math.max(0, profile.surfaceLift);
      }
    }
    if (chartId) {
      return SURFACE_LIFT_BY_CHART_ID[chartId] || 0;
    }
    var componentNames = Object.keys(SURFACE_LIFT_BY_COMPONENT_NAME);
    for (var i = 0; i < componentNames.length; i += 1) {
      if ((el.components && el.components[componentNames[i]])
        || (typeof el.hasAttribute === 'function' && el.hasAttribute(componentNames[i]))) {
        return SURFACE_LIFT_BY_COMPONENT_NAME[componentNames[i]];
      }
    }
    return 0;
  }

  function resolveChartFitMode(el) {
    if (!el) {
      return 'per-axis';
    }
    var chartId = (typeof el.getAttribute === 'function' && el.getAttribute('data-codexr-active-chart-id')) || '';
    // The canonical presentation profile (generator-injected, mirrored by the
    // mapping runtime) wins when available.
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    if (chartId && mappingRuntime && typeof mappingRuntime.getChartPresentation === 'function') {
      var profile = mappingRuntime.getChartPresentation(chartId);
      if (profile && profile.fit) {
        return KNOWN_FIT_MODES[profile.fit] ? profile.fit : 'per-axis';
      }
    }
    if (FIT_MODE_BY_CHART_ID[chartId]) {
      return FIT_MODE_BY_CHART_ID[chartId];
    }
    // Harness scenes and generated initial charts carry no chart id: detect
    // the chart by its live babia component.
    var componentNames = Object.keys(FIT_MODE_BY_COMPONENT_NAME);
    for (var i = 0; i < componentNames.length; i += 1) {
      var componentName = componentNames[i];
      if ((el.components && el.components[componentName])
        || (typeof el.hasAttribute === 'function' && el.hasAttribute(componentName))) {
        return FIT_MODE_BY_COMPONENT_NAME[componentName];
      }
    }
    return 'per-axis';
  }

  // Planar uniformity: both axes converge to the same SCALE VALUE — the
  // tightest of the two per-axis targets. The fixed point is stable: at
  // convergence the binding axis reports "within band, keep scale" and the
  // other axis's midpoint-up wish is overruled by the min.
  function unifyPlanarTargets(xTarget, zTarget) {
    if (!xTarget || !zTarget || !Number.isFinite(xTarget.targetScale) || !Number.isFinite(zTarget.targetScale)) {
      return { x: xTarget, z: zTarget };
    }
    var sharedScale = Math.min(xTarget.targetScale, zTarget.targetScale);
    // The non-binding axis's midpoint-up wish being capped is the DESIGN of
    // planar uniformity, not a compromise: leaving the per-axis `compromised`
    // flag standing kept the "constrained by table limits" warning on screen
    // forever on a perfectly settled chart.
    return {
      x: Object.assign({}, xTarget, { targetScale: sharedScale, compromised: false, reason: 'planar-uniform' }),
      z: Object.assign({}, zTarget, { targetScale: sharedScale, compromised: false, reason: 'planar-uniform' })
    };
  }

  // One multiplicative factor that takes the chart's current WORLD bounds to
  // the tightest table budget. Returns null when the measurements cannot
  // support a decision.
  function computeUniformFitState(measurements, object3D, data) {
    if (!hasUsableMeasurements(measurements) || !object3D || !object3D.scale || !data) {
      return null;
    }
    var size = measurements.containment.size;
    var peakHeight = Number.isFinite(measurements.peakHeight) && measurements.peakHeight > 0
      ? measurements.peakHeight
      : measurements.primary.size.y;
    var limits = computeContainmentLimits(data);
    var heightTargets = resolveHeightBandTargets(data);

    var widthCap = size.x > 0.000001 ? limits.containmentWidthLimit / size.x : Number.POSITIVE_INFINITY;
    var depthCap = size.z > 0.000001 ? limits.containmentDepthLimit / size.z : Number.POSITIVE_INFINITY;
    var heightCap = Number.isFinite(peakHeight) && peakHeight > 0.000001 && heightTargets
      ? heightTargets.maxHeight / peakHeight
      : Number.POSITIVE_INFINITY;

    var rawFactor = Math.min(widthCap, depthCap, heightCap);
    if (!Number.isFinite(rawFactor) || rawFactor <= 0) {
      return null;
    }
    var targetFactor = rawFactor * UNIFORM_FIT_MARGIN;

    // Uniformity survives the y clamp: if the clamp binds, every axis takes
    // the clamped factor.
    var yScaleMin = Math.max(0.001, data.yScaleMin);
    var yScaleMax = Math.max(yScaleMin + 0.001, data.yScaleMax);
    var currentY = object3D.scale.y;
    var clampedY = clamp(currentY * targetFactor, yScaleMin, yScaleMax);
    var factor = currentY > 0 ? clampedY / currentY : targetFactor;

    var toleranceRatio = clamp(
      Number.isFinite(data.containmentToleranceRatio) ? data.containmentToleranceRatio : DEFAULTS.containmentToleranceRatio,
      0.002,
      0.2
    );
    // Overflow means a budget is exceeded NOW; convergence means the factor
    // stopped asking for meaningful change.
    var overflowing = rawFactor < 1 - toleranceRatio;
    var converged = Math.abs(factor - 1) <= Math.max(toleranceRatio, 0.02);

    return {
      factor: factor,
      rawFactor: rawFactor,
      widthCap: widthCap,
      depthCap: depthCap,
      heightCap: heightCap,
      heightOverflow: heightCap < 1 - toleranceRatio,
      overflowing: overflowing,
      converged: converged,
      limits: limits,
      heightTargets: heightTargets,
      peakHeight: peakHeight
    };
  }

  // Correction-state shape compatible with the per-axis one, for
  // getChartStatus and the diagnostics surface.
  function buildUniformCorrectionState(measurements, object3D, data) {
    var fit = computeUniformFitState(measurements, object3D, data);
    if (!fit) {
      return null;
    }
    var size = measurements.containment.size;
    var axis = function (current, limit) {
      var ratio = limit > 0 ? current / limit : null;
      return {
        ratio: Number.isFinite(ratio) ? toFixedNumber(ratio) : null,
        targetScale: null,
        setpoint: null,
        withinBand: Number.isFinite(ratio) ? ratio <= 1 : true,
        underflowing: false,
        underflowAllowed: true,
        overflowing: Number.isFinite(ratio) ? ratio > 1 : false,
        compromised: false,
        reason: 'uniform-fit'
      };
    };
    var heightRatio = fit.heightTargets && fit.heightTargets.maxHeight > 0
      ? fit.peakHeight / fit.heightTargets.maxHeight
      : null;
    // Axes still unequal (inherited from a previous chart's fit) mean the
    // equalization step has not landed yet: the chart is not done correcting.
    var minAxisScale = Math.min(object3D.scale.x, object3D.scale.y, object3D.scale.z);
    var maxAxisScale = Math.max(object3D.scale.x, object3D.scale.y, object3D.scale.z);
    var anisotropic = Number.isFinite(minAxisScale) && minAxisScale > 0
      && (maxAxisScale - minAxisScale) > minAxisScale * 0.02;
    return {
      fitMode: 'uniform',
      x: axis(size.x, fit.limits.containmentWidthLimit),
      y: axis(fit.peakHeight, fit.heightTargets ? fit.heightTargets.maxHeight : 0),
      z: axis(size.z, fit.limits.containmentDepthLimit),
      axes: null,
      needsCorrection: !fit.converged || anisotropic,
      compromised: false,
      outOfBand: fit.overflowing,
      containmentWidthLimit: fit.limits.containmentWidthLimit,
      containmentDepthLimit: fit.limits.containmentDepthLimit,
      minHeight: fit.heightTargets ? fit.heightTargets.minHeight : null,
      maxHeight: fit.heightTargets ? fit.heightTargets.maxHeight : null,
      heightOverflow: fit.heightOverflow,
      heightRatio: Number.isFinite(heightRatio) ? toFixedNumber(heightRatio) : null,
      hardHeightGuardTargetY: null,
      hardHeightGuardCompromised: false
    };
  }

// == analysisTableRuntime.js | boatsLayoutStability (assembled per manifest.json; see COMPONENTS.md) ==
  var BOATS_LAYOUT_STABILITY_OWNER_KEY = '__codexrBoatsLayoutStability';
  var DEFAULT_BOATS_INITIAL_SCALE_Y = 0.05;

  function positiveFiniteNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : null;
  }

  function parseScaleY(value) {
    if (value && typeof value === 'object') {
      return positiveFiniteNumber(value.y);
    }
    if (typeof value !== 'string') {
      return null;
    }
    var parts = value.trim().split(/\s+/);
    return parts.length >= 2 ? positiveFiniteNumber(parts[1]) : null;
  }

  function computeStableBoatsZoneElevation(zoneElevation, referenceScaleY, currentScaleY) {
    var zone = positiveFiniteNumber(zoneElevation);
    var reference = positiveFiniteNumber(referenceScaleY);
    var current = positiveFiniteNumber(currentScaleY);
    if (zone === null || reference === null || current === null) {
      return null;
    }
    return (zone / reference) * current;
  }

  function resolveBoatsReferenceScaleY(el, data) {
    var configured = positiveFiniteNumber(data && data.referenceScaleY);
    if (configured !== null) {
      return configured;
    }
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    var presentation = mappingRuntime
      && typeof mappingRuntime.getChartPresentation === 'function'
      ? mappingRuntime.getChartPresentation('boats')
      : null;
    return parseScaleY(presentation && presentation.initialScale)
      || DEFAULT_BOATS_INITIAL_SCALE_Y;
  }

  function resolveCurrentChartScaleY(el) {
    var objectScale = positiveFiniteNumber(el && el.object3D && el.object3D.scale
      ? el.object3D.scale.y
      : null);
    if (objectScale !== null) {
      return objectScale;
    }
    return parseScaleY(el && typeof el.getAttribute === 'function'
      ? el.getAttribute('scale')
      : null);
  }

  var boatsLayoutStabilityDefinition = {
    schema: {
      enabled: { default: true },
      referenceScaleY: { type: 'number', default: 0 }
    },

    init: function () {
      this.boatsComponent = null;
      this.originalGenerateElements = null;
      this.wrappedGenerateElements = null;
      this.layoutDepth = 0;
      this.onComponentInitialized = this.onComponentInitialized.bind(this);
      this.onComponentRemoved = this.onComponentRemoved.bind(this);
      this.el.addEventListener?.('componentinitialized', this.onComponentInitialized);
      this.el.addEventListener?.('componentremoved', this.onComponentRemoved);
      if (this.data.enabled) {
        this.attachToCurrentBoats();
      }
    },

    update: function () {
      if (!this.data.enabled) {
        this.detachFromBoats();
        return;
      }
      this.attachToCurrentBoats();
    },

    tick: function () {
      if (!this.data.enabled) {
        return;
      }
      var current = this.el.components && this.el.components['babia-boats'];
      if (current !== this.boatsComponent
        || (current && current.generateElements !== this.wrappedGenerateElements)) {
        this.attachToCurrentBoats();
      }
    },

    onComponentInitialized: function (event) {
      if (event && event.detail && event.detail.name === 'babia-boats' && this.data.enabled) {
        this.attachToCurrentBoats();
      }
    },

    onComponentRemoved: function (event) {
      if (event && event.detail && event.detail.name === 'babia-boats') {
        this.detachFromBoats();
      }
    },

    attachToCurrentBoats: function () {
      var boats = this.el.components && this.el.components['babia-boats'];
      if (!boats || typeof boats.generateElements !== 'function') {
        if (this.boatsComponent && this.boatsComponent !== boats) {
          this.detachFromBoats();
        }
        return false;
      }
      if (boats === this.boatsComponent
        && boats.generateElements === this.wrappedGenerateElements) {
        return true;
      }

      this.detachFromBoats();
      var existingOwner = boats[BOATS_LAYOUT_STABILITY_OWNER_KEY];
      if (existingOwner && existingOwner.owner !== this) {
        return false;
      }

      var owner = this;
      var original = boats.generateElements;
      var wrapped = function () {
        if (!owner.data.enabled || owner.layoutDepth > 0) {
          return original.apply(this, arguments);
        }
        var publicZoneElevation = boats.data && boats.data.zone_elevation;
        var effectiveZoneElevation = computeStableBoatsZoneElevation(
          publicZoneElevation,
          resolveBoatsReferenceScaleY(owner.el, owner.data),
          resolveCurrentChartScaleY(owner.el)
        );
        if (effectiveZoneElevation === null) {
          return original.apply(this, arguments);
        }

        owner.layoutDepth += 1;
        boats.data.zone_elevation = effectiveZoneElevation;
        try {
          return original.apply(this, arguments);
        } finally {
          boats.data.zone_elevation = publicZoneElevation;
          owner.layoutDepth -= 1;
        }
      };

      this.boatsComponent = boats;
      this.originalGenerateElements = original;
      this.wrappedGenerateElements = wrapped;
      boats[BOATS_LAYOUT_STABILITY_OWNER_KEY] = {
        owner: this,
        original: original,
        wrapped: wrapped
      };
      boats.generateElements = wrapped;
      return true;
    },

    detachFromBoats: function () {
      var boats = this.boatsComponent;
      if (!boats) {
        return false;
      }
      var marker = boats[BOATS_LAYOUT_STABILITY_OWNER_KEY];
      if (marker && marker.owner === this) {
        if (boats.generateElements === marker.wrapped) {
          boats.generateElements = marker.original;
        }
        delete boats[BOATS_LAYOUT_STABILITY_OWNER_KEY];
      } else if (boats.generateElements === this.wrappedGenerateElements) {
        boats.generateElements = this.originalGenerateElements;
      }
      this.boatsComponent = null;
      this.originalGenerateElements = null;
      this.wrappedGenerateElements = null;
      this.layoutDepth = 0;
      return true;
    },

    remove: function () {
      this.detachFromBoats();
      this.el.removeEventListener?.('componentinitialized', this.onComponentInitialized);
      this.el.removeEventListener?.('componentremoved', this.onComponentRemoved);
    }
  };

  if (registerBoatsLayoutStability) {
    AFRAME.registerComponent(
      BOATS_LAYOUT_STABILITY_COMPONENT_NAME,
      boatsLayoutStabilityDefinition
    );
  }

// == analysisTableRuntime.js | diagnosticsAndPid (assembled per manifest.json; see COMPONENTS.md) ==
  function buildAxisDiagnostics(target) {
    if (!target) {
      return null;
    }
    return {
      ratio: Number.isFinite(target.ratio) ? toFixedNumber(target.ratio) : null,
      height: Number.isFinite(target.currentHeight) ? toFixedNumber(target.currentHeight) : null,
      targetScale: Number.isFinite(target.targetScale) ? toFixedNumber(target.targetScale) : null,
      setpoint: Number.isFinite(target.setpointRatio)
        ? toFixedNumber(target.setpointRatio)
        : (Number.isFinite(target.setpointHeight) ? toFixedNumber(target.setpointHeight) : null),
      withinBand: !!target.withinBand,
      underflowing: !!target.underflowing,
      underflowAllowed: !!target.underflowAllowed,
      overflowing: !!target.overflowing,
      compromised: !!target.compromised,
      reason: target.reason || ''
    };
  }

  function shouldAnimateContainmentTransform(reason, previousTransform, nextTransform, data) {
    if (!previousTransform || !nextTransform || !transformsDiffer(previousTransform, nextTransform)) {
      return false;
    }
    if (!data || !(data.transformTransitionMs > 0)) {
      return false;
    }
    var text = String(reason || '');
    if (!text || text === 'init' || text === 'bootstrap-visible' || text.indexOf('hard-height-guard') !== -1) {
      return false;
    }
    return text.indexOf('mapping') !== -1
      || text.indexOf('componentchanged') !== -1
      || text.indexOf('chart-rendered') !== -1
      || text.indexOf('analysis-updated') !== -1
      || text.indexOf('dataRefresh') !== -1
      || text.indexOf('manual-renormalize') !== -1
      || text.indexOf('update') !== -1;
  }

  function buildContainmentCorrectionState(measurements, object3D, data, fitMode) {
    if (!hasUsableMeasurements(measurements) || !object3D || !object3D.scale || !data) {
      return null;
    }

    var steadyRange = resolveSteadyPlanarRange(data);
    var containmentLimits = computeContainmentLimits(data);
    var xTarget = computePlanarAxisTargetScale(
      measurements.primary.size.x,
      measurements.containment.size.x,
      object3D.scale.x,
      containmentLimits.containmentWidthLimit,
      steadyRange,
      data.containmentToleranceRatio,
      data.planarUnderflowCorrectionEnabled !== false
    );
    var zTarget = computePlanarAxisTargetScale(
      measurements.primary.size.z,
      measurements.containment.size.z,
      object3D.scale.z,
      containmentLimits.containmentDepthLimit,
      steadyRange,
      data.containmentToleranceRatio,
      data.planarUnderflowCorrectionEnabled !== false
    );
    var heightTargets = resolveHeightBandTargets(data);
    var hardHeightGuard = computeHardHeightGuardTarget(
      measurements.peakHeight,
      object3D.scale.y,
      heightTargets,
      Math.max(0.001, data.yScaleMin),
      Math.max(data.yScaleMin + 0.001, data.yScaleMax),
      data.hardHeightGuardEnabled !== false,
      data.containmentToleranceRatio
    );
    var yTarget = computeHeightBandTargetScale(
      measurements.peakHeight,
      object3D.scale.y,
      heightTargets,
      Math.max(0.001, data.yScaleMin),
      Math.max(data.yScaleMin + 0.001, data.yScaleMax),
      data.heightUnderflowCorrectionEnabled !== false,
      data.containmentToleranceRatio
    ) || createNeutralHeightBandTarget(object3D.scale.y, 'height-unavailable');

    if (!xTarget || !zTarget) {
      return null;
    }

    xTarget = constrainPlanarTargetForHeightCompromise(xTarget, object3D.scale.x, yTarget, measurements.peakHeight, heightTargets.maxHeight);
    zTarget = constrainPlanarTargetForHeightCompromise(zTarget, object3D.scale.z, yTarget, measurements.peakHeight, heightTargets.maxHeight);

    if (fitMode === 'planar-uniform') {
      // Mirror the steady controller: both planar axes aim at the same scale
      // value, so the non-binding axis's under-occupancy is by design and
      // must not keep the chart "correcting" forever.
      var unified = unifyPlanarTargets(xTarget, zTarget);
      xTarget = unified.x;
      zTarget = unified.z;
    }

    var xNeedsCorrection = targetNeedsCorrection(xTarget, object3D.scale.x);
    var yNeedsCorrection = targetNeedsCorrection(yTarget, object3D.scale.y) || !!hardHeightGuard.overflowing;
    var zNeedsCorrection = targetNeedsCorrection(zTarget, object3D.scale.z);

    return {
      x: xTarget,
      y: yTarget,
      z: zTarget,
      axes: {
        x: buildAxisDiagnostics(xTarget),
        y: buildAxisDiagnostics(Object.assign({ currentHeight: measurements.peakHeight }, yTarget)),
        z: buildAxisDiagnostics(zTarget)
      },
      needsCorrection: xNeedsCorrection || yNeedsCorrection || zNeedsCorrection,
      compromised: xTarget.compromised || yTarget.compromised || zTarget.compromised,
      outOfBand: !xTarget.withinBand || !yTarget.withinBand || !zTarget.withinBand,
      containmentWidthLimit: containmentLimits.containmentWidthLimit,
      containmentDepthLimit: containmentLimits.containmentDepthLimit,
      minHeight: heightTargets.minHeight,
      maxHeight: heightTargets.maxHeight,
      heightOverflow: !!hardHeightGuard.overflowing,
      heightRatio: hardHeightGuard.heightRatio,
      hardHeightGuardTargetY: hardHeightGuard.targetY,
      hardHeightGuardCompromised: !!hardHeightGuard.compromised
    };
  }

  // Signature of "the fit currently on screen". It deliberately mirrors what the
  // fit actually uses: the filtered primary/containment bounds, the peak height
  // and the transform.
  //
  // `full` bounds are NOT part of it. They are measured without the auxiliary
  // filter (legends, tooltips, troika labels), so a legend that follows the
  // camera or a label that loads late kept changing the signature forever: the
  // stabilization loop never saw three identical passes, never reached
  // 'steady-fit', and the maintenance tick kept re-fitting the chart every
  // 700 ms — charts that resized forever even once correctly contained.
  function buildMeasurementSignature(measurements, object3D) {
    if (!measurements || !measurements.primary || !object3D) {
      return null;
    }

    var primary = measurements.primary;
    var containment = measurements.containment || primary;
    var peakHeight = Number.isFinite(measurements.peakHeight) ? measurements.peakHeight : null;

    return [
      toFixedNumber(primary.size.x),
      toFixedNumber(primary.size.y),
      toFixedNumber(primary.size.z),
      toFixedNumber(containment.size.x),
      toFixedNumber(containment.size.y),
      toFixedNumber(containment.size.z),
      toFixedNumber(peakHeight),
      toFixedNumber(object3D.scale.x),
      toFixedNumber(object3D.scale.y),
      toFixedNumber(object3D.scale.z),
      toFixedNumber(object3D.position.x),
      toFixedNumber(object3D.position.y),
      toFixedNumber(object3D.position.z)
    ].join('|');
  }

  function createPidAxisState() {
    return {
      integral: 0,
      lastError: 0,
      initialized: false
    };
  }

  function createPidControllerState() {
    return {
      active: false,
      stableTicks: 0,
      axes: {
        x: createPidAxisState(),
        y: createPidAxisState(),
        z: createPidAxisState()
      }
    };
  }

  function resetPidAxisState(axisState) {
    if (!axisState) {
      return;
    }
    axisState.integral = 0;
    axisState.lastError = 0;
    axisState.initialized = false;
  }

  function stepPidAxis(axisState, currentValue, targetValue, dtSeconds, profile) {
    if (!axisState || !Number.isFinite(currentValue) || !Number.isFinite(targetValue) || !Number.isFinite(dtSeconds) || dtSeconds <= 0 || !profile) {
      return {
        nextValue: currentValue,
        changed: false,
        stable: true,
        error: 0
      };
    }

    var error = targetValue - currentValue;
    // The dead zone is RELATIVE to the current scale (with the absolute value
    // as a floor): a fixed epsilon meant 0.1 % of a flat chart's scale (hyper
    // sensitive) but 15 % of boats' 0.01 X scale (numb) — same knob, opposite
    // behaviour per chart.
    var epsilon = Math.max(profile.epsilon, Math.abs(currentValue) * PID_PROFILE.relativeEpsilonRatio);
    if (Math.abs(error) <= epsilon) {
      resetPidAxisState(axisState);
      return {
        nextValue: currentValue,
        changed: false,
        stable: true,
        error: error
      };
    }

    axisState.integral = clamp(
      axisState.integral + (error * dtSeconds),
      -profile.integralLimit,
      profile.integralLimit
    );
    var derivative = axisState.initialized
      ? ((error - axisState.lastError) / Math.max(dtSeconds, 0.0001))
      : 0;
    axisState.lastError = error;
    axisState.initialized = true;

    var velocity = (profile.kp * error) + (profile.ki * axisState.integral) + (profile.kd * derivative);
    velocity = clamp(velocity, -profile.maxVelocity, profile.maxVelocity);

    var nextValue = currentValue + (velocity * dtSeconds);
    if ((error > 0 && nextValue > targetValue) || (error < 0 && nextValue < targetValue)) {
      nextValue = targetValue;
    }

    return {
      nextValue: nextValue,
      changed: Math.abs(nextValue - currentValue) > 0.0001,
      stable: false,
      error: error
    };
  }

  function computeAnchorOffset(measurements, data, surfaceLift) {
    if (!measurements || !isFiniteBoundsInfo(measurements.full) || !isFiniteBoundsInfo(measurements.primary) || !data) {
      return null;
    }
    var lift = Number.isFinite(surfaceLift) ? Math.max(0, surfaceLift) : 0;
    var tableTopY = getTableTopY(data) + lift;

    return {
      deltaX: data.anchorX - measurements.primary.center.x,
      deltaY: tableTopY - measurements.primary.bounds.min.y,
      deltaZ: data.anchorZ - measurements.primary.center.z
    };
  }

  function buildTabletopAnchorDiagnostics(measurements, data, surfaceLift) {
    if (!measurements || !isFiniteBoundsInfo(measurements.primary) || !data) {
      return null;
    }
    var lift = Number.isFinite(surfaceLift) ? Math.max(0, surfaceLift) : 0;
    // Report against the chart's OWN anchor target: a chart that declares a
    // surface lift is correctly placed above the plane, not misaligned.
    var tableTopY = getTableTopY(data) + lift;
    var primaryMinY = measurements.primary.bounds.min.y;
    return {
      tableTopY: toFixedNumber(tableTopY),
      surfaceLift: toFixedNumber(lift),
      primaryMinY: toFixedNumber(primaryMinY),
      deltaY: toFixedNumber(tableTopY - primaryMinY),
      epsilon: toFixedNumber(Number.isFinite(data.tabletopAnchorEpsilon) ? data.tabletopAnchorEpsilon : DEFAULTS.tabletopAnchorEpsilon),
      deadbandY: toFixedNumber(Number.isFinite(data.tabletopAnchorDeadbandY) ? data.tabletopAnchorDeadbandY : DEFAULTS.tabletopAnchorDeadbandY),
      surfaceOffsetY: toFixedNumber(Number.isFinite(data.tableTopSurfaceOffsetY) ? data.tableTopSurfaceOffsetY : DEFAULTS.tableTopSurfaceOffsetY)
    };
  }

// == analysisTableRuntime.js | containmentComponentCore (assembled per manifest.json; see COMPONENTS.md) ==
  var componentDefinition = {
    schema: {
      enabled: { default: true },
      targetWidth: { type: 'number', default: DEFAULTS.targetWidth },
      targetHeight: { type: 'number', default: DEFAULTS.targetHeight },
      targetDepth: { type: 'number', default: DEFAULTS.targetDepth },
      anchorX: { type: 'number', default: DEFAULTS.anchorX },
      anchorY: { type: 'number', default: DEFAULTS.anchorY },
      anchorZ: { type: 'number', default: DEFAULTS.anchorZ },
      tableTopSurfaceOffsetY: { type: 'number', default: DEFAULTS.tableTopSurfaceOffsetY },
      tabletopAnchorEpsilon: { type: 'number', default: DEFAULTS.tabletopAnchorEpsilon },
      tabletopAnchorDeadbandY: { type: 'number', default: DEFAULTS.tabletopAnchorDeadbandY },
      retries: { type: 'int', default: DEFAULTS.retries },
      retryDelayMs: { type: 'int', default: DEFAULTS.retryDelayMs },
      tableTopPadding: { type: 'number', default: DEFAULTS.tableTopPadding },
      bootstrapPlanarMaxRatio: { type: 'number', default: DEFAULTS.bootstrapPlanarMaxRatio },
      minPlanarOccupancyRatio: { type: 'number', default: DEFAULTS.minPlanarOccupancyRatio },
      maxPlanarOccupancyRatio: { type: 'number', default: DEFAULTS.maxPlanarOccupancyRatio },
      heightBandMinRatio: { type: 'number', default: DEFAULTS.heightBandMinRatio },
      heightBandMaxRatio: { type: 'number', default: DEFAULTS.heightBandMaxRatio },
      tableEdgeMargin: { type: 'number', default: DEFAULTS.tableEdgeMargin },
      yScaleMin: { type: 'number', default: DEFAULTS.yScaleMin },
      yScaleMax: { type: 'number', default: DEFAULTS.yScaleMax },
      containmentToleranceRatio: { type: 'number', default: DEFAULTS.containmentToleranceRatio },
      containmentMaxIterations: { type: 'int', default: DEFAULTS.containmentMaxIterations },
      containmentCheckMs: { type: 'int', default: DEFAULTS.containmentCheckMs },
      periodicContainmentEnabled: { default: DEFAULTS.periodicContainmentEnabled },
      renormalizeDebounceMs: { type: 'int', default: DEFAULTS.renormalizeDebounceMs },
      stabilizationCheckMs: { type: 'int', default: DEFAULTS.stabilizationCheckMs },
      stabilizationMaxChecks: { type: 'int', default: DEFAULTS.stabilizationMaxChecks },
      stabilizationStablePasses: { type: 'int', default: DEFAULTS.stabilizationStablePasses },
      transformTransitionMs: { type: 'int', default: DEFAULTS.transformTransitionMs },
      hardHeightGuardEnabled: { default: DEFAULTS.hardHeightGuardEnabled },
      heightUnderflowCorrectionEnabled: { default: DEFAULTS.heightUnderflowCorrectionEnabled },
      planarUnderflowCorrectionEnabled: { default: DEFAULTS.planarUnderflowCorrectionEnabled }
    },

    // A-Frame can expose the component instance (and external callers like
    // renormalizeAll can reach it) before init() has run — e.g. while the
    // entity is still loading. Every public entry point funnels through this
    // idempotent state bootstrap so a pre-init call works instead of
    // corrupting counters (a NaN normalization generation used to permanently
    // wedge tryNormalize's generation check).
    ensureRuntimeState: function () {
      if (this.runtimeStateReady) {
        return;
      }
      this.runtimeStateReady = true;
      this.retryCount = 0;
      this.retryTimer = null;
      this.stabilizationTimer = null;
      this.stabilizationChecksRemaining = 0;
      this.stabilizationStableCount = 0;
      this.steadyControllerTimer = null;
      this.lastMeasurementSignature = null;
      // Signature of the fit currently on screen. Unlike lastMeasurementSignature
      // (owned by the stabilization loop, and cleared on steady-fit) this one
      // survives so renormalize() can tell "already fitted, nothing changed"
      // from a real re-fit request.
      this.normalizedSignature = null;
      this.lastRenormalizeRequestAt = 0;
      this.nextContainmentCheckAt = 0;
      this.baseScale = null;
      this.normalized = false;
      this.nextInvalidTransformWarnAt = 0;
      this.nextMinimumCompromisedWarnAt = 0;
      this.normalizationGeneration = 0;
      this.lastStableTransform = null;
      this.lastNormalizationIssue = null;
      this.lastSuccessfulNormalizeAt = 0;
      this.pendingRenormalizeReason = null;
      this.dataTransitionActive = false;
      this.dataTransitionReason = '';
      this.containmentTransition = { active: false, reason: '', startedAt: 0, duration: 0 };
      this.containmentTransitionTimer = null;
      this.lastHardHeightGuardAt = 0;
      this.renderPhase = 'waiting-geometry';
      this.pidController = createPidControllerState();
      // Terminal state: once the fit converged, the component goes quiet — no
      // per-frame work, only the periodic settled watch. See enterSettledState.
      this.settled = false;
      this.settledReference = null;
      this.settledDriftStreak = 0;
    },

    init: function () {
      this.ensureRuntimeState();
      this.onComponentChangedBound = this.onComponentChanged.bind(this);
      this.onGeometryReadyBound = this.onGeometryReady.bind(this);

      if (!this.data.enabled) {
        return;
      }

      this.ensureInitialPlacement();
      this.el.addEventListener('componentchanged', this.onComponentChangedBound);
      this.el.addEventListener('child-attached', this.onGeometryReadyBound);
      this.el.addEventListener('object3dset', this.onGeometryReadyBound);

      this.tryNormalize('init', this.bumpNormalizationGeneration());
    },

    markWaitingGeometry: function (reason, generation, details) {
      this.renderPhase = 'waiting-geometry';
      this.normalized = false;
      // The fit on screen is no longer valid: drop its signature so the next
      // renormalize re-fits instead of recognising a stale one.
      this.normalizedSignature = null;
      this.unsettle('waiting-geometry');
      this.deactivateSteadyController();
      this.lastNormalizationIssue = {
        reason: reason || 'waiting-geometry',
        details: details || null,
        retryCount: this.retryCount,
        generation: generation,
        at: Date.now()
      };
      if (this.el && this.el.object3D) {
        if (this.lastStableTransform) {
          restoreTransform(this.el.object3D, this.lastStableTransform);
        }
        this.el.object3D.visible = true;
      }
      scheduleTableDiagnosticsRefresh(reason || 'waiting-geometry');
    },

    captureStableTransform: function () {
      if (!this.el || !this.el.object3D) {
        return;
      }
      this.lastStableTransform = cloneTransform(this.el.object3D) || this.lastStableTransform;
    },

    cancelContainmentTransition: function () {
      if (this.containmentTransitionTimer) {
        clearTimeout(this.containmentTransitionTimer);
        this.containmentTransitionTimer = null;
      }
      if (this.el && this.el.removeAttribute) {
        this.el.removeAttribute('animation__codexr_containment_position');
        this.el.removeAttribute('animation__codexr_containment_scale');
      }
      if (this.containmentTransition) {
        this.containmentTransition.active = false;
      }
    },

    startContainmentTransition: function (fromTransform, toTransform, reason) {
      var duration = Math.max(0, Number.isFinite(this.data.transformTransitionMs) ? this.data.transformTransitionMs : DEFAULTS.transformTransitionMs);
      if (!this.el || !this.el.setAttribute || duration <= 0 || !transformsDiffer(fromTransform, toTransform)) {
        return false;
      }

      this.cancelContainmentTransition();
      this.containmentTransition = {
        active: true,
        reason: reason || 'containment-transition',
        startedAt: Date.now(),
        duration: duration
      };
      this.el.setAttribute('animation__codexr_containment_position', {
        property: 'position',
        from: formatVector3Like(fromTransform.position),
        to: formatVector3Like(toTransform.position),
        dur: duration,
        easing: 'easeInOutCubic'
      });
      this.el.setAttribute('animation__codexr_containment_scale', {
        property: 'scale',
        from: formatVector3Like(fromTransform.scale),
        to: formatVector3Like(toTransform.scale),
        dur: duration,
        easing: 'easeInOutCubic'
      });

      var self = this;
      this.containmentTransitionTimer = setTimeout(function () {
        self.containmentTransitionTimer = null;
        if (self.containmentTransition) {
          self.containmentTransition.active = false;
        }
        if (self.el && self.el.object3D && toTransform) {
          restoreTransform(self.el.object3D, toTransform);
          self.syncTransformAttributes();
          self.captureStableTransform();
        }
      }, duration);
      return true;
    },

    warnInvalidTransform: function (reason, details) {
      var now = Date.now();
      if (now < this.nextInvalidTransformWarnAt) {
        return;
      }
      this.nextInvalidTransformWarnAt = now + 2000;
      console.warn('[CodeXR][AnalysisTable] Skipping invalid transform state:', {
        reason: reason,
        details: details || null
      });
    },

    warnMinimumCompromised: function (details) {
      var now = Date.now();
      if (now < this.nextMinimumCompromisedWarnAt) {
        return;
      }
      this.nextMinimumCompromisedWarnAt = now + 4000;
      resizeTrace('minimum-occupancy-relaxed', details || null);
      console.warn('[CodeXR][AnalysisTable] Minimum occupancy relaxed to preserve containment:', details || null);
    },

    requestRenormalize: function (reason) {
      this.ensureRuntimeState();
      if (this.dataTransitionActive) {
        this.pendingRenormalizeReason = reason || 'chart-data-transition';
        return;
      }
      if (this.containmentTransition && this.containmentTransition.active) {
        this.pendingRenormalizeReason = reason || 'containment-transition-active';
        return;
      }
      var now = Date.now();
      var debounceMs = Math.max(80, this.data.renormalizeDebounceMs || DEFAULTS.renormalizeDebounceMs);
      if ((now - this.lastRenormalizeRequestAt) < debounceMs) {
        return;
      }
      this.lastRenormalizeRequestAt = now;
      this.renormalize(reason || 'componentchanged');
    },

    inspectAxisIssue: function () {
      return inspectInvalidAxisState(this.el);
    },

    getChartStatus: function () {
      this.ensureRuntimeState();
      if (this.dataTransitionActive) {
        return {
          ready: false,
          valid: true,
          stabilized: false,
          geometryState: 'rebuilding',
          reason: 'chart-data-transition',
          message: 'The chart is applying a new dataset.',
          details: {
            phase: this.renderPhase,
            source: this.dataTransitionReason || 'chart-data-transition'
          }
        };
      }
      var axisIssue = this.inspectAxisIssue();
      if (axisIssue) {
        return {
          ready: true,
          valid: false,
          stabilized: false,
          geometryState: 'invalid',
          reason: axisIssue.reason || 'invalid-axis-length',
          message: 'The selected mapping generated invalid axis values.',
          details: axisIssue
        };
      }

      var measurements = this.measureBounds();
      if (!hasUsableMeasurements(measurements)) {
        return {
          ready: false,
          valid: false,
          stabilized: false,
          geometryState: 'rebuilding',
          reason: this.lastNormalizationIssue ? this.lastNormalizationIssue.reason : 'waiting-geometry',
          message: 'The chart is still rebuilding its geometry.',
          details: Object.assign({
            phase: this.renderPhase
          }, this.lastNormalizationIssue || {})
        };
      }

      var chartFitMode = resolveChartFitMode(this.el);
      var correctionState = chartFitMode === 'uniform'
        ? buildUniformCorrectionState(measurements, this.el && this.el.object3D, this.data)
        : buildContainmentCorrectionState(measurements, this.el && this.el.object3D, this.data, chartFitMode);
      var needsCorrection = !!(correctionState && correctionState.needsCorrection);
      var transitionActive = !!(this.containmentTransition && this.containmentTransition.active);
      var heightOverflow = !!(correctionState && correctionState.heightOverflow);
      // Settled is the controller's TERMINAL verdict: the watch already
      // guarantees no hard violation and no persistent drift, so a residual
      // sub-tolerance correction wish must not keep reporting a settled
      // chart as "still correcting".
      var stabilized = (this.settled === true && !transitionActive && !heightOverflow)
        || (this.renderPhase === 'steady-fit'
          && (!this.pidController || !this.pidController.active)
          && !needsCorrection
          && !transitionActive
          && !heightOverflow);
      return {
        ready: true,
        valid: true,
        stabilized: stabilized,
        geometryState: stabilized ? 'stabilized' : 'valid',
        reason: transitionActive
          ? 'containment-transition-active'
          : heightOverflow
          ? 'height-overflow'
          : stabilized
          ? 'ok'
          : needsCorrection
          ? 'containment-correcting'
          : (this.renderPhase === 'steady-fit' ? 'ok' : this.renderPhase),
        details: {
          phase: this.renderPhase,
          transitionActive: transitionActive,
          primaryWidth: toFixedNumber(measurements.primary.size.x),
          primaryHeight: toFixedNumber(measurements.primary.size.y),
          primaryDepth: toFixedNumber(measurements.primary.size.z),
          peakHeight: toFixedNumber(measurements.peakHeight),
          xRatio: correctionState ? toFixedNumber(correctionState.x.ratio) : null,
          yHeight: toFixedNumber(measurements.peakHeight),
          zRatio: correctionState ? toFixedNumber(correctionState.z.ratio) : null,
          needsCorrection: needsCorrection,
          compromised: correctionState ? !!correctionState.compromised : false,
          tabletopAnchor: buildTabletopAnchorDiagnostics(measurements, this.data, resolveChartSurfaceLift(this.el)),
          minPlanar: correctionState ? toFixedNumber(resolveSteadyPlanarRange(this.data).min) : null,
          maxPlanar: correctionState ? toFixedNumber(resolveSteadyPlanarRange(this.data).max) : null,
          minHeight: correctionState ? toFixedNumber(correctionState.minHeight) : null,
          maxHeight: correctionState ? toFixedNumber(correctionState.maxHeight) : null,
          heightOverflow: heightOverflow,
          heightGuardApplied: !!(this.lastHardHeightGuardAt && Date.now() - this.lastHardHeightGuardAt < 1500),
          heightRatio: correctionState ? toFixedNumber(correctionState.heightRatio) : null
        }
      };
    },

    bumpNormalizationGeneration: function () {
      this.normalizationGeneration += 1;
      return this.normalizationGeneration;
    },

    isCurrentGeneration: function (generation) {
      return generation === this.normalizationGeneration;
    },

    onComponentChanged: function (event) {
      if (!event || !event.detail || !this.data.enabled || !this.el || event.target !== this.el) {
        return;
      }
      var name = event.detail.name || '';
      if (typeof name !== 'string') {
        return;
      }
      if (name.indexOf('babia-') === 0 && name !== 'babia-queryjson') {
        this.requestRenormalize('chart-componentchanged:' + name);
      }
    },

    onGeometryReady: function (event) {
      if (!this.data.enabled || !this.el || !event) {
        return;
      }
      if (event.target !== this.el && !(this.el.contains && this.el.contains(event.target))) {
        return;
      }
      this.requestRenormalize(event.type || 'geometry-ready');
    },

    update: function (oldData) {
      if (!oldData) {
        return;
      }

      if (!this.data.enabled) {
        // Disabled means fully off: the steady controller's own setTimeout
        // loop used to survive this (only the tick stopped).
        this.stopStabilizationLoop();
        this.deactivateSteadyController();
        this.unsettle('containment-disabled');
        return;
      }

      // Every key that feeds a fit computation; a change re-fits, the rest of
      // the schema (debug/timing knobs) does not.
      var refitKeys = [
        'targetWidth', 'targetHeight', 'targetDepth',
        'anchorX', 'anchorY', 'anchorZ',
        'tableTopSurfaceOffsetY', 'tabletopAnchorEpsilon', 'tableTopPadding',
        'bootstrapPlanarMaxRatio', 'minPlanarOccupancyRatio', 'maxPlanarOccupancyRatio',
        'heightBandMinRatio', 'heightBandMaxRatio',
        'tableEdgeMargin', 'yScaleMin', 'yScaleMax',
        'containmentToleranceRatio',
        'stabilizationCheckMs', 'stabilizationMaxChecks', 'stabilizationStablePasses',
        'heightUnderflowCorrectionEnabled', 'planarUnderflowCorrectionEnabled',
        'hardHeightGuardEnabled'
      ];
      var self = this;
      var needsRefit = refitKeys.some(function (key) {
        return oldData[key] !== self.data[key];
      });
      if (needsRefit) {
        this.ensureInitialPlacement();
        this.renormalize('update');
      }
    },

    tick: function (time, timeDelta) {
      if (
        !this.data.enabled
        || this.dataTransitionActive
        || !this.normalized
        || !this.el
        || !this.el.object3D
      ) {
        return;
      }

      if (!isFiniteVector3Like(this.el.object3D.position) || !isFiniteVector3Like(this.el.object3D.scale)) {
        this.warnInvalidTransform('tick-non-finite-object3d', {
          position: this.el.object3D.position,
          scale: this.el.object3D.scale
        });
        this.renormalize('tick-non-finite-object3d');
        return;
      }

      // Settled is TERMINAL: no per-frame measuring, no per-frame guard —
      // measuring bounds and running the hard guard at 60-90 Hz was most of
      // the micro-resize churn. Everything below the periodic gate is all a
      // settled chart ever does.
      if (!this.settled) {
        var tickMeasurements = this.measureBounds();
        if (tickMeasurements && this.applyHardHeightGuard(tickMeasurements, 'tick-hard-height-guard')) {
          return;
        }

        if (this.containmentTransition && this.containmentTransition.active) {
          return;
        }

        if (this.renderPhase === 'steady-fit' && this.pidController && this.pidController.active) {
          this.runSteadyControllerStep('tick', timeDelta);
        }
      }

      if (!this.data.periodicContainmentEnabled) {
        return;
      }

      if (time < this.nextContainmentCheckAt) {
        return;
      }

      this.nextContainmentCheckAt = time + Math.max(120, this.data.containmentCheckMs);
      // A re-fit requested while the chart was hidden is honoured on the first
      // periodic pass with the chart visible again (a no-op unless its content
      // really changed — the signature guard filters it).
      if (this.pendingRenormalizeReason && isObject3DVisibleInScene(this.el)) {
        var pendingReason = this.pendingRenormalizeReason;
        this.pendingRenormalizeReason = null;
        this.renormalize(pendingReason);
        return;
      }
      if (this.settled) {
        this.runSettledWatch('tick-settled-watch');
      } else if (!(this.renderPhase === 'steady-fit' && this.pidController && this.pidController.active)) {
        this.runMaintenancePass('tick');
      }
      // Keep the table's warning surface converging to the live chart state:
      // a stale message can survive at most one containment check interval.
      scheduleTableDiagnosticsRefresh('tick-maintenance');
    },

    remove: function () {
      if (this.onComponentChangedBound && this.el && this.el.removeEventListener) {
        this.el.removeEventListener('componentchanged', this.onComponentChangedBound);
      }
      if (this.onGeometryReadyBound && this.el && this.el.removeEventListener) {
        this.el.removeEventListener('child-attached', this.onGeometryReadyBound);
        this.el.removeEventListener('object3dset', this.onGeometryReadyBound);
      }

      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }

      this.deactivateSteadyController();
      this.stopStabilizationLoop();
      this.cancelContainmentTransition();
      // Re-evaluate the shared warning surface without this chart.
      scheduleTableDiagnosticsRefresh('containment-removed');
    },

    beginDataTransition: function (reason) {
      this.ensureRuntimeState();
      this.dataTransitionActive = true;
      this.dataTransitionReason = reason || 'chart-data-transition';
      this.pendingRenormalizeReason = this.dataTransitionReason;
      this.bumpNormalizationGeneration();
      this.captureStableTransform();
      this.cancelContainmentTransition();
      this.deactivateSteadyController();
      this.stopStabilizationLoop();
      this.unsettle(this.dataTransitionReason);
      this.renderPhase = 'waiting-geometry';
      scheduleTableDiagnosticsRefresh('chart-data-transition-start');
      return true;
    },

    finishDataTransition: function (reason) {
      this.ensureRuntimeState();
      this.dataTransitionActive = false;
      this.dataTransitionReason = '';
      this.normalizedSignature = null;
      this.lastMeasurementSignature = null;
      this.pendingRenormalizeReason = null;
      this.renormalize(reason || 'chart-data-transition-finished');
      return true;
    },

    cancelDataTransition: function (reason) {
      this.ensureRuntimeState();
      if (!this.dataTransitionActive) {
        return false;
      }
      this.bumpNormalizationGeneration();
      this.dataTransitionActive = false;
      this.dataTransitionReason = '';
      this.pendingRenormalizeReason = null;
      this.cancelContainmentTransition();
      this.deactivateSteadyController();
      this.stopStabilizationLoop();
      if (this.el?.object3D && this.lastStableTransform) {
        restoreTransform(this.el.object3D, this.lastStableTransform);
        this.syncTransformAttributes();
      }
      this.renderPhase = this.normalized ? 'steady-fit' : 'waiting-geometry';
      scheduleTableDiagnosticsRefresh(reason || 'chart-data-transition-cancelled');
      return true;
    },

    ensureInitialPlacement: function () {
      this.el.setAttribute('position', this.data.anchorX + ' ' + this.data.anchorY + ' ' + this.data.anchorZ);
    },

// == analysisTableRuntime.js | measurementAndScaling (assembled per manifest.json; see COMPONENTS.md) ==
    // The base scale is per CHART TYPE: templates ship very different ones
    // (1.5 for the flat charts, 0.01/0.05/0.01 for boats). Capturing it once
    // meant that after a chart switch every reset restored the PREVIOUS type's
    // scale, and the fit had to climb back from a wrong starting point.
    ensureBaseScale: function () {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !object3D.scale) {
        return;
      }

      var chartId = this.el.getAttribute?.('data-codexr-active-chart-id') || '';
      if (!this.baseScale || this.baseScaleChartId !== chartId) {
        this.baseScale = cloneScale(object3D);
        this.baseScaleChartId = chartId;
      }
    },

    resetToBaseScale: function () {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !object3D.scale || !this.baseScale) {
        return false;
      }

      object3D.scale.set(this.baseScale.x, this.baseScale.y, this.baseScale.z);
      object3D.updateMatrixWorld(true);
      return true;
    },

    measureBounds: function () {
      var three = root.THREE || (root.AFRAME && root.AFRAME.THREE);
      var object3D = this.el && this.el.object3D;
      if (!object3D || !three || !three.Box3 || !three.Vector3) {
        return null;
      }

      object3D.updateMatrixWorld(true);
      var full = buildRenderableBounds(three, object3D) || buildBounds(three, object3D);
      if (!isFiniteBoundsInfo(full)) {
        return null;
      }

      var contentCandidate = buildContentBounds(three, object3D);
      var containmentCandidate = buildContainmentBounds(three, object3D);
      var containment = shouldUseDerivedBounds(containmentCandidate, full) ? containmentCandidate : full;
      var content = shouldUseContentBounds(contentCandidate, containment) ? contentCandidate : null;
      var primary = content || containment;
      var heightReference = content || primary;
      var peakHeight = computePeakHeight(heightReference, this.data);

      return {
        full: full,
        containment: containment,
        content: content,
        primary: primary,
        peakHeight: peakHeight
      };
    },

    applyAnchorPlacement: function (measurements) {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !measurements || !isFiniteBoundsInfo(measurements.full) || !isFiniteBoundsInfo(measurements.primary)) {
        return false;
      }

      var offset = computeAnchorOffset(measurements, this.data, resolveChartSurfaceLift(this.el));
      if (!offset) {
        return false;
      }

      if (!Number.isFinite(offset.deltaX) || !Number.isFinite(offset.deltaY) || !Number.isFinite(offset.deltaZ)) {
        this.warnInvalidTransform('non-finite-anchor-target', {
          deltaX: offset.deltaX,
          deltaY: offset.deltaY,
          deltaZ: offset.deltaZ
        });
        return false;
      }

      var anchorDeadbandY = Math.max(0, Number.isFinite(this.data.tabletopAnchorDeadbandY) ? this.data.tabletopAnchorDeadbandY : DEFAULTS.tabletopAnchorDeadbandY);
      if (Math.abs(offset.deltaY) <= anchorDeadbandY) {
        offset.deltaY = 0;
      }

      var moved = Math.abs(offset.deltaX) > 0.0005
        || Math.abs(offset.deltaY) > 0.0005
        || Math.abs(offset.deltaZ) > 0.0005;

      if (!moved) {
        return false;
      }

      object3D.position.set(
        object3D.position.x + offset.deltaX,
        object3D.position.y + offset.deltaY,
        object3D.position.z + offset.deltaZ
      );
      object3D.updateMatrixWorld(true);
      return true;
    },

    syncTransformAttributes: function () {
      var object3D = this.el && this.el.object3D;
      if (!object3D) {
        return;
      }

      if (!isFiniteVector3Like(object3D.position) || !isFiniteVector3Like(object3D.scale)) {
        this.warnInvalidTransform('sync-transform-non-finite', {
          position: object3D.position,
          scale: object3D.scale
        });
        return;
      }

      this.el.setAttribute(
        'position',
        toTransformNumber(object3D.position.x) + ' '
          + toTransformNumber(object3D.position.y) + ' '
          + toTransformNumber(object3D.position.z)
      );
      this.el.setAttribute(
        'scale',
        toTransformNumber(object3D.scale.x) + ' '
          + toTransformNumber(object3D.scale.y) + ' '
          + toTransformNumber(object3D.scale.z)
      );
    },

    applyHardHeightGuard: function (measurements, source) {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !this.data.hardHeightGuardEnabled || !hasUsableMeasurements(measurements)) {
        return false;
      }

      // A y-only emergency squash would distort a uniform-fit chart (and, on
      // a rotated one, would not even act on world height): shrink all three
      // axes by the same factor instead.
      if (resolveChartFitMode(this.el) === 'uniform') {
        var uniformState = computeUniformFitState(measurements, object3D, this.data);
        if (!uniformState || !uniformState.heightOverflow) {
          return false;
        }
        if (this.containmentTransition && this.containmentTransition.active) {
          this.cancelContainmentTransition();
        }
        var applied = this.applyScaleFactors(uniformState.factor, uniformState.factor, uniformState.factor);
        if (!applied) {
          return false;
        }
        var uniformMeasurements = this.measureBounds();
        if (uniformMeasurements) {
          this.applyAnchorPlacement(uniformMeasurements);
        }
        this.syncTransformAttributes();
        this.lastHardHeightGuardAt = Date.now();
        if (this.pidController) {
          this.pidController.stableTicks = 0;
        }
        debugLog('hard-height-guard-uniform', {
          source: source || 'height-guard',
          factor: toFixedNumber(uniformState.factor),
          peakHeight: toFixedNumber(measurements.peakHeight)
        });
        return true;
      }

      var bandTargets = resolveHeightBandTargets(this.data);
      var guard = computeHardHeightGuardTarget(
        measurements.peakHeight,
        object3D.scale.y,
        bandTargets,
        Math.max(0.001, this.data.yScaleMin),
        Math.max(this.data.yScaleMin + 0.001, this.data.yScaleMax),
        this.data.hardHeightGuardEnabled !== false,
        this.data.containmentToleranceRatio
      );

      if (!guard || !guard.overflowing) {
        return false;
      }

      if (this.containmentTransition && this.containmentTransition.active) {
        this.cancelContainmentTransition();
      }

      if (!guard.changed) {
        this.lastHardHeightGuardAt = Date.now();
        debugLog('hard-height-guard-compromised', {
          source: source || 'height-guard',
          peakHeight: toFixedNumber(measurements.peakHeight),
          maxHeight: toFixedNumber(guard.maxHeight),
          heightRatio: toFixedNumber(guard.heightRatio),
          yScale: toFixedNumber(object3D.scale.y)
        });
        return false;
      }

      object3D.scale.y = guard.targetY;
      object3D.updateMatrixWorld(true);

      var nextMeasurements = this.measureBounds();
      if (nextMeasurements) {
        this.applyAnchorPlacement(nextMeasurements);
      }
      this.syncTransformAttributes();
      this.lastHardHeightGuardAt = Date.now();
      if (this.pidController) {
        this.pidController.stableTicks = 0;
        resetPidAxisState(this.pidController.axes.y);
      }

      debugLog('hard-height-guard-applied', {
        source: source || 'height-guard',
        peakHeight: toFixedNumber(measurements.peakHeight),
        maxHeight: toFixedNumber(guard.maxHeight),
        heightRatio: toFixedNumber(guard.heightRatio),
        targetY: toFixedNumber(guard.targetY),
        yScale: toFixedNumber(object3D.scale.y)
      });
      return true;
    },

    applyScaleFactors: function (xFactor, yFactor, zFactor) {
      var object3D = this.el && this.el.object3D;
      if (!object3D) {
        return false;
      }

      var nextX = object3D.scale.x * (Number.isFinite(xFactor) ? xFactor : 1);
      var nextY = clamp(object3D.scale.y * yFactor, Math.max(0.001, this.data.yScaleMin), Math.max(this.data.yScaleMin + 0.001, this.data.yScaleMax));
      var nextZ = object3D.scale.z * (Number.isFinite(zFactor) ? zFactor : (Number.isFinite(xFactor) ? xFactor : 1));

      if (!Number.isFinite(nextX) || !Number.isFinite(nextY) || !Number.isFinite(nextZ) || nextX <= 0 || nextY <= 0 || nextZ <= 0) {
        this.warnInvalidTransform('apply-scale-invalid-target', {
          nextX: nextX,
          nextY: nextY,
          nextZ: nextZ,
          xFactor: xFactor,
          zFactor: zFactor,
          yFactor: yFactor
        });
        return false;
      }

      var changed = Math.abs(nextX - object3D.scale.x) > 0.0001
        || Math.abs(nextY - object3D.scale.y) > 0.0001
        || Math.abs(nextZ - object3D.scale.z) > 0.0001;

      if (!changed) {
        return false;
      }

      object3D.scale.set(nextX, nextY, nextZ);
      object3D.updateMatrixWorld(true);
      return true;
    },

    // Whether inflating a planar axis raises the measured peak (rotated
    // geometry). The probe MUTATES the scale (inflate, measure, restore), so it
    // is cached per normalization generation: probing twice per controller
    // step touched the transform 4× per 140 ms for an answer that only changes
    // when the geometry itself changes.
    axisContributesToPeakHeight: function (axis, currentHeight) {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !object3D.scale || !Number.isFinite(object3D.scale[axis]) || object3D.scale[axis] <= 0 || !Number.isFinite(currentHeight)) {
        return false;
      }

      if (!this.axisPeakProbeCache) {
        this.axisPeakProbeCache = {};
      }
      var cached = this.axisPeakProbeCache[axis];
      if (cached && cached.generation === this.normalizationGeneration) {
        return cached.value;
      }

      var originalScale = object3D.scale[axis];
      object3D.scale[axis] = originalScale * 1.08;
      object3D.updateMatrixWorld(true);
      var probeMeasurements = this.measureBounds();
      object3D.scale[axis] = originalScale;
      object3D.updateMatrixWorld(true);

      var contributes = false;
      if (probeMeasurements && Number.isFinite(probeMeasurements.peakHeight)) {
        var minimumDelta = Math.max(0.01, Math.abs(currentHeight) * 0.02);
        contributes = probeMeasurements.peakHeight > currentHeight + minimumDelta;
      }
      this.axisPeakProbeCache[axis] = { generation: this.normalizationGeneration, value: contributes };
      return contributes;
    },

    constrainPlanarTargetForMeasuredHeight: function (axis, target, currentScale, yTarget, measurements, heightTargets) {
      if (!target || !measurements || !heightTargets || !this.axisContributesToPeakHeight(axis, measurements.peakHeight)) {
        return target;
      }
      return constrainPlanarTargetForHeightCompromise(
        target,
        currentScale,
        yTarget,
        measurements.peakHeight,
        heightTargets.maxHeight
      );
    },

    activateSteadyController: function () {
      if (!this.pidController) {
        this.pidController = createPidControllerState();
      }
      this.pidController.active = true;
      this.pidController.stableTicks = 0;
      // A live controller means the fit is not final: leave the settled state
      // (no-op if it was never entered).
      this.unsettle('steady-controller-activate');
      resetPidAxisState(this.pidController.axes.x);
      resetPidAxisState(this.pidController.axes.y);
      resetPidAxisState(this.pidController.axes.z);
      this.scheduleSteadyControllerStep('steady-controller');
    },

    deactivateSteadyController: function () {
      if (this.steadyControllerTimer) {
        clearTimeout(this.steadyControllerTimer);
        this.steadyControllerTimer = null;
      }
      if (!this.pidController) {
        this.pidController = createPidControllerState();
      }
      this.pidController.active = false;
      this.pidController.stableTicks = 0;
      resetPidAxisState(this.pidController.axes.x);
      resetPidAxisState(this.pidController.axes.y);
      resetPidAxisState(this.pidController.axes.z);
    },

    scheduleSteadyControllerStep: function (source) {
      var self = this;
      if (!this.pidController || !this.pidController.active || this.steadyControllerTimer) {
        return;
      }
      this.steadyControllerTimer = setTimeout(function () {
        self.steadyControllerTimer = null;
        if (!self.pidController || !self.pidController.active || self.renderPhase !== 'steady-fit') {
          return;
        }
        self.runSteadyControllerStep(source || 'steady-controller', self.data.stabilizationCheckMs || DEFAULTS.stabilizationCheckMs);
        self.scheduleSteadyControllerStep(source || 'steady-controller');
      }, Math.max(50, this.data.stabilizationCheckMs || DEFAULTS.stabilizationCheckMs));
    },

    resolveControllerDtSeconds: function (dtMs) {
      var fallbackMs = Math.max(16, this.data.stabilizationCheckMs || DEFAULTS.stabilizationCheckMs);
      var resolvedMs = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : fallbackMs;
      return clamp(resolvedMs / 1000, PID_PROFILE.dtMin, PID_PROFILE.dtMax);
    },

    applyEmergencyContainment: function (measurements, xTarget, yTarget, zTarget, source) {
      var object3D = this.el && this.el.object3D;
      if (!object3D || !measurements || !xTarget || !yTarget || !zTarget) {
        return false;
      }

      var needsXGuard = xTarget.overflowing || xTarget.underflowing;
      var needsZGuard = zTarget.overflowing || zTarget.underflowing;
      var needsPlanarGuard = needsXGuard || needsZGuard;
      var needsHeightGuard = !yTarget.withinBand;
      if (!needsPlanarGuard && !needsHeightGuard) {
        return false;
      }

      var nextX = needsXGuard
        ? xTarget.targetScale
        : object3D.scale.x;
      var nextZ = needsZGuard
        ? zTarget.targetScale
        : object3D.scale.z;
      var nextY = needsHeightGuard ? yTarget.targetScale : object3D.scale.y;

      if (yTarget.overflowing && yTarget.compromised && Number.isFinite(measurements.peakHeight) && measurements.peakHeight > 0) {
        var heightFactor = (Number.isFinite(yTarget.setpointHeight) ? yTarget.setpointHeight : measurements.peakHeight)
          / measurements.peakHeight;
        if (Number.isFinite(heightFactor) && heightFactor > 0 && heightFactor < 1) {
          var dampedHeightFactor = Math.max(0.000001, heightFactor * 0.985);
          if (this.axisContributesToPeakHeight('x', measurements.peakHeight)) {
            nextX = Math.min(nextX, object3D.scale.x * dampedHeightFactor);
          }
          if (this.axisContributesToPeakHeight('z', measurements.peakHeight)) {
            nextZ = Math.min(nextZ, object3D.scale.z * dampedHeightFactor);
          }
        }
      }

      if (!Number.isFinite(nextX) || !Number.isFinite(nextY) || !Number.isFinite(nextZ) || nextX <= 0 || nextY <= 0 || nextZ <= 0) {
        this.warnInvalidTransform('emergency-containment-invalid-target', {
          source: source || 'steady-fit',
          nextX: nextX,
          nextY: nextY,
          nextZ: nextZ
        });
        return false;
      }

      var changed = Math.abs(nextX - object3D.scale.x) > 0.0001
        || Math.abs(nextY - object3D.scale.y) > 0.0001
        || Math.abs(nextZ - object3D.scale.z) > 0.0001;
      if (!changed) {
        return false;
      }

      object3D.scale.set(nextX, nextY, nextZ);
      object3D.updateMatrixWorld(true);
      var nextMeasurements = this.measureBounds();
      if (nextMeasurements) {
        this.applyAnchorPlacement(nextMeasurements);
      }
      this.syncTransformAttributes();
      if (this.pidController) {
        this.pidController.stableTicks = 0;
        resetPidAxisState(this.pidController.axes.x);
        resetPidAxisState(this.pidController.axes.y);
        resetPidAxisState(this.pidController.axes.z);
      }
      debugLog('emergency-containment-applied', {
        source: source || 'steady-fit',
        xUnderflowing: !!xTarget.underflowing,
        xOverflowing: !!xTarget.overflowing,
        yUnderflowing: !!yTarget.underflowing,
        yOverflowing: !!yTarget.overflowing,
        zUnderflowing: !!zTarget.underflowing,
        zOverflowing: !!zTarget.overflowing,
        xScale: toFixedNumber(object3D.scale.x),
        yScale: toFixedNumber(object3D.scale.y),
        zScale: toFixedNumber(object3D.scale.z)
      });
      return true;
    },

// == analysisTableRuntime.js | steadyController (assembled per manifest.json; see COMPONENTS.md) ==
    // Single-factor actuation for uniform-fit charts (see chartFitProfiles.js):
    // applies the computed factor to all three local axes, re-anchors, and
    // reports whether anything changed. Used by both the bootstrap fit and the
    // steady loop, so a circular chart never goes through per-axis scaling.
    applyUniformFitStep: function (measurements, source) {
      var object3D = this.el && this.el.object3D;

      // A chart switch inherits the PREVIOUS chart's fitted scale, which is
      // usually anisotropic (boats ships y ~7x its planar axes). A purely
      // multiplicative uniform step preserves that ratio forever — spheres
      // stayed stretched into lozenges. Collapse to the smallest axis first
      // (safe against every cap); the cap factor then grows the chart
      // uniformly from true proportions.
      if (object3D && object3D.scale) {
        var minAxis = Math.min(object3D.scale.x, object3D.scale.y, object3D.scale.z);
        var maxAxis = Math.max(object3D.scale.x, object3D.scale.y, object3D.scale.z);
        if (Number.isFinite(minAxis) && minAxis > 0 && (maxAxis - minAxis) > minAxis * 0.02) {
          var equalizedY = clamp(minAxis, Math.max(0.001, this.data.yScaleMin), Math.max(this.data.yScaleMin + 0.001, this.data.yScaleMax));
          object3D.scale.set(minAxis, equalizedY, minAxis);
          object3D.updateMatrixWorld(true);
          var equalizedMeasurements = this.measureBounds();
          if (equalizedMeasurements) {
            this.applyAnchorPlacement(equalizedMeasurements);
          }
          this.syncTransformAttributes();
          debugLog('uniform-fit-equalized', {
            source: source || 'uniform-fit',
            scale: toFixedNumber(minAxis)
          });
          return { converged: false, changed: true, equalized: true };
        }
      }

      var fit = computeUniformFitState(measurements, object3D, this.data);
      if (!fit) {
        return null;
      }
      if (!fit.converged) {
        var applied = this.applyScaleFactors(fit.factor, fit.factor, fit.factor);
        var nextMeasurements = this.measureBounds();
        var moved = nextMeasurements ? this.applyAnchorPlacement(nextMeasurements) : false;
        if (applied || moved) {
          this.syncTransformAttributes();
          this.captureStableTransform();
        }
        debugLog('uniform-fit-step', {
          source: source || 'uniform-fit',
          factor: toFixedNumber(fit.factor),
          widthCap: toFixedNumber(fit.widthCap),
          depthCap: toFixedNumber(fit.depthCap),
          heightCap: toFixedNumber(fit.heightCap)
        });
        fit.changed = applied || moved;
        return fit;
      }
      var anchorMeasurements = this.measureBounds();
      var anchored = anchorMeasurements ? this.applyAnchorPlacement(anchorMeasurements) : false;
      if (anchored) {
        this.syncTransformAttributes();
        this.captureStableTransform();
      }
      fit.changed = anchored;
      return fit;
    },

    runUniformSteadyStep: function (source) {
      var fit = this.applyUniformFitStep(this.measureBounds(), source || 'steady-fit');
      if (!fit) {
        this.markWaitingGeometry('waiting-geometry', this.normalizationGeneration, {
          source: source || 'steady-fit',
          phase: this.renderPhase
        });
        return false;
      }
      if (fit.converged && !fit.changed) {
        this.pidController.stableTicks += 1;
      } else {
        this.pidController.stableTicks = 0;
      }
      if (this.pidController.stableTicks >= PID_PROFILE.stableTicks) {
        this.deactivateSteadyController();
        this.enterSettledState(this.measureBounds());
      } else {
        this.scheduleSteadyControllerStep(source || 'steady-fit');
      }
      return !!fit.changed;
    },

    runSteadyControllerStep: function (source, dtMs) {
      var object3D = this.el && this.el.object3D;
      if (!object3D) {
        return false;
      }

      if (resolveChartFitMode(this.el) === 'uniform') {
        return this.runUniformSteadyStep(source);
      }

      var measurements = this.measureBounds();
      if (!hasUsableMeasurements(measurements)) {
        this.markWaitingGeometry('waiting-geometry', this.normalizationGeneration, {
          source: source || 'steady-fit',
          phase: this.renderPhase
        });
        return false;
      }

      if (this.applyHardHeightGuard(measurements, (source || 'steady-fit') + '-hard-height-guard')) {
        this.scheduleSteadyControllerStep(source || 'steady-fit');
        return true;
      }

      var steadyRange = resolveSteadyPlanarRange(this.data);
      var containmentLimits = computeContainmentLimits(this.data);
      var xTarget = computePlanarAxisTargetScale(
        measurements.primary.size.x,
        measurements.containment.size.x,
        object3D.scale.x,
        containmentLimits.containmentWidthLimit,
        steadyRange,
        this.data.containmentToleranceRatio,
        this.data.planarUnderflowCorrectionEnabled !== false
      );
      var zTarget = computePlanarAxisTargetScale(
        measurements.primary.size.z,
        measurements.containment.size.z,
        object3D.scale.z,
        containmentLimits.containmentDepthLimit,
        steadyRange,
        this.data.containmentToleranceRatio,
        this.data.planarUnderflowCorrectionEnabled !== false
      );
      var heightTargets = resolveHeightBandTargets(this.data);
      var yTarget = computeHeightBandTargetScale(
        measurements.peakHeight,
        object3D.scale.y,
        heightTargets,
        Math.max(0.001, this.data.yScaleMin),
        Math.max(this.data.yScaleMin + 0.001, this.data.yScaleMax),
        this.data.heightUnderflowCorrectionEnabled !== false,
        this.data.containmentToleranceRatio
      ) || createNeutralHeightBandTarget(object3D.scale.y, 'height-unavailable');

      if (!xTarget || !zTarget) {
        return false;
      }

      xTarget = this.constrainPlanarTargetForMeasuredHeight('x', xTarget, object3D.scale.x, yTarget, measurements, heightTargets);
      zTarget = this.constrainPlanarTargetForMeasuredHeight('z', zTarget, object3D.scale.z, yTarget, measurements, heightTargets);

      if (resolveChartFitMode(this.el) === 'planar-uniform') {
        var unified = unifyPlanarTargets(xTarget, zTarget);
        xTarget = unified.x;
        zTarget = unified.z;
      }

      if (this.applyEmergencyContainment(measurements, xTarget, yTarget, zTarget, source || 'steady-fit')) {
        this.scheduleSteadyControllerStep(source || 'steady-fit');
        return true;
      }

      if (xTarget.compromised || zTarget.compromised) {
        this.warnMinimumCompromised({
          source: source || 'steady-fit',
          reason: xTarget.compromised && zTarget.compromised ? 'axis-mixed' : (xTarget.compromised ? xTarget.reason : zTarget.reason),
          xRatio: toFixedNumber(xTarget.ratio),
          zRatio: toFixedNumber(zTarget.ratio),
          xSetpointRatio: toFixedNumber(xTarget.setpointRatio),
          zSetpointRatio: toFixedNumber(zTarget.setpointRatio),
          xTargetScale: toFixedNumber(xTarget.targetScale),
          zTargetScale: toFixedNumber(zTarget.targetScale),
          containmentWidthLimit: toFixedNumber(containmentLimits.containmentWidthLimit),
          containmentDepthLimit: toFixedNumber(containmentLimits.containmentDepthLimit)
        });
      }

      var dtSeconds = this.resolveControllerDtSeconds(dtMs);
      var xStep = stepPidAxis(this.pidController.axes.x, object3D.scale.x, xTarget.targetScale, dtSeconds, PID_PROFILE.planar);
      var yStep = stepPidAxis(this.pidController.axes.y, object3D.scale.y, yTarget.targetScale, dtSeconds, PID_PROFILE.vertical);
      var zStep = stepPidAxis(this.pidController.axes.z, object3D.scale.z, zTarget.targetScale, dtSeconds, PID_PROFILE.planar);

      var changed = false;
      if (
        Number.isFinite(xStep.nextValue)
        && Number.isFinite(yStep.nextValue)
        && Number.isFinite(zStep.nextValue)
        && xStep.nextValue > 0
        && yStep.nextValue > 0
        && zStep.nextValue > 0
      ) {
        changed = Math.abs(xStep.nextValue - object3D.scale.x) > 0.0001
          || Math.abs(yStep.nextValue - object3D.scale.y) > 0.0001
          || Math.abs(zStep.nextValue - object3D.scale.z) > 0.0001;
        if (changed) {
          object3D.scale.set(xStep.nextValue, yStep.nextValue, zStep.nextValue);
          object3D.updateMatrixWorld(true);
        }
      }

      var nextMeasurements = this.measureBounds();
      var moved = nextMeasurements ? this.applyAnchorPlacement(nextMeasurements) : false;
      if (nextMeasurements && hasUsableMeasurements(nextMeasurements)) {
        this.captureStableTransform();
      }
      if (changed || moved) {
        this.syncTransformAttributes();
      }

      if (xStep.stable && yStep.stable && zStep.stable) {
        this.pidController.stableTicks += 1;
      } else {
        this.pidController.stableTicks = 0;
      }

      if (this.pidController.stableTicks >= PID_PROFILE.stableTicks) {
        this.deactivateSteadyController();
        // Converged: go quiet. From here on only the settled watch runs.
        this.enterSettledState(nextMeasurements || measurements);
      } else {
        this.scheduleSteadyControllerStep(source || 'steady-fit');
      }

      debugLog('steady-controller-step', {
        source: source || 'steady-fit',
        xScale: toFixedNumber(object3D.scale.x),
        yScale: toFixedNumber(object3D.scale.y),
        zScale: toFixedNumber(object3D.scale.z),
        xTarget: toFixedNumber(xTarget.targetScale),
        yTarget: toFixedNumber(yTarget.targetScale),
        zTarget: toFixedNumber(zTarget.targetScale),
        stableTicks: this.pidController.stableTicks
      });

      return changed || moved;
    },

    applyBootstrapPlanarFit: function (measurements, source) {
      if (!measurements || !isFiniteBoundsInfo(measurements.primary) || !isFiniteBoundsInfo(measurements.containment)) {
        return false;
      }

      var fitMode = resolveChartFitMode(this.el);
      if (fitMode === 'uniform') {
        var uniformFit = this.applyUniformFitStep(measurements, source || 'bootstrap-uniform');
        return !!(uniformFit && uniformFit.changed);
      }

      var bootstrapScale = computeBootstrapPlanarScale(measurements.primary, measurements.containment, this.data);
      if (!bootstrapScale) {
        return false;
      }

      var xFactor = bootstrapScale.xFactor;
      var zFactor = bootstrapScale.zFactor;
      if (fitMode === 'planar-uniform') {
        // Both planar axes bootstrap to the same SCALE VALUE: the flat axis
        // labels along z and any round geometry follow the binding axis.
        var object3D = this.el && this.el.object3D;
        if (object3D && object3D.scale && object3D.scale.x > 0 && object3D.scale.z > 0) {
          var sharedScale = Math.min(object3D.scale.x * xFactor, object3D.scale.z * zFactor);
          xFactor = sharedScale / object3D.scale.x;
          zFactor = sharedScale / object3D.scale.z;
        }
      }

      var changed = false;
      if (Math.abs(xFactor - 1) > 0.0005 || Math.abs(zFactor - 1) > 0.0005) {
        changed = this.applyScaleFactors(
          clamp(xFactor, fitMode === 'planar-uniform' ? 0.05 : 0.2, fitMode === 'planar-uniform' ? 8 : 4),
          1,
          clamp(zFactor, fitMode === 'planar-uniform' ? 0.05 : 0.2, fitMode === 'planar-uniform' ? 8 : 4)
        );
      }

      if (changed) {
        debugTable('bootstrap-planar-adjusted', [{
          source: source || 'bootstrap',
          xFactor: toFixedNumber(bootstrapScale.xFactor),
          zFactor: toFixedNumber(bootstrapScale.zFactor),
          bootstrapPlanarMaxRatio: toFixedNumber(bootstrapScale.bootstrapPlanarMaxRatio)
        }]);
      }

      return changed;
    },

    enforceHeightBand: function (source) {
      var object3D = this.el && this.el.object3D;
      if (!object3D) {
        return false;
      }

      // Uniform-fit charts never take a y-only correction: the uniform pass
      // (already run by enforceEnvelope via applyBootstrapPlanarFit) owns the
      // height budget without distorting the aspect ratio.
      if (resolveChartFitMode(this.el) === 'uniform') {
        return false;
      }

      var measurements = this.measureBounds();
      if (!measurements || !isFiniteBoundsInfo(measurements.primary)) {
        return false;
      }

      var bandTargets = resolveHeightBandTargets(this.data);
      var result = computeHeightBandScale(
        measurements.peakHeight,
        object3D.scale.y,
        bandTargets,
        Math.max(0.001, this.data.yScaleMin),
        Math.max(this.data.yScaleMin + 0.001, this.data.yScaleMax),
        this.data.heightUnderflowCorrectionEnabled !== false
      );

      if (!result || !result.changed) {
        return false;
      }

      object3D.scale.y = result.targetY;
      object3D.updateMatrixWorld(true);

      var nextMeasurements = this.measureBounds();
      if (nextMeasurements) {
        this.applyAnchorPlacement(nextMeasurements);
      }
      this.syncTransformAttributes();
      debugLog('height-band-adjusted', {
        source: source || 'unknown',
        minHeight: toFixedNumber(bandTargets.minHeight),
        maxHeight: toFixedNumber(bandTargets.maxHeight),
        peakHeight: nextMeasurements ? toFixedNumber(nextMeasurements.peakHeight) : null,
        yScale: toFixedNumber(object3D.scale.y)
      });
      return true;
    },

    enforceEnvelope: function (source) {
      var object3D = this.el && this.el.object3D;
      if (!object3D) {
        return false;
      }

      var maxIterations = Math.max(1, this.data.containmentMaxIterations);
      var changed = false;

      for (var i = 0; i < maxIterations; i += 1) {
        var measurements = this.measureBounds();
      if (!measurements || !isFiniteBoundsInfo(measurements.primary) || !isFiniteBoundsInfo(measurements.containment) || !isFiniteBoundsInfo(measurements.full)) {
        this.warnInvalidTransform('envelope-invalid-bounds', { source: source || 'unknown', iteration: i });
        return changed;
      }

        if (!hasPositiveSize(measurements.primary.size)) {
          return changed;
        }

        // Only bootstrap ever reaches here: in steady-fit runMaintenancePass
        // re-engages the controller instead, and the settled state stops the
        // maintenance entirely.
        var localChanged = this.applyBootstrapPlanarFit(measurements, source || 'bootstrap-visible');

        var nextMeasurements = this.measureBounds();
        var moved = nextMeasurements ? this.applyAnchorPlacement(nextMeasurements) : false;
        changed = changed || localChanged || moved;

        if (!localChanged && !moved) {
          break;
        }
      }

      if (changed) {
        object3D.updateMatrixWorld(true);
        this.syncTransformAttributes();
        debugTable('envelope-adjusted', [{
          source: source || 'unknown',
          scaleX: toFixedNumber(object3D.scale.x),
          scaleY: toFixedNumber(object3D.scale.y),
          scaleZ: toFixedNumber(object3D.scale.z)
        }]);
      }

      return changed;
    },

    runMaintenancePass: function (source) {
      var axisIssue = this.inspectAxisIssue();
      if (axisIssue) {
        this.lastNormalizationIssue = {
          reason: axisIssue.reason || 'invalid-axis-length',
          details: axisIssue,
          retryCount: this.retryCount,
          generation: this.normalizationGeneration,
          at: Date.now()
        };
        resizeTrace('invalid-axis-length-detected', {
          source: source || 'maintenance',
          issue: axisIssue
        });
        return false;
      }
      var guardMeasurements = this.measureBounds();
      if (guardMeasurements && this.applyHardHeightGuard(guardMeasurements, (source || 'maintenance') + '-hard-height-guard')) {
        return true;
      }
      if (this.containmentTransition && this.containmentTransition.active) {
        return false;
      }
      if (this.renderPhase === 'steady-fit') {
        // Interrupted convergence (a reset knocked the controller out without
        // leaving steady): re-engage the closed loop instead of stepping it
        // open-loop from maintenance forever — that endless re-entry was the
        // charts that never stopped resizing.
        if (!this.pidController || !this.pidController.active) {
          this.activateSteadyController();
        }
        return false;
      }
      var changedEnvelope = this.enforceEnvelope(source);
      var changedHeight = this.enforceHeightBand(source || 'maintenance-height-band');
      var measurements = this.measureBounds();
      var moved = measurements ? this.applyAnchorPlacement(measurements) : false;
      if (measurements && this.el && this.el.object3D) {
        this.lastStableTransform = cloneTransform(this.el.object3D) || this.lastStableTransform;
      }
      if (changedHeight || changedEnvelope || moved) {
        this.syncTransformAttributes();
      }
      return changedHeight || changedEnvelope || moved;
    },

    // ── Settled state ──────────────────────────────────────────────────────
    // The terminal state the whole controller drives towards: fit converged,
    // component quiet. No per-frame measuring, no maintenance stepping — only
    // the periodic watch below, which re-engages the controller when the chart
    // REALLY changed (persistent relative drift) or is REALLY out (hard
    // violation). One-sample blips — a legend catching the camera, a label
    // loading — never wake it up.

    enterSettledState: function (measurements) {
      var resolved = measurements || this.measureBounds();
      if (!hasUsableMeasurements(resolved)) {
        return;
      }
      this.settled = true;
      this.settledDriftStreak = 0;
      this.settledReference = {
        containmentX: resolved.containment.size.x,
        containmentZ: resolved.containment.size.z,
        peakHeight: Number.isFinite(resolved.peakHeight) ? resolved.peakHeight : null
      };
      resizeTrace('containment-settled', {
        containmentX: toFixedNumber(resolved.containment.size.x),
        containmentZ: toFixedNumber(resolved.containment.size.z),
        peakHeight: toFixedNumber(resolved.peakHeight)
      });
    },

    unsettle: function (reason) {
      if (!this.settled && !this.settledReference) {
        return;
      }
      this.settled = false;
      this.settledReference = null;
      this.settledDriftStreak = 0;
      resizeTrace('containment-unsettled', { reason: reason || '' });
    },

    runSettledWatch: function (source) {
      if (!this.settled || !this.settledReference || !this.el || !this.el.object3D) {
        return;
      }
      if (!isObject3DVisibleInScene(this.el)) {
        return;
      }
      var measurements = this.measureBounds();
      if (!hasUsableMeasurements(measurements)) {
        return;
      }

      var reference = this.settledReference;
      var relativeDrift = function (current, settledValue) {
        if (!Number.isFinite(current) || !Number.isFinite(settledValue) || settledValue <= 0) {
          return 0;
        }
        return Math.abs(current - settledValue) / settledValue;
      };
      var drift = Math.max(
        relativeDrift(measurements.containment.size.x, reference.containmentX),
        relativeDrift(measurements.containment.size.z, reference.containmentZ),
        relativeDrift(measurements.peakHeight, reference.peakHeight)
      );

      // Hard violation: physically past the table limits — react now.
      var limits = computeContainmentLimits(this.data);
      var heightTargets = resolveHeightBandTargets(this.data);
      var hardViolation = measurements.containment.size.x > limits.containmentWidthLimit * SETTLED_WATCH.hardViolationRatio
        || measurements.containment.size.z > limits.containmentDepthLimit * SETTLED_WATCH.hardViolationRatio
        || (Number.isFinite(measurements.peakHeight)
          && heightTargets && Number.isFinite(heightTargets.maxHeight)
          && measurements.peakHeight > heightTargets.maxHeight * SETTLED_WATCH.hardViolationRatio);

      if (hardViolation) {
        this.unsettle((source || 'settled-watch') + '-hard-violation');
        this.activateSteadyController();
        return;
      }

      if (drift >= SETTLED_WATCH.resumeThresholdRatio) {
        this.settledDriftStreak += 1;
        if (this.settledDriftStreak >= SETTLED_WATCH.resumeSamples) {
          this.unsettle((source || 'settled-watch') + '-persistent-drift');
          this.activateSteadyController();
        }
        return;
      }

      this.settledDriftStreak = 0;
    },

// == analysisTableRuntime.js | stabilizationAndRenormalize (assembled per manifest.json; see COMPONENTS.md) ==
    stopStabilizationLoop: function () {
      if (this.stabilizationTimer) {
        clearTimeout(this.stabilizationTimer);
        this.stabilizationTimer = null;
      }
      this.stabilizationChecksRemaining = 0;
      this.stabilizationStableCount = 0;
    },

    startStabilizationWindow: function (reason, generation) {
      this.stopStabilizationLoop();
      this.stabilizationChecksRemaining = Math.max(1, this.data.stabilizationMaxChecks || DEFAULTS.stabilizationMaxChecks);
      this.stabilizationStableCount = 0;
      this.scheduleStabilizationStep(reason || 'normalize', generation);
    },

    scheduleStabilizationStep: function (reason, generation) {
      var self = this;
      if (this.stabilizationChecksRemaining <= 0) {
        return;
      }
      this.stabilizationTimer = setTimeout(function () {
        self.stabilizationTimer = null;
        self.runStabilizationStep(reason || 'stabilization', generation);
      }, Math.max(50, this.data.stabilizationCheckMs || DEFAULTS.stabilizationCheckMs));
    },

    runStabilizationStep: function (reason, generation) {
      if (!this.isCurrentGeneration(generation)) {
        return;
      }
      if (!this.data.enabled || !this.normalized || !this.el || !this.el.object3D) {
        this.stopStabilizationLoop();
        return;
      }

      var changed = this.runMaintenancePass(reason || 'stabilization');
      var measurements = this.measureBounds();
      var signature = measurements ? buildMeasurementSignature(measurements, this.el.object3D) : null;

      if (!hasUsableMeasurements(measurements)) {
        this.markWaitingGeometry('waiting-geometry', generation, {
          source: reason || 'stabilization',
          phase: this.renderPhase
        });
        this.stabilizationChecksRemaining -= 1;
        if (this.stabilizationChecksRemaining > 0) {
          this.scheduleStabilizationStep(reason || 'stabilization', generation);
        } else {
          this.stopStabilizationLoop();
        }
        return;
      }

      if (changed || !signature || signature !== this.lastMeasurementSignature) {
        this.stabilizationStableCount = 0;
      } else {
        this.stabilizationStableCount += 1;
      }

      this.lastMeasurementSignature = signature;
      this.stabilizationChecksRemaining -= 1;

      debugLog('stabilization-step', {
        reason: reason || 'stabilization',
        changed: changed,
        phase: this.renderPhase,
        remaining: this.stabilizationChecksRemaining,
        stableCount: this.stabilizationStableCount
      });

      if (
        this.renderPhase === 'bootstrap-visible'
        && this.stabilizationStableCount >= Math.max(1, this.data.stabilizationStablePasses || DEFAULTS.stabilizationStablePasses)
      ) {
        this.renderPhase = 'steady-fit';
        this.stabilizationStableCount = 0;
        this.lastMeasurementSignature = null;
        this.activateSteadyController();
        this.runSteadyControllerStep('steady-transition', this.data.stabilizationCheckMs || DEFAULTS.stabilizationCheckMs);
        this.stopStabilizationLoop();
        scheduleTableDiagnosticsRefresh('steady-fit');
        return;
      }

      if (this.stabilizationChecksRemaining <= 0 || this.stabilizationStableCount >= Math.max(1, this.data.stabilizationStablePasses || DEFAULTS.stabilizationStablePasses)) {
        this.stopStabilizationLoop();
        return;
      }

      this.scheduleStabilizationStep(reason || 'stabilization', generation);
    },

    renormalize: function (reason) {
      this.ensureRuntimeState();
      // A hidden chart (another mode's, parked while its analysis is not on
      // screen) must not be re-fitted: measuring it while invisible yields a
      // different fit, which then had to be corrected — visibly — the moment it
      // came back. Remember the request instead; the fit it already has stays
      // valid, and whoever shows the chart again asks for a re-fit (which is a
      // no-op unless its content really changed).
      if (this.normalized && !isObject3DVisibleInScene(this.el)) {
        this.pendingRenormalizeReason = reason || 'hidden-chart';
        resizeTrace('renormalize-deferred-hidden', {
          reason: reason || 'renormalize'
        });
        return;
      }
      // Already fitted and nothing changed → keep the chart exactly as it is.
      // Re-fitting is destructive (it clears `normalized`, resets the transform
      // and runs the bootstrap fit again), so an unconditional re-fit made the
      // chart visibly jump every time something asked "just in case" — the
      // flash on entering an analysis. Real changes (new data, a rebuilt chart,
      // a different containment zone) move the measurements or the transform,
      // so the signature differs and the fit runs normally.
      if (this.normalized && this.normalizedSignature && this.el?.object3D) {
        // A transition in flight is not a reason to re-fit: it IS this
        // component's own animation towards the fit it just computed. Restarting
        // then made captureStableTransform() below record a half-animated
        // transform as the stable one and fit from there — the chained re-fits
        // when several "just in case" requests land inside one 650 ms animation.
        var transitioning = !!(this.containmentTransition && this.containmentTransition.active);
        var currentSignature = transitioning
          ? this.normalizedSignature
          : buildMeasurementSignature(this.measureBounds(), this.el.object3D);
        if (currentSignature && currentSignature === this.normalizedSignature) {
          resizeTrace('renormalize-skipped-unchanged', {
            reason: reason || 'renormalize',
            transitioning: transitioning
          });
          return;
        }
      }
      var generation = this.bumpNormalizationGeneration();
      this.unsettle(reason || 'renormalize');
      if (this.containmentTransition && this.containmentTransition.active) {
        this.cancelContainmentTransition();
      }
      this.captureStableTransform();
      this.normalized = false;
      this.renderPhase = 'waiting-geometry';
      this.retryCount = 0;
      this.deactivateSteadyController();
      this.stopStabilizationLoop();
      if (this.el && this.el.object3D) {
        if (this.lastStableTransform) {
          restoreTransform(this.el.object3D, this.lastStableTransform);
        } else if (this.baseScale) {
          this.resetToBaseScale();
        }
        this.el.object3D.visible = true;
      }
      this.tryNormalize(reason || 'manual-renormalize', generation);
    },

    tryNormalize: function (reason, generation) {
      if (!this.isCurrentGeneration(generation)) {
        return;
      }
      var el = this.el;
      var three = root.THREE || (root.AFRAME && root.AFRAME.THREE);
      if (!el || !el.object3D || !three || !three.Box3 || !three.Vector3) {
        this.scheduleRetry('missing-three-or-object', generation);
        return;
      }

      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
        this.retryTimer = null;
      }

      this.ensureBaseScale();
      var previousTransform = cloneTransform(el.object3D) || this.lastStableTransform;
      var axisIssue = this.inspectAxisIssue();
      if (axisIssue) {
        resizeTrace('invalid-axis-length-detected', {
          reason: reason || 'normalize',
          generation: generation,
          issue: axisIssue
        });
        this.scheduleRetry(axisIssue.reason || 'invalid-axis-length', generation, axisIssue);
        return;
      }

      var initialMeasurements = this.measureBounds();
      if (!hasUsableMeasurements(initialMeasurements)) {
        resizeTrace('invalid-initial-bounds', {
          reason: reason || 'normalize',
          generation: generation,
          hasMeasurements: !!initialMeasurements,
          primaryWidth: initialMeasurements && initialMeasurements.primary ? toFixedNumber(initialMeasurements.primary.size.x) : null,
          primaryHeight: initialMeasurements && initialMeasurements.primary ? toFixedNumber(initialMeasurements.primary.size.y) : null,
          primaryDepth: initialMeasurements && initialMeasurements.primary ? toFixedNumber(initialMeasurements.primary.size.z) : null
        });
        if (previousTransform) {
          restoreTransform(el.object3D, previousTransform);
        }
        this.markWaitingGeometry('waiting-geometry', generation, {
          source: reason || 'normalize',
          generation: generation
        });
        this.scheduleRetry('waiting-geometry', generation);
        return;
      }

      this.renderPhase = 'bootstrap-visible';
      this.applyBootstrapPlanarFit(initialMeasurements, reason || 'bootstrap-visible');

      var fittedMeasurements = this.measureBounds();
      if (!hasUsableMeasurements(fittedMeasurements)) {
        resizeTrace('invalid-fitted-bounds', {
          reason: reason || 'normalize',
          generation: generation
        });
        if (previousTransform) {
          restoreTransform(el.object3D, previousTransform);
        }
        this.markWaitingGeometry('waiting-geometry', generation, {
          source: reason || 'normalize',
          generation: generation
        });
        this.scheduleRetry('waiting-geometry', generation);
        return;
      }

      this.applyAnchorPlacement(fittedMeasurements);
      this.runMaintenancePass('bootstrap-visible');
      var guardedMeasurements = this.measureBounds();
      if (guardedMeasurements) {
        this.applyHardHeightGuard(guardedMeasurements, (reason || 'normalize') + '-hard-height-guard');
      }

      if (!isFiniteVector3Like(el.object3D.position) || !isFiniteVector3Like(el.object3D.scale)) {
        resizeTrace('invalid-final-transform', {
          reason: reason || 'normalize',
          generation: generation,
          position: el.object3D.position,
          scale: el.object3D.scale
        });
        if (previousTransform) {
          restoreTransform(el.object3D, previousTransform);
        }
        this.scheduleRetry('invalid-final-transform', generation);
        return;
      }

      this.syncTransformAttributes();
      this.normalized = true;
      this.lastNormalizationIssue = null;
      this.lastSuccessfulNormalizeAt = Date.now();
      this.nextContainmentCheckAt = 0;
      this.lastMeasurementSignature = buildMeasurementSignature(this.measureBounds(), el.object3D);
      // Remember the fit that is now on screen so redundant renormalize
      // requests can be skipped instead of re-running the whole fit.
      this.normalizedSignature = this.lastMeasurementSignature;
      var finalTransform = cloneTransform(el.object3D);
      if (finalTransform && shouldAnimateContainmentTransform(reason, previousTransform, finalTransform, this.data)) {
        restoreTransform(el.object3D, previousTransform);
        this.syncTransformAttributes();
        this.startContainmentTransition(previousTransform, finalTransform, reason || 'normalize');
      } else {
        this.captureStableTransform();
      }
      this.deactivateSteadyController();
      el.object3D.visible = true;

      var finalMeasurements = this.measureBounds();
      if (finalMeasurements) {
        debugTable('normalized-chart', [{
          reason: reason || 'normalize',
          primaryWidth: toFixedNumber(finalMeasurements.primary.size.x),
          primaryHeight: toFixedNumber(finalMeasurements.primary.size.y),
          peakHeight: toFixedNumber(finalMeasurements.peakHeight),
          primaryDepth: toFixedNumber(finalMeasurements.primary.size.z),
          containmentWidth: toFixedNumber(finalMeasurements.containment.size.x),
          containmentDepth: toFixedNumber(finalMeasurements.containment.size.z),
          fullWidth: toFixedNumber(finalMeasurements.full.size.x),
          fullHeight: toFixedNumber(finalMeasurements.full.size.y),
          fullDepth: toFixedNumber(finalMeasurements.full.size.z),
          targetWidth: this.data.targetWidth,
          targetHeight: this.data.targetHeight,
          targetDepth: this.data.targetDepth
        }]);
      }

      this.startStabilizationWindow(reason || 'normalize', generation);
      scheduleTableDiagnosticsRefresh('normalized');
    },

    scheduleRetry: function (reason, generation, details) {
      if (!this.isCurrentGeneration(generation)) {
        return;
      }
      this.retryCount += 1;
      this.lastNormalizationIssue = {
        reason: reason,
        details: details || null,
        retryCount: this.retryCount,
        generation: generation,
        at: Date.now()
      };
      if (
        this.retryCount === 1
        || this.retryCount === 5
        || this.retryCount % 10 === 0
        || this.retryCount > this.data.retries
      ) {
        resizeTrace('retry-normalize', {
          reason: reason,
          generation: generation,
          retryCount: this.retryCount,
          maxRetries: this.data.retries
        });
      }
      if (this.retryCount > this.data.retries) {
        if (!this.isCurrentGeneration(generation)) {
          return;
        }
        if (this.el.object3D) {
          this.el.object3D.visible = true;
        }
        this.markWaitingGeometry(reason === 'invalid-axis-length' ? reason : 'waiting-geometry', generation, details);
        if (reason === 'invalid-axis-length' || DEBUG_STATE.enabled) {
          console.warn('[CodeXR][AnalysisTable] Could not normalize after retries:', {
            reason: reason,
            retries: this.retryCount - 1,
            approxWaitMs: (this.retryCount - 1) * this.data.retryDelayMs
          });
        }
        return;
      }

      if (this.retryTimer) {
        clearTimeout(this.retryTimer);
      }

      var self = this;
      var backoffDelay = Math.min(
        this.data.retryDelayMs + (this.retryCount * 20),
        Math.max(this.data.retryDelayMs, 420)
      );
      debugLog('retry-normalize', {
        reason: reason,
        retryCount: this.retryCount,
        delayMs: backoffDelay
      });
      this.retryTimer = setTimeout(function () {
        self.tryNormalize(reason, generation);
      }, backoffDelay);
    }
  };

// == analysisTableRuntime.js | tableDefinition (assembled per manifest.json; see COMPONENTS.md) ==
  var analysisTableDefinition = {
    schema: {
      mode: { default: 'single', oneOf: ['selection', 'single', 'historical-compare', 'project-evolution', 'dependency-graph'] },
      width: { type: 'number', default: 6.514 },
      depth: { type: 'number', default: 4.118 },
      anchorX: { type: 'number', default: DEFAULTS.anchorX },
      anchorY: { type: 'number', default: DEFAULTS.anchorY },
      anchorZ: { type: 'number', default: DEFAULTS.anchorZ },
      topThickness: { type: 'number', default: 0.14 },
      baseRadius: { type: 'number', default: 1.45 },
      baseHeight: { type: 'number', default: 0.78 }
    },

    init: function () {
      this.groupEl = root.document.createElement('a-entity');
      this.baseEl = root.document.createElement('a-cylinder');
      this.topEl = root.document.createElement('a-box');
      this.trimEl = root.document.createElement('a-box');
      this.leftZoneEl = root.document.createElement('a-box');
      this.rightZoneEl = root.document.createElement('a-box');
      this.dividerEl = root.document.createElement('a-box');
      this.anchorPlaneEl = root.document.createElement('a-plane');
      this.warningGroupEl = root.document.createElement('a-entity');
      this.warningTextEls = ['front', 'back', 'left', 'right'].map(function (edge) {
        var textEl = root.document.createElement('a-text');
        textEl.setAttribute('data-codexr-role', 'analysis-table-warning auxiliary');
        textEl.setAttribute('data-codexr-warning-edge', edge);
        textEl.setAttribute('align', 'center');
        textEl.setAttribute('baseline', 'center');
        textEl.setAttribute('width', 2.6);
        textEl.setAttribute('wrap-count', 28);
        return textEl;
      });

      this.groupEl.setAttribute('id', 'codexr-analysis-table-geometry');
      this.topEl.setAttribute('class', 'babiaxraycasterclass');
      this.baseEl.setAttribute('class', 'babiaxraycasterclass');
      this.anchorPlaneEl.setAttribute('id', 'codexr-analysis-table-anchor-plane');
      this.anchorPlaneEl.setAttribute('class', 'codexr-tabletop-anchor-plane codexr-analysis-table-debug');
      this.anchorPlaneEl.setAttribute('data-codexr-role', 'tabletop-anchor debug');
      this.anchorPlaneEl.setAttribute('visible', false);
      this.warningGroupEl.setAttribute('id', 'codexr-analysis-table-warning');
      this.warningGroupEl.setAttribute('data-codexr-role', 'analysis-table-warning auxiliary');
      this.warningGroupEl.setAttribute('visible', false);

      this.groupEl.appendChild(this.baseEl);
      this.groupEl.appendChild(this.trimEl);
      this.groupEl.appendChild(this.topEl);
      this.groupEl.appendChild(this.leftZoneEl);
      this.groupEl.appendChild(this.rightZoneEl);
      this.groupEl.appendChild(this.dividerEl);
      this.groupEl.appendChild(this.anchorPlaneEl);
      this.warningTextEls.forEach(function (textEl) {
        this.warningGroupEl.appendChild(textEl);
      }, this);
      this.groupEl.appendChild(this.warningGroupEl);
      this.el.appendChild(this.groupEl);

      this.refreshGeometry();
    },

    update: function () {
      this.refreshGeometry();
    },

    remove: function () {
      if (this.groupEl && this.groupEl.parentNode) {
        this.groupEl.parentNode.removeChild(this.groupEl);
      }
    },

    refreshGeometry: function () {
      if (!this.groupEl) {
        return;
      }
      var comparison = this.data.mode === 'historical-compare';
      var theme = MODE_THEME_BY_ID[this.data.mode] || MODE_THEME_BY_ID.single;
      var topY = this.data.anchorY - 0.15;
      var halfWidth = (this.data.width - 0.18) / 2;
      this.groupEl.setAttribute('position', this.data.anchorX + ' ' + topY + ' ' + this.data.anchorZ);

      this.topEl.setAttribute('width', this.data.width);
      this.topEl.setAttribute('height', this.data.topThickness);
      this.topEl.setAttribute('depth', this.data.depth);
      this.topEl.setAttribute(
        'material',
        theme.top
      );

      this.trimEl.setAttribute('width', this.data.width + 0.08);
      this.trimEl.setAttribute('height', 0.05);
      this.trimEl.setAttribute('depth', this.data.depth + 0.08);
      this.trimEl.setAttribute('position', '0 -0.085 0');
      this.trimEl.setAttribute(
        'material',
        theme.trim
      );

      this.baseEl.setAttribute('radius', this.data.baseRadius);
      this.baseEl.setAttribute('height', this.data.baseHeight);
      this.baseEl.setAttribute('position', '0 ' + (-(this.data.baseHeight / 2) - 0.07) + ' 0');
      this.baseEl.setAttribute(
        'material',
        theme.base
      );

      [
        { el: this.leftZoneEl, x: -(halfWidth / 2) - 0.045, color: '#256d85' },
        { el: this.rightZoneEl, x: (halfWidth / 2) + 0.045, color: '#2b8a66' }
      ].forEach(function (zone) {
        zone.el.setAttribute('visible', comparison);
        zone.el.setAttribute('width', halfWidth);
        zone.el.setAttribute('height', 0.018);
        zone.el.setAttribute('depth', Math.max(0.2, this.data.depth - 0.24));
        zone.el.setAttribute('position', zone.x + ' 0.082 0');
        zone.el.setAttribute('material', 'color: ' + zone.color + '; opacity: 0.42; transparent: true');
      }, this);

      this.dividerEl.setAttribute('visible', comparison);
      this.dividerEl.setAttribute('width', 0.05);
      this.dividerEl.setAttribute('height', 0.05);
      this.dividerEl.setAttribute('depth', this.data.depth - 0.18);
      this.dividerEl.setAttribute('position', '0 0.09 0');
      this.dividerEl.setAttribute('material', 'color: #b8f3ff; emissive: #246d7a; emissiveIntensity: 0.25');

      var anchorPlaneLocalY = getTableTopY({
        anchorY: this.data.anchorY,
        tableTopSurfaceOffsetY: DEFAULTS.tableTopSurfaceOffsetY,
        tabletopAnchorEpsilon: DEFAULTS.tabletopAnchorEpsilon
      }) - topY;
      this.anchorPlaneEl.setAttribute('position', '0 ' + anchorPlaneLocalY + ' 0');
      this.anchorPlaneEl.setAttribute('rotation', '-90 0 0');
      this.anchorPlaneEl.setAttribute('width', Math.max(0.01, this.data.width - 0.18));
      this.anchorPlaneEl.setAttribute('height', Math.max(0.01, this.data.depth - 0.18));
      this.anchorPlaneEl.setAttribute('material', 'color: #22d3ee; opacity: 0.26; transparent: true; side: double; shader: flat');

      var warningY = anchorPlaneLocalY + 0.085;
      var halfDepth = this.data.depth / 2;
      var halfWidth = this.data.width / 2;
      var warningPositions = {
        front: '0 ' + warningY + ' ' + (halfDepth - 0.18),
        back: '0 ' + warningY + ' ' + (-(halfDepth - 0.18)),
        left: (-(halfWidth - 0.18)) + ' ' + warningY + ' 0',
        right: (halfWidth - 0.18) + ' ' + warningY + ' 0'
      };
      var warningRotations = {
        front: '-35 0 0',
        back: '-35 180 0',
        left: '-35 90 0',
        right: '-35 -90 0'
      };
      this.warningTextEls.forEach(function (textEl) {
        var edge = textEl.getAttribute('data-codexr-warning-edge');
        textEl.setAttribute('position', warningPositions[edge] || warningPositions.front);
        textEl.setAttribute('rotation', warningRotations[edge] || warningRotations.front);
      });
    },

    setContainmentWarning: function (diagnostic) {
      if (!this.warningGroupEl || !this.warningTextEls) {
        return false;
      }
      var active = !!(diagnostic && diagnostic.level && diagnostic.level !== 'ok' && diagnostic.message);
      this.warningGroupEl.setAttribute('visible', active);
      if (!active) {
        return true;
      }
      var color = diagnostic.level === 'error' ? '#fecaca' : '#fde68a';
      var materialColor = diagnostic.level === 'error' ? '#dc2626' : '#d97706';
      this.warningTextEls.forEach(function (textEl) {
        textEl.setAttribute('value', diagnostic.message);
        textEl.setAttribute('color', color);
        textEl.setAttribute('material', 'color: ' + materialColor + '; opacity: 0.76; transparent: true; shader: flat');
      });
      return true;
    }
  };

  if (registerTable) {
    AFRAME.registerComponent(TABLE_COMPONENT_NAME, analysisTableDefinition);
  }
  if (registerContainment) {
    AFRAME.registerComponent(COMPONENT_NAME, componentDefinition);
  }
  function getContainmentCharts(doc) {
    if (!doc || !doc.querySelectorAll) {
      return [];
    }

    // Charts written in the generated HTML carry the component as a DOM
    // attribute; charts built at runtime (project evolution, historical
    // comparison) get it through setAttribute, which A-Frame does NOT mirror to
    // the DOM — those were invisible here, which is how a perfectly rendered
    // movie chart produced "No chart detected". applyContainmentProfile stamps
    // the data marker so both kinds are discoverable.
    var charts = doc.querySelectorAll('[' + COMPONENT_NAME + '], [' + CONTAINMENT_MARKER_ATTRIBUTE + ']');
    return Array.prototype.slice.call(charts || []);
  }

  function resolveContainmentComponentInfo(chartEl) {
    if (!chartEl) {
      return null;
    }

    var component = chartEl.components && chartEl.components[COMPONENT_NAME];
    if (!component) {
      return null;
    }

    return {
      chartEl: chartEl,
      component: component,
      attrName: COMPONENT_NAME,
      data: component.data || DEFAULTS
    };
  }

// == analysisTableRuntime.js | diagnosticsSurface (assembled per manifest.json; see COMPONENTS.md) ==
  function getAnalysisTableElement() {
    var doc = root.document;
    return doc && doc.getElementById ? doc.getElementById('codexrAnalysisTable') : null;
  }

  function getAnalysisTableComponent() {
    var table = getAnalysisTableElement();
    return table && table.components ? table.components[TABLE_COMPONENT_NAME] : null;
  }

  function getCurrentTableMode() {
    var component = getAnalysisTableComponent();
    if (component && component.data && component.data.mode) {
      return component.data.mode;
    }
    var table = getAnalysisTableElement();
    var attr = table && table.getAttribute ? table.getAttribute(TABLE_COMPONENT_NAME) : null;
    if (attr && typeof attr === 'object' && attr.mode) {
      return attr.mode;
    }
    if (typeof attr === 'string') {
      var match = attr.match(/(?:^|;\s*)mode:\s*([^;]+)/);
      if (match) {
        return match[1].trim();
      }
    }
    return 'single';
  }

  function applyTableWarning(diagnostic) {
    var component = getAnalysisTableComponent();
    if (!component || typeof component.setContainmentWarning !== 'function') {
      return false;
    }
    return component.setContainmentWarning(diagnostic || { level: 'ok' });
  }

  /**
   * Ask for a fresh sample of the containment diagnostics on the table's
   * warning surface. Calls are coalesced into one shared timer (the table is
   * a single shared surface) and slightly deferred so A-Frame finishes the
   * transition that triggered them before the state is sampled.
   */
  function scheduleTableDiagnosticsRefresh(reason) {
    if (TABLE_DIAGNOSTIC_REFRESH.timer) {
      return;
    }
    var elapsed = Date.now() - TABLE_DIAGNOSTIC_REFRESH.lastRunAt;
    var delay = Math.max(180, 250 - elapsed);
    TABLE_DIAGNOSTIC_REFRESH.timer = setTimeout(function () {
      TABLE_DIAGNOSTIC_REFRESH.timer = null;
      TABLE_DIAGNOSTIC_REFRESH.lastRunAt = Date.now();
      debugLog('table-diagnostics-refresh', { reason: reason || 'requested' });
      var diagnostic = buildActiveContainmentDiagnostics();
      applyTableWarning(diagnostic);
      // A graced ("-pending") state is a promise to re-check: keep sampling
      // until it either resolves (geometry arrived) or matures into a visible
      // warning — components stuck waiting for geometry stop ticking, so this
      // loop cannot rely on them.
      if (diagnostic && typeof diagnostic.reason === 'string' && diagnostic.reason.slice(-8) === '-pending') {
        scheduleTableDiagnosticsRefresh('pending:' + diagnostic.reason);
      }
    }, delay);
  }

  function isEntityVisible(el) {
    var current = el;
    while (current && current !== root.document) {
      if (current.getAttribute) {
        var visibleAttr = current.getAttribute('visible');
        if (visibleAttr === false || visibleAttr === 'false') {
          return false;
        }
      }
      if (current.object3D && current.object3D.visible === false) {
        return false;
      }
      current = current.parentNode;
    }
    return true;
  }

  function getVisibleContainmentCharts(doc) {
    return getContainmentCharts(doc).filter(isEntityVisible);
  }

  function getVisibleDependencyGraphRoots(doc) {
    if (!doc || !doc.querySelectorAll) {
      return [];
    }
    var roots = doc.querySelectorAll(
      '#codexrDependencyGraph, [codexr-dependency-graph], [data-codexr-analysis-mode="dependency-graph"], [data-codexr-dependency-axes]'
    );
    return Array.prototype.slice.call(roots || []).filter(isEntityVisible);
  }

  function resolveWaitTarget(target, doc) {
    if (typeof target === 'function') {
      try {
        return resolveWaitTarget(target(), doc);
      } catch (error) {
        debugLog('wait-target-resolution-failed', {
          error: error && error.message ? error.message : String(error)
        });
        return null;
      }
    }

    if (typeof target === 'string') {
      var rawTarget = target.trim();
      if (!rawTarget || !doc) {
        return null;
      }

      var idCandidate = rawTarget.charAt(0) === '#' ? rawTarget.slice(1) : rawTarget;
      if (idCandidate && doc.getElementById) {
        var byId = doc.getElementById(idCandidate);
        if (byId) {
          return byId;
        }
      }

      if (doc.querySelector) {
        try {
          return doc.querySelector(rawTarget);
        } catch (error) {
          debugLog('wait-target-selector-failed', {
            target: rawTarget,
            error: error && error.message ? error.message : String(error)
          });
        }
      }
      return null;
    }

    return target || null;
  }

  function resolveDiagnosticTargets(targets, doc) {
    if (Array.isArray(targets) && targets.length) {
      return targets.map(function (target) {
        return resolveWaitTarget(target, doc);
      }).filter(function (chart) {
        return !!chart && isEntityVisible(chart);
      });
    }
    if (targets) {
      var chart = resolveWaitTarget(targets, doc);
      return chart && isEntityVisible(chart) ? [chart] : [];
    }
    return getVisibleContainmentCharts(doc);
  }

  function summarizeChartDiagnostic(status) {
    if (!status) {
      return {
        level: 'warning',
        reason: 'chart-status-unavailable',
        message: 'No chart detected'
      };
    }
    if (status.ready === false) {
      // Geometry is (re)building — a normal, transient phase during initial
      // load and every re-analysis. Reported as a graced warning: it only
      // becomes visible if the chart stays without measurable geometry.
      return {
        level: 'warning',
        reason: 'rebuilding',
        message: status.message || 'The chart is still rebuilding its geometry.',
        details: status.details || null
      };
    }
    if (status.valid === false) {
      return {
        level: 'error',
        reason: status.reason || 'invalid-chart',
        message: status.message || 'Chart exceeds table limits'
      };
    }
    var details = status.details || {};
    if (details.heightOverflow || status.reason === 'height-overflow') {
      return {
        level: 'error',
        reason: 'height-overflow',
        message: 'Chart exceeds table limits',
        details: details
      };
    }
    if (details.compromised) {
      return {
        level: 'warning',
        reason: 'compromised',
        message: 'Chart is constrained by table limits',
        details: details
      };
    }
    if (details.needsCorrection) {
      return {
        level: 'ok',
        reason: status.reason === 'containment-correcting' || details.phase !== 'steady-fit'
          ? 'containment-correcting'
          : 'normalizing',
        message: '',
        details: details
      };
    }
    return {
      level: 'ok',
      reason: 'ok',
      message: ''
    };
  }

  function stabilizeTableDiagnostic(diagnostic) {
    if (!diagnostic || diagnostic.level === 'ok') {
      TABLE_DIAGNOSTIC_STATE.key = '';
      TABLE_DIAGNOSTIC_STATE.firstSeenAt = 0;
      return diagnostic || { level: 'ok' };
    }
    if (diagnostic.level === 'error') {
      TABLE_DIAGNOSTIC_STATE.key = '';
      TABLE_DIAGNOSTIC_STATE.firstSeenAt = 0;
      return diagnostic;
    }

    var reason = diagnostic.reason || diagnostic.message || 'warning';
    if (reason !== 'underflow' && reason !== 'normalizing' && reason !== 'rebuilding' && reason !== 'chart-not-found') {
      TABLE_DIAGNOSTIC_STATE.key = '';
      TABLE_DIAGNOSTIC_STATE.firstSeenAt = 0;
      return diagnostic;
    }

    var key = (diagnostic.mode || '') + ':' + reason + ':' + (diagnostic.chartCount || 0);
    var now = Date.now();
    if (TABLE_DIAGNOSTIC_STATE.key !== key) {
      TABLE_DIAGNOSTIC_STATE.key = key;
      TABLE_DIAGNOSTIC_STATE.firstSeenAt = now;
      return Object.assign({}, diagnostic, {
        level: 'ok',
        reason: reason + '-pending',
        message: ''
      });
    }
    if ((now - TABLE_DIAGNOSTIC_STATE.firstSeenAt) < TABLE_WARNING_PERSISTENCE_MS) {
      return Object.assign({}, diagnostic, {
        level: 'ok',
        reason: reason + '-pending',
        message: ''
      });
    }
    return diagnostic;
  }

  function buildActiveContainmentDiagnostics(targets) {
    var doc = root.document;
    var mode = getCurrentTableMode();
    if (mode === 'selection') {
      return {
        level: 'ok',
        mode: mode,
        chartCount: 0,
        statuses: [],
        reason: 'selection-mode'
      };
    }
    var charts = resolveDiagnosticTargets(targets, doc);
    if (!charts.length) {
      if (mode === 'dependency-graph' && getVisibleDependencyGraphRoots(doc).length) {
        return {
          level: 'ok',
          mode: mode,
          chartCount: 0,
          visualCount: getVisibleDependencyGraphRoots(doc).length,
          statuses: [],
          reason: 'dependency-graph-visible'
        };
      }
      return stabilizeTableDiagnostic({
        level: 'warning',
        mode: mode,
        chartCount: 0,
        statuses: [],
        reason: 'chart-not-found',
        message: 'No chart detected'
      });
    }
    var statuses = charts.map(function (chart) {
      return root[RUNTIME_GLOBAL_NAME].getChartStatus(chart);
    });
    var summaries = statuses.map(summarizeChartDiagnostic);
    var worst = summaries.find(function (diagnostic) {
      return diagnostic.level === 'error';
    }) || summaries.find(function (diagnostic) {
      return diagnostic.level === 'warning';
    }) || { level: 'ok', reason: 'ok', message: '' };
    return stabilizeTableDiagnostic(Object.assign({}, worst, {
      mode: mode,
      chartCount: charts.length,
      statuses: statuses
    }));
  }

// == analysisTableRuntime.js | policyAndRegistration (assembled per manifest.json; see COMPONENTS.md) ==
  function buildScaleRangeSnapshot(data, chartCount) {
    var source = data || DEFAULTS;
    var min = Number.isFinite(source.minPlanarOccupancyRatio) ? source.minPlanarOccupancyRatio : DEFAULTS.minPlanarOccupancyRatio;
    var max = Number.isFinite(source.maxPlanarOccupancyRatio) ? source.maxPlanarOccupancyRatio : DEFAULTS.maxPlanarOccupancyRatio;

    return {
      charts: chartCount || 0,
      min: min,
      max: max,
      planar: {
        min: min,
        max: max
      }
    };
  }

  function buildScalePolicySnapshot(data, chartCount) {
    var source = data || DEFAULTS;
    return {
      charts: chartCount || 0,
      bootstrap: {
        max: Number.isFinite(source.bootstrapPlanarMaxRatio) ? source.bootstrapPlanarMaxRatio : DEFAULTS.bootstrapPlanarMaxRatio
      },
      steady: {
        min: Number.isFinite(source.minPlanarOccupancyRatio) ? source.minPlanarOccupancyRatio : DEFAULTS.minPlanarOccupancyRatio,
        max: Number.isFinite(source.maxPlanarOccupancyRatio) ? source.maxPlanarOccupancyRatio : DEFAULTS.maxPlanarOccupancyRatio
      },
      vertical: {
        min: Number.isFinite(source.heightBandMinRatio) ? source.heightBandMinRatio : DEFAULTS.heightBandMinRatio,
        max: Number.isFinite(source.heightBandMaxRatio) ? source.heightBandMaxRatio : DEFAULTS.heightBandMaxRatio
      }
    };
  }

  root[RUNTIME_GLOBAL_NAME] = root[RUNTIME_GLOBAL_NAME] || {};
  root[RUNTIME_GLOBAL_NAME].getChartStatus = function (target) {
    var doc = root.document;
    var chartEl = typeof target === 'string'
      ? (doc && doc.querySelector ? doc.querySelector(target) : null)
      : target;
    if (!chartEl && doc) {
      var charts = getVisibleContainmentCharts(doc);
      chartEl = charts.length ? charts[0] : null;
    }
    if (!chartEl) {
      return {
        ready: false,
        valid: false,
        reason: 'chart-not-found',
        message: 'The chart could not be found.'
      };
    }

    var component = chartEl.components && chartEl.components[COMPONENT_NAME];
    if (!component || typeof component.getChartStatus !== 'function') {
      return {
        ready: false,
        valid: false,
        reason: 'containment-component-missing',
        message: 'The chart containment runtime is not attached.'
      };
    }

    return component.getChartStatus();
  };
  root[RUNTIME_GLOBAL_NAME].waitForChartsStable = function (targets, options) {
    var doc = root.document;
    var targetList = Array.isArray(targets) ? targets : [targets];
    var timeoutMs = Math.max(1000, Number(options && options.timeoutMs) || 10000);
    var pollMs = Math.max(50, Number(options && options.pollMs) || 120);
    var stablePassesRequired = Math.max(1, Number(options && options.stablePasses) || 2);
    var startedAt = Date.now();
    var stablePasses = 0;

    return new Promise(function (resolve) {
      function inspect() {
        var statuses = targetList.map(function (target) {
          var chart = resolveWaitTarget(target, doc);
          return root[RUNTIME_GLOBAL_NAME].getChartStatus(chart);
        });
        applyTableWarning(buildActiveContainmentDiagnostics(targetList));
        var invalid = statuses.find(function (status) {
          return status && status.ready === true && status.valid === false;
        });
        if (invalid) {
          resolve({
            state: 'invalid',
            valid: false,
            stabilized: false,
            statuses: statuses,
            reason: invalid.reason || 'invalid-chart'
          });
          return;
        }

        var allReady = statuses.length > 0 && statuses.every(function (status) {
          return status && status.ready === true && status.valid === true;
        });
        var allStabilized = allReady && statuses.every(function (status) {
          return status.stabilized === true || status.geometryState === 'stabilized';
        });
        stablePasses = allStabilized ? stablePasses + 1 : 0;
        if (stablePasses >= stablePassesRequired) {
          resolve({
            state: 'stabilized',
            valid: true,
            stabilized: true,
            statuses: statuses
          });
          return;
        }

        if ((Date.now() - startedAt) >= timeoutMs) {
          resolve({
            state: allReady ? 'valid-timeout' : 'timeout',
            valid: allReady,
            stabilized: false,
            statuses: statuses,
            reason: allReady ? 'stabilization-timeout' : 'geometry-timeout'
          });
          return;
        }
        setTimeout(inspect, pollMs);
      }
      inspect();
    });
  };
  root[RUNTIME_GLOBAL_NAME].setMode = function (mode) {
    var nextMode = String(mode || 'single');
    var validModes = ['selection', 'single', 'historical-compare', 'project-evolution', 'dependency-graph'];
    if (validModes.indexOf(nextMode) === -1) {
      nextMode = 'single';
    }
    var table = root.document.getElementById?.('codexrAnalysisTable');
    var component = table?.components?.[TABLE_COMPONENT_NAME];
    // Rebuild the table geometry only on a real mode change, and only once:
    // setAttribute drives A-Frame's update() → refreshGeometry(), so calling
    // refreshGeometry() by hand as well rebuilt it twice per change, and
    // re-applying the active mode rebuilt it for nothing. Both together were
    // the visible table flash when an entry applies its state repeatedly.
    if (component?.data?.mode !== nextMode) {
      table?.setAttribute?.(TABLE_COMPONENT_NAME, 'mode', nextMode);
    }
    applyTableWarning(nextMode === 'selection' ? { level: 'ok' } : buildActiveContainmentDiagnostics());
    return nextMode;
  };
  root[RUNTIME_GLOBAL_NAME].getAnalysisTableZones = function (mode) {
    return getAnalysisTableZonesForMode(mode).map(function (zone) {
      return Object.assign({}, zone);
    });
  };
  root[RUNTIME_GLOBAL_NAME].getContainmentProfile = function (mode, zone) {
    var profile = resolveContainmentProfile(mode, zone);
    return {
      id: profile.id,
      zone: profile.zone ? Object.assign({}, profile.zone) : null,
      position: Object.assign({}, profile.position),
      containment: Object.assign({}, profile.containment)
    };
  };
  root[RUNTIME_GLOBAL_NAME].applyContainmentProfile = function (chart, profileIdOrObject) {
    var doc = root.document;
    var chartEl = typeof chart === 'string' ? resolveWaitTarget(chart, doc) : chart;
    if (!chartEl || !chartEl.setAttribute) {
      return null;
    }
    var profile = resolveContainmentProfile(profileIdOrObject || 'default');
    var currentAttr = chartEl.getAttribute ? chartEl.getAttribute(COMPONENT_NAME) : null;
    var nextAttr = {};
    if (currentAttr && typeof currentAttr === 'object') {
      Object.keys(currentAttr).forEach(function (key) {
        nextAttr[key] = currentAttr[key];
      });
    }
    Object.keys(profile.containment || {}).forEach(function (key) {
      nextAttr[key] = profile.containment[key];
    });
    chartEl.setAttribute('position', vectorToAttribute(profile.position || profilePosition(nextAttr)));
    chartEl.setAttribute(COMPONENT_NAME, nextAttr);
    // A-Frame does not mirror a programmatic component to the DOM, so charts
    // built at runtime were invisible to '[codexr-chart-containment]' lookups
    // (the table then reported "No chart detected" over a chart it was already
    // containing). This plain data attribute keeps them discoverable.
    chartEl.setAttribute(CONTAINMENT_MARKER_ATTRIBUTE, 'true');
    return {
      id: profile.id,
      zone: profile.zone ? Object.assign({}, profile.zone) : null,
      position: Object.assign({}, profile.position),
      containment: Object.assign({}, nextAttr)
    };
  };
  root[RUNTIME_GLOBAL_NAME].getActiveContainmentDiagnostics = function (targets) {
    var diagnostic = buildActiveContainmentDiagnostics(targets);
    applyTableWarning(diagnostic);
    return diagnostic;
  };
  root[RUNTIME_GLOBAL_NAME].getScaleRange = function () {
    var doc = root.document;
    var charts = getContainmentCharts(doc);
    if (charts.length === 0) {
      return buildScaleRangeSnapshot(DEFAULTS, 0);
    }

    var info = resolveContainmentComponentInfo(charts[0]);
    return buildScaleRangeSnapshot(info ? info.data : DEFAULTS, charts.length);
  };
  root[RUNTIME_GLOBAL_NAME].setScaleRange = function (min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('Scale range values must be finite numbers.');
    }
    if (min <= 0 || max <= 0) {
      throw new Error('Scale range values must be greater than zero.');
    }
    if (max <= min) {
      throw new Error('The maximum scale range value must be greater than the minimum.');
    }
    if (max > 0.99) {
      throw new Error('Planar occupancy values must be percentages below 1.');
    }

    var doc = root.document;
    var charts = getContainmentCharts(doc);
    charts.forEach(function (chartEl) {
      var info = resolveContainmentComponentInfo(chartEl);
      if (!info || !chartEl.getAttribute || !chartEl.setAttribute) {
        return;
      }

      var currentAttr = chartEl.getAttribute(info.attrName);
      var nextAttr = {};

      if (typeof currentAttr === 'string') {
        nextAttr = {
          minPlanarOccupancyRatio: min,
          maxPlanarOccupancyRatio: max
        };
      } else if (currentAttr && typeof currentAttr === 'object') {
        Object.keys(currentAttr).forEach(function (key) {
          nextAttr[key] = currentAttr[key];
        });
        nextAttr.minPlanarOccupancyRatio = min;
        nextAttr.maxPlanarOccupancyRatio = max;
      } else {
        nextAttr = {
          minPlanarOccupancyRatio: min,
          maxPlanarOccupancyRatio: max
        };
      }

      chartEl.setAttribute(info.attrName, nextAttr);
    });

    var firstInfo = charts.length ? resolveContainmentComponentInfo(charts[0]) : null;
    return buildScaleRangeSnapshot(firstInfo ? firstInfo.data : {
      minPlanarOccupancyRatio: min,
      maxPlanarOccupancyRatio: max
    }, charts.length);
  };
  root[RUNTIME_GLOBAL_NAME].getScalePolicy = function () {
    var doc = root.document;
    var charts = getContainmentCharts(doc);
    if (charts.length === 0) {
      return buildScalePolicySnapshot(DEFAULTS, 0);
    }

    var info = resolveContainmentComponentInfo(charts[0]);
    return buildScalePolicySnapshot(info ? info.data : DEFAULTS, charts.length);
  };
  root[RUNTIME_GLOBAL_NAME].setHeightBand = function (min, max) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new Error('Height band values must be finite numbers.');
    }
    if (min <= 0 || max <= 0) {
      throw new Error('Height band values must be greater than zero.');
    }
    if (max <= min) {
      throw new Error('The maximum height band value must be greater than the minimum.');
    }

    var doc = root.document;
    var charts = getContainmentCharts(doc);
    charts.forEach(function (chartEl) {
      var info = resolveContainmentComponentInfo(chartEl);
      if (!info || !chartEl.getAttribute || !chartEl.setAttribute) {
        return;
      }

      var currentAttr = chartEl.getAttribute(info.attrName);
      var nextAttr = {};
      if (currentAttr && typeof currentAttr === 'object') {
        Object.keys(currentAttr).forEach(function (key) {
          nextAttr[key] = currentAttr[key];
        });
      }
      nextAttr.heightBandMinRatio = min;
      nextAttr.heightBandMaxRatio = max;
      chartEl.setAttribute(info.attrName, nextAttr);
    });

    var firstInfo = charts.length ? resolveContainmentComponentInfo(charts[0]) : null;
    return buildScalePolicySnapshot(firstInfo ? firstInfo.data : DEFAULTS, charts.length);
  };
  root[RUNTIME_GLOBAL_NAME].renormalizeAll = function (reason) {
    var doc = root.document;
    if (!doc || !doc.querySelectorAll) {
      return 0;
    }

    var charts = doc.querySelectorAll('[' + COMPONENT_NAME + ']');
    var count = 0;
    charts.forEach(function (chartEl) {
      var component = chartEl.components && chartEl.components[COMPONENT_NAME];
      if (component && typeof component.renormalize === 'function') {
        component.renormalize(reason || 'runtime-request');
        count += 1;
      }
    });
    applyTableWarning(buildActiveContainmentDiagnostics());
    return count;
  };

  /**
   * Targeted renormalization: only the given chart entity ids. Callers that
   * refreshed a single chart (e.g. the historical live side) must use this —
   * renormalizing every chart resets untouched ones to their 'rebuilding'
   * containment state, waiting for a build event that never comes.
   */
  root[RUNTIME_GLOBAL_NAME].renormalizeCharts = function (chartIds, reason) {
    var doc = root.document;
    if (!doc || !doc.getElementById || !Array.isArray(chartIds)) {
      return 0;
    }
    var count = 0;
    chartIds.forEach(function (chartId) {
      var chartEl = chartId ? doc.getElementById(String(chartId)) : null;
      var component = chartEl && chartEl.components && chartEl.components[COMPONENT_NAME];
      if (component && typeof component.renormalize === 'function') {
        component.renormalize(reason || 'runtime-request');
        count += 1;
      }
    });
    applyTableWarning(buildActiveContainmentDiagnostics());
    return count;
  };
  function callChartDataTransition(chartIds, methodName, reason) {
    var doc = root.document;
    if (!doc || !doc.getElementById || !Array.isArray(chartIds)) {
      return 0;
    }
    var count = 0;
    chartIds.forEach(function (chartId) {
      var chartEl = chartId ? doc.getElementById(String(chartId)) : null;
      var component = chartEl && chartEl.components && chartEl.components[COMPONENT_NAME];
      if (component && typeof component[methodName] === 'function') {
        component[methodName](reason);
        count += 1;
      }
    });
    applyTableWarning(buildActiveContainmentDiagnostics(chartIds));
    return count;
  }
  root[RUNTIME_GLOBAL_NAME].beginChartDataTransition = function (chartIds, reason) {
    return callChartDataTransition(chartIds, 'beginDataTransition', reason || 'chart-data-transition');
  };
  root[RUNTIME_GLOBAL_NAME].finishChartDataTransition = function (chartIds, reason) {
    return callChartDataTransition(chartIds, 'finishDataTransition', reason || 'chart-data-transition-finished');
  };
  root[RUNTIME_GLOBAL_NAME].cancelChartDataTransition = function (chartIds, reason) {
    return callChartDataTransition(chartIds, 'cancelDataTransition', reason || 'chart-data-transition-cancelled');
  };
  root[RUNTIME_GLOBAL_NAME].enableDebug = function () {
    DEBUG_STATE.enabled = true;
    return true;
  };
  root[RUNTIME_GLOBAL_NAME].disableDebug = function () {
    DEBUG_STATE.enabled = false;
    return true;
  };
  root[RUNTIME_GLOBAL_NAME].setDebug = function (enabled) {
    DEBUG_STATE.enabled = !!enabled;
    return DEBUG_STATE.enabled;
  };
  root[RUNTIME_GLOBAL_NAME].isDebugEnabled = function () {
    return !!DEBUG_STATE.enabled;
  };
  root[RUNTIME_GLOBAL_NAME].showTabletopAnchorPlane = function (visible) {
    var doc = root.document;
    var plane = doc && doc.querySelector ? doc.querySelector('#codexr-analysis-table-anchor-plane') : null;
    if (!plane || !plane.setAttribute) {
      return false;
    }
    plane.setAttribute('visible', visible !== false);
    return true;
  };
  root[RUNTIME_GLOBAL_NAME].hideTabletopAnchorPlane = function () {
    return root[RUNTIME_GLOBAL_NAME].showTabletopAnchorPlane(false);
  };
  root[RUNTIME_GLOBAL_NAME].__testing = {
    PID_PROFILE: PID_PROFILE,
    matchesIgnoredBoundsMeta: matchesIgnoredBoundsMeta,
    matchesIgnoredContainmentBoundsMeta: matchesIgnoredContainmentBoundsMeta,
    collectNodeMeta: collectNodeMeta,
    SETTLED_WATCH: SETTLED_WATCH,
    computeContainmentPlanarLimit: computeContainmentPlanarLimit,
    computeBootstrapPlanarScale: computeBootstrapPlanarScale,
    computePlanarAxisTargetScale: computePlanarAxisTargetScale,
    computePeakHeight: computePeakHeight,
    resolveHeightBandTargets: resolveHeightBandTargets,
    computeHeightBandScale: computeHeightBandScale,
    computeHeightBandTargetScale: computeHeightBandTargetScale,
    computeHardHeightGuardTarget: computeHardHeightGuardTarget,
    targetNeedsCorrection: targetNeedsCorrection,
    shouldAnimateContainmentTransform: shouldAnimateContainmentTransform,
    constrainPlanarTargetForHeightCompromise: constrainPlanarTargetForHeightCompromise,
    buildContainmentCorrectionState: buildContainmentCorrectionState,
    createPidAxisState: createPidAxisState,
    stepPidAxis: stepPidAxis,
    buildMeasurementSignature: buildMeasurementSignature,
    isObject3DVisibleInScene: isObject3DVisibleInScene,
    computeAnchorOffset: computeAnchorOffset,
    getTableTopY: getTableTopY,
    resolveChartFitMode: resolveChartFitMode,
    resolveChartSurfaceLift: resolveChartSurfaceLift,
    buildTabletopAnchorDiagnostics: buildTabletopAnchorDiagnostics,
    getAnalysisTableZonesForMode: getAnalysisTableZonesForMode,
    getVisibleDependencyGraphRoots: getVisibleDependencyGraphRoots,
    resolveContainmentProfile: resolveContainmentProfile,
    buildActiveContainmentDiagnostics: buildActiveContainmentDiagnostics,
    collectNonFiniteValueIssues: collectNonFiniteValueIssues,
    inspectInvalidAxisState: inspectInvalidAxisState,
    computeStableBoatsZoneElevation: computeStableBoatsZoneElevation
  };
  root[DEBUG_GLOBAL_NAME] = root[DEBUG_GLOBAL_NAME] || {
    _els: [],

    _cleanup: function () {
      this._els.forEach(function (el) {
        if (el && el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
      this._els = [];
    },

    _mk: function (parent, tag, attrs) {
      var el = root.document.createElement(tag);
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
      parent.appendChild(el);
      this._els.push(el);
      return el;
    },

    show: function (target) {
      this._cleanup();

      var selector = target || '[' + COMPONENT_NAME + ']';
      var chart = typeof selector === 'string' ? root.document.querySelector(selector) : selector;
      if (!chart) {
        console.warn('[CodeXR][ChartBands] Chart not found for target:', selector);
        return null;
      }

      var component = chart.components && chart.components[COMPONENT_NAME];
      if (!component) {
        console.warn('[CodeXR][ChartBands] chart containment component not found on target.');
        return null;
      }

      var measurements = component.measureBounds();
      if (!measurements) {
        console.warn('[CodeXR][ChartBands] Could not measure chart bounds.');
        return null;
      }

      var d = component.data;
      var scene = chart.sceneEl || root.document.querySelector('a-scene');
      if (!scene) {
        console.warn('[CodeXR][ChartBands] Scene not found.');
        return null;
      }

      var tableBottomY = getTableTopY(d);
      var bandTargets = resolveHeightBandTargets(d);

      this._mk(scene, 'a-box', {
        position: d.anchorX + ' ' + (tableBottomY + (d.targetHeight / 2)) + ' ' + d.anchorZ,
        width: d.targetWidth,
        height: d.targetHeight,
        depth: d.targetDepth,
        material: 'color: #2bb3ff; opacity: 0.12; transparent: true; wireframe: true',
        'class': 'babiaxraycasterclass'
      });

      this._mk(scene, 'a-plane', {
        position: d.anchorX + ' ' + (tableBottomY + bandTargets.minHeight) + ' ' + d.anchorZ,
        rotation: '-90 0 0',
        width: d.targetWidth,
        height: d.targetDepth,
        material: 'color: #22c55e; opacity: 0.22; transparent: true; side: double',
        'class': 'babiaxraycasterclass'
      });

      this._mk(scene, 'a-plane', {
        position: d.anchorX + ' ' + (tableBottomY + bandTargets.maxHeight) + ' ' + d.anchorZ,
        rotation: '-90 0 0',
        width: d.targetWidth,
        height: d.targetDepth,
        material: 'color: #ef4444; opacity: 0.22; transparent: true; side: double',
        'class': 'babiaxraycasterclass'
      });

      this._mk(scene, 'a-box', {
        position: measurements.primary.center.x + ' ' + measurements.primary.center.y + ' ' + measurements.primary.center.z,
        width: Math.max(0.01, measurements.primary.size.x),
        height: Math.max(0.01, measurements.primary.size.y),
        depth: Math.max(0.01, measurements.primary.size.z),
        material: 'color: #4ade80; opacity: 0.1; transparent: true; wireframe: true',
        'class': 'babiaxraycasterclass'
      });

      this._mk(scene, 'a-box', {
        position: measurements.full.center.x + ' ' + measurements.full.center.y + ' ' + measurements.full.center.z,
        width: Math.max(0.01, measurements.full.size.x),
        height: Math.max(0.01, measurements.full.size.y),
        depth: Math.max(0.01, measurements.full.size.z),
        material: 'color: #f59e0b; opacity: 0.1; transparent: true; wireframe: true',
        'class': 'babiaxraycasterclass'
      });

      console.table({
        chartId: chart.id || '(no-id)',
        targetWidth: d.targetWidth,
        targetDepth: d.targetDepth,
        targetHeight: d.targetHeight,
        primaryWidth: toFixedNumber(measurements.primary.size.x),
        primaryHeight: toFixedNumber(measurements.primary.size.y),
        primaryDepth: toFixedNumber(measurements.primary.size.z),
        fullWidth: toFixedNumber(measurements.full.size.x),
        fullHeight: toFixedNumber(measurements.full.size.y),
        fullDepth: toFixedNumber(measurements.full.size.z),
        bandMin: toFixedNumber(bandTargets.minHeight),
        bandMax: toFixedNumber(bandTargets.maxHeight),
        yScale: chart.object3D && chart.object3D.scale ? toFixedNumber(chart.object3D.scale.y) : null
      });

      return {
        chart: chart,
        measurements: measurements,
        band: bandTargets,
        envelope: { width: d.targetWidth, depth: d.targetDepth, height: d.targetHeight }
      };
    },

    hide: function () {
      this._cleanup();
      return true;
    }
  };
})(typeof window !== 'undefined' ? window : this);
