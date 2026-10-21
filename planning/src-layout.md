# Source layout

How `standard/packages/preact/src` and `premium/packages/preact-scheduler/src` are organized, and
where new code goes. (React's `src` is a generated copy of Preact's; never edit it.) This replaces
the review draft the restructure started from.

## Conventions

1. **The root holds only entry points**: they map 1:1 to `package.json` exports. Also the globals
   (`global-types.d.ts`, `styles.module.css`, premium's `ambient.ts` and `side-effects.ts`).
2. **Directories are domain concepts.** There are no grab bags (`common/`, `structs/`,
   `component-util/`). `util/` holds only domain-free helpers.
3. **Each plugin owns its directory.** Code that several plugins share lives in a concept directory,
   not in one plugin's: for example `day-table/` in standard and `resource-day-table/` in premium.
4. **Inside a plugin directory**, `components/` holds the components plus the hooks and helpers only
   they use. The plugin root holds `index.ts`, `plugin.ts` (premium), `public-api.ts`,
   `info-types.ts` (the render-hook info types), and the non-UI computation.
5. **File names**:
   - PascalCase for a file named after its component or class (`Scroller.tsx`, `CalendarStore.ts`).
   - `useX.ts` for a file named after its hook.
   - kebab-case for everything else.
   - `.tsx` only when the file has JSX.
   - A types-only file says what it describes (`info-types.ts`, `plugin-types.ts`,
     `toolbar-types.ts`).
6. **Slice reducers live in `store/reducers/`.** The store's own machinery (actions, effects,
   effect runners) sits beside them in `store/`.

## Standard (`standard/packages/preact/src`)

| Directory | Holds |
|---|---|
| `calendar/` | The root components (`Calendar`, `CalendarInner`, `CalendarMediaRoot`) and the controller API (`CalendarController`, `useCalendarController`) |
| `context/` | `CalendarContext`, `ViewContext`, the granular contexts, and the hooks that read them |
| `store/` | `CalendarStore`, actions, data types, derived data, effects and their runners, title; `reducers/` holds one file per state slice |
| `options/` | Option definitions (refiners, defaults, types), refining, merging |
| `plugins/` | The plugin system, plugin types, the global plugins and config, the core plugin |
| `date-profile/` | `DateProfileGenerator`, step logic, hidden days, date meta, datesSet |
| `now/`, `now-indicator/` | Now timing (`useNow`, the timer runner) and the now-indicator UI |
| `toolbar/` | Parsing, button state, the toolbar components |
| `views/` | View config, defs, specs, props, `ViewContainer`, nav links |
| `events/` | The event data model (defs, instances, store, parsing, recurrence, mutation, UI); `components/` holds the shared event components (`ForegroundEvent`, `BgEvent`, their display computation) |
| `event-sources/` | Source types, parsing, the array/func/json-feed sources |
| `event-segs/` | Event ranges, and splitting and slicing them into segs (`Splitter`, `Slicer`) |
| `day-table/` | What dayGrid, timeGrid, multiMonth and the resource views share: the day-table pipeline (model, keying, seg caches, ranges), the header tier and its formatting, column sizing, cell positions, the render-hook info types |
| `seg-placement/` | The placement kernel and its print variant |
| `render-hook/` | Applying user class, content and mount hooks (`CustomContent`, `useMountHooks`, `RenderId`) |
| `more-link/`, `layout/`, `scrollgrid/` | Shared view UI: the more-link and popover; measurement (resize observer, `useMeasuredState`); scrolling (`Scroller`, syncing, initial scroll) |
| `interactions/` | Hits, hit targets, date callbacks, the interaction state shared with views (`interaction-plugin/` holds the plugin itself) |
| `validation/` | Constraint parsing and evaluation, selection/drop validity |
| `api/` | The public API classes, their `Impl`s, the public types |
| `datelib/`, `hooks/`, `util/` | Date formatting and locales; generic hooks; domain-free helpers |
| `daygrid/`, `timegrid/`, `list/`, `multimonth/`, `interaction-plugin/` | The plugins |

## Premium (`premium/packages/preact-scheduler/src`)

| Directory | Holds |
|---|---|
| `premium-common/` | The plugin every premium plugin depends on: premium options and the license warning |
| `resource/` | The resource data model (`resource.ts`, hierarchy, filtering, `ResourceSplitter`, CRUD info), `view-props.ts` (what resource data views receive), `date-span.ts`, validation, the plugin |
| `resource/resource-sources/` | Resource source types, parsing, the array/func/json-feed sources |
| `resource/store/` | Actions, the resource state and reducer, the fetch runner; `reducers/` holds one file per slice |
| `resource/interactions/` | The drag/select/external-drop transforms the resource plugin registers |
| `resource/api/` | `ResourceApi`, the `CalendarApi`/`EventApi` augmentations, calendar actions |
| `resource-day-table/` | What `resource-daygrid` and `resource-timegrid` share: the resource day-table model, the header tier, the header info type |
| `timeline/` | The timeline plugin: date profile, time axis, slot coverage and pixel positioning, slicing, placement and print adapters |
| `resource-timeline/` | The resource timeline plugin: column options, row layouts (screen and print), info types; `components/` holds the spreadsheet, lanes, ARIA proxy rows, scroll hooks; `virtual/` holds virtualization |
| `resource-daygrid/`, `resource-timegrid/`, `scrollgrid/`, `adaptive/` | The other plugins |
