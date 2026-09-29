let currentFiltered = [];
let allPayments = [];

document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("history.html");

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/payments/get-payment-history.php",
    );
    const data = await res.json();
    if (!data.success) return;

    allPayments = data.payments;
    renderTable(allPayments);
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
    renderTable(allPayments);
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    exportToCSV(currentFiltered);
  });

  function exportToCSV(payments) {
    if (payments.length === 0) {
      alert("No records to export.");
      return;
    }

    const rows = [
      [
        "Requester Name",
        "SBU",
        "Bank Name",
        "Account Number",
        "Account Name",
        "Amount",
        "Description",
      ],
    ];
    let total = 0;

    payments.forEach((p) => {
      rows.push([
        p.requester_name,
        p.sbu || "",
        p.bank_name || "",
        p.account_number || "",
        p.account_name || "",
        p.amount_paid,
        p.description || "",
      ]);
      total += Number(p.amount_paid);
    });

    rows.push([]);
    rows.push(["", "", "", "", "TOTAL:", total, ""]);

    const csvContent = rows
      .map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `payment_history_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }
});

function applyFilters() {
  const search = document.getElementById("filter-search").value.toLowerCase();
  const name = document.getElementById("filter-name").value.toLowerCase();
  const sbu = document.getElementById("filter-sbu").value;
  const from = document.getElementById("filter-from").value;
  const to = document.getElementById("filter-to").value;

  const filtered = allPayments.filter((p) => {
    const matchesSearch = !search || p.subject.toLowerCase().includes(search);
    const matchesName = !name || p.requester_name.toLowerCase().includes(name);
    const matchesSbu = !sbu || p.sbu === sbu;
    const paymentDate = p.payment_date.split(" ")[0];
    const matchesFrom = !from || paymentDate >= from;
    const matchesTo = !to || paymentDate <= to;

    return (
      matchesSearch && matchesName && matchesSbu && matchesFrom && matchesTo
    );
  });

  renderTable(filtered);
}



function renderTable(payments) {
  currentFiltered = payments;
  const tbody = document.getElementById("history-body");

  if (payments.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5">No matching payments found.</td></tr>';
    return;
  }

  tbody.innerHTML = payments
    .map(
      (p) => `
        <tr onclick="window.location.href='payment-details.html?id=${p.id}'">
            <td data-label="Request ID">${p.request_id}</td>
            <td data-label="Requester">${p.requester_name}</td>
            <td data-label="Subject">${p.subject}</td>
            <td data-label="Amount Paid">₦${Number(p.amount_paid).toLocaleString()} <span style="color:var(--color-text-secondary); font-size:11px;">by ${p.accountant_name}</span></td>
            <td data-label="Date">${new Date(p.payment_date).toLocaleDateString()}</td>
        </tr>
    `,
    )
    .join("");
}
