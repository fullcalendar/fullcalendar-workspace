import { EventImpl } from '../api/EventImpl.js'
import { DateRange } from '../datelib/date-range.js'
import { addDays, DateMarker } from '../datelib/marker.js'
import { DateProfile } from '../DateProfileGenerator.js'
import { Dictionary } from '../options.js'
import { getUniqueDomId } from '../util/dom-manip.js'
import { formatWithOrdinals } from '../util/misc.js'
import { createElement, Fragment, ComponentChild, RefObject } from '../preact.js'
import { joinClassNames } from '../util/html.js'
import { BaseComponent, setRef } from '../vdom-util.js'
import { ViewApi } from '../api/ViewApi.js'
import { ViewContext, ViewContextType } from '../ViewContext.js'
import { MorePopover } from './MorePopover.js'
import { MountData } from './render-hook.js'
import { ContentContainer, generateClassName } from '../content-inject/ContentContainer.js'
import { ElAttrsProps } from '../content-inject/ContentInjector.js'
import { createAriaClickAttrs } from '../util/dom-event.js'
import { EventRangeProps } from '../component-util/event-rendering.js'
import { computeEarliestStart, computeLatestEnd, SlicedCoordRange } from '../coord-range.js'
import classNames from '../internal-classnames.js'

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
  alignElRef?: RefObject<HTMLElement> // will use click-target if unspecified
  alignParentTop?: string // for popover
  forceTimed?: boolean // for popover
  popoverContent: () => ComponentChild
  isNarrow: boolean
  display: 'row' | 'column'
}

export interface MoreLinkData {
  num: number
  text: string
  shortText: string
  isNarrow: boolean
  view: ViewApi
}

export type MoreLinkMountData = MountData<MoreLinkData>

interface MoreLinkContainerState {
  isPopoverOpen: boolean
  popoverId: string
}

/*
IMPORTANT: caller is responsible for injecting moreLinkInnerClass,
either on root `classNames` or within inner element
*/
export class MoreLinkContainer extends BaseComponent<MoreLinkContainerProps, MoreLinkContainerState> {
  private linkEl: HTMLElement

  state = {
    isPopoverOpen: false,
    popoverId: getUniqueDomId(),
  }

  render() {
    let { props, state } = this
    return (
      <ViewContextType.Consumer>
        {(context: ViewContext) => {
          let { viewApi, options, calendarApi } = context
          let { moreLinkText } = options
          let moreCnt = props.hiddenSegs.length
          let range = computeRange(props)

          let text = typeof moreLinkText === 'function' // TODO: eventually use formatWithOrdinals
            ? moreLinkText.call(calendarApi, moreCnt)
            : `+${moreCnt} ${moreLinkText}`
          let hint = formatWithOrdinals(options.moreLinkHint, [moreCnt], text)

          let renderProps: MoreLinkData = {
            num: moreCnt,
            shortText: `+${moreCnt}`, // TODO: offer hook or i18n?
            text,
            isNarrow: props.isNarrow,
            view: viewApi,
          }

          return (
            <Fragment>
              {Boolean(moreCnt) && (
                <ContentContainer
                  tag='div'
                  elRef={this.handleLinkEl}
                  className={joinClassNames(
                    generateClassName( // will added to moreLinkClass
                      props.display === 'row'
                        ? options.rowMoreLinkClass // row
                        : options.columnMoreLinkClass, // column
                      renderProps
                    ),
                    props.className,
                    props.display === 'row'
                      ? classNames.flexRow
                      : classNames.flexCol,
                    classNames.internalMoreLink,
                    classNames.cursorPointer,
                  )}
                  style={props.style}
                  attrs={{
                    ...props.attrs,
                    ...createAriaClickAttrs(this.handleClick),
                    title: hint,
                    'role': 'button',
                    'aria-haspopup': 'dialog',
                    'aria-expanded': state.isPopoverOpen,
                    'aria-controls': state.isPopoverOpen ? state.popoverId : undefined,
                  }}
                  renderProps={renderProps}
                  generatorName="moreLinkContent"
                  customGenerator={options.moreLinkContent}
                  defaultGenerator={
                    props.display === 'row'
                      ? renderMoreLinkText // row
                      : renderMoreLinkShortText // column
                  }
                  classNameGenerator={options.moreLinkClass}
                  didMount={options.moreLinkDidMount}
                  willUnmount={options.moreLinkWillUnmount}
                >
                  {(InnerContent) => (
                    <InnerContent
                      tag='div'
                      className={joinClassNames(
                        generateClassName(options.moreLinkInnerClass, renderProps),
                        generateClassName(
                          props.display === 'row'
                            ? options.rowMoreLinkInnerClass // row
                            : options.columnMoreLinkInnerClass, // column
                          renderProps
                        ),
                        props.display === 'row'
                          ? classNames.stickyS
                          : classNames.stickyT,
                      )}
                    />
                  )}
                </ContentContainer>
              )}
              {state.isPopoverOpen && (
                <MorePopover
                  id={state.popoverId}
                  startDate={range.start}
                  endDate={range.end}
                  dateProfile={props.dateProfile}
                  todayRange={props.todayRange}
                  dateSpanProps={props.dateSpanProps}
                  alignEl={
                    props.alignElRef ?
                      props.alignElRef.current :
                      this.linkEl
                  }
                  alignParentTop={props.alignParentTop}
                  forceTimed={props.forceTimed}
                  onClose={this.handlePopoverClose}
                >
                  {props.popoverContent()}
                </MorePopover>
              )}
            </Fragment>
          )
        }}
      </ViewContextType.Consumer>
    )
  }

  handleLinkEl = (linkEl: HTMLElement | null) => {
    this.linkEl = linkEl

    if (this.props.elRef) {
      setRef(this.props.elRef, linkEl)
    }
  }

  handleClick = (ev: MouseEvent) => {
    let { props, context } = this
    let { dateEnv, options } = context
    let { moreLinkClick } = options
    let date = computeRange(props).start

    function buildPublicSeg(seg: SlicedCoordRange & EventRangeProps) {
      let { def, instance, range } = seg.eventRange
      return {
        event: new EventImpl(context, def, instance),
        start: dateEnv.toDate(range.start),
        end: dateEnv.toDate(range.end),
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
      this.setState({ isPopoverOpen: true })
    } else if (typeof moreLinkClick === 'string') { // a view name
      context.calendarApi.zoomTo(date, moreLinkClick)
    }
  }

  handlePopoverClose = () => {
    if (this.linkEl) { // was null sometimes when initiating drag-n-drop would hide the popover
      this.linkEl.focus()
    }
    this.setState({ isPopoverOpen: false })
  }
}

function renderMoreLinkText(props: MoreLinkData) {
  return props.text
}

function renderMoreLinkShortText(props: MoreLinkData) {
  return props.shortText
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
