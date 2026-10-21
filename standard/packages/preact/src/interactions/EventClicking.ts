import { listenBySelector } from '../util/dom-event'
import { EventImpl } from '../api/EventImpl'
import { getElEventRange } from '../component-util/event-rendering'
import { Interaction } from './interaction'
import { HitTarget, isValidSegDownEl } from './hit-target'
import { ViewApi } from '../api/ViewApi'
import classNames from '../styles.module.css'

export interface EventClickInfo {
  el: HTMLElement
  event: EventImpl
  jsEvent: MouseEvent
  view: ViewApi
}

/*
Detects when the user clicks on an event within a hit target
*/
export class EventClicking extends Interaction {
  constructor(target: HitTarget) {
    super(target)

    this.destroy = listenBySelector(
      target.el,
      'click',
      `.${classNames.internalEvent}`, // on both fg and bg events
      this.handleSegClick,
    )
  }

  handleSegClick = (ev: Event, segEl: HTMLElement) => {
    let { target } = this
    let { context } = target
    let eventRange = getElEventRange(segEl)

    if (
      eventRange && // might be the <div> surrounding the more link
      isValidSegDownEl(target, ev.target as HTMLElement)
    ) {
      context.emitter.trigger('eventClick', {
        el: segEl,
        event: new EventImpl(
          target.context,
          eventRange.def,
          eventRange.instance,
        ),
        jsEvent: ev as MouseEvent, // Is this always a mouse event? See #4655
        view: context.viewApi,
      } as EventClickInfo)
    }
  }
}
