
# FullCalendar Angular 15 + NgRx Example Project

For complete instructions on how to initialize your build system, see the [FullCalendar Angular Docs &raquo;](https://fullcalendar.io/docs/angular)

**About this example:** the state for events is owned by a [NgRx](https://ngrx.io/) store and reducer. This technique is more tedious to set up than the [simple technique](../angular15) but allows the state to be accessed when a FullCalendar component is not rendered.

## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/angular15-ngrx
npm install
```

## Build commands

```bash
npm run build # build to a directory
npm run start # continously build, as a server
```

After running the `npm run start` command, you will be given a localhost URL that can be visited in a browser.

## StackBlitz Quirk

To get this example working within [StackBlitz](https://stackblitz.com/), the following hack was added to `src/main.ts`. It can be safely removed in other environments.

```ts
import 'zone.js' // hack for StackBlitz
```
