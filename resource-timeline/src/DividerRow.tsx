import { h, Ref, BaseComponent, CssDimValue, RenderHook } from '@fullcalendar/common'


export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  innerHeight: CssDimValue
  groupValue: any
  renderingHooks: { laneClassNames?, laneContent?, laneDidMount?, laneWillUnmount? }
}


/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps> {

  render() {
    let { props } = this
    let hookProps = { groupValue: props.groupValue }

    return (
      <tr ref={props.elRef}>
        <RenderHook name='lane' hookProps={hookProps} options={props.renderingHooks}>
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <td className={[ 'fc-timeline-lane', 'fc-resource-group', this.context.theme.getClass('tableCellShaded')].concat(classNames).join(' ')} ref={rootElRef}>
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
