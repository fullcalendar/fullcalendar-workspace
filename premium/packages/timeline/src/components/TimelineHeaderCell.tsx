import { ViewApi } from '@fullcalendar/core'
import {
  BaseComponent, DateRange, DateMarker, getDateMeta, getSlotClassNames,
  buildNavLinkAttrs,
  getDayClassNames, DateProfile, memoizeObjArg, ViewContext, memoize, ContentContainer, DateEnv,
  watchSize,
  setRef,
  joinClassNames,
} from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { TimelineDateProfile, TimelineHeaderCellData } from '../timeline-date-profile.js'

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
  private refineRenderProps = memoizeObjArg(refineRenderProps)
  private buildCellNavLinkAttrs = memoize(buildCellNavLinkAttrs)

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

    let dateMeta = getDateMeta(cell.date, props.todayRange, props.nowDate, dateProfile)
    let renderProps = this.refineRenderProps({
      level: props.rowLevel,
      dateMarker: cell.date,
      text: cell.text,
      dateEnv: context.dateEnv,
      viewApi: context.viewApi,
    })

    return (
      <ContentContainer
        tag="div"
        className={joinClassNames(
          'fc-timeline-slot-label fc-timeline-slot',
          cell.isWeekStart && 'fc-timeline-slot-em', // TODO: document this semantic className
          'fc-header-cell fc-cell fc-flex-column fc-justify-center',
          props.borderStart && 'fc-border-s',
          props.isCentered ? 'fc-align-center' : 'fc-align-start',
          ...( // TODO: so slot classnames for week/month/bigger. see note above about rowUnit
            cell.rowUnit === 'time' ?
              getSlotClassNames(dateMeta, context.theme) :
              getDayClassNames(dateMeta, context.theme)
          ),
        )}
        attrs={{
          'data-date': dateEnv.formatIso(cell.date, {
            omitTime: !tDateProfile.isTimeScale,
            omitTimeZoneOffset: true,
          }),
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
            tag="a"
            attrs={this.buildCellNavLinkAttrs(context, cell.date, cell.rowUnit)}
            className={joinClassNames(
              'fc-cell-inner fc-padding-md',
              props.isSticky && 'fc-sticky-x',
            )}
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

function buildCellNavLinkAttrs(context: ViewContext, cellDate: DateMarker, rowUnit: string): any {
  return (rowUnit && rowUnit !== 'time')
    ? buildNavLinkAttrs(context, cellDate, rowUnit)
    : {}
}

function renderInnerContent(renderProps: RenderProps) {
  return renderProps.text
}

// Render Props

export interface RenderPropsInput {
  level: number
  dateMarker: DateMarker
  text: string
  dateEnv: DateEnv
  viewApi: ViewApi
}

export interface RenderProps {
  level: number
  date: DateMarker // localized
  view: ViewApi
  text: string
}

export function refineRenderProps(input: RenderPropsInput): RenderProps {
  return {
    level: input.level,
    date: input.dateEnv.toDate(input.dateMarker),
    view: input.viewApi,
    text: input.text,
  }
}
