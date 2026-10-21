import { WeekNumberHeaderInfo } from '../../day-table/info-types'
import { joinClassNames } from '../../util/html'
import { CustomContent } from '../../render-hook/CustomContent'
import { useViewContext } from '../../context/useViewContext'
import { useRenderHookEl } from '../../render-hook/useRenderHookEl'
import { useReportedSize } from '../../layout/useReportedSize'
import { renderText, generateClassName } from '../../render-hook/render-hook-types'
import { DateProfile } from '../../date-profile/DateProfileGenerator'
import { buildDateStr, buildNavLinkAttrs } from '../../views/nav-link'
import { createFormatter } from '../../datelib/formatting'
import { diffDays, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import classNames from '../../styles.module.css'
import { memo, type Ref } from 'react'

export interface TimeGridWeekNumberProps {
  dateProfile: DateProfile

  // dimensions
  width: number | undefined
  isLiquid: boolean
  isNarrow: boolean

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

const DEFAULT_WEEK_NUM_FORMAT = createFormatter({ week: 'short' })

export const TimeGridWeekNumber = memo(function TimeGridWeekNumber(props: TimeGridWeekNumberProps) {
  let context = useViewContext()
  let { options, dateEnv } = context
  let range = props.dateProfile.renderRange
  let dayCnt = diffDays(range.start, range.end)

  // HACK: only make week-number a nav-link when NOT in week-view
  let hasNavLink = dayCnt === 1 && options.navLinks

  let weekDateMarker = range.start
  let fullDateStr = buildDateStr(context, weekDateMarker, 'week')

  let weekNum = dateEnv.computeWeekNumber(weekDateMarker)
  let weekTextParts = dateEnv.formatToParts(
    weekDateMarker,
    options.weekNumberFormat || DEFAULT_WEEK_NUM_FORMAT,
  )
  let weekText = joinDateTimeFormatParts(weekTextParts)
  let weekDateZoned = dateEnv.toDate(weekDateMarker)

  const weekNumberRenderProps: WeekNumberHeaderInfo = {
    num: weekNum,
    text: weekText,
    textParts: weekTextParts,
    date: weekDateZoned,
    isNarrow: props.isNarrow,
    hasNavLink,
    options: { dayMinWidth: options.dayMinWidth },
  }
  const renderHookEl = useRenderHookEl({
    classGenerator: options.weekNumberHeaderClass,
    didMount: options.weekNumberHeaderDidMount,
    willUnmount: options.weekNumberHeaderWillUnmount,
    renderProps: weekNumberRenderProps,
  })
  // TODO: only attach this if refs props present
  const innerElRef = useReportedSize({
    watchWidth: true,
    watchHeight: true,
    widthRef: props.innerWidthRef,
    heightRef: props.innerHeightRef,
  })

  return (
    <div
      ref={renderHookEl.ref}
      role='columnheader'
      className={joinClassNames(
        renderHookEl.className,
        classNames.flexRow,
        classNames.noMargin,
        classNames.noPadding,
        props.isLiquid ? classNames.liquid : classNames.contentBox,
      )}
      style={{
        width: props.width,
      }}
    >
      {!hasNavLink && ( // navlink is already labeled
        <div className={classNames.srOnly}>{fullDateStr}</div>
      )}
      <div
        // hide the whole wrapper, otherwise screen readers find an empty group
        aria-hidden={hasNavLink ? undefined : true}
        ref={innerElRef}
        className={joinClassNames(
          classNames.flexRow,
          classNames.noShrink,
          classNames.whiteSpaceNoWrap,
        )}
      >
        <CustomContent
          tag='div'
          attrs={hasNavLink
            ? buildNavLinkAttrs(
              context,
              range.start,
              'week',
              fullDateStr,
              /* isTabbable = */ true,
              /* omitHint = */ true, // header label is the column's name
            )
            : undefined}
          className={generateClassName(options.weekNumberHeaderInnerClass, weekNumberRenderProps)}
          renderProps={weekNumberRenderProps}
          generatorName="weekNumberHeaderContent"
          generator={options.weekNumberHeaderContent}
          fallback={renderText}
        />
      </div>
    </div>
  )
})
