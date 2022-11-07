import { BaseComponent, CssDimValue, ContentContainer } from '@fullcalendar/core'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { GroupLaneRenderHooks, ColCellContentArg } from '@fullcalendar/resource-common'

export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  innerHeight: CssDimValue
  groupValue: any
  renderHooks: GroupLaneRenderHooks
}

/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps> {
  render() {
    let { props, context } = this
    let { renderHooks } = props
    let renderProps: ColCellContentArg = { groupValue: props.groupValue, view: context.viewApi }

    return (
      <tr ref={props.elRef}>
        <ContentContainer
          elTag="td"
          elClasses={[
            'fc-timeline-lane',
            'fc-resource-group',
            context.theme.getClass('tableCellShaded'),
          ]}
          renderProps={renderProps}
          generatorName="laneContent"
          generator={renderHooks.laneContent}
          classNameGenerator={renderHooks.laneClassNames}
          didMount={renderHooks.laneDidMount}
          willUnmount={renderHooks.laneWillUnmount}
        >
          {(InnerContainer) => (
            <InnerContainer
              elTag="div"
              elStyle={{ height: props.innerHeight }}
            />
          )}
        </ContentContainer>
      </tr>
    )
  }
}
