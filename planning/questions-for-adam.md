# Questions and judgment calls for Adam

Logged during autonomous work (from 2026-10-21), for review at the end. Each says what was decided, why,
and how to undo it. Newest last.


## Order: 10, then 7b, then 11, then loose ends

Asked for 7b's implementation too (pending its plan). Placed between 10 and 11: its column model reads
hidden days and the date profile (phase 10 rewrites them), and phase 11's context split and render-time
purity are simpler with one pure pipeline. If the reviewed plan needs something from phase 11, 7b moves
after it, noted here.
