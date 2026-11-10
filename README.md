# Adventure

A choose-your-own-adventure story that runs in any web browser, written by
your whole team. Each scene ends with choices, each choice leads to another
scene, and every teammate writes one path through the story.

The engine is already built: it shows the scenes, keeps track of what the
player is carrying, draws a map of the story, and checks for mistakes. Your
team writes the story, in plain text files. **No programming needed.**

**See it working first:** [play the sample story](https://emenriquez.github.io/cs1101-adventure/).

> **Start here.** Read this page top to bottom once. It takes five minutes.

---

## 1. Set up your team's copy (Day 1)

### One person: the owner

Pick one teammate to own the repository. Everyone else will work in it too.

1. Near the top of this page, click **Use this template** → **Create a new repository**.
2. Name it `adventure`, set it to **Public**, and click **Create repository**.
3. **Turn on the live link.** In the new repository: **Settings** → **Pages** →
   under **Branch** choose `main` and `/ (root)` → **Save**. About a minute
   later, the story is live at `https://OWNER-USERNAME.github.io/adventure/`.
4. **Invite your teammates.** **Settings** → **Collaborators** →
   **Add people** → type a teammate's GitHub username → **Add**. Repeat for
   each teammate. (GitHub may ask for your password first.)

### Everyone else

1. Open `https://github.com/OWNER-USERNAME/adventure/invitations` (use the
   owner's username) and click **Accept invitation**. The same invitation is
   also in your email.
2. Bookmark the team's repository and the live link.

### Everyone, including the owner: claim a path

The story lives in the `story` folder:

| File | Who | What |
| --- | --- | --- |
| `story/start.md` | the owner | the title, the opening, and the crossroads that leads to every path |
| `story/path-1.md` | one teammate | path 1 |
| `story/path-2.md` | one teammate | path 2 |
| `story/path-3.md` | one teammate | path 3 |
| `story/path-4.md` | one teammate | path 4 |

Each person owns **one** path file. Because nobody edits anyone else's file,
your changes never collide.

- **Team of 5 or 6?** Make `story/path-5.md` (and `path-6.md`): **Add file** →
  **Create new file**, type `story/path-5.md` as the name, and copy the top of
  another path file. Then the owner adds a choice to `#path-5` in `start.md`.
- **Team of 3?** The owner deletes `story/path-4.md` and removes its choice
  from the crossroads scene in `start.md`.

Your first change: open your path file, put your name after `by:`, and get it
merged with a pull request (next section).

---

## 2. How to change the story: a pull request

On a team, nobody changes `main` directly. `main` is what the live link
shows, so it's the version everyone shares. Instead you **propose** a change,
a teammate **reviews** it, and then it's **merged** into `main`. That's a
**pull request**, and almost every software team in the world works this way.

### Making a pull request

1. Open your file (for example `story/path-2.md`) and click the **pencil**
   icon (*Edit this file*).
2. Make your change. The **Preview** tab shows roughly how it will read.
3. **Test it first** (recommended): select everything in the editor
   (<kbd>Ctrl</kbd>+<kbd>A</kbd>, or <kbd>⌘</kbd>+<kbd>A</kbd> on a Mac), copy
   it, then open your team's live link and click **Test a draft**. See section 4.
4. Back in GitHub, click **Commit changes...**. Write a message that says
   what you changed, like `Add the haunted mill scenes`.
5. Choose **Create a new branch for this commit and start a pull request**,
   then click **Propose changes**.
6. On the next page, fill in the description and click **Create pull request**.
7. Wait about 30 seconds for the **Story check** at the bottom of the page.
   - ✓ green: the check found nothing wrong. Ask a teammate to review.
   - ✗ red: click **Details** to see what to fix. To fix it, go to the
     **Files changed** tab, click the **⋯** menu on your file → **Edit file**,
     and commit again. Your fix goes into the same pull request.

### Reviewing a teammate's pull request

1. Open the **Pull requests** tab and click their pull request.
2. Click **Files changed** and read every line. Green lines were added; red
   lines were removed.
3. **Play it.** On the file's **⋯** menu, click **View file**, then the
   **Copy raw file** button. Paste it into **Test a draft** on the live link.
4. Click **Review changes** (or **Submit review**). Choose:
   - **Approve** if it's ready, or
   - **Request changes** if something is wrong, with a comment that says
     exactly what and where, so the writer can fix it.
5. Once it's approved, open the **Conversation** tab and click
   **Merge pull request** → **Confirm merge**. The live link updates about a
   minute later.

Don't merge your own pull request until a teammate has approved it.

---

## 3. Writing scenes: the cheat sheet

```text
## scene-name                  starts a new scene (lowercase letters,
                               numbers and dashes, no spaces)
Any text you like.             a blank line starts a new paragraph
**bold**   *italic*
![What the picture shows](images/my-picture.png)
get: lantern                   the player picks up a lantern
[Open the door](#hall)         a choice: leads to the scene called hall
[Unlock it](#vault) if key     a choice that only works if you have a key
THE END                        this scene is an ending
```

- Scene names are never shown to players, so pick names that help *you*:
  `mill-door`, `mill-attic`, `mill-ending-fire`.
- Every scene needs at least one choice, or `THE END`. Otherwise players get stuck.
- **Items** make the story remember things. `get: lantern` gives the player a
  lantern. A choice ending in `if lantern` is locked (🔒) until they have one.
  Items can come from anyone's path. That's how paths connect.
- **Pictures** go in the `images` folder: **Add file** → **Upload files**.
  Then use `![description](images/the-file-name.png)`. Spell the file name
  exactly, including capital letters.
- Lines between `<!--` and `-->` are notes for writers. Players never see them.

---

## 4. Tools on the live site

| Button | Does |
| --- | --- |
| **Start over** | back to the first scene, carrying nothing |
| **Back** | undo your last choice |
| **Story map** | every scene as a box, every choice as an arrow, colored by file. Click a scene to jump there. |
| **Test a draft** | paste a file you're still writing and play it, without committing anything |
| **✓ No problems** / **⚠ problems** | lists every mistake the engine found, with the file, the line, and how to fix it |
| **Endings found** | how many endings this browser has reached |

Keys: <kbd>1</kbd>–<kbd>9</kbd> pick a choice, <kbd>B</kbd> back,
<kbd>M</kbd> story map. To start partway through, add `?scene=` to the end of
the address: `.../adventure/?scene=cave&items=lantern`.

## 5. When something breaks

- The **problems** button turns red when the story has a mistake. It tells you
  the file, the line, and the usual fix. Fix the first one, then test again.
- The **Story check** on every pull request runs the same checks, so mistakes
  get caught before they reach `main`.
- A merged pull request broke something? Open it and click **Revert**. That
  makes a new pull request that undoes it.

---

## More

- [CHALLENGES.md](CHALLENGES.md): the Day 2 challenges.
- [docs/MAP.md](docs/MAP.md): a tour of every file and how they fit together.
- [docs/IDEAS.md](docs/IDEAS.md): **optional** bigger features, if your team wants to go further.
- Found something that doesn't work right? **Issues** → **New issue** → **Bug report**.
