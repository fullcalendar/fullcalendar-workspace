import { Component, createRef, Ref, createElement, ComponentChildren } from '@fullcalendar/core/preact'
import { watchHeight, setRef } from '@fullcalendar/core/internal'

export interface DayGridEventHarnessProps {
  style: any // TODO
  children?: ComponentChildren

  // ref
  heightRef?: Ref<number>
}

export class DayGridEventHarness extends Component<DayGridEventHarnessProps> {
  // ref
  private rootElRef = createRef<HTMLDivElement>()

  // internal
  private detachHeight?: () => void

  render() {
    const { props } = this

    return (
      <div
        className="fcnew-abs"
        style={props.style}
        ref={this.rootElRef}
      >
        {props.children}
      </div>
    )
  }

  componentDidMount(): void {
    const rootEl = this.rootElRef.current // TODO: make dynamic with useEffect

    this.detachHeight = watchHeight(rootEl, (height) => {
      setRef(this.props.heightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachHeight()
  }
}
