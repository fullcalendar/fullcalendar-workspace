import { DateMarker } from '@full-ui/headless-calendar'
import { ViewApi } from '../api/ViewApi'
import { ElProps } from '../render-hook/el-props'
import { CustomContent } from '../render-hook/CustomContent'
import { useViewContext } from '../context/useViewContext'
import { useRenderHookEl } from '../render-hook/useRenderHookEl'
import { joinClassNames } from '../util/html'

export interface NowIndicatorLineContainerProps extends Partial<ElProps> {
  date: DateMarker
}

export interface NowIndicatorLineInfo {
  date: Date
  view: ViewApi
}

export function NowIndicatorLineContainer(props: NowIndicatorLineContainerProps) {
  const context = useViewContext()
  const { options } = context
  const renderProps: NowIndicatorLineInfo = {
    date: context.dateEnv.toDate(props.date),
    view: context.viewApi,
  }
  const renderHookEl = useRenderHookEl({
    classGenerator: options.nowIndicatorLineClass,
    didMount: options.nowIndicatorLineDidMount,
    willUnmount: options.nowIndicatorLineWillUnmount,
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
      generatorName="nowIndicatorLineContent"
      generator={options.nowIndicatorLineContent}
    />
  )
}
