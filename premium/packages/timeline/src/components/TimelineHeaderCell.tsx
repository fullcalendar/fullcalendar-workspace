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
  rowLevel: number
  cell: TimelineHeaderCellData
  todayRange: DateRange
  nowDate: DateMarker
  isCentered: boolean
  isSticky: boolean
  borderStart: boolean

  // dimensions
  slotWidth: number | undefined // always provided. if pending, use `undefined`

  // refs
  innerHeightRef?: Ref<number>
  innerWidthRef?: Ref<number>
}

export class TimelineHeaderCell extends BaseComponent<TimelineHeaderCellProps> {
  // memo
  private getDateMeta = memoize(getDateMeta)

  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachSize?: () => void

  render() {
    let { props, context } = this
    let { dateEnv, options } = context
    let { cell, dateProfile, tDateProfile } = props

    // the cell.rowUnit is f'd
    // giving 'month' for a 3-day view
    // workaround: to infer day, do NOT time

    let dateMeta = this.getDateMeta(cell.date, dateEnv, dateProfile, props.todayRange, props.nowDate)
    let renderProps = {
      ...dateMeta,
      level: props.rowLevel,
      isMajor: cell.isMajor,
      isMinor: false,
      isCompact: false,
      text: cell.text,
      view: context.viewApi,
    }

    let isNavLink = !dateMeta.isDisabled && (cell.rowUnit && cell.rowUnit !== 'time')

    return (
      <ContentContainer
        tag="div"
        className={joinArrayishClassNames(
          classNames.tight,
          classNames.flexCol,
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          props.isCentered ? classNames.alignCenter : classNames.alignStart,
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
        classNameGenerator={options.slotLabelClassNames}
        didMount={options.slotLabelDidMount}
        willUnmount={options.slotLabelWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            attrs={
              isNavLink
                // not tabbable because parent is aria-hidden
                ? buildNavLinkAttrs(context, cell.date, cell.rowUnit, undefined, /* isTabbable = */ false)
                : {} // don't bother with aria-hidden because parent already hidden
            }
            className={joinClassNames(
              generateClassName(options.slotLabelInnerClassNames, renderProps),
              classNames.rigid,
              props.isSticky && classNames.sticky,
            )}
            style={{
              // initial values
              // see componentDidMount for dynamic hack
              left: 0,
              right: 0,
            }}
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    this.detachSize = watchSize(innerEl, (width, height) => {
      setRef(props.innerWidthRef, width)
      setRef(props.innerHeightRef, height)

      // HACK for sticky-centering
      innerEl.style.left = innerEl.style.right =
        (props.isCentered && props.isSticky)
          ? `calc(50% - ${width / 2}px)`
          : ''
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.detachSize()
    setRef(props.innerWidthRef, null)
    setRef(props.innerHeightRef, null)
  }
}

// Utils
// -------------------------------------------------------------------------------------------------

function renderInnerContent(renderProps: SlotLabelData) {
  return renderProps.text
}
