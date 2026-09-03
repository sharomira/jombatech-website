let isSubmitting = false;

async function handleRegistration(event) {
  if (event) event.preventDefault();

  // Prevent duplicate execution if already processing
  if (isSubmitting) return;

  const fullNameInput = document.getElementById('full-name');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const courseInput = document.getElementById('course');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.querySelector('#register-form button[type="submit"]') || document.querySelector('button[type="submit"]');

  const fullName = fullNameInput ? fullNameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const phone = phoneInput ? phoneInput.value.trim() : '';
  const course = courseInput ? courseInput.value : '';
  const password = passwordInput ? passwordInput.value : '';

  if (!fullName || !email || !phone || !course || !password) {
    alert('Please complete all form fields.');
    return;
  }

  try {
    // Lock submit state and update button UI
    isSubmitting = true;
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.originalText = submitBtn.textContent;
      submitBtn.textContent = 'Registering...';
    }

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, phone, course, password })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('active_user', JSON.stringify(data.student));
      alert(`Account created successfully!\n\nYour Student ID: ${data.student.student_id}\nName: ${data.student.full_name}`);
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed. Please try again.');
    }
  } catch (error) {
    console.error('Registration Fetch Error:', error);
    alert('Unable to connect to the server. Please check your network connection.');
  } finally {
    // Reset state if registration fails
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      if (submitBtn.dataset.originalText) {
        submitBtn.textContent = submitBtn.dataset.originalText;
      }
    }
  }
}

// Bind event listener safely once DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.removeEventListener('submit', handleRegistration);
    registerForm.addEventListener('submit', handleRegistration);
  }
});