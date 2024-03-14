

let messageElement = document.getElementById('message');
let email = document.getElementById('email');
let button = document.getElementById('resetButton');

function submitForm() {
    
    // Perform validation on the email address (you can add more validation)
    if (email.value === '') {
        // console.log(email);
        messageElement.innerText = 'Please enter your email address.';
        // messageElement.innerText = email.value;
        return;
    }

    // Assume a successful password reset (you may want to implement server-side logic)
    messageElement.style.color = 'green';
    messageElement.innerText = 'Password reset instructions sent to ' + email.value;
}

button.addEventListener("click", submitForm);