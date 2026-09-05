/**
 * HireSphere Employee Registration
 */

import { registerEmployee } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("employeeRegisterForm");

  if (!form) {
    return;
  }

  const message = document.getElementById("registerMessage");

  const passwordInput =
    document.getElementById("password");

  const confirmPasswordInput =
    document.getElementById("confirmPassword");

  const passwordToggle =
    document.getElementById("passwordToggle");

  const confirmPasswordToggle =
    document.getElementById(
      "confirmPasswordToggle"
    );

  function showMessage(text, type = "error") {
    if (!message) {
      return;
    }

    message.textContent = text;
    message.className = `auth-message ${type} is-visible`;
  }

  function clearMessage() {
    if (!message) {
      return;
    }

    message.textContent = "";
    message.className = "auth-message";
  }

  function togglePassword(input, button) {
    if (!input || !button) {
      return;
    }

    const isPassword =
      input.type === "password";

    input.type = isPassword
      ? "text"
      : "password";

    button.setAttribute(
      "aria-label",
      isPassword
        ? "Hide password"
        : "Show password"
    );
  }

  passwordToggle?.addEventListener("click", () => {
    togglePassword(
      passwordInput,
      passwordToggle
    );
  });

  confirmPasswordToggle?.addEventListener("click", () => {
    togglePassword(
      confirmPasswordInput,
      confirmPasswordToggle
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    clearMessage();

    const formData = new FormData(form);

    const name =
      formData.get("name")?.toString().trim();

    const email =
      formData.get("email")?.toString().trim();

    const password =
      formData.get("password")?.toString();

    const confirmPassword =
      formData.get("confirmPassword")?.toString();

    const phone =
      formData.get("phone")?.toString().trim();

    const location =
      formData.get("location")?.toString().trim();

    if (!name || !email || !password || !confirmPassword) {
      showMessage(
        "Please fill in all required fields."
      );
      return;
    }

    if (password !== confirmPassword) {
      showMessage(
        "Passwords do not match."
      );
      return;
    }

    const submitButton =
      form.querySelector("[type='submit']");

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Creating account...";
    }

    try {
      await registerEmployee({
        name,
        email,
        password,
        phone,
        location
      });

      showMessage(
        "Account created successfully. Redirecting to login...",
        "success"
      );

      form.reset();

      setTimeout(() => {
        window.location.href =
          "./employee-login.html";
      }, 900);

    } catch (error) {
      showMessage(
        error?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Create Account";
      }
    }
  });
});
