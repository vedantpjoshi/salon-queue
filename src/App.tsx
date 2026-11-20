import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CartProvider } from './context/CartContext';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import TokenStatus from './pages/TokenStatus';
import StylistBoard from './pages/StylistBoard';
import Display from './pages/Display';
import Admin from './pages/Admin';
import { getAdminSession } from './lib/api';

function StaffRoute({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  useEffect(() => { getAdminSession().then((s) => setAuthenticated(s.authenticated)).catch(() => setAuthenticated(false)); }, []);
  if (authenticated === null) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600" /></div>;
  return authenticated ? <>{children}</> : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/token/:id" element={<TokenStatus />} />
          <Route path="/stylist" element={<StaffRoute><StylistBoard /></StaffRoute>} />
          <Route path="/display" element={<Display />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
