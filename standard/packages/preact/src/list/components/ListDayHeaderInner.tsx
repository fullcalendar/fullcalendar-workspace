import { memo } from 'react'
import { buildNavLinkAttrs } from '../../common/nav-link'
import { CustomContent } from '../../content-inject/CustomContent'
import { generateClassName, renderText } from '../../common/render-hook'
import { useViewContext } from '../../hooks/useViewContext'
import type { DateFormatter, DateMarker } from '@full-ui/headless-calendar'
import { joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import type { DateMeta } from '../../component-util/date-rendering'
import { findDayNumberText, findWeekdayText } from '../../util/date-format'
import { ListDayHeaderInnerInfo } from '../structs'

export interface ListDayHeaderInnerProps {
  dayDate: DateMarker
  dayFormat: DateFormatter
  isTabbable: boolean
  dateMeta: DateMeta
  level: number
}

export const ListDayHeaderInner = memo(function ListDayHeaderInner(props: ListDayHeaderInnerProps) {
  const context = useViewContext()
  const { options } = context
  const textParts = context.dateEnv.formatToParts(props.dayDate, props.dayFormat)
  const text = joinDateTimeFormatParts(textParts)

  const hasNavLink = options.navLinks
  const renderProps: ListDayHeaderInnerInfo = {
    ...props.dateMeta,
    view: context.viewApi,
    text,
    textParts,
    get weekdayText() { return findWeekdayText(textParts) },
    get dayNumberText() { return findDayNumberText(textParts) },
    hasNavLink,
    level: props.level,
  }

  const navLinkAttrs = hasNavLink
    ? buildNavLinkAttrs(
      context,
      props.dayDate,
      undefined,
      text,
      /* isTabbable = */ props.isTabbable,
    )
    : {}

  return (
    <CustomContent
      tag="div"
      attrs={navLinkAttrs}
      className={generateClassName(options.listDayHeaderInnerClass, renderProps)}
      renderProps={renderProps}
      generatorName="listDayHeaderContent"
      generator={options.listDayHeaderContent}
      fallback={renderText}
    />
  )
})
