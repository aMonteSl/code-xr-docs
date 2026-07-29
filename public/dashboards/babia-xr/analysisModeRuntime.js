// == analysisModeRuntime.js | constantsAndDomUtils (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRAnalysisModeRuntime(root) {
  'use strict';

  var VALID_MODES = new Set(['selection', 'single', 'historical-compare', 'project-evolution', 'dependency-graph']);
  var MODE_PANEL_VIEW_BY_ID = {
    selection: 'visualization-mode',
    single: 'mapping',
    'historical-compare': 'mapping',
    'dependency-graph': 'dependency-graph',
    'project-evolution': 'project-evolution'
  };
  // The header button that opens this selector is painted with the colour of
  // the analysis you are in — the same hexes that already tint the table
  // (MODE_THEME_BY_ID in the analysis-table runtime) and the selector's own
  // option plates. `selection` is the neutral one: while the selector is open
  // you are, precisely, between analyses.
  var MODE_ACCENT_BY_ID = {
    selection: '#64748b',
    single: '#0e7490',
    'historical-compare': '#be123c',
    'dependency-graph': '#7c3aed',
    'project-evolution': '#f59e0b'
  };
  var MODE_CONTROLLER_VIEW_BY_ID = {
    selection: 'visualization-menu',
    single: 'single.mapping',
    'historical-compare': 'historical.selection',
    'dependency-graph': 'dependency.settings',
    'project-evolution': 'project-evolution'
  };
  var PANEL_VIEW_BY_CONTROLLER_VIEW = {
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
  var RAYCAST_CLASS = 'babiaxraycasterclass';
  var SUSPENDED_INTERACTIVE_ATTR = 'data-codexr-suspended-interactive';
  var SUSPENDED_RAYCAST_ATTR = 'data-codexr-suspended-raycast-class';
  var lifecycles = {};
  var state = {
    mode: 'single',
    activeLifecycleMode: 'single',
    requestedMode: 'single',
    transitioning: false,
    pendingTransitionMode: null,
    generation: 0,
    transition: Promise.resolve(),
    modeSnapshots: {},
    lastAuthoritativeViewRevision: 0,
    collaborationRegistered: false,
    pendingNormalRefresh: null,
    lastNormalModeRevision: 0,
    modeOptions: [],
    unregisterPanelView: null,
    selectionPanelView: 'visualization-mode',
    controllerView: 'single.mapping',
    panelRoot: null,
    openingSelectorFromPanel: false
  };

  function debugLog() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[CodeXR.Debug]:');
    root.console?.log?.apply?.(root.console, args);
  }

  function removeAttribute(element, name) {
    if (!element || !name) { return; }
    if (typeof element.removeAttribute === 'function') {
      element.removeAttribute(name);
    } else if (element.attributes && Object.prototype.hasOwnProperty.call(element.attributes, name)) {
      delete element.attributes[name];
    }
  }

  function getClassTokens(element) {
    var value = String(element.getAttribute?.('class') || element.className || '').trim();
    return value ? value.split(/\s+/).filter(Boolean) : [];
  }

  function setClassTokens(element, tokens) {
    if (!element.setAttribute) { return; }
    var value = Array.from(new Set(tokens || [])).filter(Boolean).join(' ');
    element.setAttribute('class', value);
  }

  function setRaycastClass(element, enabled) {
    if (!element) { return; }
    var tokens = getClassTokens(element);
    var hasToken = tokens.includes(RAYCAST_CLASS);
    if (enabled && !hasToken) {
      tokens.push(RAYCAST_CLASS);
      setClassTokens(element, tokens);
      element.classList?.add?.(RAYCAST_CLASS);
    } else if (!enabled && hasToken) {
      setClassTokens(element, tokens.filter(function (token) { return token !== RAYCAST_CLASS; }));
      element.classList?.remove?.(RAYCAST_CLASS);
    } else if (!enabled) {
      element.classList?.remove?.(RAYCAST_CLASS);
    }
  }

  function walkElementTree(element, callback) {
    if (!element || typeof callback !== 'function') { return; }
    callback(element);
    Array.from(element.children || []).forEach(function (child) {
      walkElementTree(child, callback);
    });
  }

  function clearElementRuntimeOverlays(element) {
    var components = element.components || {};
    Object.keys(components).forEach(function (key) {
      var component = components[key];
      if (typeof component.clearTooltips === 'function') {
        component.clearTooltips({ reason: 'analysis-mode-hidden' });
      } else if (typeof component.hideTooltip === 'function') {
        component.hideTooltip({ reason: 'analysis-mode-hidden' });
      }
    });
  }

  function setElementTreeInteractive(element, enabled) {
    walkElementTree(element, function (node) {
      if (!enabled) {
        clearElementRuntimeOverlays(node);
      }
      var interactive = node.getAttribute?.('data-codexr-interactive');
      var raycastTokens = getClassTokens(node);
      var hasRaycastClass = raycastTokens.includes(RAYCAST_CLASS)
        || !!node.classList?.contains?.(RAYCAST_CLASS);
      if (!enabled) {
        if (interactive != null && node.getAttribute?.(SUSPENDED_INTERACTIVE_ATTR) == null) {
          node.setAttribute?.(SUSPENDED_INTERACTIVE_ATTR, String(interactive));
          node.setAttribute?.('data-codexr-interactive', 'false');
        }
        if (hasRaycastClass && node.getAttribute?.(SUSPENDED_RAYCAST_ATTR) == null) {
          node.setAttribute?.(SUSPENDED_RAYCAST_ATTR, 'true');
          setRaycastClass(node, false);
        }
        return;
      }
      var storedInteractive = node.getAttribute?.(SUSPENDED_INTERACTIVE_ATTR);
      if (storedInteractive != null) {
        node.setAttribute?.('data-codexr-interactive', storedInteractive);
        removeAttribute(node, SUSPENDED_INTERACTIVE_ATTR);
      }
      if (node.getAttribute?.(SUSPENDED_RAYCAST_ATTR) === 'true') {
        setRaycastClass(node, true);
        removeAttribute(node, SUSPENDED_RAYCAST_ATTR);
      }
    });
  }

  function setElementTreeVisible(element, visible) {
    if (!element) { return; }
    if (!visible) {
      setElementTreeInteractive(element, false);
    }
    element.setAttribute?.('visible', !!visible);
    if (element.object3D) {
      element.object3D.visible = !!visible;
      element.object3D.traverse?.(function (object) {
        object.visible = !!visible;
      });
    }
    if (visible) {
      setElementTreeInteractive(element, true);
    }
  }

  function setElementSelfVisible(element, visible) {
    if (!element) { return; }
    element.setAttribute?.('visible', !!visible);
    if (element.object3D) {
      element.object3D.visible = !!visible;
    }
  }

  function removeElement(element) {
    if (!element) { return; }
    element.components?.['codexr-dependency-graph']?.disposeView?.();
    if (element.parentNode) {
      element.parentNode.removeChild(element);
      return;
    }
    element.remove?.();
  }

