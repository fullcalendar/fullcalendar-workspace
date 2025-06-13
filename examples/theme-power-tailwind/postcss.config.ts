import postcssReporter from 'postcss-reporter'
import postcssScss from 'postcss-scss'

export default {
  parser: postcssScss,
  plugins: [
    postcssReporter({ clearReportedMessages: true }),
  ]
}
