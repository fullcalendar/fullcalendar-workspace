import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ColSpec, ColHeaderContentArg } from '@fullcalendar/resource'

export interface HeaderCellProps {
  colSpec: ColSpec
  resizer: boolean
  indent?: boolean
  borderStart: boolean

  // refs
  resizerElRef?: Ref<HTMLDivElement>
  innerHeightRef?: Ref<number>

  // size
  width?: number
}

export class HeaderCell extends BaseComponent<HeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private detachInnerHeight?: () => void

  render() {
    let { colSpec, resizer, resizerElRef, width, borderStart } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'columnheader'
        }}
        // fc-rel for resizer abs positioning
        className={joinClassNames(
          'fc-header-cell fc-cell fc-flex-col fc-justify-center fc-rel',
          borderStart && 'fc-border-s',
        )}
        style={{
          width,
        }}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={colSpec.headerContent}
        defaultGenerator={colSpec.headerDefault}
        classNameGenerator={colSpec.headerClassNames}
        didMount={colSpec.headerDidMount}
        willUnmount={colSpec.headerWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            <div ref={this.innerElRef} className="fc-cell-inner fc-padding-lg fc-flex-row fc-align-center">
              {this.props.indent && (
                <span className="fc-datagrid-indent">
                  <span className="fc-icon" />
                </span>
              )}
              <InnerContent
                tag="span"
                className='fc-cell-main'
              />
            </div>
            {resizer && (
              <div className="fc-datagrid-col-resizer" ref={resizerElRef} />
            )}
          </Fragment>
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
    setRef(this.props.innerHeightRef, null)
  }
}
