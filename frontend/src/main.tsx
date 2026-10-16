import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#111224',
          color: '#e2e4f0',
          border: '1px solid #1e2035',
          fontFamily: 'DM Sans, system-ui, sans-serif',
          fontSize: '13px',
        },
      }}
    />
  </React.StrictMode>
)
