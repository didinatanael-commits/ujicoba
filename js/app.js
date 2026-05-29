/**
 * =========================================================================
 * FILE: js/app.js
 * FUNGSINYA: Berkas pengikat and controller utama aplikasi.
 * Menyambungkan seluruh komponen modul terpisah, menangani filter saringan data,
 * manajemen dropdown dinamis, and inisialisasi awal window.onload.
 * =========================================================================
 */

// ==========================================
// BAGIAN 1: MANAJEMEN DROPDOWN & INPUT KATEGORI
// ==========================================

/**
 * Mengisi pilihan bidang kepakaran & jenis pemeliharaan pada form input utama
 */
function populateFormDropdowns() {
    const specialtySelect = document.getElementById('job-specialty');
    const maintenanceSelect = document.getElementById('job-maintenance-type');
    if (!specialtySelect || !maintenanceSelect) return;

    specialtySelect.innerHTML = `<option value="" disabled selected>Pilih Bidang...</option>`;
    specialtiesData.forEach(item => { 
        specialtySelect.innerHTML += `<option value="${item}">${item}</option>`; 
    });

    maintenanceSelect.innerHTML = `<option value="" disabled selected>Pilih Jenis...</option>`;
    maintenanceTypesData.forEach(item => { 
        maintenanceSelect.innerHTML += `<option value="${item}">${item}</option>`; 
    });
}

/**
 * Mengisi pilihan bidang kepakaran & jenis pemeliharaan pada form modal edit popup
 */
function populateModalDropdowns() {
    const specialtySelect = document.getElementById('modal-job-specialty');
    const maintenanceSelect = document.getElementById('modal-job-maintenance-type');
    if (!specialtySelect || !maintenanceSelect) return;

    specialtySelect.innerHTML = `<option value="" disabled selected>Pilih Bidang...</option>`;
    specialtiesData.forEach(item => { 
        specialtySelect.innerHTML += `<option value="${item}">${item}</option>`; 
    });

    maintenanceSelect.innerHTML = `<option value="" disabled selected>Pilih Jenis...</option>`;
    maintenanceTypesData.forEach(item => { 
        maintenanceSelect.innerHTML += `<option value="${item}">${item}</option>`; 
    });
}

/**
 * Mengatur seleksi tombol kategori area pada formulir input utama
 * @param {string} cat - Nama kategori area ('Guest Room', 'Meeting Room', dll)
 */
function selectCategory(cat) {
    activeCategory = cat;
    document.getElementById('job-category').value = cat;
    ['cat-room', 'cat-meeting', 'cat-public', 'cat-event', 'cat-kitchen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center border-slate-200 text-slate-600 bg-white";
    });
    
    let targetId = cat === 'Guest Room' ? 'cat-room' : 
                   cat === 'Meeting Room' ? 'cat-meeting' : 
                   cat === 'Public Area' ? 'cat-public' :
                   cat === 'Event' ? 'cat-event' : 'cat-kitchen';
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        if (cat === 'Kitchen') {
            targetEl.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/15 col-span-2";
        } else {
            targetEl.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/15";
        }
    }
}

/**
 * Mengatur seleksi tombol kategori area pada modal edit popup
 * @param {string} cat - Nama kategori area ('Guest Room', 'Meeting Room', dll)
 */
function selectModalCategory(cat) {
    activeModalCategory = cat;
    document.getElementById('modal-job-category').value = cat;
    ['modal-cat-room', 'modal-cat-meeting', 'modal-cat-public', 'modal-cat-event', 'modal-cat-kitchen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center border-slate-200 text-slate-600 bg-white";
    });
    
    let targetId = cat === 'Guest Room' ? 'modal-cat-room' : 
                   cat === 'Meeting Room' ? 'modal-cat-meeting' : 
                   cat === 'Public Area' ? 'modal-cat-public' :
                   cat === 'Event' ? 'modal-cat-event' : 'modal-cat-kitchen';
    const targetEl = document.getElementById(targetId);
    if (targetEl) {
        if (cat === 'Kitchen') {
            targetEl.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/15 col-span-2";
        } else {
            targetEl.className = "py-2.5 px-2 rounded-xl border text-[10px] font-bold text-center bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/15";
        }
    }
}

