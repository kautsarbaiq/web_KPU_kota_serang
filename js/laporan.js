/**
 * laporan.js — Laporan Perjalanan Dinas: Dynamic Persons, Multi-Photo Upload + Submit + Print
 */

/* ── State ── */
let lpdFotos = []; // Array of { base64, name, size }

/* ── Init upload area (called after page loads) ── */
function initLpdUpload() {
    const area = document.getElementById('lpdUploadArea');
    if (!area) return;
    ['dragenter', 'dragover'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.add('dragover'); }));
    ['dragleave', 'drop'].forEach(ev => area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove('dragover'); }));
    area.addEventListener('drop', e => {
        const files = e.dataTransfer.files;
        if (files.length) handleLpdFotoFiles(files);
    });
}

/* ── Photo handling (multi-photo) ── */
function handleLpdFotoSelect(input) {
    if (input.files.length) handleLpdFotoFiles(input.files);
    input.value = ''; // Reset so same file can be selected again
}

function handleLpdFotoFiles(files) {
    for (const file of files) {
        if (!file.type.match(/image\/(jpeg|png)/)) {
            showToast('error', 'Format Salah', `"${file.name}" — Hanya JPG dan PNG yang diizinkan.`);
            continue;
        }
        if (file.size > 2 * 1024 * 1024) {
            showToast('error', 'Ukuran Terlalu Besar', `"${file.name}" — Maksimum 2 MB.`);
            continue;
        }

        const reader = new FileReader();
        reader.onload = e => {
            lpdFotos.push({ base64: e.target.result, name: file.name, size: file.size });
            renderLpdFotoGrid();
        };
        reader.readAsDataURL(file);
    }
}

function removeLpdFoto(index) {
    lpdFotos.splice(index, 1);
    renderLpdFotoGrid();
}

function renderLpdFotoGrid() {
    const grid = document.getElementById('lpdFotoGrid');
    if (!grid) return;
    grid.innerHTML = '';

    lpdFotos.forEach((foto, i) => {
        const card = document.createElement('div');
        card.className = 'relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-square';
        card.innerHTML = `
            <img src="${foto.base64}" alt="${foto.name}" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                <button type="button" onclick="removeLpdFoto(${i})"
                    class="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-all duration-200 transform scale-90 group-hover:scale-100"
                    title="Hapus foto">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                </button>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                <p class="text-[10px] text-white truncate">${foto.name}</p>
            </div>`;
        grid.appendChild(card);
    });
}

/* ── Dynamic person entries (Yang Membuat Laporan) ── */
function addPembuat() {
    const container = document.getElementById('lpdPembuatContainer');
    const count = container.querySelectorAll('.lpd-pembuat-entry').length + 1;

    const entry = document.createElement('div');
    entry.className = 'lpd-pembuat-entry flex items-start gap-2 fade-up';
    entry.innerHTML = `
        <span class="flex-shrink-0 w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold mt-2">${count}</span>
        <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" name="lpd_pembuat_nama[]" required placeholder="Nama lengkap"
                class="field-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none" />
            <input type="text" name="lpd_pembuat_jabatan[]" required placeholder="Jabatan"
                class="field-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none" />
        </div>
        <button type="button" onclick="removePembuat(this)" class="flex-shrink-0 mt-2 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition" title="Hapus">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
        </button>`;
    container.appendChild(entry);
    renumberPembuat();
}

function removePembuat(btn) {
    const container = document.getElementById('lpdPembuatContainer');
    const entries = container.querySelectorAll('.lpd-pembuat-entry');
    if (entries.length <= 1) {
        showToast('error', 'Minimal 1 Orang', 'Harus ada minimal satu pembuat laporan.');
        return;
    }
    btn.closest('.lpd-pembuat-entry').remove();
    renumberPembuat();
}

function renumberPembuat() {
    const entries = document.querySelectorAll('#lpdPembuatContainer .lpd-pembuat-entry');
    entries.forEach((entry, i) => {
        const badge = entry.querySelector('span');
        if (badge) badge.textContent = i + 1;
    });
}

/* ── Collect Pembuat Data ── */
function getPembuatData() {
    const names = document.querySelectorAll('input[name="lpd_pembuat_nama[]"]');
    const jabatans = document.querySelectorAll('input[name="lpd_pembuat_jabatan[]"]');
    const result = [];
    names.forEach((n, i) => {
        const nama = n.value.trim();
        const jabatan = jabatans[i] ? jabatans[i].value.trim() : '';
        if (nama) result.push({ nama, jabatan });
    });
    return result;
}

