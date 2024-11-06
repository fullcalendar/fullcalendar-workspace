import { Component, createRef, Ref, createElement, ComponentChildren } from '@fullcalendar/core/preact'
import { watchHeight, setRef } from '@fullcalendar/core/internal'

export interface TimelineEventHarnessProps {
  style: any // should set top/left/right/width
  children?: ComponentChildren

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
        className="fc-abs"
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
