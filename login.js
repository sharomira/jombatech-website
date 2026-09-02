// Switch Portal Role (Student vs Admin)
function switchRole(role) {
  const studentTab = document.getElementById('tab-student');
  const adminTab = document.getElementById('tab-admin');
  const title = document.getElementById('portal-title');
  const subtitle = document.getElementById('portal-subtitle');
  const userRoleInput = document.getElementById('user-role');

  userRoleInput.value = role;

  if (role === 'admin') {
    adminTab.classList.add('active');
    studentTab.classList.remove('active');
    title.innerText = 'Admin Portal Login';
    subtitle.innerText = 'Access student records and approve certificate generations';
  } else {
    studentTab.classList.add('active');
    adminTab.classList.remove('active');
    title.innerText = 'Student Login';
    subtitle.innerText = 'Access your enrolled courses and certificate records';
  }
}

// Authentication Handler
function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById('email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('password').value;
  const selectedRole = document.getElementById('user-role').value;

  // 1. Admin Login Hardcoded Check
  if (selectedRole === 'admin') {
    if (emailInput === 'admin@jombatech.com' && passwordInput === 'admin123') {
      const adminSession = {
        fullName: 'System Administrator',
        email: emailInput,
        role: 'admin'
      };
      localStorage.setItem('active_user', JSON.stringify(adminSession));
      alert('Admin login successful! Redirecting to dashboard...');
      window.location.href = 'dashboard.html';
      return;
    } else {
      alert('Invalid Admin credentials.');
      return;
    }
  }

  // 2. Fetch Stored Accounts
  const registeredStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  if (registeredStudents.length === 0) {
    alert('No student accounts found. Please register an account first.');
    window.location.href = 'register.html';
    return;
  }

  // 3. Match Email
  const student = registeredStudents.find(s => s.email === emailInput);

  if (!student) {
    alert('No account found with this email. Please check your spelling or register.');
    return;
  }

  // 4. Match Password
  if (student.password !== passwordInput) {
    alert('Incorrect password. Please try again or click "Forgot Password?".');
    return;
  }

  // 5. Store Session and Redirect
  localStorage.setItem('active_user', JSON.stringify(student));
  alert(`Welcome back, ${student.fullName}!`);
  window.location.href = 'dashboard.html';
}