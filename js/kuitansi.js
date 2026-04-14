/**
 * kuitansi.js — Kuitansi Form: Photo Upload + Submit
 */

let kwtFileBase64 = null;
let kwtFileName   = null;

function initKwtUpload() {
    const area = document.getElementById('kwtUploadArea');
    if (!area) return;
    ['dragenter', 'dragover'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
    area.addEventListener('drop', e => {
        const file = e.dataTransfer.files[0];
        if (file) processKwtFile(file);
    });
}

function handleKwtFileSelect(input) {
    if (input.files[0]) processKwtFile(input.files[0]);
}

function processKwtFile(file) {
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
        kwtFileBase64 = e.target.result;
        kwtFileName   = file.name;
        document.getElementById('kwtPreviewImg').src = kwtFileBase64;
        document.getElementById('kwtPreviewName').textContent = file.name + ' (' + (file.size / 1024).toFixed(0) + ' KB)';
        document.getElementById('kwtUploadPlaceholder').classList.add('hidden');
        document.getElementById('kwtUploadPreview').classList.remove('hidden');
        document.getElementById('btnRemoveKwtPhoto').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeKwtPhoto() {
    kwtFileBase64 = null;
    kwtFileName   = null;
    document.getElementById('kwtFotoInput').value = '';
    document.getElementById('kwtUploadPlaceholder').classList.remove('hidden');
    document.getElementById('kwtUploadPreview').classList.add('hidden');
    document.getElementById('btnRemoveKwtPhoto').classList.add('hidden');
}

/* ── Submit Kuitansi ── */
async function submitKuitansi(e) {
    e.preventDefault();
    const form = document.getElementById('kuitansiForm');

    if (!kwtFileBase64) {
        showToast('error', 'Foto Wajib', 'Upload bukti foto pembayaran sebelum mengirim.');
        return;
    }

    const rp = id => (document.getElementById(id).value || '0').replace(/\./g, '');

    const payload = {
        action: 'kuitansi',
        jumlah: rp('kwt_jumlah'),
        terbilang: document.getElementById('kwt_terbilang').value,
        pembayaran: document.getElementById('kwt_pembayaran').value.trim(),
        tanggal: document.getElementById('kwt_tanggal').value,
        tempat: document.getElementById('kwt_tempat').value.trim(),
        foto: kwtFileBase64 || '',
        foto_nama: kwtFileName || '',
    };

    const btn     = document.getElementById('btnSubmitKwt');
    const btnIcon = document.getElementById('btnIconKwt');
    const btnText = document.getElementById('btnTextKwt');
    btn.disabled = true;
    btnIcon.classList.add('hidden');
    btnText.textContent = 'Mengirim Data…';
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinnerKwt';
    spinner.className = 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin';
    btn.insertBefore(spinner, btn.firstChild);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();

        if (result.status === 'success') {
            showToast('success', 'Kuitansi Terkirim!', `ID: ${result.id} — Data berhasil disimpan.`);
            form.reset();
            removeKwtPhoto();
            document.getElementById('kwt_terbilang_display').innerHTML = '<span class="text-gray-300">Otomatis terisi dari jumlah uang…</span>';
        } else {
            showToast('error', 'Gagal Mengirim', result.message || 'Terjadi kesalahan pada server.');
        }
    } catch (err) {
        showToast('error', 'Koneksi Gagal', 'Tidak dapat menghubungi server. Periksa jaringan Anda.');
    } finally {
        const sp = document.getElementById('loadingSpinnerKwt');
        if (sp) sp.remove();
        btn.disabled = false;
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Kirim Kuitansi';
    }
}

// Register init
const _origInitPage_kwt = typeof initPageUpload === 'function' ? initPageUpload : () => {};
function initPageUpload(page) {
    _origInitPage_kwt(page);
    if (page === 'kuitansi-form') initKwtUpload();
}
