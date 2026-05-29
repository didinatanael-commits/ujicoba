/**
 * =========================================================================
 * FILE: js/db.js
 * FUNGSINYA: Berkas modul pertukaran data API harian antara local storage HP
 * dengan Google Sheets & Folder Penyimpanan foto di Google Drive (via Apps Script).
 * Mengatur penambahan data baru harian, edit pending, hapus data, dan render data.
 * =========================================================================
 */

// ==========================================
// BAGIAN KEAMANAN: FALLBACK AUTO-RESOLVE VARIABEL CLOUD URL
// ==========================================
// Memastikan variabel googleSheetsURL selalu terdefinisi tanpa melempar ReferenceError
if (typeof googleSheetsURL === 'undefined') {
    var googleSheetsURL = localStorage.getItem('he_sheets_url') || '';
}

// ==========================================
// BAGIAN 1: API SINKRONISASI GOOGLE SHEETS & DRIVE
// ==========================================

/**
 * Mengunggah data logbook lokal dan data user ke Google Sheets Cloud database
 * @param {boolean} isSilent - Menentukan apakah notifikasi toast dimunculkan atau tidak
 * @param {object} submittedJob - Data pekerjaan yang baru saja disimpan (opsional)
 * @param {string} actionType - Tipe aksi ('add', 'edit', atau 'delete')
 */
