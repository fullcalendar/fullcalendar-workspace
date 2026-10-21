import { EventStore, parseEvents } from '../events/event-store'
import { EventInput } from '../events/event-parse'
import { DateSpanApi } from '../events/date-span'
import { EventImpl } from '../api/EventImpl'
import { SplittableProps } from '../event-segs/Splitter'
import { CalendarContext } from '../context/CalendarContext'

// TODO: rename to "criteria" ?
export type ConstraintInput = 'businessHours' | string | EventInput | EventInput[]
export type Constraint = 'businessHours' | string | EventStore | false // false means won't pass at all
export type OverlapFunc = ((stillEvent: EventImpl, movingEvent: EventImpl | null) => boolean)
export type AllowFunc = (span: DateSpanApi, movingEvent: EventImpl | null) => boolean
export type IsPropsValidTester = (props: SplittableProps, context: CalendarContext) => boolean

export function normalizeConstraint(input: ConstraintInput, context: CalendarContext): Constraint | null {
  if (Array.isArray(input)) {
    return parseEvents(input, null, context, true) // allowOpenRange=true
  } if (typeof input === 'object' && input) { // non-null object
    return parseEvents([input], null, context, true) // allowOpenRange=true
  } if (input != null) {
    return String(input)
  }
  return null
}
