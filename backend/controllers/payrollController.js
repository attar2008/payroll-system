import db from '../config/database.js';


// Ambil semua data slip gaji (Untuk Sisi Admin)
export const getAllPayroll = (req, res) => {
    const query = `
        SELECT p.*, k.nama, k.jabatan, k.gaji_pokok 
        FROM payroll p 
        JOIN karyawan k ON p.karyawan_id = k.id
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

export const createPayroll = (req, res) => {
    // 1. Tangkap hari_absen dari request body
    const { karyawan_id, periode, lembur, bonus, bpjs, potongan_absen, hari_absen } = req.body;

    db.get(`SELECT gaji_pokok FROM karyawan WHERE id = ?`, [karyawan_id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Karyawan tidak ditemukan' });

        const gajiPokok = row.gaji_pokok;
        
        // Kalkulasi Akhir Gaji Bersih
        const gajiBersih = (gajiPokok + parseFloat(lembur || 0) + parseFloat(bonus || 0)) - (parseFloat(bpjs || 0) + parseFloat(potongan_absen || 0));

        // 2. Sesuaikan query dengan jumlah tanda tanya (?) yang benar
        const query = `INSERT INTO payroll (karyawan_id, periode, tunjangan_lembur, tunjangan_bonus, potongan_bpjs, potongan_absen, gaji_bersih, hari_absen, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Paid')`;
        
        db.run(query, [karyawan_id, periode, lembur, bonus, bpjs, potongan_absen, gajiBersih, hari_absen], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Payroll berhasil diproses!', id: this.lastId });
        });
    });
};
// Ambil riwayat slip gaji sendiri (Untuk Sisi Karyawan)
export const getSlipKaryawan = (req, res) => {
    const { id } = req.params;
    const query = `
        SELECT p.*, k.nama, k.jabatan, k.gaji_pokok 
        FROM payroll p 
        JOIN karyawan k ON p.karyawan_id = k.id 
        WHERE k.id = ? 
        ORDER BY p.id DESC
    `;
    db.all(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};


// Ambil semua daftar karyawan untuk dropdown
export const getKaryawan = (req, res) => {
    const query = `SELECT * FROM karyawan ORDER BY nama ASC`;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

// Tambah data karyawan baru oleh Admin
export const createKaryawan = (req, res) => {
    // Kita tangkap email dan password dari form input Admin
    const { nama, jabatan, gaji_pokok, email, password } = req.body;
    const role = 'karyawan'; // Otomatis diset sebagai karyawan

    const query = `INSERT INTO karyawan (nama, email, password, jabatan, gaji_pokok, role) VALUES (?, ?, ?, ?, ?, ?)`;

    db.run(query, [nama, email, password, jabatan, parseFloat(gaji_pokok || 0), role], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Karyawan baru berhasil ditambahkan, Blay!', id: this.lastId });
    });
};

// Fungsi untuk karyawan ubah password sendiri
export const updatePasswordKaryawan = (req, res) => {
    const { id } = req.params;
    const { password_baru } = req.body;

    if (!password_baru) {
        return res.status(400).json({ error: 'Password baru tidak boleh kosong, Blay!' });
    }

    const query = `UPDATE karyawan SET password = ? WHERE id = ?`;

    db.run(query, [password_baru, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Karyawan tidak ditemukan!' });
        
        res.json({ message: 'Password kamu berhasil diperbarui!' });
    });
};