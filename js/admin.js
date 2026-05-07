/**
 * ═══════════════════════════════════════════════════
 *  admin.js — Admin Dashboard Logic
 *  e-Office KPU Kota Serang
 *
 *  Handles: Data viewing, searching, filtering,
 *  printing, editing, deleting, account management
 * ═══════════════════════════════════════════════════
 */

/* ── State ── */
let currentAdminPage = 'dashboard';
let allDataCache = {};
let currentSheet = 'DATA_SPPD';
let searchQuery = '';
let currentDataPage = 1;
const ROWS_PER_PAGE = 15;

/* ── Sheet Config ── */
const SHEET_CONFIG = {
    'DATA_SPPD': {
        label: 'SPPD',
        icon: '📄',
        color: '#3b82f6',
        headers: ['ID', 'Timestamp', 'Nama', 'NIP', 'Pangkat', 'Golongan', 'Jabatan', 'Bagian', 'Tujuan Dinas', 'Kegiatan', 'Tgl Berangkat', 'Tgl Kembali', 'Uang Harian', 'Transport', 'Representasi', 'Biaya Lokal', 'Jumlah', 'Hotel', 'No Tiket', 'Airlines', 'Tujuan Tiket', 'Harga Tiket', 'Airport Tax', 'Foto', 'Status'],
        searchCols: [0, 2, 3, 6, 7, 8, 9],
        printable: true,
    },
    'Data_BKPT': {
        label: 'BKPT',
        icon: '✅',
        color: '#059669',
        headers: ['ID', 'Timestamp', 'Nama Pejabat', 'Jabatan Pejabat', 'Nama Pelaksana', 'Jabatan Pelaksana', 'Tugas', 'Tanggal', 'Tujuan', 'Foto'],
        searchCols: [0, 2, 4, 6, 8],
        printable: false,
    },
    'Data_Kuitansi': {
        label: 'Kuitansi',
        icon: '🧾',
        color: '#d97706',
        headers: ['ID', 'Timestamp', 'Terima Dari', 'Jumlah', 'Terbilang', 'Pembayaran', 'Tanggal', 'Tempat', 'Foto'],
        searchCols: [0, 2, 5, 7],
        printable: false,
    },
    'DATA_SPT': {
        label: 'Surat Perintah',
        icon: '📋',
        color: '#6b7280',
        headers: ['ID', 'Timestamp', 'Nomor Surat', 'Menimbang', 'Dasar', 'Kepada', 'Untuk'],
        searchCols: [0, 2, 5],
        printable: false,
    },
    'Data_Laporan': {
        label: 'Laporan',
        icon: '📊',
        color: '#e11d48',
        headers: ['ID', 'Timestamp', 'Surat Tugas', 'Nomor Surat', 'Tgl Surat', 'Maksud Tujuan', 'Materi', 'Tempat', 'Hari/Tanggal', 'Hasil', 'Pembuat', 'Foto'],
        searchCols: [0, 2, 3, 5, 7],
        printable: false,
    },
};

/* ── Init ── */
function initAdmin() {
    // Auth guard
    if (!AuthManager.requireAdmin()) return;

    const user = AuthManager.getCurrentUser();
    const nameEl = document.getElementById('adminUserName');
    if (nameEl) nameEl.textContent = user.name || 'Admin';

    // Show dashboard
    showAdminPage('dashboard');
}

/* ── Navigation ── */
function showAdminPage(page) {
    currentAdminPage = page;

    // Update nav
    document.querySelectorAll('.admin-nav-link').forEach(el => el.classList.remove('active'));
    const navEl = document.getElementById('admin-nav-' + page);
    if (navEl) navEl.classList.add('active');

    // Update title
    const titles = {
        'dashboard': 'Dashboard',
        'data': 'Kelola Data',
        'accounts': 'Kelola Akun',
    };
    document.getElementById('adminPageTitle').textContent = titles[page] || 'Dashboard';

    // Show content
    document.querySelectorAll('.admin-page').forEach(el => el.classList.add('hidden'));
    const pageEl = document.getElementById('admin-page-' + page);
    if (pageEl) pageEl.classList.remove('hidden');

    // Load data
    if (page === 'dashboard') loadDashboard();
    if (page === 'data') loadDataView();
    if (page === 'accounts') loadAccounts();

    // Close mobile sidebar
    if (window.innerWidth < 768) toggleAdminSidebar();
}

