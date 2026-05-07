/**
 * ═══════════════════════════════════════════════════════════════
 *  e-Office KPU Kota Serang — Google Apps Script (All-in-One)
 *  
 *  CARA PAKAI:
 *  1. Copy SELURUH isi file ini
 *  2. Paste di Google Apps Script editor (hapus kode lama dulu)
 *  3. Klik Save (Ctrl+S)
 *  4. Pilih fungsi "setupSheet" → Klik Run → Otorisasi
 *  5. Pilih fungsi "seedAdmin" → Klik Run
 *  6. Pilih fungsi "triggerDriveAuth" → Klik Run → Otorisasi
 *  7. Deploy → New Deployment → Web App → Anyone → Deploy
 *  8. Copy URL dan paste di js/app.js, login.html, admin.html
 * ═══════════════════════════════════════════════════════════════
 */

/* ══════════════════════════════════════════════════════
 *  KONFIGURASI — Ganti SPREADSHEET_ID dengan milik kamu
 * ══════════════════════════════════════════════════════ */

const SPREADSHEET_ID = '1r15-V3wFsyLJiUDNzV0fRK51CTZkpnopByG0GkHXUTU';

// Sheet names (1 fitur = 1 sheet)
const SHEET_NAME      = 'DATA_SPPD';
const BKPT_SHEET_NAME = 'Data_BKPT';
const KWT_SHEET_NAME  = 'Data_Kuitansi';
const SPT_SHEET_NAME  = 'DATA_SPT';
const LPD_SHEET_NAME  = 'Data_Laporan';

// Auth sheets
const ACCOUNTS_SHEET  = 'Accounts';
const SESSIONS_SHEET  = 'Sessions';

// Drive folder names (1 fitur = 1 folder foto)
const FOTO_FOLDER = 'SPPD_Foto';
const BKPT_FOLDER = 'BKPT_Foto';
const KWT_FOLDER  = 'Kuitansi_Foto';
const LPD_FOLDER  = 'Laporan_Foto';


/* ══════════════════════════════════════════════════════
 *  ROUTER — Menerima POST dari frontend
 * ══════════════════════════════════════════════════════ */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── Auth Actions ──
    if (data.action === 'login')            return doLogin(data);
    if (data.action === 'logout')           return doLogout(data);
    if (data.action === 'validate_session') return doValidateSession(data);

    // ── Admin Actions ──
    if (data.action === 'get_dashboard_stats') return doGetDashboardStats(data);
    if (data.action === 'get_sheet_data')      return doGetSheetData(data);
    if (data.action === 'admin_delete')        return doAdminDelete(data);
    if (data.action === 'get_accounts')        return doGetAccounts(data);
    if (data.action === 'create_account')      return doCreateAccount(data);
    if (data.action === 'delete_account')      return doDeleteAccount(data);

    // ── Data Actions (existing) ──
    if (data.action === 'bkpt')     return doPostBKPT(data);
    if (data.action === 'kuitansi') return doPostKuitansi(data);
    if (data.action === 'spt')      return doPostSPT(data);
    if (data.action === 'laporan')  return doPostLaporan(data);

    // Default: SPPD
    return doPostSPPD(data);

  } catch (err) {
    return buildResponse('error', 'Server error: ' + err.message, null);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'ok',
      message: 'e-Office KPU Kota Serang API v4 aktif. Gunakan POST untuk mengirim data.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ══════════════════════════════════════════════════════
 *  AUTH: Password Hashing (SHA-256)
 * ══════════════════════════════════════════════════════ */

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return rawHash.map(function(byte) {
    let hex = (byte < 0 ? byte + 256 : byte).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function generateSessionToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}


/* ══════════════════════════════════════════════════════
 *  AUTH: Login
 * ══════════════════════════════════════════════════════ */

function doLogin(data) {
  if (!data.email || !data.password) {
    return buildResponse('error', 'Email dan password wajib diisi.', null);
  }

  const email = String(data.email).trim().toLowerCase();
  const passwordHash = hashPassword(data.password);

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!sheet) {
    return buildResponse('error', 'Sheet Accounts belum dibuat. Jalankan setupSheet() dulu.', null);
  }

  const allData = sheet.getDataRange().getValues();
  let foundUser = null;

  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    // Columns: id, name, email, password, role, created_at
    if (String(row[2]).trim().toLowerCase() === email && String(row[3]) === passwordHash) {
      foundUser = {
        id:    row[0],
        name:  row[1],
        email: row[2],
        role:  row[4],
      };
      break;
    }
  }

  if (!foundUser) {
    return buildResponse('error', 'Email atau password salah.', null);
  }

  // Create session
  const token = generateSessionToken();
  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  const sessSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessSheet) {
    return buildResponse('error', 'Sheet Sessions belum dibuat. Jalankan setupSheet() dulu.', null);
  }

  sessSheet.appendRow([
    token,
    foundUser.id,
    foundUser.email,
    foundUser.role,
    foundUser.name,
    timestamp,
  ]);

  const body = {
    status: 'success',
    message: 'Login berhasil.',
    token: token,
    user: foundUser,
  };

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ══════════════════════════════════════════════════════
 *  AUTH: Logout
 * ══════════════════════════════════════════════════════ */

