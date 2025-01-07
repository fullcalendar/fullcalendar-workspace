import { ARIA_HIDDEN_ATTRS, BaseComponent, DateProfile, WeekNumberContainer, buildDateStr, buildNavLinkAttrs, createFormatter, diffDays, joinClassNames, setRef, watchSize } from "@fullcalendar/core/internal"
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface TimeGridWeekNumberProps {
  dateProfile: DateProfile

  // dimensions
  width: number | undefined
  isLiquid: boolean

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })

export class TimeGridWeekNumber extends BaseComponent<TimeGridWeekNumberProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerSize?: () => void

  render() {
    let { props, context } = this
    let range = props.dateProfile.renderRange
    let dayCnt = diffDays(range.start, range.end)

    // HACK: only make week-number a nav-link when NOT in week-view
    let isNavLink = dayCnt === 1 && context.options.navLinks

    let fullDateStr = buildDateStr(context, range.start, 'week')

    return (
      <WeekNumberContainer
        tag='div'
        attrs={{
          role: 'gridcell', // doesn't always describe other cells in row, so make generic
          'aria-label': fullDateStr,
        }}
        className={joinClassNames(
          'fc-timegrid-weeknumber fc-timegrid-axis fc-cell',
          props.isLiquid ? 'fc-liquid' : 'fc-content-box',
        )}
        style={{ width: props.width }}
        date={range.start}
        defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            attrs={
              isNavLink
                ? buildNavLinkAttrs(context, range.start, 'week', fullDateStr)
                : ARIA_HIDDEN_ATTRS
            }
            className='fc-timegrid-axis-inner fc-cell-inner fc-padding-sm'
            elRef={this.innerElRef}
          />
        )}
      </WeekNumberContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    // TODO: handle width/height independently?
    this.disconnectInnerSize = watchSize(innerEl, (width, height) => {
      setRef(props.innerWidthRef, width)
      setRef(props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.disconnectInnerSize()
    setRef(props.innerWidthRef, null)
    setRef(props.innerHeightRef, null)
  }
}
