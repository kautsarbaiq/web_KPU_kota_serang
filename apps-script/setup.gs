/**
 * setup.gs — Setup Sheet
 * e-Office KPU Kota Serang
 *
 * Jalankan fungsi setupSheet() SEKALI untuk membuat semua sheet otomatis.
 * Cara pakai:
 *   1. Klik menu ▶ Run → pilih fungsi "setupSheet"
 *   2. Otorisasi jika diminta
 *   3. Selesai! Semua sheet siap dipakai.
 */

function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // ═══════════════════════════════════════════════
  //  SETUP SHEET: DATA_SPPD
  // ═══════════════════════════════════════════════
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
  const rupiahFormat = '[$Rp] #,##0';
  currencyCols.forEach(col => {
    sheet.getRange(2, col, 998, 1).setNumberFormat(rupiahFormat).setHorizontalAlignment('right');
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

  ss.rename('e-Office SPPD — KPU Kota Serang');

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

  kwtSheet.getRange(2, 4, 998, 1).setNumberFormat('[$Rp] #,##0').setHorizontalAlignment('right');

  kwtSheet.setFrozenRows(1);

  const kwtFilterRange = kwtSheet.getRange(1, 1, kwtSheet.getMaxRows(), kwtHeaders.length);
  if (kwtSheet.getFilter()) kwtSheet.getFilter().remove();
  kwtFilterRange.createFilter();

  Logger.log('✅ Sheet "' + KWT_SHEET_NAME + '" berhasil di-setup!');
}
