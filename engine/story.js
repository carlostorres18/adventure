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

  const clean = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

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
      } else if (s.choices.length && s.choices.every((c) => c.need)) {
        const need = [...new Set(s.choices.map((c) => c.need))].join(" or ");
        problem("warning", s.file, s.line, `A player who reaches ${name} without ${need} has no choice they can pick.`,
          "Add at least one choice without an if, such as a way back.");
      }
    }

    // Every item a choice needs must be given somewhere.
    const given = new Set();
    for (const name of names) for (const it of scenes[name].gets) given.add(it);
    for (const name of names) {
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
      if (scene && para.length) scene.blocks.push({ type: "text", text: para.join(" "), line: scene._paraLine });
      para = [];
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
        scene = { name, file: f.name, line, blocks: [], choices: [], gets: [], ending: false };
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
          const need = rest.match(/^if\s+(.+)$/i);
          if (need) choice.need = clean(need[1]);
          else problem("error", f.name, line, `After a choice, the only thing allowed is "if" and an item. This line has: ${rest}`,
            "For example: [Unlock the door](#vault) if brass key");
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

      if (!para.length) scene._paraLine = line;
      para.push(t);
    });
    flush();
  }

  return { FILES, THEMES, build, closest };
})();

if (typeof module !== "undefined") module.exports = Story;
