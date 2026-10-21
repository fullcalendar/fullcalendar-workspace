import { handleDateProfile } from '../date-profile/dates-set'
import { handleEventStore } from '../events/event-crud'
import { CalendarDataManagerState } from '../store/data-types'
import { computeEventSourcesLoading } from '../store/reducers/event-sources'
import { PluginInput } from './plugin-types'

/*
The core's own plugin hooks: loading while any event source fetches, and the callbacks that follow the
data's changes (datesSet for the date profile, eventsSet for the event store)
*/
export const corePlugin = {
  name: 'misc',
  isLoadingFuncs: [
    (state: CalendarDataManagerState) => computeEventSourcesLoading(state.eventSources),
  ],
  propSetHandlers: {
    dateProfile: handleDateProfile,
    eventStore: handleEventStore,
  },
} as PluginInput
