/**
 * spt.js — SPT Form: Submit
 */

/* ── Submit SPT ── */
async function submitSPT(e) {
    e.preventDefault();
    const form = document.getElementById('sptForm');

    const payload = {
        action: 'spt',
        nomor: document.getElementById('spt_nomor').value.trim(),
        menimbang: document.getElementById('spt_menimbang').value.trim(),
        dasar: document.getElementById('spt_dasar').value.trim(),
        kepada: document.getElementById('spt_kepada').value.trim(),
        untuk: document.getElementById('spt_untuk').value.trim(),
    };

    const btn = document.getElementById('btnSubmitSpt');
    const btnIcon = document.getElementById('btnIconSpt');
    const btnText = document.getElementById('btnTextSpt');
    btn.disabled = true;
    btnIcon.classList.add('hidden');
    btnText.textContent = 'Mengirim Data…';
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinnerSpt';
    spinner.className = 'w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin';
    btn.insertBefore(spinner, btn.firstChild);

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) });
        const result = await res.json();

        if (result.status === 'success') {
            showToast('success', 'Surat Perintah Terkirim!', `ID: ${result.id} — Data berhasil disimpan.`);
            form.reset();
            // scroll form back to top
            window.scrollTo({top: 0, behavior: 'smooth'});
        } else {
            showToast('error', 'Gagal Mengirim', result.message || 'Terjadi kesalahan pada server.');
        }
    } catch (err) {
        showToast('error', 'Koneksi Gagal', 'Tidak dapat menghubungi server. Periksa jaringan Anda.');
    } finally {
        const sp = document.getElementById('loadingSpinnerSpt');
        if (sp) sp.remove();
        btn.disabled = false;
        btnIcon.classList.remove('hidden');
        btnText.textContent = 'Kirim Surat Perintah';
    }
}
