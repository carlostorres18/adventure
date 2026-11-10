# Day 2 Challenges

Four challenges, plus one for the whole team. Each one has a clear finish line.

| # | Challenge | You work in | About |
| --- | --- | --- | --- |
| 1 | Fixer Upper | **Test a draft** on the live link (nothing to commit) | 10 min |
| 2 | Your Path | your path file | 20 min |
| 3 | The Locked Door | your path file | 10 min |
| 4 | Spot the Sabotage | a teammate's pull request | 12 min |
| 5 | *Team:* All Roads | the whole story | by the due date |

## How the challenges work

- **Every change to the story is a pull request**, reviewed and approved by a
  teammate before it's merged. README section 2 has the steps. You don't need
  to make a branch first: choosing *Create a new branch for this commit and
  start a pull request* makes one for you.
- **Test before you commit.** Copy your whole file from the GitHub editor,
  open your team's live link, and click **Test a draft**.
- **Proof** for each challenge is listed under *Done when*. Save your
  screenshots as you go.

---

## Challenge 1: Fixer Upper

Someone wrote this short scene set in a hurry, and it has **five mistakes**.
Find and fix all of them using only the engine's messages.

1. Copy the box below (hover over it and click the copy button in its
   top-right corner).
2. Open your team's live link and click **Test a draft**.
3. Under *This draft is*, choose **a practice file**. Paste, then click
   **Test from the top of my draft**.
4. Click the red **⚠ problems** button and read the first message. Then click
   **Edit the draft** (in the yellow bar), fix that one thing in the text box,
   and test again. Repeat.

```text
## bridge
![An old rope bridge over a deep canyon](images/Bridge.svg)

A rope bridge sways over a canyon so deep you can't see the bottom. The wind howls through the ropes.

[Cross the bridge](bridge-middle)
[Look for another way across](#detour)

## bridge-middle
Halfway across, a board cracks under your foot and drops away into the dark.

[Run for the far side](#far-side)
[Grab the rope and hold on](#hold-on)

## hold-on
You hang on as the bridge bucks and swings. Slowly, hand over hand, you pull yourself along the rope.

[Keep going](#far-sid)

## far side
You made it! On this side of the canyon there's a little stone hut with smoke curling from its chimney, and someone is waving at you from the door.

THE END

## detour
You walk along the edge of the canyon for an hour. There is no other way across.
```

**Done when:** the button says **✓ No problems**, and you can play from the
bridge all the way to the hut. **Proof:** a screenshot of the hut ending with
**✓ No problems** showing.

<details>
<summary>Stuck? A hint for each mistake</summary>

- One choice is missing the mark that says "this is a scene in the story."
- One choice has a typo in the scene it leads to.
- One scene name has a space in it.
- One scene is a dead end: no choices, and not an ending.
- One picture's file name doesn't match the real file exactly. Look at the
  capital letters. (This one only shows up on the live site, because only the
  web server can tell you the picture is missing.)

</details>

---

## Challenge 2: Your Path

Replace the sample scenes in your path file with your own part of your
team's story.

- Keep your first scene's name, `## path-1` (or 2, 3, 4...). The crossroads in
  `start.md` links to it, so that's how players reach your path.
- Write **at least 4 scenes** and **at least 2 different endings**.
- Delete the sample scenes you're not using.

**The owner** also rewrites `start.md` for your team's story: the title, the
opening scene, and the words of the crossroads choices. Do that in its own
pull request.

While teammates are halfway through replacing the sample, you may see yellow
warnings about the sample's **lantern** or **iron key**. They disappear once
everyone's sample scenes are gone.

**Done when:** your pull request is approved by a teammate and merged, and on
the live link's **Story map**, your color has at least 4 boxes and at least 2
endings (☆), with no problems in your file. **Proof:** your pull request's link
and a screenshot of the Story map.

---

## Challenge 3: The Locked Door

Give your path a puzzle: something the player has to find before they can
get through.

1. In one scene, add a line like `get: rusty key`.
2. In a later scene, add a choice that ends with `if rusty key`:
   `[Open the cellar door](#cellar) if rusty key`
3. Make sure the player can find the item **before** they need it, and that
   the locked scene has another way out, so nobody gets stuck there.

To test both ways quickly, add `?scene=` to the end of your live link to start
at the locked scene carrying nothing, then add `&items=` to start there
carrying the item:

```text
https://OWNER.github.io/adventure/?scene=cellar-stairs
https://OWNER.github.io/adventure/?scene=cellar-stairs&items=rusty key
```

**Stretch:** make the lock need an item from a *teammate's* path. Agree on
the item's exact spelling first: `get: rusty key` and `if rusty-key` are
different items.

**Done when:** your pull request is approved and merged; without the item the
choice shows 🔒, with it the choice works; and the Story map shows a dashed
arrow labeled with your item. **Proof:** two screenshots, one locked and one
unlocked.

---

## Challenge 4: Spot the Sabotage

The Story check catches mechanical mistakes: broken links, dead ends, missing
pictures. It can't tell whether the story makes **sense**. That's the
reviewer's job. Work in pairs.

1. Make a pull request with a small real improvement to your path: a new
   scene, a better sentence, a new choice.
2. Secretly slip in **one** mistake from this list. Don't tell your reviewer.
   - **Wrong turn:** a choice that leads to a real scene, but not the one its
     words promise. (*Climb the stairs* leads to the cellar.)
   - **Name swap:** a character or place called something different in one
     spot. (*Rosa* the baker becomes *Rita*.)
   - **Item mix-up:** a scene says you find one thing, but its `get:` gives
     you something else.
   - **Contradiction:** a sentence that can't be true given an earlier scene.
     (It's midnight, and then the sun is in your eyes.)
3. The Story check will pass with a green ✓. That's the point.
4. **Reviewer:** read every changed line and play it. When you find the
   mistake, click **Review changes** → **Request changes**, and say exactly
   where it is and what's wrong.
5. **Writer:** fix it on the same branch (**Files changed** → **⋯** →
   **Edit file**). **Reviewer:** check the fix, then **Approve** and merge.

If the reviewer hasn't found it after 5 minutes, the writer reveals it. That
still counts. Talk about why it was hard to see.

**Done when:** your pull request shows a *changes requested* review that
names your mistake, then an approval, then a merge, and you've done the same
as a reviewer on your partner's pull request. **Proof:** links to both pull
requests.

---

## Challenge 5 (team): All Roads

By the due date, your team's `main` meets all of these:

- The live link shows **✓ No problems**, and the Story check on `main` is green.
- Every teammate's path has their name after `by:`, at least 4 scenes, and at
  least 2 endings.
- At least one locked choice needs an item from a **different** teammate's path.
- None of the sample story is left.

**Proof:** a screenshot of the whole Story map (one per team is fine, but
everyone includes it in their submission).

**Bonus:** a secret ending that needs one item from *every* teammate's path.

---

## When you're done

- Play your team's whole story from the start, and try to find every ending.
- Have someone outside your team play it. Watch where they get confused.
- Try [docs/IDEAS.md](docs/IDEAS.md) for bigger features.
