/**
 * =========================================================================
 * FILE: js/ui.js
 * FUNGSINYA: Berkas modul pengatur interaksi antarmuka pengguna (UI).
 * Mengontrol notifikasi alert toast dinamis, transisi perpindahan halaman,
 * buka-tutup modal pengaturan, konfirmasi kustom, dan zoom lightbox foto.
 * =========================================================================
 */

// ==========================================
// BAGIAN 1: MANAJEMEN NOTIFIKASI ALERT TOAST
// ==========================================

/**
 * Memunculkan Kotak Notifikasi / Toast Alert dinamis secara instan
 * @param {string} msg - Isi pesan yang ingin ditampilkan
 * @param {string} type - Tipe alert ('success', 'error', atau 'info')
 */
function showAlert(msg, type) {
    const box = document.getElementById('alert-box');
    const iconContainer = document.getElementById('alert-icon-container');
    if (!box) return;

    // Bersihkan isi ikon lama
    if (iconContainer) iconContainer.innerHTML = '';

    // Atur visual box & ikon berdasarkan tipe pesan
    if (type === 'success') {
        box.className = "mb-6 p-4 rounded-2xl border flex items-start space-x-3 shadow-md transition-all duration-300 bg-emerald-50 text-emerald-800 border-emerald-200";
        if (iconContainer) iconContainer.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>';
    } else if (type === 'error') {
        box.className = "mb-6 p-4 rounded-2xl border flex items-start space-x-3 shadow-md transition-all duration-300 bg-red-50 text-red-800 border-red-200";
        if (iconContainer) iconContainer.innerHTML = '<i data-lucide="alert-circle" class="w-5 h-5 text-red-600"></i>';
    } else {
        box.className = "mb-6 p-4 rounded-2xl border flex items-start space-x-3 shadow-md transition-all duration-300 bg-indigo-50 text-indigo-800 border-indigo-200";
        if (iconContainer) iconContainer.innerHTML = '<i data-lucide="info" class="w-5 h-5 text-indigo-600"></i>';
    }

    document.getElementById('alert-message').innerText = msg;
    box.classList.remove('hidden');

    // Otomatis hilangkan dalam 5 detik
    setTimeout(() => {
        box.classList.add('hidden');
    }, 5000);

    lucide.createIcons();
}

/**
 * Menutup secara manual Kotak Notifikasi / Toast Alert
 */
function closeAlert() {
    const box = document.getElementById('alert-box');
    if (box) box.classList.add('hidden');
    const debugBox = document.getElementById('alert-debug');
    if (debugBox) debugBox.classList.add('hidden');
}


// ==========================================
// BAGIAN 2: TRANSISI HALAMAN & MENU NAVIGASI
// ==========================================

/**
 * Mengatur perpindahan seksi halaman utama (Halaman Login vs Dashboard Aplikasi)
 * @param {string} name - Nama seksi halaman target ('login' atau 'dashboard')
 */
function showSection(name) {
    const loginSec = document.getElementById('login-section');
    const dashSec = document.getElementById('dashboard-section');
    if (loginSec) {
        loginSec.className = name === 'login' ? 'max-w-md mx-auto my-8 space-y-6' : 'hidden';
    }
    if (dashSec) {
        dashSec.className = name === 'dashboard' ? 'space-y-6' : 'hidden';
    }
}

/**
 * Membuka atau Menutup Modal Pengaturan Tautan Google Apps Script (Set URL)
 * @param {boolean} show - Menentukan apakah modal dibuka (true) atau ditutup (false)
 */
function toggleSetupModal(show) {
    const setupModal = document.getElementById('setup-modal');
    if (setupModal) {
        if (show) {
            setupModal.classList.remove('hidden');
            const input = document.getElementById('sheet-api-url');
            if (input) input.value = localStorage.getItem('he_sheets_url') || '';
        } else {
            setupModal.classList.add('hidden');
        }
    }
}


// ==========================================
// BAGIAN 3: DIALOG KONFIRMASI KUSTOM (CONFIRM MODAL)
// ==========================================

/**
 * Membuka Dialog Modal Konfirmasi Tindakan Kritis (Pengganti window.confirm bawaan peramban)
 * @param {string} title - Judul dialog konfirmasi
 * @param {string} message - Isi pesan konfirmasi tindakan
 * @param {function} callback - Fungsi yang akan dieksekusi jika pengguna menekan tombol "Ya"
 */
function showConfirmModal(title, message, callback) {
    const confirmModal = document.getElementById('confirm-modal');
    if (!confirmModal) return;

    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    onConfirmCallback = callback;
    
    confirmModal.classList.remove('hidden');
    confirmModal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in';
    
    const yesBtn = document.getElementById('btn-confirm-yes');
    if (yesBtn) {
        yesBtn.onclick = function() {
            closeConfirmModal(true);
        };
    }
}

/**
 * Menutup Dialog Modal Konfirmasi Tindakan Kritis
 * @param {boolean} confirmed - Status keputusan pengguna (true jika "Ya" ditekan)
 */
function closeConfirmModal(confirmed) {
    const confirmModal = document.getElementById('confirm-modal');
    if (confirmModal) confirmModal.classList.add('hidden');
    if (confirmed && typeof onConfirmCallback === 'function') {
        onConfirmCallback();
    }
    onConfirmCallback = null;
}


// ==========================================
// BAGIAN 4: LIGHTBOX PREVIEWER MULTI-FOTO
// ==========================================

/**
 * Membuka Lightbox untuk membesarkan foto dokumentasi secara penuh (zoom)
 * @param {string} url - Alamat gambar/tautan base64 foto yang akan dizoom
 */
function openLightbox(url) {
    const modal = document.getElementById('lightbox-modal');
    const img = document.getElementById('lightbox-img');
    if (modal && img) {
        img.src = url;
        modal.classList.remove('hidden');
    }
}

/**
 * Menutup pembesar foto Lightbox
 */
function closeLightbox() {
    const modal = document.getElementById('lightbox-modal');
    if (modal) modal.classList.add('hidden');
}


// ==========================================
// BAGIAN 5: POP-UP MODAL PENCARIAN TERPAGINASI
// ==========================================

/**
 * Membuka pop-up panel modal pencarian terpaginasi (pencarian teks dan kustom tanggal)
 * @param {Array} data - Array data hasil pencarian terfilter
 */
function openPaginatedSearchModal(data) {
    globalFilteredData = data;
    currentSearchPage = 1;
    renderPaginatedSearchTable();
    const modal = document.getElementById('paginated-search-modal');
    if (modal) modal.classList.remove('hidden');
}

/**
 * Menutup pop-up panel modal pencarian terpaginasi
 */
function closePaginatedSearchModal() {
    const modal = document.getElementById('paginated-search-modal');
    if (modal) modal.classList.add('hidden');
}