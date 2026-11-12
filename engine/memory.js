/* Engine: what the island remembers.

   Everything here lives in this browser's own storage, on this one computer.
   Nothing is sent anywhere, nothing is shared between people, and clearing
   your browser data wipes it. Two people playing the same story see two
   different sets of memories.

   The point of it: the story can ask "has this player been here before?"
   A scene can say

     (if run 3) You have done this twice already.
     [Take the shortcut you found last time](#tunnel) if remembered tunnel

   and this file is what answers.

   HOW A "GO" IS COUNTED. A go starts whenever the story starts from its
   first scene: opening the page, Start over, or Play again. Scenes you
   visit are stamped with the number of the go you were on. So
   "remembered cave" means: cave was stamped on an EARLIER go than this one.
   Visiting a scene twice in one go does not make it a memory.
*/

const Memory = (() => {
  const KEY = "adventure-memory:" + location.pathname;
  const BLANK = {
    version: 1,
    runs: 0,            // how many goes this browser has had
    firstPlayed: 0,     // when the very first go started
    scenes: {},         // scene name -> the go it was last seen on
    endings: {},        // ending name -> how many times reached
    items: {},          // item name  -> the go it was last picked up on
    games: {},          // game name  -> { won, lost }
    lastEnding: "",     // the ending that finished the previous go
    kept: {},           // things a scene said to keep: remembered for good
    creatures: {},      // a creature you caught -> { level, wins, losses }
    sand: 0,            // the most sand anyone has ever piled up here
  };

  let state = load();
  let on = true;        // the player can switch remembering off

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY));
      if (!raw || raw.version !== 1) return { ...BLANK };
      return { ...BLANK, ...raw };
    } catch (e) {
      return { ...BLANK };        // storage off, private window, full disk
    }
  }

  function save() {
    if (!on) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* nothing we can do */ }
  }

  // ---------- the engine tells us what happened ----------

  function startRun() {
    state.runs += 1;
    if (!state.firstPlayed) state.firstPlayed = Date.now();
    save();
    return state.runs;
  }

  function sawScene(name) {
    if (state.scenes[name] === state.runs) return;
    state.scenes[name] = state.runs;
    save();
  }

  function gotItem(item) {
    if (state.items[item] === state.runs) return;
    state.items[item] = state.runs;
    save();
  }

  function reachedEnding(name) {
    state.endings[name] = (state.endings[name] || 0) + 1;
    state.lastEnding = name;
    save();
  }

  function playedGame(name, won) {
    const g = state.games[name] || { won: 0, lost: 0 };
    if (won) g.won += 1; else g.lost += 1;
    state.games[name] = g;
    save();
  }

  // keep: something. Remembered for good, across every go, until the player
  // clears their memories.
  function keep(thing) {
    if (state.kept[thing]) return false;
    state.kept[thing] = state.runs || 1;
    save();
    return true;                 // true the first time only, so the page can say so
  }

  function kept(thing) { return !!state.kept[thing]; }

  // ---------- creatures ----------
  // A creature you catch stays caught, and keeps what it learned, across every
  // go at the story. It is the only thing in here that gets better.

  function caught(who) {
    if (state.creatures[who]) return false;
    state.creatures[who] = { level: 1, wins: 0, losses: 0 };
    save();
    return true;                   // true the first time only
  }

  function creature(who) { return state.creatures[who] || null; }
  function creatureList() { return Object.keys(state.creatures); }

  function duelOver(who, won) {
    const c = state.creatures[who];
    if (!c) return null;
    if (won) { c.wins += 1; if (c.wins >= c.level * 2) c.level = Math.min(9, c.level + 1); }
    else c.losses += 1;
    save();
    return c;
  }

  function sandRecord(n) {
    if (n <= state.sand) return false;
    state.sand = n;
    save();
    return true;
  }

  // ---------- the story asks us questions ----------

  // True when the scene was reached on an EARLIER go than the one we're on.
  function remembered(name) {
    const seen = state.scenes[name];
    return typeof seen === "number" && seen < state.runs;
  }

  function reachedBefore(ending) {
    return (state.endings[ending] || 0) > 0;
  }

  function test(cond, items) {
    if (!cond) return true;
    if (cond.kind === "item") return items ? items.has(cond.value) : false;
    if (cond.kind === "run") return state.runs >= cond.value;
    if (cond.kind === "remembered") return remembered(cond.value);
    if (cond.kind === "ending") return reachedBefore(cond.value);
    if (cond.kind === "kept") return kept(cond.value);
    return true;
  }

  // Why a choice is locked, in words the player can act on.
  function why(cond) {
    if (!cond) return "";
    if (cond.kind === "item") return "You need: " + cond.value;
    if (cond.kind === "run") return "This opens on go number " + cond.value + ". You are on go " + state.runs + ".";
    if (cond.kind === "remembered") return "Something you haven't done yet, on a go you haven't had yet.";
    if (cond.kind === "ending") return "An ending you haven't reached yet.";
    if (cond.kind === "kept") return "Not yet. Not on any go you have had so far.";
    return "";
  }

  // ---------- {things in curly brackets} ----------

  function ago(then) {
    if (!then) return "just now";
    const mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 2) return "a minute ago";
    if (mins < 60) return mins + " minutes ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? "an hour ago" : hours + " hours ago";
    const days = Math.floor(hours / 24);
    return days === 1 ? "yesterday" : days + " days ago";
  }

  function spell(n) {
    const words = ["no", "one", "two", "three", "four", "five", "six", "seven",
                   "eight", "nine", "ten", "eleven", "twelve"];
    return n <= 12 ? words[n] : String(n);
  }

  // {clock} is the real time on the player's own computer. The story decides
  // what to make of that.
  function clock() {
    const d = new Date();
    return ((d.getHours() % 12) || 12) + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function fill(text, story, foundEndings) {
    return String(text).replace(/\{([a-z-]+)\}/g, (whole, name) => {
      switch (name) {
        case "runs": return spell(state.runs);
        case "endings-found": return spell((foundEndings || []).length);
        case "endings-total": return spell((story && story.endings ? story.endings : []).length);
        case "endings-list": {
          const list = (foundEndings || []).slice().sort();
          if (!list.length) return "nothing at all";
          if (list.length === 1) return list[0];
          return list.slice(0, -1).join(", ") + " and " + list[list.length - 1];
        }
        case "drownings": return spell((state.games.undertow || {}).lost || 0);
        case "clock": return clock();
        case "first-played": return ago(state.firstPlayed);
        case "last-ending": return state.lastEnding || "nothing";
        case "creature-level": {
          const list = creatureList();
          return list.length ? spell(state.creatures[list[0]].level) : "no";
        }
        case "sand": return String(state.sand);
        default: return whole;
      }
    });
  }

  // ---------- the player is in charge of their own memories ----------

  function forget() {
    state = { ...BLANK };
    try { localStorage.removeItem(KEY); } catch (e) { /* already gone */ }
  }

  function setOn(v) {
    on = !!v;
    try { localStorage.setItem(KEY + ":on", on ? "1" : "0"); } catch (e) { /* ignore */ }
    if (!on) { try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } }
  }

  try { on = localStorage.getItem(KEY + ":on") !== "0"; } catch (e) { on = true; }

  return {
    startRun, sawScene, gotItem, reachedEnding, playedGame, keep, kept,
    caught, creature, creatureList, duelOver, sandRecord,
    remembered, reachedBefore, test, why, fill, forget, setOn, clock, spell, ago,
    get state() { return state; },
    get on() { return on; },
  };
})();

if (typeof module !== "undefined") module.exports = Memory;
