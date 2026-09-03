async function handleRegistration(event) {
  event.preventDefault();

  const fullName = document.getElementById('full-name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const phone = document.getElementById('phone').value.trim();
  const course = document.getElementById('course').value;
  const password = document.getElementById('password').value;

  if (!fullName || !email || !phone || !course || !password) {
    alert('Please complete all form fields.');
    return;
  }

  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, course, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Store current user session details if needed on frontend
      localStorage.setItem('active_user', JSON.stringify(data.student));
      alert(`Account created successfully!\n\nYour Student ID: ${data.student.student_id}\nName: ${data.student.full_name}`);
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Registration Fetch Error:', error);
    alert('Unable to connect to the server. Please check your network connection.');
  }
}

// Bind event listener to the registration form
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegistration);
  }
});