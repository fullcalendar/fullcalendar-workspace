import { Calendar } from '@fullcalendar/core'

export function waitEventDrag(calendar: Calendar, dragging: Promise<any>) {
  return new Promise<any>((resolve) => {
    let modifiedEvent: any = false

    calendar.on('eventDrop', (data) => {
      modifiedEvent = data.event
    })

    calendar.on('_noEventDrop', () => {
      resolve(false)
    })

    dragging.then(() => {
      setTimeout(() => { // wait for eventDrop to fire
        resolve(modifiedEvent)
      })
    })
  })
}

export function waitEventDrag2(calendar: Calendar, dragging: Promise<any>) {
  return new Promise<any>((resolve) => {
    let theData: any = false

    calendar.on('eventDrop', (data) => {
      theData = data
    })

    calendar.on('_noEventDrop', () => {
      resolve(false)
    })

    dragging.then(() => {
      setTimeout(() => { // wait for eventDrop to fire
        resolve(theData)
      })
    })
  })
}

export function waitEventResize(calendar: Calendar, dragging: Promise<any>) {
  return new Promise<any>((resolve) => {
    let modifiedEvent: any = false

    calendar.on('eventResize', (data) => {
      modifiedEvent = data.event
    })

    dragging.then(() => {
      setTimeout(() => { // wait for eventResize to fire
        resolve(modifiedEvent)
      })
    })
  })
}

export function waitEventResize2(calendar: Calendar, dragging: Promise<any>) {
  return new Promise<any>((resolve) => {
    let theData: any = false

    calendar.on('eventResize', (data) => {
      theData = data
    })

    dragging.then(() => {
      setTimeout(() => { // wait for eventResize to fire
        resolve(theData)
      })
    })
  })
}

export function waitDateSelect(calendar: Calendar, dragging: Promise<any>) {
  return new Promise<any>((resolve) => {
    let selectInfo = null

    calendar.on('select', (data) => {
      selectInfo = data
    })

    dragging.then(() => {
      setTimeout(() => { // wait for select to fire
        resolve(selectInfo)
      })
    })
  })
}
