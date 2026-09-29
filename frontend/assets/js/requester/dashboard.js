document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("dashboard.html");

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/requests/get-my-requests.php",
    );
    const data = await res.json();

    if (!data.success) return;

    const requests = data.requests;

    document.getElementById("stat-pending").textContent = requests.filter((r) =>
      r.status.startsWith("pending"),
    ).length;
    document.getElementById("stat-approved").textContent = requests.filter(
      (r) => r.status === "approved",
    ).length;
    document.getElementById("stat-paid").textContent = requests.filter(
      (r) => r.status === "paid",
    ).length;
    document.getElementById("stat-rejected").textContent = requests.filter(
      (r) => r.status === "rejected",
    ).length;

    const tbody = document.getElementById("recent-requests-body");
    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No requests yet.</td></tr>';
      return;
    }

    tbody.innerHTML = requests
      .slice(0, 5)
      .map(
        (r) => `
    <tr>
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
    console.error("Dashboard load error:", err);
  }
});
