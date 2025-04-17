import bootstrapPlugin from '@fullcalendar/bootstrap'
import classicThemePlugin from '@fullcalendar/classic-theme'
import dayGridPlugin from '@fullcalendar/daygrid'
import { CalendarWrapper } from '../lib/wrappers/CalendarWrapper.js'

describe('bootstrap theme', () => {
  pushOptions({
    plugins: [bootstrapPlugin, classicThemePlugin, dayGridPlugin],
  })

  describe('fa', () => {
    pushOptions({
      headerToolbar: { left: '', center: '', right: 'next' },
    })

    it('renders default', () => {
      let calendar = initCalendar()
      let toolbarWrapper = new CalendarWrapper(calendar).toolbar
      let buttonInfo = toolbarWrapper.getButtonInfo('next', 'fa')

      expect(buttonInfo.iconName).toBe('chevron-right')
    })

    it('renders a customized icon', () => {
      let calendar = initCalendar({
        // TODO: somehow modify font-awesome icon
        /* bootstrapFontAwesome: {
          next: 'asdf',
        }, */
      })
      let toolbarWrapper = new CalendarWrapper(calendar).toolbar
      let buttonInfo = toolbarWrapper.getButtonInfo('next', 'fa')

      expect(buttonInfo.iconName).toBe('asdf')
    })

    it('renders text when specified as false', () => {
      let calendar = initCalendar({
        // TODO: somehow disable font-awesome icons
      })
      let toolbarWrapper = new CalendarWrapper(calendar).toolbar

      expect(toolbarWrapper.getButtonInfo('next', 'fa').iconName).toBeFalsy()
    })
  })
})
