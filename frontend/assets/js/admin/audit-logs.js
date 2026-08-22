document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('audit-logs.html');

    try {
        const res = await fetch('/light-hill-payflow/backend/admin/get-audit-logs.php');
        const data = await res.json();

        if (!data.success) return;

        const tbody = document.getElementById('logs-body');
        if (data.logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">No activity logged yet.</td></tr>';
            return;
        }

        tbody.innerHTML = data.logs.map(l => `
            <tr>
                <td>${l.user_name}</td>
                <td>${l.action.replace(/_/g, ' ')}</td>
                <td>${l.description}</td>
                <td>${new Date(l.created_at).toLocaleString()}</td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Audit logs load error:', err);
    }
});