import { DateProfile } from '../DateProfileGenerator.js'
import { EventStore } from '../structs/event-store.js'
import { EventUiHash } from './event-ui.js'
import { sliceEventStore, EventRenderRange } from './event-rendering.js'
import { DateSpan } from '../structs/date-span.js'
import { EventInteractionState } from '../interactions/event-interaction-state.js'
import { Duration } from '../datelib/duration.js'

export interface ViewProps {
  dateProfile: DateProfile
  businessHours: EventStore
  eventStore: EventStore
  eventUiBases: EventUiHash
  dateSelection: DateSpan | null
  eventSelection: string
  eventDrag: EventInteractionState | null
  eventResize: EventInteractionState | null
  forPrint: boolean

  // only useful for top-level View, not nested components
  labelId: string | undefined
  labelStr: string | undefined
}

// HELPERS

/*
if nextDayThreshold is specified, slicing is done in an all-day fashion.
you can get nextDayThreshold from context.nextDayThreshold
*/
export function sliceEvents(
  props: ViewProps & { dateProfile: DateProfile, nextDayThreshold: Duration },
  allDay?: boolean,
): EventRenderRange[] {
  return sliceEventStore(
    props.eventStore,
    props.eventUiBases,
    props.dateProfile.activeRange,
    allDay ? props.nextDayThreshold : null,
  ).fg
}
