import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MenuManagement from './pages/MenuManagement';
import TableManagement from './pages/TableManagement';
import OrderManagement from './pages/OrderManagement';
import KitchenDisplay from './pages/KitchenDisplay';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import UserManagement from './pages/UserManagement';
import Layout from './components/Layout';
import './App.css';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="tables" element={<TableManagement />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="kitchen" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen']}>
            <KitchenDisplay />
          </ProtectedRoute>
        } />
        <Route path="inventory" element={<Inventory />} />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <Reports />
          </ProtectedRoute>
        } />
        <Route path="ai-insights" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <AIInsights />
          </ProtectedRoute>
        } />
        <Route path="users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster 
              position="top-right" 
              toastOptions={{
                style: {
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#fafafa',
                },
              }}
            />
          </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
