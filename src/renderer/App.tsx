import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import SalesSystem from './components/SalesSystem'
import InventorySystem from './components/InventorySystem'
import ReportSystem from './components/ReportSystem'
import QuoteSystem from './components/QuoteSystem'
import OrderSystem from './components/OrderSystem'
import AppointmentSystem from './components/AppointmentSystem'
import RefundSystem from './components/RefundSystem'
import SubscriptionSystem from './components/SubscriptionSystem'
import Settings from './components/Settings'

const App: React.FC = () => {
  const { t } = useTranslation()

  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm">{/* Navigation menu will be added here */}</nav>
        <main className="container mx-auto px-4 py-8">
        <Routes>
        <Route path="/" element={<SalesSystem />} />
        <Route path="/inventory" element={<InventorySystem />} />
        <Route path="/reports" element={<ReportSystem />} />
        <Route path="/quotes" element={<QuoteSystem />} />
        <Route path="/orders" element={<OrderSystem />} />
        <Route path="/appointments" element={<AppointmentSystem />} />
        <Route path="/refunds" element={<RefundSystem />} />
        <Route path="/subscriptions" element={<SubscriptionSystem />} />
        <Route path="/settings" element={<Settings />} />
        </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
