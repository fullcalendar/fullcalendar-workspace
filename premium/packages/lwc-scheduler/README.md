# FullCalendar LWC Scheduler

FullCalendar LWC Scheduler is the premium Scheduler variant of `@fullcalendar/lwc`. It produces a self-contained Salesforce source tree and release zip with the standard FullCalendar runtime, the Scheduler runtime, themes, palettes, locales, and the `fullCalendarScheduler` Lightning Web Component.

## Install

1. Download `fullcalendar-lwc-scheduler-<version>.zip` from GitHub Releases.
2. Unpack it and copy `force-app/main/default/lwc/fullCalendarScheduler` into your SFDX project's `force-app/main/default/lwc/`.
3. Copy both `fullCalendarLib*` and `fullCalendarSchedulerLib*` from `force-app/main/default/staticresources/` into your project's corresponding static-resources directory.
4. Deploy with `sf project deploy start`.

The Scheduler zip is self-sufficient; the standard LWC zip does not need to be installed separately.
When upgrading from the standard package, replace `c-full-calendar` with `c-full-calendar-scheduler` in your LWC markup.

## Usage

Use the `c-full-calendar-scheduler` component. Scheduler views, resources, and `schedulerLicenseKey` are supplied through `options`:
When `options.initialView` is omitted, the Scheduler wrapper defaults to `resourceTimelineDay`; an explicit value overrides that default.

```html
<c-full-calendar-scheduler
  options={calendarOptions}
  theme="monarch"
  theme-palette="purple"
  locale="en-gb"
  onresourceadd={handleResourceAdd}
></c-full-calendar-scheduler>
```

```js
calendarOptions = {
  initialView: 'resourceTimelineWeek',
  schedulerLicenseKey: 'YOUR-LICENSE-KEY',
  resources: [
    { id: 'a', title: 'Room A' },
    { id: 'b', title: 'Room B' },
  ],
  events: [
    { title: 'Meeting', start: '2026-07-15T10:00:00', resourceId: 'a' },
  ],
}
```

The wrapper redispatches `resourceAdd`, `resourceChange`, and `resourceRemove` as lowercase LWC custom events in addition to the standard callback events. The original callback functions in `options` are still invoked.

## Build Output

Build the deployable source tree:

```sh
pnpm build
```

This writes `dist/src-sfdx/force-app/main/default/...`.

Create the release zip from the built source tree:

```sh
pnpm archive
```

This writes `archives/fullcalendar-lwc-scheduler-<version>.zip`.

Remove all build and archive output with:

```sh
pnpm clean
```

The zip includes the FullCalendar Premium license at `LICENSE.md`.

## Licensing

FullCalendar Scheduler is premium software. See the included `LICENSE.md` and provide a valid `schedulerLicenseKey` for your usage.
