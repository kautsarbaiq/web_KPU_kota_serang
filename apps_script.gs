/**
 * ═══════════════════════════════════════════════════════════════
 *  Google Apps Script — Backend API untuk e-Office SPPD
 *  KPU Kota Serang
 * ═══════════════════════════════════════════════════════════════
 *
 *  CARA DEPLOY:
 *  1. Buka https://script.google.com → Buat project baru.
 *  2. Copy-paste seluruh kode ini ke editor (ganti Code.gs).
 *  3. Buat Google Sheet baru, rename sheet pertama jadi "Data_SPPD".
 *  4. Tambahkan header di baris 1:
 *     | ID_SPPD | Timestamp | Nama | Jabatan | Tujuan | Tgl_Berangkat | Tgl_Kembali | Estimasi_Biaya | Status |
 *  5. Copy ID spreadsheet dari URL:
 *     https://docs.google.com/spreadsheets/d/  ← ID ADA DI SINI →  /edit
 *     Paste di variabel SPREADSHEET_ID di bawah.
 *  6. Deploy → New deployment → Type: Web app
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  7. Copy URL Web App → paste ke SCRIPT_URL di index.html.
 * ═══════════════════════════════════════════════════════════════
 */

// ╔══════════════════════════════════════════════════════════════╗
// ║  GANTI DENGAN SPREADSHEET ID ANDA                           ║
// ╚══════════════════════════════════════════════════════════════╝
const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_ANDA_DI_SINI';
const SHEET_NAME     = 'Data_SPPD';

/**
 * Handle POST requests dari front-end.
 */
function doPost(e) {
  try {
    // Parse payload JSON
    const data = JSON.parse(e.postData.contents);

    // Validasi field wajib
    const requiredFields = ['nama', 'jabatan', 'tujuan', 'tglBerangkat', 'tglKembali', 'biaya'];
    for (const field of requiredFields) {
      if (!data[field] || String(data[field]).trim() === '') {
        return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
      }
    }

    // Generate ID SPPD: SPPD-YYYYMMDD-XXXX (random 4 char)
    const now       = new Date();
    const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
    const randChars = generateRandomCode(4);
    const sppdId    = 'SPPD-' + datePart + '-' + randChars;

    // Timestamp
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    // Format estimasi biaya sebagai angka
    const biaya = Number(String(data.biaya).replace(/\D/g, ''));

    // Append ke Google Sheet
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      return buildResponse('error', 'Sheet "' + SHEET_NAME + '" tidak ditemukan.', null);
    }

    sheet.appendRow([
      sppdId,
      timestamp,
      data.nama.trim(),
      data.jabatan.trim(),
      data.tujuan.trim(),
      data.tglBerangkat,
      data.tglKembali,
      biaya,
      'Pending',  // Status default
    ]);

    // Kirim respons sukses
    return buildResponse('success', 'Data SPPD berhasil disimpan.', sppdId);

  } catch (err) {
    return buildResponse('error', 'Server error: ' + err.message, null);
  }
}

/**
 * Handle GET requests (optional — untuk testing di browser).
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'ok',
      message: 'e-Office SPPD API aktif. Gunakan POST untuk mengirim data.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Utility Functions ──────────────────────────────────────── */

/**
 * Buat respons JSON dengan header CORS.
 */
function buildResponse(status, message, id) {
  const body = { status: status, message: message };
  if (id) body.id = id;

  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generate random alphanumeric string (uppercase).
 */
function generateRandomCode(length) {
  const chars  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result   = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
