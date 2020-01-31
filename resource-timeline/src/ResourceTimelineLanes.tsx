import {
  h, ComponentContext, DateProfileGenerator, DateProfile, memoize, PositionCache,
  SplittableProps, EventStore, createRef, BaseComponent, CssDimValue, RefMap, isArraysEqual
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

interface ResourceTimelineLanesContentProps {
  rowNodes: (GroupNode | ResourceNode)[]
  splitProps: { [resourceId: string]: SplittableProps }
  tDateProfile: TimelineDateProfile
  dateProfile: DateProfile
  dateProfileGenerator: DateProfileGenerator
  businessHours: EventStore | null
  innerHeights: number[]
  slatCoords: TimelineCoords | null
}


export default class ResourceTimelineLanes extends BaseComponent<ResourceTimelineLanesProps> {

  private rootElRef = createRef<HTMLTableElement>()
  private rowElRefs = new RefMap<HTMLElement>()


  render(props: ResourceTimelineLanesProps, state: {}, context: ComponentContext) {
    return (
      <table
        ref={this.rootElRef}
        class={context.theme.getClass('table')}
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
          splitProps={props.splitProps}
          businessHours={props.businessHours}
          slatCoords={props.slatCoords}
          innerHeights={props.innerHeights}
        />
      </table>
    )
  }


  componentDidMount() {
    this.handleSizing()
    this.context.addResizeHandler(this.handleSizing)
  }


  componentDidUpdate() {
    this.handleSizing()
  }


  componentWillUnmount() {
    this.context.removeResizeHandler(this.handleSizing)

    if (this.props.onRowCoords) {
      this.props.onRowCoords(null)
    }
  }


  handleSizing = () => {
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

ResourceTimelineLanes.addPropsEquality({
  innerHeights: isArraysEqual
})


interface ResourceTimelineLanesBodyProps extends ResourceTimelineLanesContentProps {
  rowElRefs: RefMap<HTMLElement>
}


class ResourceTimelineLanesBody extends BaseComponent<ResourceTimelineLanesBodyProps> {

  private computeHasResourceBusinessHours = memoize(computeHasResourceBusinessHours)


  render(props: ResourceTimelineLanesBodyProps, state: {}, context: ComponentContext) {
    let { rowElRefs, innerHeights } = props
    let hasResourceBusinessHours = this.computeHasResourceBusinessHours(props.rowNodes)
    let fallbackBusinessHours = hasResourceBusinessHours ? props.businessHours : null // CONFUSING, comment

    return (
      <tbody>
        {props.rowNodes.map((node, index) => {

          if ((node as GroupNode).group) {
            return (
              <DividerRow
                key={node.id}
                elRef={rowElRefs.createRef(index)}
              />
            )

          } else if ((node as ResourceNode).resource) {
            let resource = (node as ResourceNode).resource

            return (
              <ResourceTimelineLane
                key={node.id}
                elRef={rowElRefs.createRef(index)}
                {...props.splitProps[resource.id]}
                resourceId={resource.id}
                dateProfile={props.dateProfile}
                dateProfileGenerator={props.dateProfileGenerator}
                tDateProfile={props.tDateProfile}
                nextDayThreshold={context.nextDayThreshold}
                businessHours={resource.businessHours || fallbackBusinessHours}
                innerHeight={innerHeights[index] || ''}
                timelineCoords={props.slatCoords}
              />
            )
          }
        })}
      </tbody>
    )
  }

}


function computeHasResourceBusinessHours(rowNodes: (GroupNode | ResourceNode)[]) {

  for (let node of rowNodes) {
    let resource = (node as ResourceNode).resource

    if (resource && resource.businessHours) {
      return true
    }
  }

  return false
}
