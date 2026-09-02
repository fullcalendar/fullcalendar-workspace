import { joinClassNames } from '@fullcalendar/preact/public-api'
import { BaseComponent, ViewContext, ContentContainer, watchHeight, setRef, generateClassName } from '@fullcalendar/preact/protected-api'
import classNames from '@fullcalendar/preact/protected-styles'
import { type ReactNode, type Ref, createRef } from 'react'
import { Group, createGroupId, isGroupsEqual } from '../../../resource/common/resource-hierarchy'
import { ResourceIndent } from './ResourceIndent'
import { ResourceExpander } from './ResourceExpander'
import { ResourceGroupHeaderInfo, GroupSpec } from '../../structs'
import { type AriaCellInput, buildAriaCellAttrs } from '../../aria'

export interface ResourceGroupHeaderCellProps extends AriaCellInput {
  group: Group
  isExpanded: boolean // for expander icon (aria-expanded lives on the row)
  colSpan: number
  borderBottom: boolean
  indentWidth: number | undefined

  // refs
  innerHeightRef?: Ref<number>

  // position
  height?: number // does NOT include the border
  forPrint?: boolean
}

/*
Group cell that spans horizontally, consuming multiple colspans
*/
export class ResourceGroupHeaderCell extends BaseComponent<ResourceGroupHeaderCellProps, ViewContext> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private _isUnmounting: boolean
  private disconnectInnerHeight?: () => void

  render() {
    let { props, context } = this
    let { forPrint } = props
    let renderProps: ResourceGroupHeaderInfo = {
      fieldValue: props.group.value,
      view: context.viewApi,
    }
    let spec = props.group.spec as GroupSpec // type HACK

    return (
      <ContentContainer
        tag={forPrint ? 'td' : 'div'}
        attrs={forPrint ? {
          colSpan: props.colSpan,
        } : {
          ...buildAriaCellAttrs(props),
          role: 'rowheader',
          'aria-colspan': props.colSpan,
        }}
        className={joinClassNames(
          !forPrint && classNames.liquid, // expand to whole row
          classNames.noMargin,
          classNames.noPadding,
          !forPrint && classNames.flexCol,
          classNames.alignStart, // h-align
          classNames.crop,
          classNames.contentBox,
          props.borderBottom ? classNames.borderOnlyB : classNames.borderNone,
        )}
        style={forPrint ? undefined : {
          height: props.height,
        }}
        renderProps={renderProps}
        generatorName="resourceGroupHeaderContent"
        customGenerator={spec.labelContent}
        defaultGenerator={renderCellInner}
        classNameGenerator={spec.labelClass}
        didMount={spec.labelDidMount}
        willUnmount={spec.labelWillUnmount}
      >
        {(InnerContent) => (
          <div
            ref={this.innerElRef}
            className={joinClassNames(
              classNames.noShrink,
              classNames.whiteSpaceNoWrap,
              classNames.flexRow,
            )}
            style={{
              isolation: 'isolate', // TODO: className
            }}
          >
            <ResourceIndent
              level={1}
              indentWidth={props.indentWidth}
              style={{ zIndex: 2 }}
            >
              <ResourceExpander
                isExpanded={props.isExpanded}
                onExpanderClick={this.onExpanderClick}
              />
            </ResourceIndent>
            <InnerContent
              tag="div"
              className={generateClassName(spec.labelInnerClass, renderProps)}
              style={{ zIndex: 1 }}
            />
          </div>
        )}
      </ContentContainer>
    )
  }

  onExpanderClick = () => {
    let { props } = this

    this.context.dispatch({
      type: 'SET_RESOURCE_ENTITY_EXPANDED',
      id: createGroupId(props.group),
      isExpanded: !props.isExpanded,
    })
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

ResourceGroupHeaderCell.addPropsEquality({
  group: isGroupsEqual,
})

function renderCellInner(renderProps: ResourceGroupHeaderInfo): ReactNode {
  return renderProps.fieldValue || <>&nbsp;</>
}
