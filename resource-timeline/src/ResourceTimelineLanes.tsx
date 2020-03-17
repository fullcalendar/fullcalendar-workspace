import {
  h, ComponentContext, DateProfileGenerator, DateProfile, PositionCache,
  SplittableProps, EventStore, createRef, BaseComponent, CssDimValue, RefMap,
  memoizeHashlike,
  buildHashFromArray,
  DateMarker,
  DateRange
} from '@fullcalendar/core'
import {  GroupNode, ResourceNode } from '@fullcalendar/resource-common'
import { TimelineDateProfile, TimelineCoords } from '@fullcalendar/timeline'
import ResourceTimelineLane from './ResourceTimelineLane'
import DividerRow from './DividerRow'


export interface ResourceTimelineLanesProps extends ResourceTimelineLanesContentProps {
  minHeight: CssDimValue
  clientWidth: CssDimValue
  tableMinWidth: CssDimValue
  onRowCoords?: (rowCoords: PositionCache) => void
}

export interface ResourceTimelineLanesContentProps {
  rowNodes: (GroupNode | ResourceNode)[]
  splitProps: { [resourceId: string]: SplittableProps }
  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  nowDate: DateMarker
  todayRange: DateRange
  fallbackBusinessHours: EventStore | null
  innerHeights: { [rowKey: string]: number }
  slatCoords: TimelineCoords | null
  onRowHeight: OnRowHeightHandler
}

export type OnRowHeightHandler = (rowKey: string, innerEl: HTMLElement | null) => void


export default class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {

  private rootElRef = createRef<HTMLTableElement>()
  private rowElRefs = new RefMap<HTMLElement>()


  render(props: ResourceTimelineLanesProps, state: {}, context: ComponentContext) {
    return (
      <table
        ref={this.rootElRef}
        class={'fc-resource-timeline-lanes ' + context.theme.getClass('table')}
        style={{
          minWidth: props.tableMinWidth,
          width: props.clientWidth,
          height: props.minHeight
        }}
      >
        <ResourceTimelineLanesBody
          rowElRefs={this.rowElRefs}
          rowNodes={props.rowNodes}
          dateProfile={props.dateProfile}
          dateProfileGenerator={props.dateProfileGenerator}
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
          splitProps={props.splitProps}
          fallbackBusinessHours={props.fallbackBusinessHours}
          slatCoords={props.slatCoords}
          innerHeights={props.innerHeights}
          onRowHeight={props.onRowHeight}
        />
      </table>
    )
  }


  componentDidMount() {
    this.updateCoords()
  }


  componentDidUpdate() {
    this.updateCoords()
  }


  componentWillUnmount() {
    if (this.props.onRowCoords) {
      this.props.onRowCoords(null)
    }
  }


  updateCoords() {
    let { props } = this

    if (props.onRowCoords && props.clientWidth) { // a populated clientWidth means sizing has stabilized
      this.props.onRowCoords(
        new PositionCache(
          this.rootElRef.current,
          this.rowElRefs.collect(),
          false,
          true // isVertical
        )
      )
    }
  }

}


interface ResourceTimelineLanesBodyProps extends ResourceTimelineLanesContentProps {
  rowElRefs: RefMap<HTMLElement> // indexed by NUMERICAL INDEX, not node.id
}


class ResourceTimelineLanesBody extends BaseComponent<ResourceTimelineLanesBodyProps> { // TODO: this technique more

  getOnRowHeights = memoizeHashlike((onRowHeight: OnRowHeightHandler, rowId: string) => onRowHeight.bind(null, rowId))


  render(props: ResourceTimelineLanesBodyProps, state: {}, context: ComponentContext) {
    let { rowElRefs, innerHeights } = props

    let onRowHeights = this.getOnRowHeights(
      buildHashFromArray(props.rowNodes, (rowNode) => [
        rowNode.id,
        [ props.onRowHeight, rowNode.id ]
      ])
    )

    return (
      <tbody>
        {props.rowNodes.map((node, index) => {

          if ((node as GroupNode).group) {
            return (
              <DividerRow
                key={node.id}
                elRef={rowElRefs.createRef(index)}
                groupValue={(node as GroupNode).group.value}
                renderingHooks={(node as GroupNode).group.spec}
                innerHeight={innerHeights[node.id] || ''}
              />
            )

          } else if ((node as ResourceNode).resource) {
            let resource = (node as ResourceNode).resource

            return (
              <ResourceTimelineLane
                key={node.id}
                elRef={rowElRefs.createRef(index)}
                {...props.splitProps[resource.id]}
                resource={resource}
                dateProfile={props.dateProfile}
                dateProfileGenerator={props.dateProfileGenerator}
                tDateProfile={props.tDateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                nextDayThreshold={context.nextDayThreshold}
                businessHours={resource.businessHours || props.fallbackBusinessHours}
                innerHeight={innerHeights[node.id] || ''}
                onHeight={onRowHeights[node.id]}
                timelineCoords={props.slatCoords}
              />
            )
          }
        })}
      </tbody>
    )
  }

}
