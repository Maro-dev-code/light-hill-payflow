document.addEventListener("DOMContentLoaded", async () => {
  const session = await initDashboardShell("dashboard.html");

  const roleLabels = {
    pba: "PBA Dashboard",
    cfo: "CFO Dashboard",
    coo: "COO Dashboard",
  };
  document.getElementById("page-title").textContent =
    roleLabels[session.role] || "Dashboard";

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/approvals/get-pending-requests.php",
    );
    const data = await res.json();

    if (!data.success) return;

    const requests = data.requests;
    document.getElementById("stat-pending").textContent = requests.length;

    const tbody = document.getElementById("requests-body");
    if (requests.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No pending requests.</td></tr>';
      return;
    }

    tbody.innerHTML = requests
      .slice(0, 5)
      .map(
        (r) => `
            <tr onclick="window.location.href='request-details.html?id=${r.id}'">
                <td>${r.request_id}</td>
                <td>${r.requester_name}</td>
                <td>${r.subject}</td>
                <td>₦${Number(r.amount).toLocaleString()}</td>
                <td>${new Date(r.created_at).toLocaleDateString()}</td>
            </tr>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
});
