import { watchHeight, watchWidth } from '../internal.js'
import { createRef, Ref, createElement } from '../preact.js'
import { BaseComponent, setRef } from "../vdom-util.js"

export interface RulerProps {
  className?: string
  widthRef?: Ref<number>
  heightRef?: Ref<number>
}

export class Ruler extends BaseComponent<RulerProps> {
  private elRef = createRef<HTMLDivElement>()
  private disconnectDim?: () => void

  render() {
    return (
      <div ref={this.elRef} className={this.props.className} />
    )
  }

  componentDidMount(): void {
    const { props } = this
    const el = this.elRef.current

    if (props.widthRef) {
      this.disconnectDim = watchWidth(el, (width) => {
        setRef(props.widthRef, width)
      })
    } else if (props.heightRef) {
      this.disconnectDim = watchHeight(el, (height) => {
        setRef(props.heightRef, height)
      })
    }
  }

  componentWillUnmount(): void {
    if (this.disconnectDim) {
      this.disconnectDim()
    }
  }
}