// == analysisModeRuntime.js | surfaceAndRefresh (assembled per manifest.json; see COMPONENTS.md) ==
  function ensureAnalysisSurfaceRuntime() {
    if (root.CodeXRAnalysisSurfaceRuntime) {
      return root.CodeXRAnalysisSurfaceRuntime;
    }
    var SURFACE_ID = 'codexrAnalysisSurface';
    var NORMAL_ROOT_ID = 'codexrNormalAnalysisRoot';
    var registeredRoots = new Map();
    var normalRootsMemory = [];
    var localGeneration = 0;

    function documentRef() {
      return root.document;
    }

    function sceneRef() {
      return documentRef()?.querySelector?.('a-scene') || null;
    }

    function getSurface(createIfMissing) {
      var document = documentRef();
      if (!document) { return null; }
      var cfg = getConfig();
      var surfaceId = String(cfg?.normalSurfaceId || SURFACE_ID);
      var surface = document.getElementById?.(surfaceId);
      if (!surface && createIfMissing !== false && document.createElement) {
        surface = document.createElement('a-entity');
        surface.setAttribute('id', surfaceId);
        surface.setAttribute('data-codexr-analysis-surface', 'true');
        sceneRef()?.appendChild?.(surface);
        debugLog('Analysis surface created', { surfaceId: surfaceId });
      }
      return surface || null;
    }

    function getNormalRoot() {
      var document = documentRef();
      if (!document) { return null; }
      var cfg = getConfig();
      return document.getElementById?.(String(cfg?.normalRootId || NORMAL_ROOT_ID))
        || document.querySelector?.('[data-codexr-normal-root="true"]')
        || null;
    }

    function rememberNormalRoots(roots) {
      roots.forEach(function (element) {
        if (element && !normalRootsMemory.includes(element)) {
          normalRootsMemory.push(element);
        }
      });
    }

    function getNormalSurfaceRoots() {
      var document = documentRef();
      var surface = getSurface(false);
      var roots = normalRootsMemory.filter(Boolean);
      var normalRoot = getNormalRoot();
      if (normalRoot) {
        roots.push(normalRoot);
      }
      surface?.querySelectorAll?.('[data-codexr-normal-root="true"], [data-codexr-analysis-mode="single"]')
        ?.forEach(function (element) { roots.push(element); });
      document?.querySelectorAll?.('[data-codexr-normal-root="true"]')
        ?.forEach(function (element) { roots.push(element); });
      if (!roots.length) {
        getNormalVisualizationRoots().forEach(function (element) { roots.push(element); });
      }
      roots = uniqueElements(roots);
      rememberNormalRoots(roots);
      return roots;
    }

    function getModeRoots(mode) {
      var document = documentRef();
      if (!document) { return []; }
      var roots = [];
      var surface = getSurface(false);
      registeredRoots.forEach(function (entry) {
        if (entry.mode === mode && entry.element?.isConnected !== false) {
          roots.push(entry.element);
        }
      });
      document.querySelectorAll?.('[data-codexr-analysis-root="true"]').forEach(function (element) {
        if (element.getAttribute?.('data-codexr-analysis-mode') === mode) {
          roots.push(element);
        }
      });
      surface?.querySelectorAll?.('[data-codexr-analysis-mode="' + mode + '"]')?.forEach(function (element) {
        roots.push(element);
      });
      return uniqueElements(roots);
    }

    function mountRoot(mode, element) {
      if (!element) { return null; }
      var surface = getSurface(true);
      if (!surface) { return element; }
      element.setAttribute?.('data-codexr-analysis-root', 'true');
      element.setAttribute?.('data-codexr-analysis-mode', mode);
      if (element.parentNode !== surface) {
        surface.appendChild(element);
      }
      setElementSelfVisible(surface, true);
      setElementTreeVisible(element, true);
      registeredRoots.set(element.id || mode + ':' + registeredRoots.size, {
        mode: mode,
        element: element
      });
      debugLog('Surface root mounted', {
        mode: mode,
        id: element.id || '',
        surfaceChildren: surface.children?.length || 0
      });
      return element;
    }

    function removeMode(mode) {
      if (mode === 'single') {
        return detachNormalRoots('remove-single-mode');
      }
      var removed = 0;
      getModeRoots(mode).forEach(function (element) {
        removeElement(element);
        removed += 1;
      });
      registeredRoots.forEach(function (entry, key) {
        if (entry.mode === mode) {
          registeredRoots.delete(key);
        }
      });
      return removed;
    }

    function isPreservedRoot(element) {
      return element?.getAttribute?.('data-codexr-preserve') === 'true';
    }

    function removeTransientRoots() {
      var document = documentRef();
      if (!document) { return []; }
      var removed = [];
      var normalRoot = getNormalRoot();
      var surface = getSurface(false);
      document.querySelectorAll?.('[data-codexr-analysis-root="true"]').forEach(function (element) {
        if (element === normalRoot || element.getAttribute?.('data-codexr-analysis-mode') === 'single') {
          return;
        }
        // Preserved roots keep their state across the selector (the mode
        // restores them as left, like the hidden single-mode roots): hide,
        // never remove.
        if (isPreservedRoot(element)) {
          setElementTreeVisible(element, false);
          return;
        }
        removed.push(element.id || element.getAttribute?.('data-codexr-analysis-mode') || 'anonymous-root');
        removeElement(element);
      });
      surface?.children && Array.from(surface.children).forEach(function (child) {
        if (child === normalRoot || child.getAttribute?.('data-codexr-analysis-mode') === 'single') {
          return;
        }
        if (isPreservedRoot(child)) {
          setElementTreeVisible(child, false);
          return;
        }
        removed.push(child.id || child.getAttribute?.('data-codexr-analysis-mode') || 'anonymous-child');
        removeElement(child);
      });
      registeredRoots.forEach(function (entry, key) {
        if (entry.mode !== 'single' && !isPreservedRoot(entry.element)) {
          registeredRoots.delete(key);
        }
      });
      return removed;
    }

    // Hides a mode's preserved roots through the same visibility/interaction
    // bookkeeping the surface uses everywhere else (a second suspension
    // mechanism would leak: mountRoot only restores this one).
    function preserveModeRoots(mode) {
      var hidden = 0;
      getModeRoots(mode).forEach(function (element) {
        if (isPreservedRoot(element)) {
          setElementTreeVisible(element, false);
          hidden += 1;
        }
      });
      return hidden;
    }

    function detachNormalRoots(reason) {
      var surface = getSurface(false);
      var roots = getNormalSurfaceRoots();
      rememberNormalRoots(roots);
      roots.forEach(function (element) {
        setElementTreeVisible(element, false);
      });
      var activeNonNormalRootCount = 0;
      surface?.querySelectorAll?.('[data-codexr-analysis-root="true"]')?.forEach(function (element) {
        if (element.getAttribute?.('data-codexr-analysis-mode') !== 'single'
          && element.getAttribute?.('visible') !== false) {
          activeNonNormalRootCount += 1;
        }
      });
      if (surface && activeNonNormalRootCount === 0) {
        setElementTreeVisible(surface, false);
      }
      debugLog('Surface normal roots detached', {
        reason: reason || '',
        rootCount: roots.length,
        ids: roots.map(function (element) { return element.id || element.tagName || 'anonymous'; })
      });
      return roots.length;
    }

    function mountNormalRoots() {
      var surface = getSurface(true);
      if (!surface) { return 0; }
      var roots = getNormalSurfaceRoots();
      rememberNormalRoots(roots);
      setElementSelfVisible(surface, true);
      roots.forEach(function (element) {
        element.setAttribute?.('data-codexr-analysis-root', 'true');
        element.setAttribute?.('data-codexr-analysis-mode', 'single');
        if (!element.getAttribute?.('data-codexr-normal-root')) {
          element.setAttribute?.('data-codexr-normal-root', 'true');
        }
        if (element.parentNode !== surface) {
          surface.appendChild(element);
        }
        setElementTreeVisible(element, true);
      });
      debugLog('Surface normal roots mounted', {
        rootCount: roots.length,
        ids: roots.map(function (element) { return element.id || element.tagName || 'anonymous'; })
      });
      return roots.length;
    }

    function setNormalVisible(visible) {
      var rootCount = visible ? mountNormalRoots() : detachNormalRoots('set-normal-hidden');
      debugLog('Surface normal visibility changed', {
        visible: !!visible,
        rootCount: rootCount
      });
      return rootCount;
    }

    function clearForSelection(reason) {
      localGeneration += 1;
      var generation = localGeneration;
      var surface = getSurface(false);
      debugLog('Surface clear requested', {
        reason: reason || '',
        generation: generation,
        surfaceFound: !!surface,
        childCount: surface?.children?.length || 0
      });
      var removed = removeTransientRoots();
      var detachedNormalCount = detachNormalRoots(reason || 'selection-clear');
      surface = getSurface(false);
      if (surface) {
        setElementTreeVisible(surface, false);
      }
      var remaining = surface?.querySelectorAll?.('[data-codexr-analysis-root="true"]')?.length || 0;
      debugLog('Surface cleared', {
        generation: generation,
        removed: removed,
        detachedNormalCount: detachedNormalCount,
        remainingRoots: remaining
      });
      return {
        generation: generation,
        removed: removed,
        detachedNormalCount: detachedNormalCount,
        remainingRoots: remaining
      };
    }

    function activateMode(mode) {
      var surface = getSurface(true);
      if (surface) {
        setElementSelfVisible(surface, true);
      }
      if (mode === 'single') {
        removeTransientRoots();
        setNormalVisible(true);
      } else {
        setNormalVisible(false);
      }
      debugLog('Mode activated on surface', {
        mode: mode,
        childCount: surface?.children?.length || 0
      });
    }

    function getSnapshot() {
      var surface = getSurface(false);
      var roots = surface?.querySelectorAll?.('[data-codexr-analysis-root="true"]') || [];
      return {
        surfaceId: surface?.id || null,
        surfaceVisible: surface?.getAttribute?.('visible') !== false,
        childCount: surface?.children?.length || 0,
        visualRootCount: roots.length || 0,
        roots: Array.from(roots).map(function (element) {
          return {
            id: element.id || '',
            mode: element.getAttribute?.('data-codexr-analysis-mode') || '',
            visible: element.getAttribute?.('visible') !== false
          };
        }),
        registeredRootCount: registeredRoots.size,
        generation: localGeneration
      };
    }

    root.CodeXRAnalysisSurfaceRuntime = {
      getSurface: function () { return getSurface(true); },
      mountRoot: mountRoot,
      removeMode: removeMode,
      preserveModeRoots: preserveModeRoots,
      clearForSelection: clearForSelection,
      setNormalVisible: setNormalVisible,
      activateMode: activateMode,
      getSnapshot: getSnapshot,
      __testing: {
        setElementTreeVisible: setElementTreeVisible,
        clearForSelection: clearForSelection,
        removeTransientRoots: removeTransientRoots,
        detachNormalRoots: detachNormalRoots,
        mountNormalRoots: mountNormalRoots
      }
    };
    return root.CodeXRAnalysisSurfaceRuntime;
  }

  function getNormalRefreshRuntime() {
    if (root.CodeXRNormalAnalysisRefreshRuntime) {
      return root.CodeXRNormalAnalysisRefreshRuntime;
    }
    var refreshState = {
      generation: 0,
      completedGeneration: 0,
      refreshing: false,
      waiters: []
    };
    function resolveWaiters() {
      refreshState.waiters = refreshState.waiters.filter(function (waiter) {
        if (refreshState.completedGeneration <= waiter.baseline) {
          return true;
        }
        root.clearTimeout?.(waiter.timer);
        waiter.resolve({
          completed: true,
          generation: refreshState.completedGeneration
        });
        return false;
      });
    }
    root.CodeXRNormalAnalysisRefreshRuntime = {
      begin: function () {
        refreshState.generation += 1;
        refreshState.refreshing = true;
        return refreshState.generation;
      },
      complete: function (generation) {
        refreshState.completedGeneration = Math.max(
          refreshState.completedGeneration,
          Number(generation || refreshState.generation)
        );
        refreshState.refreshing = refreshState.completedGeneration < refreshState.generation;
        resolveWaiters();
        return refreshState.completedGeneration;
      },
      waitForCompletionAfter: function (baseline, timeoutMs) {
        if (refreshState.completedGeneration > Number(baseline || 0)) {
          return Promise.resolve({
            completed: true,
            generation: refreshState.completedGeneration
          });
        }
        return new Promise(function (resolve) {
          var waiter = {
            baseline: Number(baseline || 0),
            resolve: resolve,
            timer: null
          };
          waiter.timer = root.setTimeout?.(function () {
            refreshState.waiters = refreshState.waiters.filter(function (candidate) {
              return candidate !== waiter;
            });
            resolve({
              completed: false,
              generation: refreshState.completedGeneration,
              reason: 'refresh-timeout'
            });
          }, Math.max(500, Number(timeoutMs || 3500)));
          refreshState.waiters.push(waiter);
        });
      },
      getState: function () {
        return {
          generation: refreshState.generation,
          completedGeneration: refreshState.completedGeneration,
          refreshing: refreshState.refreshing
        };
      }
    };
    return root.CodeXRNormalAnalysisRefreshRuntime;
  }

