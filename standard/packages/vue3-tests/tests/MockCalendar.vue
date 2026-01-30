<template>
  <div class="mock-calendar">
    <FullCalendar :options="calendarOptions" />
  </div>
</template>

<script setup>
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/vue3/daygrid'

const calendarOptions = {
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
}
</script>
