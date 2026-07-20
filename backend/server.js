import express from 'express';
import cors from 'cors';
import db from './config/database.js';
import {
    getAllPayroll,
    createPayroll,
    getKaryawan,
    createKaryawan,
    getSlipKaryawan,
    updatePasswordKaryawan 
} from './controllers/payrollController.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(cors());
app.use(express.json());

// =========================================================================
// AUTH ENDPOINT (Sistem Login)
// =========================================================================
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    // Hardcoded Super Admin (Bypass Database)
    if (email === 'admin@company.com' && password === 'admin123') {
        return res.json({ id: 999, nama: 'Super Admin HRD', role: 'admin', status: 'active' });
    }

    db.get(`SELECT id, nama, role, status FROM karyawan WHERE email = ? AND password = ?`, [email, password], (err, row) => {
        if (err) {
            console.error("Login Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: 'Email atau Password salah' });
        }
        res.json(row);
    });
});

// =========================================================================
// ROUTE ENDPOINT - PAYROLL
// =========================================================================
app.get('/api/payroll', getAllPayroll);
app.post('/api/payroll', createPayroll);
app.get('/api/payroll/karyawan/:id', getSlipKaryawan);
app.put('/api/karyawan/ubah-password/:id', updatePasswordKaryawan);

// =========================================================================
// ROUTE ENDPOINT - KARYAWAN
// =========================================================================

// AMBIL SEMUA KARYAWAN
app.get('/api/karyawan', (req, res) => {
  const query = "SELECT id, nama, email, jabatan, gaji_pokok, role, status FROM karyawan";
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows || []);
  });
});

// TAMBAH KARYAWAN BARU / DAFTAR BARU (Dibuat otomatis ACTIVE & ADMIN biar langsung bisa masuk!)
app.post('/api/karyawan', (req, res) => {
  const { nama, email, password, jabatan, gaji_pokok } = req.body;
  
  // Paksa role admin dan status active supaya tidak nyangkut di luar
  const finalStatus = 'active'; 
  const finalRole = 'admin'; 
  const nominalGaji = gaji_pokok || 0;

  const query = `
    INSERT INTO karyawan (nama, email, password, jabatan, gaji_pokok, role, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id
  `;
  
  db.run(query, [nama, email, password, jabatan, nominalGaji, finalRole, finalStatus], function(err, result) {
    if (err) {
      console.error("Pendaftaran Gagal:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ 
      id: result && result.rows && result.rows[0] ? result.rows[0].id : 1, 
      message: "Karyawan berhasil didaftarkan!" 
    });
  });
});

// EDIT / UPDATE DATA KARYAWAN
app.put('/api/karyawan/:id', (req, res) => {
    const { id } = req.params;
    const { nama, jabatan, gaji_pokok, gaji, email, password } = req.body;
    const nominalGaji = gaji_pokok || gaji;

    if (!nama || !jabatan || !nominalGaji) {
        return res.status(400).json({ error: "Kolom data update tidak boleh ada yang kosong!" });
    }

    const finalEmail = email || `${nama.toLowerCase().replace(/\s+/g, '')}@company.com`;
    const finalPassword = password || '123456';

    const query = `UPDATE karyawan SET nama = ?, jabatan = ?, gaji_pokok = ?, email = ?, password = ? WHERE id = ?`;
    db.run(query, [nama, jabatan, parseFloat(nominalGaji), finalEmail, finalPassword, id], function(err) {
        if (err) {
            console.error("Database Update Error:", err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Data karyawan berhasil diupdate!' });
    });
});

// Endpoint verifikasi / aktifkan akun karyawan
app.put('/api/karyawan/:id/verify', (req, res) => {
  const { id } = req.params;
  const { gaji_pokok } = req.body;

  if (gaji_pokok === undefined || gaji_pokok === null || isNaN(gaji_pokok)) {
    return res.status(400).json({ error: "Gaji pokok harus diisi dengan angka yang valid!" });
  }

  const query = "UPDATE karyawan SET status = 'active', gaji_pokok = ? WHERE id = ?";

  db.run(query, [gaji_pokok, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: "Akun karyawan berhasil diaktifkan dengan gaji pokok terdaftar!" });
  });
});

// HAPUS KARYAWAN
app.delete('/api/karyawan/:id', (req, res) => {
    const { id } = req.params;
    const query = `DELETE FROM karyawan WHERE id = ?`;
    
    db.run(query, [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Karyawan berhasil dihapus!' });
    });
});

// =========================================================================
// JALANKAN SERVER
// =========================================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend Payroll jalan di port ${PORT}`);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});