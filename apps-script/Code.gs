/**
 * ═══════════════════════════════════════════════════════════════
 *  e-Office KPU Kota Serang — Google Apps Script (All-in-One)
 *  
 *  CARA PAKAI:
 *  1. Copy SELURUH isi file ini
 *  2. Paste di Google Apps Script editor (hapus kode lama dulu)
 *  3. Klik Save (Ctrl+S)
 *  4. Pilih fungsi "setupSheet" → Klik Run → Otorisasi
 *  5. Pilih fungsi "triggerDriveAuth" → Klik Run → Otorisasi
 *  6. Deploy → New Deployment → Web App → Anyone → Deploy
 *  7. Copy URL dan paste di js/app.js
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

// Drive folder names (1 fitur = 1 folder foto)
const FOTO_FOLDER = 'SPPD_Foto';
const BKPT_FOLDER = 'BKPT_Foto';
const KWT_FOLDER  = 'Kuitansi_Foto';


/* ══════════════════════════════════════════════════════
 *  ROUTER — Menerima POST dari frontend
 * ══════════════════════════════════════════════════════ */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === 'bkpt') {
      return doPostBKPT(data);
    }
    if (data.action === 'kuitansi') {
      return doPostKuitansi(data);
    }

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
      message: 'e-Office SPPD API v3 aktif. Gunakan POST untuk mengirim data.',
    }))
    .setMimeType(ContentService.MimeType.JSON);
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
  const required = ['nama', 'jabatan', 'tugas', 'tanggal', 'tujuan'];
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
    (data.nama || '').trim(),
    (data.jabatan || '').trim(),
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
 *  SETUP SHEET — Jalankan SEKALI untuk buat 3 sheet
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

  const bkptHeaders = ['ID_BKPT', 'Timestamp', 'Nama', 'Jabatan', 'Tugas', 'Tanggal', 'Tempat_Tujuan', 'Link_Foto'];
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

  // ─── Cleanup ──────────────────────────────────
  ss.rename('e-Office SPPD — KPU Kota Serang');
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log('🎉 SEMUA SHEET BERHASIL DI-SETUP!');
}