/* ── Submit Laporan ── */
async function submitLaporan(e) {
    e.preventDefault();

    const pembuat = getPembuatData();
    if (pembuat.length === 0) {
        showToast('error', 'Data Belum Lengkap', 'Tambahkan minimal 1 pembuat laporan.');
        return;
    }

    const payload = {
        action: 'laporan',
        surat_tugas: document.getElementById('lpd_surat_tugas').value.trim(),
        nomor_surat: document.getElementById('lpd_nomor_surat').value.trim(),
        tanggal_surat: document.getElementById('lpd_tanggal_surat').value,
        maksud_tujuan: document.getElementById('lpd_maksud_tujuan').value.trim(),
        materi: document.getElementById('lpd_materi').value.trim(),
        tempat: document.getElementById('lpd_tempat').value.trim(),
        hari_tanggal: document.getElementById('lpd_hari_tanggal').value.trim(),
        hasil: document.getElementById('lpd_hasil').value.trim(),
        pembuat: JSON.stringify(pembuat),
        fotos: lpdFotos.map(f => f.base64),
        foto_names: lpdFotos.map(f => f.name),
    };

    const btn = document.getElementById('btnSubmitLaporan');
    const btnIcon = document.getElementById('btnIconLaporan');
    const btnText = document.getElementById('btnTextLaporan');
    btn.disabled = true;
    btnIcon.classList.add('hidden');
    btnText.textContent = 'Mengirim Data…';
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinnerLpd';
    spinner.className = 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin';
    btn.insertBefore(spinner, btn.firstChild);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();

        if (result.status === 'success') {
            showToast('success', 'Laporan Terkirim!', `ID: ${result.id} — Data berhasil disimpan.`);
            document.getElementById('laporanForm').reset();
            lpdFotos = [];
            renderLpdFotoGrid();
            // Reset pembuat to single entry
            const container = document.getElementById('lpdPembuatContainer');
            container.innerHTML = `
                <div class="lpd-pembuat-entry flex items-start gap-2">
                    <span class="flex-shrink-0 w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold mt-2">1</span>
                    <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" name="lpd_pembuat_nama[]" required placeholder="Nama lengkap"
                            class="field-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none" />
                        <input type="text" name="lpd_pembuat_jabatan[]" required placeholder="Jabatan"
                            class="field-input w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 text-sm outline-none" />
                    </div>
                    <button type="button" onclick="removePembuat(this)" class="flex-shrink-0 mt-2 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition" title="Hapus">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                    </button>
                </div>`;
        } else {
            showToast('error', 'Gagal Mengirim', result.message || 'Terjadi kesalahan pada server.');
        }
    } catch (err) {
        showToast('error', 'Koneksi Gagal', 'Tidak dapat menghubungi server. Periksa jaringan Anda.');
    } finally {
        const sp = document.getElementById('loadingSpinnerLpd');
        if (sp) sp.remove();
        btn.disabled = false;
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Kirim Laporan';
    }
}

