# The second half of the engine

Everything in [README.md](../README.md) still works exactly as it did. This
page is the **extra** things a scene can do: remember earlier goes at the
story, be played instead of read, change how the page looks, and misbehave.

Nothing here is required. A path written entirely with the plain cheat sheet
is still a good path.

> **Rule one.** None of this can ever stop a player getting through the story.
> Every game has a button that skips it. Every haunted choice has a way past.
> The checker refuses to build a story where that isn't true.

---

## The cheat sheet, part two

```text
get: lantern                   the player picks something up      (you knew this)
lose: lantern                  ...and this takes it away again
keep: clocks running           remembered for good, across every go

game: undertow                 this scene is played, not read
[You get out](#safe) on win    where the game sends them if they win
[It keeps you](#lost) on lose  ...and if they lose

effect: fog                    what the page does while the scene is up
sound: bell                    a short sound, if the player has sound on

(if run 3) You've done this.   a paragraph only some players see
[Again](#x) if remembered cave a choice only some players get

It is {clock} where you are.   the engine fills in the curly brackets

[Leave](#out) haunted gone     something is wrong with this choice
```

---

## Remembering earlier goes

The page keeps a note, **in that one browser on that one computer**, of what
the player has done. Nothing is sent anywhere. Nobody else can see it. The
**Memory** button in the bar shows the player exactly what is stored, lets
them wipe it, and lets them turn it off.

A **go** starts whenever the story starts from its first scene: opening the
page, **Start over**, or **Play again**.

### Four things you can ask about

| You write | True when |
| --- | --- |
| `if lantern` | they are carrying it *right now* (this is the old one) |
| `if run 3` | this is their third go or later |
| `if remembered cave` | they reached the scene `cave` on an **earlier** go |
| `if ending sandcastle` | they have reached the ending `sandcastle`, ever |
| `if kept clocks running` | some scene has done `keep: clocks running`, ever |

Visiting a scene twice in one go does **not** make it a memory. It has to be
an earlier go. That's what makes `if remembered` feel like the story
recognising you.

### On a choice

```text
[Take the shortcut you found last time](#tunnel) if remembered tunnel
[Ask her what she already knows](#she-recites) if run 2
```

A choice you can't take yet shows with a 🕯 and says why.

### On a paragraph

Put the condition in round brackets at the **start of a paragraph**:

```text
(if run 2) Your feet know the trail before your eyes do.

(if ending undertow) One of them is wet to the shoulder.
```

**Leave a blank line between them.** Two `(if ...)` lines with no blank line
between run together into one paragraph, and the second one gets shown to the
player as words. The checker catches this and says so.

### Keeping something for good

`get:` lasts until the player starts over. `keep:` lasts forever.

```text
## lamp-room
keep: clocks running
```

After that, `if kept clocks running` is true on every future go, until the
player wipes their memory. Use it for the one or two things that should
change the story permanently.

---

## The curly brackets

Write any of these in a sentence and the engine swaps in the real number.

| | |
| --- | --- |
| `{runs}` | how many goes this browser has had |
| `{endings-found}` / `{endings-total}` | how many endings they've reached |
| `{endings-list}` | the names of the endings they've reached |
| `{drownings}` | how many times they've lost the undertow game |
| `{clock}` | the real time on the player's own computer |
| `{first-played}` | when they first opened the story (*"three days ago"*) |
| `{last-ending}` | the ending that finished their previous go |

```text
You have had {runs} goes at this island, and you would like it very much
if those two numbers were not drifting towards each other.
```

Used sparingly this is the strongest thing in the engine, because it is the
one moment the story is talking about the person holding the mouse. Used in
every scene it is just a scoreboard.

---

## Scenes you play

```text
## the-dive
game: undertow
[You come up under her hull](#the-fold) on win
[The sea keeps you](#undertow) on lose
```

A scene with a `game:` line shows the text, then the game. The choices are
not clicked, they are the two ways out.

| Game | What it is |
| --- | --- |
| `undertow` | swim up through dark water while the sea throws things at you |
| `bell` | ring a heavy bell in time with its swing |

