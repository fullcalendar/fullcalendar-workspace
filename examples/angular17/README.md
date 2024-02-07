
# FullCalendar Angular 17 Example Project

This is a fully-buildable example project for FullCalendar and Angular. It was initially created with the `ng new` command of the [Angular CLI](https://angular.io/cli). For a complete walkthrough, read the [FullCalendar Angular Docs &raquo;](https://fullcalendar.io/docs/angular)

## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/angular17
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
