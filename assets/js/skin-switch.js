(function () {
  "use strict";

  var body = document.body;
  var toggle = document.querySelector("[data-skin-toggle]");
  var label = document.querySelector("[data-skin-label]");
  var paper = document.querySelector("[data-skin-paper]");
  var rolls = document.querySelectorAll(".skin-roll");
  var sharedContent = document.querySelector("[data-shared-content]");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var gsap = window.gsap;

  if (!toggle || !label || !paper || !sharedContent) return;

  var originalSignature = sharedContent.textContent.replace(/\s+/g, " ").trim();

  function animateSkin(skin) {
    if (!gsap || reduceMotion.matches) return;

    gsap.killTweensOf([paper, rolls]);

    if (skin === "scroll") {
      gsap.fromTo(
        paper,
        { autoAlpha: 0.72, scaleX: 0.96, transformOrigin: "center center" },
        {
          autoAlpha: 1,
          scaleX: 1,
          duration: 0.72,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform,transformOrigin"
        }
      );
      gsap.fromTo(
        rolls,
        { x: function (index) { return index === 0 ? 24 : -24; }, autoAlpha: 0.55 },
        {
          x: 0,
          autoAlpha: 1,
          duration: 0.72,
          ease: "power3.out",
          clearProps: "opacity,visibility,transform"
        }
      );
    } else {
      gsap.fromTo(
        paper,
        { autoAlpha: 0.75, y: 8 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          clearProps: "opacity,visibility,transform"
        }
      );
    }
  }

  function setSkin(skin, animate) {
    var next = skin === "scroll" ? "scroll" : "standard";
    body.dataset.skin = next;
    toggle.setAttribute("aria-pressed", String(next === "scroll"));
    toggle.setAttribute("aria-label", next === "scroll" ? "Return to standard view" : "Open archive view");
    label.textContent = next === "scroll" ? "Return to standard" : "Open archive";

    var url = new URL(window.location.href);
    if (next === "scroll") url.searchParams.set("skin", "scroll");
    else url.searchParams.delete("skin");
    window.history.replaceState({}, "", url);

    if (sharedContent.textContent.replace(/\s+/g, " ").trim() !== originalSignature) {
      console.error("Skin switch changed the shared content tree.");
    }

    if (animate) animateSkin(next);
    if (window.ScrollTrigger) {
      window.setTimeout(function () { window.ScrollTrigger.refresh(); }, animate ? 760 : 0);
    }
  }

  var requestedSkin = new URL(window.location.href).searchParams.get("skin");
  setSkin(requestedSkin === "scroll" ? "scroll" : "standard", false);

  toggle.addEventListener("click", function () {
    setSkin(body.dataset.skin === "scroll" ? "standard" : "scroll", true);
  });
})();
