import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Home /* , KeyFeatures */ } from './pages'; // ✨ COMENTADO: KeyFeatures import
import './App.css';

function App() {
  const location = useLocation();

  // ✨ NUEVO: Resetear scroll en cada cambio de ruta
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* ✨ COMENTADO: Ruta a Key Features deshabilitada por ahora */}
      {/* <Route path="/key-features" element={<KeyFeatures />} /> */}
    </Routes>
  );
}

export default App;