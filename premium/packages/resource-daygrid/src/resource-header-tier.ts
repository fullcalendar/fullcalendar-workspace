import { DateFormatter, DateMarker, DateProfile, DateRange, formatDayString, ViewContext } from '@fullcalendar/core/internal'
import { CellDataConfig, CellRenderConfig, RowConfig, buildDateDataConfigs, buildDateRenderConfig, buildDateRowConfig } from '@fullcalendar/daygrid/internal'
import { ResourceApi, ResourceLabelContentArg } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'

export function buildResourceRowConfigs(
  resources: Resource[],
  datesAboveResources: boolean,
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
): RowConfig<{ text: string, isDisabled: boolean }>[] {
  if (!resources.length) {
    return [
      buildDateRowConfig(
        dates,
        datesRepDistinctDays,
        dateProfile,
        todayRange,
        dayHeaderFormat,
        context,
      )
    ]
  }

  if (dates.length === 1) {
    return [
      buildResourceRowConfig(resources, undefined, context)
    ]
  }

  if (datesAboveResources) {
    const resourceDataConfigsPerDate = dates.map((date) => {
      return buildResourceDataConfigs(resources, date, context)
    })

    return [
      // date row
      buildDateRowConfig(
        dates,
        datesRepDistinctDays,
        dateProfile,
        todayRange,
        dayHeaderFormat,
        context,
        /* colSpan = */ resources.length,
      ),
      // resource row
      {
        renderConfig: buildResourceRenderConfig(context),
        dataConfigs: [].concat(...resourceDataConfigsPerDate), // flatten
      }
    ]
  } else {
    const dateDataConfigsPerResource = resources.map((resource) => {
      const resourceApi = new ResourceApi(context, resource)
      const resourceApiId = resourceApi.id

      return buildDateDataConfigs(
        dates,
        datesRepDistinctDays,
        dateProfile,
        todayRange,
        dayHeaderFormat,
        context,
        1, // rowSpan
        resourceApiId + ':',
        { // extraRenderProps
          resource: resourceApi,
        },
        { // extraAttrs
          'data-resource-id': resourceApiId,
        }
      )
    })

    return [
      // resource row
      buildResourceRowConfig(resources, undefined, context, /* colSpan = */ dates.length),
      // date row
      {
        renderConfig: buildDateRenderConfig(context),
        dataConfigs: [].concat(...dateDataConfigsPerResource), // flatten
      }
    ]
  }
}

/*
Single row, just resources (might be under dates, might not)
*/
function buildResourceRowConfig(
  resources: Resource[],
  date: DateMarker | undefined,
  context: ViewContext,
  colSpan?: number,
): RowConfig<ResourceLabelContentArg> {
  return {
    renderConfig: buildResourceRenderConfig(context),
    dataConfigs: buildResourceDataConfigs(resources, date, context, colSpan),
  }
}

function buildResourceRenderConfig(context: ViewContext): CellRenderConfig<ResourceLabelContentArg> {
  const { options } = context

  return {
    generatorName: 'resourceLabelContent',
    customGenerator: options.resourceLabelContent,
    classNameGenerator: options.resourceLabelClassNames,
    didMount: options.resourceLabelDidMount,
    willUnmount: options.resourceLabelWillUnmount,
  }
}

function buildResourceDataConfigs(
  resources: Resource[],
  date: DateMarker | undefined,
  context: ViewContext,
  colSpan = 1,
): CellDataConfig<ResourceLabelContentArg>[] {
  return resources.map((resource) => {
    const resourceApi = new ResourceApi(context, resource)
    const resourceApiId = resourceApi.id

    return {
      key: (date ? date.toUTCString() + ':' : '') + resource.id,
      renderProps: {
        resource: resourceApi,
        text: resource.title || resourceApiId || '',
        isDisabled: false,
        date: date ? context.dateEnv.toDate(date) : null,
        view: context.viewApi,
      },
      attrs: {
        'data-resource-id': resourceApiId,
        'data-date': date ? formatDayString(date) : undefined,
      },
      colSpan,
    }
  })
}
