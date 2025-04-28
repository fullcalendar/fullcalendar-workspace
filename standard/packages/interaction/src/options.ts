import { EventDropArg } from '@fullcalendar/core'
import { identity, Identity, RawOptionsFromRefiners, RefinedOptionsFromRefiners } from '@fullcalendar/core/internal'
import {
  DateClickArg,
  EventDragStartArg, EventDragStopArg,
  EventResizeStartArg, EventResizeStopArg, EventResizeDoneArg,
  DropArg, EventReceiveArg, EventLeaveArg,
} from './public-types.js'

export const OPTION_REFINERS = {
  fixedMirrorParent: identity as Identity<HTMLElement>,
}

type InteractionOptionRefiners = typeof OPTION_REFINERS
export type InteractionOptions = RawOptionsFromRefiners<InteractionOptionRefiners>
export type InteractionOptionsRefined = RefinedOptionsFromRefiners<InteractionOptionRefiners>

export const LISTENER_REFINERS = {
  dateClick: identity as Identity<(arg: DateClickArg) => void>,
  eventDragStart: identity as Identity<(arg: EventDragStartArg) => void>,
  eventDragStop: identity as Identity<(arg: EventDragStopArg) => void>,
  eventDrop: identity as Identity<(arg: EventDropArg) => void>,
  eventResizeStart: identity as Identity<(arg: EventResizeStartArg) => void>,
  eventResizeStop: identity as Identity<(arg: EventResizeStopArg) => void>,
  eventResize: identity as Identity<(arg: EventResizeDoneArg) => void>,
  drop: identity as Identity<(arg: DropArg) => void>,
  eventReceive: identity as Identity<(arg: EventReceiveArg) => void>,
  eventLeave: identity as Identity<(arg: EventLeaveArg) => void>,
}

type InteractionListenerRefiners = typeof LISTENER_REFINERS
export type InteractionListeners = RawOptionsFromRefiners<InteractionListenerRefiners>
export type InteractionListenersRefined = RefinedOptionsFromRefiners<InteractionListenerRefiners>
