import { BaseComponent, h, createRef, subrenderer } from '@fullcalendar/core'
import TimelineEventRenderer, { TimelineEventEssentialProps } from './TimelineEventRenderer'


export default class TimelineEvents extends BaseComponent<TimelineEventEssentialProps> {

  elRef = createRef<HTMLDivElement>()
  renderEvents = subrenderer(TimelineEventRenderer)


  render(props: TimelineEventEssentialProps) {
    let isMirror = props.isDragging || props.isResizing
    let classNames = [
      'fc-event-container',
      isMirror ? 'fc-mirror-container' : ''
    ]

    return (
      <div
        ref={this.elRef}
        class={classNames.join(' ')}
        data-fc-height-measure={1}
      />
    )
  }


  componentDidMount() {
    this.subrender()
  }


  componentDidUpdate() {
    this.subrender()
  }


  componentWillUnmount() {
    this.subrenderDestroy()
  }


  subrender() {
    this.renderEvents({
      ...this.props,
      containerEl: this.elRef.current
    })
  }

}
