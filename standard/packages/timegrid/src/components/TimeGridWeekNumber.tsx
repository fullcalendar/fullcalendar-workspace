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
          'fcnew-cell',
          'fcnew-timegrid-weeknumber',
          'fcnew-content-box',
        ]}
        elStyle={{
          width: props.width
        }}
        date={range.start}
        defaultFormat={DEFAULT_WEEK_NUM_FORMAT}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className=''>
            <InnerContent
              elTag="a"
              elClasses={['fcnew-timegrid-weeknumber-cushion']}
              elAttrs={navLinkAttrs}
            />
          </div>
        )}
      </WeekNumberContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    // TODO: handle width/height independently?
    this.detachInnerSize = watchSize(innerEl, (width, height) => {
      setRef(this.props.innerWidthRef, width)
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerSize()
  }
}
