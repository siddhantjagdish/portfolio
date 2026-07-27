import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AppProvider } from './AppContext.jsx'
import Header from './components/Header.jsx'
import AssumptionBanner from './components/AssumptionBanner.jsx'
import InvestModal from './components/InvestModal.jsx'
import Discover from './pages/Discover.jsx'
import SchemeDetail from './pages/SchemeDetail.jsx'
import Compare from './pages/Compare.jsx'
import Portfolio from './pages/Portfolio.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ScrollToTop />
        <div className="pb-8">
          <Header />
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/scheme/:id" element={<SchemeDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/portfolio" element={<Portfolio />} />
          </Routes>
        </div>
        <InvestModal />
        <AssumptionBanner />
      </AppProvider>
    </BrowserRouter>
  )
}
