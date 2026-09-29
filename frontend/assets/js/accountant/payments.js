document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("payments.html");

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/payments/get-approved-requests.php",
    );
    const data = await res.json();

    if (!data.success) return;

    const tbody = document.getElementById("requests-body");
    const requests = data.requests;

    if (requests.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5">No requests awaiting payment.</td></tr>';
      return;
    }

    tbody.innerHTML = requests
      .map(
        (r) => `
    <tr onclick="window.location.href='record-payment.html?id=${r.id}'">
        <td data-label="Request ID">${r.request_id}</td>
        <td data-label="Requester">${r.requester_name}</td>
        <td data-label="Subject">${r.subject}</td>
        <td data-label="Amount">₦${Number(r.amount).toLocaleString()}</td>
        <td data-label="Approved Date">${new Date(r.updated_at).toLocaleDateString()}</td>
    </tr>
`,
      )
      .join("");
  } catch (err) {
    console.error("Payments load error:", err);
  }
});
