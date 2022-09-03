import { ResourceApi } from './ResourceApi'

declare module '@fullcalendar/common' {

  interface EventApi {
    getResources: () => ResourceApi[]
    setResources: (resources: (string | ResourceApi)[]) => void
  }

}
