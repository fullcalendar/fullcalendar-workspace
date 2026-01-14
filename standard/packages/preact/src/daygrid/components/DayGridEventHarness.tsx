import { Component, createRef, type Ref, type ReactNode } from 'react'
import { joinClassNames } from '../../util/html'
import { watchHeight } from '../../component-util/resize-observer'
import { setRef } from '../../vdom-util'
import classNames from '../../internal-classnames'

export interface DayGridEventHarnessProps {
  key?: string | number | null

  style: any // TODO
  className?: string
  children?: ReactNode

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
        className={joinClassNames(props.className, classNames.abs)}
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
