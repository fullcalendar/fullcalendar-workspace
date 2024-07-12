import { ComponentChildren, Ref, createElement } from '../preact.js'

export interface NewScrollerProps {
  vertical?: boolean // true always implies 'auto' (won't show scrollbars if no overflow)
  horizontal?: boolean // (same)
  hideBars?: boolean // TODO: bars:true/false/'auto'
  children: ComponentChildren
  className?: string
  elRef?: Ref<HTMLDivElement>
  elStyle?: any // TODO
  onWidth?: (width: number) => void // TODO: hook updateSize. or make a mixin-type-thing
  onLeftScrollbarWidth?: (width: number) => void // TODO: 'size' ?
  onRightScrollbarWidth?: (width: number) => void
  onBottomScrollbarWidth?: (width: number) => void
}

export function NewScroller(props: NewScrollerProps) {
  return (
    <div class='fc-newnew-scroller' ref={props.elRef}></div>
  )
}
