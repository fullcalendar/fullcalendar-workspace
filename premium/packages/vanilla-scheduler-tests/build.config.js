export default {
  globalConfig: {
  },
  exports: {
    ".": {
      format: "global",
      primary: true,
      generator: "./scripts/generate-index.js"
    }
  },
  importRemaps: process.env.FORCE_REACT ? {
    '@fullcalendar/vanilla': '@fullcalendar/vanilla-w-react',
    '@fullcalendar/vanilla/*': '@fullcalendar/vanilla-w-react/*',
    '@fullcalendar/vanilla-scheduler': '@fullcalendar/vanilla-scheduler-w-react',
    '@fullcalendar/vanilla-scheduler/*': '@fullcalendar/vanilla-scheduler-w-react/*',
  } : undefined,
}
