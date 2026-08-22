document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('history.html');

    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('id');
    const container = document.getElementById('payment-container');

    if (!paymentId) {
        container.innerHTML = '<p>No payment specified.</p>';
        return;
    }

    try {
        const res = await fetch(`/light-hill-payflow/backend/payments/get-payment.php?id=${paymentId}`);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        const p = data.payment;

        container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div>
                        <h2>${p.subject}</h2>
                        <p>${p.request_id} · Paid to ${p.requester_name}</p>
                    </div>
                    <span class="status-badge status-paid">Paid</span>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Amount Paid</label>
                        <p>₦${Number(p.amount_paid).toLocaleString()}</p>
                    </div>
                    <div class="detail-field">
                        <label>Payment Date</label>
                        <p>${new Date(p.payment_date).toLocaleDateString()}</p>
                    </div>
                    <div class="detail-field">
                        <label>Payment Reference</label>
                        <p>${p.payment_reference || '—'}</p>
                    </div>
                    <div class="detail-field">
                        <label>Recorded On</label>
                        <p>${new Date(p.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <a href="/light-hill-payflow/backend/uploads/payments/${p.proof_file}" target="_blank" class="attachment-item">
                    <i class="fa-solid fa-file-invoice"></i> View Proof of Payment
                </a>
            </div>
        `;

    } catch (err) {
        container.innerHTML = '<p>Failed to load payment details.</p>';
    }
});