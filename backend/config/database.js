import pg from 'pg';

const { Pool } = pg;

// Ambil string koneksi, jika di komputer lokal belum ada env, pakai string Supabase kamu langsung
const connectionString = process.env.DATABASE_URL || "ISI_DENGAN_URI_SUPABASE_KAMU_JIKA_INGIN_DI_LOKAL";

console.log('Memaksa koneksi ke database Cloud PostgreSQL (Supabase)...');

const db = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

// Pembuatan tabel otomatis
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
    // Set Budi Santoso langsung sebagai 'admin' dan 'active' agar bisa login dan menyetujui akun lain
    db.query(`
        INSERT INTO karyawan (id, nama, email, password, jabatan, gaji_pokok, role, status) 
        VALUES (1, 'Budi Santoso', 'budi@company.com', 'budi123', 'Admin IT', 5000000, 'admin', 'active')
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

// Fungsi tiruan .run()
db.run = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    db.query(pgQuery, params)
      .then(res => callback && callback(null, res))
      .catch(err => { console.error("Error db.run:", err.message); if (callback) callback(err); });
};

// Fungsi tiruan .all()
db.all = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    db.query(pgQuery, params)
      .then(res => callback && callback(null, res.rows))
      .catch(err => { console.error("Error db.all:", err.message); if (callback) callback(err); });
};

// Fungsi tiruan .get() untuk mengambil satu baris data (PENTING untuk login/register)
db.get = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    db.query(pgQuery, params)
      .then(res => callback && callback(null, res.rows[0] || null))
      .catch(err => { console.error("Error db.get:", err.message); if (callback) callback(err); });
};

export default db;