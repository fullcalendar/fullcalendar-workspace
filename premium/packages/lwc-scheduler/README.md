# FullCalendar LWC Scheduler

FullCalendar LWC Scheduler is the premium Scheduler variant of `@fullcalendar/lwc`. It produces a self-contained Salesforce source tree and release zip with the standard FullCalendar runtime, the Scheduler runtime, themes, palettes, locales, the programmatic `fullCalendarScheduler` component, and a `fullCalendarSchedulerDemo` component for Lightning App Builder.

## Install

1. Download `fullcalendar-lwc-scheduler-<version>.zip` from GitHub Releases.
2. Unpack it and copy `force-app/main/default/` into your SFDX project's corresponding package directory.
3. Deploy with `sf project deploy start`.

The Scheduler zip is self-sufficient; the standard LWC zip does not need to be installed separately.
When upgrading from the standard package, replace `c-full-calendar` with `c-full-calendar-scheduler` in your LWC markup.

## Usage

Use the `c-full-calendar-scheduler` component. Scheduler views, resources, and `schedulerLicenseKey` are supplied through `options`. When `options.initialView` is omitted, the Scheduler wrapper defaults to `resourceTimelineDay`; an explicit value overrides that default.

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

## Reactivity

The wrapper only reacts when the `options` object is reassigned. Mutating the existing object in place will not trigger updates.

```js
this.calendarOptions = {
  ...this.calendarOptions,
  weekends: !this.calendarOptions.weekends,
}
```

After initialization, the wrapper passes reassigned `options` through FullCalendar's `resetOptions` connector API. Changes to the component's top-level `locale` prop load the matching locale global asynchronously before updating the calendar. The special-handling `locale` setting must be supplied through this prop, not through `options`.

## Lightning App Builder Demo

The low-level `fullCalendarScheduler` component is intended for programmatic composition and does not appear in Lightning App Builder. The included **FullCalendar Scheduler Demo** component provides representative resource, event, toolbar, interaction, theme, palette, and locale configuration.

To try it after deployment:

1. In the deployed org, open **Setup** from the gear menu.
2. Use **Quick Find** to open **Lightning App Builder**, then click **New**.
3. Select **App Page**, enter a label such as **FullCalendar Scheduler Demo**, select the standard **One Region** template, and click **Done**.
4. Under **Custom**, drag **FullCalendar Scheduler Demo** onto the page and choose its **Theme / Palette** and **Locale**.
5. Click **Save** and **Activate**, create the Lightning tab if prompted, and add the page to a Lightning app such as **Sales**.
6. Open that app from the App Launcher and verify the resource timeline and sample data.

Use `fullCalendarSchedulerDemo` as reference code for an application-specific wrapper that supplies its own options, data, resources, and callbacks.

## Imperative API

Call `getCalendar()` on the component instance to access the underlying FullCalendar `Calendar` instance:

```js
const calendar = this.template.querySelector('c-full-calendar-scheduler').getCalendar()
calendar.next()
```

## Known Limitations

- `themePalette` and `theme` are set once during initial render. Recreate the component to change them.
- The wrapper relies on Salesforce static-resource loading and Lightning Web Security allowing the FullCalendar IIFE bundles to attach to their window globals.
- LWC event handlers receive re-dispatched custom events whose payload is available on `event.detail`.

## Build Output

Build the deployable source tree:

```sh
pnpm build
```

This writes `dist/force-app/main/default/...`.

Create the release zip from the built source tree:

```sh
pnpm archive
```

This writes `archives/fullcalendar-lwc-scheduler-<version>.zip`.

Remove all build and archive output with:

```sh
pnpm clean
```

For local Salesforce smoke testing, build and deploy directly from this package:

```sh
pnpm build
pnpm run smoke:login # only when the fullcalendar-dev alias is unavailable
pnpm run smoke:deploy
```

The zip includes the FullCalendar Premium license at `LICENSE.md`.

## Licensing

FullCalendar Scheduler is premium software. See the included `LICENSE.md` and provide a valid `schedulerLicenseKey` for your usage.

## Options Reference

Use the main FullCalendar documentation for the complete options surface:

https://fullcalendar.io/docs
