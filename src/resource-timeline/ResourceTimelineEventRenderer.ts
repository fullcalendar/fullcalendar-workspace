import TimelineEventRenderer from '../timeline/renderers/TimelineEventRenderer'


export default class ResourceTimelineEventRenderer extends TimelineEventRenderer {


  // don't render any fg segs
  renderFgRanges(eventRanges) {
    // subclasses can implement
  }


  unrenderFgRanges() {
    // otherwise will try do manip DOM, js error
  }

}
