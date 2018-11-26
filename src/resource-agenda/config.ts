import { defineView } from 'fullcalendar'
import ResourceAgendaView from './ResourceAgendaView'

defineView('resourceAgendaWeek', {
  class: ResourceAgendaView,
  duration: { weeks: 1 },

  // ahhh
  allDaySlot: true,
  slotDuration: '00:30:00',
  slotEventOverlap: true // a bad name. confused with overlap/constraint system
})
