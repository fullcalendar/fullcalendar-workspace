import { MountData } from './render-hook.js'
import { DateMarker } from '../datelib/marker.js'
import { ViewContext, ViewContextType } from '../ViewContext.js'
import { createElement } from '../preact.js'
import { ViewApi } from '../api/ViewApi.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { InnerContainerFunc, ContentContainer } from '../content-inject/ContentContainer.js'

export interface NowIndicatorLabelContainerProps extends Partial<ElProps> {
  date: DateMarker
  children?: InnerContainerFunc<NowIndicatorLabelData>
}

export interface NowIndicatorLabelData {
  date: Date
  view: ViewApi
}

export type NowIndicatorLabelMountData = MountData<NowIndicatorLabelData>

export const NowIndicatorLabelContainer = (props: NowIndicatorLabelContainerProps) => (
  <ViewContextType.Consumer>
    {(context: ViewContext) => {
      let { options } = context
      let renderProps: NowIndicatorLabelData = {
        date: context.dateEnv.toDate(props.date),
        view: context.viewApi,
      }

      return (
        <ContentContainer
          {...props /* includes children */}
          tag={props.tag || 'div'}
          renderProps={renderProps}
          generatorName="nowIndicatorLabelContent"
          customGenerator={options.nowIndicatorLabelContent}
          classNameGenerator={options.nowIndicatorLabelClassNames}
          didMount={options.nowIndicatorLabelDidMount}
          willUnmount={options.nowIndicatorLabelWillUnmount}
        />
      )
    }}
  </ViewContextType.Consumer>
)
