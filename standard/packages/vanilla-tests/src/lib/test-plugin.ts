import { PluginInput } from 'fullcalendar'
import devPartsPlugin from 'fullcalendar/dev-parts'

/*
Option defaults every test calendar gets, on top of the classic theme.
Unlike the Karma suite's theme-for-tests plugin, this adds no class names: tests query `data-fc-part`.
*/
export default {
  name: 'tests',
  deps: [devPartsPlugin],
  optionDefaults: {
    headerToolbar: {
      start: 'title',
      end: 'today prev,next',
    },
  },
} as PluginInput
