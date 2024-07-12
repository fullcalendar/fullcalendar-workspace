import { BaseComponent, DateMarker } from '@fullcalendar/core/internal'
import { createElement } from '@fullcalendar/core/preact'
import { Resource, ResourceLabelContainer } from '@fullcalendar/resource/internal'

export interface ResourceHeaderCellModel {
  resource: Resource
  date?: DateMarker
}

export interface ResourceHeaderCellProps {
  cell: ResourceHeaderCellModel
  colSpan: number
  colWidth: number | undefined // TODO: use this
  isSticky?: boolean
}

export class ResourceHeaderCell extends BaseComponent<ResourceHeaderCellProps> {
  render() {
    let { props } = this
    let { cell } = props

    return (
      <ResourceLabelContainer
        elTag="th"
        elClasses={['fc-col-header-cell', 'fc-resource']}
        elAttrs={{
          role: 'columnheader',
          colSpan: props.colSpan,
        }}
        resource={cell.resource}
        date={cell.date}
      >
        {(InnerContent) => (
          <div className="fc-scrollgrid-sync-inner">
            <InnerContent
              elTag="span"
              elClasses={[
                'fc-col-header-cell-cushion',
                props.isSticky && 'fc-sticky',
              ]}
            />
          </div>
        )}
      </ResourceLabelContainer>
    )
  }
}
