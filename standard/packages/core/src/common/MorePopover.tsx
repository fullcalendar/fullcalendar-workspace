import { DateComponent } from '../component/DateComponent.js'
import { DateRange } from '../datelib/date-range.js'
import { DateMarker } from '../datelib/marker.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Hit } from '../interactions/hit.js'
import { Dictionary } from '../options.js'
import { createElement, ComponentChildren, ComponentChild } from '../preact.js'
import { Popover } from './Popover.js'
import { DateMeta, getDateMeta } from '../component-util/date-rendering.js'
import { formatDayString } from '../datelib/formatting-utils.js'
import { memoize } from '../util/memoize.js'
import { generateClassName } from '../content-inject/ContentContainer.js'
import { ContentContainer } from '../content-inject/ContentContainer.js'
import { DayHeaderData } from '../api/structs.js'
import { createFormatter } from '../datelib/formatting.js'
import { buildNavLinkAttrs } from './nav-link.js'
import classNames from '../internal-classnames.js'
import { joinClassNames } from '../util/html.js'

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
    let { props, context } = this
    let { options, dateEnv, viewApi } = context
    let { startDate, todayRange, dateProfile } = props
    let dateMeta = this.getDateMeta(startDate, dateEnv, dateProfile, todayRange)
    let [text, textParts] = dateEnv.format(startDate, options.dayPopoverFormat)
    const hasNavLink = options.navLinks
    let dayHeaderRenderProps: DayHeaderData = {
      ...dateMeta,
      isMajor: false,
      isCompact: false,
      inPopover: true,
      hasNavLink,
      text,
      textParts,
      get weekdayText() {
        return findWeekdayText(textParts) ||
          // in case dayPopoverFormat doesn't have weekday
          dateEnv.format(startDate, WEEKDAY_ONLY_FORMAT)[0]
      },
      get dayNumberText() { return findDayNumberText(textParts) },
      view: viewApi,
      // TODO: should know about the resource!
    }

    const fullDateStr = formatDayString(startDate)

    return (
      <Popover
        elRef={this.handleRootEl}
        id={props.id}
        attrs={{
          'data-date': fullDateStr,
        }}
        className={generateClassName(options.dayPopoverClass, dateMeta)}
        parentEl={props.parentEl}
        alignEl={props.alignEl}
        alignParentTop={props.alignParentTop}
        headerContent={
          <ContentContainer
            tag='div'
            generatorName='dayHeaderContent'
            renderProps={dayHeaderRenderProps}
            customGenerator={options.dayHeaderContent}
            defaultGenerator={renderText}
            classNameGenerator={options.dayHeaderClass}
            className={joinClassNames(classNames.flexCol, classNames.borderNone)}
            didMount={options.dayHeaderDidMount}
            willUnmount={options.dayHeaderWillUnmount}
          >
            {(InnerContent) => (
              <InnerContent
                tag='div'
                className={generateClassName(options.dayHeaderInnerClass, dayHeaderRenderProps)}
                attrs={
                  hasNavLink
                    ? buildNavLinkAttrs(context, startDate, undefined, fullDateStr)
                    : undefined
                }
              />
            )}
          </ContentContainer>
        }
        bodyContent={props.children}
        onClose={props.onClose}
      />
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

// TODO: DRY with WEEKDAY_FORMAT
const WEEKDAY_ONLY_FORMAT = createFormatter({
  weekday: 'long',
})

// TODO: DRY
function findWeekdayText(parts: Intl.DateTimeFormatPart[]): string {
  for (const part of parts) {
    if (part.type === 'weekday') {
      return part.value
    }
  }
  return ''
}

// TODO: DRY
function findDayNumberText(parts: Intl.DateTimeFormatPart[]): string {
  for (const part of parts) {
    if (part.type === 'day') {
      return part.value
    }
  }
  return ''
}

// TODO: DRY
function renderText(renderProps: DayHeaderData): ComponentChild {
  return renderProps.text
}
