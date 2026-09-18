/* t0-instrument.js — a small interactive for the home page.
 *
 * A network memorizing random labels follows a delayed sigmoid: chance for a
 * while, then a rapid climb to 100%. Pre-training on a *different* random
 * labeling moves that climb earlier. Past a short warm-up, one pre-training
 * epoch buys roughly one epoch of head start — the onset t0 falls with slope
 * about −1. This panel lets the reader move the pre-training slider and watch
 * both the curve and t0 respond.
 *
 * Vanilla JS + inline SVG. Colors come from CSS custom properties through class
 * names, so the drawing follows the light/dark theme. Interaction is entirely
 * user-driven: nothing animates on its own.
 */
(function () {
  "use strict";

  var root = document.querySelector("[data-t0-instrument]");
  if (!root) return;

  var svg = root.querySelector("svg");
  var slider = root.querySelector("[data-t0-slider]");
  var readout = root.querySelector("[data-t0-readout]");
  if (!svg || !slider) return;

  var NS = "http://www.w3.org/2000/svg";

  /* --- the toy model --- */
  var CHANCE = 0.1;   // 10 classes
  var T0 = 60;        // onset epoch when training from scratch
  var WIDTH = 6;      // sigmoid width, in epochs
  var WARMUP = 5;     // pre-training epochs before transfer kicks in
  var PMAX = 40;      // slider range
  var EPOCHS = 120;   // x-range of the accuracy pane

  function acc(t, t0) {
    return CHANCE + (1 - CHANCE) / (1 + Math.exp(-(t - t0) / WIDTH));
  }

  function onset(p) {
    return T0 - Math.max(0, p - WARMUP);
  }

  /* --- panes (viewBox 0 0 720 300) --- */
  var L = { x0: 50, x1: 392, y0: 244, y1: 30 };   // accuracy vs epoch
  var R = { x0: 472, x1: 702, y0: 244, y1: 30 };  // t0 vs pre-training epochs
  var T0_MIN = 18, T0_MAX = 68;

  function lx(t) { return L.x0 + (t / EPOCHS) * (L.x1 - L.x0); }
  function ly(a) { return L.y0 - a * (L.y0 - L.y1); }
  function rx(p) { return R.x0 + (p / PMAX) * (R.x1 - R.x0); }
  function ry(t) { return R.y0 - ((t - T0_MIN) / (T0_MAX - T0_MIN)) * (R.y0 - R.y1); }

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    (parent || svg).appendChild(node);
    return node;
  }

  function text(x, y, str, cls, anchor, parent) {
    var t = el("text", { x: x, y: y, "class": cls, "text-anchor": anchor || "start" }, parent);
    t.textContent = str;
    return t;
  }

  function fmt(n) { return n.toFixed(1); }

  function accuracyPath(t0) {
    var d = [];
    for (var t = 0; t <= EPOCHS; t += 1) {
      d.push((t ? "L" : "M") + fmt(lx(t)) + " " + fmt(ly(acc(t, t0))));
    }
    return d.join(" ");
  }

  function onsetPath() {
    return "M" + fmt(rx(0)) + " " + fmt(ry(onset(0))) +
           " L" + fmt(rx(WARMUP)) + " " + fmt(ry(onset(WARMUP))) +
           " L" + fmt(rx(PMAX)) + " " + fmt(ry(onset(PMAX)));
  }

  /* --- static drawing --- */
  var axes = el("g", { "class": "instrument__axes" });
  var curves = el("g", { "class": "instrument__curves" });
  var marks = el("g", { "class": "instrument__marks" });

  // Left pane: axes, chance line, ticks
  el("path", { "class": "instrument__axis", d: "M" + L.x0 + " " + L.y1 + " V" + L.y0 + " H" + L.x1 }, axes);
  el("path", { "class": "instrument__grid", d: "M" + L.x0 + " " + fmt(ly(CHANCE)) + " H" + L.x1 }, axes);
  el("path", { "class": "instrument__grid", d: "M" + L.x0 + " " + fmt(ly(1)) + " H" + L.x1 }, axes);
  text(L.x0 - 6, ly(CHANCE) + 4, "chance", "instrument__label", "end", axes);
  text(L.x0 - 6, ly(1) + 4, "100%", "instrument__label", "end", axes);
  [0, 40, 80, 120].forEach(function (t) {
    el("path", { "class": "instrument__axis", d: "M" + fmt(lx(t)) + " " + L.y0 + " v4" }, axes);
    text(lx(t), L.y0 + 18, String(t), "instrument__label", "middle", axes);
  });
  text((L.x0 + L.x1) / 2, L.y0 + 36, "training epoch", "instrument__label", "middle", axes);
  text(L.x0 + 8, L.y1 + 4, "train accuracy", "instrument__label", "start", axes);

  // Right pane: axes, ticks, ghost slope −1 line, onset curve
  el("path", { "class": "instrument__axis", d: "M" + R.x0 + " " + R.y1 + " V" + R.y0 + " H" + R.x1 }, axes);
  [0, 10, 20, 30, 40].forEach(function (p) {
    el("path", { "class": "instrument__axis", d: "M" + fmt(rx(p)) + " " + R.y0 + " v4" }, axes);
    text(rx(p), R.y0 + 18, String(p), "instrument__label", "middle", axes);
  });
  [20, 40, 60].forEach(function (t) {
    el("path", { "class": "instrument__grid", d: "M" + R.x0 + " " + fmt(ry(t)) + " H" + R.x1 }, axes);
    text(R.x0 - 6, ry(t) + 4, String(t), "instrument__label", "end", axes);
  });
  text((R.x0 + R.x1) / 2, R.y0 + 36, "pre-training epochs", "instrument__label", "middle", axes);
  text(R.x0 + 8, R.y1 + 4, "onset t₀", "instrument__label", "start", axes);

  // Ghost reference: slope −1 through the end of the warm-up.
  el("path", {
    "class": "instrument__ghost",
    d: "M" + fmt(rx(0)) + " " + fmt(ry(T0 + WARMUP)) + " L" + fmt(rx(PMAX)) + " " + fmt(ry(T0 + WARMUP - PMAX))
  }, curves);
  text(rx(PMAX) - 4, ry(T0 + WARMUP - PMAX) - 8, "slope −1", "instrument__mark instrument__mark--muted", "end", curves);

  el("path", { "class": "instrument__curve instrument__curve--base", d: onsetPath() }, curves);

  // Left pane curves: from scratch (fixed), fully pre-trained reference, active.
  el("path", { "class": "instrument__curve instrument__curve--base", d: accuracyPath(T0) }, curves);
  text(lx(T0) + 10, ly(0.3), "from scratch", "instrument__mark instrument__mark--muted", "start", curves);
  el("path", { "class": "instrument__curve instrument__curve--ref", d: accuracyPath(onset(PMAX)) }, curves);
  var active = el("path", { "class": "instrument__curve instrument__curve--active", d: accuracyPath(T0) }, curves);

  // Marks: t0 dots + labels
  var dotL = el("circle", { "class": "instrument__dot", r: 4 }, marks);
  var labelL = text(0, 0, "t₀", "instrument__mark", "start", marks);
  var dotR = el("circle", { "class": "instrument__dot", r: 4 }, marks);
  var labelR = text(0, 0, "", "instrument__mark", "start", marks);

  /* --- update --- */
  function update() {
    var p = Number(slider.value) || 0;
    var t0 = onset(p);

    active.setAttribute("d", accuracyPath(t0));

    var xL = lx(t0), yL = ly(acc(t0, t0));
    dotL.setAttribute("cx", fmt(xL));
    dotL.setAttribute("cy", fmt(yL));
    labelL.setAttribute("x", fmt(xL - 10));
    labelL.setAttribute("y", fmt(yL - 10));
    labelL.setAttribute("text-anchor", "end");

    var xR = rx(p), yR = ry(t0);
    dotR.setAttribute("cx", fmt(xR));
    dotR.setAttribute("cy", fmt(yR));
    // Label sits below-right of the dot; past the warm-up plateau it climbs
    // above-right so it never crosses the falling curve or the right edge.
    var flip = p > PMAX * 0.7;
    labelR.setAttribute("x", fmt(flip ? xR - 10 : xR + 10));
    labelR.setAttribute("y", fmt(p > WARMUP ? yR - 8 : yR + 18));
    labelR.setAttribute("text-anchor", flip ? "end" : "start");
    labelR.textContent = "t₀ = " + t0;

    if (readout) {
      readout.textContent = p + (p === 1 ? " epoch" : " epochs") + " · t₀ = " + t0;
    }
  }

  slider.addEventListener("input", update);
  slider.addEventListener("change", update);
  update();
})();
