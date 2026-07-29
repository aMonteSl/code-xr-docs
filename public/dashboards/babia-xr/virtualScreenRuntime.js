// == virtualScreenRuntime.js | moduleAndConfig (assembled per manifest.json; see COMPONENTS.md) ==
(function (factory) {
  const root = typeof globalThis !== 'undefined'
    ? globalThis
    : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
          ? global
          : this;

  const runtime = factory(root);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = runtime;
  }

  root.CodeXRVirtualScreenRuntime = runtime;

  if (root.document) {
    if (root.document.readyState === 'loading') {
      root.document.addEventListener('DOMContentLoaded', function () {
        runtime.autoInit();
      }, { once: true });
    } else {
      runtime.autoInit();
    }
  }
})(function (global) {
  'use strict';

  const DEFAULT_CONFIG = {
    enabled: true,
    broadcastEnabled: true,
    signalingPath: '/codexr-broadcast',
    sceneSelector: 'a-scene',
    followAnchorSelector: '#rig',
    anchoredPosition: { x: 0, y: 8, z: 6 },
    anchoredRotation: { x: -10, y: 0, z: 0 },
    // Collision stops: the screen tracks the user freely (look-at, drag,
    // resize) until any edge would touch the room shell or another screen —
    // there the motion stops like a physical bumper and resumes when the
    // target comes back inside. Bounds are derived from the codexr-room
    // entity; collisionBounds ({min:{x,y,z}, max:{x,y,z}}) overrides them.
    collisionEnabled: true,
    collisionMargin: 0.05,
    collisionBounds: null,
    followOffset: { x: 0, y: 0.7, z: -2.2 },
    followRotation: { x: 0, y: 0, z: 0 },
    defaultSizeIndex: 2,
    sizeSteps: [3.2, 4.0, 4.8, 5.8, 6.8],
    aspectRatio: 16 / 9,
    minWidth: 2.6,
    maxWidth: 10.0,
    minimizedWidth: 2.1,
    minimizedHeight: 0.42,
    dragDepthStep: 0.45,
    // Push/pull while dragging with a controller: metres per second at full
    // thumbstick deflection, applied per frame (thumbstickmoved only fires on
    // CHANGE, so a per-event step froze the screen while the stick was held).
    controllerDepthSpeed: 1.8,
    // How far the smoothed depth target may run ahead of the applied offset.
    // Unbounded, it kept accumulating while a collision bumper pinned the
    // screen, and reversing the stick had to unwind it all before anything
    // moved again.
    dragDepthMaxLead: 1.2,
    // Pulling stops before the screen reaches the user's head.
    dragDepthMinDistance: 0.6,
    instanceId: '',
    screenId: '',
    ownerPeerId: '',
    displayName: '',
    // Content subtype: 'broadcast' is the classic WebRTC screen; 'fixed' hosts
    // locally-rendered content from a registered content provider (see
    // registerContentProvider in wiringAndApi.js) — no video surface, no share
    // button, content always visible while expanded. Fixed screens keep every
    // other parent behaviour: chrome, drag/resize, follow, shared transform.
    contentKind: 'broadcast',
    contentProviderId: '',
    // World width the provider designs its content at; layout() scales the
    // content slot by screenWidth / contentDesignWidth so resizing works.
    contentDesignWidth: 0,
    managedScreen: false,
    placeInFrontOfUserOnInit: false,
    deferInitialSharedState: false,
    collaborationSource: 'local',
    collaborationEnabled: true,
    presenceEnabled: true,
    cursorPresenceEnabled: false,
    roomId: '',
    roomSignalingPath: '/codexr-room',
    sessionEndpoint: '/api/collaboration/session',
    videoElementId: '',
    rtcConfiguration: {
      iceServers: [
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
    },
    labels: {
      idle: 'Share a screen, window, or browser tab in this XR scene.',
      minimized: 'Virtual screen minimized.',
      permissionDenied: 'Screen sharing permission was denied. Use Share again to retry.',
      unavailable: 'Screen capture is not available in this browser.',
      sourceEnded: 'The shared source stopped. Expand the screen to share again.',
      move: 'Drag a side handle to move the virtual screen.',
      resize: 'Drag a corner handle to resize the virtual screen.',
      broadcasting: 'Broadcasting selected source.',
      receiving: 'Receiving shared source.',
      connecting: 'Connecting live share...',
      noSignal: 'No live source is currently available for this screen.',
      broadcastUnavailable: 'Live broadcasting requires HTTPS or localhost.',
      broadcastError: 'Unable to connect the live broadcast.',
      iceFailed: 'The shared screen could not cross this network (restrictive NAT). Collaboration remains active.',
      relayFallback: 'Direct connection unavailable, switching to the server relay...',
      broadcastStopped: 'Live sharing stopped.',
      collaborationLocked: 'This screen is currently being edited by another user.',
      join: 'Join',
      screenBusy: 'is already sharing on this screen. Use another screen or ask them to stop.',
      sharedBy: 'is sharing this screen.',
      someone: 'Another participant',
      audioUnlock: 'Enable Audio',
    },
  };

  const SOURCE_MESSAGES = {
    screen: {
      pending: 'Choose a screen, browser tab, or window in the native picker.',
      active: 'Sharing screen/window',
    },
    window: {
      pending: 'Choose the window or app you want to share.',
      active: 'Sharing window/app',
    },
    vscode: {
      pending: 'Choose the VS Code window in the native picker.',
      active: 'Sharing VS Code window',
    },
  };

  const HEADER_BUTTONS = {
    lookAt: 'codexrHeaderLookAt',
    follow: 'codexrHeaderFollow',
    minimize: 'codexrHeaderMinimize',
    stop: 'codexrHeaderStop',
  };

  const CORNER_HANDLES = {
    topLeft: 'codexrResizeTopLeft',
    topRight: 'codexrResizeTopRight',
    bottomLeft: 'codexrResizeBottomLeft',
    bottomRight: 'codexrResizeBottomRight',
  };

  const EDGE_HANDLES = {
    top: 'codexrMoveTop',
    right: 'codexrMoveRight',
    bottom: 'codexrMoveBottom',
    left: 'codexrMoveLeft',
  };

  const CONFIG_SCRIPT_ID = 'codexr-tooling-config-virtual-screen';

  // Scene-wide raycaster whitelist class (see setInteractive: raycastable ⇔
  // visible — hidden chrome must never keep this class).
  const RAYCAST_CLASS = 'babiaxraycasterclass';

  // Fixed-content providers, shared by every runtime instance (local and the
  // ones materialized for remote peers). A provider mounts its content into the
  // screen's content slot: build(contentRoot, runtimeApi).
  const CONTENT_PROVIDERS = new Map();

  function registerContentProvider(providerId, build) {
    const id = String(providerId || '').trim();
    if (!id || typeof build !== 'function') {
      return false;
    }
    CONTENT_PROVIDERS.set(id, build);
    return true;
  }

  function getContentProvider(providerId) {
    return CONTENT_PROVIDERS.get(String(providerId || '').trim()) || null;
  }

  // Well-known screen ids: screens every scene creates itself under a stable
  // id ('default', 'guide'…). Subtypes reserve their id at SCRIPT LOAD — before
  // the scene initializes and before any collaboration snapshot can replay —
  // so the multi-screen manager never materializes a remote copy for them.
  const WELL_KNOWN_SCREEN_IDS = new Set(['default']);

  function reserveWellKnownScreenId(screenId) {
    const id = String(screenId || '').trim();
    if (!id) {
      return false;
    }
    WELL_KNOWN_SCREEN_IDS.add(id);
    return true;
  }

  function getWellKnownScreenIds() {
    return Array.from(WELL_KNOWN_SCREEN_IDS);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function formatVector(vector) {
    return `${vector.x} ${vector.y} ${vector.z}`;
  }

  function cloneVector(vector) {
    if (!vector || typeof vector !== 'object') {
      return null;
    }
    return {
      x: Number.isFinite(vector.x) ? vector.x : 0,
      y: Number.isFinite(vector.y) ? vector.y : 0,
      z: Number.isFinite(vector.z) ? vector.z : 0,
    };
  }

  function mergeConfig(userConfig) {
    const merged = { ...DEFAULT_CONFIG, ...(userConfig || {}) };
    merged.anchoredPosition = { ...DEFAULT_CONFIG.anchoredPosition, ...(userConfig?.anchoredPosition || {}) };
    merged.anchoredRotation = { ...DEFAULT_CONFIG.anchoredRotation, ...(userConfig?.anchoredRotation || {}) };
    merged.followOffset = { ...DEFAULT_CONFIG.followOffset, ...(userConfig?.followOffset || {}) };
    merged.followRotation = { ...DEFAULT_CONFIG.followRotation, ...(userConfig?.followRotation || {}) };
    merged.rtcConfiguration = { ...DEFAULT_CONFIG.rtcConfiguration, ...(userConfig?.rtcConfiguration || {}) };
    merged.labels = { ...DEFAULT_CONFIG.labels, ...(userConfig?.labels || {}) };
    merged.sizeSteps = Array.isArray(userConfig?.sizeSteps) && userConfig.sizeSteps.length > 0
      ? userConfig.sizeSteps.slice()
      : DEFAULT_CONFIG.sizeSteps.slice();
    merged.minWidth = userConfig?.minWidth || DEFAULT_CONFIG.minWidth;
    merged.maxWidth = userConfig?.maxWidth || DEFAULT_CONFIG.maxWidth;
    merged.broadcastEnabled = userConfig?.broadcastEnabled !== false;
    merged.collaborationEnabled = userConfig?.collaborationEnabled !== false;
    merged.presenceEnabled = userConfig?.presenceEnabled !== false;
    merged.cursorPresenceEnabled = userConfig?.cursorPresenceEnabled === true;
    merged.virtualScreenSupportsLocalCapture = userConfig?.virtualScreenSupportsLocalCapture !== false;
    merged.collisionEnabled = userConfig?.collisionEnabled !== false;
    merged.collisionMargin = Number(userConfig?.collisionMargin) > 0
      ? Number(userConfig.collisionMargin)
      : DEFAULT_CONFIG.collisionMargin;
    merged.collisionBounds = userConfig?.collisionBounds?.min && userConfig?.collisionBounds?.max
      ? userConfig.collisionBounds
      : null;
    merged.contentKind = userConfig?.contentKind === 'fixed' ? 'fixed' : 'broadcast';
    merged.contentProviderId = String(userConfig?.contentProviderId || '');
    merged.contentDesignWidth = Number(userConfig?.contentDesignWidth) || 0;
    return merged;
  }

  function isFixedContent(config) {
    return config?.contentKind === 'fixed';
  }

  function readConfigFromJsonScript(win) {
    const document = win?.document;
    if (!document) {
      return null;
    }
    const scriptEl = document.getElementById(CONFIG_SCRIPT_ID);
    if (!scriptEl || typeof scriptEl.textContent !== 'string') {
      return null;
    }
    try {
      return JSON.parse(scriptEl.textContent);
    } catch (error) {
      console.warn('VIRTUAL_SCREEN: Invalid JSON config script', error);
      return null;
    }
  }

  function createRuntime(win) {
    const state = {
      initialized: false,
      mode: 'idle',
      presentationMode: 'expanded',
      lookAtCameraEnabled: true,
      follow: false,
      followTransform: null,
      legendSide: 'right',
      chromeVisible: false,
      currentSourceLabel: '',
      statusMessage: DEFAULT_CONFIG.labels.idle,
      stream: null,
      streamSourceType: null,
      hasAudio: false,
      audioUnlockRequired: false,
      // The viewer chose to leave this screen's broadcast: nothing may
      // auto-rejoin them until they press Join, the broadcast ends, or the
      // broadcaster changes. Local preference — never travels in the entity.
      viewerOptOut: false,
      infoOverlayVisible: false,
      screenWidth: DEFAULT_CONFIG.sizeSteps[DEFAULT_CONFIG.defaultSizeIndex],
      sizeIndex: DEFAULT_CONFIG.defaultSizeIndex,
      lastIntent: 'screen',
      displayName: '',
      gestureOwnerPeerId: null,
      suppressSharedPublish: false,
      clientId: '',
      broadcastRole: 'none',
      broadcastStatus: 'idle',
      drag: null,
      dragLoopActive: false,
      followLoopActive: false,
      faceCameraLoopActive: false,
      legendCollapsed: false,
    };

    const refs = {
      config: mergeConfig(readConfigFromJsonScript(win) || win.__CODEXR_VIRTUAL_SCREEN_CONFIG__),
      scene: null,
      followAnchor: null,
      videoSource: null,
      remoteAudioSource: null,
      root: null,
      frame: null,
      display: null,
      interactionPlane: null,
      dragPlane: null,
      raycasterRefreshScheduled: false,
      // Collision caches: the room shell is static (cache once found); other
      // screens move, so their obstacle list is refreshed on a short interval.
      collisionBoundsCache: null,
      obstacleCache: null,
      obstacleCacheTime: 0,
      headerStrip: null,
      status: null,
      legendRoot: null,
      legendPanel: null,
      legendText: null,
      legendToggle: null,
      shareButton: null,
      joinButton: null,
      infoOverlay: null,
      infoOverlayTimer: null,
      audioUnlockButton: null,
      headerButtons: {},
      cornerHandles: {},
      edgeHandles: {},
      cleanupBound: false,
      inputHandlersBound: false,
      controllerTargets: [],
      chromeHideTimer: null,
      signalingSocket: null,
      signalingReconnectTimer: null,
      peerConnections: new Map(),
      remoteStream: null,
      activeBroadcasterId: '',
      broadcastState: {
        active: false,
        broadcasterPeerId: '',
        hasAudio: false,
        sourceKind: '',
      },
      broadcastRegistered: false,
      // Media relayed through the server, for viewers peer-to-peer cannot
      // reach (see relayTransport.js). sender: encoders + pumps; receiver:
      // decoders drawing into a canvas that feeds the usual video texture.
      relaySender: null,
      relayReceiver: null,
      remoteFrameWatchTimer: null,
      // Which socket the current viewer-join went out on: duplicates are only
      // suppressed for the same socket, so reconnects can rejoin.
      joinAttemptSocket: null,
      viewerJoinWatchdogTimer: null,
      destroyed: false,
      sharedTransformTimer: null,
      managerCallbacks: null,
      initialSharedStateDeferred: false,
      initialSharedStatePublished: false,
    };

// == virtualScreenRuntime.js | sourcesAndChrome (assembled per manifest.json; see COMPONENTS.md) ==
    function getDocument() {
      return win.document;
    }

    function getScopedId(baseId) {
      const instanceId = String(refs.config.instanceId || '').trim();
      return instanceId ? `${baseId}-${instanceId}` : baseId;
    }

    function getVideoElementId() {
      const configured = String(refs.config.videoElementId || '').trim();
      return configured || getScopedId('codexrVirtualScreenVideo');
    }

    function getScreenId() {
      const configured = String(refs.config.screenId || refs.config.instanceId || '').trim();
      return configured || 'default';
    }

    function getDisplayName() {
      return String(state.displayName || refs.config.displayName || getScreenId()).trim();
    }

    function getOwnerPeerId() {
      const configured = String(refs.config.ownerPeerId || '').trim();
      if (configured) {
        return configured;
      }
      return getCollaborationClient()?.getPeerId?.() || '';
    }

    function getResolvedRoomId() {
      const configured = String(refs.config.roomId || '').trim();
      if (configured) {
        return configured;
      }
      return getCollaborationClient()?.getRoomId?.() || '';
    }

    function isRemoteScreen() {
      return refs.config.collaborationSource === 'remote';
    }

    function getCollaborationClient() {
      const collaborationRuntime = global.CodeXRCollaborationRuntime;
      if (!collaborationRuntime || typeof collaborationRuntime.getClient !== 'function') {
        return null;
      }
      const client = collaborationRuntime.getClient(win);
      if (!client || typeof client.connect !== 'function') {
        return null;
      }
      client.connect({
        collaborationEnabled: refs.config.collaborationEnabled !== false,
        presenceEnabled: refs.config.presenceEnabled !== false,
        cursorPresenceEnabled: refs.config.cursorPresenceEnabled === true,
        roomId: refs.config.roomId || '',
        roomSignalingPath: refs.config.roomSignalingPath || '/codexr-room',
        sessionEndpoint: refs.config.sessionEndpoint || '/api/collaboration/session',
        virtualScreenConfig: refs.config,
        sceneSelector: refs.config.sceneSelector || 'a-scene',
      });
      return client;
    }

    function getOrCreateClientId() {
      if (state.clientId) {
        return state.clientId;
      }
      if (global.crypto && typeof global.crypto.randomUUID === 'function') {
        state.clientId = global.crypto.randomUUID();
      } else {
        state.clientId = `client-${Math.random().toString(36).slice(2, 10)}`;
      }
      return state.clientId;
    }

    function isMinimized() {
      return state.presentationMode === 'minimized';
    }

    function hasDisplayedStream() {
      return state.mode === 'broadcasting' || state.mode === 'viewing';
    }

    function isSecureBroadcastContext() {
      if (win.isSecureContext) {
        return true;
      }
      const hostname = String(win.location?.hostname || '').toLowerCase();
      return hostname === 'localhost'
        || hostname === '127.0.0.1'
        || hostname === '[::1]';
    }

    function canUseBroadcastTransport() {
      return !!(
        refs.config.broadcastEnabled
        && typeof win.WebSocket === 'function'
        && typeof win.RTCPeerConnection === 'function'
        && isSecureBroadcastContext()
      );
    }

    function buildSignalingUrl() {
      const location = win.location;
      if (!location?.host) {
        return null;
      }
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const path = refs.config.signalingPath || DEFAULT_CONFIG.signalingPath;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      return `${protocol}//${location.host}${normalizedPath}`;
    }

    function getScene() {
      if (refs.scene && refs.scene.isConnected) {
        return refs.scene;
      }
      refs.scene = getDocument()?.querySelector(refs.config.sceneSelector) || null;
      return refs.scene;
    }

    function getFollowAnchor() {
      if (refs.followAnchor && refs.followAnchor.isConnected) {
        return refs.followAnchor;
      }
      refs.followAnchor = getDocument()?.querySelector(refs.config.followAnchorSelector) || getScene();
      return refs.followAnchor;
    }

    function getCameraWorldQuaternion() {
      if (!global.THREE) {
        return null;
      }
      const scene = getScene();
      if (scene?.camera?.getWorldQuaternion) {
        const quaternion = new global.THREE.Quaternion();
        scene.camera.getWorldQuaternion(quaternion);
        return quaternion;
      }
      const cameraEntity = getDocument()?.querySelector('a-camera, [camera]');
      return getWorldQuaternion(cameraEntity) || getWorldQuaternion(getFollowAnchor());
    }

    function ensureVideoSource() {
      if (refs.videoSource && refs.videoSource.isConnected) {
        return refs.videoSource;
      }
      const document = getDocument();
      if (!document) {
        return null;
      }
      const videoElementId = getVideoElementId();
      let video = document.getElementById(videoElementId);
      if (!video) {
        video = document.createElement('video');
        video.id = videoElementId;
        video.autoplay = true;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', 'true');
        video.style.display = 'none';
        document.body.appendChild(video);
      }
      refs.videoSource = video;
      return video;
    }

    function ensureRemoteAudioSource() {
      if (refs.remoteAudioSource && refs.remoteAudioSource.isConnected) {
        return refs.remoteAudioSource;
      }
      const document = getDocument();
      if (!document) {
        return null;
      }
      const audioElementId = getScopedId('codexrVirtualScreenRemoteAudio');
      let audio = document.getElementById(audioElementId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = audioElementId;
        audio.autoplay = true;
        audio.muted = false;
        audio.playsInline = true;
        audio.setAttribute('playsinline', 'true');
        audio.style.display = 'none';
        document.body.appendChild(audio);
      }
      refs.remoteAudioSource = audio;
      return audio;
    }

    function clearRemoteAudioPlayback() {
      state.audioUnlockRequired = false;
      const audio = refs.remoteAudioSource || getDocument()?.getElementById(getScopedId('codexrVirtualScreenRemoteAudio')) || null;
      if (!audio) {
        refreshUi();
        return;
      }
      try {
        audio.pause();
      } catch (_error) {
        // Ignore audio pause issues during cleanup.
      }
      audio.srcObject = null;
      refreshUi();
    }

    function syncRemoteAudioPlayback(stream) {
      const hasRemoteAudio = state.streamSourceType === 'remote'
        && state.hasAudio
        && typeof stream?.getAudioTracks === 'function'
        && stream.getAudioTracks().length > 0;

      if (!hasRemoteAudio) {
        clearRemoteAudioPlayback();
        return;
      }

      const audio = ensureRemoteAudioSource();
      if (!audio) {
        return;
      }

      audio.muted = false;
      audio.srcObject = stream;
      const playResult = audio.play();
      if (playResult && typeof playResult.then === 'function') {
        playResult.then(() => {
          state.audioUnlockRequired = false;
          refreshUi();
        }).catch(() => {
          state.audioUnlockRequired = true;
          refreshUi();
        });
      } else {
        state.audioUnlockRequired = false;
        refreshUi();
      }
    }

    function createEntity(tagName, attributes) {
      const entity = getDocument().createElement(tagName);
      Object.entries(attributes || {}).forEach(([key, value]) => entity.setAttribute(key, value));
      return entity;
    }

    function setEntityVisible(entity, visible) {
      entity?.setAttribute('visible', visible ? 'true' : 'false');
    }

    // A-Frame's raycaster intersects entities regardless of `visible`, so a
    // hidden-but-classed element still steals clicks from the scene behind it.
    // Interactive chrome must therefore keep the invariant
    // raycastable ⇔ visible: hide = also drop the raycast class.
    function setInteractive(entity, on) {
      if (!entity) {
        return;
      }
      setEntityVisible(entity, on);
      if (entity.classList?.contains(RAYCAST_CLASS) === !!on) {
        return;
      }
      entity.classList?.toggle(RAYCAST_CLASS, !!on);
      scheduleRaycasterRefresh();
    }

    // A-Frame does not watch class mutations: every raycaster in the scene must
    // be told to rebuild its objects whitelist. Coalesced to one refresh/frame.
    function scheduleRaycasterRefresh() {
      if (refs.raycasterRefreshScheduled) {
        return;
      }
      refs.raycasterRefreshScheduled = true;
      const flush = function () {
        refs.raycasterRefreshScheduled = false;
        getDocument()?.querySelectorAll('[raycaster]').forEach((el) => {
          el.components?.raycaster?.refreshObjects?.();
        });
      };
      if (typeof win.requestAnimationFrame === 'function') {
        win.requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 0);
      }
    }

    function setMaterial(entity, material) {
      if (entity) {
        entity.setAttribute('material', material);
      }
    }

    function setText(entity, label, color, width, wrapCount) {
      if (!entity) {
        return;
      }
      const target = entity.__codexrTextEntity || entity;
      if (target.tagName?.toLowerCase?.() === 'a-text') {
        target.setAttribute('value', label);
        target.setAttribute('color', color);
        target.setAttribute('align', 'center');
        target.setAttribute('width', String(width));
        target.setAttribute('wrap-count', String(wrapCount));
        return;
      }
      target.setAttribute('text', `value: ${label}; color: ${color}; align: center; width: ${width}; wrapCount: ${wrapCount};`);
    }

    /** Someone else's broadcast is live on this screen (never my own). */
    function isForeignBroadcastActive() {
      return refs.broadcastState?.active === true && state.streamSourceType !== 'local';
    }

    function getBroadcasterDisplayName() {
      const peerId = refs.broadcastState?.broadcasterPeerId || '';
      const participant = peerId ? getCollaborationClient()?.getParticipant?.(peerId) : null;
      const name = String(participant?.displayName || '').trim();
      return name || refs.config.labels.someone;
    }

    /**
     * Transient "who is sharing here" box: clicking shared content shows this
     * and nothing else — leaving, stopping or sharing all have their own
     * explicit buttons, so a stray click can never cost anyone their stream.
     */
    function showSharingInfoOverlay() {
      if (!isForeignBroadcastActive() && state.streamSourceType !== 'remote') {
        return;
      }
      state.infoOverlayVisible = true;
      refreshUi();
      if (refs.infoOverlayTimer) {
        win.clearTimeout(refs.infoOverlayTimer);
      }
      refs.infoOverlayTimer = win.setTimeout(function () {
        refs.infoOverlayTimer = null;
        state.infoOverlayVisible = false;
        refreshUi();
      }, 2500);
    }

    function createButton(id, glyph, width, height, textWidth, wrapCount) {
      const button = createEntity('a-plane', {
        id: getScopedId(id),
        class: `${RAYCAST_CLASS} codexr-screen-button`,
        width: String(width),
        height: String(height),
        color: '#0F172A',
        material: 'color: #0F172A; opacity: 0.18; transparent: true; shader: flat;',
      });
      const label = createEntity('a-text', {
        value: glyph,
        color: '#F8FAFC',
        align: 'center',
        width: String(textWidth),
        'wrap-count': String(wrapCount),
        position: '0 0 0.02',
      });
      button.appendChild(label);
      button.__codexrGlyph = glyph;
      button.__codexrTextWidth = textWidth;
      button.__codexrWrapCount = wrapCount;
      button.__codexrTextEntity = label;
      setText(button, glyph, '#F8FAFC', textWidth, wrapCount);
      return button;
    }

    function createHandle(id, width, height) {
      return createEntity('a-plane', {
        id: getScopedId(id),
        class: `${RAYCAST_CLASS} codexr-screen-handle`,
        width: String(width),
        height: String(height),
        color: '#FFFFFF',
        material: 'color: #FFFFFF; opacity: 0.0; transparent: true; shader: flat;',
      });
    }

    function setButtonStyle(entity, opacity, fillColor, textColor) {
      if (!entity) {
        return;
      }
      entity.setAttribute('color', fillColor);
      setMaterial(entity, `color: ${fillColor}; opacity: ${opacity}; transparent: true; shader: flat;`);
      setText(entity, entity.__codexrGlyph || '', textColor, entity.__codexrTextWidth || 1, entity.__codexrWrapCount || 4);
    }

    function getControlLegend() {
      const lookAtLabel = state.lookAtCameraEnabled ? 'Purple look-at' : 'Pink look-at off';
      const followLabel = state.follow ? 'Orange follow active' : 'Blue follow';
      if (isMinimized()) {
        return `${lookAtLabel}\n${followLabel}\nGreen expand\nRed stop\nMove: sides drag\nDepth: wheel/thumbstick while dragging`;
      }
      return `${lookAtLabel}\n${followLabel}\nYellow minimize\nRed stop\nMove: sides drag\nResize: corners\nDepth: wheel/thumbstick while dragging`;
    }

    function getLegendLayoutMetrics(width, minimized) {
      const legendTextValue = getControlLegend();
      const legendLines = legendTextValue.split('\n');
      const maxLegendLineLength = legendLines.reduce((maxLength, line) => Math.max(maxLength, line.length), 0);
      const horizontalPadding = minimized ? 0.34 : 0.40;
      const verticalPadding = minimized ? 0.24 : 0.30;
      const lineHeight = minimized ? 0.22 : 0.25;
      const estimatedTextWidth = maxLegendLineLength * (minimized ? 0.075 : 0.080);
      const legendWidth = clamp(
        Math.max(width * 0.72, estimatedTextWidth + (horizontalPadding * 2)),
        minimized ? 3.0 : 3.4,
        minimized ? 5.8 : 7.2,
      );
      const legendHeight = clamp(
        (legendLines.length * lineHeight) + (verticalPadding * 2),
        minimized ? 1.55 : 2.10,
        minimized ? 2.65 : 3.35,
      );
      const textWidth = Math.max(2.4, legendWidth - (horizontalPadding * 2));
      const wrapCount = Math.max(maxLegendLineLength + 4, minimized ? 26 : 30);
      return {
        legendWidth,
        legendHeight,
        textWidth,
        wrapCount,
        horizontalPadding,
        verticalPadding,
      };
    }

    function setHandleStyle(entity, visible) {
      if (!entity) {
        return;
      }
      setMaterial(entity, `color: #FFFFFF; opacity: ${visible ? 0.34 : 0.0}; transparent: true; shader: flat;`);
    }

// == virtualScreenRuntime.js | visibilityAndLayout (assembled per manifest.json; see COMPONENTS.md) ==
    function clearChromeHideTimer() {
      if (refs.chromeHideTimer) {
        const clearTimer = win.clearTimeout || global.clearTimeout;
        clearTimer(refs.chromeHideTimer);
        refs.chromeHideTimer = null;
      }
    }

    function showChrome() {
      clearChromeHideTimer();
      if (!state.chromeVisible) {
        state.chromeVisible = true;
        refreshUi();
      }
    }

    function hideChromeNow() {
      clearChromeHideTimer();
      if (state.drag || state.mode === 'idle') {
        return;
      }
      if (state.chromeVisible) {
        state.chromeVisible = false;
        refreshUi();
      }
    }

    function scheduleChromeHide() {
      if (state.mode === 'idle' || state.drag) {
        return;
      }
      clearChromeHideTimer();
      const setTimer = win.setTimeout || global.setTimeout;
      refs.chromeHideTimer = setTimer(function () {
        refs.chromeHideTimer = null;
        hideChromeNow();
      }, 220);
    }

    function wireChromeVisibility(entity) {
      if (!entity?.addEventListener) {
        return;
      }
      entity.addEventListener('mouseenter', showChrome);
      entity.addEventListener('mouseleave', scheduleChromeHide);
      entity.addEventListener('raycaster-intersected', showChrome);
      entity.addEventListener('raycaster-intersected-cleared', scheduleChromeHide);
    }
    function createUi() {
      if (refs.root) {
        return;
      }

      const scene = getScene();
      if (!scene) {
        return;
      }

      refs.root = createEntity('a-entity', {
        id: getScopedId('codexrVirtualScreenRoot'),
        position: formatVector(refs.config.anchoredPosition),
        rotation: formatVector(refs.config.anchoredRotation),
      });

      refs.frame = createEntity('a-plane', {
        id: getScopedId('codexrVirtualScreenFrame'),
        color: '#0F172A',
        material: 'color: #0F172A; opacity: 0.86; transparent: true; shader: flat;',
        position: '0 0 -0.01',
      });

      if (isFixedContent(refs.config)) {
        // Fixed-content subtype: the display surface is a content slot filled
        // by the registered provider instead of the WebRTC video plane.
        refs.display = null;
        refs.contentRoot = createEntity('a-entity', {
          id: getScopedId('codexrVirtualScreenContent'),
          position: '0 0 0.01',
        });
        const buildContent = getContentProvider(refs.config.contentProviderId);
        if (buildContent) {
          buildContent(refs.contentRoot, api);
        } else {
          console.warn('VIRTUAL_SCREEN: no content provider registered for', refs.config.contentProviderId);
        }
      } else {
        refs.contentRoot = null;
        refs.display = createEntity('a-video', {
          id: getScopedId('codexrVirtualScreenDisplay'),
          src: `#${getVideoElementId()}`,
          position: '0 0 0.01',
          visible: 'false',
        });
      }

      // Raycast-only surfaces: depthWrite: false keeps these near-invisible
      // planes out of the depth buffer — otherwise every transparent object
      // behind them is clipped along the plane (the "diagonal cut" artifact,
      // most visible while dragging a screen across other components).
      refs.interactionPlane = createEntity('a-plane', {
        id: getScopedId('codexrVirtualScreenSurface'),
        class: `${RAYCAST_CLASS} codexr-screen-surface`,
        color: '#FFFFFF',
        material: 'color: #FFFFFF; opacity: 0.001; transparent: true; side: double; depthWrite: false;',
        position: '0 0 0.02',
      });

      // Deliberately created WITHOUT the raycast class: this huge invisible
      // plane only joins the raycaster's world while a drag is active
      // (setInteractive in refreshUi / the drag lifecycle), otherwise it would
      // silently block clicks across a large part of the room.
      refs.dragPlane = createEntity('a-plane', {
        id: getScopedId('codexrVirtualScreenDragPlane'),
        class: 'codexr-screen-drag-plane',
        width: '28',
        height: '18',
        color: '#FFFFFF',
        material: 'color: #FFFFFF; opacity: 0.001; transparent: true; side: double; depthWrite: false;',
        position: '0 0 0.015',
        visible: 'false',
      });

      refs.headerStrip = createEntity('a-plane', {
        id: getScopedId('codexrVirtualScreenHeader'),
        color: '#0F172A',
        material: 'color: #0F172A; opacity: 0.0; transparent: true; shader: flat;',
        position: '0 0 0.03',
      });

      refs.status = createEntity('a-text', {
        id: getScopedId('codexrVirtualScreenStatus'),
        align: 'center',
        color: '#F8FAFC',
        width: '8',
        value: refs.config.labels.idle,
        position: '0 0.95 0.04',
      });

      refs.legendRoot = createEntity('a-entity', {
        id: getScopedId('codexrVirtualScreenLegendRoot'),
      });

      refs.legendPanel = createEntity('a-plane', {
        id: getScopedId('codexrVirtualScreenLegendPanel'),
        class: `${RAYCAST_CLASS} codexr-screen-legend`,
        color: '#0F172A',
        material: 'color: #0F172A; opacity: 0.72; transparent: true; shader: flat;',
      });

      refs.legendText = createEntity('a-text', {
        id: getScopedId('codexrVirtualScreenLegendText'),
        align: 'left',
        anchor: 'left',
        baseline: 'top',
        color: '#F8FAFC',
        value: getControlLegend(),
        position: '0 0 0.02',
      });

      refs.legendToggle = createButton('codexrLegendToggle', '−', 0.28, 0.48, 0.60, 2);
      refs.legendRoot.appendChild(refs.legendPanel);
      refs.legendRoot.appendChild(refs.legendText);
      refs.legendRoot.appendChild(refs.legendToggle);

      // Fixed-content screens have no source picker: their content is immutable.
      refs.shareButton = isFixedContent(refs.config)
        ? null
        : createButton('codexrShareSource', '▣', 0.86, 0.86, 1.6, 4);
      // Join shares the share button's center slot: they are mutually
      // exclusive (share needs a free screen, join needs a live broadcast).
      refs.joinButton = isFixedContent(refs.config)
        ? null
        : createButton('codexrJoinBroadcast', refs.config.labels.join, 1.9, 0.42, 3.4, 22);
      refs.infoOverlay = createEntity('a-text', {
        id: getScopedId('codexrVirtualScreenSharingInfo'),
        align: 'center',
        color: '#F8FAFC',
        width: '6',
        value: '',
        position: '0 -0.95 0.05',
        visible: 'false',
      });
      refs.audioUnlockButton = createButton('codexrEnableAudio', refs.config.labels.audioUnlock, 1.52, 0.34, 3.1, 18);
      refs.headerButtons.lookAt = createButton(HEADER_BUTTONS.lookAt, '◈', 0.24, 0.24, 0.65, 3);
      refs.headerButtons.follow = createButton(HEADER_BUTTONS.follow, '◎', 0.24, 0.24, 0.65, 3);
      refs.headerButtons.minimize = createButton(HEADER_BUTTONS.minimize, '—', 0.24, 0.24, 0.70, 3);
      refs.headerButtons.stop = createButton(HEADER_BUTTONS.stop, '×', 0.24, 0.24, 0.65, 3);

      refs.cornerHandles.topLeft = createHandle(CORNER_HANDLES.topLeft, 0.16, 0.16);
      refs.cornerHandles.topRight = createHandle(CORNER_HANDLES.topRight, 0.16, 0.16);
      refs.cornerHandles.bottomLeft = createHandle(CORNER_HANDLES.bottomLeft, 0.16, 0.16);
      refs.cornerHandles.bottomRight = createHandle(CORNER_HANDLES.bottomRight, 0.16, 0.16);

      refs.edgeHandles.top = createHandle(EDGE_HANDLES.top, 0.80, 0.05);
      refs.edgeHandles.right = createHandle(EDGE_HANDLES.right, 0.05, 0.70);
      refs.edgeHandles.bottom = createHandle(EDGE_HANDLES.bottom, 0.80, 0.05);
      refs.edgeHandles.left = createHandle(EDGE_HANDLES.left, 0.05, 0.70);

      refs.root.appendChild(refs.frame);
      if (refs.display) {
        refs.root.appendChild(refs.display);
      }
      if (refs.contentRoot) {
        refs.root.appendChild(refs.contentRoot);
      }
      refs.root.appendChild(refs.interactionPlane);
      refs.root.appendChild(refs.dragPlane);
      refs.root.appendChild(refs.headerStrip);
      refs.root.appendChild(refs.status);
      refs.root.appendChild(refs.legendRoot);
      if (refs.shareButton) {
        refs.root.appendChild(refs.shareButton);
      }
      if (refs.joinButton) {
        refs.root.appendChild(refs.joinButton);
      }
      refs.root.appendChild(refs.infoOverlay);
      refs.root.appendChild(refs.audioUnlockButton);
      Object.values(refs.headerButtons).forEach((button) => refs.root.appendChild(button));
      Object.values(refs.cornerHandles).forEach((handle) => refs.root.appendChild(handle));
      Object.values(refs.edgeHandles).forEach((handle) => refs.root.appendChild(handle));
      scene.appendChild(refs.root);

      wireControlHandlers();
      wireDragHandlers();
      wireCleanupHandlers();
      wireDepthInputHandlers();
      [
        refs.frame,
        refs.display,
        refs.contentRoot,
        refs.interactionPlane,
        refs.headerStrip,
        refs.status,
        refs.legendRoot,
        refs.legendPanel,
        refs.legendText,
        refs.legendToggle,
        refs.shareButton,
        refs.joinButton,
        refs.audioUnlockButton,
        ...Object.values(refs.headerButtons),
        ...Object.values(refs.cornerHandles),
        ...Object.values(refs.edgeHandles),
      ].filter(Boolean).forEach(wireChromeVisibility);
      layout();
      refreshUi();
    }

    function findClosestSizeIndex(width) {
      let bestIndex = 0;
      let bestDelta = Number.POSITIVE_INFINITY;
      refs.config.sizeSteps.forEach((size, index) => {
        const delta = Math.abs(size - width);
        if (delta < bestDelta) {
          bestDelta = delta;
          bestIndex = index;
        }
      });
      return bestIndex;
    }

    function getDisplayedStatusText() {
      if (hasDisplayedStream() || isMinimized()) {
        return '';
      }
      if (isFixedContent(refs.config)) {
        // Fixed screens are never "idle broadcast" — only transient hints
        // (move/resize/lock) surface over their content.
        return state.statusMessage === refs.config.labels.idle ? '' : (state.statusMessage || '');
      }
      return state.statusMessage || refs.config.labels.idle;
    }

    function layout() {
      if (!refs.root) {
        return;
      }
      updateLegendSide();

      const minimized = isMinimized();
      const width = minimized ? refs.config.minimizedWidth : state.screenWidth;
      const height = minimized ? refs.config.minimizedHeight : (state.screenWidth / refs.config.aspectRatio);
      const frameWidth = width + 0.12;
      const frameHeight = height + 0.12;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      const headerY = minimized ? 0 : (height / 2) + 0.10;
      const legendExpanded = !state.legendCollapsed;
      const legendSideSign = state.legendSide === 'left' ? -1 : 1;
      const legendMetrics = getLegendLayoutMetrics(width, minimized);
      const legendWidth = legendMetrics.legendWidth;
      const legendHeight = legendMetrics.legendHeight;
      const legendOffsetX = legendSideSign * (halfWidth + (legendExpanded ? (legendWidth / 2) + 0.38 : 0.24));
      const legendOffsetY = minimized ? 0.16 : Math.max(0.18, halfHeight - 0.32);
      const legendToggleOffset = legendExpanded ? (-legendSideSign * ((legendWidth / 2) + 0.16)) : 0;

      refs.frame.setAttribute('width', String(frameWidth));
      refs.frame.setAttribute('height', String(frameHeight));
      if (refs.display) {
        refs.display.setAttribute('width', String(width));
        refs.display.setAttribute('height', String(height));
      }
      if (refs.contentRoot) {
        // Fixed content designs at contentDesignWidth; scale it with the screen
        // so corner-resizes shrink/grow the whole guide uniformly.
        const contentScale = width / (refs.config.contentDesignWidth || width || 1);
        refs.contentRoot.setAttribute('scale', `${contentScale} ${contentScale} ${contentScale}`);
      }
      refs.interactionPlane.setAttribute('width', String(width));
      refs.interactionPlane.setAttribute('height', String(height));
      refs.dragPlane.setAttribute('width', String(Math.max(28, width * 5.5)));
      refs.dragPlane.setAttribute('height', String(Math.max(18, height * 5.5)));
      refs.headerStrip.setAttribute('width', String(frameWidth));
      refs.headerStrip.setAttribute('height', minimized ? '0.20' : '0.16');
      refs.headerStrip.setAttribute('position', minimized ? '0 0 0.03' : `0 ${headerY} 0.03`);

      refs.status.setAttribute('width', String(Math.max(6, width + 1.4)));
      // Fixed-content screens keep transient hints (move/resize/lock) above the
      // screen so they never cover the content; broadcast screens keep the
      // classic centered placement over the empty idle surface.
      refs.status.setAttribute('position', minimized
        ? '0 0.28 0.04'
        : (isFixedContent(refs.config) ? `0 ${halfHeight + 0.34} 0.04` : '0 0.95 0.04'));
      refs.shareButton?.setAttribute('position', '0 0 0.04');
      refs.joinButton?.setAttribute('position', '0 0 0.04');
      refs.audioUnlockButton.setAttribute('position', minimized ? '0 -0.06 0.04' : `0 ${-(halfHeight - 0.28)} 0.04`);
      refs.legendRoot.setAttribute('position', `${legendOffsetX} ${legendOffsetY} 0.05`);
      refs.legendPanel.setAttribute('width', String(legendWidth));
      refs.legendPanel.setAttribute('height', String(legendHeight));
      refs.legendPanel.setAttribute('position', '0 0 0');
      refs.legendText.setAttribute('width', String(legendMetrics.textWidth));
      refs.legendText.setAttribute('wrap-count', String(legendMetrics.wrapCount));
      refs.legendText.setAttribute('position', `${-(legendWidth / 2) + legendMetrics.horizontalPadding} ${legendHeight / 2 - legendMetrics.verticalPadding} 0.02`);
      refs.legendToggle.setAttribute('position', `${legendToggleOffset} 0 0.03`);

      refs.headerButtons.lookAt.setAttribute('position', `${halfWidth - 0.80} ${headerY} 0.05`);
      refs.headerButtons.follow.setAttribute('position', `${halfWidth - 0.54} ${headerY} 0.05`);
      refs.headerButtons.minimize.setAttribute('position', `${halfWidth - 0.28} ${headerY} 0.05`);
      refs.headerButtons.stop.setAttribute('position', `${halfWidth - 0.02} ${headerY} 0.05`);

      refs.cornerHandles.topLeft.setAttribute('position', `${-(halfWidth + 0.08)} ${halfHeight + 0.08} 0.05`);
      refs.cornerHandles.topRight.setAttribute('position', `${halfWidth + 0.08} ${halfHeight + 0.08} 0.05`);
      refs.cornerHandles.bottomLeft.setAttribute('position', `${-(halfWidth + 0.08)} ${-(halfHeight + 0.08)} 0.05`);
      refs.cornerHandles.bottomRight.setAttribute('position', `${halfWidth + 0.08} ${-(halfHeight + 0.08)} 0.05`);

      refs.edgeHandles.top.setAttribute('width', String(Math.max(0.65, width * 0.36)));
      refs.edgeHandles.bottom.setAttribute('width', String(Math.max(0.65, width * 0.36)));
      refs.edgeHandles.left.setAttribute('height', String(Math.max(0.65, height * 0.42)));
      refs.edgeHandles.right.setAttribute('height', String(Math.max(0.65, height * 0.42)));

      refs.edgeHandles.top.setAttribute('position', `0 ${halfHeight + 0.08} 0.05`);
      refs.edgeHandles.bottom.setAttribute('position', `0 ${-(halfHeight + 0.08)} 0.05`);
      refs.edgeHandles.left.setAttribute('position', `${-(halfWidth + 0.08)} 0 0.05`);
      refs.edgeHandles.right.setAttribute('position', `${halfWidth + 0.08} 0 0.05`);
    }

    function refreshUi() {
      if (!refs.root) {
        return;
      }

      const minimized = isMinimized();
      const fixedContent = isFixedContent(refs.config);
      const active = hasDisplayedStream();
      const expanded = !minimized;
      const chromeVisible = state.chromeVisible || !!state.drag;
      const headerVisible = minimized || chromeVisible;
      const foreignBroadcast = isForeignBroadcastActive();
      const watchingBroadcast = state.streamSourceType === 'remote'
        || (state.broadcastRole === 'viewer' && state.broadcastStatus === 'connecting');
      // Share needs a free screen; Join needs a live broadcast you are not
      // watching. They alternate in the same center slot, so the old accident
      // (share stealing the stream you were watching) has no surface left.
      const showShareButton = !fixedContent && state.mode === 'idle' && !foreignBroadcast;
      const showJoinButton = !fixedContent && expanded && foreignBroadcast && !watchingBroadcast;
      const showInfoOverlay = state.infoOverlayVisible && expanded && (foreignBroadcast || watchingBroadcast);
      const showStatus = !active && !minimized && !!getDisplayedStatusText();
      const showAudioUnlock = state.audioUnlockRequired && state.streamSourceType === 'remote' && state.hasAudio;
      const showLegend = (active || minimized || fixedContent) && chromeVisible;

      setEntityVisible(refs.display, active && expanded);
      // Fixed content is the screen's permanent face: visible whenever expanded.
      setEntityVisible(refs.contentRoot, fixedContent && expanded);
      setEntityVisible(refs.frame, true);
      // Interactive chrome goes through setInteractive so hidden elements also
      // leave the raycaster's world (raycastable ⇔ visible).
      setInteractive(refs.interactionPlane, expanded);
      setInteractive(refs.dragPlane, !!state.drag);
      setEntityVisible(refs.headerStrip, headerVisible);
      setEntityVisible(refs.status, showStatus);
      setEntityVisible(refs.legendRoot, showLegend);
      setInteractive(refs.legendPanel, showLegend && !state.legendCollapsed);
      setEntityVisible(refs.legendText, showLegend && !state.legendCollapsed);
      setInteractive(refs.legendToggle, showLegend);
      setInteractive(refs.shareButton, showShareButton);
      setInteractive(refs.joinButton, showJoinButton);
      setEntityVisible(refs.infoOverlay, showInfoOverlay);
      setInteractive(refs.audioUnlockButton, showAudioUnlock);
      Object.values(refs.headerButtons).forEach((button) => setInteractive(button, headerVisible));
      Object.values(refs.cornerHandles).forEach((handle) => setInteractive(handle, expanded && chromeVisible));
      Object.values(refs.edgeHandles).forEach((handle) => setInteractive(handle, chromeVisible));

      refs.status.setAttribute('value', getDisplayedStatusText());
      refs.legendText.setAttribute('value', getControlLegend());
      refs.legendToggle.__codexrGlyph = state.legendCollapsed ? '+' : '−';
      refs.headerButtons.lookAt.__codexrGlyph = state.lookAtCameraEnabled ? '◈' : '◇';
      refs.headerButtons.follow.__codexrGlyph = state.follow ? '◉' : '◎';
      refs.headerButtons.minimize.__codexrGlyph = minimized ? '□' : '—';
      refs.headerButtons.stop.__codexrGlyph = '×';
      refs.audioUnlockButton.__codexrGlyph = refs.config.labels.audioUnlock;
      if (refs.joinButton) {
        refs.joinButton.__codexrGlyph = `▶ ${refs.config.labels.join} · ${getBroadcasterDisplayName()}`;
      }
      refs.infoOverlay.setAttribute('value', showInfoOverlay
        ? `${getBroadcasterDisplayName()} ${refs.config.labels.sharedBy}`
        : '');

      setButtonStyle(refs.shareButton, 0.20, '#F8FAFC', '#0F172A');
      setButtonStyle(refs.joinButton, showJoinButton ? 0.92 : 0.0, '#16A34A', '#F8FAFC');
      setButtonStyle(refs.audioUnlockButton, showAudioUnlock ? 0.92 : 0.0, '#0EA5E9', '#F8FAFC');
      setMaterial(refs.legendPanel, `color: #020617; opacity: ${showLegend && !state.legendCollapsed ? 0.84 : 0.0}; transparent: true; shader: flat;`);
      setButtonStyle(refs.legendToggle, showLegend ? 0.88 : 0.0, state.legendCollapsed ? '#16A34A' : '#F59E0B', '#111827');
      setButtonStyle(refs.headerButtons.lookAt, headerVisible ? 0.82 : 0.0, state.lookAtCameraEnabled ? '#7C3AED' : '#C08497', state.lookAtCameraEnabled ? '#F8FAFC' : '#111827');
      setButtonStyle(refs.headerButtons.follow, headerVisible ? 0.82 : 0.0, state.follow ? '#F97316' : '#2563EB', '#F8FAFC');
      setButtonStyle(refs.headerButtons.minimize, headerVisible ? 0.88 : 0.0, minimized ? '#16A34A' : '#F59E0B', '#111827');
      setButtonStyle(refs.headerButtons.stop, headerVisible ? 0.88 : 0.0, '#DC2626', '#F8FAFC');
      Object.values(refs.cornerHandles).forEach((handle) => setHandleStyle(handle, expanded && chromeVisible));
      Object.values(refs.edgeHandles).forEach((handle) => setHandleStyle(handle, chromeVisible));
      setMaterial(refs.headerStrip, `color: #0F172A; opacity: ${headerVisible ? 0.14 : 0.0}; transparent: true; shader: flat;`);
    }

    function updateStatus(message) {
      state.statusMessage = message;
      refreshUi();
    }

    function toggleLegend() {
      state.legendCollapsed = !state.legendCollapsed;
      layout();
      refreshUi();
      showChrome();
    }

    function toggleLookAtCamera() {
      state.lookAtCameraEnabled = !state.lookAtCameraEnabled;
      if (state.lookAtCameraEnabled && !state.follow && !state.drag) {
        applyFaceCameraOrientation();
        ensureFaceCameraLoop();
      }
      layout();
      refreshUi();
      showChrome();
      updateStatus(state.currentSourceLabel || (state.lookAtCameraEnabled ? 'Look-at enabled.' : 'Look-at disabled.'));
      publishSharedScreenState();
    }

    function normalizeBroadcastState(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') {
        return {
          active: false,
          broadcasterPeerId: '',
          hasAudio: false,
          sourceKind: '',
        };
      }
      return {
        active: snapshot.active === true,
        broadcasterPeerId: typeof snapshot.broadcasterPeerId === 'string' ? snapshot.broadcasterPeerId.trim() : '',
        hasAudio: snapshot.hasAudio === true,
        sourceKind: typeof snapshot.sourceKind === 'string' ? snapshot.sourceKind.trim() : '',
      };
    }

// == virtualScreenRuntime.js | sharedState (assembled per manifest.json; see COMPONENTS.md) ==
    function setSharedBroadcastState(snapshot) {
      refs.broadcastState = normalizeBroadcastState(snapshot);
      return refs.broadcastState;
    }

    function syncLocalBroadcastState() {
      if (state.streamSourceType === 'local') {
        setSharedBroadcastState({
          active: state.broadcastStatus === 'connecting' || state.broadcastStatus === 'live',
          broadcasterPeerId: getCollaborationClient()?.getPeerId?.() || getOwnerPeerId(),
          hasAudio: state.hasAudio,
          sourceKind: state.lastIntent || 'screen',
        });
        return refs.broadcastState;
      }
      if (state.streamSourceType !== 'remote' && state.broadcastRole !== 'viewer') {
        setSharedBroadcastState({
          active: false,
          broadcasterPeerId: '',
          hasAudio: false,
          sourceKind: refs.broadcastState?.sourceKind || '',
        });
      }
      return refs.broadcastState;
    }

    function getManagerCallbacks() {
      return refs.managerCallbacks || null;
    }

    function setMode(mode, message) {
      state.mode = mode;
      if (typeof message === 'string' && message.length > 0) {
        state.statusMessage = message;
      }
      if (mode === 'idle') {
        state.chromeVisible = false;
      }
      layout();
      refreshUi();
    }

    function getTransformSnapshot() {
      if (!refs.root) {
        return null;
      }
      return {
        position: cloneVector(refs.root.getAttribute('position')),
        rotation: cloneVector(refs.root.getAttribute('rotation')),
      };
    }

    function getSerializableFollowTransform() {
      if (!state.followTransform?.position) {
        return null;
      }
      return {
        position: {
          x: state.followTransform.position.x,
          y: state.followTransform.position.y,
          z: state.followTransform.position.z,
        },
        distance: typeof state.followTransform.distance === 'number' ? state.followTransform.distance : null,
      };
    }

    function buildSharedScreenState() {
      const broadcast = syncLocalBroadcastState();
      return {
        entityKind: 'screen',
        entityId: getScreenId(),
        screenId: getScreenId(),
        ownerPeerId: getOwnerPeerId() || null,
        managed: !!refs.config.managedScreen,
        // Subtype markers: remote peers use these to materialize fixed-content
        // screens through the provider registry instead of a video screen.
        contentKind: refs.config.contentKind || 'broadcast',
        contentProviderId: refs.config.contentProviderId || '',
        contentDesignWidth: refs.config.contentDesignWidth || 0,
        aspectRatio: refs.config.aspectRatio || 0,
        displayName: getDisplayName(),
        presentationMode: state.presentationMode,
        lookAtCameraEnabled: state.lookAtCameraEnabled,
        follow: state.follow,
        followTransform: getSerializableFollowTransform(),
        screenWidth: state.screenWidth,
        broadcastStatus: state.broadcastStatus,
        hasAudio: state.hasAudio,
        gestureOwnerPeerId: state.gestureOwnerPeerId,
        collaborationSource: refs.config.collaborationSource || 'local',
        broadcast,
        transform: getTransformSnapshot(),
      };
    }

    function publishSharedScreenState(eventType) {
      if (state.suppressSharedPublish || refs.config.collaborationEnabled === false) {
        return false;
      }
      const sharedState = buildSharedScreenState();
      const managerCallbacks = getManagerCallbacks();
      if (managerCallbacks?.onStateChange) {
        return managerCallbacks.onStateChange(sharedState, {
          eventType: eventType || 'entity-updated',
        }) !== false;
      }
      const client = getCollaborationClient();
      if (!client || typeof client.sendEntityState !== 'function') {
        return false;
      }
      return client.sendEntityState(sharedState, eventType || 'entity-updated');
    }

    function publishSharedTransform(forceImmediate) {
      if (state.suppressSharedPublish || refs.config.collaborationEnabled === false) {
        return false;
      }
      const managerCallbacks = getManagerCallbacks();
      const transform = getTransformSnapshot();
      if (!transform) {
        return false;
      }
      const sendThroughManager = function () {
        refs.sharedTransformTimer = null;
        return managerCallbacks.onTransformChange(transform, {
          forceImmediate: forceImmediate === true,
        }) !== false;
      };
      if (managerCallbacks?.onTransformChange) {
        if (forceImmediate === true) {
          if (refs.sharedTransformTimer) {
            clearTimeout(refs.sharedTransformTimer);
            refs.sharedTransformTimer = null;
          }
          return sendThroughManager();
        }
        if (refs.sharedTransformTimer) {
          return true;
        }
        refs.sharedTransformTimer = setTimeout(sendThroughManager, 60);
        return true;
      }
      const client = getCollaborationClient();
      if (!client || typeof client.sendEntityTransform !== 'function') {
        return false;
      }

      const sendNow = function () {
        refs.sharedTransformTimer = null;
        client.sendEntityTransform({
          entityKind: 'screen',
          entityId: getScreenId(),
          transform,
        });
      };

      if (forceImmediate === true) {
        if (refs.sharedTransformTimer) {
          clearTimeout(refs.sharedTransformTimer);
          refs.sharedTransformTimer = null;
        }
        sendNow();
        return true;
      }

      if (refs.sharedTransformTimer) {
        return true;
      }

      refs.sharedTransformTimer = setTimeout(sendNow, 60);
      return true;
    }

    function applySharedScreenState(snapshot, meta) {
      if (!snapshot || typeof snapshot !== 'object') {
        return false;
      }

      state.suppressSharedPublish = true;
      try {
        if (typeof snapshot.displayName === 'string' && snapshot.displayName.trim().length > 0) {
          state.displayName = snapshot.displayName.trim();
        }
        if (typeof snapshot.lookAtCameraEnabled === 'boolean') {
          state.lookAtCameraEnabled = snapshot.lookAtCameraEnabled;
        }
        if (snapshot.presentationMode === 'minimized' || snapshot.presentationMode === 'expanded') {
          state.presentationMode = snapshot.presentationMode;
        }
        if (typeof snapshot.screenWidth === 'number') {
          setScreenWidth(snapshot.screenWidth, { silent: true });
        }
        if (typeof snapshot.follow === 'boolean') {
          state.follow = snapshot.follow;
        }
        if (snapshot.followTransform?.position && global.THREE) {
          state.followTransform = {
            position: new global.THREE.Vector3(
              Number(snapshot.followTransform.position.x) || 0,
              Number(snapshot.followTransform.position.y) || 0,
              Number(snapshot.followTransform.position.z) || 0,
            ),
            distance: Number(snapshot.followTransform.distance) || 0,
          };
        } else if (!snapshot.follow) {
          state.followTransform = null;
        }
        if (snapshot.transform?.position) {
          refs.root?.setAttribute('position', formatVector(snapshot.transform.position));
        }
        if (snapshot.transform?.rotation) {
          refs.root?.setAttribute('rotation', formatVector(snapshot.transform.rotation));
        }
        if (typeof snapshot.ownerPeerId === 'string' && snapshot.ownerPeerId.trim().length > 0) {
          refs.config.ownerPeerId = snapshot.ownerPeerId.trim();
        }
        state.gestureOwnerPeerId = snapshot.gestureOwnerPeerId || null;
        if (isFixedContent(refs.config)) {
          // Fixed-content screens have no stream: broadcast fields are inert.
          layout();
          refreshUi();
          if (meta?.type === 'entity-lock-denied') {
            updateStatus(refs.config.labels.collaborationLocked);
          }
          return true;
        }
        // The snapshot carries the SENDER's status. Mirror screens adopt it
        // for display, but an active viewer's status describes its own
        // connection — overwriting it faked "live" before any frame arrived.
        if (
          typeof snapshot.broadcastStatus === 'string'
          && state.streamSourceType !== 'local'
          && state.broadcastRole !== 'viewer'
        ) {
          state.broadcastStatus = snapshot.broadcastStatus;
        }
        state.hasAudio = snapshot.hasAudio === true;
        const sharedBroadcast = normalizeBroadcastState(snapshot.broadcast);
        const previousBroadcasterPeerId = refs.broadcastState?.broadcasterPeerId || '';
        setSharedBroadcastState(sharedBroadcast);
        // A leave is scoped to one broadcast: the opt-out clears when the
        // broadcast ends or the screen changes hands.
        if (
          !sharedBroadcast.active
          || (
            previousBroadcasterPeerId
            && sharedBroadcast.broadcasterPeerId
            && sharedBroadcast.broadcasterPeerId !== previousBroadcasterPeerId
          )
        ) {
          state.viewerOptOut = false;
        }
        if (state.streamSourceType !== 'local') {
          if (sharedBroadcast.active) {
            if (state.viewerOptOut) {
              // The viewer left on purpose: the screen offers Join instead of
              // dragging them back in on every entity refresh.
              setBroadcastState('none', 'idle');
            } else {
              // 'live' is earned by this viewer's first painted frame, never
              // adopted from the sender's snapshot.
              const alreadyLiveViewer = state.broadcastRole === 'viewer' && state.broadcastStatus === 'live';
              setBroadcastState('viewer', alreadyLiveViewer ? 'live' : 'connecting');
            }
          } else if (state.streamSourceType !== 'remote') {
            setBroadcastState('none', 'idle');
          }
        }
        layout();
        refreshUi();
        if (meta?.type === 'entity-lock-denied') {
          updateStatus(refs.config.labels.collaborationLocked);
        }
        if (state.streamSourceType !== 'local') {
          if (sharedBroadcast.active) {
            ensureRemoteBroadcastSubscription(sharedBroadcast);
          } else if (state.streamSourceType === 'remote') {
            detachRemoteBroadcast(refs.config.labels.broadcastStopped, {
              notifyServer: false,
              preserveStatus: false,
            });
          }
        }
        return true;
      } finally {
        state.suppressSharedPublish = false;
      }
    }

    function publishInitialSharedState() {
      if (isRemoteScreen()) {
        return false;
      }
      if (refs.initialSharedStatePublished) {
        return true;
      }
      if (refs.initialSharedStateDeferred) {
        return false;
      }
      const published = publishSharedScreenState('entity-added');
      if (published) {
        refs.initialSharedStatePublished = true;
      }
      return published;
    }

    function flushInitialSharedState() {
      refs.initialSharedStateDeferred = false;
      return publishInitialSharedState();
    }

    function handleCollaborationMessage(message) {
      if (!message?.type) {
        return;
      }
      if (message.type === 'entity-lock-denied') {
        state.gestureOwnerPeerId = message.payload?.gestureOwnerPeerId || null;
        if (state.drag) {
          endDrag();
        }
        updateStatus(refs.config.labels.collaborationLocked);
        refreshUi();
        return;
      }
      if (message.payload?.entityKind === 'screen' && message.payload?.entityId === getScreenId()) {
        state.gestureOwnerPeerId = message.payload?.gestureOwnerPeerId || null;
        refreshUi();
      }
    }

    function buildCaptureOptions(intent) {
      const options = {
        video: {
          cursor: 'always',
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
        systemAudio: 'include',
        windowAudio: 'system',
        surfaceSwitching: 'include',
        selfBrowserSurface: 'exclude',
      };
      options.monitorTypeSurfaces = intent === 'screen' ? 'include' : 'exclude';
      return options;
    }

    async function requestCapture(intent) {
      if (!win.navigator?.mediaDevices?.getDisplayMedia) {
        throw new Error(refs.config.labels.unavailable);
      }
      return win.navigator.mediaDevices.getDisplayMedia(buildCaptureOptions(intent));
    }

// == virtualScreenRuntime.js | webrtcPeers (assembled per manifest.json; see COMPONENTS.md) ==
    /** How long a peer-to-peer viewer waits for real media before relaying. */
    const PEER_FIRST_FRAME_TIMEOUT_MS = 6000;
    /** How long a joining viewer waits for any answer before re-joining. */
    const VIEWER_JOIN_RETRY_MS = 5000;

    function classifyCaptureError(error) {
      const name = error?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        return refs.config.labels.permissionDenied;
      }
      if (name === 'AbortError') {
        return 'Screen sharing was cancelled.';
      }
      if (name === 'NotFoundError') {
        return 'No shareable screen, tab, or window is currently available.';
      }
      return error?.message || 'Unable to start screen sharing.';
    }

    function updateVideoSource(stream) {
      const video = ensureVideoSource();
      if (!video) {
        return;
      }
      video.muted = true;
      video.srcObject = stream;
      const playResult = video.play();
      if (playResult && typeof playResult.catch === 'function') {
        playResult.catch(() => {});
      }
      syncRemoteAudioPlayback(stream);
    }

    function releaseStream(stopTracks) {
      if (!state.stream) {
        clearRemoteAudioPlayback();
        return;
      }
      if (stopTracks && state.streamSourceType === 'local' && typeof state.stream.getTracks === 'function') {
        state.stream.getTracks().forEach((track) => track.stop());
      }
      state.stream = null;
      state.streamSourceType = null;
      state.audioUnlockRequired = false;
      const video = ensureVideoSource();
      if (video) {
        video.srcObject = null;
      }
      clearRemoteAudioPlayback();
    }

    function closePeerConnection(peerId) {
      const connection = refs.peerConnections.get(peerId);
      if (!connection) {
        return;
      }
      try {
        connection.onicecandidate = null;
        connection.ontrack = null;
        connection.onconnectionstatechange = null;
        connection.oniceconnectionstatechange = null;
        connection.close();
      } catch (_error) {
        // Ignore peer teardown issues during cleanup.
      }
      refs.peerConnections.delete(peerId);
    }

    function closeAllPeerConnections() {
      Array.from(refs.peerConnections.keys()).forEach(closePeerConnection);
    }

    function closeSignalingSocket() {
      if (refs.signalingReconnectTimer) {
        clearTimeout(refs.signalingReconnectTimer);
        refs.signalingReconnectTimer = null;
      }
      if (!refs.signalingSocket) {
        return;
      }
      const socket = refs.signalingSocket;
      refs.signalingSocket = null;
      refs.broadcastRegistered = false;
      try {
        socket.onopen = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        socket.close();
      } catch (_error) {
        // Ignore socket close errors on teardown.
      }
    }

    function sendSignaling(payload) {
      if (!refs.signalingSocket || refs.signalingSocket.readyState !== win.WebSocket.OPEN) {
        return false;
      }
      refs.signalingSocket.send(JSON.stringify({
        ...payload,
        roomId: payload?.roomId || getResolvedRoomId(),
        screenId: payload?.screenId || getScreenId(),
      }));
      return true;
    }

    function setBroadcastState(role, status) {
      state.broadcastRole = role;
      state.broadcastStatus = status;
      syncLocalBroadcastState();
    }

    function createPeerConnection(peerId, role) {
      const existing = refs.peerConnections.get(peerId);
      if (existing) {
        return existing;
      }

      const connection = new win.RTCPeerConnection(refs.config.rtcConfiguration || {});
      refs.peerConnections.set(peerId, connection);

      connection.onicecandidate = function (event) {
        if (!event.candidate) {
          return;
        }
        sendSignaling({
          type: 'signal-ice',
          clientId: getOrCreateClientId(),
          screenId: getScreenId(),
          targetId: peerId,
          candidate: event.candidate,
        });
      };

      if (role === 'viewer') {
        connection.ontrack = function (event) {
          const stream = event.streams?.[0];
          if (!stream) {
            return;
          }
          refs.remoteStream = stream;
          refs.activeBroadcasterId = peerId;
          releaseStream(false);
          state.stream = stream;
          state.streamSourceType = 'remote';
          state.hasAudio = typeof stream.getAudioTracks === 'function' && stream.getAudioTracks().length > 0;
          state.currentSourceLabel = refs.config.labels.receiving;
          state.presentationMode = 'expanded';
          updateVideoSource(stream);
          // ontrack only means the track object exists: media has not flowed
          // yet, and if ICE never connects it never will. Claiming 'live' here
          // is what used to leave viewers on a silent black screen.
          setBroadcastState('viewer', 'connecting');
          updateStatus(refs.config.labels.connecting);
          watchForFirstRemoteFrame();
        };
      }

      connection.onconnectionstatechange = function () {
        if (role === 'viewer' && ['failed', 'closed', 'disconnected'].includes(connection.connectionState || '')) {
          // Once the relay owns the session, a dying peer connection is just
          // the abandoned direct attempt — it must not tear the relay down.
          if (refs.relayReceiver) {
            return;
          }
          if (peerId === refs.activeBroadcasterId) {
            const message = connection.connectionState === 'failed'
              ? refs.config.labels.iceFailed
              : refs.config.labels.noSignal;
            detachRemoteBroadcast(message, { notifyServer: false, skipSharedPublish: true });
          }
        }
      };

      connection.oniceconnectionstatechange = function () {
        if (role === 'viewer' && ['failed', 'closed', 'disconnected'].includes(connection.iceConnectionState || '')) {
          if (refs.relayReceiver) {
            return;
          }
          if (peerId === refs.activeBroadcasterId) {
            const message = connection.iceConnectionState === 'failed'
              ? refs.config.labels.iceFailed
              : refs.config.labels.noSignal;
            detachRemoteBroadcast(message, { notifyServer: false, skipSharedPublish: true });
          }
        }
      };

      return connection;
    }

    /**
     * Wait for the first real frame of a peer-to-peer broadcast. If none
     * arrives — restrictive NAT, blocked UDP — ask the server to relay the
     * media instead, which is a path every viewer can reach.
     */
    function watchForFirstRemoteFrame() {
      const video = ensureVideoSource();
      if (!video || refs.remoteFrameWatchTimer) {
        return;
      }

      let settled = false;
      const settle = function (live) {
        if (settled) {
          return;
        }
        settled = true;
        if (refs.remoteFrameWatchTimer) {
          win.clearTimeout(refs.remoteFrameWatchTimer);
          refs.remoteFrameWatchTimer = null;
        }
        if (live) {
          markPeerBroadcastLive();
        } else if (
          state.streamSourceType === 'remote'
          && state.broadcastStatus !== 'live'
          && !refs.relayReceiver
        ) {
          requestRelayFallback();
        }
      };

      if (typeof video.requestVideoFrameCallback === 'function') {
        video.requestVideoFrameCallback(function () {
          settle(true);
        });
      } else {
        video.addEventListener('playing', function onPlaying() {
          video.removeEventListener('playing', onPlaying);
          settle(true);
        });
      }

      refs.remoteFrameWatchTimer = win.setTimeout(function () {
        refs.remoteFrameWatchTimer = null;
        settle(video.currentTime > 0 && video.readyState >= 2);
      }, PEER_FIRST_FRAME_TIMEOUT_MS);
    }

    function markPeerBroadcastLive() {
      if (state.streamSourceType !== 'remote') {
        return;
      }
      setBroadcastState('viewer', 'live');
      setMode('viewing', refs.config.labels.receiving);
      showChrome();
    }

    function requestRelayFallback() {
      updateStatus(refs.config.labels.relayFallback);
      sendSignaling({
        type: 'relay-request',
        clientId: getOrCreateClientId(),
      });
    }

    function ensureRemoteBroadcastSubscription(sharedBroadcast) {
      if (state.streamSourceType === 'local' || sharedBroadcast?.active !== true) {
        return;
      }
      // An explicit leave sticks until the viewer presses Join.
      if (state.viewerOptOut) {
        return;
      }
      connectSignaling();
      if (!refs.signalingSocket || refs.signalingSocket.readyState !== win.WebSocket.OPEN || refs.broadcastRegistered !== true) {
        return;
      }
      if (state.streamSourceType === 'remote') {
        return;
      }
      if (
        state.broadcastRole === 'viewer'
        && state.broadcastStatus === 'connecting'
        && (!sharedBroadcast?.broadcasterPeerId || refs.activeBroadcasterId === sharedBroadcast.broadcasterPeerId)
      ) {
        return;
      }
      void startViewerConnection(sharedBroadcast?.broadcasterPeerId || '');
    }

    async function startViewerConnection(broadcasterId) {
      if (!canUseBroadcastTransport() || state.streamSourceType === 'local') {
        return;
      }
      if (state.broadcastRole === 'viewer' && state.broadcastStatus === 'connecting') {
        // Only suppress a duplicate join sent over THIS socket. After a
        // reconnect the server forgot us, so the rejoin must go out — the old
        // blanket guard left viewers stuck on "connecting" forever.
        if (
          refs.joinAttemptSocket === refs.signalingSocket
          && (!broadcasterId || refs.activeBroadcasterId === broadcasterId)
        ) {
          return;
        }
      }
      if (broadcasterId && refs.activeBroadcasterId === broadcasterId && state.broadcastStatus === 'live') {
        return;
      }

      detachRemoteBroadcast('', {
        notifyServer: false,
        preserveStatus: true,
        skipSharedPublish: true,
      });
      if (broadcasterId) {
        refs.activeBroadcasterId = broadcasterId;
      }
      setBroadcastState('viewer', 'connecting');
      updateStatus(refs.config.labels.connecting);
      if (sendSignaling({ type: 'viewer-join', clientId: getOrCreateClientId() })) {
        refs.joinAttemptSocket = refs.signalingSocket;
      }
      scheduleViewerJoinWatchdog();
    }

    /**
     * A viewer stuck on "connecting" with neither an offer nor a relay-ready
     * re-sends its join on a bounded interval. The server parks early joins,
     * so a duplicate join is idempotent — it just refreshes the offer.
     */
    function scheduleViewerJoinWatchdog() {
      if (refs.viewerJoinWatchdogTimer) {
        win.clearTimeout(refs.viewerJoinWatchdogTimer);
      }
      refs.viewerJoinWatchdogTimer = win.setTimeout(function () {
        refs.viewerJoinWatchdogTimer = null;
        if (
          refs.destroyed
          || refs.relayReceiver
          || state.viewerOptOut
          || state.broadcastRole !== 'viewer'
          || state.broadcastStatus !== 'connecting'
        ) {
          return;
        }
        refs.joinAttemptSocket = null;
        void startViewerConnection(refs.activeBroadcasterId || '');
      }, VIEWER_JOIN_RETRY_MS);
    }

    async function handleViewerJoin(viewerId) {
      if (!viewerId || state.streamSourceType !== 'local' || !state.stream) {
        return;
      }

      closePeerConnection(viewerId);
      const connection = createPeerConnection(viewerId, 'sender');
      if (typeof state.stream.getTracks === 'function') {
        state.stream.getTracks().forEach((track) => {
          connection.addTrack(track, state.stream);
        });
      }

      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);
      sendSignaling({
        type: 'signal-offer',
        clientId: getOrCreateClientId(),
        targetId: viewerId,
        description: connection.localDescription,
      });
    }

    function asRtcDescription(description) {
      if (!description) {
        return null;
      }
      return typeof win.RTCSessionDescription === 'function'
        ? new win.RTCSessionDescription(description)
        : description;
    }

    function asIceCandidate(candidate) {
      if (!candidate) {
        return null;
      }
      return typeof win.RTCIceCandidate === 'function'
        ? new win.RTCIceCandidate(candidate)
        : candidate;
    }

    async function applyRemoteOffer(broadcasterId, description) {
      if (!broadcasterId || !description) {
        return;
      }
      const connection = createPeerConnection(broadcasterId, 'viewer');
      refs.activeBroadcasterId = broadcasterId;
      await connection.setRemoteDescription(asRtcDescription(description));
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);
      sendSignaling({
        type: 'signal-answer',
        clientId: getOrCreateClientId(),
        targetId: broadcasterId,
        description: connection.localDescription,
      });
    }

    async function applyRemoteAnswer(viewerId, description) {
      const connection = refs.peerConnections.get(viewerId);
      if (!connection || !description) {
        return;
      }
      await connection.setRemoteDescription(asRtcDescription(description));
    }

    async function applyRemoteIce(peerId, candidate) {
      const connection = refs.peerConnections.get(peerId);
      if (!connection || !candidate) {
        return;
      }
      await connection.addIceCandidate(asIceCandidate(candidate));
    }

    function announceBroadcastStart() {
      if (!canUseBroadcastTransport() || state.streamSourceType !== 'local' || !state.stream) {
        return;
      }
      sendSignaling({
        type: 'broadcast-start',
        clientId: getOrCreateClientId(),
        hasAudio: state.hasAudio,
      });
    }

    function scheduleSignalingReconnect() {
      if (refs.signalingReconnectTimer || refs.destroyed || !refs.config.broadcastEnabled || !canUseBroadcastTransport()) {
        return;
      }
      refs.signalingReconnectTimer = setTimeout(function () {
        refs.signalingReconnectTimer = null;
        connectSignaling();
      }, 1400);
    }

// == virtualScreenRuntime.js | relayTransport (assembled per manifest.json; see COMPONENTS.md) ==
    // Media path for viewers that peer-to-peer cannot reach. Across networks
    // the two browsers sit behind different NATs and, with no TURN server,
    // ICE never connects — so the encoded frames travel over the broadcast
    // WebSocket, which every guest can already reach through the tunnel.
    //
    // Wire format (mirrored by screenBroadcastSignalingServer.ts):
    //   byte 0-1  magic 'CX'   byte 2  version
    //   byte 3    (temporalLayer << 4) | kind
    //   byte 4-11 timestamp (microseconds, big-endian)  then payload
    // The layer rides in the spare nibble so the server can thin the stream
    // per viewer without the frame growing or being decoded.
    const RELAY_HEADER_BYTES = 12;
    const RELAY_MAGIC_0 = 0x43;
    const RELAY_MAGIC_1 = 0x58;
    const RELAY_VERSION = 2;
    const RELAY_KIND_MASK = 0x0f;
    const RELAY_LAYER_SHIFT = 4;
    const RELAY_KIND = {
      videoKey: 1,
      videoDelta: 2,
      audio: 3,
      videoImage: 4,
      audioConfig: 5,
    };
    const RELAY_AUDIO_BITRATE = 64000;
    const RELAY_KEYFRAME_INTERVAL_MS = 2000;
    const RELAY_IMAGE_FPS = 8;
    const RELAY_IMAGE_QUALITY = 0.6;
    /**
     * One encoding serves every viewer, so its quality has to fit what the
     * host's uplink can carry for the whole audience: each remote viewer costs
     * another copy of this bitrate. Descending tiers, with a floor — below it
     * the picture stops being useful, so the status warns instead.
     */
    const RELAY_QUALITY_TIERS = [
      { maxViewers: 2, bitrate: 1500000, width: 1280, framerate: 24 },
      { maxViewers: 6, bitrate: 800000, width: 960, framerate: 24 },
      { maxViewers: 14, bitrate: 500000, width: 768, framerate: 18 },
      { maxViewers: Infinity, bitrate: 350000, width: 640, framerate: 12 },
    ];

    function relayQualityForAudience(viewerCount) {
      const audience = Math.max(1, viewerCount || 1);
      return RELAY_QUALITY_TIERS.find(function (tier) {
        return audience <= tier.maxViewers;
      }) || RELAY_QUALITY_TIERS[RELAY_QUALITY_TIERS.length - 1];
    }

    function hasWebCodecs() {
      return typeof win.VideoEncoder === 'function'
        && typeof win.VideoDecoder === 'function'
        && typeof win.MediaStreamTrackProcessor === 'function';
    }

    function hasAudioCodecs() {
      return typeof win.AudioEncoder === 'function' && typeof win.AudioDecoder === 'function';
    }

    function buildRelayFrame(kind, timestamp, payload, temporalLayer) {
      const body = payload instanceof Uint8Array ? payload : new Uint8Array(payload);
      const frame = new Uint8Array(RELAY_HEADER_BYTES + body.byteLength);
      const view = new DataView(frame.buffer);
      const layer = Math.min(15, Math.max(0, temporalLayer || 0));
      frame[0] = RELAY_MAGIC_0;
      frame[1] = RELAY_MAGIC_1;
      frame[2] = RELAY_VERSION;
      frame[3] = (layer << RELAY_LAYER_SHIFT) | (kind & RELAY_KIND_MASK);
      view.setBigUint64(4, BigInt(Math.max(0, Math.round(timestamp || 0))));
      frame.set(body, RELAY_HEADER_BYTES);
      return frame;
    }

    function readRelayFrame(buffer) {
      const bytes = new Uint8Array(buffer);
      if (bytes.byteLength < RELAY_HEADER_BYTES) {
        return null;
      }
      if (bytes[0] !== RELAY_MAGIC_0 || bytes[1] !== RELAY_MAGIC_1 || bytes[2] !== RELAY_VERSION) {
        return null;
      }
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return {
        kind: bytes[3] & RELAY_KIND_MASK,
        temporalLayer: bytes[3] >> RELAY_LAYER_SHIFT,
        timestamp: Number(view.getBigUint64(4)),
        payload: bytes.subarray(RELAY_HEADER_BYTES),
      };
    }

    function sendRelayFrame(kind, timestamp, payload, temporalLayer) {
      const socket = refs.signalingSocket;
      if (!socket || socket.readyState !== win.WebSocket.OPEN) {
        return false;
      }
      socket.send(buildRelayFrame(kind, timestamp, payload, temporalLayer));
      return true;
    }

    // ── Sender ───────────────────────────────────────────────────────────────

    function startRelaySender(message) {
      // One encoder serves the whole audience: a second viewer never starts a
      // second encoding, it only asks for a keyframe.
      if (refs.relaySender || state.streamSourceType !== 'local' || !state.stream) {
        return;
      }
      const videoTrack = state.stream.getVideoTracks?.()[0] || null;
      if (!videoTrack) {
        return;
      }

      const sender = {
        stopped: false,
        videoEncoder: null,
        audioEncoder: null,
        readers: [],
        imageTimer: null,
        scaleCanvas: null,
        lastKeyframeAt: 0,
        keyframeRequested: true,
        audience: Math.max(1, message?.relayViewerCount || 1),
        quality: null,
        temporalLayers: false,
      };
      refs.relaySender = sender;
      sender.quality = relayQualityForAudience(sender.audience);

      if (hasWebCodecs()) {
        startEncodedVideoPump(sender, videoTrack);
        const audioTrack = state.stream.getAudioTracks?.()[0] || null;
        if (audioTrack && hasAudioCodecs()) {
          startEncodedAudioPump(sender, audioTrack);
        }
      } else {
        // No WebCodecs (Firefox, Safari): send whole images instead. Audio
        // cannot ride this path, and the status says so rather than pretending.
        startImagePump(sender);
      }

      updateStatus(describeRelayBroadcast(sender));
    }

    function stopRelaySender() {
      const sender = refs.relaySender;
      if (!sender) {
        return;
      }
      refs.relaySender = null;
      sender.stopped = true;
      if (sender.imageTimer) {
        win.clearInterval(sender.imageTimer);
      }
      sender.readers.forEach(function (reader) {
        try {
          reader.cancel();
        } catch (_error) {
          // The track already ended.
        }
      });
      [sender.videoEncoder, sender.audioEncoder].forEach(function (encoder) {
        try {
          if (encoder && encoder.state !== 'closed') {
            encoder.close();
          }
        } catch (_error) {
          // Encoder already torn down.
        }
      });
    }

    function requestRelayKeyframe() {
      if (refs.relaySender) {
        refs.relaySender.keyframeRequested = true;
      }
    }

    /**
     * The audience changed. One encoding still serves everybody; what changes
     * is the quality it is worth encoding at, because every remote viewer costs
     * the host another copy of this bitrate.
     */
    function updateRelayAudience(message) {
      const sender = refs.relaySender;
      if (!sender) {
        return;
      }
      sender.audience = Math.max(1, message?.relayViewerCount || 1);
      sender.quality = relayQualityForAudience(sender.audience);
      updateStatus(describeRelayBroadcast(sender));
    }

    function describeRelayBroadcast(sender) {
      const viewers = sender.audience;
      const audio = sender.audioEncoder ? sender.quality.bitrate + RELAY_AUDIO_BITRATE : sender.quality.bitrate;
      const upstreamMbps = (audio * viewers) / 1000000;
      const people = viewers === 1 ? '1 remote viewer' : `${viewers} remote viewers`;
      const cost = `~${upstreamMbps.toFixed(1)} Mbps up`;
      const quality = sender.temporalLayers ? '' : ' · single layer';
      return `${refs.config.labels.broadcasting} · ${people} · ${cost}${quality}`;
    }

    function scaleFrameIfNeeded(sender, frame) {
      const maxWidth = sender.quality.width;
      const width = frame.displayWidth || frame.codedWidth || 0;
      if (!width || width <= maxWidth || typeof win.OffscreenCanvas !== 'function') {
        return { frame, scaled: false };
      }
      const height = frame.displayHeight || frame.codedHeight || 0;
      const targetWidth = maxWidth - (maxWidth % 2);
      const targetHeight = Math.max(2, Math.round((height * targetWidth) / width) & ~1);
      if (!sender.scaleCanvas
        || sender.scaleCanvas.width !== targetWidth
        || sender.scaleCanvas.height !== targetHeight) {
        sender.scaleCanvas = new win.OffscreenCanvas(targetWidth, targetHeight);
      }
      const context = sender.scaleCanvas.getContext('2d');
      context.drawImage(frame, 0, 0, targetWidth, targetHeight);
      const scaledFrame = new win.VideoFrame(sender.scaleCanvas, { timestamp: frame.timestamp });
      return { frame: scaledFrame, scaled: true };
    }

    function buildVideoEncoderConfig(sender, rawFrame, withTemporalLayers) {
      const maxWidth = sender.quality.width;
      const sourceWidth = rawFrame.displayWidth || maxWidth;
      const width = Math.min(sourceWidth, maxWidth) & ~1;
      const height = Math.max(2, Math.round(
        ((rawFrame.displayHeight || 720) * width) / sourceWidth,
      ) & ~1);
      const config = {
        codec: 'vp8',
        width,
        height,
        bitrate: sender.quality.bitrate,
        framerate: sender.quality.framerate,
        latencyMode: 'realtime',
      };
      if (withTemporalLayers) {
        // Three temporal layers from a single encoding: the server can drop
        // the top ones for a viewer that falls behind, and only that viewer
        // loses frame rate.
        config.scalabilityMode = 'L1T3';
      }
      return config;
    }

    async function resolveVideoEncoderConfig(sender, rawFrame) {
      const layered = buildVideoEncoderConfig(sender, rawFrame, true);
      try {
        const support = await win.VideoEncoder.isConfigSupported(layered);
        if (support?.supported) {
          sender.temporalLayers = true;
          return layered;
        }
      } catch (_error) {
        // Older implementations reject unknown scalability modes outright.
      }
      sender.temporalLayers = false;
      return buildVideoEncoderConfig(sender, rawFrame, false);
    }

    function startEncodedVideoPump(sender, videoTrack) {
      const encoder = new win.VideoEncoder({
        output: function (chunk, metadata) {
          const payload = new Uint8Array(chunk.byteLength);
          chunk.copyTo(payload);
          sendRelayFrame(
            chunk.type === 'key' ? RELAY_KIND.videoKey : RELAY_KIND.videoDelta,
            chunk.timestamp,
            payload,
            metadata?.svc?.temporalLayerId || 0,
          );
        },
        error: function () {
          stopRelaySender();
        },
      });
      sender.videoEncoder = encoder;

      const processor = new win.MediaStreamTrackProcessor({ track: videoTrack });
      const reader = processor.readable.getReader();
      sender.readers.push(reader);

      void (async function pump() {
        while (!sender.stopped) {
          const { value: rawFrame, done } = await reader.read();
          if (done || !rawFrame) {
            break;
          }
          try {
            if (encoder.state !== 'configured') {
              encoder.configure(await resolveVideoEncoderConfig(sender, rawFrame));
              sender.appliedQuality = sender.quality;
            } else if (sender.appliedQuality !== sender.quality) {
              // The audience changed: reconfigure this same encoder instead of
              // starting another one, and resync viewers with a keyframe.
              encoder.configure(buildVideoEncoderConfig(sender, rawFrame, sender.temporalLayers));
              sender.appliedQuality = sender.quality;
              sender.keyframeRequested = true;
            }
            // Encoding is the slow part: skip frames instead of queueing them,
            // so a busy machine falls behind in fluidity, never in latency.
            if (encoder.encodeQueueSize > 2) {
              continue;
            }
            const now = win.Date.now();
            const keyFrame = sender.keyframeRequested
              || (now - sender.lastKeyframeAt) >= RELAY_KEYFRAME_INTERVAL_MS;
            if (keyFrame) {
              sender.keyframeRequested = false;
              sender.lastKeyframeAt = now;
            }
            const scaled = scaleFrameIfNeeded(sender, rawFrame);
            encoder.encode(scaled.frame, { keyFrame });
            if (scaled.scaled) {
              scaled.frame.close();
            }
          } catch (_error) {
            // A frame that cannot be encoded is dropped, not fatal.
          } finally {
            rawFrame.close();
          }
        }
      })();
    }

    function startEncodedAudioPump(sender, audioTrack) {
      const settings = typeof audioTrack.getSettings === 'function' ? audioTrack.getSettings() : {};
      const sampleRate = settings.sampleRate || 48000;
      const channels = settings.channelCount || 2;

      const encoder = new win.AudioEncoder({
        output: function (chunk) {
          const payload = new Uint8Array(chunk.byteLength);
          chunk.copyTo(payload);
          sendRelayFrame(RELAY_KIND.audio, chunk.timestamp, payload);
        },
        error: function () {
          // Losing audio must not take the picture down with it.
          try {
            sender.audioEncoder?.close();
          } catch (_error) {
            // Already closed.
          }
          sender.audioEncoder = null;
        },
      });
      sender.audioEncoder = encoder;
      encoder.configure({
        codec: 'opus',
        sampleRate,
        numberOfChannels: channels,
        bitrate: RELAY_AUDIO_BITRATE,
      });

      // The decoder needs the same parameters before the first packet.
      sendRelayFrame(
        RELAY_KIND.audioConfig,
        0,
        new win.TextEncoder().encode(JSON.stringify({ sampleRate, channels })),
      );

      const processor = new win.MediaStreamTrackProcessor({ track: audioTrack });
      const reader = processor.readable.getReader();
      sender.readers.push(reader);

      void (async function pump() {
        while (!sender.stopped) {
          const { value: audioData, done } = await reader.read();
          if (done || !audioData) {
            break;
          }
          try {
            if (encoder.state === 'configured') {
              encoder.encode(audioData);
            }
          } catch (_error) {
            // Drop this slice of audio.
          } finally {
            audioData.close();
          }
        }
      })();
    }

    function startImagePump(sender) {
      const video = ensureVideoSource();
      const document = getDocument();
      if (!video || !document) {
        return;
      }
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      sender.imageTimer = win.setInterval(function () {
        if (sender.stopped || !video.videoWidth) {
          return;
        }
        // The image path has no layers to thin, so the audience tier is the
        // only lever it has: a bigger audience gets a smaller picture.
        const width = Math.min(video.videoWidth, sender.quality.width);
        const height = Math.round((video.videoHeight * width) / video.videoWidth);
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }
        context.drawImage(video, 0, 0, width, height);
        canvas.toBlob(function (blob) {
          if (!blob || sender.stopped) {
            return;
          }
          void blob.arrayBuffer().then(function (buffer) {
            if (!sender.stopped) {
              sendRelayFrame(RELAY_KIND.videoImage, win.Date.now() * 1000, buffer);
            }
          });
        }, 'image/jpeg', RELAY_IMAGE_QUALITY);
      }, Math.round(1000 / RELAY_IMAGE_FPS));
    }

    // ── Receiver ─────────────────────────────────────────────────────────────

    function startRelayReceiver(message) {
      stopRelayReceiver();
      const document = getDocument();
      if (!document) {
        return;
      }

      // The relay owns the session from here: the abandoned direct attempt
      // must not linger (its dying ICE handlers would tear this down), and
      // the first-frame watchdogs have been answered.
      closeAllPeerConnections();
      if (refs.remoteFrameWatchTimer) {
        win.clearTimeout(refs.remoteFrameWatchTimer);
        refs.remoteFrameWatchTimer = null;
      }
      if (refs.viewerJoinWatchdogTimer) {
        win.clearTimeout(refs.viewerJoinWatchdogTimer);
        refs.viewerJoinWatchdogTimer = null;
      }
      if (message?.broadcasterId) {
        refs.activeBroadcasterId = message.broadcasterId;
      }

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const context = canvas.getContext('2d');
      // A canvas-backed MediaStream drops straight into the existing video
      // texture, so nothing downstream knows the media came from the relay.
      const stream = typeof canvas.captureStream === 'function' ? canvas.captureStream(30) : null;
      if (!stream) {
        return;
      }

      const receiver = {
        canvas,
        context,
        stream,
        videoDecoder: null,
        audioDecoder: null,
        audioContext: null,
        audioDestination: null,
        audioPlayhead: 0,
        sized: false,
        live: false,
        hasAudio: message?.hasAudio === true,
      };
      refs.relayReceiver = receiver;

      if (receiver.hasAudio && typeof win.AudioContext === 'function') {
        // Created upfront: a track added after the stream is attached would
        // never reach the audio element.
        receiver.audioContext = new win.AudioContext();
        receiver.audioDestination = receiver.audioContext.createMediaStreamDestination();
        const audioTrack = receiver.audioDestination.stream.getAudioTracks()[0];
        if (audioTrack) {
          stream.addTrack(audioTrack);
        }
      }

      setBroadcastState('viewer', 'connecting');
      updateStatus(refs.config.labels.connecting);
    }

    function stopRelayReceiver() {
      const receiver = refs.relayReceiver;
      if (!receiver) {
        return;
      }
      refs.relayReceiver = null;
      [receiver.videoDecoder, receiver.audioDecoder].forEach(function (decoder) {
        try {
          if (decoder && decoder.state !== 'closed') {
            decoder.close();
          }
        } catch (_error) {
          // Already closed.
        }
      });
      try {
        void receiver.audioContext?.close();
      } catch (_error) {
        // Already closed.
      }
      receiver.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }

    function handleRelayFrame(buffer) {
      const receiver = refs.relayReceiver;
      const frame = receiver ? readRelayFrame(buffer) : null;
      if (!frame) {
        return;
      }

      switch (frame.kind) {
        case RELAY_KIND.videoKey:
        case RELAY_KIND.videoDelta:
          decodeRelayVideo(receiver, frame);
          return;
        case RELAY_KIND.videoImage:
          drawRelayImage(receiver, frame);
          return;
        case RELAY_KIND.audioConfig:
          configureRelayAudio(receiver, frame);
          return;
        case RELAY_KIND.audio:
          decodeRelayAudio(receiver, frame);
          return;
        default:
          return;
      }
    }

    function ensureRelayVideoDecoder(receiver) {
      if (receiver.videoDecoder) {
        return receiver.videoDecoder;
      }
      if (typeof win.VideoDecoder !== 'function') {
        return null;
      }
      const decoder = new win.VideoDecoder({
        output: function (videoFrame) {
          try {
            paintRelayFrame(receiver, videoFrame, videoFrame.displayWidth, videoFrame.displayHeight);
          } finally {
            videoFrame.close();
          }
        },
        error: function () {
          // A broken decoder recovers on the next keyframe.
          try {
            receiver.videoDecoder?.close();
          } catch (_error) {
            // Already closed.
          }
          receiver.videoDecoder = null;
        },
      });
      decoder.configure({ codec: 'vp8', optimizeForLatency: true });
      receiver.videoDecoder = decoder;
      return decoder;
    }

    function decodeRelayVideo(receiver, frame) {
      const decoder = ensureRelayVideoDecoder(receiver);
      if (!decoder || decoder.state !== 'configured') {
        return;
      }
      const isKey = frame.kind === RELAY_KIND.videoKey;
      // Deltas before the first keyframe cannot be decoded; waiting for one
      // is normal when joining a broadcast already in progress.
      if (!isKey && !receiver.keyframeSeen) {
        return;
      }
      if (isKey) {
        receiver.keyframeSeen = true;
      }
      try {
        decoder.decode(new win.EncodedVideoChunk({
          type: isKey ? 'key' : 'delta',
          timestamp: frame.timestamp,
          data: frame.payload,
        }));
      } catch (_error) {
        receiver.keyframeSeen = false;
      }
    }

    function drawRelayImage(receiver, frame) {
      if (typeof win.createImageBitmap !== 'function') {
        return;
      }
      const blob = new win.Blob([frame.payload], { type: 'image/jpeg' });
      void win.createImageBitmap(blob).then(function (bitmap) {
        try {
          paintRelayFrame(receiver, bitmap, bitmap.width, bitmap.height);
        } finally {
          bitmap.close?.();
        }
      }).catch(function () {
        // Skip an image that failed to decode.
      });
    }

    function paintRelayFrame(receiver, source, width, height) {
      if (refs.relayReceiver !== receiver) {
        return;
      }
      if (width && height && (receiver.canvas.width !== width || receiver.canvas.height !== height)) {
        receiver.canvas.width = width;
        receiver.canvas.height = height;
      }
      receiver.context.drawImage(source, 0, 0, receiver.canvas.width, receiver.canvas.height);
      markRelayLive(receiver);
    }

    /**
     * The viewer only counts as live once a real frame has been painted —
     * announcing it earlier is what used to leave people staring at black.
     */
    function markRelayLive(receiver) {
      if (receiver.live) {
        return;
      }
      receiver.live = true;
      releaseStream(false);
      state.stream = receiver.stream;
      state.streamSourceType = 'remote';
      state.hasAudio = receiver.hasAudio;
      state.currentSourceLabel = refs.config.labels.receiving;
      state.presentationMode = 'expanded';
      setBroadcastState('viewer', 'live');
      updateVideoSource(receiver.stream);
      setMode('viewing', refs.config.labels.receiving);
      showChrome();
    }

    function configureRelayAudio(receiver, frame) {
      if (!receiver.audioContext || typeof win.AudioDecoder !== 'function' || receiver.audioDecoder) {
        return;
      }
      let config = null;
      try {
        config = JSON.parse(new win.TextDecoder().decode(frame.payload));
      } catch (_error) {
        return;
      }

      const decoder = new win.AudioDecoder({
        output: function (audioData) {
          try {
            playRelayAudio(receiver, audioData);
          } finally {
            audioData.close();
          }
        },
        error: function () {
          receiver.audioDecoder = null;
        },
      });
      decoder.configure({
        codec: 'opus',
        sampleRate: config.sampleRate || 48000,
        numberOfChannels: config.channels || 2,
      });
      receiver.audioDecoder = decoder;
    }

    function decodeRelayAudio(receiver, frame) {
      const decoder = receiver.audioDecoder;
      if (!decoder || decoder.state !== 'configured') {
        return;
      }
      try {
        decoder.decode(new win.EncodedAudioChunk({
          type: 'key',
          timestamp: frame.timestamp,
          data: frame.payload,
        }));
      } catch (_error) {
        // Drop this slice of audio.
      }
    }

    function playRelayAudio(receiver, audioData) {
      const context = receiver.audioContext;
      const destination = receiver.audioDestination;
      if (!context || !destination) {
        return;
      }

      const channels = audioData.numberOfChannels;
      const frames = audioData.numberOfFrames;
      const buffer = context.createBuffer(channels, frames, audioData.sampleRate);
      for (let channel = 0; channel < channels; channel += 1) {
        const samples = new Float32Array(frames);
        audioData.copyTo(samples, { planeIndex: channel, format: 'f32-planar' });
        buffer.copyToChannel(samples, channel);
      }

      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(destination);
      // A small jitter cushion: scheduling exactly at currentTime would click
      // on every late packet.
      const startAt = Math.max(context.currentTime + 0.06, receiver.audioPlayhead);
      source.start(startAt);
      receiver.audioPlayhead = startAt + buffer.duration;
    }

