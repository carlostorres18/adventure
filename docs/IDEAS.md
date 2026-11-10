# Going further (optional)

Everything here is **optional**. The assignment can be completed in full
without anything on this page, and without using AI at all.

These ideas are for teams that have finished the challenges and want more.
Some need nothing new. Others need changes to the engine, which is where an
AI assistant can help, as long as **you stay in charge of checking its work**.

---

## No new skills needed

- **A secret ending.** Put it behind a choice that needs an item from *every*
  teammate's path. You'll need a chain: one locked choice leading to a scene
  with another locked choice, and so on.
- **Pictures.** Draw them, photograph them, or make them in any free drawing
  tool. Upload them to `images/` and give each one a real description.
- **A second theme.** Try `theme: night` in `start.md`. Does your story read
  differently?
- **Loops.** A scene that leads back to itself with a different item each
  time, like searching a room more than once. Does the map show it?

---

## With an AI assistant

### Rules for working with AI on code

1. **Work on a branch.** Every change goes through a pull request anyway, so
   nothing reaches `main` until a teammate has reviewed it.
2. **Give it context.** It hasn't seen this project. Tell it this is a
   browser choose-your-own-adventure made of plain JavaScript files with no
   libraries, that story files are parsed in `engine/story.js` and played in
   `engine/play.js`, and paste in the files it needs to see.
3. **Ask it to explain before you accept.** "Before you change anything, tell
   me which files you'll change and why." If you can't follow the
   explanation, ask again until you can.
4. **Test it yourself.** Use the "check it" list for each idea.
5. **Say so in the pull request**, like `Add sound effects (AI-assisted)`.
   Your reviewer should know what to look at most carefully.

You're responsible for every line in your repository, whoever typed it.

### Ideas

**Losing items** · easier
A `lose: lantern` line, for when the player drops or uses something up.
> Check it: the item disappears from "You're carrying" · locked choices that
> needed it lock again · **Back** gives it back · the checker accepts the new line.

**Counters** · medium
Numbers instead of things: `add: gold 5`, and choices like `if gold 10`.
> Check it: the count shows on screen · it can't go below zero · **Start
> over** resets it · the map labels choices that need a number.

**Typewriter text** · medium
Scene text appears letter by letter. Pressing a key shows it all at once.
> Check it: choices only appear after the text finishes · the number keys
> still work · screen readers still read the whole scene.

**Sound** · medium
A short sound for picking up an item, and another for reaching an ending.
> Check it: there's a way to turn it off · it doesn't play twice when you
> press **Back** · it works on a phone.

**Random choices** · harder
A choice like `[Roll the dice](#win|#lose)` that picks one of several scenes at random.
> Check it: both scenes get picked sometimes · the checker still catches a
> misspelled scene name · the map draws an arrow to each possible scene.
