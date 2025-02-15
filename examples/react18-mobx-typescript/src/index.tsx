import React from 'react'
import { render } from 'react-dom'
import { DemoApp } from './DemoApp'
import "./index.css"

// TODO: fix problems with data not updating DOM
document.addEventListener("DOMContentLoaded", function () {
  render(<DemoApp />, document.body.appendChild(document.createElement("div")))
})
