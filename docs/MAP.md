# Map of the codebase

A tour of every file: what it does, and how the pieces fit together. You don't
need to understand the engine to do the assignment. This map exists so the
project doesn't feel like a black box.

```
adventure/
├── index.html              the page: loads the engine
├── README.md               start here
├── CHALLENGES.md           the Day 2 challenges
├── story/                  ← YOUR TEAM'S FILES
│   ├── start.md            title, opening, and the crossroads (the owner)
│   └── path-1.md ...       one path per teammate
├── images/                 pictures used in the story
├── engine/                 ← the machinery (about 1,100 lines)
│   ├── story.js            reads the story files and checks them for mistakes
│   ├── play.js             shows scenes, tracks items, remembers endings
│   ├── map.js              draws the story map
│   ├── draft.js            the "Test a draft" panel
│   ├── check-cli.js        the Story check that GitHub runs on pull requests
│   └── style.css           how the page looks, including the four themes
├── .github/
│   ├── workflows/story-check.yml   tells GitHub when to run the Story check
│   ├── pull_request_template.md    the reviewer checklist on every pull request
│   └── ISSUE_TEMPLATE/             the bug report form
└── docs/
    ├── MAP.md              you are here
    └── IDEAS.md            optional bigger features
```

## The big idea: your story is a web

A story file is a list of scenes, and each choice is a **link** to another
scene. That's exactly how the web works: pages, and links between pages. The
web began as "hypertext," text you can move through by following links, and a
choose-your-own-adventure story is hypertext too.

Draw the scenes as boxes and the choices as arrows and you get the **Story
map**. Computer scientists call a shape like that a **graph**. Graphs are
everywhere: road maps, friend networks, the links between web pages. Once the
story is a graph, a computer can answer questions about it:

- *Can every scene be reached from the start?* Follow every arrow from the
  first scene and see what you never visit.
- *Does any scene trap the player?* Look for boxes with no arrows out that
  aren't endings.
- *Does every link go somewhere?* Look for arrows that point at nothing.

Those three questions are most of what the problems list checks.

## What happens when you open the page

1. `index.html` loads the four engine files.
2. `play.js` asks GitHub's web server for each file in `story/`, the same
   way your browser asks for any web page. Files that don't exist are skipped.
3. `story.js` reads the files line by line. `##` starts a scene, `[...](#...)`
   is a choice, `get:` is an item, and so on. Then it checks the whole story
   and makes the problems list.
4. `play.js` shows the first scene of `start.md` and waits for a choice.

## What the story remembers, and where

- **Items** (`get: lantern`) are kept in memory: the browser tab's RAM. Click
  **Start over** or reload the page and they're gone.
- **Endings found** are kept in **storage**: the browser saves them on the
  computer's drive (in something called *local storage*), so they survive a
  reload, and even restarting the computer. They belong to that one browser:
  a teammate's laptop has its own count.

Same lesson as "unsaved changes": memory is fast and temporary, storage
lasts.

## Things you've seen before in this course

- **Client and server.** The story files sit on GitHub's server. Your browser
  (the client) asks for them, and GitHub sends them back. Every website works
  this way.
- **Files and names.** On the web, `Bridge.svg` and `bridge.svg` are two
  different files. Some computers ignore the difference, which is why a
  picture can work on one machine and break on the live site.
- **Markup.** `**bold**` and `## scene-name` are *markup*: characters that
  describe the text instead of being part of it. This kind is called
  Markdown. HTML, the language of web pages, is markup too.
- **Don't trust input.** The engine checks every story file before using it,
  and shows text exactly as written. If someone types HTML code into a scene,
  the page displays it instead of running it, the same way a careful website
  treats anything typed into a search box.
- **Abstraction.** You add a locked door by writing `if key`. You never see
  the code that hides the choice, checks what you're carrying, or draws the
  dashed arrow on the map.

## The Story check

When you open a pull request, GitHub starts a fresh computer in the cloud,
copies your branch onto it, and runs `engine/check-cli.js`. That uses the same
`story.js` checks as the web page, plus one more: it makes sure every picture
file really exists, with exactly that spelling. Then it reports back with a
green ✓ or a red ✗.

Running checks automatically on every proposed change is called
**continuous integration**. Professional teams rely on it: the computer
catches the mechanical mistakes, so human reviewers can spend their attention
on the things only a person can judge, like whether a choice makes sense.
