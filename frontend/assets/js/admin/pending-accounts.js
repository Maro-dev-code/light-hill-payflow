document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("pending-accounts.html");
  loadPending();
});

async function loadPending() {
  const tbody = document.getElementById("pending-body");
  try {
    const res = await fetch(
      "/light-hill-payflow/backend/admin/get-pending-accounts.php",
    );
    const data = await res.json();

    if (!data.success) return;

    if (data.accounts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No pending accounts.</td></tr>';
      return;
    }

    tbody.innerHTML = data.accounts
      .map(
        (u) => `
    <tr>
        <td data-label="Name">${u.name}</td>
        <td data-label="Email">${u.email}</td>
        <td data-label="Position">${u.position}</td>
        <td data-label="Registered">${new Date(u.created_at).toLocaleDateString()}</td>
        <td data-label="Actions" onclick="event.stopPropagation()">
            <button class="btn-approve-sm" onclick="handleAction(${u.id}, 'approve')">Approve</button>
            <button class="btn-reject-sm" onclick="handleAction(${u.id}, 'reject')">Reject</button>
        </td>
    </tr>
`,
      )
      .join("");
  } catch (err) {
    console.error("Pending accounts load error:", err);
  }
}

async function handleAction(userId, action) {
  if (
    action === "reject" &&
    !confirm("Are you sure you want to reject this account?")
  )
    return;

  const endpoint =
    action === "approve" ? "approve-account.php" : "reject-account.php";

  try {
    const res = await fetch(`/light-hill-payflow/backend/admin/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    const data = await res.json();

    if (data.success) {
      loadPending();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Something went wrong.");
  }
}