// == analysisModeRuntime.js | selectorAndPanel (assembled per manifest.json; see COMPONENTS.md) ==
  function invoke(lifecycle, method, context) {
    if (typeof lifecycle?.[method] !== 'function') {
      return Promise.resolve();
    }
    return Promise.resolve(lifecycle[method](context));
  }

  /**
   * Like invoke(), but failures are logged and swallowed (sync throws too).
   * Lifecycle hooks run through this: a mode that
   * fails to clean up may degrade itself, but it must never abort the
   * transition — otherwise the table keeps the old mode's theme and the
   * suspended interactions are never restored (dead clicks).
   */
  function invokeSafely(lifecycle, method, context) {
    try {
      return invoke(lifecycle, method, context).catch(function (error) {
        root.console?.error?.('[CodeXR][AnalysisMode] Lifecycle ' + method + ' failed:', error);
      });
    } catch (error) {
      root.console?.error?.('[CodeXR][AnalysisMode] Lifecycle ' + method + ' failed:', error);
      return Promise.resolve();
    }
  }

  function register(mode, lifecycle) {
    if (!VALID_MODES.has(mode) || !lifecycle) {
      return function () {};
    }
    lifecycles[mode] = lifecycle;
    if (state.mode === mode && !state.transitioning) {
      void invoke(lifecycle, 'activate', {
        from: mode,
        to: mode,
        generation: state.generation,
        context: { reason: 'late-registration' }
      }).then(function () {
        if (!state.transitioning && state.mode === mode) {
          state.activeLifecycleMode = mode;
        }
      });
    }
    return function () {
      if (lifecycles[mode] === lifecycle) {
        delete lifecycles[mode];
      }
    };
  }

  function createEntity(tagName, attributes) {
    var element = root.document?.createElement?.(tagName);
    Object.keys(attributes || {}).forEach(function (key) {
      element?.setAttribute?.(key, attributes[key]);
    });
    return element;
  }

  function createModeButton(option, y) {
    var disabled = option.disabled === true;
    var disabledReason = String(option.disabledReason || 'This visualization mode is not available right now.');
    var button = createEntity('a-plane', {
      position: '0 ' + y + ' 0.02',
      width: 4.5,
      height: 0.48,
      material: 'color: ' + (disabled ? '#475569' : (option.color || '#0e7490')) + '; opacity: ' + (disabled ? '0.62' : '0.96') + '; shader: flat',
      class: 'codexr-analysis-mode-option',
      'data-codexr-interactive': 'true',
      'data-codexr-mode-option': option.id,
      'data-codexr-disabled': disabled ? 'true' : 'false'
    });
    var label = createEntity('a-text', {
      value: option.label,
      position: '0 0 0.02',
      width: 6.8,
      color: disabled ? '#cbd5e1' : '#ffffff',
      align: 'center',
      baseline: 'center'
    });
    button?.appendChild?.(label);
    if (disabled) {
      var tooltip = createEntity('a-entity', {
        visible: false,
        position: '0 -0.46 0.08',
        'data-codexr-mode-disabled-tooltip': option.id
      });
      tooltip.appendChild?.(createEntity('a-plane', {
        width: 4.7,
        height: 0.5,
        material: 'color: #111827; opacity: 0.96; shader: flat'
      }));
      tooltip.appendChild?.(createEntity('a-text', {
        value: disabledReason,
        position: '0 0 0.03',
        width: 5.8,
        color: '#fde68a',
        align: 'center',
        baseline: 'center',
        'wrap-count': 44
      }));
      var setTooltipVisible = function (visible) {
        tooltip.setAttribute?.('visible', !!visible);
      };
      button.appendChild?.(tooltip);
      button.addEventListener?.('mouseenter', function () { setTooltipVisible(true); });
      button.addEventListener?.('mouseleave', function () { setTooltipVisible(false); });
      button.addEventListener?.('raycaster-intersected', function () { setTooltipVisible(true); });
      button.addEventListener?.('raycaster-intersected-cleared', function () { setTooltipVisible(false); });
    }
    button?.addEventListener?.('click', function () {
      if (disabled) {
        debugLog('Visualization mode option disabled', option.id, disabledReason);
        return;
      }
      debugLog('Visualization mode option clicked', option.id);
      option.onSelect?.();
    });
    return button;
  }

  function requestModeActivation(mode) {
    if (!VALID_MODES.has(mode) || mode === 'selection') {
      return Promise.resolve(false);
    }
    debugLog('Requesting analysis mode activation', mode, {
      currentMode: state.mode,
      activeLifecycleMode: state.activeLifecycleMode,
      transitioning: state.transitioning
    });
    var client = root.CodeXRCollaborationRuntime?.getClient?.(root);
    client?.sendMessage?.('analysis-mode-activate', { mode: mode });
    return changeAnalysis(mode, {
      reason: 'local-analysis-mode-option',
      controllerView: getDefaultControllerViewForMode(mode),
      panelViewId: getPanelViewForControllerView(getDefaultControllerViewForMode(mode))
    });
  }

  function renderModeOptions() {
    if (!state.panelRoot) { return; }
    while (state.panelRoot.firstChild) {
      state.panelRoot.removeChild(state.panelRoot.firstChild);
    }
    state.panelRoot.appendChild(createEntity('a-text', {
      value: 'Choose how the analysis table represents the data.',
      position: '0 1.18 0.02',
      width: 5.5,
      color: '#cde7ff',
      align: 'center',
      baseline: 'center'
    }));
    var options = [{
      id: 'single',
      label: 'Normal analysis',
      color: '#0e7490',
      onSelect: function () {
        void requestModeActivation('single');
      }
    }].concat(state.modeOptions);
    options.forEach(function (option, index) {
      state.panelRoot.appendChild(createModeButton(option, 0.55 - (index * 0.62)));
    });
  }

  function registerModeOption(option) {
    if (!option?.id || typeof option.onSelect !== 'function') {
      return function () {};
    }
    state.modeOptions = state.modeOptions.filter(function (candidate) {
      return candidate.id !== option.id;
    });
    state.modeOptions.push(option);
    renderModeOptions();
    return function () {
      state.modeOptions = state.modeOptions.filter(function (candidate) {
        return candidate.id !== option.id;
      });
      renderModeOptions();
    };
  }

  function resumeRequestedMode() {
    debugLog('Resuming requested analysis mode', state.requestedMode || 'single');
    root.CodeXRCollaborationRuntime?.getClient?.(root)
      ?.sendMessage?.('analysis-mode-activate', { mode: state.requestedMode || 'single' });
    void changeAnalysis(state.requestedMode || 'single', {
      reason: 'local-visualization-mode-toggle',
      controllerView: getDefaultControllerViewForMode(state.requestedMode || 'single')
    });
  }

  function openSelector() {
    debugLog('Opening visualization mode selector', {
      currentMode: state.mode,
      activeLifecycleMode: state.activeLifecycleMode,
      transitioning: state.transitioning
    });
    state.selectionPanelView = 'visualization-mode';
    return changeAnalysis('selection', {
      reason: 'local-mode-selection',
      controllerView: 'visualization-menu',
      panelViewId: 'visualization-mode'
    }).then(function () {
      root.CodeXRCollaborationRuntime?.getClient?.(root)
        ?.sendMessage?.('analysis-mode-selection', {});
      return true;
    });
  }

  function mountModePanel(attempt) {
    if (state.unregisterPanelView) { return; }
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    if (!mappingRuntime?.registerPanelView || !mappingRuntime.isPanelReady?.()) {
      // Event-driven: the controller calls back the moment its panel exists.
      // A capped retry here used to permanently lose the analysis selector on
      // slow scenes. The interval is only a fallback for a controller build
      // without whenPanelReady (mixed-version scene) or one that loads late.
      if (!state.modePanelMountQueued) {
        state.modePanelMountQueued = true;
        var rearm = function () {
          state.modePanelMountQueued = false;
          mountModePanel(attempt);
        };
        if (mappingRuntime?.whenPanelReady) {
          mappingRuntime.whenPanelReady(rearm);
        } else {
          // unref (Node-only) keeps this browser-oriented retry from pinning
          // test processes open; in the browser it is a no-op.
          root.setTimeout?.(rearm, 250)?.unref?.();
        }
      }
      return;
    }
    state.panelRoot = createEntity('a-entity', {
      id: 'codexrVisualizationModePanel',
      position: '0 0 0.04'
    });
    state.unregisterPanelView = mappingRuntime.registerPanelView({
      id: 'visualization-mode',
      title: 'Visualization mode',
      // A word instead of the old 'V': the button names what it opens, and
      // its colour says which analysis you are currently in.
      buttonLabel: 'Analyses',
      buttonWidth: 0.9,
      buttonColor: MODE_ACCENT_BY_ID[state.mode] || MODE_ACCENT_BY_ID.single,
      headerButton: true,
      panelHeight: 3.35,
      content: state.panelRoot,
      onShow: function () {
        state.selectionPanelView = 'visualization-mode';
        if (state.mode !== 'selection' && !state.openingSelectorFromPanel) {
          state.openingSelectorFromPanel = true;
          debugLog('Visualization mode panel shown directly; forcing selection mode', {
            currentMode: state.mode,
            activeLifecycleMode: state.activeLifecycleMode,
            transitioning: state.transitioning
          });
          void openSelector().finally(function () {
            state.openingSelectorFromPanel = false;
          });
        }
      },
      onToggleActive: resumeRequestedMode
    });
    if (!state.unregisterPanelView) {
      state.panelRoot = null;
      root.CodeXRMappingUiRuntime?.whenPanelReady?.(function () {
        mountModePanel(attempt);
      });
      return;
    }
    // One unconditional marker so a scene can be checked at a glance: if this
    // line is absent from the console, the selector view never registered.
    root.console?.log?.('[CodeXR] Analysis selector registered on the controller panel.');
    renderModeOptions();
  }

  async function performTransition(mode, context, generation) {
    var previousMode = state.activeLifecycleMode;
    var activationToken = createActivationToken(mode, generation);
    debugLog('Analysis mode transition started', {
      from: previousMode,
      to: mode,
      generation: generation,
      reason: context?.reason || ''
    });
    if (previousMode !== mode) {
      var capturedState = await invokeSafely(lifecycles[previousMode], 'captureState', {
        from: previousMode,
        to: mode,
        generation: generation
      });
      if (capturedState !== undefined) {
        state.modeSnapshots[previousMode] = capturedState;
      }
      await invokeSafely(lifecycles[previousMode], 'deactivate', {
        from: previousMode,
        to: mode,
        generation: generation,
        token: activationToken
      });
      if (state.activeLifecycleMode === previousMode) {
        state.activeLifecycleMode = null;
      }
    }
    if (generation !== state.generation) { return false; }
    releasePrimaryAnalysisOwnership(mode);
    await invokeSafely(lifecycles[mode], 'restoreState', {
      from: previousMode,
      to: mode,
      generation: generation,
      savedState: state.modeSnapshots[mode],
      context: context || null,
      token: activationToken
    });
    if (generation !== state.generation) { return false; }
    applyAnalysisMode(mode, context || null);
    try {
      await invoke(lifecycles[mode], 'activate', {
        from: previousMode,
        to: mode,
        generation: generation,
        context: context || null,
        savedState: state.modeSnapshots[mode],
        token: activationToken
      });
    } catch (error) {
      if (generation === state.generation) {
        await invokeSafely(lifecycles[mode], 'deactivate', {
          from: mode,
          to: 'selection',
          generation: generation,
          context: { reason: 'activation-error', error: error },
          token: activationToken
        });
        applyAnalysisMode('selection', { panelViewId: state.selectionPanelView });
        await clearVisualizationsForSelection({ generation: generation });
      }
      // Say it on the controller too: a failed activation silently bounces the
      // user back to the analysis selector, which reads as "this analysis just
      // won't open" with no clue why.
      root.CodeXRMappingUiRuntime?.setStatusMessage?.(
        'CodeXR could not open this analysis. ' + (error instanceof Error ? error.message : String(error)),
        'error',
        6000
      );
      console.error('[CodeXR][AnalysisMode] Could not activate mode:', mode, error);
      return false;
    }
    if (generation !== state.generation) {
      await invokeSafely(lifecycles[mode], 'deactivate', {
        from: mode,
        to: null,
        generation: generation,
        context: { reason: 'superseded-activation' },
        token: activationToken
      });
      if (state.activeLifecycleMode === mode) {
        state.activeLifecycleMode = null;
      }
      return false;
    }
    // The mode was applied once before activate (the lifecycle needs it in
    // place while it mounts). Re-applying it here would redo the table geometry
    // and the panel routing — and overwrite the view the lifecycle just chose
    // (historical routes itself to the comparison or the source selector).
    debugLog('Analysis mode transition completed', {
      mode: mode,
      activeLifecycleMode: state.activeLifecycleMode,
      generation: generation
    });
    return true;
  }

