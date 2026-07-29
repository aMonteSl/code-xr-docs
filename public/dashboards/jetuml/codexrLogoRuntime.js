// == codexrLogoRuntime.js | logoContours (assembled per manifest.json; see COMPONENTS.md) ==
(function registerCodeXRLogoRuntime(root) {
  'use strict';

  // Flattened outlines of the CodeXR mark, generated from resources/icon.svg
  // (640x640 viewBox, three absolute M/C/L/Z paths): the goggles
  // frame, the X and the R — the three pieces the assembly animation moves.
  //
  // Each contour is a FLAT coordinate list, [x0, y0, x1, y1, ...], implicitly
  // closed. Coordinates are already in three.js space: Y up, the whole mark
  // centred on the origin and normalized to width 1, so the component scales
  // it with a single `width` factor. `holes` are the counters (the visor
  // window, the strap tab and the bowl of the R), nested under the contour
  // that contains them.
  //
  // Regenerate rather than hand-edit: AFRAME.THREE ships no SVGLoader, so the
  // conversion is an offline step whose output lives here as data.
  var LOGO_CONTOURS = {
    frame: {
      outline: [-0.0573,0.3087, -0.2303,0.3016, -0.2783,0.2963, -0.3118,0.2885, -0.3361,0.2769, -0.3561,0.2604, -0.3737,0.2365, -0.3843,0.2111, -0.415,0.2054, -0.442,0.1951, -0.4624,0.1823, -0.4795,0.1644, -0.4935,0.14, -0.4995,0.1162, -0.5,-0.1262, -0.4958,-0.1503, -0.4875,-0.1736, -0.4744,-0.1973, -0.4594,-0.2164, -0.437,-0.2363, -0.4114,-0.2536, -0.3826,-0.2682, -0.354,-0.2789, -0.3166,-0.2893, -0.2734,-0.2979, -0.2147,-0.3062, -0.1757,-0.3091, -0.1398,-0.3069, -0.114,-0.2985, -0.0984,-0.2889, -0.056,-0.2492, -0.0341,-0.2385, -0.0153,-0.2339, 0.0148,-0.2336, 0.0369,-0.239, 0.0629,-0.2538, 0.0933,-0.2846, 0.1125,-0.298, 0.1378,-0.3066, 0.1696,-0.3092, 0.2078,-0.3069, 0.257,-0.3007, 0.2972,-0.2936, 0.3379,-0.2838, 0.3694,-0.2737, 0.3961,-0.2624, 0.4194,-0.2489, 0.4415,-0.2327, 0.4641,-0.2108, 0.4812,-0.1868, 0.493,-0.1605, 0.4995,-0.1317, 0.5,0.1215, 0.4908,0.1466, 0.4774,0.1681, 0.4597,0.1843, 0.437,0.1978, 0.4178,0.2047, 0.3848,0.2114, 0.3714,0.2403, 0.3545,0.2618, 0.3316,0.2798, 0.3066,0.2903, 0.2684,0.298, 0.2147,0.3031, 0.1001,0.3078, -0.0059,0.3092],
      holes: [
        [-0.1194,0.2544, -0.1184,0.2265, -0.1145,0.2103, -0.103,0.1949, -0.0865,0.1843, -0.0637,0.1795, 0.0538,0.1792, 0.0719,0.1801, 0.0865,0.1843, 0.099,0.1917, 0.1097,0.2029, 0.1151,0.2128, 0.1181,0.2238, 0.1186,0.2736, 0.222,0.269, 0.2807,0.2629, 0.3094,0.2546, 0.331,0.2398, 0.3442,0.2218, 0.3564,0.189, 0.3603,0.1843, 0.4134,0.1721, 0.429,0.1656, 0.4419,0.1573, 0.4577,0.14, 0.4679,0.115, 0.4668,-0.1317, 0.4582,-0.1606, 0.4426,-0.1869, 0.4271,-0.2036, 0.4054,-0.22, 0.3789,-0.2343, 0.3472,-0.2465, 0.312,-0.2563, 0.2669,-0.2654, 0.2152,-0.2728, 0.1678,-0.2771, 0.1479,-0.2755, 0.1266,-0.2688, 0.1141,-0.2596, 0.0877,-0.2318, 0.072,-0.22, 0.0461,-0.2079, 0.0181,-0.2014, -0.0188,-0.2016, -0.0543,-0.2112, -0.0789,-0.2253, -0.1259,-0.268, -0.1421,-0.2742, -0.1638,-0.277, -0.2453,-0.2688, -0.3208,-0.2538, -0.3522,-0.2444, -0.3794,-0.2336, -0.4026,-0.2214, -0.4221,-0.2076, -0.438,-0.1923, -0.4525,-0.1717, -0.463,-0.1472, -0.4669,-0.1259, -0.4687,-0.0643, -0.4676,0.1034, -0.4649,0.1225, -0.4567,0.1412, -0.4431,0.1565, -0.4226,0.1686, -0.4027,0.1754, -0.3616,0.1836, -0.3563,0.1906, -0.3475,0.2162, -0.3371,0.233, -0.3235,0.246, -0.3049,0.2566, -0.2805,0.2627, -0.2457,0.267, -0.1193,0.273],
        [0.0856,0.2494, 0.0838,0.2223, 0.0759,0.2142, 0.0708,0.2127, -0.0691,0.2121, -0.0759,0.214, -0.0832,0.221, -0.0857,0.2272, -0.0862,0.2749, 0.086,0.2749]
      ]
    },
    x: {
      outline: [-0.286,0.1447, -0.1876,-0.0084, -0.2861,-0.1538, -0.2937,-0.1685, -0.2172,-0.1707, -0.1468,-0.0645, -0.0801,-0.17, -0.0136,-0.1704, 0.0009,-0.1689, 0.001,-0.1651, -0.0066,-0.1525, -0.1015,-0.0085, -0.0919,0.0094, -0.0042,0.1451, -0.0774,0.1459, -0.1428,0.0449, -0.2052,0.1459, -0.2717,0.1463, -0.2859,0.1448],
      holes: []
    },
    r: {
      outline: [0.0302,0.1446, 0.0295,-0.1017, 0.0311,-0.1691, 0.0994,-0.17, 0.1,-0.0512, 0.1371,-0.0512, 0.2101,-0.17, 0.2885,-0.1691, 0.2777,-0.1487, 0.2081,-0.0439, 0.2305,-0.0338, 0.2477,-0.0205, 0.262,-0.0012, 0.2704,0.0196, 0.2744,0.0463, 0.2728,0.0728, 0.2661,0.0928, 0.253,0.1129, 0.2415,0.1246, 0.2294,0.1328, 0.2131,0.1395, 0.1966,0.1435, 0.1229,0.146, 0.0458,0.1463, 0.0302,0.1447],
      holes: [
        [0.1773,0.0861, 0.1866,0.082, 0.1941,0.0758, 0.1997,0.0678, 0.2031,0.0583, 0.2043,0.0464, 0.203,0.0354, 0.1993,0.0256, 0.1932,0.0174, 0.183,0.0097, 0.1708,0.0054, 0.1,0.0038, 0.1,0.0887, 0.1606,0.0885, 0.1769,0.0863]
      ]
    }
  };

  var LOGO_PIECE_ORDER = ['frame', 'x', 'r'];

// == codexrLogoRuntime.js | codexrLogo (assembled per manifest.json; see COMPONENTS.md) ==
//
// The CodeXR mark, extruded in 3D, floating over the analysis table while the
// table is EMPTY — the `selection` mode the scene sits in between analyses
// (and during the transit hop while a heavy analysis is being prepared).
//
// It is decoration, and behaves like it: it carries no raycaster class so it
// can never swallow a click meant for the table, it lives outside
// #codexrAnalysisSurface so the selection sweep does not own it, and it goes
// completely still when the render budget says the frame rate (or the user's
// reduced-motion preference) cannot afford motion.

  var COMPONENT_NAME = 'codexr-logo';
  var TABLE_COMPONENT_NAME = 'codexr-analysis-table';
  var ANIMATION_PREFIX = 'animation__codexr_logo_';
  // Per-frame delta guard: a backgrounded tab resumes with a huge delta, and
  // an unclamped one would teleport the spin.
  var MAX_FRAME_DELTA_MS = 50;

  function getThree(root) {
    return (root.AFRAME && root.AFRAME.THREE) || root.THREE || null;
  }

  // Contours are flat [x0, y0, x1, y1, ...] lists normalized to width 1.
  function traceContour(target, contour, scale) {
    target.moveTo(contour[0] * scale, contour[1] * scale);
    for (var i = 2; i < contour.length; i += 2) {
      target.lineTo(contour[i] * scale, contour[i + 1] * scale);
    }
    target.closePath();
  }

  function buildShape(THREE, piece, scale) {
    var shape = new THREE.Shape();
    traceContour(shape, piece.outline, scale);
    (piece.holes || []).forEach(function (hole) {
      var path = new THREE.Path();
      traceContour(path, hole, scale);
      shape.holes.push(path);
    });
    return shape;
  }

  function buildPieceGeometry(THREE, piece, scale, thickness) {
    var geometry = new THREE.ExtrudeGeometry(buildShape(THREE, piece, scale), {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: thickness * 0.18,
      bevelSize: thickness * 0.12,
      bevelOffset: 0,
      bevelSegments: 2
    });
    // Extrude grows along +Z from the plane: recentre so the mark's own plane
    // stays at the entity origin and the assembly animation reads symmetric.
    geometry.translate(0, 0, -thickness / 2);
    return geometry;
  }

  function buildMaterials(THREE, data) {
    // ExtrudeGeometry emits two material groups: 0 = the caps, 1 = the walls
    // and bevel. That split is exactly the finish we want — graphite body,
    // brand-cyan edge catching the light.
    return [
      new THREE.MeshStandardMaterial({
        color: data.bodyColor,
        roughness: 0.45,
        metalness: 0.15
      }),
      new THREE.MeshStandardMaterial({
        color: data.accentColor,
        emissive: data.accentColor,
        emissiveIntensity: 0.6,
        roughness: 0.35,
        metalness: 0.1
      })
    ];
  }

  function registerComponent(AFRAME, root) {
    if (!AFRAME || AFRAME.components[COMPONENT_NAME]) {
      return;
    }

    AFRAME.registerComponent(COMPONENT_NAME, {
      schema: {
        // Same anchor the analysis table uses, so the mark tracks the table
        // instead of being positioned against the room.
        anchorX: { type: 'number', default: 0 },
        anchorY: { type: 'number', default: 1.58 },
        anchorZ: { type: 'number', default: -18 },
        width: { type: 'number', default: 1.8 },
        thickness: { type: 'number', default: 0.045 },
        bodyColor: { type: 'color', default: '#0b1220' },
        accentColor: { type: 'color', default: '#22d3ee' },
        // The table mode that means "no analysis loaded".
        activeMode: { type: 'string', default: 'selection' },
        tableSelector: { type: 'string', default: '#codexrAnalysisTable' },
        spinSpeed: { type: 'number', default: 0.18 },
        floatAmplitude: { type: 'number', default: 0.02 },
        floatSpeed: { type: 'number', default: 0.9 },
        assembleMs: { type: 'number', default: 280 }
      },

      init: function () {
        this.pieces = [];
        this.active = false;
        this.motionEnabled = true;
        this.elapsed = 0;
        this.hideTimer = null;
        this.tableEl = null;
        this.unsubscribeBudget = null;
        this.onTableComponentChanged = this.handleTableComponentChanged.bind(this);

        this.buildPieces();
        this.applyAnchor();
        this.el.setAttribute('visible', false);
        this.bindRenderBudget();
        this.bindTable();
        this.setActive(this.readTableMode() === this.data.activeMode, true);
      },

      update: function (oldData) {
        if (!oldData || !Object.keys(oldData).length) {
          return;
        }
        var rebuildKeys = ['width', 'thickness', 'bodyColor', 'accentColor'];
        var self = this;
        var needsRebuild = rebuildKeys.some(function (key) {
          return oldData[key] !== self.data[key];
        });
        if (needsRebuild) {
          this.disposePieces();
          this.buildPieces();
        }
        this.applyAnchor();
      },

      buildPieces: function () {
        var THREE = getThree(root);
        if (!THREE || !THREE.ExtrudeGeometry) {
          console.warn('[CodeXR][Logo] three.js is unavailable; the brand logo stays hidden.');
          return;
        }
        var data = this.data;
        var self = this;
        LOGO_PIECE_ORDER.forEach(function (name) {
          var contours = LOGO_CONTOURS[name];
          if (!contours) {
            return;
          }
          var geometry = buildPieceGeometry(THREE, contours, data.width, data.thickness);
          var materials = buildMaterials(THREE, data);
          var mesh = new THREE.Mesh(geometry, materials);
          var pieceEl = document.createElement('a-entity');
          pieceEl.setAttribute('data-codexr-logo-piece', name);
          self.el.appendChild(pieceEl);
          // setObject3D has to wait for A-Frame to give the entity its own
          // object3D; appendChild does that synchronously for a loaded scene,
          // but not while the scene is still initializing.
          if (pieceEl.hasLoaded) {
            pieceEl.setObject3D('mesh', mesh);
          } else {
            pieceEl.addEventListener('loaded', function () {
              pieceEl.setObject3D('mesh', mesh);
            }, { once: true });
          }
          self.pieces.push({ name: name, el: pieceEl, mesh: mesh });
        });
      },

      applyAnchor: function () {
        this.el.object3D.position.set(this.data.anchorX, this.data.anchorY, this.data.anchorZ);
      },

      getPiece: function (name) {
        for (var i = 0; i < this.pieces.length; i += 1) {
          if (this.pieces[i].name === name) {
            return this.pieces[i];
          }
        }
        return null;
      },

      // ── Table mode ──────────────────────────────────────────────────────
      // The table runtime writes its mode onto the table entity, and only on a
      // real change (analysisTableRuntime setMode), so A-Frame's own
      // componentchanged event is a precise, poll-free trigger.

      bindTable: function () {
        var table = document.querySelector(this.data.tableSelector);
        if (!table) {
          // The table entity is declared before this one, but a scene still
          // loading can hand us nothing: retry once the scene is up.
          var scene = this.el.sceneEl;
          var self = this;
          if (scene && !scene.hasLoaded) {
            scene.addEventListener('loaded', function () {
              self.bindTable();
              self.setActive(self.readTableMode() === self.data.activeMode, true);
            }, { once: true });
          }
          return;
        }
        this.tableEl = table;
        table.addEventListener('componentchanged', this.onTableComponentChanged);
      },

      handleTableComponentChanged: function (event) {
        if (!event || !event.detail || event.detail.name !== TABLE_COMPONENT_NAME) {
          return;
        }
        this.setActive(this.readTableMode() === this.data.activeMode, false);
      },

      readTableMode: function () {
        var table = this.tableEl || document.querySelector(this.data.tableSelector);
        if (!table || typeof table.getAttribute !== 'function') {
          return '';
        }
        var value = table.getAttribute(TABLE_COMPONENT_NAME);
        if (value && typeof value === 'object') {
          return String(value.mode || '');
        }
        // Before the table component initializes, the attribute is still the
        // raw declaration string.
        var match = /(?:^|;)\s*mode\s*:\s*([\w-]+)/.exec(String(value || ''));
        return match ? match[1] : '';
      },

      // ── Show / hide ─────────────────────────────────────────────────────

      setActive: function (active, immediate) {
        var next = !!active;
        if (next === this.active && !immediate) {
          return next;
        }
        this.active = next;
        this.clearHideTimer();
        this.clearAnimations();

        if (next) {
          this.el.setAttribute('visible', true);
          this.elapsed = 0;
          this.el.object3D.rotation.set(0, 0, 0);
          this.applyAnchor();
          this.assemble(immediate === true);
        } else if (immediate === true || !this.motionEnabled) {
          this.el.setAttribute('visible', false);
        } else {
          this.disassemble();
        }
        return next;
      },

      // Entry: the frame pops in and the letters slide into the visor from
      // either side. With motion disabled everything simply lands in place.
      assemble: function (immediate) {
        var frame = this.getPiece('frame');
        var offset = this.data.width * 0.9;

        this.setPiecePosition('x', 0, 0, 0);
        this.setPiecePosition('r', 0, 0, 0);
        if (frame) {
          frame.el.object3D.scale.set(1, 1, 1);
        }
        if (immediate || !this.motionEnabled) {
          return;
        }

        if (frame) {
          frame.el.object3D.scale.set(0.82, 0.82, 0.82);
          frame.el.setAttribute(ANIMATION_PREFIX + 'frame', {
            property: 'scale',
            from: '0.82 0.82 0.82',
            to: '1 1 1',
            dur: Math.round(this.data.assembleMs * 0.93),
            easing: 'easeOutCubic'
          });
        }
        this.animatePiece('x', -offset, 60);
        this.animatePiece('r', offset, 150);
      },

      // Exit: the same gesture, reversed, then the entity goes away.
      disassemble: function () {
        var frame = this.getPiece('frame');
        var offset = this.data.width * 0.9;
        var duration = Math.round(this.data.assembleMs * 0.75);
        var self = this;

        if (frame) {
          frame.el.setAttribute(ANIMATION_PREFIX + 'frame', {
            property: 'scale',
            from: '1 1 1',
            to: '0.82 0.82 0.82',
            dur: duration,
            easing: 'easeInCubic'
          });
        }
        this.animatePieceOut('x', -offset, duration);
        this.animatePieceOut('r', offset, duration);

        this.hideTimer = setTimeout(function () {
          self.hideTimer = null;
          self.el.setAttribute('visible', false);
          self.clearAnimations();
          // Park the pieces back at rest: a hidden object3D still reports its
          // bounds, and leaving the letters flung apart made the logo measure
          // three times its real width.
          self.setPiecePosition('x', 0, 0, 0);
          self.setPiecePosition('r', 0, 0, 0);
          var frameAtRest = self.getPiece('frame');
          if (frameAtRest) {
            frameAtRest.el.object3D.scale.set(1, 1, 1);
          }
        }, duration + 40);
      },

      animatePiece: function (name, fromX, delay) {
        var piece = this.getPiece(name);
        if (!piece) {
          return;
        }
        piece.el.object3D.position.set(fromX, 0, 0);
        piece.el.setAttribute(ANIMATION_PREFIX + name, {
          property: 'position',
          from: fromX + ' 0 0',
          to: '0 0 0',
          dur: this.data.assembleMs,
          delay: delay,
          easing: 'easeOutBack'
        });
      },

      animatePieceOut: function (name, toX, duration) {
        var piece = this.getPiece(name);
        if (!piece) {
          return;
        }
        piece.el.setAttribute(ANIMATION_PREFIX + name, {
          property: 'position',
          from: '0 0 0',
          to: toX + ' 0 0',
          dur: duration,
          easing: 'easeInCubic'
        });
      },

      setPiecePosition: function (name, x, y, z) {
        var piece = this.getPiece(name);
        if (piece) {
          piece.el.object3D.position.set(x, y, z);
        }
      },

      // ── Idle motion ─────────────────────────────────────────────────────

      tick: function (time, timeDelta) {
        if (!this.active || !this.motionEnabled) {
          return;
        }
        var delta = Math.min(MAX_FRAME_DELTA_MS, Math.max(0, timeDelta || 0)) / 1000;
        if (!delta) {
          return;
        }
        this.elapsed += delta;
        var object3D = this.el.object3D;
        object3D.rotation.y += this.data.spinSpeed * delta;
        object3D.position.y = this.data.anchorY
          + (Math.sin(this.elapsed * this.data.floatSpeed) * this.data.floatAmplitude);
      },

      bindRenderBudget: function () {
        var budget = root.CodeXRRenderBudgetRuntime;
        if (!budget || typeof budget.subscribe !== 'function') {
          return;
        }
        var self = this;
        // 'static' is both the low-frame-rate verdict and how the render
        // budget reports prefers-reduced-motion. Either way: no motion.
        this.unsubscribeBudget = budget.subscribe(function (snapshot) {
          var enabled = !snapshot || snapshot.quality !== 'static';
          if (enabled === self.motionEnabled) {
            return;
          }
          self.motionEnabled = enabled;
          if (!enabled && self.active) {
            self.clearAnimations();
            self.assemble(true);
            self.el.object3D.rotation.set(0, 0, 0);
            self.applyAnchor();
          }
        });
      },

      // ── Teardown ────────────────────────────────────────────────────────

      clearHideTimer: function () {
        if (this.hideTimer) {
          clearTimeout(this.hideTimer);
          this.hideTimer = null;
        }
      },

      clearAnimations: function () {
        this.pieces.forEach(function (piece) {
          if (piece.el && piece.el.removeAttribute) {
            piece.el.removeAttribute(ANIMATION_PREFIX + piece.name);
          }
        });
      },

      disposePieces: function () {
        this.clearAnimations();
        this.pieces.forEach(function (piece) {
          if (piece.el && piece.el.removeObject3D) {
            piece.el.removeObject3D('mesh');
          }
          if (piece.mesh) {
            if (piece.mesh.geometry) {
              piece.mesh.geometry.dispose();
            }
            var materials = Array.isArray(piece.mesh.material)
              ? piece.mesh.material
              : [piece.mesh.material];
            materials.forEach(function (material) {
              if (material && material.dispose) {
                material.dispose();
              }
            });
          }
          if (piece.el && piece.el.parentNode) {
            piece.el.parentNode.removeChild(piece.el);
          }
        });
        this.pieces = [];
      },

      remove: function () {
        this.clearHideTimer();
        if (this.tableEl && this.tableEl.removeEventListener) {
          this.tableEl.removeEventListener('componentchanged', this.onTableComponentChanged);
        }
        if (typeof this.unsubscribeBudget === 'function') {
          this.unsubscribeBudget();
          this.unsubscribeBudget = null;
        }
        this.disposePieces();
      }
    });
  }

  if (root.AFRAME) {
    registerComponent(root.AFRAME, root);
  } else if (root.addEventListener) {
    root.addEventListener('load', function () {
      registerComponent(root.AFRAME, root);
    });
  }

  // Test surface: the contour data and the pure geometry helpers, so the
  // shapes can be checked without a browser.
  root.CodeXRLogoRuntime = {
    __testing: {
      LOGO_CONTOURS: LOGO_CONTOURS,
      LOGO_PIECE_ORDER: LOGO_PIECE_ORDER,
      COMPONENT_NAME: COMPONENT_NAME,
      buildShape: buildShape,
      registerComponent: registerComponent
    }
  };
})(typeof window !== 'undefined' ? window : this);
