let currentRole = 'student';

// Function called by tab buttons in HTML
function switchRole(role) {
  currentRole = role;
  const roleInput = document.getElementById('user-role');
  if (roleInput) roleInput.value = role;

  const tabStudent = document.getElementById('tab-student');
  const tabAdmin = document.getElementById('tab-admin');
  const portalTitle = document.getElementById('portal-title');
  const portalSubtitle = document.getElementById('portal-subtitle');

  if (role === 'admin') {
    tabAdmin.classList.add('active');
    tabStudent.classList.remove('active');
    portalTitle.textContent = 'Admin Portal Login';
    portalSubtitle.textContent = 'Access system dashboard and management controls';
  } else {
    tabStudent.classList.add('active');
    tabAdmin.classList.remove('active');
    portalTitle.textContent = 'Student Login';
    portalSubtitle.textContent = 'Access your enrolled courses and certificate records';
  }
}

// Main Login Handler
async function handleLogin(event) {
  event.preventDefault();

  // Corrected IDs matching your HTML file
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleInput = document.getElementById('user-role');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passwordInput ? passwordInput.value : '';
  const role = roleInput ? roleInput.value : currentRole;

  if (!email || !password) {
    alert('Please enter both your email address and password.');
    return;
  }

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      // Save session info to localStorage for frontend display
      localStorage.setItem('active_user', JSON.stringify(data.user));
      alert(`Welcome back, ${data.user.fullName || data.user.full_name}!`);

      if (data.user.role === 'admin') {
        window.location.href = 'admin';
      } else {
        window.location.href = 'dashboard.html';
      }
    } else {
      alert(data.error || 'Invalid email or password.');
    }
  } catch (error) {
    console.error('Login Fetch Error:', error);
    alert('Unable to connect to the server. Please check your connection.');
  }
}