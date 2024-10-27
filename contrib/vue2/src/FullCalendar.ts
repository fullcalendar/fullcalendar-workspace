import Vue, { PropType, VNode } from 'vue'
import { Calendar, CalendarOptions } from '@fullcalendar/core'
import { CustomRendering, CustomRenderingStore } from '@fullcalendar/core/internal'
import { OPTION_IS_COMPLEX } from './options.js'
import OffscreenFragment from './OffscreenFragment.js'
import TransportContainer from './TransportContainer.js'

const FullCalendar = Vue.extend({
  props: {
    options: Object as PropType<CalendarOptions>
  },

  data() {
    return {
      renderId: 0,
      customRenderingMap: new Map<string, CustomRendering<any>>()
    }
  },

  methods: {
    getApi(): Calendar {
      return getSecret(this).calendar
    },

    buildOptions(suppliedOptions: CalendarOptions | undefined): CalendarOptions {
      return {
        ...suppliedOptions,
        customRenderingMetaMap: kebabToCamelKeys(this.$scopedSlots),
        handleCustomRendering: getSecret(this).handleCustomRendering,
        customRenderingReplaces: true,
      }
    },
  },

  render(h) {
    const customRenderingNodes: VNode[] = []

    for (const customRendering of this.customRenderingMap.values()) {
      const innerContent = typeof customRendering.generatorMeta === 'function' ?
        customRendering.generatorMeta(customRendering.renderProps) : // a slot-render-function
        customRendering.generatorMeta // jsx vnode?

      customRenderingNodes.push(
        // need stable element reference for list-diffing
        // TODO: move this functionality within TransportContainer
        h('div', { key: customRendering.id}, [
          h(TransportContainer, {
            key: customRendering.id,
            props: {
              inPlaceOf: customRendering.containerEl,
              reportEl: customRendering.reportNewContainerEl,
              elTag: customRendering.elTag,
              elClassName: customRendering.elClassName,
              elStyle: customRendering.elStyle,
              elAttrs: customRendering.elAttrs,
            }
          }, innerContent)
        ])
      )
    }

    return h('div', {
      // when renderId is changed, Vue will trigger a real-DOM async rerender, calling beforeUpdate/updated
      attrs: { 'data-fc-render-id': this.renderId }
    }, [
      // for containing TransportContainer keys
      h(OffscreenFragment, customRenderingNodes)
    ])
  },

  mounted() {
    const customRenderingStore = new CustomRenderingStore<any>()
    getSecret(this).handleCustomRendering = customRenderingStore.handle.bind(customRenderingStore)

    const calendarOptions = this.buildOptions(this.options)
    const calendar = new Calendar(this.$el as HTMLElement, calendarOptions)
    getSecret(this).calendar = calendar

    calendar.render()
    customRenderingStore.subscribe((customRenderingMap) => {
      this.customRenderingMap = customRenderingMap // likely same reference, so won't rerender
      this.renderId++ // force rerender
    })
  },

  beforeUpdate() {
    this.getApi().resumeRendering() // the watcher handlers paused it
  },

  beforeDestroy() {
    this.getApi().destroy()
  },

  watch: buildWatchers()
})

export default FullCalendar

// Internals

type FullCalendarInstance = InstanceType<typeof FullCalendar>

interface FullCalendarSecret {
  calendar: Calendar
  handleCustomRendering: (customRendering: CustomRendering<any>) => void
}

// storing internal state:
// https://github.com/vuejs/vue/issues/1988#issuecomment-163013818
function getSecret(inst: FullCalendarInstance): FullCalendarSecret {
  return inst as any as FullCalendarSecret
}

function buildWatchers() {

  let watchers: { [member: string]: any } = {

    // watches changes of ALL options and their nested objects,
    // but this is only a means to be notified of top-level non-complex options changes.
    options: {
      deep: true,
      handler(this: FullCalendarInstance, options: CalendarOptions) {
        let calendar = this.getApi()
        calendar.pauseRendering()

        let calendarOptions = this.buildOptions(options)
        calendar.resetOptions(calendarOptions)

        this.renderId++ // will queue a rerender
      }
    }
  }

  for (let complexOptionName in OPTION_IS_COMPLEX) {

    // handlers called when nested objects change
    watchers[`options.${complexOptionName}`] = {
      deep: true,
      handler(this: FullCalendarInstance, val: any) {

        // unfortunately the handler is called with undefined if new props were set, but the complex one wasn't ever set
        if (val !== undefined) {

          let calendar = this.getApi()
          calendar.pauseRendering()
          calendar.resetOptions({
            [complexOptionName]: val
          }, [complexOptionName])

          this.renderId++ // will queue a rerender
        }
      }
    }
  }

  return watchers
}

// General Utils

function kebabToCamelKeys<V>(map: { [key: string]: V }): { [key: string]: V } {
  const newMap: { [key: string]: V } = {}

  for (const key in map) {
    newMap[kebabToCamel(key)] = map[key]
  }

  return newMap
}

function kebabToCamel(s: string): string {
  return s
    .split('-')
    .map((word, index) => index ? capitalize(word) : word)
    .join('')
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
