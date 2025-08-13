import { WeekNumberHeaderData } from '@fullcalendar/core'
import { BaseComponent, ContentContainer, DateProfile, buildDateStr, buildNavLinkAttrs, createFormatter, diffDays, joinClassNames, renderText, setRef, watchSize, generateClassName } from "@fullcalendar/core/internal"
import classNames from '@fullcalendar/core/internal-classnames'
import { Ref, createElement, createRef } from '@fullcalendar/core/preact'

export interface TimeGridWeekNumberProps {
  dateProfile: DateProfile

  // dimensions
  width: number | undefined
  isLiquid: boolean
  isCompact: boolean

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
    let hasNavLink = dayCnt === 1 && options.navLinks

    let weekDateMarker = range.start
    let fullDateStr = buildDateStr(context, weekDateMarker, 'week')

    let weekNum = dateEnv.computeWeekNumber(weekDateMarker)
    let [weekText, weekTextParts] = dateEnv.format(
      weekDateMarker,
      options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT
    )
    let weekDateZoned = dateEnv.toDate(weekDateMarker)

    const weekNumberRenderProps = {
      num: weekNum,
      text: weekText,
      textParts: weekTextParts,
      date: weekDateZoned,
      isCompact: props.isCompact,
      hasNavLink,
    }

    return (
      <ContentContainer<WeekNumberHeaderData>
        tag='div'
        attrs={{
          role: 'gridcell', // doesn't always describe other cells in row, so make generic
          'aria-label': fullDateStr,
        }}
        className={joinClassNames(
          classNames.flexRow,
          classNames.tight,
          props.isLiquid ? classNames.liquid : classNames.contentBox,
        )}
        style={{
          width: props.width,
        }}
        renderProps={weekNumberRenderProps}
        generatorName="weekNumberHeaderContent"
        customGenerator={options.weekNumberHeaderContent}
        defaultGenerator={renderText}
        classNameGenerator={options.weekNumberHeaderClass}
        didMount={options.weekNumberHeaderDidMount}
        willUnmount={options.weekNumberHeaderWillUnmount}
      >
        {(InnerContent) => (
          <InnerContent
            tag='div'
            attrs={
              hasNavLink
                ? buildNavLinkAttrs(context, range.start, 'week', fullDateStr)
                : { 'aria-label': fullDateStr }
            }
            className={joinClassNames(
              generateClassName(options.weekNumberHeaderInnerClass, weekNumberRenderProps),
              classNames.rigid,
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
