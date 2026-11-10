/* Engine: the draft tester. Paste a story file you're still writing, and
   play it together with the rest of the story before you commit. */

const Draft = (() => {
  const SAVE = "adventure-draft:" + location.pathname;

  function open(current) {
    let saved = current;
    if (!saved) { try { saved = JSON.parse(sessionStorage.getItem(SAVE)); } catch (e) { saved = null; } }
    saved = saved || { as: "practice.md", text: "" };

    const body = document.createElement("div");
    body.className = "draft-form";
    body.innerHTML = `
      <p>Paste a story file here to try it out. Nothing is saved to GitHub, and nobody else sees it.</p>
      <ol>
        <li>In GitHub, open your file and click the pencil to edit it. Select everything (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac) and copy it.</li>
        <li>Paste it below, choose which file it is, and click a test button.</li>
        <li>When it works, go back to GitHub and commit.</li>
      </ol>
      <label>This draft is:
        <select id="draft-as"></select>
      </label>
      <textarea id="draft-text" spellcheck="false" placeholder="## my-first-scene&#10;Write the scene here.&#10;&#10;[A choice](#another-scene)"></textarea>
      <div class="draft-buttons">
        <button type="button" id="draft-play-draft">Test from the top of my draft</button>
        <button type="button" id="draft-play-all">Test the whole story from the start</button>
      </div>`;
    const sel = body.querySelector("#draft-as");
    const opts = [["practice.md", "a practice file (an extra file, just for testing)"]]
      .concat(Story.FILES.map((f) => [f, `my changes to ${f} (replaces it while testing)`]));
    for (const [v, label] of opts) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      sel.appendChild(o);
    }
    sel.value = saved.as;
    const text = body.querySelector("#draft-text");
    text.value = saved.text;

    const read = () => {
      const d = { as: sel.value, text: text.value };
      try { sessionStorage.setItem(SAVE, JSON.stringify(d)); } catch (e) { /* storage is off */ }
      return d;
    };
    body.querySelector("#draft-play-draft").onclick = () => Play.testDraft(read(), "draft");
    body.querySelector("#draft-play-all").onclick = () => Play.testDraft(read(), "start");
    if (current) {
      const mine = Play.problems().filter((p) => p.file === current.as);
      const h = document.createElement("h3");
      h.textContent = mine.length ? "Problems in this draft" : "No problems in this draft";
      body.append(h, Play.problemList(mine));
    }
    Play.openPanel("Test a draft", body);
    text.focus();
  }

  return { open };
})();