// == analysisModeRuntime.js | transitionsAndViews (assembled per manifest.json; see COMPONENTS.md) ==
  function changeAnalysis(mode, context) {
    if (!VALID_MODES.has(mode)) {
      return Promise.reject(new Error('Unsupported CodeXR analysis mode: ' + mode));
    }
    // Same-mode dedupe: entering the mode that is already fully active only
    // re-applies the controller/panel routing — it must NOT queue another
    // deactivate/activate cycle. Every entry fires twice (the runtime's direct
    // local change plus the server's authoritative analysis-view echo), and the
    // duplicated lifecycle pass re-parked and re-built everything: the entry
    // flicker, and — with a comparison result present — a full chart rebuild
    // with the scene left empty for its stabilization wait.
    // A snapshot only forces a re-activation for lifecycles that declare they
    // consume it (single: the analysis-view snapshot IS its data-refresh path).
    // Modes fed by their own shared entity — historical, dependency graph,
    // project evolution — must NOT re-run their whole lifecycle for an echo:
    // that second pass re-applied the table geometry and rebuilt the panel
    // rows over an already-correct scene, which is what the entry flicker was.
    var snapshotDrivesReactivation = !!context?.snapshot
      && lifecycles[mode]?.consumesSnapshot === true;
    if (mode === state.mode && state.activeLifecycleMode === mode && !state.transitioning && !snapshotDrivesReactivation) {
      debugLog('Analysis mode transition skipped (mode already active)', {
        mode: mode,
        reason: context?.reason || ''
      });
      applyAnalysisMode(mode, context || null);
      return Promise.resolve(true);
    }
    // In-flight dedupe: a transition to this exact mode is already queued
    // (every entry fires twice — direct call + authoritative echo, in either
    // order). Ride the in-flight transition and re-apply only this caller's
    // routing once it lands, instead of queueing a second lifecycle cycle.
    if (state.transitioning && state.pendingTransitionMode === mode) {
      debugLog('Analysis mode transition merged into in-flight transition', {
        mode: mode,
        reason: context?.reason || ''
      });
      return state.transition.then(function (result) {
        if (state.mode === mode && !state.transitioning) {
          applyAnalysisMode(mode, context || null);
        }
        return result;
      });
    }
    var generation = ++state.generation;
    state.transitioning = true;
    // Target of the latest queued transition — lets the authoritative-echo
    // handler recognise a duplicate before it queues a second full cycle.
    state.pendingTransitionMode = mode;
    var previousTransition = state.transition.catch(function () {});
    var nextTransition = previousTransition.then(function () {
      return performTransition(mode, context, generation);
    }).finally(function () {
      if (generation === state.generation) {
        state.transitioning = false;
        state.pendingTransitionMode = null;
      }
    });
    state.transition = nextTransition;
    return nextTransition;
  }

  function deactivate(mode, context) {
    if (state.mode !== mode) {
      return Promise.resolve(false);
    }
    return changeAnalysis('single', context);
  }

  function getConfig() {
    var script = root.document?.getElementById?.('codexr-tooling-config-xr-mapping-ui');
    try { return JSON.parse(script?.textContent || '{}'); } catch { return {}; }
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

  function getNormalVisualizationRoots() {
    var document = root.document;
    if (!document) {
      return [];
    }
    var config = getConfig();
    var roots = [];
    collectConfiguredIds(config, [
      'normalRootId',
      'normalEntityIds',
      'visualizationEntityIds',
      'chartEntityIds',
      'chartEntityId',
      'chartId'
    ]).forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) {
        roots.push(element);
      }
    });
    if (config?.chartSelector && typeof document.querySelector === 'function') {
      var selected = document.querySelector(config.chartSelector);
      if (selected) {
        roots.push(selected);
      }
    }
    document.querySelectorAll?.('[data-codexr-normal-root="true"], [data-codexr-normal-visualization="true"]')
      .forEach(function (element) {
        roots.push(element);
      });
    return uniqueElements(roots);
  }

  function getNormalMappingTargetIds(config) {
    var ids = collectConfiguredIds(config, ['chartEntityIds', 'chartEntityId', 'chartId']);
    if (!ids.length) {
      var containedChartIds = [];
      getNormalVisualizationRoots().forEach(function (element) {
        element.querySelectorAll?.('[codexr-chart-containment]')
          .forEach(function (chart) {
            if (chart.id) {
              containedChartIds.push(chart.id);
            }
          });
      });
      ids = containedChartIds.length ? containedChartIds : getNormalVisualizationRoots()
        .map(function (element) { return element.id; })
        .filter(Boolean);
    }
    return Array.from(new Set(ids));
  }

  function setNormalVisualizationVisible(visible) {
    var surfaceRuntime = ensureAnalysisSurfaceRuntime();
    surfaceRuntime.setNormalVisible(visible);
  }

  function setTableMode(mode) {
    var appliedMode = root.CodeXRAnalysisTableRuntime?.setMode?.(mode);
    if (appliedMode) {
      return appliedMode;
    }
    root.document?.getElementById?.('codexrAnalysisTable')
      ?.setAttribute?.('codexr-analysis-table', 'mode', mode);
    return mode;
  }

  function getDefaultPanelViewForMode(mode) {
    return MODE_PANEL_VIEW_BY_ID[mode] || 'mapping';
  }

  function getDefaultControllerViewForMode(mode) {
    // A mode lifecycle may resolve its default view from its own live state
    // (e.g. historical: mapping when a comparison exists, selector otherwise).
    // This keeps the local transition and the authoritative server echo — which
    // both fall back to this default — from disagreeing on the view.
    var lifecycleView = lifecycles[mode]?.resolveControllerView?.();
    return lifecycleView || MODE_CONTROLLER_VIEW_BY_ID[mode] || 'single.mapping';
  }

  function getPanelViewForControllerView(controllerView) {
    return PANEL_VIEW_BY_CONTROLLER_VIEW[controllerView] || 'mapping';
  }

  function resolveControllerView(mode, context) {
    var snapshotView = context?.snapshot?.controllerView;
    return context?.controllerView
      || snapshotView
      || getDefaultControllerViewForMode(mode);
  }

  function resolveModePanelView(mode, context) {
    var controllerView = resolveControllerView(mode, context || null);
    return context?.panelViewId
      || getPanelViewForControllerView(controllerView)
      || (mode === 'selection' ? state.selectionPanelView : null)
      || getDefaultPanelViewForMode(mode);
  }

  function applyControllerView(mode, controllerView, panelViewId, context) {
    var controller = root.CodeXRAnalysisControllerRuntime || root.CodeXRMappingUiRuntime;
    if (controller?.showView) {
      return controller.showView(controllerView, {
        mode: mode,
        panelViewId: panelViewId,
        reason: context?.reason || 'analysis-mode',
        mappingContextId: context?.mappingContextId || null
      });
    }
    root.CodeXRMappingUiRuntime?.showPanelView?.(panelViewId);
    return {
      mode: mode,
      controllerView: controllerView,
      panelView: panelViewId
    };
  }

  function getLifecycleMappingContext(mode) {
    var value = lifecycles[mode]?.mappingContextId;
    if (typeof value === 'function') {
      value = value();
    }
    if (value === undefined) {
      value = mode === 'single'
        ? 'normal-analysis'
        : mode === 'historical-compare'
          ? 'historical-comparison'
          : mode === 'project-evolution'
            ? 'project-evolution'
            : null;
    }
    return value == null ? null : String(value);
  }

  function createActivationToken(mode, generation) {
    return {
      mode: mode,
      generation: generation,
      isCurrent: function () {
        return generation === state.generation
          && (
            state.pendingTransitionMode === mode
            || (!state.transitioning && state.mode === mode)
          );
      }
    };
  }

  function captureElementTransform(element) {
    var object = element?.object3D;
    if (!element || !object) { return null; }
    return {
      id: element.id || '',
      position: {
        x: Number(object.position?.x || 0),
        y: Number(object.position?.y || 0),
        z: Number(object.position?.z || 0)
      },
      rotation: {
        x: Number(object.rotation?.x || 0),
        y: Number(object.rotation?.y || 0),
        z: Number(object.rotation?.z || 0)
      },
      scale: {
        x: Number(object.scale?.x || 1),
        y: Number(object.scale?.y || 1),
        z: Number(object.scale?.z || 1)
      }
    };
  }

  function captureChartTransforms(chartIds) {
    return (chartIds || []).map(function (chartId) {
      return captureElementTransform(root.document?.getElementById?.(chartId));
    }).filter(Boolean);
  }

  function restoreChartTransforms(snapshots) {
    (snapshots || []).forEach(function (snapshot) {
      var element = snapshot?.id ? root.document?.getElementById?.(snapshot.id) : null;
      var object = element?.object3D;
      if (!element || !object) { return; }
      object.position?.set?.(
        snapshot.position.x,
        snapshot.position.y,
        snapshot.position.z
      );
      object.rotation?.set?.(
        snapshot.rotation.x,
        snapshot.rotation.y,
        snapshot.rotation.z
      );
      object.scale?.set?.(
        snapshot.scale.x,
        snapshot.scale.y,
        snapshot.scale.z
      );
      object.updateMatrixWorld?.(true);
      element.setAttribute?.(
        'position',
        snapshot.position.x + ' ' + snapshot.position.y + ' ' + snapshot.position.z
      );
      element.setAttribute?.(
        'rotation',
        (snapshot.rotation.x * 180 / Math.PI) + ' '
          + (snapshot.rotation.y * 180 / Math.PI) + ' '
          + (snapshot.rotation.z * 180 / Math.PI)
      );
      element.setAttribute?.(
        'scale',
        snapshot.scale.x + ' ' + snapshot.scale.y + ' ' + snapshot.scale.z
      );
      var containment = element.components?.['codexr-chart-containment'];
      if (containment) {
        containment.pendingRenormalizeReason = null;
        containment.captureStableTransform?.();
      }
    });
  }

  /**
   * Clear the globally-owned routing left by the outgoing analysis before the
   * incoming lifecycle is allowed to mount anything. Mode-owned data/geometry
   * remains the lifecycle's responsibility and can be preserved for re-entry.
   */
  function releasePrimaryAnalysisOwnership(nextMode) {
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    mappingRuntime?.setMappingControlsEnabled?.(true, '');
    mappingRuntime?.setChartEntityIds?.([], { renormalize: false });
    if (nextMode !== 'project-evolution') {
      var sceneChartId = mappingRuntime?.getSceneChartId?.();
      var restoredChartId = nextMode === 'single'
        ? state.modeSnapshots.single?.chartId
        : null;
      if (restoredChartId && mappingRuntime?.getState?.()?.chartId !== restoredChartId) {
        mappingRuntime?.selectChart?.(restoredChartId, { applyToEntities: false });
      } else if (
        !restoredChartId
        && sceneChartId
        && mappingRuntime?.getState?.()?.chartId !== sceneChartId
      ) {
        mappingRuntime?.selectChart?.(sceneChartId, { applyToEntities: false });
      }
    }
    var mappingContextId = getLifecycleMappingContext(nextMode);
    if (nextMode === 'single') {
      mappingRuntime?.switchMappingContext?.('normal-analysis', {
        reason: 'analysis-mode-change-single',
        // Switching ownership must never rewrite the parked normal chart.
        // Its lifecycle restores the saved selector state and exact transform.
        applyToEntities: false
      });
      return;
    }
    if (mappingContextId) {
      mappingRuntime?.switchMappingContext?.(mappingContextId, {
        reason: 'analysis-mode-change-' + nextMode,
        // Git modes build/restore their own targets and consume the profile
        // only after their lifecycle has mounted its visual surface.
        applyToEntities: false
      });
    }
  }

