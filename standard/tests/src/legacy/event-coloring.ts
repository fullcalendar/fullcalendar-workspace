import { EventInput } from '@fullcalendar/core'
import { RED_REGEX } from '../lib/dom-misc.js'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('event coloring', () => {
  pushOptions({
    initialDate: '2014-11-04',
    allDaySlot: false,
  })

  describe('when in month view', () => {
    pushOptions({
      initialView: 'dayGridMonth',
    })

    defineViewTests(false)
  })

  describe('when in week view', () => {
    pushOptions({
      initialView: 'timeGridWeek',
    })

    defineViewTests(true)
  })

  function defineViewTests(eventHasTime) {
    describe('for foreground events', () => {
      testColor(eventHasTime)
      testContrastColor(eventHasTime)
    })

    describe('for background events', () => {
      testColor(eventHasTime, 'background')
    })
  }

  function testContrastColor(eventHasTime) {
    let eventOptions = getEventOptions(eventHasTime)

    it('should accept the global eventContrastColor', () => {
      initCalendar({
        eventContrastColor: 'red',
        events: [getTestEvent(eventOptions)],
      })
      expect(getEventCss('color')).toMatch(RED_REGEX)
    })

    it('should accept an event source\'s textColor', () => {
      initCalendar({
        eventContrastColor: 'blue', // even when there's a more general setting
        eventSources: [{
          contrastColor: 'red',
          events: [getTestEvent(eventOptions)],
        }],
      })
      expect(getEventCss('color')).toMatch(RED_REGEX)
    })

    it('should accept an event object\'s textColor', () => {
      let eventInput = getTestEvent(eventOptions, {
        contrastColor: 'red',
      })
      initCalendar({
        eventContrastColor: 'blue', // even when there's a more general setting
        events: [eventInput],
      })
      expect(getEventCss('color')).toMatch(RED_REGEX)
    })
  }

  function testColor(eventHasTime, display?) {
    let eventOptions = getEventOptions(eventHasTime)

    if (typeof display !== 'undefined') {
      eventOptions.display = display
    }

    it('should accept the global eventColor for background color', () => {
      initCalendar({
        eventColor: 'red',
        events: [getTestEvent(eventOptions)],
      })
      expect(getEventCss('background-color', display)).toMatch(RED_REGEX)
    })

    it('should accept an event source\'s color for the background', () => {
      initCalendar({
        eventColor: 'blue', // even when there's a more general setting
        eventSources: [{
          color: 'red',
          events: [getTestEvent(eventOptions)],
        }],
      })
      expect(getEventCss('background-color', display)).toMatch(RED_REGEX)
    })

    it('should accept an event source\'s backgroundColor', () => {
      initCalendar({
        eventSources: [{
          color: 'red',
          events: [getTestEvent(eventOptions)],
        }],
      })
      expect(getEventCss('background-color', display)).toMatch(RED_REGEX)
    })

    it('should accept an event object\'s color for the background', () => {
      let eventInput = getTestEvent(eventOptions)
      eventInput.color = 'red'
      initCalendar({
        eventSources: [{
          color: 'blue', // even when there's a more general setting
          events: [eventInput],
        }],
      })
      expect(getEventCss('background-color', display)).toMatch(RED_REGEX)
    })

    it('should accept an event object\'s backgroundColor', () => {
      let eventInput = getTestEvent(eventOptions)
      eventInput.color = 'blue' // even when there's a more general setting
      eventInput.backgroundColor = 'red'
      initCalendar({
        eventSources: [{
          events: [eventInput],
        }],
      })
      expect(getEventCss('background-color', display)).toMatch(RED_REGEX)
    })
  }

  function getEventCss(prop, display?) {
    let calendarWrapper = new CalendarWrapper(currentCalendar)
    let eventEl = display === 'background'
      ? calendarWrapper.getBgEventEls()[0]
      : calendarWrapper.getEventEls()[0]

    if (prop === 'color') {
      return $(eventEl).find('.' + CalendarWrapper.EVENT_TITLE_CLASSNAME).css(prop)
    }

    return $(eventEl).css(prop)
  }

  function getTestEvent(defaultOptions, extraOptions = {}): EventInput {
    let event = {} as EventInput
    $.extend(event, defaultOptions)
    if (extraOptions) {
      $.extend(event, extraOptions)
    }
    return event
  }

  function getEventOptions(eventHasTime): EventInput {
    let options = {
      start: '2014-11-04',
    }
    if (eventHasTime) {
      options.start += 'T01:00:00'
    }
    return options
  }
})
