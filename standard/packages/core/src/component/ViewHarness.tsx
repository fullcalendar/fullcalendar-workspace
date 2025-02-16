import { createElement, Component, ComponentChildren } from '../preact.js'
import { CssDimValue } from '../scrollgrid/util.js'
import { joinClassNames } from '../util/html.js'

export interface ViewHarnessProps {
  height?: CssDimValue
  heightLiquid?: boolean
  aspectRatio?: number
  children: ComponentChildren
}

export class ViewHarness extends Component<ViewHarnessProps> {
  render() {
    const { props } = this

    return (
      <div
        className={joinClassNames(
          'fc-view-outer',
          props.height != null
            ? 'fc-view-outer-static'
            : props.heightLiquid
              ? 'fc-view-outer-liquid'
              : props.aspectRatio != null
                && 'fc-view-outer-aspect-ratio'
        )}
        style={{
          height: props.height,
          paddingBottom: props.aspectRatio != null
            ? `${(1 / props.aspectRatio) * 100}%`
            : undefined
        }}
      >
        {props.children}
      </div>
    )
  }
}
