/**
 * kuitansi.gs — Handler untuk form Kuitansi / Bukti Pembayaran
 * e-Office KPU Kota Serang
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
