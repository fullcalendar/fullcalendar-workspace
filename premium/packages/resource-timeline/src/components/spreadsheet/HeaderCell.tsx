import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { ColSpec, ResourceColumnHeaderContentArg } from '@fullcalendar/resource'
import { ResourceIndent } from './ResourceIndent.js'

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
  indentWidth: number | undefined
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
          props.borderStart ? 'fc-border-only-s' : 'fc-border-none',
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
                <ResourceIndent
                  level={1}
                  indentWidth={props.indentWidth}
                />
              )}
              <InnerContent tag="div" />
            </div>
            {props.resizer && (
              <div className="fc-col-resizer" ref={props.resizerElRef} />
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
