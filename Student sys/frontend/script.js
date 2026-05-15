/* ============================================================
   STUDENT COMPLAINT MANAGEMENT SYSTEM — script.js
   Updated for Dynamic Backend URL Configuration
   ============================================================ */

// ===== DYNAMIC API URL CONFIGURATION =====
// Try to get API URL from multiple sources
function getApiUrl() {
  // 1. Check if we have a saved URL in localStorage
  const savedUrl = localStorage.getItem('api_base_url');
  if (savedUrl && savedUrl.trim()) {
    return savedUrl.trim();
  }
  
  // 2. Check for environment variable (if using build system)
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 3. Auto-detect based on current hostname
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;
  
  // If accessing via localhost, 127.0.0.1, or file protocol (development)
  if (hostname === 'localhost' || hostname === '127.0.0.1' || protocol === 'file:') {
    return 'http://localhost:5000/api';
  }
  
  // If accessing via network IP (for mobile testing)
  if (/^192\.168\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^169\.254\./.test(hostname)) {
    return `http://${hostname}:5000/api`;
  }
  
  // For production - use same origin as the frontend host
  return `${protocol}//${hostname}${port ? `:${port}` : ''}/api`;
}

// Configuration object
const CONFIG = {
  API_BASE_URL: getApiUrl(),
  API_ENDPOINTS: {
    LOGIN: '/admin/login',
    COMPLAINTS: '/complaints',
    ADMIN_COMPLAINTS: '/admin/complaints',
    ADMIN_STATS: '/admin/stats',
    HEALTH: '/health'
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3
};

// Display current API URL in console for debugging
console.log(`🔗 API URL: ${CONFIG.API_BASE_URL}`);

// Export config for debugging (optional)
window.API_CONFIG = CONFIG;

let authToken = null;

/* ===== API UTILITY FUNCTIONS ===== */
class API {
  constructor(baseURL, timeout = 30000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        }
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - Server might be down');
      }
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Initialize API instance
let api = new API(CONFIG.API_BASE_URL, CONFIG.TIMEOUT);

/* ===== API URL CONFIGURATION UI ===== */
function showApiConfigDialog() {
  const modalHtml = `
    <div id="apiConfigModal" class="modal-overlay" style="display: flex; z-index: 10000;">
      <div class="modal" style="max-width: 500px;">
        <div style="font-size: 2rem; text-align: center; margin-bottom: 1rem;">⚙️</div>
        <h3 class="modal-title text-center">API Configuration</h3>
        <p class="modal-sub text-center" style="margin-bottom: 1.5rem;">Configure backend API connection</p>
        
        <div class="form-group">
          <label class="form-label">API Base URL</label>
          <input type="text" id="apiUrlInput" class="form-control" placeholder="http://localhost:5000/api" value="${CONFIG.API_BASE_URL}">
          <small style="color: var(--text-muted); display: block; margin-top: 5px;">
            Example: http://localhost:5000/api or http://192.168.1.100:5000/api
          </small>
        </div>
        
        <div class="form-group">
          <label class="form-label">Test Connection</label>
          <button class="btn btn-secondary" onclick="testApiConnection()" style="width: 100%;">🔌 Test Connection</button>
          <div id="connectionTestResult" style="margin-top: 8px; font-size: 0.85rem;"></div>
        </div>
        
        <div class="modal-actions" style="margin-top: 1.5rem;">
          <button class="btn btn-secondary" onclick="closeApiConfigDialog()">Cancel</button>
          <button class="btn btn-primary" onclick="saveApiConfig()">💾 Save & Reload</button>
        </div>
      </div>
    </div>
  `;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('apiConfigModal');
  if (existingModal) existingModal.remove();
  
  // Add modal to body
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  // Add click outside to close
  const modal = document.getElementById('apiConfigModal');
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeApiConfigDialog();
  });
}

function closeApiConfigDialog() {
  const modal = document.getElementById('apiConfigModal');
  if (modal) modal.remove();
}

