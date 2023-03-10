import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import Counter from './Counter'
import './index.css'
import { BrowserRouter } from "react-router-dom"

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
    <Counter />
  </React.StrictMode>,
)
