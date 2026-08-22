document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const errorBox = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');

        const email = document.getElementById('email').value;

        try {
            const res = await fetch('../../../backend/auth/forgot-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();

            if (data.success) {
                window.location.href = 'reset-password.html?email=' + encodeURIComponent(email);
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