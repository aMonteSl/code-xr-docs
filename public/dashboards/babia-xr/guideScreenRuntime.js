// == guideScreenRuntime.js | guideContent (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRGuideRuntime(root) {
  'use strict';

  // Single source of truth for the CodeXR user guide. The same model renders
  // (a) natively on the in-room XR guide screen (guideScreen.js) and (b) as the
  // guide.html page every analysis server serves next to the scene — keep it
  // declarative: sections with a title, an accent colour (matching the mode
  // selector), one-line bullets (~62 chars max so the XR screen never has to
  // wrap them) and an optional `metrics` glossary ({term, definition} pairs,
  // definitions ≤ ~58 chars, same one-row constraint). Definitions mirror the
  // real analysis contracts: xr_field_schema.py for normal analysis and the
  // dependency runtime's nodeDetailModel/edgeStyle for the graph. No markup.
  var GUIDE_SECTIONS = [
    {
      id: 'overview',
      tab: 'Start',
      title: 'Welcome to CodeXR',
      color: '#22d3ee',
      lines: [
        'CodeXR turns your source code metrics into an XR scene.',
        'The pedestal table is the stage for every analysis mode.',
        'The floating controller panel drives mappings and filters.',
        'Press Analyses on the controller panel to switch analyses.',
        'The room is collaborative: everyone shares the state.',
        'Move: WASD + mouse on desktop; sticks and rays in VR.',
        'Drag this screen by its edges; corners resize it.',
        'Scroll while dragging to push or pull the screen.'
      ]
    },
    {
      id: 'single',
      tab: 'Normal',
      title: 'Normal analysis',
      color: '#0e7490',
      lines: [
        'Charts of per-file and per-function metrics (~23 languages).',
        'Map lines of code, complexity, functions or parameters.',
        'The Field Mapping panel picks the metric per dimension.',
        'Mapping changes apply once you confirm them.',
        'Charts: bars, cylinders, bubbles, pie and more.',
        'Saving a file re-analyzes it and refreshes the charts live.'
      ],
      metrics: [
        { term: 'Total / code lines', definition: 'All lines vs the lines that are actual code.' },
        { term: 'Comment ratio', definition: 'Comment lines divided by total lines.' },
        { term: 'Function count', definition: 'Functions detected in the file.' },
        { term: 'Complexity (CCN)', definition: 'Independent decision paths through a function.' },
        { term: 'Complexity bands', definition: 'CCN over 10 is high; over 25 is critical.' },
        { term: 'Max complexity', definition: 'Highest CCN found among the file functions.' },
        { term: 'Parameters', definition: 'Arguments in a function signature (avg and max).' },
        { term: 'Nesting depth', definition: 'How deep loops and branches are stacked.' }
      ]
    },
    {
      id: 'dependency-graph',
      tab: 'Deps',
      title: 'Dependency graph',
      color: '#7c3aed',
      lines: [
        'Nodes: files, folders, symbols. Edges: 7 relation kinds.',
        'Metrics: fan-in, fan-out, degree, cycles and Instability.',
        'Layouts: force-3d, hierarchical and metric-space.',
        'The Edges button colours by relation kind or intensity.',
        'Each relation filter button carries its edge colour chip.',
        'Flow particle size and speed are shared with the room.',
        'Click nodes or edges to pin legends (up to 6, no overlap).',
        'Open folders and files from a pinned legend to navigate.',
        'Up and Root buttons walk back up the folder hierarchy.',
        'External packages collapse into one summary portal.',
        'Detail auto-tunes density; Reset view re-centers you.'
      ],
      metrics: [
        { term: 'Fan-in', definition: 'Incoming: how many files depend on this one.' },
        { term: 'Fan-out', definition: 'Outgoing: how many files this one depends on.' },
        { term: 'Degree', definition: 'Fan-in plus fan-out: total connections.' },
        { term: 'Relations', definition: 'Individual relations, counting duplicates.' },
        { term: 'Cycle', definition: 'Size of its circular-dependency group; 0 = none.' },
        { term: 'Instability', definition: 'Fan-out / degree: 0 stable core, 1 unstable.' },
        { term: 'Confidence', definition: 'Edge opacity: exact, probable or ambiguous.' },
        { term: 'Occurrences', definition: 'Edge intensity: how often the relation repeats.' }
      ]
    },
    {
      id: 'historical',
      tab: 'History',
      title: 'Historical comparison',
      color: '#be123c',
      lines: [
        'Compares your working copy against a branch, tag or commit.',
        'Pick the reference from the controller panel list.',
        'A dual table shows both versions with per-metric deltas.',
        'Saving files updates the comparison live.',
        'Git access is read-only: reviewing is always safe.'
      ],
      metrics: [
        { term: 'Reference', definition: 'The branch, tag or commit you compare against.' },
        { term: 'Working copy', definition: 'Your current files, including unsaved edits.' },
        { term: 'Delta', definition: 'New value minus old value for each metric.' },
        { term: 'Compared metrics', definition: 'Lines, functions, complexity: the normal set.' }
      ]
    },
    {
      id: 'evolution',
      tab: 'Evolution',
      title: 'Project evolution',
      color: '#f59e0b',
      lines: [
        'Plays your Git history as a chronological movie.',
        'Build the movie from the controller panel timeline.',
        'Timelines: automatic, range or manual commit picks.',
        'Player controls let you play, pause and seek frames.',
        'Each frame keeps your current chart mapping.'
      ],
      metrics: [
        { term: 'Frame', definition: 'One commit rendered as a full analysis scene.' },
        { term: 'Timeline', definition: 'Auto picks commits; range and manual are yours.' },
        { term: 'Frame data', definition: 'The directory metrics recomputed per commit.' },
        { term: 'Playback', definition: 'Play, pause and seek; speed is adjustable.' }
      ]
    },
    {
      id: 'tips',
      tab: 'Tips',
      title: 'Tips & collaboration',
      color: '#16a34a',
      lines: [
        'Hover for a quick card; click to pin, click again to release.',
        'Pinned legends arrange above the graph and face you.',
        'Flow size and speed buttons re-pace the edge particles.',
        'The virtual screen can broadcast a desktop window.',
        'Invite others from Active Servers; tunnels are opt-in.',
        'No telemetry; downloads always ask for consent first.',
        'Read this guide in a browser: /guide.html on this server.'
      ]
    }
  ];

