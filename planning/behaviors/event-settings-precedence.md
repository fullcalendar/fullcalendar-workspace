# How event settings combine across calendar, source, resource and event

**Status:** arguable
**Release:** v8
**Test:** `premium/.../src/constraints/resources.ts`, `premium/.../src/resource-data/event-styling.ts`
**Issues:** [#5743](https://github.com/fullcalendar/fullcalendar/issues/5743) (open, related)

Inferred from the code and the docs (resource-parsing, event-parsing, eventOverlap); Adam hasn't verified these.

- **Colors:** resource views rank calendar < resource < source < event, against the docs and views without resources. That part is a bug: `../bugs/resource-view-color-precedence.md`.
- **Overlap goes both ways:** `validation.ts` deliberately rejects a drop when *either* event has `overlap: false` ("consider the other event's overlap"). So an event's own `overlap: true` doesn't help if the event underneath inherits `eventOverlap: false` from its resource. The docs only describe the moving direction ("prevents this event from being dragged/resized over other events"). Tested as is.
- **Constraints come from where the event lands:** when an event moves to another resource, it's validated with the target resource's `eventConstraint`/`eventOverlap`/`eventAllow` (the config is compiled from the mutated event), not the resource it came from. That seems intended (the rules of where it ends up), but it's undocumented. Tested as is.
- **Uneven input types:** a resource's `eventOverlap` doesn't accept a function, while the calendar's does.

For v8: one documented precedence table (calendar < source < resource < event), applied the same way in every view and to every setting, and docs for the two-way overlap and the landing-resource rule.
