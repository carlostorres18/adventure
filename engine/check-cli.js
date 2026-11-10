/* Engine: the automatic Story check. GitHub runs this on every pull request
   and every change to main (see .github/workflows/story-check.yml). It runs
   the same checks as the web page, and also makes sure every picture exists. */

const fs = require("fs");
const path = require("path");
const Story = require("./story.js");

const root = path.join(__dirname, "..");
const storyDir = path.join(root, "story");
const files = Story.FILES
  .filter((name) => fs.existsSync(path.join(storyDir, name)))
  .map((name) => ({ name, text: fs.readFileSync(path.join(storyDir, name), "utf8") }));
const story = Story.build(files);
const problems = story.problems.slice();

// Pictures: the web cares about capital letters, so check the exact spelling.
for (const im of story.images) {
  if (/^https?:\/\//i.test(im.src)) continue;
  let dir = root, ok = true, real = [];
  for (const part of im.src.replace(/^\.?\//, "").split("/")) {
    const here = fs.existsSync(dir) && fs.statSync(dir).isDirectory() ? fs.readdirSync(dir) : [];
    if (here.includes(part)) { real.push(part); dir = path.join(dir, part); continue; }
    const nearly = here.find((h) => h.toLowerCase() === part.toLowerCase());
    ok = false;
    if (nearly) real.push(nearly);
    else real = null;
    break;
  }
  if (!ok) {
    problems.push({ level: "error", file: im.file, line: im.line,
      message: `The picture ${im.src} can't be found.`,
      fix: real && real.length ? `Did you mean ${real.join("/")}? On the web, capital letters matter.`
        : "Check the spelling. Pictures go in the images folder: Add file → Upload files." });
  }
}

// Story files with other names are never loaded.
for (const f of fs.existsSync(storyDir) ? fs.readdirSync(storyDir) : []) {
  if (f.endsWith(".md") && !Story.FILES.includes(f)) {
    problems.push({ level: "warning", file: f, line: 0,
      message: `story/${f} isn't part of the story, because the game only reads start.md and path-1.md through path-6.md.`,
      fix: "Rename it to the next unused path file, like path-5.md." });
  }
}

const rank = (p) => (p.level === "error" ? 0 : 1e7) + (Story.FILES.indexOf(p.file) + 1) * 1e4 + p.line;
problems.sort((a, b) => rank(a) - rank(b));
const errors = problems.filter((p) => p.level === "error");
const warnings = problems.filter((p) => p.level === "warning");
const enc = (s) => String(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");

for (const p of problems) {
  const where = `story/${p.file}` + (p.line ? `, line ${p.line}` : "");
  console.log(`${p.level === "error" ? "PROBLEM" : "Heads up"}  ${where}\n  ${p.message}\n  ${p.fix}\n`);
  // These lines make GitHub show the message right next to the line it's about.
  console.log(`::${p.level} file=story/${p.file}${p.line ? ",line=" + p.line : ""},title=${enc(p.message).replace(/[,:]/g, " ")}::${enc(p.message + " " + p.fix)}`);
}

const scenes = story.order.length;
const summary = errors.length
  ? `## ✗ The story has ${errors.length} problem${errors.length === 1 ? "" : "s"} to fix`
  : `## ✓ The story checks out`;
const lines = [summary, "",
  `${scenes} scenes, ${story.endings.length} endings, ${files.length} story files.`, ""];
if (problems.length) {
  lines.push("| | Where | Problem | How to fix it |", "| --- | --- | --- | --- |");
  for (const p of problems) {
    const cell = (s) => String(s).replace(/\|/g, "\\|");
    lines.push(`| ${p.level === "error" ? "🔴" : "🟡"} | story/${p.file}${p.line ? " line " + p.line : ""} | ${cell(p.message)} | ${cell(p.fix)} |`);
  }
}
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
console.log(summary.replace(/^## /, "") + ` (${scenes} scenes, ${story.endings.length} endings, ${warnings.length} heads-up)`);
process.exit(errors.length ? 1 : 0);
