/* Engine: what the page does while a scene is on screen.

   Two kinds of thing live here.

   EFFECTS go on a whole scene, with a line like "effect: fog". Most of them
   are a class on the page plus, for a few, a canvas drawn behind the words.

   HAUNTINGS go on a single choice, with "haunted flees" or "haunted gone" at
   the end of the line. They are the only part of this engine that is allowed
   to be unfair, and even then there are rules:

     - a keyboard number always works, on every haunted choice except "gone"
     - "gone" can never be the only way out of a scene (story.js checks)
     - all of it stops under prefers-reduced-motion, because a button that
       runs away from the pointer is not a joke to everyone

   Short sounds are made with the browser's own oscillators. There are no
   sound files to upload, and sound is off until the player turns it on.
*/

const Effects = (() => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EFFECTS = ["underwater", "fog", "flicker", "shake", "slow", "dark", "dread", "static", "wrong"];

  let canvas = null, ctx = null, raf = 0, active = [], t = 0;

  function layer() {
    if (canvas) return canvas;
    canvas = document.createElement("canvas");
    canvas.id = "fx";
    canvas.setAttribute("aria-hidden", "true");
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    addEventListener("resize", size);
    size();
    return canvas;
  }

  function size() {
    if (!canvas) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- applying a scene's effects ----------

  function apply(effects) {
    active = (effects || []).filter((e) => EFFECTS.includes(e));
    const body = document.body;
    for (const e of EFFECTS) body.classList.toggle("fx-" + e, active.includes(e));

    if (active.includes("shake") && !calm) {
      const book = document.getElementById("book");
      book.classList.remove("fx-jolt");
      void book.offsetWidth;                       // make the browser notice
      book.classList.add("fx-jolt");
    }

    const needsCanvas = !calm && active.some((e) => ["underwater", "fog", "static"].includes(e));
    if (!needsCanvas) {
      if (canvas) canvas.style.display = "none";
      cancelAnimationFrame(raf); raf = 0;
      return;
    }
    layer().style.display = "block";
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    t = now / 1000;
    const w = innerWidth, h = innerHeight;
    ctx.clearRect(0, 0, w, h);

    if (active.includes("underwater")) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(150,220,230,0.1)";
      ctx.lineWidth = 3;
      for (let r = 0; r < 5; r++) {
        ctx.beginPath();
        for (let x = -40; x <= w + 40; x += 24) {
          const y = (h / 5) * r + Math.sin(x * 0.014 + t * (0.7 + r * 0.22)) * 26 + Math.sin(t * 0.4 + r) * 14;
          x === -40 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    if (active.includes("fog")) {
      ctx.save();
      ctx.fillStyle = "rgba(226,229,234,0.085)";
      for (let i = 0; i < 5; i++) {
        const x = ((t * (9 + i * 6) + i * 390) % (w + 700)) - 350;
        const y = h * (0.12 + i * 0.19) + Math.sin(t * 0.3 + i) * 18;
        ctx.beginPath(); ctx.ellipse(x, y, 290, 46, 0, 0, 6.3); ctx.fill();
      }
      ctx.restore();
    }

    if (active.includes("static")) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      const n = Math.floor((w * h) / 2600);
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i < n; i++) ctx.fillRect(Math.random() * w, Math.random() * h, 1.6, 1.6);
      ctx.restore();
    }
  }

  function clear() {
    apply([]);
  }

  // ---------- typewriter, for "effect: slow" ----------

  function reveal(box, done) {
    if (calm) return done && done();
    const paras = [...box.querySelectorAll("p")];
    if (!paras.length) return done && done();
    const saved = paras.map((p) => p.innerHTML);
    paras.forEach((p, i) => { if (i) p.style.visibility = "hidden"; p.innerHTML = ""; });
    let i = 0, stopped = false;
    const finishNow = () => {
      if (stopped) return;
      stopped = true;
      paras.forEach((q, j) => { q.innerHTML = saved[j]; q.style.visibility = ""; });
      removeEventListener("keydown", skip);
      box.removeEventListener("click", skip);
      done && done();
    };
    const skip = (e) => {
      if (e.type === "keydown" && (e.metaKey || e.ctrlKey || e.altKey)) return;
      if (e.type === "keydown" && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      clearInterval(box._fxTick);
      finishNow();
    };
    addEventListener("keydown", skip);
    box.addEventListener("click", skip);
    box.style.cursor = "pointer";
    box.title = "Click, or press any key, to show it all at once";

    function next() {
      if (stopped) return;
      if (i >= paras.length) return done && done();
      const p = paras[i], html = saved[i];
      p.style.visibility = "";
      // Reveal the text one character at a time without breaking any tags:
      // put the real html in, then walk a clipping length over it.
      p.innerHTML = html;
      const text = p.textContent;
      p.innerHTML = "";
      let k = 0;
      const span = document.createElement("span");
      p.appendChild(span);
      const tick = setInterval(() => {
        if (stopped) return clearInterval(tick);
        k += 2;
        span.textContent = text.slice(0, k);
        if (k >= text.length) {
          clearInterval(tick);
          p.innerHTML = html;                       // put the bold and italics back
          i++;
          if (i >= paras.length) return finishNow();
          setTimeout(next, 180);
        }
      }, 14);
      box._fxTick = tick;
    }
    next();
    return finishNow;
  }

  // ---------- hauntings ----------

  const GHOST = "ÆØẞ§¶∆⌁▚▞░▒█¬∴≠∅";
  const scramble = (s) => [...s].map((c) => (c === " " ? " " : Math.random() < 0.4 ? GHOST[Math.floor(Math.random() * GHOST.length)] : c)).join("");

  // Called once per haunted choice, after the button is in the page.
  function haunt(btn, choice, list) {
    const label = btn.querySelector(".label") || btn;
    const real = choice.text;

    if (calm && choice.haunted !== "waits" && choice.haunted !== "gone") {
      btn.classList.add("haunted-still");
      return;
    }

    if (choice.haunted === "flees") {
      // It dodges the pointer. It gets tired. The number key always works.
      let dodges = 0;
      btn.classList.add("haunted-flees");
      const run = (e) => {
        if (dodges >= 4) return;
        const r = btn.getBoundingClientRect();
        const near = e.clientY > r.top - 40 && e.clientY < r.bottom + 40;
        if (!near) return;
        dodges++;
        const dir = e.clientX < r.left + r.width / 2 ? 1 : -1;
        btn.style.transform = `translateX(${dir * Math.min(60, 18 + dodges * 13)}px) rotate(${dir * dodges * 0.6}deg)`;
        btn.style.opacity = String(1 - dodges * 0.12);
        if (dodges >= 4) {
          btn.style.transform = "";
          btn.style.opacity = "";
          btn.classList.remove("haunted-flees");
          btn.classList.add("haunted-caught");
          list.removeEventListener("mousemove", run);
        }
      };
      list.addEventListener("mousemove", run);
      btn._fxOff = () => list.removeEventListener("mousemove", run);
      return;
    }

    if (choice.haunted === "glitch") {
      btn.classList.add("haunted-glitch");
      const tick = setInterval(() => {
        if (!btn.isConnected) return clearInterval(tick);
        if (document.activeElement === btn) { label.textContent = real; return; }
        label.textContent = scramble(real);
        setTimeout(() => { if (btn.isConnected && document.activeElement !== btn) label.textContent = real; }, 90);
      }, 1700);
      btn._fxOff = () => clearInterval(tick);
      return;
    }

    if (choice.haunted === "lies") {
      // The words are not the words that were there a second ago. It borrows
      // the words off another choice in the same scene, which is worse.
      const other = choice.lie || "Stay where you are";
      btn.classList.add("haunted-lies");
      const tick = setInterval(() => {
        if (!btn.isConnected) return clearInterval(tick);
        const showing = label.textContent === real;
        if (document.activeElement === btn) { label.textContent = real; return; }
        label.textContent = showing ? other : real;
      }, 2600);
      btn.addEventListener("focus", () => { label.textContent = real; });
      btn.addEventListener("mouseenter", () => { label.textContent = real; });
      btn._fxOff = () => clearInterval(tick);
      return;
    }

    if (choice.haunted === "gone") {
      // You can see it. You cannot have it.
      btn.classList.add("haunted-gone");
      btn.disabled = false;
      btn.setAttribute("aria-disabled", "true");
      let tries = 0;
      btn.onclick = (e) => {
        e.preventDefault();
        tries++;
        btn.classList.remove("haunted-refuse");
        void btn.offsetWidth;
        btn.classList.add("haunted-refuse");
        const small = btn.querySelector("small");
        const said = ["Your hand goes through it.",
                      "It is still there. It is still not there.",
                      "You have tried this before. You will try it again.",
                      "Stop."][Math.min(3, tries - 1)];
        if (small) small.textContent = said;
        if (tries >= 3) btn.classList.add("haunted-faded");
        document.dispatchEvent(new CustomEvent("haunting", { detail: { tries, choice } }));
      };
      return;
    }

    if (choice.haunted === "waits") {
      btn.hidden = true;
      const after = (choice.after || 6) * 1000;
      const timer = setTimeout(() => {
        if (!btn.isConnected) return;
        btn.hidden = false;
        btn.classList.add("haunted-arrives");
      }, calm ? 600 : after);
      btn._fxOff = () => clearTimeout(timer);
      // If something refuses to be picked, this one stops waiting and shows up.
      const nudge = () => { clearTimeout(timer); if (btn.isConnected) { btn.hidden = false; btn.classList.add("haunted-arrives"); } };
      document.addEventListener("haunting", nudge, { once: true });
    }
  }

  function unhaunt(list) {
    for (const b of list.querySelectorAll("button")) if (b._fxOff) b._fxOff();
  }

  // ---------- sound, made by the browser, off until asked for ----------

  const Sound = (() => {
    const KEY = "adventure-sound:" + location.pathname;
    let on = false, audio = null;
    try { on = localStorage.getItem(KEY) === "1"; } catch (e) { on = false; }

    const RECIPES = {
      bell:      { type: "triangle", notes: [[440, 0], [660, 0.01], [880, 0.02]], len: 2.4, gain: 0.16 },
      gull:      { type: "sawtooth", notes: [[900, 0], [1500, 0.07], [700, 0.17]], len: 0.5, gain: 0.05 },
      splash:    { type: "noise", len: 0.55, gain: 0.1 },
      tick:      { type: "square", notes: [[1400, 0]], len: 0.05, gain: 0.05 },
      lamp:      { type: "sine", notes: [[180, 0], [300, 0.12], [420, 0.24]], len: 1.6, gain: 0.1 },
      heartbeat: { type: "sine", notes: [[62, 0], [52, 0.22]], len: 0.9, gain: 0.22 },
      wind:      { type: "noise", len: 2.2, gain: 0.045 },
    };

    function ready() {
      if (!audio) { try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
      if (audio.state === "suspended") audio.resume();
      return audio;
    }

    function play(name) {
      if (!on) return;
      const r = RECIPES[name];
      const a = ready();
      if (!r || !a) return;
      const now = a.currentTime, out = a.createGain();
      out.gain.setValueAtTime(0, now);
      out.gain.linearRampToValueAtTime(r.gain, now + 0.02);
      out.gain.exponentialRampToValueAtTime(0.0001, now + r.len);
      out.connect(a.destination);

      if (r.type === "noise") {
        const n = a.sampleRate * r.len;
        const buf = a.createBuffer(1, n, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = a.createBufferSource();
        src.buffer = buf;
        const f = a.createBiquadFilter();
        f.type = "lowpass"; f.frequency.value = name === "wind" ? 480 : 1500;
        src.connect(f); f.connect(out); src.start(now);
        return;
      }
      for (const [hz, delay] of r.notes) {
        const o = a.createOscillator();
        o.type = r.type;
        o.frequency.setValueAtTime(hz, now + delay);
        if (name === "gull") o.frequency.exponentialRampToValueAtTime(hz * 0.5, now + delay + 0.18);
        o.connect(out);
        o.start(now + delay);
        o.stop(now + r.len);
      }
    }

    function set(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* ignore */ }
      if (on) { ready(); play("tick"); }
    }

    return { play, set, get on() { return on; } };
  })();

  return { apply, clear, reveal, haunt, unhaunt, Sound, calm };
})();
