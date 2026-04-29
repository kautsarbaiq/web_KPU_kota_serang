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

/* ── Print SPD ── */
function printSPPD() {
    // Collect form data
    const nama = document.getElementById('nama').value.trim();
    const nip = document.getElementById('nip').value.trim();
    const pangkat = document.getElementById('pangkat').value;
    const golongan = document.getElementById('golongan').value;
    const jabatan = document.getElementById('jabatan').value;
    const bagian = document.getElementById('bagian').value;
    const tujuan_dinas = document.getElementById('tujuan_dinas').value.trim();
    const kegiatan = document.getElementById('kegiatan').value.trim();
    const tglBerangkat = document.getElementById('tglBerangkat').value;
    const tglKembali = document.getElementById('tglKembali').value;
    const uang_harian = document.getElementById('uang_harian').value || '-';
    const uang_transport = document.getElementById('uang_transport').value || '-';
    const representasi = document.getElementById('representasi').value || '-';
    const biaya_lokal = document.getElementById('biaya_lokal').value || '-';
    const jumlah_sppd = document.getElementById('jumlah_sppd').value || '-';
    const biaya_hotel = document.getElementById('biaya_hotel').value || '-';
    const no_tiket = document.getElementById('no_tiket').value.trim() || '-';
    const airlines = document.getElementById('airlines').value.trim() || '-';
    const tujuan_tiket = document.getElementById('tujuan_tiket').value.trim() || '-';
    const harga_tiket = document.getElementById('harga_tiket').value || '-';
    const airport_tax = document.getElementById('airport_tax').value || '-';

    // Validate required fields
    if (!nama || !jabatan || !bagian || !tujuan_dinas || !kegiatan || !tglBerangkat || !tglKembali) {
        showToast('error', 'Data Belum Lengkap', 'Mohon isi semua field yang wajib (*) sebelum mencetak.');
        return;
    }

    // Format dates
    function formatTanggal(dateStr) {
        if (!dateStr) return '-';
        const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        const d = new Date(dateStr);
        return d.getDate() + ' ' + bulan[d.getMonth()] + ' ' + d.getFullYear();
    }

    const tglBerangkatFormatted = formatTanggal(tglBerangkat);
    const tglKembaliFormatted = formatTanggal(tglKembali);

    // Calculate duration
    const d1 = new Date(tglBerangkat);
    const d2 = new Date(tglKembali);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Today's date for letter
    const today = new Date();
    const bulanNow = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    const tanggalSurat = today.getDate() + ' ' + bulanNow[today.getMonth()] + ' ' + today.getFullYear();

    // Build print window
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Cetak SPD - ${nama}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        @page {
            size: A4;
            margin: 1.5cm 2cm 2cm 2cm;
        }

        body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 12pt;
            line-height: 1.5;
            color: #000;
            background: #fff;
        }

        .page {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            padding: 0;
        }

        /* ── Kop Surat ── */
        .kop-surat {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
            position: relative;
        }

        .kop-surat .logo {
            position: absolute;
            left: 15px;
            top: 50%;
            transform: translateY(-50%);
            width: 75px;
            height: 85px;
        }

        .kop-surat .logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .kop-header {
            padding-left: 90px;
            padding-right: 20px;
        }

        .kop-surat h1 {
            font-size: 14pt;
            font-weight: bold;
            letter-spacing: 2px;
            margin-bottom: 2px;
            text-transform: uppercase;
        }

        .kop-surat h2 {
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 3px;
            margin-bottom: 2px;
            text-transform: uppercase;
        }

        .kop-surat .alamat {
            font-size: 10pt;
            color: #333;
            line-height: 1.4;
        }

        /* ── Content ── */
        .judul-surat {
            text-align: center;
            margin: 15px 0;
        }

        .judul-surat h3 {
            font-size: 14pt;
            font-weight: bold;
            text-decoration: underline;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-bottom: 3px;
        }

        .judul-surat p {
            font-size: 11pt;
        }

        table.data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }

        table.data-table td {
            padding: 4px 8px;
            vertical-align: top;
            font-size: 12pt;
        }

        table.data-table td:first-child {
            width: 5%;
            text-align: center;
        }

        table.data-table td:nth-child(2) {
            width: 35%;
        }

        table.data-table td:nth-child(3) {
            width: 3%;
            text-align: center;
        }

        table.data-table td:nth-child(4) {
            width: 57%;
        }

        .rincian-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }

        .rincian-table th,
        .rincian-table td {
            border: 1px solid #000;
            padding: 6px 10px;
            font-size: 11pt;
            text-align: left;
        }

        .rincian-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .rincian-table td.right {
            text-align: right;
        }

        .rincian-table td.center {
            text-align: center;
        }

        .rincian-table tfoot td {
            font-weight: bold;
            background: #f8f8f8;
        }

        .ttd-section {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
        }

        .ttd-box {
            width: 45%;
            text-align: center;
        }

        .ttd-box .jabatan {
            font-weight: bold;
            margin-bottom: 60px;
        }

        .ttd-box .nama-ttd {
            font-weight: bold;
            text-decoration: underline;
        }

        .ttd-box .nip-ttd {
            font-size: 10pt;
        }

        .section-title {
            font-weight: bold;
            margin: 15px 0 8px 0;
            font-size: 12pt;
        }

        .note {
            margin-top: 15px;
            font-size: 10pt;
            font-style: italic;
            color: #555;
        }

        /* ── Print Toolbar ── */
        .print-toolbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #1b3a5c, #3d6491);
            padding: 12px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            z-index: 1000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }

        .print-toolbar .toolbar-title {
            color: white;
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 14px;
            font-weight: 600;
        }

        .print-toolbar .btn-print {
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            padding: 8px 24px;
            border-radius: 8px;
            font-family: 'Inter', system-ui, sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s;
        }

        .print-toolbar .btn-print:hover {
            filter: brightness(1.1);
            box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }

        @media print {
            .print-toolbar { display: none !important; }
            body { padding-top: 0 !important; }
            .page { padding-top: 0 !important; }
        }

        @media screen {
            body { padding-top: 60px; background: #e5e7eb; }
            .page {
                background: white;
                padding: 2cm;
                margin: 20px auto;
                box-shadow: 0 4px 24px rgba(0,0,0,0.12);
                border-radius: 4px;
            }
        }
    </style>
</head>
<body>
    <!-- Print Toolbar -->
    <div class="print-toolbar">
        <span class="toolbar-title">📄 Preview Surat Perintah Perjalanan Dinas</span>
        <button class="btn-print" onclick="window.print()">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Cetak / Print
        </button>
    </div>

    <div class="page">
        <!-- ═══ KOP SURAT ═══ -->
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

        <!-- ═══ JUDUL SURAT ═══ -->
        <div class="judul-surat">
            <h3>Surat Perintah Perjalanan Dinas</h3>
            <p>Nomor: ………………………………………</p>
        </div>

        <!-- ═══ DATA SURAT ═══ -->
        <table class="data-table">
            <tr>
                <td>1</td>
                <td>Pejabat Pembuat Komitmen</td>
                <td>:</td>
                <td>Ketua KPU Kota Serang</td>
            </tr>
            <tr>
                <td>2</td>
                <td>Nama / NIP Pegawai</td>
                <td>:</td>
                <td><strong>${nama}</strong>${nip ? ' / NIP. ' + nip : ''}</td>
            </tr>
            <tr>
                <td>3</td>
                <td>Pangkat / Golongan</td>
                <td>:</td>
                <td>${pangkat || '-'} / ${golongan || '-'}</td>
            </tr>
            <tr>
                <td>4</td>
                <td>Jabatan</td>
                <td>:</td>
                <td>${jabatan || '-'}</td>
            </tr>
            <tr>
                <td>5</td>
                <td>Bagian / Sub Bagian</td>
                <td>:</td>
                <td>${bagian || '-'}</td>
            </tr>
            <tr>
                <td>6</td>
                <td>Maksud Perjalanan Dinas</td>
                <td>:</td>
                <td>${kegiatan}</td>
            </tr>
            <tr>
                <td>7</td>
                <td>Alat Angkutan</td>
                <td>:</td>
                <td>${airlines !== '-' ? 'Pesawat (' + airlines + ')' : 'Kendaraan Dinas / Umum'}</td>
            </tr>
            <tr>
                <td>8</td>
                <td>Tempat Berangkat</td>
                <td>:</td>
                <td>Serang</td>
            </tr>
            <tr>
                <td>9</td>
                <td>Tempat Tujuan</td>
                <td>:</td>
                <td>${tujuan_dinas}</td>
            </tr>
            <tr>
                <td>10</td>
                <td>Lamanya Perjalanan Td</td>
                <td>:</td>
                <td>${diffDays} (${angkaKeKata(diffDays)}) Hari</td>
            </tr>
            <tr>
                <td>11</td>
                <td>Tanggal Berangkat</td>
                <td>:</td>
                <td>${tglBerangkatFormatted}</td>
            </tr>
            <tr>
                <td>12</td>
                <td>Tanggal Harus Kembali</td>
                <td>:</td>
                <td>${tglKembaliFormatted}</td>
            </tr>
            <tr>
                <td>13</td>
                <td>Pengikut</td>
                <td>:</td>
                <td>—</td>
            </tr>
            <tr>
                <td>14</td>
                <td>Pembebanan Anggaran</td>
                <td>:</td>
                <td></td>
            </tr>
            <tr>
                <td></td>
                <td style="padding-left: 20px;">a. Instansi</td>
                <td>:</td>
                <td>KPU Kota Serang</td>
            </tr>
            <tr>
                <td></td>
                <td style="padding-left: 20px;">b. Mata Anggaran</td>
                <td>:</td>
                <td>………………………</td>
            </tr>
        </table>

        <!-- ═══ RINCIAN BIAYA ═══ -->
        <p class="section-title">Rincian Biaya Perjalanan Dinas:</p>
        <table class="rincian-table">
            <thead>
                <tr>
                    <th style="width:5%">No</th>
                    <th>Uraian</th>
                    <th style="width:30%">Jumlah (Rp)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="center">1</td>
                    <td>Uang Harian (${diffDays} hari)</td>
                    <td class="right">${uang_harian !== '-' ? 'Rp ' + uang_harian : '-'}</td>
                </tr>
                <tr>
                    <td class="center">2</td>
                    <td>Uang Transportasi</td>
                    <td class="right">${uang_transport !== '-' ? 'Rp ' + uang_transport : '-'}</td>
                </tr>
                <tr>
                    <td class="center">3</td>
                    <td>Biaya Representasi</td>
                    <td class="right">${representasi !== '-' ? 'Rp ' + representasi : '-'}</td>
                </tr>
                <tr>
                    <td class="center">4</td>
                    <td>Biaya Lokal</td>
                    <td class="right">${biaya_lokal !== '-' ? 'Rp ' + biaya_lokal : '-'}</td>
                </tr>
                <tr>
                    <td class="center">5</td>
                    <td>Biaya Penginapan / Hotel</td>
                    <td class="right">${biaya_hotel !== '-' ? 'Rp ' + biaya_hotel : '-'}</td>
                </tr>
                ${airlines !== '-' ? `
                <tr>
                    <td class="center">6</td>
                    <td>Tiket ${airlines} (${tujuan_tiket}) — No. ${no_tiket}</td>
                    <td class="right">${harga_tiket !== '-' ? 'Rp ' + harga_tiket : '-'}</td>
                </tr>
                <tr>
                    <td class="center">7</td>
                    <td>Airport Tax</td>
                    <td class="right">${airport_tax !== '-' ? 'Rp ' + airport_tax : '-'}</td>
                </tr>` : ''}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2" style="text-align:right; padding-right:15px;"><strong>Jumlah SPD Yang Diterima</strong></td>
                    <td class="right"><strong>${jumlah_sppd !== '-' ? 'Rp ' + jumlah_sppd : '-'}</strong></td>
                </tr>
            </tfoot>
        </table>

        <!-- ═══ TANDA TANGAN ═══ -->
        <div class="ttd-section">
            <div class="ttd-box">
                <p>Dikeluarkan di : Serang</p>
                <p>Pada tanggal : ${tanggalSurat}</p>
                <br>
                <p class="jabatan">Ketua KPU Kota Serang</p>
                <p class="nama-ttd">…………………………………</p>
                <p class="nip-ttd">NIP. ………………………………</p>
            </div>
            <div class="ttd-box">
                <p>&nbsp;</p>
                <p>&nbsp;</p>
                <br>
                <p class="jabatan">Yang Menerima Perintah,</p>
                <p class="nama-ttd">${nama}</p>
                <p class="nip-ttd">${nip ? 'NIP. ' + nip : ''}</p>
            </div>
        </div>

        <p class="note">* Dokumen ini dibuat secara digital melalui Portal e-Office KPU Kota Serang.</p>
    </div>
</body>
</html>`);
    printWindow.document.close();
}

// Register init for dynamic page loading
function initPageUpload(page) {
    if (page === 'sppd-form') initSppdUpload();
}
