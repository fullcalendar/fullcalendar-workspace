import { mount as _mount } from '@vue/test-utils'
import FullCalendar from '../dist/index.js'
import classicThemePlugin from '@fullcalendar/classic-theme'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import Vue from 'vue'


const INITIAL_DATE = '2019-05-15'
const DEFAULT_OPTIONS = {
  initialDate: INITIAL_DATE,
  initialView: 'dayGridMonth',
  timeZone: 'UTC',
  plugins: [classicThemePlugin, dayGridPlugin, interactionPlugin],
  editable: true,
}

let currentWrapper

function mount(component, options = {}) {
  if (options.attachTo === undefined) {
    let rootEl = document.body.appendChild(document.createElement('div')) // will be *replaced*
    options = {...options, attachTo: rootEl}
  }
  currentWrapper = _mount(component, options)
  return currentWrapper
}

afterEach(function() {
  if (currentWrapper) {
    currentWrapper.destroy()
    currentWrapper = null
  }
})


it('renders', async () => {
  let wrapper = mount(FullCalendar, { propsData: { options: DEFAULT_OPTIONS } })
  expect(isSkeletonRendered(wrapper)).toBe(true)
})

it('unmounts and calls destroy', async () => {
  let unmounted = false
  let options = {
    ...DEFAULT_OPTIONS,
    viewWillUnmount() {
      unmounted = true
    }
  }

  let wrapper = mount(FullCalendar, { propsData: { options } })
  wrapper.destroy()
  expect(unmounted).toBeTruthy()
})

it('handles a single prop change', (done) => {
  let options = {
    ...DEFAULT_OPTIONS,
    weekends: true
  }

  let wrapper = mount(FullCalendar, {
    propsData: { options }
  })
  expect(isWeekendsRendered(wrapper)).toBe(true)

  // it's easy for the component to detect this change because the whole options object changes.
  // a more difficult scenario is when a component updates its own nested prop.
  // there's a test for that below (COMPONENT_FOR_OPTION_MANIP).
  wrapper.setProps({
    options: {
      ...options,
      weekends: false // good idea to test a falsy prop
    }
  })

  Vue.nextTick().then(() => {
    expect(isWeekendsRendered(wrapper)).toBe(false)
    done()
  })
})

it('renders events with Date objects', async () => { // necessary to test copy util
  let wrapper = mount(FullCalendar, {
    propsData: {
      options: {
        ...DEFAULT_OPTIONS,
        events: [
          { title: 'event', start: new Date(DEFAULT_OPTIONS.initialDate) },
          { title: 'event', start: new Date(DEFAULT_OPTIONS.initialDate) }
        ]
      }
    }
  })

  expect(getRenderedEventCount(wrapper)).toBe(2)
})

// https://github.com/fullcalendar/fullcalendar/issues/7191
// (could not recreate. this was likely fixed prior)
it('renders events and emits current element in eventDidMount', (done) => {
  let eventDidMountCnt = 0
  let eventsSetCnt = 0
  let eventEl

  const App = {
    data() {
      return {
        calendarOptions: {
          ...DEFAULT_OPTIONS,
          editable: true,
          selectable: true,
          selectMirror: true,
          dayMaxEvents: true,
          weekends: true,
          initialEvents: [
            { title: 'event', start: new Date(DEFAULT_OPTIONS.initialDate), allDay: false },
          ],
          eventDidMount: this.handleEventDidMount,
          eventsSet: this.handleEvents
        },
        currentEvents: [],
      }
    },
    methods: {
      handleEventDidMount(arg) {
        eventEl = arg.el
        eventDidMountCnt++
      },
      handleEvents(events) {
        this.currentEvents = events
        eventsSetCnt++
      }
    },
    render(createElement) {
      return createElement(FullCalendar, {
        props: {
          options: this.calendarOptions
        }
      })
    }
  }

  mount(App)

  setTimeout(() => {
    expect(eventDidMountCnt).toBe(1)
    expect(eventsSetCnt).toBe(1)
    expect(eventEl.offsetWidth).toBeGreaterThan(0) // in the DOM?
    done()
  }, 100)
})

