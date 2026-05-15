// State management
let currentUser = null;
let allData = [];
let currentConfig = {
  app_title: 'LKPD Digital',
  app_subtitle: 'Sistem Tugas Siswa Online'
};
let currentSubmissionId = null;
let currentEditingAssignmentId = null;

const defaultConfig = {
  app_title: 'LKPD Digital',
  app_subtitle: 'Sistem Tugas Siswa Online'
};

// Initialize Element SDK
window.elementSdk.init({
  defaultConfig,
  onConfigChange: async (config) => {
    currentConfig = config;
    renderApp();
  },
  mapToCapabilities: (config) => ({
    recolorables: [],
    borderables: [],
    fontEditable: undefined,
    fontSizeable: undefined
  }),
  mapToEditPanelValues: (config) => new Map([
    ['app_title', config.app_title || defaultConfig.app_title],
    ['app_subtitle', config.app_subtitle || defaultConfig.app_subtitle]
  ])
});

// Data Handler
const dataHandler = {
  onDataChanged(data) {
    allData = data;
    renderApp();
  }
};

// Initialize Data SDK
async function initDataSDK() {
  const result = await window.dataSdk.init(dataHandler);
  if (!result.isOk) {
    console.error('Data SDK init failed');
  }
}

initDataSDK();

// Main Render Function
function renderApp() {
  const app = document.getElementById('app');
  
  if (!currentUser) {
    app.innerHTML = renderLoginScreen();
  } else if (currentUser.role === 'guru') {
    app.innerHTML = renderTeacherDashboard();
  } else {
    app.innerHTML = renderStudentDashboard();
  }

  attachEventListeners();
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

function renderLoginScreen() {
  return `
    <div class="h-full flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">📚</div>
          <h1 class="text-3xl font-bold text-blue-600 mb-2">${escapeHtml(currentConfig.app_title)}</h1>
          <p class="text-gray-600">${escapeHtml(currentConfig.app_subtitle)}</p>
        </div>

        <div class="space-y-4">
          <button onclick="loginAs('guru')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            <i data-lucide="user" class="inline mr-2" style="width: 20px; height: 20px;"></i>
            Masuk sebagai Guru
          </button>
          <button onclick="loginAs('siswa')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            <i data-lucide="book-open" class="inline mr-2" style="width: 20px; height: 20px;"></i>
            Masuk sebagai Siswa
          </button>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">
            <i data-lucide="lock" style="width: 14px; height: 14px;" class="inline"></i>
            Demo - Data disimpan sementara
          </p>
        </div>
      </div>
    </div>
  `;
}

function renderTeacherDashboard() {
  const assignments = allData.filter(d => d.type === 'assignment');
  const submissions = allData.filter(d => d.type === 'submission');

  return `
    <div class="h-full overflow-auto">
      <!-- Header -->
      <div class="bg-blue-700 text-white p-6 shadow-lg">
        <div class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold">Dashboard Guru</h1>
            <p class="text-blue-100 mt-1">Kelola tugas dan nilai siswa</p>
          </div>
          <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 no-print">
            <i data-lucide="log-out" style="width: 18px; height: 18px;"></i>
            Keluar
          </button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto p-6">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6 flex-wrap">
          <button onclick="switchTeacherTab('assignments')" class="teacher-tab active bg-white px-6 py-2 rounded-lg font-semibold text-blue-600 shadow hover:shadow-lg transition" data-tab="assignments">
            <i data-lucide="file-text" class="inline mr-2" style="width: 18px; height: 18px;"></i>
            Tugas (${assignments.length})
          </button>
          <button onclick="switchTeacherTab('submissions')" class="teacher-tab bg-white px-6 py-2 rounded-lg font-semibold text-gray-600 shadow hover:shadow-lg transition" data-tab="submissions">
            <i data-lucide="inbox" class="inline mr-2" style="width: 18px; height: 18px;"></i>
            Pengumpulan (${submissions.length})
          </button>
        </div>

        <!-- Tab Content -->
        <div id="assignments-tab" class="teacher-content">
          <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h2 class="text-2xl font-bold text-white">Daftar Tugas</h2>
            <button onclick="showModal('assignmentForm')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2">
              <i data-lucide="plus" style="width: 20px; height: 20px;"></i>
              Buat Tugas Baru
            </button>
          </div>

          ${assignments.length === 0 ? `
            <div class="bg-white rounded-xl p-8 text-center">
              <i data-lucide="inbox" style="width: 48px; height: 48px;" class="mx-auto text-gray-400 mb-4"></i>
              <p class="text-gray-600 text-lg">Belum ada tugas. Buat tugas baru untuk memulai.</p>
            </div>
          ` : `
            <div class="grid gap-4">
              ${assignments.map(a => `
                <div class="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                  <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                    <div class="flex-1">
                      <h3 class="text-xl font-bold text-gray-800">${escapeHtml(a.title)}</h3>
                      <p class="text-gray-600 text-sm mt-1">${escapeHtml(a.description)}</p>
                    </div>
                    <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                      Dikerjakan: ${submissions.filter(s => s.title === a.title).length}
                    </span>
                  </div>
                  <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span class="flex items-center gap-1">
                      <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                      ${new Date(a.dueDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="editAssignment('${a.__backendId}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition text-sm flex items-center gap-1">
                      <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                      Edit
                    </button>
                    <button onclick="deleteAssignment('${a.__backendId}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition text-sm flex items-center gap-1">
                      <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                      Hapus
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div id="submissions-tab" class="teacher-content hidden">
          <h2 class="text-2xl font-bold text-white mb-6">Pengumpulan Tugas</h2>

          ${submissions.length === 0 ? `
            <div class="bg-white rounded-xl p-8 text-center">
              <i data-lucide="inbox" style="width: 48px; height: 48px;" class="mx-auto text-gray-400 mb-4"></i>
              <p class="text-gray-600 text-lg">Belum ada pengumpulan tugas.</p>
            </div>
          ` : `
            <div class="grid gap-4">
              ${submissions.map(s => `
                <div class="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                  <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-gray-800">${escapeHtml(s.studentName)}</h3>
                      <p class="text-gray-600 text-sm">${escapeHtml(s.title)}</p>
                      <p class="text-gray-700 mt-2 bg-gray-50 p-3 rounded mt-3">${escapeHtml(s.answer)}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${s.status === 'graded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}">
                      ${s.status === 'graded' ? `Nilai: ${s.grade}` : 'Menunggu'}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mb-4">
                    Dikumpulkan: ${new Date(s.submittedAt).toLocaleDateString('id-ID')} ${new Date(s.submittedAt).toLocaleTimeString('id-ID')}
                  </div>
                  <button onclick="showGradeModal('${s.__backendId}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition text-sm flex items-center gap-1">
                    <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                    Beri Nilai
                  </button>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Modals -->
    <div id="assignmentForm" class="modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-96 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-6 text-gray-800" id="assignmentModalTitle">Buat Tugas Baru</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Judul Tugas</label>
            <input type="text" id="assignTitle" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:outline-none" placeholder="Masukkan judul tugas">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea id="assignDesc" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:outline-none h-20" placeholder="Masukkan deskripsi tugas"></textarea>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Tenggat Waktu</label>
            <input type="date" id="assignDue" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:outline-none">
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('assignmentForm')" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition">Batal</button>
            <button onclick="saveAssignment()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition">Simpan</button>
          </div>
        </div>
      </div>
    </div>

    <div id="gradeModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Beri Nilai</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Nilai (0-100)</label>
            <input type="number" id="gradeValue" min="0" max="100" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:outline-none" placeholder="Masukkan nilai">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Umpan Balik</label>
            <textarea id="gradeFeedback" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-blue-600 focus:outline-none h-20" placeholder="Masukkan umpan balik"></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('gradeModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition">Batal</button>
            <button onclick="submitGrade()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">Simpan Nilai</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderStudentDashboard() {
  const assignments = allData.filter(d => d.type === 'assignment');
  const mySubmissions = allData.filter(d => d.type === 'submission' && d.studentName === currentUser.name);

  return `
    <div class="h-full overflow-auto">
      <!-- Header -->
      <div class="bg-green-700 text-white p-6 shadow-lg">
        <div class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold">Dashboard Siswa</h1>
            <p class="text-green-100 mt-1">Halo, ${escapeHtml(currentUser.name)}! 👋</p>
          </div>
          <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 no-print">
            <i data-lucide="log-out" style="width: 18px; height: 18px;"></i>
            Keluar
          </button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto p-6">
        <!-- Tabs -->
        <div class="flex gap-2 mb-6 flex-wrap">
          <button onclick="switchStudentTab('available')" class="student-tab active bg-white px-6 py-2 rounded-lg font-semibold text-green-600 shadow hover:shadow-lg transition" data-tab="available">
            <i data-lucide="clipboard" class="inline mr-2" style="width: 18px; height: 18px;"></i>
            Tugas Tersedia (${assignments.length})
          </button>
          <button onclick="switchStudentTab('submitted')" class="student-tab bg-white px-6 py-2 rounded-lg font-semibold text-gray-600 shadow hover:shadow-lg transition" data-tab="submitted">
            <i data-lucide="check-circle" class="inline mr-2" style="width: 18px; height: 18px;"></i>
            Sudah Dikumpulkan (${mySubmissions.length})
          </button>
        </div>

        <!-- Tab Content -->
        <div id="available-tab" class="student-content">
          <h2 class="text-2xl font-bold text-white mb-6">Tugas yang Harus Dikerjakan</h2>

          ${assignments.length === 0 ? `
            <div class="bg-white rounded-xl p-8 text-center">
              <i data-lucide="inbox" style="width: 48px; height: 48px;" class="mx-auto text-gray-400 mb-4"></i>
              <p class="text-gray-600 text-lg">Tidak ada tugas tersedia saat ini.</p>
            </div>
          ` : `
            <div class="grid gap-4">
              ${assignments.map(a => {
                const submitted = mySubmissions.find(s => s.title === a.title);
                const isOverdue = new Date(a.dueDate) < new Date();
                return `
                  <div class="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                    <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                      <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-800">${escapeHtml(a.title)}</h3>
                        <p class="text-gray-600 text-sm mt-1">${escapeHtml(a.description)}</p>
                      </div>
                      ${submitted ? `
                        <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
                          <i data-lucide="check" style="width: 16px; height: 16px;"></i>
                          Dikumpulkan
                        </span>
                      ` : `
                        <span class="${isOverdue ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'} px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                          ${isOverdue ? 'Terlambat' : 'Belum Dikumpulkan'}
                        </span>
                      `}
                    </div>
                    <div class="flex items-center gap-4 text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500'} mb-4">
                      <span class="flex items-center gap-1">
                        <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                        ${new Date(a.dueDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    ${submitted ? `
                      <div class="bg-blue-50 rounded-lg p-3 mb-4">
                        <p class="text-sm text-gray-600"><strong>Jawaban Anda:</strong></p>
                        <p class="text-gray-700 mt-1">${escapeHtml(submitted.answer)}</p>
                        ${submitted.status === 'graded' ? `
                          <div class="mt-3 pt-3 border-t border-blue-200">
                            <p class="text-sm"><strong>Nilai:</strong> <span class="text-lg font-bold text-green-600">${submitted.grade}</span></p>
                            <p class="text-sm text-gray-600 mt-1"><strong>Umpan Balik:</strong> ${escapeHtml(submitted.feedback)}</p>
                          </div>
                        ` : `
                          <p class="text-sm text-yellow-600 mt-2">Status: Menunggu penilaian</p>
                        `}
                      </div>
                    ` : ''}
                    ${!submitted && !isOverdue ? `
                      <button onclick="showSubmissionModal('${a.__backendId}')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2">
                        <i data-lucide="send" style="width: 18px; height: 18px;"></i>
                        Kerjakan & Kumpulkan
                      </button>
                    ` : ''}
                    ${isOverdue && !submitted ? `
                      <div class="bg-red-50 rounded-lg p-3 border-l-4 border-red-600">
                        <p class="text-sm text-red-700">⏰ Tenggat waktu telah lewat. Tidak dapat mengumpulkan tugas.</p>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>

        <div id="submitted-tab" class="student-content hidden">
          <h2 class="text-2xl font-bold text-white mb-6">Tugas yang Sudah Dikumpulkan</h2>

          ${mySubmissions.length === 0 ? `
            <div class="bg-white rounded-xl p-8 text-center">
              <i data-lucide="inbox" style="width: 48px; height: 48px;" class="mx-auto text-gray-400 mb-4"></i>
              <p class="text-gray-600 text-lg">Anda belum mengumpulkan tugas apapun.</p>
            </div>
          ` : `
            <div class="grid gap-4">
              ${mySubmissions.map(s => `
                <div class="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                  <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                    <div class="flex-1">
                      <h3 class="text-lg font-bold text-gray-800">${escapeHtml(s.title)}</h3>
                      <p class="text-gray-700 mt-2 bg-gray-50 p-3 rounded">${escapeHtml(s.answer)}</p>
                    </div>
                    <span class="px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${s.status === 'graded' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">
                      ${s.status === 'graded' ? `Nilai: ${s.grade}` : 'Menunggu'}
                    </span>
                  </div>
                  <div class="text-xs text-gray-500 mb-3">
                    Dikumpulkan: ${new Date(s.submittedAt).toLocaleDateString('id-ID')} ${new Date(s.submittedAt).toLocaleTimeString('id-ID')}
                  </div>
                  ${s.status === 'graded' ? `
                    <div class="bg-green-50 rounded-lg p-3 border-l-4 border-green-600">
                      <p class="text-sm"><strong>Nilai Akhir:</strong> <span class="text-lg font-bold text-green-600">${s.grade}</span></p>
                      <p class="text-sm text-gray-700 mt-2"><strong>Umpan Balik:</strong> ${escapeHtml(s.feedback)}</p>
                    </div>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    </div>

    <!-- Submission Modal -->
    <div id="submissionModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md max-h-96 overflow-y-auto">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Kumpulkan Jawaban</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Jawaban Anda</label>
            <textarea id="submissionAnswer" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-green-600 focus:outline-none h-24" placeholder="Tulis jawaban Anda di sini..."></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('submissionModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold transition">Batal</button>
            <button onclick="submitAnswer()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition">Kumpulkan</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Event Handlers
function loginAs(role) {
  if (role === 'guru') {
    currentUser = { role: 'guru', name: 'Guru Matematika' };
  } else {
    currentUser = { role: 'siswa', name: 'Siswa ' + Math.floor(Math.random() * 100) };
  }
  renderApp();
}

function logout() {
  currentUser = null;
  renderApp();
}

function switchTeacherTab(tab) {
  const tabs = document.querySelectorAll('.teacher-tab');
  const contents = document.querySelectorAll('.teacher-content');
  
  tabs.forEach(t => t.classList.remove('active'));
  contents.forEach(c => c.classList.add('hidden'));
  
  const activeTab = Array.from(tabs).find(t => t.getAttribute('data-tab') === tab);
  if (activeTab) activeTab.classList.add('active');
  
  const activeContent = document.getElementById(tab + '-tab');
  if (activeContent) activeContent.classList.remove('hidden');
}

function switchStudentTab(tab) {
  const tabs = document.querySelectorAll('.student-tab');
  const contents = document.querySelectorAll('.student-content');
  
  tabs.forEach(t => t.classList.remove('active'));
  contents.forEach(c => c.classList.add('hidden'));
  
  const activeTab = Array.from(tabs).find(t => t.getAttribute('data-tab') === tab);
  if (activeTab) activeTab.classList.add('active');
  
  const activeContent = document.getElementById(tab + '-tab');
  if (activeContent) activeContent.classList.remove('hidden');
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function createAssignment() {
  const title = document.getElementById('assignTitle')?.value;
  const desc = document.getElementById('assignDesc')?.value;
  const due = document.getElementById('assignDue')?.value;

  if (!title || !desc || !due) {
    alert('Semua field harus diisi');
    return;
  }

  const result = await window.dataSdk.create({
    type: 'assignment',
    title,
    description: desc,
    dueDate: due,
    createdBy: currentUser.name,
    studentName: '',
    answer: '',
    grade: '',
    feedback: '',
    status: 'waiting',
    submittedAt: ''
  });

  if (result.isOk) {
    closeModal('assignmentForm');
    clearAssignmentForm();
  }
}

async function saveAssignment() {
  const title = document.getElementById('assignTitle')?.value;
  const desc = document.getElementById('assignDesc')?.value;
  const due = document.getElementById('assignDue')?.value;

  if (!title || !desc || !due) {
    alert('Semua field harus diisi');
    return;
  }

  if (currentEditingAssignmentId) {
    // Update existing assignment
    const existingAssignment = allData.find(d => d.__backendId === currentEditingAssignmentId);
    if (existingAssignment) {
      const updated = {
        ...existingAssignment,
        title,
        description: desc,
        dueDate: due
      };
      await window.dataSdk.update(updated);
    }
    currentEditingAssignmentId = null;
  } else {
    // Create new assignment
    await createAssignment();
  }
  
  closeModal('assignmentForm');
  clearAssignmentForm();
}

function clearAssignmentForm() {
  const titleInput = document.getElementById('assignTitle');
  const descInput = document.getElementById('assignDesc');
  const dueInput = document.getElementById('assignDue');
  const modalTitle = document.getElementById('assignmentModalTitle');
  
  if (titleInput) titleInput.value = '';
  if (descInput) descInput.value = '';
  if (dueInput) dueInput.value = '';
  if (modalTitle) modalTitle.textContent = 'Buat Tugas Baru';
  
  currentEditingAssignmentId = null;
}

async function deleteAssignment(id) {
  const item = allData.find(d => d.__backendId === id);
  if (item && confirm('Hapus tugas ini? Semua pengumpulan terkait akan tetap tersimpan.')) {
    await window.dataSdk.delete(item);
  }
}

function editAssignment(id) {
  const item = allData.find(d => d.__backendId === id);
  if (item) {
    const titleInput = document.getElementById('assignTitle');
    const descInput = document.getElementById('assignDesc');
    const dueInput = document.getElementById('assignDue');
    const modalTitle = document.getElementById('assignmentModalTitle');
    
    if (titleInput) titleInput.value = item.title;
    if (descInput) descInput.value = item.description;
    if (dueInput) dueInput.value = item.dueDate;
    if (modalTitle) modalTitle.textContent = 'Edit Tugas';
    
    currentEditingAssignmentId = id;
    showModal('assignmentForm');
  }
}

function showGradeModal(submissionId) {
  currentSubmissionId = submissionId;
  showModal('gradeModal');
}

async function submitGrade() {
  const grade = document.getElementById('gradeValue')?.value;
  const feedback = document.getElementById('gradeFeedback')?.value;

  if (!grade) {
    alert('Nilai harus diisi');
    return;
  }

  const submission = allData.find(d => d.__backendId === currentSubmissionId);
  if (submission) {
    const updated = {
      ...submission,
      grade: parseInt(grade),
      feedback: feedback || '',
      status: 'graded'
    };
    await window.dataSdk.update(updated);
    closeModal('gradeModal');
    document.getElementById('gradeValue').value = '';
    document.getElementById('gradeFeedback').value = '';
  }
}

function showSubmissionModal(assignmentId) {
  currentSubmissionId = assignmentId;
  showModal('submissionModal');
}

async function submitAnswer() {
  const answer = document.getElementById('submissionAnswer')?.value;
  if (!answer) {
    alert('Jawaban harus diisi');
    return;
  }

  const assignment = allData.find(d => d.__backendId === currentSubmissionId);
  if (assignment) {
    const result = await window