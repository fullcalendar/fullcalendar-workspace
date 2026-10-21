import { EventStore, eventStoreToRanges, filterEventStoreDefs, parseEvents } from '../events/event-store'
import { anyRangesContainRange, EventInstanceRange } from '../events/event-instance'
import { expandRecurring } from '../events/recurring-event'
import { OpenDateRange } from '@full-ui/headless-calendar'
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

// whether the range satisfies every constraint: each must have a range containing it
export function allConstraintsPass(
  constraints: Constraint[],
  subjectRange: EventInstanceRange,
  otherEventStore: EventStore,
  businessHoursUnexpanded: EventStore,
  context: CalendarContext,
): boolean {
  for (let constraint of constraints) {
    if (!anyRangesContainRange(
      constraintToRanges(constraint, subjectRange, otherEventStore, businessHoursUnexpanded, context),
      subjectRange,
      context.dateEnv,
    )) {
      return false
    }
  }

  return true
}

function constraintToRanges(
  constraint: Constraint,
  subjectRange: EventInstanceRange, // for expanding a recurring constraint, or expanding business hours
  otherEventStore: EventStore, // for if constraint is an even group ID
  businessHoursUnexpanded: EventStore, // for if constraint is 'businessHours'
  context: CalendarContext, // for expanding businesshours
): OpenDateRange[] {
  if (constraint === 'businessHours') {
    return eventStoreToRanges(
      expandRecurring(businessHoursUnexpanded, subjectRange, context),
    )
  }

  if (typeof constraint === 'string') { // an group ID
    return eventStoreToRanges(
      filterEventStoreDefs(otherEventStore, (eventDef) => eventDef.groupId === constraint),
    )
  }

  if (typeof constraint === 'object' && constraint) { // non-null object
    return eventStoreToRanges(
      expandRecurring(constraint, subjectRange, context),
    )
  }

  return [] // if it's false
}
