import { BaseComponent } from '../vdom-util'
import { EventRangeProps } from '../component-util/event-rendering'
import { EventInstanceHash } from '../structs/event-instance'
import { Hit } from '../interactions/hit'
import { HitTarget, HitTargetSettings } from '../interactions/hit-target'
import { guid } from '../util/misc'
import { Dictionary } from '../options'

export type DateComponentHash = { [uid: string]: DateComponent<any, any> }

export interface EventSegUiInteractionState<S> {
  affectedInstances: EventInstanceHash
  segs: (S & EventRangeProps)[]
  isEvent: boolean
}

// the props a registered component's hit target reads, when the component has them
interface HitTargetProps {
  eventSelection?: string
  eventDrag?: unknown
  eventResize?: unknown
  isHitComboAllowed?: (hit0: Hit, hit1: Hit) => boolean
}

/*
an INTERACTABLE date component

PURPOSES:
- hook up to fg, fill, and mirror renderers
- interface for dragging and hits
*/
export abstract class DateComponent<Props=Dictionary, State=Dictionary> extends BaseComponent<Props, State> {
  uid = guid()

  // Hit System
  // -----------------------------------------------------------------------------------------------------------------

  prepareHits() {
  }

  queryHit(isRtl: boolean, positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit | null {
    return null // this should be abstract
  }

  /*
  The class-component adapter for useHitTarget. Call with the root element from its ref callback,
  and call unregisterHitTarget when the ref is cleared
  */
  registerHitTarget(settings: HitTargetSettings) {
    this.context.registerHitTarget(buildComponentHitTarget(this, settings))
  }

  unregisterHitTarget() {
    this.context.unregisterHitTarget(this.uid)
  }
}

function buildComponentHitTarget(component: DateComponent<any, any>, settings: HitTargetSettings): HitTarget {
  return {
    uid: component.uid,
    el: settings.el,
    useEventCenter: settings.useEventCenter ?? true,
    disableHits: settings.disableHits ?? false,
    get context() {
      return component.context
    },
    get eventSelection() {
      return (component.props as HitTargetProps).eventSelection
    },
    get isEventInteracting() {
      let props = component.props as HitTargetProps
      return Boolean(props.eventDrag || props.eventResize)
    },
    get isHitComboAllowed() {
      return (component.props as HitTargetProps).isHitComboAllowed || null
    },
    prepareHits() {
      component.prepareHits()
    },
    queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight) {
      return component.queryHit(isRtl, positionLeft, positionTop, elWidth, elHeight)
    },
  }
}
