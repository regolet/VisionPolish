import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Login from './pages/Login'
import Profile from './pages/Profile'
import AdminDashboard from './pages/AdminDashboard'
import UserManagement from './pages/UserManagement'
import AdminOrderManagement from './pages/AdminOrderManagement'
import RLSManagement from './pages/RLSManagement'
import EditorDashboard from './pages/EditorDashboard'
import OrderSuccess from './pages/OrderSuccess'
import Orders from './pages/Orders'
import Unauthorized from './pages/Unauthorized'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/login" element={<Login />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              
              {/* Protected Customer Routes */}
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />
              <Route path="/order-success" element={
                <ProtectedRoute>
                  <OrderSuccess />
                </ProtectedRoute>
              } />
              
              {/* Editor Routes */}
              <Route path="/editor" element={
                <ProtectedRoute editorOnly={true}>
                  <EditorDashboard />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute adminOnly={true}>
                  <UserManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute staffOnly={true}>
                  <AdminOrderManagement />
                </ProtectedRoute>
              } />
              <Route path="/admin/rls" element={
                <ProtectedRoute adminOnly={true}>
                  <RLSManagement />
                </ProtectedRoute>
              } />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App