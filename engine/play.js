/* Engine: plays the story. Loads the files in story/, shows one scene at a
   time, keeps track of what the player is carrying, and remembers which
   endings this browser has found. */

const Play = (() => {
  const $ = (id) => document.getElementById(id);
  const S = {
    story: null, live: [], files: [], draft: null,
    scene: null, home: null, items: new Set(), history: [], imageProblems: [],
    game: null, revealing: null, creatures: [], theme: "paper", showing: "", themeTimer: 0,
  };
  const ENDINGS_KEY = "adventure-endings:" + location.pathname;

  // ---------- loading ----------

  async function load() {
    const fresh = "?v=" + Date.now();
    const found = await Promise.all(Story.FILES.map(async (name) => {
      try {
        const r = await fetch("story/" + name + fresh);
        return r.ok ? { name, text: await r.text() } : null;
      } catch (e) {
        return null;
      }
    }));
    return found.filter(Boolean);
  }

  function rebuild(files) {
    S.files = files;
    S.story = Story.build(files);
    S.imageProblems = [];
    S.theme = S.story.theme;
    setTheme(S.story.theme);
    $("title").textContent = S.story.title || "Untitled story";
    document.title = S.story.title || "Adventure";
    $("byline").textContent = S.story.by ? "by " + S.story.by : "";
    $("byline").hidden = !S.story.by;
    checkImages();
    showBadge();
  }

  // The story picks a theme, and any scene can change it from there on.
  // The page cross-fades rather than snapping, so a scene can genuinely
  // change the weather.
  function setTheme(name) {
    if (!name || S.showing === name) return;
    S.showing = name;
    const keep = [...document.body.classList].filter((c) => c.startsWith("fx-"));
    document.body.className = ["theme-" + name, "theme-turning"].concat(keep).join(" ");
    clearTimeout(S.themeTimer);
    S.themeTimer = setTimeout(() => document.body.classList.remove("theme-turning"), 700);
  }

  // Pictures can only be checked by trying to load them.
  function checkImages() {
    const story = S.story;
    const seen = new Set();
    for (const im of story.images) {
      if (seen.has(im.src)) continue;
      seen.add(im.src);
      const probe = new Image();
      probe.onerror = () => {
        if (S.story !== story) return;
        S.imageProblems.push({ level: "error", file: im.file, line: im.line,
          message: `The picture ${im.src} can't be found.`,
          fix: "Check the spelling and the capital letters: on the web, Bridge.svg and bridge.svg are two different files. Pictures go in the images folder." });
        showBadge();
      };
      probe.src = im.src;
    }
  }

  function problems() {
    const rank = (p) => (p.level === "error" ? 0 : 1e7) + Math.max(0, Story.FILES.indexOf(p.file)) * 1e4 + p.line;
    return S.story.problems.concat(S.imageProblems).sort((a, b) => rank(a) - rank(b));
  }

  // ---------- playing ----------

  function go(name, how) {
    const s = S.story.scenes[name];
    if (!s) return;
    if (S.scene && how !== "fresh") S.history.push({ scene: S.scene, items: new Set(S.items) });
    S.scene = name;
    const got = [];
    for (const it of s.gets) if (!S.items.has(it)) { S.items.add(it); got.push(it); Memory.gotItem(it); }
    const dropped = [];
    for (const it of s.loses) if (S.items.delete(it)) dropped.push(it);
    const newlyKept = [];
    for (const k of s.keeps) if (Memory.keep(k)) newlyKept.push(k);
    const newlyCaught = [];
    for (const c of s.catches) { if (Memory.caught(c)) newlyCaught.push(c); if (!S.creatures.includes(c)) S.creatures.push(c); }
    Memory.sawScene(name);
    if (s.ending) { noteEnding(name); Memory.reachedEnding(name); }
    render(got, dropped, newlyKept, newlyCaught);
  }

  function back() {
    stopGame();
    const prev = S.history.pop();
    if (!prev) return;
    S.scene = prev.scene;
    S.items = prev.items;
    render([]);
  }

  function restart(at) {
    stopGame();
    S.history = [];
    S.items = new Set();
    S.scene = null;
    // Creatures are not items: once caught they stay caught, across every go.
    S.creatures = Memory.creatureList();
    Memory.startRun();
    const first = at || S.home || S.story.start;
    if (first) go(first, "fresh");
    else render([]);
  }

  // ---------- endings found (kept in this browser's storage) ----------

  function foundEndings() {
    try { return JSON.parse(localStorage.getItem(ENDINGS_KEY)) || []; } catch (e) { return []; }
  }

  function noteEnding(name) {
    const found = foundEndings();
    found.push(name);
    try { localStorage.setItem(ENDINGS_KEY, JSON.stringify(found)); } catch (e) { /* storage is off */ }
  }

  function forgetEndings() {
    try { localStorage.removeItem(ENDINGS_KEY); } catch (e) { /* storage is off */ }
    render([]);
  }

  function endingsLine() {
    const found = foundEndings().filter((n) => S.story.scenes[n] && S.story.scenes[n].ending);
    return S.story.endings.length ? `Endings found: ${found.length} of ${S.story.endings.length}` : "";
  }

  // ---------- drawing the page ----------

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // **bold**, *italic*, _italic_, and [links](https://...) to other websites.
  function inline(text) {
    return esc(text)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1<em>$2</em>")
      .replace(/(^|[^\w])_(?!\s)([^_]+?)_(?!\w)/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }

  function picture(block) {
    const fig = document.createElement("figure");
    const img = document.createElement("img");
    img.alt = block.alt;
    img.onerror = () => {
      fig.className = "missing-picture";
      fig.textContent = `Picture not found: ${block.src}. Check the file name, including capital letters.`;
    };
    img.src = block.src;
    fig.appendChild(img);
    return fig;
  }

  function render(got, dropped, newlyKept, newlyCaught) {
    got = got || []; dropped = dropped || []; newlyKept = newlyKept || []; newlyCaught = newlyCaught || [];
    const box = $("scene"), list = $("choices");
    if (box._fxStop) { box._fxStop = null; }
    Effects.unhaunt(list);
    box.innerHTML = "";
    list.innerHTML = "";
    const s = S.story.scenes[S.scene];
    if (!s) {
      box.innerHTML = "<p>This story doesn't have a first scene yet. Open <strong>Problems</strong> below to see why.</p>";
      Effects.clear();
      showBadge();
      return;
    }

    setTheme(s.theme || S.theme);
    Effects.apply(s.effects);
    // Hide the choices before they are built, so a slow scene doesn't flash
    // them up and then fade them out again.
    list.classList.toggle("waiting", s.effects.includes("slow") && !Effects.calm);
    for (const snd of s.sounds) Effects.Sound.play(snd);

    for (const b of s.blocks) {
      if (b.type === "text") {
        if (!Memory.test(b.cond, S.items)) continue;
        const p = document.createElement("p");
        p.innerHTML = inline(Memory.fill(b.text, S.story, foundEndings()));
        if (b.cond) p.className = "remembered";
        box.appendChild(p);
      } else if (b.type === "image") {
        box.appendChild(picture(b));
      } else if (b.type === "get" && got.includes(b.item)) {
        const p = document.createElement("p");
        p.className = "got";
        p.innerHTML = "You picked up: <strong>" + esc(b.item) + "</strong>";
        box.appendChild(p);
      } else if (b.type === "lose" && dropped.includes(b.item)) {
        const p = document.createElement("p");
        p.className = "got lost";
        p.innerHTML = "You no longer have: <strong>" + esc(b.item) + "</strong>";
        box.appendChild(p);
      } else if (b.type === "catch") {
        if (!newlyCaught.includes(b.who)) continue;
        const p = document.createElement("p");
        p.className = "got caught";
        p.innerHTML = "You have caught: <strong>" + esc(b.who) + "</strong>. It comes with you now, and it will still be with you the next time you start over.";
        box.appendChild(p);
      } else if (b.type === "keep" && newlyKept.includes(b.thing)) {
        const p = document.createElement("p");
        p.className = "got kept";
        p.innerHTML = "This one sticks: <strong>" + esc(b.thing) + "</strong>. It will still be true the next time you start over.";
        box.appendChild(p);
      }
    }

    if (s.ending) {
      const end = document.createElement("p");
      end.className = "the-end";
      end.textContent = "The End";
      box.appendChild(end);
      const by = (S.story.files.find((f) => f.name === s.file) || {}).by;
      const note = document.createElement("p");
      note.className = "end-note";
      note.textContent = [by ? "This ending was written by " + by + "." : "", endingsLine()].filter(Boolean).join(" ");
      box.appendChild(note);
      addChoice(list, "Play again", () => restart(), "again");
    }

    if (s.game) {
      startGame(s, box, list);
    } else {
      let n = 0;
      for (const c of s.choices) {
        if (c.broken || !S.story.scenes[c.to]) {
          addChoice(list, "🚧 " + c.text, null, "broken", "This choice is broken. Open Problems to see why.");
        } else if (!Memory.test(c.cond, S.items)) {
          const mark = c.cond.kind === "item" ? "🔒 " : "🕯 ";
          addChoice(list, mark + c.text, null, "locked", Memory.why(c.cond));
        } else {
          const haunted = c.haunted;
          n++;
          const btn = addChoice(list, c.text, () => go(c.to), haunted ? "haunted" : "", "",
                                haunted === "gone" ? 0 : n, haunted ? c.text : "");
          if (haunted) {
            if (haunted === "gone") n--;
            if (haunted === "lies") {
              const others = s.choices.filter((o) => o !== c && o.text && !o.outcome).map((o) => o.text);
              if (others.length) c.lie = others[(s.name.length + c.line) % others.length];
            }
            Effects.haunt(btn, c, list);
          }
        }
      }
    }

    const carrying = [...S.items];
    $("carrying").hidden = !carrying.length;
    $("carrying").innerHTML = "You're carrying: " + carrying.map((i) => "<strong>" + esc(i) + "</strong>").join(", ");
    // A page that doesn't have the companions line is still a page: don't
    // let one missing element take the whole scene down with it.
    const pals = S.creatures.filter((c) => Memory.creature(c));
    const palLine = $("companions");
    if (palLine) {
    palLine.hidden = !pals.length;
    palLine.innerHTML = pals.map((c) => {
      const r = Memory.creature(c);
      return `<span class="pal"><b>${esc(c)}</b> level ${r.level}` +
             (r.wins || r.losses ? ` · ${r.wins} won, ${r.losses} lost` : "") + "</span>";
    }).join(" ");
    }
    $("btn-back").disabled = !S.history.length;
    $("endings").textContent = endingsLine();
    showBadge();
    box.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    if (list.classList.contains("waiting")) Effects.reveal(box, () => list.classList.remove("waiting"));
  }

  // ---------- scenes you play instead of read ----------

  function stopGame() {
    if (S.game) { const g = S.game; S.game = null; g.stop(); }
    const old = document.querySelector(".arcade");
    if (old) old.remove();
  }

  function startGame(scene, box, list) {
    stopGame();
    const win = scene.choices.find((c) => c.outcome === "win");
    const lose = scene.choices.find((c) => c.outcome === "lose");
    if (!win || !lose || typeof Arcade === "undefined" || !Arcade.has(scene.game)) {
      // Something is wrong with the game. Never trap the player: show the
      // choices as ordinary buttons and let them pick.
      let n = 0;
      for (const c of scene.choices) if (S.story.scenes[c.to]) addChoice(list, c.text, () => go(c.to), "", "", ++n);
      return;
    }
    S.game = Arcade.play(scene.game, {
      mount: box,
      items: S.items,
      scene: scene,
      creatures: S.creatures,
      frames: Play.testFrames || 0,
      drive: Play.testDrive || null,
      onDone: (won, how) => {
        S.game = null;
        if (how === "left") return;
        go((won ? win : lose).to);
      },
    });
  }

  function addChoice(list, text, onClick, cls, note, number, haunting) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    if (cls) btn.className = cls;
    if (number && number <= 9) {
      btn.dataset.key = String(number);
      const k = document.createElement("span");
      k.className = "num";
      k.textContent = number;
      btn.appendChild(k);
    }
    const label = document.createElement("span");
    label.className = "label";
    label.textContent = text;
    btn.appendChild(label);
    if (note || arguments.length > 6) {
      const small = document.createElement("small");
      small.textContent = note || "";
      btn.appendChild(small);
    }
    if (onClick) btn.onclick = onClick; else btn.disabled = true;
    li.appendChild(btn);
    list.appendChild(li);
    return btn;
  }

  // ---------- problems ----------

  function showBadge() {
    const all = problems();
    const errors = all.filter((p) => p.level === "error").length;
    const btn = $("btn-problems");
    btn.className = errors ? "bad" : all.length ? "warn" : "good";
    btn.textContent = all.length ? `⚠ ${all.length} problem${all.length === 1 ? "" : "s"}` : "✓ No problems";
  }

  function problemList(list) {
    const wrap = document.createElement("div");
    if (!list.length) {
      wrap.innerHTML = "<p class='all-good'>✓ No problems. Every scene can be reached, every choice leads somewhere, and nobody gets stuck.</p>";
      return wrap;
    }
    const intro = document.createElement("p");
    intro.textContent = "Red problems break part of the story. Yellow ones are probably mistakes. Fix the first one and test again: later problems are sometimes caused by earlier ones.";
    wrap.appendChild(intro);
    for (const p of list) {
      const card = document.createElement("div");
      card.className = "problem " + p.level;
      card.innerHTML = `<div class="where">${esc(p.file)}${p.line ? ", line " + p.line : ""}</div>
        <div class="what">${esc(p.message)}</div>${p.fix ? `<div class="fix">${esc(p.fix)}</div>` : ""}`;
      wrap.appendChild(card);
    }
    return wrap;
  }

  // ---------- panels ----------

  function openPanel(title, body, wide) {
    $("panel-title").textContent = title;
    const b = $("panel-body");
    b.innerHTML = "";
    b.appendChild(body);
    $("panel-box").className = wide ? "wide" : "";
    $("panel").hidden = false;
    $("panel-close").focus();
  }

  function closePanel() { $("panel").hidden = true; }

  function showMap() {
    const found = new Set(foundEndings());
    const body = document.createElement("div");
    body.appendChild(StoryMap.draw(S.story, { current: S.scene, found, onPick: (name) => { closePanel(); jump(name, "the story map"); } }));
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "small";
    reset.textContent = "Forget the endings I've found";
    reset.onclick = () => { forgetEndings(); showMap(); };
    body.appendChild(reset);
    openPanel("Story map", body, true);
  }

  function showMemory() {
    const m = Memory.state;
    const body = document.createElement("div");
    const row = (k, v) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`;
    const names = (o, only) => {
      const ks = Object.keys(o).filter((k) => !only || only(k));
      return ks.length ? ks.sort().map((k) => `<code>${esc(k)}</code>`).join(", ") : "<i>nothing yet</i>";
    };
    const games = Object.keys(m.games).map((g) => {
      const x = m.games[g];
      return `<code>${esc(g)}</code>: won ${x.won}, lost ${x.lost}`;
    }).join("<br>") || "<i>none played</i>";

    body.innerHTML = `
      <p>This is kept in <strong>this browser, on this computer</strong>. It is not sent
      anywhere and nobody else can see it. The story reads it to decide what to show you.</p>
      <table class="memory-table">
        ${row("Goes at the story", m.runs)}
        ${row("First opened", m.firstPlayed ? Memory.ago(m.firstPlayed) : "just now")}
        ${row("Last ending", m.lastEnding ? `<code>${esc(m.lastEnding)}</code>` : "<i>none</i>")}
        ${row("Endings reached", names(m.endings))}
        ${row("Scenes seen", `${Object.keys(m.scenes).length} of ${S.story.order.length}`)}
        ${row("Items ever carried", names(m.items))}
        ${row("Games", games)}
        ${row("Remembered for good", names(m.kept))}
      </table>`;

    const buttons = document.createElement("div");
    buttons.className = "memory-buttons";

    const forget = document.createElement("button");
    forget.type = "button"; forget.className = "small";
    forget.textContent = "Forget all of it";
    forget.onclick = () => {
      if (!confirm("Wipe everything this browser remembers about the story? This can't be undone.")) return;
      Memory.forget(); forgetEndings(); closePanel();
    };

    const stop = document.createElement("button");
    stop.type = "button"; stop.className = "small";
    stop.textContent = Memory.on ? "Stop remembering" : "Start remembering again";
    stop.onclick = () => { Memory.setOn(!Memory.on); showMemory(); };

    buttons.appendChild(forget);
    buttons.appendChild(stop);
    body.appendChild(buttons);
    if (!Memory.on) {
      const p = document.createElement("p");
      p.className = "memory-off";
      p.textContent = "Remembering is off. Nothing new is being written down, and scenes that depend on earlier goes will stay shut.";
      body.appendChild(p);
    }
    openPanel("What this browser remembers", body);
  }

  // A developer shortcut: start partway through, carrying nothing.
  function jump(name, from) {
    restart(name);
    notice(`You jumped to ${name} from ${from}, so you're only carrying what this scene gave you. <button type="button" id="notice-restart">Start from the beginning</button>`);
    $("notice-restart").onclick = () => { notice(""); restart(); };
  }

  function notice(html) {
    const n = $("notice");
    n.innerHTML = html;
    n.hidden = !html;
    if (S.draft && !html) draftNotice();
  }

  // ---------- testing a draft ----------

  function testDraft(draft, from) {
    stopGame();
    S.draft = draft;
    const files = S.live.filter((f) => f.name !== draft.as);
    files.push({ name: draft.as, text: draft.text });
    files.sort((a, b) => Story.FILES.indexOf(a.name) - Story.FILES.indexOf(b.name));
    rebuild(files);
    closePanel();
    const f = S.story.files.find((x) => x.name === draft.as);
    S.home = from === "draft" && f && f.scenes.length ? f.scenes[0] : null;
    restart();
    draftNotice();
  }

  function draftNotice() {
    const n = $("notice");
    n.innerHTML = `<strong>Testing a draft</strong> of ${esc(S.draft.as)}. Nothing is saved, and nobody else sees it.
      <button type="button" id="notice-edit">Edit the draft</button> <button type="button" id="notice-stop">Stop testing</button>`;
    n.hidden = false;
    n.className = "draft";
    $("notice-edit").onclick = () => Draft.open(S.draft);
    $("notice-stop").onclick = stopDraft;
  }

  function stopDraft() {
    stopGame();
    S.draft = null;
    S.home = null;
    $("notice").className = "";
    notice("");
    rebuild(S.live);
    restart();
  }

  // ---------- start ----------

  function bind() {
    $("btn-restart").onclick = () => { if (!S.draft) notice(""); restart(); };
    $("btn-back").onclick = back;
    $("btn-map").onclick = showMap;
    $("btn-draft").onclick = () => Draft.open(S.draft);
    $("btn-problems").onclick = () => openPanel("Problems", problemList(problems()));
    $("btn-memory").onclick = showMemory;
    const soundBtn = $("btn-sound");
    const drawSound = () => {
      soundBtn.textContent = Effects.Sound.on ? "🔊 Sound on" : "🔇 Sound off";
      soundBtn.setAttribute("aria-pressed", Effects.Sound.on ? "true" : "false");
    };
    soundBtn.onclick = () => { Effects.Sound.set(!Effects.Sound.on); drawSound(); };
    drawSound();
    $("panel-close").onclick = closePanel;
    $("panel").onclick = (e) => { if (e.target.id === "panel") closePanel(); };
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") return closePanel();
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!$("panel").hidden) return;
      if (S.game) return;              // the game is using the keyboard
      const btn = document.querySelector(`#choices button[data-key="${e.key}"]`);
      if (btn) { btn.click(); return; }
      if (e.key === "b" || e.key === "B") back();
      if (e.key === "m" || e.key === "M") showMap();
    });
  }

  async function start() {
    bind();
    if (location.protocol === "file:") {
      $("title").textContent = "Open this from your live link";
      $("scene").innerHTML = "<p>This project reads its story files from a web server, so double-clicking <code>index.html</code> won't work. Use your live link: <code>https://YOUR-USERNAME.github.io/adventure/</code></p>";
      return;
    }
    S.live = await load();
    rebuild(S.live);
    const q = new URLSearchParams(location.search);
    const at = (q.get("scene") || "").toLowerCase();
    if (at && S.story.scenes[at]) {
      restart(at);
      for (const it of (q.get("items") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)) S.items.add(it);
      render([]);
      notice(`Started at ${esc(at)} (a developer shortcut)${S.items.size ? ", carrying " + esc([...S.items].join(", ")) : ""}. <button type="button" id="notice-restart">Start from the beginning</button>`);
      $("notice-restart").onclick = () => { notice(""); restart(); };
    } else {
      restart();
    }
  }

  // Used by test.html. Sets the story up from files already in hand, so a
  // test can drive the page without waiting for the network.
  function bootWith(files, at) {
    bind();
    S.live = files;
    rebuild(files);
    restart(at);
  }

  return { start, bootWith, go, back, restart, render: () => render([]), state: S, testFrames: 0, testDrive: null,
           testDraft, stopDraft, openPanel, closePanel, problemList, problems };
})();

window.addEventListener("load", Play.start);
