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
        elAttrs={{ role: 'columnheader' }}
        elClasses={['fcnew-cell']}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={colSpec.headerContent}
        defaultGenerator={colSpec.headerDefault}
        classNameGenerator={colSpec.headerClassNames}
        didMount={colSpec.headerDidMount}
        willUnmount={colSpec.headerWillUnmount}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className="fcnew-rel">
            <div className="fcnew-datagrid-cell-cushion">
              {colSpec.isMain && (
                <span className="fcnew-datagrid-expander fcnew-datagrid-expander-placeholder">
                  <span className="fcnew-icon" />
                </span>
              )}
              <InnerContent
                elTag="span"
                elClasses={['fcnew-datagrid-cell-main']}
              />
            </div>
            {resizer && (
              <div className="fcnew-datagrid-cell-resizer" ref={resizerElRef} />
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
