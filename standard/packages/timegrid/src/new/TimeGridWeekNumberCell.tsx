import { BaseComponent, DateProfile, WeekNumberContainer, buildNavLinkAttrs, createFormatter, diffDays, setRef, watchSize } from "@fullcalendar/core/internal"
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface TimeGridWeekNumberCellProps {
  dateProfile: DateProfile

  // dimensions
  width: number | undefined
  height: number | undefined

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })

export class TimeGridWeekNumberCell extends BaseComponent<TimeGridWeekNumberCellProps> {
  // ref
  innerElRef = createRef<HTMLDivElement>()

  // internal
  detachInnerSize?: () => void

  render() {
    let { props, context } = this
    let range = props.dateProfile.renderRange
    let dayCnt = diffDays(range.start, range.end)

    // only do in day views (to avoid doing in week views that dont need it)
    let navLinkAttrs = (dayCnt === 1)
      ? buildNavLinkAttrs(context, range.start, 'week')
      : {}

    return (
      <WeekNumberContainer
        elTag='div'
        elClasses={['fc-timegrid-axis']}
        elAttrs={{
          'aria-hidden': true, // why???
        }}
        elStyle={{
          width: props.width,
          height: props.height,
        }}
        date={range.start}
        defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef}>{/* TODO: set this up as a flex-child!!! */}
            <InnerContent
              elTag="a"
              elClasses={['fc-timegrid-axis-cushion']}
              elAttrs={navLinkAttrs}
            />
          </div>
        )}
      </WeekNumberContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    this.detachInnerSize = watchSize(innerEl, (width, height) => {
      // TODO: handle changes independently?
      setRef(this.props.innerWidthRef, width)
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerSize()
  }
}