function toggleAdminSidebar() {
    document.getElementById('adminSidebar').classList.toggle('open');
    document.getElementById('adminOverlay').classList.toggle('show');
}

/* ── Dashboard ── */
async function loadDashboard() {
    const container = document.getElementById('dashboardStats');
    container.innerHTML = `
        <div class="stat-card"><div class="skeleton" style="width:100%;height:80px;"></div></div>
        <div class="stat-card"><div class="skeleton" style="width:100%;height:80px;"></div></div>
        <div class="stat-card"><div class="skeleton" style="width:100%;height:80px;"></div></div>
        <div class="stat-card"><div class="skeleton" style="width:100%;height:80px;"></div></div>
        <div class="stat-card"><div class="skeleton" style="width:100%;height:80px;"></div></div>
    `;

    try {
        const result = await AuthManager.apiCall({ action: 'get_dashboard_stats' });
        if (result && result.status === 'success') {
            const stats = result.stats;
            container.innerHTML = `
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div class="stat-value">${stats.sppd || 0}</div>
                    <div class="stat-label">Data SPPD</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #059669, #047857);">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <div class="stat-value">${stats.bkpt || 0}</div>
                    <div class="stat-label">Data BKPT</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #d97706, #b45309);">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"/></svg>
                    </div>
                    <div class="stat-value">${stats.kuitansi || 0}</div>
                    <div class="stat-label">Data Kuitansi</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #6b7280, #4b5563);">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"/></svg>
                    </div>
                    <div class="stat-value">${stats.spt || 0}</div>
                    <div class="stat-label">Surat Perintah</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #e11d48, #be123c);">
                        <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    </div>
                    <div class="stat-value">${stats.laporan || 0}</div>
                    <div class="stat-label">Laporan Perdin</div>
                </div>
            `;
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><p class="empty-title">Gagal memuat statistik</p><p class="empty-desc">Periksa koneksi internet Anda.</p></div>';
    }
}

/* ── Data View ── */
async function loadDataView() {
    renderDataTabs();
    await fetchSheetData(currentSheet);
}

function renderDataTabs() {
    const tabContainer = document.getElementById('dataTabs');
    tabContainer.innerHTML = '';
    for (const [sheetName, config] of Object.entries(SHEET_CONFIG)) {
        const btn = document.createElement('button');
        btn.className = 'tab-btn' + (sheetName === currentSheet ? ' active' : '');
        btn.textContent = config.icon + ' ' + config.label;
        btn.onclick = () => switchSheet(sheetName);
        tabContainer.appendChild(btn);
    }
}

async function switchSheet(sheetName) {
    currentSheet = sheetName;
    currentDataPage = 1;
    searchQuery = '';
    const searchInput = document.getElementById('dataSearch');
    if (searchInput) searchInput.value = '';
    renderDataTabs();
    await fetchSheetData(sheetName);
}

async function fetchSheetData(sheetName) {
    const tableContainer = document.getElementById('dataTableContainer');
    tableContainer.innerHTML = '<div style="padding:40px;text-align:center;"><div class="skeleton" style="width:100%;height:200px;"></div></div>';

    try {
        const result = await AuthManager.apiCall({
            action: 'get_sheet_data',
            sheet_name: sheetName,
        });

        if (result && result.status === 'success') {
            allDataCache[sheetName] = result.data || [];
            renderDataTable();
        } else {
            tableContainer.innerHTML = '<div class="empty-state"><p class="empty-title">Gagal memuat data</p><p class="empty-desc">' + (result ? result.message : 'Error tidak diketahui') + '</p></div>';
        }
    } catch (err) {
        tableContainer.innerHTML = '<div class="empty-state"><p class="empty-title">Koneksi Gagal</p><p class="empty-desc">Tidak dapat menghubungi server.</p></div>';
    }
}

function handleDataSearch(query) {
    searchQuery = query.toLowerCase().trim();
    currentDataPage = 1;
    renderDataTable();
}

function renderDataTable() {
    const config = SHEET_CONFIG[currentSheet];
    const allRows = allDataCache[currentSheet] || [];

    // Filter by search query
    let filtered = allRows;
    if (searchQuery) {
        filtered = allRows.filter(row => {
            return config.searchCols.some(colIdx => {
                const val = row[colIdx];
                return val && String(val).toLowerCase().includes(searchQuery);
            });
        });
    }

    // Paginate
    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
    if (currentDataPage > totalPages) currentDataPage = totalPages;
    const startIdx = (currentDataPage - 1) * ROWS_PER_PAGE;
    const pageRows = filtered.slice(startIdx, startIdx + ROWS_PER_PAGE);

    const tableContainer = document.getElementById('dataTableContainer');

    if (filtered.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
                <p class="empty-title">${searchQuery ? 'Tidak ditemukan' : 'Belum ada data'}</p>
                <p class="empty-desc">${searchQuery ? 'Coba kata kunci lain.' : 'Data ' + config.label + ' belum tersedia.'}</p>
            </div>
        `;
        return;
    }

    // Show max 6 columns on table (first 5 + last if status)
    const visibleHeaders = config.headers.slice(0, 6);
    const visibleCols = [0, 1, 2, 3, 4, 5];

    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
    html += '<th>#</th>';
    visibleHeaders.forEach(h => { html += '<th>' + h + '</th>'; });
    html += '<th style="text-align:center;">Aksi</th>';
    html += '</tr></thead><tbody>';

    pageRows.forEach((row, i) => {
        html += '<tr>';
        html += '<td>' + (startIdx + i + 1) + '</td>';
        visibleCols.forEach(colIdx => {
            let val = row[colIdx] != null ? String(row[colIdx]) : '-';
            if (val.length > 40) val = val.substring(0, 40) + '…';
            
            // Status badge
            if (config.headers[colIdx] === 'Status') {
                const cls = val === 'Pending' ? 'status-pending' : val === 'Disetujui' ? 'status-approved' : 'status-rejected';
                val = '<span class="status-badge ' + cls + '">' + val + '</span>';
            }
            
            html += '<td>' + val + '</td>';
        });
        html += '<td style="text-align:center; white-space:nowrap;">';
        html += '<button class="action-btn btn-view" onclick="viewDataRow(\'' + currentSheet + '\',' + (startIdx + i) + ')" title="Lihat Detail"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>';
        html += '<button class="action-btn btn-delete" onclick="confirmDeleteRow(\'' + currentSheet + '\',' + (startIdx + i) + ')" title="Hapus"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';

    // Pagination
    if (totalPages > 1) {
        html += '<div class="pagination">';
        html += '<button class="page-btn" onclick="goDataPage(' + (currentDataPage - 1) + ')" ' + (currentDataPage <= 1 ? 'disabled' : '') + '>‹</button>';
        for (let p = 1; p <= totalPages; p++) {
            if (totalPages > 7 && Math.abs(p - currentDataPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === 2 || p === totalPages - 1) html += '<button class="page-btn" disabled>…</button>';
                continue;
            }
            html += '<button class="page-btn' + (p === currentDataPage ? ' active' : '') + '" onclick="goDataPage(' + p + ')">' + p + '</button>';
        }
        html += '<button class="page-btn" onclick="goDataPage(' + (currentDataPage + 1) + ')" ' + (currentDataPage >= totalPages ? 'disabled' : '') + '>›</button>';
        html += '</div>';
    }

    // Summary
    html += '<div style="padding: 12px 24px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9;">Menampilkan ' + (startIdx + 1) + '–' + Math.min(startIdx + ROWS_PER_PAGE, filtered.length) + ' dari ' + filtered.length + ' data</div>';

    tableContainer.innerHTML = html;
}

function goDataPage(page) {
    const allRows = allDataCache[currentSheet] || [];
    const totalPages = Math.max(1, Math.ceil(allRows.length / ROWS_PER_PAGE));
    if (page < 1 || page > totalPages) return;
    currentDataPage = page;
    renderDataTable();
}

/* ── View Detail ── */
function viewDataRow(sheetName, rowIdx) {
    const config = SHEET_CONFIG[sheetName];
    const row = allDataCache[sheetName][rowIdx];
    if (!row) return;

    let html = '<div class="detail-grid">';
    config.headers.forEach((header, i) => {
        let val = row[i] != null ? String(row[i]) : '-';
        // Make links clickable
        if (val.startsWith('http')) {
            val = '<a href="' + val + '" target="_blank" style="color:#3b82f6;text-decoration:underline;">Buka Link</a>';
        }
        // Status badge
        if (header === 'Status') {
            const cls = val === 'Pending' ? 'status-pending' : val === 'Disetujui' ? 'status-approved' : 'status-rejected';
            val = '<span class="status-badge ' + cls + '">' + val + '</span>';
        }
        html += '<div class="detail-label">' + header + '</div>';
        html += '<div class="detail-value">' + val + '</div>';
    });
    html += '</div>';

    showModal('Detail Data ' + config.label, html, null, null);
}

/* ── Delete Data ── */
function confirmDeleteRow(sheetName, rowIdx) {
    const config = SHEET_CONFIG[sheetName];
    const row = allDataCache[sheetName][rowIdx];
    if (!row) return;

    const id = row[0]; // First column is ID
    const html = '<p style="font-size:14px;color:#334155;">Apakah Anda yakin ingin menghapus data dengan ID: <strong>' + id + '</strong>?</p><p style="font-size:13px;color:#94a3b8;margin-top:8px;">Tindakan ini tidak dapat dibatalkan.</p>';

    showModal('Hapus Data', html, 'Hapus', async () => {
        closeModal();
        try {
            const result = await AuthManager.apiCall({
                action: 'admin_delete',
                sheet_name: sheetName,
                row_id: id,
            });
            if (result && result.status === 'success') {
                showAdminToast('success', 'Data berhasil dihapus.');
                await fetchSheetData(sheetName);
            } else {
                showAdminToast('error', result ? result.message : 'Gagal menghapus data.');
            }
        } catch (err) {
            showAdminToast('error', 'Koneksi gagal. Periksa jaringan Anda.');
        }
    }, true);
}

/* ── Accounts Management ── */
async function loadAccounts() {
    const container = document.getElementById('accountsContainer');
    container.innerHTML = '<div style="padding:40px;text-align:center;"><div class="skeleton" style="width:100%;height:200px;"></div></div>';

    try {
        const result = await AuthManager.apiCall({ action: 'get_accounts' });
        if (result && result.status === 'success') {
            renderAccounts(result.accounts || []);
        } else {
            container.innerHTML = '<div class="empty-state"><p class="empty-title">Gagal memuat akun</p></div>';
        }
    } catch (err) {
        container.innerHTML = '<div class="empty-state"><p class="empty-title">Koneksi Gagal</p></div>';
    }
}

function renderAccounts(accounts) {
    const container = document.getElementById('accountsContainer');

    let html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
    html += '<th>#</th><th>Nama</th><th>Email</th><th>Role</th><th>Dibuat</th><th style="text-align:center;">Aksi</th>';
    html += '</tr></thead><tbody>';

    accounts.forEach((acc, i) => {
        const roleBadge = acc[4] === 'admin' ? 'status-rejected' : 'status-approved';
        html += '<tr>';
        html += '<td>' + (i + 1) + '</td>';
        html += '<td>' + (acc[1] || '-') + '</td>';
        html += '<td>' + (acc[2] || '-') + '</td>';
        html += '<td><span class="status-badge ' + roleBadge + '">' + (acc[4] || '-') + '</span></td>';
        html += '<td>' + (acc[5] || '-') + '</td>';
        html += '<td style="text-align:center;">';
        html += '<button class="action-btn btn-delete" onclick="confirmDeleteAccount(\'' + acc[0] + '\',\'' + acc[2] + '\')" title="Hapus Akun"><svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function showCreateAccountModal() {
    const html = `
        <div class="account-form">
            <div class="form-group">
                <label for="accName">Nama</label>
                <input type="text" id="accName" placeholder="Nama akun" />
            </div>
            <div class="form-group">
                <label for="accEmail">Email</label>
                <input type="email" id="accEmail" placeholder="nama@email.com" />
            </div>
            <div class="form-group">
                <label for="accPassword">Password</label>
                <input type="password" id="accPassword" placeholder="Minimal 6 karakter" />
            </div>
            <div class="form-group">
                <label for="accRole">Role</label>
                <select id="accRole">
                    <option value="user">User (Karyawan)</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
        </div>
    `;

    showModal('Buat Akun Baru', html, 'Buat Akun', async () => {
        const name = document.getElementById('accName').value.trim();
        const email = document.getElementById('accEmail').value.trim().toLowerCase();
        const password = document.getElementById('accPassword').value;
        const role = document.getElementById('accRole').value;

        if (!name || !email || !password) {
            showAdminToast('error', 'Semua field wajib diisi.');
            return;
        }
        if (password.length < 6) {
            showAdminToast('error', 'Password minimal 6 karakter.');
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAdminToast('error', 'Format email tidak valid.');
            return;
        }

        closeModal();

        try {
            const result = await AuthManager.apiCall({
                action: 'create_account',
                name, email, password, role,
            });
            if (result && result.status === 'success') {
                showAdminToast('success', 'Akun berhasil dibuat.');
                await loadAccounts();
            } else {
                showAdminToast('error', result ? result.message : 'Gagal membuat akun.');
            }
        } catch (err) {
            showAdminToast('error', 'Koneksi gagal.');
        }
    });
}

function confirmDeleteAccount(id, email) {
    const html = '<p style="font-size:14px;color:#334155;">Hapus akun <strong>' + email + '</strong>?</p><p style="font-size:13px;color:#94a3b8;margin-top:8px;">Akun yang sudah dihapus tidak dapat dikembalikan.</p>';

    showModal('Hapus Akun', html, 'Hapus', async () => {
        closeModal();
        try {
            const result = await AuthManager.apiCall({
                action: 'delete_account',
                account_id: id,
            });
            if (result && result.status === 'success') {
                showAdminToast('success', 'Akun berhasil dihapus.');
                await loadAccounts();
            } else {
                showAdminToast('error', result ? result.message : 'Gagal menghapus akun.');
            }
        } catch (err) {
            showAdminToast('error', 'Koneksi gagal.');
        }
    }, true);
}

/* ── Modal System ── */
function showModal(title, bodyHtml, confirmText, onConfirm, isDanger) {
    // Remove existing modal
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'adminModal';
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    let footerHtml = '<button class="btn-cancel" onclick="closeModal()">Tutup</button>';
    if (confirmText && onConfirm) {
        footerHtml += '<button class="btn-confirm' + (isDanger ? ' btn-danger' : '') + '" id="modalConfirmBtn">' + confirmText + '</button>';
    }

    overlay.innerHTML = `
        <div class="modal-content" onclick="event.stopPropagation()">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            <div class="modal-footer">${footerHtml}</div>
        </div>
    `;

    document.body.appendChild(overlay);

    if (onConfirm) {
        document.getElementById('modalConfirmBtn').onclick = onConfirm;
    }
}

function closeModal() {
    const modal = document.getElementById('adminModal');
    if (modal) modal.remove();
}

/* ── Toast for Admin ── */
function showAdminToast(type, message) {
    const existing = document.querySelectorAll('.admin-toast');
    existing.forEach(t => t.remove());

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.style.cssText = `
        position: fixed; top: 24px; right: 24px; z-index: 100;
        min-width: 300px; max-width: 420px;
        padding: 14px 20px; border-radius: 14px;
        display: flex; align-items: center; gap: 10px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        animation: toastIn 0.3s ease; font-family: 'Inter', system-ui, sans-serif;
        backdrop-filter: blur(12px);
        ${type === 'success' ? 'background: rgba(5,150,105,0.95); color: #fff;' : 'background: rgba(220,38,38,0.92); color: #fff;'}
    `;

    const icon = type === 'success'
        ? '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        : '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';

    toast.innerHTML = icon + '<span style="font-size:13px;font-weight:500;">' + message + '</span>';
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/* ── Refresh current data ── */
async function refreshCurrentData() {
    if (currentAdminPage === 'data') {
        await fetchSheetData(currentSheet);
        showAdminToast('success', 'Data berhasil diperbarui.');
    }
}

/* ── Init on load ── */
document.addEventListener('DOMContentLoaded', initAdmin);
