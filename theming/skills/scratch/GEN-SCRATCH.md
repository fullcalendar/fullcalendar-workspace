

 and their groupings**. Prioritize not-slots ahead of slots (meaning non-slot props should come before slot props like `dayHeaderContent`). **When the same section appears in multiple source files, merge all properties from that section into a single section, and use the ordering from `theming/theme-breezy/src/options-event-calendar.ts` to determine where that merged section should be placed.** For example, if `/* Popover ---- */` appears in both `ui-default-options-event-calendar.ts` and `options-event-calendar.ts`, merge all Popover-related properties into one section and place it according to the order in `options-event-calendar.ts` (which places it after Day Cell and before Lane). **The same section block comment preservation applies to settings that end up in the `views` map.** For example, within the `timeGrid` view, preserve comments like `/* TimeGrid > Week Number Header ---- */`, `/* TimeGrid > All-Day Header ---- */`, and `/* TimeGrid > Slot Header ---- */`. Similarly, preserve comments within other views like `/* List-View > List-Item Event ---- */`, `/* No-Events Screen ---- */`, `/* Timeline > Row Event ---- */`, `/* Timeline > More-Link ---- */`, etc.



 Note how `userButtons` is spread into .buttons


Ensure @fullcalendar/core/global.css included
  for shadcn too

Use each theme's palete css directly somehow?

