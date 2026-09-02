function handleRegistration(event) {
  event.preventDefault();

  // Extract form input values
  const fullName = document.getElementById('full-name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const course = document.getElementById('course').value;
  const password = document.getElementById('password').value;

  // Generate a unique Student Registration ID
  const studentId = 'JTI-' + Math.floor(1000 + Math.random() * 9000);

  // Construct structured student data record
  const newStudent = {
    studentId: studentId,
    fullName: fullName,
    email: email,
    phone: phone,
    course: course,
    password: password, // In production, never save plain text passwords
    role: 'student',
    certificateEligible: false, // Set to true by Admin upon course completion
    registrationDate: new Date().toISOString().split('T')[0]
  };

  // Retrieve existing stored students array or initialize a new array
  let existingStudents = JSON.parse(localStorage.getItem('jombatech_students')) || [];

  // Check if email already exists
  const userExists = existingStudents.some(student => student.email === email);
  if (userExists) {
    alert('An account with this email already exists. Please login instead.');
    return;
  }

  // Store new record
  existingStudents.push(newStudent);
  localStorage.setItem('jombatech_students', JSON.stringify(existingStudents));

  // Save current active session user
  localStorage.setItem('active_user', JSON.stringify(newStudent));

  alert(`Account created successfully!\n\nYour Student ID: ${studentId}\nName: ${fullName}`);
  
  // Clear inputs or redirect
  document.getElementById('register-form').reset();
}