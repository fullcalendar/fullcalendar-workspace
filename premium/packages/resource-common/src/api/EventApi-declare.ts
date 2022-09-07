import { ResourceApi } from './ResourceApi'

declare module '@fullcalendar/core' {

  interface EventApi {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }

}
