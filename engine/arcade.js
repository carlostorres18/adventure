/* Engine: the scenes you play instead of read.

   A scene with a "game:" line on it hands over to this file. When the game
   finishes it tells the story whether the player won or lost, and the story
   carries on from the "on win" or "on lose" choice.

   Two rules this file keeps, no matter what:

   1. NOBODY IS EVER STUCK BEHIND A GAME. Every game has a button that takes
      you straight to the winning scene. Not being able to play a game is
      never a reason to miss part of the story.
   2. WHAT YOU ARE CARRYING MATTERS. The games read the player's items, the
      same ones the story uses, so a lantern or a feather changes how it goes.

   Everything is drawn with the canvas built into the browser. No libraries,
   no image files, no sound files.
*/

const Arcade = (() => {
  const W = 480, H = 360;                       // the world is always this big
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- the shell every game sits in ----------

  function play(name, opts) {
    const game = GAMES[name];
    if (!game) return opts.onDone(true);        // unknown game: never block the story

    const wrap = document.createElement("div");
    wrap.className = "arcade";

    const stage = document.createElement("div");
    stage.className = "arcade-stage";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", game.describe);
    stage.appendChild(canvas);

    const hud = document.createElement("div");
    hud.className = "arcade-hud";
    stage.appendChild(hud);

    const tell = document.createElement("p");
    tell.className = "arcade-say";
    tell.setAttribute("aria-live", "polite");

    const bar = document.createElement("div");
    bar.className = "arcade-buttons";

    wrap.appendChild(stage);
    wrap.appendChild(tell);
    wrap.appendChild(bar);
    opts.mount.appendChild(wrap);

    const ctx = canvas.getContext("2d");
    let scale = 1;
    function fit() {
      const w = Math.max(240, Math.min(W, stage.clientWidth || W));
      scale = w / W;
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = Math.round(W * scale * dpr);
      canvas.height = Math.round(H * scale * dpr);
      canvas.style.width = Math.round(W * scale) + "px";
      canvas.style.height = Math.round(H * scale) + "px";
      ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    }
    fit();
    addEventListener("resize", fit);

    // ---- input ----
    const keys = Object.create(null);
    const pointer = { x: W / 2, y: H - 40, down: false, used: false };
    const onKeyDown = (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      keys[e.key.toLowerCase()] = true;
      if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) e.preventDefault();
    };
    const onKeyUp = (e) => { keys[e.key.toLowerCase()] = false; };
    const toWorld = (e) => {
      const r = canvas.getBoundingClientRect();
      const t = e.touches && e.touches[0];
      const cx = (t ? t.clientX : e.clientX), cy = (t ? t.clientY : e.clientY);
      pointer.x = (cx - r.left) / scale;
      pointer.y = (cy - r.top) / scale;
      pointer.used = true;
    };
    const onMove = (e) => { toWorld(e); if (e.touches) e.preventDefault(); };
    const onDown = (e) => { pointer.down = true; toWorld(e); };
    const onUp = () => { pointer.down = false; };

    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    addEventListener("mouseup", onUp);
    addEventListener("touchend", onUp);

    // ---- buttons ----
    function button(label, cls, go) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = label;
      if (cls) b.className = cls;
      b.onclick = go;
      bar.appendChild(b);
      return b;
    }

    let over = false, raf = 0, last = 0, paused = false;
    function finish(won, how) {
      if (over) return;
      over = true;
      cancelAnimationFrame(raf);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
      removeEventListener("mouseup", onUp);
      removeEventListener("touchend", onUp);
      removeEventListener("resize", fit);
      live.delete(opts.mount);
      if (how !== "skipped") Memory.playedGame(name, won);
      opts.onDone(won, how);
    }

    const state = {
      W, H, ctx, keys, pointer, calm,
      items: opts.items || new Set(),
      scene: opts.scene || null,
      creatures: opts.creatures || [],
      t: 0, say: (s) => { if (tell.textContent !== s) tell.textContent = s; },
      hud: (html) => { if (hud.innerHTML !== html) hud.innerHTML = html; },
      shake: 0,
      win: () => finish(true, "played"),
      lose: () => finish(false, "played"),
    };

    game.setup(state, { button, finish });
    live.set(opts.mount, { state, game, over: () => over });

    // ---- the loop ----
    const onBlur = () => { paused = true; };
    const onFocus = () => { paused = false; last = 0; };
    addEventListener("blur", onBlur);
    addEventListener("focus", onFocus);

    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (over) return;
      if (paused) { last = now; return; }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
      last = now;
      state.t += dt;
      game.step(state, dt);
      ctx.save();
      if (state.shake > 0 && !calm) {
        ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
        state.shake = Math.max(0, state.shake - dt * 28);
      }
      game.draw(state);
      ctx.restore();
    }
    // test.html uses this to run a fixed number of frames on the spot, so a
    // screenshot catches the game mid-play instead of on frame one.
    if (opts.frames) {
      for (let i = 0; i < opts.frames && !over; i++) {
        if (opts.drive) opts.drive(state, i);
        state.t += 1 / 60;
        game.step(state, 1 / 60);
        if (!opts.quiet) { ctx.save(); game.draw(state); ctx.restore(); }
      }
    }

    raf = requestAnimationFrame(frame);

    return { stop: () => finish(false, "left") };
  }

  // ---------- helpers ----------

  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  // A hash of a name, so a foe nobody has drawn still looks like itself every
  // time anyone meets it.
  function seed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
  }

  function bar(value, max, w, colour, ctx, x, y) {
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(x, y, w, 8);
    ctx.fillStyle = colour; ctx.fillRect(x + 1, y + 1, Math.max(0, (w - 2) * clamp(value / max, 0, 1)), 6);
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, 7);
  }

  function meter(label, value, max, colour) {
    const pips = [];
    for (let i = 0; i < max; i++) pips.push(`<i class="${i < value ? "on" : ""}" style="--pip:${colour}"></i>`);
    return `<span class="arcade-meter"><b>${label}</b>${pips.join("")}</span>`;
  }

  // =====================================================================
  //  THE UNDERTOW. A bullet hell, four hundred feet down, in 1984.
  // =====================================================================

  const undertow = {
    describe: "A game. You are swimming up through dark water while the sea throws things at you. Use the arrow keys or drag with your finger. There is a button to skip it.",

    setup(s, ui) {
      const feather = s.items.has("white feather");
      const lamp = s.items.has("lantern");
      const twice = s.items.has("the same key twice");

      s.g = {
        x: W / 2, y: H - 50, vx: 0, vy: 0,
        depth: 100,                       // 100 fathoms down. 0 is air.
        breath: feather ? 7 : 5,
        maxBreath: feather ? 7 : 5,
        hurt: 0,                          // seconds of being untouchable after a hit
        bullets: [], bits: [], bubbles: [], hands: [],
        wave: 0, waveT: 0,
        blinks: twice ? 3 : 0, blinking: 0,
        light: lamp ? 190 : 86,           // how far you can see
        feather, lamp, twice,
        started: false, ending: 0,
      };
      for (let i = 0; i < 40; i++) s.g.bubbles.push({ x: rnd(0, W), y: rnd(0, H), r: rnd(1, 3.4), v: rnd(10, 34) });

      const drowned = (Memory.state.games.undertow || {}).lost || 0;
      s.say(drowned
        ? `You have drowned here ${Memory.spell(drowned)} ${drowned === 1 ? "time" : "times"}. The water does not find this interesting.`
        : "Get to the surface. Arrow keys, or drag. Hold Shift to move carefully.");

      ui.button("Let go", "arcade-give", () => { s.say("You stop swimming."); s.lose(); });
      ui.button("Skip this and keep reading", "arcade-skip", () => { s.say("The sea lets you past."); ui.finish(true, "skipped"); });
      if (drowned >= 3) ui.button("Make it easier", "", (e) => {
        s.g.maxBreath = s.g.breath = 9;
        s.g.light = Math.max(s.g.light, 190);
        e.target.disabled = true;
        s.say("Fine. More air, and you can see further. Go on.");
      });
    },

    step(s, dt) {
      const g = s.g;
      if (g.ending) { g.ending -= dt; if (g.ending <= 0) (g.won ? s.win() : s.lose()); return; }

      // ---- you ----
      const slow = s.keys.shift ? 0.42 : 1;
      let ax = 0, ay = 0;
      if (s.keys.arrowleft || s.keys.a) ax -= 1;
      if (s.keys.arrowright || s.keys.d) ax += 1;
      if (s.keys.arrowup || s.keys.w) ay -= 1;
      if (s.keys.arrowdown || s.keys.s) ay += 1;
      if (s.pointer.used && !ax && !ay) {
        const dx = s.pointer.x - g.x, dy = s.pointer.y - g.y;
        const d = Math.hypot(dx, dy);
        if (d > 2) { ax = dx / d; ay = dy / d; }
      }
      const speed = 250 * slow;
      g.vx += (ax * speed - g.vx) * Math.min(1, dt * 11);
      g.vy += (ay * speed - g.vy) * Math.min(1, dt * 11);
      g.vy += 26 * dt;                                   // the sea pulls down
      g.x = clamp(g.x + g.vx * dt, 12, W - 12);
      g.y = clamp(g.y + g.vy * dt, 14, H - 14);

      if ((s.keys[" "] || s.pointer.down) && g.blinks > 0 && g.blinking <= 0) {
        g.blinks--; g.blinking = 0.55; s.shake = 4;
        s.say("The fold opens for half a second. " + (g.blinks ? g.blinks + " left." : "That was the last one."));
      }
      g.blinking = Math.max(0, g.blinking - dt);
      g.hurt = Math.max(0, g.hurt - dt);

      // ---- rising ----
      // You go up faster the higher you already are. Staying low is losing.
      const high = 1 - g.y / H;
      g.depth -= dt * (1.1 + high * 5.0);
      if (g.depth <= 0 && !g.ending) { g.won = true; g.ending = 1.4; s.say("Air."); return; }

      // ---- waves ----
      g.waveT += dt;
      const stage = g.depth > 72 ? 0 : g.depth > 44 ? 1 : g.depth > 16 ? 2 : 3;
      if (stage !== g.wave) {
        g.wave = stage;
        s.say(["Wreckage, coming down.", "Something is holding on to you.",
               "All of it at once now.", "The surface. Keep going."][stage]);
      }
      const rate = calm ? 0.62 : 1;

      // planks and crates out of the sinking boat
      if (stage <= 2 && Math.random() < dt * (2.6 + stage * 1.9) * rate) {
        g.bits.push({ x: rnd(10, W - 10), y: -16, vx: rnd(-18, 18), vy: rnd(52, 96),
                      w: rnd(16, 40), h: rnd(4, 9), a: rnd(0, 6.3), spin: rnd(-1.6, 1.6) });
      }
      // the drowned, coming up from below
      if (stage >= 1 && Math.random() < dt * (0.6 + stage * 0.55) * rate) {
        g.hands.push({ x: rnd(16, W - 16), y: H + 14, born: 0, grab: rnd(0.3, 0.7) });
      }
      // the undertow itself, firing from the dark
      if (stage >= 1 && Math.random() < dt * (1.4 + stage * 1.9) * rate) {
        const from = { x: rnd(0, W), y: H + 8 };
        if (stage === 1) {
          for (let i = 0; i < 7; i++) {
            const a = -Math.PI / 2 + (i - 3) * 0.2;
            g.bullets.push({ x: from.x, y: from.y, vx: Math.cos(a) * 92, vy: Math.sin(a) * 92, r: 4.4, kind: "ring" });
          }
        } else {
          const a = Math.atan2(g.y - from.y, g.x - from.x);
          for (let i = -1; i <= 1; i++)
            g.bullets.push({ x: from.x, y: from.y, vx: Math.cos(a + i * 0.16) * 146,
                             vy: Math.sin(a + i * 0.16) * 146, r: 4, kind: "aimed" });
        }
      }
      // the last stretch: a wall with a gap in it
      if (stage === 3 && Math.random() < dt * 1.05 * rate) {
        const gap = rnd(46, W - 46);
        for (let x = 10; x < W - 10; x += 19) {
          if (Math.abs(x - gap) < 38) continue;
          g.bullets.push({ x, y: H + 6, vx: 0, vy: -104, r: 4.6, kind: "wall" });
        }
      }

      // ---- move everything, and see what hit you ----
      const hitbox = 4.6;
      const safe = g.hurt > 0 || g.blinking > 0;
      const touched = () => {
        if (safe) return;
        g.breath -= 1;
        g.hurt = g.feather ? 1.15 : 0.85;
        s.shake = 13;
        if (g.breath <= 0 && !g.ending) { g.won = false; g.ending = 1.2; s.say("No more air."); }
        else s.say(["Keep going.", "Keep going.", "You can still make it.", "Nearly."][Math.min(3, g.maxBreath - g.breath)] || "Keep going.");
      };

      for (let i = g.bullets.length - 1; i >= 0; i--) {
        const b = g.bullets[i];
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.y < -24 || b.y > H + 28 || b.x < -24 || b.x > W + 24) { g.bullets.splice(i, 1); continue; }
        if (Math.hypot(b.x - g.x, b.y - g.y) < b.r + hitbox) { g.bullets.splice(i, 1); touched(); }
      }
      for (let i = g.bits.length - 1; i >= 0; i--) {
        const b = g.bits[i];
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.spin * dt;
        if (b.y > H + 30) { g.bits.splice(i, 1); continue; }
        if (Math.abs(b.x - g.x) < b.w / 2 + hitbox && Math.abs(b.y - g.y) < b.h / 2 + hitbox) { g.bits.splice(i, 1); touched(); }
      }
      for (let i = g.hands.length - 1; i >= 0; i--) {
        const h = g.hands[i];
        h.born += dt;
        h.y -= (16 + h.grab * 26) * dt;
        const dx = g.x - h.x;
        h.x += clamp(dx, -1, 1) * h.grab * 22 * dt;
        if (h.y < -30 || h.born > 14) { g.hands.splice(i, 1); continue; }
        if (h.born > 0.6 && Math.hypot(h.x - g.x, h.y - 8 - g.y) < 11 + hitbox) { g.hands.splice(i, 1); touched(); }
      }
      for (const b of g.bubbles) {
        b.y -= b.v * dt;
        if (b.y < -4) { b.y = H + rnd(0, 40); b.x = rnd(0, W); }
      }

      s.hud(
        meter("air", Math.max(0, g.breath), g.maxBreath, "#ffd98a") +
        `<span class="arcade-depth"><b>depth</b> ${Math.max(0, Math.round(g.depth))} fathoms</span>` +
        (g.blinks ? meter("fold", g.blinks, g.twice ? 3 : 0, "#9fe8ff") : "")
      );
    },

    draw(s) {
      const { ctx } = s, g = s.g;
      // water
      const deep = ctx.createLinearGradient(0, 0, 0, H);
      deep.addColorStop(0, "#2f6168"); deep.addColorStop(0.5, "#16363d"); deep.addColorStop(1, "#040f13");
      ctx.fillStyle = deep; ctx.fillRect(0, 0, W, H);

      // the surface, getting closer
      const surf = clamp((100 - g.depth) / 100, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.1 + surf * 0.55;
      const sky = ctx.createLinearGradient(0, -40, 0, 70);
      sky.addColorStop(0, "#dff6f0"); sky.addColorStop(1, "rgba(223,246,240,0)");
      ctx.fillStyle = sky; ctx.fillRect(0, -40, W, 110 + surf * 50);
      ctx.restore();

      // caustics
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.strokeStyle = "#bfeee6"; ctx.lineWidth = 2;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 16) {
          const y = 14 + r * 17 + Math.sin(x * 0.045 + s.t * (1.1 + r * 0.3)) * 7;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();

      // bubbles
      ctx.fillStyle = "rgba(214,244,239,0.42)";
      for (const b of g.bubbles) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill(); }

      // the boat, going down past you, lamp still lit
      const boatY = 40 + (100 - g.depth) * 3.1;
      if (boatY < H + 60) {
        ctx.save();
        ctx.translate(W - 96, boatY); ctx.rotate(-0.22);
        ctx.fillStyle = "#07171a";
        ctx.beginPath(); ctx.moveTo(-54, 0); ctx.lineTo(56, -10); ctx.lineTo(48, 22); ctx.lineTo(-44, 26); ctx.fill();
        ctx.fillRect(4, -46, 4, 40);
        const glow = ctx.createRadialGradient(6, -50, 2, 6, -50, 74);
        glow.addColorStop(0, "rgba(255,230,174,0.75)"); glow.addColorStop(1, "rgba(255,207,122,0)");
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(6, -50, 74, 0, 6.3); ctx.fill();
        ctx.restore();
      }

      // what the sea is throwing
      ctx.fillStyle = "#6b5332";
      for (const b of g.bits) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a);
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.fillStyle = "#4a3822"; ctx.fillRect(-b.w / 2, b.h / 2 - 2, b.w, 2);
        ctx.fillStyle = "#6b5332";
        ctx.restore();
      }

      for (const h of g.hands) {
        const a = clamp(h.born / 0.6, 0, 1);
        ctx.save(); ctx.globalAlpha = a * 0.82;
        ctx.strokeStyle = "#cfe3df"; ctx.lineWidth = 5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(h.x, h.y + 26); ctx.lineTo(h.x, h.y + 2); ctx.stroke();
        ctx.lineWidth = 3;
        for (let f = -2; f <= 2; f++) {
          ctx.beginPath(); ctx.moveTo(h.x, h.y + 4);
          ctx.lineTo(h.x + f * 5.5, h.y - 9 - Math.abs(f) * -2.5 + Math.sin(s.t * 3 + f) * 1.6);
          ctx.stroke();
        }
        ctx.restore();
      }

      for (const b of g.bullets) {
        ctx.save();
        ctx.shadowBlur = 9; ctx.shadowColor = b.kind === "wall" ? "#9fe8ff" : "#ffe6b0";
        ctx.fillStyle = b.kind === "wall" ? "#dff6ff" : b.kind === "aimed" ? "#ffd9a0" : "#fff3d6";
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3); ctx.fill();
        ctx.restore();
      }

      // you
      ctx.save();
      ctx.translate(g.x, g.y);
      if (g.blinking > 0) ctx.globalAlpha = 0.45;
      else if (g.hurt > 0) ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(s.t * 22));
      ctx.fillStyle = "#17272b";
      ctx.beginPath(); ctx.ellipse(0, 4, 7, 11, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#31494f";
      ctx.beginPath(); ctx.arc(0, -8, 6, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#17272b"; ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-5, 2); ctx.lineTo(-13, -8 + Math.sin(s.t * 7) * 3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(13, -8 + Math.cos(s.t * 7) * 3); ctx.stroke();
      if (g.feather) {
        ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(2, -10); ctx.lineTo(11, -17); ctx.stroke();
      }
      // the little hitbox, so the player can see what actually gets hit
      ctx.fillStyle = g.hurt > 0 ? "#ff9d7a" : "#ffe9bb";
      ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, 6.3); ctx.fill();
      ctx.restore();

      // how far you can see
      if (g.light < 300) {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        const dark = ctx.createRadialGradient(g.x, g.y, g.light * 0.4, g.x, g.y, g.light);
        dark.addColorStop(0, "rgba(2,10,13,0)");
        dark.addColorStop(1, "rgba(2,10,13,0.93)");
        ctx.fillStyle = dark; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      if (g.ending) {
        ctx.save();
        ctx.globalAlpha = clamp(1 - g.ending / 1.4, 0, 1);
        ctx.fillStyle = g.won ? "rgba(236,248,255,0.92)" : "rgba(2,8,11,0.92)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
  };

  // =====================================================================
  //  THE BELL. Not a shooter. A rhythm, and your arms give out.
  // =====================================================================

  const bell = {
    describe: "A game. Ring a heavy bell in time with its swing by pressing the space bar, or tapping. There is a button to skip it.",

    setup(s, ui) {
      s.g = {
        angle: 0, speed: 1.15, dir: 1,
        resonance: 0, swings: 0, needed: 10,
        window: 0.17, lastHit: -9, judged: "", judgeT: 0,
        rings: [], armed: true, misses: 0, done: 0,
      };
      s.say("Ring it when the bell is straight down. Space bar, or tap the picture.");
      ui.button("Stop ringing", "arcade-give", () => s.lose());
      ui.button("Skip this and keep reading", "arcade-skip", () => { s.say("The bell carries anyway."); ui.finish(true, "skipped"); });
    },

    step(s, dt) {
      const g = s.g;
      if (g.done) { g.done -= dt; if (g.done <= 0) (g.won ? s.win() : s.lose()); return; }

      const was = Math.sin(g.angle);
      g.angle += g.speed * dt * 3.1;
      const now = Math.sin(g.angle);
      if (was <= 0 && now > 0) g.swings++;                   // passed through the bottom

      // how far from the bottom of the swing, 0 is perfect
      const off = Math.abs(Math.sin(g.angle));

      // Fade first, then the hit, then judge. (The other way round, a hit that
      // reaches 100 is knocked back under it before anything checks, and the
      // bell can never be rung at all.)
      g.resonance = Math.max(0, g.resonance - dt * 2.6);

      const pressed = (s.keys[" "] || s.pointer.down);
      if (pressed && g.armed) {
        g.armed = false;
        if (off < g.window) {
          const good = 1 - off / g.window;
          g.resonance = clamp(g.resonance + 7 + good * 9, 0, 100);
          g.speed = Math.min(2.5, g.speed + 0.07);
          g.judged = good > 0.72 ? "dead on" : "good";
          g.rings.push({ r: 24, a: 0.85 });
          s.shake = 3 + good * 4;
        } else {
          g.resonance = clamp(g.resonance - 9, 0, 100);
          g.misses++;
          g.judged = "early" + (Math.sin(g.angle) > 0 ? "" : "");
          g.judged = Math.cos(g.angle) > 0 ? "too early" : "too late";
          if (g.misses === 4) { g.window = 0.24; s.say("Your arms are going. The bell will take a wider swing."); }
        }
        g.judgeT = 0.7;
      }
      if (!pressed) g.armed = true;

      g.judgeT = Math.max(0, g.judgeT - dt);
      for (let i = g.rings.length - 1; i >= 0; i--) {
        const r = g.rings[i]; r.r += dt * 150; r.a -= dt * 0.85;
        if (r.a <= 0) g.rings.splice(i, 1);
      }

      if (g.resonance >= 100 && !g.done) { g.won = true; g.done = 1.3; s.say("The whole headland is ringing."); }
      if (g.swings > 34 && !g.done) { g.won = false; g.done = 1.2; s.say("You cannot lift your arms any more."); }

      s.hud(`<span class="arcade-ring"><b>carrying</b> <i style="--w:${Math.round(g.resonance)}%"></i> ${Math.round(g.resonance)}%</span>` +
            (g.judgeT > 0 ? `<span class="arcade-judge">${g.judged}</span>` : ""));
    },

    draw(s) {
      const { ctx } = s, g = s.g;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#232a3c"); sky.addColorStop(1, "#8b8b99");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      // fog, pushed back by how loud you are
      ctx.save();
      ctx.globalAlpha = 0.32 * (1 - g.resonance / 130);
      ctx.fillStyle = "#dfe2ea";
      for (let i = 0; i < 4; i++) {
        const y = 70 + i * 56 + Math.sin(s.t * 0.4 + i) * 7;
        ctx.beginPath(); ctx.ellipse((s.t * (12 + i * 7) + i * 170) % (W + 320) - 160, y, 150, 15, 0, 0, 6.3); ctx.fill();
      }
      ctx.restore();

      ctx.fillStyle = "#4f5340"; ctx.fillRect(0, 286, W, H - 286);

      // sound going out
      for (const r of g.rings) {
        ctx.save(); ctx.globalAlpha = Math.max(0, r.a);
        ctx.strokeStyle = "#f6f3e6"; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(W / 2, 170, r.r, 0, 6.3); ctx.stroke();
        ctx.restore();
      }

      // the shelter
      ctx.fillStyle = "#8a8574";
      ctx.beginPath(); ctx.moveTo(120, 86); ctx.lineTo(240, 34); ctx.lineTo(360, 86); ctx.lineTo(352, 94); ctx.lineTo(240, 46); ctx.lineTo(128, 94); ctx.fill();
      ctx.fillStyle = "#6a6659"; ctx.fillRect(126, 86, 22, 200); ctx.fillRect(332, 86, 22, 200);
      ctx.fillStyle = "#4a4538"; ctx.fillRect(232, 78, 16, 14);

      // the bell
      const a = Math.sin(g.angle) * 0.42;
      ctx.save();
      ctx.translate(240, 92); ctx.rotate(a);
      const bronze = ctx.createLinearGradient(-50, 0, 50, 40);
      bronze.addColorStop(0, "#4e3c18"); bronze.addColorStop(0.4, "#b08d35");
      bronze.addColorStop(0.6, "#e3c96f"); bronze.addColorStop(1, "#5c4719");
      ctx.fillStyle = bronze;
      ctx.beginPath();
      ctx.moveTo(0, 4); ctx.quadraticCurveTo(-46, 12, -50, 74); ctx.lineTo(-56, 86);
      ctx.lineTo(56, 86); ctx.lineTo(50, 74); ctx.quadraticCurveTo(46, 12, 0, 4); ctx.fill();
      ctx.fillStyle = "#8f742c"; ctx.fillRect(-56, 86, 112, 9);
      ctx.fillStyle = "#443e2d"; ctx.fillRect(-5, 12, 10, 70);
      ctx.beginPath(); ctx.arc(0, 90, 10, 0, 6.3); ctx.fill();
      ctx.restore();

      // where the bottom of the swing is
      const off = Math.abs(Math.sin(g.angle));
      const hot = off < g.window;
      ctx.save();
      ctx.globalAlpha = hot ? 0.9 : 0.3;
      ctx.strokeStyle = hot ? "#ffe9a8" : "#cfd3dc";
      ctx.lineWidth = hot ? 4 : 2;
      ctx.beginPath(); ctx.moveTo(240, 196); ctx.lineTo(240, 232); ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.5; ctx.strokeStyle = "#cfd3dc"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(240, 92, 128, 2.3, 0.84); ctx.stroke();
      ctx.restore();

      if (g.done) {
        ctx.save();
        ctx.globalAlpha = clamp(1 - g.done / 1.3, 0, 1);
        ctx.fillStyle = g.won ? "rgba(255,246,222,0.9)" : "rgba(14,16,22,0.88)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
  };


  // =====================================================================
  //  THE DUEL. Turn by turn, with whatever you caught and brought.
  // =====================================================================

  // The three creatures the engine knows. A writer adds one to the story with
  // "catch: clackers". Moves marked with needs: only appear if the player is
  // carrying that item, which is the whole point of them.
  const CREATURES = {
    clackers: {
      title: "Clackers", kind: "a pocket crab",
      hp: 30, blurb: "A crab the size of a dinner plate. Holds grudges. Holds everything.",
      moves: [
        { name: "Pinch",        dmg: [5, 8],   say: "Clackers pinches. It is not subtle." },
        { name: "Sidle",        dmg: [0, 0],   guard: 0.65, say: "Clackers goes sideways, which is the whole trick." },
        { name: "Bubble Rasp",  dmg: [3, 5],   wobble: 0.5, say: "A sheet of bubbles. Nobody can see anything." },
        { name: "Button Flash", dmg: [11, 16], needs: "a brass button",
          say: "Clackers turns the brass button to the light, and the light does the rest." },
      ],
    },
    squib: {
      title: "Squib", kind: "a very small squid",
      hp: 24, blurb: "Eight arms, no plan, tremendous commitment.",
      moves: [
        { name: "Tug",      dmg: [4, 7],  say: "Squib pulls, with all eight, in eight directions." },
        { name: "Ink",      dmg: [2, 4],  wobble: 0.8, say: "Ink. Everywhere. Mostly on you." },
        { name: "Jet",      dmg: [0, 0],  guard: 0.7,  say: "Squib is suddenly four feet to the left." },
        { name: "Lamplight", dmg: [10, 15], needs: "lantern", say: "Squib holds the lantern up and goes a colour nobody has a name for." },
      ],
    },
    pib: {
      title: "Pib", kind: "one gull chick",
      hp: 26, blurb: "Cannot fly. Will not be told.",
      moves: [
        { name: "Peck",    dmg: [4, 7],  say: "Pib pecks, repeatedly, at about knee height." },
        { name: "Shriek",  dmg: [3, 6],  wobble: 0.6, say: "The noise is genuinely unbelievable." },
        { name: "Fluff",   dmg: [0, 0],  guard: 0.6,  say: "Pib doubles in size and is still a chick." },
        { name: "The Chorus", dmg: [12, 17], needs: "white feather",
          say: "Pib holds up the feather and something very old answers." },
      ],
    },
  };

  // A foe is made up from its name and level, so a writer can put anybody in
  // a duel with one line and the engine will still draw them the same way twice.
  function makeFoe(name, level) {
    const r = seed(name.toLowerCase());
    const shape = Math.floor(r() * 3);
    const hue = Math.floor(r() * 360);
    const spikes = 3 + Math.floor(r() * 5);
    return {
      title: name, level,
      hp: 16 + level * 7, max: 16 + level * 7,
      hit: [2 + level, 4 + level * 2],
      shape, hue, spikes, r,
      moves: ["lunges", "sets itself", "comes in low", "feints, then doesn't", "takes its time"],
    };
  }

  const duel = {
    describe: "A game. You and the creature you caught take turns fighting somebody, by picking a move from a list of buttons. There is a button to run away.",

    setup(s, ui) {
      const which = s.creatures.find((c) => CREATURES[c]) || null;
      const spec = which ? CREATURES[which] : null;
      const level = which ? (Memory.creature(which) || { level: 1 }).level : 1;
      const against = (s.scene && s.scene.against) || { who: "something", level: 2 };

      s.g = {
        which, spec, level,
        me: spec ? { hp: spec.hp + level * 6, max: spec.hp + level * 6, guard: 0, wobble: 0 } : null,
        foe: makeFoe(against.who, against.level),
        turn: "you", busy: 0, lunge: 0, foeLunge: 0, flash: 0, foeFlash: 0,
        bits: [], log: "", done: 0, round: 0,
      };
      s.g.foe.wobble = 0;

      if (!spec) {
        s.say("You have not caught anything, and you are not going to win this with your hands.");
        ui.button("Back away", "arcade-give", () => s.lose());
        ui.button("Skip this and keep reading", "arcade-skip", () => ui.finish(true, "skipped"));
        return;
      }

      const rec = Memory.creature(which) || { wins: 0, losses: 0 };
      s.say(`${spec.title}, level ${level}. ${rec.wins ? rec.wins + " won, " + rec.losses + " lost." : spec.blurb}`);

      s.g.moveButtons = [];
      for (const mv of spec.moves) {
        if (mv.needs && !s.items.has(mv.needs)) continue;
        const b = ui.button(mv.name, "arcade-move", () => useMove(s, mv));
        s.g.moveButtons.push(b);
      }
      ui.button("Run away", "arcade-give", () => { s.say(`${spec.title} is already halfway up the beach.`); s.lose(); });
      ui.button("Skip this and keep reading", "arcade-skip", () => ui.finish(true, "skipped"));
    },

    step(s, dt) {
      const g = s.g;
      if (g.done) { g.done -= dt; if (g.done <= 0) (g.won ? s.win() : s.lose()); return; }
      g.lunge = Math.max(0, g.lunge - dt * 3);
      g.foeLunge = Math.max(0, g.foeLunge - dt * 3);
      g.flash = Math.max(0, g.flash - dt * 3);
      g.foeFlash = Math.max(0, g.foeFlash - dt * 3);
      for (let i = g.bits.length - 1; i >= 0; i--) {
        const b = g.bits[i];
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 320 * dt; b.life -= dt;
        if (b.life <= 0) g.bits.splice(i, 1);
      }
      if (g.busy > 0) {
        g.busy -= dt;
        if (g.busy <= 0 && g.turn === "foe") foeTurn(s);
      }
      if (!g.me) return;
      s.hud(`<span class="arcade-duel"><b>${g.spec.title}</b> ${Math.max(0, Math.ceil(g.me.hp))}</span>` +
            `<span class="arcade-duel foe"><b>${g.foe.title}</b> ${Math.max(0, Math.ceil(g.foe.hp))}</span>`);
      for (const b of g.moveButtons || []) b.disabled = g.turn !== "you" || g.busy > 0 || !!g.done;
    },

    draw(s) {
      const { ctx } = s, g = s.g;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#1b2433"); sky.addColorStop(1, "#4b4a44");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#6f6a58"; ctx.fillRect(0, 262, W, H - 262);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(120, 276, 56, 11, 0, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.ellipse(348, 252, 62, 12, 0, 0, 6.3); ctx.fill();

      if (g.me) {
        ctx.save();
        ctx.translate(120 + g.lunge * 44, 240);
        if (g.flash > 0) ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.t * 26));
        drawCreature(ctx, g.which, s.t, g.me.guard > 0);
        ctx.restore();
        bar(g.me.hp, g.me.max, 120, "#7dd48a", ctx, 60, 300);
        ctx.fillStyle = "#e9e6dc"; ctx.font = "12px ui-monospace, Menlo, monospace";
        ctx.fillText(g.spec.title + "  lv " + g.level, 60, 296);
      }

      ctx.save();
      ctx.translate(348 - g.foeLunge * 44, 212);
      if (g.foeFlash > 0) ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(s.t * 26));
      drawFoe(ctx, g.foe, s.t);
      ctx.restore();
      bar(g.foe.hp, g.foe.max, 120, "#e0795f", ctx, 288, 300);
      ctx.fillStyle = "#e9e6dc"; ctx.font = "12px ui-monospace, Menlo, monospace";
      ctx.fillText(g.foe.title + "  lv " + g.foe.level, 288, 296);

      for (const b of g.bits) {
        ctx.globalAlpha = clamp(b.life * 2, 0, 1);
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x, b.y, b.s, b.s);
        ctx.globalAlpha = 1;
      }

      if (g.log) {
        ctx.fillStyle = "rgba(10,12,16,0.78)";
        ctx.fillRect(14, 16, W - 28, 40);
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.strokeRect(14.5, 16.5, W - 29, 39);
        ctx.fillStyle = "#f1eee4"; ctx.font = "13px Georgia, serif";
        wrap(ctx, g.log, 24, 34, W - 48, 16);
      }

      if (g.done) {
        ctx.save();
        ctx.globalAlpha = clamp(1 - g.done / 1.4, 0, 1);
        ctx.fillStyle = g.won ? "rgba(255,250,236,0.88)" : "rgba(10,10,14,0.88)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
  };

  function wrap(ctx, text, x, y, maxw, lh) {
    const words = String(text).split(" ");
    let line = "", yy = y;
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (ctx.measureText(test).width > maxw && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
      else line = test;
    }
    ctx.fillText(line, x, yy);
  }

  function spray(g, x, y, colour, n) {
    for (let i = 0; i < n; i++)
      g.bits.push({ x, y, vx: rnd(-130, 130), vy: rnd(-200, -40), s: rnd(2, 5), c: colour, life: rnd(0.3, 0.7) });
  }

  function useMove(s, mv) {
    const g = s.g;
    if (g.turn !== "you" || g.busy > 0 || g.done) return;
    g.round++;
    g.lunge = 1; g.busy = 0.85;
    const hit = Math.round(rnd(mv.dmg[0], mv.dmg[1]) * (1 + g.level * 0.12));
    if (hit > 0) {
      g.foe.hp -= hit;
      g.foeFlash = 1;
      s.shake = 9;
      spray(g, 348, 212, "#ffd9a0", 12);
      g.log = mv.say + "  (" + hit + ")";
    } else {
      g.log = mv.say;
    }
    g.me.guard = mv.guard || 0;
    if (mv.wobble) g.foe.wobble = mv.wobble;
    if (g.foe.hp <= 0 && !g.done) {
      g.foe.hp = 0; g.won = true; g.done = 1.4;
      g.log = g.foe.title + " has had enough and says so.";
      const c = Memory.duelOver(g.which, true);
      s.say(c && c.level > g.level ? `${g.spec.title} is level ${c.level} now.` : `${g.spec.title} wins.`);
      return;
    }
    g.turn = "foe";
  }

  function foeTurn(s) {
    const g = s.g;
    if (g.done) return;
    const miss = Math.random() < (g.me.guard + (g.foe.wobble || 0)) * 0.8;
    g.foeLunge = 1; g.busy = 0.85;
    g.me.guard = 0; g.foe.wobble = 0;
    if (miss) {
      g.log = g.foe.title + " " + g.foe.moves[Math.floor(Math.random() * g.foe.moves.length)] + ", and misses.";
    } else {
      const hit = Math.round(rnd(g.foe.hit[0], g.foe.hit[1]));
      g.me.hp -= hit;
      g.flash = 1; s.shake = 11;
      spray(g, 120, 240, "#9fe8ff", 10);
      g.log = g.foe.title + " " + g.foe.moves[Math.floor(Math.random() * g.foe.moves.length)] + ".  (" + hit + ")";
    }
    if (g.me.hp <= 0 && !g.done) {
      g.me.hp = 0; g.won = false; g.done = 1.3;
      g.log = g.spec.title + " sits down and will not get up.";
      Memory.duelOver(g.which, false);
      return;
    }
    g.turn = "you";
  }

  function drawCreature(ctx, which, t, guarding) {
    const bob = Math.sin(t * 2.4) * 3;
    if (which === "clackers") {
      ctx.save(); ctx.translate(0, bob);
      ctx.fillStyle = "#b9502f";
      ctx.beginPath(); ctx.ellipse(0, 0, 34, 24, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#8e3a20";
      ctx.beginPath(); ctx.ellipse(0, 6, 34, 18, 0, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#8e3a20"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
        const a = 0.5 + i * 0.45;
        ctx.beginPath(); ctx.moveTo(sx * 24, 10);
        ctx.lineTo(sx * (36 + i * 7), 10 + Math.sin(t * 6 + i) * 4 + i * 6); ctx.stroke();
      }
      const claw = guarding ? 0.5 : Math.sin(t * 5) * 0.25;
      for (const sx of [-1, 1]) {
        ctx.save(); ctx.translate(sx * 30, -10); ctx.rotate(sx * claw);
        ctx.fillStyle = "#c95c35";
        ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#8e3a20";
        ctx.beginPath(); ctx.moveTo(sx * 6, -6); ctx.lineTo(sx * 20, -2); ctx.lineTo(sx * 6, 2); ctx.fill();
        ctx.restore();
      }
      for (const sx of [-1, 1]) {
        ctx.strokeStyle = "#8e3a20"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx * 9, -18); ctx.lineTo(sx * 11, -30); ctx.stroke();
        ctx.fillStyle = "#17181c"; ctx.beginPath(); ctx.arc(sx * 11, -32, 4.5, 0, 6.3); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(sx * 12, -33.5, 1.6, 0, 6.3); ctx.fill();
      }
      ctx.restore(); return;
    }
    if (which === "squib") {
      ctx.save(); ctx.translate(0, bob);
      ctx.fillStyle = "#9c5fa8";
      ctx.beginPath(); ctx.ellipse(0, -8, 22, 28, 0, 0, 6.3); ctx.fill();
      ctx.strokeStyle = "#7d4788"; ctx.lineWidth = 5; ctx.lineCap = "round";
      for (let i = 0; i < 8; i++) {
        const a = -2.6 + i * 0.37;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 14, 16);
        ctx.quadraticCurveTo(Math.cos(a) * 26, 34 + Math.sin(t * 5 + i) * 6, Math.cos(a) * 34, 48);
        ctx.stroke();
      }
      ctx.fillStyle = "#17181c";
      ctx.beginPath(); ctx.arc(-8, -12, 5, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(9, -12, 5, 0, 6.3); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(-6.5, -13.5, 1.8, 0, 6.3); ctx.fill();
      ctx.beginPath(); ctx.arc(10.5, -13.5, 1.8, 0, 6.3); ctx.fill();
      ctx.restore(); return;
    }
    ctx.save(); ctx.translate(0, bob);
    ctx.fillStyle = "#e8e4d6";
    ctx.beginPath(); ctx.ellipse(0, 4, 26, 22, 0, 0, 6.3); ctx.fill();
    ctx.beginPath(); ctx.arc(10, -18, 14, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#cfc9b6";
    ctx.beginPath(); ctx.ellipse(-14, 2, 14, 11, guarding ? -0.5 : 0.2, 0, 6.3); ctx.fill();
    ctx.fillStyle = "#e0922f";
    ctx.beginPath(); ctx.moveTo(22, -18); ctx.lineTo(36, -14); ctx.lineTo(22, -10); ctx.fill();
    ctx.strokeStyle = "#c98b2e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-4, 24); ctx.lineTo(-4, 34); ctx.moveTo(6, 24); ctx.lineTo(6, 34); ctx.stroke();
    ctx.fillStyle = "#17181c"; ctx.beginPath(); ctx.arc(15, -21, 3.6, 0, 6.3); ctx.fill();
    ctx.restore();
  }

  function drawFoe(ctx, foe, t) {
    const bob = Math.sin(t * 1.8 + 1) * 4;
    const base = `hsl(${foe.hue} 32% 34%)`, edge = `hsl(${foe.hue} 36% 22%)`, eye = `hsl(${foe.hue} 70% 76%)`;
    ctx.save(); ctx.translate(0, bob);
    ctx.fillStyle = base;
    if (foe.shape === 0) {
      ctx.beginPath(); ctx.ellipse(0, 0, 44, 34, 0, 0, 6.3); ctx.fill();
    } else if (foe.shape === 1) {
      ctx.beginPath(); ctx.moveTo(-46, 30); ctx.lineTo(0, -38); ctx.lineTo(46, 30); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.283, rr = 30 + (i % 2 ? 16 : 0);
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = edge; ctx.lineWidth = 5; ctx.lineCap = "round";
    for (let i = 0; i < foe.spikes; i++) {
      const a = -2.4 + (i / Math.max(1, foe.spikes - 1)) * 4.8;
      ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 24);
      ctx.lineTo(Math.cos(a) * (50 + Math.sin(t * 4 + i) * 5), Math.sin(a) * (40 + Math.sin(t * 4 + i) * 4));
      ctx.stroke();
    }
    ctx.fillStyle = eye;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(-16 + i * 16, -8 + (i % 2) * 7, 4.2, 0, 6.3); ctx.fill();
    }
    ctx.fillStyle = "#0d0f13";
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.arc(-16 + i * 16, -8 + (i % 2) * 7, 1.9, 0, 6.3); ctx.fill();
    }
    ctx.restore();
  }


  // =====================================================================
  //  THE CLICKER. A sand lighthouse, one handful at a time.
  // =====================================================================

  const SHOP = [
    { id: "bucket",  name: "A bucket",            cost: 25,   per: 0,   click: 2,
      say: "It has a hole in it. Two handfuls at a time anyway." },
    { id: "spade",   name: "A child's spade",     cost: 140,  per: 0,   click: 5,
      say: "Red plastic. Left on this beach in about 1986." },
    { id: "gull",    name: "A gull who owes you", cost: 90,   per: 2,
      say: "It brings one beakful at a time and looks at you the whole while." },
    { id: "chorus",  name: "Three more gulls",    cost: 600,  per: 9,
      say: "Word gets round." },
    { id: "moat",    name: "Dig the moat first",  cost: 1800, per: 34,
      say: "The sea does half the work if you let it in on purpose." },
    { id: "tide",    name: "Time it with the tide", cost: 7000, per: 120,
      say: "Every seventh wave brings more than it takes." },
  ];
  const SAND_TARGET = 16000;

  const clicker = {
    describe: "A game. Click or tap the sand to pile it up, and spend it on things that pile it up faster, until the tower is finished. There is a button to skip it.",

    setup(s, ui) {
      s.g = {
        sand: 0, total: 0, per: 0, click: 1, owned: {},
        pop: [], grains: [], was: false, done: 0, shown: "",
        lamp: s.items.has("lantern"), crab: s.creatures.includes("clackers"),
      };
      if (s.g.lamp) s.g.click += 1;
      if (s.g.crab) s.g.per += 3;

      s.say("Click the sand. " + (s.g.crab ? "Clackers is already digging. " : "") +
            (s.g.lamp ? "The lantern helps you see what you are doing. " : "") +
            "You need " + SAND_TARGET.toLocaleString() + " handfuls for a tower.");

      s.g.shopButtons = SHOP.map((u) => {
        const b = ui.button("", "arcade-buy", () => buy(s, u));
        b.dataset.id = u.id;
        return b;
      });
      ui.button("Give up and go back", "arcade-give", () => s.lose());
      ui.button("Skip this and keep reading", "arcade-skip", () => { s.say("It gets built."); ui.finish(true, "skipped"); });
    },

    step(s, dt) {
      const g = s.g;
      if (g.done) { g.done -= dt; if (g.done <= 0) (g.won ? s.win() : s.lose()); return; }

      const down = s.pointer.down || s.keys[" "];
      if (down && !g.was) {
        g.sand += g.click; g.total += g.click;
        g.pop.push({ x: s.pointer.x, y: s.pointer.y, n: g.click, life: 0.9 });
        for (let i = 0; i < 4; i++)
          g.grains.push({ x: s.pointer.x, y: s.pointer.y, vx: rnd(-70, 70), vy: rnd(-150, -40), life: rnd(0.4, 0.9) });
        s.shake = 2;
      }
      g.was = down;

      g.sand += g.per * dt; g.total += g.per * dt;

      for (let i = g.pop.length - 1; i >= 0; i--) { g.pop[i].life -= dt; g.pop[i].y -= dt * 34; if (g.pop[i].life <= 0) g.pop.splice(i, 1); }
      for (let i = g.grains.length - 1; i >= 0; i--) {
        const b = g.grains[i]; b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 420 * dt; b.life -= dt;
        if (b.life <= 0) g.grains.splice(i, 1);
      }

      for (const b of g.shopButtons) {
        const u = SHOP.find((x) => x.id === b.dataset.id);
        const have = g.owned[u.id] || 0;
        const cost = Math.round(u.cost * Math.pow(1.7, have));
        const label = `${u.name}${have ? " ×" + have : ""} — ${cost.toLocaleString()}`;
        if (b.textContent !== label) b.textContent = label;
        b.disabled = g.sand < cost;
        b.title = u.say;
      }

      if (g.total >= SAND_TARGET && !g.done) {
        g.won = true; g.done = 1.6;
        Memory.sandRecord(Math.round(g.total));
        s.say("It is finished, and it is better than the real one.");
      }

      s.hud(`<span class="arcade-sand"><b>sand</b> ${Math.floor(g.sand).toLocaleString()}</span>` +
            `<span class="arcade-sand"><b>a second</b> ${g.per}</span>` +
            `<span class="arcade-sand"><b>tower</b> ${Math.min(100, Math.floor(g.total / SAND_TARGET * 100))}%</span>`);
    },

    draw(s) {
      const { ctx } = s, g = s.g;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#2d3a52"); sky.addColorStop(0.62, "#7f7f93"); sky.addColorStop(1, "#c7a78f");
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#4b5a72"; ctx.fillRect(0, 214, W, 34);
      ctx.strokeStyle = "rgba(200,214,230,0.4)"; ctx.lineWidth = 2;
      for (let r = 0; r < 2; r++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 14) {
          const y = 220 + r * 14 + Math.sin(x * 0.05 + s.t * (1 + r)) * 3;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      const sand = ctx.createLinearGradient(0, 248, 0, H);
      sand.addColorStop(0, "#b3a68c"); sand.addColorStop(1, "#8d8168");
      ctx.fillStyle = sand; ctx.fillRect(0, 248, W, H - 248);

      // the tower, going up as the sand comes in
      const p = clamp(g.total / SAND_TARGET, 0, 1);
      const h = 10 + p * 170;
      const cx = 240, base = 300;
      ctx.fillStyle = "#9a8c6e";
      ctx.beginPath();
      ctx.moveTo(cx - 44, base); ctx.lineTo(cx - 44 + 16 * p, base - h);
      ctx.lineTo(cx + 44 - 16 * p, base - h); ctx.lineTo(cx + 44, base); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.beginPath();
      ctx.moveTo(cx - 44, base); ctx.lineTo(cx - 44 + 16 * p, base - h);
      ctx.lineTo(cx - 14, base - h); ctx.lineTo(cx - 10, base); ctx.closePath(); ctx.fill();
      for (let b2 = 0; b2 < Math.floor(p * 7); b2++) {
        const y = base - (b2 + 1) * (h / 7);
        ctx.strokeStyle = "rgba(90,78,58,0.5)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx - 42 + 15 * p * ((b2 + 1) / 7), y); ctx.lineTo(cx + 42 - 15 * p * ((b2 + 1) / 7), y); ctx.stroke();
      }
      if (p > 0.72) {
        ctx.fillStyle = "#6f6450";
        ctx.fillRect(cx - 24, base - h - 12, 48, 12);
        if (p > 0.9) {
          const glow = ctx.createRadialGradient(cx, base - h - 22, 2, cx, base - h - 22, 46);
          glow.addColorStop(0, "rgba(180,235,170,0.95)"); glow.addColorStop(1, "rgba(180,235,170,0)");
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, base - h - 22, 46, 0, 6.3); ctx.fill();
          ctx.fillStyle = "#cdf0bd"; ctx.beginPath(); ctx.arc(cx, base - h - 22, 6, 0, 6.3); ctx.fill();
        }
      }
      if (g.owned.moat) {
        ctx.strokeStyle = "#5d6f86"; ctx.lineWidth = 7;
        ctx.beginPath(); ctx.ellipse(cx, base + 4, 86, 17, 0, 0, 6.3); ctx.stroke();
      }

      // the gulls you bought, bringing it in
      const birds = (g.owned.gull || 0) + (g.owned.chorus || 0) * 3;
      for (let i = 0; i < Math.min(12, birds); i++) {
        const a = s.t * 0.7 + i * 1.3;
        const x = cx + Math.cos(a) * (120 + i * 9), y = 150 + Math.sin(a * 1.3) * 34 + i * 3;
        ctx.strokeStyle = "#f2f0e6"; ctx.lineWidth = 2; ctx.lineCap = "round";
        const f = Math.sin(s.t * 9 + i) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x - 4, y - 7 * f, x, y);
        ctx.quadraticCurveTo(x + 4, y - 7 * f, x + 9, y); ctx.stroke();
      }
      if (g.crab) {
        const cxx = 86 + Math.sin(s.t * 1.4) * 22;
        ctx.save(); ctx.translate(cxx, 286); ctx.scale(0.42, 0.42);
        drawCreature(ctx, "clackers", s.t, false);
        ctx.restore();
      }

      ctx.fillStyle = "#cfc3a4";
      for (const b of g.grains) { ctx.globalAlpha = clamp(b.life * 1.6, 0, 1); ctx.fillRect(b.x, b.y, 2.5, 2.5); }
      ctx.globalAlpha = 1;
      ctx.font = "bold 13px ui-monospace, Menlo, monospace";
      for (const b of g.pop) {
        ctx.globalAlpha = clamp(b.life, 0, 1);
        ctx.fillStyle = "#fff6d8";
        ctx.fillText("+" + b.n, b.x - 6, b.y);
      }
      ctx.globalAlpha = 1;

      if (!g.total) {
        ctx.fillStyle = "rgba(10,12,16,0.6)";
        ctx.fillRect(W / 2 - 110, 70, 220, 30);
        ctx.fillStyle = "#f3f0e6"; ctx.font = "14px Georgia, serif"; ctx.textAlign = "center";
        ctx.fillText("click the sand", W / 2, 90);
        ctx.textAlign = "left";
      }

      if (g.done) {
        ctx.save();
        ctx.globalAlpha = clamp(1 - g.done / 1.6, 0, 1);
        ctx.fillStyle = g.won ? "rgba(255,246,222,0.9)" : "rgba(14,16,22,0.86)";
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    },
  };

  function buy(s, u) {
    const g = s.g;
    const have = g.owned[u.id] || 0;
    const cost = Math.round(u.cost * Math.pow(1.7, have));
    if (g.sand < cost) return;
    g.sand -= cost;
    g.owned[u.id] = have + 1;
    if (u.per) g.per += u.per;
    if (u.click) g.click += u.click;
    s.say(u.say);
    s.shake = 5;
  }

  const GAMES = { undertow, bell, duel, clicker };

  // balance.html uses this to step a turn-based game on by hand between
  // button presses. Nothing in the real page calls it.
  const live = new Map();
  function _tick(mount, dt) {
    const e = live.get(mount);
    if (!e || e.over()) return;
    e.state.t += dt;
    e.game.step(e.state, dt);
  }

  return { play, has: (n) => !!GAMES[n], _tick, _live: live };
})();
