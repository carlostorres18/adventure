/* Engine: plays the story. Loads the files in story/, shows one scene at a
   time, keeps track of what the player is carrying, and remembers which
   endings this browser has found. */

const Play = (() => {
  const $ = (id) => document.getElementById(id);
  const S = {
    story: null, live: [], files: [], draft: null,
    scene: null, home: null, items: new Set(), history: [], imageProblems: [],
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
    document.body.className = "theme-" + S.story.theme;
    $("title").textContent = S.story.title || "Untitled story";
    document.title = S.story.title || "Adventure";
    $("byline").textContent = S.story.by ? "by " + S.story.by : "";
    $("byline").hidden = !S.story.by;
    checkImages();
    showBadge();
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
    for (const it of s.gets) if (!S.items.has(it)) { S.items.add(it); got.push(it); }
    if (s.ending) noteEnding(name);
    render(got);
  }

  function back() {
    const prev = S.history.pop();
    if (!prev) return;
    S.scene = prev.scene;
    S.items = prev.items;
    render([]);
  }

  function restart(at) {
    S.history = [];
    S.items = new Set();
    S.scene = null;
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

  function render(got) {
    const box = $("scene"), list = $("choices");
    box.innerHTML = "";
    list.innerHTML = "";
    const s = S.story.scenes[S.scene];
    if (!s) {
      box.innerHTML = "<p>This story doesn't have a first scene yet. Open <strong>Problems</strong> below to see why.</p>";
      showBadge();
      return;
    }

    for (const b of s.blocks) {
      if (b.type === "text") {
        const p = document.createElement("p");
        p.innerHTML = inline(b.text);
        box.appendChild(p);
      } else if (b.type === "image") {
        box.appendChild(picture(b));
      } else if (b.type === "get" && got.includes(b.item)) {
        const p = document.createElement("p");
        p.className = "got";
        p.innerHTML = "You picked up: <strong>" + esc(b.item) + "</strong>";
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

    let n = 0;
    for (const c of s.choices) {
      if (c.broken || !S.story.scenes[c.to]) {
        addChoice(list, "🚧 " + c.text, null, "broken", "This choice is broken. Open Problems to see why.");
      } else if (c.need && !S.items.has(c.need)) {
        addChoice(list, "🔒 " + c.text, null, "locked", "You need: " + c.need);
      } else {
        n++;
        addChoice(list, c.text, () => go(c.to), "", "", n);
      }
    }

    const carrying = [...S.items];
    $("carrying").hidden = !carrying.length;
    $("carrying").innerHTML = "You're carrying: " + carrying.map((i) => "<strong>" + esc(i) + "</strong>").join(", ");
    $("btn-back").disabled = !S.history.length;
    $("endings").textContent = endingsLine();
    showBadge();
    box.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function addChoice(list, text, onClick, cls, note, number) {
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
    btn.appendChild(document.createTextNode(text));
    if (note) {
      const small = document.createElement("small");
      small.textContent = note;
      btn.appendChild(small);
    }
    if (onClick) btn.onclick = onClick; else btn.disabled = true;
    li.appendChild(btn);
    list.appendChild(li);
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
    $("panel-close").onclick = closePanel;
    $("panel").onclick = (e) => { if (e.target.id === "panel") closePanel(); };
    addEventListener("keydown", (e) => {
      if (e.key === "Escape") return closePanel();
      if (e.ctrlKey || e.metaKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (!$("panel").hidden) return;
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

  return { start, state: S, testDraft, stopDraft, openPanel, closePanel, problemList, problems };
})();

window.addEventListener("load", Play.start);
