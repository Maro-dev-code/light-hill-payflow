document.addEventListener('DOMContentLoaded', async () => {
    await initDashboardShell('my-requests.html');

    const params = new URLSearchParams(window.location.search);
    const requestId = params.get('id');
    const container = document.getElementById('request-container');

    if (!requestId) {
        container.innerHTML = '<p>No request specified.</p>';
        return;
    }

    loadRequest(requestId, container);
});

async function loadRequest(requestId, container) {
    try {
        const res = await fetch(`/light-hill-payflow/backend/requests/get-request.php?id=${requestId}`);
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = `<p>${data.message}</p>`;
            return;
        }

        const r = data.request;
        const approvals = data.approvals;
        const attachments = data.attachments;
        const payment = data.payment;
        const canCancel = r.status === 'pending_pba';

        container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div>
                        <h2>${r.subject}</h2>
                        <p>${r.request_id}</p>
                    </div>
                    <span class="status-badge status-${r.status}">${r.status.replace('_', ' ')}</span>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Amount</label>
                        <p>₦${Number(r.amount).toLocaleString()}</p>
                    </div>
                    <div class="detail-field">
                        <label>Date Submitted</label>
                        <p>${new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="detail-field">
                    <label>Description</label>
                    <p>${r.description}</p>
                </div>
                ${r.rejection_reason ? `
                <div class="detail-field" style="margin-top: 15px;">
                    <label>Rejection Reason</label>
                    <p>${r.rejection_reason}</p>
                </div>` : ''}
                ${canCancel ? `
                <div style="margin-top: 20px;">
                    <button id="cancel-btn" class="btn-reject" style="padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; background-color: var(--color-danger); color: white; font-weight: 600;">
                        <i class="fa-solid fa-ban"></i> Cancel Request
                    </button>
                </div>` : ''}
            </div>

            ${payment ? `
            <div class="detail-card">
                <h3 class="section-title">Payment Information</h3>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Amount Paid</label>
                        <p>₦${Number(payment.amount_paid).toLocaleString()}</p>
                    </div>
                    <div class="detail-field">
                        <label>Payment Date</label>
                        <p>${new Date(payment.payment_date).toLocaleDateString()}</p>
                    </div>
                    ${payment.payment_reference ? `
                    <div class="detail-field">
                        <label>Reference</label>
                        <p>${payment.payment_reference}</p>
                    </div>` : ''}
                </div>
                <a href="/light-hill-payflow/backend/uploads/payments/${payment.proof_file}" target="_blank" class="attachment-item" style="margin-top: 15px;">
                    <i class="fa-solid fa-file-invoice"></i> View Proof of Payment
                </a>
            </div>` : ''}

            <div class="detail-card">
                <h3 class="section-title">Approval History</h3>
                ${approvals.length === 0 ? '<p>No approval actions yet.</p>' : approvals.map(a => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <p><strong>${a.approver_name}</strong> (${a.role.toUpperCase()}) ${a.action} this request</p>
                            ${a.comment ? `<p>"${a.comment}"</p>` : ''}
                            <span>${new Date(a.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                `).join('')}
            </div>

            <div class="detail-card">
                <h3 class="section-title">Attachments</h3>
                ${attachments.length === 0 ? '<p>No attachments.</p>' : attachments.map(a => `
                    <a href="/light-hill-payflow/backend/uploads/requests/${a.file_path}" target="_blank" class="attachment-item">
                        <i class="fa-solid fa-paperclip"></i> ${a.file_name}
                    </a>
                `).join('')}
            </div>
        `;

        if (canCancel) {
            document.getElementById('cancel-btn').addEventListener('click', () => cancelRequest(requestId, container));
        }

    } catch (err) {
        container.innerHTML = '<p>Failed to load request details.</p>';
    }
}

async function cancelRequest(requestId, container) {
    if (!confirm('Are you sure you want to cancel this request? This cannot be undone.')) return;

    try {
        const res = await fetch('/light-hill-payflow/backend/requests/cancel-request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: requestId })
        });
        const data = await res.json();

        if (data.success) {
            loadRequest(requestId, container);
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Something went wrong.');
    }
}