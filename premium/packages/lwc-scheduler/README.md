# FullCalendar Scheduler LWC

FullCalendar Scheduler LWC is the premium Scheduler variant of `@fullcalendar/lwc`. It produces a self-contained Salesforce source tree and release zip with the standard FullCalendar runtime, the Scheduler runtime, themes, palettes, locales, the programmatic `fullCalendar` component, and a `fullCalendarSchedulerDemo` component for Lightning App Builder.

## Install

1. Download `fullcalendar-scheduler-lwc-<version>.zip` from GitHub Releases.
2. Unpack it and copy `force-app/main/default/` into your SFDX project's corresponding package directory.
3. Deploy with `sf project deploy start`.

The Scheduler zip is self-sufficient; the standard LWC zip does not need to be installed separately.
If you are upgrading from the standard package, this zip fully replaces it: it deploys an identical `c-full-calendar` component and additionally ships the Scheduler runtime as the `fullCalendarSchedulerLib` static resource, so no markup changes are needed. Leaving both packages installed does work, but it exists to support demoing them side by side, not as a recommended setup — standardize on this one.

## Usage

Use the `c-full-calendar` component and pass the Scheduler runtime's URL through `plugin-urls`. Scheduler views, resources, and `schedulerLicenseKey` are supplied through `options`. Set `options.initialView` to a resource view yourself (as the demo does) — without it, the calendar renders the standard `dayGridMonth` default. Themes and palettes are the same as the standard package.

```html
<c-full-calendar
  options={calendarOptions}
  theme="monarch"
  plugin-urls={pluginUrls}
  locale="en-gb"
  onresourceadd={handleResourceAdd}
></c-full-calendar>
```

```js
import fullCalendarSchedulerLib from '@salesforce/resourceUrl/fullCalendarSchedulerLib'

pluginUrls = [`${fullCalendarSchedulerLib}/all/global.js`]

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

When the Scheduler runtime is loaded through `plugin-urls`, the wrapper additionally redispatches its listeners (`resourcesSet`, `resourceAdd`, `resourceChange`, `resourceRemove`) as lowercase LWC custom events. The original callback functions in `options` are still invoked.

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

The low-level `fullCalendar` component is intended for programmatic composition and does not appear in Lightning App Builder. The included **FullCalendar Scheduler Demo** component provides representative resource, event, toolbar, interaction, theme, and locale configuration.

To try it after deployment:

1. In the deployed org, open **Setup** from the gear menu.
2. Use **Quick Find** to open **Lightning App Builder**, then click **New**.
3. Select **App Page**, enter a label such as **FullCalendar Scheduler Demo**, select the standard **One Region** template, and click **Done**.
4. Under **Custom**, drag **FullCalendar Scheduler Demo** onto the page and choose its **Theme** and **Locale**.
5. Click **Save** and **Activate**, create the Lightning tab if prompted, and add the page to a Lightning app such as **Sales**.
6. Open that app from the App Launcher and verify the resource timeline and sample data.

Use `fullCalendarSchedulerDemo` as reference code for an application-specific wrapper that supplies its own options, data, resources, and callbacks.

## Imperative API

Call `getCalendar()` on the component instance to access the underlying FullCalendar `Calendar` instance:

```js
const calendar = this.template.querySelector('c-full-calendar').getCalendar()
calendar.next()
```

## Known Limitations

- `themePalette` and `pluginUrls` are set once during initial render. Recreate the component to change them. `theme` may be changed at any time; the new theme's assets load asynchronously before it is applied.
- Two components on the same page must not use the same theme with different palettes; palette CSS variables are page-global per theme.
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

This writes `archives/fullcalendar-scheduler-lwc-<version>.zip`.

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
