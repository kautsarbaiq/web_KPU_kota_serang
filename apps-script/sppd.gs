/**
 * sppd.gs — Handler untuk form SPPD
 * e-Office KPU Kota Serang
 */

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
}
