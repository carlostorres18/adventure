<!--
  PATH-2.MD: the cliff trail, the fog bell, and the register in the cave.

  PUT YOUR NAME AFTER by: BELOW. It is shown at the end of every ending
  in this file.

  HOW THIS PATH IS BUILT (notes for my reviewer)

  This path and path-3.md are two halves of one puzzle and link straight
  into each other:
     the-edge   -> #path-3     (you fall off the cliff onto the beach)
     the-gift   -> #sea-stair  (in path-3.md)
     not-yet    -> #sea-stair  (in path-3.md)
     sea-stair  -> #bell-house (path-3.md links back up here)

  IT ALSO JOINS UP WITH CARLOS'S TIME LOOP in path-1.md and path-4.md.
  Nothing in his files had to change. The eleven names on the cave wall are
  not eleven people. They are eleven goes round the same night, by the same
  person, and the engine counts the player's real goes to work out how many
  there are. See the-register, twelve and maren.
  Scenes here that answer his ending use
     (if ending lighthouse-dawn) ...
  which is true only once the player has really broken the loop in path-4.
  No edit to his file needed.

  WHAT'S NEW IN THE ENGINE AND WHERE IT IS USED HERE
     game: bell              ring-it        a rhythm game, with a skip button
     effect:                 most scenes    fog, dark, flicker, dread, slow
     sound:                  most scenes    off until the player turns it on
     (if ...) paragraphs     the-register, twelve, maren, cave-mouth
     {runs} {endings-list}   the-register, maren, twelve
     keep: / if kept         maren, relieved
     haunted gone / waits    twelve         THE scene. See below.
     haunted flees / glitch  cave-mouth, the-register
  All of it is written up in docs/ENGINE.md.

  THE SCENE WITH NO WAY OUT is "twelve". The choice to leave is there and
  cannot be picked, which the engine allows only because another choice is
  waiting behind it. story.js refuses to build a scene where every choice is
  "haunted gone", so this can never trap anybody for good.

  ITEMS THIS FILE GIVES
     the rota, white feather, a name you didn't give,
     a bruise shaped like the island

  ITEMS IT NEEDS FROM OTHER PEOPLE
     lantern             path-1.md (Rosa)
     stopped watch       path-1.md (Abernathy's chair), opens one extra scene
     iron clapper        path-3.md (the wreck)
     the same key twice  path-3.md (the fold)

  THE SECRET ENDING is "relieved": a chain of four locked choices
     the-ritual -> rite-light (lantern) -> rite-breath (white feather)
                -> rite-name (the rota) -> relieved (the same key twice)
  Every step has an unlocked way out. A second secret ending,
  "the-twelfth-line", hangs off the last step for a player carrying the name.

  TESTING (add to the live link):
     ?scene=the-register&items=lantern
     ?scene=ring-it&items=iron clapper        the rhythm game
     ?scene=twelve&items=lantern              the scene you cannot leave
  The Memory button in the bar shows what this browser has on you, and wipes it.

  Lines inside these comment marks are notes. Players never see them.
-->

by: Nistopher Chrolan

## path-2
theme: storm
![A narrow trail along a cliff above a grey sea, with wind driving fog past and gulls wheeling](images/cliff-trail.svg)
effect: fog
sound: wind

The cliff trail is a ledge the width of a coffin lid, and the wind shoves at you the whole way, like something that has done this before and knows which shoulder to pick.

Far below, the waves go at the rocks without stopping. Gulls hang in the air over the drop without moving at all, which is a thing gulls can do and people should not have to watch.

Two things on this stretch of cliff. A little stone shelter squats on the high side of the trail with something heavy hanging in it. Further on, a cave opens in the rock, and the dark inside it is not the same colour as the night.

(if run 2) Your feet know the trail before your eyes do. You have not been up here before. Your feet disagree.

(if ending lighthouse-dawn) Somewhere behind you the clocks are running. You did that. You are not sure how many goes it took, but it took every one of them.

[Shelter in the little stone building](#bell-house)
[Keep going to the cave](#cave-mouth)
[Lean out and look over the edge](#the-edge)
[Go back to the crossroads](#crossroads)

## the-edge
theme: storm
effect: shake
sound: splash

You lean out for a better look at the drop. This is the part of the night you will skip when you tell it later.

The edge is softer than it looks. It lets go of you politely, the way a handshake ends.

You slide. You bounce twice. You land flat on your back in a pool between two rocks, in water that is exactly as cold as water gets before it stops being water, and you are not hurt at all, which somehow makes it worse.

get: a bruise shaped like the island

[Lie here a moment and let the sky happen](#star-count)
[Crawl out onto the grey sand](#path-3)

## star-count
theme: storm
You lie in the pool with your ears underwater and look straight up.

Gulls are crossing the sky. Not circling. Crossing, in a line, all of them going the same way, out over the water and back again, out and back, the way a lamp turns.

They are doing it in shifts.

(if remembered maren) You know who is up there. You know what she is doing. You lie in the cold water and watch her work.

[Crawl out onto the grey sand](#path-3)
[Find the steps cut into the cliff and go back up](#sea-stair)

## bell-house
theme: storm
sound: wind

Four stone legs and a slate roof, and under it a bronze fog bell the size of a washtub, green at the shoulders and polished gold along the rim where two hundred years of hands have gone past it.

The rope is rotted to a hank of fluff. The pin where the clapper hangs is empty. Somebody took the clapper out of this bell, and they took it carefully, because the pin isn't bent.

On the back wall there is a slate in a wooden frame. The keeper's rota. You lift it off its nail.

get: the rota

[Read the names on the slate](#eleven-names)
[Hang the clapper on the pin and ring](#ring-it) if iron clapper
[Get out of the wind and wait for morning](#stone-coat)
[Back out onto the trail](#path-2)

## eleven-names
theme: storm
Eleven names, in eleven different hands, each with two dates beside it. Started, and finished.

*M. VELL, 1801.* The writing is beautiful and the ink is brown as tea.

Nine more after her, and the handwriting gets worse as it comes down the slate, the way handwriting does when somebody is tired, or cold, or has done a thing too many times to care what it looks like.

At the bottom, in pencil, pressed so hard it has cut the slate: *A. ABERNATHY, 1984.*

Under that there is a twelfth line, ruled and empty, and a stub of chalk on the frame.

You are fairly sure the old man in the village answered his own front door tonight.

[Write your name on the twelfth line](#your-name)
[Put the slate back on its nail](#bell-house)
[Go and look at that cave](#cave-mouth)

## your-name
theme: storm
effect: flicker

You write your name on the twelfth line. It is a stupid thing to do and you know it while you are doing it, the way you know about the second slice of cake.

The chalk is damp. It drags.

When you put it down and step back, the eleventh line is in your handwriting too.

So is the tenth.

[Put the slate back on its nail, face in](#bell-house)

## ring-it
theme: storm
game: bell
sound: bell

The clapper goes on the pin like it has been wanting to.

You take the bell by the rim with both hands. It weighs as much as a person. To get a note out of it you have to swing with it and not against it, and to get a note that carries a mile out into fog you have to do that over and over, until the whole headland is ringing.

[The sound goes out over the water](#toll) on win
[Your arms give out](#arms-gave-out) on lose

## toll
theme: storm
![A bronze fog bell hanging in a small stone shelter on a clifftop, swinging, with rings of sound spreading out into the fog](images/fog-bell.svg)
sound: bell

The first note goes through your teeth. The second one goes out over the water and keeps going, and the fog does not muffle it at all, because this bell was cast in a town that understood fog.

Somewhere out there a horn answers, and then the engine note changes, dropping and sliding, and you know before you know that she is coming round. Turning. Turning away from the rocks.

The lighthouse stays dark the whole night. It does not matter. Nobody drowns.

In the morning you go back in and look at the slate, and the twelfth line is still empty. You check it twice.

THE END

## arms-gave-out
theme: storm
Your arms stop being arms somewhere around the twentieth swing. The bell goes on moving for a while without you, getting quieter, the way a conversation does.

You sit down in the wet grass underneath it and listen to the horn out there, which does not change course, and does not stop, and then does stop.

In the morning they find the bell still faintly warm where your hands were, and the twelfth line on the slate filled in. Not by you. The handwriting is yours, but you were not holding the chalk.

THE END

## cave-mouth
theme: cave
![A black cave mouth in a wet cliff face, with dust drifting in the air and faint points of light far inside](images/cave-mouth.svg)
effect: dark

Three steps in, the night gives up and hands you over to something darker.

You can hear water finding its way down, and further back, high up, a sound like a crowd in another room: thousands of small movements, all being very careful.

There is a smell of old fish and new paint.

(if run 2) The smell of the paint is the thing you remember. You could not have told anybody that until just now.

[Light your lantern and walk in](#the-register) if lantern
[Feel your way in, one hand on the wall](#blind-crawl)
[Back out into the wind](#path-2) haunted flees

## blind-crawl
theme: cave
effect: dark, dread
sound: heartbeat

You go in with your left hand on the rock, the way you were taught at some point by somebody, and the rock is wet, and then it is not.

It is ridged. Raised. Paint, laid on so thick and so long ago that it has turned into geography.

Your hand reads it without asking you first. A tower. Waves. A ship going down bow-first, which is a lot of detail for a hand.

Then figures. People, standing in a row, each one about the size of your palm. You count them as you go, because that is what a hand does.

Ten. Eleven.

The twelfth is wet.

[Take your hand off the wall](#cave-mouth)
[Keep your hand exactly where it is](#wet-paint)

## wet-paint
theme: cave
effect: dread, static
sound: heartbeat

The paint is warm. Not cave-warm. Blood-warm. It comes away on your fingers in a curl, like skin after a sunburn.

In the dark, very close to your ear, something says a name.

It is said kindly. It is said the way a mother says it at the bottom of the stairs when it is time to come down. And it is your name, except that it is not the one you were given this morning, and you understand, standing there in the dark with your hand in wet paint, that this is the name you have always actually had, and that somebody up here has been holding it for you.

get: a name you didn't give

[Say yes](#answered)
[Run](#path-2)

## answered
theme: night
You answer. Of course you answer. Somebody called you by your real name in the dark and you are only a person.

The cave fills with wings. Not noise, exactly. Pressure, like a held breath let out all at once, and then you are up, and the ceiling does not stop you.

From up here the island is a lovely shape. The tower is a dark finger, the village is five orange windows, and out in the fog there is a ship about to make a mistake.

All of you turn together and go to put a stop to it, and your new name is already on the wall, and your old name is already getting hard to hold on to, the way a dream is at the sink.

THE END

## the-register
theme: ember
![A cave wall painted in ochre: a tall tower throwing a light, waves below, and a row of eleven human figures. A twelfth figure appears in wet paint at the end of the row](images/register-wall.svg)
effect: flicker
sound: lamp

The lantern throws your shadow a hundred feet up the wall, and the wall is painted from the floor to as high as anybody could reach.

A tower, taller than it is in life, throwing six straight rays. Waves. A ship on her beam ends. And across the whole wall, waist high, a row of little ochre people, holding nothing, facing out.

Above you, in the dark, the nests. Hundreds of them. Nobody up there is asleep.

(if run 2) You have stood here before. Something has been counting: this is go number {runs}.

[Count the people on the wall](#twelve)
[Go to the big nest at the back](#maren)
[Back out into the wind](#cave-mouth) haunted glitch

## twelve
theme: ember
effect: slow, dread
sound: heartbeat

You count the row twice, because the first count is the kind of answer you check.

Eleven. Eleven little ochre people, and scratched under each one, two dates. The oldest is 1801 and the ink has gone the colour of tea. The newest is 1984 and it is scratched so hard the rock is pale in the grooves.

Then you look properly, the way you look at a thing you have decided not to understand, and you see it.

They have the same hands. All eleven. The same way of standing, with the weight on the left. M. VELL holds her lamp the way you are holding yours, and so does the one after her, and the one after that, and the only thing that changes down the row is the handwriting underneath, getting worse and worse, the way handwriting does when somebody has written the same name too many times to care.

Eleven names. One person. Eleven goes at the same night.

At the end of the row there is a twelfth, and it is being painted while you watch, and whoever is doing it has got the coat right, down to the way the left pocket hangs because of what you keep in it.

(if run 2) You counted eleven the first time too. There were eleven then. You have had {runs} goes at this island, and you would like it very much if those two numbers were not drifting towards each other.

(if ending undertow) One of them is wet to the shoulder. You know which go that was.

(if remembered pocket) In your coat pocket, something that has been asleep since the beach puts one claw out and holds on to the seam.

[Leave. Just leave](#path-2) haunted gone
[Put your hand flat against the wet one](#wet-paint)
[Finish it yourself](#maren) haunted waits 9

## maren
theme: ember
![A large white gull sitting in a nest of driftwood, wearing a tiny golden crown, with hundreds of pale eyes watching from the dark behind her](images/gull-queen.svg)
effect: flicker, dread
keep: the gulls know your face

The nest at the back is six feet across and built of driftwood, bootlaces, rope, one oar, and a brass porthole frame.

In the middle of it sits a gull. She is enormous and she is white the way a plate is white, and on her head, pushed down over the feathers, is a crown about the size of a wedding ring.

She looks at you. Not the way a bird looks at you, with one eye and then the other. Straight on, with both, the way a person does when they are deciding how much to tell you.

On the wall above her is the first figure in the row, and under it, in that beautiful brown writing: *M. VELL, 1801.*

It is the same hand that wrote the eleventh name. It has just had longer to get tired.

(if kept the gulls know your face) She does not have to look twice this time.

(if run 2) She counts you. She does it the way a teacher counts a class at the door, and the number she gets is {runs}, and you can see her get it.

[Bow](#the-gift)
[Ask her how to light the lamp](#she-cannot)
[Ask whether anybody has ever been let off](#the-ritual)
[Ask her what she already knows about you](#she-recites) if run 2
[Show her the stopped watch](#the-watch) if stopped watch
[Put Clackers down in front of her](#clackers-meets-maren) if a brass button
[Show her your bruise](#bruise) if a bruise shaped like the island
[Back away slowly](#the-register)

## she-recites
theme: ember
effect: slow, static

You ask her what she knows.

She puts her beak in the dried ochre on the shelf and starts writing on the rock, in the short flat strokes of a bird who learned to write with a beak two hundred years ago and has had nothing else to do since.

She writes down where you have got to before. Not where the keeper got to. Where *you* got to, on the other goes, the ones before this one, the ones you remember and she has no business knowing about.

**{endings-list}.**

She stops. She looks at you, to check you have read it. Then she adds one more mark underneath, which is the time on the clock in the room you are sitting in, which is {clock}, and which has nothing whatever to do with this island.

You started coming here {first-played}.

[Say nothing](#the-gift)
[Ask her to stop](#she-cannot)
[Back away slowly](#the-register)

## the-watch
theme: ember
sound: tick

You take out the silver pocket watch with its hands stopped at 9:47 and hold it where she can see it.

Every bird in the cave stops moving at once. Not startled. The other thing. The way a room goes when somebody says the name of the person who died.

She comes down off the nest and puts her head right down to it, one eye and then the other, for a long time. Then she makes a sound you have no word for, and goes back up, and arranges herself, and will not look at you again for a while.

She has seen that watch before. She was there when it stopped.

[Bow](#the-gift)
[Back away slowly](#the-register)

## clackers-meets-maren
theme: ember
sound: tick

You put the crab down on the rock between you, with the brass button still
held up in front of him like a season ticket.

The Gull Queen looks at the button. Then at the crab. Then at the button.

It is a keeper's coat button, and she has worn that coat, and she has drowned
in that coat, and a crab on a beach has been carrying one around for years
because it was shiny and it was his.

She bows to him. A gull bows to a crab, in a cave, at some hour of the night,
and neither of them thinks this is strange, and you are the only person who
will ever know it happened.

Clackers walks back up your sleeve and into the pocket.

[Bow as well, because what else](#the-gift)
[Back away slowly](#the-register)

## she-cannot
theme: ember
"How do I light it," you say, out loud, to a bird.

She comes up off the nest so fast you sit down. She lands on the rim, and she lifts one wing, and she holds it out to you, and she keeps holding it out, and she will not stop holding it out until you have understood.

There is no hand on the end of it. There was never going to be.

Two hundred years of knowing exactly what to do, in a building you can see from here, and nothing on the end of your arm to do it with.

She folds the wing. She puts the side of her head against your palm and leaves it there a while.

[Bow](#the-gift)
[Back away slowly](#the-register)

## bruise
theme: ember
You push your sleeve up and show her the bruise you got falling off her cliff. It came up blue and green and it is, you have to admit, a very good likeness. There is the headland. There is the long bay. There is the hook at the south end where the sand is.

She studies it for a long time, turning her head.

Then she taps it, twice, with the tip of her beak, in the place where the cave is.

Then she taps it again, lower down, where the sand is, and then she taps it a third time, in the water, well off the beach, where there is nothing at all except, presumably, something.

[Bow](#the-gift)
[Back away slowly](#the-register)

## the-gift
theme: ember
You bow, which feels enormously stupid for about a second and a half, and then does not.

She gets up. She puts her head down into her own breast, right down, and pulls, and it must hurt because her whole body goes with it, and she comes up with one feather and lays it across your palm.

It is dry. Everything in this cave is wet and the feather is dry and faintly warm, and when you breathe in, the breath comes in easy and cold and tasting of outside, which is strange, because you are four hundred feet into a cliff.

get: white feather

[Ask her and her birds to go out for the ship tonight](#chorus-flight)
[Ask whether she can be let off](#the-ritual)
[Go and count the people on the wall](#twelve)
[Take the feather down the cliff steps to the beach](#sea-stair)
[Go back out to the trail](#path-2)

## chorus-flight
theme: night
![Thousands of white gulls spiralling over the rocks at night, their wings so bright they light the water below, while a ship's lamp turns away from the shore](images/chorus.svg)
sound: gull

You ask.

She is already going. The nests go up like a field going up, and the cave empties past your face in one long shove of air that puts your lantern out and nearly puts you out with it, and you come stumbling onto the trail to watch.

They go out over the rocks and they turn, all of them, into one slow wheel above the place where the water is wrong, and they lift their wings together on the upbeat, and there is so much white in one place that it makes a light. Not a bright light. A light the way a moon is a light. Enough.

Out in the fog a horn goes, twice, and a ship that was about to die goes somewhere else instead.

They have been doing this every foggy night since 1801. Nobody has ever thanked them. Nobody has ever known. Every one of them is you.

In the morning you tell the village, and the village is very kind about it.

THE END

## the-ritual
theme: ember
effect: flicker

You ask her whether anybody has ever been let off.

She goes very still. Then she walks, which she does badly, all the way along the base of the wall to the far end, and waits for you to bring the light.

There is a shelf cut into the rock. On it: a cracked saucer with ochre dried in it, a stub of chalk, and a shallow groove worn in the stone by something being set down in the same place about four thousand times.

A register is only a register if somebody can read it, sign it, prove it, and burn out the old line. That is four things, and you can feel her counting them, and she is not hopeful, because she has watched eleven people stand on this exact piece of floor and every one of them was her.

[Set your lantern on the shelf](#rite-light) if lantern
[Leave it. Two hundred years is not your mess](#the-register)

## rite-light
theme: ember
sound: lamp

You set the lantern down in the worn place and it fits like a cup in a saucer.

The flame stands up straight, and then leans, all of it, sideways, towards the wall, and stays leaning. Under the first figure the old ochre goes soft and shines like it was put on this afternoon.

That is the reading done.

[Put the feather between your teeth and breathe through it](#rite-breath) if white feather
[Pick your lantern back up and go](#the-register)

## rite-breath
theme: ember
effect: wrong
sound: wind

You put the feather crossways in your teeth, which is undignified, and you breathe in through it.

The cave opens by about an inch.

You can smell tar, and wet wool, and a woman's wet hair, and lamp oil of a kind they stopped making before your grandmother was born. Somewhere just out of sight, at the other end of a very long room, somebody is climbing stairs in boots, in 1801, and being quick about it, and not being quick enough.

That is the signing done.

[Hold up the rota so she can see the empty line](#rite-name) if the rota
[Spit out the feather](#the-register)

## rite-name
theme: ember
effect: dread

You hold the slate up in the lantern light and turn it so she can see.

Eleven names. One empty line. One handwriting, wearing out.

She looks at the empty line for a long time. Then she looks at you, and you understand the problem exactly, because it is the same problem she has had since 1801: anybody can write a name, and she has written this one eleven times. The line does not want a name. The line wants proof that the person writing it can get out of the night.

The proof would have to be a thing that was in two centuries at once, and still worked.

[Show her the key that is in two places](#relieved) if the same key twice
[Offer the name they gave you in the dark](#the-twelfth-line) if a name you didn't give
[Tell her the truth, which is that you can't prove anything](#not-yet)

## not-yet
theme: ember
"I can't prove it," you say. "I haven't got anything."

She takes it better than you do. She has had practice. She settles down onto the stone with her feet tucked under her, which is a bird saying *fine, I'll wait*, and the waiting is the worst thing you have ever been forgiven with.

Then she gets up again and walks to the cave mouth and stands looking down, south, at the beach, at the ribs of a boat sticking out of the sand, and she stands there until you have got it.

[Go down the cliff steps to the beach](#sea-stair)
[Go back out to the trail](#path-2)

## the-twelfth-line
theme: dawn
effect: slow

You cannot prove you can get out of the night. You have not got two of anything. What you have got is a name that was handed to you in the dark by something that was already here, and you have been carrying it around all night in the pocket where you keep the things you are not ready to look at.

You say it out loud.

She goes very still, because she knows exactly what it costs and exactly what it buys, and they are not the same number and they never have been.

The line will not strike her out for a name. But it will take one.

You write it on the twelfth line yourself, in your own hand, with the damp chalk, and the chalk does not drag this time. She does not get to leave. Neither do you. But there is a difference between the eleven on that wall and what you have just done, and the difference is that nobody asked you.

She comes down off the nest and stands beside you, and that is the whole ceremony.

You light the lamp that night at eleven minutes past nine, and the ship comes round the headland and gives you two on the horn, and you lift a hand, which is a thing you can still do.

You light it the next night. And the one after. And for a long time after that.

And then one foggy evening a long way from now, somebody young comes up the cliff trail with a borrowed lantern and their collar up, and stops at the mouth of the cave, and you are already awake, and you have had a feather ready for years.

THE END

## relieved
theme: dawn
![The painted register with the first name struck through, as the painted figures lift off the wall one by one and leave as birds of light](images/relieved.svg)
effect: slow
sound: lamp
keep: the register is closed

You take both keys out and hold them up together in the lantern light. The rusty one from the tin box. The bright one out of a drowning man's fist. The same nicks. The same little bend where somebody dropped it on a stone floor in a year nobody here was alive for.

She makes a sound. One sound. It is not a gull noise and you will hear it for the rest of your life.

Then she puts her beak in the saucer and gives you the ochre, and you kneel down and strike out *M. VELL, 1801*, one line, left to right, and you write your own name on the twelfth line of the slate, and under it, because it is true, you write *on duty*.

The first figure comes off the wall.

It does not fade. It stands up off the rock, the way a bird comes off a cliff, and it is a bird, and it is also a tall woman in a wet coat, and it goes up and out through the cave mouth and does not come back.

Then the second. Then the third. Then all of them at once, eleven goes at one night going out past your face into the open air, and the cave gets lighter and lighter as they leave, until it is just a cave, painted a long time ago, by somebody who had the time.

She goes last. She stops in the mouth of it, where the wind is, and the crown falls off her head and rings on the stone like a dropped coin, and then there is nothing up there but weather.

You pick up the crown. It is a wedding ring.

You pick up your lantern. You have a key in each hand and three flights of stairs to climb and a light to get going, and you are, as of about a minute ago, the only person on this island whose job it is.

You are not late.

THE END

## stone-coat
theme: storm
effect: dread
sound: heartbeat

You sit down with your back to the stone and your knees up, and you decide, reasonably, that this is a job for the morning.

The wind drops. That is the first thing. Then the gulls settle on the roof, one and one and one, until the slates are full, and they do not make a sound, which gulls do not do.

You are not cold any more. You notice this and decide not to think about it.

In the morning the ship is through and anchored and fine. You go in to put the rota back, and there are twelve names on it now. The twelfth is yours. Both dates are today.

THE END
