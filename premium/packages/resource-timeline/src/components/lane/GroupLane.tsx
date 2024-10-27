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
        tag="div"
        // TODO: is fc-timeline-lane this the best name?
        // TODO: make part of fc-resource-group so ppl can style both cells together?
        className='fc-resource-group fc-timeline-lane fc-cell fc-liquid fc-shaded'
        renderProps={renderProps}
        generatorName="resourceGroupLaneContent"
        customGenerator={groupSpec.laneContent}
        classNameGenerator={groupSpec.laneClassNames}
        didMount={groupSpec.laneDidMount}
        willUnmount={groupSpec.laneWillUnmount}
      >
        {(InnerContainer) => (
          <div ref={this.innerElRef} className='fc-flex-column'>
            <InnerContainer tag="div" className='fc-cell-inner' />
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
    setRef(this.props.innerHeightRef, null)
  }
}