it('handles multiple prop changes, include event reset', (done) => {
  let viewMountCnt = 0
  let eventRenderCnt = 0
  let options = {
    ...DEFAULT_OPTIONS,
    events: buildEvents(1),
    viewDidMount() {
      viewMountCnt++
    },
    eventContent() {
      eventRenderCnt++
    }
  }

  let wrapper = mount(FullCalendar, {
    propsData: { options }
  })

  expect(getRenderedEventCount(wrapper)).toBe(1)
  expect(isWeekendsRendered(wrapper)).toBe(true)
  expect(viewMountCnt).toBe(1)
  expect(eventRenderCnt).toBe(1)

  viewMountCnt = 0
  eventRenderCnt = 0

  wrapper.setProps({
    options: {
      ...options,
      direction: 'rtl',
      weekends: false,
      events: buildEvents(2)
    }
  })

  Vue.nextTick().then(() => {
    expect(getRenderedEventCount(wrapper)).toBe(2)
    expect(isWeekendsRendered(wrapper)).toBe(false)
    expect(viewMountCnt).toBe(0)
    expect(eventRenderCnt).toBe(2) // TODO: get this down to 1 (only 1 new event rendered)
    done()
  })
})

it('should expose an API', async () => {
  let wrapper = mount(FullCalendar, { propsData: { options: DEFAULT_OPTIONS } })
  let calendarApi = wrapper.vm.getApi()
  expect(calendarApi).toBeTruthy()

  let newDate = new Date(Date.UTC(2000, 0, 1))
  calendarApi.gotoDate(newDate)
  expect(calendarApi.getDate().valueOf()).toBe(newDate.valueOf())
})


const COMPONENT_FOR_API = {
  components: {
    FullCalendar
  },
  template: `
    <div>
      <FullCalendar :options='calendarOptions' ref='fullCalendar' />
    </div>
  `,
  data() {
    return {
      calendarOptions: DEFAULT_OPTIONS
    }
  },
  methods: {
    gotoDate(newDate) {
      let calendarApi = this.$refs.fullCalendar.getApi()
      calendarApi.gotoDate(newDate)
    },
    getDate() {
      let calendarApi = this.$refs.fullCalendar.getApi()
      return calendarApi.getDate()
    }
  }
}

it('should expose an API in $refs', async () => {
  let wrapper = mount(COMPONENT_FOR_API)
  let newDate = new Date(Date.UTC(2000, 0, 1))

  wrapper.vm.gotoDate(newDate)
  expect(wrapper.vm.getDate().valueOf()).toBe(newDate.valueOf())
})


// toolbar/event non-reactivity

const COMPONENT_FOR_OPTION_MANIP = {
  props: [ 'calendarViewDidMount', 'calendarEventContent' ],
  components: {
    FullCalendar
  },
  template: `
    <div>
      <div>calendarHeight: {{ calendarOptions.height }}</div>
      <FullCalendar :options='calendarOptions' />
    </div>
  `,
  data() {
    return {
      something: 0,
      calendarOptions: {
        ...DEFAULT_OPTIONS,
        viewDidMount: this.calendarViewDidMount, // pass the prop
        eventContent: this.calendarEventContent, // pass the prop
        headerToolbar: buildToolbar(),
        events: buildEvents(1),
        weekends: true // needs to be initially present if we plan on changing it (a Vue concept)
      }
    }
  },
  methods: {
    changeSomething() {
      this.something++
    },
    disableWeekends() {
      this.calendarOptions.weekends = false
    }
  }
}

it('handles an object change when prop is reassigned', (done) => {
  let wrapper = mount(COMPONENT_FOR_OPTION_MANIP)
  expect(isWeekendsRendered(wrapper)).toBe(true)

  wrapper.vm.disableWeekends()

  Vue.nextTick().then(() => {
    expect(isWeekendsRendered(wrapper)).toBe(false)
    done()
  })
})

