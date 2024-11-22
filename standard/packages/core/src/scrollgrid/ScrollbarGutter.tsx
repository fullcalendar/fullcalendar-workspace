import { createElement } from '../preact.js'

export interface ScrollbarGutterProps {
  width: number | undefined
}

export function ScrollbarGutter(props: ScrollbarGutterProps) {
  if (props.width) {
    return (
      <div className='fc-scrollbar-gutter fc-border-s' style={{ width: props.width }} />
    )
  }
}
