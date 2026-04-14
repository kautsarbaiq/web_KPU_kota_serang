/**
 * sppd.js — SPPD Form: Photo Upload + Submit
 */

let selectedFileBase64 = null;
let selectedFileName = null;

/* ── Init upload area (called after page loads) ── */
function initSppdUpload() {
    const area = document.getElementById('uploadArea');
    if (!area) return;
    ['dragenter', 'dragover'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
    area.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });
}

function handleFileSelect(input) {
    if (input.files[0]) processFile(input.files[0]);
}

function processFile(file) {
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
        selectedFileBase64 = e.target.result;
        selectedFileName = file.name;

        document.getElementById('previewImg').src = selectedFileBase64;
        document.getElementById('previewName').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
        document.getElementById('uploadPlaceholder').classList.add('hidden');
        document.getElementById('uploadPreview').classList.remove('hidden');
        document.getElementById('btnRemovePhoto').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removePhoto() {
    selectedFileBase64 = null;
    selectedFileName = null;
    document.getElementById('fotoInput').value = '';
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    document.getElementById('uploadPreview').classList.add('hidden');
    document.getElementById('btnRemovePhoto').classList.add('hidden');
}

/* ── Submit SPPD ── */
async function submitSPPD(e) {
    e.preventDefault();

    const btn = document.getElementById('btnSubmit');
    const btnText = document.getElementById('btnText');
    const btnIcon = document.getElementById('btnIcon');
    const form = document.getElementById('sppdForm');

    // Validasi tanggal
    const tglBerangkat = document.getElementById('tglBerangkat').value;
    const tglKembali = document.getElementById('tglKembali').value;
    if (tglKembali < tglBerangkat) {
        showToast('error', 'Validasi Gagal', 'Tanggal kembali tidak boleh sebelum tanggal berangkat.');
        return;
    }

    const rp = id => (document.getElementById(id).value || '0').replace(/\./g, '');

    const payload = {
        nama: document.getElementById('nama').value.trim(),
        nip: document.getElementById('nip').value.trim(),
        pangkat: document.getElementById('pangkat').value,
        golongan: document.getElementById('golongan').value,
        jabatan: document.getElementById('jabatan').value,
        bagian: document.getElementById('bagian').value,
        tujuan_dinas: document.getElementById('tujuan_dinas').value.trim(),
        kegiatan: document.getElementById('kegiatan').value.trim(),
        tglBerangkat: tglBerangkat,
        tglKembali: tglKembali,
        uang_harian: rp('uang_harian'),
        uang_transport: rp('uang_transport'),
        representasi: rp('representasi'),
        biaya_lokal: rp('biaya_lokal'),
        jumlah_sppd: rp('jumlah_sppd'),
        biaya_hotel: rp('biaya_hotel'),
        no_tiket: document.getElementById('no_tiket').value.trim(),
        airlines: document.getElementById('airlines').value.trim(),
        tujuan_tiket: document.getElementById('tujuan_tiket').value.trim(),
        harga_tiket: rp('harga_tiket'),
        airport_tax: rp('airport_tax'),
        foto: selectedFileBase64 || '',
        foto_nama: selectedFileName || '',
    };

    btn.disabled = true;
    btnIcon.classList.add('hidden');
    btnText.textContent = 'Mengirim Data...';
    btn.insertAdjacentHTML('afterbegin', '<span class="spinner mr-2" id="loadingSpinner"></span>');

    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload),
        });
        const result = await res.json();

        if (result.status === 'success') {
            showToast('success', 'SPPD Terkirim!', `ID: ${result.id} — Data berhasil disimpan.`);
            form.reset();
            removePhoto();
        } else {
            showToast('error', 'Gagal Mengirim', result.message || 'Terjadi kesalahan pada server.');
        }
    } catch (err) {
        showToast('error', 'Koneksi Gagal', 'Tidak dapat menghubungi server. Periksa jaringan Anda.');
    } finally {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) spinner.remove();
        btn.disabled = false;
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Kirim SPPD';
    }
}

// Register init for dynamic page loading
function initPageUpload(page) {
    if (page === 'sppd-form') initSppdUpload();
}