// == analysisModeRuntime.js | modeApplication (assembled per manifest.json; see COMPONENTS.md) ==
  function applyAnalysisMode(mode, context) {
    var nextMode = VALID_MODES.has(mode) ? mode : 'single';
    var controllerView = resolveControllerView(nextMode, context || null);
    if (nextMode !== 'selection') {
      state.requestedMode = nextMode;
    }
    state.activeLifecycleMode = nextMode;
    state.mode = nextMode;
    state.controllerView = controllerView;
    setTableMode(nextMode);
    // The selector's header button carries the accent of the analysis you are
    // in, so the panel tells you where you are before you open anything.
    root.CodeXRMappingUiRuntime?.setPanelViewButtonColor?.(
      'visualization-mode',
      MODE_ACCENT_BY_ID[nextMode] || MODE_ACCENT_BY_ID.single
    );
    var panelViewId = resolveModePanelView(nextMode, context || null);
    applyControllerView(nextMode, controllerView, panelViewId, context || null);
    return nextMode;
  }

  function removeResidualVisualRoots() {
    var document = root.document;
    if (!document) {
      debugLog('Residual visual root cleanup skipped: document unavailable');
      return;
    }
    var roots = [];
    ['codexrHistoricalComparisonRoot', 'codexrDependencyGraph'].forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) {
        roots.push(element);
      }
    });
    document.querySelectorAll?.('[data-codexr-analysis-root="true"]').forEach(function (element) {
      if (
        element.getAttribute?.('data-codexr-analysis-mode') === 'single'
        || element.getAttribute?.('data-codexr-normal-root') === 'true'
      ) {
        return;
      }
      if (!roots.includes(element)) {
        roots.push(element);
      }
    });
    // Preserved roots are saved state, not residue: their mode hides them and
    // restores them as left (mirrors removeTransientRoots in the surface).
    roots = roots.filter(function (element) {
      return element.getAttribute?.('data-codexr-preserve') !== 'true';
    });
    debugLog('Residual visual root cleanup', {
      count: roots.length,
      ids: roots.map(function (element) {
        return element.id || element.getAttribute?.('data-codexr-analysis-mode') || element.tagName || 'unknown';
      })
    });
    roots.forEach(function (element) {
      removeElement(element);
    });
  }

  async function clearVisualizationsForSelection(activation) {
    var reason = 'visualization-mode-selection';
    debugLog('Clearing active visualizations for visualization selector', {
      generation: activation?.generation,
      activeLifecycleMode: state.activeLifecycleMode,
      mode: state.mode
    });
    // The outgoing lifecycle was already deactivated transactionally by
    // performTransition. Sweeping every lifecycle here ran cleanup twice and
    // let inactive modes cancel or rebuild state they no longer owned.
    ensureAnalysisSurfaceRuntime().clearForSelection(reason);
    removeResidualVisualRoots();
    root.CodeXRMappingUiRuntime?.setChartEntityIds?.([], { renormalize: false });
    debugLog('Visualization selector cleanup completed', {
      generation: activation?.generation
    });
  }

