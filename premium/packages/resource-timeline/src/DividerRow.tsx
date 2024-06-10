import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ColCellContentArg } from '@fullcalendar/resource'
import { Group } from '@fullcalendar/resource/internal'
import { SizeSyncer } from './SizeSyncer.js'

export interface DividerRowProps {
  elRef?: Ref<HTMLTableRowElement>
  group: Group
  rowSyncer: SizeSyncer
}

interface DividerRowState {
  height?: number
}

/*
parallels the SpreadsheetGroupRow
*/
export class DividerRow extends BaseComponent<DividerRowProps, DividerRowState> {
  private innerElRef = createRef<HTMLDivElement>()

  render() {
    let { props, state, context } = this
    let { group } = props
    let groupSpec = group.spec
    let renderProps: ColCellContentArg = {
      groupValue: group.value,
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
          customGenerator={groupSpec.laneContent}
          classNameGenerator={groupSpec.laneClassNames}
          didMount={groupSpec.laneDidMount}
          willUnmount={groupSpec.laneWillUnmount}
        >
          {(InnerContainer) => (
            <div className='fc-resource-group-frame' style={{ height: state.height }}>
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

  // RowSyncer
  // -----------------------------------------------------------------------------------------------

  componentDidMount(): void {
    const { rowSyncer, group } = this.props
    rowSyncer.addSizeListener(group, this.handleHeight)
    this.updateRowSyncer()
    this.context.addResizeHandler(this.updateRowSyncer)
  }

  componentDidUpdate(): void {
    this.updateRowSyncer()
  }

  componentWillUnmount(): void {
    const { rowSyncer, group } = this.props
    this.context.removeResizeHandler(this.updateRowSyncer)
    rowSyncer.removeSizeListener(group, this.handleHeight)
    rowSyncer.clearCell(this)
  }

  updateRowSyncer = () => {
    const { rowSyncer, group } = this.props
    rowSyncer.updateCell(this, group, this.innerElRef.current.offsetHeight)
  }

  handleHeight = (height: number) => {
    this.setState({ height })
  }
}