// == virtualScreenRuntime.js | signalingAndRemote (assembled per manifest.json; see COMPONENTS.md) ==
    function handleSignalMessage(message) {
      switch (message?.type) {
        case 'registered':
          refs.broadcastRegistered = true;
          state.clientId = message.clientId || state.clientId;
          if (state.streamSourceType === 'local') {
            announceBroadcastStart();
          } else if (refs.broadcastState.active) {
            ensureRemoteBroadcastSubscription(refs.broadcastState);
          }
          return;
        case 'broadcast-live':
          setBroadcastState('sender', 'live');
          setSharedBroadcastState({
            active: true,
            broadcasterPeerId: getCollaborationClient()?.getPeerId?.() || getOwnerPeerId(),
            hasAudio: state.hasAudio,
            sourceKind: state.lastIntent || 'screen',
          });
          updateStatus(refs.config.labels.broadcasting);
          publishSharedScreenState();
          return;
        case 'broadcast-available':
          if (state.streamSourceType === 'local') {
            return;
          }
          setSharedBroadcastState({
            active: true,
            broadcasterPeerId: refs.broadcastState?.broadcasterPeerId || '',
            hasAudio: message.hasAudio === true,
            sourceKind: refs.broadcastState?.sourceKind || 'screen',
          });
          if (!state.viewerOptOut) {
            void startViewerConnection(message.broadcasterId || '');
          }
          return;
        case 'broadcast-stopped':
          // Ownership invariant: the room's screen entity belongs to the
          // sender. A viewer updates only itself — publishing active:false
          // from here once poisoned the whole room out of a live broadcast.
          if (state.streamSourceType === 'remote') {
            detachRemoteBroadcast(refs.config.labels.broadcastStopped, {
              notifyServer: false,
              skipSharedPublish: true,
            });
            setSharedBroadcastState({
              active: false,
              broadcasterPeerId: '',
              hasAudio: false,
              sourceKind: refs.broadcastState?.sourceKind || '',
            });
          } else if (state.streamSourceType === 'local') {
            setBroadcastState('sender', 'idle');
            setSharedBroadcastState({
              active: false,
              broadcasterPeerId: '',
              hasAudio: false,
              sourceKind: refs.broadcastState?.sourceKind || '',
            });
            publishSharedScreenState();
          }
          return;
        case 'viewer-waiting':
          // Parked by the server until the broadcast starts: still connecting.
          if (state.streamSourceType !== 'local') {
            updateStatus(refs.config.labels.connecting);
          }
          return;
        case 'broadcast-denied':
          // Server-side guarantee of one broadcaster per screen: roll the
          // refused share back and return to being a viewer. The room entity
          // is not touched — it belongs to the broadcaster that holds the
          // screen.
          if (state.streamSourceType === 'local') {
            releaseStream(true);
            state.hasAudio = false;
            state.currentSourceLabel = '';
            setBroadcastState('none', 'idle');
            setMode('idle', `${getBroadcasterDisplayName()} ${refs.config.labels.screenBusy}`);
            if (refs.broadcastState?.active && !state.viewerOptOut) {
              void startViewerConnection(refs.broadcastState.broadcasterPeerId || '');
            }
          }
          return;
        case 'viewer-join':
          void handleViewerJoin(message.viewerId || '');
          return;
        // Relay control: the server routes viewers it knows peer-to-peer
        // cannot reach (see relayTransport.js).
        case 'relay-start':
          startRelaySender(message);
          return;
        case 'relay-keyframe':
          requestRelayKeyframe();
          return;
        case 'relay-audience':
          updateRelayAudience(message);
          return;
        case 'relay-stop':
          stopRelaySender();
          return;
        case 'relay-ready':
          startRelayReceiver(message);
          return;
        case 'signal-offer':
          void applyRemoteOffer(message.clientId || '', message.description);
          return;
        case 'signal-answer':
          void applyRemoteAnswer(message.clientId || '', message.description);
          return;
        case 'signal-ice':
          void applyRemoteIce(message.clientId || '', message.candidate);
          return;
        default:
          return;
      }
    }

    function connectSignaling() {
      if (refs.destroyed || !refs.config.broadcastEnabled || !canUseBroadcastTransport()) {
        return;
      }
      if (refs.signalingSocket && [win.WebSocket.OPEN, win.WebSocket.CONNECTING].includes(refs.signalingSocket.readyState)) {
        return;
      }

      const signalingUrl = buildSignalingUrl();
      if (!signalingUrl) {
        return;
      }

      const socket = new win.WebSocket(signalingUrl);
      // Relayed media arrives on this same socket as binary frames.
      socket.binaryType = 'arraybuffer';
      refs.signalingSocket = socket;
      refs.broadcastRegistered = false;

      socket.onopen = function () {
        refs.broadcastRegistered = false;
        setBroadcastState(state.broadcastRole, state.streamSourceType === 'local' ? 'connecting' : state.broadcastStatus);
        sendSignaling({
          type: 'register',
          clientId: getOrCreateClientId(),
        });
      };

      socket.onmessage = function (event) {
        if (event.data instanceof win.ArrayBuffer) {
          handleRelayFrame(event.data);
          return;
        }
        try {
          handleSignalMessage(JSON.parse(event.data));
        } catch (_error) {
          updateStatus(refs.config.labels.broadcastError);
        }
      };

      socket.onerror = function () {
        if (state.streamSourceType === 'local') {
          setBroadcastState('none', 'error');
          updateStatus(refs.config.labels.broadcastError);
        }
      };

      socket.onclose = function () {
        refs.broadcastRegistered = false;
        refs.signalingSocket = null;
        if (refs.destroyed) {
          return;
        }
        if (state.streamSourceType === 'local') {
          setBroadcastState('sender', 'connecting');
        }
        scheduleSignalingReconnect();
      };
    }

    function detachRemoteBroadcast(message, options) {
      const broadcasterId = refs.activeBroadcasterId;
      if (options?.notifyServer !== false && broadcasterId) {
        sendSignaling({
          type: 'viewer-leave',
          clientId: getOrCreateClientId(),
        });
      }

      refs.activeBroadcasterId = '';
      closeAllPeerConnections();
      stopRelayReceiver();
      refs.remoteStream = null;
      refs.joinAttemptSocket = null;
      if (refs.viewerJoinWatchdogTimer) {
        win.clearTimeout(refs.viewerJoinWatchdogTimer);
        refs.viewerJoinWatchdogTimer = null;
      }
      if (refs.remoteFrameWatchTimer) {
        win.clearTimeout(refs.remoteFrameWatchTimer);
        refs.remoteFrameWatchTimer = null;
      }

      if (state.streamSourceType === 'remote') {
        releaseStream(false);
      }

      state.hasAudio = false;
      state.currentSourceLabel = '';

      if (!options?.preserveStatus) {
        setBroadcastState('none', 'idle');
        setMode('idle', message || refs.config.labels.noSignal);
      }

      if (options?.clearSharedBroadcast === true) {
        setSharedBroadcastState({
          active: false,
          broadcasterPeerId: '',
          hasAudio: false,
          sourceKind: refs.broadcastState?.sourceKind || '',
        });
      }

      if (options?.skipSharedPublish !== true) {
        publishSharedScreenState();
      }
    }

    function stopCapture(message, options) {
      if (state.streamSourceType !== 'local') {
        // A viewer — watching or still connecting — leaves locally only: the
        // opt-out sticks until they press Join, and the room entity is never
        // touched (it belongs to the broadcaster).
        state.viewerOptOut = true;
        detachRemoteBroadcast(message || refs.config.labels.broadcastStopped, {
          notifyServer: true,
          skipSharedPublish: true,
        });
        if (options?.minimizeAfterStop === true) {
          state.presentationMode = 'minimized';
          layout();
          refreshUi();
        }
        return;
      }

      sendSignaling({
        type: 'broadcast-stop',
        clientId: getOrCreateClientId(),
        reason: message || refs.config.labels.broadcastStopped,
      });
      closeAllPeerConnections();
      stopRelaySender();
      const shouldMinimize = options?.minimizeAfterStop === true;
      releaseStream(true);
      state.hasAudio = false;
      state.currentSourceLabel = '';
      refs.activeBroadcasterId = '';
      setBroadcastState('none', 'idle');
      setSharedBroadcastState({
        active: false,
        broadcasterPeerId: '',
        hasAudio: false,
        sourceKind: refs.broadcastState?.sourceKind || '',
      });
      state.presentationMode = shouldMinimize ? 'minimized' : 'expanded';
      if (shouldMinimize) {
        setMode('idle', message || refs.config.labels.minimized);
      } else {
        setMode('idle', message || refs.config.labels.idle);
      }
      publishSharedScreenState();
    }

    function attachTrackEndedListener(stream) {
      const tracks = typeof stream?.getVideoTracks === 'function' ? stream.getVideoTracks() : [];
      const track = tracks[0];
      if (!track) {
        return;
      }
      track.addEventListener('ended', function () {
        stopCapture(refs.config.labels.sourceEnded, { minimizeAfterStop: false });
      }, { once: true });
    }

    async function startCapture(intent) {
      if (!refs.config.virtualScreenSupportsLocalCapture) {
        setMode('idle', 'Local screen capture is disabled for this scene.');
        return;
      }
      // One screen, one broadcaster. While somebody else's broadcast is live
      // here, sharing is refused up front — the old behavior detached the
      // viewer from the stream they were watching before even opening the
      // picker, so a stray click cost them the content.
      if (isForeignBroadcastActive()) {
        showChrome();
        updateStatus(`${getBroadcasterDisplayName()} ${refs.config.labels.screenBusy}`);
        return;
      }
      const previousStream = state.stream;
      const previousLabel = state.currentSourceLabel;
      state.lastIntent = intent;
      showChrome();
      setMode('idle', SOURCE_MESSAGES[intent].pending);

      try {
        const stream = await requestCapture(intent);
        if (previousStream && previousStream !== stream) {
          releaseStream(true);
        }
        state.stream = stream;
        state.streamSourceType = 'local';
        state.hasAudio = typeof stream.getAudioTracks === 'function' && stream.getAudioTracks().length > 0;
        updateVideoSource(stream);
        attachTrackEndedListener(stream);
        state.currentSourceLabel = SOURCE_MESSAGES[intent].active;
        state.presentationMode = 'expanded';
        setMode('broadcasting', SOURCE_MESSAGES[intent].active);
        setSharedBroadcastState({
          active: true,
          broadcasterPeerId: getCollaborationClient()?.getPeerId?.() || getOwnerPeerId(),
          hasAudio: state.hasAudio,
          sourceKind: intent || 'screen',
        });
        if (canUseBroadcastTransport()) {
          setBroadcastState('sender', 'connecting');
          connectSignaling();
          announceBroadcastStart();
        } else if (refs.config.broadcastEnabled) {
          setBroadcastState('none', 'error');
          updateStatus(refs.config.labels.broadcastUnavailable);
        } else {
          setBroadcastState('none', 'idle');
        }
        publishSharedScreenState();
      } catch (error) {
        if (previousStream) {
          state.stream = previousStream;
          state.currentSourceLabel = previousLabel;
          setMode('broadcasting', previousLabel || refs.config.labels.idle);
          publishSharedScreenState();
          return;
        }
        state.currentSourceLabel = '';
        state.hasAudio = false;
        setSharedBroadcastState({
          active: false,
          broadcasterPeerId: '',
          hasAudio: false,
          sourceKind: intent || refs.broadcastState?.sourceKind || 'screen',
        });
        setMode('idle', classifyCaptureError(error));
        publishSharedScreenState();
      }
    }

    function switchSource() {
      void startCapture('screen');
    }

    /** Explicitly (re)join this screen's live broadcast as a viewer. */
    function joinBroadcast() {
      state.viewerOptOut = false;
      void startViewerConnection(refs.broadcastState?.broadcasterPeerId || '');
    }
