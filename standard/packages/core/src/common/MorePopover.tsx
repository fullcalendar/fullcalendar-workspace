import { DateComponent } from '../component/DateComponent.js'
import { DateRange } from '../datelib/date-range.js'
import { DateMarker } from '../datelib/marker.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Hit } from '../interactions/hit.js'
import { Dictionary } from '../options.js'
import { createElement, ComponentChildren } from '../preact.js'
import { Popover } from './Popover.js'
import { getDateMeta } from '../component-util/date-rendering.js'
import { formatDayString } from '../datelib/formatting-utils.js'

export interface MorePopoverProps {
  id: string
  startDate: DateMarker
  endDate: DateMarker
  dateProfile: DateProfile
  parentEl: HTMLElement
  alignEl: HTMLElement
  alignParentTop?: string
  forceTimed?: boolean
  todayRange: DateRange
  dateSpanProps: Dictionary
  children: ComponentChildren
  onClose?: () => void
}

export class MorePopover extends DateComponent<MorePopoverProps> {
  rootEl: HTMLElement

  render() {
    let { options, dateEnv } = this.context
    let { props } = this
    let { startDate, todayRange, dateProfile } = props

    // TODO: memoize?
    let detaMeta = getDateMeta(startDate, todayRange, null, dateProfile)
    ;(detaMeta); // TODO: use for dayClassNames

    let title = dateEnv.format(startDate, options.dayPopoverFormat)

    return (
      <Popover
        elRef={this.handleRootEl}
        id={props.id}
        title={title}
        attrs={{
          'data-date': formatDayString(startDate),
        }}
        className='fc-more-popover'
        parentEl={props.parentEl}
        alignEl={props.alignEl}
        alignParentTop={props.alignParentTop}
        onClose={props.onClose}
      >
        {props.children}
      </Popover>
    )
  }

  handleRootEl = (rootEl: HTMLElement | null) => {
    this.rootEl = rootEl

    if (rootEl) {
      this.context.registerInteractiveComponent(this, {
        el: rootEl,
        useEventCenter: false,
      })
    } else {
      this.context.unregisterInteractiveComponent(this)
    }
  }

  queryHit(positionLeft: number, positionTop: number, elWidth: number, elHeight: number): Hit {
    let { rootEl, props } = this

    if (
      positionLeft >= 0 && positionLeft < elWidth &&
      positionTop >= 0 && positionTop < elHeight
    ) {
      return {
        dateProfile: props.dateProfile,
        dateSpan: {
          allDay: !props.forceTimed,
          range: {
            start: props.startDate,
            end: props.endDate,
          },
          ...props.dateSpanProps,
        },
        getDayEl: () => rootEl,
        rect: {
          left: 0,
          top: 0,
          right: elWidth,
          bottom: elHeight,
        },
        layer: 1, // important when comparing with hits from other components
      }
    }

    return null
  }
}
