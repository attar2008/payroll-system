import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false); // State untuk switch Login <-> Register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [jabatan, setJabatan] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email: email,
        password: password
      });

      const user = response.data;

      // SIMPAN DATA USER YANG BERHASIL LOGIN KE LOCALSTORAGE
      localStorage.setItem('user', JSON.stringify(user));

      // Cek role yang dikembalikan backend
      if (user.role === 'admin') {
        onLogin('admin');
        navigate('/');
      } else {
        onLogin('karyawan');
        navigate('/karyawan');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email atau password salah!');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Pendaftaran mandiri dari karyawan -> otomatis status 'pending' di backend
      await axios.post('http://localhost:5000/api/karyawan', {
        nama,
        email,
        password,
        jabatan,
        gaji_pokok: 0 // Default awal biar admin yang menentukan gaji setelah disetujui
      });

      setSuccess('Pendaftaran berhasil! Akun kamu sedang menunggu persetujuan Admin.');
      
      // Reset input form registrasi
      setNama('');
      setJabatan('');
      setEmail('');
      setPassword('');
      
      // Pindahkan kembali ke form login setelah 3.5 detik
      setTimeout(() => {
        setIsRegister(false);
        setSuccess('');
      }, 3500);

    } catch (err) {
      setError(err.response?.data?.error || 'Pendaftaran gagal, silakan coba lagi!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        
        {/* LOGO & TITLE AREA - Aksen warna Oranye */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center mx-auto text-white text-2xl font-black shadow-md shadow-orange-100 mb-4">
            PR
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">
            {isRegister ? 'Daftar Karyawan' : 'Login Payroll'}
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {isRegister ? 'Silakan lengkapi data diri Anda' : 'Silakan masuk menggunakan akun Anda'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 mb-5 font-semibold">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl border border-green-200 mb-5 font-semibold">
            ✅ {success}
          </div>
        )}

        {isRegister ? (
          /* ==================== FORM REGISTER ==================== */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
              <input 
                type="text" 
                placeholder="Contoh: Budi Santoso" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Jabatan / Posisi</label>
              <input 
                type="text" 
                placeholder="Contoh: Staff IT" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input 
                type="email" 
                placeholder="budi@company.com" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Buat password baru" 
                  className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 focus:outline-none select-none transition"
                >
                  {showPassword ? (
                    /* SVG Icon Mata Coret (Sembunyikan) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* SVG Icon Mata (Tampilkan) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.064-7-9.542-7-4.477 0-8.268 2.943-9.542 7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-100 mt-2 text-sm"
            >
              Kirim Pendaftaran ➔
            </button>

            <p className="text-xs text-center text-gray-400 font-medium mt-4">
              Sudah punya akun?{' '}
              <button 
                type="button" 
                onClick={() => { setIsRegister(false); setError(''); setSuccess(''); }} 
                className="text-orange-500 font-bold hover:underline"
              >
                Masuk disini
              </button>
            </p>
          </form>
        ) : (
          /* ==================== FORM LOGIN ==================== */
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input 
                type="email" 
                placeholder="Masukkan email (admin@company.com)" 
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="Masukkan password" 
                  className="w-full p-3 pr-12 border border-gray-200 rounded-xl bg-gray-50/50 text-sm outline-none text-black focus:border-orange-400 focus:ring-4 focus:ring-orange-50 transition"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-orange-500 focus:outline-none select-none transition"
                >
                  {showPassword ? (
                    /* SVG Icon Mata Coret (Sembunyikan) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.52 10.52 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* SVG Icon Mata (Tampilkan) */
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.064-7-9.542-7-4.477 0-8.268 2.943-9.542 7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-orange-100 mt-2 text-sm"
            >
              Masuk Aplikasi ➔
            </button>

            <p className="text-xs text-center text-gray-400 font-medium mt-4">
              Karyawan Baru?{' '}
              <button 
                type="button" 
                onClick={() => { setIsRegister(true); setError(''); setSuccess(''); }} 
                className="text-orange-500 font-bold hover:underline"
              >
                Daftar Akun Baru
              </button>
            </p>
          </form>
        )}

        <div className="mt-6 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px] text-gray-400 text-center font-medium">
          PT. MAJU MUNDUR SEJAHTERA • E-Payroll System
        </div>
      </div>
    </div>
  );
}