let allHistory = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("history.html");

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/approvals/get-history.php",
    );
    const data = await res.json();
    if (!data.success) return;

    allHistory = data.requests;
    renderTable(allHistory);
  } catch (err) {
    console.error("History load error:", err);
  }

  document
    .getElementById("filter-search")
    .addEventListener("input", applyFilters);
  document
    .getElementById("filter-name")
    .addEventListener("input", applyFilters);
  document
    .getElementById("filter-sbu")
    .addEventListener("change", applyFilters);
  document
    .getElementById("filter-from")
    .addEventListener("change", applyFilters);
  document.getElementById("filter-to").addEventListener("change", applyFilters);

  document.getElementById("filter-clear").addEventListener("click", () => {
    document.getElementById("filter-search").value = "";
    document.getElementById("filter-name").value = "";
    document.getElementById("filter-sbu").value = "";
    document.getElementById("filter-from").value = "";
    document.getElementById("filter-to").value = "";
    renderTable(allHistory);
  });
});

function applyFilters() {
  const search = document.getElementById("filter-search").value.toLowerCase();
  const name = document.getElementById("filter-name").value.toLowerCase();
  const sbu = document.getElementById("filter-sbu").value;
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;

  const filtered = allHistory.filter((r) => {
    const matchesSearch = !search || r.subject.toLowerCase().includes(search);
    const matchesName = !name || r.requester_name.toLowerCase().includes(name);
    const matchesSbu = !sbu || r.sbu === sbu;
    const actedDate = r.acted_at.split(" ")[0];
    const matchesFrom = !from || actedDate >= from;
    const matchesTo = !to || actedDate <= to;

    return (
      matchesSearch && matchesName && matchesSbu && matchesFrom && matchesTo
    );
  });

  renderTable(filtered);
}

function renderTable(requests) {
  const tbody = document.getElementById("history-body");

  if (requests.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5">No matching requests found.</td></tr>';
    return;
  }

  tbody.innerHTML = requests
    .map(
      (r) => `
        <tr onclick="window.location.href='request-details.html?id=${r.id}'">
            <td data-label="Request ID">${r.request_id}</td>
            <td data-label="Requester">${r.requester_name}</td>
            <td data-label="Subject">${r.subject}</td>
            <td data-label="Action">${r.approver_name} — <span class="status-badge status-${r.my_action === "approved" ? "approved" : "rejected"}">${r.my_action}</span></td>
            <td data-label="Date">${new Date(r.acted_at).toLocaleDateString()}</td>
        </tr>
    `,
    )
    .join("");
}
