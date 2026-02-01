$(document).ready(function () {
  $("#openLoginLink").click(function (e) {
    e.preventDefault();
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
    loginModal.show();
  });

  $("#openSignupLink").click(function (e) {
    e.preventDefault();
    const modal = bootstrap.Modal.getInstance(document.getElementById("loginModal"));
    modal.hide();
    $("html, body").animate({ scrollTop: $(".signup-box").offset().top }, 600);
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('signupForm');

  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  let confirmPassword = document.getElementById('confirmPassword');

  function showError(input, message) {
    removeError(input);
    const error = document.createElement('p');
    error.textContent = message;
    error.classList.add('error-msg');
    input.after(error);
    input.classList.add('invalid');
    input.classList.remove('valid');
  }

  function removeError(input) {
    const next = input.nextElementSibling;
    if (next && next.classList.contains('error-msg')) next.remove();
    input.classList.remove('invalid');
    input.classList.add('valid');
  }

  function validateName(input) {
    const nameRegex = /^[A-Za-zА-Яа-яЁё]{2,}$/;
    if (!nameRegex.test(input.value.trim())) {
      showError(input, 'At least 2 letters, letters only.');
      return false;
    } else {
      removeError(input);
      return true;
    }
  }

  function validateEmail(input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value.trim())) {
      showError(input, 'Enter a valid email.');
      return false;
    } else {
      removeError(input);
      return true;
    }
  }

  function validatePassword(input) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(input.value.trim())) {
      showError(input, '6+ chars, uppercase, lowercase, number, special char.');
      return false;
    } else {
      removeError(input);
      return true;
    }
  }

  function validateConfirmPassword() {
    if (!confirmPassword) return true; 
    if (password.value.trim() !== confirmPassword.value.trim()) {
      showError(confirmPassword, 'Passwords do not match.');
      return false;
    } else {
      removeError(confirmPassword);
      return true;
    }
  }

  firstName.addEventListener('input', () => validateName(firstName));
  lastName.addEventListener('input', () => validateName(lastName));
  email.addEventListener('input', () => validateEmail(email));
  password.addEventListener('input', () => {
    validatePassword(password);
    if (confirmPassword.value) validateConfirmPassword();
  });
  if (confirmPassword) confirmPassword.addEventListener('input', validateConfirmPassword);

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const valid =
      validateName(firstName) &&
      validateName(lastName) &&
      validateEmail(email) &&
      validatePassword(password) &&
      validateConfirmPassword();

    if (!valid) return;

    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.find(u => u.email === email.value.trim())) {
      alert('This email is already used. Please sign in instead.');
      return;
    }

    const newUser = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      email: email.value.trim(),
      password: password.value.trim()
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    alert('Account created successfully!');
    const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
    loginModal.show();
    form.reset();

    [firstName, lastName, email, password, confirmPassword].forEach(input => {
      if (input) input.classList.remove('valid', 'invalid');
    });
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');

  function showLoginError(input, message) {
    const next = input.nextElementSibling;
    if (next && next.classList.contains('login-error')) next.remove();
    const error = document.createElement('p');
    error.textContent = message;
    error.classList.add('login-error');
    error.style.color = 'red';
    input.after(error);
    input.classList.add('invalid');
    input.classList.remove('valid');
  }

  function removeLoginError(input) {
    const next = input.nextElementSibling;
    if (next && next.classList.contains('login-error')) next.remove();
    input.classList.remove('invalid');
    input.classList.add('valid');
  }

  loginEmail.addEventListener('input', () => {
    if (loginEmail.value.includes('@')) removeLoginError(loginEmail);
  });
  loginPassword.addEventListener('input', () => {
    if (loginPassword.value.length >= 6) removeLoginError(loginPassword);
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    let valid = true;
    if (!loginEmail.value.includes('@')) {
      showLoginError(loginEmail, 'Please enter a valid email.');
      valid = false;
    }
    if (loginPassword.value.length < 6) {
      showLoginError(loginPassword, 'Password must be at least 6 characters long.');
      valid = false;
    }
    if (!valid) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const foundUser = users.find(u => u.email === loginEmail.value.trim() && u.password === loginPassword.value.trim());

    if (!foundUser) {
      alert('Invalid email or password.');
      return;
    }

    localStorage.setItem('loggedUser', JSON.stringify(foundUser));
    alert('Login successful!');
    window.location.href = 'index.html';
  });
});

document.addEventListener('DOMContentLoaded', function () {
  const toggleBtn = document.getElementById('theme-toggle');
  const currentTheme = localStorage.getItem('theme') || 'light';

  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.querySelector('.navbar').classList.add('dark-mode');
    document.querySelector('.footer').classList.add('dark-mode');
    toggleBtn.textContent = '☀️'; 
  } else {
    toggleBtn.textContent = '🌙';
  }

  toggleBtn.addEventListener('click', function () {
    const isDark = document.body.classList.toggle('dark-mode');
    document.querySelector('.navbar').classList.toggle('dark-mode');
    document.querySelector('.footer').classList.toggle('dark-mode');
    toggleBtn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});
