import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group } from '@fullcalendar/resource/internal'

export interface GroupLaneProps {
  group: Group
}

/*
parallels the SpreadsheetGroupRow
*/
export class GroupLane extends BaseComponent<GroupLaneProps> {
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
          <div className='fc-resource-group-frame'>
            <InnerContainer
              elTag="div"
              elClasses={['fc-resource-group-frame-inner']}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}
