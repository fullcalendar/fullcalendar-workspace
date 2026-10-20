import { PluginInput } from '../plugin-system-struct'
import { warn } from '../util/warn'

declare module '@fullcalendar/core/protected-api' {
  interface BaseOptions {
    devParts?: boolean
  }
  interface BaseOptionsRefined {
    devParts?: boolean
  }
}

let isWarned = false

/*
DEVELOPMENT ONLY. Gives every render-hook part's element a `data-fc-part` attribute naming its
part (ex: `data-fc-part="dayCell"`), for debugging themes and for automated tests.

Never write CSS against these attributes. Style through the `*Class` options instead.
Don't ship this plugin to production.
*/
export default {
  name: 'dev-parts',
  optionRefiners: {
    devParts: Boolean,
  },
  optionDefaults: {
    devParts: true,
  },
  contextInit() {
    if (!isWarned) {
      isWarned = true
      warn(
        'The dev-parts plugin is for development only. ' +
        'Never style against data-fc-part attributes; use the *Class options.',
      )
    }
  },
} as PluginInput
