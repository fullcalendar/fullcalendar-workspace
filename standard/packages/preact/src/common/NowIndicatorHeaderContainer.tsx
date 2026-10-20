import { DateMarker } from '@full-ui/headless-calendar'
import { ViewApi } from '../api/ViewApi'
import { ElProps } from '../content-inject/el-props'
import { CustomContent } from '../content-inject/CustomContent'
import { useViewContext } from '../hooks/useViewContext'
import { useRenderHookEl } from '../hooks/useRenderHookEl'
import { joinClassNames } from '../util/html'

export interface NowIndicatorHeaderContainerProps extends Partial<ElProps> {
  date: DateMarker
}

export interface NowIndicatorHeaderInfo {
  date: Date
  view: ViewApi
}

export function NowIndicatorHeaderContainer(props: NowIndicatorHeaderContainerProps) {
  const context = useViewContext()
  const { options } = context
  const renderProps: NowIndicatorHeaderInfo = {
    date: context.dateEnv.toDate(props.date),
    view: context.viewApi,
  }
  const renderHookEl = useRenderHookEl({
    classGenerator: options.nowIndicatorHeaderClass,
    didMount: options.nowIndicatorHeaderDidMount,
    willUnmount: options.nowIndicatorHeaderWillUnmount,
    renderProps,
    elRef: props.elRef,
  })

  return (
    <CustomContent
      tag={props.tag || 'div'}
      attrs={props.attrs}
      className={joinClassNames(props.className, renderHookEl.className)}
      style={props.style}
      elRef={renderHookEl.ref}
      renderProps={renderProps}
      generatorName="nowIndicatorHeaderContent"
      generator={options.nowIndicatorHeaderContent}
    />
  )
}
