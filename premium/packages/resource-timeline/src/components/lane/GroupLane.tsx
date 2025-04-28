import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { Group } from '@fullcalendar/resource/internal'
import { GroupSpec, ResourceGroupLaneContentArg } from '../../structs.js'

export interface GroupLaneProps {
  group: Group
  role?: string // aria
  rowIndex?: number // aria
  level?: number // aria
  expanded?: boolean // aria
  borderBottom: boolean

  // refs
  innerHeightRef?: Ref<number>

  // positioning
  top?: number
  width?: number
  height?: number
}

/*
parallels the ResourceGroupHeaderSubrow
*/
export class GroupLane extends BaseComponent<GroupLaneProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { group } = props
    let groupSpec = group.spec as GroupSpec // type HACK
    let renderProps: ResourceGroupLaneContentArg = {
      fieldValue: group.value,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: props.role as any, // !!!
          'aria-rowindex': props.rowIndex,
          'aria-level': props.level,
          'aria-expanded': props.expanded,
        }}
        className={joinClassNames(
          'fcu-flex-row fcu-fill-x fcu-content-box',
          props.borderBottom
            ? 'fcu-border-only-b'
            : 'fcu-border-none',
        )}
        style={{
          top: props.top,
          width: props.width,
          height: props.height,
        }}
        renderProps={renderProps}
        generatorName="resourceGroupLaneContent"
        customGenerator={groupSpec.laneContent}
        classNameGenerator={groupSpec.laneClassNames}
        didMount={groupSpec.laneDidMount}
        willUnmount={groupSpec.laneWillUnmount}
      >
        {(InnerContainer) => (
          <InnerContainer
            tag="div"
            attrs={{
              role: 'gridcell',
            }}
            className={joinClassNames(
              'fcu-flex-col fcu-liquid fcu-flex-col',
              generateClassName(groupSpec.laneInnerClassNames, renderProps),
            )}
            elRef={this.innerElRef}
          />
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
