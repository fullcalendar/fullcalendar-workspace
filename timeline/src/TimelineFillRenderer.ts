import { FillRenderer, applyStyle, Seg, subrenderer, BaseFillRendererProps, removeElement } from '@fullcalendar/core'
import { attachSegs, detachSegs } from './TimelineLane'
import TimelineCoords from './TimelineCoords'


export interface TimelineFillRendererProps extends BaseFillRendererProps {
  containerParentEl: HTMLElement
  timelineCoords?: TimelineCoords
}

export default class TimelineFillRenderer extends FillRenderer<TimelineFillRendererProps> {

  private renderContainer = subrenderer(renderContainer, removeElement)
  private attachSegs = subrenderer(attachSegs, detachSegs)


  render(props: TimelineFillRendererProps) {
    let segs = this.renderSegs(props)

    if (segs.length) {
      let containerEl = this.renderContainer({
        type: props.type,
        parentEl: props.containerParentEl
      })
      this.attachSegs({ segs, containerEl })

    } else {
      this.attachSegs(false)
      this.renderContainer(false) // don't have a container if there's no segs
    }

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


function renderContainer({ type, parentEl }: { type: string, parentEl: HTMLElement }) {
  let className = type === 'businessHours'
    ? 'bgevent'
    : type.toLowerCase()

  let containerEl = document.createElement('div')
  containerEl.className = 'fc-' + className + '-container'

  parentEl.appendChild(containerEl)

  return containerEl
}
