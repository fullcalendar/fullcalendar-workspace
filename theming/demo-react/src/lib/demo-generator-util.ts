import { EventCalendarProps } from './demo-config'
import { ThemeName } from './config'

export const DEFAULT_DATA_ATTRIBUTE = 'data-color-scheme'
export const DEFAULT_DARK_CLASS_NAME = 'dark'

export function buildToolbarAndButtons(
  theme: ThemeName,
  availableViews: string[],
  addButton: EventCalendarProps['addButton']
) {
  switch (theme) {
    case 'monarch':
    case 'forma':
      return {
        headerToolbar: {
          start: 'add today prev,next title',
          end: availableViews.join(','),
        },
        buttons: {
          add: {
            isPrimary: true,
            ...addButton,
          }
        }
      }
    case 'breezy':
    case 'pulse':
      return {
        headerToolbar: {
          start: 'add prev,today,next',
          center: 'title',
          end: availableViews.join(','),
        },
        buttons: {
          add: {
            isPrimary: true,
            ...addButton,
          }
        }
      }
    case 'classic':
      return {
        headerToolbar: {
          start: 'add today prev,next',
          center: 'title',
          end: availableViews.join(','),
        },
        buttons: {
          add: addButton || {},
        }
      }
  }
}
