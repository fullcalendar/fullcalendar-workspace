import { BaseComponent, DateMarker, joinClassNames, setRef, watchHeight } from '@fullcalendar/core/internal'
import { createElement, createRef, Ref } from '@fullcalendar/core/preact'
import { Resource, ResourceLabelContainer } from '@fullcalendar/resource/internal'

export interface ResourceHeaderCellProps {
  resource: Resource
  date?: DateMarker
  colSpan: number
  isSticky?: boolean

  // dimensions
  colWidth?: number

  // ref
  innerHeightRef?: Ref<number>
}

export class ResourceHeaderCell extends BaseComponent<ResourceHeaderCellProps> {
  // ref
  private innerElRef = createRef<HTMLDivElement>()

  // internal
  private disconectInnerHeight?: () => void

  render() {
    let { props } = this

    return (
      <ResourceLabelContainer
        elTag="div"
        elClassName={joinClassNames(
          'fc-resource fc-header-cell fc-cell fc-flex-column fc-align-center',
          props.colWidth == null && 'fc-liquid',
        )}
        elStyle={{
          width: props.colWidth != null // TODO: DRY
            ? props.colWidth * (props.colSpan || 1)
            : undefined,
        }}
        resource={props.resource}
        date={props.date}
      >
        {(InnerContent) => (
          <InnerContent
            elTag="span"
            elClassName={joinClassNames(
              'fc-cell-inner fc-padding-sm',
              props.isSticky && 'fc-sticky-x',
            )}
            elRef={this.innerElRef}
          />
        )}
      </ResourceLabelContainer>
    )
  }

  componentDidMount(): void {
    const innerEl = this.innerElRef.current // TODO: make dynamic with useEffect

    // TODO: only attach this if refs props present
    this.disconectInnerHeight = watchHeight(innerEl, (height) => {
      setRef(this.props.innerHeightRef, height)
    })
  }

  componentWillUnmount(): void {
    this.disconectInnerHeight()
    setRef(this.props.innerHeightRef, null)
  }
}
