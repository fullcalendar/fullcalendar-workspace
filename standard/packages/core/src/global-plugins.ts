import { PluginDef } from './plugin-system-struct'
import { createPlugin } from './plugin-system'
import { arrayEventSourcePlugin } from './event-sources/array-event-source'
import { funcEventSourcePlugin } from './event-sources/func-event-source'
import { jsonFeedEventSourcePlugin } from './event-sources/json-feed-event-source'
import { simpleRecurringEventsPlugin } from './structs/recurring-event-simple'
import { changeHandlerPlugin } from './options-change-handlers'
import { handleDateProfile } from './dates-set'
import { handleEventStore } from './event-crud'
import { computeEventSourcesLoading } from './reducers/eventSources'
import { CalendarDataManagerState } from './reducers/data-types'

/*
this array is exposed on the root namespace so that UMD plugins can add to it.
see the rollup-bundles script.
*/
export const globalPlugins: PluginDef[] = [
  arrayEventSourcePlugin,
  funcEventSourcePlugin,
  jsonFeedEventSourcePlugin,
  simpleRecurringEventsPlugin,
  changeHandlerPlugin,
  createPlugin({
    name: 'misc',
    isLoadingFuncs: [
      (state: CalendarDataManagerState) => computeEventSourcesLoading(state.eventSources),
    ],
    propSetHandlers: {
      dateProfile: handleDateProfile,
      eventStore: handleEventStore,
    },
  }),
]
