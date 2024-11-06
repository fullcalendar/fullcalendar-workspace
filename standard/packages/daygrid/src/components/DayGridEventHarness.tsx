import { Component, createRef, Ref, createElement, ComponentChildren } from '@fullcalendar/core/preact'
import { watchHeight, setRef, joinClassNames } from '@fullcalendar/core/internal'

export interface DayGridEventHarnessProps {
  style: any // TODO
  className?: string
  children?: ComponentChildren

  // ref
  heightRef?: Ref<number>
}

export class DayGridEventHarness extends Component<DayGridEventHarnessProps> {
  // ref
  private rootElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectHeight?: () => void

  render() {
    const { props } = this

    return (
      <div
        className={joinClassNames(props.className, 'fc-abs')}
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
