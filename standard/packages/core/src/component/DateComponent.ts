import { BaseComponent } from '../vdom-util.js'
import { EventRenderRange } from '../component-util/event-rendering.js'
import { EventInstanceHash } from '../structs/event-instance.js'
import { Hit } from '../interactions/hit.js'
import { elementClosest } from '../util/dom-manip.js'
import { guid } from '../util/misc.js'
import { Dictionary } from '../options.js'

export type DateComponentHash = { [uid: string]: DateComponent<any, any> }

export interface Seg {
  // the original event-range (eventDef+defaultDuration)
  // HACK: optional because slicer utils return objects with the eventRange
  eventRange?: EventRenderRange

  isStart: boolean
  isEnd: boolean
}

export interface EventSegUiInteractionState<S = Seg> {
  affectedInstances: EventInstanceHash
  segs: S[]
  isEvent: boolean
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

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit | null {
    return null // this should be abstract
  }

  // Pointer Interaction Utils
  // -----------------------------------------------------------------------------------------------------------------

  isValidSegDownEl(el: HTMLElement) {
    return !(this.props as any).eventDrag && // HACK
      !(this.props as any).eventResize && // HACK
      !elementClosest(el, '.fc-event-mirror')
  }

  isValidDateDownEl(el: HTMLElement) {
    return !elementClosest(el, '.fc-event:not(.fc-bg-event)') &&
      !elementClosest(el, '.fc-more-link') && // a "more.." link
      !elementClosest(el, 'a[data-navlink]') && // a clickable nav link
      !elementClosest(el, '.fc-popover') // hack
  }
}
