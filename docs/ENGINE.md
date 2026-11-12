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
| `{creature-level}` | what level the creature they caught is on |
| `{sand}` | the biggest pile of sand they have ever made |

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
| `duel` | turn by turn, with a creature you caught. Needs an `against:` line |
| `clicker` | pile up sand by clicking, spend it on things that pile it up faster |

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

## Creatures

Something you catch once and keep forever. Not an item: a creature survives
**Start over**, remembers what it learned, and gets better at fighting.

```text
## pocket
catch: clackers
```

| | |
| --- | --- |
| `clackers` | a pocket crab. Pinch, Sidle, Bubble Rasp |
| `squib` | a very small squid. Tug, Ink, Jet |
| `pib` | one gull chick. Peck, Shriek, Fluff |

Each of them has a **fourth move that only appears if the player is carrying
the right item** — Clackers' Button Flash needs `a brass button`, Squib's
Lamplight needs a `lantern`, Pib's The Chorus needs a `white feather`. That is
the best thing in here: an item you picked up by reading turns into a button
in a fight.

Creatures level up by winning, and the level is kept between goes, so a crab
that lost on your first go can win on your third.

## Duels

```text
## molly-duel
game: duel
against: Old Molly, 4
[She lets you past](#molly-won) on win
[She does not let you past](#molly-lost) on lose
```

`against:` takes a name and a level from 1 to 9. **Any name works.** The
engine builds the opponent from the name itself — its shape, its colour, how
many spines it has — so `against: the harbour master's dog, 2` gets you a
particular dog, and it is the same dog every time anybody meets it.

A player with no creature is offered a way out instead of a fight, and
**Run away** always goes to the `on lose` scene. The checker warns you if a
story has a duel in it but no scene anywhere does `catch:`.

## The clicker

```text
## the-build
game: clicker
[The tide takes it](#finished) on win
[You stop, a long way short](#gave-up) on lose
```

Click the sand, buy a bucket, buy a gull, buy three more gulls, until the
tower is finished. A `lantern` makes each handful bigger and `clackers` digs
alongside you. The best pile anyone has ever made in that browser is kept, and
`{sand}` puts the number in a sentence.

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

## Themes, and changing them mid-story

`start.md` picks the theme the story opens in. **Any scene can change it** with
a `theme:` line of its own, and the page cross-fades rather than snapping, so
walking from the beach into a cave is a change in the weather.

```text
## the-fold
theme: deep
effect: underwater
```

| | |
| --- | --- |
| `paper` | the default: warm, printed, quiet |
| `night` | deep blue, with a lit window somewhere |
| `forest` `ocean` | green and daylight; blue and daylight |
| `cave` | wet rock, and whatever you brought to see by |
| `deep` | a long way down, and getting further |
| `ember` | lamplight, close walls, orange on black |
| `storm` | slate, cold, weather with an opinion |
| `dawn` | it was over hours ago and nobody told you |

A theme is more than five colours. Each one sets the paper the page is printed
on, the grain over the top of it, the edge and shadow of the card, what a
choice looks like when you hover it, and what is happening in the air behind
everything.

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
- **`themes.html`** — every theme at once, on one sheet, so you can see what
  you are choosing between.
- **`balance.html`** — plays all four games several times with a bot at the
  controls and reports how often it wins. It is how the bell got fixed: the
  fade used to run *after* the hit, so the resonance could touch 100 and be
  knocked back under it every single time, and the bell could not be rung at
  all. The bot sees everything and never panics, so its win rate is an upper
  bound, not a difficulty setting. It is also where the duel got its numbers:
  over 14 fights each, Clackers beats Old Molly **7%** of the time at level 1,
  **86%** at level 3, and **100%** at level 3 carrying the brass button.
  Losing your first fight is meant to happen, which is why `molly-lost` is a
  scene and not an ending.

---

## Where this is used in the story

| | |
| --- | --- |
| `game: bell` | `ring-it`, in `path-2.md` |
| `game: undertow` | `the-dive`, in `path-3.md` |
| `game: duel` + `catch:` | `pocket`, `old-molly`, `molly-duel`, in `path-3.md` |
| `game: clicker` | `the-build`, in `path-3.md` |
| `theme:` per scene | every scene in both files |
| `haunted gone` + `waits` | `twelve`, in `path-2.md` |
| `{runs}`, `{endings-list}` | `the-register`, `maren`, `she-recites` |
| `keep:` | `maren`, `relieved` |
| `if ending lighthouse-dawn` | `path-2`, answering the ending in `path-4.md` |
