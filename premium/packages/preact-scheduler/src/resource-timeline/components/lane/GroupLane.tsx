import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef, type Ref } from 'react'
import { Group } from '../../../resource/common/resource-hierarchy'
import { GroupSpec, ResourceGroupLaneData } from '../../structs'

export interface GroupLaneProps {
  group: Group
  role?: string // aria
  rowIndex?: number // aria
  level?: number // aria
  expanded?: boolean // aria -- TODO: rename to isExpanded?
  borderBottom: boolean

  // refs
  innerHeightRef?: Ref<number>

  // positioning
  top?: number
  width?: number
  height?: number // does NOT include the border
}

/*
parallels the ResourceGroupHeaderSubrow
*/
export class GroupLane extends BaseComponent<GroupLaneProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { group } = props
    let groupSpec = group.spec as GroupSpec // type HACK
    let renderProps: ResourceGroupLaneData = {
      fieldValue: group.value,
      view: context.viewApi,
    }

    return (
      <div
        role={props.role as any}  // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        aria-expanded={props.expanded}
        className={joinArrayishClassNames(
          classNames.fillX,
          classNames.flexRow,
        )}
        style={{
          top: props.top,
          width: props.width,
        }}
      >
        <ContentContainer
          tag="div"
          attrs={{
            role: 'gridcell',
            'aria-expanded': props.expanded,
          }}
          className={joinClassNames(
            classNames.liquid, // expand to whole row
            classNames.tight,
            classNames.flexCol,
            classNames.contentBox,
            props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
          )}
          style={{
            height: props.height,
          }}
          renderProps={renderProps}
          generatorName="resourceGroupLaneContent"
          customGenerator={groupSpec.laneContent}
          classNameGenerator={groupSpec.laneClass}
          didMount={groupSpec.laneDidMount}
          willUnmount={groupSpec.laneWillUnmount}
        >
          {(InnerContainer) => (
            <InnerContainer
              tag="div"
              elRef={this.innerElRef}
              className={joinClassNames(
                generateClassName(groupSpec.laneInnerClass, renderProps),
                classNames.noShrink,
                classNames.noMargin,
              )}
            />
          )}
        </ContentContainer>
      </div>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      if (this._isUnmounting) return
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
