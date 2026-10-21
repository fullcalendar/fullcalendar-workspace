# Postpone Till Next Major Version

Breaking changes and API audits to queue for the next major version (v8): long-standing behavior that would break users if fixed, and APIs to reconsider.

## Options explicitly set to `undefined` aren't treated as unset

Found while porting the view-render specs (commit `eb57e948c`).
- `new Calendar(el, { initialView: 'timeGridDay', slotDuration: undefined }).render()` throws `TypeError: Cannot read properties of undefined (reading 'years')`. `slotMinTime: undefined` and `slotMaxTime: undefined` throw the same way.
- `allDaySlot: undefined` renders no all-day row, though the default is `true`.
- `eventOrder: undefined` throws `TypeError: Cannot read properties of undefined (reading 'length')` during render (dayGridMonth, events with equal start times).

Pre-existing: the test revamp didn't touch the option-refining code. The legacy specs seemed to pass `undefined` through `describeOptions` tables, but that helper copied options with jQuery's `$.extend`, which drops `undefined` values, so the calendar never received them. The Vitest tests omit the key too, so nothing has ever tested this. When it's fixed, add tests that pass `undefined` for these options and expect the defaults.

## Audit `ThirdPartyDraggable`, possibly overhauling its API

Adam (2026-10-20): decide for v8 whether to overhaul the third-party drag-and-drop API.

What it does today (`interaction-plugin/interactions-external/`): `InferredElementDragging` follows only mouse and touch events on the document (`PointerDragging`). It turns off the element-under-pointer check, so the library's moving element doesn't block hits, and it hides that element (`mirrorSelector`) only once FullCalendar has rendered its own mirror. dayGrid renders no mirror for external drags (only a highlight), so there the library's element stays visible.

Things to weigh:
- **Native HTML5 drag-and-drop isn't supported.** During a native drag the browser sends `dragover`/`drop`, not mouse events. So SortableJS's default mode and Atlassian's Pragmatic drag and drop (native only) can't work. SortableJS works only with `forceFallback: true`. Supporting native drags would need `dragover`/`drop` listeners (and maybe `dataTransfer` for event data).
- **Pointer events:** a library that calls `preventDefault()` on `pointerdown` suppresses the browser's compatibility mouse events, which `PointerDragging` relies on.
- **Mirror hiding** depends on a CSS selector queried on the whole document (no shadow roots), and on FullCalendar's mirror already being in the DOM when the hit changes (`ExternalElementDragging` has a TODO about waiting for the render).
- **No delay or min-distance** (`InferredElementDragging` fires `dragstart` on pointer down).
- Tests: `standard/packages/vanilla-tests/src/event-drag/third-party.ts` covers jQuery UI (draggable, sortable) and SortableJS with `forceFallback` (clone-out list, sortable), with real mouse input.

## `calendar.select()` checks nothing before firing `select`

`CalendarApiImpl.select()` parses the span, stores it and calls `triggerDateSelect`, with no checks. So `select` fires for:
- dates outside the current view (nothing is highlighted, and the highlight doesn't appear after navigating there either)
- all-day dates in a timeGrid with `allDaySlot: false`
- dates that `selectAllow` rejects, and dates outside `validRange` (constraints and overlap aren't checked either)

The Karma suite had commented-out "TODO: implement" specs expecting no `select` in the first two cases. The Vitest tests (`src/date-select/select-method.ts`) assert the current behavior. Another test relies on `select` firing for a calendar that was never rendered.

Firing fewer callbacks would break apps that call `select()` to drive their own state. For v8, decide whether `select()` should validate like a user's selection (`validRange`, `selectAllow`, `selectConstraint`, `selectOverlap`), and whether a selection the view can't show should be dropped or kept until it can be shown.

## What `eventOrder` / `resourceOrder` functions receive

Today, both options call a sort function with a flattened plain object: `extendedProps` spread at the top level, then the core fields (`buildSegCompareObj` in `component-util/event-rendering.ts`; `buildResourceFields` in `resource/common/resource-hierarchy.ts`, which also spreads `ui`). That's the same object a string field name indexes into, so `'floor'` and `(a, b) => a.floor - b.floor` read the same value. `a.extendedProps.floor` throws.

- **The intent, judging by the code:** one "compare object" for both forms, so custom props are reachable at the top level by name. The event one deliberately builds primitives (`start`/`end` as ms, `duration`, `allDay` as a number) "that can be compared".
- **Docs:** `resourceOrder` documents only strings (property names, `-` for descending) and never mentions functions, though they work. `eventOrder` documents functions ("accepts two arguments and returns -1 or 1"), but doesn't say what the arguments are.
- **Types:** the options are typed `typeof parseFieldSpecs`, so a function's arguments come out as `unknown`. Internally, specs are annotated `OrderSpec<ResourceApi>` / `OrderSpec<EventApi>` (with a `// !!!` cast and a "TODO: pass in ResourceApi?"), which isn't what's passed.
- Tested as it behaves in `premium/.../src/resource-data/resource-order.ts`.

For v8, pick one contract:
- **Pass the real `EventApi` / `ResourceApi`** (consistent with every other callback; `extendedProps` access works). Breaking for functions that read flattened fields like `a.floor` or `a.start` as ms.
- **Or keep the flattened objects**, and document and type them (an `EventSortInfo` / `ResourceSortInfo` type).

Either way, the docs and public types should say what the function receives. Documenting and typing today's objects could also be done in v7, since it's non-breaking.

## Document (and unify) how event settings combine across calendar, source, resource and event

Inferred from the code and the docs (resource-parsing, event-parsing, eventOverlap); Adam didn't verify these.

- **Colors:** the docs say a resource's `eventColor` beats the calendar's `eventColor` and the event source's `color`, but not the event's own `color`. Views without resources do that, through `ResourceEventConfigAdder`. Resource views rank calendar < resource < source < event, so a source's color beats the resource's there. This is a bug against the docs: `it.fails` tests in `premium/.../src/resource-data/event-styling.ts`, so it's in the post-project `it.fails` sweep. Fixing it changes colors in resource views for apps that set both, so it could also wait for v8.
- **Overlap goes both ways:** `validation.ts` deliberately rejects a drop when *either* event has `overlap: false` ("consider the other event's overlap"). So an event's own `overlap: true` doesn't help if the event underneath inherits `eventOverlap: false` from its resource. The docs only describe the moving direction ("prevents this event from being dragged/resized over other events"). Tested as is in `premium/.../src/constraints/resources.ts`.
- **Constraints come from where the event lands:** when an event moves to another resource, it's validated with the target resource's `eventConstraint`/`eventOverlap`/`eventAllow` (the config is compiled from the mutated event), not the resource it came from. That seems intended (the rules of where it ends up), but it's undocumented. Tested as is.
- **Uneven input types:** a resource's `eventOverlap` doesn't accept a function, while the calendar's does.

For v8: one documented precedence table (calendar < source < resource < event) applied the same way in every view and to every setting, and docs for the two-way overlap and the landing-resource rule.

