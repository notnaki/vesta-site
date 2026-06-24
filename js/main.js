/* Halo site — one orchestrated hero moment + reduced-motion safety. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. The redacting headline ----
     Each letter of HALO carries a font-family that swaps between Redaction
     grades. At rest the word is crisp ("Redaction"); as you scroll past the
     hero (or hover a letter) it visibly degrades toward grade 100 — the font
     literally falls apart, a nod to the bundled degraded serif. */
  var GRADES = ["Redaction", "Redaction 70", "Redaction 50",
                "Redaction 35", "Redaction 20", "Redaction 10", "Redaction 100"];
  var word = document.querySelector("[data-redact]");
  if (word) {
    var text = word.textContent.trim();
    word.textContent = "";
    var glyphs = [];
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement("span");
      s.className = "gl";
      s.textContent = text[i];
      s.style.fontFamily = '"Redaction"';
      // hover degrades that single glyph fully, then heals
      (function (el) {
        el.addEventListener("pointerenter", function () {
          el.style.fontFamily = '"Redaction 100"';
        });
        el.addEventListener("pointerleave", function () { applyScroll(); });
      })(s);
      word.appendChild(s);
      glyphs.push(s);
    }

    function gradeFor(t) {
      // t: 0 (crisp) -> 1 (max degrade); map onto the grade ramp
      var idx = Math.min(GRADES.length - 1, Math.floor(t * GRADES.length));
      return '"' + GRADES[idx] + '"';
    }

    function applyScroll() {
      var rect = word.getBoundingClientRect();
      // progress: 0 while in view at top, grows as the hero scrolls away
      var p = Math.min(1, Math.max(0, -rect.top / (window.innerHeight * 0.7)));
      for (var i = 0; i < glyphs.length; i++) {
        // stagger so letters degrade left-to-right like a wave
        var local = Math.min(1, Math.max(0, p * 1.5 - i * 0.12));
        glyphs[i].style.fontFamily = gradeFor(local);
      }
    }

    if (!reduce) {
      applyScroll();
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (!ticking) {
          requestAnimationFrame(function () { applyScroll(); ticking = false; });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ---- 2. Hero terminal typing ----
     Types the agent-control commands line by line into the hero terminal. */
  var term = document.querySelector("[data-type]");
  if (term) {
    var lines = JSON.parse(term.getAttribute("data-type"));
    if (reduce) {
      // render everything immediately, no caret animation
      term.classList.remove("type");
      term.innerHTML = lines.map(renderLine).join("");
    } else {
      runType(term, lines);
    }
  }

  function renderLine(l) {
    if (l.t === "cmd")
      return '<span class="pr">$ </span><span class="cmd">' + esc(l.v) + "</span>\n";
    if (l.t === "out")
      return '<span class="' + (l.c || "dim2") + '">' + esc(l.v) + "</span>\n";
    return esc(l.v) + "\n";
  }

  function runType(el, lines) {
    var html = "";
    var li = 0;
    el.classList.add("type");
    function nextLine() {
      if (li >= lines.length) {
        // loop after a beat
        setTimeout(function () { html = ""; el.innerHTML = ""; li = 0; nextLine(); }, 4200);
        return;
      }
      var l = lines[li];
      if (l.t === "cmd") {
        var ci = 0;
        var prefix = html + '<span class="pr">$ </span><span class="cmd">';
        (function typeChar() {
          el.innerHTML = prefix + esc(l.v.slice(0, ci)) + "</span>";
          ci++;
          if (ci <= l.v.length) setTimeout(typeChar, 26 + Math.random() * 30);
          else {
            html = prefix + esc(l.v) + "</span>\n";
            li++;
            setTimeout(nextLine, 260);
          }
        })();
      } else {
        html += renderLine(l);
        el.innerHTML = html;
        li++;
        setTimeout(nextLine, 360);
      }
    }
    nextLine();
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---- 3. Docs: highlight active TOC link on scroll ---- */
  var tocLinks = document.querySelectorAll(".toc a[href^='#']");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var a = map[e.target.id];
        if (a && e.isIntersecting) {
          tocLinks.forEach(function (x) { x.style.color = ""; });
          a.style.color = "var(--accent)";
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".doc-sec[id]").forEach(function (s) { obs.observe(s); });
  }
})();
