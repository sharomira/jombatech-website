// Switch Role Tabs (Student vs Admin)
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

// Authentication Logic
function handleLogin(event) {
  event.preventDefault();

  const emailInput = document.getElementById('email').value.trim().toLowerCase();
  const passwordInput = document.getElementById('password').value;
  const selectedRole = document.getElementById('user-role').value;

  // 1. Check for Admin Login hardcoded bypass (for testing/admin access)
  if (selectedRole === 'admin') {
    if (emailInput === 'admin@jombatech.com' && passwordInput === 'admin123') {
      const adminSession = {
        fullName: 'System Administrator',
        email: emailInput,
        role: 'admin'
      };
      localStorage.setItem('active_user', JSON.stringify(adminSession));
      alert('Admin authentication successful! Redirecting to Admin Dashboard...');
      window.location.href = 'dashboard.html';
      return;
    } else {
      alert('Invalid Admin credentials. (Default test login: admin@jombatech.com / admin123)');
      return;
    }
  }

  // 2. Retrieve registered students from storage
  const registeredStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  if (registeredStudents.length === 0) {
    alert('No registered accounts found. Please register an account first.');
    window.location.href = 'register.html';
    return;
  }

  // 3. Find matching user record by Email
  const foundStudent = registeredStudents.find(student => student.email === emailInput);

  if (!foundStudent) {
    alert('No account found with this email address. Please check your spelling or register first.');
    return;
  }

  // 4. Validate Password match
  if (foundStudent.password !== passwordInput) {
    alert('Incorrect password. Please try again.');
    return;
  }

  // 5. Store validated session data
  localStorage.setItem('active_user', JSON.stringify(foundStudent));

  alert(`Welcome back, ${foundStudent.fullName}!\n\nLogged in successfully as ${foundStudent.role.toUpperCase()}.`);
  
  // 6. Redirect to main dashboard
  window.location.href = 'dashboard.html';
}