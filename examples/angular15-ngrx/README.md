
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

## Monorepo Quirk

To get this example working within a monorepo, [this hack](https://stackoverflow.com/a/61801741/96342) was added to `tsconfig.app.json`. It can be safely removed if you're not using a monorepo.

```json
"paths": {
  "@angular/*": ["./node_modules/@angular/*"]
},
```

## StackBlitz Quirk

To get this example working within [StackBlitz](https://stackblitz.com/), the following hack was added to `src/main.ts`. It can be safely removed in other environments.

```ts
import 'zone.js' // hack for StackBlitz
```
