document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('history.html');

    try {
        const res = await fetch('/light-hill-payflow/backend/approvals/get-history.php');
        const data = await res.json();

        if (!data.success) return;

        const tbody = document.getElementById('history-body');
        const requests = data.requests;

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No history yet.</td></tr>';
            return;
        }

        tbody.innerHTML = requests.map(r => `
            <tr onclick="window.location.href='request-details.html?id=${r.id}'">
                <td>${r.request_id}</td>
                <td>${r.requester_name}</td>
                <td>${r.subject}</td>
                <td><span class="status-badge status-${r.my_action === 'approved' ? 'approved' : 'rejected'}">${r.my_action}</span></td>
                <td>${new Date(r.acted_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('History load error:', err);
    }
});