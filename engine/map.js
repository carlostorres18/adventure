/* Engine: draws the story map. Every scene is a box, every choice is an
   arrow. Columns show how many choices it takes to reach a scene. */

const StoryMap = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const COLORS = {
    "start.md": "#7b8794", "path-1.md": "#3b7ddd", "path-2.md": "#e07b00", "path-3.md": "#1e9e5a",
    "path-4.md": "#9b4dd8", "path-5.md": "#d63a7a", "path-6.md": "#0f9fb0",
  };
  const OTHER = "#b58900";
  const W = 156, H = 48, GX = 64, GY = 18, PAD = 24;

  const color = (file) => COLORS[file] || OTHER;

  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function layout(story) {
    const scenes = story.scenes;
    const col = {};
    const columns = [];
    const place = (name, c) => { col[name] = c; (columns[c] = columns[c] || []).push(name); };

    // Reachable scenes: breadth-first from the start.
    const walk = (first, offset) => {
      const queue = [first];
      place(first, offset);
      let deepest = offset;
      while (queue.length) {
        const name = queue.shift();
        for (const c of scenes[name].choices) {
          if (scenes[c.to] && col[c.to] == null) { place(c.to, col[name] + 1); deepest = Math.max(deepest, col[name] + 1); queue.push(c.to); }
        }
      }
      return deepest;
    };
    let deepest = story.start ? walk(story.start, 0) : -1;

    // Scenes nobody can reach go in their own area to the right.
    let lostAt = null;
    const incoming = new Set();
    for (const n of story.order) for (const c of scenes[n].choices) incoming.add(c.to);
    const lost = story.order.filter((n) => col[n] == null);
    for (const n of lost.filter((x) => !incoming.has(x)).concat(lost)) {
      if (col[n] != null) continue;
      if (lostAt == null) lostAt = deepest + 2;
      deepest = Math.max(deepest, walk(n, lostAt));
    }

    // Choices that lead nowhere point at a "missing" box.
    const ghosts = [];
    for (const n of story.order) {
      for (const c of scenes[n].choices) {
        if (scenes[c.to]) continue;
        const id = "missing:" + c.to;
        if (col[id] == null) { place(id, col[n] + 1); ghosts.push(id); }
      }
    }

    const pos = {};
    columns.forEach((names, c) => (names || []).forEach((n, r) => { pos[n] = { x: PAD + c * (W + GX), y: PAD + 26 + r * (H + GY) }; }));
    const rows = Math.max(1, ...columns.map((c) => (c ? c.length : 0)));
    return { pos, col, lostAt, width: PAD * 2 + columns.length * (W + GX) - GX, height: PAD * 2 + 26 + rows * (H + GY) };
  }

  function draw(story, opts) {
    const wrap = document.createElement("div");
    wrap.className = "map";
    const scenes = story.scenes;
    const { pos, col, lostAt, width, height } = layout(story);
    // Choices that go back to an earlier scene would cross the whole map, so
    // they're listed on the box instead, unless the reader asks to see them.
    const goesBack = (n, c) => scenes[c.to] && !c.broken && col[c.to] <= col[n];
    const svg = el("svg", { width: Math.max(width, 300), height, viewBox: `0 0 ${Math.max(width, 300)} ${height}`, role: "img",
      "aria-label": `Story map with ${story.order.length} scenes` });
    const defs = el("defs", {});
    for (const [id, fill] of [["arrow", "#8a94a6"], ["arrow-bad", "#d93025"]]) {
      const m = el("marker", { id, viewBox: "0 0 10 10", refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: "auto-start-reverse" });
      m.appendChild(el("path", { d: "M0,0 L10,5 L0,10 z", fill }));
      defs.appendChild(m);
    }
    svg.appendChild(defs);
    if (story.start) svg.appendChild(el("text", { x: PAD, y: PAD + 10, class: "map-label" }, "Start here →"));
    if (lostAt != null) svg.appendChild(el("text", { x: PAD + lostAt * (W + GX), y: PAD + 10, class: "map-label bad" }, "Nobody can reach these:"));

    const edges = el("g", {}), labels = el("g", {}), boxes = el("g", {});
    for (const n of story.order) {
      for (const c of scenes[n].choices) {
        const a = pos[n], b = pos[scenes[c.to] ? c.to : "missing:" + c.to];
        if (!a || !b || (goesBack(n, c) && !opts.showBack)) continue;
        const bad = c.broken || !scenes[c.to];
        const x1 = a.x + W, y1 = a.y + H / 2, x2 = b.x, y2 = b.y + H / 2;
        const bend = Math.max(36, Math.abs(x2 - x1) / 2);
        const d = x2 > x1 ? `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
                          : `M${x1},${y1} C${x1 + 70},${y1 + 50} ${x2 - 70},${y2 + 50} ${x2},${y2}`;
        const path = el("path", { d, fill: "none", stroke: bad ? "#d93025" : "#8a94a6", "stroke-width": 1.6,
          "marker-end": `url(#${bad ? "arrow-bad" : "arrow"})` });
        if (c.need) path.setAttribute("stroke-dasharray", "5 4");
        path.appendChild(el("title", {}, `"${c.text}"${c.need ? " (needs " + c.need + ")" : ""}`));
        edges.appendChild(path);
        if (c.need) {
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (x2 > x1 ? 0 : 38);
          labels.appendChild(el("text", { x: mx, y: my - 4, class: "map-lock", "text-anchor": "middle" }, "🔒 " + c.need));
        }
      }
    }

    const nodes = Object.keys(pos);
    for (const id of nodes) {
      const p = pos[id];
      const g = el("g", { class: "map-node", transform: `translate(${p.x},${p.y})` });
      if (id.startsWith("missing:")) {
        g.appendChild(el("rect", { width: W, height: H, rx: 8, fill: "#fdecea", stroke: "#d93025", "stroke-dasharray": "4 3", "stroke-width": 1.5 }));
        g.appendChild(el("text", { x: 10, y: 20, class: "map-name bad" }, "missing"));
        g.appendChild(el("text", { x: 10, y: 37, class: "map-sub" }, "#" + id.slice(8)));
        boxes.appendChild(g);
        continue;
      }
      const s = scenes[id];
      const stuck = !s.choices.length && !s.ending;
      const here = id === opts.current;
      g.appendChild(el("rect", { width: W, height: H, rx: 8, fill: "#ffffff", stroke: stuck ? "#d93025" : here ? "#111" : color(s.file),
        "stroke-width": here || stuck ? 3 : 1.5 }));
      g.appendChild(el("rect", { width: 7, height: H, rx: 3, fill: color(s.file) }));
      const name = id.replace(/~\d+$/, "");
      g.appendChild(el("text", { x: 15, y: 20, class: "map-name" }, name.length > 19 ? name.slice(0, 18) + "…" : name));
      const backs = s.choices.filter((c) => goesBack(id, c)).map((c) => c.to);
      let sub = stuck ? "stuck: no way out" : s.ending ? (opts.found.has(id) ? "★ ending (found)" : "☆ ending")
        : backs.length && !opts.showBack ? "↩ " + backs.join(", ") : s.file;
      if (here) sub = "▶ you are here";
      if (sub.length > 25) sub = sub.slice(0, 24) + "…";
      g.appendChild(el("text", { x: 15, y: 37, class: "map-sub" + (stuck ? " bad" : "") }, sub));
      g.appendChild(el("title", {}, `${id} (${s.file}, line ${s.line})` + (backs.length ? "\nGoes back to: " + backs.join(", ") : "")));
      g.style.cursor = "pointer";
      g.addEventListener("click", () => opts.onPick(id));
      boxes.appendChild(g);
    }
    svg.append(edges, boxes, labels);

    const legend = document.createElement("div");
    legend.className = "map-legend";
    for (const f of story.files) {
      if (!f.scenes.length) continue;
      const item = document.createElement("span");
      const dot = document.createElement("i");
      dot.style.background = color(f.name);
      item.append(dot, f.name + (f.by ? " · " + f.by : "") + ` (${f.scenes.length})`);
      legend.appendChild(item);
    }
    const tip = document.createElement("p");
    tip.className = "map-tip";
    tip.textContent = "Arrows are choices. Dashed arrows need an item. ↩ marks a choice that goes back to an earlier scene. Click any scene to jump there and test it.";
    const toggle = document.createElement("label");
    toggle.className = "map-toggle";
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = !!opts.showBack;
    box.onchange = () => wrap.replaceWith(draw(story, Object.assign({}, opts, { showBack: box.checked })));
    toggle.append(box, " Draw arrows for choices that go back");
    tip.appendChild(toggle);

    const scroll = document.createElement("div");
    scroll.className = "map-scroll";
    scroll.appendChild(svg);
    wrap.append(legend, tip, scroll);
    return wrap;
  }

  return { draw };
})();
