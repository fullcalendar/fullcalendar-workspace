import { ViewContextType } from '../ViewContext'
import { joinArrayishClassNames } from '../util/html'

export interface NowIndicatorDotProps {
  className?: string
  style?: any
}

export const NowIndicatorDot = (props: NowIndicatorDotProps) => (
  <ViewContextType.Consumer
    children={(context) => {
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
  />
)