**Both games read what the player is carrying.** In `undertow`, a `lantern`
lets you see much further, a `white feather` gives you more air and longer to
recover after a hit, and `the same key twice` gives you three blinks through
the fold on the space bar. That is the point of them: the items you collected
by reading change a part you play.

Both games are winnable with the arrow keys, with the mouse, or with a finger,
and both have:

- **Skip this and keep reading** — goes straight to the `on win` scene. Not
  being able to play a game is never a reason to miss the story.
- **Let go** / **Stop ringing** — goes to the `on lose` scene, on purpose,
  because losing can be a real choice rather than a failure.

The checker makes sure every `game:` scene has exactly one `on win` and one
`on lose`, and that no other scene uses them.

---

## Effects and sounds

```text
effect: fog, flicker
sound: wind
```

| `effect:` | |
| --- | --- |
| `fog` | fog drifts across the page |
| `underwater` | caustics, and everything leans a little |
| `dark` | the page dims |
| `flicker` | lamplight |
| `shake` | one jolt, when the scene opens |
| `dread` | the page breathes |
| `static` | grain |
| `wrong` | the page leans, very slightly, and you can't quite say how |
| `slow` | the words arrive one at a time; the choices wait until they're done |

| `sound:` | |
| --- | --- |
| `bell` `gull` `splash` `tick` `lamp` `heartbeat` `wind` | |

Sounds are made by the browser itself, so there are no files to upload. Sound
is **off** until the player turns it on with the button in the bar.

Everything here stops under the reader's **reduce motion** setting.

---

## Hauntings

Something wrong with a single choice. Put it at the end of the line.

| You write | What happens |
| --- | --- |
| `haunted flees` | the button moves away from the pointer. It gets tired after four dodges, and the **number key always works** |
| `haunted glitch` | the words come apart now and then |
| `haunted lies` | the words are not the words that were there a second ago |
| `haunted gone` | you can see it. You cannot pick it. |
| `haunted waits 9` | it isn't there yet. It arrives after nine seconds, or sooner if something else refuses to be picked |

```text
[Leave. Just leave](#path-2) haunted gone
[Put your hand flat against the wet one](#wet-paint)
[Finish it yourself](#maren) haunted waits 9
```

That is a scene where the way out is visible and will not work, and a third
option you did not ask for turns up when you stop trying.

**The checker will not let you trap anybody.** A scene where every choice is
`haunted gone` is an error, not a warning. And all of it except `gone` and
`waits` holds still under **reduce motion**, because a button that runs away
from the pointer is not a joke to everyone.

---

## Checking your work

The **problems** button and the **Story check** on every pull request
understand all of this. They will tell you if you:

- use a game, effect or sound that doesn't exist (and suggest the nearest one)
- write `on win` in a scene with no game, or a game with no `on win`
- say `if remembered somewhere` when there's no scene called `somewhere`
- say `if ending x` when `x` isn't an ending
- `lose:` or `if kept` something that no scene ever gives or keeps
- mistype a `{curly bracket}`
- run two `(if ...)` paragraphs together
- make a scene nobody can leave

There are two pages for testing the engine itself, which players never see:

- **`test.html`** — runs the checker, draws every scene in the story, boots
  both games, and reports anything that threw. Open it after changing
  anything in `engine/`.
- **`look.html?scene=the-dive&items=lantern`** — jumps straight to one scene
  with whatever items you name, for looking at it closely.
- **`balance.html`** — plays both games several times with a bot at the
  controls and reports how often it wins. It is how the bell got fixed: the
  fade used to run *after* the hit, so the resonance could touch 100 and be
  knocked back under it every single time, and the bell could not be rung at
  all. The bot sees everything and never panics, so its win rate is an upper
  bound, not a difficulty setting.

---

## Where this is used in the story

| | |
| --- | --- |
| `game: bell` | `ring-it`, in `path-2.md` |
| `game: undertow` | `the-dive`, in `path-3.md` |
| `haunted gone` + `waits` | `twelve`, in `path-2.md` |
| `{runs}`, `{endings-list}` | `the-register`, `maren`, `she-recites` |
| `keep:` | `maren`, `relieved` |
| `if ending lighthouse-dawn` | `path-2`, answering the ending in `path-4.md` |
