/**
 * main.gs — Router & Shared Helpers
 * e-Office KPU Kota Serang
 *
 * Berisi: doPost() router, doGet(), buildResponse(), generateRandomCode(), savePhotoToDrive()
 */

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
    return doPostSPPD(data);

  } catch (err) {
    return buildResponse('error', 'Server error: ' + err.message, null);
  }
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

/* ══════════════════════════════════════════════════════
 *  Shared Helper Functions
 * ══════════════════════════════════════════════════════ */

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

/**
 * Simpan foto base64 ke folder Google Drive.
 * Return: URL link file.
 */
function savePhotoToDrive(base64String, fileName, docId, folderName) {
  const folders = DriveApp.getFoldersByName(folderName || FOTO_FOLDER);
  const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName || FOTO_FOLDER);

  const parts    = base64String.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType  = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const rawBase64 = parts.length > 1 ? parts[1] : parts[0];

  const ext = mimeType === 'image/png' ? '.png' : '.jpg';
  const safeName = docId + '_' + fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

  const blob = Utilities.newBlob(Utilities.base64Decode(rawBase64), mimeType, safeName);
  const file = folder.createFile(blob);

  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

/**
 * Trigger untuk otorisasi Drive (jalankan manual sekali).
 */
function triggerDriveAuth() {
  const folders = DriveApp.getFoldersByName('test_auth');
  Logger.log('Drive access granted. Folders checked.');
}
