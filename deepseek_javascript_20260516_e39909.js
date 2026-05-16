// Konfigurasi
const API_BASE = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // Ganti!
let currentUser = null;
let currentData = { siswa: [], tugas: [], pengumpulan: [] };

// Helper API
async function callAPI(action, params = {}) {
    params.action = action;
    const url = new URL(API_BASE);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    try {
        const res = await fetch(url.toString());
        return await res.json();
    } catch (err) {
        Swal.fire('Error', 'Gagal terhubung ke server', 'error');
        return { error: err.message };
    }
}

// Render berdasarkan role
function renderApp() {
    if (!currentUser) {
        document.getElementById('app').innerHTML = renderLogin();
    } else if (currentUser.role === 'guru') {
        loadGuruData();
        document.getElementById('app').innerHTML = renderGuruDashboard();
    } else {
        loadSiswaData();
        document.getElementById('app').innerHTML = renderSiswaDashboard();
    }
    attachEvents();
}

// ========== KOMPONEN LOGIN ==========
function renderLogin() {
    return `
    <div class="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-20">
        <h1 class="text-3xl font-bold text-center text-blue-600 mb-2">LKPD Digital</h1>
        <p class="text-center text-gray-500 mb-8">Sistem Tugas Siswa Online</p>
        <div class="space-y-4">
            <button onclick="showGuruLogin()" class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition">Masuk sebagai Guru</button>
            <button onclick="showSiswaLogin()" class="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition">Masuk sebagai Siswa</button>
        </div>
    </div>`;
}

function showGuruLogin() {
    Swal.fire({
        title: 'Login Guru',
        input: 'password',
        inputLabel: 'Kode Guru',
        inputPlaceholder: 'Masukkan kode guru',
        showCancelButton: true,
        preConfirm: async (password) => {
            if (password === 'guru123') { // Ganti dengan kode rahasia Anda
                currentUser = { role: 'guru', nama: 'Guru Utama' };
                renderApp();
            } else {
                Swal.fire('Error', 'Kode guru salah!', 'error');
            }
        }
    });
}

function showSiswaLogin() {
    Swal.fire({
        title: 'Login Siswa',
        html: `<input id="swal-nama" class="swal2-input" placeholder="Nama">
               <input id="swal-password" class="swal2-input" type="password" placeholder="Password">`,
        preConfirm: async () => {
            const nama = document.getElementById('swal-nama').value;
            const password = document.getElementById('swal-password').value;
            const result = await callAPI('loginSiswa', { nama, password });
            if (result.success) {
                currentUser = { role: 'siswa', ...result.siswa };
                renderApp();
            } else {
                Swal.fire('Gagal', result.error || 'Login gagal', 'error');
            }
        }
    });
}

// ========== DASHBOARD GURU ==========
function renderGuruDashboard() {
    return `
    <div class="bg-white rounded-xl shadow-xl p-6">
        <div class="flex justify-between items-center border-b pb-4 mb-6">
            <h2 class="text-2xl font-bold text-gray-800">👨‍🏫 Dashboard Guru</h2>
            <button onclick="logout()" class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">Keluar</button>
        </div>
        
        <!-- Tab Navigation -->
        <div class="flex gap-2 border-b mb-6">
            <button class="tab-btn active" data-tab="siswa">📋 Data Siswa</button>
            <button class="tab-btn" data-tab="tugas">📝 Manajemen Tugas</button>
            <button class="tab-btn" data-tab="penilaian">✅ Penilaian & Persetujuan</button>
        </div>
        
        <!-- Tab Siswa -->
        <div id="tab-siswa" class="tab-content">
            <div class="flex gap-3 mb-4">
                <input type="text" id="namaSiswa" placeholder="Nama" class="border p-2 rounded flex-1">
                <input type="text" id="kelasSiswa" placeholder="Kelas" class="border p-2 rounded w-32">
                <button onclick="tambahSiswa()" class="bg-green-600 text-white px-4 py-2 rounded">Tambah</button>
            </div>
            <div id="siswaList" class="grid gap-2">${renderSiswaList()}</div>
        </div>
        
        <!-- Tab Tugas -->
        <div id="tab-tugas" class="tab-content hidden">
            <button onclick="showTugasForm()" class="bg-blue-600 text-white px-4 py-2 rounded mb-4">+ Tugas Baru</button>
            <div id="tugasList" class="grid gap-4">${renderTugasList()}</div>
        </div>
        
        <!-- Tab Penilaian -->
        <div id="tab-penilaian" class="tab-content hidden">
            <div id="penilaianList" class="grid gap-4">${renderPenilaianList()}</div>
        </div>
    </div>
    
    <!-- Modal Tugas -->
    <div id="tugasModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
        <div class="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold mb-4" id="modalTugasTitle">Tugas Baru</h3>
            <input type="hidden" id="editTugasId">
            <input type="text" id="judulTugas" placeholder="Judul Tugas" class="w-full border p-2 rounded mb-3">
            <textarea id="deskripsiTugas" placeholder="Deskripsi" class="w-full border p-2 rounded mb-3" rows="3"></textarea>
            <input type="date" id="deadlineTugas" class="w-full border p-2 rounded mb-3">
            <input type="number" id="nilaiMaksimal" placeholder="Nilai Maksimal" class="w-full border p-2 rounded mb-4" value="100">
            <div class="flex justify-end gap-2">
                <button onclick="closeModal('tugasModal')" class="bg-gray-400 text-white px-4 py-2 rounded">Batal</button>
                <button onclick="simpanTugas()" class="bg-blue-600 text-white px-4 py-2 rounded">Simpan</button>
            </div>
        </div>
    </div>`;
}

