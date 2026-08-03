import { DateFormatter, DateMarker, DateProfile, DateRange, formatDayString, getDateMeta, ViewContext } from '@fullcalendar/preact/protected-api'
import { buildDateDataConfigs, buildDateRenderConfig, buildDateRowConfig, CellDataConfig, CellRenderConfig, RowConfig } from '@fullcalendar/preact/protected-api'
import { ResourceApi } from '../resource/api/ResourceApi'
import { AbstractResourceDayTableModel } from '../resource/common/AbstractResourceDayTableModel'
import { Resource } from '../resource/structs/resource'
import { ResourceDayHeaderInfo } from './structs'

// TODO: figure out plugin-types
// import { DayHeaderInfo } from '../../../../standard/packages/daygrid/src/structs'
type DayHeaderInfo = any

export function buildResourceRowConfigs(
  resourceDayTableModel: AbstractResourceDayTableModel,
  datesRepDistinctDays: boolean,
  dateProfile: DateProfile,
  todayRange: DateRange,
  dayHeaderFormat: DateFormatter, // TODO: rename to dateHeaderFormat?
  context: ViewContext,
): RowConfig<any, DayHeaderInfo | ResourceDayHeaderInfo>[] {
  let { cols, groups, resources } = resourceDayTableModel

  if (!resources.length) {
    return [
      buildDateRowConfig(
        cols.map((col) => col.date),
        datesRepDistinctDays,
        dateProfile,
        todayRange,
        dayHeaderFormat,
        context,
      )
    ]
  }

  if (resourceDayTableModel.dayTableModel.colCount === 1) {
    return [
      buildResourceRowConfig(
        cols.map((col) => col.resource as Resource),
        cols[0]?.date,
        dateProfile,
        todayRange,
        context,
      )
    ]
  }

  if (resourceDayTableModel.datesAboveResources) {
    const resourceDataConfigsPerDate = groups.map((group) => {
      return buildResourceDataConfigs(
        group.cols.map((col) => col.resource),
        group.date,
        dateProfile,
        todayRange,
        context,
        /* colSpan = */ 1,
        /* isMajorMod = */ group.cols.length,
      )
    })
    const dateRowConfig = buildDateRowConfig(
      groups.map((group) => group.date),
      datesRepDistinctDays,
      dateProfile,
      todayRange,
      dayHeaderFormat,
      context,
      /* colSpan = */ 1,
      /* isMajorMod = */ 1, // each cell is major, mod%1 always yields 0 (yes)
    )

    for (let i = 0; i < groups.length; i += 1) {
      dateRowConfig.dataConfigs[i].colSpan = groups[i].cols.length
    }

    return [
      // date row
      dateRowConfig,
      // resource row
      {
        isDateRow: false,
        renderConfig: buildResourceRenderConfig(context),
        dataConfigs: [].concat(...resourceDataConfigsPerDate), // flatten
      }
    ]
  } else { // resources above dates
    const dateDataConfigsPerResource = groups.map((group) => {
      const resource = group.resource

      if (!resource) {
        return buildDateDataConfigs(
          group.cols.map((col) => col.date),
          datesRepDistinctDays,
          dateProfile,
          todayRange,
          dayHeaderFormat,
          context,
          /* colSpan = */ 1,
          /* keyPrefix = */ undefined,
          /* extraRenderProps = */ undefined,
          /* extraAttrs = */ undefined,
          /* className = */ undefined,
          /* isMajorMod = */ group.cols.length,
        )
      }

      const resourceApi = new ResourceApi(context, resource)
      const resourceApiId = resourceApi.id

      return buildDateDataConfigs(
        group.cols.map((col) => col.date),
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
        /* className = */ undefined, // TODO: remove
        /* isMajorMod = */ group.cols.length,
      )
    })
    const resourceDataConfigs = groups.map((group) => {
      return buildResourceDataConfigs(
        [group.resource || null],
        group.date,
        dateProfile,
        todayRange,
        context,
        /* colSpan = */ group.cols.length,
        /* isMajorMod = */ 1,
      )[0]
    })

    return [
      // resource row
      {
        isDateRow: false,
        renderConfig: buildResourceRenderConfig(context),
        dataConfigs: resourceDataConfigs,
      },
      // date row
      {
        isDateRow: true,
        renderConfig: buildDateRenderConfig(dayHeaderFormat, datesRepDistinctDays, context),
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
): RowConfig<ResourceDayHeaderInfo> {
  return {
    isDateRow: false,
    renderConfig: buildResourceRenderConfig(context),
    dataConfigs: buildResourceDataConfigs(
      resources,
      dateMarker,
      dateProfile,
      todayRange,
      context,
      colSpan,
      isMajorMod
    ),
  }
}

function buildResourceRenderConfig(context: ViewContext): CellRenderConfig<ResourceDayHeaderInfo> {
  const { options } = context

  return {
    generatorName: 'resourceDayHeaderContent',
    customGenerator: options.resourceDayHeaderContent,
    innerClassNameGenerator: options.resourceDayHeaderInnerClass,
    classNameGenerator: options.resourceDayHeaderClass,
    didMount: options.resourceDayHeaderDidMount,
    willUnmount: options.resourceDayHeaderWillUnmount,
    align: options.resourceDayHeaderAlign,
    sticky: options._resourceDayHeaderSticky,
  }
}

function buildResourceDataConfigs(
  resources: (Resource | null)[],
  dateMarker: DateMarker | undefined,
  dateProfile: DateProfile | undefined,
  todayRange: DateRange | undefined,
  context: ViewContext,
  colSpan = 1,
  isMajorMod?: number,
): CellDataConfig<any>[] {
  const dateMeta = dateMarker
    ? getDateMeta(dateMarker, context.dateEnv, dateProfile, todayRange)
    : {}

  return resources.map((resource, i) => {
    if (!resource) {
      return {
        key: dateMarker ? dateMarker.toISOString() : '',
        dateMarker,
        renderProps: {
          isDisabled: false,
          ...dateMeta,
          isMajor: isMajorMod != null && !(i % isMajorMod),
          isNarrow: false,
          level: 0,
          text: '',
          view: context.viewApi,
        },
        attrs: {
          'data-date': dateMarker ? formatDayString(dateMarker) : undefined,
        },
        colSpan,
        className: '',
      }
    }

    const resourceApi = new ResourceApi(context, resource)
    const resourceApiId = resourceApi.id

    return {
      key: (dateMarker ? dateMarker.toUTCString() + ':' : '') + resource.id,
      dateMarker,
      renderProps: {
        isDisabled: false,
        ...dateMeta,
        resource: resourceApi,
        isMajor: isMajorMod != null && !(i % isMajorMod),
        isNarrow: false, // HACK. gets overridden later
        level: 0, // HACK. gets overridden later
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
