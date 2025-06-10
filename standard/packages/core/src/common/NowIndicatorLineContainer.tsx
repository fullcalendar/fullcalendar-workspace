import { MountData } from './render-hook.js'
import { DateMarker } from '../datelib/marker.js'
import { ViewContext, ViewContextType } from '../ViewContext.js'
import { createElement } from '../preact.js'
import { ViewApi } from '../api/ViewApi.js'
import { ElProps } from '../content-inject/ContentInjector.js'
import { InnerContainerFunc, ContentContainer } from '../content-inject/ContentContainer.js'

export interface NowIndicatorLineContainerProps extends Partial<ElProps> {
  date: DateMarker
  children?: InnerContainerFunc<NowIndicatorLineContentArg>
}

export interface NowIndicatorLineContentArg {
  date: Date
  view: ViewApi
}

export type NowIndicatorLineMountArg = MountData<NowIndicatorLineContentArg>

export const NowIndicatorLineContainer = (props: NowIndicatorLineContainerProps) => (
  <ViewContextType.Consumer>
    {(context: ViewContext) => {
      let { options } = context
      let renderProps: NowIndicatorLineContentArg = {
        date: context.dateEnv.toDate(props.date),
        view: context.viewApi,
      }

      return (
        <ContentContainer
          {...props /* includes children */}
          tag={props.tag || 'div'}
          renderProps={renderProps}
          generatorName="nowIndicatorLineContent"
          customGenerator={options.nowIndicatorLineContent}
          classNameGenerator={options.nowIndicatorLineClassNames}
          didMount={options.nowIndicatorLineDidMount}
          willUnmount={options.nowIndicatorLineWillUnmount}
        />
      )
    }}
  </ViewContextType.Consumer>
)
