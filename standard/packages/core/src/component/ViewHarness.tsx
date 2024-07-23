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

    return (
      <div
        className={[
          'fc-newnew-view-harness',
          aspectRatio != null && 'fc-newnew-view-harness-aspectratio',
        ].join(' ')}
        style={{
          height,
          paddingBottom: (height == null && aspectRatio != null)
            ? `${(1 / aspectRatio) * 100}%`
            : undefined
        }}
      >
        {props.children}
      </div>
    )
  }
}
