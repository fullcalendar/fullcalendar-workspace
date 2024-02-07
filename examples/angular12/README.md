
# FullCalendar Angular 12 Example Project

This is a fully-buildable example project for FullCalendar and Angular. It was initially created with the `ng new` command of the [Angular CLI](https://angular.io/cli). For a complete walkthrough, read the [FullCalendar Angular Docs &raquo;](https://fullcalendar.io/docs/angular)

## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/angular12
npm install
```

## Build commands

```bash
npm run build # build to a directory
npm run start # continously build, as a server
```

After running the `npm run start` command, you will be given a localhost URL that can be visited in a browser.

## Monorepo Quirk

To get this example working within a monorepo, the following [hack](https://stackoverflow.com/a/54647323/96342) was added. It can be safely removed if you're not using a monorepo.

- In `angular.json`, added `"preserveSymlinks": true` in two places
- In `package.json`, added `"preact": "^10.0.5"`
