let currentAction = null;

document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("requests.html");

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("id");
  const container = document.getElementById("request-container");

  if (!requestId) {
    container.innerHTML = "<p>No request specified.</p>";
    return;
  }

  try {
    const res = await fetch(
      `/light-hill-payflow/backend/requests/get-request-approver.php?id=${requestId}`,
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    const r = data.request;
    const approvals = data.approvals;
    const attachments = data.attachments;
    const canAct = data.can_act;

    container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <div>
                        <h2>${r.subject}</h2>
                        <p>${r.request_id} · Submitted by ${r.requester_name}</p>
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
                </div>
                <div class="detail-field">
                    <label>Description</label>
                    <p>${r.description}</p>
                </div>
            </div>

            ${
              canAct
                ? `
            <div class="detail-card">
                <h3 class="section-title">Take Action</h3>
                <div class="action-buttons">
                    <button class="btn-approve" id="approve-btn"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="btn-reject" id="reject-btn"><i class="fa-solid fa-xmark"></i> Reject</button>
                </div>
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
                            <p><strong>${a.approver_name}</strong> (${a.role.toUpperCase()}) ${a.action} this request</p>
                            ${a.comment ? `<p>"${a.comment}"</p>` : ""}
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
        `;

    if (canAct) {
      document
        .getElementById("approve-btn")
        .addEventListener("click", () => openModal("approve", requestId));
      document
        .getElementById("reject-btn")
        .addEventListener("click", () => openModal("reject", requestId));
    }
  } catch (err) {
    container.innerHTML = "<p>Failed to load request details.</p>";
  }
});

function openModal(action, requestId) {
  currentAction = action;
  const isReject = action === "reject";

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "action-modal";
  modal.innerHTML = `
        <div class="modal-box">
            <h3>${isReject ? "Reject" : "Approve"} Request</h3>
            <textarea class="comment-box" id="modal-comment" rows="3" placeholder="${isReject ? "Reason for rejection (required)" : "Optional comment"}"></textarea>
            <div class="modal-actions">
                <button class="btn-cancel-modal" id="modal-cancel">Cancel</button>
                <button class="${isReject ? "btn-reject" : "btn-approve"}" id="modal-confirm">Confirm ${isReject ? "Reject" : "Approve"}</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  document
    .getElementById("modal-cancel")
    .addEventListener("click", () => modal.remove());
  document
    .getElementById("modal-confirm")
    .addEventListener("click", () => submitAction(action, requestId, modal));
}

async function submitAction(action, requestId, modal) {
  const comment = document.getElementById("modal-comment").value.trim();

  if (action === "reject" && !comment) {
    alert("A reason is required to reject a request.");
    return;
  }

  const endpoint =
    action === "approve" ? "approve-request.php" : "reject-request.php";

  try {
    const res = await fetch(
      `/light-hill-payflow/backend/approvals/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, comment }),
      },
    );
    const data = await res.json();

    if (data.success) {
      window.location.href = "requests.html";
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Something went wrong. Please try again.");
  } finally {
    modal.remove();
  }
}
