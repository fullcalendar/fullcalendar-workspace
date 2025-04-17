import { CalendarImpl } from './api/CalendarImpl.js'
import { CalendarOptionsRefined } from './options.js'
import { ViewSpec, ViewSpecHash } from './structs/view-spec.js'
import { ToolbarInput, ToolbarModel, ToolbarWidget } from './toolbar-struct.js'
import { formatWithOrdinals } from './util/misc.js'

export function parseToolbars(
  calendarOptions: CalendarOptionsRefined,
  viewSpecs: ViewSpecHash,
  calendarApi: CalendarImpl,
) {
  let header = calendarOptions.headerToolbar ? parseToolbar(
    calendarOptions.headerToolbar,
    calendarOptions,
    viewSpecs,
    calendarApi,
  ) : null
  let footer = calendarOptions.footerToolbar ? parseToolbar(
    calendarOptions.footerToolbar,
    calendarOptions,
    viewSpecs,
    calendarApi,
  ) : null

  return { header, footer }
}

function parseToolbar(
  sectionStrHash: ToolbarInput,
  calendarOptions: CalendarOptionsRefined,
  viewSpecs: ViewSpecHash,
  calendarApi: CalendarImpl,
) : ToolbarModel {
  let isRtl = calendarOptions.direction === 'rtl'
  let viewsWithButtons: string[] = []
  let hasTitle = false

  function processSectionStr(sectionStr: string): ToolbarWidget[][] {
    let sectionRes = parseSection(sectionStr, calendarOptions, viewSpecs, calendarApi)
    viewsWithButtons.push(...sectionRes.viewsWithButtons)
    hasTitle = hasTitle || sectionRes.hasTitle
    return sectionRes.widgets
  }

  const sectionWidgets = {
    start: processSectionStr(sectionStrHash[isRtl ? 'right' : 'left'] || sectionStrHash.start || ''),
    center: processSectionStr(sectionStrHash.center || ''),
    end: processSectionStr(sectionStrHash[isRtl ? 'left' : 'right'] || sectionStrHash.end || ''),
  }

  return {
    sectionWidgets,
    viewsWithButtons,
    hasTitle,
  }
}

/*
BAD: querying icons and text here. should be done at render time
*/
function parseSection(
  sectionStr: string,
  calendarOptions: CalendarOptionsRefined,
  viewSpecs: ViewSpecHash,
  calendarApi: CalendarImpl,
): { widgets: ToolbarWidget[][], viewsWithButtons: string[], hasTitle: boolean } {
  let calendarButtons = calendarOptions.buttons || {}
  let sectionSubstrs = sectionStr ? sectionStr.split(' ') : []
  let viewsWithButtons: string[] = []
  let hasTitle = false

  let widgets = sectionSubstrs.map(
    (buttonGroupStr): ToolbarWidget[] => (
      buttonGroupStr.split(',').map((buttonName): ToolbarWidget => {
        if (buttonName === 'title') {
          hasTitle = true
          return { buttonName }
        }

        let viewSpec: ViewSpec
        let buttonInput = calendarButtons[buttonName] || {}
        let buttonText: string
        let buttonIcon = buttonInput.icon
        let buttonHint: string | ((unitText: string) => string)
        let buttonClick: (ev: MouseEvent) => void

        if ((viewSpec = viewSpecs[buttonName])) {
          viewsWithButtons.push(buttonName)
          const buttonTextKey = viewSpec.optionDefaults.buttonTextKey as string

          buttonText = buttonInput.text ||
            (buttonTextKey ? calendarOptions[buttonTextKey] : '') ||
            (viewSpec.singleUnit ? calendarOptions[viewSpec.singleUnit + 'Text'] : '') ||
            buttonName

          /*
          buttons{}.hint(viewButtonText, viewName)
          viewHint(viewButtonText, viewName)
          */
          buttonHint = formatWithOrdinals(
            buttonInput.hint || calendarOptions.viewHint,
            [buttonText, buttonName], // ordinal arguments
            buttonText, // fallback text
          )

          buttonClick = (ev: MouseEvent) => {
            buttonInput?.click?.(ev)
            if (!ev.defaultPrevented) {
              calendarApi.changeView(buttonName)
            }
          }
        } else if (calendarApi[buttonName]) {
          buttonText = buttonInput.text ||
            calendarOptions[buttonName + 'Text'] ||
            buttonName

          /*
          button{}.hint(currentUnitText, currentUnit)
          prevHint(currentUnitUnitext, currentUnit)
          nextHint -- same
          todayHint -- same
          */
          if (buttonName === 'prevYear') {
            buttonHint = formatWithOrdinals(
              buttonInput.hint || calendarOptions.prevHint,
              [calendarOptions.yearText, 'year'],
              buttonText,
            )
          } else if (buttonName === 'nextYear') {
            buttonHint = formatWithOrdinals(
              buttonInput.hint || calendarOptions.nextHint,
              [calendarOptions.yearText, 'year'],
              buttonText,
            )
          } else {
            buttonHint = (currentUnit: string) => { // dynamic
              return formatWithOrdinals(
                buttonInput.hint || calendarOptions[buttonName + 'Hint'], // todayHint/prevHint/nextHint
                [calendarOptions[currentUnit + 'Text'], currentUnit], // ordinal arguments
                buttonText, // fallback text
              )
            }
          }

          buttonClick = (ev: MouseEvent) => {
            buttonInput?.click?.(ev)
            if (!ev.defaultPrevented) {
              calendarApi[buttonName]()
            }
          }
        }

        return {
          isView: Boolean(viewSpec),
          buttonName,
          buttonText,
          buttonHint,
          buttonIcon,
          buttonClick,
        }
      })
    ),
  )

  return { widgets, viewsWithButtons, hasTitle }
}