// == guideScreenRuntime.js | guideDomRenderer (assembled per manifest.json; see COMPONENTS.md) ==
  // Pure HTML projection of the guide model for guide.html (and anything else
  // that wants the guide as a document). Kept free of A-Frame and DOM globals:
  // guideHtmlString() is a pure string builder, renderGuideHtml() just mounts it.

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function guideMetricsHtml(section) {
    if (!Array.isArray(section.metrics) || !section.metrics.length) { return ''; }
    var entries = section.metrics.map(function (metric) {
      return '<div class="guide-metric">'
        + '<dt style="color:' + escapeHtml(section.color) + '">' + escapeHtml(metric.term) + '</dt>'
        + '<dd>' + escapeHtml(metric.definition) + '</dd>'
        + '</div>';
    }).join('');
    return '<h3>Data represented</h3><dl class="guide-metrics">' + entries + '</dl>';
  }

  function guideHtmlString() {
    var sections = GUIDE_SECTIONS.map(function (section) {
      var bullets = section.lines.map(function (line) {
        return '<li>' + escapeHtml(line) + '</li>';
      }).join('');
      return [
        '<section class="guide-section" id="' + escapeHtml(section.id) + '">',
        '<h2 style="border-color:' + escapeHtml(section.color) + '">' + escapeHtml(section.title) + '</h2>',
        '<ul>' + bullets + '</ul>',
        guideMetricsHtml(section),
        '</section>'
      ].join('');
    }).join('');
    var toc = GUIDE_SECTIONS.map(function (section) {
      return '<a href="#' + escapeHtml(section.id) + '" style="border-color:' + escapeHtml(section.color) + '">'
        + escapeHtml(section.title) + '</a>';
    }).join('');
    return '<nav class="guide-toc">' + toc + '</nav>' + sections;
  }

  function renderGuideHtml(container) {
    if (!container) { return false; }
    container.innerHTML = guideHtmlString();
    return true;
  }

