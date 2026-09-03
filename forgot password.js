async function handlePasswordReset(event) {
  if (event) event.preventDefault();

  const email = document.getElementById('recovery-email').value.trim().toLowerCase();
  const phone = document.getElementById('recovery-phone').value.trim();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  if (!email || !phone || !newPassword || !confirmPassword) {
    alert('Please complete all recovery fields.');
    return;
  }

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
      alert('Password successfully updated across all devices! Redirecting to login page...');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Password reset failed. Please check your registered details.');
    }
  } catch (error) {
    console.error('Password Reset Fetch Error:', error);
    alert('Unable to connect to the server. Please check your network connection.');
  }
}

// Bind event listener to recovery form
document.addEventListener('DOMContentLoaded', () => {
  const recoveryForm = document.getElementById('recovery-form');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', handlePasswordReset);
  }
});