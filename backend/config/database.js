import pg from 'pg';
import sqlite3 from 'sqlite3';

const { Pool } = pg;
let db;

// Cek apakah ada DATABASE_URL dari Vercel/Supabase
if (process.env.DATABASE_URL) {
    console.log('Menggunakan database Cloud PostgreSQL (Supabase).');
    db = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Wajib diaktifkan untuk koneksi Vercel ke Supabase
    });

    // Jalankan query pembuatan tabel otomatis untuk PostgreSQL
    db.query(`
        CREATE TABLE IF NOT EXISTS karyawan (
            id SERIAL PRIMARY KEY,
            nama TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            jabatan TEXT,
            gaji_pokok NUMERIC DEFAULT 0,
            role TEXT DEFAULT 'karyawan',
            status TEXT DEFAULT 'pending'
        );
    `).then(() => {
        // Otomatis isi 1 karyawan dummy buat testing login
        db.query(`
            INSERT INTO karyawan (id, nama, email, password, jabatan, gaji_pokok, role, status) 
            VALUES (1, 'Budi Santoso', 'budi@company.com', 'budi123', 'Staff IT', 5000000, 'karyawan', 'active')
            ON CONFLICT (email) DO NOTHING;
        `);
    });

    db.query(`
        CREATE TABLE IF NOT EXISTS payroll (
            id SERIAL PRIMARY KEY,
            karyawan_id INTEGER REFERENCES karyawan(id),
            periode TEXT NOT NULL,
            tunjangan_lembur NUMERIC DEFAULT 0,
            tunjangan_bonus NUMERIC DEFAULT 0,
            potongan_bpjs NUMERIC DEFAULT 0,
            potongan_absen NUMERIC DEFAULT 0,
            gaji_bersih NUMERIC DEFAULT 0,
            hari_absen INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Paid'
        );
    `);

    // Fungsi tiruan .run() agar query SQLite otomatis cocok ke PostgreSQL
    db.run = function (query, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        let index = 1;
        const pgQuery = query.replace(/\?/g, () => `$${index++}`);
        
        db.query(pgQuery, params)
          .then(res => callback && callback(null, res))
          .catch(err => {
              console.error("Error pada db.run:", err.message);
              if (callback) callback(err);
          });
    };

    // Fungsi tiruan .all() agar query SQLite otomatis cocok ke PostgreSQL
    db.all = function (query, params, callback) {
        if (typeof params === 'function') { callback = params; params = []; }
        let index = 1;
        const pgQuery = query.replace(/\?/g, () => `$${index++}`);
        
        db.query(pgQuery, params)
          .then(res => callback && callback(null, res.rows))
          .catch(err => {
              console.error("Error pada db.all:", err.message);
              if (callback) callback(err);
          });
    };

} else {
    // Mode fallback: Pakai SQLite lokal jika di komputer sendiri tanpa internet
    console.log('Menggunakan database Lokal SQLite (payroll.db).');
    db = new sqlite3.Database('./payroll.db');
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS karyawan (id INTEGER PRIMARY KEY AUTOINCREMENT, nama TEXT, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, jabatan TEXT, gaji_pokok REAL DEFAULT 0, role TEXT DEFAULT 'karyawan', status TEXT DEFAULT 'pending')`);
        db.run(`INSERT OR IGNORE INTO karyawan (id, nama, email, password, jabatan, gaji_pokok, role, status) VALUES (1, 'Budi Santoso', 'budi@company.com', 'budi123', 'Staff IT', 5000000, 'karyawan', 'active')`);
        db.run(`CREATE TABLE IF NOT EXISTS payroll (id INTEGER PRIMARY KEY AUTOINCREMENT, karyawan_id INTEGER, periode TEXT NOT NULL, tunjangan_lembur REAL DEFAULT 0, tunjangan_bonus REAL DEFAULT 0, potongan_bpjs REAL DEFAULT 0, potongan_absen REAL DEFAULT 0, gaji_bersih REAL DEFAULT 0, hari_absen INTEGER DEFAULT 0, status TEXT DEFAULT 'Paid', FOREIGN KEY(karyawan_id) REFERENCES karyawan(id))`);
    });
}

export default db;