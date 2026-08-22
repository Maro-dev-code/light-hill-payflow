document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');

    loginErrorSetup();
    function loginErrorSetup() {
        const err = document.createElement('div');
        err.id = 'error-message';
        err.className = 'error-message hidden';
        form.prepend(err);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorBox = document.getElementById('error-message');
        errorBox.classList.add('hidden');

        const payload = {
            name: document.getElementById('full-name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone-number').value,
            position: document.getElementById('position').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmpassword').value
        };

        try {
            const res = await fetch('../../../backend/auth/register.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                window.location.href = 'verify-email.html?email=' + encodeURIComponent(payload.email);
            } else {
                errorBox.textContent = data.message;
                errorBox.classList.remove('hidden');
            }
        } catch (err) {
            errorBox.textContent = 'Something went wrong. Please try again.';
            errorBox.classList.remove('hidden');
        }
    });
});