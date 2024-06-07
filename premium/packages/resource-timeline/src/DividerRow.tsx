import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, Ref } from '@fullcalendar/core/preact'
import { GroupLaneRenderHooks, ColCellContentArg } from '@fullcalendar/resource'
import { RowSyncer } from './RowSyncer.js'
import { groupPrefix } from './RowKey.js'

export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  groupValue: any
  renderHooks: GroupLaneRenderHooks
  rowSyncer: RowSyncer
}

interface DividerRowState {
  frameHeight?: number
}

/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps, DividerRowState> {
  render() {
    let { props, state, context } = this
    let { renderHooks } = props
    let renderProps: ColCellContentArg = {
      groupValue: props.groupValue,
      view: context.viewApi,
    }

    return (
      <tr ref={props.elRef}>
        <ContentContainer
          elTag="td"
          elRef={props.elRef}
          elClasses={[
            'fc-timeline-lane',
            'fc-resource-group',
            context.theme.getClass('tableCellShaded'),
          ]}
          renderProps={renderProps}
          generatorName="resourceGroupLaneContent"
          customGenerator={renderHooks.laneContent}
          classNameGenerator={renderHooks.laneClassNames}
          didMount={renderHooks.laneDidMount}
          willUnmount={renderHooks.laneWillUnmount}
        >
          {(InnerContainer) => (
            <InnerContainer
              elTag="div"
              elStyle={{ height: state.frameHeight }}
            />
          )}
        </ContentContainer>
      </tr>
    )
  }

  // Just Receive Cell Height
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    this.props.rowSyncer.addHandler(groupPrefix + this.props.groupValue, this.handleFrameHeight)
  }

  componentWillUnmount(): void {
    this.props.rowSyncer.removeHandler(groupPrefix + this.props.groupValue, this.handleFrameHeight)
  }

  handleFrameHeight = (frameHeight: number) => {
    this.setState({ frameHeight })
  }
}
