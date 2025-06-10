import { DateComponent } from '../component/DateComponent.js'
import { DateRange } from '../datelib/date-range.js'
import { DateMarker } from '../datelib/marker.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Hit } from '../interactions/hit.js'
import { Dictionary } from '../options.js'
import { createElement, ComponentChildren } from '../preact.js'
import { Popover } from './Popover.js'
import { DateMeta, getDateMeta } from '../component-util/date-rendering.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { memoize } from '../util/memoize.js'
import { generateClassName } from '../content-inject/ContentContainer.js'

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

export type DayPopoverData = DateMeta // TODO: rename

export class MorePopover extends DateComponent<MorePopoverProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private rootEl: HTMLElement

  render() {
    let { options, dateEnv } = this.context
    let { props } = this
    let { startDate, todayRange, dateProfile } = props
    let dateMeta = this.getDateMeta(startDate, dateEnv, dateProfile, todayRange)
    let title = dateEnv.format(startDate, options.dayPopoverFormat)[0]

    return (
      <Popover
        elRef={this.handleRootEl}
        id={props.id}
        title={title}
        attrs={{
          'data-date': formatDayString(startDate),
        }}
        className={generateClassName(options.dayPopoverClass, dateMeta)}
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
