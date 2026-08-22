document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("users.html");

  const params = new URLSearchParams(window.location.search);
  const userId = params.get("id");
  const container = document.getElementById("user-container");

  if (!userId) {
    container.innerHTML = "<p>No user specified.</p>";
    return;
  }

  loadUser(userId, container);
});

async function loadUser(userId, container) {
  try {
    const res = await fetch(
      `/light-hill-payflow/backend/admin/get-user.php?id=${userId}`,
    );
    const data = await res.json();

    if (!data.success) {
      container.innerHTML = `<p>${data.message}</p>`;
      return;
    }

    const u = data.user;
    const isActive = u.account_status === "active";

    container.innerHTML = `
            <div class="detail-card">
                <div class="detail-header">
                    <h2>${u.name}</h2>
                    <span class="status-badge status-${u.account_status}">${u.account_status}</span>
                </div>
                <div class="detail-grid">
                    <div class="detail-field">
                        <label>Email</label>
                        <p>${u.email}</p>
                    </div>
                    <div class="detail-field">
                        <label>Phone</label>
                        <p>${u.phone}</p>
                    </div>
                    <div class="detail-field">
                        <label>Position</label>
                        <p>${u.position}</p>
                    </div>
                    <div class="detail-field">
                        <label>Role</label>
                        <p>${u.role.toUpperCase()}</p>
                    </div>
                    <div class="detail-field">
                        <label>Email Verified</label>
                        <p>${u.email_verified ? "Yes" : "No"}</p>
                    </div>
                    <div class="detail-field">
                        <label>Joined</label>
                        <p>${new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="action-buttons">
                    ${
                      isActive
                        ? `<button class="btn-deactivate" onclick="toggleStatus(${u.id}, 'deactivate')">Deactivate Account</button>`
                        : u.account_status === "deactivated"
                          ? `<button class="btn-reactivate" onclick="toggleStatus(${u.id}, 'activate')">Reactivate Account</button>`
                          : ""
                    }
                </div>
            </div>
        `;
  } catch (err) {
    container.innerHTML = "<p>Failed to load user.</p>";
  }
}

async function toggleStatus(userId, action) {
  const confirmMsg =
    action === "deactivate"
      ? "Are you sure you want to deactivate this account?"
      : "Reactivate this account?";
  if (!confirm(confirmMsg)) return;

  try {
    const res = await fetch(
      "/light-hill-payflow/backend/admin/deactivate-user.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, action }),
      },
    );
    const data = await res.json();

    if (data.success) {
      location.reload();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Something went wrong.");
  }
}