it('avoids rerendering unchanged toolbar/events', async () => {
  let viewMountCnt = 0
  let eventRenderCnt = 0

  let wrapper = mount(COMPONENT_FOR_OPTION_MANIP, {
    propsData: {
      calendarViewDidMount() {
        viewMountCnt++
      },
      calendarEventContent() {
        eventRenderCnt++
      }
    }
  })

  expect(viewMountCnt).toBe(1)
  expect(eventRenderCnt).toBe(1)

  viewMountCnt = 0
  eventRenderCnt = 0

  wrapper.vm.changeSomething()
  expect(viewMountCnt).toBe(0)
  expect(eventRenderCnt).toBe(0)
})

// event rendering

;['auto', 'background'].forEach((eventDisplay) => {
  it(`during ${eventDisplay} custom event rendering, receives el`, async () => {
    let eventDidMountCalled = false

    mount({
      components: {
        FullCalendar
      },
      template: `
        <FullCalendar :options='calendarOptions'>
          <template #eventContent='arg'>
            <i>{{ arg.event.title }}</i>
          </template>
        </FullCalendar>
      `,
      data() {
        return {
          calendarOptions: {
            ...DEFAULT_OPTIONS,
            events: [
              {
                title: 'Event 1',
                start: INITIAL_DATE,
                display: eventDisplay,
              },
            ],
            eventDidMount: (eventInfo) => {
              expect(eventInfo.el).toBeTruthy()
              eventDidMountCalled = true
            }
          }
        }
      }
    })

    await Vue.nextTick()
    expect(eventDidMountCalled).toBe(true)
  })
})

// event reactivity

const COMPONENT_FOR_EVENT_MANIP = {
  components: {
    FullCalendar
  },
  template: `
    <FullCalendar :options='calendarOptions' />
  `,
  data() {
    return {
      calendarOptions: {
        ...DEFAULT_OPTIONS,
        events: buildEvents(1)
      }
    }
  },
  methods: {
    addEvent() {
      this.calendarOptions.events.push(buildEvent(1))
    },
    updateTitle(title) {
      this.calendarOptions.events[0].title = title
    }
  }
}

it('reacts to event adding', (done) => {
  let wrapper = mount(COMPONENT_FOR_EVENT_MANIP)
  expect(getRenderedEventCount(wrapper)).toBe(1)

  wrapper.vm.addEvent()
  Vue.nextTick().then(() => {
    expect(getRenderedEventCount(wrapper)).toBe(2)
    done()
  })
})

it('reacts to event property changes', (done) => {
  let wrapper = mount(COMPONENT_FOR_EVENT_MANIP)
  expect(getFirstEventTitle(wrapper)).toBe('event0')
  wrapper.vm.updateTitle('another title')
  Vue.nextTick().then(() => {
    expect(getFirstEventTitle(wrapper)).toBe('another title')
    done()
  })
})


// event reactivity with fetch function

const EVENT_FUNC_COMPONENT = {
  components: {
    FullCalendar
  },
  template: `
    <FullCalendar :options='calendarOptions' />
  `,
  data() {
    return {
      calendarOptions: {
        ...DEFAULT_OPTIONS,
        events: this.fetchEvents
      }
    }
  },
  methods: {
    fetchEvents(fetchInfo, successCallback) {
      setTimeout(() => {
        successCallback(buildEvents(2))
      }, 0)
    }
  }
}

it('can receive an async event function', function(done) {
  let wrapper = mount(EVENT_FUNC_COMPONENT)
  setTimeout(() => {
    expect(getRenderedEventCount(wrapper)).toBe(2)
    done()
  }, 100)
})


// event reactivity with computed prop

const EVENT_COMP_PROP_COMPONENT = {
  components: {
    FullCalendar
  },
  template: `
    <FullCalendar :options='calendarOptions' />
  `,
  data() {
    return {
      first: true
    }
  },
  computed: {
    calendarOptions() {
      return {
        ...DEFAULT_OPTIONS,
        events: this.first ? [] : buildEvents(2)
      }
    }
  },
  methods: {
    markNotFirst() {
      this.first = false
    }
  }
}

