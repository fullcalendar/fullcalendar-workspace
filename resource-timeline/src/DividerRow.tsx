import { h, Ref, BaseComponent, CssDimValue, RenderHook } from '@fullcalendar/core'


export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  innerHeight: CssDimValue
  groupValue: any
  renderingHooks: { laneClassNames?, laneContent?, laneDidMount?, laneWillUnmount? }
}


/*
parallels the SpreadsheetGroupRow
*/
export default class DividerRow extends BaseComponent<DividerRowProps> {

  render(props: DividerRowProps) {
    let innerProps = { groupValue: props.groupValue }

    return (
      <tr ref={props.elRef}>
        <RenderHook name='lane' mountProps={innerProps} dynamicProps={innerProps} options={props.renderingHooks}>
          {(rootElRef, classNames, innerElRef, innerContent) => (
            <td ref={rootElRef} class={['fc-divider', this.context.theme.getClass('tableCellShaded')].concat(classNames).join(' ')}>
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
