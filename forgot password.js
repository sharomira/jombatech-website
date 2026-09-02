function handlePasswordReset(event) {
  event.preventDefault();

  const emailInput = document.getElementById('recovery-email').value.trim().toLowerCase();
  const phoneInput = document.getElementById('recovery-phone').value.trim();
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // 1. Password Match Validation
  if (newPassword !== confirmPassword) {
    alert('New password and confirmation password do not match!');
    return;
  }

  // 2. Fetch Stored Accounts
  let registeredStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  if (registeredStudents.length === 0) {
    alert('No registered accounts found. Please register first.');
    window.location.href = 'register.html';
    return;
  }

  // 3. Search by Email
  const studentIndex = registeredStudents.findIndex(s => s.email.toLowerCase() === emailInput);

  if (studentIndex === -1) {
    alert('No account found with this email address.');
    return;
  }

  // 4. Phone Security Check
  if (registeredStudents[studentIndex].phone !== phoneInput) {
    alert('Phone number does not match our records for this email.');
    return;
  }

  // 5. Update Password in local storage array
  registeredStudents[studentIndex].password = newPassword;
  localStorage.setItem('jombatech_students', JSON.stringify(registeredStudents));

  // If user is currently logged in, update active session too
  const activeUser = JSON.parse(localStorage.getItem('active_user'));
  if (activeUser && activeUser.email.toLowerCase() === emailInput) {
    activeUser.password = newPassword;
    localStorage.setItem('active_user', JSON.stringify(activeUser));
  }

  alert('Password reset successfully! Redirecting to login page...');
  
  // 6. Explicit redirect to login page
  window.location.href = 'login.html';
}