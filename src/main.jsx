import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Analytics from './Analytics.jsx'
import './index.css'

const isAnalytics = new URLSearchParams(window.location.search).get('admin') !== null;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAnalytics ? <Analytics /> : <App />}
  </React.StrictMode>,
)
