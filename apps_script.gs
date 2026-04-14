/**
 * ═══════════════════════════════════════════════════════════════
 *  Google Apps Script — Backend API untuk e-Office SPPD
 *  KPU Kota Serang (v2 — Extended Fields + Photo Upload)
 * ═══════════════════════════════════════════════════════════════
 *
 *  CARA DEPLOY:
 *  1. Buka https://script.google.com → Buat project baru.
 *  2. Copy-paste seluruh kode ini ke editor (ganti Code.gs).
 *  3. Buat Google Sheet baru, rename sheet pertama → "Data_SPPD".
 *  4. Tambahkan header di baris 1 (25 kolom):
 *     | ID_SPPD | Timestamp | Nama | NIP | Pangkat | Golongan | Jabatan | Bagian | Tujuan_Dinas | Kegiatan |
 *     | Tgl_Berangkat | Tgl_Kembali | Uang_Harian | Uang_Transport | Representasi |
 *     | Biaya_Lokal | Jumlah_SPPD | Biaya_Hotel | No_Tiket | Airlines | Tujuan_Tiket |
 *     | Harga_Tiket | Airport_Tax | Link_Foto | Status |
 *  5. Copy ID spreadsheet dari URL → paste di SPREADSHEET_ID.
 *  6. Deploy → New deployment → Web app
 *     - Execute as: Me  |  Who has access: Anyone
 *  7. Copy URL Web App → paste ke SCRIPT_URL di index.html.
 *
 *  CATATAN FOTO:
 *  - Foto dikirim sebagai base64 dari front-end.
 *  - Script menyimpannya ke Google Drive (folder otomatis "SPPD_Foto").
 *  - Link file Drive disimpan di kolom "Link_Foto" di sheet.
 * ═══════════════════════════════════════════════════════════════
 */

// ╔══════════════════════════════════════════════════════════════╗
// ║  GANTI DENGAN SPREADSHEET ID ANDA                           ║
// ╚══════════════════════════════════════════════════════════════╝
const SPREADSHEET_ID = '1r15-V3wFsyLJiUDNzV0fRK51CTZkpnopByG0GkHXUTU';
const SHEET_NAME      = 'DATA_SPPD';
const BKPT_SHEET_NAME = 'Data_BKPT';
const KWT_SHEET_NAME  = 'Data_Kuitansi';
const FOTO_FOLDER     = 'SPPD_Foto';      // Folder foto SPPD di Drive
const BKPT_FOLDER     = 'BKPT_Foto';      // Folder foto BKPT di Drive
const KWT_FOLDER      = 'Kuitansi_Foto';  // Folder foto Kuitansi di Drive

