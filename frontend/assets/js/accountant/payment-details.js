document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("history.html");

  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("id");
  const container = document.getElementById("payment-container");

  if (!paymentId) {
    container.innerHTML = "<p>No payment specified.</p>";
    return;
  }

  try {
    const res = await fetch(
      `/light-hill-payflow/backend/payments/get-payment.php?id=${paymentId}`,
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    const p = data.payment;
    const approvals = data.approvals;
    const attachments = data.attachments;

    container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div>
                        <h2>${p.subject}</h2>
<p>${p.display_request_id} · Paid to ${p.requester_name}</p>                    </div>
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
                        <p>${p.payment_reference || "—"}</p>
                    </div>
                    <div class="detail-field">
                        <label>Recorded By</label>
                        <p>${p.accountant_name}</p>
                    </div>
                    <div class="detail-field">
                        <label>SBU</label>
                        <p>${p.sbu || "—"}</p>
                    </div>
                    <div class="detail-field">
                        <label>Bank Details</label>
                        <p>${p.bank_name || "—"} · ${p.account_number || "—"} · ${p.account_name || "—"}</p>
                    </div>
                </div>
                <div class="detail-field" style="margin-top: 15px;">
                    <label>Description</label>
                    <p>${p.description}</p>
                </div>
                <a href="/light-hill-payflow/backend/uploads/payments/${p.proof_file}" target="_blank" class="attachment-item" style="margin-top: 15px;">
                    <i class="fa-solid fa-file-invoice"></i> View Proof of Payment
                </a>
            </div>

            <div class="detail-card">
                <h3 class="section-title">Approval History</h3>
                ${
                  approvals.length === 0
                    ? "<p>No approval actions recorded.</p>"
                    : approvals
                        .map(
                          (a) => `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <p><strong>${a.approver_name}</strong> (${a.role.toUpperCase()}) <span style="color: ${a.action === "rejected" ? "var(--color-danger)" : "var(--color-success)"}; font-weight: 600;">${a.action}</span> this request</p>                            ${a.comment ? `<p>"${a.comment}"</p>` : ""}
                            <span>${new Date(a.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                `,
                        )
                        .join("")
                }
            </div>

            <div class="detail-card">
                <h3 class="section-title">Attachments</h3>
                ${
                  attachments.length === 0
                    ? "<p>No attachments.</p>"
                    : attachments
                        .map(
                          (a) => `
                    <a href="/light-hill-payflow/backend/uploads/requests/${a.file_path}" target="_blank" class="attachment-item">
                        <i class="fa-solid fa-paperclip"></i> ${a.file_name}
                    </a>
                `,
                        )
                        .join("")
                }
            </div>

            ${
              data.proof_of_usage && data.proof_of_usage.length > 0
                ? `
<div class="detail-card">
    <h3 class="section-title">Proof of Usage</h3>
    ${data.proof_of_usage
      .map(
        (p) => `
        <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <p><strong>${p.uploader_name}</strong> submitted: "${p.comment}"</p>
                <a href="/light-hill-payflow/backend/uploads/proof-of-usage/${p.file_path}" target="_blank" class="attachment-item" style="margin-top: 6px;">
                    <i class="fa-solid fa-file"></i> ${p.file_name}
                </a>
                <span>${new Date(p.created_at).toLocaleString()}</span>
            </div>
        </div>
    `,
      )
      .join("")}
</div>`
                : ""
            }
        `;
  } catch (err) {
    container.innerHTML = "<p>Failed to load payment details.</p>";
  }
});