async function testApiConnection() {
  const urlInput = document.getElementById('apiUrlInput');
  const testUrl = urlInput.value.trim();
  const resultDiv = document.getElementById('connectionTestResult');
  
  if (!testUrl) {
    resultDiv.innerHTML = '<span style="color: #EF4444;">❌ Please enter a URL</span>';
    return;
  }
  
  resultDiv.innerHTML = '<span style="color: #6B7280;">⏳ Testing connection...</span>';
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${testUrl}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = `<span style="color: #10B981;">✅ Connected! Server response: ${data.message || 'OK'}</span>`;
    } else {
      resultDiv.innerHTML = `<span style="color: #EF4444;">❌ Server returned error ${response.status}</span>`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<span style="color: #EF4444;">❌ Connection failed: ${error.message}</span>`;
  }
}

function saveApiConfig() {
  const urlInput = document.getElementById('apiUrlInput');
  const newUrl = urlInput.value.trim();
  
  if (!newUrl) {
    showToast('Please enter a valid API URL');
    return;
  }
  
  // Validate URL format
  try {
    new URL(newUrl);
  } catch (e) {
    showToast('Please enter a valid URL (include http:// or https://)');
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('api_base_url', newUrl);
  
  // Update config
  CONFIG.API_BASE_URL = newUrl;
  api = new API(newUrl, CONFIG.TIMEOUT);
  
  showToast('API URL saved! Reloading page...');
  
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}

// Add settings button to admin panel
function addApiSettingsButton() {
  const adminTopbar = document.querySelector('.admin-topbar');
  if (adminTopbar && !document.getElementById('apiSettingsBtn')) {
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'apiSettingsBtn';
    settingsBtn.className = 'btn btn-sm btn-secondary';
    settingsBtn.innerHTML = '⚙️ API Settings';
    settingsBtn.onclick = showApiConfigDialog;
    settingsBtn.style.marginLeft = '10px';
    
    const userBadge = adminTopbar.querySelector('.admin-user-badge');
    if (userBadge) {
      userBadge.parentElement.appendChild(settingsBtn);
    }
  }
}

/* ===== NAVBAR TOGGLE ===== */
function toggleNav() {
  const nav = document.getElementById('navLinks');
  if (nav) nav.classList.toggle('open');
}

/* ===== DYNAMIC TARGET DROPDOWN ===== */
const TARGETS = {
  Department: ['Computer Science (CS)', 'Information Technology (IT)', 'Business Management', 'Electrical Engineering', 'Software Engineering', 'Mathematics'],
  Teacher: ['Prof. Dr. Imran Ali', 'Ms. Sara Qureshi', 'Mr. Usman Tariq', 'Dr. Fatima Malik', 'Mr. Bilal Ahmed', 'Ms. Ayesha Raza'],
  Administration: ['Examination Cell', 'Fee Department', 'Registrar Office', 'Student Affairs', 'Library', 'IT Support'],
  Hostel: ['Boys Hostel A', 'Boys Hostel B', 'Girls Hostel C', 'Girls Hostel D', 'Hostel Warden Office', 'Mess / Canteen'],
};

function updateTargets() {
  const catEl = document.getElementById('category');
  const targetEl = document.getElementById('target');
  const hintEl = document.getElementById('targetHint');
  if (!catEl || !targetEl) return;

  const cat = catEl.value;
  targetEl.innerHTML = '';
  targetEl.disabled = !cat;

  if (!cat) {
    targetEl.innerHTML = '<option value="">— Select Category First —</option>';
    if (hintEl) hintEl.textContent = 'ℹ️ Select a category to see available options';
    return;
  }

  targetEl.innerHTML = `<option value="">— Select ${cat} —</option>`;
  (TARGETS[cat] || []).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    targetEl.appendChild(opt);
  });

  if (hintEl) hintEl.textContent = `ℹ️ ${TARGETS[cat].length} options available for "${cat}"`;
  clearError('category');
}

/* ===== CHAR COUNT ===== */
function updateCharCount() {
  const ta = document.getElementById('complaint');
  const cc = document.getElementById('charCount');
  if (!ta || !cc) return;
  cc.textContent = ta.value.length;
  if (ta.value.length > 900) cc.style.color = '#EF4444';
  else cc.style.color = '';
}

/* ===== FORM VALIDATION HELPERS ===== */
function setError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('is-error');
}

function clearError(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('is-error');
}

function clearAllErrors() {
  document.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ===== SUBMIT COMPLAINT TO BACKEND ===== */
async function submitComplaint(e) {
  e.preventDefault();
  clearAllErrors();

  const name = document.getElementById('name');
  const email = document.getElementById('email');
  const category = document.getElementById('category');
  const target = document.getElementById('target');
  const rollno = document.getElementById('rollno');
  const subject = document.getElementById('subject');
  const complaint = document.getElementById('complaint');
  
  let valid = true;

  if (!name.value.trim() || name.value.trim().length < 2) {
    name.classList.add('is-error'); valid = false;
  }
  if (!email.value.trim() || !isValidEmail(email.value.trim())) {
    email.classList.add('is-error'); valid = false;
  }
  if (!category.value) {
    category.classList.add('is-error'); valid = false;
  }
  if (!target.value) {
    target.classList.add('is-error'); valid = false;
  }
  if (!rollno.value.trim()) {
    rollno.classList.add('is-error'); valid = false;
  }
  if (!subject.value.trim()) {
    subject.classList.add('is-error'); valid = false;
  }
  if (!complaint.value.trim() || complaint.value.trim().length < 20) {
    complaint.classList.add('is-error'); valid = false;
  }

  if (!valid) {
    const alertEl = document.getElementById('formAlert');
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-error"><span class="alert-icon">⚠️</span><div>Please fill in all required fields correctly before submitting.</div></div>`;
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  try {
    const response = await api.post(CONFIG.API_ENDPOINTS.COMPLAINTS, {
      name: name.value.trim(),
      email: email.value.trim(),
      rollno: rollno.value.trim(),
      category: category.value,
      target: target.value,
      subject: subject.value.trim(),
      complaint: complaint.value.trim(),
    });

    const data = await response.json();

    if (data.success) {
      // Show success
      document.getElementById('formSection').style.display = 'none';
      const ss = document.getElementById('successScreen');
      ss.classList.add('show');

      const dl = document.getElementById('successDetails');
      dl.innerHTML = `
        <dt>Name</dt><dd>${escapeHtml(data.data.name)}</dd>
        <dt>Roll No</dt><dd>${escapeHtml(data.data.rollno)}</dd>
        <dt>Category</dt><dd>${escapeHtml(data.data.category)}</dd>
        <dt>Target</dt><dd>${escapeHtml(data.data.target)}</dd>
        <dt>Subject</dt><dd>${escapeHtml(data.data.subject)}</dd>
        <dt>Status</dt><dd><span class="badge badge-pending">Pending</span></dd>
        <dt>Submitted</dt><dd>${data.data.date}</dd>
        <dt>Complaint ID</dt><dd>${data.data._id}</dd>
      `;

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      throw new Error(data.message || 'Failed to submit complaint');
    }
  } catch (error) {
    const alertEl = document.getElementById('formAlert');
    let errorMsg = error.message;
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      errorMsg = 'Cannot connect to server. Please check API configuration.';
      if (confirm('Server connection failed. Would you like to configure API settings?')) {
        showApiConfigDialog();
      }
    }
    
    if (alertEl) {
      alertEl.innerHTML = `<div class="alert alert-error"><span class="alert-icon">⚠️</span><div>${errorMsg}</div></div>`;
      alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
}

function resetForm() {
  clearAllErrors();
  document.getElementById('complaintForm').reset();
  const target = document.getElementById('target');
  if (target) {
    target.innerHTML = '<option value="">— Select Category First —</option>';
    target.disabled = true;
  }
  const cc = document.getElementById('charCount');
  if (cc) cc.textContent = '0';
  const alertEl = document.getElementById('formAlert');
  if (alertEl) alertEl.innerHTML = '';
}

function submitAnother() {
  document.getElementById('successScreen').classList.remove('show');
  document.getElementById('formSection').style.display = 'block';
  resetForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===== ADMIN LOGIN TO BACKEND ===== */
async function doLogin() {
  const user = document.getElementById('loginUser');
  const pass = document.getElementById('loginPass');
  const alertEl = document.getElementById('loginAlert');
  
  if (!user.value.trim() || !pass.value.trim()) {
    alertEl.innerHTML = '<div class="alert alert-error"><span class="alert-icon">⚠️</span>Please enter both username and password.</div>';
    return;
  }

  try {
    const response = await api.post(CONFIG.API_ENDPOINTS.LOGIN, {
      username: user.value.trim(),
      password: pass.value.trim()
    });

    const data = await response.json();

    if (data.success) {
      authToken = data.token;
      sessionStorage.setItem('admin_logged_in', '1');
      sessionStorage.setItem('admin_token', authToken);
      document.getElementById('loginPage').style.display = 'none';
      const ap = document.getElementById('adminPage');
      ap.style.display = 'flex';
      ap.classList.add('visible');
      addApiSettingsButton();
      await loadAdminData();
    } else {
      alertEl.innerHTML = '<div class="alert alert-error"><span class="alert-icon">🚫</span>Incorrect username or password. Please try again.</div>';
      pass.value = '';
    }
  } catch (error) {
    let errorMsg = 'Connection error. Please check if server is running.';
    if (confirm(`${errorMsg}\n\nWould you like to configure API settings?`)) {
      showApiConfigDialog();
    }
    alertEl.innerHTML = `<div class="alert alert-error"><span class="alert-icon">⚠️</span>${errorMsg}</div>`;
  }
}

function doLogout() {
  authToken = null;
  sessionStorage.removeItem('admin_logged_in');
  sessionStorage.removeItem('admin_token');
  document.getElementById('adminPage').style.display = 'none';
  document.getElementById('adminPage').classList.remove('visible');
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('loginAlert').innerHTML = '';
}

function togglePw() {
  const p = document.getElementById('loginPass');
  const e = document.getElementById('pwEye');
  if (p.type === 'password') { p.type = 'text'; e.textContent = '🙈'; }
  else { p.type = 'password'; e.textContent = '👁️'; }
}

/* ===== LOAD ADMIN DATA FROM BACKEND ===== */
async function loadAdminData() {
  if (!authToken) {
    authToken = sessionStorage.getItem('admin_token');
    if (authToken) {
      api = new API(CONFIG.API_BASE_URL, CONFIG.TIMEOUT);
    }
  }
  
  try {
    const response = await api.get(CONFIG.API_ENDPOINTS.ADMIN_COMPLAINTS);
    const data = await response.json();
    
    if (data.success) {
      renderStats(data.stats);
      renderTable(data.data);
    } else {
      throw new Error('Failed to load data');
    }
  } catch (error) {
    console.error('Error loading admin data:', error);
    showToast('Failed to load complaints data');
    if (error.message.includes('Failed to fetch')) {
      if (confirm('Cannot connect to server. Configure API settings?')) {
        showApiConfigDialog();
      }
    }
  }
}

/* ===== ADMIN STATS ===== */
function renderStats(stats) {
  const statItems = [
    { icon: '📋', label: 'Total Complaints', count: stats.total, bg: '#EEF2FF', color: '#4F46E5' },
    { icon: '🕐', label: 'Pending', count: stats.pending, bg: '#FEF3C7', color: '#D97706' },
    { icon: '🔄', label: 'In Progress', count: stats.inProgress, bg: '#DBEAFE', color: '#2563EB' },
    { icon: '✅', label: 'Resolved', count: stats.resolved, bg: '#D1FAE5', color: '#059669' },
  ];

  const container = document.getElementById('adminStats');
  if (!container) return;
  container.innerHTML = statItems.map(s => `
    <div class="card stat-card">
      <div class="stat-icon" style="background:${s.bg};color:${s.color}">${s.icon}</div>
      <div>
        <h3>${s.count}</h3>
        <p>${s.label}</p>
      </div>
    </div>
  `).join('');
}

/* ===== ADMIN TABLE ===== */
let currentComplaints = [];

function renderTable(complaints) {
  currentComplaints = complaints;
  const filterCat = document.getElementById('filterCategory')?.value || '';
  const filterStat = document.getElementById('filterStatus')?.value || '';
  const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

  const filtered = complaints.filter(c => {
    const matchCat = !filterCat || c.category === filterCat;
    const matchStat = !filterStat || c.status === filterStat;
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.subject.toLowerCase().includes(search) ||
      c.target.toLowerCase().includes(search) ||
      c.rollno.toLowerCase().includes(search);
    return matchCat && matchStat && matchSearch;
  });

  const tbody = document.getElementById('tableBody');
  const empty = document.getElementById('emptyState');
  const rc = document.getElementById('recordCount');

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    if (rc) rc.textContent = '0 records found';
    return;
  }

  empty.classList.add('hidden');
  if (rc) rc.textContent = `${filtered.length} record${filtered.length !== 1 ? 's' : ''} found`;

  const statusClass = { 'Pending': 'pending', 'In Progress': 'progress', 'Resolved': 'resolved' };
  const catBadge = { Department: 'badge-dept', Teacher: 'badge-teacher', Administration: 'badge-admin', Hostel: 'badge-hostel' };

  tbody.innerHTML = filtered.map((c, i) => `
    <tr id="row-${c._id}">
      <td><span style="color:var(--text-muted);font-size:0.82rem;font-weight:600">${i + 1}</span></td>
      <td>
        <div style="font-weight:600;font-size:0.92rem">${escapeHtml(c.name)}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${escapeHtml(c.email)}</div>
        ${c.rollno ? `<div style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(c.rollno)}</div>` : ''}
       </div>
      </td>
      <td><span class="badge ${catBadge[c.category] || ''}">${escapeHtml(c.category)}</span></div>
      </td>
      <td style="max-width:150px;font-size:0.88rem">${escapeHtml(c.target)}</div>
      </td>
      <td style="max-width:200px">
        <div style="font-size:0.88rem;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${escapeHtml(c.subject)}">${escapeHtml(c.subject)}</div>
        <div style="font-size:0.75rem;color:var(--text-muted)">${escapeHtml(c.date || '')}</div>
       </div>
      </td>
      <td>
        <select class="status-select ${statusClass[c.status] || 'pending'}" onchange="updateStatus('${c._id}', this)">
          <option value="Pending" ${c.status === 'Pending' ? 'selected' : ''}>🕐 Pending</option>
          <option value="In Progress" ${c.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
          <option value="Resolved" ${c.status === 'Resolved' ? 'selected' : ''}>✅ Resolved</option>
        </select>
       </div>
      </div>
      <td>
        <div class="action-btns">
          <button class="btn btn-sm btn-info" onclick="viewComplaint('${c._id}')" title="View Details">👁️ View</button>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${c._id}', '${escapeHtml(c.name)}')" title="Delete">🗑️</button>
        </div>
       </div>
    </div>
  `).join('');
}

