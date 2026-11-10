# What `eventOrder` and `resourceOrder` functions receive

**Status:** arguable
**Release:** v8
**Test:** `premium/.../src/resource-data/resource-order.ts` (asserts the current behavior)
**Issues:** [#3950](https://github.com/fullcalendar/fullcalendar/issues/3950) (closed, related: why custom fields are flattened to the top level)

Both options call a sort function with a flattened plain object: `extendedProps` spread at the top level, then the core fields (`buildSegCompareObj` in `component-util/event-rendering.ts`; `buildResourceFields` in `resource/common/resource-hierarchy.ts`, which also spreads `ui`). That's the same object a string field name indexes into, so `'floor'` and `(a, b) => a.floor - b.floor` read the same value. `a.extendedProps.floor` throws.

- **Intent, judging by the code:** one "compare object" for both forms, so custom props are reachable at the top level by name. The event one deliberately builds primitives (`start`/`end` as ms, `duration`, `allDay` as a number) "that can be compared".
- **Docs:** `resourceOrder` documents only strings (property names, `-` for descending) and never mentions functions, though they work. `eventOrder` documents functions ("accepts two arguments and returns -1 or 1"), but doesn't say what the arguments are.
- **Types:** the options are typed `typeof parseFieldSpecs`, so a function's arguments come out as `unknown`. Internally, specs are annotated `OrderSpec<ResourceApi>` / `OrderSpec<EventApi>` (with a `// !!!` cast and a "TODO: pass in ResourceApi?"), which isn't what's passed.

For v8, pick one contract:

- **Pass the real `EventApi` / `ResourceApi`**, consistent with every other callback; `extendedProps` access works. Breaking for functions that read flattened fields like `a.floor`, or `a.start` as ms.
- **Or keep the flattened objects**, and document and type them (an `EventSortInfo` / `ResourceSortInfo` type).

Either way, the docs and public types should say what the function receives. Documenting and typing today's objects could also be done in v7, since it's non-breaking.
