# In resource views, an event source's `color` beats a resource's `eventColor`

**Status:** confirmed
**Test:** `premium/.../src/resource-data/event-styling.ts`
**Issues:** [#5743](https://github.com/fullcalendar/fullcalendar/issues/5743) (open, related: in views without resources, a resource's `eventColor` is lost after `addEvent`)

Found during the test revamp. Pre-existing.

The docs say a resource's `eventColor` beats the calendar's `eventColor` and the event source's `color`. Views without resources do that, through `ResourceEventConfigAdder`. Resource views rank them calendar < resource < source < event, so there the source's color wins.

Fixing it changes colors in resource views for apps that set both, so it could wait for v8. See `../behaviors/event-settings-precedence.md` for the wider question of how settings combine.
