import { ResourceApi } from './ResourceApi.js'

declare module '@fullcalendar/core' {

  interface EventApi {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }

}
