import { ReducerFunc } from '../store/CalendarStore'
import { EffectRunnerMap } from '../store/effects'
import type { CalendarActionsCreator } from '../api/calendar-actions'
import { EventDefMemberAdder } from '../events/event-parse'
import { EventDefMutationApplier, EventMutation } from '../events/event-mutation'
import { EventDef } from '../events/event-def'
import { EventUi } from '../events/event-ui'
import { DateSpan } from '../events/date-span'
import { DragMeta } from '../interactions/drag-meta'
import { Hit } from '../interactions/hit'
import { ViewConfigInputHash } from '../views/view-config'
import { ViewProps } from '../views/view-props'
import { CalendarContentProps } from '../calendar/CalendarInner'
import { CalendarContext } from '../context/CalendarContext'
import { IsPropsValidTester } from '../validation/constraint'
import { InteractionClass } from '../interactions/interaction'
import { EventSourceDef } from '../event-sources/event-source-def'
import { CmdDateFormatterFunc } from '@full-ui/headless-calendar'
import { RecurringType } from '../events/recurring-event'
import { ElementDraggingClass } from '../interactions/ElementDragging'
import type { ReactNode } from 'react'
import { GenericRefiners, GenericListenerRefiners, Dictionary, CalendarOptions } from '../options/options'
import { CalendarData } from '../store/data-types'
import { ScrollerSyncerClass } from '../scrollgrid/scroller-types'

// TODO: easier way to add new hooks? need to update a million things

export interface PluginInput {
  // Set only by plugins from an older major version (v6's createPlugin), as a string literal type
  // naming the fix. It can't match `undefined`, so TypeScript prints the message. Keep it first:
  // TypeScript reports the first mismatched property.
  majorVersionError?: undefined
  name: string
  premiumReleaseDate?: string
  deps?: PluginInput[]
  reducers?: ReducerFunc[]
  effectRunners?: EffectRunnerMap // performs the effects reducers describe, by effect type
  calendarActions?: CalendarActionsCreator // more of store.actions
  isLoadingFuncs?: ((state: Dictionary) => boolean)[]
  contextInit?: (context: CalendarContext) => void
  eventRefiners?: GenericRefiners // why not an array like others?
  eventDefMemberAdders?: EventDefMemberAdder[]
  eventSourceRefiners?: GenericRefiners
  isDraggableTransformers?: EventIsDraggableTransformer[]
  eventDragMutationMassagers?: EventDragMutationMassager[]
  eventDefMutationAppliers?: EventDefMutationApplier[]
  dateSelectionTransformers?: DateSelectionJoinTransformer[]
  datePointTransforms?: DatePointTransform[]
  dateSpanTransforms?: DateSpanTransform[]
  views?: ViewConfigInputHash
  viewPropsTransformers?: ViewPropsTransformerClass[]
  isPropsValid?: IsPropsValidTester
  externalDefTransforms?: ExternalDefTransform[]
  viewContainerAppends?: ViewContainerAppend[]
  eventDropTransformers?: EventDropTransformer[]
  componentInteractions?: InteractionClass[]
  calendarInteractions?: CalendarInteractionClass[]
  eventSourceDefs?: EventSourceDef<any>[]
  cmdFormatter?: CmdDateFormatterFunc
  recurringTypes?: RecurringType<any>[]
  initialView?: string
  elementDraggingImpl?: ElementDraggingClass
  optionChangeHandlers?: OptionChangeHandlerMap
  scrollerSyncerClass?: ScrollerSyncerClass
  // NOTE: the LWC wrapper (standard/packages/lwc-calendar) reads these key
  // names off global-bundle plugin objects (recursing through `deps`) to
  // derive its redispatched DOM events. Restructuring silently breaks it.
  listenerRefiners?: GenericListenerRefiners
  optionRefiners?: GenericRefiners
  optionDefaults?: CalendarOptions
  propSetHandlers?: { [propName: string]: (val: any, context: CalendarData) => void } // TODO: make better types
}

export interface PluginHooks {
  premiumReleaseDate: Date | undefined
  reducers: ReducerFunc[]
  effectRunners: EffectRunnerMap
  calendarActions: CalendarActionsCreator[]
  isLoadingFuncs: ((state: Dictionary) => boolean)[]
  contextInit: ((context: CalendarContext) => void)[]
  eventRefiners: GenericRefiners
  eventDefMemberAdders: EventDefMemberAdder[]
  eventSourceRefiners: GenericRefiners
  isDraggableTransformers: EventIsDraggableTransformer[]
  eventDragMutationMassagers: EventDragMutationMassager[]
  eventDefMutationAppliers: EventDefMutationApplier[]
  dateSelectionTransformers: DateSelectionJoinTransformer[]
  datePointTransforms: DatePointTransform[]
  dateSpanTransforms: DateSpanTransform[]
  views: ViewConfigInputHash // TODO: parse before gets to this step?
  viewPropsTransformers: ViewPropsTransformerClass[]
  isPropsValid: IsPropsValidTester | null
  externalDefTransforms: ExternalDefTransform[]
  viewContainerAppends: ViewContainerAppend[]
  eventDropTransformers: EventDropTransformer[]
  componentInteractions: InteractionClass[]
  calendarInteractions: CalendarInteractionClass[]
  eventSourceDefs: EventSourceDef<any>[]
  cmdFormatter?: CmdDateFormatterFunc
  recurringTypes: RecurringType<any>[]
  initialView: string
  elementDraggingImpl?: ElementDraggingClass
  optionChangeHandlers: OptionChangeHandlerMap
  scrollerSyncerClass: ScrollerSyncerClass | null
  listenerRefiners: GenericListenerRefiners
  optionRefiners: GenericRefiners
  optionDefaults: CalendarOptions[]
  propSetHandlers: { [propName: string]: (val: any, context: CalendarData) => void }
}

export interface PluginDef extends PluginHooks {
  name: string
}

export type ViewPropsTransformerClass = new() => ViewPropsTransformer

export interface ViewPropsTransformer {
  transform(viewProps: ViewProps, calendarProps: CalendarContentProps): any
}

export type ViewContainerAppend = (context: CalendarContext) => ReactNode

// plugin hooks' function types

export type DatePointTransform = (dateSpan: DateSpan, context: CalendarContext) => any
export type DateSpanTransform = (dateSpan: DateSpan, context: CalendarContext) => any

export type CalendarInteraction = { destroy: () => void }
export type CalendarInteractionClass = { new(context: CalendarContext): CalendarInteraction }

export type OptionChangeHandler = (propValue: any, context: CalendarContext) => void
export type OptionChangeHandlerMap = { [propName: string]: OptionChangeHandler }

// interaction plugin hooks' function types
export type DateSelectionJoinTransformer = (hit0: Hit, hit1: Hit) => any
export type EventDragMutationMassager = (mutation: EventMutation, hit0: Hit, hit1: Hit) => void
export type EventDropTransformer = (mutation: EventMutation, context: CalendarContext, eventDef: EventDef) => Dictionary
export type EventIsDraggableTransformer = (val: boolean, eventDef: EventDef, eventUi: EventUi, context: CalendarContext) => boolean
export type ExternalDefTransform = (dateSpan: DateSpan, dragMeta: DragMeta) => any
