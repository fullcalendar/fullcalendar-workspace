import { createElement, Ref, BaseComponent, CssDimValue, RenderHook } from '@fullcalendar/common'
import { GroupLaneRenderHooks, ColCellContentArg } from '@fullcalendar/resource-common'

export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  innerHeight: CssDimValue
  groupValue: any
  renderingHooks: GroupLaneRenderHooks
}

/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps> {
  render() {
    let { props } = this
    let { renderingHooks } = this.props
    let hookProps: ColCellContentArg = { groupValue: props.groupValue, view: this.context.viewApi }

    return (
      <tr ref={props.elRef}>
        <RenderHook
          hookProps={hookProps}
          classNames={renderingHooks.laneClassNames}
          content={renderingHooks.laneContent}
          didMount={renderingHooks.laneDidMount}
          willUnmount={renderingHooks.laneWillUnmount}
        >
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <td
              ref={rootElRef}
              className={
                [
                  'fc-timeline-lane',
                  'fc-resource-group',
                  this.context.theme.getClass('tableCellShaded'),
                ].concat(classNames).join(' ')
              }
            >
              <div style={{ height: props.innerHeight }} ref={innerElRef}>
                {innerContent}
              </div>
            </td>
          )}
        </RenderHook>
      </tr>
    )
  }
}
