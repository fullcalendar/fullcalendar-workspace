import { BaseComponent, DateMarker } from '@fullcalendar/core'
import { createElement } from '@fullcalendar/core/preact'
import { Resource } from '../structs/resource.js'
import { ResourceLabelContainer } from './ResourceLabelContainer.js'

export interface ResourceCellProps {
  resource: Resource
  colSpan: number
  date?: DateMarker
  isSticky?: boolean
}

export class ResourceCell extends BaseComponent<ResourceCellProps> {
  render() {
    let { props } = this

    return (
      <ResourceLabelContainer
        elTag="th"
        elClasses={['fc-col-header-cell', 'fc-resource']}
        elAttrs={{
          role: 'columnheader',
          colSpan: props.colSpan,
        }}
        resource={props.resource}
        date={props.date}
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
