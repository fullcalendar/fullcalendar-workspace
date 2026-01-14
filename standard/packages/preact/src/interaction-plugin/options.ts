import type { EventDropData } from '../api-type-deps'
import { identity, Identity } from '../common/render-hook'
import type { RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '../options'
import {
  DateClickData,
  EventDragStartData, EventDragStopData,
  EventResizeStartData, EventResizeStopData, EventResizeDoneData,
  DropData, EventReceiveData, EventLeaveData,
} from './public-types'

export const OPTION_REFINERS = {}

type InteractionOptionRefiners = typeof OPTION_REFINERS
export type InteractionOptions = RawOptionsFromRefiners<InteractionOptionRefiners>
export type InteractionOptionsRefined = RefinedOptionsFromRefiners<InteractionOptionRefiners>

export const LISTENER_REFINERS = {
  dateClick: identity as Identity<(data: DateClickData) => void>,
  eventDragStart: identity as Identity<(data: EventDragStartData) => void>,
  eventDragStop: identity as Identity<(data: EventDragStopData) => void>,
  eventDrop: identity as Identity<(data: EventDropData) => void>,
  eventResizeStart: identity as Identity<(data: EventResizeStartData) => void>,
  eventResizeStop: identity as Identity<(data: EventResizeStopData) => void>,
  eventResize: identity as Identity<(data: EventResizeDoneData) => void>,
  drop: identity as Identity<(data: DropData) => void>,
  eventReceive: identity as Identity<(data: EventReceiveData) => void>,
  eventLeave: identity as Identity<(data: EventLeaveData) => void>,
}

type InteractionListenerRefiners = typeof LISTENER_REFINERS
export type InteractionListeners = RawOptionsFromRefiners<InteractionListenerRefiners>
export type InteractionListenersRefined = RefinedOptionsFromRefiners<InteractionListenerRefiners>
