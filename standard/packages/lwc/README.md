# FullCalendar LWC

FullCalendar LWC packages the FullCalendar global build as a Salesforce static resource and wraps it in a Lightning Web Component. The output is a release zip that Salesforce developers can unpack into an SFDX project and deploy.

## Install

1. Download `fullcalendar-lwc-<version>.zip` from GitHub Releases.
2. Unpack it and copy `force-app/main/default/lwc/fullCalendar` into your SFDX project's `force-app/main/default/lwc/`.
3. Copy `force-app/main/default/staticresources/fullCalendarLib` and `force-app/main/default/staticresources/fullCalendarLib.resource-meta.xml` into your SFDX project's `force-app/main/default/staticresources/`.
4. Deploy with `sf project deploy start`.

For local Salesforce smoke testing in this repo, use the sibling `standard/packages/lwc-example` package.

## Usage

Minimal usage:

```html
<c-full-calendar options={calendarOptions}></c-full-calendar>
```

With an explicit theme, palette, and locale:

```html
<c-full-calendar
  options={calendarOptions}
  theme="forma"
  theme-palette="blue"
  locale="en-gb"
></c-full-calendar>
```

With event handling:

```html
<c-full-calendar
  options={calendarOptions}
  oneventclick={handleEventClick}
></c-full-calendar>
```

```js
handleEventClick(event) {
  console.log(event.detail)
}
```

## Reactivity

The wrapper only reacts when the `options` object is reassigned. Mutating the existing object in place will not trigger updates.

```js
this.calendarOptions = {
  ...this.calendarOptions,
  weekends: !this.calendarOptions.weekends,
}
```

After initialization, the wrapper passes reassigned `options` through FullCalendar's `resetOptions` connector API. Changes to the component's top-level `locale` prop load the matching locale global asynchronously before updating the calendar. The special-handling `locale` setting must be supplied through this prop, not through `options`.

## App Builder

The component exposes `themeAndPalette` and `locale` in Lightning App Builder.

- `themeAndPalette` accepts generated `theme/palette` pairs such as `classic/default` or `forma/blue`.
- `locale` is exposed as a generated dropdown of bundled FullCalendar locale codes such as `fr` or `en-gb`.

Programmatic consumers can also pass `theme`, `themePalette`, and `locale` directly as component props. In LWC markup, the `themePalette` prop is written as `theme-palette`.

## Imperative API

Call `getCalendar()` on the component instance to access the underlying FullCalendar `Calendar` instance:

```js
const calendar = this.template.querySelector('c-full-calendar').getCalendar()
calendar.next()
```

## Known Limitations

- `themeAndPalette`, `themePalette`, and `theme` are set once during initial render. Recreate the component to change them.
- The wrapper relies on Salesforce static-resource loading and Lightning Web Security allowing the FullCalendar IIFE bundle to attach to `window.FullCalendar`.
- LWC event handlers receive re-dispatched custom events whose payload is available on `event.detail`.

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

This writes `archives/fullcalendar-lwc-<version>.zip`.

Remove all build and archive output with:

```sh
pnpm clean
```

The generated `dist/src-sfdx` output is also what the sibling `standard/packages/lwc-example` smoke app symlinks into its own Salesforce project.

## Options Reference

Use the main FullCalendar documentation for the complete options surface:

https://fullcalendar.io/docs