function doLogout(data) {
  if (!data.session_token) {
    return buildResponse('success', 'Logout berhasil.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sessSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessSheet) return buildResponse('success', 'Logout berhasil.', null);

  const allData = sessSheet.getDataRange().getValues();
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][0]) === String(data.session_token)) {
      sessSheet.deleteRow(i + 1);
      break;
    }
  }

  return buildResponse('success', 'Logout berhasil.', null);
}


/* ══════════════════════════════════════════════════════
 *  AUTH: Validate Session
 * ══════════════════════════════════════════════════════ */

function doValidateSession(data) {
  const user = validateSession_(data.session_token);
  if (!user) {
    return buildResponse('error', 'Session tidak valid atau sudah expired.', null);
  }
  return buildResponse('success', 'Session valid.', null);
}

/**
 * Internal session validator
 * Returns user object or null
 */
function validateSession_(token) {
  if (!token) return null;

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sessSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessSheet) return null;

  const allData = sessSheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][0]) === String(token)) {
      return {
        id:    allData[i][1],
        email: allData[i][2],
        role:  allData[i][3],
        name:  allData[i][4],
      };
    }
  }
  return null;
}

/**
 * Require admin role — returns user or sends error response
 */
function requireAdmin_(data) {
  const user = validateSession_(data.session_token);
  if (!user) return null;
  if (user.role !== 'admin') return null;
  return user;
}


/* ══════════════════════════════════════════════════════
 *  ADMIN: Dashboard Stats
 * ══════════════════════════════════════════════════════ */

function doGetDashboardStats(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  function countRows(sheetName) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return 0;
    const lastRow = sheet.getLastRow();
    return lastRow > 1 ? lastRow - 1 : 0;
  }

  const stats = {
    sppd:     countRows(SHEET_NAME),
    bkpt:     countRows(BKPT_SHEET_NAME),
    kuitansi: countRows(KWT_SHEET_NAME),
    spt:      countRows(SPT_SHEET_NAME),
    laporan:  countRows(LPD_SHEET_NAME),
  };

  const body = { status: 'success', stats: stats };
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ══════════════════════════════════════════════════════
 *  ADMIN: Get Sheet Data
 * ══════════════════════════════════════════════════════ */

