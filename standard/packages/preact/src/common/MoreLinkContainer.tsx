import { EventImpl } from '../api/EventImpl'
import { DateRange, addDays, DateMarker } from '@full-ui/headless-calendar'
import { DateProfile } from '../DateProfileGenerator'
import { Dictionary } from '../options'

import { formatWithOrdinals } from '../util/misc'
import { memo, useState, type ReactNode, type RefObject } from 'react'
import { joinClassNames } from '../util/html'
import { ViewApi } from '../api/ViewApi'
import { ViewContext } from '../ViewContext'
import { MorePopover } from './MorePopover'
import { CustomContent } from '../content-inject/CustomContent'
import { useViewContext } from '../hooks/useViewContext'
import { useRenderHookEl } from '../hooks/useRenderHookEl'
import { useStableCallback } from '../hooks/useStableCallback'
import { useForwardedElRef } from '../hooks/useForwardedElRef'
import { generateClassName } from './render-hook'
import { ElAttrsProps } from '../content-inject/el-props'
import { createAriaClickAttrs } from '../util/dom-event'
import { EventRangeProps } from '../component-util/event-rendering'
import { computeEarliestStart, computeLatestEnd, SlicedCoordRange } from '../coord-range'
import { buildRangeEdgeOutput } from '../structs/event-instance'
import classNames from '../styles.module.css'

/*
TODO: simplify this interface. don't need all el attrs
*/
export interface MoreLinkContainerProps extends Partial<ElAttrsProps> {
  dateProfile: DateProfile
  todayRange: DateRange
  allDayDate: DateMarker | null
  segs: EventRangeProps[]
  hiddenSegs: EventRangeProps[]
  dateSpanProps?: Dictionary
  renderProps?: Dictionary // so can include a resource
  alignElRef?: RefObject<HTMLElement> // will use click-target if unspecified
  alignParentTop?: string // for popover
  forceTimed?: boolean // for popover
  popoverContent: () => ReactNode
  isNarrow: boolean
  isMicro: boolean
  display: 'row' | 'column'
}

export interface MoreLinkInfo {
  num: number
  numericText: string
  longText: string
  text: string
  isNarrow: boolean
  view: ViewApi
}

export interface MoreLinkTriggerProps extends Partial<ElAttrsProps> {
  num: number
  isNarrow: boolean
  isMicro: boolean
  display: 'row' | 'column'
  renderProps?: Dictionary // so can include a resource
  didMount?: (renderProps: MoreLinkInfo & { el: HTMLElement }) => void
  willUnmount?: (renderProps: MoreLinkInfo & { el: HTMLElement }) => void
}

/*
Renders only the themed, customizable more-link presentation. Interaction,
popover state, and date-range semantics belong to MoreLinkContainer.
*/
export const MoreLinkTrigger = memo(function MoreLinkTrigger(props: MoreLinkTriggerProps) {
  const context = useViewContext()
  const { options } = context
  const renderProps = buildMoreLinkRenderProps(
    props.num,
    props.isNarrow,
    props.isMicro,
    props.display,
    props.renderProps,
    context,
  )
  const renderHookEl = useRenderHookEl({
    classGenerator: options.moreLinkClass,
    didMount: props.didMount,
    willUnmount: props.willUnmount,
    renderProps,
    elRef: props.elRef,
  })

  return (
    <div
      {...props.attrs}
      ref={renderHookEl.ref}
      className={joinClassNames(
        renderHookEl.className,
        generateClassName(
          props.display === 'row'
            ? options.rowMoreLinkClass
            : options.columnMoreLinkClass,
          renderProps,
        ),
        props.className,
        props.display === 'row'
          ? classNames.flexRow
          : classNames.flexCol,
        classNames.internalMoreLink,
        classNames.cursorPointer,
        props.attrs?.className,
      )}
      style={props.style}
    >
      <CustomContent
        tag='div'
        className={joinClassNames(
          generateClassName(options.moreLinkInnerClass, renderProps),
          generateClassName(
            props.display === 'row'
              ? options.rowMoreLinkInnerClass
              : options.columnMoreLinkInnerClass,
            renderProps,
          ),
          props.display === 'row'
            ? classNames.stickyS
            : classNames.stickyT,
        )}
        renderProps={renderProps}
        generatorName="moreLinkContent"
        generator={options.moreLinkContent}
        fallback={renderMoreLinkText}
      />
    </div>
  )
})

