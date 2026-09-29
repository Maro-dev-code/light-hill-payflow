document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("my-requests.html");

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("id");
  const container = document.getElementById("request-container");

  if (!requestId) {
    container.innerHTML = "<p>No request specified.</p>";
    return;
  }

  loadRequest(requestId, container);
});

async function loadRequest(requestId, container) {
  try {
    const res = await fetch(
      `/light-hill-payflow/backend/requests/get-request.php?id=${requestId}`,
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    const r = data.request;
    const approvals = data.approvals;
    const attachments = data.attachments;
    const payment = data.payment;
    const proofOfUsage = data.proof_of_usage;
    const canCancel = r.status === "pending_pba";

    container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div>
                        <h2>${r.subject}</h2>
                        <p>${r.request_id}</p>
                    </div>
                    <span class="status-badge status-${r.status}">${r.status.replace("_", " ")}</span>
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
    <div class="detail-field">
        <label>SBU</label>
        <p>${r.sbu || "—"}</p>
    </div>
    <div class="detail-field">
        <label>Bank Details</label>
        <p>${r.bank_name || "—"} · ${r.account_number || "—"} · ${r.account_name || "—"}</p>
    </div>
</div>
                <div class="detail-field">
                    <label>Description</label>
                    <p>${r.description}</p>
                </div>
                ${
                  r.rejection_reason
                    ? `
                <div class="detail-field" style="margin-top: 15px;">
                    <label>Rejection Reason</label>
                    <p>${r.rejection_reason}</p>
                </div>`
                    : ""
                }
                ${
                  canCancel
                    ? `
                <div style="margin-top: 20px;">
                    <button id="cancel-btn" class="btn-reject" style="padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; background-color: var(--color-danger); color: white; font-weight: 600;">
                        <i class="fa-solid fa-ban"></i> Cancel Request
                    </button>
                </div>`
                    : ""
                }
            </div>

            ${
              payment
                ? `
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
                    ${
                      payment.payment_reference
                        ? `
                    <div class="detail-field">
                        <label>Reference</label>
                        <p>${payment.payment_reference}</p>
                    </div>`
                        : ""
                    }
                </div>
                <a href="/light-hill-payflow/backend/uploads/payments/${payment.proof_file}" target="_blank" class="attachment-item" style="margin-top: 15px;">
                    <i class="fa-solid fa-file-invoice"></i> View Proof of Payment
                </a>
            </div>`
                : ""
            }

            <div class="detail-card">
                <h3 class="section-title">Approval History</h3>
                ${
                  approvals.length === 0
                    ? "<p>No approval actions yet.</p>"
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
              r.status === "paid"
                ? `
<div class="detail-card">
    <h3 class="section-title">Proof of Usage</h3>
    <div id="proof-error" class="error-message hidden" style="margin-bottom: 15px;"></div>
    <form id="proof-form" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9;">
        <label style="font-size: 13px; font-weight: 600; color: var(--color-text-primary); display: block; margin-bottom: 6px;">Upload Document</label>
        <input type="file" id="proof-file" required style="margin-bottom: 12px; display: block;">
        <label style="font-size: 13px; font-weight: 600; color: var(--color-text-primary); display: block; margin-bottom: 6px;">Comment</label>
        <textarea id="proof-comment" rows="2" placeholder="Explain what this document shows..." required style="width: 100%; padding: 8px; border: 1px solid #64748b5e; border-radius: 5px; font-family: var(--font-family); font-size: 13px; margin-bottom: 12px;"></textarea>
        <button type="submit" style="padding: 8px 16px; border-radius: 6px; border: none; background-color: var(--color-accent); color: white; font-weight: 600; cursor: pointer; font-size: 13px;">Submit Proof</button>
    </form>
    <div id="proof-list">
        ${
          proofOfUsage.length === 0
            ? "<p>No proof of usage submitted yet.</p>"
            : proofOfUsage
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
                .join("")
        }
    </div>
</div>`
                : ""
            }
        `;

    if (canCancel) {
      document
        .getElementById("cancel-btn")
        .addEventListener("click", () => cancelRequest(requestId, container));
    }
    async function submitProof(e, requestId, container) {
      e.preventDefault();

      const errorBox = document.getElementById("proof-error");
      errorBox.classList.add("hidden");

      const fileInput = document.getElementById("proof-file");
      const comment = document.getElementById("proof-comment").value;
      const submitBtn = e.target.querySelector('button[type="submit"]');

      if (!fileInput.files[0]) {
        errorBox.textContent = "Please select a file.";
        errorBox.classList.remove("hidden");
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading...";

      const formData = new FormData();
      formData.append("request_id", requestId);
      formData.append("comment", comment);
      formData.append("document", fileInput.files[0]);

      try {
        const res = await fetch(
          "/light-hill-payflow/backend/requests/submit-proof.php",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();

        if (data.success) {
          loadRequest(requestId, container);
        } else {
          errorBox.textContent = data.message;
          errorBox.classList.remove("hidden");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Proof";
        }
      } catch (err) {
        errorBox.textContent = "Something went wrong. Please try again.";
        errorBox.classList.remove("hidden");
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Proof";
      }
    }
    if (r.status === "paid") {
      document
        .getElementById("proof-form")
        .addEventListener("submit", (e) =>
          submitProof(e, requestId, container),
        );
    }
  } catch (err) {
    container.innerHTML = "<p>Failed to load request details.</p>";
  }
}

async function cancelRequest(requestId, container) {
  if (
    !confirm(
      "Are you sure you want to cancel this request? This cannot be undone.",
    )
  )
    return;

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/requests/cancel-request.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId }),
      },
    );
    const data = await res.json();

    if (data.success) {
      loadRequest(requestId, container);
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Something went wrong.");
  }
}
