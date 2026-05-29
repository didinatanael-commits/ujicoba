/**
 * =========================================================================
 * FILE: js/utils.js
 * FUNGSINYA: Menyimpan fungsi-fungsi utilitas pembantu format cetak data.
 * Memproses konversi tautan gambar Drive, format cetak tanggal (DD/MM/YYYY),
 * perapian jam HH:MM, dan kalkulator durasi jam kerja teknisi lapangan.
 * =========================================================================
 */

/**
 * Konversi link Google Drive menjadi URL langsung agar bisa dirender sebagai gambar fisik harian
 * @param {string} url - Tautan asli foto dari Google Drive atau internet
 * @returns {string} Tautan langsung (direct link) gambar yang siap dirender
 */
function getDirectImageUrl(url) {
    if (!url) return '';
    let cleanUrl = url.toString().trim().replace(/^"|"$/g, '');
    if (cleanUrl.includes('drive.google.com')) {
        let fileId = '';
        if (cleanUrl.includes('id=')) {
            fileId = cleanUrl.split('id=')[1].split('&')[0];
        } else if (cleanUrl.includes('/file/d/')) {
            fileId = cleanUrl.split('/file/d/')[1].split('/')[0];
        }
        if (fileId) {
            return "https://lh3.googleusercontent.com/d/" + fileId;
        }
    }
    return cleanUrl;
}

/**
 * Mengubah format tanggal default YYYY-MM-DD menjadi format Indonesia yang ramah dibaca (DD/MM/YYYY)
 * @param {string} dateStr - Nilai tanggal mentah dari input atau database
 * @returns {string} Tanggal terformat rapi (contoh: 28/05/2026)
 */
function formatOnlyDate(dateStr) {
    if (!dateStr) return "-";
    let cleanDate = dateStr.toString().split('T')[0].split(' ')[0];
    const parts = cleanDate.split('-');
    if (parts.length === 3) {
        return parts[2] + "/" + parts[1] + "/" + parts[0]; 
    }
    return cleanDate;
}

/**
 * Merapikan penulisan waktu/jam agar presisi dan seragam (Format HH:MM)
 * @param {string} timeStr - Nilai waktu mentah dari input atau database
 * @returns {string} Waktu terformat rapi (contoh: 08:30)
 */
function formatCleanTime(timeStr) {
    if (!timeStr) return "-";
    let timeStrClean = timeStr.toString().trim();
    if (timeStrClean.includes('T')) {
        try {
            let parts = timeStrClean.split('T')[1]; 
            let timeParts = parts.split(':');
            return timeParts[0].padStart(2, '0') + ":" + timeParts[1].padStart(2, '0'); 
        } catch(e) {
            return timeStrClean;
        }
    }
    if (timeStrClean.includes(' ')) {
        try {
            let parts = timeStrClean.split(' ')[1];
            let timeParts = parts.split(':');
            return timeParts[0].padStart(2, '0') + ":" + timeParts[1].padStart(2, '0');
        } catch(e) {
            return timeStrClean;
        }
    }
    let normalParts = timeStrClean.split(':');
    if (normalParts.length >= 2) {
        return normalParts[0].padStart(2, '0') + ":" + normalParts[1].padStart(2, '0');
    }
    return timeStrClean;
}

/**
 * Menghitung durasi pengerjaan tugas (Jam & Menit) otomatis harian berdasarkan jam mulai dan selesai
 * @param {string} start - Waktu mulai pengerjaan
 * @param {string} finish - Waktu selesai pengerjaan
 * @returns {string} Keterangan teks durasi kerja (contoh: 1 hrs 15 mins)
 */
function calculateDuration(start, finish) {
    let cleanStart = formatCleanTime(start);
    let cleanFinish = formatCleanTime(finish);
    if (!cleanStart || !cleanFinish || cleanStart === '--:--' || cleanFinish === '--:--') return "";
    try {
        const startParts = cleanStart.split(':');
        const finishParts = cleanFinish.split(':');
        let startMin = parseInt(startParts[0], 10) * 60 + parseInt(startParts[1], 10);
        let finishMin = parseInt(finishParts[0], 10) * 60 + parseInt(finishParts[1], 10);
        if (finishMin < startMin) finishMin += 24 * 60; // Dukungan perhitungan melewati tengah malam
        const diffMin = finishMin - startMin;
        const hours = Math.floor(diffMin / 60);
        const mins = diffMin % 60;
        return hours > 0 ? `${hours} hrs ${mins} mins` : `${mins} mins`;
    } catch (e) { return ""; }
}

/**
 * Mengatur kolom masukan tanggal otomatis ke tanggal berjalan hari ini secara luring
 */
function setTodayDate() {
    const dateInput = document.getElementById('job-date');
    if (dateInput) {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        dateInput.value = year + "-" + month + "-" + day;
    }
}