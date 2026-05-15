// Data storage (using localStorage for demo)
let currentUser = null;
let allData = [];

// Load data from localStorage
function loadData() {
  const saved = localStorage.getItem('lkpd_data');
  if (saved) {
    allData = JSON.parse(saved);
  } else {
    // Sample data
    allData = [
      {
        __backendId: '1',
        type: 'assignment',
        title: 'Matematika Dasar',
        description: 'Kerjakan soal-soal tentang pecahan',
        dueDate: '2026-05-20',
        createdBy: 'Guru Matematika'
      },
      {
        __backendId: '2',
        type: 'assignment',
        title: 'Bahasa Indonesia',
        description: 'Buatlah puisi tentang lingkungan',
        dueDate: '2026-05-25',
        createdBy: 'Guru Matematika'
      }
    ];
    saveData();
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('lkpd_data', JSON.stringify(allData));
}

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
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md slide-in">
        <div class="text-center mb-8">
          <div class="text-6xl mb-4">📚</div>
          <h1 class="text-3xl font-bold text-blue-600 mb-2">LKPD Digital</h1>
          <p class="text-gray-600">Sistem Tugas Siswa Online</p>
        </div>

        <div class="space-y-4">
          <button onclick="loginAs('guru')" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Masuk sebagai Guru
          </button>
          <button onclick="loginAs('siswa')" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition">
            Masuk sebagai Siswa
          </button>
        </div>

        <div class="mt-6 pt-6 border-t border-gray-200">
          <p class="text-xs text-gray-500 text-center">Demo - Data disimpan di browser Anda</p>
        </div>
      </div>
    </div>
  `;
}

function renderTeacherDashboard() {
  const assignments = allData.filter(d => d.type === 'assignment');
  const submissions = allData.filter(d => d.type === 'submission');

  return `
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-blue-700 text-white p-6 shadow-lg">
        <div class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold">Dashboard Guru</h1>
            <p class="text-blue-100 mt-1">Kelola tugas dan nilai siswa</p>
          </div>
          <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition">
            Keluar
          </button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto p-6">
        <!-- Buttons -->
        <div class="mb-6">
          <button onclick="showCreateAssignmentModal()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
            + Buat Tugas Baru
          </button>
        </div>

        <!-- Assignments List -->
        <h2 class="text-2xl font-bold text-white mb-4">Daftar Tugas</h2>
        ${assignments.length === 0 ? `
          <div class="bg-white rounded-xl p-8 text-center">
            <p class="text-gray-600 text-lg">Belum ada tugas. Buat tugas baru untuk memulai.</p>
          </div>
        ` : `
          <div class="grid gap-4">
            ${assignments.map(a => `
              <div class="bg-white rounded-xl shadow p-6">
                <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                  <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800">${a.title}</h3>
                    <p class="text-gray-600 text-sm mt-1">${a.description}</p>
                    <p class="text-gray-500 text-xs mt-2">Tenggat: ${new Date(a.dueDate).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div class="flex gap-2">
                    <button onclick="editAssignment('${a.__backendId}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Edit</button>
                    <button onclick="deleteAssignment('${a.__backendId}')" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Hapus</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Submissions -->
        <h2 class="text-2xl font-bold text-white mt-8 mb-4">Pengumpulan Tugas</h2>
        ${submissions.length === 0 ? `
          <div class="bg-white rounded-xl p-8 text-center">
            <p class="text-gray-600 text-lg">Belum ada pengumpulan tugas.</p>
          </div>
        ` : `
          <div class="grid gap-4">
            ${submissions.map(s => `
              <div class="bg-white rounded-xl shadow p-6">
                <div class="flex justify-between items-start mb-3 flex-wrap gap-4">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-800">${s.studentName}</h3>
                    <p class="text-gray-600 text-sm">Tugas: ${s.title}</p>
                    <p class="text-gray-700 mt-2 bg-gray-50 p-3 rounded">${s.answer}</p>
                  </div>
                  <span class="px-3 py-1 rounded-full text-sm font-semibold ${s.status === 'graded' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}">
                    ${s.status === 'graded' ? `Nilai: ${s.grade}` : 'Menunggu'}
                  </span>
                </div>
                <button onclick="showGradeModal('${s.__backendId}')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">Beri Nilai</button>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- Modal Create/Edit Assignment -->
    <div id="assignmentModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center p-4 z-50" style="display: none;">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800" id="modalTitle">Buat Tugas Baru</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Judul Tugas</label>
            <input type="text" id="assignTitle" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Deskripsi</label>
            <textarea id="assignDesc" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 h-20"></textarea>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Tenggat Waktu</label>
            <input type="date" id="assignDue" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('assignmentModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Batal</button>
            <button onclick="saveAssignment()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Simpan</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Grade -->
    <div id="gradeModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center p-4 z-50" style="display: none;">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Beri Nilai</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Nilai (0-100)</label>
            <input type="number" id="gradeValue" min="0" max="100" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Umpan Balik</label>
            <textarea id="gradeFeedback" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 h-20"></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('gradeModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Batal</button>
            <button onclick="submitGrade()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Simpan</button>
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
    <div class="min-h-screen">
      <!-- Header -->
      <div class="bg-green-700 text-white p-6 shadow-lg">
        <div class="max-w-6xl mx-auto flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 class="text-3xl font-bold">Dashboard Siswa</h1>
            <p class="text-green-100 mt-1">Halo, ${currentUser.name}! 👋</p>
          </div>
          <button onclick="logout()" class="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition">Keluar</button>
        </div>
      </div>

      <div class="max-w-6xl mx-auto p-6">
        <h2 class="text-2xl font-bold text-white mb-4">Daftar Tugas</h2>
        
        ${assignments.length === 0 ? `
          <div class="bg-white rounded-xl p-8 text-center">
            <p class="text-gray-600 text-lg">Tidak ada tugas tersedia saat ini.</p>
          </div>
        ` : `
          <div class="grid gap-4">
            ${assignments.map(a => {
              const submitted = mySubmissions.find(s => s.title === a.title);
              return `
                <div class="bg-white rounded-xl shadow p-6">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <h3 class="text-xl font-bold text-gray-800">${a.title}</h3>
                      <p class="text-gray-600 text-sm mt-1">${a.description}</p>
                      <p class="text-gray-500 text-xs mt-2">Tenggat: ${new Date(a.dueDate).toLocaleDateString('id-ID')}</p>
                    </div>
                    ${submitted ? 
                      '<span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">✓ Dikumpulkan</span>' : 
                      '<span class="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Belum Dikumpulkan</span>'
                    }
                  </div>
                  
                  ${submitted ? `
                    <div class="bg-blue-50 rounded-lg p-3 mb-4">
                      <p class="text-sm text-gray-600"><strong>Jawaban Anda:</strong></p>
                      <p class="text-gray-700 mt-1">${submitted.answer}</p>
                      ${submitted.status === 'graded' ? `
                        <div class="mt-3 pt-3 border-t border-blue-200">
                          <p><strong>Nilai:</strong> <span class="text-lg font-bold text-green-600">${submitted.grade}</span></p>
                          <p><strong>Umpan Balik:</strong> ${submitted.feedback}</p>
                        </div>
                      ` : '<p class="text-yellow-600 mt-2">Menunggu penilaian</p>'}
                    </div>
                  ` : `
                    <button onclick="showSubmissionModal('${a.__backendId}', '${a.title}')" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition">
                      Kerjakan & Kumpulkan
                    </button>
                  `}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- Submission Modal -->
    <div id="submissionModal" class="modal hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center p-4 z-50" style="display: none;">
      <div class="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <h2 class="text-2xl font-bold mb-6 text-gray-800">Kumpulkan Jawaban</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Jawaban Anda</label>
            <textarea id="submissionAnswer" class="w-full border-2 border-gray-300 rounded-lg px-4 py-2 h-24" placeholder="Tulis jawaban Anda di sini..."></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button onclick="closeModal('submissionModal')" class="flex-1 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Batal</button>
            <button onclick="submitAnswer()" class="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Kumpulkan</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Global variables
let currentEditingId = null;
let currentSubmissionId = null;
let currentAssignmentTitle = '';

// Event Handlers
function loginAs(role) {
  if (role === 'guru') {
    currentUser = { role: 'guru', name: 'Guru Matematika' };
  } else {
    const studentName = prompt('Masukkan nama Anda:', 'Siswa ' + Math.floor(Math.random() * 100));
    currentUser = { role: 'siswa', name: studentName || 'Siswa' };
  }
  renderApp();
}

function logout() {
  currentUser = null;
  renderApp();
}

function showCreateAssignmentModal() {
  currentEditingId = null;
  document.getElementById('modalTitle').textContent = 'Buat Tugas Baru';
  document.getElementById('assignTitle').value = '';
  document.getElementById('assignDesc').value = '';
  document.getElementById('assignDue').value = '';
  showModal('assignmentModal');
}

function editAssignment(id) {
  const assignment = allData.find(d => d.__backendId === id);
  if (assignment) {
    currentEditingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Tugas';
    document.getElementById('assignTitle').value = assignment.title;
    document.getElementById('assignDesc').value = assignment.description;
    document.getElementById('assignDue').value = assignment.dueDate;
    showModal('assignmentModal');
  }
}

function saveAssignment() {
  const title = document.getElementById('assignTitle').value;
  const desc = document.getElementById('assignDesc').value;
  const due = document.getElementById('assignDue').value;

  if (!title || !desc || !due) {
    alert('Semua field harus diisi');
    return;
  }

  if (currentEditingId) {
    // Update existing
    const index = allData.findIndex(d => d.__backendId === currentEditingId);
    if (index !== -1) {
      allData[index] = { ...allData[index], title, description: desc, dueDate: due };
      saveData();
    }
  } else {
    // Create new
    const newId = Date.now().toString();
    allData.push({
      __backendId: newId,
      type: 'assignment',
      title,
      description: desc,
      dueDate: due,
      createdBy: currentUser.name
    });
    saveData();
  }

  closeModal('assignmentModal');
  renderApp();
}

async function deleteAssignment(id) {
  if (confirm('Hapus tugas ini?')) {
    allData = allData.filter(d => d.__backendId !== id);
    saveData();
    renderApp();
  }
}

function showGradeModal(submissionId) {
  currentSubmissionId = submissionId;
  document.getElementById('gradeValue').value = '';
  document.getElementById('gradeFeedback').value = '';
  showModal('gradeModal');
}

function submitGrade() {
  const grade = document.getElementById('gradeValue').value;
  const feedback = document.getElementById('gradeFeedback').value;

  if (!grade) {
    alert('Nilai harus diisi');
    return;
  }

  const index = allData.findIndex(d => d.__backendId === currentSubmissionId);
  if (index !== -1) {
    allData[index] = {
      ...allData[index],
      grade: parseInt(grade),
      feedback: feedback || '',
      status: 'graded'
    };
    saveData();
  }

  closeModal('gradeModal');
  renderApp();
}

function showSubmissionModal(assignmentId, title) {
  currentSubmissionId = assignmentId;
  currentAssignmentTitle = title;
  document.getElementById('submissionAnswer').value = '';
  showModal('submissionModal');
}

function submitAnswer() {
  const answer = document.getElementById('submissionAnswer').value;
  if (!answer) {
    alert('Jawaban harus diisi');
    return;
  }

  const newId = Date.now().toString();
  allData.push({
    __backendId: newId,
    type: 'submission',
    title: currentAssignmentTitle,
    studentName: currentUser.name,
    answer: answer,
    grade: '',
    feedback: '',
    status: 'waiting',
    submittedAt: new Date().toISOString()
  });
  saveData();

  closeModal('submissionModal');
  renderApp();
  alert('Tugas berhasil dikumpulkan!');
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  }
}

function attachEventListeners() {
  // Close modal when clicking outside
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
}

// Initialize
loadData();
renderApp();