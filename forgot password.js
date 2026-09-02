document.addEventListener('DOMContentLoaded', () => {
  const recoveryForm = document.getElementById('recovery-form');
  if (recoveryForm) {
    recoveryForm.addEventListener('submit', handlePasswordReset);
  }
});

function handlePasswordReset(event) {
  // Prevent default form page reload
  if (event) event.preventDefault();

  try {
    // Extract and sanitize input values
    const emailInput = document.getElementById('recovery-email').value.trim().toLowerCase();
    const phoneInput = document.getElementById('recovery-phone').value.replace(/\D/g, ''); // Keep numbers only
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 1. Password Match Validation
    if (newPassword !== confirmPassword) {
      alert('New password and confirmation password do not match!');
      return false;
    }

    // 2. Load Registered Students Array
    const rawData = localStorage.getItem('jombatech_students');
    let registeredStudents = rawData ? JSON.parse(rawData) : [];

    if (!Array.isArray(registeredStudents) || registeredStudents.length === 0) {
      alert('No registered accounts found. Redirecting to registration page...');
      window.location.assign('register.html');
      return false;
    }

    // 3. Find Student Record by Email
    const studentIndex = registeredStudents.findIndex(
      s => s.email && s.email.trim().toLowerCase() === emailInput
    );

    if (studentIndex === -1) {
      alert('No account found matching that email address.');
      return false;
    }

    // 4. Sanitize and Compare Stored Phone Number
    const storedPhoneRaw = String(registeredStudents[studentIndex].phone || '');
    const storedPhoneSanitized = storedPhoneRaw.replace(/\D/g, '');

    if (storedPhoneSanitized !== phoneInput) {
      alert('Phone number does not match our records for this account.');
      return false;
    }

    // 5. Update Password in Student Database
    registeredStudents[studentIndex].password = newPassword;
    localStorage.setItem('jombatech_students', JSON.stringify(registeredStudents));

    // 6. Update Currently Active Session (If User Is Logged In)
    const rawActiveUser = localStorage.getItem('active_user');
    if (rawActiveUser) {
      let activeUser = JSON.parse(rawActiveUser);
      if (activeUser.email && activeUser.email.trim().toLowerCase() === emailInput) {
        activeUser.password = newPassword;
        localStorage.setItem('active_user', JSON.stringify(activeUser));
      }
    }

    // 7. Notify User and Redirect to Login Page
    alert('Password updated successfully! Redirecting to login page...');
    window.location.assign('login.html');

  } catch (error) {
    console.error('Password Reset Error:', error);
    alert('An unexpected error occurred during password reset. Please check the browser console.');
  }

  return false;
}