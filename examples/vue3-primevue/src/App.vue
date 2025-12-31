<script setup lang="ts">
  import FullCalendar, { useCalendarController } from '@fullcalendar/vue3'
  import themePlugin from '@fullcalendar/theme-forma'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import interactionPlugin from '@fullcalendar/interaction'

  import '@fullcalendar/core/skeleton.css'
  import '@fullcalendar/theme-forma/theme.css'
  import '@fullcalendar/theme-forma/palettes/green.css'

  const calendarController = useCalendarController()
</script>

<template>
  <div data-color-scheme="dark" class="calendar-container">
    <div class="calendar-toolbar">
      <Button>Prev</Button>
      <Button>Next</Button>
    </div>
    <FullCalendar
      :options="{
        controller: calendarController.value,
        plugins: [
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          interactionPlugin,
        ]
      }"
    />
  </div>
</template>

<style scoped>
  .calendar-container {
    max-width: 1100px;
    margin: 3em auto;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }

  .calendar-toolbar {
    display: flex;
    gap: 1em;
  }
</style>
