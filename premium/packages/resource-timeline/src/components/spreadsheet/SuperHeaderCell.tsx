import { BaseComponent, ContentContainer, generateClassName, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ResourceColumnHeaderContentArg, ColHeaderRenderHooks } from '@fullcalendar/resource'

export interface SuperHeaderCellProps {
  renderHooks: ColHeaderRenderHooks
  indent?: boolean
  colSpan: number

  // refs
  innerHeightRef?: Ref<number>
}

/*
TODO: make more DRY with HeaderCell. Almost exactly the same except doesn't need resizer
*/
export class SuperHeaderCell extends BaseComponent<SuperHeaderCellProps> {
  // refs
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { renderHooks } = this.props
    let renderProps: ResourceColumnHeaderContentArg = { view: this.context.viewApi }

    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'columnheader',
          'aria-colspan': this.props.colSpan,
        }}
        className='fc-header-cell fc-cell fc-flex-col fc-justify-center fc-liquid'
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={renderHooks.headerContent}
        defaultGenerator={renderHooks.headerDefault}
        classNameGenerator={renderHooks.headerClassNames}
        didMount={renderHooks.headerDidMount}
        willUnmount={renderHooks.headerWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              "fc-cell-inner fc-padding-lg fc-flex-row fc-align-center",
              generateClassName(renderHooks.headerInnerClassNames, renderProps),
            )}
          >
            {this.props.indent && (
              <div className="fc-datagrid-indent">
                <span className="fc-icon" />
              </div>
            )}
            <InnerContent
              tag="div"
              className='fc-cell-main'
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
