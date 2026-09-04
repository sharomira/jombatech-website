document.addEventListener('DOMContentLoaded', () => {
  // Check active student session on load
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
});

// Category filtering function
function filterCategory(category) {
  // Update Tab States
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => tab.classList.remove('active'));

  const activeTab = document.getElementById(`tab-${category}`);
  if (activeTab) activeTab.classList.add('active');

  // Filter Grid Cards
  const cards = document.querySelectorAll('.resource-card');
  cards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

// Logout Action
function handleLogout() {
  localStorage.removeItem('active_user');
  localStorage.removeItem('token');
  alert('Logged out successfully.');
  window.location.href = 'login.html';
}