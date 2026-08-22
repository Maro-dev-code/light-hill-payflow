document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('create-privileged-account.html');

    const form = document.getElementById('create-form');
    const errorBox = document.getElementById('error-message');
    const successBox = document.getElementById('success-message');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');

        const payload = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            position: document.getElementById('position').value,
            role: document.getElementById('role').value,
            password: document.getElementById('password').value,
        };

        try {
            const res = await fetch('/light-hill-payflow/backend/admin/create-privileged-account.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (data.success) {
                successBox.textContent = 'Account created successfully!';
                successBox.classList.remove('hidden');
                form.reset();
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