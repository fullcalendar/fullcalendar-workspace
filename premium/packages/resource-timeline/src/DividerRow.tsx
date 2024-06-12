import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group } from '@fullcalendar/resource/internal'

export interface DividerRowProps {
  group: Group
  top: number | undefined
  height: number | undefined
  onNaturalHeight?: (height: number) => void
}

/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps> {
  private innerElRef = createRef<HTMLDivElement>()

  render() {
    let { props, context } = this
    let { group } = props
    let groupSpec = group.spec
    let renderProps: ColCellContentArg = {
      groupValue: group.value,
      view: context.viewApi,
    }

    return (
      <tr>
        <ContentContainer
          elTag="td"
          elClasses={[
            'fc-timeline-lane',
            'fc-resource-group',
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
            <div className='fc-resource-group-frame' style={{ height: props.height }}>
              <InnerContainer
                elTag="div"
                elClasses={['fc-resource-group-frame-inner']}
                elRef={this.innerElRef}
              />
            </div>
          )}
        </ContentContainer>
      </tr>
    )
  }

  componentDidMount(): void {
    this.reportNaturalHeight()
  }

  componentDidUpdate(): void {
    this.reportNaturalHeight()
  }

  reportNaturalHeight() {
    if (this.props.onNaturalHeight) {
      this.props.onNaturalHeight(this.innerElRef.current.offsetHeight)
    }
  }
}
