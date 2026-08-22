document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector("form");
  const errorBox = document.getElementById("error-message");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    errorBox.classList.add("hidden");
    errorBox.textContent = "";

    try {
      const response = await fetch("../../../backend/auth/login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.redirect;
      } else {
        errorBox.textContent = data.message;
        errorBox.classList.remove("hidden");
      }
    } catch (error) {
      console.error("Login error:", error);
      errorBox.textContent = "Something went wrong. Please try again.";
      errorBox.classList.remove("hidden");
    }
  });
});
