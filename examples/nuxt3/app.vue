<template>
  <div class='app'>
    <FullCalendar :options='calendarOptions' />
  </div>
</template>

<script lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'

export default {
  components: {
    FullCalendar
  },
  data() {
    return {
      calendarOptions: {
        plugins: [interactionPlugin, timeGridPlugin],
        initialView: 'timeGridWeek',
        nowIndicator: true,
        editable: true,
        initialEvents: [
          { title: 'nice event', start: new Date() }
        ]
      }
    }
  }
}
</script>

<style scoped>
  .app {
    font-family: Arial, Helvetica Neue, Helvetica, sans-serif;
    font-size: 14px;
  }
</style>
