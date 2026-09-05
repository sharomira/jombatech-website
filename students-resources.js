let allResources = [];

document.addEventListener('DOMContentLoaded', () => {
  // Check active student session from localStorage
  const userSession = localStorage.getItem('active_user');
  
  if (!userSession) {
    alert('Please log in to access student resources.');
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(userSession);
  const welcomeTitle = document.getElementById('welcome-title');
  
  if (welcomeTitle && user.fullName) {
    welcomeTitle.textContent = `Welcome, ${user.fullName.split(' ')[0]}`;
  }

  // Fetch dynamic resources from backend API
  fetchResources();
});

// Fetch resources uploaded by admin from Express server
async function fetchResources() {
  const container = document.getElementById('resources-grid');

  try {
    const response = await fetch('/api/student/resources', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // Transmits httpOnly session cookies
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Your session has expired. Please log in again.');
        window.location.href = 'login.html';
        return;
      }
      throw new Error('Failed to fetch resources.');
    }

    allResources = await response.json();
    renderResources(allResources);

  } catch (error) {
    console.error('Error fetching resources:', error);
    if (container) {
      container.innerHTML = `<p style="text-align: center; color: #ff4d4d; grid-column: 1/-1;">Error loading study materials. Please refresh or log in again.</p>`;
    }
  }
}

// Helper to sanitize file paths for local uploads vs external URLs
function getDownloadUrl(fileUrl) {
  if (!fileUrl) return '#';
  
  // If it's already a full absolute HTTP/HTTPS URL, return as is
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  
  // Ensure local upload paths start with a leading slash
  return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
}

// Render dynamic resource cards into grid
function renderResources(resources) {
  const container = document.getElementById('resources-grid');
  if (!container) return;

  if (!resources || resources.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8; grid-column: 1/-1;">No study resources available yet.</p>`;
    return;
  }

  container.innerHTML = resources.map(item => {
    // Map database course name to category for filtering
    const courseLower = (item.course || '').toLowerCase();
    let category = 'all';
    
    if (courseLower.includes('computer')) {
      category = 'computer';
    } else if (courseLower.includes('repair') || courseLower.includes('electronics')) {
      category = 'repair';
    } else if (courseLower.includes('exam')) {
      category = 'exams';
    }

    // Set badge style depending on category
    let badgeClass = 'badge-blue';
    if (category === 'repair') badgeClass = 'badge-cyan';
    if (category === 'exams') badgeClass = 'badge-amber';

    const downloadPath = getDownloadUrl(item.file_url);

    return `
      <div class="resource-card" data-category="${category}">
        <div class="card-badge ${badgeClass}">${escapeHtml(item.course || 'Resource')}</div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>Official study material provided for ${escapeHtml(item.course)} students.</p>
        <div class="card-meta">Access: Free Download</div>
        <a href="${downloadPath}" target="_blank" rel="noopener noreferrer" class="download-btn" download>Download File</a>
      </div>
    `;
  }).join('');
}

// Category filtering function
function filterCategory(category) {
  // Update Tab Active States
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${category}`);
  if (activeTab) activeTab.classList.add('active');

  // Filter dynamic resources
  if (category === 'all') {
    renderResources(allResources);
    return;
  }

  const filtered = allResources.filter(item => {
    const courseLower = (item.course || '').toLowerCase();
    if (category === 'computer') return courseLower.includes('computer');
    if (category === 'repair') return courseLower.includes('repair') || courseLower.includes('electronics');
    if (category === 'exams') return courseLower.includes('exam');
    return true;
  });

  renderResources(filtered);
}

// Security Helper to prevent HTML injection/XSS
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, match => {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[match];
  });
}

// Logout Action
function handleLogout() {
  localStorage.removeItem('active_user');
  localStorage.removeItem('token');
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  alert('Logged out successfully.');
  window.location.href = 'login.html';
}