it('reacts to computed events prop', (done) => {
  let wrapper = mount(EVENT_COMP_PROP_COMPONENT)
  expect(getRenderedEventCount(wrapper)).toBe(0)

  wrapper.vm.markNotFirst()
  Vue.nextTick().then(() => {
    expect(getRenderedEventCount(wrapper)).toBe(2)
    done()
  })
})


// component with vue slots

const COMPONENT_WITH_SLOTS = {
  components: {
    FullCalendar
  },
  template: `
    <FullCalendar ref='fullCalendar' :options='calendarOptions'>
      <template v-slot:eventContent="arg">
        <span>
          <b>{{ arg.timeText }}</b>
          <i>{{ arg.event.title }}</i>
        </span>
      </template>
    </FullCalendar>
  `,
  data() {
    return {
      calendarOptions: {
        ...DEFAULT_OPTIONS,
        events: buildEvents(1, true) // timed=true
      }
    }
  },
  methods: {
    resetEvents() {
      this.calendarOptions.events = buildEvents(1)
    }
  }
}

it('renders and rerenders a custom slot', (done) => {
  let wrapper = mount(COMPONENT_WITH_SLOTS)

  Vue.nextTick().then(() => {
    let eventEl = getRenderedEventEls(wrapper).at(0)
    expect(eventEl.findAll('b').length).toBe(1)

    wrapper.vm.resetEvents()
    Vue.nextTick().then(() => {
      eventEl = getRenderedEventEls(wrapper).at(0)
      expect(eventEl.findAll('b').length).toBe(1)
      done()
    })
  })
})

it('renders a custom slot on next/prev', (done) => {
  let wrapper = mount(COMPONENT_WITH_SLOTS)

  Vue.nextTick().then(() => {
    let eventEl = getRenderedEventEls(wrapper).at(0)
    expect(eventEl.findAll('b').length).toBe(1)

    let calendar = wrapper.vm.$refs.fullCalendar.getApi()
    calendar.next()
    calendar.prev()

    Vue.nextTick().then(() => {
      eventEl = getRenderedEventEls(wrapper).at(0)
      expect(eventEl.findAll('b').length).toBe(1)
      done()
    })
  })
})

it('renders a DnD-able timed event in daygrid', (done) => {
  let wrapper = mount(COMPONENT_WITH_SLOTS)

  Vue.nextTick().then(() => {
    let eventEl = getRenderedEventEls(wrapper).at(0).element
    expect(eventEl).toHaveClass('fc-daygrid-dot-event')
    done()
  })
})


it('calls nested vue lifecycle methods when in custom content', (done) => {
  let mountCalled = false
  let beforeDestroyCalled = false
  let destroyCalled = false
  let wrapper = mount({
    components: {
      FullCalendar,
      EventContent: {
        props: {
          event: { type: Object, required: true }
        },
        template: `
          <div>{{ event.title }}</div>
        `,
        mounted() {
          mountCalled = true
        },
        beforeDestroy() {
          beforeDestroyCalled = true
        },
        destroyed() {
          destroyCalled = true
        },
      }
    },
    template: `
      <FullCalendar :options='calendarOptions'>
        <template v-slot:eventContent="arg">
          <EventContent :event="arg.event" />
        </template>
      </FullCalendar>
    `,
    data() {
      return {
        calendarOptions: {
          ...DEFAULT_OPTIONS,
          events: buildEvents(1)
        }
      }
    }
  })
  Vue.nextTick().then(() => {
    expect(mountCalled).toBe(true)
    wrapper.destroy()

    Vue.nextTick().then(() => {
      expect(beforeDestroyCalled).toBe(true)
      expect(destroyCalled).toBe(true)
      done()
    })
  })
})


// dynamic events

const DynamicEvent = () => import('./DynamicEvent.vue')

const COMPONENT_WITH_DYNAMIC_SLOTS = {
  components: {
    FullCalendar,
    DynamicEvent,
  },
  template: `
    <FullCalendar :options='calendarOptions'>
      <template v-slot:eventContent="arg">
        <DynamicEvent :event="arg.event" />
      </template>
    </FullCalendar>
  `,
  data() {
    return {
      calendarOptions: {
        ...DEFAULT_OPTIONS,
        events: buildEvents(1)
      }
    }
  }
}

