document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("my-requests.html");

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/requests/get-my-requests.php",
    );
    const data = await res.json();

    if (!data.success) return;

    const tbody = document.getElementById("requests-body");
    const requests = data.requests;

    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No requests yet.</td></tr>';
      return;
    }

    tbody.innerHTML = requests
      .map(
        (r) => `
    <tr onclick="window.location.href='request-details.html?id=${r.id}'">
        <td data-label="Request ID">${r.request_id}</td>
        <td data-label="Subject">${r.subject}</td>
        <td data-label="Amount">₦${Number(r.amount).toLocaleString()}</td>
        <td data-label="Status"><span class="status-badge status-${r.status}">${r.status.replace("_", " ")}</span></td>
        <td data-label="Date">${new Date(r.created_at).toLocaleDateString()}</td>
    </tr>
`,
      )
      .join("");
  } catch (err) {
    console.error("My Requests load error:", err);
  }
});