// == guideScreenRuntime.js | guideScreen (assembled per manifest.json; see COMPONENTS.md) ==
  // In-room guide screen — a SUBTYPE of the virtual screen component. The
  // parent (CodeXRVirtualScreenRuntime) contributes everything a screen is:
  // frame/chrome, drag + resize handles, wheel depth, follow / look-at /
  // minimize, and the room-shared 'screen' entity (transform, size,
  // presentation). This subtype contributes a fixed, immutable content — the
  // guide, the very content served at /guide.html — through the parent's
  // content-provider seam (contentKind: 'fixed'), plus its own interactions:
  // section tabs, the Guide/Data glossary toggle and ‹ n/N › pagination.
  // Tab/page/view state is local per participant (reading pace is personal).
  // On pages without A-Frame (guide.html itself) only the DOM renderer is used.

  var GUIDE_SCREEN_ID = 'guide';
  var GUIDE_CONTENT_PROVIDER_ID = 'codexr-guide';

  // Reserve the well-known id at SCRIPT LOAD — before the scene (and the
  // multi-screen manager) initializes and before any collaboration snapshot
  // can replay a persisted 'screen:guide' entity. This is what prevents the
  // manager from materializing a duplicate remote copy of the guide (same
  // scoped DOM ids, broadcast-default 16:9 frame that cuts the content).
  // On guide.html the parent runtime is absent and this no-ops.
  root.CodeXRVirtualScreenRuntime?.reserveWellKnownScreenId?.(GUIDE_SCREEN_ID);

  var SCREEN = {
    // Design-space dimensions: the provider draws at this size and the parent
    // scales the content slot with the screen width (contentDesignWidth).
    width: 5.6,
    height: 3.5,
    tabWidth: 0.88,
    tabHeight: 0.32,
    // Preferred bullet pitch; long sections compress it so the last line always
    // clears the footer hint (see renderGuideSection).
    lineStep: 0.3,
    contentSpan: 1.5,
    // Rows per page; longer sections paginate with the ‹ n/N › controls.
    rowsPerPage: 8,
    raycastClass: 'babiaxraycasterclass'
  };

  var guideState = {
    initialized: false,
    sectionIndex: 0,
    // Per-section sub-view: 'lines' (how to use) or 'metrics' (data glossary).
    // Local to each participant, reset to 'lines' when switching tabs.
    view: 'lines',
    pageIndex: 0,
    screen: null,
    contentRoot: null,
    tabButtons: []
  };

  function guideDocument() { return root.document || null; }

  function guideConfig() {
    var script = guideDocument()?.getElementById('codexr-tooling-config-guide-screen');
    try { return JSON.parse(script?.textContent || '{}'); } catch { return {}; }
  }

  function guideEntity(tag, attributes) {
    var el = guideDocument().createElement(tag);
    Object.keys(attributes || {}).forEach(function (key) { el.setAttribute(key, attributes[key]); });
    return el;
  }

  function guideText(value, position, width, color, align, wrapCount) {
    return guideEntity('a-text', {
      value: value || '', position: position, width: width || 5,
      color: color || '#e2e8f0', align: align || 'left', baseline: 'center',
      'wrap-count': wrapCount || 46
    });
  }

  function parseGuideVector(value, fallback) {
    var parts = String(value || '').trim().split(/\s+/).map(Number);
    if (parts.length === 3 && parts.every(Number.isFinite)) {
      return { x: parts[0], y: parts[1], z: parts[2] };
    }
    return fallback;
  }

  function renderGuideTabs() {
    guideState.tabButtons.forEach(function (button, index) {
      var section = GUIDE_SECTIONS[index];
      var active = index === guideState.sectionIndex;
      button.setAttribute('material',
        'color: ' + (active ? section.color : '#334155') + '; opacity: .96; shader: flat');
    });
  }

  // 'Guide' shows the how-to bullets, 'Data' the metric glossary; the toggle
  // only exists for sections that declare metrics.
  function renderViewToggle(section, content) {
    if (!Array.isArray(section.metrics) || !section.metrics.length) { return; }
    [
      { id: 'lines', label: 'Guide', x: 1.28 },
      { id: 'metrics', label: 'Data', x: 2.12 }
    ].forEach(function (option) {
      var active = guideState.view === option.id;
      var button = guideEntity('a-plane', {
        class: SCREEN.raycastClass,
        'data-codexr-interactive': 'true',
        position: option.x + ' 0.92 0.02',
        width: 0.78, height: 0.26,
        material: 'color: ' + (active ? section.color : '#334155') + '; opacity: .96; shader: flat'
      });
      button.appendChild(guideText(option.label, '0 0 0.012', 1.0, '#f8fafc', 'center', 10));
      button.addEventListener('click', function () { setGuideView(option.id); });
      content.appendChild(button);
    });
  }

  function activeGuideRows(section) {
    if (guideState.view === 'metrics' && Array.isArray(section.metrics) && section.metrics.length) {
      return section.metrics;
    }
    return section.lines.map(function (line) { return { text: line }; });
  }

  function renderGuideSection() {
    var content = guideState.contentRoot;
    if (!content) { return; }
    while (content.firstChild) { content.removeChild(content.firstChild); }
    var section = GUIDE_SECTIONS[guideState.sectionIndex] || GUIDE_SECTIONS[0];
    var left = -(SCREEN.width / 2) + 0.35;
    content.appendChild(guideText(section.title, left + ' 0.92 0.02', 5.4, section.color, 'left', 40));
    renderViewToggle(section, content);
    content.appendChild(guideEntity('a-plane', {
      position: '0 0.72 0.015', width: SCREEN.width - 0.7, height: 0.006,
      material: 'color: ' + section.color + '; opacity: .45; shader: flat'
    }));
    var rows = activeGuideRows(section);
    var pages = Math.max(1, Math.ceil(rows.length / SCREEN.rowsPerPage));
    if (guideState.pageIndex >= pages) { guideState.pageIndex = pages - 1; }
    var visible = rows.slice(
      guideState.pageIndex * SCREEN.rowsPerPage,
      (guideState.pageIndex + 1) * SCREEN.rowsPerPage
    );
    var step = Math.min(SCREEN.lineStep, SCREEN.contentSpan / Math.max(1, visible.length - 1));
    visible.forEach(function (row, index) {
      var y = 0.44 - (index * step);
      if (row.term) {
        // Glossary row: accent-coloured term column + one-line definition.
        content.appendChild(guideText(row.term, left + ' ' + y + ' 0.02', 1.5, section.color, 'left', 18));
        content.appendChild(guideText(row.definition, (left + 1.62) + ' ' + y + ' 0.02', SCREEN.width - 2.35, '#e2e8f0', 'left', 52));
        return;
      }
      // '-' instead of '•': the bullet glyph is missing from the A-Frame SDF font.
      content.appendChild(guideText(
        '- ' + row.text,
        left + ' ' + y + ' 0.02',
        SCREEN.width - 0.7, '#e2e8f0', 'left', 64
      ));
    });
    renderPagination(section, content, pages);
    renderGuideTabs();
  }

  // ‹ n/N › row at the bottom of the content area, only when the section
  // overflows one page.
  function renderPagination(section, content, pages) {
    if (pages <= 1) { return; }
    [{ label: '<', delta: -1, x: 1.55 }, { label: '>', delta: 1, x: 2.35 }].forEach(function (option) {
      var button = guideEntity('a-plane', {
        class: SCREEN.raycastClass,
        'data-codexr-interactive': 'true',
        position: option.x + ' -1.28 0.02',
        width: 0.34, height: 0.22,
        material: 'color: ' + section.color + '; opacity: .9; shader: flat'
      });
      button.appendChild(guideText(option.label, '0 0 0.012', 0.9, '#0b1220', 'center', 4));
      button.addEventListener('click', function () { setGuidePage(guideState.pageIndex + option.delta); });
      content.appendChild(button);
    });
    content.appendChild(guideText(
      (guideState.pageIndex + 1) + ' / ' + pages,
      '1.95 -1.28 0.02', 1.2, '#7c8aa5', 'center', 8
    ));
  }

  function setGuideSection(index) {
    var total = GUIDE_SECTIONS.length;
    guideState.sectionIndex = ((Number(index) || 0) % total + total) % total;
    guideState.view = 'lines';
    guideState.pageIndex = 0;
    renderGuideSection();
  }

  function setGuideView(view) {
    guideState.view = view === 'metrics' ? 'metrics' : 'lines';
    guideState.pageIndex = 0;
    renderGuideSection();
  }

  function setGuidePage(index) {
    var section = GUIDE_SECTIONS[guideState.sectionIndex] || GUIDE_SECTIONS[0];
    var pages = Math.max(1, Math.ceil(activeGuideRows(section).length / SCREEN.rowsPerPage));
    guideState.pageIndex = ((Number(index) || 0) % pages + pages) % pages;
    renderGuideSection();
  }

  // Content provider: the guide's fixed face, mounted into the parent screen's
  // content slot at design size (the parent scales it with the screen width).
  function buildGuideContent(slotRoot) {
    slotRoot.appendChild(guideEntity('a-plane', {
      width: SCREEN.width, height: SCREEN.height,
      material: 'color: #0b1220; opacity: .97; shader: flat; side: double'
    }));
    slotRoot.appendChild(guideEntity('a-plane', {
      position: '0 ' + (SCREEN.height / 2 - 0.24) + ' 0.01', width: SCREEN.width, height: 0.44,
      material: 'color: #0b4f6c; opacity: .96; shader: flat'
    }));
    slotRoot.appendChild(guideText('CodeXR Guide', '0 ' + (SCREEN.height / 2 - 0.24) + ' 0.02', 6, '#eaf4ff', 'center', 30));

    // One tab per section, laid out in a centred row under the title.
    var tabsY = SCREEN.height / 2 - 0.66;
    var pitch = SCREEN.tabWidth + 0.06;
    var startX = -((GUIDE_SECTIONS.length - 1) / 2) * pitch;
    guideState.tabButtons = GUIDE_SECTIONS.map(function (section, index) {
      var tab = guideEntity('a-plane', {
        class: SCREEN.raycastClass,
        'data-codexr-interactive': 'true',
        position: (startX + index * pitch) + ' ' + tabsY + ' 0.02',
        width: SCREEN.tabWidth, height: SCREEN.tabHeight,
        material: 'color: #334155; opacity: .96; shader: flat'
      });
      tab.appendChild(guideText(section.tab, '0 0 0.012', 1.15, '#f8fafc', 'center', 12));
      tab.addEventListener('click', function () { setGuideSection(index); });
      slotRoot.appendChild(tab);
      return tab;
    });

    guideState.contentRoot = guideEntity('a-entity', { position: '0 -0.35 0' });
    slotRoot.appendChild(guideState.contentRoot);
    // Bottom-left, leaving the bottom-right corner free for the ‹ n/N › row.
    slotRoot.appendChild(guideText(
      'Browser guide: /guide.html on this server.',
      (-(SCREEN.width / 2) + 0.35) + ' ' + (-(SCREEN.height / 2) + 0.16) + ' 0.02',
      3.6, '#7c8aa5', 'left', 52
    ));
    renderGuideSection();
  }

  // Default placement: stacked directly above the 'default' broadcast screen —
  // same X/Z, Y raised by half the default's height, a clearance band for its
  // header buttons, and half the guide's own height. Derived from the shared
  // screen config so the guide follows if the default screen is re-anchored.
  var GUIDE_STACK_CLEARANCE = 0.65;

  function guideStackAnchor(parent) {
    var sharedRaw = null;
    try {
      sharedRaw = JSON.parse(guideDocument()?.getElementById('codexr-tooling-config-virtual-screen')?.textContent || 'null');
    } catch { sharedRaw = null; }
    var shared = parent.mergeConfig?.(sharedRaw || root.__CODEXR_VIRTUAL_SCREEN_CONFIG__ || {}) || {};
    var base = shared.anchoredPosition || { x: 0, y: 4.2, z: -22 };
    var steps = Array.isArray(shared.sizeSteps) && shared.sizeSteps.length ? shared.sizeSteps : [4.8];
    var index = Math.min(Math.max(Number(shared.defaultSizeIndex) || 0, 0), steps.length - 1);
    var defaultHalfHeight = (steps[index] / (shared.aspectRatio || (16 / 9))) / 2;
    return {
      position: {
        x: base.x,
        y: base.y + defaultHalfHeight + GUIDE_STACK_CLEARANCE + (SCREEN.height / 2),
        z: base.z
      },
      rotation: shared.anchoredRotation || { x: -12, y: 0, z: 0 },
      // Collision config flows from the shared screen config so every screen
      // in the scene bumps against the same shell.
      collisionEnabled: shared.collisionEnabled !== false,
      collisionBounds: shared.collisionBounds || null
    };
  }

  // Creates the guide screen through the parent component: a second well-known
  // screen next to 'default', sharing transform/size/presentation with the room.
  function createGuideScreen() {
    var parent = root.CodeXRVirtualScreenRuntime;
    var config = guideConfig();
    if (config.enabled === false || !parent?.createRuntime) { return null; }
    parent.registerContentProvider(GUIDE_CONTENT_PROVIDER_ID, buildGuideContent);
    var anchor = guideStackAnchor(parent);
    var screen = parent.createRuntime(root);
    screen.init({
      enabled: true,
      instanceId: GUIDE_SCREEN_ID,
      screenId: GUIDE_SCREEN_ID,
      displayName: 'Guide',
      contentKind: 'fixed',
      contentProviderId: GUIDE_CONTENT_PROVIDER_ID,
      contentDesignWidth: SCREEN.width,
      aspectRatio: SCREEN.width / SCREEN.height,
      sizeSteps: [3.4, 4.4, 5.6, 6.6],
      defaultSizeIndex: 2,
      broadcastEnabled: false,
      virtualScreenSupportsLocalCapture: false,
      collaborationEnabled: config.collaborationEnabled !== false,
      anchoredPosition: parseGuideVector(config.position, anchor.position),
      anchoredRotation: parseGuideVector(config.rotation, anchor.rotation),
      collisionEnabled: anchor.collisionEnabled,
      collisionBounds: anchor.collisionBounds,
      videoElementId: 'codexrVirtualScreenVideo-guide'
    });
    guideState.screen = screen;
    registerWithManager(0);
    return screen;
  }

  // The multi-screen manager lists well-known screens on the wall panel
  // (Bring…); it may initialize after us, so retry briefly.
  function registerWithManager(attempt) {
    var managerEl = guideDocument()?.querySelector('[codexr-multi-screen-manager]');
    var manager = managerEl?.components?.['codexr-multi-screen-manager'];
    if (manager?.registerWellKnownScreen) {
      manager.registerWellKnownScreen(GUIDE_SCREEN_ID, guideState.screen);
      return;
    }
    if (attempt < 30) {
      root.setTimeout?.(function () { registerWithManager(attempt + 1); }, 200);
    }
  }

  function autoInit() {
    // A-Frame only: guide.html loads this runtime purely for the DOM renderer.
    if (guideState.initialized || !root.AFRAME || !guideDocument()) { return; }
    guideState.initialized = true;
    var waitForParent = function (attempt) {
      if (root.CodeXRVirtualScreenRuntime?.createRuntime) {
        createGuideScreen();
        return;
      }
      if (attempt < 50) {
        root.setTimeout?.(function () { waitForParent(attempt + 1); }, 100);
      }
    };
    waitForParent(0);
  }

  root.CodeXRGuideRuntime = {
    autoInit: autoInit,
    setSection: setGuideSection,
    setView: setGuideView,
    setPage: setGuidePage,
    guideHtmlString: guideHtmlString,
    renderGuideHtml: renderGuideHtml,
    getScreen: function () { return guideState.screen; },
    getState: function () {
      return {
        sectionIndex: guideState.sectionIndex,
        view: guideState.view,
        pageIndex: guideState.pageIndex,
        mounted: !!guideState.contentRoot,
        screenState: guideState.screen?.getState?.() || null
      };
    },
    __testing: {
      GUIDE_SECTIONS: GUIDE_SECTIONS,
      guideHtmlString: guideHtmlString,
      escapeHtml: escapeHtml,
      rowsPerPage: SCREEN.rowsPerPage,
      buildGuideContent: buildGuideContent,
      GUIDE_SCREEN_ID: GUIDE_SCREEN_ID,
      GUIDE_CONTENT_PROVIDER_ID: GUIDE_CONTENT_PROVIDER_ID
    },
    destroy: function () {
      guideState.screen?.destroy?.();
      guideState.screen = null;
      guideState.contentRoot = null;
      guideState.tabButtons = [];
      guideState.initialized = false;
    }
  };

  if (guideDocument()) {
    if (guideDocument().readyState === 'loading') {
      guideDocument().addEventListener('DOMContentLoaded', autoInit, { once: true });
    } else { autoInit(); }
  }
})(typeof window !== 'undefined' ? window : this);
