import { DateFormatter, DateMarker, DateProfile, DateRange, formatDayString, getDateMeta, ViewContext } from '@fullcalendar/core/internal'
import { buildDateDataConfigs, buildDateRenderConfig, buildDateRowConfig, CellDataConfig, CellRenderConfig, RowConfig } from '@fullcalendar/daygrid/internal'
import { ResourceApi, ResourceDayHeaderContentArg } from '@fullcalendar/resource'
import { Resource } from '@fullcalendar/resource/internal'

// TODO: figure out plugin-types
// import { DayHeaderContentArg } from '../../../../standard/packages/daygrid/src/structs.js'
type DayHeaderContentArg = any

export function buildResourceRowConfigs(
  resources: Resource[],
  datesAboveResources: boolean,
  dates: DateMarker[],
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
): RowConfig<DayHeaderContentArg | ResourceDayHeaderContentArg>[] {
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
      buildResourceRowConfig(resources, dates[0], dateProfile, todayRange, context)
    ]
  }

  if (datesAboveResources) {
    const resourceDataConfigsPerDate = dates.map((date) => {
      return buildResourceDataConfigs(resources, date, dateProfile, todayRange, context, 1, resources.length)
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
        1, // each cell is major, mod%1 always yields 0 (yes)
      ),
      // resource row
      {
        isDateRow: false,
        renderConfig: buildResourceRenderConfig(context),
        dataConfigs: [].concat(...resourceDataConfigsPerDate), // flatten
      }
    ]
  } else { // resources above dates
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
        },
        undefined, // className. TODO: remove
        resources.length,
      )
    })

    return [
      // resource row
      buildResourceRowConfig(
        resources,
        undefined,
        undefined,
        undefined,
        context,
        /* colSpan = */ dates.length,
        1, // each cell is major, mod%1 always yields 0 (yes)
      ),
      // date row
      {
        isDateRow: true,
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
  dateMarker: DateMarker | undefined,
  dateProfile: DateProfile,
  todayRange: DateRange,
  context: ViewContext,
  colSpan?: number,
  isMajorMod?: number,
): RowConfig<ResourceDayHeaderContentArg> {
  return {
    isDateRow: false,
    renderConfig: buildResourceRenderConfig(context),
    dataConfigs: buildResourceDataConfigs(resources, dateMarker, dateProfile, todayRange, context, colSpan, isMajorMod),
  }
}

function buildResourceRenderConfig(context: ViewContext): CellRenderConfig<ResourceDayHeaderContentArg> {
  const { options } = context

  return {
    generatorName: 'resourceDayHeaderContent',
    customGenerator: options.resourceDayHeaderContent,
    innerClassNameGenerator: options.resourceDayHeaderInnerClassNames,
    classNameGenerator: options.resourceDayHeaderClassNames,
    didMount: options.resourceDayHeaderDidMount,
    willUnmount: options.resourceDayHeaderWillUnmount,
  }
}

function buildResourceDataConfigs(
  resources: Resource[],
  dateMarker: DateMarker | undefined,
  dateProfile: DateProfile | undefined,
  todayRange: DateRange | undefined,
  context: ViewContext,
  colSpan = 1,
  isMajorMod?: number,
): CellDataConfig<ResourceDayHeaderContentArg>[] {
  const dateMeta = dateMarker
    ? getDateMeta(dateMarker, context.dateEnv, dateProfile, todayRange)
    : {}

  return resources.map((resource, i) => {
    const resourceApi = new ResourceApi(context, resource)
    const resourceApiId = resourceApi.id

    return {
      key: (dateMarker ? dateMarker.toUTCString() + ':' : '') + resource.id,
      dateMarker,
      renderProps: {
        ...dateMeta,
        resource: resourceApi,
        isMajor: isMajorMod != null && !(i % isMajorMod),
        text: resource.title || resourceApiId || '',
        view: context.viewApi,
      },
      attrs: {
        'data-resource-id': resourceApiId,
        'data-date': dateMarker ? formatDayString(dateMarker) : undefined,
      },
      colSpan,
      className: '', // TODO: remove this prop
    }
  })
}