// == virtualScreenRuntime.js | followAndTransform (assembled per manifest.json; see COMPONENTS.md) ==
    function setAnchoredTransform() {
      if (!refs.root) {
        return;
      }
      refs.root.setAttribute('position', formatVector(refs.config.anchoredPosition));
      refs.root.setAttribute('rotation', formatVector(refs.config.anchoredRotation));
    }

    // ── Collision stops ──────────────────────────────────────────────────────
    // The screen behaves like a physical panel: look-at rotation and free
    // movement track the user without limits until any edge would touch the
    // room shell (walls, floor, ceiling) or another screen. There the motion
    // stops — a bumper, not a bounce — and resumes the moment the target pose
    // comes back inside. Bounds derive from the codexr-room entity; the
    // collisionBounds config overrides them (mocks, custom scenes).

    function getCollisionBounds() {
      if (refs.config.collisionEnabled === false) {
        return null;
      }
      // In AR the room is functionally gone (hidden, and its pieces drop
      // their raycast class): screens must move freely instead of bumping
      // into invisible walls. Checked live and BEFORE the cache so the
      // cached room bounds stay intact for when the session ends — desktop
      // and VR keep colliding exactly as before. An explicit collisionBounds
      // override still applies (it describes the caller's own space, not the
      // virtual room). Screen-vs-screen obstacles are untouched.
      if (getScene()?.is?.('ar-mode') && !refs.config.collisionBounds) {
        return null;
      }
      if (refs.collisionBoundsCache) {
        return refs.collisionBoundsCache;
      }
      const margin = refs.config.collisionMargin;
      const override = refs.config.collisionBounds;
      if (override?.min && override?.max) {
        refs.collisionBoundsCache = {
          minX: Number(override.min.x) + margin, maxX: Number(override.max.x) - margin,
          minY: Number(override.min.y) + margin, maxY: Number(override.max.y) - margin,
          minZ: Number(override.min.z) + margin, maxZ: Number(override.max.z) - margin,
        };
        return refs.collisionBoundsCache;
      }
      const roomEl = getDocument()?.querySelector('[codexr-room]');
      const room = roomEl?.components?.['codexr-room']?.data;
      if (!roomEl?.object3D || !room) {
        return null;
      }
      const center = roomEl.object3D.position;
      const wall = Math.max(0.05, Number(room.wallThickness) || 0.25);
      refs.collisionBoundsCache = {
        minX: center.x - (room.width / 2) + wall + margin,
        maxX: center.x + (room.width / 2) - wall - margin,
        minY: center.y + (Number(room.floorThickness) || 0.22) + margin,
        maxY: center.y + room.height - (Number(room.ceilingThickness) || 0.18) - margin,
        minZ: center.z - (room.depth / 2) + wall + margin,
        maxZ: center.z + (room.depth / 2) - wall - margin,
      };
      return refs.collisionBoundsCache;
    }

    // Other screens as thin oriented boxes; refreshed on a short interval —
    // they move rarely compared to the per-frame look-at loop.
    function getScreenObstacles() {
      if (refs.config.collisionEnabled === false) {
        return [];
      }
      const now = Date.now();
      if (refs.obstacleCache && (now - refs.obstacleCacheTime) < 250) {
        return refs.obstacleCache;
      }
      const obstacles = [];
      getDocument()?.querySelectorAll('[id^="codexrVirtualScreenRoot"]').forEach((el) => {
        if (el === refs.root || !el.object3D) {
          return;
        }
        const frame = el.querySelector('[id^="codexrVirtualScreenFrame"]');
        const width = Number(frame?.getAttribute('width')) || 0;
        const height = Number(frame?.getAttribute('height')) || 0;
        if (!width || !height) {
          return;
        }
        el.object3D.updateMatrixWorld(true);
        obstacles.push({
          inverseMatrix: el.object3D.matrixWorld.clone().invert(),
          halfExtents: { x: width / 2, y: height / 2, z: 0.15 },
        });
      });
      refs.obstacleCache = obstacles;
      refs.obstacleCacheTime = now;
      return obstacles;
    }

    // Sample grid of the screen plane (corners, edge midpoints, center) at a
    // candidate world transform and size.
    function collectScreenSamplePoints(worldPosition, worldQuaternion, width) {
      const effectiveWidth = Number(width) > 0 ? Number(width) : state.screenWidth;
      const w = effectiveWidth / 2;
      const h = (effectiveWidth / refs.config.aspectRatio) / 2;
      return [
        [-w, -h], [w, -h], [-w, h], [w, h],
        [0, -h], [0, h], [-w, 0], [w, 0], [0, 0],
      ].map(([x, y]) => new global.THREE.Vector3(x, y, 0)
        .applyQuaternion(worldQuaternion)
        .add(worldPosition));
    }

    function violatesCollision(samplePoints) {
      const bounds = getCollisionBounds();
      if (bounds) {
        for (const point of samplePoints) {
          if (point.x < bounds.minX || point.x > bounds.maxX
            || point.y < bounds.minY || point.y > bounds.maxY
            || point.z < bounds.minZ || point.z > bounds.maxZ) {
            return true;
          }
        }
      }
      const local = new global.THREE.Vector3();
      for (const obstacle of getScreenObstacles()) {
        for (const point of samplePoints) {
          local.copy(point).applyMatrix4(obstacle.inverseMatrix);
          if (Math.abs(local.x) < obstacle.halfExtents.x
            && Math.abs(local.y) < obstacle.halfExtents.y
            && Math.abs(local.z) < obstacle.halfExtents.z) {
            return true;
          }
        }
      }
      return false;
    }

    // Rotation bumper: apply as much of the target orientation as fits. Tries
    // the full look-at first, then shrinking slerp fractions toward it; when
    // nothing fits the screen simply holds its pose until the user moves back.
    function constrainOrientation(worldPosition, targetQuaternion) {
      if (!global.THREE || !targetQuaternion?.clone) {
        return targetQuaternion;
      }
      if (!violatesCollision(collectScreenSamplePoints(worldPosition, targetQuaternion))) {
        return targetQuaternion;
      }
      const currentQuaternion = getWorldQuaternion(refs.root);
      if (!currentQuaternion?.clone) {
        return targetQuaternion;
      }
      for (const fraction of [0.5, 0.25, 0.1]) {
        const partial = currentQuaternion.clone().slerp(targetQuaternion, fraction);
        if (!violatesCollision(collectScreenSamplePoints(worldPosition, partial))) {
          return partial;
        }
      }
      return currentQuaternion;
    }

    // Movement bumper with wall sliding: the component of the motion into the
    // obstacle stops, the parallel components keep following the pointer.
    function constrainPosition(targetWorldPosition) {
      if (!global.THREE || !targetWorldPosition?.clone) {
        return targetWorldPosition;
      }
      const orientation = getWorldQuaternion(refs.root);
      if (!orientation?.clone) {
        return targetWorldPosition;
      }
      if (!violatesCollision(collectScreenSamplePoints(targetWorldPosition, orientation))) {
        return targetWorldPosition;
      }
      const current = getWorldPosition(refs.root);
      if (!current?.clone) {
        return targetWorldPosition;
      }
      const slid = current.clone();
      for (const axis of ['x', 'y', 'z']) {
        const attempt = slid.clone();
        attempt[axis] = targetWorldPosition[axis];
        if (!violatesCollision(collectScreenSamplePoints(attempt, orientation))) {
          slid.copy(attempt);
        }
      }
      return slid;
    }

    function scheduleAnimationFrame(callback) {
      const nextFrame = win.requestAnimationFrame || global.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };
      nextFrame(callback);
    }

    function enableFollow() {
      if (state.follow) {
        return;
      }
      const followTransform = captureFollowTransformFromCamera();
      if (!followTransform) {
        return;
      }
      state.followTransform = followTransform;
      state.follow = true;
      updateLegendSide();
      layout();
      ensureFollowLoop();
      showChrome();
      console.log('VIRTUAL_SCREEN: follow enabled', {
        position: state.followTransform?.position
          ? { x: state.followTransform.position.x, y: state.followTransform.position.y, z: state.followTransform.position.z }
          : null,
      });
      updateStatus(state.currentSourceLabel || 'Virtual screen follows the user.');
    }

    function disableFollow() {
      if (!state.follow) {
        return;
      }
      state.follow = false;
      state.followTransform = null;
      updateLegendSide();
      layout();
      if (state.lookAtCameraEnabled) {
        ensureFaceCameraLoop();
      }
      showChrome();
      console.log('VIRTUAL_SCREEN: follow disabled');
      updateStatus(state.currentSourceLabel || 'Virtual screen anchored in the scene.');
    }

    function toggleFollow() {
      if (state.follow) {
        disableFollow();
      } else {
        enableFollow();
      }
      publishSharedScreenState();
    }

    function recenter() {
      if (!refs.root) {
        return;
      }
      if (state.follow) {
        state.followTransform = captureFollowTransformFromCamera();
        applyFollowTransform();
      } else {
        const scene = getScene();
        if (scene) {
          scene.appendChild(refs.root);
        }
        setAnchoredTransform();
        if (state.lookAtCameraEnabled) {
          applyFaceCameraOrientation();
        }
      }
      showChrome();
      updateStatus(state.currentSourceLabel || 'Virtual screen recentered.');
      publishSharedScreenState();
      publishSharedTransform(true);
    }

    function buildFrontOfUserFollowTransform() {
      if (!global.THREE) {
        console.log('[CodeXR][VirtualScreen] buildFrontOfUserFollowTransform failed: THREE unavailable', {
          screenId: getScreenId(),
        });
        return null;
      }
      const followOffset = refs.config.followOffset || DEFAULT_CONFIG.followOffset;
      const position = new global.THREE.Vector3(
        Number(followOffset.x) || 0,
        Number(followOffset.y) || 0,
        Number(followOffset.z) || 0,
      );
      console.log('[CodeXR][VirtualScreen] buildFrontOfUserFollowTransform', {
        screenId: getScreenId(),
        followOffset: {
          x: position.x,
          y: position.y,
          z: position.z,
        },
        followAnchorSelector: refs.config.followAnchorSelector,
      });
      return {
        position,
        distance: position.length(),
      };
    }

    function placeInFrontOfUser(options) {
      if (!refs.root) {
        console.log('[CodeXR][VirtualScreen] placeInFrontOfUser failed: root missing', {
          screenId: getScreenId(),
        });
        return false;
      }
      const followTransform = buildFrontOfUserFollowTransform();
      if (!followTransform) {
        console.log('[CodeXR][VirtualScreen] placeInFrontOfUser failed: follow transform missing', {
          screenId: getScreenId(),
        });
        return false;
      }
      state.follow = false;
      state.followTransform = followTransform;
      if (!applyFollowTransform()) {
        console.log('[CodeXR][VirtualScreen] placeInFrontOfUser failed: applyFollowTransform returned false', {
          screenId: getScreenId(),
          followTransform: {
            position: {
              x: followTransform.position.x,
              y: followTransform.position.y,
              z: followTransform.position.z,
            },
            distance: followTransform.distance,
          },
          rootPosition: refs.root?.object3D?.position
            ? {
              x: refs.root.object3D.position.x,
              y: refs.root.object3D.position.y,
              z: refs.root.object3D.position.z,
            }
            : null,
        });
        return false;
      }
      if (state.lookAtCameraEnabled) {
        applyFaceCameraOrientation();
      }
      layout();
      refreshUi();
      if (options?.showChrome !== false) {
        showChrome();
      }
      if (options?.updateStatus !== false) {
        updateStatus(state.currentSourceLabel || 'Virtual screen moved in front of you.');
      }
      if (options?.publishState === true) {
        publishSharedScreenState();
      }
      if (options?.publishTransform === true) {
        publishSharedTransform(true);
      }
      const rootWorldPosition = getWorldPosition(refs.root);
      console.log('[CodeXR][VirtualScreen] placeInFrontOfUser success', {
        screenId: getScreenId(),
        rootLocalPosition: refs.root?.object3D?.position
          ? {
            x: refs.root.object3D.position.x,
            y: refs.root.object3D.position.y,
            z: refs.root.object3D.position.z,
          }
          : null,
        rootWorldPosition: rootWorldPosition?.clone
          ? {
            x: rootWorldPosition.x,
            y: rootWorldPosition.y,
            z: rootWorldPosition.z,
          }
          : null,
      });
      return true;
    }

    function adjustSize(direction) {
      const nextIndex = clamp(findClosestSizeIndex(state.screenWidth) + direction, 0, refs.config.sizeSteps.length - 1);
      state.sizeIndex = nextIndex;
      state.screenWidth = refs.config.sizeSteps[nextIndex];
      layout();
      refreshUi();
      showChrome();
      updateStatus(state.currentSourceLabel || 'Virtual screen size updated.');
      publishSharedScreenState();
    }

    function setScreenWidth(width, options) {
      const nextWidth = clamp(Number(width || state.screenWidth), refs.config.minWidth, refs.config.maxWidth);
      state.screenWidth = nextWidth;
      state.sizeIndex = findClosestSizeIndex(nextWidth);
      layout();
      refreshUi();
      if (!options?.silent) {
        showChrome();
        updateStatus(state.currentSourceLabel || 'Virtual screen size updated.');
        publishSharedScreenState();
      }
      return state.screenWidth;
    }

    function setDisplayName(name) {
      if (typeof name === 'string' && name.trim().length > 0) {
        state.displayName = name.trim();
        if (state.mode === 'idle') {
          updateStatus(name.trim());
        }
        publishSharedScreenState();
      }
    }

    function minimize() {
      state.presentationMode = 'minimized';
      layout();
      refreshUi();
      updateStatus(refs.config.labels.minimized);
      publishSharedScreenState();
    }

    function expand() {
      state.presentationMode = 'expanded';
      layout();
      refreshUi();
      updateStatus(state.currentSourceLabel || refs.config.labels.idle);
      showChrome();
      publishSharedScreenState();
    }

    function getWorldPosition(entity) {
      if (!entity?.object3D || !global.THREE) {
        return null;
      }
      const vector = new global.THREE.Vector3();
      entity.object3D.getWorldPosition(vector);
      return vector;
    }

    function getCameraWorldPosition() {
      if (!global.THREE) {
        return null;
      }
      const scene = getScene();
      if (scene?.camera?.getWorldPosition) {
        const vector = new global.THREE.Vector3();
        scene.camera.getWorldPosition(vector);
        return vector;
      }
      const cameraEntity = getDocument()?.querySelector('a-camera, [camera]');
      return getWorldPosition(cameraEntity) || getWorldPosition(getFollowAnchor());
    }

    function getWorldQuaternion(entity) {
      if (!entity?.object3D || !global.THREE) {
        return null;
      }
      const quaternion = new global.THREE.Quaternion();
      entity.object3D.getWorldQuaternion(quaternion);
      return quaternion;
    }

    function applyWorldTransform(entity, worldPosition, worldQuaternion) {
      if (!entity?.object3D?.parent || !global.THREE || !worldPosition?.clone || !worldQuaternion?.clone) {
        return false;
      }
      const parent = entity.object3D.parent;
      parent.updateMatrixWorld?.(true);

      const localPosition = worldPosition.clone();
      parent.worldToLocal(localPosition);

      const parentQuaternion = new global.THREE.Quaternion();
      parent.getWorldQuaternion(parentQuaternion);
      const localQuaternion = parentQuaternion.clone().invert().multiply(worldQuaternion.clone());

      entity.object3D.position.copy(localPosition);
      entity.object3D.quaternion.copy(localQuaternion);
      return true;
    }

    function updateLegendSide() {
      if (!refs.root?.object3D || !global.THREE) {
        return false;
      }
      const cameraWorldPosition = getCameraWorldPosition();
      const cameraWorldQuaternion = getCameraWorldQuaternion();
      const rootWorldPosition = getWorldPosition(refs.root);
      if (!cameraWorldPosition?.clone || !cameraWorldQuaternion?.clone || !rootWorldPosition?.clone) {
        return false;
      }

      const screenInViewSpace = rootWorldPosition.clone()
        .sub(cameraWorldPosition)
        .applyQuaternion(cameraWorldQuaternion.clone().invert());
      const legendSwitchThreshold = 0.28;
      const desiredSide = screenInViewSpace.x > legendSwitchThreshold
        ? 'left'
        : screenInViewSpace.x < -legendSwitchThreshold
          ? 'right'
          : state.legendSide;

      if (desiredSide === state.legendSide) {
        return false;
      }
      state.legendSide = desiredSide;
      return true;
    }

    function applyFaceCameraOrientation() {
      if (!refs.root?.object3D || !global.THREE) {
        return false;
      }
      const cameraWorldPosition = getCameraWorldPosition();
      const rootWorldPosition = getWorldPosition(refs.root);
      if (!cameraWorldPosition?.clone || !rootWorldPosition?.clone) {
        return false;
      }
      const targetWorldQuaternion = constrainOrientation(
        rootWorldPosition,
        computeFaceUserQuaternion(rootWorldPosition, cameraWorldPosition),
      );
      if (!targetWorldQuaternion?.clone) {
        return false;
      }
      const applied = applyWorldTransform(refs.root, rootWorldPosition, targetWorldQuaternion);
      if (applied && updateLegendSide()) {
        layout();
      }
      return applied;
    }

    function computeFaceUserQuaternion(screenWorldPosition, cameraWorldPosition) {
      if (!global.THREE || !screenWorldPosition?.clone || !cameraWorldPosition?.clone) {
        return null;
      }

      const forward = cameraWorldPosition.clone().sub(screenWorldPosition);
      if (forward.lengthSq() < 0.000001) {
        return getWorldQuaternion(refs.root);
      }
      forward.normalize();

      let referenceUp = new global.THREE.Vector3(0, 1, 0);
      let right = new global.THREE.Vector3().crossVectors(referenceUp, forward);
      if (right.lengthSq() < 0.000001) {
        referenceUp = new global.THREE.Vector3(1, 0, 0);
        right = new global.THREE.Vector3().crossVectors(referenceUp, forward);
      }
      if (right.lengthSq() < 0.000001) {
        referenceUp = new global.THREE.Vector3(0, 0, 1);
        right = new global.THREE.Vector3().crossVectors(referenceUp, forward);
      }
      right.normalize();

      const up = new global.THREE.Vector3().crossVectors(forward, right).normalize();
      const basis = new global.THREE.Matrix4().makeBasis(right, up, forward);
      return new global.THREE.Quaternion().setFromRotationMatrix(basis);
    }

    function captureFollowTransformFromCamera() {
      if (!refs.root?.object3D || !global.THREE) {
        return null;
      }
      const cameraWorldPosition = getCameraWorldPosition();
      const cameraWorldQuaternion = getCameraWorldQuaternion();
      const rootWorldPosition = getWorldPosition(refs.root);
      if (!cameraWorldPosition?.clone || !cameraWorldQuaternion?.clone || !rootWorldPosition?.clone) {
        return null;
      }

      const inverseCameraQuaternion = cameraWorldQuaternion.clone().invert();
      return {
        position: rootWorldPosition.clone().sub(cameraWorldPosition).applyQuaternion(inverseCameraQuaternion.clone()),
        distance: rootWorldPosition.distanceTo(cameraWorldPosition),
      };
    }

    function applyFollowTransform() {
      if (!state.followTransform?.position?.clone) {
        console.log('[CodeXR][VirtualScreen] applyFollowTransform failed: missing followTransform position', {
          screenId: getScreenId(),
        });
        return false;
      }
      const cameraWorldPosition = getCameraWorldPosition();
      const cameraWorldQuaternion = getCameraWorldQuaternion();
      if (!cameraWorldPosition?.clone || !cameraWorldQuaternion?.clone) {
        console.log('[CodeXR][VirtualScreen] applyFollowTransform failed: camera transform unavailable', {
          screenId: getScreenId(),
          hasCameraWorldPosition: !!cameraWorldPosition?.clone,
          hasCameraWorldQuaternion: !!cameraWorldQuaternion?.clone,
          followAnchorSelector: refs.config.followAnchorSelector,
          followAnchorConnected: !!getFollowAnchor()?.isConnected,
          sceneHasCamera: !!getScene()?.camera,
        });
        return false;
      }

      const targetWorldPosition = state.followTransform.position.clone()
        .applyQuaternion(cameraWorldQuaternion.clone())
        .add(cameraWorldPosition.clone());
      const targetWorldQuaternion = computeFaceUserQuaternion(targetWorldPosition, cameraWorldPosition);
      const applied = applyWorldTransform(refs.root, targetWorldPosition, targetWorldQuaternion);
      console.log('[CodeXR][VirtualScreen] applyFollowTransform', {
        screenId: getScreenId(),
        applied,
        cameraWorldPosition: {
          x: cameraWorldPosition.x,
          y: cameraWorldPosition.y,
          z: cameraWorldPosition.z,
        },
        targetWorldPosition: {
          x: targetWorldPosition.x,
          y: targetWorldPosition.y,
          z: targetWorldPosition.z,
        },
      });
      if (applied && updateLegendSide()) {
        layout();
      }
      return applied;
    }

    function updateFollow() {
      if (!state.follow || !state.followTransform) {
        state.followLoopActive = false;
        return;
      }
      applyFollowTransform();
      scheduleAnimationFrame(updateFollow);
    }

    function ensureFollowLoop() {
      if (state.followLoopActive) {
        return;
      }
      state.followLoopActive = true;
      scheduleAnimationFrame(updateFollow);
    }

    function updateFaceCamera() {
      if (state.follow || !state.lookAtCameraEnabled || !refs.root?.isConnected) {
        state.faceCameraLoopActive = false;
        return;
      }
      applyFaceCameraOrientation();
      scheduleAnimationFrame(updateFaceCamera);
    }

    function ensureFaceCameraLoop() {
      if (state.faceCameraLoopActive || !state.lookAtCameraEnabled) {
        return;
      }
      state.faceCameraLoopActive = true;
      scheduleAnimationFrame(updateFaceCamera);
    }

