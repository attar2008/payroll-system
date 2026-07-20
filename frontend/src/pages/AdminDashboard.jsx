import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [payrolls, setPayrolls] = useState([]);
  const [karyawanList, setKaryawanList] = useState([]);
  
  // State Anggaran Perusahaan
  const [anggaranPerusahaan, setAnggaranPerusahaan] = useState(150000000); // Default 150 Juta

  // Dropdown Bulan & Tahun Dinamis
  const listBulan = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const listTahun = ["2026", "2027", "2028", "2029", "2030"];

  // State pilihan Bulan dan Tahun
  const [selectedBulan, setSelectedBulan] = useState("Juli");
  const [selectedTahun, setSelectedTahun] = useState("2026");

  // Form Input Gaji - Versi Fleksibel
  const [form, setForm] = useState({ 
    karyawan_id: '', 
    bonus: '', 
    bpjs: '' 
  });

  // State untuk melacak inputan jumlah Jam Lembur & Hari Absen biasa
  const [jamLembur, setJamLembur] = useState('');
  const [hariAbsen, setHariAbsen] = useState('');

  // State utama untuk Nominal Rupiah (Ini yang nantinya dikirim ke backend dan bisa diedit bebas)
  const [rpLembur, setRpLembur] = useState('');
  const [rpAbsen, setRpAbsen] = useState('');
  
  // Form Tambah / Edit Karyawan
  const [formKaryawan, setFormKaryawan] = useState({ nama: '', jabatan: '', gaji_pokok: '', email: '', password: '' });
  const [editingKaryawanId, setEditingKaryawanId] = useState(null); 
  const [showPasswordKaryawan, setShowPasswordKaryawan] = useState(false);

  // State untuk modal verifikasi gaji
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedVerifyId, setSelectedVerifyId] = useState(null);
  const [inputGajiPokok, setInputGajiPokok] = useState('');

  // Ambil data ter-update
  const fetchData = async () => {
    try {
      const resPayroll = await axios.get('http://localhost:5000/api/payroll');
      setPayrolls(resPayroll.data);

      const resKaryawan = await axios.get('http://localhost:5000/api/karyawan');
      setKaryawanList(resKaryawan.data);
      
      // Mengunci default dropdown input gaji hanya pada karyawan yang sudah 'active'
      const karyawanAktif = resKaryawan.data.filter(k => k.status !== 'pending');
      if (karyawanAktif.length > 0 && !form.karyawan_id) {
        setForm(prev => ({ ...prev, karyawan_id: karyawanAktif[0]?.id }));
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data dengan server", err);
    }
  };

  useEffect(() => { fetchData(); }, []);

// Fungsi otomatis hitung rupiah lembur saat jam diketik
  const handleJamLemburChange = (value) => {
    setJamLembur(value);
    
    // Konversi form.karyawan_id ke Number agar pencariannya presisi
    const karyawanTerpilih = karyawanList.find(k => Number(k.id) === Number(form.karyawan_id));
    if (karyawanTerpilih && value) {
      const uangLemburPerJam = Math.round(karyawanTerpilih.gaji_pokok / 173);
      setRpLembur(Math.round(parseFloat(value) * uangLemburPerJam));
    } else {
      setRpLembur('');
    }
  };

// Fungsi otomatis hitung rupiah potongan saat hari absen diketik
  const handleHariAbsenChange = (value) => {
    setHariAbsen(value);
    
    // Konversi form.karyawan_id ke Number agar pencariannya presisi
    const karyawanTerpilih = karyawanList.find(k => Number(k.id) === Number(form.karyawan_id));
    if (karyawanTerpilih && value) {
      const potonganAbsenPerHari = Math.round(karyawanTerpilih.gaji_pokok / 25);
      setRpAbsen(Math.round(parseFloat(value) * potonganAbsenPerHari));
    } else {
      setRpAbsen('');
    }
  };

  // Hitung Pengeluaran & Sisa Saldo Perusahaan
  const totalPengeluaranGaji = payrolls.reduce((acc, curr) => acc + curr.gaji_bersih, 0);
  const sisaKasPerusahaan = anggaranPerusahaan - totalPengeluaranGaji;

// 1. Fungsi saat tombol Setujui di tabel diklik
  const handleApproveKaryawan = (id) => {
    setSelectedVerifyId(id);
    setInputGajiPokok(''); // Reset inputan biar kosong
    setShowVerifyModal(true); // Buka modal custom
  };

  // 2. Fungsi proses kirim ke backend saat tombol di modal diklik
  const handleConfirmVerify = async (e) => {
    e.preventDefault();

    const gajiPokok = parseFloat(inputGajiPokok);
    if (isNaN(gajiPokok) || gajiPokok <= 0) {
      alert("Gaji pokok harus berupa angka yang valid dan lebih dari 0!");
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/karyawan/${selectedVerifyId}/verify`, {
        gaji_pokok: gajiPokok
      });
      
      alert('Akun karyawan berhasil diverifikasi dan diaktifkan!');
      setShowVerifyModal(false); // Tutup modal
      await fetchData(); // Refresh data tabel
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal memverifikasi akun karyawan.');
    }
  };
    


  const handleSubmitKaryawan = async (e) => {
    e.preventDefault();
    
    if (!formKaryawan.nama || !formKaryawan.jabatan || !formKaryawan.gaji_pokok || !formKaryawan.email || !formKaryawan.password) {
      alert('Tolong isi semua kolom data karyawan, email, dan password dengan benar, Blay!');
      return;
    }

    const payload = {
      nama: formKaryawan.nama,
      jabatan: formKaryawan.jabatan,
      gaji_pokok: parseFloat(formKaryawan.gaji_pokok),
      email: formKaryawan.email,       
      password: formKaryawan.password,
      status: 'active' 
    };

    try {
      if (editingKaryawanId) {
        await axios.put(`http://localhost:5000/api/karyawan/${editingKaryawanId}`, payload);
        alert('Data karyawan berhasil diperbarui!');
        setEditingKaryawanId(null);
      } else {
        await axios.post('http://localhost:5000/api/karyawan', payload);
        alert('Karyawan baru berhasil didaftarkan langsung (Aktif)!');
      }
      
      setFormKaryawan({ nama: '', jabatan: '', gaji_pokok: '', email: '', password: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Gagal memproses data karyawan.');
    }
  };

  const handleStartEdit = (karyawan) => {
    setEditingKaryawanId(karyawan.id);
    setFormKaryawan({
      nama: karyawan.nama,
      jabatan: karyawan.jabatan,
      gaji_pokok: karyawan.gaji_pokok,
      email: karyawan.email || '',
      password: karyawan.password || ''
    });
  };

  const handleDeleteKaryawan = async (id) => {
    if (window.confirm('Yakin ingin menghapus/menolak karyawan ini beserta riwayatnya?')) {
      try {
        await axios.delete(`http://localhost:5000/api/karyawan/${id}`);
        alert('Karyawan berhasil dihapus.');
        fetchData();
      } catch (err) {
        alert('Gagal menghapus karyawan.');
      }
    }
  };

const handleSubmitPayroll = async (e) => {
    e.preventDefault(); // Tambahkan ini agar tidak reload halaman
    
    if (!form.karyawan_id) return alert('Pilih karyawan dulu!');
    
    // Perbaikan: Gunakan variabel state yang benar
    const payloadPayroll = {
        karyawan_id: form.karyawan_id,
        periode: `${selectedBulan} ${selectedTahun}`,
        lembur: rpLembur || 0,
        bonus: form.bonus || 0,
        bpjs: form.bpjs || 0,
        potongan_absen: rpAbsen || 0,
        hari_absen: hariAbsen || 0
    };

    try {
        await axios.post('http://localhost:5000/api/payroll', payloadPayroll);
        alert('Payroll berhasil diproses');
        
        // Reset form setelah sukses
        setForm({ ...form, bonus: '', bpjs: '' });
        setJamLembur('');
        setHariAbsen('');
        setRpLembur('');
        setRpAbsen('');
        fetchData();
    } catch (err) {
        console.error(err);
        alert('Gagal memproses payroll: ' + (err.response?.data?.error || 'Periksa koneksi server'));
    }
};

  const handlePrintSlip = (p) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji - ${p.nama}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Courier New', Courier, monospace; padding: 15px; color: #000; font-size: 12px; line-height: 1.4; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .header h2 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
            .header p { font-size: 10px; }
            .details { margin-bottom: 15px; font-size: 11px; }
            .details p { margin-bottom: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 5px; }
            th, td { padding: 6px 2px; text-align: left; font-size: 11px; }
            th { border-bottom: 1px dashed #000; border-top: 1px dashed #000; }
            td { border-bottom: 1px dotted #ccc; }
            .total { font-weight: bold; font-size: 12px; }
            .total td { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding-top: 8px; padding-bottom: 8px; }
            .footer-sign { margin-top: 30px; text-align: right; font-size: 10px; }
            @media print { @page { size: 80mm auto; margin: 0; } body { padding: 10mm 5mm; } }
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
              <tr><th>Deskripsi</th><th style="text-align: right;">Nominal</th></tr>
            </thead>
            <tbody>
              <tr><td>Gaji Pokok</td><td style="text-align: right;">Rp ${p.gaji_pokok.toLocaleString('id-ID')}</td></tr>
              <tr><td>Tunjangan Lembur</td><td style="text-align: right;">Rp ${p.tunjangan_lembur.toLocaleString('id-ID')}</td></tr>
              <tr><td>Tunjangan Bonus</td><td style="text-align: right;">Rp ${p.tunjangan_bonus.toLocaleString('id-ID')}</td></tr>
              <tr><td>Potongan BPJS</td><td style="text-align: right; color: red;">- Rp ${p.potongan_bpjs.toLocaleString('id-ID')}</td></tr>
              <tr><td>Potongan Absen</td><td style="text-align: right; color: red;">- Rp ${p.potongan_absen.toLocaleString('id-ID')}</td></tr>
              <tr class="total"><td>TOTAL GAJI BERSIH</td><td style="text-align: right;">Rp ${p.gaji_clean ? p.gaji_clean.toLocaleString('id-ID') : p.gaji_bersih.toLocaleString('id-ID')}</td></tr>
            </tbody>
          </table>
          <div class="footer-sign"><p>Tangerang, ${new Date().toLocaleDateString('id-ID')}</p><br><br><br><p>( HRD Manager )</p></div>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PT. MAJU MUNDUR SEJAHTERA", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Rekapitulasi Absensi Karyawan", 14, 26);
    doc.text(`Periode: ${selectedBulan} ${selectedTahun}`, 14, 31);
    
    doc.setDrawColor(249, 115, 22); 
    doc.setLineWidth(1);
    doc.line(14, 35, 196, 35);

    // Hanya mengambil rekap absen dari karyawan aktif yang sudah terverifikasi
    const karyawanAktif = karyawanList.filter(k => k.status !== 'pending');

    const tableRows = karyawanAktif.map((karyawan, index) => {
      const payrollPeriodeIni = payrolls.find(
        p => Number(p.karyawan_id) === Number(karyawan.id) && p.periode === `${selectedBulan} ${selectedTahun}`
      );

      // Langsung ambil data dari database, tidak perlu hitung pembagian lagi!
      const totalHariAbsen = payrollPeriodeIni 
        ? (payrollPeriodeIni.hari_absen || payrollPeriodeIni.absen || 0) 
        : 0;

      const nominalPotongan = payrollPeriodeIni ? Number(payrollPeriodeIni.potongan_absen) : 0;

      const formatRupiah = nominalPotongan > 0 
        ? `Rp ${nominalPotongan.toLocaleString('id-ID')}` 
        : 'Rp 0';

      return [
        index + 1,
        karyawan.nama,
        `${totalHariAbsen} Hari`,
        formatRupiah
      ];
    });

    autoTable(doc, {
      startY: 42,
      head: [['No', 'Nama Karyawan', 'Jumlah Absen', 'Total Potongan']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [249, 115, 22], 
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { halign: 'left' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 45, halign: 'right' } 
      }
    });

    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text(`Tangerang, ${new Date().toLocaleDateString('id-ID')}`, 140, finalY);
    doc.text("HRD Manager", 140, finalY + 5);
    doc.text("__________________", 140, finalY + 25);

    doc.save(`Rekap_Absen_${selectedBulan}_${selectedTahun}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-6 md:p-8">
      
      {/* HEADER UTAMA */}
      <header className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl p-6 shadow-md mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <i className="bi bi-graph-up-arrow"></i> Dashboard Executive HRD
          </h1>
          <p className="text-orange-100 mt-1 text-sm md:text-base">Kelola database karyawan dan Penggajian</p>
        </div>
        <div className="flex gap-2">
          <span className="bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse"></span> Sistem Online
          </span>
        </div>
      </header>

      {/* RINGKASAN KEUANGAN */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Kas Anggaran Perusahaan</p>
            <h3 className="text-2xl font-black text-gray-800">Rp {anggaranPerusahaan.toLocaleString('id-ID')}</h3>
            <span className="text-[10px] text-gray-400">*Batas alokasi dana HRD</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Total Pengeluaran Gaji</p>
            <h3 className="text-2xl font-black text-red-500">Rp {totalPengeluaranGaji.toLocaleString('id-ID')}</h3>
            <span className="text-xs text-red-400 font-medium">Beban operasional bulan ini</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase">Sisa Kas Internal</p>
            <h3 className="text-2xl font-black text-green-600">Rp {sisaKasPerusahaan.toLocaleString('id-ID')}</h3>
            <span className="text-xs text-gray-400 font-medium">Dana aman cadangan</span>
          </div>
        </div>
      </section>

      {/* GRID UTAMA */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
        
        {/* KOLOM KIRI: FORM ENTRIES */}
        <div className="space-y-6">
          
          {/* FORM TAMBAH / EDIT KARYAWAN */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <i className="bi bi-person-fill-add"></i> {editingKaryawanId ? 'Edit Karyawan' : 'Tambah Karyawan'}
              </span>
              {editingKaryawanId && (
                <button 
                  onClick={() => { setEditingKaryawanId(null); setFormKaryawan({ nama: '', jabatan: '', gaji_pokok: '', email: '', password: '' }); }}
                  className="text-xs text-red-500 hover:underline font-semibold"
                >
                  Batal Edit
                </button>
              )}
            </h2>
            <form onSubmit={handleSubmitKaryawan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Nama Karyawan</label>
                <input type="text" placeholder="Masukkan nama" className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" value={formKaryawan.nama} onChange={(e) => setFormKaryawan({...formKaryawan, nama: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Jabatan</label>
                <input type="text" placeholder="Contoh: Manajer IT" className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" value={formKaryawan.jabatan} onChange={(e) => setFormKaryawan({...formKaryawan, jabatan: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Gaji Pokok (Rp)</label>
                <input type="number" placeholder="Contoh: 5000000" className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" value={formKaryawan.gaji_pokok} onChange={(e) => setFormKaryawan({...formKaryawan, gaji_pokok: e.target.value})} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Email Karyawan</label>
                <input 
                  type="email" 
                  placeholder="Contoh: budi@company.com" 
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                  value={formKaryawan.email || ''} 
                  onChange={(e) => setFormKaryawan({ ...formKaryawan, email: e.target.value })}
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Password</label>
                <div className="relative flex items-center">
                  <input 
                    type={showPasswordKaryawan ? "text" : "password"} 
                    // Placeholder berubah dinamis agar admin tahu password boleh dikosongkan saat edit
                    placeholder={editingKaryawanId ? "Kosongkan jika tidak ingin diubah" : "Masukkan password login"} 
                    className="w-full p-2.5 pr-10 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={formKaryawan.password || ''} 
                    onChange={(e) => setFormKaryawan({ ...formKaryawan, password: e.target.value })}
                    // required otomatis FALSE saat mengedit (editingKaryawanId bernilai true)
                    required={!editingKaryawanId} 
                  />
                  <button
                    type="button"
                    className="absolute right-3 text-gray-400 hover:text-orange-500 focus:outline-none"
                    onClick={() => setShowPasswordKaryawan(!showPasswordKaryawan)}
                  >
                    <i className={`bi ${showPasswordKaryawan ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <button type="submit" className={`w-full text-white text-sm font-bold py-2.5 rounded-xl transition shadow-md flex items-center justify-center gap-2 ${editingKaryawanId ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-100' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'}`}>
                <i className={editingKaryawanId ? 'bi bi-floppy' : 'bi bi-plus-circle'}></i>
                {editingKaryawanId ? 'Simpan Perubahan' : 'Daftarkan Karyawan'}
              </button>
            </form>
          </div>

          {/* FORM PROSES GAJI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
              <i className="bi bi-wallet2"></i> Input Gaji & Tunjangan
            </h2>
            <form onSubmit={handleSubmitPayroll} className="space-y-4">

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Pilih Karyawan</label>
                <select 
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                  value={form.karyawan_id} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setForm({...form, karyawan_id: selectedId});
                    
                    // Gunakan Number() untuk memastikan ID cocok
                    const karyawanTerpilih = karyawanList.find(k => Number(k.id) === Number(selectedId));
                    if (karyawanTerpilih) {
                      if (jamLembur) {
                        const uangLemburPerJam = Math.round(karyawanTerpilih.gaji_pokok / 173);
                        setRpLembur(Math.round(parseFloat(jamLembur) * uangLemburPerJam));
                      } else {
                        setRpLembur('');
                      }
                      if (hariAbsen) {
                        const potonganAbsenPerHari = Math.round(karyawanTerpilih.gaji_pokok / 25);
                        setRpAbsen(Math.round(parseFloat(hariAbsen) * potonganAbsenPerHari));
                      } else {
                        setRpAbsen('');
                      }
                    }
                  }}
                >
                  {/* Hanya menampilkan karyawan yang statusnya aktif */}
                  {karyawanList.filter(k => k.status !== 'pending').map(k => (
                    <option key={k.id} value={k.id}>{k.nama} ({k.jabatan})</option>
                  ))}
                  {karyawanList.filter(k => k.status !== 'pending').length === 0 && (
                    <option value="">Belum ada karyawan aktif</option>
                  )}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="block text-xs font-semibold text-gray-500 mb-1">Periode Kerja</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    className="p-2.5 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 text-black transition"
                    value={selectedBulan}
                    onChange={(e) => setSelectedBulan(e.target.value)}
                    required
                  >
                    {listBulan.map((b, idx) => (
                      <option key={idx} value={b}>{b}</option>
                    ))}
                  </select>
                  <select
                    className="p-2.5 border rounded-xl bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 text-black transition"
                    value={selectedTahun}
                    onChange={(e) => setSelectedTahun(e.target.value)}
                    required
                  >
                    {listTahun.map((t, idx) => (
                      <option key={idx} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BARIS 1: INPUT JAM & RUPIAH LEMBUR */}
              <div className="grid grid-cols-2 gap-2 border-b pb-3 border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Lembur (Jam)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={jamLembur} 
                    onChange={(e) => handleJamLemburChange(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-600 mb-1">Rp Lembur</label>
                  <input 
                    type="number" 
                    placeholder="Rp 0" 
                    className="w-full p-2.5 border border-amber-300 rounded-xl bg-amber-50/50 text-sm font-semibold outline-none text-black focus:ring-2 focus:ring-amber-200 transition" 
                    value={rpLembur} 
                    onChange={(e) => setRpLembur(e.target.value)} 
                  />
                </div>
              </div>

              {/* BARIS 2: BONUS & BPJS */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Bonus (Rp)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={form.bonus} 
                    onChange={(e) => setForm({...form, bonus: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Potongan BPJS</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={form.bpjs} 
                    onChange={(e) => setForm({...form, bpjs: e.target.value})} 
                  />
                </div>
              </div>

              {/* BARIS 3: INPUT HARI ABSEN & POTONGAN RUPIAH */}
              <div className="grid grid-cols-2 gap-2 border-t pt-3 mt-1 border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Absen</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition" 
                    value={hariAbsen} 
                    onChange={(e) => handleHariAbsenChange(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-red-600 mb-1">Rp Absen</label>
                  <input 
                    type="number" 
                    placeholder="Rp 0" 
                    className="w-full p-2.5 border border-red-300 rounded-xl bg-red-50/50 text-sm font-semibold outline-none text-black focus:ring-2 focus:ring-red-200 transition" 
                    value={rpAbsen} 
                    onChange={(e) => setRpAbsen(e.target.value)} 
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-orange-100">
                <i className="bi bi-check-circle"></i> Hitung & Terbitkan Gaji
              </button>
            </form>
          </div>

        </div>

        {/* KOLOM KANAN: WAITING LIST & DATABASE KARYAWAN */}
        <div className="space-y-6 xl:col-span-2">
          
          {/* 1. WAITING LIST KARYAWAN BARU (Hanya tampil jika ada yang berstatus 'pending') */}
          {karyawanList.filter(k => k.status === 'pending').length > 0 && (
            <div className="bg-amber-50/50 border border-amber-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-black text-amber-800 mb-3 flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                Butuh Verifikasi Akun Baru
              </h2>
              <div className="overflow-x-auto bg-white rounded-xl border border-amber-100 shadow-sm">
                <table className="w-full text-left table-auto text-sm">
                  <thead>
                    <tr className="bg-amber-100/50 text-amber-800 text-xs uppercase tracking-wider font-bold">
                      <th className="p-3">Nama</th>
                      <th className="p-3">Jabatan</th>
                      <th className="p-3">Email</th>
                      <th className="p-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    {karyawanList.filter(k => k.status === 'pending').map((k) => (
                      <tr key={k.id} className="hover:bg-amber-50/20 transition">
                        <td className="p-3 font-bold text-gray-900">{k.nama}</td>
                        <td className="p-3 font-medium">{k.jabatan}</td>
                        <td className="p-3 text-xs">{k.email}</td>
                        <td className="p-3 flex justify-center gap-2">
                          <button 
                            onClick={() => handleApproveKaryawan(k.id)} 
                            className="bg-green-600 text-white font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1 shadow-sm"
                          >
                            <i className="bi bi-check-lg"></i> Setujui
                          </button>
                          <button 
                            onClick={() => handleDeleteKaryawan(k.id)} 
                            className="bg-red-50 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                          >
                            <i className="bi bi-x-lg"></i> Tolak
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. TABEL DATABASE KARYAWAN AKTIF */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 mb-4 gap-2">
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                <i className="bi bi-people-fill"></i> Database Karyawan Perusahaan
              </h2>
              {/* TOMBOL EKSPOR PDF REKAP ABSEN */}
              <button
                onClick={handleDownloadPDF}
                className="bg-gray-100 border border-gray-200 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <i className="bi bi-file-earmark-pdf-fill text-red-500"></i> Ekspor PDF Rekap Absen
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="p-3.5 rounded-l-lg">Nama</th>
                    <th className="p-3.5">Jabatan</th>
                    <th className="p-3.5">Gaji Pokok</th>
                    <th className="p-3.5 text-center rounded-r-lg">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-600">
                  {karyawanList.filter(k => k.status !== 'pending').map((k) => (
                    <tr key={k.id} className="hover:bg-orange-50/30 transition">
                      <td className="p-3.5 font-bold text-gray-900">{k.nama}</td>
                      <td className="p-3.5 font-medium">{k.jabatan}</td>
                      <td className="p-3.5 font-semibold text-green-600">Rp {k.gaji_pokok.toLocaleString('id-ID')}</td>
                      <td className="p-3.5 flex justify-center gap-2">
                        <button 
                          onClick={() => handleStartEdit(k)} 
                          className="bg-amber-50 text-amber-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-amber-100 transition flex items-center gap-1"
                        >
                          <i className="bi bi-pencil-square"></i> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteKaryawan(k.id)} 
                          className="bg-red-50 text-red-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-100 transition flex items-center gap-1"
                        >
                          <i className="bi bi-trash"></i> Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {karyawanList.filter(k => k.status !== 'pending').length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-gray-400">Belum ada karyawan terdaftar, Blay.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* SECTION 3: TABEL RIWAYAT TRANSAKSI */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-extrabold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
          <i className="bi bi-journal-text"></i> Riwayat Transaksi & Slip Gaji Terbit
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="p-3.5 rounded-l-lg">Nama / Jabatan</th>
                <th className="p-3.5">Periode</th>
                <th className="p-3.5">Rincian Komponen</th>
                <th className="p-3.5">Gaji Bersih</th>
                <th className="p-3.5 text-center rounded-r-lg">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-gray-600">
              {payrolls.map((p, idx) => (
                <tr key={idx} className="hover:bg-orange-50/20 transition">
                  <td className="p-3.5">
                    <div className="font-bold text-gray-900">{p.nama}</div>
                    <div className="text-xs text-gray-400">{p.jabatan}</div>
                  </td>
                  <td className="p-3.5 font-semibold text-gray-700">{p.periode}</td>
                  <td className="p-3.5 text-xs space-y-0.5">
                    <div>Pokok: Rp {p.gaji_pokok.toLocaleString('id-ID')}</div>
                    <div className="text-green-600 font-medium">Lembur: +Rp {p.tunjangan_lembur.toLocaleString('id-ID')}</div>
                    <div className="text-green-600 font-medium">Bonus: +Rp {p.tunjangan_bonus.toLocaleString('id-ID')}</div>
                    <div className="text-red-500 font-medium">Potongan: -Rp {(p.potongan_bpjs + p.potongan_absen).toLocaleString('id-ID')}</div>
                  </td>
                  <td className="p-3.5 font-black text-green-600 text-base">Rp {p.gaji_bersih.toLocaleString('id-ID')}</td>
                  <td className="p-3.5 text-center">
                    <button onClick={() => handlePrintSlip(p)} className="bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition flex items-center gap-1 mx-auto shadow-sm">
                      <i className="bi bi-printer"></i> Cetak Slip
                    </button>
                  </td>
                </tr>
              ))}
              {payrolls.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center p-8 text-gray-400">Belum ada slip gaji yang diproses.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL CUSTOM VERIFIKASI GAJI POKOK */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 relative animate-scale-up">
            
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <i className="bi bi-check-circle-fill text-orange-500"></i> Verifikasi Akun Karyawan
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Tentukan nominal gaji pokok sebelum mengaktifkan akun karyawan ini agar sistem penggajian otomatis dapat berjalan.
            </p>

            <form onSubmit={handleConfirmVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Gaji Pokok (Rp)</label>
                <input 
                  type="number" 
                  placeholder="Contoh: 4500000" 
                  className="w-full p-2.5 border rounded-xl bg-gray-50 text-sm outline-none text-black focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition"
                  value={inputGajiPokok}
                  onChange={(e) => setInputGajiPokok(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold rounded-xl transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition shadow-md shadow-orange-100 flex items-center justify-center gap-1"
                >
                  <i className="bi bi-check-lg"></i> Aktifkan Karyawan
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}