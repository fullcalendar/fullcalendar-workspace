import { ViewOptionsContext } from '../context/granular-contexts'
import { joinClassNames } from '../util/html'

export interface NowIndicatorDotProps {
  className?: string
  style?: any
}

export const NowIndicatorDot = (props: NowIndicatorDotProps) => (
  <ViewOptionsContext.Consumer
    children={(options) => {
      return (
        <div
          className={joinClassNames(
            props.className,
            options.nowIndicatorDotClass,
          )}
          style={props.style}
        />
      )
    }}
  />
)
