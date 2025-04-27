import { WeekNumberContentArg } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, DateProfile, buildDateStr, buildNavLinkAttrs, createFormatter, diffDays, joinArrayishClassNames, joinClassNames, renderText, setRef, watchSize } from "@fullcalendar/core/internal"
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
    let { options, dateEnv } = context
    let range = props.dateProfile.renderRange
    let dayCnt = diffDays(range.start, range.end)

    // HACK: only make week-number a nav-link when NOT in week-view
    let isNavLink = dayCnt === 1 && options.navLinks

    let weekDate = range.start
    let fullDateStr = buildDateStr(context, weekDate, 'week')
    let weekNum = dateEnv.computeWeekNumber(weekDate)
    let [weekText, weekTextParts] = dateEnv.format(
      weekDate,
      options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT
    )

    return (
      <ContentContainer<WeekNumberContentArg>
        tag='div'
        attrs={{
          role: 'gridcell', // doesn't always describe other cells in row, so make generic
          'aria-label': fullDateStr,
        }}
        className={joinClassNames(
          'fcu-tight',
          props.isLiquid ? 'fcu-liquid' : 'fcu-content-box',
        )}
        style={{ width: props.width }}
        renderProps={{
          num: weekNum,
          text: weekText,
          textParts: weekTextParts,
          date: weekDate, // TODO: must be zoned!
        }}
        generatorName="weekNumberContent"
        customGenerator={options.weekNumberContent}
        defaultGenerator={renderText}
        classNameGenerator={options.weekNumberClassNames}
        didMount={options.weekNumberDidMount}
        willUnmount={options.weekNumberWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            attrs={
              isNavLink
                ? buildNavLinkAttrs(context, range.start, 'week', fullDateStr)
                : { 'aria-label': fullDateStr }
            }
            className={joinArrayishClassNames(
              'fcu-rigid',
              options.weekNumberInnerClassNames,
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
