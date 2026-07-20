import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./payroll.db', (err) => {
    if (err) console.error('Gagal koneksi database:', err.message);
    else console.log('Terhubung ke database SQLite (payroll.db).');
});

// Otomatis bikin tabel pas server dinyalain pertama kali
db.serialize(() => {
    // 1. Tabel Karyawan (Sudah ditambahkan kolom status)
    db.run(`CREATE TABLE IF NOT EXISTS karyawan (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nama TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        jabatan TEXT,
        gaji_pokok REAL DEFAULT 0,
        role TEXT DEFAULT 'karyawan',
        status TEXT DEFAULT 'pending'
    )`, () => {
        // Otomatis isi 1 karyawan dummy buat testing login (role admin/karyawan)
        // Kita set status Budi langsung 'active' biar langsung bisa dipakai testing
        db.run(`INSERT OR IGNORE INTO karyawan (id, nama, email, password, jabatan, gaji_pokok, role, status) 
                VALUES (1, 'Budi Santoso', 'budi@company.com', 'budi123', 'Staff IT', 5000000, 'karyawan', 'active')`);
    });

    // 2. Tabel Payroll (Slip Gaji)
    db.run(`CREATE TABLE IF NOT EXISTS payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    karyawan_id INTEGER,
    periode TEXT NOT NULL,
    tunjangan_lembur REAL DEFAULT 0,
    tunjangan_bonus REAL DEFAULT 0,
    potongan_bpjs REAL DEFAULT 0,
    potongan_absen REAL DEFAULT 0,
    gaji_bersih REAL DEFAULT 0,
    hari_absen INTEGER DEFAULT 0,  -- Tambahkan baris ini
    status TEXT DEFAULT 'Paid',
    FOREIGN KEY(karyawan_id) REFERENCES karyawan(id)
)`);
});

export default db;