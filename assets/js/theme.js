/* theme.js — letterpress site theme toggle.
 * Loaded in <head> WITHOUT defer so the stored theme is applied
 * to <html> before first paint (no flash of wrong theme).
 * State: "light" | "dark", persisted to localStorage key "yy-theme", default "light".
 */
(function () {
  "use strict";

  var STORAGE_KEY = "yy-theme";
  var root = document.documentElement;

  function readStored() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === "light" || v === "dark" ? v : null;
    } catch (e) {
      return null;
    }
  }

  function store(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* ignore (private mode, etc.) */
    }
  }

  // Apply as early as possible (script is in <head>, before <body> paints).
  var current = readStored() || "light";
  apply(current);

  function apply(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    current = theme;
    // Button label shows the theme it will switch TO.
    var label = theme === "dark" ? "Light" : "Dark";
    var els = document.querySelectorAll("[data-theme-label]");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = label;
    }
  }

  function toggle() {
    var next = current === "dark" ? "light" : "dark";
    apply(next);
    store(next);
  }

  // Wire up the toggle button(s) once the DOM is ready.
  function wire() {
    apply(current); // ensure labels are set now that the button exists
    var btns = document.querySelectorAll("[data-theme-toggle]");
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", toggle);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }

  // Expose for potential reuse on other pages.
  window.yyTheme = { apply: apply, toggle: toggle, current: function () { return current; } };
})();
