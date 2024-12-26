// src/auth/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

function handleLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (validateInput(email, password)) {
        // Call authentication API for login
        authenticateUser(email, password);
    } else {
        showAlert('Please fill in all fields correctly.', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (validateInput(email, password)) {
        // Call authentication API for registration
        registerUser(email, password);
    } else {
        showAlert('Please fill in all fields correctly.', 'error');
    }
}

function validateInput(email, password) {
    return email && password && email.includes('@');
}

function authenticateUser(email, password) {
    // Placeholder for authentication logic
    console.log('Authenticating user:', email);
    showAlert('Login successful!', 'success');
}

function registerUser(email, password) {
    // Placeholder for registration logic
    console.log('Registering user:', email);
    showAlert('Registration successful!', 'success');
}

function showAlert(message, type) {
    const alertBox = document.createElement('div');
    alertBox.className = `alert ${type}`;
    alertBox.textContent = message;
    document.body.appendChild(alertBox);
    setTimeout(() => {
        alertBox.remove();
    }, 3000);
}