function doGetSheetData(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  const sheetName = data.sheet_name;
  const allowedSheets = [SHEET_NAME, BKPT_SHEET_NAME, KWT_SHEET_NAME, SPT_SHEET_NAME, LPD_SHEET_NAME];
  if (!allowedSheets.includes(sheetName)) {
    return buildResponse('error', 'Sheet tidak diizinkan.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + sheetName + '" tidak ditemukan.', null);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    const body = { status: 'success', data: [] };
    return ContentService
      .createTextOutput(JSON.stringify(body))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  const values = dataRange.getValues();

  const body = { status: 'success', data: values };
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}


/* ══════════════════════════════════════════════════════
 *  ADMIN: Delete Data Row
 * ══════════════════════════════════════════════════════ */

function doAdminDelete(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  const sheetName = data.sheet_name;
  const rowId = data.row_id;

  if (!sheetName || !rowId) {
    return buildResponse('error', 'Sheet name dan row ID wajib diisi.', null);
  }

  const allowedSheets = [SHEET_NAME, BKPT_SHEET_NAME, KWT_SHEET_NAME, SPT_SHEET_NAME, LPD_SHEET_NAME];
  if (!allowedSheets.includes(sheetName)) {
    return buildResponse('error', 'Sheet tidak diizinkan.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    return buildResponse('error', 'Sheet tidak ditemukan.', null);
  }

  const allData = sheet.getDataRange().getValues();
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][0]) === String(rowId)) {
      sheet.deleteRow(i + 1);
      return buildResponse('success', 'Data berhasil dihapus.', null);
    }
  }

  return buildResponse('error', 'Data dengan ID "' + rowId + '" tidak ditemukan.', null);
}


/* ══════════════════════════════════════════════════════
 *  ADMIN: Account Management
 * ══════════════════════════════════════════════════════ */

function doGetAccounts(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!sheet) {
    return buildResponse('error', 'Sheet Accounts tidak ditemukan.', null);
  }

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    const body = { status: 'success', accounts: [] };
    return ContentService
      .createTextOutput(JSON.stringify(body))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const allData = sheet.getRange(2, 1, lastRow - 1, 6).getValues();
  // Remove password column (index 3) for security
  const safe = allData.map(function(row) {
    return [row[0], row[1], row[2], '***', row[4], row[5]];
  });

  const body = { status: 'success', accounts: safe };
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function doCreateAccount(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  if (!data.name || !data.email || !data.password || !data.role) {
    return buildResponse('error', 'Semua field wajib diisi.', null);
  }

  if (data.role !== 'admin' && data.role !== 'user') {
    return buildResponse('error', 'Role harus "admin" atau "user".', null);
  }

  if (String(data.password).length < 6) {
    return buildResponse('error', 'Password minimal 6 karakter.', null);
  }

  const email = String(data.email).trim().toLowerCase();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!sheet) {
    return buildResponse('error', 'Sheet Accounts tidak ditemukan.', null);
  }

  // Check email uniqueness
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][2]).trim().toLowerCase() === email) {
      return buildResponse('error', 'Email "' + email + '" sudah terdaftar.', null);
    }
  }

  const now = new Date();
  const datePart = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const accId = 'ACC-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  sheet.appendRow([
    accId,
    String(data.name).trim(),
    email,
    hashPassword(data.password),
    data.role,
    timestamp,
  ]);

  return buildResponse('success', 'Akun berhasil dibuat.', accId);
}

function doDeleteAccount(data) {
  const admin = requireAdmin_(data);
  if (!admin) {
    return buildResponse('error', 'Session tidak valid atau bukan admin.', null);
  }

  if (!data.account_id) {
    return buildResponse('error', 'Account ID wajib diisi.', null);
  }

  // Prevent admin from deleting their own account
  if (data.account_id === admin.id) {
    return buildResponse('error', 'Tidak dapat menghapus akun sendiri.', null);
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!sheet) {
    return buildResponse('error', 'Sheet Accounts tidak ditemukan.', null);
  }

  const allData = sheet.getDataRange().getValues();
  for (let i = allData.length - 1; i >= 1; i--) {
    if (String(allData[i][0]) === String(data.account_id)) {
      sheet.deleteRow(i + 1);
      return buildResponse('success', 'Akun berhasil dihapus.', null);
    }
  }

  return buildResponse('error', 'Akun tidak ditemukan.', null);
}


/* ══════════════════════════════════════════════════════
 *  HANDLER: SPPD → Sheet "DATA_SPPD"
 * ══════════════════════════════════════════════════════ */

