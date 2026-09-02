document.addEventListener('DOMContentLoaded', () => {
  const recoveryForm = document.getElementById('recovery-form');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', handlePasswordReset);
  }
});

function handlePasswordReset(event) {
  // Prevent form page reload
  if (event) event.preventDefault();

  try {
    const emailInput = document.getElementById('recovery-email').value.trim().toLowerCase();
    const phoneInput = document.getElementById('recovery-phone').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 1. Check Password Match
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation password do not match!');
      return false;
    }

    // 2. Load Array from LocalStorage
    const rawData = localStorage.getItem('jombatech_students');
    let registeredStudents = rawData ? JSON.parse(rawData) : [];

    if (!Array.isArray(registeredStudents) || registeredStudents.length === 0) {
      alert('No registered accounts found. Redirecting to registration page...');
      window.location.assign('register.html');
      return false;
    }

    // 3. Find User by Email
    const studentIndex = registeredStudents.findIndex(
      s => s.email && s.email.trim().toLowerCase() === emailInput
    );

    if (studentIndex === -1) {
      alert('No account found matching that email address.');
      return false;
    }

    // 4. Phone Verification Check (Sanitizing spaces)
    const storedPhone = String(registeredStudents[studentIndex].phone || '').trim();
    if (storedPhone !== phoneInput) {
      alert('Phone number does not match our records for this account.');
      return false;
    }

    // 5. Save New Password
    registeredStudents[studentIndex].password = newPassword;
    localStorage.setItem('jombatech_students', JSON.stringify(registeredStudents));

    // 6. Alert & Redirect
    alert('Password updated successfully! Redirecting to login page...');
    
    // Redirect using location.assign for reliable browser navigation
    window.location.assign('login.html');

  } catch (error) {
    console.error('Password Reset Error:', error);
    alert('An error occurred during password reset. Check developer console.');
  }

  return false;
}