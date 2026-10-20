import { AllDayHeaderInfo } from '../../render-hook-misc'
import { joinClassNames } from '../../util/html'
import { memo, type ReactNode, type Ref } from 'react'
import { CustomContent } from '../../content-inject/CustomContent'
import { generateClassName } from '../../common/render-hook'
import { useViewContext } from '../../hooks/useViewContext'
import { useRenderHookEl } from '../../hooks/useRenderHookEl'
import { useReportedSize } from '../../hooks/useReportedSize'
import classNames from '../../styles.module.css'

export interface TimeGridAllDayHeaderProps {
  // dimension
  width: number | undefined
  isNarrow: boolean

  // refs
  innerWidthRef?: Ref<number>
}

export const TimeGridAllDayHeader = memo(function TimeGridAllDayHeader(props: TimeGridAllDayHeaderProps) {
  let { options, viewApi } = useViewContext()
  let renderProps: AllDayHeaderInfo = {
    text: options.allDayText,
    view: viewApi,
    isNarrow: props.isNarrow,
  }
  let renderHookEl = useRenderHookEl({
    classGenerator: options.allDayHeaderClass,
    didMount: options.allDayHeaderDidMount,
    willUnmount: options.allDayHeaderWillUnmount,
    renderProps,
  })
  // TODO: only attach this if refs props present
  let innerElRef = useReportedSize({ watchWidth: true, widthRef: props.innerWidthRef })

  return (
    <div
      ref={renderHookEl.ref}
      role='rowheader'
      className={joinClassNames(
        renderHookEl.className,
        classNames.flexRow,
        classNames.noMargin,
        classNames.noPadding,
        classNames.contentBox,
      )}
      style={{
        width: props.width,
      }}
    >
      <div
        className={joinClassNames(
          classNames.flexRow,
          classNames.noShrink,
          classNames.whiteSpacePre, // respects line-breaks for localized text
        )}
        ref={innerElRef}
      >
        <CustomContent
          tag='div'
          className={generateClassName(options.allDayHeaderInnerClass, renderProps)}
          renderProps={renderProps}
          generatorName="allDayHeaderContent"
          generator={options.allDayHeaderContent}
          fallback={renderAllDayInner}
        />
      </div>
    </div>
  )
})

function renderAllDayInner(renderProps: AllDayHeaderInfo): ReactNode {
  return renderProps.text
}
