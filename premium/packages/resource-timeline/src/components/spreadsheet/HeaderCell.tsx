import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ColSpec, ColHeaderContentArg } from '@fullcalendar/resource'

export interface HeaderCellProps {
  colSpec: ColSpec
  resizer: boolean
  indent?: boolean

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
    let { colSpec, resizer, resizerElRef, width } = this.props
    let renderProps: ColHeaderContentArg = { view: this.context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        elTag="div"
        elAttrs={{
          role: 'columnheader'
        }}
        elClasses={[
          'fcnew-rel', // for resizer abs positioning
          'fcnew-cell',
          'fcnew-datagrid-cell',
        ]}
        elStyle={{
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
            <div ref={this.innerElRef}>
              <div className="fcnew-datagrid-cell-cushion">
                {this.props.indent && (
                  <span className="fcnew-datagrid-indent">
                    <span className="fcnew-icon" />
                  </span>
                )}
                <InnerContent
                  elTag="span"
                  elClasses={['fcnew-datagrid-cell-main']}
                />
              </div>
            </div>
            {resizer && (
              <div className="fcnew-datagrid-cell-resizer" ref={resizerElRef} />
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
  }
}