// https://github.com/fullcalendar/fullcalendar-vue/issues/122
it('renders dynamically imported event', (done) => {
  let wrapper = mount(COMPONENT_WITH_DYNAMIC_SLOTS)
  let eventEl = getRenderedEventEls(wrapper).at(0)

  setTimeout(() => {
    expect(eventEl.findAll('.dynamic-event').length).toBe(1)
    done()
  }, 100)
})


// slots data binding
// (also test slots in combination with prev/next)

it('slot rendering reacts to bound parent state', async () => {
  let wrapper = mount({
    components: {
      FullCalendar,
    },
    template: `
      <FullCalendar :options='calendarOptions' ref='fullCalendar'>
        <template v-slot:eventContent="arg">
          <b v-if="isBold">Event:</b>
          <i v-else>Event:</i>
          {{ arg.event.title }}
        </template>
      </FullCalendar>
    `,
    data() {
      return {
        isBold: false,
        calendarOptions: {
          ...DEFAULT_OPTIONS,
          events: buildEvents(1)
        }
      }
    }
  })
  const calendarApi = wrapper.vm.$refs.fullCalendar.getApi()

  await Vue.nextTick()
  let eventEl = getRenderedEventEls(wrapper).at(0)
  expect(eventEl.findAll('.fc-event-inner').length).toBe(1)
  expect(eventEl.findAll('b').length).toEqual(0)
  expect(eventEl.findAll('i').length).toEqual(1)

  wrapper.vm.isBold = true
  await Vue.nextTick()
  expect(eventEl.findAll('b').length).toEqual(1)
  expect(eventEl.findAll('i').length).toEqual(0)

  calendarApi.next()
  await Vue.nextTick()
  expect(getRenderedEventEls(wrapper).length).toBe(0)

  calendarApi.prev()
  await Vue.nextTick()
  eventEl = getRenderedEventEls(wrapper).at(0)
  expect(eventEl.findAll('b').length).toEqual(1)
  expect(eventEl.findAll('i').length).toEqual(0)
})


// https://github.com/fullcalendar/fullcalendar/issues/7105 (but for vue2)
describe('with resource-timeline view', () => {
  it('doesn\'t throw any errors when removing a resource', async () => {
    let wrapper = mount({
      components: {
        FullCalendar,
      },
      template: `
        <FullCalendar ref='calendar' :options='calendarOptions'>
          <template v-slot:resourceLabelContent="arg">
            <b>{{ arg.resource.title }}</b>
          </template>
        </FullCalendar>
      `,
      data() {
        return {
          calendarOptions: {
            plugins: [classicThemePlugin, resourceTimelinePlugin],
            initialView: 'resourceTimelineWeek',
            resources: [{ id: 'a', title: 'a' }]
          }
        }
      },
      methods: {
        removeResource() {
          const calendarApi = this.$refs.calendar.getApi()
          const resource = calendarApi.getResourceById('a')
          resource.remove()
        }
      }
    })

    await Vue.nextTick()
    wrapper.vm.removeResource() // TODO: have test fail if any error is thrown
    await Vue.nextTick()
  })
})


// FullCalendar options utils

function buildEvents(length, timed) {
  let events = []

  for (let i = 0; i < length; i++) {
    events.push(buildEvent(i, timed))
  }

  return events
}

function buildEvent(i, timed) {
  return {
    title: 'event' + i,
    start: DEFAULT_OPTIONS.initialDate +
      (timed ? 'T12:00:00' : '')
  }
}

function buildToolbar() {
  return {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
  }
}


// DOM querying utils

function isSkeletonRendered(wrapper) {
  return wrapper.find('.fc').exists()
}

function isWeekendsRendered(wrapper) {
  return wrapper.find('.fc-day-sat').exists()
}

function getRenderedEventEls(wrapper) {
  return wrapper.findAll('.fc-event')
}

function getRenderedEventCount(wrapper) {
  return getRenderedEventEls(wrapper).length
}

function getFirstEventTitle(wrapper) {
  return wrapper.find('.fc-event-title').text()
}
