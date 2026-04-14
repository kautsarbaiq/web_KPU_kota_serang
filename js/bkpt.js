/**
 * bkpt.js — BKPT Form: Photo Upload + Submit
 */

let bkptFileBase64 = null;
let bkptFileName   = null;

function initBkptUpload() {
    const area = document.getElementById('bkptUploadArea');
    if (!area) return;
    ['dragenter', 'dragover'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
    area.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file) processBkptFile(file);
    });
}

function handleBkptFileSelect(input) {
    if (input.files[0]) processBkptFile(input.files[0]);
}

function processBkptFile(file) {
    if (!file.type.match(/image\/(jpeg|png)/)) {
        showToast('error', 'Format Salah', 'Hanya JPG dan PNG yang diizinkan.');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        showToast('error', 'Ukuran Terlalu Besar', 'Maksimum ukuran file 2 MB.');
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        bkptFileBase64 = e.target.result;
        bkptFileName   = file.name;
        document.getElementById('bkptPreviewImg').src = bkptFileBase64;
        document.getElementById('bkptPreviewName').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
        document.getElementById('bkptUploadPlaceholder').classList.add('hidden');
        document.getElementById('bkptUploadPreview').classList.remove('hidden');
        document.getElementById('btnRemoveBkptPhoto').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeBkptPhoto() {
    bkptFileBase64 = null;
    bkptFileName   = null;
    document.getElementById('bkptFotoInput').value = '';
    document.getElementById('bkptUploadPlaceholder').classList.remove('hidden');
    document.getElementById('bkptUploadPreview').classList.add('hidden');
    document.getElementById('btnRemoveBkptPhoto').classList.add('hidden');
}

/* ── Submit BKPT ── */
async function submitBKPT(e) {
    e.preventDefault();
    const form = document.getElementById('bkptForm');

    if (!bkptFileBase64) {
        showToast('error', 'Foto Wajib', 'Upload bukti foto sebelum mengirim.');
        return;
    }

    const payload = {
        action: 'bkpt',
        nama: document.getElementById('bkpt_nama').value.trim(),
        jabatan: document.getElementById('bkpt_jabatan').value,
        tugas: document.getElementById('bkpt_tugas').value.trim(),
        tanggal: document.getElementById('bkpt_tanggal').value,
        tujuan: document.getElementById('bkpt_tujuan').value.trim(),
        foto: bkptFileBase64 || '',
        foto_nama: bkptFileName || '',
    };

    const btn = document.getElementById('btnSubmitBkpt');
    const btnIcon = document.getElementById('btnIconBkpt');
    const btnText = document.getElementById('btnTextBkpt');
    btn.disabled = true;
    btnIcon.classList.add('hidden');
    btnText.textContent = 'Mengirim Data…';
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinnerBkpt';
    spinner.className = 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin';
    btn.insertBefore(spinner, btn.firstChild);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();

        if (result.status === 'success') {
            showToast('success', 'Bukti Terkirim!', `ID: ${result.id} — Data berhasil disimpan.`);
            form.reset();
            removeBkptPhoto();
        } else {
            showToast('error', 'Gagal Mengirim', result.message || 'Terjadi kesalahan pada server.');
        }
    } catch (err) {
        showToast('error', 'Koneksi Gagal', 'Tidak dapat menghubungi server. Periksa jaringan Anda.');
    } finally {
        const sp = document.getElementById('loadingSpinnerBkpt');
        if (sp) sp.remove();
        btn.disabled = false;
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Kirim Bukti Konfirmasi';
    }
}

// Register init
const _origInitPage_bkpt = typeof initPageUpload === 'function' ? initPageUpload : () => {};
function initPageUpload(page) {
    _origInitPage_bkpt(page);
    if (page === 'bkpt-form') initBkptUpload();
}
