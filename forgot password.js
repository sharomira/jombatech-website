function handlePasswordReset(event) {
  event.preventDefault();

  const emailInput = document.getElementById('recovery-email').value.trim().toLowerCase();
  const phoneInput = document.getElementById('recovery-phone').value.trim();
  const newPassword = document.getElementById('new-password').value;

  let registeredStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  if (registeredStudents.length === 0) {
    alert('No registered accounts found. Please register first.');
    window.location.href = 'register.html';
    return;
  }

  // Search by Email
  const studentIndex = registeredStudents.findIndex(s => s.email === emailInput);

  if (studentIndex === -1) {
    alert('No account found with this email address.');
    return;
  }

  // Phone Security Check
  if (registeredStudents[studentIndex].phone !== phoneInput) {
    alert('Phone number does not match our records for this email.');
    return;
  }

  // Update Password
  registeredStudents[studentIndex].password = newPassword;
  localStorage.setItem('jombatech_students', JSON.stringify(registeredStudents));

  alert('Password reset successfully! Please log in with your new password.');
  window.location.href = 'login.html';
}