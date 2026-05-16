// Konfigurasi
const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const KODE_GURU = "guru123"; // Ganti dengan kode rahasia Anda

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const action = e.parameter.action;
  const password = e.parameter.password;
  
  // Autentikasi Guru
  if (action !== 'loginSiswa' && password !== KODE_GURU) {
    return jsonResponse({error: 'Akses ditolak: kode guru salah'}, 403);
  }
  
  try {
    switch(action) {
      case 'getSiswa': return getSiswa();
      case 'addSiswa': return addSiswa(e.parameter);
      case 'deleteSiswa': return deleteSiswa(e.parameter.id);
      case 'getTugas': return getTugas();
      case 'addTugas': return addTugas(e.parameter);
      case 'updateTugas': return updateTugas(e.parameter);
      case 'deleteTugas': return deleteTugas(e.parameter.id);
      case 'selesaikanTugas': return selesaikanTugas(e.parameter.tugasId);
      case 'getPengumpulan': return getPengumpulan(e.parameter.siswaId);
      case 'kumpulTugas': return kumpulTugas(e.parameter);
      case 'beriNilai': return beriNilai(e.parameter);
      case 'setujuiTugas': return setujuiTugas(e.parameter);
      case 'loginSiswa': return loginSiswa(e.parameter);
      default: return jsonResponse({error: 'Aksi tidak dikenal'}, 400);
    }
  } catch(err) {
    return jsonResponse({error: err.toString()}, 500);
  }
}

// ========== SISWA ==========
function getSiswa() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('siswa');
  const data = sheet.getDataRange().getValues();
  const siswa = data.slice(1).map(row => ({
    id: row[0], nama: row[1], kelas: row[2], password: row[3]
  }));
  return jsonResponse(siswa);
}

function addSiswa(params) {
  const { nama, kelas, password = 'siswa123' } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('siswa');
  const newId = Date.now().toString();
  sheet.appendRow([newId, nama, kelas, password]);
  return jsonResponse({success: true, id: newId});
}

function deleteSiswa(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('siswa');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i+1);
      break;
    }
  }
  return jsonResponse({success: true});
}

function loginSiswa(params) {
  const { nama, password } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('siswa');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] == nama && data[i][3] == password) {
      return jsonResponse({success: true, siswa: {id: data[i][0], nama: data[i][1], kelas: data[i][2]}});
    }
  }
  return jsonResponse({success: false, error: 'Nama atau password salah'});
}

// ========== TUGAS ==========
function getTugas() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tugas');
  const data = sheet.getDataRange().getValues();
  const tugas = data.slice(1).map(row => ({
    id: row[0], judul: row[1], deskripsi: row[2], deadline: row[3],
    status_selesai: row[4] || 'Belum', nilai_maksimal: row[5] || 100
  }));
  return jsonResponse(tugas);
}

function addTugas(params) {
  const { judul, deskripsi, deadline, nilai_maksimal = 100 } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tugas');
  const newId = Date.now().toString();
  sheet.appendRow([newId, judul, deskripsi, deadline, 'Belum', nilai_maksimal]);
  return jsonResponse({success: true, id: newId});
}

function updateTugas(params) {
  const { id, judul, deskripsi, deadline, nilai_maksimal } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tugas');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.getRange(i+1, 2).setValue(judul);
      sheet.getRange(i+1, 3).setValue(deskripsi);
      sheet.getRange(i+1, 4).setValue(deadline);
      if(nilai_maksimal) sheet.getRange(i+1, 6).setValue(nilai_maksimal);
      break;
    }
  }
  return jsonResponse({success: true});
}

function deleteTugas(id) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tugas');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i+1);
      break;
    }
  }
  return jsonResponse({success: true});
}

function selesaikanTugas(tugasId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('tugas');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == tugasId) {
      sheet.getRange(i+1, 5).setValue('Selesai');
      break;
    }
  }
  return jsonResponse({success: true});
}

// ========== PENGUMPULAN & NILAI ==========
function getPengumpulan(siswaId = null) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pengumpulan');
  const data = sheet.getDataRange().getValues();
  let submissions = data.slice(1).map(row => ({
    id: row[0], tugas_id: row[1], siswa_id: row[2], jawaban: row[3],
    nilai: row[4], status_dinilai: row[5], disetujui: row[6], feedback: row[7]
  }));
  if (siswaId) submissions = submissions.filter(s => s.siswa_id == siswaId);
  return jsonResponse(submissions);
}

function kumpulTugas(params) {
  const { tugas_id, siswa_id, jawaban } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pengumpulan');
  const newId = Date.now().toString();
  sheet.appendRow([newId, tugas_id, siswa_id, jawaban, '', 'Belum', 'Belum', '']);
  return jsonResponse({success: true, id: newId});
}

function beriNilai(params) {
  const { submission_id, nilai, feedback = '' } = params;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pengumpulan');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == submission_id) {
      sheet.getRange(i+1, 5).setValue(nilai);
      sheet.getRange(i+1, 6).setValue('Sudah');
      sheet.getRange(i+1, 8).setValue(feedback);
      break;
    }
  }
  return jsonResponse({success: true});
}

function setujuiTugas(params) {
  const { submission_id, disetujui = 'Ya' } = params; // 'Ya' atau 'Tidak'
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('pengumpulan');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == submission_id) {
      sheet.getRange(i+1, 7).setValue(disetujui);
      break;
    }
  }
  return jsonResponse({success: true});
}

function jsonResponse(data, status=200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}