/* ===== UPDATE STATUS ===== */
async function updateStatus(id, selectEl) {
  const newStatus = selectEl.value;
  
  try {
    const response = await api.put(`${CONFIG.API_ENDPOINTS.ADMIN_COMPLAINTS}/${id}`, {
      status: newStatus
    });
    
    const data = await response.json();
    
    if (data.success) {
      selectEl.className = 'status-select ' + ({ 'Pending': 'pending', 'In Progress': 'progress', 'Resolved': 'resolved' }[newStatus] || 'pending');
      await loadAdminData(); // Reload to update stats
      showToast(`✅ Status updated to "${newStatus}"`);
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    showToast('❌ Failed to update status');
  }
}

/* ===== VIEW COMPLAINT ===== */
async function viewComplaint(id) {
  try {
    const response = await api.get(`${CONFIG.API_ENDPOINTS.COMPLAINTS}/${id}`);
    const data = await response.json();
    
    if (data.success) {
      const c = data.data;
      const info = `
Name: ${c.name}
Email: ${c.email}
Roll No: ${c.rollno || 'N/A'}
Category: ${c.category}
Target: ${c.target}
Subject: ${c.subject}
Status: ${c.status}
Date: ${c.date || 'N/A'}

Complaint:
${c.complaint}
      `.trim();
      alert(info);
    }
  } catch (error) {
    showToast('Failed to load complaint details');
  }
}

/* ===== DELETE ===== */
let pendingDeleteId = null;

function openDeleteModal(id, name) {
  pendingDeleteId = id;
  document.getElementById('delName').textContent = name;
  document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('deleteModal').classList.remove('active');
}

async function confirmDelete() {
  if (pendingDeleteId === null) return;
  
  try {
    const response = await api.delete(`${CONFIG.API_ENDPOINTS.ADMIN_COMPLAINTS}/${pendingDeleteId}`);
    const data = await response.json();
    
    if (data.success) {
      pendingDeleteId = null;
      closeDeleteModal();
      await loadAdminData();
      showToast('🗑️ Complaint deleted successfully');
    } else {
      throw new Error('Failed to delete');
    }
  } catch (error) {
    showToast('❌ Failed to delete complaint');
  }
}

/* ===== FILTER FUNCTIONS ===== */
function applyFilters() {
  if (currentComplaints.length > 0) {
    renderTable(currentComplaints);
  }
}

/* ===== TOAST ===== */
let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ===== ESCAPE HTML ===== */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ===== CLOSE MODAL ON OUTSIDE CLICK ===== */
document.addEventListener('click', (e) => {
  const modal = document.getElementById('deleteModal');
  if (modal && e.target === modal) closeDeleteModal();
});

// Add filter event listeners and API settings button
document.addEventListener('DOMContentLoaded', () => {
  const filterCategory = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  const searchInput = document.getElementById('searchInput');
  
  if (filterCategory) filterCategory.addEventListener('change', applyFilters);
  if (filterStatus) filterStatus.addEventListener('change', applyFilters);
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  
  // Add API settings button to navbar for all pages
  const navbar = document.querySelector('.navbar .nav-container');
  if (navbar && !document.getElementById('navApiSettingsBtn')) {
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'navApiSettingsBtn';
    settingsBtn.innerHTML = '⚙️';
    settingsBtn.title = 'API Settings';
    settingsBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0 10px;
      color: var(--text);
      margin-left: auto;
    `;
    settingsBtn.onclick = showApiConfigDialog;
    
    const hamburger = navbar.querySelector('.hamburger');
    if (hamburger) {
      navbar.insertBefore(settingsBtn, hamburger);
    } else {
      navbar.appendChild(settingsBtn);
    }
  }
  
  // Auto-login if session active
  const adminPage = document.getElementById('adminPage');
  const loginPage = document.getElementById('loginPage');
  
  if (adminPage && loginPage) {
    const token = sessionStorage.getItem('admin_token');
    if (token && sessionStorage.getItem('admin_logged_in') === '1') {
      authToken = token;
      loginPage.style.display = 'none';
      adminPage.style.display = 'flex';
      adminPage.classList.add('visible');
      addApiSettingsButton();
      loadAdminData();
    } else {
      loginPage.style.display = 'flex';
      adminPage.style.display = 'none';
    }
  }
  
  // Display current API URL in a small tooltip
  console.log(`🔗 Current API URL: ${CONFIG.API_BASE_URL}`);
  
  // Optional: Add status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 10px;
    z-index: 9999;
    cursor: pointer;
  `;
  statusIndicator.innerHTML = `🔗 ${CONFIG.API_BASE_URL}`;
  statusIndicator.onclick = showApiConfigDialog;
  statusIndicator.title = "Click to change API URL";
  document.body.appendChild(statusIndicator);
});