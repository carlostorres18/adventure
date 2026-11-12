/* Engine: reads the story files and checks them for problems.
   The web page uses this file, and so does the automatic Story check that
   runs on GitHub whenever someone opens a pull request. */

const Story = (() => {
  // The files the story is made of, in order. Files that don't exist are skipped.
  const FILES = ["start.md", "path-1.md", "path-2.md", "path-3.md", "path-4.md", "path-5.md", "path-6.md"];

  const NAME = /^[a-z0-9][a-z0-9-]*$/;
  const CHOICE = /^(?:[-*+]\s+)?\[([^\]]*)\]\(([^)]*)\)\s*(.*)$/;
  const IMAGE = /^!\[([^\]]*)\]\(([^)\s]*)\)\s*$/;
  const ENDING = /^[*_]*the end[*_.!]*$/i;
  const SETTINGS = ["by", "theme"];
  const THEMES = ["paper", "night", "forest", "ocean"];

  // Scenes that are played instead of read. See docs/ENGINE.md.
  const GAMES = ["undertow", "bell"];
  // What the page does while a scene is on screen.
  const EFFECTS = ["underwater", "fog", "flicker", "shake", "slow", "dark",
                   "dread", "static", "wrong"];
  // Things that can be wrong with a choice. See docs/ENGINE.md.
  //   flees   the button moves away from the pointer (the number key still works)
  //   glitch  the words come apart
  //   lies    the words are not the words that were there a second ago
  //   gone    you can see it. You cannot pick it.
  //   waits   it isn't there yet
  const HAUNTINGS = ["flees", "glitch", "lies", "gone", "waits"];
  // Short sounds the engine makes itself. There are no sound files to upload.
  const SOUNDS = ["bell", "gull", "splash", "tick", "lamp", "heartbeat", "wind"];
  // {things in curly brackets} that the engine fills in when it draws a scene.
  const TOKENS = ["runs", "endings-found", "endings-total", "endings-list",
                  "drownings", "clock", "first-played", "last-ending"];

  const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

  // A condition, in words, for messages and for the story map.
  function describe(cond) {
    if (!cond) return "";
    if (cond.kind === "item") return cond.value;
    if (cond.kind === "run") return "go number " + cond.value;
    if (cond.kind === "remembered") return "having reached " + cond.value + " before";
    if (cond.kind === "ending") return "having reached the ending " + cond.value + " before";
    if (cond.kind === "kept") return cond.value;
    return "";
  }

  // Comments (<!-- like this -->) are notes for writers. Blank them out but
  // keep their line breaks, so line numbers in messages still match the file.
  function stripComments(text) {
    return text.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ""));
  }

  function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }

  // What can come after a choice, and after "(if ...)" at the start of a
  // paragraph. Returns a condition, or a string explaining what's wrong.
  //   if lantern            an item the player is carrying
  //   if run 3              this is their 3rd go at the story, or later
  //   if remembered cave    they reached that scene on an earlier go
  //   if ending sandcastle  they reached that ending on an earlier go
  function condition(rest) {
    const m = String(rest).trim().match(/^if\s+(.+)$/i);
    if (!m) return 'After a choice, write "if" and then an item, like: if brass key';
    const what = m[1].trim();
    let g = what.match(/^run\s+(\d+)$/i);
    if (g) {
      const n = Number(g[1]);
      if (n < 2) return 'if run 1 is always true, so the choice would never be hidden. Use 2 or more.';
      return { kind: "run", value: n };
    }
    g = what.match(/^remembered\s+#?(.+)$/i);
    if (g) return { kind: "remembered", value: clean(g[1]) };
    g = what.match(/^ending\s+#?(.+)$/i);
    if (g) return { kind: "ending", value: clean(g[1]) };
    g = what.match(/^kept\s+(.+)$/i);
    if (g) return { kind: "kept", value: clean(g[1]) };
    if (/^(run|remembered|ending|kept)$/i.test(what)) return `"if ${what}" is missing what comes after it.`;
    return { kind: "item", value: clean(what) };
  }

  function closest(name, names) {
    let best = null, bestD = Infinity;
    for (const n of names) {
      const dd = distance(name, n);
      if (dd < bestD) { best = n; bestD = dd; }
    }
    return bestD <= (name.length <= 4 ? 1 : Math.max(2, Math.floor(name.length / 4))) ? best : null;
  }

  // files: [{ name: "start.md", text: "..." }] in story order.
  function build(files) {
    const story = {
      title: "", by: "", theme: "paper", start: null,
      scenes: {}, order: [], files: [], problems: [], images: [],
    };
    const problem = (level, file, line, message, fix) =>
      story.problems.push({ level, file, line, message, fix: fix || "" });

    for (const f of files) parseFile(f, story, problem);

    const scenes = story.scenes;
    const names = Object.keys(scenes);

    const startFile = story.files.find((f) => f.name === "start.md");
    if (!startFile) problem("error", "start.md", 0, "The story has no start.md file, so there's nowhere to begin.", "Every story needs story/start.md. Its first scene is where players start.");
    else if (!startFile.scenes.length) problem("error", "start.md", 1, "start.md has no scenes, so there's nowhere to begin.", "Add a scene: a line like ## crossroads, then some text under it.");
    else story.start = startFile.scenes[0];

    // Every choice must lead to a scene that exists.
    for (const name of names) {
      const s = scenes[name];
      for (const c of s.choices) {
        if (c.broken || scenes[c.to]) continue;
        c.broken = true;
        const near = closest(c.to, names);
        problem("error", s.file, c.line,
          `The choice "${c.text}" leads to #${c.to}, but there's no scene called ${c.to}.`,
          near ? `Did you mean #${near}? (That scene is in ${scenes[near].file}, line ${scenes[near].line}.)`
               : `Check the spelling, or write a scene that starts with ## ${c.to}`);
      }
    }

    // Every scene needs a way out: a choice, or THE END.
    for (const name of names) {
      const s = scenes[name];
      if (!s.choices.length && !s.ending) {
        problem("error", s.file, s.line, `Players get stuck at ${name}: it has no choices and it isn't an ending.`,
          "Add a choice, like [Go back](#crossroads), or put THE END on its own line if the story ends here.");
      } else if (s.choices.length && s.ending) {
        problem("warning", s.file, s.line, `${name} says THE END but also has choices.`,
          "An ending shouldn't have choices. Remove THE END, or remove the choices.");
      } else if (s.choices.length && !s.game && s.choices.every((c) => c.cond)) {
        const need = [...new Set(s.choices.map((c) => describe(c.cond)))].join(" or ");
        problem("warning", s.file, s.line, `A player who reaches ${name} without ${need} has no choice they can pick.`,
          "Add at least one choice without an if, such as a way back.");
      }
    }

    // Games: a game scene is played, not read, so it needs somewhere to go
    // when the player wins and somewhere to go when they lose.
    for (const name of names) {
      const s = scenes[name];
      const wins = s.choices.filter((c) => c.outcome === "win");
      const loses = s.choices.filter((c) => c.outcome === "lose");
      if (s.game) {
        if (!wins.length) problem("error", s.file, s.gameLine || s.line,
          `${name} has a game on it, but no choice says where to go when the player wins.`,
          `Add a line like [You make it to the surface](#safe) on win`);
        if (!loses.length) problem("error", s.file, s.gameLine || s.line,
          `${name} has a game on it, but no choice says where to go when the player loses.`,
          `Add a line like [The sea keeps you](#drowned) on lose`);
        if (wins.length > 1) problem("error", s.file, wins[1].line, `${name} has more than one "on win" choice.`, "A game can only have one way to win.");
        if (loses.length > 1) problem("error", s.file, loses[1].line, `${name} has more than one "on lose" choice.`, "A game can only have one way to lose.");
        for (const c of s.choices) if (!c.outcome) problem("warning", s.file, c.line,
          `The choice "${c.text}" is in a scene with a game on it, so the player never gets to click it.`,
          "In a game scene, every choice ends with on win or on lose.");
      } else {
        for (const c of s.choices) if (c.outcome) problem("error", s.file, c.line,
          `The choice "${c.text}" says "on ${c.outcome}", but ${name} has no game on it.`,
          `Add a line like game: ${GAMES[0]} to this scene, or take the "on ${c.outcome}" off the choice.`);
      }
    }

    // A haunted scene still has to be a scene you can leave.
    for (const name of names) {
      const s = scenes[name];
      if (!s.choices.length || s.ending) continue;
      const pickable = s.choices.filter((c) => c.haunted !== "gone");
      if (!pickable.length) {
        problem("error", s.file, s.line, `Every choice in ${name} is "haunted gone", so the player is stuck there for good.`,
          "At least one choice has to be pickable. Haunt the one they want, not the way out.");
      } else if (!pickable.some((c) => !c.cond && c.haunted !== "waits")) {
        const held = pickable.filter((c) => c.haunted === "waits").length;
        if (!held) problem("warning", s.file, s.line,
          `Everything a player can pick in ${name} is behind an if.`,
          "Add one plain choice, so nobody arrives empty-handed and gets stuck.");
      }
    }

    // Conditions about earlier goes at the story must point at real scenes.
    for (const name of names) {
      const s = scenes[name];
      const conds = s.choices.filter((c) => c.cond).map((c) => ({ cond: c.cond, line: c.line, what: `The choice "${c.text}"` }))
        .concat(s.blocks.filter((b) => b.cond).map((b) => ({ cond: b.cond, line: b.line, what: "A paragraph here" })));
      for (const { cond, line, what } of conds) {
        if (cond.kind !== "remembered" && cond.kind !== "ending") continue;
        const target = scenes[cond.value];
        if (!target) {
          const near = closest(cond.value, names);
          problem("error", s.file, line, `${what} mentions a scene called ${cond.value}, but there's no such scene.`,
            near ? `Did you mean ${near}?` : "Check the spelling. It has to be a scene name, not an item.");
        } else if (cond.kind === "ending" && !target.ending) {
          problem("error", s.file, line, `${what} says "if ending ${cond.value}", but ${cond.value} isn't an ending.`,
            `Put THE END on its own line in ${cond.value}, or use "if remembered ${cond.value}" instead.`);
        }
      }
    }

    // Anything checked with "if kept" has to be kept by some scene.
    const kept = new Set();
    for (const name of names) for (const k of scenes[name].keeps) kept.add(k);
    for (const name of names) {
      const s = scenes[name];
      const all = s.choices.filter((c) => c.cond).map((c) => ({ cond: c.cond, line: c.line, what: `The choice "${c.text}"` }))
        .concat(s.blocks.filter((b) => b.cond).map((b) => ({ cond: b.cond, line: b.line, what: "A paragraph here" })));
      for (const { cond, line, what } of all) {
        if (cond.kind !== "kept" || kept.has(cond.value)) continue;
        const near = closest(cond.value, [...kept]);
        problem("warning", s.file, line, `${what} waits for "${cond.value}" to be remembered, but no scene ever does keep: ${cond.value}.`,
          near ? `Did you mean "${near}"?` : `Add the line keep: ${cond.value} to the scene where it happens.`);
      }
    }

    // {curly brackets} the engine fills in.
    for (const name of names) {
      for (const { tok, line } of scenes[name].tokens) {
        const bare = tok.slice(1, -1);
        if (TOKENS.includes(bare)) continue;
        const near = closest(bare, TOKENS);
        problem("warning", scenes[name].file, line, `The engine doesn't know what to put in place of ${tok}.`,
          near ? `Did you mean {${near}}?` : `The ones it knows are: ${TOKENS.map((x) => "{" + x + "}").join(", ")}.`);
      }
    }

    // Every item a choice needs must be given somewhere.
    const given = new Set();
    for (const name of names) for (const it of scenes[name].gets) given.add(it);
    for (const name of names) {
      for (const it of scenes[name].loses) {
        if (given.has(it)) continue;
        const near = closest(it, [...given]);
        problem("warning", scenes[name].file, scenes[name].line,
          `${name} takes away ${it}, but no scene ever gives ${it}.`,
          near ? `Did you mean ${near}? Items must be spelled the same in get: and lose:.` : `Add get: ${it} to the scene where the player finds it.`);
      }
      for (const b of scenes[name].blocks) {
        if (!b.cond || b.cond.kind !== "item" || given.has(b.cond.value)) continue;
        problem("warning", scenes[name].file, b.line,
          `A paragraph here only shows to a player carrying ${b.cond.value}, but no scene gives ${b.cond.value}, so nobody will ever read it.`,
          `Add get: ${b.cond.value} to the scene where the player finds it.`);
      }
      for (const c of scenes[name].choices) {
        if (c.need && !given.has(c.need)) {
          const near = closest(c.need, [...given]);
          problem("warning", scenes[name].file, c.line,
            `The choice "${c.text}" needs ${c.need}, but no scene gives ${c.need}, so nobody can ever pick it.`,
            near ? `Did you mean ${near}? Items must be spelled the same in get: and if.`
                 : `Add the line get: ${c.need} to the scene where the player finds it.`);
        }
      }
    }

    // Every scene should be reachable from the start.
    if (story.start) {
      // A practice file (from the draft tester) is its own little story.
      const practice = story.files.find((f) => f.name === "practice.md");
      const firsts = [story.start].concat(practice && practice.scenes.length ? [practice.scenes[0]] : []);
      const seen = new Set(firsts);
      const queue = firsts.slice();
      while (queue.length) {
        const s = scenes[queue.shift()];
        for (const c of s.choices) if (!c.broken && !seen.has(c.to)) { seen.add(c.to); queue.push(c.to); }
      }
      story.reachable = seen;
      for (const f of story.files) {
        const lost = f.scenes.filter((n) => !seen.has(n));
        if (!lost.length) continue;
        const first = scenes[lost[0]];
        problem("warning", f.name, first.line,
          lost.length === 1 ? `Nobody can reach the scene ${lost[0]}: no choice leads to it.`
                            : `Nobody can reach ${lost.length} scenes in this file: ${lost.join(", ")}.`,
          `Add a choice somewhere that leads to #${lost[0]}.`);
      }
    } else {
      story.reachable = new Set();
    }

    const order = (p) => FILES.indexOf(p.file) * 100000 + p.line;
    story.problems.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1) || order(a) - order(b));
    story.endings = names.filter((n) => scenes[n].ending);
    return story;
  }

  function parseFile(f, story, problem) {
    const file = { name: f.name, scenes: [], by: "" };
    story.files.push(file);
    const raw = String(f.text || "").replace(/\r\n?/g, "\n");
    if (/<!--/.test(stripComments(raw))) {
      const line = stripComments(raw).split("\n").findIndex((l) => l.includes("<!--")) + 1;
      problem("error", f.name, line, "A comment starts here with <!-- but never ends, so everything after it is hidden.",
        "Add --> where the comment should stop.");
    }
    const lines = stripComments(raw).split("\n");
    let scene = null, para = [], loose = 0;

    const flush = () => {
      if (scene && para.length) {
        const block = { type: "text", text: para.join(" "), line: scene._paraLine };
        if (scene._paraCond) block.cond = scene._paraCond;
        scene.blocks.push(block);
        for (const tok of block.text.match(/\{[a-z-]*\}/g) || []) scene.tokens.push({ tok, line: block.line });
      }
      para = [];
      if (scene) scene._paraCond = null;
    };

    lines.forEach((text, i) => {
      const line = i + 1;
      const t = text.trim();
      if (!t) { flush(); return; }

      // ## scene-name
      let m = t.match(/^(#{2,})\s*(.*)$/);
      if (m) {
        flush();
        let name = clean(m[2]).replace(/^#+/, "");
        if (m[1].length > 2) problem("error", f.name, line, `Scene names start with exactly two # marks, not ${m[1].length}.`, `Write it as ## ${name}`);
        if (!name) { problem("error", f.name, line, "This scene has no name.", "Put a name after the ##, like ## dark-cave"); name = "unnamed-" + line; }
        if (/\s/.test(name)) {
          const fixed = name.replace(/\s+/g, "-");
          problem("error", f.name, line, `Scene names can't have spaces: "${name}".`, `Use dashes instead: ## ${fixed} (and link to it as #${fixed}).`);
          name = fixed;
        }
        if (!NAME.test(name)) {
          problem("error", f.name, line, `The scene name "${name}" has a character that isn't allowed.`, "Use only lowercase letters, numbers, and dashes, like ## dark-cave-2");
        }
        if (story.scenes[name]) {
          const other = story.scenes[name];
          problem("error", f.name, line, `Two scenes are both called ${name}. The other one is in ${other.file}, line ${other.line}.`,
            "Rename one of them. Every scene needs its own name, across all the files.");
          name = name + "~" + line;
        }
        scene = { name, file: f.name, line, blocks: [], choices: [], gets: [], loses: [], keeps: [],
                  ending: false, game: "", effects: [], sounds: [], tokens: [] };
        story.scenes[name] = scene;
        story.order.push(name);
        file.scenes.push(name);
        return;
      }

      // # Title (start.md only)
      m = t.match(/^#\s*(.*)$/);
      if (m) {
        if (f.name === "start.md" && !scene && !story.title) story.title = m[1].trim();
        else problem("warning", f.name, line, "A single # is only for the story's title, at the top of start.md.", "Scenes start with two: ## scene-name");
        return;
      }

      // by: / theme: (before the first scene)
      m = t.match(/^([a-z ]+):\s*(.*)$/i);
      if (m && !scene && SETTINGS.includes(clean(m[1]))) {
        const key = clean(m[1]), value = m[2].trim();
        if (key === "by") { file.by = value; if (f.name === "start.md") story.by = value; }
        if (key === "theme") {
          if (f.name !== "start.md") problem("warning", f.name, line, "Only start.md can choose the theme.", "Move this line to the top of start.md.");
          else if (THEMES.includes(clean(value))) story.theme = clean(value);
          else problem("warning", f.name, line, `There's no theme called "${value}".`, `Choose one of: ${THEMES.join(", ")}.`);
        }
        return;
      }

      if (!scene) {
        if (!loose++) problem("warning", f.name, line, "This text is above the first scene, so players will never see it.",
          "Move it below a ## scene-name line, or delete it.");
        return;
      }

      // get: item
      m = t.match(/^get\s*:\s*(.*)$/i);
      if (m) {
        flush();
        const items = m[1].split(",").map(clean).filter(Boolean);
        if (!items.length) problem("error", f.name, line, "get: needs the name of an item.", "For example: get: brass key");
        for (const it of items) { scene.gets.push(it); scene.blocks.push({ type: "get", item: it, line }); }
        return;
      }

      // keep: thing  (remembered for good, across every go)
      m = t.match(/^keep\s*:\s*(.*)$/i);
      if (m) {
        flush();
        const things = m[1].split(",").map(clean).filter(Boolean);
        if (!things.length) problem("error", f.name, line, "keep: needs something to remember.", "For example: keep: clocks running");
        for (const k of things) { scene.keeps.push(k); scene.blocks.push({ type: "keep", thing: k, line }); }
        return;
      }

      // lose: item
      m = t.match(/^lose\s*:\s*(.*)$/i);
      if (m) {
        flush();
        const items = m[1].split(",").map(clean).filter(Boolean);
        if (!items.length) problem("error", f.name, line, "lose: needs the name of an item.", "For example: lose: brass key");
        for (const it of items) { scene.loses.push(it); scene.blocks.push({ type: "lose", item: it, line }); }
        return;
      }

      // game: name
      m = t.match(/^game\s*:\s*(.*)$/i);
      if (m) {
        flush();
        const name = clean(m[1]);
        if (!GAMES.includes(name))
          problem("error", f.name, line, `There's no game called "${m[1].trim()}".`,
            `The games the engine knows are: ${GAMES.join(", ")}. See docs/ENGINE.md.`);
        else if (scene.game)
          problem("error", f.name, line, `${scene.name} already has a game on it.`, "A scene can only have one game: line.");
        else scene.game = name;
        scene.gameLine = line;
        return;
      }

      // effect: name
      m = t.match(/^effect\s*:\s*(.*)$/i);
      if (m) {
        flush();
        for (const e of m[1].split(",").map(clean).filter(Boolean)) {
          if (!EFFECTS.includes(e))
            problem("warning", f.name, line, `There's no effect called "${e}".`,
              `Choose from: ${EFFECTS.join(", ")}. See docs/ENGINE.md.`);
          else scene.effects.push(e);
        }
        return;
      }

      // sound: name
      m = t.match(/^sound\s*:\s*(.*)$/i);
      if (m) {
        flush();
        for (const snd of m[1].split(",").map(clean).filter(Boolean)) {
          if (!SOUNDS.includes(snd))
            problem("warning", f.name, line, `There's no sound called "${snd}".`,
              `Choose from: ${SOUNDS.join(", ")}. See docs/ENGINE.md.`);
          else scene.sounds.push(snd);
        }
        return;
      }

      // THE END
      if (ENDING.test(t)) { flush(); scene.ending = true; scene.endLine = line; return; }

      // ![picture](images/file.png)
      m = t.match(IMAGE);
      if (m) {
        flush();
        const src = m[2].trim();
        if (!m[1].trim()) problem("warning", f.name, line, "This picture has no description.",
          "Describe it inside the [ ]: ![A rope bridge over a canyon](" + src + "). Screen readers read it aloud to people who can't see the picture.");
        scene.blocks.push({ type: "image", alt: m[1].trim(), src, line });
        story.images.push({ src, file: f.name, line });
        return;
      }

      // [Choice text](#scene) if item
      m = t.match(CHOICE);
      if (m && !/^\[[^\]]*\]\(https?:/i.test(t.replace(/^[-*+]\s+/, ""))) {
        flush();
        const choice = { text: m[1].trim(), to: "", need: "", line };
        let target = m[2].trim();
        const rest = m[3].trim();
        if (!choice.text) problem("error", f.name, line, "This choice has no words for the player to click.", "Put them inside the [ ]: [Open the door](#hall)");
        if (!target.startsWith("#")) {
          problem("error", f.name, line, `The choice "${choice.text}" goes to "${target}", which is missing its #.`,
            `Write it as [${choice.text}](#${clean(target).replace(/\s+/g, "-")}). The # means "a scene in this story".`);
          choice.broken = true;
        }
        target = clean(target.replace(/^#/, ""));
        if (/\s/.test(target)) {
          problem("error", f.name, line, `The choice "${choice.text}" goes to "#${target}", but scene names can't have spaces.`, `Use dashes: #${target.replace(/\s+/g, "-")}`);
          target = target.replace(/\s+/g, "-");
        }
        choice.to = target;
        if (rest) {
          const outcome = rest.match(/^on\s+(win|lose)$/i);
          const haunt = rest.match(/^haunted\s+([a-z]+)\s*(\d+)?$/i);
          if (outcome) {
            choice.outcome = outcome[1].toLowerCase();
          } else if (haunt) {
            const kind = clean(haunt[1]);
            if (!HAUNTINGS.includes(kind)) {
              const near = closest(kind, HAUNTINGS);
              problem("error", f.name, line, `There's nothing wrong with a choice called "${haunt[1]}".`,
                near ? `Did you mean haunted ${near}?` : `Choose from: ${HAUNTINGS.map((h) => "haunted " + h).join(", ")}. See docs/ENGINE.md.`);
            } else {
              choice.haunted = kind;
              if (kind === "waits") choice.after = Number(haunt[2] || 6);
              else if (haunt[2]) problem("warning", f.name, line, `"haunted ${kind}" doesn't take a number.`, `Only "haunted waits" does, like: haunted waits 8`);
            }
          } else {
            const cond = condition(rest);
            if (typeof cond === "string") {
              problem("error", f.name, line, `After the choice "${choice.text}", this doesn't make sense: ${rest}`, cond);
            } else {
              choice.cond = cond;
              // need is the old name for an item condition. The map and the
              // "nobody can pick anything here" check both still use it.
              if (cond.kind === "item") choice.need = cond.value;
            }
          }
        }
        scene.choices.push(choice);
        return;
      }

      // Something that looks like a choice, but isn't quite.
      if (/^(?:[-*+]\s+)?\[/.test(t) && !/^(?:[-*+]\s+)?\[[^\]]*\]\(https?:/.test(t)) {
        problem("error", f.name, line, "This line looks like a choice, but something is missing or extra.",
          "A choice looks exactly like this, with no space between ] and (: [Open the door](#hall)");
        return;
      }
      if (/\]\(#/.test(t)) {
        problem("error", f.name, line, "A choice is in the middle of a sentence.", "Each choice goes on its own line, below the scene's text.");
      }

      // (if lantern) A paragraph that only shows when something is true.
      let body = t;
      if (para.length && /^\(\s*if\s/i.test(t)) {
        problem("error", f.name, line, "This line starts a new (if ...) paragraph, but the paragraph above it hasn't finished.",
          "Put a blank line between them. Without one they run together into one paragraph and the (if ...) is shown to the player as words.");
        return;
      }
      if (!para.length) {
        const cm = t.match(/^\(\s*(if\s[^)]*)\)\s*(.*)$/i);
        if (cm) {
          const cond = condition(cm[1]);
          if (typeof cond === "string") {
            problem("error", f.name, line, `This paragraph starts with (${cm[1].trim()}), which doesn't make sense.`, cond);
          } else {
            scene._paraCond = cond;
          }
          body = cm[2].trim();
          if (!body) {
            problem("error", f.name, line, "This line says when to show a paragraph, but there's no paragraph after it.",
              "Put the words on the same line: (if lantern) The lantern lights the wall.");
            return;
          }
        }
        scene._paraLine = line;
      }
      para.push(body);
    });
    flush();
  }

  return { FILES, THEMES, GAMES, EFFECTS, SOUNDS, TOKENS, HAUNTINGS, build, closest, describe, condition };
})();

if (typeof module !== "undefined") module.exports = Story;
