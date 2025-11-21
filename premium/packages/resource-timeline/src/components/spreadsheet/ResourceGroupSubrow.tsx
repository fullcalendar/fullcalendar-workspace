import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import classNames from '@fullcalendar/core/internal-classnames'
import { ComponentChild, createElement, createRef, Fragment, Ref } from '@fullcalendar/core/preact'
import { ColSpec, ResourceGroupHeaderData } from '../../structs.js'

export interface ResourceGroupSubrowProps {
  colSpec: ColSpec
  fieldValue: any
  rowSpan?: number
  width?: number
  grow?: number
  className?: string
  borderStart: boolean
  borderBottom: boolean

  // aria
  role?: string
  rowIndex?: number
  level?: number

  // refs
  innerHeightRef?: Ref<number>

  // position
  top?: number
  height?: number
}

/*
Group cell that spans vertically, consuming multiple rowspan
*/
export class ResourceGroupSubrow extends BaseComponent<ResourceGroupSubrowProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let { colSpec } = props
    let renderProps: ResourceGroupHeaderData = {
      fieldValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <div
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        className={joinArrayishClassNames(
          options.resourceAreaRowClass,
          props.className,
          classNames.flexRow,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={{
          top: props.top,
          height: props.height,
          minWidth: 0,
          width: props.width,
          flexGrow: props.grow,
        }}
      >
        <ContentContainer
          tag="div"
          attrs={{
            role: 'rowheader',
            'aria-rowspan': props.rowSpan,
          }}
          className={joinClassNames(
            classNames.tight,
            classNames.liquid,
            props.borderStart ? classNames.borderOnlyS : classNames.borderNone,
          )}
          renderProps={renderProps}
          generatorName="resourceCellContent"
          customGenerator={colSpec.cellContent}
          defaultGenerator={renderGroupInner}
          classNameGenerator={colSpec.cellClass}
          didMount={colSpec.cellDidMount}
          willUnmount={colSpec.cellWillUnmount}
        >
          {(InnerContent) => (
            <InnerContent
              tag="div"
              className={joinClassNames(
                generateClassName(colSpec.cellInnerClass, renderProps),
                classNames.rigid,
                classNames.stickyT,
              )}
              elRef={this.innerElRef}
            />
          )}
        </ContentContainer>
      </div>
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

function renderGroupInner(renderProps: ResourceGroupHeaderData): ComponentChild {
  return renderProps.fieldValue || <Fragment>&nbsp;</Fragment>
}