async function loadGuruData() {
    currentData.siswa = await callAPI('getSiswa');
    currentData.tugas = await callAPI('getTugas');
    currentData.pengumpulan = await callAPI('getPengumpulan');
}

function renderSiswaList() {
    if (!currentData.siswa.length) return '<p class="text-gray-500">Belum ada siswa</p>';
    return currentData.siswa.map(s => `
        <div class="bg-gray-50 p-3 rounded flex justify-between items-center">
            <div><span class="font-semibold">${s.nama}</span> - ${s.kelas}</div>
            <button onclick="hapusSiswa('${s.id}')" class="text-red-600 hover:text-red-800">🗑️ Hapus</button>
        </div>
    `).join('');
}

function renderTugasList() {
    if (!currentData.tugas.length) return '<p class="text-gray-500">Belum ada tugas</p>';
    return currentData.tugas.map(t => `
        <div class="border p-4 rounded-lg shadow-sm">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-lg">${t.judul}</h4>
                    <p class="text-gray-600 text-sm">${t.deskripsi}</p>
                    <p class="text-xs text-gray-500 mt-1">Deadline: ${t.deadline} | Maks: ${t.nilai_maksimal}</p>
                </div>
                <div class="flex gap-2">
                    <button onclick="editTugas('${t.id}')" class="text-blue-600">✏️ Edit</button>
                    <button onclick="hapusTugas('${t.id}')" class="text-red-600">🗑️ Hapus</button>
                    ${t.status_selesai !== 'Selesai' ? 
                        `<button onclick="selesaikanTugas('${t.id}')" class="text-green-600">✅ Selesai</button>` : 
                        '<span class="text-green-600 text-sm">✓ Selesai</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

function renderPenilaianList() {
    const submissions = currentData.pengumpulan;
    if (!submissions.length) return '<p class="text-gray-500">Belum ada pengumpulan tugas</p>';
    
    return submissions.map(s => {
        const siswa = currentData.siswa.find(sis => sis.id == s.siswa_id);
        const tugas = currentData.tugas.find(t => t.id == s.tugas_id);
        return `
        <div class="border p-4 rounded-lg shadow-sm">
            <div class="flex justify-between items-start flex-wrap gap-2">
                <div>
                    <h4 class="font-bold">${tugas?.judul || 'Tugas tidak ditemukan'}</h4>
                    <p class="text-sm">Siswa: ${siswa?.nama || 'Unknown'} (${siswa?.kelas || '-'})</p>
                    <p class="text-gray-700 mt-2 bg-gray-50 p-2 rounded">Jawaban: ${s.jawaban}</p>
                    ${s.feedback ? `<p class="text-sm text-gray-500 mt-1">Feedback: ${s.feedback}</p>` : ''}
                </div>
                <div class="text-right">
                    ${s.status_dinilai === 'Sudah' ? 
                        `<span class="text-green-600 font-semibold">Nilai: ${s.nilai}</span>` : 
                        `<button onclick="beriNilai('${s.id}')" class="bg-yellow-500 text-white px-3 py-1 rounded text-sm">📝 Beri Nilai</button>`
                    }
                    ${s.disetujui === 'Ya' ? 
                        `<p class="text-green-600 text-sm mt-1">✓ Disetujui</p>` : 
                        (s.status_dinilai === 'Sudah' ? 
                            `<button onclick="setujuiTugas('${s.id}')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm mt-1">✓ Setujui</button>` : 
                            `<p class="text-gray-400 text-sm mt-1">Menunggu nilai</p>`)
                    }
                </div>
            </div>
        </div>`;
    }).join('');
}

// Fungsi CRUD Guru
async function tambahSiswa() {
    const nama = document.getElementById('namaSiswa').value;
    const kelas = document.getElementById('kelasSiswa').value;
    if (!nama || !kelas) return Swal.fire('Lengkapi data!', '', 'warning');
    await callAPI('addSiswa', { nama, kelas });
    await loadGuruData();
    document.getElementById('siswaList').innerHTML = renderSiswaList();
    document.getElementById('namaSiswa').value = '';
    document.getElementById('kelasSiswa').value = '';
}

async function hapusSiswa(id) {
    if (await confirmHapus()) {
        await callAPI('deleteSiswa', { id });
        await loadGuruData();
        document.getElementById('siswaList').innerHTML = renderSiswaList();
    }
}

function showTugasForm(editData = null) {
    if (editData) {
        document.getElementById('modalTugasTitle').innerText = 'Edit Tugas';
        document.getElementById('editTugasId').value = editData.id;
        document.getElementById('judulTugas').value = editData.judul;
        document.getElementById('deskripsiTugas').value = editData.deskripsi;
        document.getElementById('deadlineTugas').value = editData.deadline;
        document.getElementById('nilaiMaksimal').value = editData.nilai_maksimal;
    } else {
        document.getElementById('modalTugasTitle').innerText = 'Tugas Baru';
        document.getElementById('editTugasId').value = '';
        document.getElementById('judulTugas').value = '';
        document.getElementById('deskripsiTugas').value = '';
        document.getElementById('deadlineTugas').value = '';
        document.getElementById('nilaiMaksimal').value = '100';
    }
    document.getElementById('tugasModal').classList.remove('hidden');
    document.getElementById('tugasModal').classList.add('flex');
}

async function simpanTugas() {
    const id = document.getElementById('editTugasId').value;
    const judul = document.getElementById('judulTugas').value;
    const deskripsi = document.getElementById('deskripsiTugas').value;
    const deadline = document.getElementById('deadlineTugas').value;
    const nilai_maksimal = document.getElementById('nilaiMaksimal').value;
    
    if (!judul || !deskripsi || !deadline) return Swal.fire('Lengkapi semua field!');
    
    if (id) {
        await callAPI('updateTugas', { id, judul, deskripsi, deadline, nilai_maksimal });
    } else {
        await callAPI('addTugas', { judul, deskripsi, deadline, nilai_maksimal });
    }
    await loadGuruData();
    document.getElementById('tugasList').innerHTML = renderTugasList();
    closeModal('tugasModal');
}

async function editTugas(id) {
    const tugas = currentData.tugas.find(t => t.id == id);
    if (tugas) showTugasForm(tugas);
}

async function hapusTugas(id) {
    if (await confirmHapus()) {
        await callAPI('deleteTugas', { id });
        await loadGuruData();
        document.getElementById('tugasList').innerHTML = renderTugasList();
    }
}

async function selesaikanTugas(tugasId) {
    await callAPI('selesaikanTugas', { tugasId });
    await loadGuruData();
    document.getElementById('tugasList').innerHTML = renderTugasList();
}

async function beriNilai(submissionId) {
    const { value: formValues } = await Swal.fire({
        title: 'Beri Nilai',
        html: `<input id="nilai" class="swal2-input" placeholder="Nilai (0-100)" type="number">
               <textarea id="feedback" class="swal2-textarea" placeholder="Feedback (opsional)"></textarea>`,
        preConfirm: () => {
            const nilai = document.getElementById('nilai').value;
            const feedback = document.getElementById('feedback').value;
            if (!nilai) Swal.showValidationMessage('Nilai wajib diisi');
            return { nilai, feedback };
        }
    });
    if (formValues) {
        await callAPI('beriNilai', { submission_id: submissionId, nilai: formValues.nilai, feedback: formValues.feedback });
        await loadGuruData();
        document.getElementById('penilaianList').innerHTML = renderPenilaianList();
        Swal.fire('Berhasil', 'Nilai telah disimpan', 'success');
    }
}

async function setujuiTugas(submissionId) {
    const result = await Swal.fire({
        title: 'Setujui Tugas?',
        text: 'Pastikan nilai sudah sesuai',
        icon: 'question',
        showCancelButton: true
    });
    if (result.isConfirmed) {
        await callAPI('setujuiTugas', { submission_id: submissionId, disetujui: 'Ya' });
        await loadGuruData();
        document.getElementById('penilaianList').innerHTML = renderPenilaianList();
        Swal.fire('Disetujui!', 'Siswa dapat melanjutkan ke tugas berikutnya', 'success');
    }
}

// ========== DASHBOARD SISWA ==========
function renderSiswaDashboard() {
    return `
    <div class="bg-white rounded-xl shadow-xl p-6">
        <div class="flex justify-between items-center border-b pb-4 mb-6">
            <div>
                <h2 class="text-2xl font-bold text-gray-800">📚 Dashboard Siswa</h2>
                <p class="text-gray-600">Halo, ${currentUser.nama} (${currentUser.kelas})</p>
            </div>
            <button onclick="logout()" class="bg-red-500 text-white px-4 py-2 rounded-lg">Keluar</button>
        </div>
        <div id="siswaTugasList" class="grid gap-4">${renderSiswaTugasList()}</div>
    </div>`;
}

async function loadSiswaData() {
    currentData.tugas = await callAPI('getTugas');
    currentData.pengumpulan = await callAPI('getPengumpulan', { siswaId: currentUser.id });
}

function renderSiswaTugasList() {
    const tugasAktif = currentData.tugas.filter(t => t.status_selesai !== 'Selesai');
    if (!tugasAktif.length) return '<p class="text-gray-500">Tidak ada tugas aktif saat ini. Selamat! 🎉</p>';
    
    return tugasAktif.map(t => {
        const sudahKumpul = currentData.pengumpulan.find(p => p.tugas_id == t.id);
        const disetujui = sudahKumpul?.disetujui === 'Ya';
        return `
        <div class="border p-5 rounded-lg shadow-sm ${disetujui ? 'bg-green-50 border-green-300' : ''}">
            <div class="flex justify-between items-start flex-wrap gap-2">
                <div class="flex-1">
                    <h3 class="text-xl font-bold">${t.judul}</h3>
                    <p class="text-gray-600 mt-1">${t.deskripsi}</p>
                    <p class="text-sm text-gray-500 mt-2">📅 Deadline: ${new Date(t.deadline).toLocaleDateString('id-ID')}</p>
                </div>
                <div class="text-right">
                    ${sudahKumpul ? 
                        (disetujui ? 
                            '<span class="text-green-600 font-semibold">✓ Disetujui & Selesai</span>' : 
                            `<span class="text-yellow-600">Menunggu nilai & persetujuan</span>`) : 
                        `<button onclick="kumpulTugas('${t.id}')" class="bg-green-600 text-white px-4 py-2 rounded-lg">📤 Kumpulkan</button>`
                    }
                    ${sudahKumpul?.nilai ? `<p class="text-sm mt-1">Nilai: ${sudahKumpul.nilai}</p>` : ''}
                </div>
            </div>
        </div>`;
    }).join('');
}

async function kumpulTugas(tugasId) {
    const { value: jawaban } = await Swal.fire({
        title: 'Kumpulkan Jawaban',
        input: 'textarea',
        inputLabel: 'Tulis jawaban Anda',
        inputPlaceholder: 'Jawaban...',
        showCancelButton: true
    });
    if (jawaban) {
        await callAPI('kumpulTugas', { tugas_id: tugasId, siswa_id: currentUser.id, jawaban });
        await loadSiswaData();
        document.getElementById('siswaTugasList').innerHTML = renderSiswaTugasList();
        Swal.fire('Berhasil!', 'Tugas telah dikumpulkan', 'success');
    }
}

// ========== UTILITY ==========
function attachEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById(`tab-${tab}`).classList.remove('hidden');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active', 'border-blue-600', 'text-blue-600'));
            btn.classList.add('active', 'border-blue-600', 'text-blue-600');
        };
    });
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
}

function confirmHapus() {
    return Swal.fire({ title: 'Yakin hapus?', icon: 'warning', showCancelButton: true }).then(res => res.isConfirmed);
}

function logout() {
    currentUser = null;
    renderApp();
}

// Inisialisasi
renderApp();