/**
 * Handle POST requests dari front-end.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Routing berdasarkan action
    if (data.action === 'bkpt') {
      return doPostBKPT(data);
    }
    if (data.action === 'kuitansi') {
      return doPostKuitansi(data);
    }

    // Default: SPPD
    const required = ['nama', 'jabatan', 'bagian', 'tujuan_dinas', 'tglBerangkat', 'tglKembali', 'jumlah_sppd'];
    for (const field of required) {
      if (!data[field] || String(data[field]).trim() === '') {
        return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
      }
    }

    // Generate ID SPPD: SPPD-YYYYMMDD-XXXX
    const now       = new Date();
    const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
    const randChars = generateRandomCode(4);
    const sppdId    = 'SPPD-' + datePart + '-' + randChars;
    const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

    // ── Simpan foto ke Google Drive (jika ada) ──
    let fotoLink = '';
    if (data.foto && data.foto.length > 0) {
      fotoLink = savePhotoToDrive(data.foto, data.foto_nama || 'foto.jpg', sppdId, FOTO_FOLDER);
    }

    // ── Helper: parse angka dari string ──
    const num = val => Number(String(val || '0').replace(/\D/g, ''));

    // ── Buka sheet dan append ──
    const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return buildResponse('error', 'Sheet "' + SHEET_NAME + '" tidak ditemukan.', null);
    }

    sheet.appendRow([
      sppdId,                              // A - ID_SPPD
      timestamp,                           // B - Timestamp
      (data.nama || '').trim(),            // C - Nama
      (data.nip || '').trim(),             // D - NIP
      (data.pangkat || '').trim(),         // E - Pangkat
      (data.golongan || '').trim(),        // F - Golongan
      (data.jabatan || '').trim(),         // G - Jabatan
      (data.bagian || '').trim(),          // H - Bagian
      (data.tujuan_dinas || '').trim(),    // I - Tujuan_Dinas
      (data.kegiatan || '').trim(),        // J - Kegiatan
      data.tglBerangkat,                   // K - Tgl_Berangkat
      data.tglKembali,                     // L - Tgl_Kembali
      num(data.uang_harian),              // M - Uang_Harian
      num(data.uang_transport),           // N - Uang_Transport
      num(data.representasi),             // O - Representasi
      num(data.biaya_lokal),              // P - Biaya_Lokal
      num(data.jumlah_sppd),             // Q - Jumlah_SPPD
      num(data.biaya_hotel),              // R - Biaya_Hotel
      (data.no_tiket || '').trim(),       // S - No_Tiket
      (data.airlines || '').trim(),       // T - Airlines
      (data.tujuan_tiket || '').trim(),   // U - Tujuan_Tiket
      num(data.harga_tiket),             // V - Harga_Tiket
      num(data.airport_tax),             // W - Airport_Tax
      fotoLink,                           // X - Link_Foto
      'Pending',                          // Y - Status
    ]);

    return buildResponse('success', 'Data SPPD berhasil disimpan.', sppdId);

  } catch (err) {
    return buildResponse('error', 'Server error: ' + err.message, null);
  }
}

/**
 * Handle BKPT (Bukti Konfirmasi Penyelesaian Tugas) submissions.
 */
function doPostBKPT(data) {
  // Validasi field wajib
  const required = ['nama', 'jabatan', 'tugas', 'tanggal', 'tujuan'];
  for (const field of required) {
    if (!data[field] || String(data[field]).trim() === '') {
      return buildResponse('error', 'Field "' + field + '" wajib diisi.', null);
    }
  }

  // Generate ID: BKPT-YYYYMMDD-XXXX
  const now       = new Date();
  const datePart  = Utilities.formatDate(now, 'Asia/Jakarta', 'yyyyMMdd');
  const randChars = generateRandomCode(4);
  const bkptId    = 'BKPT-' + datePart + '-' + randChars;
  const timestamp = Utilities.formatDate(now, 'Asia/Jakarta', 'dd/MM/yyyy HH:mm:ss');

  // Simpan foto ke Drive
  let fotoLink = '';
  if (data.foto && data.foto.length > 0) {
    fotoLink = savePhotoToDrive(data.foto, data.foto_nama || 'foto.jpg', bkptId, BKPT_FOLDER);
  }

  // Buka sheet
  const ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(BKPT_SHEET_NAME);
  if (!sheet) {
    return buildResponse('error', 'Sheet "' + BKPT_SHEET_NAME + '" tidak ditemukan. Jalankan setupSheet() dulu.', null);
  }

  sheet.appendRow([
    bkptId,                            // A - ID_BKPT
    timestamp,                         // B - Timestamp
    (data.nama || '').trim(),          // C - Nama
    (data.jabatan || '').trim(),       // D - Jabatan
    (data.tugas || '').trim(),         // E - Tugas
    data.tanggal,                      // F - Tanggal
    (data.tujuan || '').trim(),        // G - Tempat_Tujuan
    fotoLink,                          // H - Link_Foto
  ]);

  return buildResponse('success', 'Bukti konfirmasi berhasil disimpan.', bkptId);
}

