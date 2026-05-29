/**
 * =========================================================================
 * FILE: js/auth.js
 * FUNGSINYA: Mengontrol autentikasi sesi masuk dan keluar akun teknisi/administrator,
 * pengelolaan akun baru (User Management), and hak akses Admin.
 * =========================================================================
 */

// ==========================================
// BAGIAN 1: PROSES MASUK & KELUAR AKUN (LOGIN/LOGOUT)
// ==========================================

/**
 * Memvalidasi masukan data form login masuk akun
 * @param {Event} event - Event submit dari form login
 */
function handleLogin(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username').value.trim().toLowerCase();
    const passwordInput = document.getElementById('login-password').value;

    const activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;
    const user = activeUsers.find(u => u.username === usernameInput);

    if (user && user.password === passwordInput) {
        applyUserSession(user.role, user.name);
        showAlert(`Selamat datang, ${user.name}!`, 'success');
    } else {
        showAlert('Username atau Password salah!', 'error');
    }
}

/**
 * Menerapkan penguncian sesi masuk pengguna ke dalam Local Storage HP/Laptop
 * @param {string} role - Hak akses user ('admin' atau 'user')
 * @param {string} name - Nama lengkap pengguna
 */
function applyUserSession(role, name) {
    currentRole = role; 
    currentUserName = name;
    localStorage.setItem('he_session', JSON.stringify({role, name}));

    // Perbarui informasi profil di navigasi header atas
    document.getElementById('nav-user-name').innerText = name;
    document.getElementById('nav-user-role').innerText = role === 'admin' ? 'Administrator' : 'Teknisi';
    document.getElementById('user-nav').classList.remove('hidden');

    const inputCol = document.getElementById('input-container-col');
    const historyCol = document.getElementById('history-container-col');
    const adminFields = document.getElementById('admin-only-fields');
    const adminTabs = document.getElementById('admin-tabs');
    const btnAdminExport = document.getElementById('btn-admin-export');

    // Atur visibilitas UI berdasarkan peran (role) pengguna
    if (role === 'admin') {
        if (adminTabs) adminTabs.classList.remove('hidden');
        if (btnAdminExport) btnAdminExport.classList.remove('hidden');
        if (inputCol) inputCol.classList.add('hidden'); // Sembunyikan form input di samping logbook untuk Admin secara default
        if (historyCol) historyCol.className = "lg:col-span-3 space-y-6";
        if (adminFields) adminFields.className = "p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2";
    } else {
        if (adminTabs) adminTabs.classList.add('hidden');
        if (btnAdminExport) btnAdminExport.className = "hidden";
        if (inputCol) inputCol.classList.remove('hidden');
        if (historyCol) historyCol.className = "lg:col-span-2 space-y-6";
        if (adminFields) adminFields.className = "hidden";
    }

    populateFormDropdowns();
    setTodayDate(); 

    // Alihkan ke halaman Logbook utama secara default
    switchTab('logbook');
    showSection('dashboard');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
    
    // Periksa apakah ada tautan langsung pending pengerjaan
    const pendingViewId = sessionStorage.getItem('pending_view_id');
    if (pendingViewId) {
        sessionStorage.removeItem('pending_view_id');
        const filterSearch = document.getElementById('filter-search');
        if (filterSearch) filterSearch.value = pendingViewId;
        applyFilters();
        setTimeout(() => {
            const el = document.getElementById('history-container-col');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 550);
    } else {
        renderData();
    }
}

/**
 * Menghapus sesi kerja aktif saat keluar (log out)
 */
function logout() {
    localStorage.removeItem('he_session');
    currentRole = null;
    currentUserName = null;
    const userNav = document.getElementById('user-nav');
    if (userNav) userNav.classList.add('hidden');
    showSection('login');
}


// ==========================================
// BAGIAN 2: PENGELOLAAN DATA USER (USER MANAGEMENT)
// ==========================================

/**
 * Membuka modal formulir pendaftaran user baru harian
 */
function openAddUserModal() {
    resetUserForm();
    document.getElementById('user-modal-title').innerText = "Add User Access";
    document.getElementById('label-user-submit').innerText = "Save User";
    document.getElementById('user-modal').classList.remove('hidden');
    lucide.createIcons();
}

function closeUserModal() {
    document.getElementById('user-modal').classList.add('hidden');
    resetUserForm();
}

function resetUserForm() {
    const form = document.getElementById('user-form');
    if (form) form.reset();
    const editUsernameInput = document.getElementById('user-edit-username');
    if (editUsernameInput) editUsernameInput.value = '';
    const usernameInput = document.getElementById('user-username');
    if (usernameInput) {
        usernameInput.readOnly = false;
        usernameInput.classList.remove('bg-slate-100', 'cursor-not-allowed', 'text-slate-500');
        usernameInput.classList.add('bg-slate-50/50');
    }
}

/**
 * Menyimpan pendaftaran user akun teknisi baru ke memori lokal & awan
 * @param {Event} e - Event submit form user
 */
function submitUserForm(e) {
    e.preventDefault();
    const editUsername = document.getElementById('user-edit-username').value.trim().toLowerCase();
    const username = document.getElementById('user-username').value.trim().toLowerCase();
    const name = document.getElementById('user-name').value.trim();
    const password = document.getElementById('user-password').value.trim();
    const role = document.getElementById('user-role').value;

    let activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;

    if (editUsername) {
        // Mode Edit Pengguna yang sudah ada
        const index = activeUsers.findIndex(x => x.username === editUsername);
        if (index !== -1) {
            activeUsers[index] = { username: editUsername, name, password, role };
            usersData = activeUsers;
            localStorage.setItem('he_users_local', JSON.stringify(activeUsers));
            showAlert('Data pengguna berhasil diperbarui!', 'success');
        }
    } else {
        // Mode Tambah Baru
        if (activeUsers.find(x => x.username === username)) { 
            showAlert('Username sudah terdaftar di sistem!', 'error'); 
            return; 
        }
        const newUser = { username, name, password, role };
        activeUsers.push(newUser);
        usersData = activeUsers;
        localStorage.setItem('he_users_local', JSON.stringify(activeUsers));
        showAlert('Pengguna baru berhasil didaftarkan!', 'success');
    }
    
    closeUserModal();
    renderUsersList();
    if (googleSheetsURL) syncDataWithSheets(true);
}

/**
 * Menggambar daftar akun user terdaftar ke dalam tabel tab administrasi
 */
function renderUsersList() {
    const tbody = document.getElementById('users-table-body'); 
    const mobileContainer = document.getElementById('users-cards-mobile'); 
    if (!tbody || !mobileContainer) return;
    
    tbody.innerHTML = ''; 
    mobileContainer.innerHTML = '';

    const activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;

    activeUsers.forEach(u => {
        tbody.innerHTML += `
            <tr class="border-b hover:bg-slate-50/50 transition">
                <td class="p-4 font-bold text-slate-800">${u.name}</td>
                <td class="p-4 font-mono font-semibold text-slate-600">${u.username}</td>
                <td class="p-4 text-slate-400 font-mono">${u.password}</td>
                <td class="p-4"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.role==='admin'?'bg-purple-100 text-purple-800':'bg-blue-100 text-blue-800'}">${u.role.toUpperCase()}</span></td>
                <td class="p-4 text-right">
                    <div class="flex items-center justify-end space-x-1.5">
                        <button onclick="editUser('${u.username}')" class="text-amber-500 hover:text-amber-700 p-1.5 hover:bg-amber-50 rounded-lg transition" title="Edit Akses User">
                            <i data-lucide="edit" class="w-4 h-4"></i>
                        </button>
                        <button onclick="deleteUser('${u.username}')" class="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-555 rounded-lg transition" title="Hapus User">
                            <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;

        mobileContainer.innerHTML += `
            <div class="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-center text-xs mb-3 shadow-sm shadow-slate-200/50">
                <div class="space-y-1">
                    <p class="font-bold text-slate-800">${u.name}</p>
                    <p class="text-[10px] text-slate-500 mt-1">User: <code class="bg-white px-1.5 py-0.5 rounded border font-mono font-semibold">${u.username}</code> | Pass: <code class="bg-white px-1.5 py-0.5 rounded border font-mono">${u.password}</code></p>
                </div>
                <div class="flex items-center space-x-3">
                    <span class="px-2 py-0.5 rounded text-[9px] font-bold ${u.role==='admin'?'bg-purple-100 text-purple-800':'bg-blue-100 text-blue-800'}">${u.role.toUpperCase()}</span>
                    <div class="flex items-center space-x-1">
                        <button onclick="editUser('${u.username}')" class="text-amber-500 p-2 hover:bg-amber-100 rounded-xl transition" title="Edit">
                            <i data-lucide="edit" class="w-4.5 h-4.5"></i>
                        </button>
                        <button onclick="deleteUser('${u.username}')" class="text-red-555 p-2 hover:bg-red-100 rounded-xl transition" title="Hapus">
                            <i data-lucide="trash-2" class="w-4.5 h-4.5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    document.getElementById('stat-total-users').innerText = activeUsers.length + " Users";
    lucide.createIcons(); 
}

/**
 * Menarik data user terpilih untuk diredireksi ke form modal edit
 * @param {string} username - Username yang akan di-edit
 */
function editUser(username) {
    const activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;
    const user = activeUsers.find(u => u.username === username);
    if (!user) return;

    document.getElementById('user-edit-username').value = user.username;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-username').readOnly = true;
    document.getElementById('user-username').classList.remove('bg-slate-50/50');
    document.getElementById('user-username').classList.add('bg-slate-100', 'cursor-not-allowed', 'text-slate-500');
    
    document.getElementById('user-name').value = user.name;
    document.getElementById('user-password').value = user.password;
    document.getElementById('user-role').value = user.role;

    document.getElementById('user-modal-title').innerText = "Edit User Access";
    document.getElementById('label-user-submit').innerText = "Update User";
    
    document.getElementById('user-modal').classList.remove('hidden');
    lucide.createIcons();
}

/**
 * Menghapus hak akses pengguna secara lokal & dari Google Spreadsheet secara real-time
 * @param {string} username - Username target yang akan dihapus
 */
function deleteUser(username) {
    const loggedSession = JSON.parse(localStorage.getItem('he_session')) || {};
    let loggedUsername = loggedSession.username || "";
    
    if (!loggedUsername && loggedSession.name) {
        const activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;
        const foundUser = activeUsers.find(u => u.name === loggedSession.name);
        if (foundUser) {
            loggedUsername = foundUser.username;
        }
    }

    // Proteksi agar pengguna tidak menghapus akun yang saat ini sedang login, atau master admin
    if (username.toLowerCase().trim() === loggedUsername.toLowerCase().trim() || username.toLowerCase().trim() === "admin") {
        showAlert('Galat! Anda tidak diizinkan menghapus akun sesi aktif Anda saat ini.', 'error');
        return;
    }

    showConfirmModal("Hapus Pengguna", "Apakah Anda yakin ingin menghapus hak akses pengguna '" + username + "'?", function() {
        let activeUsers = JSON.parse(localStorage.getItem('he_users_local')) || usersData;
        activeUsers = activeUsers.filter(x => x.username !== username);
        usersData = activeUsers;
        localStorage.setItem('he_users_local', JSON.stringify(activeUsers));
        renderUsersList();
        
        if (googleSheetsURL) {
            showAlert('Menghapus user di spreadsheet...', 'info');
            fetch(googleSheetsURL, {
                method: 'POST',
                mode: 'cors',
                redirect: 'follow',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'deleteUser',
                    username: username
                })
            })
            .then(res => res.json())
            .then(res => {
                if (res.status === 'success') {
                    showAlert('Pengguna berhasil dihapus dari sistem luring & cloud spreadsheet!', 'success');
                } else {
                    showAlert('Pengguna terhapus secara luring. Gagal menghapus cloud: ' + res.message, 'error');
                }
                pullDataFromSheetsSilently(); 
            })
            .catch(err => {
                console.warn("Gagal terhubung ke awan. Pengguna terhapus secara lokal di HP saja.", err.message);
                showAlert('Pengguna berhasil terhapus secara lokal!', 'success');
            });
        } else {
            showAlert('Pengguna berhasil terhapus secara lokal!', 'success');
        }
    });
}