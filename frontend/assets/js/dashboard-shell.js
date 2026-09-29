const ROLE_NAV = {
  requester: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    { label: "New Request", icon: "fa-plus", href: "create-request.html" },
    { label: "My Requests", icon: "fa-list", href: "my-requests.html" },
  ],
  pba: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    { label: "Pending Requests", icon: "fa-list-check", href: "requests.html" },
    { label: "History", icon: "fa-clock-rotate-left", href: "history.html" },
  ],
  cfo: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    { label: "Pending Requests", icon: "fa-list-check", href: "requests.html" },
    { label: "History", icon: "fa-clock-rotate-left", href: "history.html" },
  ],
  coo: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    { label: "Pending Requests", icon: "fa-list-check", href: "requests.html" },
    { label: "History", icon: "fa-clock-rotate-left", href: "history.html" },
  ],
  accountant: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    {
      label: "Approved Requests",
      icon: "fa-money-bill-wave",
      href: "payments.html",
    },
    { label: "History", icon: "fa-clock-rotate-left", href: "history.html" },
  ],
  admin: [
    { label: "Dashboard", icon: "fa-house", href: "dashboard.html" },
    {
      label: "Pending Accounts",
      icon: "fa-user-clock",
      href: "pending-accounts.html",
    },
    { label: "All Users", icon: "fa-users", href: "users.html" },
    {
      label: "Create Account",
      icon: "fa-user-plus",
      href: "create-privileged-account.html",
    },
    { label: "Audit Logs", icon: "fa-shield-halved", href: "audit-logs.html" },
  ],
};

async function initDashboardShell(activePage) {
  let session;
  try {
    const res = await fetch(
      "/light-hill-payflow/backend/includes/session-check.php",
    );
    session = await res.json();
  } catch (err) {
    window.location.href = getLoginPath();
    return;
  }

  if (!session.authenticated) {
    window.location.href = getLoginPath();
    return;
  }

  document.getElementById("user-name").textContent = session.name;
  injectNotificationBell();
  injectMobileDrawer();
  loadNotifications();

  const navLinks = ROLE_NAV[session.role] || [];
  const navContainer = document.getElementById("sidebar-nav");
  navContainer.innerHTML = navLinks
    .map(
      (link) => `
        <a href="${link.href}" class="${link.href === activePage ? "active" : ""}">
            <i class="fa-solid ${link.icon}"></i> ${link.label}
        </a>
    `,
    )
    .join("");

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch("/light-hill-payflow/backend/auth/logout.php");
    window.location.href = getLoginPath();
  });

  return session;
}

function getLoginPath() {
  return "/light-hill-payflow/frontend/pages/auth/login.html";
}

function injectNotificationBell() {
  const topbarUser = document.querySelector(".topbar-user");
  if (!topbarUser || document.getElementById("notif-bell")) return;

  const bellHTML = `
        <div class="topbar-notif" id="notif-bell">
            <i class="fa-solid fa-bell"></i>
            <span class="notif-badge hidden" id="notif-badge">0</span>
            <div class="notif-dropdown" id="notif-dropdown"></div>
        </div>
    `;
  topbarUser.insertAdjacentHTML("afterbegin", bellHTML);

  document.getElementById("notif-bell").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("notif-dropdown").classList.toggle("open");
  });

  document.addEventListener("click", () => {
    document.getElementById("notif-dropdown")?.classList.remove("open");
  });
}

async function loadNotifications() {
  try {
    const res = await fetch(
      "/light-hill-payflow/backend/notifications/get-notifications.php",
    );
    const data = await res.json();
    if (!data.success) return;

    const badge = document.getElementById("notif-badge");
    const dropdown = document.getElementById("notif-dropdown");
    const unreadCount = data.notifications.filter((n) => !n.is_read).length;

    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.classList.remove("hidden");
    } else {
      badge.classList.add("hidden");
    }

    if (data.notifications.length === 0) {
      dropdown.innerHTML =
        '<div class="notif-empty">No notifications yet.</div>';
      return;
    }

    dropdown.innerHTML = data.notifications
      .map(
        (n) => `
            <div class="notif-item ${n.is_read ? "" : "unread"}" onclick="markNotifRead(${n.id})">
                <p>${n.title}</p>
                <span>${new Date(n.created_at).toLocaleString()}</span>
            </div>
        `,
      )
      .join("");
  } catch (err) {
    console.error("Notifications load error:", err);
  }
}

async function markNotifRead(id) {
  try {
    await fetch("/light-hill-payflow/backend/notifications/mark-as-read.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadNotifications();
  } catch (err) {
    console.error("Mark read error:", err);
  }
}

function injectMobileDrawer() {
  const topbar = document.querySelector(".topbar");
  const sidebar = document.querySelector(".sidebar");
  if (!topbar || !sidebar || document.getElementById("hamburger-btn")) return;

  const hamburgerHTML = `<button class="hamburger-btn" id="hamburger-btn"><i class="fa-solid fa-bars"></i></button>`;
  topbar.insertAdjacentHTML("afterbegin", hamburgerHTML);

  const backdrop = document.createElement("div");
  backdrop.className = "sidebar-backdrop";
  backdrop.id = "sidebar-backdrop";
  document.body.appendChild(backdrop);

  document.getElementById("hamburger-btn").addEventListener("click", () => {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
  });

  backdrop.addEventListener("click", () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
  });

  sidebar.querySelectorAll(".sidebar-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      sidebar.classList.remove("open");
      backdrop.classList.remove("open");
    });
  });
}
