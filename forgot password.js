function handlePasswordReset(event) {
  event.preventDefault();

  const emailInput = document.getElementById('recovery-email').value.trim().toLowerCase();
  const phoneInput = document.getElementById('recovery-phone').value.trim();
  const newPassword = document.getElementById('new-password').value;

  // Retrieve existing stored students
  let registeredStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  if (registeredStudents.length === 0) {
    alert('No accounts found. Please register first.');
    window.location.href = 'register.html';
    return;
  }

  // Find student by matching email
  const studentIndex = registeredStudents.findIndex(student => student.email === emailInput);

  if (studentIndex === -1) {
    alert('No account found with this email address.');
    return;
  }

  // Verify phone number matching registered details
  if (registeredStudents[studentIndex].phone !== phoneInput) {
    alert('Phone number does not match our records for this account.');
    return;
  }

  // Update password in array
  registeredStudents[studentIndex].password = newPassword;

  // Save updated list back to localStorage
  localStorage.setItem('jombatech_students', JSON.stringify(registeredStudents));

  alert('Password reset successfully! Please login with your new password.');

  // Redirect to login page
  window.location.href = 'login.html';
}