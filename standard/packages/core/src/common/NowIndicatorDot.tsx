import { ViewContext, ViewContextType } from '../ViewContext.js'
import { createElement } from '../preact.js'
import { joinArrayishClassNames } from '../util/html.js'

export interface NowIndicatorDotProps {
  className?: string
  style?: any
}

export const NowIndicatorDot = (props: NowIndicatorDotProps) => (
  <ViewContextType.Consumer>
    {(context: ViewContext) => {
      let { options } = context

      return (
        <div
          className={joinArrayishClassNames(
            props.className,
            options.nowIndicatorDotClass,
          )}
          style={props.style}
        />
      )
    }}
  </ViewContextType.Consumer>
)
