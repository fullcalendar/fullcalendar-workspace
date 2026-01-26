import React from 'react'
import { createRoot } from 'react-dom/client'
import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { Provider } from 'react-redux'
import rootReducer from './reducer'
import DemoApp from './DemoApp'
import './index.css'

let store = createStore(rootReducer, applyMiddleware(thunk))

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <DemoApp />
  </Provider>
)
