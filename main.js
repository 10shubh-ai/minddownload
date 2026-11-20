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

  /* ---------- interactive particle field ---------- */
  const cv = document.getElementById("field");
  const ctx = cv.getContext("2d");
  let W, H, dpr, pts = [];
  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.width = innerWidth * dpr; H = cv.height = innerHeight * dpr;
    const n = Math.round(Math.min(110, (innerWidth * innerHeight) / 14000));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.4 + 0.6) * dpr,
    }));
  }
  resize();
  addEventListener("resize", resize);

  function frame() {
    ctx.clearRect(0, 0, W, H);
    const mx = mouse.x * dpr, my = mouse.y * dpr, R = 170 * dpr, link = 120 * dpr;
    for (const p of pts) {
      if (mouse.active) {
        const dx = p.x - mx, dy = p.y - my, d = Math.hypot(dx, dy);
        if (d < R && d > 0.1) { const f = (1 - d / R) * 0.9 * dpr; p.vx += (dx / d) * f; p.vy += (dy / d) * f; }
      }
      p.vx *= 0.94; p.vy *= 0.94;
      p.vx += (Math.random() - 0.5) * 0.03 * dpr; p.vy += (Math.random() - 0.5) * 0.03 * dpr;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x += W; if (p.x > W) p.x -= W; if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;
    }
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      for (let j = i + 1; j < pts.length; j++) {
        const b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < link) { ctx.strokeStyle = `rgba(90,175,255,${(1 - d / link) * 0.22})`; ctx.lineWidth = dpr * 0.8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      if (mouse.active) {
        const d = Math.hypot(a.x - mx, a.y - my);
        if (d < R * 1.4) { ctx.strokeStyle = `rgba(140,205,255,${(1 - d / (R * 1.4)) * 0.45})`; ctx.lineWidth = dpr; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mx, my); ctx.stroke(); }
      }
      ctx.fillStyle = "rgba(160,215,255,0.8)";
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
    }
    // cursor ring follows with easing
    rx += (mouse.x - rx) * 0.18; ry += (mouse.y - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(frame);
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
  if (!reduce) requestAnimationFrame(parallax);

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
    w.animate([{ opacity: 0, transform: "translateY(60%) rotateX(-60deg)", filter: "blur(8px)" }, { opacity: 1, transform: "none", filter: "blur(0)" }],
      { duration: 900, delay: 200 + i * 90, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
  });

  /* ---------- hero: 32-lane live download loop ---------- */
  const lanesEl = document.getElementById("lanes");
  const lanes = [];
  for (let i = 0; i < 32; i++) { const l = document.createElement("div"); l.className = "lane"; const f = document.createElement("i"); l.appendChild(f); lanesEl.appendChild(l); lanes.push({ f, rate: 0.75 + Math.random() * 0.5 }); }
  const hpct = document.getElementById("hpct"), hspeed = document.getElementById("hspeed"), hfill = document.getElementById("hfill"), hstate = document.getElementById("hstate");
  const CYCLE = 6500; let t0 = performance.now();
  function heroLoop(now) {
    let t = (now - t0) / CYCLE;
    if (t > 1.25) { t0 = now; t = 0; lanes.forEach((l) => (l.rate = 0.75 + Math.random() * 0.5)); }
    const k = Math.min(1, t);
    const e = 1 - Math.pow(1 - k, 1.6);
    lanes.forEach((l) => { l.f.style.width = Math.min(100, e * 100 * l.rate * 1.12) + "%"; });
    hfill.style.width = e * 100 + "%";
    hpct.textContent = Math.floor(e * 100) + "%";
    const spd = k < 1 ? 218.5 * Math.min(1, k * 5) * (0.94 + 0.06 * Math.sin(now / 90)) : 0;
    hspeed.textContent = spd.toFixed(1);
    hstate.textContent = k < 1 ? "32 connections" : "Completed ✓";
    hstate.style.color = k < 1 ? "" : "#34c759";
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

  /* ---------- MP3 waveform bars ---------- */
  const wave = document.querySelector(".wave");
  for (let i = 0; i < 36; i++) { const b = document.createElement("i"); b.style.animationDelay = -(i * 0.13 % 1.1) + "s"; b.style.animationDuration = 0.7 + ((i * 37) % 9) / 10 + "s"; wave.appendChild(b); }

  /* ---------- download click burst ---------- */
  document.querySelectorAll('a[download]').forEach((a) => a.addEventListener("click", (e) => {
    for (let i = 0; i < 18; i++) {
      const s = document.createElement("span");
      const ang = (i / 18) * Math.PI * 2, dist = 60 + Math.random() * 50;
      Object.assign(s.style, { position: "fixed", left: e.clientX + "px", top: e.clientY + "px", width: "6px", height: "6px", borderRadius: "50%", background: i % 2 ? "#6cc4ff" : "#fff", pointerEvents: "none", zIndex: 200, boxShadow: "0 0 10px #3d9bff" });
      document.body.appendChild(s);
      s.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(0)`, opacity: 0 }], { duration: 700, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => s.remove();
    }
  }));
})();
