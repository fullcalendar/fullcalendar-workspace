import { Component, createRef, type Ref, type ReactNode } from 'react'
import { joinClassNames } from '../../util/html'
import { watchHeight, watchHeightImmediate } from '../../component-util/resize-observer'
import { setRef } from '../../vdom-util'
import classNames from '../../styles.module.css'

export interface DayGridEventHarnessProps {
  style: any // TODO
  className?: string
  children?: ReactNode

  // ref
  heightRef?: Ref<number>
  measureImmediate?: boolean
}

export class DayGridEventHarness extends Component<DayGridEventHarnessProps> {
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
        className={joinClassNames(props.className, classNames.abs)}
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
  A wrapper can gain or lose measurement responsibility without remounting,
  because a row switches placement routes (screen<->print, for example) while
  reusing the same keyed nodes. The size observer only fires on an actual size
  change, so hand the newly attached ref what was already observed, and release
  the detached one.
  */
  componentDidUpdate(prevProps: DayGridEventHarnessProps): void {
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
