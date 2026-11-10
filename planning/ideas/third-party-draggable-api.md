# Overhaul `ThirdPartyDraggable`

**Status:** open
**Release:** v8
**Test:** `standard/.../src/event-drag/third-party.ts` (jQuery UI and SortableJS, real mouse input)
**Issues:** [#7492](https://github.com/fullcalendar/fullcalendar/issues/7492) (open: SortableJS without `forceFallback`), [#7593](https://github.com/fullcalendar/fullcalendar/issues/7593) (closed: native HTML drag events), [#7514](https://github.com/fullcalendar/fullcalendar/issues/7514) (closed: no placeholder in dayGrid)

Adam (2026-10-20): decide for v8 whether to overhaul the third-party drag-and-drop API.

What it does today (`interaction-plugin/interactions-external/`): `InferredElementDragging` follows only mouse and touch events on the document (`PointerDragging`). It turns off the element-under-pointer check, so the library's moving element doesn't block hits, and it hides that element (`mirrorSelector`) only once FullCalendar has rendered its own mirror. dayGrid renders no mirror for external drags (only a highlight), so there the library's element stays visible.

Things to weigh:

- **Native HTML5 drag-and-drop isn't supported.** During a native drag the browser sends `dragover`/`drop`, not mouse events. So SortableJS's default mode and Atlassian's Pragmatic drag and drop (native only) can't work. SortableJS works only with `forceFallback: true`. Supporting native drags would need `dragover`/`drop` listeners, and maybe `dataTransfer` for event data.
- **Pointer events:** a library that calls `preventDefault()` on `pointerdown` suppresses the browser's compatibility mouse events, which `PointerDragging` relies on.
- **Mirror hiding** depends on a CSS selector queried on the whole document (no shadow roots), and on FullCalendar's mirror already being in the DOM when the hit changes (`ExternalElementDragging` has a TODO about waiting for the render).
- **No delay or min-distance:** `InferredElementDragging` fires `dragstart` on pointer down.
