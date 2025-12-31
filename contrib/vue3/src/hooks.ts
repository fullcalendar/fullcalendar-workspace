import { ref, readonly, Ref, DeepReadonly } from 'vue'
import { CalendarController } from '@fullcalendar/core'

export function useCalendarController(): DeepReadonly<Ref<CalendarController>> {
  function handleDateChange() {
    controllerRef.value = new CalendarController(handleDateChange)
  }
  const controllerRef = ref(new CalendarController(handleDateChange))
  return readonly(controllerRef)
}
