document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("payments.html");

  const params = new URLSearchParams(window.location.search);
  const requestId = params.get("id");
  const summaryBox = document.getElementById("request-summary");
  const form = document.getElementById("payment-form");
  const errorBox = document.getElementById("error-message");
  const successBox = document.getElementById("success-message");

  if (!requestId) {
    summaryBox.innerHTML = "<p>No request specified.</p>";
    return;
  }

  let requestData = null;

  try {
    const res = await fetch(
      `/light-hill-payflow/backend/requests/get-request-approver.php?id=${requestId}`,
    );
    const data = await res.json();

    if (!data.success) {
      summaryBox.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    requestData = data.request;

    if (requestData.status !== "approved") {
      summaryBox.innerHTML = `<p>This request is not ready for payment (current status: ${requestData.status}).</p>`;
      form.style.display = "none";
      return;
    }

    const attachmentsHTML =
      data.attachments && data.attachments.length > 0
        ? data.attachments
            .map(
              (a) => `
        <a href="/light-hill-payflow/backend/uploads/requests/${a.file_path}" target="_blank" class="attachment-item" style="margin-top:8px;">
            <i class="fa-solid fa-paperclip"></i> ${a.file_name}
        </a>
    `,
            )
            .join("")
        : '<p style="font-size:13px; color:var(--color-text-secondary);">No attachments.</p>';

    summaryBox.innerHTML = `
    <h2>${requestData.subject}</h2>
    <p>${requestData.request_id} · Requested by ${requestData.requester_name}</p>
    <p class="amount">₦${Number(requestData.amount).toLocaleString()}</p>
    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #e2e8f0; font-size:13px; color:var(--color-text-secondary);">
        <p><strong>SBU:</strong> ${requestData.sbu || "—"}</p>
        <p><strong>Bank:</strong> ${requestData.bank_name || "—"}</p>
        <p><strong>Account Number:</strong> ${requestData.account_number || "—"}</p>
        <p><strong>Account Name:</strong> ${requestData.account_name || "—"}</p>
    </div>
    <div style="margin-top:15px; padding-top:15px; border-top:1px solid #e2e8f0;">
        <p style="font-size:13px; font-weight:600; color:var(--color-text-primary); margin-bottom:8px;">Attachments</p>
        ${attachmentsHTML}
    </div>
`;

    document.getElementById("amount-paid").value = requestData.amount;
  } catch (err) {
    summaryBox.innerHTML = "<p>Failed to load request.</p>";
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Processing...";

    const formData = new FormData();
    formData.append("request_id", requestId);
    formData.append(
      "amount_paid",
      document.getElementById("amount-paid").value,
    );
    formData.append(
      "payment_date",
      document.getElementById("payment-date").value,
    );
    formData.append(
      "payment_reference",
      document.getElementById("payment-reference").value,
    );
    formData.append(
      "proof_file",
      document.getElementById("proof-file").files[0],
    );

    try {
      const res = await fetch(
        "/light-hill-payflow/backend/payments/record-payment.php",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();

      if (data.success) {
        successBox.textContent =
          "Payment recorded successfully! Redirecting...";
        successBox.classList.remove("hidden");
        setTimeout(() => {
          window.location.href = "payments.html";
        }, 1500);
      } else {
        errorBox.textContent = data.message;
        errorBox.classList.remove("hidden");
      }
    } catch (err) {
      errorBox.textContent = "Something went wrong. Please try again.";
      errorBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Confirm Payment";
    }
  });
});
