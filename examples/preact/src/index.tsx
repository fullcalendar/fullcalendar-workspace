import { render } from 'preact'
import DemoApp from './DemoApp'
import './index.css'

document.addEventListener('DOMContentLoaded', function() {
  render(<DemoApp />, document.getElementById('root')!)
})
