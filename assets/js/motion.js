/* motion.js — GSAP enhancement for the home page.
 * The Adventure Log loops only while visible, pauses for interaction, and
 * remains fully static when reduced motion is requested.
 */
(function () {
  "use strict";

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);

  var media = gsap.matchMedia();

  var viewport = document.querySelector("[data-adventure-log]");
  var track = viewport && viewport.querySelector("[data-log-track]");
  var list = viewport && viewport.querySelector("[data-log-list]");

  if (viewport && track && list) {
    media.add("(prefers-reduced-motion: no-preference)", function () {
      var clone = list.cloneNode(true);
      clone.removeAttribute("data-log-list");
      clone.setAttribute("aria-hidden", "true");
      clone.classList.add("log--clone");
      track.appendChild(clone);

      var tween;
      var inView = false;
      var held = false;
      var resizeCall;

      function syncPlayback() {
        if (!tween) return;
        if (inView && !held && !document.hidden) tween.play();
        else tween.pause();
      }

      function buildTween() {
        var cycleProgress = tween ? tween.progress() : 0;
        if (tween) tween.kill();

        gsap.set(track, { y: 0 });
        var distance = list.offsetHeight;
        tween = gsap.to(track, {
          y: -distance,
          duration: Math.max(15, distance / 18),
          ease: "none",
          repeat: -1,
          paused: true
        });
        tween.progress(cycleProgress);
        syncPlayback();
      }

      function hold() {
        held = true;
        syncPlayback();
      }

      function release(event) {
        if (event && event.type === "focusout" && viewport.contains(event.relatedTarget)) return;
        held = false;
        syncPlayback();
      }

      function scheduleRebuild() {
        if (resizeCall) resizeCall.kill();
        resizeCall = gsap.delayedCall(0.18, function () {
          buildTween();
          ScrollTrigger.refresh();
        });
      }

      buildTween();

      var trigger = ScrollTrigger.create({
        trigger: viewport,
        start: "top bottom",
        end: "bottom top",
        onToggle: function (self) {
          inView = self.isActive;
          syncPlayback();
        }
      });

      inView = trigger.isActive;
      syncPlayback();

      viewport.addEventListener("pointerenter", hold);
      viewport.addEventListener("pointerleave", release);
      viewport.addEventListener("focusin", hold);
      viewport.addEventListener("focusout", release);
      window.addEventListener("resize", scheduleRebuild);
      document.addEventListener("visibilitychange", syncPlayback);

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(scheduleRebuild);
      }

      return function () {
        viewport.removeEventListener("pointerenter", hold);
        viewport.removeEventListener("pointerleave", release);
        viewport.removeEventListener("focusin", hold);
        viewport.removeEventListener("focusout", release);
        window.removeEventListener("resize", scheduleRebuild);
        document.removeEventListener("visibilitychange", syncPlayback);
        if (resizeCall) resizeCall.kill();
        trigger.kill();
        if (tween) tween.kill();
        gsap.set(track, { clearProps: "transform" });
        clone.remove();
      };
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }

  window.addEventListener(
    "pagehide",
    function () {
      media.revert();
    },
    { once: true }
  );
})();
