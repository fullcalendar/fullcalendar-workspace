import { DateClickApi, DateSelectionApi, DateSpan } from 'fullcalendar'

declare module 'fullcalendar/Calendar' {

  interface DateClickApi {
    resourceId?: any
  }

  interface DateSelectionApi {
    resourceId?: any
  }

}

export function transformDateClickApi(dateClick: DateClickApi, dateSpan: DateSpan) {
  if (dateSpan.resourceId) {
    dateClick.resourceId = dateSpan.resourceId
  }
}

export function transformDateSelectionApi(dateClick: DateSelectionApi, dateSpan: DateSpan) {
  if (dateSpan.resourceId) {
    dateClick.resourceId = dateSpan.resourceId
  }
}
