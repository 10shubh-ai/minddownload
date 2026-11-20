/* ---------- one hero button, the right file for this OS ---------- */
(() => {
  const REL = "https://github.com/10shubh-ai/minddownload/releases/latest/download/";
  const MAC = { href: REL + "MindDownload-Mac-arm64.zip", label: "Download for macOS", fine: "Free · macOS 14+ · Apple Silicon · 2.4 MB" };
  const WIN = { href: REL + "MindDownload-Setup-x64.exe", label: "Download for Windows", fine: "Free · Windows 10 & 11 · 64-bit · 70 MB" };
  const btn = document.getElementById("dl"), label = document.getElementById("dl-label");
  const fine = document.getElementById("dl-fine"), alt = document.getElementById("dl-alt");
  if (!btn) return;
  const apply = (main, other, otherName) => {
    btn.href = main.href; label.textContent = main.label; fine.textContent = main.fine;
    alt.href = other.href; alt.textContent = otherName;
  };
  if (document.documentElement.dataset.os === "win") {
    apply(WIN, MAC, "macOS");
    // Windows on ARM gets the native arm64 installer.
    navigator.userAgentData?.getHighEntropyValues?.(["architecture"]).then((v) => {
      if (v.architecture === "arm") { WIN.href = REL + "MindDownload-Setup-arm64.exe"; WIN.fine = WIN.fine.replace("64-bit", "ARM64"); apply(WIN, MAC, "macOS"); }
    }).catch(() => {});
  } else {
    apply(MAC, WIN, "Windows");
  }
})();

