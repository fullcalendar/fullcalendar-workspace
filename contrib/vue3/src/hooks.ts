import { shallowRef, readonly, Ref, DeepReadonly } from 'vue'
import { CalendarController } from '@fullcalendar/core'

export function useCalendarController(): DeepReadonly<Ref<CalendarController>> {
  function handleDateChange() {
    controllerRef.value = new CalendarController(handleDateChange)
  }
  const controllerRef = shallowRef(new CalendarController(handleDateChange))
  return readonly(controllerRef)
}
