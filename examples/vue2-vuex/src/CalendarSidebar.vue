<template>
  <div class="calendar-sidebar">
      <section class="instructions">
          <h2>Instructions</h2>

          <ul>
              <li>Select dates and you will be prompted to create a new event</li>
              <li>Drag, drop, and resize events</li>
              <li>Click an event to delete it</li>
          </ul>
      </section>

      <section class="quick-toggles">
          <label>
              <input type="checkbox" v-model="weekendsVisibleCheckbox">
              Toggle weekends
          </label>
      </section>

      <section class="events-list">
          <h2>All Events ({{ events.length }})</h2>

          <ul>
              <li v-for="event in events" :key="event.id">
                  <b>{{ getFormattedDate(event) }}</b>
                  <i>{{ event.title }}</i>
              </li>
          </ul>
      </section>
  </div>
</template>

<script>
import { format } from 'date-fns'

export default {
  props: {
    events: {
      type: Array,
      required: true
    },
    weekendsVisible: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    weekendsVisibleCheckbox: {
      get () {
        return this.weekendsVisible
      },
      set (value) {
        return this.$emit('set-weekends-visible', value)
      }
    }
  },
  methods: {
    isAllDay (event) {
      return (event.allDay !== undefined) ? event.allDay : false
    },
    getFormattedDate (event) {
      const date = event.date || event.start

      if (date === undefined) {
        return ''
      }

      return format(date, 'MMM d, yyyy')
    }
  }
}
</script>

<style scoped>
    .calendar-sidebar {
        width: 300px;
        line-height: 1.5;
        background: #eaf9ff;
        border-right: 1px solid #d3e2e8;
    }

    ul {
        margin: 0;
        padding: 0 0 0 1.5em;
    }

    ul li {
        margin: 1.5em 0;
        padding: 0;
    }

    section {
        padding: 2em;
    }

    h2 {
        margin: 0;
        font-size: 16px;
    }
</style>