(() => {
  const root = document.documentElement;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouse = { x: innerWidth / 2, y: innerHeight * 0.4, active: false };

  /* ---------- spotlight + custom cursor ---------- */
  const cursor = document.querySelector(".cursor");
  const dot = document.querySelector(".cursor-dot");
  const ring = document.querySelector(".cursor-ring");
  let rx = mouse.x, ry = mouse.y;
  if (fine && !reduce) document.body.classList.add("has-cursor");

  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    root.style.setProperty("--mx", e.clientX + "px");
    root.style.setProperty("--my", e.clientY + "px");
    dot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }, { passive: true });
  addEventListener("pointerleave", () => { mouse.active = false; });
  addEventListener("pointerdown", () => cursor.classList.add("down"));
  addEventListener("pointerup", () => cursor.classList.remove("down"));
  document.querySelectorAll("a, button, video, .card, .step, .stat").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("hover"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("hover"));
  });

  /* ---------- binary rain + binary/sparkle cursor trail ---------- */
  // Glyphs are pre-rendered once into small sprites and stamped with drawImage + globalAlpha,
  // which is far cheaper than fillText/shadowBlur per glyph (matters a lot on phones).
  const cv = document.getElementById("field");
  const ctx = cv.getContext("2d");
  const tc = document.getElementById("trail");
  const tx2 = tc.getContext("2d");
  const touch = !fine;
  const CELL = touch ? 26 : 22, TAIL = touch ? 11 : 16, FONT = touch ? 14 : 15;
  let dpr, vw = 0, vh = 0, cols = [];
  const bit = () => (Math.random() < 0.5 ? "0" : "1");

  function sprite(ch, size, color, glow, scale) {
    const pad = glow ? Math.ceil(size * 0.7) : 2;
    const s = Math.ceil(size + pad * 2);
    const c = document.createElement("canvas");
    c.width = c.height = Math.ceil(s * scale);
    const g = c.getContext("2d");
    g.scale(scale, scale);
    g.font = `700 ${size}px ui-monospace, Menlo, monospace`;
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = color;
    if (glow) { g.shadowColor = "#3d9bff"; g.shadowBlur = size * 0.6; }
    if (ch === "*") {
      g.translate(s / 2, s / 2); g.beginPath();
      const r = size / 2;
      for (let i = 0; i < 4; i++) { g.lineTo(0, -r); g.quadraticCurveTo(0, 0, r, 0); g.rotate(Math.PI / 2); }
      g.closePath(); g.fill();
    } else g.fillText(ch, s / 2, s / 2 + 1);
    return { c, s };
  }
  let RAIN, TRAIL;
  function buildSprites() {
    RAIN = {
      blue: { 0: sprite("0", FONT, "rgb(90,175,255)", false, dpr), 1: sprite("1", FONT, "rgb(90,175,255)", false, dpr) },
      white: { 0: sprite("0", FONT, "rgb(225,245,255)", false, dpr), 1: sprite("1", FONT, "rgb(225,245,255)", false, dpr) },
    };
    TRAIL = {
      b: { "#8fd3ff": { 0: sprite("0", 20, "#8fd3ff", true, dpr), 1: sprite("1", 20, "#8fd3ff", true, dpr) },
           "#ffffff": { 0: sprite("0", 20, "#ffffff", true, dpr), 1: sprite("1", 20, "#ffffff", true, dpr) } },
      s: { "#8fd3ff": sprite("*", 20, "#8fd3ff", true, dpr), "#ffffff": sprite("*", 20, "#ffffff", true, dpr) },
    };
  }

  function makeCols() {
    const n = Math.ceil(vw / CELL);
    cols = Array.from({ length: n }, (_, i) => ({
      x: i * CELL + CELL / 2,
      y: Math.random() * (vh + TAIL * CELL),
      v: 0.6 + Math.random() * 1.6,
      on: Math.random() < (touch ? 0.45 : 0.55),
      chars: Array.from({ length: TAIL }, bit),
    }));
  }
  function resize() {
    const w = innerWidth;
    // Phones fire resize while scrolling (address bar shows/hides): only rebuild on a width change,
    // and size the canvas to the tallest viewport so height changes need no reallocation.
    const h = touch ? Math.max(innerHeight, screen.height || 0, vh) : innerHeight;
    if (w === vw && h === vh) return;
    const widthChanged = w !== vw;
    vw = w; vh = h;
    dpr = Math.min(devicePixelRatio || 1, touch ? 1.5 : 2);
    cv.width = tc.width = Math.round(vw * dpr); cv.height = tc.height = Math.round(vh * dpr);
    cv.style.height = tc.style.height = vh + "px";
    buildSprites();
    if (widthChanged || !cols.length) makeCols();
  }
  resize();
  addEventListener("resize", resize);

  const trail = [];
  const MAXT = touch ? 70 : 200;
  let lastX = null, lastY = null;
  function spawn(x, y, burst) {
    const sparkle = Math.random() < (burst ? 0.45 : 0.32);
    const a = Math.random() * Math.PI * 2, sp = burst ? 2 + Math.random() * 4 : 0.3 + Math.random() * 0.8;
    trail.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (sparkle ? 0 : 0.6),
      life: 0, max: (burst ? 1000 : 1100) + Math.random() * 600,
      kind: sparkle ? "s" : "b", ch: bit(), size: sparkle ? 8 + Math.random() * 8 : 13 + Math.random() * 7,
      rot: Math.random() * Math.PI, hue: Math.random() < 0.3 ? "#ffffff" : "#8fd3ff",
    });
    if (trail.length > MAXT) trail.splice(0, trail.length - MAXT);
  }
  addEventListener("pointermove", (e) => {
    if (reduce) return;
    if (lastX === null || e.pointerType !== "mouse" && trail.length === 0) { lastX = e.clientX; lastY = e.clientY; }
    const d = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    const gap = touch ? 22 : 10;
    const steps = Math.min(touch ? 3 : 8, Math.floor(d / gap));
    for (let i = 1; i <= steps; i++) spawn(lastX + ((e.clientX - lastX) * i) / steps, lastY + ((e.clientY - lastY) * i) / steps, false);
    if (steps) { lastX = e.clientX; lastY = e.clientY; }
  }, { passive: true });
  addEventListener("pointerdown", (e) => { lastX = e.clientX; lastY = e.clientY; if (!reduce) for (let i = 0; i < (touch ? 14 : 26); i++) spawn(e.clientX, e.clientY, true); });

  function stamp(g, sp, x, y, scale) {
    const d = sp.s * scale;
    g.drawImage(sp.c, x - d / 2, y - d / 2, d, d);
  }

  let prev = performance.now(), trailDirty = false, rainAcc = 0;
  function frame(now) {
    const dt = Math.min(50, now - prev); prev = now;
    rainAcc += dt;
    if (!touch || rainAcc >= 30) { drawRain(rainAcc); rainAcc = 0; }
    drawTrail(dt);
    if (fine) { rx += (mouse.x - rx) * 0.18; ry += (mouse.y - ry) * 0.18; ring.style.transform = `translate(${rx}px, ${ry}px)`; }
    requestAnimationFrame(frame);
  }
  function drawRain(dt) {
    dt = Math.min(60, dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, vw, vh);
    const mx = mouse.x, my = mouse.y, R = 190;
    const useMouse = mouse.active && fine;

    for (const c of cols) {
      c.y += c.v * dt * 0.06;
      if (c.y - TAIL * CELL > vh) { c.y = -Math.random() * 300; c.v = 0.6 + Math.random() * 1.6; c.on = Math.random() < (touch ? 0.45 : 0.55); }
      if (!c.on) continue;
      if (Math.random() < 0.06) c.chars[(Math.random() * TAIL) | 0] = bit();
      const near = useMouse ? Math.max(0, 1 - Math.abs(c.x - mx) / R) : 0;
      for (let k = 0; k < TAIL; k++) {
        const y = c.y - k * CELL;
        if (y < -CELL || y > vh + CELL) continue;
        let a = (1 - k / TAIL) * 0.13, glow = 0;
        if (near) {
          const d = Math.hypot(c.x - mx, y - my);
          if (d < R) { glow = 1 - d / R; a += glow * 0.75; if (Math.random() < glow * 0.25) c.chars[k] = bit(); }
        }
        const white = k === 0 || glow > 0.55;
        ctx.globalAlpha = white ? Math.min(1, a + 0.08) : a;
        const sp = (white ? RAIN.white : RAIN.blue)[c.chars[k]];
        ctx.drawImage(sp.c, c.x - sp.s / 2, y - sp.s / 2, sp.s, sp.s);
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawTrail(dt) {
    // trail (top layer, above content); skip clearing when there is nothing to draw
    if (trail.length || trailDirty) {
      tx2.setTransform(dpr, 0, 0, dpr, 0, 0);
      tx2.clearRect(0, 0, vw, vh);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life += dt;
        const k = p.life / p.max;
        if (k >= 1) { trail.splice(i, 1); continue; }
        p.x += p.vx * dt * 0.06; p.y += p.vy * dt * 0.06; p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.012 * dt;
        tx2.globalAlpha = Math.max(0, k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85);
        if (p.kind === "s") {
          const tw = 0.6 + 0.4 * Math.sin(p.life / 60);
          const sp = TRAIL.s[p.hue], sc = (p.size / 20) * (1 - k * 0.6) * tw * 1.6;
          tx2.save(); tx2.translate(p.x, p.y); tx2.rotate(p.rot + p.life / 500); stamp(tx2, sp, 0, 0, sc); tx2.restore();
        } else {
          if (Math.random() < 0.04) p.ch = bit();
          stamp(tx2, TRAIL.b[p.hue][p.ch], p.x, p.y, (p.size / 20) * (1 - k * 0.3));
        }
      }
      tx2.globalAlpha = 1;
      trailDirty = trail.length > 0;
    }
  }
  if (!reduce) requestAnimationFrame(frame);

  /* ---------- 3D tilt (hero window, phone, cards) ---------- */
  function bindTilt(el, max, glow) {
    let raf = 0, tx = 0, ty = 0;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      tx = (px - 0.5) * 2; ty = (py - 0.5) * 2;
      if (glow) { el.style.setProperty("--gx", px * 100 + "%"); el.style.setProperty("--gy", py * 100 + "%"); }
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => { el.style.transform = `perspective(1100px) rotateY(${tx * max}deg) rotateX(${-ty * max}deg) translateZ(0)`; });
    });
    el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); el.style.transform = ""; });
  }
  if (fine && !reduce) document.querySelectorAll(".tilt-card").forEach((el) => bindTilt(el, +el.dataset.tilt || 8, true));

  // hero window + floating chips respond to the whole page's mouse position (parallax)
  const hero = document.querySelector(".hero-stage .tilt");
  const depths = document.querySelectorAll(".depth");
  const phone = document.querySelector(".phone");
  let hx = 0, hy = 0, cx = 0, cy = 0;
  function parallax() {
    cx += (hx - cx) * 0.08; cy += (hy - cy) * 0.08;
    hero.style.transform = `rotateY(${-14 + cx * 12}deg) rotateX(${8 - cy * 9}deg)`;
    depths.forEach((d) => { const k = +d.dataset.depth; d.style.transform = `translate3d(${cx * k * 0.35}px, ${cy * k * 0.35}px, ${k}px)`; });
    if (phone) phone.style.transform = `rotateY(${cx * 8}deg) rotateX(${-cy * 6}deg)`;
    requestAnimationFrame(parallax);
  }
  addEventListener("pointermove", (e) => { hx = e.clientX / innerWidth - 0.5; hy = e.clientY / innerHeight - 0.5; }, { passive: true });
  if (!reduce && fine) requestAnimationFrame(parallax);

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) document.querySelectorAll(".magnetic").forEach((b) => {
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      b.style.setProperty("--bx", x + "px"); b.style.setProperty("--by", y + "px");
      b.style.transform = `translate(${(x - r.width / 2) * 0.25}px, ${(y - r.height / 2) * 0.35}px)`;
    });
    b.addEventListener("pointerleave", () => { b.style.transition = "transform .5s cubic-bezier(.2,.9,.3,1.4)"; b.style.transform = ""; setTimeout(() => (b.style.transition = ""), 500); });
  });

  /* ---------- split hero headline into words ---------- */
  document.querySelectorAll(".split").forEach((h) => {
    const walk = (node) => {
      [...node.childNodes].forEach((c) => {
        if (c.nodeType === 3 && c.textContent.trim()) {
          const frag = document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach((t) => {
            if (!t.trim()) { frag.appendChild(document.createTextNode(t)); return; }
            const s = document.createElement("span"); s.className = node.classList && node.classList.contains("grad") ? "w grad" : "w"; s.textContent = t; frag.appendChild(s);
          });
          c.replaceWith(frag);
        } else if (c.nodeType === 1 && c.tagName !== "BR") walk(c);
      });
    };
    walk(h);
  });

  /* ---------- scroll reveal ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
    e.target.dispatchEvent(new CustomEvent("revealed"));
  }), { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach((el, i) => {
    el.style.transitionDelay = (el.closest(".hero") ? i * 0.08 : 0) + "s";
    io.observe(el);
  });
  document.querySelectorAll(".split .w").forEach((w, i) => {
    w.animate(fine ? [{ opacity: 0, transform: "translateY(60%) rotateX(-60deg)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }] : [{ opacity: 0, transform: "translateY(40%)" }, { opacity: 1, transform: "none" }],
      { duration: 900, delay: 200 + i * 90, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
  });

  /* ---------- hero: 32-lane live download loop ---------- */
  const lanesEl = document.getElementById("lanes");
  const lanes = [];
  for (let i = 0; i < 32; i++) { const l = document.createElement("div"); l.className = "lane"; const f = document.createElement("i"); l.appendChild(f); lanesEl.appendChild(l); lanes.push({ f, rate: 0.75 + Math.random() * 0.5 }); }
  const hpct = document.getElementById("hpct"), hspeed = document.getElementById("hspeed"), hfill = document.getElementById("hfill"), hstate = document.getElementById("hstate");
  const CYCLE = 6500; let t0 = performance.now(), lastText = 0;
  function heroLoop(now) {
    let t = (now - t0) / CYCLE;
    if (t > 1.25) { t0 = now; t = 0; lanes.forEach((l) => (l.rate = 0.75 + Math.random() * 0.5)); }
    const k = Math.min(1, t);
    const e = 1 - Math.pow(1 - k, 1.6);
    lanes.forEach((l) => { l.f.style.transform = `scaleX(${Math.min(1, e * l.rate * 1.12)})`; });
    hfill.style.transform = `scaleX(${e})`;
    if (now - lastText > 80 || k >= 1) { lastText = now;
    hpct.textContent = Math.floor(e * 100) + "%";
    const spd = k < 1 ? 218.5 * Math.min(1, k * 5) * (0.94 + 0.06 * Math.sin(now / 90)) : 0;
    hspeed.textContent = spd.toFixed(1);
    hstate.textContent = k < 1 ? "32 connections" : "Completed ✓";
    hstate.style.color = k < 1 ? "" : "#34c759"; }
    requestAnimationFrame(heroLoop);
  }
  requestAnimationFrame(heroLoop);

  /* ---------- speed race + counters (on reveal) ---------- */
  function tween(ms, fn, ease = (x) => 1 - Math.pow(1 - x, 3)) {
    const s = performance.now();
    const step = (n) => { const k = Math.min(1, (n - s) / ms); fn(ease(k)); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  const race = document.querySelector(".race");
  race.addEventListener("revealed", () => {
    const rs = document.getElementById("rslow"), rf = document.getElementById("rfast");
    const ns = document.getElementById("nslow"), nf = document.getElementById("nfast");
    tween(2200, (k) => { rf.style.width = k * 100 + "%"; nf.textContent = (218.5 * k).toFixed(1); });
    tween(2200, (k) => { rs.style.width = k * 4.6 + "%"; ns.textContent = (10 * k).toFixed(1); }, (x) => x);
  });
  document.querySelectorAll("[data-count]").forEach((b) => {
    const target = +b.dataset.count;
    b.closest(".reveal").addEventListener("revealed", () => tween(1600, (k) => (b.textContent = Math.round(target * k))));
  });

  /* ---------- scroll progress styled as a download ---------- */
  const phead = document.querySelector(".progress-head"), prog = document.querySelector(".progress"), pfill = document.querySelector(".progress-fill"), ppct = document.getElementById("ppct"), ptag = document.querySelector(".progress-tag");
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const k = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    pfill.style.transform = `scaleX(${k})`; phead.style.transform = `translateX(${k * innerWidth}px)`;
    prog.classList.toggle("on", scrollY > 40);
    const done = k > 0.995;
    prog.classList.toggle("done", done);
    ptag.innerHTML = done ? "<b>✓</b> Completed" : `<b>${Math.round(k * 100)}%</b> page downloaded`;
    // keep the tag inside the viewport near the edges
    ptag.style.transform = `translateX(${k < 0.08 ? "0%" : k > 0.92 ? "0%" : "50%"})`;
    ptag.style.right = k > 0.92 ? "6px" : k < 0.08 ? "auto" : "0";
    ptag.style.left = k < 0.08 ? "0" : "auto";
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  /* ---------- MP3 waveform bars ---------- */
  const wave = document.querySelector(".wave");
  for (let i = 0; i < 36; i++) { const b = document.createElement("i"); b.style.animationDelay = -(i * 0.13 % 1.1) + "s"; b.style.animationDuration = 0.7 + ((i * 37) % 9) / 10 + "s"; wave.appendChild(b); }

})();
