import { MountData } from './render-hook.js'
import { DateMarker } from '../datelib/marker.js'
import { ViewContext, ViewContextType } from '../ViewContext.js'
import { createElement } from '../preact.js'
import { ViewApi } from '../api/ViewApi.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { InnerContainerFunc, ContentContainer } from '../content-inject/ContentContainer.js'

export interface NowIndicatorHeaderContainerProps extends Partial<ElProps> {
  date: DateMarker
  children?: InnerContainerFunc<NowIndicatorHeaderData>
}

export interface NowIndicatorHeaderData {
  date: Date
  view: ViewApi
}

export type NowIndicatorHeaderMountData = MountData<NowIndicatorHeaderData>

export const NowIndicatorHeaderContainer = (props: NowIndicatorHeaderContainerProps) => (
  <ViewContextType.Consumer>
    {(context: ViewContext) => {
      let { options } = context
      let renderProps: NowIndicatorHeaderData = {
        date: context.dateEnv.toDate(props.date),
        view: context.viewApi,
      }

      return (
        <ContentContainer
          {...props /* includes children */}
          tag={props.tag || 'div'}
          renderProps={renderProps}
          generatorName="nowIndicatorHeaderContent"
          customGenerator={options.nowIndicatorHeaderContent}
          classNameGenerator={options.nowIndicatorHeaderClass}
          didMount={options.nowIndicatorHeaderDidMount}
          willUnmount={options.nowIndicatorHeaderWillUnmount}
        />
      )
    }}
  </ViewContextType.Consumer>
)
