
# FullCalendar React + Jest Example Project


## Installation

```bash
git clone https://github.com/fullcalendar/fullcalendar-examples.git
cd fullcalendar-examples/jest-react
npm install
```


## Build Commands

```bash
npm run test # run tests once
npm run test:watch # run tests continuously
```


## Workaround

Jest 28 introduces the need for a workaround ([see comment on Github Issues](https://github.com/fullcalendar/fullcalendar/issues/7113#issuecomment-1384690162)). In `jest.config.js`:

```js
module.exports = {
  // workaround for  "Unexpected token 'exports'" error when parsing preact
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    customExportConditions: [] // don't load "browser" field
  }
}
```
