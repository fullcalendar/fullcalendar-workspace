import { Duration, DateFormatter, DateMarker, joinDateTimeFormatParts } from '@full-ui/headless-calendar'
import { SlotHeaderInfo } from '../../render-hook-misc'
import { joinClassNames } from '../../util/html'
import { CustomContent } from '../../content-inject/CustomContent'
import { generateClassName } from '../../common/render-hook'
import { useViewContext } from '../../hooks/useViewContext'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { useReportedSize } from '../../hooks/useReportedSize'
import { createFormatter } from '../../datelib/formatting'
import { getDateMeta } from '../../component-util/date-rendering'
import { ViewContext } from '../../ViewContext'
import classNames from '../../styles.module.css'
import { memo, useMemo, type Ref } from 'react'
import { TimeSlatMeta } from '../time-slat-meta'

const DEFAULT_SLAT_LABEL_FORMAT = createFormatter({
  hour: 'numeric',
  minute: '2-digit',
  omitZeroMinute: true,
  meridiem: 'short',
})

export interface TimeGridSlatHeaderProps extends TimeSlatMeta {
  // dimensions
  height?: number
  liquidHeight?: boolean
  borderTop: boolean
  isNarrow: boolean

  // ref
  innerWidthRef?: Ref<number>
  innerHeightRef?: Ref<number>
}

/*
Always oriented in a column
*/
export const TimeGridSlatHeader = memo(function TimeGridSlatHeader(props: TimeGridSlatHeaderProps) {
  let context = useViewContext()
  let { options } = context

  let headerFormat = // TODO: fully pre-parse
    options.slotHeaderFormat == null ? DEFAULT_SLAT_LABEL_FORMAT :
      Array.isArray(options.slotHeaderFormat) ? createFormatter(options.slotHeaderFormat[0]) :
        createFormatter(options.slotHeaderFormat)

  let isMinor = !props.isLabeled
  let renderProps = useMemo(
    () => createRenderProps(props.date, props.time, isMinor, props.isNarrow, props.isFirst, headerFormat, context),
    [props.date, props.time, isMinor, props.isNarrow, props.isFirst, headerFormat, context],
  )

  let className = joinClassNames(
    props.liquidHeight && classNames.liquid,
    classNames.flexRow,
    classNames.alignStart,
    classNames.noMargin,
    classNames.noPadding,
    classNames.borderlessX,
    classNames.borderlessBottom,
    !props.borderTop && classNames.borderlessTop,
  )

  if (!props.isLabeled) {
    return (
      <div
        className={joinClassNames(
          generateClassName(options.slotHeaderClass, renderProps),
          className,
        )}
        style={{
          height: props.height,
        }}
      />
    )
  }

  return (
    <TimeGridSlatHeaderLabel
      isoTimeStr={props.isoTimeStr}
      height={props.height}
      className={className}
      renderProps={renderProps}
      innerWidthRef={props.innerWidthRef}
      innerHeightRef={props.innerHeightRef}
    />
  )
})

interface TimeGridSlatHeaderLabelProps {
  isoTimeStr: string
  height: number | undefined
  className: string
  renderProps: SlotHeaderInfo
  innerWidthRef: Ref<number> | undefined
  innerHeightRef: Ref<number> | undefined
}

// a labeled slat header. only these have slotHeader* mount hooks and measure their label
function TimeGridSlatHeaderLabel(props: TimeGridSlatHeaderLabelProps) {
  let { options } = useViewContext()
  let { renderProps } = props
  let renderHookEl = useRenderHookEl({
    classGenerator: options.slotHeaderClass,
    didMount: options.slotHeaderDidMount,
    willUnmount: options.slotHeaderWillUnmount,
    renderProps,
  })
  // TODO: only attach this if refs props present
  let innerElRef = useReportedSize({
    watchWidth: true,
    watchHeight: true,
    widthRef: props.innerWidthRef,
    heightRef: props.innerHeightRef,
  })

  return (
    <div
      ref={renderHookEl.ref}
      data-time={props.isoTimeStr}
      style={{
        height: props.height,
      }}
      className={joinClassNames(renderHookEl.className, props.className)}
    >
      <div
        ref={innerElRef}
        className={joinClassNames(
          classNames.noShrink,
          classNames.whiteSpaceNoWrap,
          classNames.flexRow,
        )}
      >
        <CustomContent
          tag="div"
          className={generateClassName(options.slotHeaderInnerClass, renderProps)}
          renderProps={renderProps}
          generatorName="slotHeaderContent"
          generator={options.slotHeaderContent}
          fallback={renderInnerContent}
        />
      </div>
    </div>
  )
}

function createRenderProps(
  date: DateMarker,
  time: Duration,
  isMinor: boolean,
  isNarrow: boolean,
  isFirst: boolean,
  headerFormat: DateFormatter,
  context: ViewContext,
): SlotHeaderInfo {
  return {
    // this is a time-specific slot. not day-specific, so don't do today/nowRange
    ...getDateMeta(date, context.dateEnv),

    level: 0, // axis level (for when multiple axes)
    text: joinDateTimeFormatParts(context.dateEnv.formatToParts(date, headerFormat)),
    time: time,
    isMajor: false,
    isMinor,
    isTime: true,
    isNarrow,
    hasNavLink: false,
    isFirst,
    view: context.viewApi,
  }
}

function renderInnerContent(props) { // TODO: add types
  return props.text
}
