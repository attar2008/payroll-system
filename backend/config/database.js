import pg from 'pg';

const { Pool } = pg;

// Mengambil string koneksi database
const connectionString = process.env.DATABASE_URL;

console.log('Memaksa koneksi ke database Cloud PostgreSQL (Supabase)...');

const db = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

// Pembuatan tabel otomatis di Supabase secara aman
async function initDatabase() {
    try {
        await db.query(`
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
        `);

        await db.query(`
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

        // Insert Budi langsung sebagai Admin aktif
        await db.query(`
            INSERT INTO karyawan (id, nama, email, password, jabatan, gaji_pokok, role, status) 
            VALUES (1, 'Budi Santoso', 'budi@company.com', 'budi123', 'Admin IT', 5000000, 'admin', 'active')
            ON CONFLICT (email) DO NOTHING;
        `);
        console.log("Struktur database PostgreSQL berhasil diverifikasi.");
    } catch (err) {
        console.error("Gagal inisialisasi tabel Supabase:", err.message);
    }
}

initDatabase();

// ==========================================
// MIGRASI FUNGSI WRAPPER: SQLITE -> POSTGRES
// ==========================================

// 1. Perbaikan fungsi db.run()
db.run = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    db.query(pgQuery, params, (err, res) => {
        if (callback) callback(err, res);
    });
};

// 2. Perbaikan fungsi db.all()
db.all = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    db.query(pgQuery, params, (err, res) => {
        if (callback) {
            callback(err, res ? res.rows : null);
        }
    });
};

// 3. Perbaikan fungsi db.get()
db.get = function (query, params, callback) {
    if (typeof params === 'function') { callback = params; params = []; }
    
    let index = 1;
    const pgQuery = query.replace(/\?/g, () => `$${index++}`);
    
    db.query(pgQuery, params, (err, res) => {
        if (callback) {
            callback(err, res && res.rows ? res.rows[0] : null);
        }
    });
};

export default db;