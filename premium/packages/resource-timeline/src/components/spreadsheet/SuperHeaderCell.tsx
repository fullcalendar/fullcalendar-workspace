import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { ColHeaderContentArg, ColHeaderRenderHooks } from '@fullcalendar/resource'

export interface SuperHeaderCellProps {
  renderHooks: ColHeaderRenderHooks
  indent?: boolean

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
  private detachInnerHeight?: () => void

  render() {
    let { renderHooks } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    return (
      <ContentContainer
        elTag="div"
        elAttrs={{
          role: 'columnheader',
          scope: 'colgroup',
        }}
        elClasses={[
          'fc-header-cell',
          'fc-cell',
          'fc-liquid',
          'fc-flex-column',
          'fc-justify-center',
        ]}
        renderProps={renderProps}
        generatorName="resourceAreaHeaderContent"
        customGenerator={renderHooks.headerContent}
        defaultGenerator={renderHooks.headerDefault}
        classNameGenerator={renderHooks.headerClassNames}
        didMount={renderHooks.headerDidMount}
        willUnmount={renderHooks.headerWillUnmount}
      >
        {(InnerContent) => (
          <div ref={this.innerElRef} className="fc-cell-inner fc-padding-lg fc-flex-row fc-align-center">
            {this.props.indent && (
              <span className="fc-datagrid-indent">
                <span className="fc-icon" />
              </span>
            )}
            <InnerContent
              elTag="span"
              elClasses={['fc-cell-main']}
            />
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
    setRef(this.props.innerHeightRef, null)
  }
}
