import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function KaryawanDashboard() {
  const [payrolls, setPayrolls] = useState([]);
  
  // State untuk form ubah password
  const [passwordBaru, setPasswordBaru] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Ambil data user dari localStorage hasil login
  const loggedInUser = JSON.parse(localStorage.getItem('user')) || {};
  const karyawanId = loggedInUser.id || 1; 

  const fetchSlipKaryawan = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/payroll/karyawan/${karyawanId}`);
      setPayrolls(res.data);
    } catch (err) {
      console.error("Gagal ambil data slip", err);
    }
  };

  useEffect(() => {
    fetchSlipKaryawan();
  }, [karyawanId]);

  // Fungsi kirim perubahan password ke backend
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordBaru) return alert('Password baru tidak boleh kosong, Blay!');
    
    setLoadingPassword(true);
    try {
      // Menggunakan route ter-update /ubah-password/:id
      await axios.put(`http://localhost:5000/api/karyawan/ubah-password/${karyawanId}`, {
        password_baru: passwordBaru
      });
      alert('Password berhasil diperbarui! Gunakan password baru ini untuk login berikutnya.');
      setPasswordBaru('');
    } catch (err) {
      alert(err.response?.data?.error || 'Gagal memperbarui password.');
    } finally {
      setLoadingPassword(false);
    }
  };

