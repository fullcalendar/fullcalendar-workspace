import bootstrapPlugin from '@fullcalendar/bootstrap'
import classicThemePlugin from '@fullcalendar/classic-theme'
import dayGridPlugin from '@fullcalendar/daygrid'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('buttons', () => {
  pushOptions({
    plugins: [bootstrapPlugin, classicThemePlugin, dayGridPlugin],
  })

  it('can specify text', () => {
    let calendar = initCalendar({
      buttons: {
        mybutton: { text: 'asdf' },
      },
      headerToolbar: { left: 'mybutton', center: '', right: '' },
    })
    let toolbarWrapper = new CalendarWrapper(calendar).toolbar
    let buttonInfo = toolbarWrapper.getButtonInfo('mybutton')
    expect(buttonInfo.text).toBe('asdf')
  })

  it('can specify an icon', () => {
    let calendar = initCalendar({
      buttons: {
        mybutton: { icon: 'asdf' },
      },
      headerToolbar: { left: 'mybutton', center: '', right: '' },
    })
    let toolbarWrapper = new CalendarWrapper(calendar).toolbar
    let buttonInfo = toolbarWrapper.getButtonInfo('mybutton')
    expect(buttonInfo.iconName).toBe('asdf')
  })

  it('can specify a bootstrap font-awesome icon', () => {
    let calendar = initCalendar({
      buttons: {
        mybutton: {}, // TODO: somehow -- { bootstrapFontAwesome: 'asdf' },
      },
      headerToolbar: { left: 'mybutton', center: '', right: '' },
    })
    let toolbarWrapper = new CalendarWrapper(calendar).toolbar
    let buttonInfo = toolbarWrapper.getButtonInfo('mybutton', 'fa')
    expect(buttonInfo.iconName).toBe('asdf')
  })
})
