/**
 * bkpt.gs — Handler untuk form BKPT (Bukti Konfirmasi Penyelesaian Tugas)
 * e-Office KPU Kota Serang
 */

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
    bkptId,                                     // A - ID_BKPT
    timestamp,                                  // B - Timestamp
    (data.pejabat_nama || '').trim(),           // C - Nama_Pejabat
    (data.pejabat_jabatan || '').trim(),        // D - Jabatan_Pejabat
    (data.pelaksana_nama || '').trim(),         // E - Nama_Pelaksana
    (data.pelaksana_jabatan || '').trim(),      // F - Jabatan_Pelaksana
    (data.tugas || '').trim(),                  // G - Tugas
    data.tanggal,                               // H - Tanggal
    (data.tujuan || '').trim(),                 // I - Tempat_Tujuan
    fotoLink,                                   // J - Link_Foto
  ]);

  return buildResponse('success', 'Bukti konfirmasi berhasil disimpan.', bkptId);
}
