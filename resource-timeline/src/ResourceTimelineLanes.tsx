import { createElement, PositionCache, createRef, BaseComponent, CssDimValue, RefMap } from '@fullcalendar/common'
import { GroupNode, ResourceNode } from '@fullcalendar/resource-common'
import { ResourceTimelineLanesBody, ResourceTimelineLanesContentProps } from './ResourceTimelineLanesBody'

export interface ResourceTimelineLanesProps extends ResourceTimelineLanesContentProps {
  minHeight: CssDimValue
  clientWidth: number | null
  tableMinWidth: CssDimValue
  onRowCoords?: (rowCoords: PositionCache) => void
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
