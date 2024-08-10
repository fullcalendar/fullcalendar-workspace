import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ColSpec, ColHeaderContentArg } from '@fullcalendar/resource'

export interface HeaderCellProps {
  colSpec: ColSpec
  resizer: boolean

  // refs
  resizerElRef?: Ref<HTMLDivElement> // TODO: get rid of this
  innerHeightRef?: Ref<number>
}

export class HeaderCell extends BaseComponent<HeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void

  render() {
    let { colSpec, resizer, resizerElRef } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        elTag="div"
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
          <div className="fc-datagrid-cell-frame" ref={this.innerElRef}>
            <div className="fc-datagrid-cell-cushion fc-scrollgrid-sync-inner">
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
    const innerEl = this.innerElRef.current

    this.detachInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.detachInnerHeight()
  }
}
