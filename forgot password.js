// Reusable toggle function accepting target element IDs
function togglePasswordVisibility(inputId, btnId) {
  const passwordInput = document.getElementById(inputId);
  const toggleBtn = document.getElementById(btnId);

  if (!passwordInput || !toggleBtn) return;

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = 'Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = 'Show';
  }
}

// Password Reset Request Handler
async function handlePasswordReset(event) {
  event.preventDefault();

  const emailInput = document.getElementById('recovery-email');
  const phoneInput = document.getElementById('recovery-phone');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const newPassword = newPasswordInput ? newPasswordInput.value : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  if (newPassword !== confirmPassword) {
    alert('New password and confirm password do not match.');
    return;
  }

  try {
    const response = await fetch('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, phone, newPassword })
    });

    const data = await response.json();

    if (response.ok) {
      alert('Password reset successful! Redirecting to login page...');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Failed to reset password. Please verify your email and phone number.');
    }
  } catch (error) {
    console.error('Password Reset Fetch Error:', error);
    alert('Unable to connect to the server. Please check your connection.');
  }
}