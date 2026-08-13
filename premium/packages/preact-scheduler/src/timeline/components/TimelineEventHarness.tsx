import { Component, createRef, type Ref, type ReactNode } from 'react'
import { watchHeight, watchHeightImmediate, setRef } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'

export interface TimelineEventHarnessProps {
  style: any // should set top/left/right/width
  children?: ReactNode

  // ref
  heightRef?: Ref<number>
  measureImmediate?: boolean
}

/*
TODO: make DRY with other Event Harnesses
*/
export class TimelineEventHarness extends Component<TimelineEventHarnessProps> {
  // ref
  private rootElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectHeight?: () => void
  private height?: number

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
    this._isUnmounting = false
    this.startWatchingHeight()
  }

  /*
  for when moved to another harness, with a new ref
  the old ref needs to be explicitly cleared. because if the VDOM reuses this instance,
  the old ref will never be passed a null value. new ref needs to be populated with
  the same value of this component's height. same problem with other non-height refs too!
  Solving: https://github.com/facebook/react/issues/13604
  */
  componentDidUpdate(prevProps: TimelineEventHarnessProps): void {
    const { heightRef, measureImmediate } = this.props

    if (prevProps.heightRef !== heightRef) {
      setRef(prevProps.heightRef, null)
    }

    if (prevProps.measureImmediate !== measureImmediate) {
      this.disconnectHeight()
      this.startWatchingHeight()
      if (!measureImmediate && prevProps.heightRef !== heightRef && this.height != null) {
        setRef(heightRef, this.height)
      }
    } else if (prevProps.heightRef !== heightRef) {
      if (this.height != null) {
        setRef(heightRef, this.height)
      }
    }
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectHeight()
    setRef(this.props.heightRef, null)
  }

  private startWatchingHeight(): void {
    const watch = this.props.measureImmediate ? watchHeightImmediate : watchHeight

    this.disconnectHeight = watch(this.rootElRef.current, (height) => {
      if (this._isUnmounting) return
      this.height = height
      setRef(this.props.heightRef, height)
    })
  }
}
