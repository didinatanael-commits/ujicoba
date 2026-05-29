/**
 * =========================================================================
 * FILE: js/config.js
 * FUNGSINYA: Berkas penampung konfigurasi variabel global aplikasi,
 * state aktif sistem, data tiruan default harian (mock data), kategori specialty,
 * serta standardisasi rujukan variabel database luring (Local Storage).
 * =========================================================================
 */

// ==========================================
// BAGIAN 1: DATA KHUSUS FORM DROPDOWN (STANDARDISASI GUBENG)
// ==========================================

// 1. Data default spesialisasi bidang penanganan pada dropdown form utama
let specialtiesData = JSON.parse(localStorage.getItem('he_specialties_local')) || [
    "Civil / Construction", 
    "Electrical", 
    "Plumbing", 
    "HVAC / Cooling", 
    "Kitchen & Laundry", 
    "General"
];

// 2. Data tipe tindakan pemeliharaan pada dropdown form utama
let maintenanceTypesData = JSON.parse(localStorage.getItem('he_maintenance_types_local')) || [
    "Corrective (Repair)", 
    "Preventive (Maintenance)", 
    "Installation"
];

// ==========================================
// BAGIAN 2: DATA TIRUAN AWAL (MOCK DATA & USERS)
// ==========================================

// 3. Database penampung logbook contoh harian agar tabel tidak kosong di awal
let logbookData = JSON.parse(localStorage.getItem('he_logbook_local')) || [
    {
        id: "1716801000000",
        tanggal: "2026-05-28",
        shift: "Syif 1 (Pagi)",
        teknisi: "Budi (Teknisi 2)",
        category: "Kitchen",
        area: "Main Kitchen Hotel",
        detail: "Maintenance unit gas stove burner nomor 3 karena nyala api merah dan tidak merata. Pembersihan kerak karbon burner cap.",
        time_start: "08:30",
        time_finish: "09:45",
        status: "Selesai",
        admin_notes: "Burner dibersihkan secara terjadwal setiap 3 bulan.",
        photos: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=450&auto=format&fit=crop"],
        specialty: "General",
        maintenance_type: "Preventive (Maintenance)",
        audit_log: ""
    }
];

// 4. Database akun pengguna bawaan awal sistem (Default staff Harris)
let usersData = JSON.parse(localStorage.getItem('he_users_local')) || [
    { username: 'admin', name: 'Chief Engineering (Admin)', role: 'admin', password: 'admin123' },
    { username: 'teknisi1', name: 'Ahmad (Teknisi 1)', role: 'user', password: '123' },
    { username: 'teknisi2', name: 'Budi (Teknisi 2)', role: 'user', password: '123' }
];

// ==========================================
// BAGIAN 3: VARIABEL STATUS & STATE GLOBAL
// ==========================================

// 5. Global state controller penampung data dinamis halaman web berjalan
let currentRole = null;             // Menyimpan role akun masuk ('admin' atau 'user')
let currentUserName = null;         // Menyimpan nama lengkap akun masuk
let activeCategory = '';            // Kategori aktif form utama
let activeModalCategory = '';       // Kategori aktif form modal popup edit
let googleSheetsURL = localStorage.getItem('he_sheets_url') || ''; // Tautan spreadsheet harian
let selectedPhotosBase64 = [];      // Array foto terlampir form utama
let selectedModalPhotosBase64 = []; // Array foto terlampir form modal popup edit
let onConfirmCallback = null;       // Callback fungsi konfirmasi tombol hapus data harian

// 6. Variabel status lembaran terpaginasi pop-up filter pencarian global
let currentSearchPage = 1;          // Indeks halaman popup aktif saat ini
const itemsPerSearchPage = 10;      // Batas maksimum baris data per halaman popup
let globalFilteredData = [];        // Data pencarian terfilter sementara