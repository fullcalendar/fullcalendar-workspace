
# FullCalendar Bootstrap 4 Example

This is a fully-buildable example project for FullCalendar and [Bootstrap 4][Bootstrap4].


## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/bootstrap
npm install
```

## Build Commands

```bash
npm run build
npm run watch # continously build
npm run clean # start fresh
```

After running `build` or `watch`, open up `dist/index.html` in a browser.


## A Note on Dependencies

This project's dependencies specify `jquery` and `popper.js`. However, they are not used.
They are only included to satisfy the `bootstrap` package's peerDependency requirement,
which prevents an error from displaying.


[Bootstrap4]: https://getbootstrap.com/docs/4.0/getting-started/introduction/