// == analysisModeRuntime.js | snapshotsAndLifecycles (assembled per manifest.json; see COMPONENTS.md) ==
  function getSnapshotModeRevision(snapshot, mode) {
    return Number(snapshot?.modeRevision?.[mode] || 0);
  }

  function getProducerId(componentData) {
    if (componentData && typeof componentData === 'object') {
      return componentData.from ? String(componentData.from) : '';
    }
    var match = String(componentData || '').match(/(?:^|;)\s*from\s*:\s*([^;]+)/);
    return match ? match[1].trim() : '';
  }

  function getNormalDataEntities(config) {
    var document = root.document;
    if (!document) { return []; }
    var queue = [];
    var visited = new Set();
    var dataEntities = [];
    collectConfiguredIds(config, [
      'normalDataEntityIds',
      'dataEntityIds',
      'dataEntityId'
    ]).forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) { queue.push(element); }
    });
    getNormalVisualizationRoots().forEach(function (element) {
      queue.push(element);
      element.querySelectorAll?.('[babia-queryjson], [babia-treebuilder], [data-codexr-normal-visualization="true"]')
        ?.forEach(function (child) { queue.push(child); });
    });
    getNormalMappingTargetIds(config).forEach(function (id) {
      var element = document.getElementById?.(id);
      if (element) { queue.push(element); }
    });
    while (queue.length) {
      var element = queue.shift();
      if (!element || visited.has(element)) { continue; }
      visited.add(element);
      var queryData = element.getAttribute?.('babia-queryjson');
      if (queryData) {
        dataEntities.push(element);
      }
      var attributeNames = element.getAttributeNames?.() || [];
      var componentNames = Object.keys(element.components || {});
      Array.from(new Set(attributeNames.concat(componentNames)))
        .filter(function (name) {
          return name === 'babia-treebuilder'
            || (name.indexOf('babia-') === 0 && name !== 'babia-queryjson');
        })
        .forEach(function (name) {
          var producerId = getProducerId(
            element.getAttribute?.(name) || element.components?.[name]?.data
          );
          var producer = producerId ? document.getElementById?.(producerId) : null;
          if (producer) { queue.push(producer); }
        });
    }
    // Old generated scenes predate normalDataEntityIds but use this canonical
    // producer id. Keep the fallback scoped to that one entity, never to every
    // babia-queryjson in the document (which includes parked Evolution data).
    if (!dataEntities.length) {
      var canonical = document.getElementById?.('data');
      if (canonical?.getAttribute?.('babia-queryjson')) {
        dataEntities.push(canonical);
      }
    }
    return Array.from(new Set(dataEntities));
  }

  async function refreshNormalDataSources(modeRevision) {
    var doc = root.document;
    if (!doc || modeRevision <= state.lastNormalModeRevision) {
      return false;
    }
    var mappingRuntime = root.CodeXRMappingUiRuntime;
    var mappingState = mappingRuntime?.getState?.() || null;
    var dataEntities = getNormalDataEntities(getConfig());
    var timestamp = Date.now();
    dataEntities.forEach(function (dataEntity) {
      var current = dataEntity.getAttribute?.('babia-queryjson');
      if (!current) {
        return;
      }
      var currentUrl = typeof current === 'string' ? current : current.url || '';
      if (!currentUrl) {
        return;
      }
      var nextUrl = currentUrl.split('?')[0]
        + '?codexrModeRevision=' + modeRevision
        + '&t=' + timestamp;
      var declarativeUrl = 'url: ' + nextUrl;
      if (mappingRuntime && typeof mappingRuntime.setDeclarativeAttribute === 'function') {
        mappingRuntime.setDeclarativeAttribute(dataEntity, 'babia-queryjson', declarativeUrl);
      } else {
        dataEntity.setAttribute('babia-queryjson', declarativeUrl);
      }
    });
    await new Promise(function (resolve) {
      root.setTimeout?.(resolve, 450);
    });
    if (mappingState && mappingRuntime?.restoreState) {
      mappingRuntime.restoreState(mappingState);
    }
    state.lastNormalModeRevision = modeRevision;
    return dataEntities.length > 0;
  }

  async function waitForNormalChartReady(config, activation) {
    var snapshot = activation?.context?.snapshot || null;
    var modeRevision = getSnapshotModeRevision(snapshot, 'single');
    var refreshedFromRevision = await refreshNormalDataSources(modeRevision);
    var pending = state.pendingNormalRefresh;
    var completedPendingRefresh = false;
    if (pending && !refreshedFromRevision) {
      var completion = await getNormalRefreshRuntime().waitForCompletionAfter(pending.baseline, 5000);
      completedPendingRefresh = !!completion?.completed;
    }
    var chartIds = getNormalMappingTargetIds(config);
    if (chartIds.length && root.CodeXRAnalysisTableRuntime?.waitForChartsStable) {
      await root.CodeXRAnalysisTableRuntime.waitForChartsStable(chartIds, {
        timeoutMs: 8000,
        pollMs: 100,
        stablePasses: 2
      });
    }
    state.pendingNormalRefresh = null;
    return refreshedFromRevision || completedPendingRefresh;
  }

  function registerBuiltInLifecycles() {
    register('selection', {
      mappingContextId: null,
      activate: async function (activation) {
        await clearVisualizationsForSelection(activation);
      }
    });
    register('single', {
      mappingContextId: 'normal-analysis',
      captureState: function () {
        var config = getConfig();
        var mappingState = root.CodeXRMappingUiRuntime?.getState?.();
        var chartIds = getNormalMappingTargetIds(config);
        return {
          chartId: mappingState?.chartId || root.CodeXRMappingUiRuntime?.getSceneChartId?.() || null,
          chartIds: chartIds,
          mappingState: mappingState || null,
          chartTransforms: captureChartTransforms(chartIds)
        };
      },
      restoreState: function (activation) {
        var saved = activation?.savedState;
        if (!saved) { return; }
        var mappingRuntime = root.CodeXRMappingUiRuntime;
        if (saved.chartId && mappingRuntime?.getState?.()?.chartId !== saved.chartId) {
          mappingRuntime.selectChart?.(saved.chartId, { applyToEntities: false });
        }
        mappingRuntime?.switchMappingContext?.('normal-analysis', {
          reason: 'normal-analysis-state-restore',
          applyToEntities: false
        });
        if (saved.mappingState) {
          mappingRuntime?.restoreState?.(saved.mappingState, { applyToEntities: false });
        }
        restoreChartTransforms(saved.chartTransforms);
      },
      // The authoritative analysis-view snapshot is this mode's data-refresh
      // path (waitForNormalChartReady reads its modeRevision), so a snapshot
      // echo must re-activate it. Modes with their own shared entity don't
      // declare this and are left alone by echoes.
      consumesSnapshot: true,
      activate: function (activation) {
        var config = getConfig();
        ensureAnalysisSurfaceRuntime().activateMode('single');
        var chartIds = activation?.savedState?.chartIds || getNormalMappingTargetIds(config);
        if (chartIds.length) {
          root.CodeXRMappingUiRuntime?.setChartEntityIds?.(chartIds, { renormalize: false });
        }
        restoreChartTransforms(activation?.savedState?.chartTransforms);
        void waitForNormalChartReady(config, activation).then(function (dataChanged) {
          if (state.mode !== 'single' && state.activeLifecycleMode !== 'single') {
            return;
          }
          setNormalVisualizationVisible(true);
          restoreChartTransforms(activation?.savedState?.chartTransforms);
          if (dataChanged && chartIds.length) {
            root.CodeXRAnalysisTableRuntime?.renormalizeCharts?.(
              chartIds,
              'normal-analysis-data-refreshed'
            );
          }
        });
      },
      deactivate: function () {
        setNormalVisualizationVisible(false);
      }
    });
  }

  function registerCollaboration(attempt) {
    if (state.collaborationRegistered) { return; }
    var client = root.CodeXRCollaborationRuntime?.getClient?.(root);
    if (!client?.registerEntityRuntime) {
      if (attempt < 30) {
        root.setTimeout?.(function () { registerCollaboration(attempt + 1); }, 100);
      }
      return;
    }
    state.collaborationRegistered = true;
    client.registerEntityRuntime({
      entityKind: 'analysis-view',
      entityId: 'main',
      applySharedState: function (snapshot) {
        if (VALID_MODES.has(snapshot?.mode)) {
          var viewRevision = Number(snapshot?.viewRevision || 0);
          if (
            viewRevision > 0
            && viewRevision < state.lastAuthoritativeViewRevision
          ) {
            debugLog('Ignored stale authoritative analysis view', {
              mode: snapshot.mode,
              viewRevision: viewRevision,
              lastApplied: state.lastAuthoritativeViewRevision
            });
            return;
          }
          if (viewRevision > 0) {
            state.lastAuthoritativeViewRevision = Math.max(
              state.lastAuthoritativeViewRevision,
              viewRevision
            );
          }
          if (snapshot.mode === 'single' && snapshot.status !== 'ready') {
            state.pendingNormalRefresh = {
              baseline: getNormalRefreshRuntime().getState().completedGeneration,
              sourceRevision: Number(snapshot.sourceRevision || 0)
            };
          }
          state.requestedMode = snapshot.mode === 'selection' ? state.requestedMode : snapshot.mode;
          var visibleMode = snapshot.mode;
          // Echo dedupe: a transition toward this exact mode is already in
          // flight (the runtime that sent analysis-mode-activate also called
          // changeAnalysis directly). Queueing the echo behind it would repeat
          // the whole deactivate/activate cycle — the double park/rebuild
          // behind the entry flicker.
          if (state.transitioning && state.pendingTransitionMode === visibleMode) {
            return;
          }
          // View routing: the mode's own lifecycle resolver wins over the
          // snapshot's controllerView. The server-side view can be stale (its
          // historical-comparison entity persists after the client clears the
          // comparison locally), and trusting it stranded the panel on the
          // generic mapping with nothing rendered. The client's live state is
          // the routing authority; the snapshot view is only a fallback.
          var echoView = lifecycles[visibleMode]?.resolveControllerView?.()
            || snapshot.controllerView
            || getDefaultControllerViewForMode(visibleMode);
          void changeAnalysis(visibleMode, {
            reason: 'authoritative-analysis-view',
            snapshot: snapshot,
            controllerView: echoView,
            panelViewId: visibleMode === 'selection'
              ? state.selectionPanelView
              : getPanelViewForControllerView(echoView)
          });
        }
      },
      publishInitialSharedState: function () {}
    });
  }

  root.CodeXRAnalysisModeRuntime = {
    register: register,
    registerModeOption: registerModeOption,
    openSelector: openSelector,
    resumeRequestedMode: resumeRequestedMode,
    setSelectionPanel: function (viewId) {
      state.selectionPanelView = String(viewId || 'visualization-mode');
    },
    changeAnalysis: changeAnalysis,
    deactivate: deactivate,
    getState: function () {
      return {
        mode: state.mode,
        requestedMode: state.requestedMode,
        controllerView: state.controllerView,
        activeLifecycleMode: state.activeLifecycleMode,
        transitioning: state.transitioning,
        pendingTransitionMode: state.pendingTransitionMode,
        lastAuthoritativeViewRevision: state.lastAuthoritativeViewRevision,
        generation: state.generation
      };
    },
    __testing: {
      clearVisualizationsForSelection: clearVisualizationsForSelection,
      removeResidualVisualRoots: removeResidualVisualRoots,
      reset: function () {
        Object.keys(lifecycles).forEach(function (key) { delete lifecycles[key]; });
        state.mode = 'single';
        state.activeLifecycleMode = 'single';
        state.requestedMode = 'single';
        state.controllerView = 'single.mapping';
        state.transitioning = false;
        state.pendingTransitionMode = null;
        state.generation = 0;
        state.transition = Promise.resolve();
        state.modeSnapshots = {};
        state.lastAuthoritativeViewRevision = 0;
        state.collaborationRegistered = false;
        state.pendingNormalRefresh = null;
        state.lastNormalModeRevision = 0;
        state.modeOptions = [];
        state.selectionPanelView = 'visualization-mode';
      }
    }
  };
  if (root.document) {
    // Each boot step is isolated: a failure in one (e.g. a config that is not
    // in the DOM yet) must never prevent the later steps from running — that
    // is how the analysis selector silently disappeared from the controller.
    [getNormalRefreshRuntime, ensureAnalysisSurfaceRuntime, registerBuiltInLifecycles,
      function () { mountModePanel(0); },
      function () { registerCollaboration(0); }].forEach(function (step) {
      try {
        step();
      } catch (error) {
        root.console?.warn?.('[CodeXR][AnalysisMode] boot step failed:', error);
      }
    });
  }
})(typeof window !== 'undefined' ? window : this);
