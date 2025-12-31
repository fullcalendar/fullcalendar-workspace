<script setup lang="ts">
  import Button from 'primevue/button'
  import SelectButton from 'primevue/selectbutton'

  import FullCalendar, { useCalendarController } from '@fullcalendar/vue3'
  import themePlugin from '@fullcalendar/theme-forma'
  import dayGridPlugin from '@fullcalendar/daygrid'
  import timeGridPlugin from '@fullcalendar/timegrid'
  import multiMonthPlugin from '@fullcalendar/multimonth'
  import interactionPlugin from '@fullcalendar/interaction'

  import '@fullcalendar/core/skeleton.css'
  import '@fullcalendar/theme-forma/theme.css'
  import '@fullcalendar/theme-forma/palettes/green.css'

  const controller = useCalendarController()
  const buttons = controller.getButtonState()

  const availableViews = ['dayGridMonth', 'timeGridWeek', 'multiMonthYear']

  function handleAddEvent() {
    alert('add event...')
  }
</script>

<template>
  <div data-color-scheme="dark" class="calendar-container">
    <div class="calendar-toolbar">
      <div class="calendar-toolbar-section">
        <Button @click="handleAddEvent()">Add Event</Button>
        <Button
          @click="controller.today()"
          :aria-label="buttons.today.hint"
          :disabled="buttons.today.isDisabled"
          severity="secondary"
        >{{buttons.today.text}}</Button>
        <div class="calendar-toolbar-button-group">
          <Button
            @click="controller.prev()"
            :aria-label="buttons.prev.hint"
            :disabled="buttons.prev.isDisabled"
            icon="pi pi-chevron-left"
            variant="text"
            rounded
          />
          <Button
            @click="controller.next()"
            :aria-label="buttons.next.hint"
            :disabled="buttons.next.isDisabled"
            icon="pi pi-chevron-right"
            variant="text"
            rounded
          />
        </div>
        <span class="calendar-toolbar-title">
          {{controller.view?.title}}
        </span>
      </div>
      <div class="calendar-toolbar-section">
        <SelectButton
          size="large"
          optionLabel="label"
          optionValue="value"
          :options="availableViews.map((availableView) => ({
            label: buttons[availableView]?.text,
            value: availableView,
          }))"
          :modelValue="controller.view?.type"
          @update:modelValue="controller.changeView($event)"
        />
      </div>
    </div>
    <FullCalendar
      :options="{
        controller: controller,
        initialView: availableViews[0],
        plugins: [
          themePlugin,
          dayGridPlugin,
          timeGridPlugin,
          multiMonthPlugin,
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
    align-items: center;
    justify-content: space-between;
    gap: 1em;
  }

  .calendar-toolbar-section {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  .calendar-toolbar-button-group {
    display: flex;
    align-items: center;
  }

  .calendar-toolbar-title {
    font-size: 20px;
  }
</style>
