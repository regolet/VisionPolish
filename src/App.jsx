import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogin from './pages/AdminLogin'
import UserManagement from './pages/UserManagement'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App