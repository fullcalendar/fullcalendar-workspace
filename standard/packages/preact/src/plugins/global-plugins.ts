import { handleDateProfile } from '../date-profile/dates-set'
import { handleEventStore } from '../events/event-crud'
import { arrayEventSourcePlugin } from '../event-sources/array-event-source'
import { funcEventSourcePlugin } from '../event-sources/func-event-source'
import { jsonFeedEventSourcePlugin } from '../event-sources/json-feed-event-source'
import { changeHandlerPlugin } from '../event-sources/option-change-handlers'
import { PluginInput } from './plugin-types'
import { CalendarDataManagerState } from '../store/data-types'
import { computeEventSourcesLoading } from '../store/reducers/event-sources'
import { simpleRecurringEventsPlugin } from '../events/recurring-event-simple'

/*
this array is exposed on the root namespace so that UMD plugins can add to it.
see the rollup-bundles script.
*/
export const globalPlugins: PluginInput[] = [
  arrayEventSourcePlugin,
  funcEventSourcePlugin,
  jsonFeedEventSourcePlugin,
  simpleRecurringEventsPlugin,
  changeHandlerPlugin,
  {
    name: 'misc',
    isLoadingFuncs: [
      (state: CalendarDataManagerState) => computeEventSourcesLoading(state.eventSources),
    ],
    propSetHandlers: {
      dateProfile: handleDateProfile,
      eventStore: handleEventStore,
    },
  } as PluginInput,
]
