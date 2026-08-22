document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const errorBox = document.getElementById('error-message');
    const otpInputs = document.querySelectorAll('.otp-input');
    const resendLink = document.getElementById('resend-link');

    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');

    otpInputs.forEach((input, i) => {
        input.addEventListener('input', () => {
            if (input.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !input.value && i > 0) otpInputs[i - 1].focus();
        });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');

        const otp = Array.from(otpInputs).map(i => i.value).join('');
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (newPassword !== confirmPassword) {
            errorBox.textContent = 'Passwords do not match.';
            errorBox.classList.remove('hidden');
            return;
        }

        try {
            const res = await fetch('../../../backend/auth/reset-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword })
            });
            const data = await res.json();

            if (data.success) {
                window.location.href = 'login.html';
            } else {
                errorBox.textContent = data.message;
                errorBox.classList.remove('hidden');
            }
        } catch (err) {
            errorBox.textContent = 'Something went wrong. Please try again.';
            errorBox.classList.remove('hidden');
        }
    });

    resendLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await fetch('../../../backend/auth/forgot-password.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            errorBox.textContent = 'A new code has been sent to your email.';
            errorBox.classList.remove('hidden');
            errorBox.style.background = '#dcfce7';
            errorBox.style.color = 'var(--color-success)';
        } catch (err) {
            errorBox.textContent = 'Could not resend code. Try again.';
            errorBox.classList.remove('hidden');
        }
    });
});