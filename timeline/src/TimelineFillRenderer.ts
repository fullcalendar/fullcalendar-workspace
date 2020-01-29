import { FillRenderer, applyStyle, Seg, subrenderer, BaseFillRendererProps } from '@fullcalendar/core'
import { attachSegs, detachSegs } from './TimelineLane'
import TimelineCoords from './TimelineCoords'


export interface TimelineFillRendererProps extends TimelineFillEssentialProps {
  containerEl: HTMLElement
}

export interface TimelineFillEssentialProps extends BaseFillRendererProps {
  timelineCoords?: TimelineCoords
}


export default class TimelineFillRenderer extends FillRenderer<TimelineFillRendererProps> {

  private attachSegs = subrenderer(attachSegs, detachSegs)


  render(props: TimelineFillRendererProps) {
    let segs = this.renderSegs({
      segs: props.segs,
      type: props.type
    })

    this.attachSegs({
      segs,
      containerEl: props.containerEl
    })

    if (props.timelineCoords) {
      this.computeSegSizes(segs, props.timelineCoords)
      this.assignSegSizes(segs)
    }
  }


  // NOT CALLED FROM OUTSIDE
  computeSegSizes(segs: Seg[], timelineCoords: TimelineCoords) {
    for (let seg of segs) {
      let coords = timelineCoords.rangeToCoords(seg)
      seg.left = coords.left
      seg.right = coords.right
    }
  }


  // NOT CALLED FROM OUTSIDE
  assignSegSizes(segs: Seg[]) {
    for (let seg of segs) {
      applyStyle(seg.el, {
        left: seg.left,
        right: -seg.right
      })
    }
  }

}
