
# FullCalendar React 17 Example Project

For complete instructions on how to initialize your build system, see the [FullCalendar React Docs &raquo;](https://fullcalendar.io/docs/react)

**About this example:** the state for events is owned by the FullCalendar instance and then emitted via `eventsSet` to be used elsewhere in the app. This is easier than owning the state in a parent component because FullCalendar can take care of requesting, parsing, and mutating event data instead of your reducer. However, this technique will only work when a FullCalendar component is rendered. If you need access to your event data when a FullCalendar component is NOT rendered, please take a look at the [React+Redux example &raquo;](../react-redux)


## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/react17
npm install
```


## Build Commands

```bash
npm run start # builds and opens a web browser

# other commands:
npm run build # builds files into dist/ directory
npm run watch # same as build, but watches for changes
npm run clean # start fresh
```