async function syncDataWithSheets(isSilent = false, submittedJob = null, actionType = 'add') {
    // Memastikan kembali URL cloud terbaru ter-update dari penyimpanan lokal browser
    if (typeof googleSheetsURL === 'undefined' || !googleSheetsURL) {
        googleSheetsURL = localStorage.getItem('he_sheets_url') || '';
    }

    if (!googleSheetsURL) {
        if (!isSilent) showAlert('Tautan Google Sheets belum ditentukan!', 'error');
        return;
    }

    const btnSubmit = document.getElementById('btn-submit');
    const btnModalSubmit = document.getElementById('btn-modal-submit');
    let originalBtnHtml = "";
    let originalBtnModalHtml = "";

    // Beri efek loading pada tombol submit jika ada
    if (btnSubmit) {
        originalBtnHtml = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
            <svg class="animate-spin h-4 w-4 text-white inline-block mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Syncing...</span>
        `;
    }

    if (btnModalSubmit) {
        originalBtnModalHtml = btnModalSubmit.innerHTML;
        btnModalSubmit.disabled = true;
        btnModalSubmit.innerHTML = `<span>Saving...</span>`;
    }

    if (!isSilent) {
        showAlert('Menghubungkan ke Google Sheets...', 'info');
        const diagBox = document.getElementById('diagnostics-box');
        if (diagBox) diagBox.classList.add('hidden');
        const debugBox = document.getElementById('alert-debug');
        if (debugBox) debugBox.classList.add('hidden');
    }

    try {
        const response = await fetch(googleSheetsURL, {
            method: 'POST',
            mode: 'cors',
            redirect: 'follow',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'syncFull',
                logbook: logbookData,
                users: usersData
            })
        });

        if (!response.ok) {
            throw new Error("Connection failed with status: " + response.status);
        }

        const res = await response.json();
        if (res.status === 'success') {
            if (res.logbook) {
                // Perbarui database luring dengan versi terbaru dari Google Sheets cloud
                logbookData = res.logbook.map(item => {
                    if (typeof item.photos === 'string') {
                        try { item.photos = JSON.parse(item.photos); } catch(e) { item.photos = []; }
                    }
                    if (!Array.isArray(item.photos)) {
                        item.photos = [];
                    }
                    return item;
                });
                localStorage.setItem('he_logbook_local', JSON.stringify(logbookData));
            }

            if (res.users && res.users.length > 0) {
                let incomingUsers = res.users;
                let mergedUsers = [...usersData];
                incomingUsers.forEach(cloudUser => {
                    const index = mergedUsers.findIndex(localUser => localUser.username === cloudUser.username);
                    if (index !== -1) {
                        mergedUsers[index] = cloudUser;
                    } else {
                        mergedUsers.push(cloudUser);
                    }
                });
                usersData = mergedUsers;
                localStorage.setItem('he_users_local', JSON.stringify(usersData));
            }

            renderData(); // Gambar ulang baris tabel harian
            updateSyncStatusUI(true);
            resetForm();  // Kosongkan form isian
            
            if (!isSilent) {
                if (submittedJob) {
                    showSuccessSyncModal(actionType, submittedJob);
                } else {
                    showAlert('Google Sheets & Google Drive Sync Successful!', 'success');
                }
            }
        } else {
            if (!isSilent) showAlert('Gagal sinkron: ' + res.message, 'error');
        }
    } catch (err) {
        console.error("Sync failed:", err);
        if (!isSilent) {
            showAlert('Gagal Menyambungkan ke Google Sheets!', 'error');
            const debugBox = document.getElementById('alert-debug');
            if (debugBox) {
                debugBox.innerText = `Detail: ${err.message}. Pastikan Apps Script Web App URL berakhiran "/exec" dan di-deploy sebagai "Anyone".`;
                debugBox.classList.remove('hidden');
            }
        } else {
            updateSyncStatusUI(false);
        }
    } finally {
        // Kembalikan tombol submit ke kondisi awal
        if (btnSubmit && originalBtnHtml) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalBtnHtml;
        }
        if (btnModalSubmit && originalBtnModalHtml) {
            btnModalSubmit.disabled = false;
            btnModalSubmit.innerHTML = originalBtnModalHtml;
        }
    }
}

/**
 * Menarik otomatis database terbaru dari awan sesaat setelah login sukses secara senyap
 */
async function pullDataFromSheetsSilently() {
    if (typeof googleSheetsURL === 'undefined' || !googleSheetsURL) {
        googleSheetsURL = localStorage.getItem('he_sheets_url') || '';
    }
    if (!googleSheetsURL) return;
    try {
        const response = await fetch(googleSheetsURL + "?action=read");
        if (!response.ok) throw new Error("Gagal menarik database cloud");
        
        const res = await response.json();
        if (res.status === 'success' && res.logbook) {
            const incomingLogbook = res.logbook.map(item => {
                if (typeof item.photos === 'string') {
                    try { item.photos = JSON.parse(item.photos); } catch(e) { item.photos = []; }
                }
                if (!Array.isArray(item.photos)) item.photos = [];
                return item;
            });

            let mergedLogbook = [...logbookData];
            incomingLogbook.forEach(cloudItem => {
                const index = mergedLogbook.findIndex(localItem => localItem.id.toString() === cloudItem.id.toString());
                if (index !== -1) mergedLogbook[index] = cloudItem;
                else mergedLogbook.push(cloudItem);
            });
            mergedLogbook.sort((a, b) => b.id - a.id);
            logbookData = mergedLogbook;
            localStorage.setItem('he_logbook_local', JSON.stringify(logbookData)); 
        }
        
        if (res.users && Array.isArray(res.users) && res.users.length > 0) { 
            const incomingUsers = res.users;
            let mergedUsers = [...usersData];
            incomingUsers.forEach(cloudUser => {
                const index = mergedUsers.findIndex(localUser => localUser.username === cloudUser.username);
                if (index !== -1) mergedUsers[index] = cloudUser;
                else mergedUsers.push(cloudUser);
            });
            usersData = mergedUsers; 
            localStorage.setItem('he_users_local', JSON.stringify(usersData)); 
        }
        renderData();
        populateFormDropdowns();
        updateSyncStatusUI(true);
    } catch(e) {
        console.log("Offline backup mode aktif:", e.message);
    }
}

// ==========================================
// BAGIAN 2: FITUR PEMBANTU NOTIFIKASI SYNC MODAL
// ==========================================

/**
 * Memunculkan modal popup sukses mengirimkan data/sinkronisasi cloud
 * @param {string} type - Jenis aksi ('add', 'edit', atau 'delete')
 * @param {object} job - Pekerjaan yang bersangkutan
 */
function showSuccessSyncModal(type, job) {
    const modal = document.getElementById('success-sync-modal');
    const iconContainer = document.getElementById('sync-pop-icon-container');
    const title = document.getElementById('sync-pop-title');
    const desc = document.getElementById('sync-pop-desc');
    
    if (!modal || !job) return;

    // Bersihkan classes lama
    iconContainer.className = "mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-inner";

    if (type === 'delete') {
        iconContainer.classList.add('bg-rose-50', 'text-rose-600', 'border', 'border-rose-100');
        iconContainer.innerHTML = '<i data-lucide="trash-2" class="w-8 h-8"></i>';
        title.innerText = "Data Pekerjaan Terhapus Cloud!";
        desc.innerText = "Laporan pekerjaan serta berkas dokumentasi foto di Google Drive telah terhapus permanen.";
    } else if (type === 'edit') {
        iconContainer.classList.add('bg-amber-50', 'text-amber-600', 'border', 'border-amber-100');
        iconContainer.innerHTML = '<i data-lucide="edit-3" class="w-8 h-8"></i>';
        title.innerText = "Pembaruan Terkirim ke Cloud!";
        desc.innerText = "Data pekerjaan Anda telah berhasil diperbarui di Google Spreadsheet.";
    } else {
        iconContainer.classList.add('bg-emerald-50', 'text-emerald-600', 'border', 'border-emerald-100');
        iconContainer.innerHTML = '<i data-lucide="check-circle" class="w-8 h-8"></i>';
        title.innerText = "Laporan Masuk Cloud Sheets!";
        desc.innerText = "Data dan lampiran foto berhasil diunggah secara real-time.";
    }

    // Isian Ringkasan Data
    document.getElementById('sync-pop-id').innerText = job.id;
    document.getElementById('sync-pop-datetime').innerText = `${formatOnlyDate(job.tanggal)} (${job.shift || 'N/A'})`;
    document.getElementById('sync-pop-teknisi').innerText = job.teknisi || '-';
    document.getElementById('sync-pop-location').innerText = `[${job.category}] ${job.area}`;
    document.getElementById('sync-pop-detail').innerText = job.detail || '-';

    let photosArr = [];
    if (job.photos) {
        if (Array.isArray(job.photos)) photosArr = job.photos;
        else {
            try { photosArr = JSON.parse(job.photos); } catch(e) { photosArr = []; }
        }
    }
    document.getElementById('sync-pop-photos-count').innerText = `${photosArr.length} Foto`;

    modal.classList.remove('hidden');
    lucide.createIcons();
}

function closeSuccessSyncModal() {
    const modal = document.getElementById('success-sync-modal');
    if (modal) modal.classList.add('hidden');
}
