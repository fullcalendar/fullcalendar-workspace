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
          'fcnew-resource-group',
          'fcnew-timeline-lane', // is this the best name?
          'fcnew-cell',
          'fcnew-liquid',
          'fcnew-shaded', // TODO: make part of fcnew-resource-group so ppl can style both cells together?
        ]}
        renderProps={renderProps}
        generatorName="resourceGroupLaneContent"
        customGenerator={groupSpec.laneContent}
        classNameGenerator={groupSpec.laneClassNames}
        didMount={groupSpec.laneDidMount}
        willUnmount={groupSpec.laneWillUnmount}
      >
        {(InnerContainer) => (
          <div ref={this.innerElRef} className='fcnew-flex-column'>
            <InnerContainer elTag="div" elClasses={['fcnew-cell-inner']} />
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
