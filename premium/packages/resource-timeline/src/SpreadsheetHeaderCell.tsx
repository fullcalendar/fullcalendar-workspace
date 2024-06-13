import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer } from '@fullcalendar/core/internal'
import { ColSpec, ColHeaderContentArg } from '@fullcalendar/resource'

export interface SpreadsheetHeaderCellProps {
  colSpec: ColSpec
  resizer: boolean
  resizerElRef: Ref<HTMLDivElement>
  onNaturalHeight?: (height: number) => void
}

export class SpreadsheetHeaderCell extends BaseComponent<SpreadsheetHeaderCellProps> {
  private innerElRef = createRef<HTMLDivElement>()

  render() {
    let { colSpec, resizer, resizerElRef } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        elTag="th"
        elClasses={['fc-datagrid-cell']}
        elAttrs={{ role: 'columnheader' }}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={colSpec.headerContent}
        defaultGenerator={colSpec.headerDefault}
        classNameGenerator={colSpec.headerClassNames}
        didMount={colSpec.headerDidMount}
        willUnmount={colSpec.headerWillUnmount}
      >
        {(InnerContent) => (
          <div className="fc-datagrid-cell-frame">
            <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner" ref={this.innerElRef}>
              {colSpec.isMain && (
                <span className="fc-datagrid-expander fc-datagrid-expander-placeholder">
                  <span className="fc-icon" />
                </span>
              )}
              <InnerContent
                elTag="span"
                elClasses={['fc-datagrid-cell-main']}
              />
            </div>
            {resizer && (
              <div className="fc-datagrid-cell-resizer" ref={resizerElRef} />
            )}
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
