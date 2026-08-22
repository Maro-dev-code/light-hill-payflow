document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  const inputs = document.querySelectorAll(".otp-input");

  inputs.forEach((input, i) => {
    input.addEventListener("input", () => {
      if (input.value && i < inputs.length - 1) inputs[i + 1].focus();
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = Array.from(inputs)
      .map((i) => i.value)
      .join("");

    const res = await fetch("../../../backend/auth/verify-email.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const data = await res.json();

    if (data.success) {
      window.location.href = "login.html";
    } else {
      alert(data.message);
    }
  });
});

const inputs = document.querySelectorAll(".otp-input");

inputs.forEach((input, index) => {

    input.addEventListener("input", () => {

        // Only allow numbers
        input.value = input.value.replace(/[^0-9]/g, "");

        // Move to next box
        if (input.value && index < inputs.length - 1) {
            inputs[index + 1].focus();
        }

    });

    input.addEventListener("keydown", (e) => {

        // Go back when pressing Backspace
        if (
            e.key === "Backspace" &&
            !input.value &&
            index > 0
        ) {
            inputs[index - 1].focus();
        }

    });

});
