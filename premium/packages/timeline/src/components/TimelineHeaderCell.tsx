import { SlotLabelData } from '@fullcalendar/core'
import {
  BaseComponent,
  buildNavLinkAttrs,
  ContentContainer,
  DateMarker,
  DateProfile,
  DateRange,
  generateClassName,
  getDateMeta,
  joinArrayishClassNames,
  joinClassNames,
  memoize,
  setRef,
  watchSize
} from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile, TimelineHeaderCellData } from '../timeline-date-profile.js'
import classNames from '@fullcalendar/core/internal-classnames'

export interface TimelineHeaderCellProps {
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  rowLevel: number // 0 is closest to divider (like "ground floor")
  cell: TimelineHeaderCellData
  todayRange: DateRange
  nowDate: DateMarker
  borderStart: boolean

  // dimensions
  slotWidth: number | undefined // always provided. if pending, use `undefined`

  // refs
  innerHeightRef?: Ref<number>
  innerWidthRef?: Ref<number>
}

interface TimelineHeaderCellState {
  innerWidth?: number
}

export class TimelineHeaderCell extends BaseComponent<TimelineHeaderCellProps, TimelineHeaderCellState> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private innerWrapperElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectSize?: () => void
  private align?: 'start' | 'center' | 'end'
  private isSticky?: boolean

  render() {
    let { props, state, context } = this
    let { dateEnv, options } = context
    let { cell, dateProfile, tDateProfile } = props

    // the cell.rowUnit is f'd
    // giving 'month' for a 3-day view
    // workaround: to infer day, do NOT time

    let dateMeta = this.getDateMeta(cell.date, dateEnv, dateProfile, props.todayRange, props.nowDate)
    let hasNavLink = !dateMeta.isDisabled && (cell.rowUnit && cell.rowUnit !== 'time')
    let isTime = tDateProfile.isTimeScale && !props.rowLevel // HACK: faulty way of determining this
    let renderProps = {
      ...dateMeta,
      level: props.rowLevel,
      isMajor: cell.isMajor,
      isMinor: false,
      isCompact: false,
      isTime,
      hasNavLink,
      text: cell.text,
      view: context.viewApi,
    }

    const { slotLabelAlign } = options
    const align = this.align =
      typeof slotLabelAlign === 'function'
        ? slotLabelAlign({ level: props.rowLevel, isTime })
        : slotLabelAlign

    const isSticky = this.isSticky =
      props.rowLevel && options.slotLabelSticky !== false

    let edgeCoord: number | string | undefined

    if (isSticky) {
      if (align === 'center') {
        if (state.innerWidth != null) {
          edgeCoord = `calc(50% - ${state.innerWidth / 2}px)`
        }
      } else {
        edgeCoord = (
          typeof options.slotLabelSticky === 'number' ||
          typeof options.slotLabelSticky === 'string'
        ) ? options.slotLabelSticky : 0
      }
    }

    return (
      <ContentContainer
        tag="div"
        className={joinArrayishClassNames(
          classNames.tight,
          classNames.flexCol,
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          align === 'center' ? classNames.alignCenter :
            align === 'end' ? classNames.alignEnd :
              classNames.alignStart,
          classNames.internalTimelineSlot,
        )}
        attrs={{
          'data-date': dateEnv.formatIso(cell.date, {
            omitTime: !tDateProfile.isTimeScale,
            omitTimeZoneOffset: true,
          }),
          ...(dateMeta.isToday ? { 'aria-current': 'date' } : {}),
        }}
        style={{
          width: props.slotWidth != null
            ? props.slotWidth * cell.colspan
            : undefined,
        }}
        renderProps={renderProps}
        generatorName="slotLabelContent"
        customGenerator={options.slotLabelContent}
        defaultGenerator={renderInnerContent}
        classNameGenerator={options.slotLabelClass}
        didMount={options.slotLabelDidMount}
        willUnmount={options.slotLabelWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerWrapperElRef}
            className={joinClassNames(
              classNames.rigid,
              isSticky && classNames.sticky,
            )}
            style={{
              left: edgeCoord,
              right: edgeCoord,
            }}
          >
            <InnerContent
              tag='div'
              attrs={
                hasNavLink
                  // not tabbable because parent is aria-hidden
                  ? buildNavLinkAttrs(context, cell.date, cell.rowUnit, undefined, /* isTabbable = */ false)
                  : {} // don't bother with aria-hidden because parent already hidden
              }
              className={generateClassName(options.slotLabelInnerClass, renderProps)}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerWrapperEl = this.innerWrapperElRef.current // TODO: make dynamic with useEffect

    this.disconnectSize = watchSize(innerWrapperEl, (width, height) => {
      setRef(props.innerWidthRef, width)
      setRef(props.innerHeightRef, height)

      if (this.align === 'center' && this.isSticky) {
        this.setState({ innerWidth: width })
      }
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.disconnectSize()
    setRef(props.innerWidthRef, null)
    setRef(props.innerHeightRef, null)
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function renderInnerContent(renderProps: SlotLabelData) {
  return renderProps.text
}
