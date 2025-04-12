import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ResourceGroupLaneContentArg } from '@fullcalendar/resource'
import { Group } from '@fullcalendar/resource/internal'

export interface GroupLaneProps {
  group: Group

  // refs
  innerHeightRef?: Ref<number>
}

/*
parallels the GroupWideCell
*/
export class GroupLane extends BaseComponent<GroupLaneProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { group } = props
    let groupSpec = group.spec
    let renderProps: ResourceGroupLaneContentArg = {
      fieldValue: group.value,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'gridcell',
        }}
        className='fc-resource-group fc-liquid fc-flex-col fc-timeline-lane fc-shaded'
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
            className={joinClassNames(
              'fc-flex-col',
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
