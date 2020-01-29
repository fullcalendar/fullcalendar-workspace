import { BaseComponent, h, createRef, subrenderer } from '@fullcalendar/core'
import TimelineFillRenderer, { TimelineFillEssentialProps } from './TimelineFillRenderer'


export interface TimelineEventProps extends TimelineFillEssentialProps {
  type: string
}


export default class TimelineEvents extends BaseComponent<TimelineEventProps> {

  elRef = createRef<HTMLDivElement>()
  renderEvents = subrenderer(TimelineFillRenderer)


  render({ type }: TimelineEventProps) {
    if (type === 'businessHours') {
      type = 'bgevent'
    }

    return (
      <div
        ref={this.elRef}
        class={'fc-' + type.toLocaleLowerCase() + '-container'}
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
