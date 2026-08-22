document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('history.html');

    try {
        const res = await fetch('/light-hill-payflow/backend/payments/get-payment-history.php');
        const data = await res.json();

        if (!data.success) return;

        const tbody = document.getElementById('history-body');
        const payments = data.payments;

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No payments recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = payments.map(p => `
            <tr onclick="window.location.href='payment-details.html?id=${p.id}'">
                <td>${p.request_id}</td>
                <td>${p.requester_name}</td>
                <td>${p.subject}</td>
                <td>₦${Number(p.amount_paid).toLocaleString()}</td>
                <td>${new Date(p.payment_date).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('History load error:', err);
    }
});