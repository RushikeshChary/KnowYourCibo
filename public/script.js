// Simple form validation to check for required fields
const form = document.getElementById('contact-form');

form.addEventListener('submit', (event) => {
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');

    if (nameInput.value === '' || emailInput.value === '' || messageInput.value === '') {
        alert('Please fill in all required fields.');
        event.preventDefault(); // Prevent form submission
    }
});

// Get references to the password input and the show password button
const passwordInput = document.getElementById('password');
const showPasswordButton = document.getElementById('showPasswordButton');

// Function to toggle password visibility
function togglePasswordVisibility() {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        showPasswordButton.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        showPasswordButton.textContent = 'Show';
    }
}

// Add click event listener to the show password button
showPasswordButton.addEventListener('click', togglePasswordVisibility);
