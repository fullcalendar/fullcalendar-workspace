import arLocale from '@fullcalendar/core/locales/ar'

describe('direction', () => {
  it('has it\'s default value computed differently based off of the locale', () => {
    initCalendar({
      locale: arLocale, // Arabic is RTL
    })
    expect(currentCalendar.getOption('direction')).toEqual('rtl')
  })

  // NOTE: don't put tests related to other options in here!
  // Put them in the test file for the individual option!

  it('adapts to dynamic option change', () => {
    initCalendar({
      direction: 'ltr',
    })
    let $el = $(currentCalendar.el)

    expect($el).not.toHaveAttr('dir', 'rtl')
    currentCalendar.setOption('direction', 'rtl')
    expect($el).toHaveAttr('dir', 'rtl')
  })
})
