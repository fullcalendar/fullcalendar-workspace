import { BaseComponent, DateProfile, WeekNumberContainer, buildNavLinkAttrs, createFormatter, diffDays, setRef, watchSize } from "@fullcalendar/core/internal"
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface TimeGridWeekNumberProps {
  dateProfile: DateProfile

  // dimensions
  width: number | undefined

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })

export class TimeGridWeekNumber extends BaseComponent<TimeGridWeekNumberProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerSize?: () => void

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
        elClasses={[
          'fc-timegrid-weeknumber',
          'fc-timegrid-axis',
          'fc-cell',
          'fc-content-box',
        ]}
        elStyle={{
          width: props.width
        }}
        date={range.start}
        defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className='fc-flex-column'>
            <InnerContent
              elTag="a"
              elClasses={[
                'fc-timegrid-axis-inner',
                'fc-cell-inner',
                'fc-padding-sm',
              ]}
              elAttrs={navLinkAttrs}
            />
          </div>
        )}
      </WeekNumberContainer>
    )
  }

  componentDidMount(): void {
    const { props } = this
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    // TODO: handle width/height independently?
    this.detachInnerSize = watchSize(innerEl, (width, height) => {
      setRef(props.innerWidthRef, width)
      setRef(props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    const { props } = this

    this.detachInnerSize()

    setRef(props.innerWidthRef, null)
    setRef(props.innerHeightRef, null)
  }
}