function selectCategoryInModal(cat) {
    selectModalCategory(cat);
}


// ==========================================
// BAGIAN 2: PENYARINGAN DATA (APPLY FILTERS & EXPORT)
// ==========================================

/**
 * Memproses filter saringan pencarian data logbook (Search text, Tanggal Maks 30 Hari, Kategori, Status)
 * @param {boolean} triggerByDateButton - Menandakan apakah filter dipicu paksa oleh tombol pencari tanggal
 */
function applyFilters(triggerByDateButton = false) {
    const searchVal = document.getElementById('filter-search').value.toLowerCase().trim();
    const startDateVal = document.getElementById('filter-start-date').value; 
    const endDateVal = document.getElementById('filter-end-date').value; 
    const catVal = document.getElementById('filter-category').value;
    const statusVal = document.getElementById('filter-status').value;

    let isUsingCustomRange = false;
    let startLimitStr = ""; 
    let endLimitStr = "";
    const isUsingNonDateSearch = searchVal || catVal || statusVal;

    // Deteksi filter tanggal kustom
    if (startDateVal || endDateVal) {
        isUsingCustomRange = true;
        if (!triggerByDateButton) return; // Tunggu sampai tombol "Search" ditekan jika menggunakan kustom tanggal
    } else if (!isUsingNonDateSearch) {
        // Jika tidak mencari apa-apa, batasi otomatis ke Hari Ini saja (1 hari berjalan)
        const today = new Date();
        const formatDateHelper = (dateObj) => {
            const y = dateObj.getFullYear();
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const d = String(dateObj.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        };
        startLimitStr = formatDateHelper(today);
        endLimitStr = formatDateHelper(today);
    }

    const filtered = logbookData.filter(item => {
        if (!item) return false;
        
        const matchesSearch = !searchVal || 
            (item.area && item.area.toLowerCase().includes(searchVal)) ||
            (item.teknisi && item.teknisi.toLowerCase().includes(searchVal)) ||
            (item.detail && item.detail.toLowerCase().includes(searchVal));
            
        let matchesDate = true;
        if (item.tanggal) {
            const itemDateOnly = item.tanggal.split('T')[0].split(' ')[0];
            if (isUsingCustomRange) {
                matchesDate = itemDateOnly >= startDateVal && itemDateOnly <= endDateVal;
            } else if (!isUsingNonDateSearch) {
                matchesDate = itemDateOnly >= startLimitStr && itemDateOnly <= endLimitStr;
            }
        }
        
        const matchesCat = !catVal || item.category === catVal;
        const matchesStatus = !statusVal || item.status === statusVal;

        return matchesSearch && matchesDate && matchesCat && matchesStatus;
    });

    // Jika filter kustom aktif atau mengetik pencarian, tampilkan dalam Pop-up paginasi 10 baris
    if (isUsingNonDateSearch || (isUsingCustomRange && triggerByDateButton)) {
        openPaginatedSearchModal(filtered);
    } else {
        renderData(filtered);
    }
}

/**
 * Menghapus seluruh filter pencarian dan mengembalikan ke setelan default hari ini
 */
function clearFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-start-date').value = '';
    document.getElementById('filter-end-date').value = '';
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-status').value = '';
    applyFilters();
}

/**
 * Mengekspor seluruh database pekerjaan yang tersimpan ke format CSV (Excel compatible)
 */
