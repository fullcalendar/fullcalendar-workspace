const React = require('react')
const { createRoot } = require('react-dom/client')
const DemoApp = require('./DemoApp')
require('./index.css')

document.addEventListener('DOMContentLoaded', function() {
  createRoot(document.body.appendChild(document.createElement('div')))
    .render(<DemoApp />)
})