function doPostSPPD(data) {
  const required = ['nama', 'jabatan', 'bagian', 'tujuan_dinas', 'tglBerangkat', 'tglKembali', 'jumlah_sppd'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const sppdId    = 'SPPD-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  let fotoLink = '';
  if (data.foto && data.foto.length > 0) {
    fotoLink = savePhotoToDrive(data.foto, data.foto_nama || 'foto.jpg', sppdId, FOTO_FOLDER);
  }

  const num = val => Number(String(val || '0').replace(/\D/g, ''));

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  sheet.appendRow([
    sppdId,
    timestamp,
    (data.nama || '').trim(),
    (data.nip || '').trim(),
    (data.pangkat || '').trim(),
    (data.golongan || '').trim(),
    (data.jabatan || '').trim(),
    (data.bagian || '').trim(),
    (data.tujuan_dinas || '').trim(),
    (data.kegiatan || '').trim(),
    data.tglBerangkat,
    data.tglKembali,
    num(data.uang_harian),
    num(data.uang_transport),
    num(data.representasi),
    num(data.biaya_lokal),
    num(data.jumlah_sppd),
    num(data.biaya_hotel),
    (data.no_tiket || '').trim(),
    (data.airlines || '').trim(),
    (data.tujuan_tiket || '').trim(),
    num(data.harga_tiket),
    num(data.airport_tax),
    fotoLink,
    'Pending',
  ]);

  return buildResponse('success', 'Data SPPD berhasil disimpan.', sppdId);
}


/* ══════════════════════════════════════════════════════
 *  HANDLER: BKPT → Sheet "Data_BKPT"
 * ══════════════════════════════════════════════════════ */

function doPostBKPT(data) {
  const required = ['pejabat_nama', 'pejabat_jabatan', 'pelaksana_nama', 'pelaksana_jabatan', 'tugas', 'tanggal', 'tujuan'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const bkptId    = 'BKPT-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  let fotoLink = '';
  if (data.foto && data.foto.length > 0) {
    fotoLink = savePhotoToDrive(data.foto, data.foto_nama || 'foto.jpg', bkptId, BKPT_FOLDER);
  }

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BKPT_SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + BKPT_SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  sheet.appendRow([
    bkptId,
    timestamp,
    (data.pejabat_nama || '').trim(),
    (data.pejabat_jabatan || '').trim(),
    (data.pelaksana_nama || '').trim(),
    (data.pelaksana_jabatan || '').trim(),
    (data.tugas || '').trim(),
    data.tanggal,
    (data.tujuan || '').trim(),
    fotoLink,
  ]);

  return buildResponse('success', 'Bukti konfirmasi berhasil disimpan.', bkptId);
}


/* ══════════════════════════════════════════════════════
 *  HANDLER: KUITANSI → Sheet "Data_Kuitansi"
 * ══════════════════════════════════════════════════════ */

function doPostKuitansi(data) {
  const required = ['jumlah', 'pembayaran', 'tanggal', 'tempat'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const kwtId     = 'KWT-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  let fotoLink = '';
  if (data.foto && data.foto.length > 0) {
    fotoLink = savePhotoToDrive(data.foto, data.foto_nama || 'foto.jpg', kwtId, KWT_FOLDER);
  }

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(KWT_SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + KWT_SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  const num = v => { const n = Number(String(v || '0').replace(/[^0-9]/g, '')); return isNaN(n) ? 0 : n; };

  sheet.appendRow([
    kwtId,
    timestamp,
    'Pejabat Pembuat Komitmen - Satker KPU Kota Serang',
    num(data.jumlah),
    (data.terbilang || '').trim(),
    (data.pembayaran || '').trim(),
    data.tanggal,
    (data.tempat || '').trim(),
    fotoLink,
  ]);

  return buildResponse('success', 'Kuitansi berhasil disimpan.', kwtId);
}

/* ══════════════════════════════════════════════════════
 *  HANDLER: SURAT PERINTAH (SPT) → Sheet "DATA_SPT"
 * ══════════════════════════════════════════════════════ */

function doPostSPT(data) {
  const required = ['nomor', 'menimbang', 'dasar', 'kepada', 'untuk'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const sptId     = 'SPT-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(SPT_SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + SPT_SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  sheet.appendRow([
    sptId,
    timestamp,
    (data.nomor || '').trim(),
    (data.menimbang || '').trim(),
    (data.dasar || '').trim(),
    (data.kepada || '').trim(),
    (data.untuk || '').trim(),
  ]);

  return buildResponse('success', 'Surat Perintah berhasil disimpan.', sptId);
}


/* ══════════════════════════════════════════════════════
 *  HANDLER: LAPORAN PERJALANAN DINAS → Sheet "Data_Laporan"
 * ══════════════════════════════════════════════════════ */

function doPostLaporan(data) {
  const required = ['surat_tugas', 'nomor_surat', 'tanggal_surat', 'maksud_tujuan', 'tempat', 'hari_tanggal', 'hasil'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const lpdId     = 'LPD-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  // Handle multiple photos
  const fotoLinks = [];
  const fotos = data.fotos || [];
  const fotoNames = data.foto_names || [];
  for (let i = 0; i < fotos.length; i++) {
    if (fotos[i] && fotos[i].length > 0) {
      const fname = (fotoNames[i] || ('foto_' + (i + 1) + '.jpg'));
      const link = savePhotoToDrive(fotos[i], fname, lpdId + '_' + (i + 1), LPD_FOLDER);
      fotoLinks.push(link);
    }
  }

  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(LPD_SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + LPD_SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  sheet.appendRow([
    lpdId,
    timestamp,
    (data.surat_tugas || '').trim(),
    (data.nomor_surat || '').trim(),
    data.tanggal_surat,
    (data.maksud_tujuan || '').trim(),
    (data.materi || '').trim(),
    (data.tempat || '').trim(),
    (data.hari_tanggal || '').trim(),
    (data.hasil || '').trim(),
    (data.pembuat || '').trim(),
    fotoLinks.join('\n'),
  ]);

  return buildResponse('success', 'Laporan perjalanan dinas berhasil disimpan.', lpdId);
}


/* ══════════════════════════════════════════════════════
 *  HELPER FUNCTIONS
 * ══════════════════════════════════════════════════════ */

function buildResponse(status, message, id) {
  const body = { status: status, message: message };
  if (id) body.id = id;
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

function generateRandomCode(length) {
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result   = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function savePhotoToDrive(base64String, fileName, docId, folderName) {
  const folders = DriveApp.getFoldersByName(folderName || FOTO_FOLDER);
  const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName || FOTO_FOLDER);

  const parts    = base64String.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];

  const safeName = docId + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const blob = Utilities.newBlob(Utilities.base64Decode(rawBase64), mimeType, safeName);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

/** Jalankan SEKALI untuk otorisasi akses Google Drive */
function triggerDriveAuth() {
  const folders = DriveApp.getFoldersByName('test_auth');
  Logger.log('✅ Drive access granted.');
}


/* ══════════════════════════════════════════════════════
 *  SETUP SHEET — Jalankan SEKALI untuk buat semua sheet
 *
 *  Cara: Pilih fungsi "setupSheet" → Klik ▶ Run
 * ══════════════════════════════════════════════════════ */

function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ─── Sheet 1: DATA_SPPD ───────────────────────
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    sheet.clear();
    sheet.clearConditionalFormatRules();
  }

  const headers = [
    'ID_SPPD', 'Timestamp', 'Nama', 'NIP', 'Pangkat', 'Golongan', 'Jabatan', 'Bagian',
    'Tujuan_Dinas', 'Kegiatan', 'Tgl_Berangkat', 'Tgl_Kembali',
    'Uang_Harian', 'Uang_Transport', 'Representasi', 'Biaya_Lokal',
    'Jumlah_SPPD', 'Biaya_Hotel', 'No_Tiket', 'Airlines', 'Tujuan_Tiket',
    'Harga_Tiket', 'Airport_Tax', 'Link_Foto', 'Status'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange
    .setBackground('#0f2137')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sheet.setRowHeight(1, 36);

  const widths = {
    1: 190, 2: 170, 3: 200, 4: 170, 5: 160, 6: 160, 7: 220, 8: 300,
    9: 250, 10: 250, 11: 130, 12: 130,
    13: 150, 14: 150, 15: 150, 16: 150, 17: 150, 18: 150,
    19: 160, 20: 160, 21: 160, 22: 150, 23: 150,
    24: 300, 25: 120
  };
  for (const col in widths) {
    sheet.setColumnWidth(Number(col), widths[col]);
  }

  const currencyCols = [13, 14, 15, 16, 17, 18, 22, 23];
  currencyCols.forEach(col => {
    sheet.getRange(2, col, 998, 1).setNumberFormat('[$Rp] #,##0').setHorizontalAlignment('right');
  });

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Disetujui', 'Ditolak'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 25, 998, 1).setDataValidation(statusRule).setHorizontalAlignment('center');

  const rules = [];
  const statusRange = sheet.getRange('Y2:Y1000');
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Pending').setBackground('#FFF3CD').setFontColor('#856404').setRanges([statusRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Disetujui').setBackground('#D4EDDA').setFontColor('#155724').setRanges([statusRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo('Ditolak').setBackground('#F8D7DA').setFontColor('#721C24').setRanges([statusRange]).build());
  sheet.setConditionalFormatRules(rules);

  sheet.setFrozenRows(1);
  const filterRange = sheet.getRange(1, 1, sheet.getMaxRows(), headers.length);
  if (sheet.getFilter()) sheet.getFilter().remove();
  filterRange.createFilter();

  Logger.log('✅ Sheet "' + SHEET_NAME + '" berhasil di-setup!');

  // ─── Sheet 2: Data_BKPT ──────────────────────
  let bkptSheet = ss.getSheetByName(BKPT_SHEET_NAME);
  if (!bkptSheet) {
    bkptSheet = ss.insertSheet(BKPT_SHEET_NAME);
  } else {
    bkptSheet.clear();
    bkptSheet.clearConditionalFormatRules();
  }

  const bkptHeaders = ['ID_BKPT', 'Timestamp', 'Nama_Pejabat', 'Jabatan_Pejabat', 'Nama_Pelaksana', 'Jabatan_Pelaksana', 'Tugas', 'Tanggal', 'Tempat_Tujuan', 'Link_Foto'];
  const bkptHeaderRange = bkptSheet.getRange(1, 1, 1, bkptHeaders.length);
  bkptHeaderRange.setValues([bkptHeaders]);
  bkptHeaderRange
    .setBackground('#065f46')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  bkptSheet.setRowHeight(1, 36);
  const bkptWidths = { 1: 190, 2: 170, 3: 200, 4: 200, 5: 200, 6: 200, 7: 350, 8: 130, 9: 250, 10: 300 };
  for (const col in bkptWidths) { bkptSheet.setColumnWidth(Number(col), bkptWidths[col]); }
  bkptSheet.setFrozenRows(1);
  const bkptFilterRange = bkptSheet.getRange(1, 1, bkptSheet.getMaxRows(), bkptHeaders.length);
  if (bkptSheet.getFilter()) bkptSheet.getFilter().remove();
  bkptFilterRange.createFilter();

  Logger.log('✅ Sheet "' + BKPT_SHEET_NAME + '" berhasil di-setup!');

  // ─── Sheet 3: Data_Kuitansi ───────────────────
  let kwtSheet = ss.getSheetByName(KWT_SHEET_NAME);
  if (!kwtSheet) {
    kwtSheet = ss.insertSheet(KWT_SHEET_NAME);
  } else {
    kwtSheet.clear();
    kwtSheet.clearConditionalFormatRules();
  }

  const kwtHeaders = ['ID_Kuitansi', 'Timestamp', 'Sudah_Terima_Dari', 'Jumlah_Uang', 'Terbilang', 'Untuk_Pembayaran', 'Tanggal', 'Tempat', 'Link_Foto'];
  const kwtHeaderRange = kwtSheet.getRange(1, 1, 1, kwtHeaders.length);
  kwtHeaderRange.setValues([kwtHeaders]);
  kwtHeaderRange
    .setBackground('#92400e')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  kwtSheet.setRowHeight(1, 36);
  const kwtWidths = { 1: 190, 2: 170, 3: 280, 4: 160, 5: 300, 6: 400, 7: 130, 8: 250, 9: 300 };
  for (const col in kwtWidths) { kwtSheet.setColumnWidth(Number(col), kwtWidths[col]); }
  kwtSheet.getRange(2, 4, 998, 1).setNumberFormat('[$Rp] #,##0').setHorizontalAlignment('right');
  kwtSheet.setFrozenRows(1);
  const kwtFilterRange = kwtSheet.getRange(1, 1, kwtSheet.getMaxRows(), kwtHeaders.length);
  if (kwtSheet.getFilter()) kwtSheet.getFilter().remove();
  kwtFilterRange.createFilter();

  Logger.log('✅ Sheet "' + KWT_SHEET_NAME + '" berhasil di-setup!');

  // ─── Sheet 4: DATA_SPT ───────────────────
  let sptSheet = ss.getSheetByName(SPT_SHEET_NAME);
  if (!sptSheet) {
    sptSheet = ss.insertSheet(SPT_SHEET_NAME);
  } else {
    sptSheet.clear();
    sptSheet.clearConditionalFormatRules();
  }

  const sptHeaders = ['ID_SPT', 'Timestamp', 'Nomor_Surat', 'Menimbang', 'Dasar', 'Memerintahkan_Kepada', 'Untuk'];
  const sptHeaderRange = sptSheet.getRange(1, 1, 1, sptHeaders.length);
  sptHeaderRange.setValues([sptHeaders]);
  sptHeaderRange
    .setBackground('#4b5563')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sptSheet.setRowHeight(1, 36);
  const sptWidths = { 1: 190, 2: 170, 3: 250, 4: 400, 5: 400, 6: 400, 7: 400 };
  for (const col in sptWidths) { sptSheet.setColumnWidth(Number(col), sptWidths[col]); }
  
  // Custom wrapping since these textareas contain multi-line text
  sptSheet.getRange(2, 4, 998, 4).setWrap(true);
  sptSheet.setFrozenRows(1);
  const sptFilterRange = sptSheet.getRange(1, 1, sptSheet.getMaxRows(), sptHeaders.length);
  if (sptSheet.getFilter()) sptSheet.getFilter().remove();
  sptFilterRange.createFilter();

  Logger.log('✅ Sheet "' + SPT_SHEET_NAME + '" berhasil di-setup!');

  // ─── Sheet 5: Data_Laporan ───────────────────
  let lpdSheet = ss.getSheetByName(LPD_SHEET_NAME);
  if (!lpdSheet) {
    lpdSheet = ss.insertSheet(LPD_SHEET_NAME);
  } else {
    lpdSheet.clear();
    lpdSheet.clearConditionalFormatRules();
  }

  const lpdHeaders = [
    'ID_Laporan', 'Timestamp', 'Surat_Tugas', 'Nomor_Surat', 'Tanggal_Surat',
    'Maksud_Tujuan', 'Materi', 'Tempat_Pelaksanaan', 'Hari_Tanggal',
    'Hasil_Pelaksanaan', 'Pembuat_Laporan', 'Link_Foto'
  ];
  const lpdHeaderRange = lpdSheet.getRange(1, 1, 1, lpdHeaders.length);
  lpdHeaderRange.setValues([lpdHeaders]);
  lpdHeaderRange
    .setBackground('#9f1239')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  lpdSheet.setRowHeight(1, 36);
  const lpdWidths = {
    1: 190, 2: 170, 3: 250, 4: 250, 5: 140,
    6: 350, 7: 350, 8: 250, 9: 220,
    10: 400, 11: 300, 12: 350
  };
  for (const col in lpdWidths) { lpdSheet.setColumnWidth(Number(col), lpdWidths[col]); }

  // Wrap text for long content columns
  lpdSheet.getRange(2, 6, 998, 1).setWrap(true);  // Maksud_Tujuan
  lpdSheet.getRange(2, 7, 998, 1).setWrap(true);  // Materi
  lpdSheet.getRange(2, 10, 998, 1).setWrap(true); // Hasil_Pelaksanaan
  lpdSheet.getRange(2, 11, 998, 1).setWrap(true); // Pembuat_Laporan
  lpdSheet.getRange(2, 12, 998, 1).setWrap(true); // Link_Foto

  lpdSheet.setFrozenRows(1);
  const lpdFilterRange = lpdSheet.getRange(1, 1, lpdSheet.getMaxRows(), lpdHeaders.length);
  if (lpdSheet.getFilter()) lpdSheet.getFilter().remove();
  lpdFilterRange.createFilter();

  Logger.log('✅ Sheet "' + LPD_SHEET_NAME + '" berhasil di-setup!');

  // ─── Sheet 6: Accounts ───────────────────────
  let accSheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!accSheet) {
    accSheet = ss.insertSheet(ACCOUNTS_SHEET);
  } else {
    accSheet.clear();
  }

  const accHeaders = ['ID', 'Name', 'Email', 'Password', 'Role', 'Created_At'];
  const accHeaderRange = accSheet.getRange(1, 1, 1, accHeaders.length);
  accHeaderRange.setValues([accHeaders]);
  accHeaderRange
    .setBackground('#7c3aed')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  accSheet.setRowHeight(1, 36);
  const accWidths = { 1: 190, 2: 200, 3: 250, 4: 400, 5: 100, 6: 170 };
  for (const col in accWidths) { accSheet.setColumnWidth(Number(col), accWidths[col]); }
  accSheet.setFrozenRows(1);

  Logger.log('✅ Sheet "' + ACCOUNTS_SHEET + '" berhasil di-setup!');

  // ─── Sheet 7: Sessions ───────────────────────
  let sessSheet = ss.getSheetByName(SESSIONS_SHEET);
  if (!sessSheet) {
    sessSheet = ss.insertSheet(SESSIONS_SHEET);
  } else {
    sessSheet.clear();
  }

  const sessHeaders = ['Token', 'Account_ID', 'Email', 'Role', 'Name', 'Created_At'];
  const sessHeaderRange = sessSheet.getRange(1, 1, 1, sessHeaders.length);
  sessHeaderRange.setValues([sessHeaders]);
  sessHeaderRange
    .setBackground('#0891b2')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  sessSheet.setRowHeight(1, 36);
  const sessWidths = { 1: 350, 2: 190, 3: 250, 4: 100, 5: 200, 6: 170 };
  for (const col in sessWidths) { sessSheet.setColumnWidth(Number(col), sessWidths[col]); }
  sessSheet.setFrozenRows(1);

  Logger.log('✅ Sheet "' + SESSIONS_SHEET + '" berhasil di-setup!');

  // ─── Cleanup ──────────────────────────────────
  ss.rename('e-Office SPPD — KPU Kota Serang');
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('🎉 SEMUA SHEET BERHASIL DI-SETUP!');
}


/* ══════════════════════════════════════════════════════
 *  SEED ADMIN — Jalankan SEKALI untuk buat akun admin pertama
 *
 *  Default: admin@kpu-serang.go.id / Admin@123
 * ══════════════════════════════════════════════════════ */

function seedAdmin() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(ACCOUNTS_SHEET);
  if (!sheet) {
    Logger.log('❌ Sheet Accounts belum ada. Jalankan setupSheet() dulu!');
    return;
  }

  // Check if admin already exists
  const allData = sheet.getDataRange().getValues();
  for (let i = 1; i < allData.length; i++) {
    if (String(allData[i][2]).trim().toLowerCase() === 'admin@kpu-serang.go.id') {
      Logger.log('⚠️ Admin sudah ada! Tidak perlu seed lagi.');
      return;
    }
  }

  const now = new Date();
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  // Create admin account
  sheet.appendRow([
    'ACC-ADMIN-0001',
    'Admin KPU',
    'admin@kpu-serang.go.id',
    hashPassword('Admin@123'),
    'admin',
    timestamp,
  ]);

  // Create default user account
  sheet.appendRow([
    'ACC-USER-0001',
    'Karyawan KPU',
    'karyawan@kpu-serang.go.id',
    hashPassword('User@123'),
    'user',
    timestamp,
  ]);

  Logger.log('✅ Akun admin dan user default berhasil dibuat!');
  Logger.log('   Admin: admin@kpu-serang.go.id / Admin@123');
  Logger.log('   User:  karyawan@kpu-serang.go.id / User@123');
}
