# `EventApi.getResources()` returns `null` entries

**Status:** confirmed
**Release:** next
**Test:** `premium/.../src/resource-data/event-association.ts`
**Issues:** [#7300](https://github.com/fullcalendar/fullcalendar/issues/7300) (open)

Pre-existing, reported upstream.

`getResources()` maps the event's resource ids through `getResourceById` without filtering, so an unknown resource id gives `[a, null]`, and before async `resources` arrive every entry is `null`. The return type is `ResourceApi[]`.

Open detail for the fix: the test expects the missing ones left out. The issue also suggests typing it `(ResourceApi | null)[]` instead, which would need a different test.
