document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('payments.html');

    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('id');
    const summaryBox = document.getElementById('request-summary');
    const form = document.getElementById('payment-form');
    const errorBox = document.getElementById('error-message');
    const successBox = document.getElementById('success-message');

    if (!requestId) {
        summaryBox.innerHTML = '<p>No request specified.</p>';
        return;
    }

    let requestData = null;

    try {
        const res = await fetch(`/light-hill-payflow/backend/requests/get-request-approver.php?id=${requestId}`);
        const data = await res.json();

        if (!data.success) {
            summaryBox.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        requestData = data.request;

        if (requestData.status !== 'approved') {
            summaryBox.innerHTML = `<p>This request is not ready for payment (current status: ${requestData.status}).</p>`;
            form.style.display = 'none';
            return;
        }

        summaryBox.innerHTML = `
            <h2>${requestData.subject}</h2>
            <p>${requestData.request_id} · Requested by ${requestData.requester_name}</p>
            <p class="amount">₦${Number(requestData.amount).toLocaleString()}</p>
        `;

        document.getElementById('amount-paid').value = requestData.amount;

    } catch (err) {
        summaryBox.innerHTML = '<p>Failed to load request.</p>';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorBox.classList.add('hidden');
        successBox.classList.add('hidden');

        const formData = new FormData();
        formData.append('request_id', requestId);
        formData.append('amount_paid', document.getElementById('amount-paid').value);
        formData.append('payment_date', document.getElementById('payment-date').value);
        formData.append('payment_reference', document.getElementById('payment-reference').value);
        formData.append('proof_file', document.getElementById('proof-file').files[0]);

        try {
            const res = await fetch('/light-hill-payflow/backend/payments/record-payment.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                successBox.textContent = 'Payment recorded successfully! Redirecting...';
                successBox.classList.remove('hidden');
                setTimeout(() => {
                    window.location.href = 'payments.html';
                }, 1500);
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