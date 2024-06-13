import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { createElement, createRef } from '@fullcalendar/core/preact'
import { ColHeaderContentArg, ColHeaderRenderHooks } from '@fullcalendar/resource'

export interface SpreadsheetSuperHeaderCellProps {
  renderHooks: ColHeaderRenderHooks
  onNaturalHeight?: (height: number) => void
}

export class SpreadsheetSuperHeaderCell extends BaseComponent<SpreadsheetSuperHeaderCellProps> {
  private innerElRef = createRef<HTMLDivElement>()

  render() {
    let { renderHooks } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    // <tr key="row-super" role="row">
    return (
      <ContentContainer
        elTag="th"
        elClasses={[
          'fc-datagrid-cell',
          'fc-datagrid-cell-super',
        ]}
        elAttrs={{
          role: 'columnheader',
          scope: 'colgroup',
        }}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={renderHooks.headerContent}
        defaultGenerator={renderHooks.headerDefault}
        classNameGenerator={renderHooks.headerClassNames}
        didMount={renderHooks.headerDidMount}
        willUnmount={renderHooks.headerWillUnmount}
      >
        {(InnerContent) => (
          <div className="fc-datagrid-cell-frame">
            <InnerContent
              elTag="div"
              elClasses={['fc-datagrid-cell-cushion', 'fc-scrollgrid-sync-inner']}
              elRef={this.innerElRef}
            />
          </div>
        )}
      </ContentContainer>
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
