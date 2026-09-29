document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("dashboard.html");

  try {
    const pendingRes = await fetch(
      "/light-hill-payflow/backend/admin/get-pending-accounts.php",
    );
    const pendingData = await pendingRes.json();

    if (pendingData.success) {
      document.getElementById("stat-pending").textContent =
        pendingData.accounts.length;

      const tbody = document.getElementById("pending-body");
      if (pendingData.accounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No pending accounts.</td></tr>';
      } else {
        tbody.innerHTML = pendingData.accounts
          .slice(0, 5)
          .map(
            (u) => `
    <tr onclick="window.location.href='user-details.html?id=${u.id}'">
        <td data-label="Name">${u.name}</td>
        <td data-label="Email">${u.email}</td>
        <td data-label="Position">${u.position}</td>
        <td data-label="Registered">${new Date(u.created_at).toLocaleDateString()}</td>
    </tr>
`,
          )
          .join("");
      }
    }

    const usersRes = await fetch(
      "/light-hill-payflow/backend/admin/get-users.php",
    );
    const usersData = await usersRes.json();
    if (usersData.success) {
      document.getElementById("stat-total-users").textContent =
        usersData.users.length;
    }
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
});
