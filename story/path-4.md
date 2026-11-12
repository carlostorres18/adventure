<!--
  PATH-4.MD: one teammate's part of the story.

  Put your name after by: below. It's shown at the end of your endings.

  Your first scene must be called path-4. The crossroads scene in start.md
  links to #path-4, so that's how players get here. Everything else in this
  file is yours: rewrite it, add scenes, add endings.

  Cheat sheet:
    ## scene-name                  starts a new scene (lowercase letters,
                                   numbers and dashes, no spaces)
    Any text you like.             a blank line starts a new paragraph
    **bold**   *italic*
    ![What the picture shows](images/my-picture.png)
    get: lantern                   the player picks up a lantern
    [Open the door](#hall)         a choice: leads to the scene called hall
    [Unlock it](#vault) if key     a choice that only works if you have a key
    THE END                        this scene is an ending

  Lines inside these comment marks are notes. Players never see them.
-->

<!--
  NOTES FOR THE TEAM (path-4)
  ITEMS THIS FILE GIVES
     lamp oil       (stairs)   for path-2's "fifth tumbler" hook, if you want it
  ITEMS THIS FILE NEEDS
     iron key       from path-3.md (the-ribs)
     lantern        from path-1.md (bakery or abernathy-warning)
     stopped watch  from path-1.md (Abernathy's chair) -> true ending
  TEST:  ?scene=lamp-room&items=lantern,lamp oil
         ?scene=lamp-room&items=lantern,lamp oil,stopped watch
-->

by: Carlos Torres

## path-4
Up close, the lighthouse is taller than it looked. Its white paint is peeling, and the great lamp room at the top is completely dark. The door is thick oak with an iron lock.

Above the door hangs an old iron clock. Its hands are stopped at **9:47**.

[Unlock the door](#stairs) if iron key
[Knock and hope someone answers](#knock)
[Go back to the crossroads](#crossroads)

## knock
You knock three times. The sound echoes up the inside of the tower.

Then, from the other side of the door, three knocks answer. Same rhythm. Same strength. Exactly one heartbeat late.

You press your ear to the oak. A voice comes through, muffled and tired. It sounds a lot like yours.

"Not yet. The key went down with *Abernathy's Pride*. South beach, low tide."

[Step back](#path-4)

## stairs
The key turns with a groan. Inside, a spiral staircase winds up into total darkness.

Someone has scratched numbers into the steps. The first step says 100. The next says 99. The numbers count *down* as you climb, as if the stairs are counting down to something.

On the first landing sits a dented can of lamp oil, full, with a label in faded pencil: *For the twelfth. Don't be late.*

get: lamp oil

[Climb in the dark](#fall)
[Light your lantern and climb](#lamp-room) if lantern

## fall
Somewhere around step eleven, the one with its number scratched out, your foot finds nothing at all. You sit down hard and decide to wait for morning.

The ship gets past the rocks, just barely. The next day, its captain sends you a very angry letter.

It's dated yesterday.

THE END

## lamp-room
At the top, the great lamp sits inside a cage of glass prisms. Beside it is the clockwork that turns the lens: brass gears, a long chain, and a dial stopped at **9:47**.

In the center of the gears is a small round slot, empty, about the size of a pocket watch.

On the floor, someone has scratched tally marks into the boards: eleven long columns, each in a different hand, one mark for every night of duty. The first column is in a beautiful old script. The eleventh, cut deep and angry, stops short in November 1984.

[Light the lamp the way it is](#lighthouse-lit)
[Fit the stopped watch into the clockwork](#lighthouse-wind) if stopped watch

## lighthouse-lit
You open the little door at the lamp's base, pour in the lamp oil, turn the brass valve, and touch your lantern's flame to the wick.

The light blooms. Far out in the fog, a ship's horn answers with two long blasts. *Thank you.*

But the lens doesn't turn. The clockwork is still stuck at 9:47, so the beam just points one way, straight down at the dock.

In its light you see the ferry pulling in. A new keeper steps off, holding a brass lantern, looking up at you.

You pick up a nail and start a twelfth column. One mark. You have a feeling it won't be the last.

THE END

## lighthouse-wind
You press the watch into the slot. It clicks into place like it was made for it. Maybe it was.

For a moment, nothing happens. Then the watch gives a single tick, and the big dial jumps from 9:47 to **9:48**.

The gears groan and start to turn. The prisms begin to rotate, and as they do, you see things in the glass: the dock, the bakery, Abernathy's doorway, the painted wall in the gull cave. And the keepers. A tall woman in a long wet coat, running up these stairs with an oil lamp in 1801. Nine more after her. A big dark man at the oars of a fishing boat, rowing into the fog.

And a twelfth, standing at the lamp, right now. You.

[Look closer at the prisms](#lighthouse-prisms)
[Light the lamp before anything else changes](#lighthouse-dawn)

## lighthouse-prisms
In one prism, a young keeper is reading a note on the back of an old photo. In another, an old man is opening his door just a crack.

In the brightest prism, you see this room. You see yourself, right now, standing at the lamp.

Behind you in the reflection, Abernathy is smiling. When you spin around, nobody is there. Only a faint smell of blackberry pie.

[Light the lamp](#lighthouse-dawn)

## lighthouse-dawn
You pour in the lamp oil, turn the valve, and touch your lantern to the wick. The light blooms, and this time the lens carries it around in a slow, sweeping beam, out across the water, again and again.

Far out in the fog, a ship's horn answers with two long blasts. *Thank you.*

On the next sweep, for one heartbeat, the beam catches something much closer: a small fishing boat with a crisp new name on her side, and a big dark man at the oars. He squints up at the light. Then he lifts one oar out of the water like a wave, and turns her around, and rows for home.

You stay at the lamp all night. At some point you realize you've stopped counting the minutes, because the minutes are finally moving on their own.

When the sun comes up, the ferry doesn't come back. Down in the village, every clock is ticking. And on the dock, an old man in a fisherman's coat waves up at the tower once, then turns and walks into the morning.

THE END
