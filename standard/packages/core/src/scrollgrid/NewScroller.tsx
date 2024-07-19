import { Component, ComponentChildren, Ref, createElement } from '../preact.js'
import { NewScrollerInterface } from './NewScrollerInterface.js'

export interface NewScrollerProps {
  vertical?: boolean // true always implies 'auto' (won't show scrollbars if no overflow)
  horizontal?: boolean // (same)
  hideBars?: boolean // TODO: bars:true/false/'auto'
  children: ComponentChildren
  className?: string
  elRef?: Ref<HTMLDivElement> // TODO: kill this?
  elStyle?: any // TODO
  elClassName?: string // TODO: accept string[]
  onWidth?: (width: number) => void // TODO: hook updateSize
  onLeftScrollbarWidth?: (width: number) => void // TODO: 'size' ?
  onRightScrollbarWidth?: (width: number) => void
  onBottomScrollbarWidth?: (width: number) => void
}

export class NewScroller extends Component<NewScrollerProps> implements NewScrollerInterface {
  x: number
  y: number

  render() {
    return (
      <div class='fc-newnew-scroller' ref={this.props.elRef}></div>
    )
  }

  scrollTo(options: { x?: number, y?: number }): void {
  }

  addScrollListener(handler: () => void): void {
  }
}
