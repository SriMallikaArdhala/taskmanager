import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d1424',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.08)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.875rem',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#000' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
