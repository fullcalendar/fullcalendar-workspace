import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { createRef, type Ref } from 'react'
import { Group } from '../../../resource/common/resource-hierarchy'
import { GroupSpec, ResourceGroupLaneInfo } from '../../structs'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface GroupLaneProps extends AriaCellInput {
  group: Group

  borderBottom: boolean

  // refs
  innerHeightRef?: Ref<number>

  // positioning
  height?: number // does NOT include the border
  forPrint?: boolean
}

/*
parallels the ResourceGroupHeaderCell
*/
export class GroupLane extends BaseComponent<GroupLaneProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { group, forPrint } = props
    let groupSpec = group.spec as GroupSpec // type HACK
    let renderProps: ResourceGroupLaneInfo = {
      fieldValue: group.value,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag={forPrint ? 'td' : 'div'}
        attrs={{
          ...buildAriaCellAttrs(props),
          role: 'gridcell',
        }}
        className={joinClassNames(
          !forPrint && classNames.liquid, // expand to whole row
          classNames.noMargin,
          classNames.noPadding,
          !forPrint && classNames.flexCol,
          classNames.contentBox,
          classNames.borderlessX,
          classNames.borderlessTop,
          !props.borderBottom && classNames.borderlessBottom,
        )}
        style={forPrint ? undefined : {
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
