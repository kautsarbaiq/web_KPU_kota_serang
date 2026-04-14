/**
 * ═══════════════════════════════════════════════════
 *  app.js — Core Navigation, Toast, Utilities
 *  e-Office KPU Kota Serang
 * ═══════════════════════════════════════════════════
 */

// ╔══════════════════════════════════════════════════════════════╗
// ║  GANTI URL DI BAWAH DENGAN URL WEB APP GOOGLE APPS SCRIPT   ║
// ║  Contoh: https://script.google.com/macros/s/ABCXYZ/exec     ║
// ╚══════════════════════════════════════════════════════════════╝
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzcYWw_ZxEi1dpsLXoWF_8X8g9EwAyh-LI985Kdl_f8i-1evDxFUme8Xb3VgIHlX32n7g/exec';

/* ── Dynamic page definitions ───────────────────────── */
const PAGE_CONFIG = {
    'home': { title: 'Home', nav: 'nav-home', file: null },
    'sppd': { title: 'SPPD', nav: 'nav-sppd', file: null },
    'sppd-form': { title: 'Buat SPPD', nav: 'nav-sppd', file: 'pages/sppd-form.html', script: 'js/sppd.js' },
    'bkpt-form': { title: 'Bukti Konfirmasi', nav: 'nav-sppd', file: 'pages/bkpt-form.html', script: 'js/bkpt.js' },
    'kuitansi-form': { title: 'Kuitansi', nav: 'nav-sppd', file: 'pages/kuitansi-form.html', script: 'js/kuitansi.js' },
    'spt-form': { title: 'Surat Perintah', nav: 'nav-sppd', file: 'pages/spt-form.html', script: 'js/spt.js' },
};

// Track currently loaded script to avoid duplicates
const loadedScripts = new Set();

/* ── Page Navigation ─────────────────────────────────── */
async function showPage(page) {
    const config = PAGE_CONFIG[page];
    if (!config) return;

    // Hide all static pages
    document.getElementById('page-home').classList.add('hidden');
    document.getElementById('page-sppd').classList.add('hidden');

    // Hide & clear dynamic content container
    const dynContainer = document.getElementById('page-dynamic');
    dynContainer.classList.add('hidden');
    dynContainer.innerHTML = '';

    // Reset active nav
    document.getElementById('nav-home').classList.remove('active');
    document.getElementById('nav-sppd').classList.remove('active');

    // Set active nav & title
    document.getElementById(config.nav).classList.add('active');
    document.getElementById('page-title').textContent = config.title;

    if (config.file) {
        // Dynamic page — load from pages/ folder
        try {
            const res = await fetch(config.file);
            const html = await res.text();
            dynContainer.innerHTML = html;
            dynContainer.classList.remove('hidden');

            // Load feature-specific JS if needed
            if (config.script && !loadedScripts.has(config.script)) {
                const script = document.createElement('script');
                script.src = config.script;
                document.body.appendChild(script);
                loadedScripts.add(config.script);
            }

            // Initialize upload area if present (after DOM is injected)
            setTimeout(() => {
                if (typeof initPageUpload === 'function') initPageUpload(page);
            }, 50);

        } catch (err) {
            dynContainer.innerHTML = '<div class="flex items-center justify-center h-64"><p class="text-red-400">Gagal memuat halaman. Pastikan file tersedia.</p></div>';
            dynContainer.classList.remove('hidden');
        }
    } else {
        // Static page — show/hide
        document.getElementById('page-' + page).classList.remove('hidden');
    }

    // Close mobile sidebar
    if (window.innerWidth < 768) toggleSidebar();
}

/* ── Mobile Sidebar Toggle ───────────────────────────── */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
    document.getElementById('overlay').classList.toggle('hidden');
}

/* ── Currency Formatter ──────────────────────────────── */
function formatCurrency(el) {
    let val = el.value.replace(/\D/g, '');
    el.value = val.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/* ── Terbilang (angka → kata Indonesia) ──────────────── */
function angkaKeKata(n) {
    if (n === 0) return 'Nol';
    const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return satuan[n];
    if (n < 20) return satuan[n - 10] + ' Belas';
    if (n < 100) return satuan[Math.floor(n / 10)] + ' Puluh' + (n % 10 ? ' ' + satuan[n % 10] : '');
    if (n < 200) return 'Seratus' + (n - 100 ? ' ' + angkaKeKata(n - 100) : '');
    if (n < 1000) return satuan[Math.floor(n / 100)] + ' Ratus' + (n % 100 ? ' ' + angkaKeKata(n % 100) : '');
    if (n < 2000) return 'Seribu' + (n - 1000 ? ' ' + angkaKeKata(n - 1000) : '');
    if (n < 1000000) return angkaKeKata(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 ? ' ' + angkaKeKata(n % 1000) : '');
    if (n < 1000000000) return angkaKeKata(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 ? ' ' + angkaKeKata(n % 1000000) : '');
    if (n < 1000000000000) return angkaKeKata(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 ? ' ' + angkaKeKata(n % 1000000000) : '');
    return angkaKeKata(Math.floor(n / 1000000000000)) + ' Triliun' + (n % 1000000000000 ? ' ' + angkaKeKata(n % 1000000000000) : '');
}

function updateTerbilang() {
    const raw = (document.getElementById('kwt_jumlah').value || '0').replace(/\./g, '');
    const num = parseInt(raw, 10) || 0;
    const display = document.getElementById('kwt_terbilang_display');
    const hidden = document.getElementById('kwt_terbilang');
    if (num > 0) {
        const kata = angkaKeKata(num) + ' Rupiah';
        display.innerHTML = '<span class="text-gray-700 font-medium not-italic">' + kata + '</span>';
        hidden.value = kata;
    } else {
        display.innerHTML = '<span class="text-gray-300">Otomatis terisi dari jumlah uang…</span>';
        hidden.value = '';
    }
}

/* ── Toast Notification ──────────────────────────────── */
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    const icon = type === 'success'
        ? '<svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
        : '<svg class="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';

    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    ${icon}
    <div class="flex-1 min-w-0">
      <p class="font-semibold text-sm">${title}</p>
      <p class="text-xs mt-0.5 opacity-90">${message}</p>
    </div>
    <button onclick="this.parentElement.classList.add('hide'); setTimeout(() => this.parentElement.remove(), 300)" class="ml-2 p-1 rounded-lg hover:bg-white/20 transition flex-shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
    </button>`;

    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}
