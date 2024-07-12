import { AllDayContentArg } from '@fullcalendar/core'
import { ComponentChild, Ref, createElement } from '@fullcalendar/core/preact'
import { BaseComponent, ContentContainer } from "@fullcalendar/core/internal"

export interface TimeGridAllDayLabelCellProps {
  elRef?: Ref<HTMLElement>
  width?: number // TODO: use!
  height?: number // TODO: use!
}

export class TimeGridAllDayLabelCell extends BaseComponent<TimeGridAllDayLabelCellProps> {
  render() {
    let { options, viewApi } = this.context
    let renderProps: AllDayContentArg = {
      text: options.allDayText,
      view: viewApi,
    }

    return (
      <ContentContainer
        elTag="td"
        elClasses={[
          'fc-timegrid-axis',
          'fc-scrollgrid-shrink',
        ]}
        elAttrs={{
          'aria-hidden': true,
        }}
        elRef={this.props.elRef}
        renderProps={renderProps}
        generatorName="allDayContent"
        customGenerator={options.allDayContent}
        defaultGenerator={renderAllDayInner}
        classNameGenerator={options.allDayClassNames}
        didMount={options.allDayDidMount}
        willUnmount={options.allDayWillUnmount}
      >
        {(InnerContent) => (
          <div
            className={[
              'fc-timegrid-axis-frame',
              'fc-scrollgrid-shrink-frame',
              // rowHeight == null ? ' fc-timegrid-axis-frame-liquid' : '',
            ].join(' ')}
            style={{ /*height: rowHeight*/ }}
          >
            <InnerContent
              elTag="span"
              elClasses={[
                'fc-timegrid-axis-cushion',
                'fc-scrollgrid-shrink-cushion',
                'fc-scrollgrid-sync-inner',
              ]}
            />
          </div>
        )}
      </ContentContainer>
    )
  }
}

function renderAllDayInner(renderProps: AllDayContentArg): ComponentChild {
  return renderProps.text
}
