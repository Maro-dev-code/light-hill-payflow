document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("users.html");

  try {
    const res = await fetch("/light-hill-payflow/backend/admin/get-users.php");
    const data = await res.json();

    if (!data.success) return;

    const tbody = document.getElementById("users-body");
    if (data.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.users
      .map(
        (u) => `
    <tr onclick="window.location.href='user-details.html?id=${u.id}'">
        <td data-label="Name">${u.name}</td>
        <td data-label="Email">${u.email}</td>
        <td data-label="Role"><span class="role-badge">${u.role}</span></td>
        <td data-label="Status"><span class="status-badge status-${u.account_status}">${u.account_status}</span></td>
        <td data-label="Joined">${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>
`,
      )
      .join("");
  } catch (err) {
    console.error("Users load error:", err);
  }
});
