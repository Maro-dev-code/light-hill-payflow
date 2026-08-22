document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('dashboard.html');

    try {
        const res = await fetch('/light-hill-payflow/backend/payments/get-approved-requests.php');
        const data = await res.json();

        if (!data.success) return;

        const requests = data.requests;
        document.getElementById('stat-awaiting').textContent = requests.length;

        const historyRes = await fetch('/light-hill-payflow/backend/payments/get-payment-history.php');
        const historyData = await historyRes.json();

        if (historyData.success) {
            const thisMonth = new Date().getMonth();
            const thisYear = new Date().getFullYear();
            const paidThisMonth = historyData.payments.filter(p => {
                const d = new Date(p.payment_date);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            });
            document.getElementById('stat-paid-month').textContent = paidThisMonth.length;
        }

        const tbody = document.getElementById('requests-body');
        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No requests awaiting payment.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.slice(0, 5).map(r => `
            <tr onclick="window.location.href='record-payment.html?id=${r.id}'">
                <td>${r.request_id}</td>
                <td>${r.requester_name}</td>
                <td>${r.subject}</td>
                <td>₦${Number(r.amount).toLocaleString()}</td>
                <td>${new Date(r.updated_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Dashboard load error:', err);
    }
});