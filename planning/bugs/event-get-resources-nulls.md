# `EventApi.getResources()` returns `null` entries

**Status:** fixed
**Test:** `premium/.../src/resource-data/event-association.ts`
**Issues:** [#7300](https://github.com/fullcalendar/fullcalendar/issues/7300) (open)
**Fixed:** `1ebc12bf3`, in the v7.1.5 changelog. Its test is a plain `it` now.

Pre-existing, reported upstream.

`getResources()` maps the event's resource ids through `getResourceById` without filtering, so an unknown resource id gives `[a, null]`, and before async `resources` arrive every entry is `null`. The return type is `ResourceApi[]`.

Fixed by leaving the missing ones out, matching the `ResourceApi[]` type. #7300 also suggested typing it `(ResourceApi | null)[]` instead. Reply on #7300 when it's released.
