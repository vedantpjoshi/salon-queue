import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import TokenStatus from './pages/TokenStatus';
import StylistBoard from './pages/StylistBoard';
import Display from './pages/Display';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/token/:id" element={<TokenStatus />} />
          <Route path="/stylist" element={<StylistBoard />} />
          <Route path="/display" element={<Display />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}
