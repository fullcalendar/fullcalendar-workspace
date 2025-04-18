import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ColSpec, ResourceColumnHeaderContentArg } from '@fullcalendar/resource'

export interface HeaderCellProps {
  colSpec: ColSpec
  resizer: boolean
  indent?: boolean
  borderStart: boolean

  // refs
  resizerElRef?: Ref<HTMLDivElement>
  innerHeightRef?: Ref<number>

  // size
  width: number | undefined
  grow: number | undefined
}

export class HeaderCell extends BaseComponent<HeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { colSpec } = props
    let renderProps: ResourceColumnHeaderContentArg = { view: context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'columnheader',
        }}
        // fc-rel for resizer abs positioning
        className={joinClassNames(
          'fc-header-cell fc-cell fc-flex-col fc-justify-center fc-rel',
          props.borderStart && 'fc-border-s',
        )}
        style={{
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
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
            <div
              ref={this.innerElRef}
              className={joinArrayishClassNames(
                'fc-cell-inner fc-padding-lg fc-flex-row fc-align-center',
                generateClassName(colSpec.headerInnerClassNames, renderProps),
              )}
            >
              {this.props.indent && (
                <div className="fc-datagrid-indent">
                  <span className="fc-datagrid-icon" />
                </div>
              )}
              <InnerContent
                tag="div"
                className='fc-cell-main'
              />
            </div>
            {props.resizer && (
              <div className="fc-datagrid-col-resizer" ref={props.resizerElRef} />
            )}
          </Fragment>
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
