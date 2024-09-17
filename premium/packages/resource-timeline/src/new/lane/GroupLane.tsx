import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
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
  private detachInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { group } = props
    let groupSpec = group.spec
    let renderProps: ColCellContentArg = {
      groupValue: group.value,
      view: context.viewApi,
    }

    return (
      <ContentContainer
        elTag="div"
        elClasses={[
          'fcnew-timeline-lane',
          'fcnew-resource-group',
          context.theme.getClass('tableCellShaded'),
        ]}
        renderProps={renderProps}
        generatorName="resourceGroupLaneContent"
        customGenerator={groupSpec.laneContent}
        classNameGenerator={groupSpec.laneClassNames}
        didMount={groupSpec.laneDidMount}
        willUnmount={groupSpec.laneWillUnmount}
      >
        {(InnerContainer) => (
          <div className='fcnew-resource-group-frame' ref={this.innerElRef}>
            <InnerContainer
              elTag="div"
              elClasses={['fcnew-resource-group-frame-inner']}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
  }
}