// == virtualScreenRuntime.js | pointerAndDrag (assembled per manifest.json; see COMPONENTS.md) ==
    function getRaycasterIntersection(entity, pointerEl) {
      const raycaster = pointerEl?.components?.raycaster;
      if (!raycaster || typeof raycaster.getIntersection !== 'function') {
        return null;
      }
      return raycaster.getIntersection(entity);
    }

    function getPointerRay(pointerEl) {
      const raycasterComponent = pointerEl?.components?.raycaster;
      const raycaster = raycasterComponent?.raycaster;
      if (!raycaster?.ray) {
        return null;
      }
      return raycaster.ray;
    }

    function getPointerEntity(evt) {
      return evt?.detail?.cursorEl || evt?.detail?.raycasterEl || null;
    }

    function getPointerType(pointerEl) {
      if (!pointerEl) {
        return 'unknown';
      }
      const cursorData = pointerEl.components?.cursor?.data;
      if (cursorData?.rayOrigin === 'mouse') {
        return 'mouse';
      }
      const cursorAttr = typeof pointerEl.getAttribute === 'function' ? pointerEl.getAttribute('cursor') : null;
      if (cursorAttr?.rayOrigin === 'mouse') {
        return 'mouse';
      }
      return 'controller';
    }

    function getWorldPointFromEvent(evt, pointerEl) {
      if (evt?.detail?.intersection?.point && typeof evt.detail.intersection.point.clone === 'function') {
        return evt.detail.intersection.point.clone();
      }
      const raycasterIntersection = getRaycasterIntersection(refs.interactionPlane, pointerEl);
      if (raycasterIntersection?.point && typeof raycasterIntersection.point.clone === 'function') {
        return raycasterIntersection.point.clone();
      }
      return null;
    }

    function worldToParentLocal(worldPoint) {
      if (!refs.root?.object3D?.parent || !worldPoint?.clone) {
        return null;
      }
      const localPoint = worldPoint.clone();
      refs.root.object3D.parent.worldToLocal(localPoint);
      return localPoint;
    }

    function getDragPlaneNormal() {
      if (!global.THREE) {
        return null;
      }
      const referenceQuaternion = getCameraWorldQuaternion() || getWorldQuaternion(refs.root);
      if (!referenceQuaternion?.clone) {
        return null;
      }
      return new global.THREE.Vector3(0, 0, -1).applyQuaternion(referenceQuaternion.clone()).normalize();
    }

    function buildDragPlane(worldPoint, planeNormal) {
      if (!global.THREE || !worldPoint?.clone) {
        return null;
      }
      const normal = planeNormal?.clone ? planeNormal.clone() : getDragPlaneNormal();
      if (!normal?.clone) {
        return null;
      }
      return new global.THREE.Plane().setFromNormalAndCoplanarPoint(normal, worldPoint.clone());
    }

    function getDragDepthAxis(rootWorldPosition) {
      if (!global.THREE || !rootWorldPosition?.clone) {
        return null;
      }
      const cameraWorldPosition = getCameraWorldPosition();
      if (!cameraWorldPosition?.clone) {
        return null;
      }
      const axis = rootWorldPosition.clone().sub(cameraWorldPosition);
      if (axis.lengthSq() === 0) {
        return null;
      }
      return axis.normalize();
    }

    function getSurfaceIntersection(pointerEl) {
      if (state.drag?.plane && global.THREE) {
        const ray = getPointerRay(pointerEl);
        if (ray?.intersectPlane) {
          const worldPoint = new global.THREE.Vector3();
          const hit = ray.intersectPlane(state.drag.plane, worldPoint);
          if (hit) {
            return worldPoint.clone();
          }
          console.log('VIRTUAL_SCREEN: drag intersection missing');
          return null;
        }
      }

      const intersection = getRaycasterIntersection(refs.interactionPlane, pointerEl);
      if (intersection?.point && typeof intersection.point.clone === 'function') {
        return intersection.point.clone();
      }
      return null;
    }

    function applyResize(intersectionPoint) {
      if (!refs.root?.object3D || !global.THREE || !intersectionPoint?.clone) {
        return;
      }
      const localPoint = refs.root.object3D.worldToLocal(intersectionPoint.clone());
      const targetWidth = Math.max(
        Math.abs(localPoint.x) * 2,
        Math.abs(localPoint.y) * 2 * refs.config.aspectRatio,
      );
      const nextWidth = clamp(targetWidth, refs.config.minWidth, refs.config.maxWidth);
      // Collision bumper: growing must not push an edge into a wall or
      // another screen (shrinking only pulls edges inward — always fine).
      if (nextWidth > state.screenWidth) {
        const worldPosition = getWorldPosition(refs.root);
        const worldQuaternion = getWorldQuaternion(refs.root);
        if (worldPosition && worldQuaternion
          && violatesCollision(collectScreenSamplePoints(worldPosition, worldQuaternion, nextWidth))) {
          return;
        }
      }
      state.screenWidth = nextWidth;
      state.sizeIndex = findClosestSizeIndex(state.screenWidth);
      layout();
      refreshUi();
      publishSharedScreenState();
    }

    function applyDragRootWorldPosition(worldPosition) {
      const localPosition = worldToParentLocal(worldPosition);
      if (!localPosition) {
        return false;
      }
      refs.root.object3D.position.copy(localPosition);
      return true;
    }

    function applyMove(intersectionPoint) {
      if (!state.drag || !intersectionPoint?.clone) {
        return;
      }
      const referencePoint = state.drag.currentStartPoint || state.drag.startPoint;
      const referenceRootPosition = state.drag.currentStartRootWorldPosition || state.drag.startRootWorldPosition;
      // Collision bumper: motion into a wall/screen stops, parallel motion
      // keeps sliding along it.
      const targetWorldPosition = constrainPosition(
        intersectionPoint.clone().sub(referencePoint).add(referenceRootPosition),
      );
      if (!applyDragRootWorldPosition(targetWorldPosition)) {
        return;
      }
      if (!state.follow && state.lookAtCameraEnabled) {
        applyFaceCameraOrientation();
      }
      if (updateLegendSide()) {
        layout();
      }
      console.log('VIRTUAL_SCREEN: move update', {
        x: refs.root.object3D.position.x,
        y: refs.root.object3D.position.y,
        z: refs.root.object3D.position.z,
        handle: state.drag?.handleKey || 'unknown',
      });
      publishSharedTransform(false);
    }

    function adjustDragDepth(delta) {
      if (!state.drag || state.drag.kind !== 'move' || !state.drag.depthAxis?.clone) {
        return;
      }
      let target = state.drag.targetDepthOffset + delta;
      // The collision bumper is a physical stop, not a clamp: without a lead
      // limit the target kept growing while the screen sat pinned against a
      // wall, and reversing the input had to unwind it all before the screen
      // moved again.
      const maxLead = refs.config.dragDepthMaxLead ?? 1.2;
      const current = state.drag.currentDepthOffset;
      target = Math.min(Math.max(target, current - maxLead), current + maxLead);
      // Pulling stops before the screen reaches the user's head. The grab
      // distance is measured once at startDrag; close enough, since the depth
      // axis is frozen there too.
      if (typeof state.drag.startDepthDistance === 'number') {
        const minDistance = refs.config.dragDepthMinDistance ?? 0.6;
        target = Math.max(target, minDistance - state.drag.startDepthDistance);
      }
      state.drag.targetDepthOffset = target;
    }

    function adjustDragLateral(delta) {
      if (!state.drag || state.drag.kind !== 'move' || !state.drag.lateralAxis?.clone) {
        return;
      }
      // Same lead clamp as depth: the bumpers stop the screen at walls and
      // other screens, and the target must not run away while it is pinned.
      const maxLead = refs.config.dragDepthMaxLead ?? 1.2;
      const current = state.drag.currentLateralOffset;
      const target = state.drag.targetLateralOffset + delta;
      state.drag.targetLateralOffset = Math.min(Math.max(target, current - maxLead), current + maxLead);
    }

    // Reach from the grabbing controller's thumbstick, applied every frame of
    // the drag loop: thumbstickmoved only fires when an axis CHANGES, so the
    // handler merely records the deflection and this converts it into motion
    // for as long as the stick is held. Stick forward (negative y) pushes the
    // screen away — the Quest convention — and stick right (positive x)
    // slides it to the user's right, both at the same speed.
    function applyStickDepth() {
      if (!state.drag) {
        return;
      }
      const now = global.performance?.now ? global.performance.now() : Date.now();
      const last = state.drag.lastDepthTick ?? now;
      state.drag.lastDepthTick = now;
      const deflectionY = state.drag.depthStickY || 0;
      const deflectionX = state.drag.depthStickX || 0;
      if (!deflectionY && !deflectionX) {
        return;
      }
      const dtSeconds = Math.min(Math.max(now - last, 0), 50) / 1000;
      const speed = refs.config.controllerDepthSpeed ?? 1.8;
      if (deflectionY) {
        adjustDragDepth(-deflectionY * speed * dtSeconds);
      }
      if (deflectionX) {
        adjustDragLateral(deflectionX * speed * dtSeconds);
      }
    }

    function updateDragDepthSmoothing() {
      if (!state.drag || state.drag.kind !== 'move' || !state.drag.depthAxis?.clone) {
        return;
      }
      const depthDelta = state.drag.targetDepthOffset - state.drag.currentDepthOffset;
      if (Math.abs(depthDelta) < 0.0005) {
        state.drag.currentDepthOffset = state.drag.targetDepthOffset;
      } else {
        state.drag.currentDepthOffset += depthDelta * 0.18;
      }
      const lateralDelta = state.drag.targetLateralOffset - state.drag.currentLateralOffset;
      if (Math.abs(lateralDelta) < 0.0005) {
        state.drag.currentLateralOffset = state.drag.targetLateralOffset;
      } else {
        state.drag.currentLateralOffset += lateralDelta * 0.18;
      }

      // Depth moves the interaction PLANE (so the ray's intersection slides
      // along the ray — that is what makes push/pull work). Lateral must NOT
      // touch the plane: shifting a plane parallel to itself leaves the
      // ray-plane intersection where it was, so an in-plane offset would only
      // move the screen by its tiny out-of-plane residual (observed live as
      // "slow and coupled to depth"). Instead it shifts only the screen's
      // reference position, which applyMove translates 1:1.
      const currentDepthVector = state.drag.depthAxis.clone().multiplyScalar(state.drag.currentDepthOffset);
      const rootOffsetVector = currentDepthVector.clone();
      if (state.drag.lateralAxis?.clone && state.drag.currentLateralOffset) {
        rootOffsetVector.add(state.drag.lateralAxis.clone().multiplyScalar(state.drag.currentLateralOffset));
      }
      state.drag.currentStartPoint = state.drag.startPoint.clone().add(currentDepthVector);
      state.drag.currentStartRootWorldPosition = state.drag.startRootWorldPosition.clone().add(rootOffsetVector);
      state.drag.plane = buildDragPlane(state.drag.currentStartPoint, state.drag.planeNormal);
    }

    function handleWheelDuringDrag(evt) {
      if (!state.drag || state.drag.kind !== 'move' || state.drag.pointerType !== 'mouse') {
        return;
      }
      const direction = Math.sign(evt.deltaY || 0);
      if (!direction) {
        return;
      }
      evt.preventDefault?.();
      adjustDragDepth(direction * refs.config.dragDepthStep);
    }

    function handleThumbstickDuringDrag(evt) {
      if (!state.drag || state.drag.kind !== 'move' || state.drag.pointerType !== 'controller') {
        return;
      }
      // Only the stick of the hand that GRABBED drives the depth; the other
      // hand keeps its locomotion role.
      const pointerEl = state.drag.pointerEl;
      if (pointerEl?.id && evt.currentTarget?.id && evt.currentTarget.id !== pointerEl.id) {
        return;
      }
      const axisY = typeof evt.detail?.y === 'number'
        ? evt.detail.y
        : Array.isArray(evt.detail?.axis) && typeof evt.detail.axis[1] === 'number'
          ? evt.detail.axis[1]
          : null;
      const axisX = typeof evt.detail?.x === 'number'
        ? evt.detail.x
        : Array.isArray(evt.detail?.axis) && typeof evt.detail.axis[0] === 'number'
          ? evt.detail.axis[0]
          : null;
      if (typeof axisY !== 'number' && typeof axisX !== 'number') {
        return;
      }
      // Record only — applyStickDepth turns this into per-frame motion.
      // Recording is idempotent, so the double listener (scene + controller,
      // see wireDepthInputHandlers) needs no stopPropagation games.
      if (typeof axisY === 'number') {
        state.drag.depthStickY = Math.abs(axisY) < 0.15 ? 0 : axisY;
      }
      if (typeof axisX === 'number') {
        state.drag.depthStickX = Math.abs(axisX) < 0.15 ? 0 : axisX;
      }
    }

    function updateDrag() {
      if (!state.drag) {
        state.dragLoopActive = false;
        return;
      }
      applyStickDepth();
      updateDragDepthSmoothing();
      const intersectionPoint = getSurfaceIntersection(state.drag.pointerEl);
      if (!intersectionPoint) {
        scheduleAnimationFrame(updateDrag);
        return;
      }
      if (state.drag.kind === 'resize') {
        applyResize(intersectionPoint);
      } else {
        applyMove(intersectionPoint);
      }
      scheduleAnimationFrame(updateDrag);
    }

    function startDrag(kind, handleKey, evt) {
      if ((isMinimized() && kind === 'resize') || !global.THREE || !refs.root?.object3D) {
        return;
      }
      if (state.follow) {
        disableFollow();
      }
      const collaborationClient = getCollaborationClient();
      state.gestureOwnerPeerId = collaborationClient?.getPeerId?.() || state.gestureOwnerPeerId || null;
      collaborationClient?.lockEntity?.('screen', getScreenId());
      const pointerEl = getPointerEntity(evt);
      const startPoint = getWorldPointFromEvent(evt, pointerEl);
      const rootWorldPosition = getWorldPosition(refs.root);
      const planeNormal = getDragPlaneNormal();
      if (!pointerEl || !startPoint || !rootWorldPosition) {
        return;
      }
      state.drag = {
        kind,
        handleKey,
        pointerEl,
        pointerType: getPointerType(pointerEl),
        startPoint,
        startRootWorldPosition: rootWorldPosition,
        currentStartPoint: startPoint.clone(),
        currentStartRootWorldPosition: rootWorldPosition.clone(),
        planeNormal,
        plane: buildDragPlane(startPoint, planeNormal),
        depthAxis: kind === 'move' ? getDragDepthAxis(rootWorldPosition) : null,
        lateralAxis: null,
        currentDepthOffset: 0,
        targetDepthOffset: 0,
        currentLateralOffset: 0,
        targetLateralOffset: 0,
        depthStickY: 0,
        depthStickX: 0,
        lastDepthTick: null,
        startDepthDistance: null,
        gateHand: null,
        ownsSceneDragState: false,
      };
      if (state.drag.depthAxis && global.THREE) {
        // The stick's x axis slides the screen sideways: horizontal, and
        // perpendicular to the camera->screen depth axis. depth x up = the
        // user's right. Degenerates when the screen is straight overhead —
        // then there is no meaningful "sideways" and it stays off.
        const lateral = state.drag.depthAxis.clone()
          .cross(new global.THREE.Vector3(0, 1, 0));
        if (lateral.lengthSq() > 1e-6) {
          state.drag.lateralAxis = lateral.normalize();
        }
      }
      if (state.drag.depthAxis) {
        const cameraWorldPosition = getCameraWorldPosition();
        if (cameraWorldPosition?.clone) {
          state.drag.startDepthDistance = rootWorldPosition.clone().sub(cameraWorldPosition).length();
        }
      }
      if (state.drag.pointerType === 'controller') {
        // The grabbing hand's thumbstick belongs to the drag now: claim it so
        // aframe-extras' gamepad locomotion ignores that stick (the OTHER
        // hand keeps walking/turning), and mark the scene so
        // codexr-pointer-policy does not hand the laser away mid-grab.
        state.drag.gateHand = pointerEl?.id === 'leftController'
          ? 'left'
          : pointerEl?.id === 'rightController' ? 'right' : null;
        if (state.drag.gateHand) {
          global.CodeXRStickGateRuntime?.claim?.(state.drag.gateHand);
        }
        const sceneEl = getScene();
        if (sceneEl?.addState) {
          sceneEl.addState('codexr-screen-drag');
          state.drag.ownsSceneDragState = true;
        }
      }
      console.log('VIRTUAL_SCREEN: drag start', {
        kind,
        handleKey,
        pointerType: state.drag.pointerType,
        startPoint: { x: startPoint.x, y: startPoint.y, z: startPoint.z },
      });
      if (!state.dragLoopActive) {
        state.dragLoopActive = true;
        scheduleAnimationFrame(updateDrag);
      }
      showChrome();
      setInteractive(refs.dragPlane, true);
      updateStatus(kind === 'resize' ? refs.config.labels.resize : refs.config.labels.move);
    }

    function endDrag() {
      if (!state.drag) {
        return;
      }
      console.log('VIRTUAL_SCREEN: drag end');
      // Give the sticks back: release the locomotion claim and the
      // pointer-hold scene state this drag took (and only if THIS instance
      // took them — endDrag also fires globally on window mouseup/blur).
      if (state.drag.gateHand) {
        global.CodeXRStickGateRuntime?.release?.(state.drag.gateHand);
      }
      if (state.drag.ownsSceneDragState) {
        getScene()?.removeState?.('codexr-screen-drag');
      }
      state.drag = null;
      setInteractive(refs.dragPlane, false);
      if (!state.follow && state.lookAtCameraEnabled) {
        applyFaceCameraOrientation();
        ensureFaceCameraLoop();
      }
      updateStatus(state.currentSourceLabel || (isMinimized() ? refs.config.labels.minimized : refs.config.labels.idle));
      scheduleChromeHide();
      getCollaborationClient()?.unlockEntity?.('screen', getScreenId());
      state.gestureOwnerPeerId = null;
      publishSharedScreenState();
      publishSharedTransform(true);
    }

