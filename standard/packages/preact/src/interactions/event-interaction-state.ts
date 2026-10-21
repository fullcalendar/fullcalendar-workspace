import { EventStore } from '../events/event-store'
import { EventInstanceHash } from '../events/event-instance'
import { EventRangeProps } from '../event-segs/event-rendering'

// a drag or resize in progress, as the store holds it: the events it affects, and those events mutated
export interface EventInteractionState {
  affectedEvents: EventStore
  mutatedEvents: EventStore
  isEvent: boolean
}

// the same, sliced for a view: the affected instances (hidden while it lasts) and the mutated ones' segs
export interface EventSegUiInteractionState<S> {
  affectedInstances: EventInstanceHash
  segs: (S & EventRangeProps)[]
  isEvent: boolean
}
