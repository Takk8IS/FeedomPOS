import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import Sales from './pages/Sales';
import QuoteSystem from './pages/QuoteSystem';
import OrderSystem from './pages/OrderSystem';
import AppointmentSystem from './pages/AppointmentSystem';
import RefundSystem from './pages/RefundSystem';
import SubscriptionSystem from './pages/SubscriptionSystem';
import Settings from './pages/Settings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/quotes" element={<QuoteSystem />} />
        <Route path="/orders" element={<OrderSystem />} />
        <Route path="/appointments" element={<AppointmentSystem />} />
        <Route path="/refunds" element={<RefundSystem />} />
        <Route path="/subscriptions" element={<SubscriptionSystem />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
