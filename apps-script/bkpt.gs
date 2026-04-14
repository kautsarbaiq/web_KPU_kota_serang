/**
 * bkpt.gs — Handler untuk form BKPT (Bukti Konfirmasi Penyelesaian Tugas)
 * e-Office KPU Kota Serang
 */

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