export const MoreLinkContainer = memo(function MoreLinkContainer(props: MoreLinkContainerProps) {
  const context = useViewContext()
  const { options, baseId } = context
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [linkElRef, handleLinkEl] = useForwardedElRef(props.elRef)
  const moreCnt = props.hiddenSegs.length
  const range = computeRange(props)
  const popoverId = baseId + 'popover-' + range.start.toISOString()
  const renderProps = buildMoreLinkRenderProps(
    moreCnt,
    props.isNarrow,
    props.isMicro,
    props.display,
    props.renderProps,
    context,
  )
  const hint = formatWithOrdinals(options.moreLinkHint, [moreCnt], renderProps.longText)

  const handleClick = (ev: MouseEvent) => {
    let { dateEnv } = context
    let { moreLinkClick } = options
    let date = computeRange(props).start

    function buildPublicSeg(seg: SlicedCoordRange & EventRangeProps) {
      let { def, instance, range } = seg.eventRange
      const start = buildRangeEdgeOutput(range.start, range.instantStartMs, dateEnv)
      const end = buildRangeEdgeOutput(range.end, range.instantEndMs, dateEnv)

      return {
        event: new EventImpl(context, def, instance),
        start: start.date,
        end: end.date,
        isStart: seg.isStart,
        isEnd: seg.isEnd,
      }
    }

    if (typeof moreLinkClick === 'function') {
      moreLinkClick = moreLinkClick({
        date: dateEnv.toDate(date),
        allDay: Boolean(props.allDayDate),
        allSegs: props.segs.map(buildPublicSeg),
        hiddenSegs: props.hiddenSegs.map(buildPublicSeg),
        jsEvent: ev,
        view: context.viewApi,
      }) as string | undefined
    }

    if (!moreLinkClick || moreLinkClick === 'popover') {
      setIsPopoverOpen(true)
    } else if (typeof moreLinkClick === 'string') { // a view name
      context.calendarApi.zoomTo(date, moreLinkClick)
    }
  }

  const handlePopoverClose = useStableCallback(() => {
    if (linkElRef.current) { // was null sometimes when initiating drag-n-drop would hide the popover
      linkElRef.current.focus()
    }
    setIsPopoverOpen(false)
  })

  return (
    <>
      {Boolean(moreCnt) && (
        <MoreLinkTrigger
          num={moreCnt}
          display={props.display}
          isNarrow={props.isNarrow}
          isMicro={props.isMicro}
          renderProps={props.renderProps}
          elRef={handleLinkEl}
          className={props.className}
          style={props.style}
          attrs={{
            ...props.attrs,
            ...createAriaClickAttrs(handleClick),
            title: hint,
            'role': 'button',
            'aria-haspopup': 'dialog',
            'aria-expanded': isPopoverOpen,
            'aria-controls': isPopoverOpen ? popoverId : undefined,
          }}
          didMount={options.moreLinkDidMount}
          willUnmount={options.moreLinkWillUnmount}
        />
      )}
      {isPopoverOpen && (
        <MorePopover
          id={popoverId}
          titleId={popoverId + '-title'}
          startDate={range.start}
          endDate={range.end}
          dateProfile={props.dateProfile}
          todayRange={props.todayRange}
          dateSpanProps={props.dateSpanProps}
          renderProps={props.renderProps}
          alignEl={props.alignElRef ? props.alignElRef.current : linkElRef.current}
          alignParentTop={props.alignParentTop}
          forceTimed={props.forceTimed}
          onClose={handlePopoverClose}
          children={props.popoverContent()}
        />
      )}
    </>
  )
})

function renderMoreLinkText(props: MoreLinkInfo) {
  return props.text
}

function buildMoreLinkRenderProps(
  num: number,
  isNarrow: boolean,
  isMicro: boolean,
  display: 'row' | 'column',
  extraRenderProps: Dictionary | undefined,
  context: ViewContext,
): MoreLinkInfo {
  const { viewApi, options, calendarApi } = context
  const numericText = `+${num}` // TODO: offer hook or i18n?
  const longText = typeof options.moreLinkText === 'function' // TODO: eventually use formatWithOrdinals
    ? options.moreLinkText.call(calendarApi, num)
    : `${numericText} ${options.moreLinkText}`

  return {
    ...extraRenderProps, // first, so built-in props take precedence
    num,
    numericText,
    longText,
    text: (isMicro || display === 'column') ? numericText : longText,
    isNarrow,
    view: viewApi,
  }
}

function computeRange(props: MoreLinkContainerProps): DateRange {
  if (props.allDayDate) {
    return {
      start: props.allDayDate,
      end: addDays(props.allDayDate, 1),
    }
  }
  return {
    start: computeEarliestStart(props.hiddenSegs),
    end: computeLatestEnd(props.hiddenSegs),
  }
}
