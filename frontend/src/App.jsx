import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import KaryawanDashboard from './pages/KaryawanDashboard';

export default function App() {
  const [role, setRole] = useState(localStorage.getItem('userRole') || null);

  const handleLogin = (userRole) => {
    setRole(userRole);
    localStorage.setItem('userRole', userRole); // Simpan status login di browser
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* NAVBAR KETIKA USER SUDAH LOGIN */}
        {role && (
          <nav className="!bg-white !text-gray-800 border-b border-gray-100 px-6 py-3 flex justify-between items-center shadow-sm font-sans">
            <div className="flex items-center gap-2 font-black tracking-wide text-slate-800 text-sm md:text-base">
  <i className="bi bi-lightning-charge-fill text-orange-500"></i> {/* Ikon Oranye */}
  <span>PT. MAJU MUNDUR SEJAHTERA</span> {/* Teks Abu-abu Gelap Mewah */}
</div>
            <div className="flex items-center gap-4">
              <span className="text-xs bg-orange-800 text-gray-300 px-3 py-1 rounded-full border border-orange-700">
                Logged in as: <strong className="capitalize text-white">{role}</strong>
              </span>
              <button 
                onClick={handleLogout} 
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
              >
                🚪 Keluar
              </button>
            </div>
          </nav>
        )}

        {/* PROTEKSI RUTE HALAMAN */}
        <Routes>
          <Route path="/login" element={!role ? <Login onLogin={handleLogin} /> : <Navigate to={role === 'admin' ? '/' : '/karyawan'} />} />
          
          <Route path="/" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/karyawan" element={role === 'karyawan' ? <KaryawanDashboard /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
}