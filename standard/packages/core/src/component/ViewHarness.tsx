import { createElement, Component, ComponentChildren } from '../preact.js'
import { CssDimValue } from '../scrollgrid/util.js'

export interface ViewHarnessProps {
  height?: CssDimValue
  aspectRatio?: number
  children: ComponentChildren
}

export class ViewHarness extends Component<ViewHarnessProps> {
  render() {
    const { props } = this
    const { height, aspectRatio } = props
    const fixedHeightEnabled = height != null
    const aspectRatioEnabled = !fixedHeightEnabled && aspectRatio != null

    return (
      <div
        className={[
          'fcnew-view-harness',
          fixedHeightEnabled ? 'fcnew-view-harness-fixedheight' : '',
          aspectRatioEnabled ? 'fcnew-view-harness-aspectratio' : '',
        ].join(' ')}
        style={{
          height,
          paddingBottom: aspectRatioEnabled
            ? `${(1 / aspectRatio) * 100}%`
            : undefined
        }}
      >
        {props.children}
      </div>
    )
  }
}