function exportToExcel() {
    if (logbookData.length === 0) {
        showAlert('Tidak ada data logbook untuk diekspor!', 'error');
        return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Laporan,Tanggal,Shift,Teknisi,Kategori,Area,Detail Pekerjaan,Jam Mulai,Jam Selesai,Status,Catatan Admin,Bidang Spesialis,Jenis Pemeliharaan\n";
    
    logbookData.forEach(item => {
        if (!item) return;
        let row = [
            item.id || '',
            item.tanggal || '',
            item.shift || '',
            (item.teknisi || '').replace(/,/g, ';'),
            item.category || '',
            (item.area || '').replace(/,/g, ';'),
            (item.detail || '').replace(/,/g, ';').replace(/\n/g, ' '),
            item.time_start || '',
            item.time_finish || '',
            item.status || '',
            (item.admin_notes || '').replace(/,/g, ';').replace(/\n/g, ' '),
            item.specialty || '',
            item.maintenance_type || ''
        ].map(val => `"${val}"`).join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Logbook_Engineering_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Logbook berhasil diekspor ke file CSV!', 'success');
}


// ==========================================
// BAGIAN 3: MANAJEMEN TAB & DIALOG MODAL
// ==========================================

/**
 * Berpindah tab tampilan di dashboard admin
 * @param {string} name - Nama tab target ('logbook' atau 'users')
 */
function switchTab(name) {
    const btnLogbook = document.getElementById('btn-tab-logbook');
    const btnUsers = document.getElementById('btn-tab-users');
    const contentLogbook = document.getElementById('tab-content-logbook');
    const contentUsers = document.getElementById('tab-content-users');

    if (name === 'logbook') {
        if (btnLogbook) btnLogbook.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100";
        if (btnUsers) btnUsers.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 text-slate-500 hover:bg-slate-50";
        if (contentLogbook) contentLogbook.className = "space-y-6";
        if (contentUsers) contentUsers.className = "hidden";
        
        const syncBadge = document.getElementById('stat-sync');
        const isS = syncBadge ? (syncBadge.innerText === "Cloud") : false;
        const syncBanner = document.getElementById('sync-banner');
        if (syncBanner) {
            if (isS) {
                syncBanner.classList.add('hidden');
            } else {
                syncBanner.classList.remove('hidden');
            }
        }
    } else {
        if (btnUsers) btnUsers.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100";
        if (btnLogbook) btnLogbook.className = "flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 text-slate-500 hover:bg-slate-50";
        if (contentLogbook) contentLogbook.className = "hidden";
        if (contentUsers) contentUsers.className = "space-y-6";
        
        const syncBanner = document.getElementById('sync-banner');
        if (syncBanner) syncBanner.classList.add('hidden'); 
        
        renderUsersList();
        renderDropdownManagementLists(); 
    }
}


// ==========================================
// BAGIAN 4: EVENT PENGIKAT UTAMA (INITIALIZATION)
// ==========================================

/**
 * Fungsi inisialisasi utama saat halaman pertama kali dimuat oleh browser
 */
window.onload = function() {
    lucide.createIcons();
    setTodayDate();

    // Deteksi parameter Apps Script URL otomatis jika dikirim via Link WhatsApp API
    const urlParams = new URLSearchParams(window.location.search);
    const apiParam = urlParams.get('api');
    const viewParam = urlParams.get('view');
    
    if (apiParam && apiParam.startsWith('https://script.google.com/')) {
        googleSheetsURL = apiParam.trim();
        localStorage.setItem('he_sheets_url', apiParam.trim());
        window.history.replaceState({}, document.title, window.location.pathname);
        showAlert('Cloud database terhubung otomatis!', 'success');
    }

    if (viewParam) {
        sessionStorage.setItem('pending_view_id', viewParam);
    }

    // Periksa and muat konfigurasi API Spreadsheet
    if (googleSheetsURL) {
        const sheetApiUrlInput = document.getElementById('sheet-api-url');
        if (sheetApiUrlInput) sheetApiUrlInput.value = googleSheetsURL;
        updateSyncStatusUI(true);
        pullDataFromSheetsSilently(); // Ambil database awan terbaru secara senyap
    } else {
        updateSyncStatusUI(false);
    }

    // Otentikasi otomatis jika sesi masuk akun sebelumnya masih terekam di browser
    const savedSession = JSON.parse(localStorage.getItem('he_session'));
    if (savedSession) {
        applyUserSession(savedSession.role, savedSession.name);
    } else {
        showSection('login');
    }

    renderData();
};