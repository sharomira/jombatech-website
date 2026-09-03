let isResetting = false;

async function handlePasswordReset(event) {
  if (event) event.preventDefault();

  // Prevent double execution from duplicate triggers or clicks
  if (isResetting) return;

  const emailInput = document.getElementById('recovery-email');
  const phoneInput = document.getElementById('recovery-phone');
  const newPasswordInput = document.getElementById('new-password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const recoveryForm = document.getElementById('recovery-form');
  const submitBtn = recoveryForm ? recoveryForm.querySelector('button[type="submit"]') : document.querySelector('button[type="submit"]');

  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const newPassword = newPasswordInput ? newPasswordInput.value : '';
  const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

  if (!email || !phone || !newPassword || !confirmPassword) {
    alert('Please complete all recovery fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    alert('New password and confirm password do not match.');
    return;
  }

  try {
    // Lock submission state and update UI
    isResetting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Updating Password...';
    }

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
  } finally {
    // Reset state if request fails
    isResetting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }
}

// Bind event listener safely when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const recoveryForm = document.getElementById('recovery-form');
  if (recoveryForm) {
    recoveryForm.removeEventListener('submit', handlePasswordReset);
    recoveryForm.addEventListener('submit', handlePasswordReset);
  }
});