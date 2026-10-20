import { ViewContextType } from '../ViewContext'
import { joinClassNames } from '../util/html'
import { getPartAttr } from '../content-inject/ContentContainer'

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
          className={joinClassNames(
            props.className,
            options.nowIndicatorDotClass,
          )}
          data-fc-part={getPartAttr(options, 'nowIndicatorDot')}
          style={props.style}
        />
      )
    }}
  />
)
