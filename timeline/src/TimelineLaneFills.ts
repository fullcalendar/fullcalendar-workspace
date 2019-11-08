import { FillRenderer, createElement, applyStyle, Seg, renderer, BaseFillRendererProps } from '@fullcalendar/core'
import TimeAxis from './TimeAxis'
import { attachSegs, detachSegs } from './TimelineLane'


export type TimelineLaneFillRendererProps = BaseFillRendererProps


export default class TimelineLaneFillRenderer extends FillRenderer<TimelineLaneFillRendererProps> {

  private renderContainer = renderer(renderContainer)
  private attachSegs = renderer(attachSegs, detachSegs)


  render(props: TimelineLaneFillRendererProps) {
    let segs = this.renderSegs(props)

    if (segs.length) {
      let containerEl = this.renderContainer({ type: props.type })
      this.attachSegs({ segs, containerEl })
      return [ containerEl ]

    } else {
      this.renderContainer(false)
      this.attachSegs(false)
      return []
    }
  }


  computeSegSizes(segs: Seg[], timeAxis: TimeAxis) {
    for (let seg of segs) {
      let coords = timeAxis.rangeToCoords(seg)
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


function renderContainer({ type }: { type: string }) {
  let className = type === 'businessHours'
    ? 'bgevent'
    : type.toLowerCase()

  return createElement('div', { className: 'fc-' + className + '-container' })
}
