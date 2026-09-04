let currentRole = 'student';
let isSubmitting = false;

// Toggle password visibility (Show/Hide)
function togglePasswordVisibility() {
  const passwordInput = document.getElementById('password');
  const toggleBtn = document.getElementById('toggle-password');

  if (!passwordInput || !toggleBtn) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
  }
}

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
    tabAdmin?.classList.add('active');
    tabStudent?.classList.remove('active');
    if (portalTitle) portalTitle.textContent = 'Admin Portal Login';
    if (portalSubtitle) portalSubtitle.textContent = 'Access system dashboard and management controls';
  } else {
    tabStudent?.classList.add('active');
    tabAdmin?.classList.remove('active');
    if (portalTitle) portalTitle.textContent = 'Student Login';
    if (portalSubtitle) portalSubtitle.textContent = 'Access your enrolled courses and certificate records';
  }
}

// Main Login Handler
async function handleLogin(event) {
  if (event) event.preventDefault();

  if (isSubmitting) return;

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const roleInput = document.getElementById('user-role');
  const submitBtn = document.querySelector('#login-form button[type="submit"]') || document.querySelector('button[type="submit"]');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const password = passwordInput ? passwordInput.value : '';
  const role = roleInput ? roleInput.value : currentRole;

  if (!email || !password) {
    alert('Please enter both your email address and password.');
    return;
  }

  try {
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Logging in...';
    }

    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await response.json();

    if (response.ok) {
      // Save session info and token to localStorage
      localStorage.setItem('active_user', JSON.stringify(data.user));
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // Redirect user according to role
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = 'students-resources.html';
      }
    } else {
      alert(data.error || 'Invalid email or password.');
    }
  } catch (error) {
    console.error('Login Fetch Error:', error);
    alert('Unable to connect to the server. Please check your connection.');
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }
}

// Bind submit event safely once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.removeEventListener('submit', handleLogin);
    loginForm.addEventListener('submit', handleLogin);
  }
});