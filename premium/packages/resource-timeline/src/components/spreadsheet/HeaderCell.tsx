import { createElement, createRef, Ref, Fragment } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { ColSpec, ResourceColumnHeaderData } from '../../structs.js'
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
    let renderProps: ResourceColumnHeaderData = { view: context.viewApi }

    // need empty inner div for abs positioning for resizer
    return (
      <ContentContainer
        tag="div"
        attrs={{
          role: 'columnheader',
        }}
        className={joinClassNames(
          classNames.tight,
          classNames.flexCol,
          classNames.rel, // for resizer abs positioning
          props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
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
        classNameGenerator={colSpec.headerClass}
        didMount={colSpec.headerDidMount}
        willUnmount={colSpec.headerWillUnmount}
      >
        {(InnerContent) => (
          <Fragment>
            <div
              ref={this.innerElRef}
              className={joinArrayishClassNames(
                generateClassName(colSpec.headerInnerClass, renderProps),
                classNames.rigid,
                classNames.flexRow,
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
              <div className={classNames.colResizer} ref={props.resizerElRef} />
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
