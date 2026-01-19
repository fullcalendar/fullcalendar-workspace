import { watchWidth } from '../component-util/resize-observer'
import { createRef, type Ref } from 'react'
import { BaseComponent, setRef } from '../vdom-util'

export interface RulerProps {
  widthRef: Ref<number>
}

export class Ruler extends BaseComponent<RulerProps> {
  private elRef = createRef<HTMLDivElement>()
  private disconnectWidth?: () => void

  render() {
    return (
      <div ref={this.elRef} />
    )
  }

  componentDidMount(): void {
    const { props } = this
    const el = this.elRef.current

    this.disconnectWidth = watchWidth(el, (width) => {
      setRef(props.widthRef, width)
    })
  }

  componentWillUnmount(): void {
    this.disconnectWidth()

    const { props } = this

    if (props.widthRef) {
      setRef(props.widthRef, null)
    }
  }
}