/**
 * Handle Kuitansi / Bukti Pembayaran submissions.
 */
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
    kwtId,                                       // A - ID_Kuitansi
    timestamp,                                   // B - Timestamp
    'Pejabat Pembuat Komitmen - Satker KPU Kota Serang', // C - Sudah_Terima_Dari
    num(data.jumlah),                            // D - Jumlah_Uang
    (data.terbilang || '').trim(),               // E - Terbilang
    (data.pembayaran || '').trim(),              // F - Untuk_Pembayaran
    data.tanggal,                                // G - Tanggal
    (data.tempat || '').trim(),                  // H - Tempat
    fotoLink,                                    // I - Link_Foto
  ]);

  return buildResponse('success', 'Kuitansi berhasil disimpan.', kwtId);
}

/**
 * Handle GET requests (untuk testing).
 */
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({
      status:  'ok',
      message: 'e-Office SPPD API v2 aktif. Gunakan POST untuk mengirim data.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Utility Functions ──────────────────────────────────────── */

/**
 * Simpan foto base64 ke folder Google Drive.
 * Return: URL link file.
 */
function savePhotoToDrive(base64String, fileName, docId, folderName) {
  // Ambil/buat folder
  const folders = DriveApp.getFoldersByName(folderName || FOTO_FOLDER);
  const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName || FOTO_FOLDER);

  // Parse base64 data URI
  const parts    = base64String.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];

  // Tentukan ekstensi
  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const safeName = docId + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Decode & buat file
  const blob = Utilities.newBlob(Utilities.base64Decode(rawBase64), mimeType, safeName);
  const file = folder.createFile(blob);

  // Set agar bisa diakses via link
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

/**
 * Buat respons JSON.
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

/* ══════════════════════════════════════════════════════════════
 *  SETUP SHEET — Jalankan SEKALI untuk membuat sheet otomatis.
 *  Cara pakai:
 *    1. Klik menu ▶ Run → pilih fungsi "setupSheet"
 *    2. Otorisasi jika diminta
 *    3. Selesai! Sheet "Data_SPPD" siap dipakai.
 * ══════════════════════════════════════════════════════════════ */
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ── Buat atau ambil sheet "Data_SPPD" ──
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  } else {
    // Bersihkan jika sudah ada
    sheet.clear();
    sheet.clearConditionalFormatRules();
  }

  // ── Header (25 kolom) ──
  const headers = [
    'ID_SPPD', 'Timestamp', 'Nama', 'NIP', 'Pangkat', 'Golongan', 'Jabatan', 'Bagian',
    'Tujuan_Dinas', 'Kegiatan', 'Tgl_Berangkat', 'Tgl_Kembali',
    'Uang_Harian', 'Uang_Transport', 'Representasi', 'Biaya_Lokal',
    'Jumlah_SPPD', 'Biaya_Hotel', 'No_Tiket', 'Airlines', 'Tujuan_Tiket',
    'Harga_Tiket', 'Airport_Tax', 'Link_Foto', 'Status'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);

  // ── Styling header ──
  headerRange
    .setBackground('#0f2137')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  // Tinggi baris header
  sheet.setRowHeight(1, 36);

  // ── Lebar kolom ──
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

  // ── Format Currency (Rp) — kolom M,N,O,P,Q,R,V,W ──
  const currencyCols = [13, 14, 15, 16, 17, 18, 22, 23];
  const rupiahFormat = '[$Rp] #,##0';
  currencyCols.forEach(col => {
    sheet.getRange(2, col, 998, 1).setNumberFormat(rupiahFormat)
                                   .setHorizontalAlignment('right');
  });

  // ── Dropdown Status (kolom Y = 25) ──
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Pending', 'Disetujui', 'Ditolak'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 25, 998, 1)
    .setDataValidation(statusRule)
    .setHorizontalAlignment('center');

  // ── Conditional Formatting untuk Status ──
  const rules = [];
  const statusRange = sheet.getRange('Y2:Y1000');

  // Pending → kuning
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pending')
    .setBackground('#FFF3CD').setFontColor('#856404')
    .setRanges([statusRange]).build());

  // Disetujui → hijau
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Disetujui')
    .setBackground('#D4EDDA').setFontColor('#155724')
    .setRanges([statusRange]).build());

  // Ditolak → merah
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Ditolak')
    .setBackground('#F8D7DA').setFontColor('#721C24')
    .setRanges([statusRange]).build());

  sheet.setConditionalFormatRules(rules);

  // ── Freeze baris 1 ──
  sheet.setFrozenRows(1);

  // ── Filter ──
  const filterRange = sheet.getRange(1, 1, sheet.getMaxRows(), headers.length);
  if (sheet.getFilter()) sheet.getFilter().remove();
  filterRange.createFilter();

  // ── Rename spreadsheet ──
  ss.rename('e-Office SPPD — KPU Kota Serang');

  // ── Hapus sheet default "Sheet1" jika masih ada ──
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('✅ Sheet "' + SHEET_NAME + '" berhasil di-setup!');

  // ═══════════════════════════════════════════════
  //  SETUP SHEET: Data_BKPT
  // ═══════════════════════════════════════════════
  let bkptSheet = ss.getSheetByName(BKPT_SHEET_NAME);
  if (!bkptSheet) {
    bkptSheet = ss.insertSheet(BKPT_SHEET_NAME);
  } else {
    bkptSheet.clear();
    bkptSheet.clearConditionalFormatRules();
  }

  const bkptHeaders = [
    'ID_BKPT', 'Timestamp', 'Nama', 'Jabatan', 'Tugas', 'Tanggal', 'Tempat_Tujuan', 'Link_Foto'
  ];

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

  const bkptWidths = { 1: 190, 2: 170, 3: 200, 4: 220, 5: 350, 6: 130, 7: 250, 8: 300 };
  for (const col in bkptWidths) {
    bkptSheet.setColumnWidth(Number(col), bkptWidths[col]);
  }

  bkptSheet.setFrozenRows(1);

  const bkptFilterRange = bkptSheet.getRange(1, 1, bkptSheet.getMaxRows(), bkptHeaders.length);
  if (bkptSheet.getFilter()) bkptSheet.getFilter().remove();
  bkptFilterRange.createFilter();

  Logger.log('✅ Sheet "' + BKPT_SHEET_NAME + '" berhasil di-setup!');

  // ═══════════════════════════════════════════════
  //  SETUP SHEET: Data_Kuitansi
  // ═══════════════════════════════════════════════
  let kwtSheet = ss.getSheetByName(KWT_SHEET_NAME);
  if (!kwtSheet) {
    kwtSheet = ss.insertSheet(KWT_SHEET_NAME);
  } else {
    kwtSheet.clear();
    kwtSheet.clearConditionalFormatRules();
  }

  const kwtHeaders = [
    'ID_Kuitansi', 'Timestamp', 'Sudah_Terima_Dari', 'Jumlah_Uang', 'Terbilang',
    'Untuk_Pembayaran', 'Tanggal', 'Tempat', 'Link_Foto'
  ];

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
  for (const col in kwtWidths) {
    kwtSheet.setColumnWidth(Number(col), kwtWidths[col]);
  }

  // Format Rupiah kolom D (Jumlah_Uang)
  kwtSheet.getRange(2, 4, 998, 1).setNumberFormat('[$Rp] #,##0').setHorizontalAlignment('right');

  kwtSheet.setFrozenRows(1);

  const kwtFilterRange = kwtSheet.getRange(1, 1, kwtSheet.getMaxRows(), kwtHeaders.length);
  if (kwtSheet.getFilter()) kwtSheet.getFilter().remove();
  kwtFilterRange.createFilter();

  Logger.log('✅ Sheet "' + KWT_SHEET_NAME + '" berhasil di-setup!');
}
