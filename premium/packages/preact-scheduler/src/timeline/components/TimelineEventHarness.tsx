import { Component, createRef, type Ref, type ReactNode } from 'react'
import { watchHeight, setRef } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'

export interface TimelineEventHarnessProps {
  key?: string | number | null
  style: any // should set top/left/right/width
  children?: ReactNode

  // ref
  heightRef?: Ref<number>
}

/*
TODO: make DRY with other Event Harnesses
*/
export class TimelineEventHarness extends Component<TimelineEventHarnessProps> {
  // ref
  private rootElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectHeight?: () => void

  render() {
    const { props } = this

    return (
      <div
        className={classNames.abs}
        style={props.style}
        ref={this.rootElRef}
      >
        {props.children}
      </div>
    )
  }

  componentDidMount(): void {
    const rootEl = this.rootElRef.current // TODO: make dynamic with useEffect

    this.disconnectHeight = watchHeight(rootEl, (height) => {
      setRef(this.props.heightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectHeight()
    setRef(this.props.heightRef, null)
  }
}
