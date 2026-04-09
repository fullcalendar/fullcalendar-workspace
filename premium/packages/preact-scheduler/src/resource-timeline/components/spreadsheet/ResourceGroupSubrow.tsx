import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ContentContainer, generateClassName, joinArrayishClassNames, setRef, watchHeight } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, createRef, type Ref } from 'react'
import { ColSpec, ResourceGroupHeaderInfo } from '../../structs'

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
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { options } = context
    let { colSpec } = props
    let renderProps: ResourceGroupHeaderInfo = {
      fieldValue: props.fieldValue,
      view: context.viewApi,
    }

    // a grouped cell. no data that is specific to this specific resource
    // `colSpec` is for the group. a GroupSpec :(
    return (
      <div // the "row"
        role={props.role as any} // !!!
        aria-rowindex={props.rowIndex}
        aria-level={props.level}
        className={joinArrayishClassNames(
          options.resourceRowClass,
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
        <ContentContainer // the "cell"
          tag="div"
          attrs={{
            role: 'rowheader',
            'aria-rowspan': props.rowSpan,
          }}
          className={joinClassNames(
            classNames.noMargin,
            classNames.noPadding,
            classNames.flexCol,
            classNames.alignStart,
            classNames.liquid, // liquid-height
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
            <div // measures the "inner"
              ref={this.innerElRef}
              className={joinClassNames(
                classNames.noShrink,
                classNames.whiteSpaceNoWrap,
                classNames.flexRow, // mimics what ResourceCell does
                classNames.stickyT,
              )}
            >
              <InnerContent // the "inner"
                tag="div"
                className={generateClassName(colSpec.cellInnerClass, renderProps)}
              />
            </div>
          )}
        </ContentContainer>
      </div>
    )
  }

  componentDidMount(): void {
    this._isUnmounting = false
    const innerEl = this.innerElRef.current

    this.disconnectInnerHeight = watchHeight(innerEl, (height) => {
      if (this._isUnmounting) return
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this._isUnmounting = true
    this.disconnectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}

function renderGroupInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
