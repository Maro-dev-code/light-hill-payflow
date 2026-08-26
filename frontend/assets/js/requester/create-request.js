document.addEventListener("DOMContentLoaded", async () => {
  await initDashboardShell("create-request.html");

  const form = document.getElementById("request-form");
  const errorBox = document.getElementById("error-message");
  const successBox = document.getElementById("success-message");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");

    const formData = new FormData();
    formData.append("subject", document.getElementById("subject").value);
    formData.append("sbu", document.getElementById("sbu").value);
    formData.append("amount", document.getElementById("amount").value);
    formData.append(
      "description",
      document.getElementById("description").value,
    );
    formData.append("bank_name", document.getElementById("bank-name").value);
    formData.append(
      "account_number",
      document.getElementById("account-number").value,
    );
    formData.append(
      "account_name",
      document.getElementById("account-name").value,
    );

    const files = document.getElementById("attachments").files;
    for (let i = 0; i < files.length; i++) {
      formData.append("attachments[]", files[i]);
    }

    try {
      const res = await fetch(
        "/light-hill-payflow/backend/requests/create-request.php",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();

      if (data.success) {
        successBox.textContent =
          "Request submitted successfully! Redirecting...";
        successBox.classList.remove("hidden");
        setTimeout(() => {
          window.location.href = "my-requests.html";
        }, 1500);
      } else {
        errorBox.textContent = data.message;
        errorBox.classList.remove("hidden");
      }
    } catch (err) {
      errorBox.textContent = "Something went wrong. Please try again.";
      errorBox.classList.remove("hidden");
    }
  });
});
