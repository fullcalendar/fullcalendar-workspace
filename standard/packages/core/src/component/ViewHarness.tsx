import { createElement, Component, ComponentChildren } from '../preact.js'
import { CssDimValue } from '../scrollgrid/util.js'

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
        className={[
          'fc-view-harness',
          props.height != null
            ? 'fc-view-harness-fixedheight'
            : props.heightLiquid
              ? 'fc-view-harness-liquid'
              : props.aspectRatio != null
                ? 'fc-view-harness-aspectratio'
                : ''
        ].join(' ')}
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
