import { ref } from 'vue'
import { CalendarController } from '@fullcalendar/core'

export function useCalendarController(): CalendarController {
  const revisionRef = ref(1)
  const calendarController = new CalendarController(() => {
    revisionRef.value++
  })

  return new Proxy(calendarController as any, {
    get(target, prop, receiver) {
      // Any reactive consumer that touches the controller (or calls its methods from inside an effect)
      // will now depend on tick.
      void revisionRef.value

      const value = Reflect.get(target, prop, receiver)

      // Bind methods so `this` stays correct
      if (typeof value === "function") return value.bind(target)
      return value
    },
  })
}
