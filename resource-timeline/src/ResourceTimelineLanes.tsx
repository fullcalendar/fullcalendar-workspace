import {
  createElement, PositionCache,
  SplittableProps, EventStore, createRef, BaseComponent, CssDimValue, RefMap,
  DateMarker,
  DateRange,
  DateProfile,
} from '@fullcalendar/common'
import { GroupNode, ResourceNode } from '@fullcalendar/resource-common'
import { TimelineDateProfile, TimelineCoords } from '@fullcalendar/timeline'
import { ResourceTimelineLane } from './ResourceTimelineLane'
import { DividerRow } from './DividerRow'

export interface ResourceTimelineLanesProps extends ResourceTimelineLanesContentProps {
  minHeight: CssDimValue
  clientWidth: number | null
  tableMinWidth: CssDimValue
  onRowCoords?: (rowCoords: PositionCache) => void
}

export interface ResourceTimelineLanesContentProps {
  rowNodes: (GroupNode | ResourceNode)[]
  splitProps: { [resourceId: string]: SplittableProps }
  dateProfile: DateProfile
  tDateProfile: TimelineDateProfile
  nowDate: DateMarker
  todayRange: DateRange
  fallbackBusinessHours: EventStore | null
  innerHeights: number[]
  slatCoords: TimelineCoords | null
  onRowHeightChange?: (rowEl: HTMLTableRowElement, isStable: boolean) => void
}

export class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {
  private rootElRef = createRef<HTMLTableElement>()
  private rowElRefs = new RefMap<HTMLElement>()

  render() {
    let { props, context } = this

    return (
      <table
        ref={this.rootElRef}
        className={'fc-scrollgrid-sync-table ' + context.theme.getClass('table')}
        style={{
          minWidth: props.tableMinWidth,
          width: props.clientWidth,
          height: props.minHeight,
        }}
      >
        <ResourceTimelineLanesBody
          rowElRefs={this.rowElRefs}
          rowNodes={props.rowNodes}
          dateProfile={props.dateProfile}
          tDateProfile={props.tDateProfile}
          nowDate={props.nowDate}
          todayRange={props.todayRange}
          splitProps={props.splitProps}
          fallbackBusinessHours={props.fallbackBusinessHours}
          slatCoords={props.slatCoords}
          innerHeights={props.innerHeights}
          onRowHeightChange={props.onRowHeightChange}
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

    if (props.onRowCoords && props.clientWidth !== null) { // a populated clientWidth means sizing has stabilized
      this.props.onRowCoords(
        new PositionCache(
          this.rootElRef.current,
          collectRowEls(this.rowElRefs.currentMap, props.rowNodes),
          false,
          true, // isVertical
        ),
      )
    }
  }
}

function collectRowEls(elMap: { [key: string]: HTMLElement }, rowNodes: (GroupNode | ResourceNode)[]) {
  return rowNodes.map((rowNode) => elMap[rowNode.id])
}

interface ResourceTimelineLanesBodyProps extends ResourceTimelineLanesContentProps {
  rowElRefs: RefMap<HTMLElement> // indexed by NUMERICAL INDEX, not node.id
}

class ResourceTimelineLanesBody extends BaseComponent<ResourceTimelineLanesBodyProps> { // TODO: this technique more
  render() {
    let { props, context } = this
    let { rowElRefs, innerHeights } = props

    return (
      <tbody>
        {props.rowNodes.map((node, index) => {
          if ((node as GroupNode).group) {
            return (
              <DividerRow
                key={node.id}
                elRef={rowElRefs.createRef(node.id)}
                groupValue={(node as GroupNode).group.value}
                renderingHooks={(node as GroupNode).group.spec}
                innerHeight={innerHeights[index] || ''}
              />
            )
          }

          if ((node as ResourceNode).resource) {
            let resource = (node as ResourceNode).resource

            return (
              <ResourceTimelineLane
                key={node.id}
                elRef={rowElRefs.createRef(node.id)}
                {...props.splitProps[resource.id]}
                resource={resource}
                dateProfile={props.dateProfile}
                tDateProfile={props.tDateProfile}
                nowDate={props.nowDate}
                todayRange={props.todayRange}
                nextDayThreshold={context.options.nextDayThreshold}
                businessHours={resource.businessHours || props.fallbackBusinessHours}
                innerHeight={innerHeights[index] || ''}
                timelineCoords={props.slatCoords}
                onHeightChange={props.onRowHeightChange}
              />
            )
          }
        })}
      </tbody>
    )
  }
}
