import { createElement } from '../preact.js'

export interface ScrollbarGutterProps {
  width?: number
  height?: number
}

export function ScrollbarGutter(props: ScrollbarGutterProps) {
  if (props.width) {
    return (
      <div className='fc-scrollbar-gutter fc-border-s' style={{ width: props.width }} />
    )
  } else if (props.height) {
    return (
      <div className='fc-scrollbar-gutter fc-border-t' style={{ height: props.height }} />
    )
  }
}
