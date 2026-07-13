(function () {
  "use strict";

  var body = document.body;
  var toggle = document.querySelector("[data-skin-toggle]");
  var label = document.querySelector("[data-skin-label]");
  var nav = document.querySelector(".nav");
  var footer = document.querySelector(".footer");
  var stage = document.querySelector("[data-skin-stage]");
  var paper = document.querySelector("[data-skin-paper]");
  var rolls = Array.prototype.slice.call(document.querySelectorAll(".skin-roll"));
  var sharedContent = document.querySelector("[data-shared-content]");
  var contentSections = paper ? Array.prototype.slice.call(paper.children) : [];
  var heading = document.getElementById("about-label");

  var entrance = document.querySelector("[data-archive-entrance]");
  var wash = document.querySelector("[data-archive-wash]");
  var skip = document.querySelector("[data-archive-skip]");
  var status = document.querySelector("[data-archive-status]");
  var caption = document.querySelector("[data-archive-caption]");
  var scene = entrance && entrance.querySelector(".archive-entrance__scene");
  var leftSword = document.querySelector('[data-archive-sword="left"]');
  var rightSword = document.querySelector('[data-archive-sword="right"]');
  var swords = [leftSword, rightSword].filter(Boolean);
  var glints = entrance ? Array.prototype.slice.call(entrance.querySelectorAll(".archive-sword__glint")) : [];
  var halo = document.querySelector("[data-archive-halo]");
  var dust = entrance ? Array.prototype.slice.call(entrance.querySelectorAll("[data-archive-dust] circle")) : [];

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var gsap = window.gsap;
  var activeTimeline = null;
  var activeMedia = null;
  var entranceActive = false;

  if (!toggle || !label || !stage || !paper || !sharedContent || !entrance) return;

  var originalSignature = sharedContent.textContent.replace(/\s+/g, " ").trim();

  function updateSkinState(skin) {
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
  }

  function refreshScrollTriggers(delay) {
    if (!window.ScrollTrigger) return;
    window.setTimeout(function () { window.ScrollTrigger.refresh(); }, delay || 0);
  }

  function focusBiography() {
    if (!heading) return;
    try {
      heading.focus({ preventScroll: true });
    } catch (error) {
      heading.focus();
    }
  }

  function setPageInert(inert) {
    [nav, stage, footer].filter(Boolean).forEach(function (element) {
      if (inert) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    });
  }

  function clearEntranceStyles() {
    if (!gsap) return;
    gsap.set([paper, scene, wash, caption, halo, entrance].filter(Boolean), {
      clearProps: "opacity,visibility,transform,clipPath,willChange"
    });
    gsap.set(rolls.concat(swords, glints, dust, contentSections), {
      clearProps: "opacity,visibility,transform,willChange"
    });
    swords.forEach(function (sword) {
      sword.removeAttribute("data-svg-origin");
      sword.removeAttribute("transform");
      sword.removeAttribute("style");
    });
  }

  function finishEntrance(options) {
    var opts = options || {};
    entranceActive = false;

    if (activeTimeline) {
      activeTimeline.eventCallback("onComplete", null);
      activeTimeline.kill();
      activeTimeline = null;
    }

    body.classList.remove("archive-pending", "archive-entering");
    setPageInert(false);

    if (activeMedia) {
      var mediaToRevert = activeMedia;
      activeMedia = null;
      mediaToRevert.revert();
    }

    clearEntranceStyles();
    entrance.setAttribute("aria-hidden", "true");
    if (status) status.textContent = "Archive opened.";

    refreshScrollTriggers(40);
    if (opts.focus !== false) focusBiography();
  }

  function rollStartOffsets() {
    var stageRect = stage.getBoundingClientRect();
    var center = stageRect.left + stageRect.width / 2;
    return rolls.map(function (roll) {
      var rect = roll.getBoundingClientRect();
      return center - (rect.left + rect.width / 2);
    });
  }

  function buildEntranceTimeline(isMobile) {
    if (!entranceActive || !gsap) return;

    var rollOffsets = isMobile ? [] : rollStartOffsets();
    var dustVectors = [
      [-86, -44], [-54, 28], [-22, -72], [22, 61],
      [55, -31], [88, 18], [-72, 6], [70, 52]
    ];

    gsap.set(entrance, { autoAlpha: 1 });
    gsap.set(wash, { autoAlpha: 0.72 });
    gsap.set(caption, { autoAlpha: 0, y: 7 });
    gsap.set(halo, { autoAlpha: 0, scale: 0.82, rotation: -12 });
    gsap.set(paper, { clipPath: "inset(0 49.4% round 9px)" });
    gsap.set(contentSections, { autoAlpha: 0, y: 14 });
    gsap.set(glints, { autoAlpha: 0 });
    gsap.set(dust, { autoAlpha: 0, scale: 0.2, x: 0, y: 0 });

    gsap.set(leftSword, {
      autoAlpha: 0,
      svgOrigin: "400 270",
      x: isMobile ? -112 : -178,
      y: isMobile ? -154 : -238,
      rotation: 12,
      scale: isMobile ? 0.76 : 1
    });
    gsap.set(rightSword, {
      autoAlpha: 0,
      svgOrigin: "400 270",
      x: isMobile ? 112 : 178,
      y: isMobile ? -154 : -238,
      rotation: -12,
      scale: isMobile ? 0.76 : 1
    });

    if (isMobile) {
      gsap.set(rolls, { autoAlpha: 0 });
    } else {
      gsap.set(rolls, {
        autoAlpha: 1,
        x: function (index) { return rollOffsets[index]; }
      });
    }

    activeTimeline = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: function () { finishEntrance({ focus: true }); }
    });

    activeTimeline
      .addLabel("veil", 0)
      .to(wash, { autoAlpha: 1, duration: 0.18, ease: "sine.out" }, "veil")
      .to(caption, { autoAlpha: 1, y: 0, duration: 0.3 }, "veil+=0.08")
      .to(halo, { autoAlpha: 0.62, scale: 1, rotation: 0, duration: 0.5, ease: "power2.out" }, "veil+=0.16")

      .addLabel("swordsIn", 0.18)
      .to(leftSword, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotation: 42,
        duration: 0.57,
        ease: "power4.in"
      }, "swordsIn")
      .to(rightSword, {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotation: -42,
        duration: 0.57,
        ease: "power4.in"
      }, "swordsIn")

      .addLabel("impact", 0.75)
      .to(scene, { x: 2, y: 1, duration: 0.045, repeat: 3, yoyo: true, ease: "none" }, "impact")
      .to(swords, { scale: isMobile ? 0.79 : 1.035, duration: 0.08, repeat: 1, yoyo: true }, "impact")
      .to(glints, { autoAlpha: 0.9, duration: 0.06, stagger: 0.025 }, "impact+=0.01")
      .to(glints, { autoAlpha: 0, duration: 0.18, stagger: 0.02 }, "impact+=0.09")
      .to(dust, { autoAlpha: 0.62, scale: 1, duration: 0.08, stagger: 0.012 }, "impact")
      .to(dust, {
        x: function (index) { return dustVectors[index][0] * (isMobile ? 0.68 : 1); },
        y: function (index) { return dustVectors[index][1] * (isMobile ? 0.68 : 1); },
        autoAlpha: 0,
        duration: 0.34,
        stagger: 0.012,
        ease: "power2.out"
      }, "impact+=0.07")
      .to(halo, { rotation: 18, scale: 1.07, autoAlpha: 0.28, duration: 0.27 }, "impact")

      .addLabel("release", 1.02)
      .to(leftSword, {
        x: isMobile ? -220 : -360,
        y: isMobile ? -28 : -52,
        rotation: 66,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.inOut"
      }, "release")
      .to(rightSword, {
        x: isMobile ? 220 : 360,
        y: isMobile ? -28 : -52,
        rotation: -66,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.inOut"
      }, "release")
      .to(paper, {
        clipPath: "inset(0 0% round 9px)",
        duration: 1.1,
        ease: "power3.inOut"
      }, "release+=0.06")
      .to(rolls, {
        x: 0,
        autoAlpha: isMobile ? 0 : 1,
        duration: 1.1,
        ease: "power3.inOut"
      }, "release+=0.06")
      .to(halo, { autoAlpha: 0, scale: 1.18, duration: 0.56 }, "release+=0.08")
      .to(wash, { autoAlpha: 0.12, duration: 1.08, ease: "power2.inOut" }, "release+=0.04")

      .addLabel("content", 1.72)
      .to(contentSections, {
        autoAlpha: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: "power2.out"
      }, "content")
      .to(caption, { autoAlpha: 0, y: -5, duration: 0.24 }, "content+=0.34")

      .addLabel("finish", 2.32)
      .to(entrance, { autoAlpha: 0, duration: 0.28, ease: "sine.inOut" }, "finish");
  }

  function enterArchive() {
    if (entranceActive) return;
    entranceActive = true;
    delete entrance.dataset.archiveError;
    updateSkinState("scroll");
    window.scrollTo(0, 0);
    body.classList.remove("archive-pending");
    body.classList.add("archive-entering");
    setPageInert(true);
    entrance.setAttribute("aria-hidden", "false");
    if (status) status.textContent = "Unsealing the archive.";
    if (skip) {
      try {
        skip.focus({ preventScroll: true });
      } catch (error) {
        skip.focus();
      }
    }

    if (!gsap) {
      finishEntrance({ focus: true });
      return;
    }

    try {
      activeMedia = gsap.matchMedia();
      activeMedia.add(
        {
          allViewports: "(min-width: 0px)",
          isMobile: "(max-width: 760px)",
          reduceMotion: "(prefers-reduced-motion: reduce)"
        },
        function (context) {
          if (context.conditions.reduceMotion) {
            finishEntrance({ focus: true });
            return undefined;
          }

          buildEntranceTimeline(context.conditions.isMobile);

          return function () {
            if (activeTimeline) {
              activeTimeline.kill();
              activeTimeline = null;
            }
          };
        }
      );
    } catch (error) {
      entrance.dataset.archiveError = error && error.message ? error.message : "Animation setup failed";
      console.error("Archive entrance animation failed.", error);
      finishEntrance({ focus: true });
    }
  }

  function leaveArchive() {
    finishEntrance({ focus: false });
    updateSkinState("standard");

    if (gsap && !reduceMotion.matches) {
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

    refreshScrollTriggers(520);
  }

  function skipEntrance() {
    if (!entranceActive) return;
    finishEntrance({ focus: true });
  }

  var requestedSkin = new URL(window.location.href).searchParams.get("skin");
  if (requestedSkin === "scroll") enterArchive();
  else {
    body.classList.remove("archive-pending", "archive-entering");
    updateSkinState("standard");
  }

  toggle.addEventListener("click", function () {
    if (body.dataset.skin === "scroll") leaveArchive();
    else enterArchive();
  });

  if (skip) skip.addEventListener("click", skipEntrance);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && entranceActive) skipEntrance();
  });

  window.addEventListener(
    "pagehide",
    function () {
      if (activeTimeline) activeTimeline.kill();
      if (activeMedia) activeMedia.revert();
    },
    { once: true }
  );
})();