/* ── Print Laporan ── */
function printLaporan() {
    const surat_tugas = document.getElementById('lpd_surat_tugas').value.trim();
    const nomor_surat = document.getElementById('lpd_nomor_surat').value.trim();
    const tanggal_surat = document.getElementById('lpd_tanggal_surat').value;
    const maksud_tujuan = document.getElementById('lpd_maksud_tujuan').value.trim();
    const materi = document.getElementById('lpd_materi').value.trim();
    const tempat = document.getElementById('lpd_tempat').value.trim();
    const hari_tanggal = document.getElementById('lpd_hari_tanggal').value.trim();
    const hasil = document.getElementById('lpd_hasil').value.trim();
    const pembuat = getPembuatData();

    // Validate required
    if (!surat_tugas || !nomor_surat || !tanggal_surat || !maksud_tujuan || !tempat || !hari_tanggal || !hasil) {
        showToast('error', 'Data Belum Lengkap', 'Mohon isi semua field yang wajib (*) sebelum mencetak.');
        return;
    }
    if (pembuat.length === 0) {
        showToast('error', 'Data Belum Lengkap', 'Tambahkan minimal 1 pembuat laporan.');
        return;
    }

    // Format date
    function formatTanggal(dateStr) {
        if (!dateStr) return '-';
        const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        const d = new Date(dateStr);
        return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    }
    const tanggalFormatted = formatTanggal(tanggal_surat);
    const today = new Date();
    const bulanNow = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tanggalCetak = today.getDate() + ' ' + bulanNow[today.getMonth()] + ' ' + today.getFullYear();

    // Build pembuat rows
    const pembuatRows = pembuat.map((p, i) => `
        <tr>
            <td class="center">${i + 1}</td>
            <td>${p.nama}</td>
            <td>${p.jabatan}</td>
            <td style="height:50px;"></td>
        </tr>`).join('');

    // Build foto grid
    const fotoGrid = lpdFotos.length > 0 ? lpdFotos.map(f => `
        <div class="foto-item">
            <img src="${f.base64}" alt="${f.name}" />
            <p>${f.name}</p>
        </div>`).join('') : '<p style="color:#999; font-style:italic;">Tidak ada dokumentasi foto.</p>';

    // Escape newlines for textarea content
    const hasilFormatted = hasil.replace(/\n/g, '<br>');
    const maksudFormatted = maksud_tujuan.replace(/\n/g, '<br>');
    const materiFormatted = materi ? materi.replace(/\n/g, '<br>') : '';

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cetak Laporan Perjalanan Dinas</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { size: A4; margin: 1.5cm 2cm 2cm 2cm; }
        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt; line-height: 1.6; color: #000; background: #fff;
        }
        .page { width: 100%; max-width: 210mm; margin: 0 auto; }

        /* Kop Surat */
        .kop-surat {
            text-align: center; border-bottom: 3px double #000;
            padding-bottom: 10px; margin-bottom: 20px; position: relative;
        }
        .kop-surat .logo {
            position: absolute; left: 15px; top: 50%;
            transform: translateY(-50%); width: 75px; height: 85px;
        }
        .kop-surat .logo img { width: 100%; height: 100%; object-fit: contain; }
        .kop-header { padding-left: 90px; padding-right: 20px; }
        .kop-surat h1 { font-size: 14pt; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 2px; }
        .kop-surat h2 { font-size: 18pt; font-weight: bold; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 2px; }
        .kop-surat .alamat { font-size: 10pt; color: #333; line-height: 1.4; }

        .judul-surat { text-align: center; margin: 15px 0 20px; }
        .judul-surat h3 {
            font-size: 14pt; font-weight: bold; text-decoration: underline;
            letter-spacing: 2px; text-transform: uppercase;
        }

        .section-title {
            font-size: 13pt; font-weight: bold; margin: 20px 0 10px;
            padding-bottom: 4px; border-bottom: 1px solid #ccc;
        }

        .content-block { margin: 0 0 10px 20px; text-align: justify; }

        table.info-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        table.info-table td { padding: 3px 8px; vertical-align: top; font-size: 12pt; }
        table.info-table td:first-child { width: 35%; }
        table.info-table td:nth-child(2) { width: 3%; text-align: center; }

        table.pembuat-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        table.pembuat-table th, table.pembuat-table td {
            border: 1px solid #000; padding: 6px 10px; font-size: 11pt;
        }
        table.pembuat-table th { background: #f0f0f0; font-weight: bold; text-align: center; }
        table.pembuat-table td.center { text-align: center; }

        .foto-grid { display: flex; flex-wrap: wrap; gap: 12px; margin: 10px 0; }
        .foto-item { width: calc(50% - 6px); }
        .foto-item img {
            width: 100%; max-height: 250px; object-fit: cover;
            border: 1px solid #ddd; border-radius: 4px;
        }
        .foto-item p { font-size: 9pt; color: #666; text-align: center; margin-top: 4px; }

        .ttd-section { margin-top: 30px; display: flex; justify-content: flex-end; }
        .ttd-box { width: 45%; text-align: center; }
        .ttd-box .jabatan { font-weight: bold; margin-bottom: 60px; }
        .ttd-box .nama-ttd { font-weight: bold; text-decoration: underline; }
        .ttd-box .nip-ttd { font-size: 10pt; }

        .note { margin-top: 15px; font-size: 10pt; font-style: italic; color: #555; }

        /* Print Toolbar */
        .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0;
            background: linear-gradient(135deg, #9f1239, #be185d);
            padding: 12px 24px; display: flex; align-items: center;
            justify-content: space-between; z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .print-toolbar .toolbar-title {
            color: white; font-family: 'Inter', system-ui, sans-serif;
            font-size: 14px; font-weight: 600;
        }
        .print-toolbar .btn-print {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white; border: none; padding: 8px 24px; border-radius: 8px;
            font-family: 'Inter', system-ui, sans-serif; font-size: 13px;
            font-weight: 600; cursor: pointer; display: flex; align-items: center;
            gap: 6px; transition: all 0.2s;
        }
        .print-toolbar .btn-print:hover { filter: brightness(1.1); box-shadow: 0 4px 12px rgba(99,102,241,0.4); }

        @media print {
            .print-toolbar { display: none !important; }
            body { padding-top: 0 !important; }
            .page { padding-top: 0 !important; }
            .foto-item { page-break-inside: avoid; }
        }
        @media screen {
            body { padding-top: 60px; background: #e5e7eb; }
            .page {
                background: white; padding: 2cm; margin: 20px auto;
                box-shadow: 0 4px 24px rgba(0,0,0,0.12); border-radius: 4px;
            }
        }
    </style>
</head>
<body>
    <div class="print-toolbar">
        <span class="toolbar-title">📄 Preview Laporan Perjalanan Dinas</span>
        <button class="btn-print" onclick="window.print()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Cetak / Print
        </button>
    </div>

    <div class="page">
        <!-- KOP SURAT -->
        <div class="kop-surat">
            <div class="logo">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/National_emblem_of_Indonesia_Garuda_Pancasila.svg/188px-National_emblem_of_Indonesia_Garuda_Pancasila.svg.png" alt="Garuda Pancasila" />
            </div>
            <div class="kop-header">
                <h1>KOMISI PEMILIHAN UMUM</h1>
                <h2>KOTA SERANG</h2>
                <p class="alamat">
                    Jl. Jenderal Sudirman No. 35 Kota Serang, Banten 42111<br>
                    Telepon: (0254) 200200 &nbsp;|&nbsp; Email: kota_serang@kpu.go.id
                </p>
            </div>
        </div>

        <div class="judul-surat">
            <h3>Laporan Perjalanan Dinas</h3>
        </div>

        <!-- DASAR PELAKSANAAN -->
        <p class="section-title">I. Dasar Pelaksanaan</p>
        <table class="info-table">
            <tr><td>Surat Tugas</td><td>:</td><td>${surat_tugas}</td></tr>
            <tr><td>Nomor Surat</td><td>:</td><td>${nomor_surat}</td></tr>
            <tr><td>Tanggal</td><td>:</td><td>${tanggalFormatted}</td></tr>
        </table>

        <!-- MAKSUD DAN TUJUAN -->
        <p class="section-title">II. Maksud dan Tujuan</p>
        <div class="content-block">${maksudFormatted}</div>

        ${materi ? `
        <!-- MATERI -->
        <p class="section-title">III. Materi</p>
        <div class="content-block">${materiFormatted}</div>
        ` : ''}

        <!-- TEMPAT DAN WAKTU PELAKSANAAN -->
        <p class="section-title">${materi ? 'IV' : 'III'}. Tempat dan Waktu Pelaksanaan</p>
        <table class="info-table">
            <tr><td>Tempat Pelaksanaan</td><td>:</td><td>${tempat}</td></tr>
            <tr><td>Hari/Tanggal</td><td>:</td><td>${hari_tanggal}</td></tr>
        </table>

        <!-- HASIL PELAKSANAAN -->
        <p class="section-title">${materi ? 'V' : 'IV'}. Hasil Pelaksanaan</p>
        <div class="content-block">${hasilFormatted}</div>

        <!-- DOKUMENTASI -->
        <p class="section-title">${materi ? 'VI' : 'V'}. Dokumentasi</p>
        <div class="foto-grid">${fotoGrid}</div>

        <!-- YANG MEMBUAT LAPORAN -->
        <p class="section-title">${materi ? 'VII' : 'VI'}. Yang Membuat Laporan</p>
        <table class="pembuat-table">
            <thead>
                <tr>
                    <th style="width:8%">No</th>
                    <th>Nama</th>
                    <th>Jabatan</th>
                    <th style="width:20%">Tanda Tangan</th>
                </tr>
            </thead>
            <tbody>${pembuatRows}</tbody>
        </table>

        <!-- TTD -->
        <div class="ttd-section">
            <div class="ttd-box">
                <p>Serang, ${tanggalCetak}</p>
                <br>
                <p class="jabatan">Mengetahui,<br>Ketua KPU Kota Serang</p>
                <p class="nama-ttd">…………………………………</p>
                <p class="nip-ttd">NIP. ………………………………</p>
            </div>
        </div>

        <p class="note">* Dokumen ini dibuat secara digital melalui Portal e-Office KPU Kota Serang.</p>
    </div>
</body>
</html>`);
    printWindow.document.close();
}

// Register init — chain with existing
const _origInitPage_laporan = typeof initPageUpload === 'function' ? initPageUpload : () => {};
function initPageUpload(page) {
    _origInitPage_laporan(page);
    if (page === 'laporan-form') initLpdUpload();
}
