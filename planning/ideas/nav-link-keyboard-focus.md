# Keyboard focus after activating a nav link

**Status:** open
**Issues:** none found; [#6524](https://github.com/fullcalendar/fullcalendar/issues/6524) (closed, related: keyboard activation of nav links)

Found during the test revamp. Pre-existing.

Activating a nav link (e.g. a day number) with the keyboard changes the view, which removes the link, so focus falls to `<body>` and a screen-reader user loses their place. The toolbar's view buttons keep focus (tested).

Where should focus go: the new view's heading, its first cell, the matching day? It needs some design. Details in `../archive/agent-notes/gaps-a11y-sticky.md`.