// == virtualScreenRuntime.js | wiringAndApi (assembled per manifest.json; see COMPONENTS.md) ==
    function wireCleanupHandlers() {
      if (refs.cleanupBound || !win.addEventListener) {
        return;
      }
      refs.cleanupBound = true;
      win.addEventListener('mouseup', endDrag);
      win.addEventListener('blur', endDrag);
    }

    function wireDepthInputHandlers() {
      if (refs.inputHandlersBound || !win.addEventListener) {
        return;
      }
      refs.inputHandlersBound = true;
      win.addEventListener('wheel', handleWheelDuringDrag, { passive: false });
      const scene = getScene();
      if (scene) {
        scene.addEventListener('thumbstickmoved', handleThumbstickDuringDrag);
      }
      const controllerSelector = '#rightController, #leftController, [laser-controls], [tracked-controls], [oculus-touch-controls], [vive-controls], [windows-motion-controls], [generic-tracked-controller-controls]';
      refs.controllerTargets = Array.from(getDocument()?.querySelectorAll(controllerSelector) || []);
      refs.controllerTargets.forEach((controller) => {
        controller.addEventListener('thumbstickmoved', handleThumbstickDuringDrag);
      });
    }

    function wireControlHandlers() {
      refs.shareButton?.addEventListener('click', function () {
        void startCapture('screen');
      });
      refs.joinButton?.addEventListener('click', function () {
        // Joining is the only thing that clears the viewer's opt-out.
        joinBroadcast();
        showChrome();
      });
      refs.interactionPlane.addEventListener('click', function () {
        // Clicking shared content is never destructive: it only surfaces who
        // is sharing on this screen, for a moment.
        showSharingInfoOverlay();
      });
      refs.audioUnlockButton.addEventListener('click', function () {
        if (!state.stream || state.streamSourceType !== 'remote') {
          return;
        }
        state.audioUnlockRequired = false;
        syncRemoteAudioPlayback(state.stream);
        showChrome();
      });
      refs.headerButtons.lookAt.addEventListener('click', function () {
        toggleLookAtCamera();
      });
      refs.headerButtons.follow.addEventListener('click', function () {
        toggleFollow();
      });
      refs.legendToggle.addEventListener('click', function () {
        toggleLegend();
      });
      refs.headerButtons.minimize.addEventListener('click', function () {
        if (isMinimized()) {
          expand();
        } else {
          minimize();
        }
      });
      refs.headerButtons.stop.addEventListener('click', function () {
        stopCapture('Sharing stopped.', { minimizeAfterStop: true });
        showChrome();
      });
    }

    function wireDragHandlers() {
      Object.entries(refs.cornerHandles).forEach(([key, handle]) => {
        handle.addEventListener('mousedown', function (evt) {
          startDrag('resize', key, evt);
        });
        handle.addEventListener('mouseup', endDrag);
      });
      Object.entries(refs.edgeHandles).forEach(([key, handle]) => {
        handle.addEventListener('mousedown', function (evt) {
          startDrag('move', key, evt);
        });
        handle.addEventListener('mouseup', endDrag);
      });
      const scene = getScene();
      if (scene) {
        scene.addEventListener('mouseup', endDrag);
      }
    }

    function finishInitialization() {
      if (!isFixedContent(refs.config)) {
        // Fixed-content screens never stream: no hidden <video> element needed.
        ensureVideoSource();
      }
      getOrCreateClientId();
      state.screenWidth = refs.config.sizeSteps[clamp(refs.config.defaultSizeIndex || DEFAULT_CONFIG.defaultSizeIndex, 0, refs.config.sizeSteps.length - 1)];
      state.sizeIndex = findClosestSizeIndex(state.screenWidth);
      state.displayName = refs.config.displayName || state.displayName;
      createUi();
      setAnchoredTransform();
      if (refs.config.placeInFrontOfUserOnInit === true) {
        placeInFrontOfUser({
          publishState: false,
          publishTransform: false,
          updateStatus: false,
          showChrome: false,
        });
      }
      if (state.lookAtCameraEnabled) {
        applyFaceCameraOrientation();
      }
      layout();
      setMode('idle', refs.config.labels.idle);
      if (state.lookAtCameraEnabled) {
        ensureFaceCameraLoop();
      }
      if (refs.config.broadcastEnabled && canUseBroadcastTransport()) {
        connectSignaling();
      }
      state.initialized = true;
      getCollaborationClient()?.registerEntityRuntime?.({
        entityKind: 'screen',
        entityId: getScreenId(),
        applySharedState: applySharedScreenState,
        publishInitialSharedState: publishInitialSharedState,
        handleCollaborationMessage: handleCollaborationMessage,
      });
    }

    function init(userConfig) {
      refs.config = mergeConfig(userConfig || readConfigFromJsonScript(win) || win.__CODEXR_VIRTUAL_SCREEN_CONFIG__);
      refs.initialSharedStateDeferred = refs.config.deferInitialSharedState === true;
      refs.initialSharedStatePublished = false;
      if (!refs.config.enabled) {
        return api;
      }
      const scene = getScene();
      if (!scene || state.initialized) {
        return api;
      }
      const start = function () {
        finishInitialization();
      };
      if (scene.hasLoaded) {
        start();
      } else {
        scene.addEventListener('loaded', start, { once: true });
      }
      return api;
    }

    function autoInit() {
      init(readConfigFromJsonScript(win) || win.__CODEXR_VIRTUAL_SCREEN_CONFIG__);
    }

    function restoreState(snapshot) {
      if (!snapshot || typeof snapshot !== 'object') {
        return api;
      }
      if (typeof snapshot.screenWidth === 'number') {
        setScreenWidth(snapshot.screenWidth, { silent: true });
      }
      if (snapshot.presentationMode === 'minimized') {
        state.presentationMode = 'minimized';
      } else if (snapshot.presentationMode === 'expanded') {
        state.presentationMode = 'expanded';
      }
      if (typeof snapshot.lookAtCameraEnabled === 'boolean') {
        state.lookAtCameraEnabled = snapshot.lookAtCameraEnabled;
      }
      if (typeof snapshot.displayName === 'string' && snapshot.displayName.trim().length > 0) {
        state.displayName = snapshot.displayName.trim();
      }
      layout();
      refreshUi();
      return api;
    }

    function destroy() {
      refs.destroyed = true;
      if (!isRemoteScreen() && refs.config.managedScreen) {
        const managerCallbacks = getManagerCallbacks();
        if (managerCallbacks?.onRemoveEntity) {
          managerCallbacks.onRemoveEntity(getScreenId(), { runtime: api });
        } else {
          getCollaborationClient()?.removeEntity?.('screen', getScreenId());
        }
      }
      stopCapture('Virtual screen closed.', { minimizeAfterStop: false });
      closeAllPeerConnections();
      stopRelaySender();
      stopRelayReceiver();
      if (refs.infoOverlayTimer) {
        win.clearTimeout(refs.infoOverlayTimer);
        refs.infoOverlayTimer = null;
      }
      closeSignalingSocket();
      getCollaborationClient()?.unregisterEntityRuntime?.('screen', getScreenId());
      if (refs.root?.parentElement) {
        refs.root.parentElement.removeChild(refs.root);
      }
      refs.root = null;
      const video = refs.videoSource || getDocument()?.getElementById(getVideoElementId()) || null;
      if (video?.parentElement) {
        video.parentElement.removeChild(video);
      }
      refs.videoSource = null;
      const audio = refs.remoteAudioSource || getDocument()?.getElementById(getScopedId('codexrVirtualScreenRemoteAudio')) || null;
      if (audio?.parentElement) {
        audio.parentElement.removeChild(audio);
      }
      refs.remoteAudioSource = null;
    }

    const api = {
      init,
      autoInit,
      buildCaptureOptions,
      requestCapture,
      classifyCaptureError,
      startCapture,
      stopCapture,
      switchSource,
      joinBroadcast,
      minimize,
      expand,
      toggleLookAtCamera,
      toggleFollow,
      recenter,
      adjustSize,
      setScreenWidth,
      setDisplayName,
      placeInFrontOfUser,
      publishInitialSharedState,
      flushInitialSharedState,
      applySharedScreenState,
      handleCollaborationMessage,
      getSharedScreenState: buildSharedScreenState,
      setManagerCallbacks(callbacks) {
        refs.managerCallbacks = callbacks || null;
        return api;
      },
      isRemoteScreen,
      restoreState,
      destroy,
      getState() {
        return {
          mode: state.mode,
          presentationMode: state.presentationMode,
          lookAtCameraEnabled: state.lookAtCameraEnabled,
          follow: state.follow,
          chromeVisible: state.chromeVisible,
          sizeIndex: state.sizeIndex,
          screenWidth: state.screenWidth,
          currentSourceLabel: state.currentSourceLabel,
          displayName: getDisplayName(),
          screenId: getScreenId(),
          managed: !!refs.config.managedScreen,
          contentKind: refs.config.contentKind || 'broadcast',
          contentProviderId: refs.config.contentProviderId || '',
          collaborationSource: refs.config.collaborationSource || 'local',
          ownerPeerId: getOwnerPeerId() || null,
          broadcastRole: state.broadcastRole,
          broadcastStatus: state.broadcastStatus,
          hasAudio: state.hasAudio,
          viewerOptOut: state.viewerOptOut,
          audioUnlockRequired: state.audioUnlockRequired,
          gestureOwnerPeerId: state.gestureOwnerPeerId,
          activeBroadcasterId: refs.activeBroadcasterId || null,
          lastIntent: state.lastIntent,
          clientId: state.clientId,
          initialized: state.initialized,
          dragActive: !!state.drag,
            dragPointerType: state.drag?.pointerType || null,
            dragDepthOffset: state.drag?.currentDepthOffset || 0,
            dragTargetDepthOffset: state.drag?.targetDepthOffset || 0,
            legendCollapsed: state.legendCollapsed,
            legendSide: state.legendSide,
            followTrackingActive: state.follow && !!state.followTransform,
            faceCameraTrackingActive: !state.follow && !state.drag && state.faceCameraLoopActive,
            hasFollowTransform: !!state.followTransform,
          };
        },
    };

    api.DEFAULT_CONFIG = DEFAULT_CONFIG;
    api.mergeConfig = mergeConfig;
    api.createRuntime = createRuntime;
    api.registerContentProvider = registerContentProvider;
    api.getContentProvider = getContentProvider;
    api.reserveWellKnownScreenId = reserveWellKnownScreenId;
    api.getWellKnownScreenIds = getWellKnownScreenIds;
    api.getSharedRoomClient = function () {
      return getCollaborationClient();
    };
    return api;
  }

  const runtime = createRuntime(global);
  runtime.DEFAULT_CONFIG = DEFAULT_CONFIG;
  runtime.mergeConfig = mergeConfig;
  runtime.createRuntime = createRuntime;
  runtime.registerContentProvider = registerContentProvider;
  runtime.getContentProvider = getContentProvider;
  runtime.reserveWellKnownScreenId = reserveWellKnownScreenId;
  runtime.getWellKnownScreenIds = getWellKnownScreenIds;
  runtime.getSharedRoomClient = function () {
    return global.CodeXRCollaborationRuntime?.getClient?.(global) || null;
  };
  return runtime;
});





























