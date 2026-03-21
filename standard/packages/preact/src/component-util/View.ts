import { DateProfile } from '../DateProfileGenerator'
import { EventStore } from '../structs/event-store'
import { EventUiHash } from './event-ui'
import { sliceEventStore, EventRenderRange } from './event-rendering'
import { DateSpan } from '../structs/date-span'
import { EventInteractionState } from '../interactions/event-interaction-state'
import { Duration } from '@full-ui/headless-calendar'

export interface ViewProps {
  className?: string
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
  borderlessX: boolean
  borderlessTop: boolean
  borderlessBottom: boolean
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
