import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/main.css'
import App from './App.jsx'
import AOS from 'aos'
import 'aos/dist/aos.css'
import { MarketplaceProvider } from './contexts/MarketplaceContext.jsx'

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true,
  offset: 100
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MarketplaceProvider>
      <App />
    </MarketplaceProvider>
  </StrictMode>,
)
