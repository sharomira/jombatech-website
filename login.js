async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const role = document.getElementById('role-select') ? document.getElementById('role-select').value : 'student';

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
      // Save session info to identify logged-in user across pages
      localStorage.setItem('active_user', JSON.stringify(data.user));
      alert(`Welcome back, ${data.user.fullName || data.user.full_name}!`);

      if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'student-dashboard.html';
      }
    } else {
      alert(data.error || 'Invalid credentials.');
    }
  } catch (error) {
    console.error('Login Fetch Error:', error);
    alert('Unable to connect to the server. Please check your connection.');
  }
}

// Bind event listener to the login form
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
});