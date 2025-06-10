import { EventDropData } from '@fullcalendar/core'
import { identity, Identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import {
  DateClickData,
  EventDragStartData, EventDragStopData,
  EventResizeStartData, EventResizeStopData, EventResizeDoneData,
  DropData, EventReceiveData, EventLeaveData,
} from './public-types.js'

export const OPTION_REFINERS = {
  fixedMirrorParent: identity as Identity<HTMLElement>,
}

type InteractionOptionRefiners = typeof OPTION_REFINERS
export type InteractionOptions = RawOptionsFromRefiners<InteractionOptionRefiners>
export type InteractionOptionsRefined = RefinedOptionsFromRefiners<InteractionOptionRefiners>

export const LISTENER_REFINERS = {
  dateClick: identity as Identity<(arg: DateClickData) => void>,
  eventDragStart: identity as Identity<(arg: EventDragStartData) => void>,
  eventDragStop: identity as Identity<(arg: EventDragStopData) => void>,
  eventDrop: identity as Identity<(arg: EventDropData) => void>,
  eventResizeStart: identity as Identity<(arg: EventResizeStartData) => void>,
  eventResizeStop: identity as Identity<(arg: EventResizeStopData) => void>,
  eventResize: identity as Identity<(arg: EventResizeDoneData) => void>,
  drop: identity as Identity<(arg: DropData) => void>,
  eventReceive: identity as Identity<(arg: EventReceiveData) => void>,
  eventLeave: identity as Identity<(arg: EventLeaveData) => void>,
}

type InteractionListenerRefiners = typeof LISTENER_REFINERS
export type InteractionListeners = RawOptionsFromRefiners<InteractionListenerRefiners>
export type InteractionListenersRefined = RefinedOptionsFromRefiners<InteractionListenerRefiners>
