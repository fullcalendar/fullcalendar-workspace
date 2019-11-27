import { FillRenderer, applyStyle, Seg, subrenderer, BaseFillRendererProps } from '@fullcalendar/core'
import { attachSegs, detachSegs } from './TimelineLane'
import TimelineSlats from './TimelineSlats'


export interface TimelineLaneFillsProps extends BaseFillRendererProps {
  containerParentEl: HTMLElement
}

export default class TimelineLaneFills extends FillRenderer<TimelineLaneFillsProps> {

  private renderContainer = subrenderer(renderContainer)
  private attachSegs = subrenderer(attachSegs, detachSegs)


  render(props: TimelineLaneFillsProps) {
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
  }


  computeSegSizes(segs: Seg[], slats: TimelineSlats) {
    for (let seg of segs) {
      let coords = slats.rangeToCoords(seg)
      seg.left = coords.left
      seg.right = coords.right
    }
  }


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