const handlePrintSlip = (p) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji - ${p.nama}</title>
          <style>
            /* Reset Margin & Padding bawaan browser agar pas di kertas */
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body { 
              font-family: 'Courier New', Courier, monospace; /* Font kasir standar */
              padding: 15px; 
              color: #000; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header { 
              text-align: center; 
              border-bottom: 1px dashed #000; 
              padding-bottom: 10px; 
              margin-bottom: 15px; 
            }
            .header h2 {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            .header p {
              font-size: 10px;
            }
            .details { 
              margin-bottom: 15px; 
              font-size: 11px;
            }
            .details p {
              margin-bottom: 3px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 5px; 
            }
            th, td { 
              padding: 6px 2px; 
              text-align: left; 
              font-size: 11px;
            }
            th { 
              border-bottom: 1px dashed #000;
              border-top: 1px dashed #000;
            }
            td {
              border-bottom: 1px dotted #ccc;
            }
            .total { 
              font-weight: bold; 
              font-size: 12px; 
            }
            .total td {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding-top: 8px;
              padding-bottom: 8px;
            }
            .footer-sign {
              margin-top: 30px;
              text-align: right;
              font-size: 10px;
            }

            /* 🖨️ SETTINGAN KHUSUS SAAT PRINT (Agar pas ukuran Struk Thermal 80mm) */
            @media print {
              @page {
                size: 80mm auto; /* Memaksa ukuran kertas thermal width 80mm */
                margin: 0;
              }
              body {
                padding: 10mm 5mm; /* Margin area print */
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>PT. MAJU MUNDUR SEJAHTERA</h2>
            <p>SLIP GAJI KARYAWAN - PERIODE ${p.periode.toUpperCase()}</p>
          </div>
          <div class="details">
            <p><strong>Nama Karyawan :</strong> ${p.nama}</p>
            <p><strong>Jabatan         :</strong> ${p.jabatan}</p>
            <p><strong>Tanggal Cetak   :</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Deskripsi</th>
                <th style="text-align: right;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gaji Pokok</td>
                <td style="text-align: right;">Rp ${p.gaji_pokok.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Tunjangan Lembur</td>
                <td style="text-align: right;">Rp ${p.tunjangan_lembur.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Tunjangan Bonus</td>
                <td style="text-align: right;">Rp ${p.tunjangan_bonus.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Potongan BPJS</td>
                <td style="text-align: right; color: red;">- Rp ${p.potongan_bpjs.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td>Potongan Absen</td>
                <td style="text-align: right; color: red;">- Rp ${p.potongan_absen.toLocaleString('id-ID')}</td>
              </tr>
              <tr class="total">
                <td>TOTAL GAJI BERSIH</td>
                <td style="text-align: right;">Rp ${p.gaji_bersih.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer-sign">
            <p>Tangerang, ${new Date().toLocaleDateString('id-ID')}</p>
            <br><br><br>
            <p>( HRD Manager )</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-8">
      {/* HEADER CARD KARYAWAN - SEKARANG WARNA OREN GLOWING */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl p-6 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">👤 Dashboard Karyawan</h1>
          <p className="text-orange-100 mt-1 text-sm md:text-base">Selamat datang kembali, {loggedInUser.nama || 'Karyawan'}. Cek riwayat slip gaji bulanan Anda di bawah.</p>
        </div>
        <span className="w-fit bg-white/20 text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/10">Role: Karyawan</span>
      </header>

      {/* GRID SECTION: KIRI UBAH PW, KANAN TABEL RIWAYAT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* FORM UBAH PASSWORD */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
            <span>🛡️</span> Keamanan Akun
          </h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Password Baru</label>
              <input 
                type="password" 
                placeholder="Masukkan password baru" 
                className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm focus:ring-2 focus:ring-orange-200 outline-none transition text-black" 
                value={passwordBaru} 
                onChange={(e) => setPasswordBaru(e.target.value)}
                required 
              />
              <p className="text-[10px] text-gray-400 mt-1">*Pastikan password baru kamu mudah diingat ya!</p>
            </div>
            <button 
              type="submit" 
              disabled={loadingPassword}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition shadow-sm"
            >
              {loadingPassword ? 'Memproses...' : '🔐 Perbarui Password'}
            </button>
          </form>
        </div>

        {/* RINCIAN DATA UTAMA (SLIP GAJI) */}
        <div className="bg-white p-7 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-xl font-bold mb-5 text-gray-800 border-b pb-3 flex items-center gap-2">
            <span className="text-2xl">💵</span> Riwayat Slip Gaji Anda
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                  <th className="p-4 rounded-l-lg">Periode</th>
                  <th className="p-4">Jabatan</th>
                  <th className="p-4">Rincian Slip Gaji</th>
                  <th className="p-4">Total Diterima (Gaji Bersih)</th>
                  <th className="p-4 text-center rounded-r-lg">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-600">
                {payrolls.map((p, idx) => (
                  <tr key={idx} className="hover:bg-orange-50/40 transition duration-150 text-sm">
                    <td className="p-4 font-bold text-gray-800">{p.periode}</td>
                    <td className="p-4 font-medium text-gray-500">{p.jabatan}</td>
                    <td className="p-4 text-xs space-y-1">
                      <div className="font-semibold text-gray-700">Pokok: Rp {p.gaji_pokok.toLocaleString('id-ID')}</div>
                      <div className="text-green-600 bg-orange-50/60 px-2 py-0.5 rounded-md inline-block">Lembur: +Rp {p.tunjangan_lembur.toLocaleString('id-ID')}</div>
                      <div className="text-green-600 bg-orange-50/60 px-2 py-0.5 rounded-md inline-block">Bonus: +Rp {p.tunjangan_bonus.toLocaleString('id-ID')}</div>
                      <div className="text-red-500 bg-red-50 px-2 py-0.5 rounded-md inline-block">BPJS+Absen: -Rp {(p.potongan_bpjs + p.potongan_absen).toLocaleString('id-ID')}</div>
                    </td>
                    {/* TOTAL GAJI SEKARANG WARNA OREN TEGAS */}
                    <td className="p-4 font-extrabold text-green-600 text-lg">Rp {p.gaji_bersih.toLocaleString('id-ID')}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handlePrintSlip(p)}
                        className="bg-orange-500 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-1.5 mx-auto shadow-sm"
                      >
                        <span>🖨️</span> Download PDF / Cetak
                      </button>
                    </td>
                  </tr>
                ))}
                {payrolls.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-10 text-center text-gray-400">
                      <span className="text-4xl block mb-2">📭</span> Belum ada riwayat gaji yang diterbitkan untuk Anda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}